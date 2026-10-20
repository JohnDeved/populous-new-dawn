import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { deflateSync } from 'node:zlib'
import { validateShieldCapture, validateShieldPng } from '../scripts/tutorial-browser/shield-evidence.mjs'
import units from '../app/original-units.json' with { type: 'json' }

// Independent fixed phase-zero, unscaled native vectors. Synthetic data below
// tests the validator only. It is never retained as browser acceptance evidence.
function fixture() {
  const frame = units.frames.findIndex(frame => frame.nativeHeight === 36)
  assert.ok(frame >= 0)
  const sources = [1538, 1544, 1550], ys = [-4, -7, -11]
  return { worldUnchanged: true, cameraClockUnchanged: true,
    worldBeforeSha256: 'a'.repeat(64), worldAfterSha256: 'a'.repeat(64),
    samples: [{ id: 0, owner: 0, team: 'blue', shield: 1440, animationFrame: 0, stamp: 10,
      cropStamp: 10, nontransparentPixels: 1000, cropColors: 30,
      cropMatchesFramebuffer: true, framebufferRgbaSha256: 'b'.repeat(64),
      retainedRgbaSha256: 'b'.repeat(64), pngSha256: 'c'.repeat(64),
      config: { scaledSprites: 0, scale: 1, spriteScale: 1 }, bucket: 1000,
      bodyFrame: frame, nativeFrameHeight: 36, frameHeight: 36,
      body: { left: -12, top: -36, right: 12, bottom: 0 },
      bodyLayers: [{ childIndex: 1, command: { bucket: 1000 }, depth: 0.99 }],
      overlays: [], canvasOwned: true, clip: { width: 40, height: 44 }, anchor: { z: 0 },
      pieces: sources.map((source, piece) => ({ source, visible: true, isSprite: true,
        width: 32, height: 16, x: -16, y: ys[piece],
        uv: [1 / 16, 1, (source - 1538) / 16, 0], uploadedUV: [1 / 16, 1, (source - 1538) / 16, 0],
        color: 0x333fcb, imageWidth: 512, imageHeight: 16, texture: 'http://fixture/original/shield.png',
        nearest: true, mipmaps: false, transparent: true, depthWrite: false, toneMapped: false, opacity: 1,
        command: { bucket: 1000 }, depth: 0.98 - piece * 0.01, childIndex: 2 + piece })),
      causal: { withoutStamp: 11, restoredStamp: 12, removedOnlyActorShield: true,
        changed: 100, changedInsideShield: 99, exactRestoredPixels: true },
      filename: 'shield-original-0.png' }] }
}
const validate = value => validateShieldCapture(value, { owners: [0], scaled: false, units })

test('independent fixed native rectangle/UV/palette vector is accepted by browser validator', () => {
  assert.deepEqual(validate(fixture()), { owners: [0], scaled: false, actors: 1, visiblePixels: 99 })
})

test('browser validator rejects metadata-only, mismatched source/tint/body/painter and wrong-frame pixels', () => {
  const mutations = [
    f => { f.worldUnchanged = false },
    f => { f.cameraClockUnchanged = false },
    f => { f.worldAfterSha256 = 'b'.repeat(64) },
    f => { f.samples[0].pieces[0].source++ },
    f => { f.samples[0].pieces[0].uv[2] = 0.9 },
    f => { f.samples[0].pieces[0].uploadedUV[2] = 0.9 },
    f => { f.samples[0].pieces[1].color = 0x00ffff },
    f => { f.samples[0].pieces[2].y = -10 },
    f => { f.samples[0].nativeFrameHeight = 35 },
    f => { f.samples[0].frameHeight = 35 },
    f => { f.samples[0].bodyLayers = [] },
    f => { f.samples[0].pieces[0].command = null },
    f => { f.samples[0].pieces[2].depth = 0.999 },
    f => { f.samples[0].pieces[0].nearest = false },
    f => { f.samples[0].causal.changedInsideShield = 0 },
    f => { f.samples[0].causal.exactRestoredPixels = false },
    f => { f.samples[0].causal.withoutStamp = 10 },
    f => { f.samples[0].cropStamp = 9 },
    f => { f.samples[0].cropColors = 1 },
    f => { f.samples[0].cropMatchesFramebuffer = false },
    f => { f.samples[0].retainedRgbaSha256 = 'c'.repeat(64) },
    f => { f.samples[0].overlays = ['paused-badge'] },
    f => { f.samples[0].canvasOwned = false },
  ]
  for (const mutate of mutations) {
    const value = fixture(); mutate(value)
    assert.throws(() => validate(value))
  }
})

