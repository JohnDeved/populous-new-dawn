import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import test, { mock } from 'node:test'

if (!process.execArgv.includes('--experimental-test-module-mocks')) {
  test('Mission 3 defense completion origin through the actual dispatcher', t => {
    const env = { ...process.env, NODE_OPTIONS: '', NODE_PATH: '' }
    delete env.NODE_TEST_CONTEXT
    const result = spawnSync(
      process.execPath,
      ['--experimental-test-module-mocks', '--test', fileURLToPath(import.meta.url)],
      { encoding: 'utf8', timeout: 15_000, maxBuffer: 1024 * 1024, env }
    )
    t.diagnostic(result.stdout)
    assert.equal(result.error, undefined)
    assert.match(result.stdout, /tests 12\b/, 'all twelve defense caller controls must run')
    assert.equal(result.status, 0, result.stderr + result.stdout)
  })
} else {
  const orders = await import('../app/person-orders.ts')
  const defense = await import('../app/computer-defense.ts')
  let preparations = [],
    collections = []
  mock.module(new URL('../app/person-orders.ts', import.meta.url), {
    cache: true,
    namedExports: {
      ...orders,
      prepareMovementOrder(...args) {
        const observation = { point: { ...args[1] }, order: args[0] }
        const result = orders.prepareMovementOrder(...args)
        observation.prepared = structuredClone(args[0])
        preparations.push(observation)
        return result
      },
    },
  })
  mock.module(new URL('../app/computer-defense.ts', import.meta.url), {
    cache: true,
    namedExports: {
      ...defense,
      collectDefenseTargets(...args) {
        const result = defense.collectDefenseTargets(...args)
        collections.push({
          tribe: args[0],
          center: args[2],
          people: result.people.map(p => p.id),
          buildings: result.buildings.map(p => p.id),
        })
        return result
      },
    },
  })
  const { stepComputerTasks } = await import('../app/computer-runtime.ts')
  const { createWorld } = await import('../app/world-initialization.ts')
  const { createLivePerson } = await import('../app/live-people.ts')
  const { migrateCheckpoint } = await import('../app/game-store.ts')
  const { browserPosition } = await import('../app/world-coordinates.ts')
  const { moveObjectInCells, removeObjectFromCell } = await import('../app/object-cells.ts')
  const { orderEffects } = await import('../app/live-movement.ts')

  // Supplied phase-6 caller states. Keep the authored roster/startup pool and real
  // target collector; these cases do not establish an ordinary defense history.
  function scenario({
    base,
    checkpoint = 'direct',
    unavailable,
    flight = false,
    targets = false,
  } = {}) {
    let world = createWorld(3)
    const shaman = world.units.find(u => u.team === 'yellow' && u.kind === 'shaman'),
      blue = world.units.find(u => u.team === 'blue' && u.kind === 'shaman'),
      own = world.units.filter(u => u.team === 'yellow' && u.kind === 'brave').slice(0, 3),
      foreign = world.units.find(u => u.team === 'blue' && u.kind === 'brave')
    assert.ok(shaman?.native && blue?.native && foreign)
    assert.equal(own.length, 3)
    const moved = { x: 0x1000, y: 0x1000, h: shaman.native.h }
    Object.assign(shaman, browserPosition(moved))
    if (shaman.native.flags2 & 0x20000) moveObjectInCells(world.objectCells, shaman.native, moved)
    else Object.assign(shaman.native, moved)
    if (unavailable === 'missing') {
      orders.clearPersonOrders(world.buildingOrders, shaman.native, orderEffects(world))
      if (shaman.native.flags2 & 0x20000) removeObjectFromCell(world.objectCells, shaman.native)
      world.units = world.units.filter(u => u.id !== shaman.id)
    }
    if (unavailable === 'dead') {
      shaman.hp = 0
      shaman.native.life = 0
    }
    const center = targets ? ((blue.native.x >>> 8) & 254) | (blue.native.y & 0xfe00) : 0x1010
    for (const [unit, assignment] of [
      [own[0], 1],
      [own[1], 0],
      [own[2], 2],
      [foreign, 1],
    ]) {
      assert.equal(unit.native, null)
      const p = (unit.native = createLivePerson(world, unit))
      p.state = 17 // Valid assigned member; command1103's state/order filters do not apply.
      p.computerAssignment = assignment
      p.flags3 |= 0x2000
      unit.nativeFlags7f = 255
      const id = orders.allocatePersonOrder(world.buildingOrders)
      assert.ok(id)
      orders.prepareCellOrder(
        world.buildingOrders.records[id],
        { a: center, b: 0x0808 },
        0,
        world.land.categories,
        19
      )
      orders.attachPersonOrder(world.buildingOrders, p, id, 0, orderEffects(world))
      p.commandStatus = 19
    }
    if (flight) {
      own[0].flight = own[0].native
      own[0].native = null
    }
    for (const task of world.ai.tasks) task.flags = 0
    assert.equal(
      defense.requestDefenseTask(world.ai, 256, 1, blue.id, center, () => ({
        total: 1,
        requiredBraves: 1,
        requiredWarriors: 0,
        requiredFirewarriors: 0,
        requiredPreachers: 0,
      })),
      true
    )
    const task = world.ai.tasks[0]
    task.phase = 6
    Object.assign(task.defense, { center, recenter: false, cursor: 5, fallback: false })
    Object.assign(world.ai.tasks[1], { flags: 1, type: 8, phase: 4 })
    world.ai.flags |= 2
    world.ai.selectionOwner = 1 // Foreign task's selection lock must survive retirement.
    world.turn = 1
    world.ai.cursor = 0
    if (base !== undefined) world.ai.constructionBase = base
    else assert.equal(world.ai.constructionBase, undefined)
    if (checkpoint !== 'direct') {
      const saved = structuredClone(world)
      if (checkpoint === 'legacy') {
        for (const unit of saved.units) {
          if (unit.team === 'yellow') unit.team = 'red'
          for (const p of [unit.native, unit.flight]) if (p?.tribe === 2) p.tribe = 1
        }
        for (const building of saved.buildings)
          if (building.team === 'yellow') building.team = 'red'
        for (const footprint of saved.buildingFootprints.values())
          if (footprint.tribe === 2) footprint.tribe = 1
        delete saved.campaignAIs
        delete saved.activeCampaignTribe
        delete saved.spellScans
        delete saved.respawns
        delete saved.respawnPoints
      }
      world = migrateCheckpoint(saved)
    }
    assert.equal(world.ai, world.campaignAIs[2])
    assert.equal(world.activeCampaignTribe, 2)
    assert.equal(world.ai.constructionBase, base)
    const member = world.units.find(u => u.id === own[0].id),
      controls = [...own.slice(1), foreign].map(u => world.units.find(unit => unit.id === u.id))
    return { world, member, person: member.flight ?? member.native, controls, center }
  }

  function visit(world) {
    preparations = []
    collections = []
    world.ai.cursor = 0
    const random = world.randomState
    stepComputerTasks(world, 2)
    assert.equal(world.randomState, random)
    assert.equal(world.ai.cursor, 1)
    assert.equal(world.ai.selectionOwner, 1)
    assert.ok(world.ai.flags & 2)
    return { preparations, collections }
  }

  function retire({ world, member, person, controls }) {
    const oldControls = structuredClone(controls),
      pool = structuredClone(world.buildingOrders),
      state = person.state,
      oldFlags = person.flags3,
      old7f = member.nativeFlags7f,
      observed = visit(world)
    assert.deepEqual(observed, { preparations: [], collections: [] })
    assert.equal(world.ai.tasks[0].phase, 7)
    assert.equal(world.ai.tasks[0].flags & 3, 0)
    assert.equal(person.computerAssignment, 0)
    assert.equal(person.flags3, (oldFlags & ~0x2000) >>> 0)
    assert.equal(member.nativeFlags7f, old7f & 254)
    assert.equal(person.state, state)
    assert.deepEqual(world.buildingOrders, pool)
    assert.deepEqual(controls, oldControls)
  }

  function assertReturned(s, point) {
    const { world, member, person, controls, center } = s,
      oldControls = structuredClone(controls),
      oldPool = structuredClone(world.buildingOrders),
      oldId = person.commands[0],
      state = person.state,
      observed = visit(world),
      order = orders.currentPersonOrder(world.buildingOrders, person)
    assert.deepEqual(observed.collections, [{ tribe: 2, center, people: [], buildings: [] }])
    assert.equal(observed.preparations.length, 1)
    assert.equal(order, observed.preparations[0].order)
    assert.equal(order.model, 3)
    assert.equal(order.references, 1)
    assert.equal(person.state, state)
    assert.equal(person.computerAssignment, 1)
    assert.equal(member.nativeFlags7f, 255)
    const newId = person.commands[0]
    assert.notEqual(newId, oldId)
    assert.deepEqual(person.commands, [newId, 0, 0, 0, 0, 0, 0, 0])
    assert.equal(world.buildingOrders.records[oldId].references, 0)
    assert.equal(world.buildingOrders.active, oldPool.active)
    for (const [id, before] of oldPool.records.entries())
      if (id !== oldId && id !== newId) assert.deepEqual(world.buildingOrders.records[id], before)
    assert.deepEqual(controls, oldControls)
    assert.equal(world.ai.tasks[0].phase, 7)
    assert.equal(world.ai.tasks[0].flags & 3, 1)
    assert.deepEqual(
      observed.preparations[0].point,
      point,
      'actual defense completion must return to the stored uncentered origin'
    )
    assert.deepEqual(
      [order.a, order.b],
      [observed.preparations[0].prepared.a, observed.preparations[0].prepared.b]
    )
    retire(s)
  }

  for (const checkpoint of ['direct', 'modern', 'legacy'])
    test(`no-target defense uses the loaded origin after ${checkpoint} ownership`, () => {
      assertReturned(scenario({ checkpoint }), { x: 0xda00, y: 0x6000 })
    })
  for (const unavailable of ['dead', 'missing'])
    test(`no-target defense retains loaded origin with ${unavailable} Shaman`, () => {
      assertReturned(scenario({ unavailable }), { x: 0xda00, y: 0x6000 })
    })
  for (const base of [0x8335, 0])
    test(`established base ${base} preserves exact uncentered even coordinates`, () => {
      assertReturned(scenario({ base }), { x: (base & 254) << 8, y: base & 0xfe00 })
    })
  test('flight-owned assigned non30 member receives return and matching retirement', () => {
    assertReturned(scenario({ base: 0x8234, flight: true }), { x: 0x3400, y: 0x8200 })
  })
  test('allocation exhaustion preserves people and orders but still advances and retires the task', () => {
    const s = scenario(),
      { world, center } = s
    for (const record of world.buildingOrders.records.slice(1)) record.references ||= 1
    world.buildingOrders.active = 799
    const units = structuredClone(world.units),
      pool = structuredClone(world.buildingOrders),
      observed = visit(world)
    assert.deepEqual(observed.collections, [{ tribe: 2, center, people: [], buildings: [] }])
    assert.deepEqual(observed.preparations, [])
    assert.deepEqual(world.units, units)
    assert.deepEqual(world.buildingOrders, pool)
    assert.equal(world.ai.tasks[0].phase, 7)
    assert.equal(world.ai.tasks[0].flags & 3, 1)
    retire(s)
  })
  test('real remaining targets keep phase6 and do not use the return origin', () => {
    const { world } = scenario({ targets: true }),
      observed = visit(world)
    assert.equal(observed.collections.length, 1)
    assert.ok(observed.collections[0].people.length > 0)
    assert.deepEqual(observed.preparations, [])
    assert.equal(world.ai.tasks[0].phase, 6)
  })
  test('cancelled phase6 retires matching ownership without target collection or return', () => {
    const s = scenario()
    s.world.ai.tasks[0].flags |= 2
    retire(s)
  })
  test('no assigned members completes without returning unrelated owners', () => {
    const { world, person } = scenario()
    person.computerAssignment = 0
    const units = structuredClone(world.units),
      pool = structuredClone(world.buildingOrders),
      observed = visit(world)
    assert.deepEqual(observed.preparations, [])
    assert.equal(world.ai.tasks[0].phase, 7)
    assert.deepEqual(world.units, units)
    assert.deepEqual(world.buildingOrders, pool)
  })
}
