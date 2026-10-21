import { createCampaignFixtureStore } from './support/campaign-fixture.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createWorld,
  addUnit,
  browserPosition,
  nativePosition,
  selectUnit,
  command,
  cast,
  tick,
  applyHypnotise,
} from '../app/model.ts'
import { hypnotiseTargets } from '../app/spell-effects-runtime.ts'
import { spellTargetError } from '../app/live-command.ts'
import { createLivePerson, syncLivePersonCells } from '../app/live-people.ts'
import { objectsInCell, removeObjectFromCell } from '../app/object-cells.ts'
import { syncLandscapeObjects } from '../app/world-terrain-runtime.ts'

function fixture(points) {
  const w = createWorld()
  w.manaWorld.loadFlags |= 0x200
  w.terrain.fill(3)
  w.terrainVersion++
  w.units = []
  w.buildings = []
  w.trees = []
  w.shrines = []
  syncLandscapeObjects(w)
  const people = points.map(([x, y]) => {
    const u = addUnit(w, 'red', 'brave', browserPosition({ x, y }))
    u.native = createLivePerson(w, u)
    u.native.state = 30
    return u
  })
  syncLivePersonCells(w)
  return { w, people }
}
const aim = browserPosition({ x: 0x2100, y: 0x2100 })
const ids = list => list.map(p => p.id)

test('registered Hypnotise marks nearest six but applies a saved reverse-discovery snapshot', () => {
  const { w, people } = fixture([
    [0x21c0, 0x2100],
    [0x2120, 0x2100],
    [0x2160, 0x2100],
  ])
  const next = w.nextId,
    before = w.randomState
  assert.deepEqual(ids([...objectsInCell(w.objectCells, 0x2020)]), ids(people).reverse())
  const targets = applyHypnotise(w, aim, 'blue')
  assert.deepEqual(
    targets.map(({ u }) => u.id),
    ids(people)
  )
  assert.deepEqual(
    w.units.toSorted((a, b) => a.id - b.id).map(u => [u.id, u.x, u.z]),
    people.map((u, i) => [next + i, u.x, u.z])
  )
  assert.equal(w.randomState, before)
  for (const p of people) assert.ok(!w.objectCells.objects.has(p.id))
  for (const u of w.units) assert.equal(w.objectCells.objects.get(u.id), u.native)
})

test('a supplied ghost callback cannot replace or extend the saved recipient snapshot', () => {
  const { w, people } = fixture([
    [0x21c0, 0x2100],
    [0x2120, 0x2100],
    [0x2160, 0x2100],
  ])
  people[0].native.flags4 |= 0x800
  const next = w.nextId
  assert.deepEqual(
    applyHypnotise(w, aim, 'blue').map(({ u }) => u.id),
    ids(people)
  )
  assert.equal(w.nextId, next + 2)
  assert.deepEqual(
    w.units.toSorted((a, b) => a.id - b.id).map(u => [u.x, u.z]),
    people.slice(1).map(u => [u.x, u.z])
  )
  for (const u of people) assert.ok(!w.objectCells.objects.has(u.id))
  for (const u of w.units) assert.equal(w.objectCells.objects.get(u.id), u.native)
})

test('registered equal-distance cap follows native ties independent of roster order', () => {
  const { w, people } = fixture(Array.from({ length: 7 }, () => [0x2100, 0x2100]))
  w.units.reverse()
  const targets = applyHypnotise(w, aim, 'blue')
  assert.deepEqual(
    targets.map(({ u }) => u.id),
    ids(people.slice(0, 6))
  )
  assert.ok(w.units.includes(people[6]))
})

test('unregistered or mismatched candidates keep the entire legacy fallback', () => {
  for (const boundary of ['unregistered', 'alias', 'position', 'tribe', 'model', 'duplicate']) {
    const { w, people } = fixture([
      [0x21c0, 0x2100],
      [0x2120, 0x2100],
      [0x2160, 0x2100],
    ])
    if (boundary === 'unregistered') {
      removeObjectFromCell(w.objectCells, people[0].native)
      w.objectCells.objects.delete(people[0].id)
    } else if (boundary === 'alias') people[0].native = structuredClone(people[0].native)
    else if (boundary === 'position') people[0].x += 1 / 256
    else if (boundary === 'tribe') people[0].native.tribe = 2
    else if (boundary === 'model') people[0].native.model = 3
    else w.units.push(people[0])
    // Malformed aliases exercise selection only: legacy deletion does not own
    // stale copied cell links. Selection must not mutate this supplied state.
    const before = structuredClone(w),
      targets = hypnotiseTargets(w, aim, 'blue')
    assert.deepEqual(w, before)
    assert.deepEqual(
      targets.map(({ u }) => u.id),
      boundary === 'duplicate'
        ? [people[1].id, people[2].id, people[0].id, people[0].id]
        : [people[1].id, people[2].id, people[0].id],
      boundary
    )
  }
})

