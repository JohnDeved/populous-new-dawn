import { initializeLivePanic } from '../app/live-people.ts'
import assert from 'node:assert/strict'
import test from 'node:test'
import fixture from './fixtures/blast-wave.json' with { type: 'json' }
import manifest from '../decomp/exports.json' with { type: 'json' }
import { damagePerson } from '../app/person-update.ts'
import { stepBlastWave } from '../app/blast-wave.ts'
import { createWorld, addUnit, cast, tick, command, nativePosition, findPath } from '../app/model.ts'
import { terrainPointHeight } from '../app/native-terrain.ts'

test('original Blast indexed visits, alliances, repeated impulses and damage gates', () => {
  assert.equal(fixture.executableSha256, manifest.executableSha256)
  fixture.cases.forEach((input, i) => {
    const c = structuredClone(input), search = new Uint8Array(192)
    const land = { heights: Int16Array.from(fixture.land.heights), flags: Uint32Array.from(fixture.land.flags), buildingIds: new Uint16Array(16384) }
    const w = { randomState: c.seed, search, land, alliances: c.alliances, special: c.special }
    const records = c.records, map = new Map(records.map(p => [p.id, p])), cells = new Map(c.cells.map(c => [c.index, c])), events = []
    for (const cell of c.cells) { land.buildingIds[cell.index] = cell.building; if (cell.building) land.flags[cell.index] |= 512 }
    const effects = Object.fromEntries(['panic', 'animation', 'damage', 'buildingDamage', 'vehicleDamage', 'remove'].map(k => [k, (p, n) => events.push(n === undefined ? [k, p.id] : [k, p.id, n])]))
    const alive = stepBlastWave(w, c.wave, { cell: i => (cells.get(i)?.people ?? []).map(id => map.get(id)), building: id => map.get(id) }, effects)
    assert.deepEqual({ records, events, alive, radius: c.wave.radius, remaining: c.wave.remaining, applied: c.wave.applied, randomState: w.randomState, search: [...search] }, fixture.expected[i], `native case ${i}`)
  })
})

function flatWorld() {
  const w = createWorld()
  w.manaWorld.gameFlags = 32
  w.units = []; w.buildings = []; w.trees = []; w.shrines = []
  w.terrain.fill(3); w.terrainVersion++
  const shaman = addUnit(w, 'blue', 'shaman', { x: -4, z: 0 })
  findPath(w, shaman, {x: 0, z: 0})
  return {w, shaman}
}

test('live Blast delays allied launch, retains native flight height and restores commands after landing', () => {
  const {w, shaman} = flatWorld()
  const ally = addUnit(w, 'blue', 'brave', { x: 1, z: -1 })
  assert.ok(cast(w, 'blast', { x: 0, z: 0 }))
  while (w.projectiles.length) tick(w, 1/12)
  const wave = w.effects.find(f => f.wave)
  assert.ok(wave); assert.equal(wave.wave.remaining, 3)
  for(let i=0;i<2;i++) { tick(w,1/12); assert.equal(ally.flight, undefined) }
  const hp = ally.hp
  tick(w,1/12)
  assert.ok(ally.flight); assert.equal(ally.hp, hp)
  assert.equal(shaman.flight, undefined)
  assert.ok(!w.effects.includes(wave))
  let rising = false, falling = false, old = ally.flight.h
  for (let i=0;i<160 && ally.flight;i++) {
    assert.equal(nativePosition(w, ally).x & 65535, ally.flight.x)
    assert.equal(nativePosition(w, ally).y & 65535, ally.flight.y)
    tick(w,1/12)
    if (ally.flight) {
      rising ||= ally.flight.h > old
      falling ||= ally.flight.h < old
      assert.ok(ally.flight.h >= terrainPointHeight(w.land, ally.flight))
      old = ally.flight.h
    }
  }
  assert.ok(rising && falling); assert.equal(ally.flight, undefined); assert.equal(ally.lift, 0)
  assert.ok(w.units.includes(ally) && ally.hp > 0)
  w.selected = [ally.id]; command(w, {x: ally.x + 3, z: ally.z})
  assert.ok(ally.path.length, 'landed followers accept ordinary orders')
})

test('Blast and landing damage share original shields, protection, attacker and life wrapping', () => {
  fixture.damageCases.forEach((input, i) => {
    const c = structuredClone(input)
    damagePerson(c.p, c.levelFlags2, c.attacker, c.amount, c.mode)
    assert.deepEqual(c.p, fixture.damageExpected[i])
  })
})

test('wild followers land into their original state 8 without losing the unit', () => {
  const {w} = flatWorld()
  const wild = addUnit(w, 'wild', 'brave', { x: 1, z: -1 })
  assert.ok(cast(w, 'blast', {x:0,z:0}))
  while(w.projectiles.length) tick(w,1/12)
  for(let i=0;i<3;i++)tick(w,1/12)
  const person = wild.flight
  assert.ok(person); assert.equal(person.model,1); assert.equal(person.tribe,-1)
  for(let i=0;i<160 && wild.flight;i++)tick(w,1/12)
  assert.equal(wild.flight,undefined); assert.equal(person.state,8)
  assert.ok(w.units.includes(wild) && wild.hp>0)
})

test('a burning airborne follower keeps one panic clock and releases its native pose after landing', () => {
  const { w } = flatWorld()
  const ally = addUnit(w, 'blue', 'brave', { x: 1, z: -1 })
  assert.ok(cast(w, 'blast', { x: 0, z: 0 }))
  for (let i = 0; i < 100 && !ally.flight; i++) tick(w, 1 / 12)
  const p = ally.flight
  assert.ok(p)
  initializeLivePanic(w, ally)
  assert.equal(ally.native, p)
  assert.equal(p.timer, 64)
  tick(w, 1 / 12)
  assert.equal(p.timer, 63)
  for (let i = 0; i < 160 && ally.flight; i++) tick(w, 1 / 12)
  assert.equal(ally.flight, undefined)
  assert.equal(ally.native, null, 'ordinary commands regain their animation source after settling')
  assert.ok(ally.hp > 0)
  w.selected = [ally.id]
  command(w, { x: ally.x + 3, z: ally.z })
  assert.ok(ally.path.length)
})
