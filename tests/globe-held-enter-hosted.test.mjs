import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { browserCapMs, browserScenarios } from '../scripts/tutorial-browser/scenario-policy.mjs'
const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8')
const runner = read('scripts/tutorial-browser/run.mjs')
const route = read('scripts/tutorial-browser/globe-held-enter.mjs')
const workflow = read('.github/workflows/globe-held-enter-browser.yml')

test('hosted held Enter is named, bounded and opt-in for an exact same-repository ready head', () => {
  assert.equal(browserScenarios.filter(s => s === 'globe-held-enter').length, 1)
  assert.equal(browserCapMs('globe-held-enter'), 180000)
  assert.match(workflow, /types: \[ready_for_review\]/)
  assert.match(workflow, /timeout-minutes: 15/)
  assert.match(workflow, /pull_request.draft == false/)
  assert.match(workflow, /pull_request.state == 'open'/)
  assert.match(workflow, /head.repo.full_name == github.repository/)
  assert.match(workflow, /base.repo.full_name == github.repository/)
  assert.match(workflow, /format\('enter-v1:\{0\}', github.event.pull_request.head.sha\)/)
  assert.match(workflow, /contents: read/)
  assert.match(workflow, /persist-credentials: false/)
  assert.match(workflow, /cancel-in-progress: false/)
  assert.doesNotMatch(workflow, /workflow_dispatch|pull_request_target|secrets\.|self-hosted|no-sandbox/)
})

test('actual dispatch awaits the route and retains its result, failures are not swallowed', async () => {
  const start = runner.indexOf("  } else if (selectedScenario === 'globe-held-enter') {")
  const end = runner.indexOf("  } else if (selectedScenario === 'gameplay-resources') {", start)
  assert.ok(start > 0 && end > start)
  const code = runner.slice(start, end).split('\n').slice(1).join('\n')
    .replace("(await import('./globe-held-enter.mjs')).default", 'route')
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
  const run = new AsyncFunction('receipt', 'route', 'page', 'url', 'out', 'source', code)
  const receipt = {}, page = {}, source = {}, result = {}
  await run(receipt, async args => {
    assert.deepEqual(args, { page, url: 'url', output: 'out', source })
    return result
  }, page, 'url', 'out', source)
  assert.equal(receipt.globeHeldEnter, result)
  await assert.rejects(run({}, async () => { throw Error('sentinel') }, page, 'url', 'out', source), /sentinel/)
})

test('route retains public gameplay setup, trusted witness and original globe controls', () => {
  assert.match(route, /await showAllMissions\(page\)/)
  assert.match(route, /name: 'Mission 1'/)
  assert.match(route, /await bindGame\(page\)/)
  assert.match(route, /await verifyHeldEnter\(\{ page, state, frame,/)
  for (const check of [
    'Native picking rejects a blended projection', '[256,214,171,129,86,43,0]',
    '[0,42,85,127,170,213,256]', 's.vertices.every(Number.isFinite)',
    's.ground,true', 'window.testScene.focus({x:8,z:30})', 'assert.deepEqual(errors,[])',
  ]) assert.ok(route.includes(check), check)
  assert.doesNotMatch(route, /chromium\.launch|browser\.newContext|setTimeout\(|process\.env|dispatchEvent/)
  assert.match(route, /Actual camera transitions advance with explicit 1\/24-second presentation ticks/)
  assert.match(route, /not natural OS autorepeat timing or hardware performance/)
})

test('same runner deadline and owned cleanup apply; failure remains failure', () => {
  assert.match(runner, /setTimeout\(\(\) => \{ receipt.browserTimedOut = true; abort.abort\(new Error\('Browser deadline exceeded'\)\); void browser.close\(\) \}, receipt.browserCapMs\)/)
  assert.match(runner, /await context\?\.close\(\); await browser\?\.close\(\); await server\?\.close\(\)/)
  assert.match(route, /report.status = 'failed'/)
  assert.match(route, /throw error/)
  assert.match(route, /finally \{/)
  assert.match(route, /page.off\('pageerror', onError\)/)
  assert.match(route, /page.off\('console', onConsole\)/)
})

test('production source identity and actual PNGs use existing retained output', () => {
  assert.match(workflow, /ref: \$\{\{ github.sha \}\}/)
  assert.match(workflow, /git diff --exit-code HEAD --/)
  assert.match(workflow, /retention-days: 7/)
  assert.match(workflow, /outputs\/tutorial-browser\/globe-held-enter\*\.png/)
  assert.match(workflow, /outputs\/tutorial-browser\/receipt.json/)
  assert.match(route, /commit: source.commit/)
  assert.match(route, /report.renderer = await page.evaluate/)
  assert.match(route, /writeFileSync\(resolve\(output, 'globe-held-enter.json'\)/)
  assert.doesNotMatch(route, /\/private\/tmp/)
})

test('capture manifest binds new runner without changing other trusted input checks', () => {
  const pins = JSON.parse(read('scripts/tutorial-browser/capture-qualified-inputs.json'))
  assert.equal(pins['scripts/tutorial-browser/run.mjs'], createHash('sha256').update(runner).digest('hex'))
  assert.match(runner, /if \(captureProtocolEnabled\) assert.equal\(selectedScenario, 'tutorial'/)
})

// The legacy dev scenario used a removed button. Verify the current shipped
// entry path, without replacing gameplay input with a scene method invocation.
test('both overview setup entries use the shipped gameplay Enter shortcut', () => {
  const page = read('app/page.tsx')
  assert.ok(page.includes("if (e.key === 'Enter' && !e.repeat && !(e.target as HTMLElement).closest('button'))\n        engine.current?.overview()"))
  assert.equal((route.match(/await page\.locator\('\.world-viewport canvas'\)\.focus\(\)\n {2}await page\.keyboard\.press\('Enter'\)/g) ?? []).length, 2)
  assert.doesNotMatch(route, /name: ?'Planet overview'|testScene\.overview\(/)
})
