// Passive, synchronous validation of retained Tornado data. Candidate code is never imported.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { decodeComposedPng } from './composed-png.mjs'
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const widths = [160, 80, 53, 40, 31, 26, 22, 20, 17, 15, 14, 13, 12, 11, 10, 10]
const palettes = [-2, -1, 3, 4, 5]
const stock = 'Two fresh sessions, one actual F9 Unlock + refill grant and one genuine HUD cast each. Supplied testing stock, not campaign acquisition.'
const limits = 'Land and reachable water targets only; actual observed palettes reported. No terrain/controller/particle injection. Save portability is a separate non-cheat unit gate.'
const object = value => { assert.ok(value && typeof value === 'object' && !Array.isArray(value)); return value }
const integer = (value, low, high) => assert.ok(Number.isSafeInteger(value) && value >= low && value <= high)
const finite = value => assert.ok(Number.isFinite(value))
const keys = (value, expected) => assert.deepEqual(Object.keys(object(value)).sort(), [...expected].sort())
const source = (sources, path) => {
  const bytes = sources instanceof Map ? sources.get(path) : sources[path]
  assert.ok(Buffer.isBuffer(bytes), `Missing immutable Tornado source ${path}`)
  return bytes
}
function originalPixels(fixture, frame) {
  const f = fixture.frames[frame]
  assert.equal(f.source, 1136 + frame); assert.equal(f.w, 80); assert.equal(f.h, 50)
  const raw = Buffer.from(f.rawPSFB, 'base64'), lookup = Buffer.from(fixture.rgbaLookup, 'base64')
  assert.equal(raw.toString('base64'), f.rawPSFB); assert.ok(raw.length > 0 && raw.length <= 10000)
  assert.equal(lookup.length, 1024); assert.equal(lookup.toString('base64'), fixture.rgbaLookup)
  const pixels = Buffer.alloc(80 * 50 * 4)
  let cursor = 0
  for (let y = 0; y < 50; y++) {
    let x = 0
    for (;;) {
      assert.ok(cursor < raw.length, 'Truncated original PSFB')
      const count = raw.readInt8(cursor++)
      if (count === 0) break
      if (count < 0) x -= count
      else {
        assert.ok(cursor + count <= raw.length && x + count <= 80, 'Invalid PSFB run')
        for (let n = 0; n < count; n++, x++) {
          const at = raw[cursor++] * 4
          lookup.copy(pixels, (y * 80 + x) * 4, at, at + 4)
        }
      }
      assert.ok(x <= 80, 'Invalid PSFB row')
    }
  }
  assert.equal(cursor, raw.length, 'Trailing original PSFB bytes')
  assert.equal(hash(pixels), f.rgbaSHA256, 'Original PSFB pixels differ')
  return pixels
}
function originalPairs(pixels, tint) {
  assert.equal(tint.length, 3); tint.forEach(value => integer(value, 0, 255))
  const pairs = new Map()
  for (let at = 0; at < pixels.length; at += 4) {
    const alpha = pixels[at + 3], rgb = tint.map((v, c) => pixels[at + c] * v / 255)
    const pair = [...rgb.map(v => Math.round(v * alpha / 255)), ...rgb.map(v => Math.round(v * alpha / 255 + 255 - alpha))]
    pairs.set(pair.join(','), { pair, alpha })
  }
  return [...pairs.values()]
}
function readiness(value) {
  object(value); object(value.before); object(value.after)
  integer(value.samples, 1, 12000); assert.ok(Array.isArray(value.publicActions) && value.publicActions.length <= 1)
  for (const action of value.publicActions) {
    keys(action, ['sample', 'action']); assert.equal(action.action, 'public-skip-introduction'); integer(action.sample, 1, value.samples)
  }
  const after = value.after
  assert.equal(after.ready, true); assert.equal(after.level, 1); assert.equal(after.inputMask, 0)
  integer(after.turn, 0, Number.MAX_SAFE_INTEGER); assert.ok(Array.isArray(after.selected))
  object(after.shaman); integer(after.shaman.id, 1, Number.MAX_SAFE_INTEGER)
  assert.ok(Number.isFinite(after.shaman.hp) && after.shaman.hp > 0)
  assert.equal(after.shaman.canOrder, true); assert.equal(after.shaman.selectable, true)
  if (after.shaman.flags4 !== undefined) integer(after.shaman.flags4, -2147483648, 0xffffffff)
  assert.equal((after.shaman.flags4 ?? 0) & 128, 0)
}
function cast(episode) {
  const before = object(episode.cast?.before), after = object(episode.cast?.after), target = object(episode.target)
  assert.equal(target.cell?.water, episode.kind === 'water')
  integer(target.cell?.cliff, 0, 255); finite(target.x); finite(target.z); finite(target.distance)
  assert.ok(target.distance >= 4 && target.distance <= Math.hypot(24, 24))
  for (const c of ['x', 'y']) { finite(target.pointer?.[c]); assert.ok(target.pointer[c] >= 0 && target.pointer[c] <= (c === 'x' ? 1440 : 1000)) }
  assert.equal(before.mode, 'tornado'); assert.equal(before.targetError, null); assert.equal(before.canvasHit, true)
  assert.deepEqual(before.pointer, target.pointer); assert.deepEqual(after.pointer, target.pointer)
  object(before.picked); finite(before.picked.x); finite(before.picked.z)
  integer(before.casts, 0, Number.MAX_SAFE_INTEGER - 1); integer(before.shots, 1, Number.MAX_SAFE_INTEGER)
  assert.equal(after.casts, before.casts + 1); assert.equal(after.shots, before.shots - 1)
  assert.ok(Array.isArray(before.projectiles) && Array.isArray(after.projectiles))
  assert.ok(after.projectiles.some(p => p.spell === 'tornado'), 'Charged cast must allocate Tornado projectile')
}
function graphics(value) {
  object(value); const canvas = object(value.canvas), gl = object(value.webgl), buffer = object(gl.drawingBuffer)
  assert.equal(value.devicePixelRatio, 1); assert.equal(value.rendererPixelRatio, 1)
  integer(canvas.width, 2, 1440); integer(canvas.height, 2, 1000)
  assert.equal(canvas.clientWidth, canvas.width); assert.equal(canvas.clientHeight, canvas.height)
  assert.equal(buffer.width, canvas.width); assert.equal(buffer.height, canvas.height)
  assert.equal(gl.contextLost, false); object(gl.contextAttributes)
  for (const key of ['vendor', 'renderer', 'version', 'shadingLanguageVersion']) assert.equal(typeof gl[key], 'string')
  const debug = object(gl.debugRendererInfo)
  assert.equal(typeof debug.available, 'boolean')
  for (const key of ['unmaskedVendor', 'unmaskedRenderer'])
    if (debug.available) assert.equal(typeof debug[key], 'string'); else assert.equal(debug[key], null)
  const renderer = object(value.renderer)
  assert.equal(typeof renderer.outputColorSpace, 'string'); finite(renderer.toneMapping); finite(renderer.toneMappingExposure)
  assert.equal(typeof renderer.precision, 'string'); assert.equal(typeof renderer.isWebGL2, 'boolean')
  return { width: canvas.width, height: canvas.height }
}
function stages(episode) {
  const names = episode.kind === 'land' ? ['spawn', 'active', 'first-tail', 'last-tail'] : ['spawn', 'active']
  assert.deepEqual(episode.stages.map(row => row.stage), names)
  const first = episode.stages[0], observed = []
  integer(first.id, 1, Number.MAX_SAFE_INTEGER); integer(first.visits, 1, 64)
  assert.equal(first.birth.length, 16)
  assert.deepEqual(first.birth.map(p => p.ordinal), widths.map((_, i) => i))
  for (const b of first.birth) {
    integer(b.frame, 0, 15); assert.equal(b.frame, (first.birth[0].frame - b.ordinal) & 15)
    assert.equal(b.scaleX, Math.trunc(512 / (b.ordinal + 1)))
    assert.equal(b.palette, episode.kind === 'water' ? 5 : 4)
    for (const coordinate of ['x', 'y', 'h']) integer(b[coordinate], -2147483648, 2147483647)
  }
  for (const [index, row] of episode.stages.entries()) {
    keys(row, ['stage', 'phase', 'remaining', 'visits', 'birth', 'view', 'samples', 'disposed', 'id'])
    assert.equal(row.id, first.id); assert.deepEqual(row.birth, first.birth); assert.equal(row.disposed, 0)
    integer(row.visits, 1, 364); integer(row.phase, 0, 1); integer(row.remaining, 1, 200)
    assert.deepEqual(row.samples.map(p => p.ordinal), index < 2 ? widths.map((_, i) => i) : index === 2 ? widths.slice(1).map((_, i) => i + 1) : [15])
    integer(row.view?.scaledSprites, 0, 1); integer(row.view.scale, 1, 1048576); integer(row.view.spriteScale, 1, 1048576)
    if (index < 2) assert.equal(row.phase, 0)
    else { assert.equal(row.phase, 1); assert.equal(row.remaining, index === 2 ? 23 : 9) }
    if (index === 1) { assert.equal(row.visits, first.visits + 60); assert.equal(row.remaining, first.remaining - 60) }
    if (index === 2) assert.ok(row.visits > episode.stages[1].visits && row.visits <= episode.stages[1].visits + 224)
    if (index === 3) assert.equal(row.visits, episode.stages[2].visits + 14)
    for (const p of row.samples) {
      const b = first.birth[p.ordinal]
      assert.equal(p.frame, b.frame); assert.equal(p.scaleX, b.scaleX); assert.equal(p.source, 1136 + p.frame)
      assert.equal(p.opacity, 1); assert.equal(p.visible, true); assert.match(p.texture, /\/original\/tornado\.png$/)
      assert.equal(p.minFilter, 1003); assert.equal(p.magFilter, 1003)
      assert.deepEqual(p.uv, [80 / 2048, 50 / 128, p.frame * 128 / 2048, 1 - 50 / 128])
      integer(p.depth, -2147483648, 2147483647)
      const distance = (p.depth + 0x7000 - 128) | 0, bucket = distance < 64 ? 0 : Math.min(3584, distance >> 4)
      assert.equal(p.bucket, bucket)
      const scale = n => {
        if (!row.view.scaledSprites) return n
        let v = Math.trunc(Math.imul(Math.imul(row.view.scale, n), 16) / row.view.spriteScale)
        if (bucket + 1 >= 1792) v = (v + Math.trunc(Math.imul(Math.trunc(Math.imul(v, 14) / 16), bucket + 1 - 1792) / -1792)) | 0
        return Math.max(-256, Math.min(256, v >> 4))
      }
      assert.equal(p.width, scale(widths[p.ordinal])); assert.equal(p.height, scale(50))
      assert.deepEqual(p.center, [p.width ? Math.trunc(p.width / 2) / p.width : 0.5, 0])
      assert.ok(palettes.includes(p.palette)); if (!observed.includes(p.palette)) observed.push(p.palette)
      for (const coordinate of ['x', 'y', 'h']) integer(p[coordinate], -2147483648, 2147483647)
    }
  }
  assert.deepEqual(episode.observedPalettes, observed)
}
function pairedOracle(black, white, pairs) {
  assert.equal(black.rgba.length, white.rgba.length)
  const histogram = new Map()
  for (let at = 0; at < black.rgba.length; at += 4) {
    assert.equal(black.rgba[at + 3], 255, 'Diagnostic black alpha must be opaque')
    assert.equal(white.rgba[at + 3], 255, 'Diagnostic white alpha must be opaque')
    // Six bytes fit exactly in a JS integer; avoid an array/string object per pixel.
    let key = 0
    for (let c = 0; c < 3; c++) key = key * 256 + black.rgba[at + c]
    for (let c = 0; c < 3; c++) key = key * 256 + white.rgba[at + c]
    histogram.set(key, (histogram.get(key) ?? 0) + 1)
  }
  let transparent = 0, fractional = 0, visible = 0, mismatches = 0
  for (const [key, count] of histogram) {
    const values = Array(6); let encoded = key
    for (let i = 5; i >= 0; i--) { values[i] = encoded % 256; encoded = Math.floor(encoded / 256) }
    const match = pairs.find(({ pair }) => pair.every((v, i) => Math.abs(v - values[i]) <= 1))
    assert.ok(match, 'Retained diagnostic pixels disagree with original palette/alpha')
    if (!match.alpha) transparent += count
    else { visible += count; if (match.alpha < 255) fractional += count }
  }
  return { transparent, fractional, visible, mismatches, examples: [] }
}
export function validateTornadoEvidence(report, { hostReport, mergeSha, browserVersion, files, sourceBytes }) {
  keys(report, ['head', 'status', 'browserVersion', 'stock', 'limits', 'budgetMs', 'episodes', 'elapsedMs'])
  const { elapsedMs, ...hostProjection } = report
  assert.deepEqual(hostProjection, hostReport, 'Raw Tornado report differs from authenticated host child')
  assert.match(mergeSha, /^[a-f0-9]{40}$/); assert.equal(report.head, mergeSha); assert.equal(report.browserVersion, browserVersion)
  assert.equal(report.status, 'PASS'); assert.equal(report.stock, stock); assert.equal(report.limits, limits)
  finite(elapsedMs); finite(report.budgetMs); assert.ok(elapsedMs >= 0 && elapsedMs <= report.budgetMs && report.budgetMs > 0 && report.budgetMs <= 90000)
  assert.deepEqual(report.episodes.map(row => row.kind), ['land', 'water'])
  const fixture = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(source(sourceBytes, 'tests/fixtures/tornado-original.json')))
  assert.equal(fixture.frames.length, 16); assert.deepEqual(Object.keys(fixture.paletteTints).sort(), palettes.map(String).sort())
  const pixels = fixture.frames.map((_, frame) => originalPixels(fixture, frame))
  const atlasHash = hash(source(sourceBytes, 'public/original/tornado.png'))
  for (const episode of report.episodes) {
    keys(episode, ['kind', 'stages', 'observedPalettes', 'readiness', 'target', 'cast', 'graphics', 'diagnostic', 'restartReadiness', 'cleanup', ...(episode.kind === 'land' ? ['exactDeletion'] : [])])
    readiness(episode.readiness); readiness(episode.restartReadiness); cast(episode); stages(episode)
    const dimensions = graphics(episode.graphics), d = episode.diagnostic, selected = episode.stages[0].samples[0]
    keys(d, ['ordinal', 'source', 'palette', 'loadedAtlasSHA256', 'transparent', 'fractional', 'visible', 'mismatches', 'examples', 'cleanup'])
    assert.equal(d.ordinal, selected.ordinal); assert.equal(d.source, selected.source); assert.equal(d.palette, selected.palette)
    assert.equal(d.loadedAtlasSHA256, atlasHash); assert.equal(d.cleanup, true)
    const read = name => { const bytes = files.get(name); assert.ok(Buffer.isBuffer(bytes), `Missing Tornado image ${name}`); return bytes }
    const black = decodeComposedPng(read(`tornado-${episode.kind}-diagnostic-black.png`), dimensions)
    const white = decodeComposedPng(read(`tornado-${episode.kind}-diagnostic-white.png`), dimensions)
    const actual = pairedOracle(black, white, originalPairs(pixels[selected.frame], fixture.paletteTints[selected.palette]))
    assert.ok(actual.visible > 20 && actual.fractional > 0 && actual.transparent > 0)
    assert.equal(actual.mismatches, 0, 'Retained diagnostic pixels disagree with original palette/alpha')
    for (const key of Object.keys(actual)) assert.deepEqual(d[key], actual[key], `Retained diagnostic ${key} differs`)
    for (const stage of [...episode.stages.map(row => row.stage), 'restart'])
      decodeComposedPng(read(`tornado-${episode.kind}-${stage}-normal.png`), { width: 1440, height: 1000 })
    if (episode.kind === 'land') assert.deepEqual(episode.exactDeletion, { empty: true, removed: true, disposed: 16 })
    assert.deepEqual(episode.cleanup, { differentScene: true, disposed: 16, oldSceneDisposed: true, remainingColumns: 0 })
  }
  return true
}
