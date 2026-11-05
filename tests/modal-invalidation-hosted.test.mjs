import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { admitModal, serviceArguments, serviceName, limits, parseProperties, durationMilliseconds,
  validateSupervisor } from '../scripts/modal-invalidation/hosted-policy.mjs'
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const workflow = read('.github/workflows/modal-invalidation-browser.yml')
function admission() {
  const repository = { full_name: 'JohnDeved/populous-new-dawn' }, head = 'a'.repeat(40), base = 'b'.repeat(40)
  return { event: { action: 'ready_for_review', pull_request: { state: 'open', draft: false,
    head: { sha: head, repo: repository }, base: { sha: base, repo: repository }, labels: [{ name: `modal-v1:${head}` }] } },
  env: { GITHUB_ACTIONS: 'true', GITHUB_EVENT_NAME: 'pull_request', GITHUB_REPOSITORY: repository.full_name,
    GITHUB_SHA: 'c'.repeat(40), PR_HEAD_SHA: head, PR_BASE_SHA: base, GITHUB_RUN_ID: '123', GITHUB_RUN_ATTEMPT: '1' } }
}
test('only exact-head same-repository reviewed Ready events admit the route', () => {
  const { event, env } = admission(); const identity = admitModal(event, env)
  assert.deepEqual(identity, { head: 'a'.repeat(40), base: 'b'.repeat(40), merge: 'c'.repeat(40), runId: '123', runAttempt: '1' })
  for (const mutate of [
    x => { x.event.action = 'synchronize' }, x => { x.event.pull_request.draft = true },
    x => { x.event.pull_request.state = 'closed' }, x => { x.event.pull_request.head.repo = { full_name: 'other/fork' } },
    x => { x.env.PR_HEAD_SHA = 'd'.repeat(40) }, x => { x.event.pull_request.labels = [] },
    x => { x.env.GITHUB_EVENT_NAME = 'workflow_dispatch' }, x => { x.env.GITHUB_SHA = 'main' },
  ]) { const x = admission(); mutate(x); assert.throws(() => admitModal(x.event, x.env)) }
})
test('transient service launches retain unprivileged control-group and hard time/memory/process bounds', () => {
  const { event, env } = admission(), identity = admitModal(event, env)
  for (const stage of ['build', 'browser']) {
    const args = serviceArguments({ identity, stage, uid: 1001, gid: 1001, root: '/repo', node: '/node', args: ['worker.mjs'], home: '/home/runner', temporary: '/tmp/owned' })
    assert.ok(args.includes('--property=KillMode=control-group')); assert.ok(args.includes('--property=SendSIGKILL=yes'))
    assert.ok(args.includes(`--property=RuntimeMaxSec=${stage === 'build' ? 115 : 65}s`))
    assert.ok(args.includes('--property=TimeoutStopSec=5s')); assert.ok(args.includes('--property=MemoryMax=4294967296'))
    assert.ok(args.includes('--property=TasksMax=256')); assert.ok(args.includes('--uid=1001')); assert.ok(args.includes('--gid=1001'))
    assert.ok(args.includes('--setenv=NODE_OPTIONS=')); assert.ok(args.includes('--service-type=exec'))
    assert.equal(args.some(arg => /TOKEN|SECRET|--no-sandbox|disable.*sandbox|unsafe-swiftshader/.test(arg)), false)
  }
  assert.throws(() => serviceArguments({ identity, stage: 'browser', uid: 0, gid: 0 }))
  assert.throws(() => serviceName({ ...identity, runId: '../wrong' }, 'browser'))
})
function proof() {
  const unit = 'pnd-modal-123-1-browser.service'
  return { properties: { Id: unit, MainPID: '1234', User: '1001', KillMode: 'control-group', SendSIGKILL: 'yes',
    ControlGroup: `/system.slice/${unit}`, RuntimeMaxUSec: '1min 5s', TimeoutStopUSec: '5s', MemoryMax: '4294967296', TasksMax: '256' },
  expected: { unit, stage: 'browser', pid: 1234, uid: 1001, cgroup: `0::/system.slice/${unit}\n` } }
}
test('worker proves its actual kernel control group and systemd settings before running', () => {
  const x = proof(); assert.equal(validateSupervisor(x.properties, x.expected).hardCapMs, 70000)
  for (const [key, value] of [['MainPID', '1235'], ['User', '0'], ['KillMode', 'process'], ['SendSIGKILL', 'no'],
    ['RuntimeMaxUSec', '2min'], ['TimeoutStopUSec', '10s'], ['MemoryMax', 'infinity'], ['TasksMax', 'infinity'],
    ['ControlGroup', '/unowned']]) {
    const x = proof(); x.properties[key] = value; assert.throws(() => validateSupervisor(x.properties, x.expected), key)
  }
  const changed = proof(); changed.expected.cgroup = '0::/system.slice/other.service'
  assert.throws(() => validateSupervisor(changed.properties, changed.expected))
})
test('supervisor parsing rejects unknown or unbounded times', () => {
  assert.deepEqual(parseProperties('MainPID=12\nKillMode=control-group\n'), { MainPID: '12', KillMode: 'control-group' })
  assert.equal(durationMilliseconds('1min 5s'), 65000); assert.equal(durationMilliseconds('500ms'), 500)
  for (const value of ['infinity', '65', '65s junk', '-1s']) assert.throws(() => durationMilliseconds(value))
})
test('new workflow has no default-matrix rewrite, write token, secrets or push admission', () => {
  assert.match(workflow, /types: \[ready_for_review\]/); assert.match(workflow, /branches: \[main\]/)
  assert.match(workflow, /format\('modal-v1:\{0\}', github.event.pull_request.head.sha\)/)
  assert.match(workflow, /draft == false/); assert.match(workflow, /head.repo.full_name == github.repository/)
  assert.match(workflow, /contents: read/); assert.match(workflow, /persist-credentials: false/)
  assert.match(workflow, /timeout-minutes: 15/); assert.match(workflow, /cancel-in-progress: false/)
  assert.match(workflow, /run: node scripts\/modal-invalidation\/hosted.mjs/)
  assert.doesNotMatch(workflow, /pull_request_target|workflow_dispatch|\n {2}push:|secrets\.|contents: write|sudo chmod|--no-sandbox/)
  for (const pin of [...workflow.matchAll(/uses: [^@\n]+@([^ \n]+)/g)]) assert.match(pin[1], /^[a-f0-9]{40}$/)
  assert.match(workflow, /ref: \$\{\{ github.sha \}\}/); assert.match(workflow, /git diff --exit-code HEAD --/)
  assert.match(workflow, /pnpm install --frozen-lockfile --ignore-scripts/)
})
test('worker binds exact source, served bytes, build revision and sandboxed browser identity', () => {
  const worker = read('scripts/modal-invalidation/browser-worker.mjs'), host = read('scripts/modal-invalidation/hosted.mjs')
  assert.match(worker, /supervisorProof\('browser'\)/); assert.match(worker, /directoryManifest\(dist\)/)
  assert.match(worker, /browserConfiguration\(\)/); assert.match(worker, /sha256\(config.browserPath\)/)
  assert.match(worker, /runtimeVersion = browser.version\(\)/); assert.match(worker, /result.runtime.buildRevision, revision/)
  assert.match(host, /sourceManifest\(root, identity.merge\)/); assert.match(host, /verifyManifest\(root, source\)/)
  assert.match(host, /runStage\('build'/); assert.match(host, /runStage\('browser'/)
  assert.match(host, /row.final.LoadState === 'not-found'/); assert.match(host, /populated 0/)
  assert.match(host, /result.status === 0 && !result.signal && !result.error/)
  assert.match(read('scripts/modal-invalidation/run.mjs'), /__pndModalInvalidationFixture.buildRevision\), head/)
  assert.match(read('scripts/modal-invalidation/fixture.mjs'), /buildRevision = __PND_BUILD_REVISION__/)
  assert.match(read('scripts/modal-invalidation/build-worker.mjs'), /native-ui-evidence\/build-home.mjs/)
  assert.equal(limits.buildRuntimeSeconds + limits.stopSeconds, 120)
})

const { serializeReceipt } = await import('../scripts/modal-invalidation/receipt.mjs')
test('retained receipt includes its exact own size without a stale self hash', () => {
  const report = { status: 'passed' }, files = [{ name: 'browser.log', bytes: 7, sha256: 'a'.repeat(64) }]
  const text = serializeReceipt(report, files)
  assert.equal(Buffer.byteLength(text), report.artifacts.receiptBytes)
  assert.equal(report.artifacts.bytes, 7 + Buffer.byteLength(text))
  assert.equal(report.artifacts.files.some(file => file.name === 'receipt.json'), false)
  assert.throws(() => serializeReceipt({}, [{ name: 'receipt.json', bytes: 1 }]))
})
test('oversize and extra screenshots remain failures with correct final accounting', () => {
  for (const files of [[{ name: 'large.log', bytes: limits.artifactBytes }],
    [{ name: 'one.png', bytes: 1 }, { name: 'two.png', bytes: 1 }]]) {
    const report = { status: 'passed' }, text = serializeReceipt(report, files)
    assert.equal(report.status, 'failed'); assert.equal(report.artifacts.receiptBytes, Buffer.byteLength(text))
  }
})

const { assessCapacity, capacityPolicy } = await import('../scripts/modal-invalidation/capacity.mjs')
function capacity() {
  const target = { device: 1, availableBytes: 20 * 1024 ** 3, freeInodes: 1000000,
    mount: { filesystems: [{ fstype: 'ext4' }] } }
  return { stage: 'preparation', destinations: Object.fromEntries(Object.keys(capacityPolicy.preparation).map(name => [name, { ...target }])),
    memory: { MemAvailable: 12 * 1024 ** 3 }, rootCgroup: { verified: true }, cgroups: [{ path: '/', memoryMax: null, memoryCurrent: null }] }
}
test('hosted capacity groups reserves by filesystem and admits only measured headroom', () => {
  const value = capacity(), result = assessCapacity(value)
  assert.equal(result.admitted, true)
  assert.equal(result.devices[1].requiredBytes, Object.values(capacityPolicy.preparation).reduce((a, b) => a + b, 0))
  assert.equal(result.requiredMemoryBytes, 5 * 1024 ** 3)
  for (const mutate of [
    x => { x.memory.MemAvailable = 4 * 1024 ** 3 }, x => { x.memory.MemAvailable = null }, x => { x.rootCgroup.verified = false },
    x => { x.destinations.evidence.availableBytes = 1 }, x => { x.destinations.cache.freeInodes = 1 },
    x => { x.destinations.scratch.mount = null },
    x => { x.cgroups.push({ path: '/limited', memoryMax: String(6 * 1024 ** 3), memoryCurrent: String(2 * 1024 ** 3) }) },
    x => { x.cgroups.push({ path: '/unknown', memoryMax: null, memoryCurrent: null }) },
  ]) { const x = capacity(); mutate(x); assert.equal(assessCapacity(x).admitted, false) }
})
test('tmpfs planned writes consume separate memory headroom, not just disk capacity', () => {
  const x = capacity(); x.memory.MemAvailable = 6 * 1024 ** 3
  x.destinations.cache.mount = { filesystems: [{ fstype: 'tmpfs' }] }
  const result = assessCapacity(x); assert.equal(result.admitted, false)
  assert.ok(result.requiredMemoryBytes > 6 * 1024 ** 3)
})
test('capacity gates precede install and each heavy service; logs reserve both streams', () => {
  assert.ok(workflow.indexOf('capacity.mjs prepare') < workflow.indexOf('npm install --global'))
  assert.match(workflow, /NPM_CONFIG_CACHE:/); assert.match(workflow, /--store-dir/)
  const host = read('scripts/modal-invalidation/hosted.mjs')
  assert.match(host, /stage: 'after-hashing'/); assert.match(host, /stage: `before-\$\{stage\}`/)
  assert.match(host, /maxBuffer: limits.logBytes \/ 2/)
  assert.match(host, /error.code === 'PND_RESOURCE_ADMISSION' \? 'blocked'/)
})
