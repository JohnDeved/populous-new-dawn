// Explicit launch only. Tests never import this entry or start the harness.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { parseOptions, runLocalBrowser } from '../../scripts/local-render/harness.mjs'
import scenario from './scenario.mjs'

const root = process.cwd(), here = resolve(root, 'qa/preacher-automatic-response')
const options = parseOptions(process.argv.slice(2)), side = process.env.PND_RESPONSE_SIDE
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
const sha = file => createHash('sha256').update(readFileSync(file)).digest('hex')
const inputs = JSON.parse(readFileSync(resolve(here, 'source-inputs.json')))
assert.ok(['baseline', 'candidate'].includes(side))
assert.equal(resolve(options.gameRoot), root); assert.equal(options.port, inputs.ports[side])
assert.equal(options.timeout, inputs.caps.harnessMs)
assert.equal(resolve(options.profile), resolve(root, inputs.profiles[side]))
assert.equal(resolve(options.scenario), resolve(here, 'scenario.mjs'))
assert.equal(options.profileCorrespondence, undefined)
assert.ok(!existsSync(options.profile), 'Initial acquisition requires a new task-owned profile')
assert.ok(resolve(options.output).startsWith(resolve(root, 'work/orchestration/preacher-automatic-response', side) + '/'))
assert.ok(!existsSync(options.output), 'Every attempt requires fresh output')
assert.match(process.env.PND_QA_HEAD ?? '', /^[0-9a-f]{40}$/)
assert.equal(git('rev-parse', 'HEAD'), process.env.PND_QA_HEAD); assert.equal(git('status', '--porcelain'), '')
const trees = inputs[side + 'Trees']; assert.ok(trees, 'Reviewed producer/consumer candidate has not been adopted')
for (const [name, expected] of Object.entries(trees)) assert.equal(git('rev-parse', `HEAD:${name}`), expected, name)
for (const [file, expected] of Object.entries(inputs.inheritedFiles)) assert.equal(sha(resolve(root, file)), expected, file)
const require = createRequire(resolve(root, 'package.json'))
const expectedRuntime = JSON.parse(readFileSync(resolve(root, 'qa/preacher-gesture-candidate/expected-runtime.json')))
const runtime = () => ({ node: process.version, browserSha256: sha(resolve(options.browserPath)),
  installedLockSha256: sha(resolve(root, 'node_modules/.package-lock.json')),
  packageLockSha256: sha(resolve(root, 'package-lock.json')), playwright: require('@playwright/test/package.json').version,
  playwrightCoreSha256: sha(resolve(dirname(require.resolve('playwright-core/package.json')), 'lib/coreBundle.js')),
  harness: Object.fromEntries(Object.keys(expectedRuntime.harness).map(n => [n, sha(resolve(root, 'scripts/local-render', n))])),
  three: Object.fromEntries(Object.keys(expectedRuntime.three).map(n => [n, sha(resolve(root, 'node_modules', n))])),
  serverDependencies: Object.fromEntries(Object.keys(expectedRuntime.serverDependencies).map(n => [n, sha(resolve(root, 'node_modules', n))])) })
const runtimeBefore = runtime(); assert.deepEqual(runtimeBefore, expectedRuntime)
const sourceFiles = [...readdirSync(here).filter(n => /\.(mjs|json|md)$/.test(n)).map(n => `qa/preacher-automatic-response/${n}`), ...Object.keys(inputs.inheritedFiles)]
const hashes = () => Object.fromEntries(sourceFiles.map(n => [n, sha(resolve(root, n))]))
const sourceBefore = hashes()
// This consumes an actual review record. It cannot create approval or substitute
// for the coordinator's explicit serialized resource grant.
assert.ok(process.env.PND_RESPONSE_PREFLIGHT, 'Independent exact-source preflight is required')
const review = JSON.parse(readFileSync(process.env.PND_RESPONSE_PREFLIGHT))
assert.equal(review.decision, 'ACCEPT'); assert.ok(review.reviewer && review.reference)
assert.equal(review.head, process.env.PND_QA_HEAD); assert.equal(review.side, side)
assert.deepEqual(review.argv, process.argv.slice(2)); assert.deepEqual(review.sourceFiles, sourceBefore)
assert.deepEqual(review.runtime, runtimeBefore)
mkdirSync(dirname(options.output), { recursive: true }); mkdirSync(options.output)
writeFileSync(resolve(options.output, 'prelaunch.json'), JSON.stringify({ head: process.env.PND_QA_HEAD,
  side, inputs, sourceBefore, runtimeBefore, review, argv: process.argv.slice(2) }, null, 2) + '\n')
try {
  const result = await runLocalBrowser(options, scenario)
  // The pinned harness already throws after writing a failed terminal receipt.
  // Keep failure uncaught so the outer command receipt also records nonzero exit.
  assert.equal(result.status, 'passed')
  console.log(JSON.stringify({ status: result.status, source: result.source, result: result.result }))
} finally {
  const runtimeAfter = runtime(), sourceAfter = hashes()
  writeFileSync(resolve(options.output, 'terminal-inputs.json'), JSON.stringify({ runtimeAfter, sourceAfter }, null, 2) + '\n')
  assert.deepEqual(runtimeAfter, runtimeBefore); assert.deepEqual(sourceAfter, sourceBefore)
}
