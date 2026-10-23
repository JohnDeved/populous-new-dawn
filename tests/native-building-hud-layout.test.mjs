import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { BUILDINGS } from '../app/world-rules.ts'
import { buildingModel } from '../app/building-shapes.ts'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const source = JSON.parse(read('tests/fixtures/native-building-hud-layout.json'))
const css = read('app/globals.css')
const page = read('app/page.tsx')
const rules = read('app/world-rules.ts')
const ids = ['hut', 'tower', 'camp', 'temple', 'spyHut', 'firewarriorHut', 'boatHouse', 'balloonHut']
const keys = [1, 4, 7, 5, 6, 8, 13, 15]
const literals = [
  [2, 206, 48, 258], [48, 206, 94, 258],
  [2, 260, 48, 312], [48, 260, 94, 312],
  [2, 314, 48, 366], [48, 314, 94, 366],
  [2, 368, 48, 420], [48, 368, 94, 420],
]
// Oracle is decoded raw native data, never app/hud-layout or candidate CSS.
const normalize = (value, extent) => Math.trunc(value * 65536 / extent)
const xPixel = value => Math.floor(value * 640 / 65536)
const yPixel = value => Math.floor((value * 480 + 240) / 65536)
const native = source.records.map(record => {
  const data = Buffer.from(record.raw, 'hex')
  const x = data.readInt16LE(25), y = data.readInt16LE(27)
  const width = data.readInt16LE(33), height = data.readInt16LE(35)
  const nx = normalize(source.rootLogical[0], 640) + normalize(x, 640)
  const ny = normalize(source.rootLogical[1], 480) + normalize(y, 480)
  return { key: data.readUInt32LE(55), draw: [x, y],
    hit: [data.readInt16LE(29), data.readInt16LE(31)],
    size: [width, height], bounds: [xPixel(nx), yPixel(ny),
      xPixel(nx + normalize(width, 640)), yPixel(ny + normalize(height, 480))] }
})
const declarations = selector => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const found = [...css.matchAll(new RegExp(`${escaped}\\{([^}]+)\\}`, 'g'))]
  assert.ok(found.length, `CSS selector ${selector}`)
  return Object.fromEntries(found.flatMap(match => match[1].split(';').filter(Boolean).map(value => value.split(':'))))
}
const px = value => { if (value === '0') return 0; assert.match(value, /^-?\d+px$/); return Number(value.slice(0, -2)) }

test('eight fixed building slots use independently decoded native descriptor geometry', () => {
  assert.equal(source.executableSha256, '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f')
  assert.equal(source.descriptorTable, '005cc458')
  assert.deepEqual(native.map(value => value.key), keys)
  assert.deepEqual(native.map(value => value.bounds), literals)
  for (const record of native) {
    assert.deepEqual(record.hit, record.draw)
    assert.deepEqual(record.size, [46, 52])
  }
  const root = declarations('.command-dock'), list = declarations('.building-list')
  const card = declarations('.building-card')
  assert.equal(root.left, '0', 'existing command-root CSS uses valid unitless zero')
  assert.equal(px('0'), 0)
  assert.equal(px('0px'), 0)
  assert.equal(px('2px'), 2)
  assert.equal(px('-2px'), -2)
  for (const invalid of ['1', '-1', '00', '', 'auto', '2em', '2px garbage'])
    assert.throws(() => px(invalid), `reject unsupported CSS length ${JSON.stringify(invalid)}`)
  assert.equal(list.position, 'absolute')
  assert.equal(list['grid-template-columns'], 'repeat(2,46px)')
  assert.equal(list['column-gap'], '0')
  assert.equal(px(list.width), 92)
  const left = px(root.left) + px(list.left), top = px(root.top) + px(list.top)
  const height = px(card.height), stride = height + px(list['row-gap'])
  const actual = ids.map((_, i) => {
    const x = left + (i % 2) * 46, y = top + Math.floor(i / 2) * stride
    return [x, y, x + 46, y + height]
  })
  assert.deepEqual(actual, native.map(value => value.bounds))
})

test('live palette retains all eight fixed-order controls and lock predicates', () => {
  const roster = rules.slice(rules.indexOf('export const BUILDINGS:'), rules.indexOf('export const SIZE'))
  assert.deepEqual([...roster.matchAll(/id: '([^']+)'/g)].map(match => match[1]), ids)
  const palette = page.slice(page.indexOf("{tab === 'buildings'"), page.indexOf("{tab === 'followers'", page.indexOf("{tab === 'buildings'")))
  assert.match(palette, /BUILDINGS\.map\(b =>/)
  assert.doesNotMatch(palette, /\.filter\(/)
  assert.match(palette, /w\.mode = w\.mode === b\.id \? null : b\.id/)
  for (const [id, unlock] of [['tower', 'Tower'], ['camp', 'Camp'], ['temple', 'Temple'],
    ['spyHut', 'SpyHut'], ['firewarriorHut', 'FirewarriorHut'], ['boatHouse', 'BoatHouse'], ['balloonHut', 'BalloonHut']])
    assert.ok(palette.includes(`(b.id === '${id}' && !world.unlocked${unlock})`), `${id} lock remains`)
})


test('building-only inset focus preserves inherited white 2px ring without box changes', () => {
  assert.deepEqual(declarations('.building-card:focus-visible'), { 'outline-offset': '-2px' })
  assert.match(css, /button:focus-visible,a:focus-visible,summary:focus-visible,input:focus-visible,select:focus-visible\{outline:2px solid white;outline-offset:1px\}/)
  assert.equal(declarations('.building-card').height, '52px')
})

test('live model mapping matches the eight independent native keys', () => {
  assert.deepEqual(BUILDINGS.map(b => b.id), ids)
  assert.deepEqual(BUILDINGS.map(b => buildingModel({ kind: b.id, level: 1 })), keys)
})

test('live model barrel still exposes the tested source modules', () => {
  const model = read('app/model.ts')
  assert.match(model, /export\s*\{[^}]*\bBUILDINGS\b[^}]*\}\s*from '\.\/world-rules\.ts'/s)
  assert.match(model, /export \{ buildingModel \} from '\.\/building-shapes\.ts'/)
})
