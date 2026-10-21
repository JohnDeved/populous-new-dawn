import { wrappedDistance } from '../app/world-coordinates.ts'
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  command,
  createWorld,
  placeBuilding,
  select,
  setSelection,
  tick,
} from '../app/model.ts'
import { normalizeHistoricalFixture } from './helpers/historical-checkpoint.ts'
import { campaignAttackTarget } from '../app/campaign-runtime.ts'
import { currentPersonOrder } from '../app/person-orders.ts'

function stepUntil(w, ready, limit) {
  for (let i = 0; i < limit && !ready(); i++) tick(w, 1 / 12)
  assert.ok(ready(), `condition timed out at turn ${w.turn}`)
}

function launchObservedRaid() {
  const w = createWorld(2)
  stepUntil(w, () => w.turn >= 70, 1000)

  select(w, 'brave')
  assert.ok(placeBuilding(w, 'camp', { x: -99, z: -105 }))
  const camp = w.buildings.find(building => building.team === 'blue' && building.kind === 'camp')
  stepUntil(w, () => camp.progress === 1, 3000)
  stepUntil(w, () => !w.units.some(unit => unit.builder), 1000)
  setSelection(
    w,
    w.units
      .filter(unit => unit.team === 'blue' && unit.kind === 'brave' && unit.hp > 0)
      .slice(0, 8)
      .map(unit => unit.id)
  )
  assert.ok(command(w, camp))
  stepUntil(
    w,
    () => w.units.filter(unit => unit.team === 'blue' && unit.kind === 'warrior' && unit.hp > 0).length >= 8,
    15000
  )

  assert.equal(w.ai.tasks.some(task => task.flags & 1 && task.type === 20), false,
    'cohort observation is armed before any raid recruitment')
  let raid = null, target = null, originalMembers = null
  const originalUnits = new Map(), admittedMembers = []
  const registeredOwner = id => {
    const unit = w.units.find(unit => unit.id === id && unit.hp > 0),
      person = w.objectCells.objects.get(id)
    assert.ok(unit && person && person.id === unit.id, 'living original member has a registry owner')
    assert.ok([unit.native, unit.flight, unit.fight?.motion, unit.entry?.person,
      unit.builder?.person].includes(person), 'registry record belongs to the actual Unit')
    return { unit, person }
  }
  // Observe every admitted member from the first recruitment call, including
  // recruitment that begins during the kill-credit setup.
  const observeCohort = () => {
    const active = w.ai.tasks.filter(task => task.flags & 1 && task.type === 20)
    if (!raid && !active.length) return
    assert.equal(active.length, 1, 'no duplicate raid is created')
    if (!raid) {
      raid = active[0]
      target = raid.target
      assert.deepEqual({ requested: raid.requested, mode: raid.mode, entity: raid.entity },
        { requested: 2, mode: 7, entity: camp.id })
      assert.deepEqual(raid.quotas, [0, 100, 0, 0, 0, 0], 'the authored raid requests Warriors first')
    }
    assert.equal(active[0], raid, 'the same task remains active')
    assert.equal(raid.target, target, 'the same camp remains the attack target')
    assert.deepEqual(raid.members.slice(0, admittedMembers.length), admittedMembers,
      'recruitment retains every previously admitted original member')
    for (const id of raid.members) {
      const { unit } = registeredOwner(id)
      if (!originalUnits.has(id)) {
        assert.equal(originalMembers, null, 'no replacement enters the completed original cohort')
        assert.equal(unit.team, 'green')
        // 0x4cb400 tries the Warrior quota, then selector model -1 fills any
        // shortage with eligible non-Shamans. This authored Mission2 troop
        // pool contains Braves and Warriors; the generic selector is broader.
        assert.ok(unit.kind === 'warrior' || unit.kind === 'brave')
        originalUnits.set(id, unit)
        admittedMembers.push(id)
      }
      assert.equal(unit, originalUnits.get(id), 'each original recruited Unit remains alive')
    }
    if (!originalMembers && raid.phase >= 4 && raid.members.length) {
      assert.equal(raid.members.length, 2, 'the original requested cohort is recruited first')
      assert.equal(new Set(raid.members).size, 2)
      originalMembers = [...admittedMembers]
    }
    if (originalMembers)
      assert.deepEqual(raid.members, originalMembers, 'the full recruited cohort remains admitted; no replacement or member loss')
  }
  const observedUntil = (ready, limit) => stepUntil(w, () => { observeCohort(); return ready() }, limit)

  const warriors = () =>
    w.units.filter(unit => unit.team === 'blue' && unit.kind === 'warrior' && unit.hp > 0)
  for (let attempts = 0; w.killCredits[0][3] <= 3 && attempts < 8; attempts++) {
    const target = w.units
      .filter(unit => unit.team === 'green' && unit.kind !== 'shaman' && unit.hp > 0)
      .sort((a, b) => wrappedDistance(a, camp) - wrappedDistance(b, camp))[0]
    assert.ok(target)
    setSelection(w, warriors().map(unit => unit.id))
    assert.ok(command(w, target))
    observedUntil(() => target.hp <= 0 || w.killCredits[0][3] > 3, 10000)
  }
  assert.equal(w.killCredits[0][1], 0)
  assert.ok(w.killCredits[0][3] > 3)

  // Let the authored raid regroup without running through our idle defenders.
  // Stop combat as soon as the authored kill-credit objective is fulfilled.
  select(w, 'all')
  assert.ok(command(w, { x: -80, z: -108 }))

  observedUntil(() => !!raid, 5000)
  stepUntil(w, () => {
    observeCohort()
    if (!originalMembers || raid.phase !== 16) return false
    const people = originalMembers.map(id => registeredOwner(id).person)
    const orders = people.map(person => currentPersonOrder(w.buildingOrders, person))
    if (orders.some(order => order?.model !== 19)) return false
    const ids = people.map(person => person.immediateCommand || person.commands[person.commandCursor])
    assert.equal(new Set(ids).size, 1, 'both original members share the actual attack order')
    for (const order of orders) {
      assert.equal(order.flags & 1, 0)
      assert.equal(order.a, target)
      assert.equal(order.b, 0x0808)
      assert.equal(order.references, originalMembers.length)
    }
    return true
  }, 2000)
  return { w, raid, originalMembers, originalUnits, registeredOwner }
}