test('standalone Shield browser source uses public input and current Save/Load without gameplay rewrites', () => {
  const harness = readFileSync(new URL('../scripts/tutorial-browser/shield-visuals.mjs', import.meta.url), 'utf8')
  const observer = readFileSync(new URL('../scripts/tutorial-browser/shield-observer.mjs', import.meta.url), 'utf8')
  for (const source of [harness, observer]) {
    assert.doesNotMatch(source, /\.shield\s*=(?!=)|\.units\s*=|\.paused\s*=(?!=)|\.animationFrame\s*=(?!=)/)
    assert.doesNotMatch(source, /advanceGame|stepUnitShields|\btick\s*\(|\.animate\s*\(|\.focus\s*\(|import\(['"]\/app\//)
    assert.doesNotMatch(source, /keyboard\.press\(['"]F9/)
  }
  assert.match(harness, /keyboard\.press\('0'\)/)
  assert.match(harness, /page\.mouse\.click\(point\.x, point\.y\)/)
  assert.match(harness, /button\('Save checkpoint'\)/)
  assert.match(harness, /button\('Load checkpoint'\)/)
  assert.match(harness, /committed\.version, CHECKPOINT_VERSION/)
  assert.doesNotMatch(harness, /committed\.version,\s*[0-9]/)
  assert.match(observer, /nativeUniforms\?\.nativeAtlasTransform/)
  assert.match(observer, /gl\.readPixels/)
  assert.match(observer, /finally[\s\S]*sprite\.visible = oldVisibility/)
  assert.match(observer, /beforeWorld === afterWorld/)
})

test('retained PNG reader proves exact top-left RGBA identity and rejects wrong or corrupt crops', () => {
  const sha = bytes => createHash('sha256').update(bytes).digest('hex')
  const crc = data => {
    let n = -1
    for (const byte of data) {
      n ^= byte
      for (let i = 0; i < 8; i++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1
    }
    return (~n) >>> 0
  }
  const chunk = (type, data) => {
    const bytes = Buffer.alloc(data.length + 12)
    bytes.writeUInt32BE(data.length); bytes.write(type, 4); data.copy(bytes, 8)
    bytes.writeUInt32BE(crc(bytes.subarray(4, bytes.length - 4)), bytes.length - 4)
    return bytes
  }
  for (const channels of [3, 4]) {
    const width = 3, height = 5, stride = width * channels
    const rgba = Buffer.alloc(width * height * 4, 255)
    for (let pixel = 0; pixel < width * height; pixel++)
      for (let channel = 0; channel < 3; channel++) rgba[pixel * 4 + channel] = (pixel * 37 + channel * 19) & 255
    const pixels = channels === 4 ? rgba : Buffer.from([...rgba].filter((_, i) => i % 4 !== 3))
    const filtered = Buffer.alloc((stride + 1) * height)
    for (let y = 0; y < height; y++) {
      filtered[y * (stride + 1)] = y
      for (let x = 0; x < stride; x++) {
        const at = y * stride + x, left = x < channels ? 0 : pixels[at - channels],
          up = y ? pixels[at - stride] : 0, diagonal = y && x >= channels ? pixels[at - stride - channels] : 0
        const predictor = left + up - diagonal
        const sorted = [[left, Math.abs(predictor - left)], [up, Math.abs(predictor - up)],
          [diagonal, Math.abs(predictor - diagonal)]].sort((a, b) => a[1] - b[1])
        const offset = [0, left, up, (left + up) >> 1, sorted[0][0]][y]
        filtered[y * (stride + 1) + 1 + x] = (pixels[at] - offset) & 255
      }
    }
    const header = Buffer.alloc(13)
    header.writeUInt32BE(width); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = channels === 4 ? 6 : 2
    const bytes = Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), chunk('IHDR', header),
      chunk('IDAT', deflateSync(filtered)), chunk('IEND', Buffer.alloc(0))])
    const sample = { clip: { width, height }, framebufferRgbaSha256: sha(rgba) }
    assert.deepEqual(validateShieldPng(bytes, sample), { pngSha256: sha(bytes), retainedRgbaSha256: sha(rgba) })
    assert.throws(() => validateShieldPng(bytes, { ...sample, framebufferRgbaSha256: '0'.repeat(64) }), /same-render/)
    assert.throws(() => validateShieldPng(bytes, { ...sample, clip: { width: 4, height } }))
    const corrupted = Buffer.from(bytes); corrupted[bytes.length - 1] ^= 1
    assert.throws(() => validateShieldPng(corrupted, sample), /CRC/)
    assert.throws(() => validateShieldPng(bytes.subarray(0, bytes.length - 5), sample))
  }
})
