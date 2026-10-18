import test from 'node:test'
import assert from 'node:assert/strict'
import {
  mkdtempSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
  symlinkSync,
  mkdirSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import {
  storeObservation,
  materializeObservations,
  manifest,
  enforceBudget,
} from './observation-store.mjs'
import { accounting } from './io.mjs'
const root = () => mkdtempSync(join(tmpdir(), 'body-cas-test-'))
test('CAS preserves exact gzip bytes and every logical path with inode-aware accounting', () => {
  const dir = root(),
    bytes = gzipSync(Buffer.from('all original encoded fields and pixels'))
  storeObservation(dir, 'camera-baseline/step-0.state.json.gz', bytes)
  storeObservation(dir, 'camera-candidate/step-0.state.json.gz', bytes)
  const before = accounting(dir)
  materializeObservations(dir)
  for (const side of ['baseline', 'candidate'])
    assert.deepEqual(readFileSync(join(dir, `camera-${side}/step-0.state.json.gz`)), bytes)
  const after = accounting(dir)
  assert.equal(after.physicalBytes, before.physicalBytes)
  assert.equal(after.logicalBytes - before.logicalBytes, bytes.length * 2)
  assert.equal(Object.keys(manifest(dir).paths).length, 2)
  assert.throws(
    () => enforceBudget(dir, after.physicalBytes),
    error =>
      error.accounting.physicalBytes === after.physicalBytes &&
      error.accounting.logicalBytes === after.logicalBytes
  )
})
test('CAS rejects missing/corrupted blobs and incompatible materialized files', () => {
  for (const fault of ['missing', 'corrupt', 'target']) {
    const dir = root(),
      path = 'camera-baseline/step-0.rgba.gz',
      bytes = gzipSync(Buffer.from('pixels'))
    storeObservation(dir, path, bytes)
    const entry = manifest(dir).paths[path],
      blob = join(dir, 'observation-cas', `${entry.sha256}.blob.gz`)
    if (fault === 'missing') unlinkSync(blob)
    if (fault === 'corrupt') writeFileSync(blob, Buffer.alloc(bytes.length))
    if (fault === 'target') {
      mkdirSync(join(dir, 'camera-baseline'))
      writeFileSync(join(dir, path), 'wrong')
    }
    assert.throws(() => materializeObservations(dir))
  }
})
test('CAS rejects traversal, duplicate paths and symlink directories/files', () => {
  const dir = root(),
    bytes = Buffer.from('gzip bytes')
  for (const path of [
    '../outside.gz',
    '/tmp/out.gz',
    'camera-baseline/../outside.gz',
    'unknown/x.rgba.gz',
  ])
    assert.throws(() => storeObservation(dir, path, bytes))
  const path = 'camera-baseline/step-0.rgba.gz'
  storeObservation(dir, path, bytes)
  assert.throws(() => storeObservation(dir, path, bytes))
  symlinkSync(tmpdir(), join(dir, 'camera-baseline'))
  assert.throws(() => materializeObservations(dir))
  const other = root()
  symlinkSync(tmpdir(), join(other, 'observation-cas'))
  assert.throws(() => storeObservation(other, path, bytes))
})

test('archive keeps CAS and receipts but not redundant observation links; budgets remain fixed', async () => {
  const { protocol } = await import('./protocol.mjs')
  const workflow = readFileSync(new URL('./hosted-workflow.yml', import.meta.url), 'utf8')
  assert.ok(workflow.includes('diagnostic/outputs/body-layer-stage-a/**/*.gz'))
  for (const cohort of ['camera', 'animation'])
    assert.ok(workflow.includes(`!diagnostic/outputs/body-layer-stage-a/run/${cohort}-*/*.gz`))
  for (const extension of ['json', 'png', 'log'])
    assert.ok(workflow.includes(`diagnostic/outputs/body-layer-stage-a/**/*.${extension}`))
  assert.equal(protocol.maximumEvidenceBytes, 805306368)
  assert.equal(protocol.childMs, 150000)
  const dir = root(),
    path = 'camera-baseline/step-0.rgba.gz'
  storeObservation(dir, path, Buffer.from('bytes'))
  const m = manifest(dir),
    entry = m.paths[path]
  m.paths['../escape.gz'] = entry
  writeFileSync(join(dir, 'observation-cas', 'manifest.json'), JSON.stringify(m))
  assert.throws(() => materializeObservations(dir), /Unsafe observation path/)
})
