import assert from 'node:assert/strict'
import test, { mock } from 'node:test'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
if (!process.execArgv.includes('--experimental-test-module-mocks')) {
  test('M7 real staging caller checks', () => {
    const env = { ...process.env, NODE_OPTIONS: '', NODE_PATH: '' }
    delete env.NODE_TEST_CONTEXT
    const result = spawnSync(process.execPath, ['--experimental-test-module-mocks', '--test', fileURLToPath(import.meta.url)], { env, encoding: 'utf8', timeout: 10000 })
    assert.equal(result.error, undefined)
    assert.equal(result.status, 0, result.stdout + result.stderr)
    assert.match(result.stdout, /tests 3\b/)
  })
} else {
const actual = await import('../app/computer.ts')
let observed
mock.module(new URL('../app/computer.ts', import.meta.url), {
  cache: true,
  namedExports: { ...actual, stepAttackTask(ai, index, input) {
    const actions = actual.stepAttackTask(ai, index, input)
    observed = { staging: input.staging, actions }
    return actions
  } },
})
const { createWorld } = await import('../app/model.ts')
const { stepComputerTasks } = await import('../app/computer-runtime.ts')
const { campaignCommand } = await import('../app/campaign-command-runtime.ts')
const { missionData, missionPosition } = await import('../app/mission-data.ts')
const { nativePosition } = await import('../app/world-terrain-runtime.ts')
const { default: script } = await import('../app/original-script-seven.json', {with:{type:'json'}})
for (const base of [undefined, 0, 0x8436]) test(`M7 loaded staging, explicit base ${base}`, () => {
  const w = createWorld(7)
  const authored = missionData(7).level.objects.filter(o => o.type === 1 && o.model === 7 && o.owner === 2)
  assert.equal(authored.length, 1)
  const p = nativePosition(w, missionPosition(7, 'yellow'))
  const loaded = ((p.x >>> 8) & 254) | (p.y & 0xfe00)
  w.ai.defencePosition = 0x1234
  w.ai.flags |= 0x100
  w.units.find(u => u.team === 'yellow' && u.kind === 'shaman').x += 20
  if (base !== undefined) w.ai.constructionBase = base
  w.ai.variables[18] = 6
  campaignCommand(w, 1059, script.codes.slice(883,896), script)
  const task = w.ai.tasks.find(t => t.type === 20 && (t.flags & 1))
  task.phase = 5
  observed = undefined
  stepComputerTasks(w, 2)
  assert.ok(observed)
  assert.equal(observed.staging, base ?? loaded)
  assert.notEqual(loaded, 0x1234)
  assert.equal(task.target, missionData(7).level.markers[4])
  assert.ok(observed.actions.some(a => a.kind === 'move' && a.target === (base ?? loaded)), JSON.stringify(observed.actions))
})

}
