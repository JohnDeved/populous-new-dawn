import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readSync, readdirSync, closeSync, mkdtempSync, writeFileSync, symlinkSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { admitModal, serviceArguments, serviceName, limits, parseProperties, durationMilliseconds,
  validateSupervisor, browserReadOnlyPaths } from '../scripts/modal-invalidation/hosted-policy.mjs'
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
    const args = serviceArguments({ identity, stage, uid: 1001, gid: 1001, root: '/repo', node: '/node', args: ['worker.mjs'], home: '/home/runner', temporary: '/owned/tmp', output: '/owned/evidence', parentMountNamespace: 'mnt:[1]' })
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
    ControlGroup: `/system.slice/${unit}`, RuntimeMaxUSec: '1min 5s', TimeoutStopUSec: '5s', MemoryMax: '4294967296', TasksMax: '256', LimitFSIZE: '4294967296', LimitFSIZESoft: '4294967296',
    MemorySwapMax: '0', ProtectSystem: 'strict', PrivateMounts: 'yes', ProtectHome: 'read-only', ReadOnlyPaths: browserReadOnlyPaths.map(path => '-' + path).join(' ') },
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
  const completion = read('scripts/modal-invalidation/stage-completion.mjs')
  assert.match(host, /completeStage\(row/); assert.match(completion, /row.final\?\.LoadState === 'not-found'/)
  assert.match(completion, /populated 0/); assert.match(completion, /row.exitCode === 0 && !row.signal && !row.launchError/)
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
  assert.equal(report.artifacts.uploadedBytes, report.artifacts.bytes)
  const external = { status: 'passed', preparationArtifact: { bytes: 33 } }
  serializeReceipt(external, files); assert.equal(external.artifacts.uploadedBytes, external.artifacts.bytes + 33)
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
  assert.equal(result.requiredMemoryBytes, 9 * 1024 ** 3)
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

const { boundedTimeline, captureOwnedCgroup } = await import('../scripts/modal-invalidation/diagnostics.mjs')
test('lifecycle diagnostics cap event count and message lengths with explicit truncation counts', () => {
  const t = boundedTimeline()
  for (let i = 0; i < 140; i++) t.record('event', 'x'.repeat(1000))
  assert.equal(t.report.events.length, 128); assert.equal(t.report.dropped, 12)
  assert.equal(t.report.events[0].detail.length, 512)
  assert.ok(t.report.events.every((x, i) => x.sequence === i + 1 && Number.isFinite(x.monotonicMs) && !Number.isNaN(Date.parse(x.at))))
})
test('cgroup diagnostics read only the proven worker and retain absent counters as unknown', () => {
  const unit = 'pnd-modal-123-1-browser.service', proof = { unit, controlGroup: `/system.slice/${unit}` }, reads = []
  const snapshot = captureOwnedCgroup(proof, path => {
    reads.push(path)
    if (path === '/proc/self/cgroup') return { status: 'read', text: `0::${proof.controlGroup}`, truncated: false }
    if (path.endsWith('/pids.peak')) return { status: 'unavailable', code: 'ENOENT' }
    return { status: 'read', text: '0', truncated: false }
  })
  assert.equal(snapshot.status, 'partial'); assert.equal(snapshot.files['pids.peak'].status, 'unavailable')
  assert.equal(reads.length, 12)
  assert.ok(reads.every(path => path === '/proc/self/cgroup' || path === '/proc/self/limits' || path.startsWith(`/sys/fs/cgroup${proof.controlGroup}/`)))
  assert.ok(snapshot.files['memory.events']); assert.ok(snapshot.files['pids.events']); assert.ok(snapshot.processLimits)
  assert.throws(() => captureOwnedCgroup({ ...proof, controlGroup: '/unrelated' }))
})
test('unknown or changed worker membership prevents all cgroup inspection', () => {
  const unit = 'pnd-modal-123-1-browser.service', proof = { unit, controlGroup: `/system.slice/${unit}` }
  for (const value of [{ status: 'unavailable', code: 'ENOENT' }, { status: 'read', text: '0::/unrelated', truncated: false },
    { status: 'read', text: `0::${proof.controlGroup}`, truncated: true }]) {
    let reads = 0
    const snapshot = captureOwnedCgroup(proof, path => { reads++; assert.equal(path, '/proc/self/cgroup'); return value })
    assert.equal(snapshot.status, 'owner-unverified'); assert.equal(reads, 1); assert.deepEqual(snapshot.files, {})
  }
})
test('diagnostic logging retains process-only scope under the separate finite storage policy', () => {
  const { event, env } = admission(), identity = admitModal(event, env)
  for (const stage of ['build', 'browser']) {
    const args = serviceArguments({ identity, stage, uid: 1001, gid: 1001, root: '/repo', node: '/node', args: ['worker.mjs'], home: '/home/runner', temporary: '/owned/tmp', output: '/owned/evidence', parentMountNamespace: 'mnt:[1]' })
    assert.ok(args.includes(`--setenv=DEBUG=${stage === 'browser' ? 'pw:browser' : ''}`)); assert.ok(args.includes('--setenv=DEBUG_COLORS=0'))
    assert.ok(args.includes(`--property=LimitFSIZE=${stage === 'browser' ? 4294967296 : 67108864}`)); assert.ok(args.includes('--property=TasksMax=256'))
    assert.equal(args.some(arg => arg.includes('pw:protocol') || arg.includes('unsafe-swiftshader')), false)
  }
  const worker = read('scripts/modal-invalidation/browser-worker.mjs')
  assert.match(worker, /checkpoint\('before-cleanup'\)/); assert.match(worker, /checkpoint\('browser-disconnected'\)/)
  assert.match(worker, /record\('browser-close-requested'/)
  assert.match(read('scripts/modal-invalidation/diagnostics.mjs'), /fileLimit = 4096/)
})

test('missing or truncated inherited process limits cannot report complete telemetry', () => {
  const unit = 'pnd-modal-123-1-browser.service', proof = { unit, controlGroup: `/system.slice/${unit}` }
  for (const value of [{ status: 'unavailable', code: 'ENOENT' }, { status: 'read', text: 'partial', truncated: true }]) {
    const snapshot = captureOwnedCgroup(proof, path => {
      if (path === '/proc/self/cgroup') return { status: 'read', text: `0::${proof.controlGroup}`, truncated: false }
      if (path === '/proc/self/limits') return value
      return { status: 'read', text: '0', truncated: false }
    })
    assert.equal(snapshot.status, 'partial'); assert.deepEqual(snapshot.processLimits, value)
  }
})

test('actual bounded file reads honor bytesRead without padding and cap overlong files', async () => {
  const { readBounded } = await import('../scripts/modal-invalidation/diagnostics.mjs')
  const directory = mkdtempSync(join(tmpdir(), 'pnd-modal-read-control-'))
  try {
    const path = join(directory, 'telemetry')
    writeFileSync(path, '0::/system.slice/owned.service\n')
    assert.deepEqual(readBounded(path), { status: 'read', text: '0::/system.slice/owned.service', truncated: false })
    writeFileSync(path, ''); assert.deepEqual(readBounded(path), { status: 'read', text: '', truncated: false })
    for (const bytes of [4096, 4097, 8192]) {
      writeFileSync(path, 'x'.repeat(bytes))
      assert.deepEqual(readBounded(path), { status: 'read', text: 'x'.repeat(4096), truncated: bytes > 4096 })
    }
    assert.deepEqual(readBounded(join(directory, 'missing')), { status: 'unavailable', code: 'ENOENT' })
    if (process.platform === 'linux') {
      symlinkSync(path, join(directory, 'link'))
      assert.deepEqual(readBounded(join(directory, 'link')), { status: 'unavailable', code: 'ELOOP' })
    }
  } finally { rmSync(directory, { recursive: true, force: true }) }
})
test('actual own-process membership diagnostic matches raw proc bytes exactly', { skip: process.platform !== 'linux' }, async () => {
  const { readBounded } = await import('../scripts/modal-invalidation/diagnostics.mjs')
  const raw = readFileSync('/proc/self/cgroup', 'utf8')
  assert.ok(Buffer.byteLength(raw) < 4096)
  assert.deepEqual(readBounded('/proc/self/cgroup'), { status: 'read', text: raw.trim(), truncated: false })
})

const { admitEvidenceWrite, writeEvidence, evidenceReserves } = await import('../scripts/modal-invalidation/evidence-writer.mjs')
const { browserMounts } = await import('../scripts/modal-invalidation/hosted-policy.mjs')
const { parseMountInfo, fileSizeLimit, validateBrowserStorage } = await import('../scripts/modal-invalidation/browser-storage.mjs')
test('artifact allocation reserves every raw stream, final receipt and standalone preparation before writing', () => {
  assert.equal(evidenceReserves.other, 30 * 1024 ** 2)
  const max = evidenceReserves.other
  assert.equal(admitEvidenceWrite([], 'data.json', max).totalCeilingBytes, 64 * 1024 ** 2)
  assert.throws(() => admitEvidenceWrite([], 'data.json', max + 1))
  assert.throws(() => admitEvidenceWrite([{ name: 'other.json', bytes: 1 }], 'data.json', max))
  assert.equal(admitEvidenceWrite([{ name: 'data.json', bytes: max }], 'data.json', 1).otherBytes, 1)
  assert.throws(() => admitEvidenceWrite([], 'browser.stderr.log', 8 * 1024 ** 2 + 1))
  assert.throws(() => admitEvidenceWrite([], 'receipt.json', 1024 ** 2 + 1))
  assert.throws(() => admitEvidenceWrite([], '../escape', 1))
  const full = Array.from({ length: 256 }, (_, i) => ({ name: `file-${i}.json`, bytes: 1 }))
  assert.throws(() => admitEvidenceWrite(full, 'extra.json', 1))
  assert.doesNotThrow(() => admitEvidenceWrite(full, 'file-0.json', 2))
  assert.throws(() => admitEvidenceWrite([{ name: 'first.png', bytes: 1 }], 'second.png', 1))
})
test('actual evidence writes retain exact bytes and reject links or exclusive replacement before truncation', () => {
  const directory = mkdtempSync(join(tmpdir(), 'pnd-modal-evidence-control-'))
  try {
    assert.equal(writeEvidence(directory, 'data.json', 'one', { exclusive: true }), 3)
    assert.throws(() => writeEvidence(directory, 'data.json', 'two', { exclusive: true }))
    assert.equal(readFileSync(join(directory, 'data.json'), 'utf8'), 'one')
    writeEvidence(directory, 'data.json', Buffer.from('x')); assert.equal(readFileSync(join(directory, 'data.json'), 'utf8'), 'x')
    if (process.platform === 'linux') {
      symlinkSync(join(directory, 'data.json'), join(directory, 'link.json'))
      assert.throws(() => writeEvidence(directory, 'link.json', 'bad'))
      assert.equal(readFileSync(join(directory, 'data.json'), 'utf8'), 'x')
    }
  } finally { rmSync(directory, { recursive: true, force: true }) }
})
function fdProof(mountId) {
  const text = `mnt_id:\t${mountId}\n`
  return { text, bytes: Buffer.byteLength(text), complete: true, truncated: false }
}
function storageFixture() {
  const policy = { temporary: '/owned/tmp', output: '/owned/evidence', root: '/repo', dist: '/owned/dist', uid: 1001, gid: 1001 }
  const mounts = browserMounts(policy.temporary, policy.uid, policy.gid)
  const snapshot = { systemdVersion: 'systemd 255', namespace: 'mnt:[2]', parentNamespace: 'mnt:[1]',
    fileLimit: { soft: 4 * 1024 ** 3, hard: 4 * 1024 ** 3 }, memoryMax: 4 * 1024 ** 3, swapMax: 0,
    memoryCurrent: 100 * 1024 ** 2, memoryAvailable: 12 * 1024 ** 3, outputAvailable: 10 * 1024 ** 3,
    environment: { HOME: '/owned/tmp/chrome-runtime/home', TMPDIR: '/tmp', XDG_CACHE_HOME: '/owned/tmp/chrome-runtime/cache',
      XDG_CONFIG_HOME: '/owned/tmp/chrome-runtime/config', XDG_RUNTIME_DIR: '/owned/tmp/chrome-runtime/run', PND_MODAL_RUNTIME: '/owned/tmp/chrome-runtime' },
    mounts: mounts.map(mount => ({ ...mount, filesystemType: 0x01021994 })), devOwnership: { uid: 0, mode: 0o755 },
    mountInfo: [{ target: '/', type: 'ext4', options: ['ro'] }, { target: policy.output, type: 'ext4', options: ['rw'] },
      { target: '/proc', type: 'proc', options: ['rw'] }, { target: '/dev', type: 'devtmpfs', options: ['rw'] },
      ...mounts.map(mount => ({ target: mount.path, type: 'tmpfs', options: ['rw', 'nosuid', 'nodev'] }))] }
  snapshot.mountInfo = snapshot.mountInfo.map((row, i) => ({ id: i + 1, parent: i === 0 ? 0 : 1, ...row }))
  snapshot.namespaceAfter = snapshot.namespace
  snapshot.rawMountInfo = { text: 'synthetic stable mount graph', complete: true }
  snapshot.rawMountInfoAfter = { ...snapshot.rawMountInfo }
  snapshot.visibility = { method: 'linux-O_PATH-own-fdinfo-mnt_id', platform: 'linux', architecture: 'x64',
    targets: snapshot.mountInfo.map(row => ({ target: row.target, status: 'read', mountId: row.id, rawFdinfo: fdProof(row.id) })) }
  return { snapshot, policy }
}
test('finite browser storage proves private mounts, both file limits, zero swap and actual memory/disk admission', () => {
  const { snapshot, policy } = storageFixture()
  assert.equal(validateBrowserStorage(snapshot, policy).status, 'passed')
  for (const mutate of [
    x => { x.namespace = x.parentNamespace }, x => { x.fileLimit.hard = Infinity }, x => { x.fileLimit.soft = 67108864 },
    x => { x.memoryMax = 8 * 1024 ** 3 }, x => { x.swapMax = 1 }, x => { x.memoryAvailable = 8 * 1024 ** 3 },
    x => { x.memoryCurrent = 4 * 1024 ** 3 }, x => { x.outputAvailable = 1 }, x => { x.environment.HOME = '/home/runner' },
    x => { x.mounts[0].bytes *= 2 }, x => { x.mounts[0].inodes++ }, x => { x.mounts[0].uid = 0 },
    x => { x.mounts[0].mode = 0o777 }, x => { x.mounts[0].filesystemType = 0xef53 },
    x => { x.mountInfo[0].options = ['rw'] }, x => { x.devOwnership.mode = 0o777 },
    x => { x.mountInfo.push({ target: '/unbudgeted', type: 'ext4', options: ['rw'] }) },
    x => { x.mountInfo.push({ target: '/run', type: 'tmpfs', options: ['rw'] }) },
    x => { x.mountInfo.find(row => row.target === '/dev/shm').options = ['rw'] },
  ]) { const { snapshot, policy } = storageFixture(); mutate(snapshot); assert.throws(() => validateBrowserStorage(snapshot, policy)) }
})
test('mount and process-limit parsing reject unknown limits and retain mount escape boundaries', () => {
  assert.deepEqual(fileSizeLimit('Max file size             4294967296           4294967296           bytes\n'), { soft: 4294967296, hard: 4294967296 })
  assert.throws(() => fileSizeLimit('Max file size unlimited unlimited bytes'))
  const rows = parseMountInfo('40 20 0:35 / /path\\040space rw,nosuid - tmpfs tmpfs rw,size=1g\n')
  assert.equal(rows[0].target, '/path space'); assert.equal(rows[0].type, 'tmpfs')
  assert.throws(() => parseMountInfo('bad'))
})
test('browser storage changes only its service and does not weaken sandbox flags or build output cap', () => {
  const { event, env } = admission(), identity = admitModal(event, env)
  const options = { identity, uid: 1001, gid: 1001, root: '/repo', node: '/node', args: ['worker.mjs'], home: '/home/runner',
    temporary: '/owned/tmp', output: '/owned/evidence', parentMountNamespace: 'mnt:[1]' }
  const browser = serviceArguments({ ...options, stage: 'browser' }), build = serviceArguments({ ...options, stage: 'build' })
  assert.ok(browser.includes('--property=ProtectSystem=strict')); assert.ok(browser.includes('--property=MemorySwapMax=0'))
  assert.ok(browser.includes('--property=ReadWritePaths=/owned/evidence')); assert.ok(browser.includes('--property=LimitFSIZE=4294967296'))
  const mounts = browser.find(arg => arg.startsWith('--property=TemporaryFileSystem='))
  assert.equal((mounts.match(/size=1073741824/g) ?? []).length, 4); assert.equal((mounts.match(/nr_inodes=10000/g) ?? []).length, 4)
  assert.ok(build.includes('--property=LimitFSIZE=67108864')); assert.ok(build.includes('--setenv=HOME=/home/runner'))
  assert.equal(build.some(arg => /TemporaryFileSystem|ProtectSystem|ProtectHome|ReadOnlyPaths|MemorySwapMax|PrivateMounts/.test(arg)), false)
  assert.equal(browser.some(arg => /noexec|NoNewPrivileges|PrivateUsers|PrivateDevices|no-sandbox|unsafe-swiftshader/.test(arg)), false)
  assert.throws(() => serviceArguments({ ...options, stage: 'browser', output: '/tmp/evidence' }))
  assert.match(read('scripts/modal-invalidation/browser-worker.mjs'), /captureBrowserStorage/)
  assert.match(read('scripts/modal-invalidation/run.mjs'), /const screenshot = await page.screenshot\(\)/)
})

const { completeStage } = await import('../scripts/modal-invalidation/stage-completion.mjs')
function stageFixture() {
  const calls = [], storage = { namespace: 'mnt:[1]', device: 1, type: 1 }
  const row = { stage: 'browser', status: 'running', parentStorageBefore: storage }
  const hooks = {
    launch: () => { calls.push('launch'); return { status: 0, signal: null, stdout: Buffer.from('out'), stderr: Buffer.from('err') } },
    show: () => { calls.push('show'); return { LoadState: 'not-found' } },
    stop: () => { calls.push('stop'); return { exitCode: 1, error: null } },
    cgroupEvents: () => { calls.push('cgroup'); return 'removed' },
    parentStorage: () => { calls.push('parent'); return storage },
    retain: stream => { calls.push(`retain-${stream}`) }, save: () => { calls.push('save') },
  }
  return { row, calls, hooks }
}
test('terminal stage cleanup always precedes retention and proves both owned cgroup and unchanged parent', () => {
  const { row, calls, hooks } = stageFixture(); completeStage(row, hooks)
  assert.equal(row.status, 'passed'); assert.deepEqual(calls, ['launch', 'show', 'stop', 'show', 'cgroup', 'parent', 'retain-stdout', 'retain-stderr', 'save'])
  assert.equal(row.logs.stdout.retainedBytes, 3); assert.equal(row.logs.stdout.truncated, false)
  assert.equal(row.logs.stdout.capturedSha256, row.logs.stdout.retainedSha256)
})
test('launch, inspection, cleanup, log and receipt failures never skip independent stop and terminal checks', () => {
  for (const failure of ['launch', 'show', 'stop', 'cgroupEvents', 'parentStorage', 'retain', 'save']) {
    const { row, calls, hooks } = stageFixture(), original = hooks[failure]
    hooks[failure] = (...args) => { original(...args); throw Error(`controlled-${failure}`) }
    completeStage(row, hooks)
    assert.equal(row.status, 'failed', failure)
    for (const required of ['stop', 'cgroup', 'parent', 'save']) assert.ok(calls.includes(required), `${failure}: ${required}`)
    if (failure === 'launch') assert.match(row.launchError, /controlled-launch/)
    else assert.ok(row.failures.some(item => item.error.includes(`controlled-${failure}`)))
  }
})
test('oversized raw captures preserve a labeled bounded prefix and failed original outcome', () => {
  const { row, hooks } = stageFixture(), captured = Buffer.alloc(evidenceReserves.stream + 8192, 120), retained = {}
  hooks.launch = () => ({ status: null, signal: 'SIGTERM', error: Error('ENOBUFS'), stdout: captured })
  hooks.retain = (stream, bytes) => { retained[stream] = bytes }
  completeStage(row, hooks)
  assert.equal(row.status, 'failed'); assert.equal(row.signal, 'SIGTERM'); assert.match(row.launchError, /ENOBUFS/)
  assert.equal(row.logs.stdout.capturedBytes, captured.length); assert.equal(row.logs.stdout.retainedBytes, evidenceReserves.stream)
  assert.equal(row.logs.stdout.discardedBytes, 8192); assert.equal(row.logs.stdout.truncated, true)
  assert.equal(retained.stdout.length, evidenceReserves.stream); assert.notEqual(row.logs.stdout.capturedSha256, row.logs.stdout.retainedSha256)
  assert.ok(row.failures.some(item => item.action === 'bound-stdout'))
})
test('active cgroup or parent namespace mutation cannot pass even with successful launch and logs', () => {
  for (const change of [hooks => { hooks.cgroupEvents = () => 'populated 1\n' }, hooks => { hooks.parentStorage = () => ({ namespace: 'mnt:[2]' }) }]) {
    const { row, hooks } = stageFixture(); change(hooks); completeStage(row, hooks); assert.equal(row.status, 'failed')
  }
})
const { readTextBounded } = await import('../scripts/modal-invalidation/browser-storage.mjs')
test('storage proof reader loops through short reads to EOF and rejects overlong telemetry explicitly', () => {
  const directory = mkdtempSync(join(tmpdir(), 'pnd-modal-storage-control-'))
  try {
    const path = join(directory, 'telemetry')
    for (const count of [0, 1, 8, 9, 16]) {
      writeFileSync(path, 'x'.repeat(count)); let reads = 0
      const value = readTextBounded(path, 8, (fd, data, offset, bytes, position) => {
        reads++; return readSync(fd, data, offset, Math.min(bytes, 2), position)
      })
      assert.equal(value.text, 'x'.repeat(Math.min(count, 8))); assert.equal(value.complete, count <= 8)
      assert.equal(value.truncated, count > 8); assert.equal(value.bytes, Math.min(count, 8))
      if (count === 8) assert.equal(reads, 5, 'Exact boundary still requires EOF proof')
    }
  } finally { rmSync(directory, { recursive: true, force: true }) }
})
test('actual proc mount proof includes all bytes, not only the first procfs chunk', { skip: process.platform !== 'linux' }, () => {
  const raw = readFileSync('/proc/self/mountinfo', 'utf8'), value = readTextBounded('/proc/self/mountinfo', 256 * 1024)
  assert.ok(Buffer.byteLength(raw) < 256 * 1024); assert.equal(value.complete, true); assert.equal(value.text, raw)
  assert.deepEqual(parseMountInfo(value.text), parseMountInfo(raw))
})

test('rejected storage admission retains the captured raw proof before worker assertion', async () => {
  const { assessBrowserStorage } = await import('../scripts/modal-invalidation/browser-storage.mjs')
  const { snapshot, policy } = storageFixture()
  snapshot.rawMountInfo = { text: 'captured raw mount proof', complete: true }
  snapshot.rawLimits = { text: 'captured raw limits', complete: true }
  snapshot.namespace = snapshot.parentNamespace
  const result = assessBrowserStorage(snapshot, policy)
  assert.equal(result, snapshot); assert.equal(result.acceptance.status, 'blocked')
  assert.equal(result.rawMountInfo.text, 'captured raw mount proof'); assert.equal(result.rawLimits.text, 'captured raw limits')
  const worker = read('scripts/modal-invalidation/browser-worker.mjs')
  assert.match(worker, /report.storage = captureBrowserStorage[^\n]+; save\(\)\n {2}assert.equal\(report.storage.acceptance.status/)
})

const { visibleMounts, probeMountTarget } = await import('../scripts/modal-invalidation/mount-visibility.mjs')
function stackedMountFixture() {
  const mountInfo = [
    { id: 1, parent: 0, target: '/', type: 'ext4', options: ['ro'] },
    { id: 2, parent: 1, target: '/proc', type: 'proc', options: ['rw'] },
    { id: 3, parent: 2, target: '/proc/sys/fs/binfmt_misc', type: 'autofs', options: ['rw'] },
    { id: 4, parent: 3, target: '/proc/sys/fs/binfmt_misc', type: 'binfmt_misc', options: ['ro'] },
    { id: 5, parent: 1, target: '/run', type: 'tmpfs', options: ['ro'] },
    { id: 6, parent: 5, target: '/run/user/1001', type: 'tmpfs', options: ['rw'] },
    { id: 7, parent: 5, target: '/run/user', type: 'tmpfs', options: ['ro'] },
    { id: 8, parent: 7, target: '/run/user/1001', type: 'tmpfs', options: ['ro'] },
  ]
  return { namespace: 'mnt:[1]', namespaceAfter: 'mnt:[1]',
    rawMountInfo: { text: 'synthetic stacked graph', complete: true }, rawMountInfoAfter: { text: 'synthetic stacked graph', complete: true }, mountInfo,
    visibility: { method: 'linux-O_PATH-own-fdinfo-mnt_id', platform: 'linux', architecture: 'x64', targets: [1, 2, 4, 5, 7, 8].map(id => ({ target: mountInfo.find(row => row.id === id).target, status: 'read', mountId: id, rawFdinfo: fdProof(id) })) } }
}
test('kernel mount IDs distinguish covered stacks and children hidden by a later parent without raw order assumptions', () => {
  const snapshot = stackedMountFixture()
  assert.deepEqual(visibleMounts(snapshot).map(row => row.id), [1, 2, 4, 5, 7, 8])
  assert.deepEqual(snapshot.visibility.resolved.filter(row => !row.visible).map(row => [row.id, row.resolvedMountId]), [[3, 4], [6, 8]])
  snapshot.mountInfo.reverse(); assert.deepEqual(visibleMounts(snapshot).map(row => row.id).sort(), [1, 2, 4, 5, 7, 8])
  const ancestor = stackedMountFixture(); ancestor.mountInfo = ancestor.mountInfo.filter(row => row.id !== 8)
  Object.assign(ancestor.visibility.targets.find(row => row.mountId === 8), { mountId: 7, rawFdinfo: fdProof(7) })
  assert.deepEqual(visibleMounts(ancestor).map(row => row.id), [1, 2, 4, 5, 7])
})
test('effective mount proof rejects unknown, changed, inconsistent and malformed graphs', () => {
  for (const mutate of [
    x => { x.visibility.architecture = 'arm64' }, x => { x.namespaceAfter = 'mnt:[2]' }, x => { x.rawMountInfoAfter.text += ' changed' }, x => { x.rawMountInfoAfter.complete = false },
    x => { x.visibility.targets[0].status = 'unavailable' }, x => { x.visibility.targets[0].mountId = 999 },
    x => { x.visibility.targets.find(row => row.mountId === 8).mountId = 2 },
    x => { x.visibility.targets.find(row => row.mountId === 8).mountId = 6; x.visibility.targets.find(row => row.mountId === 7).mountId = 8 },
    x => { x.visibility.targets.pop() }, x => { x.visibility.targets.push(x.visibility.targets[0]) },
    x => { x.mountInfo[1].id = 1 }, x => { x.mountInfo[1].parent = 999 },
    x => { x.mountInfo[2].parent = 4 }, x => { x.mountInfo[5].parent = 2 },
  ]) { const snapshot = stackedMountFixture(); mutate(snapshot); for (const row of snapshot.visibility.targets) row.rawFdinfo = fdProof(row.mountId); assert.throws(() => visibleMounts(snapshot)) }
  const mismatch = stackedMountFixture(); mismatch.visibility.targets[0].rawFdinfo = fdProof(999)
  assert.throws(() => visibleMounts(mismatch), /contradicts retained raw proof/)
})
test('unexpected effective writable mounts still fail even when a lower raw row is read-only', () => {
  const { snapshot, policy } = storageFixture(), last = snapshot.mountInfo.length + 1
  snapshot.mountInfo.push({ id: last, parent: 1, target: '/dev/hugepages', type: 'hugetlbfs', options: ['rw'] })
  snapshot.visibility.targets.push({ target: '/dev/hugepages', status: 'read', mountId: last, rawFdinfo: fdProof(last) })
  assert.throws(() => validateBrowserStorage(snapshot, policy), /Unexpected ordinary writable mount/)
  snapshot.mountInfo.push({ id: last + 1, parent: last, target: '/dev/hugepages', type: 'hugetlbfs', options: ['ro'] })
  Object.assign(snapshot.visibility.targets.at(-1), { mountId: last + 1, rawFdinfo: fdProof(last + 1) })
  assert.equal(validateBrowserStorage(snapshot, policy).status, 'passed')
  snapshot.mountInfo[last - 1].options = ['ro']; snapshot.mountInfo[last].options = ['rw']
  assert.throws(() => validateBrowserStorage(snapshot, policy), /Unexpected ordinary writable mount/)
})
test('actual O_PATH proof reads only own fd metadata, rejects symlinks, and closes descriptors on read failure', { skip: process.platform !== 'linux' || process.arch !== 'x64' }, () => {
  const directory = mkdtempSync(join(tmpdir(), 'pnd-modal-mount-control-'))
  try {
    const before = readdirSync('/proc/self/fd').length, proof = probeMountTarget(directory)
    assert.equal(proof.status, 'read'); assert.ok(proof.mountId > 0); assert.equal(proof.rawFdinfo.complete, true)
    assert.ok(parseMountInfo(readFileSync('/proc/self/mountinfo', 'utf8')).some(row => row.id === proof.mountId))
    assert.equal(probeMountTarget(directory, () => { throw Error('controlled read failure') }).status, 'unavailable')
    assert.throws(() => probeMountTarget(directory, undefined, fd => { closeSync(fd); throw Error('controlled close failure') }), /controlled close failure/)
    symlinkSync(directory, join(directory, 'link')); assert.equal(probeMountTarget(join(directory, 'link')).status, 'unavailable')
    assert.equal(readdirSync('/proc/self/fd').length, before)
  } finally { rmSync(directory, { recursive: true, force: true }) }
})
test('browser-only read-only home and API restrictions preserve explicit child exceptions and unchanged allowances', () => {
  const { event, env } = admission(), identity = admitModal(event, env)
  const options = { identity, stage: 'browser', uid: 1001, gid: 1001, root: '/repo', node: '/node', args: ['worker.mjs'], home: '/home/runner', temporary: '/owned/tmp', output: '/owned/evidence', parentMountNamespace: 'mnt:[1]' }
  const args = serviceArguments(options)
  assert.ok(args.includes('--property=ProtectHome=read-only'))
  assert.ok(args.includes(`--property=ReadOnlyPaths=${browserReadOnlyPaths.map(path => '-' + path).join(' ')}`))
  assert.ok(args.includes('--property=ReadWritePaths=/owned/evidence')); assert.ok(args.includes('--property=LimitFSIZE=4294967296'))
  assert.ok(browserReadOnlyPaths.includes('/dev/hugepages')); assert.ok(browserReadOnlyPaths.includes('/proc/sys/fs/binfmt_misc'))
  assert.equal(browserReadOnlyPaths.includes('/proc'), false); assert.equal(browserReadOnlyPaths.includes('/sys/fs/cgroup'), false)
  const x = proof(); x.properties.ProtectHome = 'no'; assert.throws(() => validateSupervisor(x.properties, x.expected))
  const y = proof(); y.properties.ReadOnlyPaths = '-/dev/hugepages'; assert.throws(() => validateSupervisor(y.properties, y.expected))
})

test('retained systemd 255 graph IDs resolve both actual covered-mount examples with kernel observations', () => {
  const snapshot = stackedMountFixture(), ids = new Map([[0, 62], [1, 393], [2, 399], [3, 400], [4, 401], [5, 412], [6, 414], [7, 423], [8, 424]])
  for (const row of snapshot.mountInfo) { row.id = ids.get(row.id); row.parent = ids.get(row.parent) }
  for (const row of snapshot.visibility.targets) { row.mountId = ids.get(row.mountId); row.rawFdinfo = fdProof(row.mountId) }
  assert.deepEqual(visibleMounts(snapshot).map(row => row.id), [393, 399, 401, 412, 423, 424])
  assert.deepEqual(snapshot.visibility.resolved.filter(row => !row.visible).map(row => [row.id, row.resolvedMountId]), [[400, 401], [414, 424]])
})
