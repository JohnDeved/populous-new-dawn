import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { inflateSync } from 'node:zlib'

// Independent constants transcribed from 0059d9d8's source/lift pairs and owner palette
// lookup, not imported from shieldRectangles or original-shield.json.
const sources = [1538, 1539, 1540, 1541, 1542, 1541, 1540, 1539, 1538, 1539, 1540, 1541, 1542, 1541, 1540, 1539]
const lifts = [0, 32, 64, 96, 128, 160, 192, 224, 256, 224, 192, 160, 128, 96, 64, 32]
const colors = [0x333fcb, 0xff4b16, 0xdf9b1f, 0x2fab63]
const near = (a, b, message) => assert.ok(Number.isFinite(a) && Math.abs(a - b) < 1e-7, `${message}: ${a} != ${b}`)

// This browser fixture has ordinary positive-bucket braves only. Do not silently
// claim it covers the separate shaman scaling path.
export function shieldExpectedSize(value, sample) {
  if (!sample.config.scaledSprites) return value
  assert.ok(sample.bucket > 0 && sample.config.spriteScale > 0)
  let size = Math.trunc(Math.imul(Math.imul(sample.config.scale, value), 16) / sample.config.spriteScale)
  if (sample.bucket >= 1792)
    size = (size + Math.trunc(Math.imul(Math.trunc(Math.imul(size, 14) / 16), sample.bucket - 1792) / -1792)) | 0
  return Math.max(-256, Math.min(256, size >> 4))
}

