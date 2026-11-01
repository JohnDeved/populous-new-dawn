// Trusted, read-only validation. Never import executable policy from the candidate.
import { createHash } from 'node:crypto'
import { crc32, inflateRawSync } from 'node:zlib'

const ensure = (value, message) => { if (!value) throw new Error(`Sharded Full check: ${message}`) }
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const sha256 = value => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value)
const common = ['Require a ready pull request', 'Check out the exact proposed merge',
  'Set up Node', 'Set up Python for portable fixture tests', 'Install locked dependencies',
  'Verify and record candidate identity']
export const SHARDED_JOBS = [
  { name: 'Quality and build', steps: [...common, 'Typecheck', 'Parity check',
    'Orchestration check', 'Production build', 'Reject tracked input mutation', 'Upload quality receipt'] },
  ...Array.from({ length: 4 }, (_, i) => ({ name: `Test shard ${i + 1}/4`,
    steps: [...common, 'Run test shard', 'Reject tracked input mutation', 'Upload shard receipt'] })),
]

export const BASELINE_DIAGNOSTIC = {
  name: 'Legacy test baseline (diagnostic)',
  steps: [...common, 'Legacy full test suite', 'Reject tracked input mutation'],
}

// Transport limits are independent of candidate executable policy. Historical
// unversioned plain-base64 logs remain readable; a versioned log never falls back.
const RECEIPT_LIMIT = 8 * 1024 * 1024
const ENCODED_LIMIT = 4 * Math.ceil(RECEIPT_LIMIT / 3)
const GZIP_TRANSPORT = 'PND_FULL_CHECK_RECEIPT_TRANSPORT=2:gzip-base64'
function receiptBytes(lines, compressed) {
  const chunks = lines.slice(0, -1), checksum = lines.at(-1)
  ensure(chunks.length > 0 && chunks.length <= Math.ceil(ENCODED_LIMIT / 16000) &&
    /^PND_FULL_CHECK_RECEIPT_SHA256=[a-f0-9]{64}$/.test(checksum ?? ''),
    'missing, duplicate or malformed aggregate receipt')
  let encodedLength = 0
  const encoded = chunks.map((line, index) => {
    const match = /^PND_FULL_CHECK_RECEIPT_CHUNK=(0|[1-9][0-9]*)\/([1-9][0-9]*):([A-Za-z0-9+/=]+)$/.exec(line)
    ensure(match && match[1] === String(index) && match[2] === String(chunks.length) &&
      match[3].length <= 16000 && (index === chunks.length - 1 || match[3].length === 16000),
      'missing, duplicate, reordered or truncated receipt chunk')
    encodedLength += match[3].length
    ensure(encodedLength <= ENCODED_LIMIT, 'aggregate encoded receipt exceeds byte limit')
    return match[3]
  }).join('')
  let bytes = Buffer.from(encoded, 'base64')
  ensure(bytes.length <= RECEIPT_LIMIT, 'aggregate compressed receipt exceeds byte limit')
  ensure(bytes.toString('base64') === encoded, 'aggregate receipt encoding differs')
  if (compressed) {
    ensure(bytes.length >= 20 && bytes.subarray(0, 10).equals(Buffer.from('1f8b0800000000000003', 'hex')),
      'noncanonical gzip header')
    const deflate = bytes.subarray(10, -8), trailer = bytes.subarray(-8)
    // Decode precisely one raw stream. Checking consumption rejects concatenated
    // gzip members, padding and trailing bytes rather than silently ignoring them.
    const inflated = inflateRawSync(deflate, { maxOutputLength: RECEIPT_LIMIT - 1, info: true })
    ensure(inflated.engine.bytesWritten === deflate.length, 'trailing gzip stream data')
    ensure(inflated.buffer.length === trailer.readUInt32LE(4) &&
      crc32(inflated.buffer) === trailer.readUInt32LE(0), 'gzip size/checksum differs')
    bytes = inflated.buffer
  }
  ensure(bytes.length < RECEIPT_LIMIT &&
    createHash('sha256').update(bytes).digest('hex') === checksum.split('=')[1],
    'aggregate receipt checksum/encoding differs')
  const json = bytes.toString('utf8')
  ensure(Buffer.from(json).equals(bytes), 'aggregate receipt is not valid UTF-8')
  return JSON.parse(json)
}

