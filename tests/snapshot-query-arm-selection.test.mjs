import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { snapshotQueryArmSelection } from '../scripts/tutorial-browser/snapshot-query-arm-selection.mjs'
import { browserCapMs } from '../scripts/tutorial-browser/scenario-policy.mjs'
const head = 'a'.repeat(40), repo = 'JohnDeved/populous-new-dawn', label = `qry-v1:${head}`
const event = () => ({ action: 'labeled', label: { name: label }, pull_request: { draft: false, state: 'open', labels: [{ name: label }], head: { sha: head, repo: { full_name: repo } }, base: { ref: 'main', repo: { full_name: repo } } } })
test('only exact-head same-repository Ready or exact labeled event admits', () => {
  const e = event(); assert.equal(snapshotQueryArmSelection(e, 'pull_request', head, 'snapshot-query-arm'), true)
  e.action = 'ready_for_review'; delete e.label; assert.equal(snapshotQueryArmSelection(e, 'pull_request', head, 'snapshot-query-arm'), true)
})
for (const change of ['draft', 'closed', 'wrong-head', 'stale-label', 'foreign-head', 'foreign-base', 'base-ref', 'wrong-label-event', 'synchronize']) {
  test(`reject ${change}`, () => {
    const e = event(), p = e.pull_request
    if (change === 'draft') p.draft = true
    if (change === 'closed') p.state = 'closed'
    if (change === 'wrong-head') p.head.sha = 'b'.repeat(40)
    if (change === 'stale-label') p.labels = [{ name: `qry-v1:${'b'.repeat(40)}` }]
    if (change === 'foreign-head') p.head.repo.full_name = 'foreign/repo'
    if (change === 'foreign-base') p.base.repo.full_name = 'foreign/repo'
    if (change === 'base-ref') p.base.ref = 'dev'
    if (change === 'wrong-label-event') e.label.name = 'cam-v1:' + head
    if (change === 'synchronize') e.action = 'synchronize'
    assert.equal(snapshotQueryArmSelection(e, 'pull_request', head, 'snapshot-query-arm'), false)
  })
}
test('no local/comment/other scenario activation; all existing caps retained', () => {
  for (const name of ['issue_comment', 'workflow_dispatch', undefined]) assert.equal(snapshotQueryArmSelection(event(), name, head, 'snapshot-query-arm'), false)
  assert.equal(snapshotQueryArmSelection(event(), 'pull_request', head, 'camera-motion-evidence'), false)
  assert.equal(browserCapMs('snapshot-query-arm'), 90000); assert.equal(browserCapMs('camera-motion-evidence'), 180000)
  assert.equal(browserCapMs('snapshot-protocol'), 90000); assert.equal(browserCapMs('tutorial'), 240000)
})
const runner = readFileSync(new URL('../scripts/tutorial-browser/run.mjs', import.meta.url), 'utf8')
test('actual runner cleanup requires settled route, disconnect and independently closed server', async () => {
  const start = runner.indexOf("    receipt.queryArmRunnerCleanup = {")
  const end = runner.indexOf("  } else if (selectedScenario === 'camera-motion-evidence')", start)
  assert.ok(start >= 0 && end > start)
  const body = runner.slice(start, end)
  for (const settled of [true, false]) {
    const receipt = { snapshotQueryArmEntered: true, snapshotQueryArm: { cleanupVerified: settled, operationSettled: settled, browserDisconnected: true } }
    const process = {}; let serverCloses = 0
    await vm.runInNewContext('(async () => {' + body + '})()', { receipt, process, browser: {}, server: { close: () => { serverCloses++ } }, closeOrdinaryPointerSmokeOwner: async close => { await close(); return { confirmed: true } } })
    assert.equal(receipt.cleanupVerified, settled); assert.equal(serverCloses, 1)
    if (!settled) assert.equal(process.exitCode, 1)
  }
})
test('actual runner source pins, route ownership handoff and no default context are present', () => {
  assert.match(runner, /snapshotQueryArmEntered = true/)
  assert.match(runner, /expectedGeneratorSha256: source.files\['scripts\/browser-performance\/snapshot-setup.mjs'\]/)
  assert.match(runner, /expectedCodecSha256: source.files\['scripts\/tutorial-browser\/checkpoint-codec.mjs'\]/)
  assert.match(runner, /expectedCheckpointVersion: CHECKPOINT_VERSION, receipt: receipt.snapshotQueryArm/)
  assert.match(runner, /'camera-motion-evidence', 'snapshot-query-arm'\]\.includes\(selectedScenario\)/)
  assert.match(runner, /assert.equal\(receipt.snapshotQueryArm.comparisonEligible, false\)/)
})
test('workflow is isolated opt-in, six-minute bound and bounded original JSON artifacts only', () => {
  const yaml = readFileSync(new URL('../.github/workflows/snapshot-query-arm.yml', import.meta.url), 'utf8')
  assert.match(yaml, /types: \[ready_for_review, labeled\]/); assert.match(yaml, /qry-v1:/)
  assert.match(yaml, /POPULOUS_BROWSER_SCENARIO: snapshot-query-arm\n/)
  assert.match(yaml, /timeout-minutes: 6/); assert.match(yaml, /cancel-in-progress: false/)
  assert.match(yaml, /witness <= 16 \* MiB && outer <= 8 \* MiB && witness \+ outer <= 24 \* MiB/)
  assert.ok(!yaml.includes('camera-*.png')); assert.match(yaml, /outputs\/tutorial-browser\/arm-\*.json/)
})
test('actual runner dispatch passes exact pins and shared receipt only to selected route', async () => {
  const start = runner.indexOf('    receipt.snapshotQueryArm = {}'), end = runner.indexOf("  } else if (selectedScenario === 'ordinary-pointer-smoke')", start)
  assert.ok(start >= 0 && end > start)
  const body = runner.slice(start, end).replace("(await import('../browser-performance/snapshot-query-arm.mjs')).default", 'route').replace("await import('../../app/checkpoint-format.ts')", 'format').replace("await import('../browser-performance/snapshot-drag-contract.mjs')", 'sourceContract').replace("await import('../browser-performance/reader-build.mjs')", 'sourceReader').replace("await import('../browser-performance/snapshot-reader-proof.mjs')", 'sourceProof')
  assert.ok(!body.includes('import('))
  const paths = ['scripts/browser-performance/snapshot-query-arm.mjs', 'scripts/browser-performance/snapshot-query-arm-core.mjs', 'scripts/browser-performance/snapshot-setup.mjs', 'scripts/tutorial-browser/checkpoint-codec.mjs', 'app/checkpoint-format.ts', 'scripts/tutorial-browser/snapshot-query-arm-selection.mjs', 'scripts/browser-performance/snapshot-query-witness.mjs', 'scripts/browser-performance/snapshot-query-witness-core.mjs', 'scripts/browser-performance/snapshot-geometry.mjs', 'scripts/browser-performance/snapshot-observer.mjs', 'scripts/browser-performance/snapshot-readers.mjs', 'scripts/browser-performance/snapshot-reader-proof.mjs', 'scripts/browser-performance/snapshot-protocol.mjs', 'scripts/browser-performance/reader-build.mjs', 'scripts/browser-performance/snapshot-drag-contract.mjs']
  const source = { commit: head, files: Object.fromEntries(paths.map(p => [p, 'b'.repeat(64)])) }, receipt = { buildRevision: head }, browser = {}
  await vm.runInNewContext('(async () => {' + body + '})()', { assert, receipt, source, browser, url: 'url', out: 'out', dist: 'dist', root: 'root', sourceContract: { inspectDragSource: () => ({ status: 'admitted' }) }, sourceReader: { readerSourceEvidence: () => ({ profile: 'supplied', importSha256: 'd'.repeat(64) }) }, sourceProof: { readerImportSha256: 'd'.repeat(64) }, format: { CHECKPOINT_VERSION: 5 }, route: async args => {
    assert.equal(receipt.snapshotQueryArmEntered, true); assert.equal(args.browser, browser); assert.equal(args.source, source); assert.equal(args.expectedRevision, head); assert.equal(args.expectedCheckpointVersion, 5)
    assert.equal(args.expectedGeneratorSha256, source.files['scripts/browser-performance/snapshot-setup.mjs']); assert.equal(args.expectedCodecSha256, source.files['scripts/tutorial-browser/checkpoint-codec.mjs']); assert.equal(args.receipt, receipt.snapshotQueryArm)
    Object.assign(args.receipt, { status: 'observed-unqualified', comparisonEligible: false, interpretationEligible: false })
  } })
})
test('actual workflow quota rejects unexpected, symlinked, oversized and aggregate witness data', () => {
  const yaml = readFileSync(new URL('../.github/workflows/snapshot-query-arm.yml', import.meta.url), 'utf8')
  const start = yaml.indexOf('          const dir ='), end = yaml.indexOf('\n          NODE', start)
  assert.ok(start >= 0 && end > start); const body = yaml.slice(start, end)
  const check = entries => vm.runInNewContext(body, { assert, existsSync: () => true, readdirSync: () => Object.keys(entries), lstatSync: path => {
    const e = entries[path.slice(path.lastIndexOf('/') + 1)]; return { size: e.size, isFile: () => e.file !== false, isSymbolicLink: () => !!e.link }
  } })
  check({ 'arm-query-owner.json': { size: 65536 }, 'arm-query-frames.json': { size: 8 * 1024 * 1024 }, 'receipt.json': { size: 1000 } })
  for (const e of [
    { 'arm-unknown.json': { size: 1 } }, { 'arm-query-owner.json': { size: 65537 } },
    { 'arm-query-frames.json': { size: 8 * 1024 * 1024 + 1 } }, { 'arm-query-owner.json': { size: 1, link: true } },
    { 'arm-query-owner.json': { size: 1, file: false } }, { 'build.log': { size: 8 * 1024 * 1024 + 1 } },
    { 'arm-query-frames.json': { size: 8 * 1024 * 1024 }, 'arm-snapshot-transfer.json': { size: 8 * 1024 * 1024 }, 'arm-query-owner.json': { size: 1 } },
  ]) assert.throws(() => check(e))
})
