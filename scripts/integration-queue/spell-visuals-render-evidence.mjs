// Data-only renderer evidence oracle for an independently pinned trusted reader.
// No candidate application imports or executable original resources.
import assert from 'node:assert/strict'
import { inflateSync } from 'node:zlib'
export function expectedAngelResourcePositions(original, pose) {
  const base = original.bases[pose.base], from = original.points[pose.from], to = original.points[pose.to]
  assert.ok(base && from && to); assert.ok(Number.isInteger(pose.frame) && Number.isInteger(pose.duration) && pose.duration > 0)
  const positions = new Float32Array(base.pointIndices.length * 3)
  for (const [vertex, index] of base.pointIndices.entries()) for (let axis = 0; axis < 3; axis++) {
    const raw = ((from[index][axis] + Math.trunc(Math.imul(to[index][axis] - from[index][axis], pose.frame) / pose.duration)) << 16) >> 16
    positions[vertex * 3 + axis] = raw / (base.model.scale * (axis === 2 ? -3 : 3))
  }
  return positions
}
export function angelAttributeChecksum(array) {
  const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength)
  let value = 2166136261
  for (const b of bytes) value = Math.imul(value ^ b, 16777619) >>> 0
  return value.toString(16).padStart(8, '0')
}
export function expectedAngelResourceUV(original, base, owner) {
  const source = original.bases[base].model, uv = [...source.uv]
  let vertex = 0
  const tiles = source.tiles.map((from, face) => {
    const to = original.tribeTiles.includes(from) ? from + owner : from
    const count = source.faces[face * 2] === 3 ? 3 : 6
    for (let corner = 0; corner < count; corner++) {
      const at = (vertex + corner) * 2, x = to & 7, y = to >> 3
      const u = uv[at] + ((to & 7) - (from & 7)) / 8
      const v = uv[at + 1] - ((to >> 3) - (from >> 3)) / 32
      // Actual nativeModel geometry includes the established half-texel/31px
      // sampling transform after owner translation; raw imported UV is not GPU UV.
      uv[at] = (x + (0.5 + (u * 8 - x) * 31) / 32) / 8
      uv[at + 1] = 1 - (y + (0.5 + ((1 - v) * 32 - y) * 31) / 32) / 32
    }
    vertex += count
    return to
  })
  return { uv: [...new Float32Array(uv)], tiles }
}
export function validateAngelResourceObservation(observation, fixture, segment, original) {
  const r = observation
  assert.equal(r.segment, segment); assert.equal(r.error, null); assert.equal(r.done, true)
  assert.equal(r.sceneWorldMatched, true); assert.equal(r.retention?.done, true)
  assert.ok(r.visits > 0 && r.visits <= 12000)
  assert.ok(r.samples.length >= 4 && r.samples.length <= 1200)
  assert.ok(r.crops.length >= 4 && r.crops.length <= 20)
  assert.equal(r.resources.length, 8)
  assert.equal(new Set(r.resources.map(x => x.geometry)).size, 8)
  assert.equal(new Set(r.resources.map(x => x.material)).size, 8)
  for (const [owner, id] of fixture.ids.entries()) {
    for (const base of [62, 69]) {
      const items = r.resources.filter(x => x.id === id && x.owner === owner && x.base === base)
      assert.equal(items.length, 1)
      const resource = items[0], expected = expectedAngelResourceUV(original, base, owner)
      assert.equal(resource.bank, 2); assert.equal(resource.neighbourSharesAtlas, true)
      assert.deepEqual(resource.materialColor, [1, 1, 1], 'Owner color must come from UV tiles, not uniform tint')
      assert.match(resource.atlasUrl, /\/original\/atlas\.png$/)
      assert.deepEqual(resource.uv, expected.uv); assert.deepEqual(resource.tiles, expected.tiles)
    }
  }
  for (const s of r.samples) {
    assert.ok(Number.isFinite(s.rafTimestamp)); assert.equal(s.sceneTimestamp, s.rafTimestamp, 'Capture must follow Scene render in the same RAF cycle')
    assert.equal(s.id, fixture.ids[s.owner]); assert.equal(s.base, s.pose.base)
    assert.equal(s.positionCount, 1413)
    const expected = expectedAngelResourcePositions(original, s.pose)
    assert.equal(s.positionChecksum, angelAttributeChecksum(expected), 'Actual mutable mesh positions match source-backed displayed pose')
    if (s.positions) assert.deepEqual(s.positions.map(v => v === 0 ? 0 : v), [...expected].map(v => v === 0 ? 0 : v))
    assert.equal(s.scale, s.pose.scale); assert.equal(s.shaderScale, s.pose.scale)
    assert.equal(s.height, fixture.state.angels[s.owner].height)
    assert.equal(s.groupY, Math.round(s.height * 45) / 128)
    assert.equal(s.nativeTilt, 0); assert.equal(s.nativeRoll, 0)
    assert.equal(s.visible, true); assert.equal(s.submitted, true)
    assert.equal(s.paused, segment === 'paused')
    assert.deepEqual(s.pose, s.presentation.displayed)
    if (s.phase === 'dying') assert.ok(s.scale <= 160 && s.scale >= 10)
  }
  // Inventory is independent of the producer's labels: bind every required
  // crop to the first eligible retained sample, never a later substitution.
  const labelOf = s => segment === 'paused' ? 'paused-transition' : s.pose.to >= 76 ? 'transition' :
    s.phase === 'dying' ? s.scale > 80 ? 'death-large' : 'death-small' : `base-${s.base}`
  const required = fixture.ids.flatMap((id, owner) => (segment === 'paused' ? ['paused-transition'] :
    ['transition', 'base-62', 'base-69', ...(owner === 0 ? ['death-large', 'death-small'] : [])]).map(label => ({ id, label })))
  assert.equal(r.crops.length, required.length + (segment === 'running' ? fixture.ids.length : 0))
  assert.equal(new Set(r.crops.map(c => c.filename)).size, r.crops.length)
  for (const { id, label } of required) {
    const sample = r.samples.find(s => s.id === id && labelOf(s) === label)
    assert.ok(sample, `Missing first eligible ${id}/${label} sample`)
    const crops = r.crops.filter(c => !c.cleared && c.id === id && c.label === label)
    assert.equal(crops.length, 1, `Required crop ${id}/${label}`)
    assert.equal(crops[0].filename, sample.cropFile, `First eligible crop ${id}/${label}`)
    assert.equal(crops[0].stamp, sample.stamp)
  }
  for (const crop of r.crops) {
    assert.match(crop.filename, new RegExp(`^angel-${segment}-[0-9]+\\.png$`))
    assert.equal(crop.error, undefined); assert.equal(crop.canvasOwned, true); assert.deepEqual(crop.overlays, [])
    assert.ok(crop.clip.width > 1 && crop.clip.width <= 256 && crop.clip.height > 1 && crop.clip.height <= 256)
    assert.ok(crop.opaqueColors > 3, 'Crop must contain rendered nonblank pixels')
    assert.match(crop.sha256, /^[a-f0-9]{64}$/)
    if (!crop.cleared) {
      const sample = r.samples.find(s => s.cropFile === crop.filename)
      assert.ok(sample); assert.equal(sample.id, crop.id); assert.equal(labelOf(sample), crop.label); assert.equal(sample.stamp, crop.stamp); assert.equal(sample.turn, crop.turn)
      assert.deepEqual(sample.pose, crop.pose); assert.deepEqual(sample.bounds, crop.bounds)
      assert.ok(sample.positions)
    }
  }
  if (segment === 'paused') {
    assert.deepEqual(r.contextFrames, [])
    for (const [owner, id] of fixture.ids.entries()) {
      const sample = r.samples.find(s => s.id === id)
      assert.deepEqual(sample.pose, fixture.state.angels[owner].angel.presentation.displayed)
      assert.equal(sample.turn, fixture.state.turn)
    }
    assert.equal(r.terminal.reason, 'paused-transition')
  } else {
    assert.deepEqual(r.contextFrames.map(frame => [frame.filename, frame.label]), [['angel-loop-context.png', 'loop'], ['angel-death-context.png', 'death']])
    for (const frame of r.contextFrames) {
      assert.equal(frame.fullCanvas, true); assert.equal(frame.error, undefined); assert.match(frame.sha256, /^[a-f0-9]{64}$/)
      assert.ok(frame.clip.width > 256 && frame.clip.width <= 1440 && frame.clip.height > 256 && frame.clip.height <= 1000)
      const sample = r.samples.find(sample => sample.id === frame.id && sample.stamp === frame.stamp)
      assert.ok(sample); assert.equal(frame.turn, sample.turn); assert.deepEqual(frame.pose, sample.pose)
      assert.ok(frame.opaqueColors > 3)
    }
    assert.equal(r.worldReplaced, true)
    for (const id of fixture.ids) {
      const samples = r.samples.filter(s => s.id === id)
      assert.ok(samples.some(s => s.pose.to >= 76), 'Observe real transition keys')
      for (const base of [62, 69]) assert.ok(samples.some(s => s.base === base && s.pose.to < 76), `Observe original loop base${base}`)
      const death = samples.filter(s => s.phase === 'dying')
      assert.ok(new Set(death.map(s => s.scale)).size >= 2, 'Observe multiple ordinary shrinking scales')
      assert.ok(death.some(s => s.scale <= 80))
      const clears = r.crops.filter(c => c.id === id && c.cleared)
      assert.equal(clears.length, 1)
      const prior = r.crops.filter(c => c.id === id && !c.cleared).at(-1)
      assert.notEqual(clears[0].pixelChecksum, prior.pixelChecksum, 'Cleared footprint must not retain the Angel pixels')
    }
    assert.equal(r.terminal.reason, 'ordinary-expiry')
    assert.equal(r.cleanup?.effectsRemoved, true); assert.equal(r.cleanup.groupsRemoved, true)
    assert.equal(r.cleanup.allOwnedDetached, true)
    assert.deepEqual(r.cleanup.disposed, { geometry: 8, material: 8, texture: 0 })
    assert.equal(r.cleanup.neighbourSubmitted, true); assert.equal(r.cleanup.neighbourAtlasUnchanged, true)
  }
  return true
}

