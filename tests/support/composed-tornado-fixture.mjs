// Independent synthetic data. No producer, runtime app or validator is imported.
import { createHash } from 'node:crypto'
import { deflateSync } from 'node:zlib'
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
function chunk(type, data) {
  const result = Buffer.alloc(data.length + 12)
  result.writeUInt32BE(data.length); result.write(type, 4, 'ascii'); data.copy(result, 8)
  let crc = 0xffffffff
  for (const byte of result.subarray(4, -4)) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit++) crc = crc >>> 1 ^ (crc & 1 ? 0xedb88320 : 0)
  }
  result.writeUInt32BE((crc ^ 0xffffffff) >>> 0, result.length - 4)
  return result
}
export function tornadoPng(width, height, pixels) {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 6
  const raw = Buffer.alloc(height * (width * 4 + 1))
  for (let row = 0; row < height; row++) pixels.copy(raw, row * (width * 4 + 1) + 1, row * width * 4, (row + 1) * width * 4)
  return Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}
const widths = [160, 80, 53, 40, 31, 26, 22, 20, 17, 15, 14, 13, 12, 11, 10, 10]
const paletteTints = { '-2': [255,75,22], '-1': [223,155,31], 3: [226,212,72], 4: [147,111,79], 5: [181,206,231] }
const normalPixels = Buffer.alloc(1440 * 1000 * 4, 180)
for (let i = 3; i < normalPixels.length; i += 4) normalPixels[i] = 255
const normalPng = tornadoPng(1440, 1000, normalPixels)
const atlas = Buffer.from([0x89,0x50,0x4e,0x47,0xff,0x80,0,0xc0])
const original = Buffer.alloc(80 * 50 * 4), lookup = Buffer.alloc(1024), psfb = []
lookup.set([100,150,200,128], 4); lookup.set([200,100,50,255], 8)
for (let row = 0; row < 50; row++) {
  original.set([100,150,200,128,200,100,50,255], row * 80 * 4)
  psfb.push(2,1,2,178,0) // Two literal pixels, skip78, terminate row.
}
const nativeFixture = {
  frames: Array.from({ length: 16 }, (_, i) => ({ source: 1136 + i, w: 80, h: 50, rawPSFB: Buffer.from(psfb).toString('base64'), rgbaSHA256: hash(original) })),
  paletteTints, rgbaLookup: lookup.toString('base64'),
}
function readiness() {
  const snapshot = { ready: true, turn: 50, inputMask: 0, selected: [], level: 1, flybyFlags: 0,
    introductionSkipVisible: false, shaman: { id: 10, hp: 100, canOrder: true, selectable: true, state: 0, flags2: 0, flags4: 0, commandStatus: 0 } }
  return { before: structuredClone(snapshot), after: snapshot, samples: 1, publicActions: [] }
}
function graphics() {
  return { devicePixelRatio: 1, rendererPixelRatio: 1, canvas: { width: 8, height: 8, clientWidth: 8, clientHeight: 8 },
    webgl: { vendor: 'Synthetic', renderer: 'Synthetic', version: 'WebGL2', shadingLanguageVersion: 'GLSL',
      drawingBuffer: { width: 8, height: 8 }, contextAttributes: { alpha: true }, contextLost: false,
      debugRendererInfo: { available: false, unmaskedVendor: null, unmaskedRenderer: null } },
    renderer: { outputColorSpace: 'srgb', toneMapping: 0, toneMappingExposure: 1, precision: 'highp', isWebGL2: true } }
}
export function tornadoDiagnosticPixels(kind, background) {
  // Independently calculated original PSFB RGBA × selected tint, alpha-blended.
  const pairs = kind === 'land'
    ? [[29,33,31,156,160,158], [115,44,15,115,44,15]]
    : [[36,61,91,163,188,218], [142,81,45,142,81,45]]
  const pixels = Buffer.alloc(8 * 8 * 4)
  for (let pixel = 0; pixel < 64; pixel++) {
    const pair = pixel < 20 ? pairs[0] : pixel < 40 ? pairs[1] : [0,0,0,255,255,255]
    pixels.set([...pair.slice(background === 'black' ? 0 : 3, background === 'black' ? 3 : 6), 255], pixel * 4)
  }
  return pixels
}
function episode(kind, files) {
  const palette = kind === 'land' ? 4 : 5
  const birth = widths.map((_, ordinal) => ({ ordinal, frame: (16 - ordinal) & 15, scaleX: Math.trunc(512 / (ordinal + 1)), palette, x: 100, y: 200, h: 300 }))
  const stage = (name, ordinals, visits, phase, remaining) => ({ stage: name, phase, remaining, visits, birth: structuredClone(birth),
    view: { scaledSprites: 0, scale: 256, spriteScale: 256 }, disposed: 0, id: 10,
    samples: ordinals.map(ordinal => { const particle = birth[ordinal]; return { ...particle, visible: true, width: widths[ordinal], height: 50,
      uv: [80/2048,50/128,particle.frame*128/2048,1-50/128], source: 1136 + particle.frame, opacity: 1,
      depth: 0, bucket: 1784, center: [Math.trunc(widths[ordinal]/2)/widths[ordinal],0],
      texture: 'http://127.0.0.1:5198/original/tornado.png', minFilter: 1003, magFilter: 1003 } }) })
  const stages = [stage('spawn', widths.map((_, i) => i), 4, 0, 200), stage('active', widths.map((_, i) => i), 64, 0, 140)]
  if (kind === 'land') stages.push(stage('first-tail', widths.slice(1).map((_, i) => i + 1), 205, 1, 23), stage('last-tail', [15], 219, 1, 9))
  for (const name of [...stages.map(s => s.stage), 'restart']) files.set(`tornado-${kind}-${name}-normal.png`, normalPng)
  for (const background of ['black', 'white']) files.set(`tornado-${kind}-diagnostic-${background}.png`, tornadoPng(8, 8, tornadoDiagnosticPixels(kind, background)))
  const pointer = { x: 300, y: 400 }
  return { kind, stages, observedPalettes: [palette], readiness: readiness(), restartReadiness: readiness(),
    target: { x: 8, z: 0, distance: 8, cell: { water: kind === 'water', cliff: 0 }, pointer },
    cast: { before: { mode: 'tornado', targetError: null, canvasHit: true, casts: 2, shots: 3, pointer, picked: { x: 8, z: 0 }, projectiles: [] },
      after: { mode: 'none', casts: 3, shots: 2, pointer, projectiles: [{ id: 12, spell: 'tornado' }] } },
    graphics: graphics(), diagnostic: { ordinal: 0, source: 1136, palette, loadedAtlasSHA256: hash(atlas), transparent: 24, fractional: 20, visible: 40, mismatches: 0, examples: [], cleanup: true },
    ...(kind === 'land' ? { exactDeletion: { empty: true, removed: true, disposed: 16 } } : {}),
    cleanup: { differentScene: true, disposed: 16, oldSceneDisposed: true, remainingColumns: 0 } }
}
export function tornadoEvidenceFixture({ mergeSha = 'a'.repeat(40), browserVersion = '154.0.8037.92' } = {}) {
  const files = new Map()
  const report = { head: mergeSha, status: 'PASS', browserVersion,
    stock: 'Two fresh sessions, one actual F9 Unlock + refill grant and one genuine HUD cast each. Supplied testing stock, not campaign acquisition.',
    limits: 'Land and reachable water targets only; actual observed palettes reported. No terrain/controller/particle injection. Save portability is a separate non-cheat unit gate.',
    budgetMs: 90000, episodes: [episode('land', files), episode('water', files)], elapsedMs: 6000 }
  const { elapsedMs, ...hostReport } = structuredClone(report)
  const sourceBytes = { 'tests/fixtures/tornado-original.json': Buffer.from(JSON.stringify(nativeFixture)), 'public/original/tornado.png': Buffer.from(atlas) }
  return { report, hostReport, mergeSha, browserVersion, files, sourceBytes }
}
