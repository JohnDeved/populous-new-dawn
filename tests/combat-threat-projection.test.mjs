import assert from 'node:assert/strict'
import test from 'node:test'
import { addUnit, createWorldState } from '../app/world-state.ts'
import { createLivePerson } from '../app/live-people.ts'
import { allocateLiveCombatResponse, combatWorld } from '../app/live-combat.ts'
import { automaticCombatScanner, engagementRange } from '../app/melee-engagement.ts'
import { startCombatResponse } from '../app/combat-orders.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { insertObjectIntoCell } from '../app/object-cells.ts'
import { stateDigest } from '../scripts/bench-simulation.mjs'

const template = createWorldState(1)
template.land.heights.fill(128)
template.land.categories.fill(0)
template.land.flags.fill(0)
template.land.buildingIds.fill(0)
template.land.owners.fill(0)
template.landVersion = template.terrainVersion
template.turn = 4
template.levelFlags2 = 0
template.outcome.alliances = [0, 0, 0, 0]

function person(w, team, point = { x: -8, z: -8 }, kind = 'warrior', linked = false) {
  const u = addUnit(w, team, kind, point)
  u.native = createLivePerson(w, u)
  u.native.state = 17
  u.native.group = 0
  w.pathfinding.people.set(u.id, u.native)
  if (linked) {
    w.objectCells.objects.set(u.id, u.native)
    insertObjectIntoCell(w.objectCells, u.native, u.native)
  }
  return u
}

function field(team = 'blue', point) {
  const world = structuredClone(template)
  const source = person(world, team, point, 'warrior', true)
  return { world, sourceId: source.id, peerIds: [source.id] }
}

function order(w, p, model, flags = 0, immediate = false) {
  Object.assign(w.buildingOrders.records[1], { model, flags, references: 1, a: 0, b: 0 })
  w.buildingOrders.active = 1
  w.buildingOrders.cursor = 2
  p.state = 10
  p.commandStatus = model
  if (immediate) p.immediateCommand = 1
  else p.commands[0] = 1
}

// Retain the original melee allocation path with its full, public projection.
// Only the projection differs from the candidate; scanning, order allocation,
// cell preparation, sharing and all their state changes use production code.
function fullResponse(w, u, p, peers, effects) {
  assert.equal(u.native, p)
  const current = currentPersonOrder(w.buildingOrders, p)
  const scan = { ...p, counter: w.turn & 255 }
  const scanner = automaticCombatScanner(
    scan,
    current,
    w.levelFlags2,
    () => false,
    false,
    () => false
  )
  p.flags3 = scan.flags3
  if (scanner === null || scanner === 'special' || current?.model === 27) return 0
  assert.equal(scanner, 'melee', 'this oracle covers only the changed melee branch')
  const { world } = combatWorld(w, p, engagementRange(p, current, false))
  startCombatResponse(world, w.buildingOrders, p, peers, effects)
  const id = p.immediateCommand
  return id && w.buildingOrders.records[id].model === 21 ? id : 0
}

function execute(input, allocate) {
  const { world: w, sourceId, peerIds } = input
  const source = w.units.find(u => u.id === sourceId)
  const p = source.native
  const calls = []
  const peers = () => {
    calls.push(['peers'])
    return peerIds.map(id => w.units.find(u => u.id === id).native)
  }
  const effects = Object.fromEntries(
    ['prepare', 'stopWork', 'releaseSpell', 'deleteObject', 'releaseFight'].map(name => [
      name,
      value => calls.push([name, typeof value === 'number' ? value : value.id]),
    ])
  )
  const result = allocate(w, source, p, peers, effects)
  assert.equal(source.native, p, 'the existing physical person remains owned')
  assert.equal(w.pathfinding.people.get(sourceId), p, 'the retained route alias survives')
  assert.equal(w.objectCells.objects.get(sourceId), p, 'the retained cell alias survives')
  return { result, calls, world: w }
}

function compare(input, label) {
  const expected = execute(structuredClone(input), fullResponse)
  const actual = execute(structuredClone(input), allocateLiveCombatResponse)
  assert.deepEqual(actual, expected, label)
  assert.equal(stateDigest(actual), stateDigest(expected), `${label}: complete values and graph`)
  return actual
}