export function shardedLogReceipt(log) {
  ensure(typeof log === 'string' && Buffer.byteLength(log) <= 32 * 1024 * 1024,
    'aggregate log exceeds input byte limit')
  const lines = log.split('\n').map(line => line.replace(/^\d{4}-\d\d-\d\dT\S+\s+/, ''))
    .filter(line => line.startsWith('PND_FULL_CHECK_RECEIPT'))
  const versioned = lines.some(line => line.startsWith('PND_FULL_CHECK_RECEIPT_TRANSPORT'))
  if (versioned) {
    ensure(lines[0] === GZIP_TRANSPORT, 'unknown, misplaced or malformed receipt transport')
    return receiptBytes(lines.slice(1), true)
  }
  return receiptBytes(lines, false)
}

// Keep this trusted allowlist independent of candidate executable policy.
function shardCommandMatches(command, group, runtime, expected) {
  const prefix = ['--test', `--test-concurrency=${group.concurrency}`, '--test-reporter=tap']
  if (same(command, [...prefix, ...group.files])) return true
  return sha256(expected.timingReporterSha256) &&
    runtime.timingReporterSha256 === expected.timingReporterSha256 &&
    same(command, [...prefix, '--test-reporter-destination=stdout',
      '--test-reporter=./scripts/orchestration/test-timing-reporter.mjs',
      '--test-reporter-destination=stderr', ...group.files])
}

export function validateShardedReceipt(receipt, expected) {
  const { identity, inventory } = expected
  const pnpm = expected.packageManager === 'pnpm@11.25.0', version = pnpm ? 2 : 1
  ensure(receipt?.version === version && receipt.kind === 'full-check' && receipt.status === 'passed',
    'aggregate did not pass')
  ensure(same(receipt.identity, identity), 'aggregate identity differs from exact run/attempt/source')
  ensure(same(receipt.inventory, inventory) && inventory.length > 0 &&
    inventory.every(i => /^tests\/[^./\0\r\n][^/\0\r\n]*\.test\.mjs$/.test(i.file) && sha256(i.sha256)) &&
    same(inventory.map(i => i.file), [...new Set(inventory.map(i => i.file))].sort()),
    'test inventory differs from exact Git source')
  const runtime = receipt.runtime
  ensure(runtime && runtime.node === '24.19.0' &&
    runtime.python === '3.12.14' && runtime.pillow === '12.3.0' &&
    runtime.platform === 'linux' && runtime.arch === 'x64' &&
    runtime.lockSha256 === expected.lockSha256,
    'runtime or lockfile differs from pinned inputs')
  const installed = value => value && Object.keys(value).length === 1 && sha256(value.modulesMetadataSha256)
  if (pnpm) ensure(runtime.dependencyFormat === 'pnpm-isolated-v1' && runtime.packageManager === 'pnpm@11.25.0' &&
    runtime.npm === undefined && runtime.installedLockSha256 === undefined &&
    runtime.packageJsonSha256 === expected.packageJsonSha256 && runtime.sourceNpmLockSha256 === expected.lockSha256 &&
    runtime.pnpmLockSha256 === expected.pnpmLockSha256 && runtime.installedPnpmLockSha256 === expected.pnpmLockSha256 &&
    runtime.workspaceSha256 === expected.workspaceSha256 &&
    [expected.packageJsonSha256, expected.pnpmLockSha256, expected.workspaceSha256].every(sha256) && installed(receipt.installation),
    'pnpm runtime or genuine source/installed locks differ')
  else ensure(runtime.npm === '11.9.0' && runtime.dependencyFormat === undefined && sha256(runtime.installedLockSha256),
    'legacy npm runtime or installed lock differs')
  const envelope = (value, kind) => ensure(value?.version === version && value.kind === kind &&
    (!pnpm || installed(value.installation)) &&
    value.status === 'passed' && same(value.identity, identity) &&
    same(value.inventory, inventory) && same(value.runtime, runtime),
    `${kind} receipt source/runtime/attempt mismatch`)
  envelope(receipt.quality, 'quality')
  ensure(same(receipt.quality.stages, ['typecheck', 'parity', 'orchestration', 'build']),
    'missing quality/build stages')
  ensure(Array.isArray(receipt.shards) && receipt.shards.length === 4, 'need exactly four shard receipts')
  const indexes = new Set(), coverage = []
  for (const value of receipt.shards) {
    envelope(value, 'shard')
    const { plan, result, inputsBefore, inputsAfter } = value.shard ?? {}
    ensure(value.shard?.version === version && value.shard.kind === 'pnd-test-shard-receipt', 'invalid shard schema')
    if (pnpm) ensure(plan?.dependencyFormat === 'pnpm-isolated-v1' && installed(value.shard.installationBefore) &&
      same(value.shard.installationBefore, value.shard.installationAfter) && same(value.shard.installationBefore, value.installation),
      'pnpm shard local metadata changed or differs from its worker')
    const index = plan?.shard?.index
    ensure(Number.isInteger(index) && index >= 0 && index < 4 && !indexes.has(index), 'duplicate or invalid shard index')
    indexes.add(index)
    const files = inventory.filter((_, i) => i % 4 === index).map(i => i.file)
    ensure(plan.mode === 'shard' && plan.fullSuite === false && plan.shard.count === 4 &&
      plan.shard.algorithm === 'sorted-round-robin-v1' &&
      same(plan.discovered, inventory.map(i => i.file)) && same(plan.files, files),
      'missing/duplicate/altered shard coverage')
    ensure(inputsBefore === plan.inputFingerprint && inputsAfter === plan.inputFingerprint &&
      value.shard.inputError === null && sha256(plan.inputFingerprint), 'shard inputs changed or lack fingerprint')
    ensure(Array.isArray(plan.groups) && plan.groups.length > 0 &&
      plan.groups.every(g => [1, 2].includes(g.concurrency) && Array.isArray(g.files) && g.files.length > 0) &&
      same(plan.groups.flatMap(g => g.files).sort(), [...files].sort()), 'invalid shard groups')
    ensure(result?.mode === 'shard' && result.fullSuite === false && result.complete === true &&
      result.status === 'passed' && result.shardComplete === true && result.interrupted === null && Array.isArray(result.results) &&
      result.results.length === plan.groups.length, 'incomplete or interrupted shard result')
    result.results.forEach((r, i) => ensure(r.status === 'passed' && r.exitCode === 0 &&
      r.signal === null && r.error === null && Array.isArray(r.command) &&
      /^\/.*\/node$/.test(r.command[0]) &&
      shardCommandMatches(r.command.slice(1), plan.groups[i], runtime, expected) &&
      r.concurrency === plan.groups[i].concurrency &&
      same(r.files, plan.groups[i].files), 'failed/skipped/missing test subprocess'))
    coverage.push(...files)
  }
  ensure(same(coverage.sort(), inventory.map(i => i.file)), 'test coverage is not exact')
  return true
}

