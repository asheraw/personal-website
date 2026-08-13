import {useEffect, useRef, useState} from 'react'
import {Badge} from '@sanity/ui'
import type {ObjectInputProps} from 'sanity'

// How long to wait after the value stops changing before flashing "Changes
// saved" -- long enough that a pause mid-typing doesn't fire a pulse per
// keystroke, short enough that it still reads as an immediate reaction to
// whatever was just typed.
const SETTLE_MS = 500
const PULSE_MS = 900

/**
 * Wraps an object/image field's default dialog editing UI with a small
 * status badge -- Asher's own ask, after not being able to tell whether an
 * edit inside the Image/Accordion popup had actually registered (there's no
 * save button anywhere in Studio; everything autosaves continuously, but
 * that's invisible unless something says so).
 *
 * The baseline snapshot is taken one tick after mount, not synchronously
 * during the initial render -- Sanity's own Portable Text editor can
 * re-key/normalize a freshly-opened value on mount with no real edit
 * having happened (same caveat already noted in
 * `DistractionFreeWritingPanel.tsx`), which would otherwise show "Changes
 * saved" the instant the dialog opens, before Asher has touched anything.
 */
export function SavedStatusInput(props: ObjectInputProps) {
  const {value, renderDefault} = props
  const baselineRef = useRef<string | null>(null)
  const [baselineReady, setBaselineReady] = useState(false)
  const [changed, setChanged] = useState(false)
  const [pulsing, setPulsing] = useState(false)
  const settleTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const pulseTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    const id = setTimeout(() => {
      baselineRef.current = JSON.stringify(value ?? null)
      setBaselineReady(true)
    }, 0)
    return () => clearTimeout(id)
    // Deliberately empty deps -- this baseline is captured exactly once,
    // right after mount, never re-armed by later value changes.
  }, [])

  useEffect(() => {
    if (!baselineReady) return
    const current = JSON.stringify(value ?? null)
    if (current === baselineRef.current) return
    clearTimeout(settleTimer.current)
    settleTimer.current = setTimeout(() => {
      setChanged(true)
      setPulsing(true)
      clearTimeout(pulseTimer.current)
      pulseTimer.current = setTimeout(() => setPulsing(false), PULSE_MS)
    }, SETTLE_MS)
  }, [value, baselineReady])

  useEffect(
    () => () => {
      clearTimeout(settleTimer.current)
      clearTimeout(pulseTimer.current)
    },
    []
  )

  return (
    <>
      <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: 8}}>
        <Badge
          tone={changed ? 'positive' : 'default'}
          mode="outline"
          style={pulsing ? {animation: 'asheraw-saved-status-pulse 0.9s ease-out'} : undefined}
        >
          {changed ? 'Changes saved' : 'No changes detected'}
        </Badge>
      </div>
      <style>{`
        @keyframes asheraw-saved-status-pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(66, 170, 116, 0.5); }
          40% { transform: scale(1.1); box-shadow: 0 0 0 6px rgba(66, 170, 116, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(66, 170, 116, 0); }
        }
      `}</style>
      {renderDefault(props)}
    </>
  )
}
