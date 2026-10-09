import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import test, { mock } from 'node:test'

if (!process.execArgv.includes('--experimental-test-module-mocks')) {
  test('actual raid staging caller controls', t => {
    const env = { ...process.env, NODE_OPTIONS: '', NODE_PATH: '' }
    delete env.NODE_TEST_CONTEXT
    t.diagnostic(`isolated child: inherited NODE_TEST_CONTEXT=${process.env.NODE_TEST_CONTEXT ?? 'absent'}; child context absent`)
    const result = spawnSync(process.execPath, [
      '--experimental-test-module-mocks', '--test', fileURLToPath(import.meta.url),
    ], {
      encoding: 'utf8', timeout: 10_000, maxBuffer: 1024 * 1024,
      env,
    })
    t.diagnostic(result.stdout)
    assert.equal(result.error, undefined)
    assert.match(result.stdout, /tests 39\b/, 'all thirty-nine child cases must report')
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
  const { migrateCheckpoint } = await import('../app/game-store.ts')
  const cases = [
    { name: 'established base precedes enabled defence', base: 0x8436, expected: 0x8436 },
    { name: 'established base precedes live Shaman', base: 0x8436, defence: false, expected: 0x8436 },
    { name: 'established cell zero is present', base: 0, expected: 0 },
    // These three former compatibility expectations described the old adapter,
    // not native 0x4f6020's stored loaded-Shaman fallback.
    { name: 'absent base uses loaded origin before enabled defence', expected: 0x8062 },
    { name: 'absent base uses loaded origin with defence disabled', defence: false, expected: 0x8062 },
    { name: 'absent base retains loaded origin without a Shaman', defence: false, removeShaman: true, expected: 0x8062 },
    { name: 'quota recruitment receives established base', base: 0x8436, phase: 3, quota: true, expected: 0x8436 },
    { name: 'fallback recruitment receives established base', base: 0x8436, phase: 3, expected: 0x8436 },
    { name: 'below-quota retreat receives established base', base: 0x8436, phase: 16, retreat: true, expected: 0x8436 },
    { name: 'finished raid returns to established base', base: 0x8436, phase: 16, expected: 0x8436 },
    { name: 'lost direct target returns to established base', base: 0x8436, phase: 17, expected: 0x8436 },
    { name: 'outbound target movement stays independent', base: 0x8436, phase: 9, expected: 0x8436, move: 0x2468 },
    { name: 'regroup movement stays independent', base: 0x8436, phase: 12, expected: 0x8436, move: 0x1357 },
    ...['direct', 'modern', 'legacy'].flatMap(checkpoint =>
      ['moved', 'dead', 'missing'].flatMap(shaman => [true, false].map(defence => ({
        name: `Mission 2 loaded origin with ${shaman} Shaman, defence ${defence ? 'on' : 'off'}, ${checkpoint}`,
        checkpoint, shaman, defence, expected: 0x8062,
      })))),
    { name: 'Mission 1 loaded origin ignores moved Shaman', level: 1, shaman: 'moved', defence: false, expected: 0x1c08 },
    { name: 'Mission 3 staging uses loaded origin before defence', level: 3, shaman: 'moved', expected: 0x60da },
    { name: 'Mission 3 checkpoint staging survives missing Shaman', level: 3, shaman: 'missing', defence: false, checkpoint: 'modern', expected: 0x60da },
    { name: 'Mission 3 legacy recruitment retains loaded origin', level: 3, shaman: 'moved', checkpoint: 'legacy', phase: 3, quota: true, expected: 0x60da },
    { name: 'Mission 3 recruitment retains established base priority', level: 3, base: 0x60d8, shaman: 'moved', phase: 3, quota: true, expected: 0x60d8 },
    { name: 'Mission 3 established cell zero precedes loaded origin', level: 3, base: 0, shaman: 'moved', expected: 0 },
    { name: 'later Mission 5 retains enabled defence fallback', level: 5, tribe: 1, memberKind: 'warrior', shaman: 'moved', shamanPoint: { x: 24, z: -40 }, expected: 0x8232 },
    { name: 'later Mission 5 retains live Shaman fallback', level: 5, tribe: 1, memberKind: 'warrior', shaman: 'moved', shamanPoint: { x: 24, z: -40 }, defence: false, expected: 0x2020 },
  ]
  for (const c of cases) test(c.name, () => {
    const level = c.level ?? 2, tribe = c.tribe ?? [0, 1, 3, 2][level],
      team = ['blue', 'red', 'yellow', 'green'][tribe]
    let world = createWorld(level)
    const shaman = world.units.find(u => u.team === team && u.kind === 'shaman')
    assert.ok(shaman)
    if (c.shaman === 'moved') Object.assign(shaman, c.shamanPoint ?? { x: -8, z: -8 })
    if (c.shaman === 'dead') {
      shaman.hp = 0
      if (shaman.native) shaman.native.life = 0
    }
    if (c.shaman === 'missing' || c.removeShaman)
      world.units = world.units.filter(u => u !== shaman)
    world.ai.flags = c.defence === false ? world.ai.flags & ~0x100 : world.ai.flags | 0x100
    world.ai.defencePosition = 0x8232
    if (Object.hasOwn(c, 'base')) world.ai.constructionBase = c.base
    else assert.equal(world.ai.constructionBase, undefined)
    if (c.checkpoint && c.checkpoint !== 'direct') {
      const saved = structuredClone(world)
      if (c.checkpoint === 'legacy') {
        // Supported old single-AI ownership shape; exercise the real retag path.
        for (const unit of saved.units) {
          if (unit.team === team) unit.team = 'red'
          for (const person of [unit.native, unit.flight, unit.entry?.person,
            unit.builder?.person, unit.fight?.motion, unit.resident?.person])
            if (person?.tribe === tribe) person.tribe = 1
        }
        for (const building of saved.buildings) if (building.team === team) building.team = 'red'
        for (const footprint of saved.buildingFootprints.values())
          if (footprint.tribe === tribe) footprint.tribe = 1
        delete saved.campaignAIs
        delete saved.activeCampaignTribe
        delete saved.spellScans
        delete saved.respawns
        delete saved.respawnPoints
        assert.equal(Object.hasOwn(saved, 'campaignAIs'), false)
        assert.equal(Object.hasOwn(saved, 'activeCampaignTribe'), false)
        assert.ok(saved.units.some(u => u.team === 'red'))
      }
      world = migrateCheckpoint(saved)
    }
    const ai = world.ai
    assert.equal(world.activeCampaignTribe, tribe)
    assert.equal(ai, world.campaignAIs[tribe])
    if (c.checkpoint === 'legacy') {
      assert.ok(world.units.some(u => u.team === team))
      assert.equal(world.units.some(u => u.team === 'red'), false)
      for (const unit of world.units.filter(u => u.team === team))
        if (unit.native) assert.equal(unit.native.tribe, tribe)
    }
    // Explicit controlled caller fixtures; no ordinary/native-history claim.
    assert.equal(!!(ai.flags & 0x100), c.defence !== false)
    assert.equal(ai.defencePosition, 0x8232)
    assert.equal(ai.constructionBase, c.base)
    ai.cursor = 0
    for (const task of ai.tasks) task.flags = 0
    const members = world.units.filter(u => u.team === team && u.kind === (c.memberKind ?? 'brave') && u.hp > 0).slice(0, 2)
    assert.equal(members.length, 2)
    const task = ai.tasks[0], phase = c.phase ?? 5
    Object.assign(task, { flags: 1, type: 20, phase, target: 0x2468, regroup: 0x1357,
      requested: c.retreat ? 10 : 2, retreatPercent: c.retreat ? 50 : 0,
      members: phase === 3 ? [] : members.map(u => u.id), selected: 0, remaining: 0,
      quotas: c.quota ? [100, 0, 0, 0, 0, 0] : [0, 0, 0, 0, 0, 0],
      extra: 0, damage: 0, entity: phase === 17 ? 65534 : 0 })
    assert.equal(actual.computerPhase(world.turn, tribe), 'dispatch')
    observed = { world, calls: 0, recruitment: [] }
    const seed = world.randomState, pool = structuredClone(world.buildingOrders)
    assert.throws(() => stepComputerTasks(world, tribe), error => error === stop)
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
