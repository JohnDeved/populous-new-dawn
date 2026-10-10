import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

// Use the fresh CDP session that owns this display override. Mixing a later
// Playwright screenshot into this session resets DPR on installed Chrome154.
export async function captureNearbyDisplay(page, cdp, path) {
  const read = () => page.evaluate(() => ({ width: innerWidth, height: innerHeight, dpr: devicePixelRatio })),
    before = await read(),
    result = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  assert.ok(typeof result.data === 'string' && result.data.length <= 24 * 1024 * 1024, 'Bounded PNG required')
  const bytes = Buffer.from(result.data, 'base64')
  writeFileSync(path, bytes)
  const after = await read()
  assert.ok(bytes.length >= 24 && bytes.subarray(0, 8).toString('hex') === '89504e470d0a1a0a', 'Actual PNG header required')
  return { before, after, pixels: [bytes.readUInt32BE(16), bytes.readUInt32BE(20)],
    bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }
}

export function assertNearbyDisplayCapture(capture) {
  assert.deepEqual(capture.before, { width: 1280, height: 720, dpr: 2 })
  assert.deepEqual(capture.after, capture.before)
  assert.deepEqual(capture.pixels, [2560, 1440])
}
