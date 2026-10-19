import assert from 'node:assert/strict'
import test from 'node:test'
import { combatPerson, combatWorld } from '../app/live-combat.ts'
import { selectCombatTarget, detectCombatThreat, selectFirewarriorTarget } from '../app/combat-targets.ts'
import { addUnit, createWorldState } from '../app/world-state.ts'
import { createWorld } from '../app/world-initialization.ts'
import { createLivePerson, registerLivePerson } from '../app/live-people.ts'
import { boardLiveVehicle, leaveLiveVehicle, syncLiveVehiclePassengers } from '../app/live-vehicles.ts'
import { browserPosition } from '../app/world-coordinates.ts'
import { addBuilding } from '../app/construction-runtime.ts'
import { campaignCommand } from '../app/campaign-command-runtime.ts'
import { createSwamp } from '../app/swamp.ts'
import { tribeForTeam } from '../app/world-types.ts'
import { applyHypnotise, stepLiveSwamp } from '../app/spell-effects-runtime.ts'
import { tick } from '../app/world-turn.ts'
import { stepLiveConversionVictim, appendLiveOrders } from '../app/live-movement.ts'
import { currentPersonOrder, emptyPersonOrder, writePersonOrder } from '../app/person-orders.ts'
import rules from '../app/original-rules.json' with { type: 'json' }
import {
  liveCombatNeighborhood, liveCombatPeopleInCell, publishLiveCombatPosition,
  refreshLiveCombatPosition, withLiveCombatQueries,
} from '../app/live-combat-index.ts'
import { exhaustiveCombatWorld } from './helpers/exhaustive-live-combat.mjs'

const point = (x, y) => ({ x: x / 256 - 8, z: -y / 256 - 8 })
const cell = p => ((p.y >> 9) << 7) | (p.x >> 9)
function compare(w, source, range) {
  const indexed = combatWorld(w, source, range), exhaustive = exhaustiveCombatWorld(w, source, range)
  assert.deepEqual([...indexed.world.objects], [...exhaustive.world.objects])
  assert.deepEqual([...indexed.owners.keys()], [...exhaustive.owners.keys()])
  for (const [id, owner] of exhaustive.owners) assert.equal(indexed.owners.get(id), owner)
  const cells = new Set([cell(source), ...[...exhaustive.world.objects.values()].map(cell)])
  for (const i of cells)
    assert.deepEqual([...indexed.world.cellObjects(i)], [...exhaustive.world.cellObjects(i)], `cell ${i}`)
  return indexed
}

test('indexed owned queries match the independent exhaustive adapter over seams, ranges and mixed order', () => {
  const w = createWorldState(1)
  let seed = 0x12345678
  const random = () => seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
  for (let i = 0; i < 512; i++) {
    const u = addUnit(w, ['blue', 'red', 'wild'][i % 3], i % 5 ? 'warrior' : 'spy',
      point((random() & 0x3ffff) - 0x20000, (random() & 0x3ffff) - 0x20000))
    if (i % 11 === 0) u.hp = 0
    if (i % 37 === 0) u.hp = NaN
    if (i % 3 === 0) { u.native = createLivePerson(w, u); registerLivePerson(w, u.native) }
    if (i % 13 === 0) u.invisibility = 3
    if (i % 17 === 0) u.attackReservation = { flags4: 0x100000, reactionTimer: 3, reactionDuration: 5 }
  }
  for (let i = 0; i < 16; i++) w.fights.push({
    id: w.nextId++, ...point(i * 4096, (15 - i) * 4096), angle: 0,
    members: [w.units[i].id, w.units[511 - i].id, 999999],
    ...(i % 2 ? { encounter: [w.units[i].id, w.units[511 - i].id] } : {}),
  })
  const before = structuredClone(w)
  withLiveCombatQueries(w, () => {
    assert.ok(liveCombatNeighborhood(w, { x: 0, y: 0 }, 1), 'ordinary data actually uses the index')
    for (const source of [{ x: 0, y: 0 }, { x: 65535, y: 65535 }, { x: 32768, y: 511 }])
      for (const range of [0, 1, 2, 3, 7, 16, 127, 128, 129, 255]) compare(w, source, range)
  })
  assert.deepEqual(w, before, 'queries do not mutate semantic world state')
})