export function validateShieldCapture(capture, { owners, scaled, units }) {
  assert.ok(units?.frames, 'Pinned original unit-frame data is required')
  assert.equal(capture.worldUnchanged, true, 'Pixel diagnostics must preserve the entire World')
  assert.equal(capture.cameraClockUnchanged, true, 'Camera and logical animation clock must be identical')
  assert.match(capture.worldBeforeSha256, /^[0-9a-f]{64}$/)
  assert.equal(capture.worldAfterSha256, capture.worldBeforeSha256)
  assert.deepEqual(capture.samples.map(sample => sample.owner).sort(), [...owners].sort())
  for (const sample of capture.samples) {
    assert.equal(!!sample.config.scaledSprites, scaled)
    assert.equal(sample.team, ['blue', 'red', 'yellow', 'green'][sample.owner])
    assert.ok(sample.shield > 0 && Number.isInteger(sample.stamp))
    assert.equal(sample.cropStamp, sample.stamp, 'Canvas crop must belong to the metadata/GL render')
    assert.ok(sample.nontransparentPixels > 0 && sample.cropColors > 1, 'Retained canvas crop must not be blank')
    assert.equal(sample.cropMatchesFramebuffer, true, 'Same-render canvas copy must match vertically oriented GL pixels')
    assert.match(sample.framebufferRgbaSha256, /^[0-9a-f]{64}$/)
    assert.equal(sample.retainedRgbaSha256, sample.framebufferRgbaSha256, 'Decoded retained PNG must match that framebuffer')
    assert.match(sample.pngSha256, /^[0-9a-f]{64}$/)
    assert.ok(sample.bodyFrame >= 0 && sample.nativeFrameHeight > 0)
    assert.equal(sample.nativeFrameHeight, units.frames[sample.bodyFrame]?.nativeHeight,
      'Actual post-body frame must resolve to its audited imported VFRA height')
    assert.equal(sample.frameHeight, shieldExpectedSize(sample.nativeFrameHeight, sample))
    assert.ok(sample.body.right > sample.body.left && sample.body.bottom > sample.body.top)
    assert.ok(sample.bodyLayers.length > 0)
    assert.ok(sample.bodyLayers.every(body => body.command && Number.isFinite(body.depth)))
    assert.deepEqual(sample.overlays, [])
    assert.equal(sample.canvasOwned, true)
    assert.ok(sample.clip.width > 1 && sample.clip.height > 1 && sample.clip.width <= 256 && sample.clip.height <= 256)
    assert.ok(sample.anchor.z >= -1 && sample.anchor.z <= 1)
    assert.equal(sample.pieces.length, 3)
    const width = shieldExpectedSize(32, sample), height = shieldExpectedSize(16, sample)
    const span = scaled ? height : Math.trunc(sample.frameHeight * 28 / 32)
    for (let piece = 0; piece < 3; piece++) {
      const actual = sample.pieces[piece]
      const phase = ((sample.id & 0xffff) + (sample.animationFrame >>> 0) - piece) & 15
      const source = sources[phase] + piece * 5
      assert.equal(actual.visible, true); assert.equal(actual.isSprite, true)
      assert.equal(actual.source, source)
      assert.equal(actual.width, width); assert.equal(actual.height, height)
      near(actual.x, -Math.trunc(width / 2), 'Native horizontal anchor')
      near(actual.y, -Math.trunc(lifts[phase] * span / 256) - Math.trunc(sample.frameHeight / 8),
        'Native post-body vertical anchor')
      assert.deepEqual(actual.uv, [1 / 16, 1, (source - 1538) / 16, 0])
      assert.deepEqual(actual.uploadedUV, actual.uv, 'Actual native shader per-draw uniform')
      assert.equal(actual.color, colors[sample.owner])
      assert.equal(actual.imageWidth, 512); assert.equal(actual.imageHeight, 16)
      assert.match(actual.texture, /\/original\/shield\.png(?:[?#].*)?$/)
      assert.equal(actual.nearest, true); assert.equal(actual.mipmaps, false)
      assert.equal(actual.transparent, true); assert.equal(actual.depthWrite, false)
      assert.equal(actual.toneMapped, false); assert.equal(actual.opacity, 1)
      assert.ok(actual.command && Number.isFinite(actual.depth))
      for (const body of sample.bodyLayers) {
        assert.equal(actual.command.bucket, body.command.bucket)
        assert.ok(actual.childIndex > body.childIndex && actual.depth < body.depth, 'Shield paints after the body')
      }
      if (piece) {
        assert.ok(actual.childIndex > sample.pieces[piece - 1].childIndex)
        assert.ok(actual.depth < sample.pieces[piece - 1].depth, 'Three Shield pieces retain their painter order')
      }
    }
    assert.ok(sample.causal.withoutStamp > sample.stamp)
    assert.ok(sample.causal.restoredStamp > sample.causal.withoutStamp)
    assert.equal(sample.causal.removedOnlyActorShield, true)
    assert.ok(sample.causal.changed > 0 && sample.causal.changedInsideShield > 0,
      'Submitted metadata alone is insufficient: this actor must change visible local framebuffer pixels')
    assert.equal(sample.causal.exactRestoredPixels, true)
    assert.match(sample.filename, /^shield-(original|scaled|loaded)-[0-3]\.png$/)
  }
  return { owners: [...owners], scaled, actors: capture.samples.length,
    visiblePixels: capture.samples.reduce((sum, sample) => sum + sample.causal.changedInsideShield, 0) }
}

// Read actual retained Canvas PNG bytes independently of the browser observer.
// Only bounded RGB/RGBA8 non-interlaced crops are admitted; no image package or
// app importer is invoked. PNG filters 0..4 and RGB opaque alpha are supported.
export function validateShieldPng(bytes, sample) {
  const hash = value => createHash('sha256').update(value).digest('hex')
  const crc = value => {
    let result = 0xffffffff
    for (const byte of value) {
      result ^= byte
      for (let bit = 0; bit < 8; bit++) result = (result >>> 1) ^ (result & 1 ? 0xedb88320 : 0)
    }
    return (result ^ 0xffffffff) >>> 0
  }
  assert.ok(bytes.length > 64 && bytes.length < 512 * 1024)
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  let width, height, channels, ended = false
  const chunks = []
  for (let at = 8; at < bytes.length;) {
    assert.ok(at + 12 <= bytes.length)
    const length = bytes.readUInt32BE(at), end = at + 8 + length
    assert.ok(end + 4 <= bytes.length)
    const kind = bytes.toString('ascii', at + 4, at + 8), data = bytes.subarray(at + 8, end)
    assert.equal(bytes.readUInt32BE(end), crc(bytes.subarray(at + 4, end)), 'Retained PNG CRC')
    if (kind === 'IHDR') {
      assert.equal(width, undefined); assert.equal(length, 13)
      width = data.readUInt32BE(0); height = data.readUInt32BE(4)
      assert.ok(width > 1 && width <= 256 && height > 1 && height <= 256)
      assert.deepEqual([width, height], [sample.clip.width, sample.clip.height])
      assert.equal(data[8], 8); assert.ok(data[9] === 2 || data[9] === 6)
      assert.deepEqual([...data.subarray(10)], [0, 0, 0])
      channels = data[9] === 6 ? 4 : 3
    } else if (kind === 'IDAT') chunks.push(data)
    else if (kind === 'IEND') {
      assert.equal(length, 0); assert.equal(end + 4, bytes.length)
      ended = true
    }
    at = end + 4
  }
  assert.ok(ended && width && height && channels && chunks.length)
  const stride = width * channels, expected = (stride + 1) * height
  const filtered = inflateSync(Buffer.concat(chunks), { maxOutputLength: expected })
  assert.equal(filtered.length, expected)
  const decoded = Buffer.alloc(stride * height)
  const paeth = (a, b, c) => {
    const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c
  }
  for (let y = 0; y < height; y++) {
    const filter = filtered[y * (stride + 1)]
    assert.ok(filter >= 0 && filter <= 4)
    for (let x = 0; x < stride; x++) {
      const index = y * stride + x, a = x >= channels ? decoded[index - channels] : 0,
        b = y ? decoded[index - stride] : 0, c = y && x >= channels ? decoded[index - stride - channels] : 0
      const prediction = [0, a, b, Math.floor((a + b) / 2), paeth(a, b, c)][filter]
      decoded[index] = (filtered[y * (stride + 1) + 1 + x] + prediction) & 255
    }
  }
  const rgba = channels === 4 ? decoded : Buffer.alloc(width * height * 4, 255)
  if (channels === 3)
    for (let pixel = 0; pixel < width * height; pixel++) decoded.copy(rgba, pixel * 4, pixel * 3, pixel * 3 + 3)
  const rgbaSha256 = hash(rgba)
  assert.equal(rgbaSha256, sample.framebufferRgbaSha256, 'Retained PNG pixels must equal the same-render GL crop')
  return { pngSha256: hash(bytes), retainedRgbaSha256: rgbaSha256 }
}
