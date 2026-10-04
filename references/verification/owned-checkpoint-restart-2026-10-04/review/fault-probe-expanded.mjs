import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import vm from 'node:vm'
const commit = process.argv[2] ?? '7153bcc51eaf542ce5e55ecdea139078fe814ff6'
let source = execFileSync('git', ['show', `${commit}:scripts/local-render/harness.mjs`], { encoding: 'utf8' })
source = source.replace("(await import(pathToFileURL(resolve(options.scenario)).href)).default", 'namedScenario')
source = source.slice(0, source.indexOf('\nif (process.argv[1]')).replace(/^import .*$/gm, '').replaceAll('export ', '').replaceAll('import.meta.url', JSON.stringify('file:///fixture/scripts/local-render/harness.mjs')).replace("const { bindGame } = await import(pathToFileURL(resolve(root, 'scripts/browser-game.mjs')).href)", 'const bindGame = async () => {}')
async function probe(mode) {
  let persisted, finished = false, connected = true, called = false, readCount = 0
  const previous = { checkpointSha256: 'expected', level: 1, turn: 10, time: 1 }
  const changed = { checkpointSha256: 'unknown-changed', level: 1, turn: 20, time: 2 }
  const fakeProcess = new EventEmitter()
  Object.assign(fakeProcess, { env: {}, argv: [], cwd: () => '/fixture', version: process.version, platform: process.platform, arch: process.arch, kill: () => { server.exitCode = 0; server.emit('exit', 0) } })
  const stream = new EventEmitter(); stream.pipe = () => {}
  const server = new EventEmitter(); Object.assign(server, { pid: 100, exitCode: null, stdout: stream, stderr: { pipe() {} } })
  const page = { on() {}, setDefaultTimeout() {}, async goto() { if (mode === 'navigation-fails') throw Error('navigation failed') }, getByRole: () => ({ async waitFor() {} }), async screenshot() {}, isClosed: () => false }
  const context = { on() {}, pages: () => [page], browser: () => browser, async route() {}, async routeWebSocket() {}, async close() {
    if (mode === 'close-throws') throw Error('close failed')
    if (mode === 'close-timeout') return new Promise(() => {})
    if (mode !== 'connected-after-close') connected = false
  } }
  const browser = { isConnected: () => connected, version: () => 'test-only', contexts: () => [context] }
  const sha256 = b => createHash('sha256').update(b).digest('hex')
  let scenarioCallback
  const profile = { id: 'fixture', path: '/owned', mode: 'reused', runId: 'next', checkpoints: [], previousRun: { checkpointAtEnd: previous, cleanupVerified: true, continuationVerified: true } }
  const req = path => path === '@playwright/test' ? { chromium: { async launchPersistentContext() { if (mode === 'launch-rejects') throw Error('launch failed'); return context } } } : { version: 'fixture' }; req.resolve = () => '/runtime/package.json'
  const sandbox = { console, resolve, dirname, fileURLToPath, pathToFileURL, createHash, AbortController, AbortSignal, structuredClone, sha256, process: fakeProcess, setTimeout: (fn, ms) => setTimeout(fn, ms === 250 ? 1 : [10000, 5000].includes(ms) ? 15 : ms), clearTimeout,
    validateProfilePaths() {}, mkdirSync() {}, existsSync: path => path === '/shell', readFileSync: () => (mode === 'runtime-drift' && called ? 'changed runtime' : 'fixed bytes'), writeFileSync: (_, text) => persisted = JSON.parse(text), createWriteStream: () => ({ end() {} }),
    execFileSync: (_, args) => args.includes('rev-parse') ? ((mode === 'source-drift' && called ? 'changed' : 'fixed-clean-identity') + '\n') : '', createRequire: () => req,
    spawn: () => { setTimeout(() => stream.emit('data', 'http://127.0.0.1:4188'), 0); return server }, fetch: async () => ({ ok: true }),
    profileInputReceipt: () => ({ application: 'app', checker: 'qa' }), persistentLaunchOptions: x => x,
    acquireProfile: () => ({ dataDir: '/owned/browser', profile, finish: () => { finished = true } }),
    readCommittedCheckpoint: async () => { readCount++; if (mode === 'start-read-fails' && readCount === 1) throw Error('initial read failed'); if (mode === 'terminal-read-timeout' && readCount > 1) return new Promise(() => {}); if (mode === 'terminal-read-fails' && readCount > 1) throw Error('read failed'); return mode === 'start-mismatch' ? changed : previous },
  }
  vm.runInNewContext(source + '\nglobalThis.run = runLocalBrowser', sandbox)
  let error = null
  const scenario = async () => { called = true; if (mode === 'scenario-fails') throw Error('ordinary assertion failed'); return { pass: true } }
  sandbox.namedScenario = scenario
  try { await sandbox.run({ gameRoot: '/fixture', output: '/proof', browserPath: '/shell', port: 4188, timeout: 1000, profile: '/owned', scenario: '/qa.mjs' }, scenario) } catch (e) { error = String(e) }
  return { mode, error, called, finished, status: persisted?.status, cleanupVerified: persisted?.profile.cleanupVerified, continuationVerified: persisted?.profile.continuationVerified, checkpointAtEnd: persisted?.profile.checkpointAtEnd }
}
const results = []
for (const mode of ['normal', 'scenario-fails', 'start-mismatch', 'close-throws', 'close-timeout', 'connected-after-close', 'terminal-read-fails', 'start-read-fails', 'terminal-read-timeout', 'source-drift', 'runtime-drift', 'navigation-fails', 'launch-rejects']) results.push(await probe(mode))
assert.equal(results[0].finished, true)
assert.equal(results[1].finished, true)
assert.equal(results[2].called, false)
assert.equal(results[2].finished, false, 'Startup mismatch must not finalize')
assert.equal(results[2].continuationVerified, false, 'Startup mismatch must remain unverified')
for (const result of results.slice(3)) assert.equal(result.finished, false)
const artifact = { commit, command: `node work/orchestration/owned-profile-review-69e3e33/fault-probe-expanded.mjs ${commit}`, noBrowserOrServerLaunched: true, results }
writeFileSync(`work/orchestration/owned-profile-review-69e3e33/fault-results-${commit.slice(0, 7)}-expanded.json`, JSON.stringify(artifact, null, 2) + '\n')
console.log(JSON.stringify(artifact, null, 2))
