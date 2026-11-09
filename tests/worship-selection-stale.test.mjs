import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'

// Execute the unchanged production selection bodies without importing the world.
// The standing roster is supplied; this does not prove browser hit timing.
function body(path, start, end) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8')
  const from = source.indexOf(`export function ${start}(`)
  const to = end ? source.indexOf(end, from) : source.length
  assert.ok(from >= 0 && to > from, 'Exact source boundaries must exist')
  return stripTypeScriptTypes(source.slice(from, to)).replace('export function', 'function')
}
const mark = body('../app/person-selection.ts', 'markPersonSelected', '// Ordinary on-foot')
const toggle = body('../app/training.ts', 'selectTrainingOccupants', 'export type TrainingWorld')
const selection = body('../app/live-worship.ts', 'selectWorshippers')
function fixture() {
  const people = [
    { id: 11, flags3: 0, flags4: 0, selectionFlags: 0 },
    { id: 12, flags3: 128, flags4: 0, selectionFlags: 128 },
  ]
  const world = { inputMask: 0, land: { landFlags: 0 }, selected: [12, 99], mode: 'blast' }
  const select = new Function(
    'liveWorshippers',
    `${mark}\n${toggle}\n${selection}\nreturn selectWorshippers`
  )(() => people)
  return { people, world, select }
}
for (const group of [false, true]) {
  test(`departed worshipper leaves command and selection untouched (group=${group})`, () => {
    const { people, world, select } = fixture()
    const selected = world.selected
    const before = structuredClone({ people, world })
    select(world, {}, 10, group)
    assert.deepEqual({ people, world }, before)
    assert.equal(world.selected, selected, 'No replacement selection array on rejected click')
  })
}
test('valid single click still selects the worshipper and cancels command mode', () => {
  const { people, world, select } = fixture()
  select(world, {}, 11, false)
  assert.deepEqual(world.selected, [12, 99, 11])
  assert.equal(world.mode, null)
  assert.equal(people[0].selectionFlags & 128, 128)
  assert.equal(people[0].flags3 & 0x10000000, 0x10000000)
})
test('valid group toggle preserves eligible group selection semantics', () => {
  const { people, world, select } = fixture()
  select(world, {}, 12, true)
  assert.deepEqual(world.selected, [99])
  assert.equal(world.mode, null)
  assert.ok(people.every(person => !(person.selectionFlags & 128)))
})
for (const block of ['input', 'land']) {
  test(`${block} mask still rejects an otherwise valid click`, () => {
    const { people, world, select } = fixture()
    if (block === 'input') world.inputMask = 128
    else world.land.landFlags = 0x800
    const before = structuredClone({ people, world })
    select(world, {}, 11, true)
    assert.deepEqual({ people, world }, before)
  })
}
