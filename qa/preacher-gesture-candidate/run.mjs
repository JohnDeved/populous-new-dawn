// Explicit run entry. Source preparation never imports or executes this file.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { parseOptions, runLocalBrowser } from '../../scripts/local-render/harness.mjs'
import scenario from './scenario.mjs'

const root = process.cwd(), here = resolve(root, 'qa/preacher-gesture-candidate')
const options = parseOptions(process.argv.slice(2))
assert.equal(resolve(options.gameRoot), root)
assert.equal(options.port, 4404); assert.equal(options.timeout, 720000)
assert.equal(options.profile, undefined); assert.equal(options.scenario, undefined)
assert.ok(resolve(options.output).startsWith(resolve(root, 'work/orchestration/preacher-gesture-candidate') + '/'))
assert.ok(!existsSync(resolve(options.output)), 'Every attempt needs a fresh output directory')
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
const sha = file => createHash('sha256').update(readFileSync(file)).digest('hex')
assert.match(process.env.PND_QA_HEAD ?? '', /^[0-9a-f]{40}$/, 'Supply the reviewed frozen QA HEAD')
assert.equal(git('rev-parse', 'HEAD'), process.env.PND_QA_HEAD)
assert.equal(git('status', '--porcelain'), '')
const input = JSON.parse(readFileSync(resolve(here, 'application-inputs.json')))
assert.equal(input.status, 'ready', 'Candidate application input binding is not frozen')
assert.equal(git('rev-parse', 'HEAD:app'), input.appTree)
assert.equal(git('rev-parse', 'HEAD:public'), input.publicTree)
assert.equal(git('rev-parse', 'HEAD:scripts'), input.scriptsTree)
assert.equal(git('rev-parse', 'HEAD:tests'), input.testsTree)
for (const [file, expected] of Object.entries(input.files)) assert.equal(sha(resolve(root, file)), expected, file)
const sprites = JSON.parse(readFileSync(resolve(root, 'app/original-units.json')))
const preacherSources = [...new Set(Object.values(sprites.animations['blue-preacher']).map(d => d[0].source))]
assert.ok([168, 176, 184].every(source => preacherSources.includes(source)))
assert.equal(sprites.width, 2048); assert.equal(sprites.height, 8192)
const provenance = JSON.parse(readFileSync(resolve(here, 'provenance.json')))
for (const [file, expected] of Object.entries(provenance.inheritedFiles)) assert.equal(sha(resolve(root, file)), expected, file)
const require = createRequire(resolve(root, 'package.json'))
const expectedRuntime = JSON.parse(readFileSync(resolve(here, 'expected-runtime.json')))
const runtime = () => ({ node: process.version, browserSha256: sha(resolve(options.browserPath)),
  installedLockSha256: sha(resolve(root, 'node_modules/.package-lock.json')),
  packageLockSha256: sha(resolve(root, 'package-lock.json')), playwright: require('@playwright/test/package.json').version,
  playwrightCoreSha256: sha(resolve(dirname(require.resolve('playwright-core/package.json')), 'lib/coreBundle.js')),
  harness: Object.fromEntries(Object.keys(expectedRuntime.harness).map(name => [name, sha(resolve(root, 'scripts/local-render', name))])),
  three: Object.fromEntries(Object.keys(expectedRuntime.three).map(name => [name, sha(resolve(root, 'node_modules', name))])),
  serverDependencies: Object.fromEntries(Object.keys(expectedRuntime.serverDependencies).map(name => [name, sha(resolve(root, 'node_modules', name))])) })
assert.deepEqual(runtime(), expectedRuntime, 'Use the previously accepted exact dependency/browser inputs')
const files = [...readdirSync(here).filter(n => /\.(mjs|json|md)$/.test(n)).map(n => `qa/preacher-gesture-candidate/${n}`), ...Object.keys(provenance.inheritedFiles)]
const hashes = () => Object.fromEntries(files.map(n => [n, sha(resolve(root, n))]))
const sourceBefore = hashes(), runtimeBefore = runtime()
mkdirSync(dirname(resolve(options.output)), { recursive: true })
mkdirSync(resolve(options.output), { recursive: false })
writeFileSync(resolve(options.output, 'prelaunch.json'), JSON.stringify({ head: process.env.PND_QA_HEAD,
  application: input, sourceBefore, runtimeBefore, preacherSources, port: options.port, caps: { acquisitionMs: 360000,
    observationMs: 120000, logicalVisits: 900, saveMs: 15000, loadMs: 90000, supersessionMs: 40000, harnessMs: 720000 } }, null, 2) + '\n')
try {
  const result = await runLocalBrowser(options, scenario)
  console.log(JSON.stringify({ status: result.status, source: result.source, result: result.result }))
} finally {
  const runtimeAfter = runtime(), sourceAfter = hashes()
  writeFileSync(resolve(options.output, 'terminal-inputs.json'), JSON.stringify({ runtimeAfter, sourceAfter }, null, 2) + '\n')
  assert.deepEqual(runtimeAfter, runtimeBefore); assert.deepEqual(sourceAfter, sourceBefore)
}
