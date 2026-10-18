// This module runs ONLY from workflow_run's trusted default-branch checkout.
// No npm install, PR checkout, artifact extraction, eval, shell or artifact import.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { repository, shards, parseReport, compareReports, protocolHash, maxReportBytes } from './protocol.mjs'
import * as snapshot from './snapshot-protocol.mjs'
import { renderSnapshotComment } from './snapshot-render.mjs'
import { gameplayFramePlan } from '../tutorial-browser/gameplay-frame-evidence.mjs'
import { readReportArchive } from './artifact.mjs'
import { commentMarker, renderComment } from './render.mjs'

export const workflowPath = '.github/workflows/browser-performance.yml'
const snapshotPaths = ['scripts/browser-performance/snapshot-readers.mjs', 'scripts/browser-performance/snapshot-reader-proof.mjs', 'scripts/browser-performance/reader-build.mjs', 'scripts/browser-performance/snapshot-drag-contract.mjs', 'scripts/browser-performance/snapshot-drag-protocol.mjs', 'scripts/browser-performance/snapshot-drag-observer.mjs', 'scripts/browser-performance/snapshot-geometry.mjs', 'scripts/browser-performance/snapshot-protocol.mjs', 'scripts/browser-performance/snapshot-observer.mjs',
  'scripts/browser-performance/snapshot-capture.mjs', 'scripts/browser-performance/snapshot-setup.mjs',
  'scripts/tutorial-browser/checkpoint-codec.mjs', 'tests/support/bloodlust-scene.mjs']
const harnessPaths = ['scripts/browser-performance/protocol.mjs', 'scripts/browser-performance/run.mjs',
  'scripts/browser-performance/build.mjs', 'scripts/tutorial-browser/gameplay-frames.mjs',
  'scripts/tutorial-browser/gameplay-frame-evidence.mjs', 'scripts/tutorial-browser/browser-config.mjs',
  'scripts/browser-game.mjs', 'scripts/browser-new-game.mjs', 'scripts/tutorial-browser/frame-export.mjs',
  'scripts/tutorial-browser/m2-pointer-f8.mjs',
  'app/frame-performance.ts', 'app/fps-graph.ts', 'app/scene.ts', 'app/frame-export-analysis.ts',
  'app/frame-export-cohorts.ts', 'app/pointer-frame-metrics.ts', 'app/ordinary-terrain-metrics.ts',
  'app/native-occlusion-metrics.ts', 'app/model-pick-work.ts']
