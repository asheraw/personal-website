import { NextRequest } from "next/server";
import { getLinkPreview } from "@/lib/linkPreview";

// The link is carried in the PATH (base64url), not a ?url= query string:
// Netlify's CDN cache ignores unknown query strings, so with ?url= the first
// link ever previewed was served for every other link on the live site.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  let url: string | null = null;
  try {
    url = Buffer.from(key, "base64url").toString("utf8");
  } catch {
    url = null;
  }
  return getLinkPreview(url);
}
