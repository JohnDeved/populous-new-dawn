// Supplied CDP/DOM/PNG-header composition; the retained blank-browser probe and
// ordinary compact tail provide actual raster evidence.
import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { captureNearbyDisplay, assertNearbyDisplayCapture } from '../scripts/local-render/nearby-display-capture.mjs'

for (const wrong of ['none', 'before DPR', 'after DPR', 'viewport', 'pixels'])
  test(`actual compact capture preserves PNG and rejects ${wrong}`, async t => {
    const root = mkdtempSync(join(tmpdir(), 'nearby-display-')), path = join(root, 'capture.png'),
      bytes = Buffer.alloc(24), calls = [], samples = [
        { width: 1280, height: 720, dpr: 2 }, { width: 1280, height: 720, dpr: 2 },
      ]
    t.after(() => rmSync(root, { recursive: true }))
    Buffer.from('89504e470d0a1a0a', 'hex').copy(bytes)
    bytes.writeUInt32BE(wrong === 'pixels' ? 1280 : 2560, 16); bytes.writeUInt32BE(1440, 20)
    if (wrong === 'before DPR') samples[0].dpr = 1
    if (wrong === 'after DPR') samples[1].dpr = 1
    if (wrong === 'viewport') samples[0].width = 1440
    const page = { evaluate: async () => { calls.push('read'); return samples.shift() } },
      cdp = { async send(method, options) {
        assert.equal(this, cdp); calls.push(method)
        assert.deepEqual(options, { format: 'png', captureBeyondViewport: false })
        return { data: bytes.toString('base64') }
      } }, result = await captureNearbyDisplay(page, cdp, path)
    assert.deepEqual(calls, ['read', 'Page.captureScreenshot', 'read'])
    assert.deepEqual(readFileSync(path), bytes, 'Retain actual capture before assertions')
    if (wrong === 'none') assertNearbyDisplayCapture(result)
    else assert.throws(() => assertNearbyDisplayCapture(result))
  })

test('actual capture retains acquired PNG when the post-capture DOM read throws', async t => {
  const root = mkdtempSync(join(tmpdir(), 'nearby-display-')), path = join(root, 'capture.png'),
    bytes = Buffer.from('acquired PNG bytes'), primary = Error('post-capture read failed')
  t.after(() => rmSync(root, { recursive: true }))
  let reads = 0
  const page = { async evaluate() {
    if (++reads === 2) { assert.deepEqual(readFileSync(path), bytes); throw primary }
    return { width: 1280, height: 720, dpr: 2 }
  } }, cdp = { async send() { return { data: bytes.toString('base64') } } }
  await assert.rejects(captureNearbyDisplay(page, cdp, path), error => error === primary)
  assert.deepEqual(readFileSync(path), bytes)
})
