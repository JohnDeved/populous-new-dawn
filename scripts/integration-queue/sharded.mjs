// Trusted, read-only validation. Never import executable policy from the candidate.
import { createHash } from 'node:crypto'

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

export function shardedLogReceipt(log) {
  const lines = log.split('\n').map(line => line.replace(/^\d{4}-\d\d-\d\dT\S+\s+/, ''))
    .filter(line => line.startsWith('PND_FULL_CHECK_RECEIPT'))
  const chunks = lines.filter(line => line.startsWith('PND_FULL_CHECK_RECEIPT_CHUNK='))
  const hashes = lines.filter(line => /^PND_FULL_CHECK_RECEIPT_SHA256=[a-f0-9]{64}$/.test(line))
  ensure(chunks.length > 0 && chunks.length <= 1024 && hashes.length === 1 &&
    lines.length === chunks.length + 1 && lines.at(-1) === hashes[0],
    'missing, duplicate or malformed aggregate receipt')
  const encoded = chunks.map((line, index) => {
    const match = /^PND_FULL_CHECK_RECEIPT_CHUNK=(0|[1-9][0-9]*)\/([1-9][0-9]*):([A-Za-z0-9+/=]+)$/.exec(line)
    ensure(match && Number(match[1]) === index && Number(match[2]) === chunks.length &&
      match[3].length <= 16000 && (index === chunks.length - 1 || match[3].length === 16000),
      'missing, duplicate, reordered or truncated receipt chunk')
    return match[3]
  }).join('')
  const bytes = Buffer.from(encoded, 'base64')
  ensure(bytes.length < 8 * 1024 * 1024 && bytes.toString('base64') === encoded &&
    createHash('sha256').update(bytes).digest('hex') === hashes[0].split('=')[1],
    'aggregate receipt checksum/encoding differs')
  return JSON.parse(bytes.toString('utf8'))
}

export function validateShardedReceipt(receipt, expected) {
  const { identity, inventory } = expected
  ensure(receipt?.version === 1 && receipt.kind === 'full-check' && receipt.status === 'passed',
    'aggregate did not pass')
  ensure(same(receipt.identity, identity), 'aggregate identity differs from exact run/attempt/source')
  ensure(same(receipt.inventory, inventory) && inventory.length > 0 &&
    inventory.every(i => /^tests\/[^./\0\r\n][^/\0\r\n]*\.test\.mjs$/.test(i.file) && sha256(i.sha256)) &&
    same(inventory.map(i => i.file), [...new Set(inventory.map(i => i.file))].sort()),
    'test inventory differs from exact Git source')
  const runtime = receipt.runtime
  ensure(runtime && runtime.node === '24.19.0' && runtime.npm === '11.9.0' &&
    runtime.python === '3.12.14' && runtime.pillow === '12.3.0' &&
    runtime.platform === 'linux' && runtime.arch === 'x64' &&
    runtime.lockSha256 === expected.lockSha256 && sha256(runtime.installedLockSha256),
    'runtime or lockfile differs from pinned inputs')
  const envelope = (value, kind) => ensure(value?.version === 1 && value.kind === kind &&
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
    ensure(value.shard?.version === 1 && value.shard.kind === 'pnd-test-shard-receipt', 'invalid shard schema')
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
      /^\/.*\/node$/.test(r.command[0]) && same(r.command.slice(1),
        ['--test', `--test-concurrency=${plan.groups[i].concurrency}`, '--test-reporter=tap', ...plan.groups[i].files]) &&
      r.concurrency === plan.groups[i].concurrency &&
      same(r.files, plan.groups[i].files), 'failed/skipped/missing test subprocess'))
    coverage.push(...files)
  }
  ensure(same(coverage.sort(), inventory.map(i => i.file)), 'test coverage is not exact')
  return true
}