test('melee threat projection preserves allied, hostile and wild populations in wrapped crowded cells', () => {
  const teams = ['blue', 'red', 'yellow', 'green']
  const points = [
    { x: -8, z: -8 },
    { x: 247.99609375, z: -8 },
    { x: -8, z: -263.99609375 },
  ]
  for (const [tribe, team] of teams.entries()) {
    for (const mask of [0, 1 << ((tribe + 1) & 3), 15]) {
      for (const point of points) {
        const input = field(team, point),
          { world: w } = input
        w.outcome.alliances[tribe] = mask
        for (let i = 0; i < 72; i++) {
          const otherTeam = i % 11 === 0 ? 'wild' : i % 9 === 0 ? teams[(tribe + 1) & 3] : team
          const u = person(
            w,
            otherTeam,
            {
              x: point.x + (i % 7) / 8 + (i % 13 === 0 ? 32 : 0),
              z: point.z + (i % 5) / 8,
            },
            i % 3 === 0 ? 'brave' : 'warrior',
            !!(i & 1)
          )
          if (i % 17 === 0) u.hp = 0
          if (i % 19 === 0) u.hp = NaN
        }
        compare(input, `${team}, alliance ${mask}, point ${JSON.stringify(point)}`)
      }
    }
  }
})

test('melee threat projection retains every person eligibility exclusion and native owner precedence', () => {
  const changes = [
    u => {
      u.hp = 0
    },
    u => {
      u.hp = -1
    },
    u => {
      u.hp = NaN
    },
    u => {
      u.hp = 0.01
    },
    u => {
      u.inside = 17
    },
    u => {
      u.native.flags2 |= 0x10000
    },
    u => {
      u.native.flags2 |= 0x800000
    },
    u => {
      u.native.flags4 |= 0x1000
    },
    u => {
      u.native.vehicle = 900
    },
    u => {
      u.native.state = 23
    },
    u => {
      u.native.state = 25
    },
    u => {
      u.invisibility = { remaining: 10 }
    },
    u => {
      u.ghost = { remaining: 10 }
    },
    u => {
      u.lift = 12
    },
    u => {
      u.kind = 'angel'
    },
    u => {
      u.kind = 'spy'
      u.native.model = 5
      u.native.disguise = 1 << 6
    },
    u => {
      u.flight = { ...u.native, state: 17, vehicle: 1 }
    },
    u => {
      u.builder = { person: { ...u.native, flags2: 0x10000 } }
    },
    u => {
      u.fight = { group: 50000, motion: { ...u.native, state: 17 } }
    },
    u => {
      u.native = null
      u.entry = { person: { state: 17, flags2: 0, flags4: 0 } }
    },
  ]
  for (const [index, change] of changes.entries()) {
    const input = field(),
      { world: w } = input
    const target = person(w, 'red', { x: -7.5, z: -8 })
    change(target)
    compare(input, `person eligibility ${index}`)
  }
})

test('melee detection retains model-8 and model-9 groups, reservations and missing group behavior', () => {
  for (const encounter of [false, true]) {
    for (const remote of [false, true]) {
      for (const reserved of [false, true]) {
        for (const ordered of [false, true]) {
          const input = field(),
            { world: w } = input
          const ally = person(w, 'blue', { x: -7.5, z: -8 }, 'brave', true)
          const enemy = person(w, 'red', { x: -7.5, z: -8 }, 'warrior', true)
          const fight = {
            id: w.nextId++,
            x: remote ? 50 : -7.5,
            z: -8,
            angle: 0,
            members: [ally.id, enemy.id],
            attackReservation: {
              flags4: reserved ? 0x100000 : 0,
              reactionTimer: 5,
              reactionDuration: 32,
            },
          }
          if (encounter) fight.encounter = [...fight.members]
          if (reserved) {
            fight.slots = [...fight.members, 0, 0, 0, 0]
            fight.tribes = [0, 1]
          }
          w.fights.push(fight)
          for (const u of [ally, enemy]) u.fight = { group: fight.id, motion: u.native }
          if (ordered) order(w, w.units[0].native, 3)
          compare(
            input,
            `encounter ${encounter}, remote ${remote}, reserved ${reserved}, ordered ${ordered}`
          )
        }
      }
    }
  }

  const input = field(),
    { world: w } = input
  const enemy = person(w, 'red', { x: -7.5, z: -8 })
  enemy.fight = { group: 50000, motion: enemy.native }
  assert.equal(compare(input, 'missing group retains person exclusion').result, 0)
  w.fights.push({ id: w.nextId++, x: -7.5, z: -8, angle: 0, members: [w.units[0].id] })
  assert.ok(compare(input, 'friendly-only group is still a threat').result)
})

