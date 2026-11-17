import assert from 'node:assert/strict'
import test from 'node:test'
import { isDeepStrictEqual } from 'node:util'
import { createStartedWorld, retainFixtureUnits } from './level-start-fixture.mjs'
import { addUnit, nativePosition, tick } from '../app/model.ts'
import { createLivePerson, syncLivePersonCells } from '../app/live-people.ts'
import { callToArms } from '../app/live-building-combat.ts'
import { currentPersonOrder } from '../app/person-orders.ts'

// Supplied player ownership / defender / hostile conditions around an authored
// M2 tower. This checks the adapter against real simulation, not natural play.
function setup() {
  const w = createStartedWorld(2), tower = w.buildings.find(b => b.team === 'green' && b.kind === 'tower')
  for (let i = 0; i < 200 && !w.units.some(u => u.inside === tower.id); i++) tick(w, 1 / 12)
  assert.ok(w.units.some(u => u.inside === tower.id), 'authored tower has an occupant')
  const defender = addUnit(w, 'green', 'warrior', { x: tower.x + 2, z: tower.z })
  const hostile = addUnit(w, 'blue', 'shaman', { x: tower.x + 1, z: tower.z })
  defender.native = createLivePerson(w, defender); defender.native.state = 17
  hostile.native = createLivePerson(w, hostile); hostile.native.state = 17
  syncLivePersonCells(w)
  const p = nativePosition(w, hostile), cell = ((p.y & 65535) >> 9) * 128 + ((p.x & 65535) >> 9)
  w.land.categories[cell] = 3
  w.manaWorld.playerTribe = 3; w.paused = false; w.inputMask = 0; w.land.landFlags &= ~0x802
  return { w, defender, tower, cell }
}
const order = ({ w, defender }) => currentPersonOrder(w.buildingOrders, defender.native)

test('B adapter reaches existing model-19 counterattack for player tribe without requiring selection', () => {
  const k = setup(); k.w.selected = []; k.w.mode = 'hut'; callToArms(k.w)
  assert.equal(order(k)?.model, 19); assert.deepEqual(k.w.selected, []); assert.equal(k.w.mode, 'hut')
})
for (const [name, block] of [
  ['pause', w => { w.paused = true }], ['outcome', w => { w.status = 'won' }],
  ['input mask', w => { w.inputMask = 1 }], ['native pause', w => { w.land.landFlags |= 2 }],
  ['native command drop', w => { w.land.landFlags |= 0x800 }],
]) test(`B adapter preserves whole world under ${name}`, () => {
  const { w } = setup(); block(w); const before = structuredClone(w); callToArms(w)
  assert.ok(isDeepStrictEqual(w, before))
})
test('B adapter does not command a nonplayer tower', () => {
  const k = setup(); k.w.manaWorld.playerTribe = 0; callToArms(k.w); assert.equal(order(k), undefined)
})
test('B adapter preserves existing water-hostile exclusion', () => {
  const k = setup(); k.w.land.categories[k.cell] = 1; callToArms(k.w); assert.equal(order(k), undefined)
})
test('B adapter is a no-op without player towers', () => {
  const w = createStartedWorld(1); w.paused = false; w.inputMask = 0; w.land.landFlags &= ~0x802
  assert.ok(!w.buildings.some(b => b.team === 'blue' && b.kind === 'tower'))
  const before = structuredClone(w); callToArms(w); assert.ok(isDeepStrictEqual(w, before))
})


test('B adapter does not rally a populated tower without hostile people', () => {
  const k = setup()
  retainFixtureUnits(k.w, u => u.team === 'green')
  assert.ok(k.w.units.some(u => u.inside === k.tower.id), 'occupied tower remains')
  assert.ok(k.w.units.includes(k.defender), 'eligible outside defender remains')
  assert.ok(k.w.units.every(u => u.team === 'green'), 'no hostile people remain')
  callToArms(k.w); assert.equal(order(k), undefined)
})
