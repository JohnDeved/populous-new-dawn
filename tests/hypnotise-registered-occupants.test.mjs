import { createCampaignFixtureStore } from './support/campaign-fixture.mjs'
import { loadHistoricalMission22Occupant } from './helpers/historical-mission22-occupant.mjs'
import assert from 'node:assert/strict'
import test from 'node:test'
import { tick, selectUnit, command, cast, nativePosition } from '../app/model.ts'
import { spellTargetError } from '../app/live-command.ts'
import { hypnotiseTargets, applyHypnotise } from '../app/spell-effects-runtime.ts'
import { objectsInCell, removeObjectFromCell } from '../app/object-cells.ts'

// Ordinary authored staffing and earned spell; only the existing focus-mask
// adapter is supplied. No actors, positions, funds, spell stock or clocks added.
async function prepare() {
  const store = await createCampaignFixtureStore([22])
  assert.equal(store.startMission(22), true)
  const w = store.getWorld(),
    shaman = w.units.find(u => u.id === 89)
  const until = (done, limit) => {
    for (let n = 0; n < limit && !done() && shaman.hp > 0; n++) tick(w, 1 / 12)
    assert.ok(done(), `ordinary route stopped at ${w.turn}`)
  }
  w.manaWorld.spells[0].disabled = 0xffffffff & ~(1 << 6)
  until(() => w.shots.hypnotise > 0, 6100)
  assert.equal(w.turn, 5948)
  const target = w.units.find(u => u.id === 96),
    tower = w.buildings.find(b => b.id === 90)
  assert.equal(target.inside, tower.id)
  for (const goal of [
    { x: 0, z: -45 },
    { x: 20, z: -45 },
  ]) {
    selectUnit(w, shaman.id, false)
    assert.ok(command(w, goal))
    until(() => Math.hypot(shaman.x - goal.x, shaman.z - goal.z) < 2, 1000)
  }
  selectUnit(w, shaman.id, false)
  assert.ok(command(w, { x: 13, z: -31 }))
  until(() => spellTargetError(w, 'hypnotise', target) === null, 300)
  assert.equal(w.turn, 6241)
  assert.ok(cast(w, 'hypnotise', target))
  until(() => w.effects.some(f => f.kind === 'hypnotise' && f.turnsRemaining === 12), 60)
  assert.equal(w.turn, 6255)
  const effect = w.effects.find(f => f.kind === 'hypnotise')
  const center = nativePosition(w, effect)
  assert.deepEqual([center.x, center.y], [4352, 3840])
  return { store, w, target, tower, effect }
}

const comparable = w => {
  const copy = structuredClone(w)
  for (const i of [0, 2]) copy.shrines[i].reward ??= 'mana'
  return copy
}

