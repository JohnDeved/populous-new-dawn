import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import test, { mock } from 'node:test'

if (!process.execArgv.includes('--experimental-test-module-mocks')) {
  test('construction preparation lifetime through actual task dispatch', t => {
    const env = { ...process.env, NODE_OPTIONS: '', NODE_PATH: '' }
    delete env.NODE_TEST_CONTEXT
    const result = spawnSync(process.execPath,
      ['--experimental-test-module-mocks', '--test', fileURLToPath(import.meta.url)],
      { encoding: 'utf8', timeout: 30_000, env })
    t.diagnostic(result.stdout)
    assert.equal(result.status, 0, result.stdout + result.stderr)
  })
} else {
  const construction = await import('../app/construction-runtime.ts')
  let preparations = 0, proposals = 0, accept = false, selected = 0, paths = 0
  mock.module(new URL('../app/construction-runtime.ts', import.meta.url), {
    cache: true,
    namedExports: {
      ...construction,
      checkBuildingSite() { preparations++; proposals++; return { valid: accept, flags: 0 } },
      prepareBuildingSiteCheck() {
        preparations++
        return () => { proposals++; return { valid: accept, flags: 0 } }
      },
    },
  })
  const selection = await import('../app/computer-selection.ts')
  mock.module(new URL('../app/computer-selection.ts', import.meta.url), {
    cache: true, namedExports: { ...selection,
      selectComputerPeople(...args) { return selected ? [selected] : selection.selectComputerPeople(...args) },
    },
  })
  const commands = await import('../app/live-command.ts')
  mock.module(new URL('../app/live-command.ts', import.meta.url), {
    cache: true, namedExports: { ...commands,
      findPath() { paths++; return [] },
    },
  })
  const { createWorld } = await import('../app/world-initialization.ts')
  const { stepComputerTasks } = await import('../app/computer-runtime.ts?building-site-phase')
  function scenario() {
    const w = createWorld(6)
    for (const t of w.ai.tasks) t.flags = 0
    Object.assign(w.ai.tasks[0], { flags: 1, type: 0, phase: 2, requested: 1,
      target: 0x8080, elapsed: 0, remaining: 2000, mode: 1, fallback: 0, members: [] })
    w.ai.cursor = 0
    w.turn = 1
    w.units = [] // Valid proposals fail worker selection, not placement.
    preparations = proposals = paths = selected = 0
    return w
  }
  test('forty consecutive rejected proposals prepare once, then new call prepares again', () => {
    const w = scenario(); accept = false
    stepComputerTasks(w, w.activeCampaignTribe)
    assert.equal(proposals, 40)
    assert.equal(preparations, 1)
    stepComputerTasks(w, w.activeCampaignTribe)
    assert.equal(proposals, 80)
    assert.equal(preparations, 2)
  })
  test('valid sites with a selected worker but no route prepare again', () => {
    const w = scenario(); accept = true
    const source = createWorld(6)
    const unit = source.units.find(u => u.team !== 'wild' && u.kind === 'brave')
    w.units = [unit]; selected = unit.id
    stepComputerTasks(w, w.activeCampaignTribe)
    assert.equal(proposals, 40)
    assert.equal(paths, 40)
    assert.equal(preparations, 40)
    assert.equal(w.ai.tasks[0].phase, 2)
  })
  test('valid sites with no worker discard preparation before the next proposal', () => {
    const w = scenario(); accept = true
    stepComputerTasks(w, w.activeCampaignTribe)
    assert.equal(proposals, 40)
    assert.equal(preparations, 40)
    assert.equal(w.ai.tasks[0].phase, 2)
  })
}
