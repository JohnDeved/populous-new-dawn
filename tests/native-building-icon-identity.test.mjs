import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { BUILDINGS } from '../app/world-rules.ts'
import { buildingModel } from '../app/building-shapes.ts'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const metadata = JSON.parse(read('app/original-building-icons.json'))
const native = JSON.parse(read('tests/fixtures/native-building-hud-layout.json'))
const ids = ['hut', 'tower', 'camp', 'temple', 'spyHut', 'firewarriorHut', 'boatHouse', 'balloonHut']
const expected = [1028, 1029, 1030, 1032, 1033, 1031, 1034, 1035]

test('eight normal icons match independent native descriptor bytes, not placeholder art', () => {
  assert.equal(native.executableSha256, '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f')
  assert.equal(native.descriptorTable, '005cc458')
  assert.deepEqual(native.records.map(record => Buffer.from(record.raw, 'hex').readUInt32LE(37)), expected)
  const keys = native.records.map(record => Buffer.from(record.raw, 'hex').readUInt32LE(55))
  assert.deepEqual(keys, [1, 4, 7, 5, 6, 8, 13, 15])
  assert.deepEqual(BUILDINGS.map(building => building.id), ids)
  assert.deepEqual(BUILDINGS.map(building => buildingModel({ kind: building.id, level: 1 })), keys)
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

// The full Page/world-rules/CSS hashes were a one-time #838 patch audit.
// Later reviewed owners legitimately change those files. Exercise the current
// palette's identity, availability and mode callback instead of freezing them.
function assertPalette(page) {
  assert.equal(page.split("import { BuildingIcon } from './building-icon'").length, 2)
  const start = page.indexOf('{BUILDINGS.map(b => (')
  const end = page.indexOf("{tab === 'followers'", start)
  assert.ok(start >= 0 && end > start)
  const card = page.slice(start, end)
  assert.equal(card.split('<BuildingIcon kind={b.id} />').length, 2)
  assert.doesNotMatch(card, /<HudSprite\b/)
  const disabled = card.match(/disabled=\{([\s\S]*?)\n\s*\}\s+className=/)
  const pressed = card.match(/aria-pressed=\{([^\n]+)\}/)
  const click = card.match(/onClick=\{\(\) =>\s*store\.change\(w => \{([\s\S]*?)\}\)/)
  assert.ok(disabled && pressed && click, 'current palette owners are present')
  const isDisabled = new Function('b', 'world', `return (${disabled[1]})`)
  const isPressed = new Function('b', 'world', `return (${pressed[1]})`)
  const select = new Function('b', 'w', click[1])
  const unlock = { tower: 'unlockedTower', camp: 'unlockedCamp', temple: 'unlockedTemple',
    spyHut: 'unlockedSpyHut', firewarriorHut: 'unlockedFirewarriorHut',
    boatHouse: 'unlockedBoatHouse', balloonHut: 'unlockedBalloonHut' }
  for (const building of BUILDINGS) {
    const world = Object.fromEntries(Object.values(unlock).map(key => [key, false]))
    assert.equal(isDisabled(building, world), building.id !== 'hut')
    if (unlock[building.id]) world[unlock[building.id]] = true
    assert.equal(isDisabled(building, world), false)
    for (const mode of [null, building.id, 'blast']) {
      assert.equal(isPressed(building, { mode }), mode === building.id)
      const current = { mode }
      select(building, current)
      assert.equal(current.mode, mode === building.id ? null : building.id)
    }
  }
}

test('current building palette retains native icon identity, availability and mode selection', () => {
  const page = read('app/page.tsx')
  assertPalette(page)
  for (const [before, after] of [
    ['<BuildingIcon kind={b.id} />', '<BuildingIcon kind="hut" />'],
    ['aria-pressed={world.mode === b.id}', "aria-pressed={world.mode === 'hut'}"],
    ['w.mode = w.mode === b.id ? null : b.id', 'w.mode = null'],
    ["(b.id === 'tower' && !world.unlockedTower)", 'false'],
  ]) {
    assert.equal(page.split(before).length, 2, 'negative control targets one current owner')
    assert.throws(() => assertPalette(page.replace(before, after)))
  }
})

test('unsupported prison has no fabricated icon or state fallback', () => {
  assert.equal(Object.hasOwn(metadata.icons, 'prison'), false)
  const component = read('app/building-icon.tsx')
  assert.match(component, /if \(!\(kind in original\.icons\)\) return null/)
  assert.match(component, /url\('\/original\/building-icons\.png'\)/)
  assert.doesNotMatch(component, /world\.mode|onMouse|onClick|\?\?|original\.icons\.(hut|camp|tower)/)
})