async function assertRegisteredConversion({ store, w, target, tower, effect }, expected) {
  const old = target.entry.person,
    next = w.nextId,
    position = { x: target.x, z: target.z },
    hp = target.hp
  assert.equal(w.objectCells.objects.get(target.id), old)
  assert.ok(
    [...objectsInCell(w.objectCells, (old.y & 0xfe00) | ((old.x >>> 8) & 254))].includes(old)
  )
  assert.deepEqual(
    hypnotiseTargets(w, effect, 'blue').map(({ u }) => u.id),
    [96]
  )
  assert.equal(tower.admission.inside, 1)

  // Clearly supplied admission exclusions, read-only selection on cloned state.
  for (const boundary of [
    'unlinked',
    'alias',
    'class',
    'deleted',
    'tribe',
    'model',
    'position',
    'friendly',
    'invisible',
  ]) {
    const clone = structuredClone(w),
      u = clone.units.find(u => u.id === target.id),
      p = u.entry.person
    if (boundary === 'unlinked') removeObjectFromCell(clone.objectCells, p)
    else if (boundary === 'alias') clone.objectCells.objects.set(u.id, { ...p })
    else if (boundary === 'class') p.class = 0
    else if (boundary === 'deleted') p.flags2 |= 1
    else if (boundary === 'tribe') p.tribe = 3
    else if (boundary === 'model') p.model = 3
    else if (boundary === 'position') p.x += 512
    else if (boundary === 'friendly') {
      u.team = 'blue'
      p.tribe = 0
    } else p.flags4 |= 0x1000
    const before = structuredClone(clone)
    assert.ok(
      !hypnotiseTargets(clone, effect, 'blue').some(({ u }) => u.id === target.id),
      boundary
    )
    assert.deepEqual(clone, before)
  }
  // Supplied sparse physical ghost slot; release must precede old-object deletion.
  const ghost = structuredClone(w),
    ghostUnit = ghost.units.find(u => u.id === target.id),
    ghostPerson = ghostUnit.entry.person,
    ghostTower = ghost.buildings.find(b => b.id === tower.id),
    ghostNext = ghost.nextId
  ghostPerson.flags4 |= 0x800
  ghostTower.admission.occupants.fill(0)
  ghostTower.admission.occupants[5] = ghostUnit.id
  assert.deepEqual(
    applyHypnotise(ghost, effect, 'blue').map(({ u }) => u.id),
    [96]
  )
  assert.equal(ghost.nextId, ghostNext)
  assert.equal(ghostTower.admission.inside, 0)
  assert.ok(!ghostTower.admission.occupants.includes(ghostUnit.id))
  assert.ok(!ghost.units.includes(ghostUnit))
  assert.ok(!ghost.objectCells.objects.has(ghostUnit.id))

  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  const restored = store.getWorld()
  const step = () => {
    tick(w, 1 / 12)
    tick(restored, 1 / 12)
    assert.deepEqual(comparable(restored), comparable(w))
  }
  step()
  const converted = w.units.find(u => u.id >= next && u.hypnotise?.originalTeam === 'red')
  assert.ok(converted)
  assert.deepEqual(
    [converted.team, converted.kind, converted.hp, converted.inside],
    ['blue', 'firewarrior', hp, null]
  )
  assert.deepEqual({ x: converted.x, z: converted.z }, position)
  assert.equal(converted.hypnotise.remaining, 55)
  assert.equal(w.objectCells.objects.get(converted.id), converted.native)
  assert.ok(converted.native.flags4 & 0x4000)
  assert.ok(!w.units.includes(target))
  assert.ok(!w.objectCells.objects.has(target.id))
  assert.equal(tower.admission.inside, 0)
  assert.ok(!tower.admission.occupants.includes(target.id))
  const convertedOwner = converted.native
  while (w.turn < 6312) step()
  assert.equal(converted.hp, expected.checkpointHp)
  assert.equal(converted.hypnotise.remaining, expected.checkpointRemaining)
  // Preserve the original6323 casualty in the explicit historical case. The
  // fresh route has a separately measured melee ledger and remains alive then.
  if (expected.death === 6331) {
    while (w.turn < 6323) step()
    assert.equal(converted.hp, 9.55)
    assert.equal(converted.hypnotise.remaining, 46)
    assert.equal(converted.team, 'blue')
    assert.equal(w.objectCells.objects.get(converted.id), convertedOwner)
  }
  while (w.turn < expected.death - 1) step()
  assert.equal(converted.hp, expected.beforeDeathHp)
  assert.ok(converted.hp > 0)
  assert.equal(converted.team, 'blue')
  const beforeDeathUnitIds = new Set(w.units.map(u => u.id))
  step()
  assert.equal(w.turn, expected.death)
  assert.equal(converted.hp, 0)
  assert.equal(converted.team, 'red')
  assert.equal(converted.hypnotise, undefined)
  assert.equal(convertedOwner.tribe, 1)
  assert.equal(convertedOwner.flags4 & 0x4000, 0)
  assert.ok(!w.units.includes(converted))
  assert.ok(!w.objectCells.objects.has(converted.id))
  // Natural death restores the retained owner before removal; this route does
  // not exercise expiry or allocate a restored replacement.
  assert.deepEqual(
    w.units.filter(u => !beforeDeathUnitIds.has(u.id)),
    []
  )
  while (w.turn < 6721) step()
  assert.ok(!w.units.includes(converted))
  assert.ok(!w.objectCells.objects.has(converted.id))
}

test('fresh earned Hypnotise retains registered occupant conversion, measured damage and real death through Save/Load', async () => {
  await assertRegisteredConversion(await prepare(), {
    checkpointHp: 16.9, checkpointRemaining: 48, beforeDeathHp: 2.1, death: 6331,
  })
})

test('historical pre-newborn registered occupant retains HP6.15, remaining47 and real death6323 through Save/Load', async () => {
  await assertRegisteredConversion(await loadHistoricalMission22Occupant(), {
    checkpointHp: 6.15, checkpointRemaining: 47, beforeDeathHp: 1.45, death: 6323,
  })
})
