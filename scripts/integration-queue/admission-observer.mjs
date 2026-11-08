// Read-only normalizer using the existing reviewed gate provenance parser.
import assert from 'node:assert/strict'
import { dirname } from 'node:path'
import { REPO, digest, gatesFor, reviewedWorkflows, browserRequired, gateRuns, latestChronological, validateBeforeDraft, validatePassedGate } from './policy.mjs'
import { FULL_WORKFLOW } from './admission.mjs'

export function normalizeAdmission(entry, grant, raw, requiredChecks) {
  assert(raw.complete && raw.consistent, raw.error || 'Incomplete observation')
  assert(raw.state === 'open' && !raw.merged && raw.mergeable === true, 'Open conflict-free PR required')
  assert(!raw.refreshOnly && !raw.baseMetadataRefreshOnly && raw.synthetic, 'Exact current synthetic required; no refresh authority')
  assert.deepEqual(raw.synthetic.parents, [raw.base, raw.head])
  assert.equal(raw.reviewDigest, entry.review.sha256)
  assert(reviewedWorkflows(entry, raw), 'Reviewed workflows differ')
  const tuple = { head: raw.head, tree: raw.headCommit.tree, base: raw.base, merge: raw.synthetic.sha, mergeTree: raw.synthetic.tree }
  assert.deepEqual(tuple, grant.tuple)
  assert.deepEqual(raw.workflows.map(w => `${w.path}@${w.ref}`).sort(), gatesFor(entry).flatMap(g => [tuple.head, tuple.base, tuple.merge].map(ref => `${g.workflow}@${ref}`)).sort())
  assert(raw.runs.every(r => Number.isSafeInteger(r.id) && Number.isSafeInteger(r.attempt)), 'Invalid run identity')
  assert.equal(new Set(raw.runs.map(r => `${r.id}/${r.attempt}`)).size, raw.runs.length, 'Duplicate run')
  const active = raw.runs.some(r => r.status !== 'completed')
  const required = gatesFor(entry).filter((_, index) => !index || entry.requireBrowser || browserRequired(raw.changedPaths))
  const fullGate = required[0], fullRuns = gateRuns(entry, raw, fullGate).filter(r => r.base === raw.base)
  let full = { state: 'missing' }
  if (active) {
    // No mutation while any relevant current/stale run is active. Do not invent
    // source provenance for unfinished jobs whose checkout logs are not final.
    return { repo: REPO, pr: entry.pr, complete: true, consistent: true, observedAt: raw.observedAt,
      tuple, workflowHashes: grant.workflowHashes, draft: raw.draft, activeAttempts: true, otherValidation: 'running',
      inventoryDigest: digest(raw.runs), full }
  }
  validateBeforeDraft(entry, raw, required, true)
  if (fullRuns.length) {
    const latest = latestChronological(fullRuns, 'Full admission')
    validatePassedGate(raw, fullGate, latest)
    assert.equal(latest.merge, tuple.merge); assert.equal(latest.identityVerified, true)
    const selected = requiredChecks.filter(c => c.databaseId === latest.checkId && c.name === fullGate.job)
    assert.equal(selected.length, 1, 'Missing current required Full selection')
    assert.equal(selected[0].isRequired, true, 'Full not selected as required')
    full = { state: 'passed', tuple, sourceBound: true, required: true, runId: latest.id, attempt: latest.attempt, checkId: latest.checkId }
  }
  return { repo: REPO, pr: entry.pr, complete: true, consistent: true, observedAt: raw.observedAt,
    tuple, workflowHashes: grant.workflowHashes, draft: raw.draft, activeAttempts: false, otherValidation: 'clear',
    inventoryDigest: digest({ runs: raw.runs, checks: raw.currentChecks }), full }
}

export function observeAdmission(reader, entry, grant, entryPath) {
  const raw = reader.inspectAdmission(entry, dirname(entryPath))
  assert(raw.complete && raw.consistent, raw.error || 'Incomplete admission observation')
  // Pin the existing event contract; this mode must never admit skipped Full
  // suites by accepting an expanded trigger merely because a hash was approved.
  const workflow = reader.gitOutput('show', `${grant.tuple.merge}:${FULL_WORKFLOW}`)
  assert.equal(workflow.match(/^on:\n([\s\S]*?)\n\n/m)?.[1], '  pull_request:\n    branches: [main]\n    types: [ready_for_review]', 'Admission requires ready-only Full workflow')
  const query = `query { repository(owner:"JohnDeved",name:"populous-new-dawn") { pullRequest(number:${entry.pr}) { headRefOid baseRefOid isDraft potentialMergeCommit { oid } commits(last:1) { nodes { commit { statusCheckRollup { contexts(first:100) { pageInfo { hasNextPage } nodes { __typename ... on CheckRun { databaseId name isRequired(pullRequestNumber:${entry.pr}) } } } } } } } } } }`
  const response = JSON.parse(reader.execute('gh', ['api', '--hostname', 'github.com', 'graphql', '-f', `query=${query}`], reader.cwd))
  assert(!response.errors, 'Required-check observation failed')
  const pr = response.data.repository.pullRequest
  assert.equal(pr.headRefOid, raw.head); assert.equal(pr.baseRefOid, raw.base)
  assert.equal(pr.isDraft, raw.draft); assert.equal(pr.potentialMergeCommit?.oid, raw.synthetic?.sha)
  const contexts = pr.commits.nodes[0].commit.statusCheckRollup?.contexts
  assert(!contexts || contexts.pageInfo?.hasNextPage === false, 'Incomplete current check selection')
  return normalizeAdmission(entry, grant, raw, (contexts?.nodes ?? []).filter(c => c.__typename === 'CheckRun'))
}
