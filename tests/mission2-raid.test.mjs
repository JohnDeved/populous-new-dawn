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
import { migrateCheckpoint } from '../app/game-store.ts'
import { campaignAttackTarget } from '../app/campaign-runtime.ts'
import { currentPersonOrder } from '../app/person-orders.ts'

function stepUntil(w, ready, limit) {
  for (let i = 0; i < limit && !ready(); i++) tick(w, 1 / 12)
  assert.ok(ready(), `condition timed out at turn ${w.turn}`)
}

test('Mission 2 naturally earns Matak kills and launches the organized raid', () => {
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

  const warriors = () =>
    w.units.filter(unit => unit.team === 'blue' && unit.kind === 'warrior' && unit.hp > 0)
  for (let attempts = 0; w.killCredits[0][3] <= 3 && attempts < 8; attempts++) {
    const target = w.units
      .filter(unit => unit.team === 'green' && unit.kind !== 'shaman' && unit.hp > 0)
      .sort((a, b) => wrappedDistance(a, camp) - wrappedDistance(b, camp))[0]
    assert.ok(target)
    setSelection(w, warriors().map(unit => unit.id))
    assert.ok(command(w, target))
    stepUntil(w, () => target.hp <= 0, 10000)
  }
  assert.equal(w.killCredits[0][1], 0)
  assert.ok(w.killCredits[0][3] > 3)

  // Let the authored raid regroup without running through our idle defenders.
  // This startup scenario selects two fallback Braves rather than Warriors.
  select(w, 'all')
  assert.ok(command(w, { x: -80, z: -108 }))

  stepUntil(w, () => w.ai.tasks.some(task => task.flags & 1 && task.type === 20), 5000)
  const raid = w.ai.tasks.find(task => task.flags & 1 && task.type === 20)
  assert.deepEqual(
    { requested: raid.requested, mode: raid.mode, entity: raid.entity },
    { requested: 2, mode: 7, entity: camp.id }
  )
  const target = raid.target
  let originalMembers = null, released = false, beforeRelease = null
  const registeredOwner = id => {
    const unit = w.units.find(unit => unit.id === id && unit.hp > 0)
    const person = w.objectCells.objects.get(id)
    assert.ok(unit && person && person.id === unit.id, 'living original member has a registry owner')
    assert.ok([unit.native, unit.flight, unit.fight?.motion, unit.entry?.person,
      unit.builder?.person].includes(person), 'registry record belongs to the actual Unit')
    return { unit, person }
  }
  const observeCohort = () => {
    const active = w.ai.tasks.filter(task => task.flags & 1 && task.type === 20)
    assert.equal(active.length, 1, 'no duplicate raid is created')
    assert.equal(active[0], raid, 'the same task remains active')
    if (!originalMembers && raid.phase >= 4 && raid.members.length) {
      assert.equal(raid.members.length, 2, 'the original requested cohort is recruited first')
      assert.equal(new Set(raid.members).size, 2)
      originalMembers = [...raid.members]
      for (const id of originalMembers) assert.equal(registeredOwner(id).unit.kind, 'brave')
    }
    if (!originalMembers) return
    const [releaseId, admittedId] = originalMembers
    if (!raid.members.includes(releaseId)) {
      if (!released) {
        assert.ok(beforeRelease, 'release has a witnessed original owner')
        assert.equal(beforeRelease.phase, 6)
        assert.equal(beforeRelease.state, 33)
        assert.ok(beforeRelease.substate === 3 ||
          (beforeRelease.substate === 2 && Number.isInteger(beforeRelease.animationMode) &&
            beforeRelease.animationMode > 4 && beforeRelease.animationMode <= 255),
          'the actual +a8 animationMode satisfies the original release predicate')
        assert.equal(beforeRelease.immediate, 0)
        assert.equal(beforeRelease.ids.length, 1)
        assert.ok(beforeRelease.order, 'the observed original owner has its movement order')
        assert.equal(beforeRelease.order.model, 3)
        assert.equal(beforeRelease.order.references, 1)
        const { unit, person } = registeredOwner(releaseId)
        assert.equal(person, beforeRelease.person, 'release retains the original registered record')
        assert.equal(unit.hp, beforeRelease.hp, 'admission is released while the original member lives')
        assert.equal(person.life, beforeRelease.life)
        assert.equal(person.computerAssignment, 0)
        assert.deepEqual(person.commands, Array(8).fill(0))
        assert.equal(person.immediateCommand, 0)
        assert.equal(w.buildingOrders.records[beforeRelease.ids[0]].references, 0)
        assert.equal(person.motionTimer, 0)
        assert.equal(person.motionMode, 0)
        assert.equal(raid.phase, 6, 'release itself does not skip to attack or retirement')
        assert.equal(raid.target, target)
        released = true
      }
      assert.deepEqual(raid.members, [admittedId], 'only the predeclared still-admitted member remains')
    } else {
      assert.equal(released, false, 'a released member is not silently readmitted')
      assert.deepEqual(raid.members, originalMembers, 'no replacement cohort enters the task')
      const { unit, person } = registeredOwner(releaseId)
      const order = currentPersonOrder(w.buildingOrders, person)
      beforeRelease = { person, phase: raid.phase, state: person.state, substate: person.substate,
        animationMode: person.animationMode, hp: unit.hp, life: person.life,
        immediate: person.immediateCommand, ids: person.commands.filter(Boolean),
        order: order && { ...order } }
    }
  }
  stepUntil(w, () => {
    observeCohort()
    if (!released || raid.phase !== 16) return false
    assert.equal(raid.members[0], originalMembers[1])
    const { person } = registeredOwner(originalMembers[1])
    const order = currentPersonOrder(w.buildingOrders, person)
    if (order?.model !== 19) return false
    assert.equal(order.flags & 1, 0)
    assert.equal(order.a, target)
    assert.equal(order.b, 0x0808)
    assert.equal(order.references, 1)
    return true
  }, 2000)
  // Return one actual follower to fight the raid. Clicking the camp itself
  // starts training, whose replacement object is not evidence of combat damage.
  select(w, 'brave')
  assert.ok(w.selected.length)
  const defender = w.units.find(unit => unit.id === w.selected[0])
  const attacker = w.units.find(unit => unit.id === raid.members[0])
  assert.ok(defender && attacker)
  setSelection(w, [defender.id])
  assert.ok(command(w, attacker))
  const blueHp = defender.hp
  const taskDamage = raid.damage
  // Newborn followers change total tribe HP, so observe this fixed lifetime.
  stepUntil(w, () => { observeCohort(); return defender.hp < blueHp }, 5000)
  assert.ok(raid.members.includes(defender.fight?.opponent) || raid.damage > taskDamage)
  assert.equal(raid.phase, 16)
  assert.equal(raid.fallback, 14)
  assert.ok(raid.flags & 1)
})

test('Mission 2 checkpoints retain kill ownership from the old red slot', () => {
  const saved = structuredClone(createWorld(2))
  saved.killCredits[0][1] = 6
  saved.killCredits[0][3] = 2
  saved.killCredits[1][0] = 5
  saved.killCredits[3][0] = 1
  migrateCheckpoint(saved)
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
