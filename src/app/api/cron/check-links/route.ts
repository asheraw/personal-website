import {NextRequest, NextResponse} from 'next/server'
import {runLinkCheck} from '@/lib/linkChecker'

// Runs daily (see .github/workflows/cron-check-links.yml -- originally
// Vercel's built-in Cron feature via vercel.json's crons entry, replaced
// with a GitHub Actions workflow once asheraw.com's DNS moved to Netlify,
// which has no equivalent built-in scheduler) -- re-checks every link
// found in current post/snippet content, same logic the "Check now"
// button in Studio -> Link Checker uses on demand. This is what makes the
// checker "monitoring" rather than a one-off audit: broken links get
// flagged without Asher needing to remember to click Check now himself.
//
// Fails closed without CRON_SECRET configured, same pattern as
// /api/cron/purge-trash -- the GitHub Actions workflow sends
// `Authorization: Bearer <CRON_SECRET>` on each scheduled call, reading
// the same secret value from a GitHub repository secret.
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
