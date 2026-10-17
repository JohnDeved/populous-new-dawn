// Ordinary read-only API observer. No protection endpoint or mutation transport.
import assert from 'node:assert/strict'
import { REPO, digest, sha256 } from './policy.mjs'

function collection(reader, endpoint, field) {
  const items = [],
    pages = []
  let total
  for (let number = 1; number <= 10; number++) {
    const response = reader.get(
      `${endpoint}${endpoint.includes('?') ? '&' : '?'}per_page=100&page=${number}`
    )
    const rows = field ? response[field] : response
    assert(Array.isArray(rows))
    if (field) {
      assert(Number.isSafeInteger(response.total_count) && response.total_count < 1000)
      total ??= response.total_count
      assert.equal(response.total_count, total)
    }
    pages.push({ number, count: rows.length, sha256: digest(rows) })
    items.push(...rows)
    if (rows.length < 100) {
      if (field) assert.equal(items.length, total)
      return { items, pages }
    }
  }
  throw new Error('Recovery observation pagination limit')
}

export function collectDraftRecoveryObservation(reader, grant, clock = Date.now) {
  const startedAt = clock(),
    root = `repos/${REPO}`
  const first = reader.get(`${root}/pulls/${grant.pr}`)
  const main = reader.get(`${root}/git/ref/heads/main`).object.sha
  assert.equal(first.state, 'open')
  assert.equal(first.merged, false)
  assert.equal(first.mergeable, true)
  assert.equal(first.base.ref, 'main')
  assert.equal(first.base.repo.full_name, REPO)
  assert.equal(first.head.repo.full_name, REPO)
  const head = reader.commit(first.head.sha),
    merge = reader.commit(first.merge_commit_sha)
  assert.deepEqual(merge.parents, [main, head.sha])
  const tuple = {
    head: head.sha,
    tree: head.tree,
    base: main,
    merge: merge.sha,
    mergeTree: merge.tree,
  }
  assert.equal(digest(tuple), digest(grant.tuple))
  assert.equal(first.base.sha, main)
  for (const [path, expected] of Object.entries(grant.workflowHashes))
    for (const ref of [tuple.head, tuple.base, tuple.merge])
      assert.equal(reader.workflow(path, ref).sha256, expected)
  const timeline = collection(reader, `${root}/issues/${grant.pr}/timeline`)
  const runs = collection(reader, `${root}/actions/runs?head_sha=${tuple.head}`, 'workflow_runs')
  const timelineAgain = collection(reader, `${root}/issues/${grant.pr}/timeline`)
  const runsAgain = collection(
    reader,
    `${root}/actions/runs?head_sha=${tuple.head}`,
    'workflow_runs'
  )
  assert.equal(digest(timeline), digest(timelineAgain), 'Timeline changed during observation')
  assert.equal(digest(runs), digest(runsAgain), 'Run inventory changed during observation')
  const last = reader.get(`${root}/pulls/${grant.pr}`)
  for (const key of ['draft', 'state', 'merged', 'mergeable', 'merge_commit_sha', 'updated_at'])
    assert.equal(first[key], last[key])
  assert.equal(last.head.sha, tuple.head)
  assert.equal(last.base.sha, tuple.base)
  assert.equal(reader.get(`${root}/git/ref/heads/main`).object.sha, tuple.base)
  return {
    repo: REPO,
    pr: grant.pr,
    tuple,
    startedAt,
    observedAt: clock(),
    complete: true,
    consistent: true,
    state: last.state,
    draft: last.draft,
    mergeable: last.mergeable,
    timeline: {
      pages: timeline.pages,
      items: timeline.items.map(event => {
        const at = Date.parse(event.created_at)
        assert(Number.isFinite(at), 'Timeline event lacks attributable time')
        return {
          id: String(event.id ?? event.node_id ?? ''),
          kind: event.event,
          at,
          actorId: event.actor?.id ?? event.user?.id ?? null,
        }
      }),
    },
    runs: {
      pages: runs.pages,
      items: runs.items.map(run => ({
        id: String(run.id),
        head: run.head_sha,
        status: run.status,
        attempt: run.run_attempt,
        conclusion: run.conclusion,
      })),
    },
  }
}
