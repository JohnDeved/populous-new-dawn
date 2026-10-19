import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import test, { mock } from 'node:test'

if (!process.execArgv.includes('--experimental-test-module-mocks')) {
  test('Mission 2 construction origin through the actual producer', t => {
    const env = { ...process.env, NODE_OPTIONS: '', NODE_PATH: '' }
    delete env.NODE_TEST_CONTEXT
    const result = spawnSync(
      process.execPath,
      ['--experimental-test-module-mocks', '--test', fileURLToPath(import.meta.url)],
      { encoding: 'utf8', timeout: 15_000, maxBuffer: 1024 * 1024, env }
    )
    t.diagnostic(result.stdout)
    assert.equal(result.error, undefined)
    assert.match(result.stdout, /tests 16\b/, 'all sixteen construction caller controls must run')
    assert.equal(result.status, 0, result.stderr + result.stdout)
  })
} else {
  const math = await import('../app/native-math.ts')
  let searches = [],
    observedWorld
  mock.module(new URL('../app/native-math.ts', import.meta.url), {
    cache: true,
    namedExports: {
      ...math,
      spiralCell(...args) {
        if (observedWorld) searches.push({ args: [...args], random: observedWorld.randomState })
        return math.spiralCell(...args)
      },
    },
  })
  const { stepComputerTasks, computerSelectionWorld } = await import('../app/computer-runtime.ts')
  const { createWorld } = await import('../app/world-initialization.ts')
  const { migrateCheckpoint } = await import('../app/game-store.ts')
  const { browserPosition } = await import('../app/world-coordinates.ts')
  const { moveObjectInCells, removeObjectFromCell } = await import('../app/object-cells.ts')
  const { clearPersonOrders } = await import('../app/person-orders.ts')
  const { orderEffects } = await import('../app/live-movement.ts')
  const { requestConstruction } = await import('../app/computer.ts')
  const { buildingModel } = await import('../app/building-shapes.ts')
  const { default: rules } = await import('../app/original-rules.json', {
    with: { type: 'json' },
  })

  // Supplied producer inputs, not a distinguishing ordinary construction route.
  // Preserve the authored roster, buildings, two startup tasks and their orders.
  function scenario({
    moved = true,
    unavailable,
    checkpoint = 'direct',
    base,
    housing = false,
  } = {}) {
    let world = createWorld(2)
    const shaman = world.units.find(u => u.team === 'green' && u.kind === 'shaman')
    assert.ok(shaman?.native)
    assert.equal(world.buildingOrders.active, 2)
    assert.deepEqual(
      world.ai.tasks.filter(t => t.flags & 1).map(t => t.type),
      [24, 7]
    )
    assert.equal(
      world.ai.tasks.findIndex(t => !(t.flags & 1)),
      2
    )
    assert.equal(world.ai.constructionBase, undefined)
    assert.equal(world.ai.coordinateLatch, 0x8232)
    assert.ok(world.ai.flags & 0x20)
    if (moved) {
      const point = { x: 0x1000, y: 0x1000, h: shaman.native.h }
      Object.assign(shaman, browserPosition(point))
      if (shaman.native.flags2 & 0x20000) moveObjectInCells(world.objectCells, shaman.native, point)
      else Object.assign(shaman.native, point)
    }
    if (unavailable === 'dead') {
      shaman.hp = 0
      shaman.native.life = 0
    }
    if (unavailable === 'missing') {
      clearPersonOrders(world.buildingOrders, shaman.native, orderEffects(world))
      if (shaman.native.flags2 & 0x20000) removeObjectFromCell(world.objectCells, shaman.native)
      world.units = world.units.filter(u => u.id !== shaman.id)
    }
    world.ai.states &= ~512 // Isolate the same pre-table response gate as the existing M2 fixture.
    if (base !== undefined) world.ai.constructionBase = base
    if (housing) {
      // Keep every authored building. A supplied capacity target makes a present
      // base request a Hut despite its surviving Tower and sufficient default housing.
      world.ai.attributes[10] = world.buildings
        .filter(b => b.team === 'green' && b.hp > 0)
        .reduce((sum, b) => {
          const model = buildingModel(b)
          return sum + (rules.buildingFlags[model] & 0x20 ? rules.buildingCapacity[model] : 0)
        }, 1)
    }
    world.turn = 60
    if (checkpoint !== 'direct') {
      const saved = structuredClone(world)
      if (checkpoint === 'legacy') {
        for (const unit of saved.units) {
          if (unit.team === 'green') unit.team = 'red'
          for (const p of [unit.native, unit.flight]) if (p?.tribe === 3) p.tribe = 1
        }
        for (const building of saved.buildings) if (building.team === 'green') building.team = 'red'
        for (const footprint of saved.buildingFootprints.values())
          if (footprint.tribe === 3) footprint.tribe = 1
        delete saved.campaignAIs
        delete saved.activeCampaignTribe
        delete saved.spellScans
        delete saved.respawns
        delete saved.respawnPoints
        // Keep coordinateLatch: this is single-AI ownership migration, not the
        // separate older-M2 branch that replays missing startup command metadata.
      }
      world = migrateCheckpoint(saved)
    }
    assert.equal(world.ai, world.campaignAIs[3])
    assert.equal(world.activeCampaignTribe, 3)
    assert.equal(world.ai.constructionBase, base)
    assert.equal(world.ai.coordinateLatch, 0x8232)
    assert.ok(available(world).length >= 2)
    return world
  }

  function available(world) {
    return computerSelectionWorld(world, 3).world.people.filter(
      person => rules.personStateFlags[person.state] & 8 && !person.busy && person.model !== 7
    )
  }

  function visit(world, model, origin) {
    const before = structuredClone(world),
      slot = world.ai.tasks.findIndex(t => !(t.flags & 1)),
      expected = structuredClone(before)
    stepComputerTasks(world, 3)
    if (slot >= 0) {
      // Construction is the first singleton producer; successful allocation stops
      // the pass. Failed admission visits every adapter once without reordering.
      for (const producer of expected.ai.producers)
        if (!model || producer.id === 1) producer.attempts++
    }
    if (model) {
      assert.ok(slot >= 0)
      const request = world.ai.tasks[slot]
      expected.ai.tasks[slot] = {
        ...expected.ai.tasks[slot],
        flags: ((expected.ai.tasks[slot].flags & ~2) | 1) >>> 0,
        type: 0,
        phase: 0,
        requested: model,
        origin: request.origin,
        extra: 0,
        members: [],
      }
      // Only the genuine new task and producer history may change. This includes
      // preservation of both pre-existing tasks, all people and the startup pool.
      assert.deepEqual(world, expected)
      assert.equal(
        request.origin,
        origin,
        'actual construction request must retain its stored origin'
      )
      return { request, slot }
    }
    assert.deepEqual(world, expected)
    return { slot }
  }

  for (const checkpoint of ['direct', 'modern', 'legacy'])
    test(`moved Shaman retains loaded construction origin after ${checkpoint} ownership`, () => {
      visit(scenario({ checkpoint }), 4, 0x8062)
    })
  for (const unavailable of ['dead', 'missing'])
    test(`${unavailable} Shaman does not substitute the authored outpost for loaded origin`, () => {
      visit(scenario({ unavailable }), 4, 0x8062)
    })
  test('coincident initial Shaman preserves the existing authored construction request', () => {
    visit(scenario({ moved: false }), 4, 0x8062)
  })
  test('present nonzero base wins unchanged for an explicitly requested housing shortfall', () => {
    visit(scenario({ base: 0x8335, housing: true }), 1, 0x8335)
  })
  test('present base zero retains the existing adapter no-origin rejection', () => {
    // Preserved behavior, not a new native zero-cell equivalence claim.
    visit(scenario({ base: 0, housing: true }), 0)
  })
  test('present base and sufficient authored housing suppress construction', () => {
    visit(scenario({ base: 0x8335 }), 0)
  })
  test('one idle non-Shaman person does not satisfy construction admission', () => {
    const world = scenario(),
      eligible = available(world),
      tower = world.buildings.find(b => b.team === 'green' && b.kind === 'tower')
    assert.ok(eligible.length > 2 && tower)
    for (const person of eligible.slice(1))
      world.units.find(u => u.id === person.id).work = tower.id
    assert.equal(available(world).length, 1)
    visit(world, 0)
  })
  test('disabled construction state preserves tasks and orders', () => {
    const world = scenario()
    world.ai.states &= ~1
    visit(world, 0)
  })
  test('disabled Tower mode retains sufficient-housing suppression', () => {
    const world = scenario()
    world.ai.flags |= 0x400
    visit(world, 0)
  })
  test('occupied construction limit preserves its existing request and startup tasks', () => {
    const world = scenario()
    assert.equal(requestConstruction(world.ai, 4, 0x8234), true)
    visit(world, 0)
  })
  test('full real task table prevents producer visits without changing the startup pool', () => {
    const world = scenario()
    while (requestConstruction(world.ai, 4, 0x8234)) {
      // Fill remaining task slots through the actual allocator until it refuses.
    }
    assert.equal(world.ai.tasks.filter(t => t.flags & 1).length, 10)
    visit(world, 0)
  })

  function searchEntry(world, center) {
    const { request, slot } = visit(world, 4, 0x8062),
      rng = { randomState: world.randomState }
    assert.equal(world.ai.attributes[30], 0)
    math.random(rng) // The phase-0 orientation draw occurs before the first real spiral query.
    searches = []
    observedWorld = world
    world.turn = 61
    world.ai.cursor = slot
    try {
      stepComputerTasks(world, 3)
    } finally {
      observedWorld = undefined
    }
    assert.ok(searches.length > 0)
    assert.deepEqual(searches[0], { args: [center, 0, 1], random: rng.randomState })
    assert.equal(request.origin, 0x8062)
    assert.equal(world.ai.coordinateLatch, 0x8232)
    // Genuine site search can create a plan, move the target and consume more
    // state. Only the observed search input and phase-0 RNG are compared here.
  }
  test('authored Tower latch overrides search center while preserving request origin', () => {
    searchEntry(scenario({ moved: false }), 0x8232)
  })
  test('supplied latch-disabled Tower search consumes the loaded request origin', () => {
    const world = scenario()
    world.ai.flags &= ~0x20 // Supplied input; no ordinary latch-disabled history is claimed.
    searchEntry(world, 0x8062)
  })
}
