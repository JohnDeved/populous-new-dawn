import { metricLabels, metrics, shards, strata } from './snapshot-protocol.mjs'
import { commentMarker } from './render.mjs'
import { snapshotDiagnostics } from './snapshot-diagnostics.mjs'
const format = value => Number.isFinite(value) ? value.toFixed(3) : 'unknown'
const signal = result => result.baseline === undefined ? result.status
  : `${result.status}: ${format(result.baseline)} → ${format(result.candidate)} (${result.delta >= 0 ? '+' : ''}${format(result.delta)} ms)`
export function renderSnapshotComment(comparison, identity, reports, { harnessChanged = false } = {}) {
  const diagnostics = snapshotDiagnostics(comparison, identity, reports)
  // Only fixed labels and fully validated bounded report values reach this comment.
  const runUrl = `https://github.com/JohnDeved/populous-new-dawn/actions/runs/${identity.runId}/attempts/${identity.runAttempt}`
  const lines = [commentMarker, '## Informational controlled browser CPU comparison (v2)',
    `Base \`${identity.baseSha}\` → PR \`${identity.headSha}\`. [Raw F8 downloads, exact snapshot, sidecars and summaries](${runUrl}).`,
    `${comparison.complete ? 'Both capture shards completed.' : 'Incomplete/incompatible shards; no overall comparison.'} Not a required check, review approval, or permission to merge.`,
    'Two parallel runner shards, each with three sequential fresh-browser pairs (B/H, H/B, B/H). No cross-runner timing comparison or summed speedup.',
    'Explicit test setup: exact-base production-authored Level 2 turn-70 snapshot loaded through the public Load path, ordinarily paused, public focus and integer-pixel right-drag normalization. Same snapshot bytes in both arms. Not live-gameplay, campaign progression, simulation or water-advance performance.',
    'Loaded checkpoint cells can take ownership-sensitive fallback paths. This cohort does not cover fresh-world factory-ownership optimizations; no effect here is not no effect everywhere. Ownership is never injected to manufacture a win.',
    '1440×1000, DPR 1, 2-second warmup. Six discrete inputs per phase. Each input requires the exact next four contiguous recorded callbacks: first 1 and settled 3 separately. No favorable-frame search. Raw extra callbacks are retained, not pooled into the comparison.',
    'Native-hover uses six unique native pixels around fixed authored target 54 at a stable camera pose; the warmed initial pixel is excluded. Native projection caches may be warm; projection CPU remains observation-only, The separate native-view-drag cohort measures view invalidation only in its first held-right move callback, with six fixed ±1-pixel moves and unmeasured press/release. It does not replace stable hover. Menu-recovery means subsequent world-pointer input after menu close, not the first post-close callback. Recovery shard includes the HUD prerequisite.',
    'Held-drag additionally binds the old native and new ordinary terrain prefixes, effective projection inputs, exact query inventory and reviewed routing/admission source. Changed source owners make only that cohort unsupported; settled held callbacks are no-work observations. Only its native key/projection/triangle buckets are eligible; ordinary work is observation-only because first-query post-prefix attribution is not separately instrumented. Projection/cache work counts are outcomes, not cross-arm input equality.',
    'Small sample: three session pairs, only six first-input observations per session. Possible signals are not statistical significance. Baseline repeats/noise guards are preliminary, not qualified regression gates.',
    'F8 CPU wall-time and RAF cadence only, not GPU time, presented FPS, or hardware smoothness. Presentation clocks may advance while paused; render/callback/RAF remain observation-only. Nested timings overlap. The identical bounded read-only sidecar adds overhead outside app CPU buckets and may perturb RAF cadence.',
    'Pointer-total/object/model/inclusive native-occlusion CPU remains observation-only because non-terrain submitted mesh equivalence is not proved. Narrow possible signals apply only to matched terrain-specific buckets.',
    'Exact state/view/input/query, bounded actual terrain input geometry and native submitted-triangle inventory must match. Geometry hashing is outside selected callbacks and may warm caches; transient unversioned mutation reverted between boundaries is not proved absent. Projected vertices, visited triangles, model/cache builds are outcomes, not interchangeable with workload inputs. Missing metrics are unknown, never zero.',
    ...(harnessChanged ? ['⚠️ Harness or measurement-producing app source changed. Both arms still use the trusted base harness; app instrumentation changes can alter measurement boundaries and require separate validation.'] : []),
    ...(comparison.missing.length ? [`Missing shards: ${comparison.missing.join(', ')}. Available results are diagnostic only.`] : []),
    'Classification: ≥0.1 ms, >5%, >2× baseline repeat range, same direction in all three pairs; >15% repeat spread with 0.1 ms floor is noisy. Displayed B/H are session medians; delta is the median paired difference, not necessarily their subtraction. Full all/nonzero/per-query distributions and paired ranges are retained in artifacts.', '']
  for (const [shard, names] of Object.entries(shards)) for (const phase of names) {
    lines.push(`<details><summary>${phase} (${shard})</summary>`, '')
    const diagnosis = diagnostics.find(item => item.shard === shard && item.phase === phase).diagnosis
    if (diagnosis) lines.push(diagnosis)
    else {
      lines.push('| Section / callback stratum | Session p50 | Session p95 | B/H p50 range |', '| --- | --- | --- | --- |')
      for (const stratum of strata) for (const metric of Object.keys(metrics)) {
        const row = comparison.rows.find(r => r.phase === phase && r.stratum === stratum && r.metric === metric)
        lines.push(`| ${metricLabels[metric]} / ${stratum} (${row.basis}) | ${signal(row.p50)} | ${signal(row.p95)} | ${format(row.p50.baselineRange)}/${format(row.p50.candidateRange)} |`)
      }
    }
    lines.push('', '| Pair/arm | Selected/raw frames | Phase elapsed ms | First terrain/object queries | First native triangles/query | First projected ordinary/native vertices | First model builds |', '| --- | --- | --- | --- | --- | --- | --- |')
    for (const run of reports.find(r => r.shard === shard)?.runs ?? []) {
      const sample = run.phases.find(p => p.name === phase)
      if (!sample || sample.unsupported) continue
      const w = sample.work.first
      lines.push(`| ${Math.floor(run.index / 2) + 1}/${run.side} | ${sample.frames}/${sample.rawFrames} | ${format(sample.durationMs)} | ${format(w.terrainCalls?.mean)}/${format(w.objectCalls?.mean)} | ${format(w.nativeTriangles?.mean / w.objectCalls?.mean)} | ${format(w.ordinaryVertices?.mean)}/${format(w.nativeVertices?.mean)} | ${format(w.modelBuilds?.mean)} |`)
    }
    lines.push('', 'Work values are per-frame means; elapsed phase time includes unmeasured preparation and is not a speedup metric.', '', '</details>', '')
  }
  return lines.join('\n')
}
