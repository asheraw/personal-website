import { NextRequest } from "next/server";
import { getLinkPreview } from "@/lib/linkPreview";

// Kept for old callers only. The site itself uses /api/link-preview/<key>
// (see [key]/route.ts), because a query-string URL gets cached by Netlify
// under one key for every link.
export async function GET(request: NextRequest) {
  return getLinkPreview(request.nextUrl.searchParams.get("url"));
}
