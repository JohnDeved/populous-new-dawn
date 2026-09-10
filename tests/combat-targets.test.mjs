import assert from 'node:assert/strict'
import test from 'node:test'
import captures from './fixtures/combat-targets.json' with { type: 'json' }
import { detectCombatThreat, selectCombatTarget, stepAttackReservation } from '../app/combat-targets.ts'
import { automaticMeleeTarget } from '../app/live-combat.ts'
import { createWorld, addUnit, addBuilding, tick, syncLandscapeObjects } from '../app/model.ts'

test('mixed target collection, native distance bands, fight admission and reservations replay executable captures', () => {
  for (const capture of captures.cases) {
    const c = structuredClone(capture.input), objects = new Map(c.objects.map(o => [o.id, o])), cells = new Map(c.cells)
    const land = { flags: new Uint32Array(16384), owners: new Uint8Array(16384), categories: new Uint8Array(16384) }
    const buildings = new Map(c.land.map(([i,v]) => [i, objects.get(v.building & 1023)]))
    for (const [i,v] of c.land) { land.flags[i] = v.flags; land.owners[i] = v.owner }
    for (const [i,v] of c.categories) land.categories[i] = v
    const world = { ...c, land, objects, buildingAt: i => buildings.get(i), cellObjects: i => (cells.get(i) ?? []).map(id => objects.get(id)) }
    const threat = detectCombatThreat(world, objects.get(1), c.order, c.checkBuildings, c.force)
    const result = selectCombatTarget(world, objects.get(1), c.order)
    assert.deepEqual({ threat, id: result?.target.id ?? 0, type: result?.type ?? 0,
      reservations: c.objects.map(o => [o.id, o.flags4, o.reactionTimer, o.reactionDuration]) }, capture.expected)
  }
})

function field() {
  const w = createWorld(); w.units = []; w.buildings = []; w.fights = []
  w.terrain.fill(3); w.terrainVersion++; tick(w, 1 / 6); w.turn = 4
  w.land.flags.fill(0); w.land.buildingIds.fill(0); w.land.owners.fill(0)
  return w
}

test('live followers choose closer enemies, distribute reservations, then fall back to a saturated target', () => {
  const w = field(), u = addUnit(w, 'blue', 'warrior', { x: 0, z: 0 })
  const far = addUnit(w, 'red', 'shaman', { x: 3, z: 0 })
  const near = addUnit(w, 'red', 'shaman', { x: 1, z: 0 })
  for (let i = 0; i < 3; i++) assert.equal(automaticMeleeTarget(w, u), near)
  assert.equal(near.attackReservation.flags4, 0x100000)
  for (let i = 0; i < 3; i++) assert.equal(automaticMeleeTarget(w, u), far)
  assert.equal(automaticMeleeTarget(w, u), near, 'saturation is a priority, not a permanent prohibition')
  for (let counter = 0; counter < 8; counter++) stepAttackReservation(near.attackReservation, counter)
  assert.equal(near.attackReservation.flags4, 0)
  assert.equal(automaticMeleeTarget(w, u), near)
  assert.equal(u.native, null, 'query must not take over sprite ownership')
})

test('live mixed scans detect enemy footprints and prefer an eligible person in the same distance band', () => {
  const w = field(), u = addUnit(w, 'blue', 'warrior', { x: 0, z: 0 })
  const b = addBuilding(w, 'red', 'hut', { x: 3, z: 0 }, true)
  syncLandscapeObjects(w)
  assert.equal(automaticMeleeTarget(w, u), b)
  const enemy = addUnit(w, 'red', 'shaman', { x: 1, z: 0 })
  assert.equal(automaticMeleeTarget(w, u), enemy)
  enemy.inside = b.id
  assert.equal(automaticMeleeTarget(w, u), b, 'housed people are detected through their building')
})

test('automatic squads share target capacity independently of render frequency', () => {
  const run = frames => {
    const w = field()
    const units = Array.from({length: 4}, (_,i) => addUnit(w, 'blue', 'warrior', {x: 0, z: i / 20}))
    const near = addUnit(w, 'red', 'shaman', {x: 3, z: 0}), far = addUnit(w, 'red', 'shaman', {x: 5, z: 0})
    for (const dt of frames) tick(w, dt)
    assert.deepEqual(units.map(u => u.target ?? u.fight?.opponent), [near.id, near.id, near.id, far.id])
    return {...w, pendingTime: 0}
  }
  const baseline = run(Array(60).fill(1 / 60))
  for (const fps of [5, 30, 144, 240]) assert.deepEqual(run(Array(fps).fill(1 / fps)), baseline)
  assert.deepEqual(run(Array.from({length: 10}, () => [.01,.09]).flat()), baseline)
})

test('live target priority joins a fight ahead of a solitary enemy in its distance band', () => {
  const w = field(), u = addUnit(w, 'blue', 'warrior', {x:0,z:0})
  addUnit(w, 'red', 'brave', {x:2,z:0})
  const enemy = addUnit(w, 'red', 'warrior', {x:3,z:0}), ally = addUnit(w, 'blue', 'brave', {x:3,z:0})
  const fight = {id:w.nextId++,x:3,z:0,angle:0,members:[enemy.id,ally.id]}
  w.fights.push(fight)
  for (const unit of [enemy,ally]) unit.fight = {group:fight.id,opponent:unit === enemy ? ally.id : enemy.id,action:'ready',started:w.turn}
  assert.equal(automaticMeleeTarget(w,u),enemy)
  assert.equal(fight.attackReservation.reactionTimer,1)
  assert.equal(enemy.attackReservation,undefined,'reserve the group, not an individual member')
})

test('nearby automatic building attacks keep their target between detection visits', () => {
  const w = field(), u = addUnit(w, 'blue', 'warrior', {x:0,z:0})
  const b = addBuilding(w, 'red', 'hut', {x:3,z:0})
  tick(w, 4 / 12)
  assert.equal(u.target,b.id)
  assert.equal(b.attackReservation.reactionTimer,1)
  for (let i = 0; i < 6; i++) tick(w,1 / 12)
  assert.equal(u.target,b.id)
  assert.equal(b.attackReservation.reactionTimer,1,'the standing attack does not repeatedly reserve itself')
  assert.equal(u.fighting,true,'damage visits are not tied to four-turn detection')
})
