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
  assert.match(host, /artifactDir: resolve\(out, 'tornado-appearance'\)/)
  assert.match(host, /receipt\.browserCapMs = browserCapMs\(selectedScenario\)/)
  assert.doesNotMatch(source('.github/workflows/tutorial-browser.yml'), /scenario: tornado/)
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
