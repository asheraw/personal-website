// Client-side (browser) image compression, run automatically in the Media
// library's upload and replace flows -- the same squeeze tinypng.com or
// imagecompressor.com do, just done in-browser at upload time instead of as
// a separate manual step. Only needs to shrink the ORIGINAL file that ends
// up in storage and has to be uploaded: nothing on the live site ever
// displays an image wider than 2400px (portableTextComponents.tsx's
// lightbox `fullSrc`, the widest `urlFor(...).width()` call anywhere) since
// Sanity's own image CDN already resizes and re-compresses on every
// request for what's actually served (src/sanity/lib/image.ts) -- so this
// doesn't need to match any specific display size, just stop uploading
// (and storing) originals far bigger than anything that will ever be shown.

export type CompressResult = {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressed: boolean;
};

const MAX_DIMENSION = 2560;
const JPEG_QUALITY = 0.85;
// Below this a photo is already small enough that re-encoding risks
// costing more in visible quality than it saves in bytes -- skip it.
// Exported so MediaLibraryTool's one-time "Compress existing photos" scan
// can pre-filter by Sanity's already-known asset size before downloading
// anything, rather than fetching a photo's bytes just to find out it was
// always going to be skipped.
export const MIN_SIZE_TO_COMPRESS = 300 * 1024;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't read image"));
    };
    img.src = url;
  });
}

function hasRealAlpha(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  const {data} = ctx.getImageData(0, 0, width, height);
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) return true;
  }
  return false;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function compressImageFile(file: File): Promise<CompressResult> {
  const skip = (): CompressResult => ({file, originalSize: file.size, compressedSize: file.size, compressed: false});

  // Animated GIFs would get flattened to a single frame by canvas, and SVGs
  // are vector (rasterizing one defeats the point) -- neither is safe to
  // touch here, so only JPEG/PNG/WebP are ever considered.
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return skip();
  if (file.size < MIN_SIZE_TO_COMPRESS) return skip();

  let img: HTMLImageElement;
  try {
    img = await loadImage(file);
  } catch {
    return skip();
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.round(img.naturalWidth * scale);
  const height = Math.round(img.naturalHeight * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return skip();
  ctx.drawImage(img, 0, 0, width, height);

  // A PNG genuinely using transparency has to stay lossless-shaped --
  // re-encoding it as JPEG would visibly flatten it onto a solid
  // background. Everything else (JPEG/WebP sources, or a PNG that turns
  // out to have no real transparency, e.g. a flattened screenshot) is safe
  // to re-encode as JPEG, which is where the actual size win comes from.
  const outputType = file.type === 'image/png' && hasRealAlpha(ctx, width, height) ? 'image/png' : 'image/jpeg';
  const blob = await canvasToBlob(canvas, outputType, outputType === 'image/jpeg' ? JPEG_QUALITY : undefined);
  if (!blob || blob.size >= file.size) return skip();

  const ext = outputType === 'image/jpeg' ? 'jpg' : 'png';
  const newName = file.name.replace(/\.[^.]+$/, '') + '.' + ext;
  const compressedFile = new File([blob], newName, {type: outputType});
  return {file: compressedFile, originalSize: file.size, compressedSize: blob.size, compressed: true};
}
