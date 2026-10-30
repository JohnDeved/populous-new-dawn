import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const hash = value => createHash('sha256').update(value).digest('hex')
const metadata = JSON.parse(read('app/original-building-icons.json'))
const native = JSON.parse(read('tests/fixtures/native-building-hud-layout.json'))
const ids = ['hut', 'tower', 'camp', 'temple', 'spyHut', 'firewarriorHut', 'boatHouse', 'balloonHut']
const expected = [1028, 1029, 1030, 1032, 1033, 1031, 1034, 1035]

test('eight normal icons match independent native descriptor bytes, not placeholder art', () => {
  assert.equal(native.executableSha256, '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f')
  assert.equal(native.descriptorTable, '005cc458')
  assert.deepEqual(native.records.map(record => Buffer.from(record.raw, 'hex').readUInt32LE(37)), expected)
  assert.deepEqual(Object.keys(metadata.icons), ids)
  assert.deepEqual(ids.map(id => metadata.icons[id].id), expected)
  assert.equal(metadata.width, 300)
  assert.equal(metadata.height, 47)
  let x = 0
  for (const id of ids) {
    const icon = metadata.icons[id]
    assert.equal(icon.x, x)
    assert.equal(icon.y, 0)
    assert.ok(icon.w > 0 && icon.h > 0 && icon.h <= metadata.height)
    x += icon.w + 1
  }
  assert.equal(x - 1, metadata.width)
})

test('only icon rendering changes: page handlers, roster and geometry retain exact baseline', () => {
  const page = read('app/page.tsx')
  assert.equal(page.split('<BuildingIcon kind={b.id} />').length, 2)
  const restored = page.replace("import { BuildingIcon } from './building-icon'\n\n", '')
    .replace('<BuildingIcon kind={b.id} />', "<HudSprite\n                    id={b.id === 'hut' ? 1028 : b.id === 'tower' || b.id === 'temple' ? 1029 : 1030}\n                  />")
  assert.equal(hash(restored), '53bb327d57fb4a2ff19c0a073b796f487312da75c4246765b40f837b8eb75b1f')
  assert.equal(hash(read('app/world-rules.ts')), '5688538516b4f908930dbcd46ebb807a958ee3f7edbbcd59e7067d04bf74fd2a')
  assert.equal(hash(read('app/globals.css')), '39b475443ace09ba5cc8895a568ea6d5daf963faa8f9d078860ff8e81bd63026')
})

test('unsupported prison has no fabricated icon or state fallback', () => {
  assert.equal(Object.hasOwn(metadata.icons, 'prison'), false)
  const component = read('app/building-icon.tsx')
  assert.match(component, /if \(!\(kind in original\.icons\)\) return null/)
  assert.match(component, /url\('\/original\/building-icons\.png'\)/)
  assert.doesNotMatch(component, /world\.mode|onMouse|onClick|\?\?|original\.icons\.(hut|camp|tower)/)
})
