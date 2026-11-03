import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { EventEmitter } from 'node:events'
import { towerLimits, assertTowerArtifactInventory, singleEpisodeBrowser } from '../scripts/tower-collection-evidence/policy.mjs'
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8')

test('Tower policy is bounded independently of the unchanged native UI suite', () => {
  assert.deepEqual(towerLimits, { browserMs: 600000, maxContexts: 1, maxPages: 1, screenshots: 4, artifactBytes: 33554432 })
  assert.ok(Object.isFrozen(towerLimits))
  assertTowerArtifactInventory({ screenshots: 4, bytes: 33554432 })
  for (const inventory of [{ screenshots: 5, bytes: 0 }, { screenshots: 0, bytes: 33554433 },
    { screenshots: -1, bytes: 0 }, { screenshots: 0, bytes: NaN }])
    assert.throws(() => assertTowerArtifactInventory(inventory))
})

test('Resource limits fail closed even when candidate catches the exception', async () => {
  const context = new EventEmitter()
  let created = 0, captured = 0
  context.newPage = async () => {
    created++
    const page = { screenshot: async () => { captured++ } }
    context.emit('page', page)
    return page
  }
  const report = { errors: [] }
  const browser = singleEpisodeBrowser({ newContext: async () => context }, report)
  const owned = await browser.newContext()
  const page = await owned.newPage()
  for (let i = 0; i < 4; i++) await page.screenshot({})
  await assert.rejects(page.screenshot({}), /screenshot budget/)
  await assert.rejects(owned.newPage(), /page budget/)
  await assert.rejects(browser.newContext(), /context budget/)
  assert.equal(created, 1)
  assert.equal(captured, 4)
  assert.equal(report.errors.length, 3)
})

test('Unexpected popup makes the evidence fail', async () => {
  const context = new EventEmitter()
  context.newPage = async () => {}
  const report = { errors: [] }
  await singleEpisodeBrowser({ newContext: async () => context }, report).newContext()
  context.emit('page', { screenshot() {} })
  let closed = 0
  context.emit('page', { screenshot() {}, async close() { closed++ } })
  assert.equal(report.errors[0].text, 'Unexpected Tower popup/page')
  assert.equal(closed, 1)
})

test('Failed screenshot attempts cannot reset the capture budget', async () => {
  const context = new EventEmitter()
  let captures = 0
  context.newPage = async () => {
    const page = { screenshot: async () => { captures++; throw Error('capture failed') } }
    context.emit('page', page)
    return page
  }
  const report = { errors: [] }
  const owned = await singleEpisodeBrowser({ newContext: async () => context }, report).newContext()
  const page = await owned.newPage()
  for (let i = 0; i < 4; i++) await assert.rejects(page.screenshot({}), /capture failed/)
  await assert.rejects(page.screenshot({}), /screenshot budget/)
  assert.equal(captures, 4)
  assert.equal(report.errors.length, 1)
})

test('New route preserves original dispatch modes and source/receipt gates', () => {
  const workflow = read('.github/workflows/native-ui-evidence.yml')
  for (const kind of ['native-ui', 'material-lifecycle', 'options-controls', 'tower-collection'])
    assert.ok(workflow.includes('          - ' + kind + '\n'))
  assert.ok(workflow.includes("['native-ui', 'material-lifecycle', 'options-controls', 'tower-collection']"))
  assert.ok(workflow.includes("steps.tower-bounds.outcome == 'success'"))
  assert.ok(workflow.includes('node --max-old-space-size=768 evidence-infrastructure/scripts/tower-collection-evidence/run.mjs'))
  assert.ok(workflow.includes('persist-credentials: false'))
  assert.ok(workflow.includes('retention-days: 7'))
  const runner = read('scripts/tower-collection-evidence/run.mjs')
  for (const gate of ['manualIdentity(process.env)', 'separateRoots(', 'sourceManifest(',
    'verifyManifest(', 'dependencyReceipt(', 'verifyBuiltOutput(', 'afterScopes(',
    'finalizeArtifactReceipt(', 'capMs: towerLimits.browserMs', 'artifactInventory(output)'])
    assert.ok(runner.includes(gate), gate)
  const adapter = read('scripts/tower-collection-evidence/adapter.mjs')
  for (const gate of ['boundedEpisode(', 'singleEpisodeBrowser(owner.browser, report)',
    'signal.throwIfAborted()', 'assert.deepEqual(report.errors, [])', 'owner.closeContexts()', 'owner.close()'])
    assert.ok(adapter.includes(gate), gate)
  const worker = read('scripts/tower-collection-evidence/browser-worker.mjs')
  assert.ok(worker.includes('browserConfiguration()'))
  assert.ok(worker.includes("candidateDependencyExport(candidateRoot, '@playwright/test', 'chromium')"))
  assert.ok(worker.includes('await browser?.close(); await server?.close()'))
})

