import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash } from 'node:crypto'
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { inflateSync } from 'node:zlib'
import art from '../app/original-tower-acquisition.json' with { type: 'json' }
import models from '../app/original-models.json' with { type: 'json' }

const hash = value => createHash('sha256').update(value).digest('hex')
const read = path => readFileSync(new URL(`../${path}`, import.meta.url))
function png(name) {
  const input = read(`public/original/${name}.png`),
    blocks = [],
    width = input.readUInt32BE(16),
    height = input.readUInt32BE(20)
  assert.equal(input.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  for (let at = 8; at < input.length;) {
    const size = input.readUInt32BE(at)
    if (input.toString('ascii', at + 4, at + 8) === 'IDAT')
      blocks.push(input.subarray(at + 8, at + 8 + size))
    at += size + 12
  }
  const raw = inflateSync(Buffer.concat(blocks)),
    stride = width * 4 + 1,
    pixels = Buffer.alloc(width * height * 4)
  assert.equal(raw.length, stride * height)
  for (let y = 0; y < height; y++) {
    assert.equal(raw[y * stride], 0)
    raw.copy(pixels, y * width * 4, y * stride + 1, (y + 1) * stride)
  }
  return { width, height, pixels }
}
const crop = (image, tile) => Buffer.concat(Array.from({ length: 32 }, (_, row) => {
  const start = ((Math.floor(tile / 8) * 32 + row) * image.width + tile % 8 * 32) * 4
  return image.pixels.subarray(start, start + 128)
}))

test('Tower metadata binds only the original model-79 material subset', () => {
  assert.deepEqual([art.mission, art.landscapeBank, art.buildingModel, art.model], [4, 13, 4, 79])
  assert.deepEqual(art.changedTiles, [127])
  assert.equal(art.modelAtlas, 'tower-model-d')
  assert.deepEqual(art.tiles.map(row => row.tile), [12, 24, 26, 109, 127, 143, 154, 183, 186, 214, 226])
  assert.deepEqual([...new Set(models[79].tiles)].sort((a, b) => a - b), art.tiles.map(row => row.tile))
  assert.deepEqual(art.sha256, {
    'bl320-d.dat': '26fbee4d3cb590462e1ef3c9afe1964283f1b662e8c58057ed8f2cbf324b2a05',
    'pal0-d.dat': 'baadb5c8fb8a31d64835db3ddccf85857d11f3cdc8f67e3ae233b4d919967a4f',
    'al0-d.dat': '853e30988ccffe1d5961888d05f05e7b4c215dba91075fe92f3a4305eaa62489',
  })
  assert.deepEqual(Object.keys(art.sourceFilesSha256), [
    'scripts/import-original.py', 'app/original-rules.json',
    'app/original-models.json', 'public/original/atlas.png',
  ])
  for (const [path, expected] of Object.entries(art.sourceFilesSha256))
    assert.equal(hash(read(path)), expected, path)
})

test('bank-d tile 127 matches the independently decoded original crop', () => {
  const c = png('atlas'), d = png(art.modelAtlas)
  assert.deepEqual([d.width, d.height], [256, 1024])
  assert.equal(hash(d.pixels), art.modelRgbaSha256)
  assert.equal(hash(crop(c, 127)), '4a88ac1aba3125bdab7461c18e5a0ca95aef1549721ac9b3f603fd931087804e')
  assert.equal(hash(crop(d, 127)), '01879cff1ef259d99275fc6154efa4d1bdd83a0880c0cac38bbefc67fe01892f')
  for (const row of art.tiles) {
    assert.equal(hash(crop(c, row.tile)), row.cRgbaSha256)
    assert.equal(hash(crop(d, row.tile)), row.dRgbaSha256)
  }
})

test('dedicated Tower atlas changes only five pixels in tile 127 and preserves all alpha', () => {
  const c = png('atlas'), d = png(art.modelAtlas)
  let changed = 0
  for (let at = 0; at < c.pixels.length; at += 4) {
    assert.equal(d.pixels[at + 3], c.pixels[at + 3])
    if (!c.pixels.subarray(at, at + 4).equals(d.pixels.subarray(at, at + 4))) {
      const pixel = at / 4, x = pixel % c.width, y = Math.floor(pixel / c.width)
      assert.equal(Math.floor(y / 32) * 8 + Math.floor(x / 32), 127)
      changed++
    }
  }
  assert.equal(changed, 5)
  for (let tile = 0; tile < 256; tile++)
    if (tile !== 127) assert.deepEqual(crop(d, tile), crop(c, tile), `unchanged tile ${tile}`)
})

test('generated ownership names the exact Tower producer without replacing existing owners', () => {
  const owners = JSON.parse(read('engineering/generated-files.json')).owners,
    owner = owners.find(row => row.id === 'imported-runtime-data')
  assert.ok(owner.callers.includes('scripts/import-tower-acquisition.py'))
  for (const path of ['app/original-tower-acquisition.json', 'public/original/tower-model-d.png'])
    assert.deepEqual(owner.outputs.find(row => row.path === path), {
      path, type: 'file', tracked: true, protected: true, producer: 'scripts/import-tower-acquisition.py',
    })
})

test('missing or corrupt input fails before either generated output is replaced', () => {
  const root = mkdtempSync(join(tmpdir(), 'pnd-tower-import-')),
    project = join(root, 'project'), source = join(root, 'data'),
    script = fileURLToPath(new URL('../scripts/import-tower-acquisition.py', import.meta.url)),
    outputs = ['app/original-tower-acquisition.json', 'public/original/tower-model-d.png']
  try {
    mkdirSync(source)
    for (const path of [...Object.keys(art.sourceFilesSha256), ...outputs]) {
      const target = join(project, path)
      mkdirSync(dirname(target), { recursive: true })
      writeFileSync(target, outputs.includes(path) ? 'preserve this output' : read(path))
    }
    const run = optimize => spawnSync('python3', [
      '-I', '-B', ...(optimize ? ['-O'] : []), script, '--project', project, '--source', source,
    ], { encoding: 'utf8', timeout: 10000 })
    for (const optimize of [false, true]) {
      const missing = run(optimize)
      assert.equal(missing.status, 1, missing.stderr)
      assert.match(missing.stderr, /FileNotFoundError/)
      writeFileSync(join(source, 'bl320-d.dat'), 'unverified data')
      const corrupt = run(optimize)
      assert.equal(corrupt.status, 1, corrupt.stderr)
      assert.match(corrupt.stderr, /Input hash mismatch/)
      rmSync(join(source, 'bl320-d.dat'))
      for (const path of outputs) assert.equal(readFileSync(join(project, path), 'utf8'), 'preserve this output')
    }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