test('same-turn movement, births, death, fight IDs/positions and roster removal stay fresh', () => {
  const w = createWorldState(1), origin = { x: 0, y: 0 }, far = { x: 32768, y: 32768 }
  const first = addUnit(w, 'red', 'warrior', point(0, 0))
  const second = addUnit(w, 'blue', 'brave', point(far.x, far.y))
  withLiveCombatQueries(w, () => {
    compare(w, origin, 1)
    publishLiveCombatPosition(w, first, point(far.x, far.y))
    publishLiveCombatPosition(w, second, point(0, 0))
    compare(w, origin, 1); compare(w, far, 1)
    const newborn = addUnit(w, 'red', 'brave', point(0, 0))
    compare(w, origin, 1)
    first.hp = 0
    const battle = { id: w.nextId++, ...point(0, 0), angle: 0, members: [first.id, second.id] }
    w.fights.push(battle)
    const projected = compare(w, origin, 1)
    assert.ok(projected.world.objects.has(first.id), 'dead distant member remains resolvable until compaction')
    battle.id = w.nextId++
    publishLiveCombatPosition(w, battle, point(far.x, far.y))
    compare(w, origin, 1); compare(w, far, 1)
    w.units.splice(w.units.indexOf(first), 1)
    compare(w, far, 1)
    assert.equal(liveCombatPeopleInCell(w, 0).includes(newborn), true)
    w.fights = []
    w.units = w.units.filter(u => u !== second)
    compare(w, origin, 1)
  })
})

test('native chains stay ahead of roster ties after bucket removal/reinsertion and 64-candidate selection', () => {
  const w = createWorldState(1), native = { x: 2560, y: 3584 }, p = point(native.x, native.y)
  const source = addUnit(w, 'blue', 'warrior', p)
  for (let i = 0; i < 96; i++) {
    const u = addUnit(w, 'red', i % 7 ? 'warrior' : 'spy', p)
    if (i % 3 === 0) { u.native = createLivePerson(w, u); registerLivePerson(w, u.native) }
  }
  w.land.categories.fill(0)
  const order = { model: 19, flags: 16, a: ((native.y >> 8) << 8) | (native.x >> 8), b: 0 }
  withLiveCombatQueries(w, () => {
    const moved = w.units[1]
    publishLiveCombatPosition(w, moved, point(50000, 50000))
    publishLiveCombatPosition(w, moved, p)
    compare(w, native, 2)
    assert.deepEqual(liveCombatPeopleInCell(w, cell(native)), w.units, 'response peers use roster, not chain/bucket order')
    for (const flags of [0, 8, 16, 32, 48]) {
      const left = combatWorld(w, native, 2).world, right = exhaustiveCombatWorld(w, native, 2).world
      assert.equal(detectCombatThreat(left, combatPerson(source), order, true, false),
        detectCombatThreat(right, combatPerson(source), order, true, false))
      assert.deepEqual(selectCombatTarget(left, combatPerson(source), { ...order, flags }),
        selectCombatTarget(right, combatPerson(source), { ...order, flags }))
      assert.deepEqual(selectFirewarriorTarget(left, combatPerson(source), { ...order, flags }, () => true),
        selectFirewarriorTarget(right, combatPerson(source), { ...order, flags }, () => true))
      assert.deepEqual([...left.objects], [...right.objects])
    }
  })
})

