import { createHash } from 'node:crypto'

export const REPO = 'JohnDeved/populous-new-dawn'
export const CLOUDFLARE = {
  appId: 85455,
  appSlug: 'cloudflare-workers-and-pages',
  name: 'Workers Builds: populous-new-dawn',
  project: 'populous-new-dawn',
  productionBuildPrefix:
    'https://dash.cloudflare.com/19321bcee0ed17a93b709cb602dd070c/workers/services/view/populous-new-dawn/production/builds/',
}
export const GATES = [
  {
    workflow: '.github/workflows/ready-pr-check.yml',
    job: 'Full check',
    draftJob: 'Draft PR (not validated)',
    steps: [
      'Require a ready pull request',
      'Verify and record candidate identity',
      'Full typecheck, tests, parity and orchestration',
      'Production build',
      'Reject tracked input mutation',
    ],
  },
  {
    workflow: '.github/workflows/tutorial-browser.yml',
    job: 'Tutorial browser',
    steps: [
      'Require a ready pull request',
      'Record exact tested source',
      'Build plain production Home and validate Tutorial interactions',
      'Reject tracked input mutation',
    ],
  },
]
export const SHARDED_FULL_GATE = {
  ...GATES[0],
  steps: [
    'Require a ready pull request',
    'Check out the exact proposed merge',
    'Set up Node',
    'Set up Python for portable fixture tests',
    'Install locked dependencies',
    'Verify and record candidate identity',
    'Require successful dependencies',
    'Download current attempt receipts',
    'Validate complete sharded gate',
    'Reject tracked input mutation',
  ],
}
export const gatesFor = entry => [
  entry.fullCheckPolicy === 'sharded-v1' ? SHARDED_FULL_GATE : GATES[0],
  GATES[1],
]
export const sha256 = value => createHash('sha256').update(value).digest('hex')
export const digest = value => sha256(JSON.stringify(value))
const sha = value => typeof value === 'string' && /^[0-9a-f]{40}$/.test(value)
const hash = value => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value)
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const requireThat = (condition, message) => {
  if (!condition) throw new Error(message)
}

