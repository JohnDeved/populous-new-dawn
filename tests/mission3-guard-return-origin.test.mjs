import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import test, { mock } from 'node:test'

if (!process.execArgv.includes('--experimental-test-module-mocks')) {
  test('Mission 3 guard return origin through campaign command1103', t => {
    const env = { ...process.env, NODE_OPTIONS: '', NODE_PATH: '' }
    delete env.NODE_TEST_CONTEXT
    const result = spawnSync(
      process.execPath,
      ['--experimental-test-module-mocks', '--test', fileURLToPath(import.meta.url)],
      { encoding: 'utf8', timeout: 15_000, maxBuffer: 1024 * 1024, env }
    )
    t.diagnostic(result.stdout)
    assert.equal(result.error, undefined)
    assert.match(result.stdout, /tests 19\b/, 'all nineteen caller controls must run')
    assert.equal(result.status, 0, result.stderr + result.stdout)
  })
} else {
  const actual = await import('../app/person-orders.ts')
  let preparations = []
  // The live return helper forwards its point unchanged to this real preparation
  // consumer. Capture the raw point before legitimate coast/building correction.
  mock.module(new URL('../app/person-orders.ts', import.meta.url), {
    cache: true,
    namedExports: {
      ...actual,
      prepareMovementOrder(...args) {
        const observation = { point: { ...args[1] }, flags: args[2], order: args[0] }
        const result = actual.prepareMovementOrder(...args)
        observation.prepared = structuredClone(args[0])
        preparations.push(observation)
        return result
      },
    },
  })
  const { campaignCommand } = await import('../app/campaign-command-runtime.ts')
  const { createWorld } = await import('../app/world-initialization.ts')
  const { createLivePerson } = await import('../app/live-people.ts')
  const { migrateCheckpoint } = await import('../app/game-store.ts')
  const { browserPosition } = await import('../app/world-coordinates.ts')
  const { orderEffects } = await import('../app/live-movement.ts')
  const { removeObjectFromCell } = await import('../app/object-cells.ts')

  // These are supplied command1103 caller states, not an ordinary guard history.
  function scenario({
    base,
    queued = false,
    checkpoint = 'direct',
    unavailable,
    mission = 3,
  } = {}) {
    let world = createWorld(mission)
    const team = mission === 3 ? 'yellow' : 'green',
      shaman = world.units.find(u => u.team === team && u.kind === 'shaman'),
      guard = world.units.find(u => u.team === team && u.kind === 'brave')
    assert.ok(shaman)
    assert.ok(guard)
    Object.assign(shaman, browserPosition({ x: 0x1000, y: 0x1000 }))
    assert.ok(shaman.native, 'preserve the actual startup person and its command18')
    Object.assign(shaman.native, { x: 0x1000, y: 0x1000 })
    assert.equal(shaman.native.speed, 0, 'this controlled release has no Shaman speed RNG')
    if (unavailable === 'missing') {
      actual.clearPersonOrders(world.buildingOrders, shaman.native, orderEffects(world))
      removeObjectFromCell(world.objectCells, shaman.native)
      world.units = world.units.filter(unit => unit.id !== shaman.id)
    }
    if (unavailable === 'dead') {
      shaman.hp = 0
      shaman.native.life = 0
    }
    assert.equal(guard.native, null, 'the supplied guard has no startup orders to replace')
    guard.native = createLivePerson(world, guard)
    const p = guard.native
    p.state = queued ? 33 : 10
    p.commandStatus = 30
    p.commandCursor = 3
    // Retain the complete roster and genuine startup pool. Add only this
    // controlled guard's two orders through the production allocator/attachment.
    for (const [model, slot] of [
      [30, queued ? 3 : -1],
      [3, 6],
    ]) {
      const id = actual.allocatePersonOrder(world.buildingOrders)
      assert.ok(id)
      Object.assign(world.buildingOrders.records[id], { model, a: 0x2200, b: 0x4400 })
      actual.attachPersonOrder(world.buildingOrders, p, id, slot, orderEffects(world))
    }
    world.manaTribes[p.tribe].shamanGuards = 1
    world.manaTribes[p.tribe].shamanGuardChanged = 0
    if (base !== undefined) world.ai.constructionBase = base
    else assert.equal(world.ai.constructionBase, undefined)
    if (checkpoint !== 'direct') {
      const saved = structuredClone(world)
      if (checkpoint === 'legacy') {
        for (const unit of saved.units) {
          if (unit.team === 'yellow') unit.team = 'red'
          if (unit.native?.tribe === 2) unit.native.tribe = 1
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
    assert.equal(world.outcome.level, mission)
    assert.equal(world.activeCampaignTribe, mission === 3 ? 2 : 3)
    assert.equal(world.ai, world.campaignAIs[world.activeCampaignTribe])
    assert.equal(world.ai.constructionBase, base)
    return { world, guard: world.units.find(u => u.id === guard.id) }
  }

  function visit(world) {
    preparations = []
    const ai = structuredClone(world.ai),
      random = world.randomState
    campaignCommand(world, 1103, [])
    assert.deepEqual(world.ai, ai, '1103 does not consume the marker latch or change AI tasks')
    assert.equal(world.randomState, random)
    return preparations
  }

  function assertReturned({ world, guard }, point) {
    const p = guard.native,
      state = p.state,
      beforePool = structuredClone(world.buildingOrders),
      oldIds = [p.immediateCommand, ...p.commands].filter(Boolean),
      observed = visit(world),
      order = actual.currentPersonOrder(world.buildingOrders, p)
    assert.equal(observed.length, 1)
    assert.equal(order, observed[0].order, 'the real prepared record must be attached')
    assert.equal(order.model, 3)
    assert.equal(order.references, 1)
    assert.equal(p.state, state, 'return does not restart the current person state')
    assert.equal(p.immediateCommand, 0)
    const newId = p.commands[0]
    assert.ok(newId && !oldIds.includes(newId), 'allocate before releasing the guard orders')
    assert.deepEqual(p.commands, [newId, 0, 0, 0, 0, 0, 0, 0])
    assert.equal(p.commandCursor, 0)
    for (const id of oldIds) assert.equal(world.buildingOrders.records[id].references, 0)
    assert.equal(world.buildingOrders.active, beforePool.active - 1)
    assert.equal(world.buildingOrders.cursor, newId < 799 ? newId + 1 : 1)
    for (const [id, before] of beforePool.records.entries())
      if (!oldIds.includes(id) && id !== newId)
        assert.deepEqual(world.buildingOrders.records[id], before, `unrelated startup record ${id}`)
    assert.equal(world.manaTribes[p.tribe].shamanGuards, 0)
    assert.equal(world.manaTribes[p.tribe].shamanGuardChanged, 1)
    assert.deepEqual(
      observed[0].point,
      point,
      'actual command1103 must use the stored uncentered origin'
    )
    assert.equal(observed[0].flags, 0)
    assert.deepEqual([order.a, order.b], [observed[0].prepared.a, observed[0].prepared.b])
    return world
  }

  for (const checkpoint of ['direct', 'modern', 'legacy'])
    test(`absent base uses loaded origin with a moved Shaman after ${checkpoint} ownership`, () => {
      assertReturned(scenario({ checkpoint }), { x: 0xda00, y: 0x6000 })
    })

  for (const unavailable of ['dead', 'missing'])
    test(`absent base retains loaded origin with a ${unavailable} live Shaman`, () => {
      assertReturned(scenario({ unavailable }), { x: 0xda00, y: 0x6000 })
    })

  for (const base of [0x8335, 0])
    test(`present base ${base} wins and preserves uncentered even masking`, () => {
      assertReturned(scenario({ base }), { x: (base & 254) << 8, y: base & 0xfe00 })
    })

  test('state33 queued order30 is replaced through the actual host', () => {
    assertReturned(scenario({ base: 0x8234, queued: true }), { x: 0x3400, y: 0x8200 })
  })

  for (const cancelled of [false, true])
    test(`immediate ${cancelled ? 'cancelled30' : 'non30'} suppresses queued order30`, () => {
      const { world, guard } = scenario({ queued: true })
      const id = actual.allocatePersonOrder(world.buildingOrders)
      assert.ok(id)
      Object.assign(world.buildingOrders.records[id], {
        model: cancelled ? 30 : 3,
        flags: cancelled ? 1 : 0,
      })
      actual.attachPersonOrder(world.buildingOrders, guard.native, id, -1, orderEffects(world))
      const before = structuredClone(world)
      assert.deepEqual(visit(world), [])
      assert.deepEqual(world, before)
    })

  for (const excluded of ['state17', 'cancelled', 'non30', 'dead', 'other-tribe'])
    test(`${excluded} person or order remains untouched`, () => {
      const { world, guard } = scenario()
      const order = actual.currentPersonOrder(world.buildingOrders, guard.native)
      if (excluded === 'state17') guard.native.state = 17
      if (excluded === 'cancelled') order.flags = 1
      if (excluded === 'non30') order.model = 17
      if (excluded === 'dead') guard.hp = 0
      if (excluded === 'other-tribe') {
        guard.team = 'blue'
        guard.native.tribe = 0
      }
      const before = structuredClone(world)
      assert.deepEqual(visit(world), [])
      assert.deepEqual(world, before)
    })

  for (const queued of [false, true])
    test(`full pool preserves a genuinely eligible ${queued ? 'queued' : 'immediate'} guard`, () => {
      const { world, guard } = scenario({ queued })
      for (const record of world.buildingOrders.records.slice(1)) record.references ||= 1
      world.buildingOrders.active = 799
      assert.equal(actual.currentPersonOrder(world.buildingOrders, guard.native).model, 30)
      const before = structuredClone(world)
      assert.deepEqual(visit(world), [])
      assert.deepEqual(world, before)
    })

  test('returned order survives a modern checkpoint and repeated command1103 is a no-op', () => {
    const world = assertReturned(scenario({ base: 0x8234 }), { x: 0x3400, y: 0x8200 }),
      restored = migrateCheckpoint(structuredClone(world)),
      before = structuredClone(restored)
    assert.deepEqual(restored.buildingOrders, world.buildingOrders)
    assert.deepEqual(restored.units, world.units)
    assert.deepEqual(visit(restored), [])
    assert.deepEqual(restored, before)
  })

  test('direct Mission2 caller retains its existing live-Shaman fallback', () => {
    assertReturned(scenario({ mission: 2 }), { x: 0x1000, y: 0x1000 })
  })
}
