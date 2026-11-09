import type { RecentFrame } from './frame-performance.ts'

// Both the offline parser (code units) and CLI/download (UTF-8 bytes) use this cap.
export const FRAME_EXPORT_LIMIT = 2 * 1024 * 1024

interface ExportInput {
  frames: RecentFrame[]
  timing: {
    count: number
    startTimestampMs: number
    endTimestampMs: number
    capturedSpanMs: number
  }
}

// Explicit export only. Never mutate the ring, round measurements, or omit a
// middle frame: a bounded export is the newest contiguous suffix, labelled as such.
export function boundedFrameExport(report: ExportInput) {
  const availableFrames = report.frames.length
  if (!availableFrames) throw new Error('No frames to export')
  const encode = (count: number) => {
    const frames = report.frames.slice(availableFrames - count),
      startTimestampMs = frames[0].timestampMs - frames[0].rafIntervalMs,
      endTimestampMs = frames[frames.length - 1].timestampMs,
      capturedSpanMs = endTimestampMs - startTimestampMs,
      droppedOldestFrames = availableFrames - count,
      json = JSON.stringify({
        ...report,
        timing: { ...report.timing, count, startTimestampMs, endTimestampMs, capturedSpanMs },
        ...(droppedOldestFrames
          ? { retention: { availableFrames, droppedOldestFrames, reason: 'serialized-size-limit' } }
          : {}),
        frames,
      }),
      blob = new Blob([json], { type: 'application/json' })
    return { json, blob, frameCount: count, droppedOldestFrames, capturedSpanMs }
  }
  const fits = (value: ReturnType<typeof encode>) =>
    value.json.length <= FRAME_EXPORT_LIMIT && value.blob.size <= FRAME_EXPORT_LIMIT
  const full = encode(availableFrames)
  if (fits(full)) return full
  let best = encode(1)
  if (!fits(best)) throw new Error('Export metadata and one frame exceed the size limit')
  let low = 2,
    high = availableFrames - 1
  while (low <= high) {
    const middle = Math.floor((low + high) / 2),
      candidate = encode(middle)
    if (fits(candidate)) {
      best = candidate
      low = middle + 1
    } else high = middle - 1
  }
  return best
}
