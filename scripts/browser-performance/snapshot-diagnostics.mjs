// Presentation only: strict v2 admission and classification remain in snapshot-protocol.
import assert from 'node:assert/strict'
import { validateIdentity } from './protocol.mjs'
import { compareReports, maxReportBytes, order, shards } from './snapshot-protocol.mjs'

const prefix = value => value === null ? 'unknown' : value.slice(0, 12)
const number = (value, missing = 'unknown') => value === null ? missing : String(value)
const session = index => `pair ${Math.floor(index / 2) + 1}/${order[index]}`
const values = (items, display) => ['base', 'head'].map(side =>
  `${side === 'base' ? 'B' : 'H'} [${items.filter((_, index) => order[index] === side).map(display).join(', ')}]`).join('; ')

function mismatch(phases, read, label, digest = false, missing = 'unknown') {
  const items = phases.map(read), index = items.findIndex(value => value !== items[0])
  if (index < 0) return null
  return `${label}: ${values(items, digest ? prefix : value => number(value, missing))}. ${session(0)} != ${session(index)}; exact ${digest ? 'full SHA-256' : 'value'} equality required across all six sessions${digest ? ' (12-character prefixes shown)' : ''}.`
}
function blockMismatch(phases, field, warmup = false) {
  if (warmup) phases = phases.map(phase => ({ blocks: phase.warmup.blocks }))
  for (let step = 0; step < phases[0].blocks.length; step++) {
    const blocks = phases.map(phase => phase.blocks[step]), label = `${warmup ? 'Warmup input' : 'Input'} ${step + 1}`
    if (field === 'geometry') {
      const reason = mismatch(blocks, block => block.geometrySha256, `${label} terrain-input fingerprint SHA-256`, true)
        ?? (Object.hasOwn(blocks[0], 'geometryAfterSha256') ? mismatch(blocks, block => block.geometryAfterSha256, `${label} post-input terrain fingerprint SHA-256`, true) : null)
      if (reason) return `${reason} This fingerprint includes bounded consumer function signatures; see raw boundary diagnostics for component detail. It does not establish gameplay drift.`
    } else {
      if (Object.hasOwn(blocks[0], 'inputPoseSha256')) {
        const reason = mismatch(blocks, block => block.inputPoseSha256, `${label} pre-input pose SHA-256`, true)
        if (reason) return reason
      }
      for (const [axis, name] of ['x', 'y'].entries()) {
        const reason = mismatch(blocks, block => block.point[axis], `${label} pointer ${name} pixels`)
        if (reason) return reason
      }
      for (let callback = 0; callback < blocks[0].poses.length; callback++) {
        const reason = mismatch(blocks, block => block.poses[callback], `${label}, callback ${callback + 1} pose SHA-256`, true)
        if (reason) return reason
      }
      for (let callback = 0; callback < blocks[0].inventory.length; callback++) {
        for (const [column, name] of ['terrain queries', 'object queries', 'native submitted triangles'].entries()) {
          const reason = mismatch(blocks, block => block.inventory[callback][column], `${label}, callback ${callback + 1} ${name}`)
          if (reason) return `${reason}${column === 2 ? ' Missing inventory is unknown, never zero.' : ''}`
        }
      }
    }
  }
  return null
}
function shardHashMismatch(reports, field, label) {
  const available = Object.keys(shards).map(shard => reports.find(report => report.shard === shard)).filter(report => report && report[field] !== null)
  if (new Set(available.map(report => report[field])).size <= 1) return null
  return `${label}: ${available.map(report => `${report.shard}=${prefix(report[field])}`).join('; ')}. Exact full SHA-256 equality required across available shards (12-character prefixes shown).`
}
function presence(report, phase) {
  return order.map((_, index) => {
    const run = report?.runs[index]
    return `${session(index)}: ${run ? `phase ${run.phases.some(item => item.name === phase) ? 'present' : 'missing'}, run ${run.status}` : 'run missing, phase missing'}`
  }).join('; ')
}
function explanation(status, report, phase, reports) {
  if (status === 'incomplete-cohort') return 'The added held-drag cohort did not complete strict capture/summary admission in at least one arm. Its measurements are missing, not passed; retained stable-phase results remain available. The first failure and raw evidence are retained in the run artifacts.'
  if (status === 'unsupported-source-contract') return 'Held-drag routing/admission source differs from the reviewed contract in at least one arm. This new cohort is unsupported pending source review; the five stable phases remain independently available. Exact expected/actual source hashes are retained in the raw receipt.'
  if (status === 'incomplete' || status === 'incompatible-dependencies')
    return `Shard report ${report?.status ?? 'missing'}. ${presence(report, phase)}. All six runs and the shard report must be complete; each run must contain this phase. Failure cause is not recorded in this schema.`
  const phases = report.runs.map(run => run.phases.find(item => item.name === phase))
  if (status === 'environment-mismatch') {
    // The comparator admits independent runtimes for disjoint shards. Diagnose
    // only this cell's six sessions, never another shard's runtime identity.
    return mismatch(report.runs, run => run.environmentSha256, 'Browser environment SHA-256', true)
  }
  if (status === 'geometry-input-mismatch') return blockMismatch(phases, 'geometry')
  if (status === 'workload-mismatch') {
    const snapshot = shardHashMismatch(reports, 'snapshotSha256', 'Authored snapshot SHA-256')
    if (snapshot) return snapshot
    for (const [field, label, digest] of [['stateSha256', 'Authored state SHA-256', true], ['viewConfigSha256', 'View configuration SHA-256', true], ['targetId', 'Target ID', false]]) {
      const reason = mismatch(phases, item => item[field], label, digest, 'none')
      if (reason) return reason
    }
    for (const [axis, name] of ['x', 'y'].entries()) {
      const reason = mismatch(phases, item => item.point[axis], `Phase pointer ${name} pixels`)
      if (reason) return reason
    }
    return blockMismatch(phases, 'workload')
      ?? (phases[0].warmup ? blockMismatch(phases, 'geometry', true) ?? blockMismatch(phases, 'workload', true) : null)
  }
  return null
}

export function snapshotDiagnostics(comparison, identity, reports) {
  // Validate the entire collection, including fields not displayed, before producing
  // any text. Recompute the existing classifier rather than trusting caller strings.
  validateIdentity(identity)
  assert.ok(Array.isArray(reports) && reports.length <= Object.keys(shards).length)
  const verified = compareReports(reports, identity)
  for (const report of reports) assert.ok(Buffer.byteLength(JSON.stringify(report)) <= maxReportBytes)
  assert.deepEqual(comparison, verified)
  const blocked = new Set(['incomplete-cohort', 'unsupported-source-contract', 'incomplete', 'incompatible-dependencies', 'environment-mismatch', 'geometry-input-mismatch', 'workload-mismatch'])
  return Object.entries(shards).flatMap(([shard, names]) => names.map(phase => {
    const status = verified.rows.find(row => row.shard === shard && row.phase === phase).p50.status
    if (!blocked.has(status)) return { shard, phase, diagnosis: null }
    const reason = explanation(status, reports.find(report => report.shard === shard), phase, reports)
    assert.ok(reason, 'Blocked phase requires a strict-field diagnosis')
    return { shard, phase, diagnosis: `${status}: ${reason} Timing comparisons withheld; no timing delta, ratio or speedup is inferred.` }
  }))
}
