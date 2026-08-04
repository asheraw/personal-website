import {NextRequest, NextResponse} from 'next/server'
import {runLinkCheck} from '@/lib/linkChecker'

// Runs weekly (see vercel.json's crons entry) -- re-checks every link found
// in current post/snippet content, same logic the "Check now" button in
// Studio -> Link Checker uses on demand. This is what makes the checker
// "monitoring" rather than a one-off audit: broken links get flagged
// without Asher needing to remember to click Check now himself.
//
// Fails closed without CRON_SECRET configured, same pattern as
// /api/cron/purge-trash -- Vercel sends `Authorization: Bearer
// <CRON_SECRET>` automatically on its own scheduled calls once that
// variable is set.
export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({error: 'Unauthorized'}, {status: 401})
  }

  try {
    const result = await runLinkCheck()
    return NextResponse.json({success: true, ...result})
  } catch (error) {
    console.error('[cron/check-links] failed:', error)
    return NextResponse.json({success: false, error: 'Link check failed'}, {status: 500})
  }
}