test('earned M22 Hypnotise binds replacement allocation to actual cell callback order', async () => {
  const store = await createCampaignFixtureStore([22])
  assert.equal(store.startMission(22), true)
  const w = store.getWorld(),
    s = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
  // Existing focus adapter only. Mana, spell stock and actors are not supplied.
  w.manaWorld.spells[0].disabled = 0xffffffff & ~(1 << 6)
  for (let n = 0; n < 6100 && !w.shots.hypnotise && s.hp > 0; n++) tick(w, 1 / 12)
  assert.equal(w.turn, 5948)
  assert.equal(w.shots.hypnotise, 1)
  for (const goal of [
    { x: 0, z: -45 },
    { x: 20, z: -45 },
  ]) {
    selectUnit(w, s.id)
    assert.ok(command(w, goal))
    for (let n = 0; n < 1000 && Math.hypot(s.x - goal.x, s.z - goal.z) >= 2 && s.hp > 0; n++)
      tick(w, 1 / 12)
    assert.ok(Math.hypot(s.x - goal.x, s.z - goal.z) < 2)
  }
  const target = { x: 15, z: -31 }
  selectUnit(w, s.id)
  assert.ok(command(w, { x: 20, z: -41 }))
  for (let n = 0; n < 100 && spellTargetError(w, 'hypnotise', target); n++) tick(w, 1 / 12)
  assert.equal(w.turn, 6172)
  assert.equal(spellTargetError(w, 'hypnotise', target), null)
  assert.ok(cast(w, 'hypnotise', target))
  assert.equal(w.shots.hypnotise, 0)
  for (
    let n = 0;
    n < 45 && !w.effects.some(f => f.kind === 'hypnotise' && f.turnsRemaining === 12);
    n++
  )
    tick(w, 1 / 12)
  const effect = w.effects.find(f => f.kind === 'hypnotise'),
    center = nativePosition(w, effect)
  assert.deepEqual([center.x, center.y], [5888, 5888])
  assert.equal(w.turn, 6185)
  assert.equal(effect.sprite.sequence, 'hypnotise')
  assert.equal(effect.animation.draw, 44)
  assert.equal(effect.animation.object, 1264)
  assert.ok(w.sounds.some(s => s.cue === 0x2a && s.x === effect.x && s.z === effect.z))
  const discovered = []
  for (const dy of [-2, 0, 2])
    for (const dx of [-2, 0, 2])
      for (const p of objectsInCell(
        w.objectCells,
        ((((center.x >>> 8) & 254) + dx) & 254) | (((((center.y >>> 8) & 254) + dy) & 254) << 8)
      ))
        if (p.class === 1 && p.tribe !== 0 && ![1, 7, 8].includes(p.model) && !(p.flags4 & 0x1000))
          discovered.push(p)
  assert.deepEqual(ids(discovered), [97, 98])
  const old = [...discovered].reverse().map(p => {
      const u = w.units.find(u => u.id === p.id)
      assert.equal(u.native, p)
      assert.equal(w.objectCells.objects.get(u.id), p)
      return { id: u.id, x: u.x, z: u.z, hp: u.hp, cargo: u.cargo }
    }),
    next = w.nextId
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  const restored = store.getWorld()
  // Existing shrine reward defaults are normalized only in comparison copies.
  const comparable = world => {
    const copy = structuredClone(world)
    for (const i of [0, 2]) copy.shrines[i].reward ??= 'mana'
    return copy
  }
  assert.deepEqual(comparable(restored), comparable(w))
  tick(w, 1 / 12)
  tick(restored, 1 / 12)
  assert.deepEqual(comparable(restored), comparable(w))
  const converted = w.units
    .filter(u => u.id >= next && u.hypnotise?.originalTeam === 'red')
    .toSorted((a, b) => a.id - b.id)
  assert.equal(converted.length, 2)
  assert.deepEqual(
    converted.map(u => [u.x, u.z, u.hp, u.cargo]),
    old.map(u => [u.x, u.z, u.hp, u.cargo])
  )
  for (const u of old) {
    assert.ok(!w.units.some(p => p.id === u.id))
    assert.ok(!w.objectCells.objects.has(u.id))
  }
  for (const u of converted) {
    assert.equal(w.objectCells.objects.get(u.id), u.native)
    assert.ok(u.native.flags4 & 0x4000)
  }
  for (let n = 0; n < 120; n++) {
    tick(w, 1 / 12)
    tick(restored, 1 / 12)
    assert.deepEqual(comparable(restored), comparable(w))
  }
})
