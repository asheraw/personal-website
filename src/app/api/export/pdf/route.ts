import { NextResponse } from "next/server";
import { writeClient } from "@/sanity/lib/write-client";
import { POST_EXPORT_BY_ID_QUERY, ALL_POSTS_EXPORT_QUERY } from "@/sanity/lib/queries";
import { buildPdfBuffer } from "@/lib/exportPdf";
import type { ExportPost } from "@/lib/exportMarkdown";

// pdfkit needs Node's Buffer/stream internals -- won't run in the Edge
// runtime, and can't run directly in the Studio browser bundle at all
// (see exportPdf.ts). This route is the one place PDF generation actually
// happens; the Studio UI just POSTs here and downloads the response,
// the same "needs real server-side work" pattern already established by
// /api/check-links.
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const postId = typeof body?.postId === "string" ? body.postId : undefined;
    const all = body?.all === true;

    if (!postId && !all) {
      return NextResponse.json({ error: "Provide either postId or all: true" }, { status: 400 });
    }

    if (postId) {
      // {perspective: 'raw'} so this can also run on an unpublished draft,
      // same requirement as the per-post Markdown export action.
      const post = await writeClient.fetch<ExportPost | null>(
        POST_EXPORT_BY_ID_QUERY,
        { id: postId },
        { perspective: "raw" },
      );
      if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
      const pdf = await buildPdfBuffer([post]);
      return new NextResponse(new Uint8Array(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${post.slug}.pdf"`,
        },
      });
    }

    // Full archive -- published posts only, same as the other bulk export
    // formats: an archive meant to leave the building shouldn't include
    // work still mid-draft.
    const posts = await writeClient.fetch<ExportPost[]>(ALL_POSTS_EXPORT_QUERY);
    const pdf = await buildPdfBuffer(posts);
    const date = new Date().toISOString().slice(0, 10);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="asheraw-blog-export-${date}.pdf"`,
      },
    });
  } catch (error) {
    console.error("[export/pdf] failed:", error);
    return NextResponse.json({ error: "PDF export failed" }, { status: 500 });
  }
}