test('melee detection keeps building flags, ownership, plan gates and person-before-building priority', () => {
  for (const preparation of [false, true]) {
    for (const team of ['blue', 'red']) {
      for (const activity of [0, 16]) {
        for (const water of [false, true]) {
          const input = field(),
            { world: w } = input
          const b = {
            id: w.nextId++,
            team,
            kind: 'hut',
            level: 1,
            x: -7.5,
            z: -8,
            hp: 100,
            progress: 1,
            angle: 0,
            admission: { activity },
          }
          if (preparation) b.preparation = { phase: 0 }
          w.buildings.push(b)
          w.land.flags[0] = preparation ? 1024 : 512
          w.land.buildingIds[0] = b.id
          w.land.owners[0] = team === 'blue' ? 1 : 2
          if (water) w.land.categories[0] = 1
          compare(input, `building ${preparation}/${team}/${activity}/${water}`)
          person(w, 'red', { x: -7.5, z: -8 }, 'brave', true)
          compare(input, `person plus building ${preparation}/${team}/${activity}/${water}`)
        }
      }
    }
  }
})

test('melee allocation preserves pool exhaustion, wrap, pending scans and shared order references', () => {
  for (const pool of ['available', 'full', 'wrap', 'replace']) {
    const input = field(),
      { world: w } = input
    const source = w.units[0].native
    const matching = person(w, 'blue', { x: -7.75, z: -8 }, 'warrior', true)
    const differentModel = person(w, 'blue', { x: -7.5, z: -8 }, 'brave', true)
    const enemy = person(w, 'red', { x: -7.25, z: -8 }, 'warrior', true)
    const differentState = person(w, 'blue', { x: -7, z: -8 }, 'warrior', true)
    differentState.native.state = 19
    input.peerIds.push(matching.id, differentModel.id, enemy.id, differentState.id)
    if (pool === 'full') {
      for (const record of w.buildingOrders.records) record.references = 1
      w.buildingOrders.active = 799
    } else if (pool === 'wrap') w.buildingOrders.cursor = 799
    else if (pool === 'replace') {
      order(w, source, 3, 0, true)
      source.flags3 |= 0x800
    }
    const result = compare(input, pool)
    if (pool === 'full') {
      assert.equal(result.result, 0)
      assert.deepEqual(result.calls, [])
      assert.equal(result.world.units[0].native.flags3 & 0x800, 0)
    } else {
      assert.ok(result.result)
      const expectedReferences = pool === 'replace' ? 1 : 2
      assert.equal(
        result.world.buildingOrders.records[result.result].references,
        expectedReferences
      )
      assert.deepEqual(result.calls, [['peers']])
      if (pool === 'wrap') assert.equal(result.world.buildingOrders.cursor, 1)
    }
  }

  for (const mode of ['between scans', 'pending', 'suppressed', 'ghost', 'ritual']) {
    const input = field(),
      { world: w } = input,
      p = w.units[0].native
    person(w, 'red', { x: -7.5, z: -8 })
    w.turn = 5
    if (mode !== 'between scans') p.flags3 |= 0x800
    if (mode === 'suppressed') w.levelFlags2 |= 0x2000000
    if (mode === 'ghost') p.flags4 |= 0x800
    if (mode === 'ritual') order(w, p, 27)
    const result = compare(input, mode)
    assert.equal(!!result.result, mode === 'pending')
  }
})

test('allied snapshots and unused fight-member snapshots are absent only from the detection path', () => {
  const input = field(),
    { world: w } = input
  const ally = person(w, 'blue', { x: -7.5, z: -8 })
  const distant = person(w, 'red', { x: 100, z: 100 })
  const fight = {
    id: w.nextId++,
    x: -7.5,
    z: -8,
    angle: 0,
    members: [ally.id, distant.id],
    tribes: [0, 1],
  }
  w.fights.push(fight)
  for (const u of [ally, distant])
    Object.defineProperty(u, 'builder', {
      configurable: true,
      get() {
        return assert.fail('detection must not construct this unused person snapshot')
      },
    })
  assert.ok(execute(input, allocateLiveCombatResponse).result)
  assert.throws(() => combatWorld(w, w.units[0].native, 5), /unused person snapshot/)
})
