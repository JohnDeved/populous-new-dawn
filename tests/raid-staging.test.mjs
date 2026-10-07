import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import test, { mock } from 'node:test'

if (!process.execArgv.includes('--experimental-test-module-mocks')) {
  test('actual raid staging caller controls', t => {
    const env = { ...process.env, NODE_OPTIONS: '', NODE_PATH: '' }
    delete env.NODE_TEST_CONTEXT
    const result = spawnSync(process.execPath, [
      '--experimental-test-module-mocks', '--test', fileURLToPath(import.meta.url),
    ], {
      encoding: 'utf8', timeout: 10_000, maxBuffer: 1024 * 1024,
      env,
    })
    t.diagnostic(result.stdout)
    assert.equal(result.error, undefined)
    assert.match(result.stdout, /tests 13\b/, 'all thirteen child cases must report')
    assert.equal(result.status, 0, result.stderr + result.stdout)
  })
} else {
  // Same built-in observation pattern as mission3-raid-recruitment-pair.mjs.
  // The actual dispatcher, live adapter, controller and recruitment callbacks run.
  // Stop after the real controller returns; order attachment/pathing is covered by
  // the separate natural Mission2 trace, not supplied by these caller controls.
  const actual = await import('../app/computer.ts')
  const stop = new Error('observed actual raid controller return')
  let observed
  mock.module(new URL('../app/computer.ts', import.meta.url), {
    cache: true,
    namedExports: {
      ...actual,
      stepAttackTask(ai, index, input) {
        assert.ok(observed)
        assert.equal(++observed.calls, 1)
        assert.equal(ai, observed.world.ai)
        assert.equal(index, 0)
        observed.staging = input.staging
        observed.actions = actual.stepAttackTask(ai, index, {
          ...input,
          select(...args) {
            const ids = input.select(...args)
            observed.recruitment.push({ args, ids: [...ids] })
            return ids
          },
        })
        throw stop
      },
    },
  })
  const { stepComputerTasks } = await import('../app/computer-runtime.ts')
  const { createWorld } = await import('../app/world-initialization.ts')
  const cases = [
    { name: 'established base precedes enabled defence', base: 0x8436, expected: 0x8436 },
    { name: 'established base precedes live Shaman', base: 0x8436, defence: false, expected: 0x8436 },
    { name: 'established cell zero is present', base: 0, expected: 0 },
    { name: 'absent base retains enabled defence', expected: 0x8232 },
    { name: 'absent base retains live Shaman', defence: false, expected: 0x8062 },
    { name: 'absent base and Shaman retain zero', defence: false, removeShaman: true, expected: 0 },
    { name: 'quota recruitment receives established base', base: 0x8436, phase: 3, quota: true, expected: 0x8436 },
    { name: 'fallback recruitment receives established base', base: 0x8436, phase: 3, expected: 0x8436 },
    { name: 'below-quota retreat receives established base', base: 0x8436, phase: 16, retreat: true, expected: 0x8436 },
    { name: 'finished raid returns to established base', base: 0x8436, phase: 16, expected: 0x8436 },
    { name: 'lost direct target returns to established base', base: 0x8436, phase: 17, expected: 0x8436 },
    { name: 'outbound target movement stays independent', base: 0x8436, phase: 9, expected: 0x8436, move: 0x2468 },
    { name: 'regroup movement stays independent', base: 0x8436, phase: 12, expected: 0x8436, move: 0x1357 },
  ]
  for (const c of cases) test(c.name, () => {
    const world = createWorld(2), ai = world.ai
    assert.equal(world.activeCampaignTribe, 3)
    assert.equal(ai, world.campaignAIs[3])
    // Explicit controlled caller fixtures; no ordinary/native-history claim.
    ai.flags = c.defence === false ? ai.flags & ~0x100 : ai.flags | 0x100
    ai.defencePosition = 0x8232
    if (Object.hasOwn(c, 'base')) ai.constructionBase = c.base
    else assert.equal(ai.constructionBase, undefined)
    if (c.removeShaman) world.units = world.units.filter(u => u.team !== 'green' || u.kind !== 'shaman')
    ai.cursor = 0
    for (const task of ai.tasks) task.flags = 0
    const members = world.units.filter(u => u.team === 'green' && u.kind === 'brave' && u.hp > 0).slice(0, 2)
    assert.equal(members.length, 2)
    const task = ai.tasks[0], phase = c.phase ?? 5
    Object.assign(task, { flags: 1, type: 20, phase, target: 0x2468, regroup: 0x1357,
      requested: c.retreat ? 10 : 2, retreatPercent: c.retreat ? 50 : 0,
      members: phase === 3 ? [] : members.map(u => u.id), selected: 0, remaining: 0,
      quotas: c.quota ? [100, 0, 0, 0, 0, 0] : [0, 0, 0, 0, 0, 0],
      extra: 0, damage: 0, entity: phase === 17 ? 65534 : 0 })
    assert.equal(actual.computerPhase(world.turn, 3), 'dispatch')
    observed = { world, calls: 0, recruitment: [] }
    const seed = world.randomState, pool = structuredClone(world.buildingOrders)
    assert.throws(() => stepComputerTasks(world, 3), error => error === stop)
    assert.equal(observed.calls, 1)
    assert.equal(observed.staging, c.expected)
    assert.equal(world.randomState, seed)
    assert.deepEqual(world.buildingOrders, pool, 'observer stops before order attachment')
    if (phase === 3) {
      assert.equal(observed.recruitment.length, 1)
      assert.equal(observed.recruitment[0].args[2], c.expected)
      assert.ok(observed.recruitment[0].ids.length > 0, 'real recruitment callback admitted followers')
      assert.deepEqual(task.members, observed.recruitment[0].ids)
    } else {
      assert.deepEqual(observed.actions, [{ kind: 'move', target: c.move ?? c.expected, replace: phase !== 12 }])
      assert.deepEqual(task.members, members.map(u => u.id))
      assert.equal(task.phase, phase === 9 ? 10 : phase === 17 ? 23 : 6)
      if (phase === 5) assert.equal(task.fallback, 18)
      if (phase === 16) assert.equal(task.fallback, 23)
      if (phase === 12) assert.equal(task.fallback, 14)
    }
    observed = undefined
  })
}