test('Mission 2 naturally earns Matak kills and launches the organized raid', () => {
  launchObservedRaid()
})

test('Mission 2 combat casualty removes only the dead original owner and credits its death tick', () => {
  const { w, raid, originalMembers, originalUnits, registeredOwner } = launchObservedRaid()
  // Use a genuinely trained Warrior rather than assuming a lone Brave wins
  // the changed post-cast RNG sequence. No health, cohort or combat is injected.
  // Death is permitted only with its actual cleanup and credit.
  select(w, 'warrior')
  const defender = w.units.find(unit => unit.id === w.selected[0])
  assert.ok(defender)
  setSelection(w, [defender.id])
  assert.ok(command(w, originalUnits.get(originalMembers[0])))
  let casualty = null
  const fallbacks = [raid.fallback]
  for (let turns = 0; !casualty && turns < 5000; turns++) {
    const before = new Map(originalMembers.map(id => [id, {
      hp: originalUnits.get(id).hp,
      opponent: originalUnits.get(id).fight?.opponent,
    }]))
    const credits = w.killCredits[0][3]
    const livingGreen = w.units.filter(unit => unit.team === 'green' && unit.hp > 0)
    tick(w, 1 / 12)
    if (raid.fallback !== fallbacks.at(-1)) fallbacks.push(raid.fallback)
    assert.deepEqual(raid.members, originalMembers, 'no substitute cohort is accepted')
    for (const id of originalMembers) {
      const original = originalUnits.get(id)
      if (original.hp > 0) {
        assert.equal(registeredOwner(id).unit, original, 'every living original stays owned')
      } else {
        assert.ok(before.get(id).hp > 0, 'observed living-to-dead transition')
        assert.equal(original.hp, 0)
        assert.equal(w.units.some(unit => unit.id === id), false, 'dead Unit is removed')
        assert.equal(w.objectCells.objects.has(id), false, 'dead registry owner is removed')
        assert.equal(w.units.find(unit => unit.id === before.get(id).opponent)?.team, 'blue')
        assert.deepEqual(livingGreen.filter(unit => unit.hp <= 0).map(unit => unit.id), [id],
          'the original casualty is the only Green death on this tick')
        assert.equal(w.killCredits[0][3], credits + 1, 'Blue receives credit on the actual death tick')
        assert.equal(casualty, null, 'this observation contains exactly one original casualty')
        casualty = id
      }
    }
  }
  assert.notEqual(casualty, null, 'a real original-cohort casualty must be observed')
  assert.equal(raid.phase, 16)
  assert.deepEqual(fallbacks, [14], 'the original cohort has regrouped before this encounter; casualty does not regroup it again')
  assert.ok(raid.flags & 1)
})

test('Mission 2 checkpoints retain kill ownership from the old red slot', () => {
  const saved = structuredClone(createWorld(2))
  saved.killCredits[0][1] = 6
  saved.killCredits[0][3] = 2
  saved.killCredits[1][0] = 5
  saved.killCredits[3][0] = 1
  normalizeHistoricalFixture(saved)
  assert.equal(saved.killCredits[0][3], 6)
  assert.equal(saved.killCredits[3][0], 5)
})

test('Mission 2 camp targeting takes the first model match without RNG', () => {
  const w = createWorld(2)
  select(w, 'brave')
  assert.ok(placeBuilding(w, 'camp', { x: -99, z: -105 }))
  const camp = w.buildings.find(building => building.team === 'blue' && building.kind === 'camp')
  const seed = w.randomSeed
  assert.equal(campaignAttackTarget(w, 0, 7)?.id, camp.id)
  assert.equal(w.randomSeed, seed)
})