for (const [mission, model] of [[5, 1], [22, 3]])
  test(`live vehicle model ${model} updates every passenger before later same-turn queries`, () => {
    const w = createWorld(mission), vehicle = w.vehicles.find(v => v.model === model)
    vehicle.active = true
    vehicle.passengers = []; vehicle.passengerCount = 0
    const units = Array.from({ length: Math.min(3, rules.vehicleCapacity[model]) }, () => addUnit(w, 'blue', 'brave', point(vehicle.x, vehicle.y)))
    for (const u of units) {
      u.native = createLivePerson(w, u)
      w.pathfinding.people.set(u.id, u.native)
      registerLivePerson(w, u.native)
      assert.equal(boardLiveVehicle(w, u.native, vehicle), true)
    }
    const old = { x: vehicle.x & 65535, y: vehicle.y & 65535 }
    withLiveCombatQueries(w, () => {
      compare(w, old, 3)
      vehicle.x = (vehicle.x + 4096) & 65535
      vehicle.y = (vehicle.y + 4096) & 65535
      syncLiveVehiclePassengers(w, vehicle)
      const current = { x: vehicle.x, y: vehicle.y }
      compare(w, old, 3); compare(w, current, 3)
      for (const u of units) assert.deepEqual({ x: u.x, z: u.z }, browserPosition(u.native))
      leaveLiveVehicle(w, vehicle, units[0].native, { x: vehicle.x + 4096, y: vehicle.y })
      compare(w, current, 3)
      compare(w, combatPerson(units[0]), 3)
    })
  })

test('live Hypnotise same-length replacement changes ID lookup and preserves roster order', () => {
  const w = createWorldState(1)
  const victim = addUnit(w, 'red', 'brave', point(2560, 3584))
  const sentinel = addUnit(w, 'blue', 'warrior', point(2560, 3584))
  const source = combatPerson(victim)
  withLiveCombatQueries(w, () => {
    compare(w, source, 3)
    assert.equal(applyHypnotise(w, victim, 'blue').length, 1)
    assert.notEqual(w.units[0].id, victim.id)
    assert.equal(w.units[1], sentinel)
    const now = compare(w, source, 3)
    assert.equal(now.world.objects.has(victim.id), false)
  })
})

test('nested sessions preserve updates; exceptions and outside raw mutations cannot leave stale indexes', () => {
  const w = createWorldState(1), u = addUnit(w, 'red', 'warrior', point(0, 0))
  assert.throws(() => withLiveCombatQueries(w, () => {
    compare(w, { x: 0, y: 0 }, 1)
    withLiveCombatQueries(w, () => publishLiveCombatPosition(w, u, point(4096, 4096)))
    compare(w, { x: 4096, y: 4096 }, 1)
    throw new Error('turn failed')
  }), /turn failed/)
  u.x = -8; u.z = -8
  assert.equal(liveCombatNeighborhood(w, { x: 0, y: 0 }, 1), undefined)
  compare(w, { x: 0, y: 0 }, 1)
  // Ordinary observers run outside the actual tick session too.
  w.pendingTime = 0
  assert.throws(() => tick(w, 1 / 12, { beforeTurn() { throw Error('observer failed') } }), /observer failed/)
  assert.equal(liveCombatNeighborhood(w, { x: 0, y: 0 }, 1), undefined)
})

test('accessor-backed public fixtures stay exhaustive without eligibility checks invoking getters', () => {
  const w = createWorldState(1), u = addUnit(w, 'red', 'warrior', { x: 64, z: 0 })
  Object.defineProperty(u, 'z', { get() { assert.fail('distant first axis must short-circuit') } })
  withLiveCombatQueries(w, () => compare(w, { x: 0, y: 0 }, 3))
  const w2 = createWorldState(1), a = addUnit(w2, 'red', 'warrior', point(0, 0)), b = addUnit(w2, 'blue', 'brave', point(32768, 0))
  let reads = 0
  Object.defineProperty(a, 'hp', { get() { reads++; b.x = -8; return 10 } })
  withLiveCombatQueries(w2, () => {
    assert.equal(liveCombatNeighborhood(w2, { x: 0, y: 0 }, 1), undefined)
    assert.equal(reads, 0)
    compare(w2, { x: 0, y: 0 }, 1)
    assert.ok(reads > 0)
  })
})


