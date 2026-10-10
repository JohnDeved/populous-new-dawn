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
    shaman.native = createLivePerson(world, shaman)
    assert.equal(shaman.native.speed, 0, 'this controlled release has no Shaman speed RNG')
    guard.native = createLivePerson(world, guard)
    const p = guard.native
    p.state = queued ? 33 : 10
    p.commandStatus = 30
    p.commandCursor = 3
    if (queued) p.commands[3] = 1
    else p.immediateCommand = 1
    p.commands[6] = 2
    assert.equal(world.buildingOrders.active, 0)
    Object.assign(world.buildingOrders.records[1], { model: 30, references: 1 })
    Object.assign(world.buildingOrders.records[2], {
      model: 3,
      references: 1,
      a: 0x2200,
      b: 0x4400,
    })
    Object.assign(world.buildingOrders.records[10], {
      model: 3,
      references: 1,
      a: 0x6600,
      b: 0x8800,
    })
    world.buildingOrders.active = 3
    world.buildingOrders.cursor = 4
    world.units = [guard, shaman]
    if (unavailable === 'missing') world.units = [guard]
    if (unavailable === 'dead') {
      shaman.hp = 0
      shaman.native.life = 0
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
      unrelated = structuredClone(world.buildingOrders.records[10]),
      observed = visit(world),
      order = actual.currentPersonOrder(world.buildingOrders, p)
    assert.equal(observed.length, 1)
    assert.equal(order, observed[0].order, 'the real prepared record must be attached')
    assert.equal(order.model, 3)
    assert.equal(order.references, 1)
    assert.equal(p.state, state, 'return does not restart the current person state')
    assert.equal(p.immediateCommand, 0)
    assert.deepEqual(p.commands, [4, 0, 0, 0, 0, 0, 0, 0])
    assert.equal(p.commandCursor, 0)
    assert.equal(world.buildingOrders.records[1].references, 0)
    assert.equal(world.buildingOrders.records[2].references, 0)
    assert.equal(world.buildingOrders.active, 2)
    assert.equal(world.buildingOrders.cursor, 5)
    assert.deepEqual(world.buildingOrders.records[10], unrelated)
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
      Object.assign(world.buildingOrders.records[3], {
        model: cancelled ? 30 : 3,
        flags: cancelled ? 1 : 0,
        references: 1,
      })
      guard.native.immediateCommand = 3
      world.buildingOrders.active++
      const before = structuredClone(world)
      assert.deepEqual(visit(world), [])
      assert.deepEqual(world, before)
    })

  for (const excluded of ['state17', 'cancelled', 'non30', 'dead', 'other-tribe'])
    test(`${excluded} person or order remains untouched`, () => {
      const { world, guard } = scenario()
      if (excluded === 'state17') guard.native.state = 17
      if (excluded === 'cancelled') world.buildingOrders.records[1].flags = 1
      if (excluded === 'non30') world.buildingOrders.records[1].model = 17
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
      for (const record of world.buildingOrders.records) record.references = 1
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