const positive = number => Number.isSafeInteger(number) && number > 0
const digest = value => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value)
const prefix = `/repos/${repository}`
export async function reportRun({ api, download, runId, expectedPrNumber, trustedWorkflow, protocolVersion = 1, trustedProtocol = protocolVersion === 2 ? snapshot.protocolHash() : protocolHash(gameplayFramePlan) }) {
  assert.ok(protocolVersion === 1 || protocolVersion === 2, 'Only trusted explicitly selected protocols')
  const protocol = protocolVersion === 2 ? snapshot : { shards, parseReport, compareReports }
  assert.ok(positive(runId) && positive(expectedPrNumber))
  const run = await api(`${prefix}/actions/runs/${runId}`)
  assert.equal(run.id, runId); assert.equal(run.repository.full_name, repository)
  assert.equal(run.event, 'pull_request'); assert.equal(run.status, 'completed'); assert.equal(run.path, workflowPath)
  assert.ok(positive(run.run_attempt)); assert.ok(positive(run.workflow_id))
  const workflow = await api(`${prefix}/actions/workflows/${run.workflow_id}`)
  assert.equal(workflow.path, workflowPath); assert.equal(workflow.name, 'Browser performance comparison')
  // Association must come from GitHub, never from the artifact's PR number.
  if (run.pull_requests.length !== 1) return { status: 'skipped-unassociated' }
  const association = run.pull_requests[0]
  assert.equal(association.number, expectedPrNumber, 'Event and API PR routing must match concurrency key')
  assert.ok(positive(association.number) && digest(run.head_sha))
  assert.equal(association.base.repo.name, 'populous-new-dawn')
  const initialPr = await api(`${prefix}/pulls/${association.number}`)
  assert.equal(initialPr.number, association.number); assert.equal(initialPr.base.repo.full_name, repository)
  // Associations can change after a run. Use them only to route to a verified
  // PR; immutable run.head_sha must match its current exact head. Artifact base
  // is checked against current GitHub base below, not a mutable historical claim.
  if (initialPr.state !== 'open' || initialPr.head.sha !== run.head_sha) return { status: 'skipped-stale' }
  assert.ok(digest(initialPr.base.sha))
  const identity = { repository, prNumber: association.number, headSha: run.head_sha, baseSha: initialPr.base.sha,
    harnessSha: initialPr.base.sha, runId, runAttempt: run.run_attempt }
  const current = async () => {
    const pr = await api(`${prefix}/pulls/${identity.prNumber}`)
    assert.equal(pr.number, identity.prNumber); assert.equal(pr.base.repo.full_name, repository)
    return pr.state === 'open' && pr.head.sha === identity.headSha && pr.base.sha === identity.baseSha
  }
  const file = async (path, ref) => {
    const result = await api(`${prefix}/contents/${path}?ref=${ref}`)
    assert.equal(result.type, 'file'); assert.equal(result.encoding, 'base64'); assert.ok(result.size <= 100000)
    assert.ok(typeof result.content === 'string' && result.content.length < 140000)
    return Buffer.from(result.content, 'base64')
  }
  // A PR cannot alter admission/checkout/token behavior and still get a report.
  // Initial rollout intentionally cannot self-authorize before reaching main.
  for (const ref of [identity.baseSha, identity.headSha])
    assert.ok((await file(workflowPath, ref)).equals(Buffer.from(trustedWorkflow)), 'Untrusted benchmark workflow revision')
  let harnessChanged = false
  for (const path of [...harnessPaths, ...(protocolVersion === 2 ? snapshotPaths : [])]) {
    const [base, head] = await Promise.all([file(path, identity.baseSha), file(path, identity.headSha)])
    if (!base.equals(head)) harnessChanged = true
  }
  const listed = await api(`${prefix}/actions/runs/${runId}/artifacts?per_page=100`)
  assert.ok(listed.total_count <= 100 && listed.artifacts.length === listed.total_count, 'Unbounded/incomplete artifact inventory')
  const reports = []
  for (const shard of Object.keys(protocol.shards)) {
    const name = `browser-performance-report-${runId}-${identity.runAttempt}-${shard}`
    const candidates = listed.artifacts.filter(artifact => artifact.name === name)
    assert.ok(candidates.length <= 1, 'Duplicate artifact')
    if (!candidates.length || candidates[0].expired) continue
    const artifact = candidates[0]
    assert.ok(positive(artifact.id)); assert.ok(artifact.size_in_bytes > 0 && artifact.size_in_bytes <= maxReportBytes + 65536)
    assert.equal(artifact.workflow_run.id, runId)
    const report = protocol.parseReport(readReportArchive(await download(artifact.id)))
    assert.equal(report.shard, shard)
    // The base may have moved without a new head. This old run is not current.
    if (report.identity.baseSha !== identity.baseSha) return { status: 'skipped-stale-base' }
    reports.push(report)
  }
  const comparison = protocol.compareReports(reports, identity, trustedProtocol)
  const body = (protocolVersion === 2 ? renderSnapshotComment : renderComment)(comparison, identity, reports, { harnessChanged })
    .replace(commentMarker, `${commentMarker}\n<!-- populous-browser-performance-run:${runId}:${identity.runAttempt} -->`)
  assert.ok(Buffer.byteLength(body) < 60000, 'Comment too large')
  let comments = []
  for (let page = 1; page <= 5; page++) {
    const items = await api(`${prefix}/issues/${identity.prNumber}/comments?per_page=100&page=${page}`)
    comments.push(...items)
    if (items.length < 100) break
    assert.ok(page < 5, 'Comment history exceeds bounded search')
  }
  const existing = comments.filter(comment => comment.user?.id === 41898282 && comment.user.type === 'Bot' &&
    comment.user.login === 'github-actions[bot]' && typeof comment.body === 'string' && comment.body.startsWith(commentMarker))
  assert.ok(existing.length <= 1, 'Ambiguous benchmark comment')
  if (existing.length) {
    assert.ok(positive(existing[0].id))
    const marker = /^<!-- populous-browser-performance-run:(\d+):(\d+) -->$/m.exec(existing[0].body)
    assert.ok(marker, 'Unrecognized benchmark comment provenance')
    if (Number(marker[1]) > runId || (Number(marker[1]) === runId && Number(marker[2]) > identity.runAttempt)) return { status: 'skipped-older-run' }
  }
  // Recheck immediately before the only mutation. Never turn a benchmark into a
  // review, label, check result, commit status, ready transition or merge action.
  if (!await current()) return { status: 'skipped-stale' }
  const latest = await api(`${prefix}/actions/runs/${runId}`)
  if (latest.run_attempt !== identity.runAttempt) return { status: 'skipped-old-attempt' }
  const target = existing.length ? `${prefix}/issues/comments/${existing[0].id}` : `${prefix}/issues/${identity.prNumber}/comments`
  await api(target, { method: existing.length ? 'PATCH' : 'POST', body: { body } })
  return { status: existing.length ? 'updated' : 'created', complete: comparison.complete, missing: comparison.missing }
}

async function boundedBody(response, maximum) {
  assert.ok(response.ok, `GitHub request failed (${response.status})`)
  const chunks = []; let size = 0
  for await (const chunk of response.body) { size += chunk.length; assert.ok(size <= maximum, 'Oversized GitHub response'); chunks.push(chunk) }
  return Buffer.concat(chunks)
}
export async function main() {
  assert.equal(process.env.GITHUB_REPOSITORY, repository)
  const token = process.env.GITHUB_TOKEN; assert.ok(token, 'Comment token required in trusted job only')
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'))
  const api = async (path, { method = 'GET', body } = {}) => {
    assert.ok(path.startsWith(`${prefix}/`))
    const response = await fetch(`https://api.github.com${path}`, { method, redirect: 'error',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}) })
    return JSON.parse(await boundedBody(response, 2 * 1024 * 1024))
  }
  const download = async id => {
    assert.ok(positive(id))
    const response = await fetch(`https://api.github.com${prefix}/actions/artifacts/${id}/zip`, { redirect: 'manual', headers: { Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28' } })
    assert.equal(response.status, 302)
    // GitHub supplies the signed URL. Never forward the token to artifact storage.
    const location = new URL(response.headers.get('location')); assert.equal(location.protocol, 'https:')
    return boundedBody(await fetch(location, { redirect: 'error' }), maxReportBytes + 65536)
  }
  if (event.workflow_run.pull_requests?.length !== 1) { console.log('Skipped unassociated event'); return }
  const result = await reportRun({ api, download, runId: event.workflow_run.id,
    expectedPrNumber: event.workflow_run.pull_requests[0].number, protocolVersion: 2,
    trustedWorkflow: readFileSync(new URL('../../.github/workflows/browser-performance.yml', import.meta.url)) })
  console.log(JSON.stringify(result))
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main()
