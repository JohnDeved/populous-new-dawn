import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { browserCapMs, browserScenarios } from '../scripts/tutorial-browser/scenario-policy.mjs'
const source = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')

test('Tornado reuses profile recovery lane and unchanged 180-second outer cap', () => {
  assert.equal(browserCapMs('profile-recovery'), 180000)
  assert.equal(browserScenarios.includes('tornado-appearance'), false)
  const host = source('scripts/tutorial-browser/run.mjs')
  assert.match(host, /runTornado: async \(\{ signal, deadlineAt \}\)/)
  assert.match(host, /budgetMs: Math\.min\(90000, deadlineAt - Date\.now\(\)\)/)
  assert.match(host, /artifactDir: out, budgetMs:/)
  assert.match(host, /budgetMs: Math\.min\(90000, deadlineAt - Date\.now\(\)\),\s*signal, deadlineAt/)
  assert.match(host, /receipt\.browserCapMs = browserCapMs\(selectedScenario\)/)
  assert.doesNotMatch(source('.github/workflows/tutorial-browser.yml'), /scenario: tornado/)
})

test('only two Tornado readiness sites opt in within original action, readiness and enclosing caps', () => {
  const checker = source('scripts/check-browser-tornado-appearance.mjs')
  assert.match(checker, /page.setDefaultTimeout\(8000\)/)
  assert.match(checker, /setupTimeout: 8000, deadlineAt: inputDeadlineAt, signal: inputAbort.signal, trace/)
  assert.match(checker, /inputDeadlineAt = Number.isFinite\(deadlineAt\) \? Math.min\(deadlineAt, Date.now\(\) \+ budgetMs\) : null/)
  assert.match(checker, /inputDeadlineAt === null\) return recoverVisibleIntroduction\(page\)/)
  for (const phase of ['initial', 'restart'])
    assert.match(checker, new RegExp(`timeout: 12000,\\s*signal: inputAbort.signal,\\s*onBlocked: recoverIntroduction\\('${phase}'\\)`))
  assert.equal((checker.match(/onBlocked: recoverIntroduction\(/g) ?? []).length, 2)
  assert.match(checker, /expired = true\s*inputAbort.abort/)
  assert.match(checker, /signal\?\.removeEventListener\('abort', outerAborted\)/)
  assert.match(checker, /clearTimeout\(deadline\)/)
})

test('hosted checker never imports unserved source URLs and adapter is opt-in fixture only', () => {
  const checker = source('scripts/check-browser-tornado-appearance.mjs'),
    fixture = source('scripts/tutorial-browser/fixture/main.tsx')
  assert.doesNotMatch(checker, /import\(['"]\/(?:app|scripts)\//)
  assert.match(checker, /waitRecoveryReadiness/)
  assert.match(checker, /target\.searchParams\.set\('tornado-appearance', '1'\)/)
  assert.match(fixture, /get\('tornado-appearance'\) === '1'/)
  assert.match(fixture, /import\('\.\.\/tornado-fixture\.mjs'\)/)
  assert.match(fixture, /'__pndTornadoFixture'/)
  assert.doesNotMatch(source('app/page.tsx'), /tornado-fixture|__pndTornadoFixture/)
  const adapter = source('scripts/tutorial-browser/tornado-fixture.mjs')
  assert.match(adapter, /export \{ advanceGame \} from '\.\.\/\.\.\/app\/game-clock\.ts'/)
  assert.match(adapter, /export \{ spellInRange \} from '\.\.\/\.\.\/app\/spell-casting\.ts'/)
  assert.doesNotMatch(adapter, /createTornado|stepTornado|createEffect/)
})

test('actual production focus clears targeting, so checker must focus before HUD selection', async () => {
  const { requestCameraFocus } = await import('../app/camera-motion.ts')
  const camera = source('app/scene-camera-runtime.ts'),
    start = camera.indexOf('export function focus('),
    end = camera.indexOf('export function cameraBookmark(', start)
  assert.ok(start >= 0 && end > start)
  // Execute the production focus body, adapting only its TS signature. Camera
  // movement is the real pure production function; no copied cancellation rule.
  const focusSource = camera
    .slice(start, end)
    .replace(
      /^export function focus\([^\n]+\) \{/,
      'return function focus(scene, p = HOME, { animate = false } = {}) {'
    )
  const focus = new Function(
    'requestCameraFocus',
    'nativePosition',
    'browserPosition',
    'HOME',
    focusSource
  )(
    requestCameraFocus,
    (_world, p) => ({ x: p.x, y: p.z, angle: -1 }),
    p => ({ x: p.x, z: p.y }),
    { x: 0, z: 0 }
  )
  const scene = {
    world: { mode: 'tornado', inputMask: 0 },
    cameraMotion: { active: 0 },
    cameraPosition: { x: 0, y: 0, angle: 0 },
    tooltip: { draw: 1 },
    cancelOverview() {},
    captureCamera() {},
    updateView() {},
  }
  focus(scene, { x: 10, z: 12 })
  assert.equal(scene.world.mode, null, 'focusing after HUD selection cancels the intended cast')
  assert.deepEqual(scene.cameraPosition, { x: 10, y: 12, angle: 0 })
  const checker = source('scripts/check-browser-tornado-appearance.mjs'),
    focusAt = checker.indexOf('s.focus(target)'),
    selectAt = checker.indexOf('name: /^Tornado, \\d+ shots$/'),
    guardAt = checker.indexOf('episode.cast.before.mode'),
    clickAt = checker.indexOf('await page.mouse.click(episode.target.pointer.x')
  assert.ok(focusAt > 0 && selectAt > focusAt && guardAt > selectAt && clickAt > guardAt)
  assert.doesNotMatch(
    checker.slice(selectAt, clickAt),
    /\.focus\(|\.mode\s*=/,
    'no camera cancellation or direct spell-mode assignment after genuine HUD selection'
  )
})

test('cast diagnostics and all Tornado artifacts fit existing root upload patterns', () => {
  const checker = source('scripts/check-browser-tornado-appearance.mjs'),
    host = source('scripts/tutorial-browser/run.mjs'),
    workflow = source('.github/workflows/tutorial-browser.yml')
  assert.match(host, /artifactDir: out, budgetMs:/)
  assert.match(checker, /resolve\(dir, 'tornado-appearance\.json'\)/)
  assert.match(workflow, /outputs\/tutorial-browser\/\*\.json/)
  assert.match(workflow, /outputs\/tutorial-browser\/\*\.png/)
  assert.match(checker, /episode\.cast\.after = await readCastState/)
  assert.match(checker, /episode\.failureState = await readCastState/)
  for (const marker of [
    'canvasHit',
    'targetError',
    'modalSuspended',
    'overviewStage',
    'cooldown',
    'projectiles',
    'tornadoes',
  ])
    assert.ok(checker.includes(marker), `cast failure must retain ${marker}`)
  assert.match(checker, /tornado-\$\{kind\}-failure\.png/)
  assert.doesNotMatch(
    checker,
    /resolve\(dir, `\$\{kind\}/,
    'episode screenshots need distinct root-level Tornado prefixes'
  )
})