test('Preacher replacement invalidates an unchanged-length roster before the next same-turn scan', () => {
  const w = createWorldState(1)
  w.terrain.fill(3); w.terrainVersion++
  const preacher = addUnit(w, 'blue', 'preacher', point(4096, 4096))
  const victim = addUnit(w, 'red', 'brave', point(4608, 4096))
  for (const u of [preacher, victim]) { u.native = createLivePerson(w, u); registerLivePerson(w, u.native) }
  const order = emptyPersonOrder()
  writePersonOrder(order, 17, preacher.native.x, preacher.native.y, 0)
  appendLiveOrders(w, [preacher], order, true)
  Object.assign(preacher.native, { state: 10, commandStatus: 17, speed: 0 })
  Object.assign(victim.native, { state: 23, timer: 0, workTarget: preacher.id })
  w.manaTribes[1].flags2 |= 64
  const origin = combatPerson(victim), oldId = victim.id
  withLiveCombatQueries(w, () => {
    compare(w, origin, 7)
    stepLiveConversionVictim(w, victim)
    assert.equal(w.units.length, 2)
    assert.notEqual(w.units[1].id, oldId)
    assert.equal(w.units[1].team, 'blue')
    compare(w, origin, 7)
    assert.equal(liveCombatNeighborhood(w, origin, 7).unitById.has(oldId), false)
  })
})

test('tick instrumentation reentrancy is invalidated and a thrown tick tears down the session', () => {
  const w = createWorldState(1), unit = addUnit(w, 'red', 'warrior', point(0, 0))
  const origin = { x: 0, y: 0 }
  let observed = false
  const metrics = {
    get steps() {
      assert.equal(liveCombatNeighborhood(w, origin, 1), undefined)
      compare(w, origin, 1)
      unit.x = 48
      compare(w, combatPerson(unit), 1)
      return 0
    },
    set steps(value) {
      assert.equal(value, 1)
      observed = true
      throw Error('instrumentation failed')
    },
  }
  assert.throws(() => tick(w, 1 / 12, undefined, metrics), /instrumentation failed/)
  assert.equal(observed, true)
  assert.equal(liveCombatNeighborhood(w, origin, 1), undefined)
  compare(w, origin, 1)
  // A completed callback may query first then mutate a retained alias. The next
  // scan must rebuild; observers also stay outside the retained body.
  const continuing = {
    get steps() { compare(w, origin, 1); unit.x = -8; return 0 },
    set steps(_) {},
  }
  tick(w, 1 / 12, {
    afterTurn() { assert.equal(liveCombatNeighborhood(w, origin, 1), undefined) },
  }, continuing)
  compare(w, combatPerson(unit), 1)
})


test('metrics and nested observer getters remain exhaustive throughout alias mutations', () => {
  const w = createWorldState(1), unit = addUnit(w, 'red', 'warrior', point(0, 0))
  const origin = { x: 0, y: 0 }, other = { x: 8192, y: 0 }
  const visits = []
  assert.throws(() => tick(w, 1 / 12, undefined, {
    get steps() {
      visits.push('metrics:get')
      compare(w, origin, 1)
      unit.x = 24
      assert.equal(combatWorld(w, other, 1).world.objects.has(unit.id), true)
      compare(w, other, 1)
      tick(w, 1 / 12, {
        get beforeTurn() {
          visits.push('observer:get')
          assert.equal(liveCombatNeighborhood(w, other, 1), undefined)
          compare(w, other, 1)
          unit.x = -8
          compare(w, origin, 1)
          return () => {
            visits.push('observer:call')
            compare(w, origin, 1)
            unit.x = 24
            compare(w, other, 1)
          }
        },
        afterTurn() { assert.equal(liveCombatNeighborhood(w, other, 1), undefined) },
      })
      compare(w, combatPerson(unit), 1)
      return 0
    },
    set steps(value) { visits.push('metrics:set'); assert.equal(value, 1); throw Error('end probe') },
  }), /end probe/)
  assert.deepEqual(visits, ['metrics:get', 'observer:get', 'observer:call', 'metrics:set'])
  assert.equal(liveCombatNeighborhood(w, origin, 1), undefined)
})

