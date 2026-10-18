import { metricLabels, metrics, shards } from './protocol.mjs'
export const commentMarker = '<!-- populous-browser-performance-v1 -->'
const format = value => Number.isFinite(value) ? value.toFixed(3) : 'unknown'
const signal = (result, unit) => {
  if (result.baseline === undefined) return result.status
  const delta = `${result.delta >= 0 ? '+' : ''}${format(result.delta)} ${unit}`
  const percent = result.percent === null ? 'relative unknown' : `${result.percent >= 0 ? '+' : ''}${result.percent.toFixed(1)}%`
  return `${result.status}: ${format(result.baseline)} → ${format(result.candidate)} ${unit} (${delta}; ${percent})`
}
export function renderComment(comparison, identity, reports, { harnessChanged = false } = {}) {
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
    lines.push(`<details><summary>${phase} (${shard})</summary>`, '', '| Section | Session p50 comparison | Session p95 comparison | p50 repeat range B/H |', '| --- | --- | --- | --- |')
    for (const metric of Object.keys(metrics)) {
      const row = comparison.rows.find(row => row.phase === phase && row.metric === metric)
      lines.push(`| ${metricLabels[metric]} (${row.basis}) | ${signal(row.p50, row.basis === 'per-frame' ? 'ms' : 'ms/query')} | ${signal(row.p95, row.basis === 'per-frame' ? 'ms' : 'ms/query')} | ${format(row.p50.baselineRange)} / ${format(row.p50.candidateRange)} |`)
    }
    lines.push('', 'Each entry below is one session; counters below are per-frame means. Full all-frame, nonzero-time and per-query mean/p50/p95/max distributions are in the JSON artifacts.', '',
      '| Pair/arm | Frames | Turns | Duration ms | Draws | Terrain queries | Object queries | Ordinary triangles | Native triangles | Model faces | Ordinary triangles/query | Native triangles/object query | Model builds | Nonzero simulation frames |',
      '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |')
    const report = reports.find(report => report.shard === shard)
    for (const run of report?.runs ?? []) {
      const sample = run.phases.find(item => item.name === phase)
      if (!sample) continue
      lines.push(`| ${Math.floor(run.index / 2) + 1}/${run.side} | ${sample.frames} | ${sample.startTurn}–${sample.endTurn} | ${format(sample.durationMs)} | ${['drawCalls', 'terrainCalls', 'objectCalls', 'ordinaryTriangles', 'nativeTriangles', 'modelFaces'].map(key => format(sample.work[key]?.mean)).join(' | ')} | ${format(sample.work.ordinaryTriangles?.mean / sample.work.terrainCalls?.mean)} | ${format(sample.work.nativeTriangles?.mean / sample.work.objectCalls?.mean)} | ${format(sample.work.modelBuilds?.mean)} | ${sample.metrics.simulation.all === null ? 'unknown' : `${sample.metrics.simulation.nonzero?.n ?? 0}/${sample.frames}`}  |`)
    }
    lines.push('', '</details>', '')
  }
  return lines.join('\n')
}
