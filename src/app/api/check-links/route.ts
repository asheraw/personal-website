import {NextResponse} from 'next/server'
import {runLinkCheck} from '@/lib/linkChecker'

// Triggered from Studio's "Check now" button (LinkCheckerTool.tsx) -- runs
// the same full check the daily cron does, on demand. No extra auth beyond
// what already gates every other Studio-triggered route in this codebase
// (e.g. /api/ai/suggest-seo): reaching Studio itself is the access control
// on this solo-owner site.
export async function POST() {
  try {
    const result = await runLinkCheck()
    return NextResponse.json({success: true, ...result})
  } catch (error) {
    console.error('[check-links] failed:', error)
    return NextResponse.json({success: false, error: 'Link check failed'}, {status: 500})
  }
}