// Bounded PNG validation/decoding for retained canvas bytes. A filename, claimed
// color count or plausible IHDR alone is not rendered evidence.
export function validateAngelPng(bytes, width, height, inspectPixels = true) {
  assert.ok(Buffer.isBuffer(bytes) && bytes.length > 64 && bytes.length <= 16 * 1024 * 1024)
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  let at = 8, channels, ended = false, chunks = 0
  const compressed = []
  while (at < bytes.length) {
    assert.ok(++chunks <= 128 && at + 12 <= bytes.length)
    const length = bytes.readUInt32BE(at), end = at + 8 + length
    assert.ok(end + 4 <= bytes.length)
    const type = bytes.toString('ascii', at + 4, at + 8), data = bytes.subarray(at + 8, end)
    let crc = 0xffffffff
    for (const b of bytes.subarray(at + 4, end)) { crc ^= b; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0) }
    assert.equal((crc ^ 0xffffffff) >>> 0, bytes.readUInt32BE(end), 'PNG chunk CRC mismatch')
    assert.match(type, /^[A-Za-z]{4}$/)
    if (type === 'IHDR') {
      assert.equal(at, 8); assert.equal(length, 13); assert.equal(data.readUInt32BE(0), width); assert.equal(data.readUInt32BE(4), height)
      assert.equal(data[8], 8); assert.ok([2, 6].includes(data[9])); channels = data[9] === 6 ? 4 : 3
      assert.deepEqual([...data.subarray(10)], [0, 0, 0])
    } else if (type === 'IDAT') { assert.ok(channels); compressed.push(data) }
    else if (type === 'IEND') { assert.equal(length, 0); assert.equal(end + 4, bytes.length); ended = true }
    else assert.equal(type[0], type[0].toLowerCase(), 'Unexpected critical PNG chunk')
    at = end + 4
  }
  assert.ok(ended && channels && compressed.length)
  assert.ok(Number.isSafeInteger(width) && Number.isSafeInteger(height) && width > 0 && height > 0 && width <= 1440 && height <= 1000)
  const stride = width * channels, expectedBytes = height * (stride + 1), packed = Buffer.concat(compressed)
  const inflated = inflateSync(packed, { maxOutputLength: expectedBytes, info: true })
  assert.equal(inflated.engine.bytesWritten, packed.length); assert.equal(inflated.buffer.length, expectedBytes)
  for (let y = 0; y < height; y++) assert.ok(inflated.buffer[y * (stride + 1)] <= 4, 'Invalid PNG scanline filter')
  if (!inspectPixels) return { width, height }
  const raw = inflated.buffer, decoded = new Uint8Array(height * stride), rgba = new Uint8Array(width * height * 4)
  const paeth = (a, b, c) => { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); return pa <= pb && pa <= pc ? a : pb <= pc ? b : c }
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]; assert.ok(filter <= 4)
    for (let x = 0; x < stride; x++) {
      const i = y * stride + x, a = x >= channels ? decoded[i - channels] : 0,
        b = y ? decoded[i - stride] : 0, c = y && x >= channels ? decoded[i - stride - channels] : 0
      decoded[i] = (raw[y * (stride + 1) + 1 + x] + [0, a, b, (a + b) >> 1, paeth(a, b, c)][filter]) & 255
    }
  }
  const colors = new Set()
  for (let pixel = 0; pixel < width * height; pixel++) {
    const i = pixel * 4, j = pixel * channels
    rgba.set([decoded[j], decoded[j + 1], decoded[j + 2], channels === 4 ? decoded[j + 3] : 255], i)
    if (rgba[i + 3]) colors.add((rgba[i] << 16) | (rgba[i + 1] << 8) | rgba[i + 2])
  }
  return { width, height, opaqueColors: colors.size, pixelChecksum: angelAttributeChecksum(rgba) }
}
