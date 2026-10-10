import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import test, { mock } from 'node:test'

if (!process.execArgv.includes('--experimental-test-module-mocks')) {
  test('Mission 3 Convert Wild origin through the actual dispatcher', t => {
    const env = { ...process.env, NODE_OPTIONS: '', NODE_PATH: '' }
    delete env.NODE_TEST_CONTEXT
    const result = spawnSync(process.execPath, [
      '--experimental-test-module-mocks', '--test', fileURLToPath(import.meta.url),
    ], { encoding: 'utf8', timeout: 15_000, maxBuffer: 1024 * 1024, env })
    t.diagnostic(result.stdout)
    assert.equal(result.error, undefined)
    assert.match(result.stdout, /tests 12\b/, 'all twelve caller controls must run')
    assert.equal(result.status, 0, result.stderr + result.stdout)
  })
} else {
  const actual = await import('../app/computer-convert.ts')
  let queries
  mock.module(new URL('../app/computer-convert.ts', import.meta.url), {
    cache: true,
    namedExports: {
      ...actual,
      findConvertTarget(origin, counts, people, minimum, maximum) {
        const target = actual.findConvertTarget(origin, counts, people, minimum, maximum)
        queries.push({ origin, minimum, maximum, target, count: people.length })
        return target
      },
    },
  })
  const { stepComputerTasks } = await import('../app/computer-runtime.ts')
  const { createWorld } = await import('../app/world-initialization.ts')
  const { createLivePerson } = await import('../app/live-people.ts')
  const { migrateCheckpoint } = await import('../app/game-store.ts')
  const { browserPosition } = await import('../app/world-coordinates.ts')

  // Supplied caller states, not an ordinary Mission 3 history. Two actual Wildmen
  // have equal region density. The loaded origin admits only the first region;
  // the moved Shaman admits only the second. The real search computes the winner.
  function scenario({ base, marker = false, checkpoint = 'direct', unavailable } = {}) {
    let world = createWorld(3)
    const shaman = world.units.find(u => u.team === 'yellow' && u.kind === 'shaman'),
      wild = world.units.filter(u => u.team === 'wild').slice(0, 2)
    assert.ok(shaman)
    assert.equal(wild.length, 2)
    Object.assign(shaman, browserPosition({ x: 0x1000, y: 0x1000 }))
    shaman.native = createLivePerson(world, shaman)
    for (const [i, unit] of wild.entries()) {
      Object.assign(unit, browserPosition(i ? { x: 0x1000, y: 0x1000 } : { x: 0xd000, y: 0x7000 }))
    }
    world.units = [shaman, ...wild]
    if (unavailable === 'missing') world.units = wild
    if (unavailable === 'dead') {
      shaman.hp = 0
      shaman.native.life = 0
    }
    if (unavailable === 'assigned') shaman.native.computerAssignment = 1
    for (const task of world.ai.tasks) task.flags = 0
    world.ai.cursor = 0
    world.ai.attributes[0] = 0x120
    if (base !== undefined) world.ai.constructionBase = base
    else assert.equal(world.ai.constructionBase, undefined)
    assert.equal(world.ai.coordinateLatch, 0x52dc, 'retain the actual authored marker99 value')
    if (!marker) world.ai.flags &= ~0x40
    assert.equal(actual.requestConvertTask(world.ai, 4, wild.length), true)
    if (checkpoint !== 'direct') {
      const saved = structuredClone(world)
      if (checkpoint === 'legacy') {
        for (const unit of saved.units) {
          if (unit.team === 'yellow') unit.team = 'red'
          if (unit.native?.tribe === 2) unit.native.tribe = 1
        }
        for (const building of saved.buildings) if (building.team === 'yellow') building.team = 'red'
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
    assert.equal(world.outcome.level, 3)
    assert.equal(world.activeCampaignTribe, 2)
    assert.equal(world.ai, world.campaignAIs[2])
    assert.equal(world.ai.constructionBase, base)
    assert.equal(!!(world.ai.flags & 0x40), marker)
    return world
  }

  function visit(world) {
    queries = []
    const before = {
      random: world.randomState,
      pool: structuredClone(world.buildingOrders),
      units: structuredClone(world.units),
    }
    stepComputerTasks(world, 2)
    assert.equal(world.randomState, before.random)
    assert.deepEqual(world.buildingOrders, before.pool)
    assert.deepEqual(world.units, before.units)
    return world.ai.tasks[0]
  }

  function assertSearch(world, origin, expected) {
    const task = visit(world)
    assert.equal(task.target, expected, 'actual phase0 must choose the region near its source-owned origin')
    assert.deepEqual(queries, [{ origin, minimum: 0, maximum: 32, target: expected, count: 2 }])
    assert.deepEqual([task.phase, task.remaining, task.elapsed, task.extra], [2, 360, 0, 20])
    assert.equal(world.ai.flags & 0x40, 0)
  }

  for (const checkpoint of ['direct', 'modern', 'legacy'])
    test(`absent-base generic search uses loaded origin after ${checkpoint} ownership`, () => {
      assertSearch(scenario({ checkpoint }), 0x60da, 0x70d0)
    })

  for (const base of [0x1010, 0])
    test(`established base ${base} retains search priority`, () => {
      assertSearch(scenario({ base }), base, 0x1010)
    })

  for (const base of [undefined, 0x1010, 0])
    test(`authored marker99 overrides ${base === undefined ? 'absent' : base} base`, () => {
      const world = scenario({ base, marker: true }), task = visit(world)
      assert.equal(task.target, 0x52dc)
      assert.deepEqual(queries, [])
      assert.deepEqual([task.phase, task.remaining, task.elapsed, task.extra], [2, 360, 0, 20])
      assert.equal(world.ai.flags & 0x40, 0)
      assert.equal(world.ai.coordinateLatch, 0x52dc)
    })

  test('consumed marker99 does not replace the next generic search origin', () => {
    const world = scenario({ marker: true })
    assert.equal(visit(world).target, 0x52dc)
    world.ai.tasks[0].phase = 0
    world.ai.cursor = 0
    assertSearch(world, 0x60da, 0x70d0)
  })

  for (const unavailable of ['missing', 'dead', 'assigned'])
    test(`${unavailable} live Shaman still cancels before origin search`, () => {
      const task = visit(scenario({ unavailable }))
      assert.deepEqual(queries, [])
      assert.equal(task.phase, 3)
      assert.equal(task.flags & 3, 0)
    })
}