export function validateBaselineLog(log, inventory) {
  const rows = log.split('\n').map(line => line.replace(/^\d{4}-\d\d-\d\dT\S+\s+/, ''))
    .filter(line => line.startsWith('{"kind":"pnd-test-plan",') || line.startsWith('{"kind":"pnd-test-result",'))
    .map(line => JSON.parse(line))
  const plans = rows.filter(r => r.kind === 'pnd-test-plan'), results = rows.filter(r => r.kind === 'pnd-test-result')
  ensure(plans.length === 1 && results.length === 1, 'baseline needs one complete test plan/result')
  const plan = plans[0], result = results[0], files = inventory.map(i => i.file)
  ensure(plan.mode === 'all' && plan.fullSuite === true && same(plan.files, files) &&
    Array.isArray(plan.groups) && plan.groups.length > 0 &&
    plan.groups.every(g => [1, 2].includes(g.concurrency) && Array.isArray(g.files) && g.files.length > 0) &&
    same(plan.groups.flatMap(g => g.files).sort(), files), 'baseline lacks exact full-suite coverage')
  ensure(result.mode === 'all' && result.fullSuite === true && result.complete === true &&
    result.interrupted === null && result.status === 'passed' &&
    Array.isArray(result.results) && result.results.length === plan.groups.length,
    'baseline test suite did not finish successfully')
  result.results.forEach((r, i) => ensure(r.status === 'passed' && r.exitCode === 0 &&
    r.signal === null && r.error === null && r.concurrency === plan.groups[i].concurrency &&
    same(r.files, plan.groups[i].files) && Array.isArray(r.command) && /^\/.*\/node$/.test(r.command[0]) &&
    same(r.command.slice(1), ['--test', `--test-concurrency=${r.concurrency}`, '--test-reporter=tap', ...r.files]),
    'baseline subprocess failed or changed test selection'))
  return true
}
