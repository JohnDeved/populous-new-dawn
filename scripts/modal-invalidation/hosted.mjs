import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, existsSync, readFileSync, readdirSync, lstatSync, symlinkSync, readlinkSync, statfsSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { sourceManifest, verifyManifest, sha256, git } from '../native-ui-evidence/identity.mjs'
import { directoryManifest } from '../native-ui-evidence/files.mjs'
import { requireCapacity } from './capacity.mjs'
import { serializeReceipt } from './receipt.mjs'
import { completeStage } from './stage-completion.mjs'
import { writeEvidence } from './evidence-writer.mjs'
import { admitModal, limits, serviceName, serviceArguments, parseProperties } from './hosted-policy.mjs'
const identity = admitModal(JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')), process.env)
const root = resolve(import.meta.dirname, '../..')
assert.equal(git(root, 'rev-parse', 'HEAD'), identity.merge)
assert.ok(process.env.RUNNER_TEMP?.startsWith('/'))
const workspace = resolve(process.env.RUNNER_TEMP, `modal-invalidation-${identity.runId}-${identity.runAttempt}`)
const preparation = JSON.parse(readFileSync(resolve(workspace, 'preparation-capacity.json'), 'utf8'))
assert.equal(preparation.decision.admitted, true); assert.equal(preparation.identity.merge, identity.merge)
assert.equal(preparation.identity.runId, identity.runId); assert.equal(preparation.identity.runAttempt, identity.runAttempt)
const output = resolve(workspace, 'evidence'), dist = resolve(workspace, 'dist'), temporary = resolve(workspace, 'tmp')
for (const path of [output, dist, temporary]) { assert.equal(existsSync(path), false); mkdirSync(path) }
mkdirSync(resolve(temporary, 'cache')); mkdirSync(resolve(temporary, 'chrome-runtime'))
const report = { status: 'running', identity, limits, startedAt: new Date().toISOString(), stages: [],
  preparationArtifact: { bytes: lstatSync(resolve(workspace, 'preparation-capacity.json')).size,
    sha256: sha256(resolve(workspace, 'preparation-capacity.json')) },
  scope: 'Production Home through isolated plain Vite hosting; not deployed Vinext/Cloudflare, native pixel parity or hardware performance.' }
const json = (name, value) => writeEvidence(output, name, JSON.stringify(value, null, 2) + '\n')
const save = () => json('receipt.json', report)
json('preparation-capacity.json', preparation)
function runStage(stage, args) {
  requireCapacity({ root, workspace, output, stage: `before-${stage}`, identity })
  const unit = serviceName(identity, stage), parentMountNamespace = readlinkSync('/proc/self/ns/mnt')
  const parentStorage = () => ({ namespace: readlinkSync('/proc/self/ns/mnt'),
    device: statSync(resolve(temporary, 'chrome-runtime')).dev, type: statfsSync(resolve(temporary, 'chrome-runtime')).type })
  const storageBefore = parentStorage()
  const command = serviceArguments({ identity, stage, uid: process.getuid(), gid: process.getgid(),
    root, node: process.execPath, args, home: process.env.HOME, temporary, output, parentMountNamespace })
  const row = { stage, unit, command: ['sudo', ...command], status: 'running', parentStorageBefore: storageBefore }
  report.stages.push(row); save()
  const runtime = stage === 'build' ? limits.buildRuntimeSeconds : limits.browserRuntimeSeconds
  const show = () => {
    const response = spawnSync('systemctl', ['show', unit,
      '--property=Id,LoadState,Result,ActiveState,SubState,ExecMainStatus,ExecMainCode,ControlGroup'],
    { timeout: 5000, maxBuffer: 16384, encoding: 'utf8' })
    if (response.error) throw response.error
    const properties = parseProperties(response.stdout)
    assert.ok(response.status === 0 || properties.LoadState === 'not-found')
    assert.equal(properties.Id, unit)
    return properties
  }
  completeStage(row, {
    launch: () => spawnSync('sudo', command, { cwd: root, timeout: (runtime + limits.stopSeconds + 20) * 1000,
      maxBuffer: limits.logBytes / 2, encoding: 'buffer' }),
    show,
    stop: () => {
      const result = spawnSync('sudo', ['--non-interactive', 'systemctl', 'stop', unit],
        { timeout: 10000, maxBuffer: 16384, encoding: 'utf8' })
      return { exitCode: result.status, error: result.error ? String(result.error) : null,
        stdout: result.stdout?.slice(0, 512), stderr: result.stderr?.slice(0, 512) }
    },
    cgroupEvents: () => {
      const path = `/sys/fs/cgroup/system.slice/${unit}/cgroup.events`
      return existsSync(path) ? readFileSync(path, 'utf8') : 'removed'
    },
    parentStorage,
    retain: (stream, bytes) => writeEvidence(output, `${stage}.${stream}.log`, bytes),
    save,
  })
  assert.equal(row.status, 'passed', `${stage} service failed; retain its exact result and log`)

}
let source, dependencies, servedBuild
try {
  source = sourceManifest(root, identity.merge); json('source.json', source)
  report.sourceManifestSha256 = sha256(resolve(output, 'source.json'))
  dependencies = directoryManifest(resolve(root, 'node_modules')); json('dependencies.json', dependencies)
  report.dependenciesManifestSha256 = sha256(resolve(output, 'dependencies.json'))
  report.node = { version: process.version, executableSha256: sha256(process.execPath) }; save()
  requireCapacity({ root, workspace, output, stage: 'after-hashing', identity })
  runStage('build', [resolve(root, 'scripts/modal-invalidation/build-worker.mjs'), root, dist, identity.merge, output])
  const built = directoryManifest(dist); json('build-manifest.json', built)
  assert.ok(Object.keys(built).some(name => name.endsWith('.js') && readFileSync(resolve(dist, name), 'utf8').includes(identity.merge)))
  for (const entry of readdirSync(resolve(root, 'public'))) {
    const target = resolve(dist, entry); assert.equal(existsSync(target), false)
    symlinkSync(resolve(root, 'public', entry), target, lstatSync(resolve(root, 'public', entry)).isDirectory() ? 'dir' : 'file')
  }
  servedBuild = directoryManifest(dist); json('served-build.json', servedBuild)
  verifyManifest(root, source); save()
  runStage('browser', [resolve(root, 'scripts/modal-invalidation/browser-worker.mjs'), root, output, dist, identity.merge])
  const evidence = JSON.parse(readFileSync(resolve(output, 'modal-invalidation.json'), 'utf8'))
  const browser = JSON.parse(readFileSync(resolve(output, 'browser-identity.json'), 'utf8'))
  assert.equal(evidence.head, identity.merge); assert.equal(evidence.status, 'passed'); assert.equal(evidence.cleanupVerified, true)
  assert.equal(browser.status, 'passed'); assert.equal(browser.revision, identity.merge)
  assert.equal(browser.renderer.buildRevision, identity.merge)
  report.status = 'passed'
} catch (error) { report.status = error.code === 'PND_RESOURCE_ADMISSION' ? 'blocked' : 'failed'; report.failure = String(error); report.stack = error.stack; process.exitCode = 1 }
finally {
  report.inputsAfter = {}
  for (const [name, before, verify] of [
    ['source', source, () => verifyManifest(root, source)],
    ['dependencies', dependencies, () => assert.deepEqual(directoryManifest(resolve(root, 'node_modules')), dependencies)],
    ['servedBuild', servedBuild, () => assert.deepEqual(directoryManifest(dist), servedBuild)],
  ]) {
    if (!before) { report.inputsAfter[name] = 'not-captured'; continue }
    try { verify(); report.inputsAfter[name] = 'identical' }
    catch (error) { report.inputsAfter[name] = String(error); report.status = 'failed'; process.exitCode = 1 }
  }
  report.finishedAt = new Date().toISOString(); save()
  const files = readdirSync(output).filter(name => name !== 'receipt.json').map(name => {
    const path = resolve(output, name), stat = lstatSync(path)
    assert.ok(stat.isFile() && !stat.isSymbolicLink(), 'Only regular evidence files may be retained')
    return { name, bytes: stat.size, sha256: sha256(path) }
  })
  const serialized = serializeReceipt(report, files)
  if (report.status !== 'passed') process.exitCode = 1
  writeEvidence(output, 'receipt.json', serialized)
}
