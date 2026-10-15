import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import test, { mock } from 'node:test'

if (!process.execArgv.includes('--experimental-test-module-mocks')) {
  test('M7 Convert real origin and legacy-spell callers', t => {
    const env = { ...process.env, NODE_OPTIONS: '', NODE_PATH: '' }
    delete env.NODE_TEST_CONTEXT
    const result = spawnSync(process.execPath,
      ['--experimental-test-module-mocks', '--test', fileURLToPath(import.meta.url)],
      { encoding: 'utf8', timeout: 20_000, maxBuffer: 1024 * 1024, env })
    t.diagnostic(result.stdout)
    assert.equal(result.error, undefined)
    assert.match(result.stdout, /tests 9\b/)
    assert.equal(result.status, 0, result.stderr + result.stdout)
  })
} else {
  const convert = await import('../app/computer-convert.ts')
  let origins = [], contexts = []
  mock.module(new URL('../app/computer-convert.ts', import.meta.url), {
    cache: true, namedExports: { ...convert, findConvertTarget(origin, ...args) {
      origins.push(origin)
      return convert.findConvertTarget(origin, ...args)
    } },
  })
  mock.module(new URL('../app/computer-spells.ts', import.meta.url), {
    cache: true, namedExports: {
      spyDisguisedFrom: () => false, castShoreBlast: () => false, chooseSpellTarget: () => {},
      stepConvertWildTarget: () => {}, convertWildDensity: () => 0, summarizeSpellEnemies: () => {},
      processComputerSpells(w, scan, caster, context) {
      contexts.push(context.nativeConvertTask)
    } },
  })
  const { stepComputerTasks, stepComputerSpells } = await import('../app/computer-runtime.ts')
  const { createWorld } = await import('../app/world-initialization.ts')
  const { migrateCheckpoint } = await import('../app/game-store.ts')
  const { createLivePerson } = await import('../app/live-people.ts')
  const { browserPosition } = await import('../app/world-coordinates.ts')
  for (const restore of [false, true]) for (const base of [undefined, 0, 0x1010])
    test(`M7 moved Shaman retains loaded origin; base=${base}, restore=${restore}`, () => {
      let w = createWorld(7)
      const shaman = w.units.find(u => u.team === 'yellow' && u.kind === 'shaman')
      assert.deepEqual([shaman.x, shaman.z], [25, -35])
      Object.assign(shaman, browserPosition({ x: 0xd000, y: 0xd000 }))
      shaman.native = createLivePerson(w, shaman)
      for (const task of w.ai.tasks) task.flags = 0
      w.ai.constructionBase = base
      convert.requestConvertTask(w.ai, 4, 1)
      if (restore) w = migrateCheckpoint(structuredClone(w))
      w.turn = 1
      w.ai.cursor = 0
      origins = []
      stepComputerTasks(w, 2)
      assert.deepEqual(origins, [base ?? 0x1a20])
    })
  for (const [level, tribe, expected] of [[3, 2, true], [7, 2, true], [7, 1, false]])
    test(`legacy Convert suppression level${level}/tribe${tribe}=${expected}`, () => {
      const w = createWorld(level)
      contexts = []
      stepComputerSpells(w, tribe)
      assert.deepEqual(contexts, [expected])
    })
}
