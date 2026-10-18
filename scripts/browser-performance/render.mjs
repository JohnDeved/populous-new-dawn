import { metricLabels, metrics, shards, order, policy, validateIdentity, validateReport, workloadDiagnostics } from './protocol.mjs'
export const commentMarker = '<!-- populous-browser-performance-v1 -->'
const format = value => Number.isFinite(value) ? value.toFixed(3) : 'unknown'
const signal = (result, unit) => {
  if (result.baseline === undefined) return result.status
  const delta = `${result.delta >= 0 ? '+' : ''}${format(result.delta)} ${unit}`
  const percent = result.percent === null ? 'relative unknown' : `${result.percent >= 0 ? '+' : ''}${result.percent.toFixed(1)}%`
  return `${result.status}: ${format(result.baseline)} → ${format(result.candidate)} ${unit} (${delta}; ${percent})`
}
const diagnosticNumber = value => Number.isFinite(value) ? String(Number(value.toFixed(3))) : 'unknown'
const diagnosticLabels = Object.freeze({ duration: 'Phase duration', turn: 'Game turns', target: 'Target ID',
  pointer: 'Pointer position', 'input-count': 'Input count', 'input-timing': 'Input timing', camera: 'Camera',
  'query-presence': 'Query presence' })
const cameraFields = ['start x', 'start y', 'start angle', 'end x', 'end y', 'end angle']
function workloadExplanation(phases) {
  const lines = [
    `workload-mismatch: timing comparisons withheld for all ${Object.keys(metrics).length} sections in this phase. No timing delta, ratio or speedup is inferred.`,
    'B = baseline, PR = candidate. Lists contain each arm’s three sessions in capture order. Every session is checked against B1, including other baseline sessions. Values are rounded to 0.001; guards use full precision.']
  for (const reason of workloadDiagnostics(phases)) {
    if (reason.code === 'missing-sessions') { lines.push('- Session inputs are incomplete; missing observations are unknown.'); continue }
    const item = reason.observations[0]
    const display = value => reason.code === 'target' && value === null ? 'none' : diagnosticNumber(value)
    const values = side => item.values.filter((_, index) => order[index] === side).map(display).join(', ')
    const field = reason.code === 'camera' ? cameraFields[item.field]
      : reason.code === 'input-timing' ? `event ${item.field + 1} offset ms`
      : reason.code === 'turn' ? (item.field === 'startTurn' ? 'start' : 'end')
      : reason.code === 'pointer' ? (item.field === 'x' ? 'x pixels' : 'y pixels')
      : reason.code === 'query-presence' ? (item.field === 'terrainCalls' ? 'terrain queries/frame' : 'object queries/frame') : null
    const other = reason.observations.length > 1 ? ` (${reason.observations.length} fields differ; first shown)` : ''
    let rule
    if (reason.code === 'query-presence') rule = 'presence must be known and match (zero versus positive); missing = unknown'
    else if (reason.code === 'target' || reason.code === 'input-count') rule = 'exact match required'
    else {
      const side = order[item.index], session = order.slice(0, item.index + 1).filter(value => value === side).length
      // Preserve precision when rounding would make a strict violation look equal.
      const number = Number(item.difference.toFixed(3)) <= Number(item.limit.toFixed(3)) ? String : diagnosticNumber
      rule = `B1 vs ${side === 'base' ? 'B' : 'PR'}${session}: difference ${number(item.difference)} > limit ${number(item.limit)}`
      if (reason.code === 'duration') rule += ` ms (${policy.durationTolerance * 100}% of the larger duration)`
      else if (reason.code === 'input-timing') rule += ' ms'
      else if (reason.code === 'turn') rule += ' turns'
      else if (reason.code === 'pointer') rule += ' pixels'
    }
    lines.push(`- ${diagnosticLabels[reason.code]}${field ? ` / ${field}` : ''}${other}: B [${values('base')}], PR [${values('head')}]; ${rule}.`)
  }
  return lines
}
export function renderComment(comparison, identity, reports, { harnessChanged = false } = {}) {
  validateIdentity(identity); reports.forEach(validateReport)
  // All variable text below is a fixed label, validated digest, or bounded number.
  // Artifact strings, failure stacks, titles, branch names and URLs are not echoed.
  const runUrl = `https://github.com/JohnDeved/populous-new-dawn/actions/runs/${identity.runId}/attempts/${identity.runAttempt}`
  const lines = [commentMarker, '## Informational browser performance',
    `Base \`${identity.baseSha}\` → PR \`${identity.headSha}\`. [Raw captures, summaries and runtime details](${runUrl}).`,
    `${comparison.complete ? 'Both capture shards completed.' : 'Incomplete or incompatible capture shards; no overall comparison.'} This is not a required check, review approval, or permission to merge.`,
    'Two independent runner shards; three paired fresh-browser sessions per arm within each shard (B/H, H/B, B/H). No cross-runner timing comparisons or summed speedup.',
    'Internal work counters are reported, not equated to input workload: fewer projections/cache builds may be the intended optimization. Nested pick timings use per-query frame averages. Simulation stays observation-only because per-frame turn attribution is unavailable.',
    'Small sample: possible signals only, not statistical significance. Repeat/noise and workload guards are preliminary, not qualified performance gates.',
    'F8-enabled CPU wall-time distributions and RAF cadence only, not GPU time, presented FPS, or hardware smoothness. Nested buckets overlap; do not add them.',
    'Both arms use the exact base capture/build harness and locked dependencies. Public authored Level 2, 1440×1000, DPR 1, 2-second warmup, fixed inputs and 1.6-second requested phases; actual durations/work must match.',
    ...(harnessChanged ? ['⚠️ This PR changes the harness, protocol or measurement-producing source files. PR harness changes are excluded from both arms, but app instrumentation changes remain in the measured build and can move metric boundaries. Validate them separately; timing differences are not automatically equivalent-work speedups.'] : []),
    ...(comparison.missing.length ? [`Missing shards: ${comparison.missing.join(', ')}. Available shards are diagnostic only.`] : []),
    'Classification uses paired session p50 and p95, not pooled frames: ≥0.1 ms, >5%, >2× baseline repeat range, and consistent direction in all three pairs. >15% repeat spread (with 0.1 ms floor) is noisy. Missing metrics are unknown, never zero.', '']
  for (const [shard, names] of Object.entries(shards)) for (const phase of names) {
    const report = reports.find(report => report.shard === shard)
    const phaseRows = comparison.rows.filter(row => row.phase === phase)
    const mismatched = phaseRows.length === Object.keys(metrics).length &&
      phaseRows.every(row => row.p50.status === 'workload-mismatch' && row.p95.status === 'workload-mismatch')
    lines.push(`<details><summary>${phase} (${shard})</summary>`, '')
    if (mismatched) lines.push(...workloadExplanation(report?.runs.map(run => run.phases.find(item => item.name === phase)) ?? []))
    else {
      lines.push('| Section | Session p50 comparison | Session p95 comparison | p50 repeat range B/H |', '| --- | --- | --- | --- |')
      for (const metric of Object.keys(metrics)) {
        const row = phaseRows.find(row => row.metric === metric)
        lines.push(`| ${metricLabels[metric]} (${row.basis}) | ${signal(row.p50, row.basis === 'per-frame' ? 'ms' : 'ms/query')} | ${signal(row.p95, row.basis === 'per-frame' ? 'ms' : 'ms/query')} | ${format(row.p50.baselineRange)} / ${format(row.p50.candidateRange)} |`)
      }
    }
    lines.push('', 'Each entry below is one session; counters below are per-frame means. Full all-frame, nonzero-time and per-query mean/p50/p95/max distributions are in the JSON artifacts.', '',
      '| Pair/arm | Frames | Turns | Duration ms | Draws | Terrain queries | Object queries | Ordinary triangles | Native triangles | Model faces | Ordinary triangles/query | Native triangles/object query | Model builds | Nonzero simulation frames |',
      '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |')
    for (const run of report?.runs ?? []) {
      const sample = run.phases.find(item => item.name === phase)
      if (!sample) continue
      lines.push(`| ${Math.floor(run.index / 2) + 1}/${run.side} | ${sample.frames} | ${sample.startTurn}–${sample.endTurn} | ${format(sample.durationMs)} | ${['drawCalls', 'terrainCalls', 'objectCalls', 'ordinaryTriangles', 'nativeTriangles', 'modelFaces'].map(key => format(sample.work[key]?.mean)).join(' | ')} | ${format(sample.work.ordinaryTriangles?.mean / sample.work.terrainCalls?.mean)} | ${format(sample.work.nativeTriangles?.mean / sample.work.objectCalls?.mean)} | ${format(sample.work.modelBuilds?.mean)} | ${sample.metrics.simulation.all === null ? 'unknown' : `${sample.metrics.simulation.nonzero?.n ?? 0}/${sample.frames}`}  |`)
    }
    lines.push('', '</details>', '')
  }
  return lines.join('\n')
}
