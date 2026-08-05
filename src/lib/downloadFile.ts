// Shared by every export entry point (the per-post "Export…" document
// action and the bulk Export tool) -- the browser download idiom is the
// same regardless of which format actually produced the blob.
export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadTextFile(filename: string, content: string, mimeType: string) {
  downloadBlob(filename, new Blob([content], { type: `${mimeType};charset=utf-8` }));
}