export function validateEntry(entry) {
  requireThat(
    entry?.version === 1 && entry.repo === REPO && entry.baseRef === 'main',
    'Unsupported allowlist version/repository/base'
  )
  requireThat(
    Number.isSafeInteger(entry.pr) && entry.pr > 0,
    'Allowlist needs an explicit PR number'
  )
  requireThat(
    sha(entry.sourceHead) && sha(entry.reviewBase) && sha(entry.sourceTree),
    'Allowlist needs immutable sourceHead, sourceTree and reviewBase'
  )
  requireThat(
    typeof entry.allowMechanicalRefresh === 'boolean' && typeof entry.requireBrowser === 'boolean',
    'Refresh and browser policy must be explicit'
  )
  requireThat(
    entry.approvedBy?.trim() &&
      entry.review?.reviewer?.trim() &&
      entry.review.decision === 'ACCEPT' &&
      entry.review.head === entry.sourceHead &&
      entry.review.base === entry.reviewBase &&
      hash(entry.review.sha256) &&
      entry.review.file?.trim(),
    'Missing source-bound independent review and parent approval'
  )
  requireThat(
    entry.review.reviewer !== entry.approvedBy,
    'Independent reviewer and approving parent must differ'
  )
  requireThat(
    GATES.every(g => hash(entry.workflowHashes?.[g.workflow])),
    'Pin both reviewed workflow SHA-256 digests'
  )
  requireThat(
    (entry.deployment?.kind === 'cloudflare-check' &&
      Object.entries(CLOUDFLARE).every(([key, value]) => entry.deployment[key] === value)) ||
      (entry.deployment?.kind === 'unverified' && entry.deployment.reason?.trim()) ||
      ((!entry.deployment?.kind || entry.deployment.kind === 'github-deployment') &&
        entry.deployment?.environment?.trim() &&
        /^https:\/\//.test(entry.deployment.url ?? '')),
    'Pin a supported deployment observation policy'
  )
  requireThat(
    entry.fullCheckPolicy === undefined || ['legacy-v1', 'sharded-v1'].includes(entry.fullCheckPolicy),
    'Unsupported Full check evidence policy'
  )
  if (entry.fullCheckDiagnostic !== undefined) {
    const d = entry.fullCheckDiagnostic
    requireThat(entry.fullCheckPolicy === 'sharded-v1' && d &&
      Object.keys(d).length === 1 && Number.isSafeInteger(d.activationPr) && d.activationPr > 0,
      'Diagnostic policy must pin one literal activation PR under sharded-v1')
  }
  if (entry.workflowTransition !== undefined) {
    const t = entry.workflowTransition
    requireThat(
      t?.version === 1 && t.workflow === GATES[0].workflow &&
        t.sourceHead === entry.sourceHead && t.base === entry.reviewBase &&
        hash(t.baseSha256) && t.candidateSha256 === entry.workflowHashes[t.workflow] &&
        t.baseSha256 !== t.candidateSha256 && entry.fullCheckPolicy === 'sharded-v1' &&
        entry.allowMechanicalRefresh === false,
      'Workflow transition must pin one reviewed base/head and both digests without refresh'
    )
  }
  return entry
}

export function reviewedWorkflows(entry, observation) {
  const o = observation, t = entry.workflowTransition
  if (!Array.isArray(o.workflows)) return false
  if (t && !o.merged && (o.base !== t.base || o.head !== t.sourceHead)) return false
  return o.workflows.every(w => {
    if (!t || w.path !== t.workflow || o.merged)
      return entry.workflowHashes[w.path] === w.sha256
    // Main may retain the reviewed old workflow only for this exact transition.
    if (w.ref === t.base) return w.sha256 === t.baseSha256
    return (w.ref === t.sourceHead || w.ref === o.synthetic?.sha) &&
      w.sha256 === t.candidateSha256
  }) && gatesFor(entry).every(g => o.workflows.some(w => w.path === g.workflow)) &&
    (!t || o.merged || [t.base, t.sourceHead, ...(o.synthetic ? [o.synthetic.sha] : [])]
      .every(ref => o.workflows.some(w => w.path === t.workflow && w.ref === ref)))
}

export function browserRequired(paths) {
  return paths.some(path =>
    /^(app\/|public\/|scripts\/browser-[^/]*\.mjs$|scripts\/local-render\/tutorial-recommendation\.mjs$|scripts\/tutorial-browser\/|\.github\/workflows\/tutorial-browser\.yml$|package(?:-lock)?\.json$|tsconfig\.json$)/.test(
      path
    )
  )
}

// One observation, one decision. The caller persists the returned checkpoint before
// any proposed effect. This module has no network, Git, timer or mutation capability.
export function decide(entry, observation, saved = null, now = Date.now()) {
  let state
  const result = (status, reason, action = null) => ({ status, reason, action, checkpoint: state })
  const stop = reason => result('stop', reason)
  const wait = reason => result('wait', reason)
  const propose = action =>
    result(
      'propose',
      `Would ${action.kind}; dry-run unless an exact reviewed pilot is armed`,
      action
    )
  try {
    validateEntry(entry)
    requireThat(Number.isFinite(now), 'Invalid clock')
    const authorization = digest(entry)
    state = saved
      ? structuredClone(saved)
      : {
          version: 1,
          authorization,
          head: entry.sourceHead,
          refreshed: false,
          quiet: null,
          pending: null,
          merged: null,
        }
    requireThat(
      state.version === 1 && state.authorization === authorization,
      'Checkpoint authorization changed; do not reuse it'
    )
    requireThat(sha(state.head), 'Invalid checkpoint head')
    const o = observation
    requireThat(
      o?.repo === entry.repo && o.pr === entry.pr && o.baseRef === entry.baseRef,
      'Observation repository/PR/base mismatch'
    )
    requireThat(
      Number.isFinite(o.observedAt) && now >= o.observedAt && now - o.observedAt <= 60_000,
      'Observation is stale or clock moved backwards'
    )
    requireThat(
      o.consistent === true && o.complete === true,
      o.error || 'Incomplete or changing GitHub observation'
    )
    requireThat(o.reviewDigest === entry.review.sha256, 'Review evidence missing or changed')
    requireThat(sha(o.head) && sha(o.base), 'Missing exact current head/base')
    requireThat(
      o.protection?.strict === true &&
        o.protection.admins === true &&
        o.protection.pullRequests === true &&
        o.protection.noBypass === true &&
        o.protection.fullCheck === true &&
        o.protection.supported === true,
      'Required strict Full check protection, admin enforcement or supported rules are missing'
    )
    requireThat(
      reviewedWorkflows(entry, o),
      'Workflow differs from reviewed policy; re-review the workflow'
    )

    if (state.pending?.kind === 'refresh') {
      const p = state.pending
      if (o.head === p.head)
        return stop('Refresh outcome uncertain; inspect remote branch before any retry')
      requireThat(
        o.base === p.base &&
          same(o.headCommit?.parents, [p.head, p.base]) &&
          o.headCommit?.tree === p.tree,
        'Refresh produced unexpected head, parents, base or tree; new review required'
      )
      state.refresh = p
      state.head = o.head
      state.refreshed = true
      state.pending = null
      state.quiet = null
    }
    requireThat(
      o.head === state.head,
      'Source head drift; new commits are not authorized by this allowlist'
    )
    if (state.refreshed) {
      requireThat(
        o.acceptedRefresh?.clean === true &&
          o.acceptedRefresh.disjoint === true &&
          o.acceptedRefresh.sourceHead === entry.sourceHead &&
          o.acceptedRefresh.base === state.refresh?.base &&
          o.acceptedRefresh.tree === state.refresh?.tree &&
          state.refresh?.head === entry.sourceHead &&
          same(o.headCommit?.parents, [entry.sourceHead, state.refresh.base]) &&
          o.headCommit?.tree === state.refresh.tree,
        'Refreshed checkpoint lost its source/parents/tree proof'
      )
    } else
      requireThat(
        state.head === entry.sourceHead && o.headCommit?.tree === entry.sourceTree,
        'Reviewed source content differs'
      )
    if (state.pending?.kind === 'draft') {
      requireThat(
        o.base === state.pending.base,
        'Base changed during draft conversion; reconcile manually'
      )
      if (o.draft !== true)
        return stop('Draft conversion outcome uncertain; inspect PR before any retry')
      state.draftConversion = state.pending
      state.pending = null
      state.quiet = null
    }
    if (state.pending?.kind === 'ready') {
      if (o.draft !== false)
        return stop('Ready transition outcome uncertain; inspect PR before any retry')
      requireThat(
        o.base === state.pending.base,
        'Base changed during ready transition; reconcile manually'
      )
      state.readyAdmission = { ...state.pending, since: now }
      state.pending = null
      state.quiet = null
    }
    if (state.pending?.kind === 'merge') {
      if (!o.merged)
        return stop('Merge outcome uncertain; reconcile GitHub PR and main before any retry')
      state.merged = state.pending
      state.pending = null
    }
    if (o.merged) {
      requireThat(state.merged, 'PR was merged outside this checkpoint; reconcile manually')
      const expected = state.merged
      requireThat(
        sha(o.mergeCommit?.sha) &&
          o.mergeCommit.tree === expected.tree &&
          same(o.mergeCommit.parents, [expected.base, expected.head]) &&
          o.base === o.mergeCommit.sha,
        'Merged commit/tree/parents or main tip differ from the tested candidate; inspect integration'
      )
      if (entry.deployment.kind === 'unverified')
        return {
          ...result('done', 'Merge confirmed; deployment unverified by explicit policy'),
          outcome: { merge: 'confirmed', deployment: 'unverified' },
        }
      if (entry.deployment.kind === 'cloudflare-check') {
        if (!o.deployment)
          return wait(
            'Merge confirmed; exact-commit Cloudflare production build check is not yet observed'
          )
        const d = o.deployment
        requireThat(
          d.sha === o.mergeCommit.sha &&
            d.identityVerified === true &&
            Object.entries(CLOUDFLARE).every(([key, value]) => d[key] === value),
          'Merge confirmed; Cloudflare check identity is unverified'
        )
        if (d.state === 'pending')
          return wait('Merge confirmed; exact-commit Cloudflare production build check is pending')
        requireThat(
          d.state === 'success',
          'Merge confirmed; exact-commit Cloudflare production build check did not pass'
        )
        return {
          ...result(
            'done',
            'Merge confirmed; exact-commit Cloudflare production build check passed; serving deployment unverified'
          ),
          outcome: {
            merge: 'confirmed',
            deployment: 'provider-production-build-check-passed',
            servingDeployment: 'unverified',
            checkId: d.checkId,
            url: d.detailsUrl,
          },
        }
      }
      if (!o.deployment)
        return wait(
          'Waiting for an existing deployment of the exact merged commit; no deploy is triggered'
        )
      requireThat(
        o.deployment.sha === o.mergeCommit.sha &&
          o.deployment.environment === entry.deployment.environment &&
          o.deployment.url === entry.deployment.url,
        'Deployment identity differs from the merged commit or approved target'
      )
      if (['queued', 'pending', 'in_progress'].includes(o.deployment.state))
        return wait('Exact merged deployment is pending')
      requireThat(
        o.deployment.state === 'success',
        'Merged deployment failed or has an unknown state'
      )
      return result('done', 'Exact merged parents/tree and deployment verified')
    }
    if (o.refreshOnly)
      requireThat(
        o.draft === true && o.upToDate === false && !o.synthetic,
        'Stale-base observation admits refresh only; obtain a current synthetic before ready or merge'
      )
    requireThat(o.state === 'open', 'PR is closed without a verified merge')
    requireThat(o.mergeable !== false, 'Conflicting PR; manual resolution and review required')
    requireThat(
      Array.isArray(o.changedPaths) && o.changedPaths.length > 0,
      'Missing changed-path evidence'
    )
    requireThat(Array.isArray(o.runs), 'Missing workflow run inventory')
    requireThat(
      o.resource?.status === 'observed' && o.resource.fullSuite === true,
      'Resource preflight is blocked; inspect its reason'
    )
    requireThat(
      o.runs.every(
        r =>
          Number.isSafeInteger(r.id) && r.id > 0 && Number.isSafeInteger(r.attempt) && r.attempt > 0
      ) && new Set(o.runs.map(r => `${r.id}/${r.attempt}`)).size === o.runs.length,
      'Invalid or duplicate workflow run identity'
    )
    const required = gatesFor(entry).filter(
      (g, i) => i === 0 || entry.requireBrowser || browserRequired(o.changedPaths)
    )
    if (o.runs.some(r => r.status !== 'completed')) {
      state.quiet = null
      return wait(
        'Drain all current and stale PR workflow attempts before proceeding; never cancel/rerun automatically'
      )
    }
    const fingerprint = digest({
      head: o.head,
      base: o.base,
      draft: o.draft,
      merge: o.synthetic,
      refreshOnly: o.refreshOnly,
      staleSynthetic: o.staleSynthetic,
      advertisedBase: o.advertisedBase,
      currentChecks: o.currentChecks
        ?.map(c => [c.id, c.name, c.head, c.appId, c.startedAt, c.status, c.conclusion])
        .sort((a, b) => a[0] - b[0]),
      runs: o.runs
        .map(r => [
          r.id,
          r.attempt,
          r.startedAt,
          r.updatedAt,
          r.status,
          r.conclusion,
          r.checkId,
          r.draftAdmission,
          r.draftGuardOnly,
        ])
        .sort((a, b) => a[0] - b[0]),
    })
    if (state.quiet?.fingerprint !== fingerprint) state.quiet = { fingerprint, since: now }
    requireThat(state.quiet.since <= now, 'Checkpoint clock moved backwards')
    if (now - state.quiet.since < 60_000)
      return wait(
        'Require unchanged identity and drained runs across a 60-second observation window'
      )
    if (o.upToDate !== true) {
      requireThat(!state.readyAdmission, 'Base changed after ready admission; obtain new review')
      requireThat(
        entry.allowMechanicalRefresh && !state.refreshed,
        'Refresh not authorized or one-refresh bound reached; obtain new review'
      )
      const proof = o.refresh
      requireThat(
        proof?.sourceHead === state.head &&
          proof.base === o.base &&
          proof.reviewBase === entry.reviewBase &&
          proof.clean === true &&
          proof.disjoint === true &&
          sha(proof.tree),
        'No clean disjoint-path merge proof; overlapping edits/conflicts require review'
      )
      if (o.draft === false) {
        requireThat(
          !state.draftConversion && !state.readyAdmission,
          'Draft/ready cycle already used; obtain new review'
        )
        validateBeforeDraft(entry, o, required)
        return propose({ kind: 'draft', head: o.head, base: o.base, reason: 'base-refresh' })
      }
      requireThat(o.draft === true, 'PR draft state is unknown')
      return propose({ kind: 'refresh', head: o.head, base: o.base, tree: proof.tree })
    }
    requireThat(
      sha(o.synthetic?.sha) && sha(o.synthetic.tree) && same(o.synthetic.parents, [o.base, o.head]),
      'Synthetic merge identity is stale or unavailable'
    )
    requireThat(
      o.resource?.status === 'observed' &&
        o.resource.fullSuite === true &&
        o.resource.candidate === o.synthetic.sha &&
        o.resource.tree === o.synthetic.tree,
      'Resource preflight needs a clean exact synthetic candidate checkout and installed dependencies'
    )
    if (o.draft === true) {
      requireThat(!state.readyAdmission, 'Ready transition already used; obtain new review')
      validateBeforeDraft(entry, o, required, true)
      return propose({ kind: 'ready', head: o.head, base: o.base })
    }
    requireThat(o.draft === false && o.mergeable === true, 'PR readiness/mergeability is unknown')
    const fullRuns = gateRuns(entry, o, gatesFor(entry)[0]).filter(r => r.base === o.base)
    if (fullRuns.length === 0) {
      validateBeforeDraft(entry, o, required)
      if (state.readyAdmission) {
        requireThat(
          state.readyAdmission.head === o.head && state.readyAdmission.base === o.base,
          'Ready admission identity changed; obtain new review'
        )
        requireThat(now >= state.readyAdmission.since, 'Ready admission clock moved backwards')
        if (now - state.readyAdmission.since < 300_000)
          return wait(
            'Waiting up to five minutes for the submitted ready event to admit Full check'
          )
        return stop(
          'Submitted ready event has no matching Full admission; inspect without retrying'
        )
      }
      requireThat(!state.draftConversion, 'Draft conversion already used; obtain new review')
      return propose({
        kind: 'draft',
        head: o.head,
        base: o.base,
        reason: 'missing-full-admission',
      })
    }
    const checks = []
    for (const gate of required) {
      const runs = gateRuns(entry, o, gate).filter(r => r.base === o.base)
      requireThat(runs.length > 0, `Missing exact head/base/synthetic run: ${gate.job}`)
      // Do not cherry-pick an older green attempt after a newer red/canceled one.
      const latest = latestChronological(runs, `${gate.job} attempts`)
      requireThat(
        latest.merge === o.synthetic.sha && latest.identityVerified === true,
        `Failed, canceled, skipped or unverified current gate: ${gate.job} run ${latest.id}/${latest.attempt}`
      )
      validatePassedGate(o, gate, latest)
      checks.push({ id: latest.id, attempt: latest.attempt, url: latest.url })
    }
    requireThat(o.mergeState === 'clean', 'GitHub does not report clean protected mergeability')
    return propose({
      kind: 'merge',
      head: o.head,
      base: o.base,
      merge: o.synthetic.sha,
      tree: o.synthetic.tree,
      checks,
    })
  } catch (error) {
    return stop(error.message)
  }
}

export function recordIntent(decision) {
  requireThat(
    decision.status === 'propose' && decision.action && !decision.checkpoint.pending,
    'No unique proposed effect to record'
  )
  return {
    ...structuredClone(decision.checkpoint),
    pending: structuredClone(decision.action),
    quiet: null,
  }
}

function latestChronological(items, label) {
  requireThat(
    items.length > 0 && items.every(item => Number.isFinite(Date.parse(item.startedAt))),
    `Missing attempt chronology: ${label}`
  )
  const ordered = items.toSorted((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))
  requireThat(
    ordered.length === 1 || Date.parse(ordered[0].startedAt) !== Date.parse(ordered[1].startedAt),
    `Ambiguous attempt chronology: ${label}`
  )
  return ordered[0]
}

function gateRuns(entry, o, gate) {
  return o.runs.filter(
    r =>
      r.workflow === gate.workflow &&
      r.head === o.head &&
      !(
        r.draftAdmission === true &&
        gate.draftJob &&
        r.job === gate.draftJob &&
        r.appId === 15368 &&
        r.workflowSha256 === entry.workflowHashes[gate.workflow]
      )
  )
}

function validatePassedGate(o, gate, latest) {
  requireThat(
    !latest.identityVerified || (latest.base === o.base && latest.merge === o.synthetic?.sha),
    'Verified candidate identity contradicts run evidence'
  )
  requireThat(
    latest.conclusion === 'success' &&
      latest.event === 'pull_request' &&
      (latest.validationVerified === true || latest.identityVerified === true) &&
      latest.job === gate.job &&
      latest.jobConclusion === 'success' &&
      latest.app === 'github-actions' &&
      latest.appId === 15368 &&
      (gate !== SHARDED_FULL_GATE || latest.shardedVerified === true) &&
      gate.steps.every(
        name =>
          latest.steps?.filter(s => s.name === name).length === 1 &&
          latest.steps.find(s => s.name === name).conclusion === 'success'
      ),
    `Failed, canceled, skipped or unverified current gate: ${gate.job} run ${latest.id}/${latest.attempt}`
  )
  requireThat(Array.isArray(o.currentChecks), 'Missing current required-check selection')
  const current = latestChronological(
    o.currentChecks.filter(c => c.name === gate.job && c.appId === 15368 && c.head === o.head),
    `${gate.job} current checks`
  )
  requireThat(
    current.id === latest.checkId &&
      current.status === 'completed' &&
      current.conclusion === 'success',
    `Current required check disagrees with exact tested attempt: ${gate.job}`
  )
}

function validateBeforeDraft(entry, o, required, allowTutorialDraftGuard = false) {
  requireThat(Array.isArray(o.currentChecks), 'Missing current required-check selection')
  for (const gate of required) {
    const guards =
      allowTutorialDraftGuard && gate === GATES[1]
        ? o.runs.filter(
            r =>
              r.workflow === gate.workflow &&
              r.head === o.head &&
              r.job === gate.job &&
              r.draftGuardOnly === true &&
              r.workflowSha256 === entry.workflowHashes[gate.workflow] &&
              r.appId === 15368 &&
              r.app === 'github-actions' &&
              r.status === 'completed' &&
              r.conclusion === 'failure' &&
              r.jobConclusion === 'failure' &&
              Number.isSafeInteger(r.checkId) &&
              r.checkId > 0
          )
        : []
    const view = {
      ...o,
      currentChecks: o.currentChecks.filter(
        c =>
          !guards.some(
            r =>
              c.id === r.checkId &&
              c.name === gate.job &&
              c.head === o.head &&
              c.appId === r.appId &&
              c.status === 'completed' &&
              c.conclusion === 'failure'
          )
      ),
    }
    const runs = gateRuns(entry, o, gate).filter(r => !guards.includes(r))
    if (runs.length)
      validatePassedGate(view, gate, latestChronological(runs, `${gate.job} attempts`))
    else
      requireThat(
        !view.currentChecks.some(c => c.name === gate.job && c.head === o.head),
        `Required check lacks matching run evidence: ${gate.job}`
      )
  }
}