test('nested tick observers suspend an existing outer session and restore a fresh view after a throw', () => {
  const w = createWorldState(1), unit = addUnit(w, 'red', 'warrior', point(0, 0))
  const origin = { x: 0, y: 0 }, other = { x: 8192, y: 0 }
  withLiveCombatQueries(w, () => {
    compare(w, origin, 1)
    assert.throws(() => tick(w, 1 / 12, {
      get beforeTurn() {
        compare(w, origin, 1)
        unit.x = 24
        compare(w, other, 1)
        return () => { throw Error('nested observer failed') }
      },
    }), /nested observer failed/)
    assert.ok(liveCombatNeighborhood(w, other, 1))
    compare(w, other, 1)
  })
})

for (const removal of ['Hypnotise', 'Swamp'])
  test(`campaign counterattack query → ${removal} ghost removal → birth preserves a restored roster length`, () => {
    const w = createWorldState(1)
    w.terrain.fill(3); w.terrainVersion++
    const tower = addBuilding(w, 'green', 'tower', { x: 0, z: 0 })
    w.land.categories.fill(3)
    const resident = addUnit(w, 'green', 'warrior', tower)
    resident.inside = tower.id
    const defender = addUnit(w, 'green', 'warrior', { x: tower.x + 2, z: tower.z })
    const hostile = addUnit(w, 'blue', 'shaman', { x: tower.x + 1, z: tower.z })
    for (const u of [resident, defender, hostile]) {
      u.native = createLivePerson(w, u); u.native.state = 17
      registerLivePerson(w, u.native)
    }
    const ghost = addUnit(w, 'red', 'brave', point(0, 0))
    ghost.ghost = true; ghost.native = createLivePerson(w, ghost); ghost.native.state = 17
    w.activeCampaignTribe = tribeForTeam('green')
    const length = w.units.length
    withLiveCombatQueries(w, () => {
      // This real pre-effects campaign command reaches combatWorld via an
      // occupied Tower and marks a defender. No test query builds the index first.
      campaignCommand(w, 1198, [])
      assert.equal(currentPersonOrder(w.buildingOrders, defender.native)?.model, 19)
      if (removal === 'Hypnotise') applyHypnotise(w, ghost, 'blue')
      else stepLiveSwamp(w, createSwamp({ x: 0, y: 0, h: 0 }, 0, 3, w))
      assert.equal(w.units.length, length - 1)
      assert.ok(!w.units.includes(ghost))
      const newborn = addUnit(w, 'blue', 'brave', point(0, 0))
      assert.equal(w.units.length, length, 'no intervening query observes the shorter array')
      const projected = compare(w, { x: 0, y: 0 }, 1)
      assert.deepEqual([...projected.owners.keys()], [newborn.id])
      assert.ok(!projected.world.objects.has(ghost.id))
    })
  })

test('an append with an unexpected roster length invalidates instead of retaining stale owners', () => {
  const w = createWorldState(1), old = addUnit(w, 'red', 'brave', point(0, 0))
  withLiveCombatQueries(w, () => {
    compare(w, { x: 0, y: 0 }, 1)
    // Deliberately omit a removal notification to exercise append's defensive boundary.
    w.units.splice(0, 1)
    const newborn = addUnit(w, 'blue', 'brave', point(0, 0))
    const result = compare(w, { x: 0, y: 0 }, 1)
    assert.ok(!result.owners.has(old.id)); assert.equal(result.owners.get(newborn.id), newborn)
  })
})
