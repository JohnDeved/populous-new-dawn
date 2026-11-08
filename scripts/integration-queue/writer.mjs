import { execFileSync } from 'node:child_process'
import { REPO, decide, digest, recordIntent, sha256 } from './policy.mjs'

const ensure = (condition, message) => {
  if (!condition) throw new Error(message)
}
const oid = value => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value)
const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)

export function proposedPlan(entry, decision, context) {
  if (decision.status !== 'propose') return null
  return {
    version: 1,
    repo: REPO,
    pr: entry.pr,
    entrySha256: digest(entry),
    allowlistSha256: context.allowlistSha256,
    driverHead: context.driverHead,
    journalId: context.journalId,
    journalPath: context.journalPath,
    action: structuredClone(decision.action),
  }
}

export function validatePilot(entry, decision, plan, pilot, context, now) {
  ensure(
    context.fixture !== true && context.driverClean === true,
    'Live pilot requires a clean reviewed driver and live observations'
  )
  ensure(
    oid(context.driverHead) &&
      hash(context.allowlistSha256) &&
      hash(context.planSha256) &&
      /^[0-9a-f-]{36}$/.test(context.journalId ?? '') &&
      context.journalPath?.startsWith('/'),
    'Missing immutable pilot context'
  )
  ensure(
    decision.status === 'propose' && !decision.checkpoint.pending,
    'No fresh effect is eligible'
  )
  ensure(
    digest(plan) === digest(proposedPlan(entry, decision, context)),
    'Reviewed plan no longer matches the proposed action or identities'
  )
  ensure(
    pilot?.version === 1 &&
      pilot.repo === REPO &&
      pilot.pr === entry.pr &&
      pilot.planSha256 === context.planSha256 &&
      pilot.approvedBy === entry.approvedBy &&
      pilot.review?.decision === 'ACCEPT' &&
      pilot.review.planSha256 === context.planSha256 &&
      pilot.review.driverHead === context.driverHead &&
      pilot.review.reviewer?.trim() &&
      pilot.review.reviewer !== pilot.approvedBy &&
      hash(pilot.review.sha256) &&
      context.pilotReviewSha256 === pilot.review.sha256,
    'Missing parent-approved pilot or independent exact-plan/driver review'
  )
  const start = Date.parse(pilot.createdAt),
    end = Date.parse(pilot.expiresAt)
  ensure(
    Number.isFinite(start) &&
      Number.isFinite(end) &&
      start <= now &&
      now < end &&
      end - start > 0 &&
      end - start <= 3_600_000,
    'Pilot is expired, future-dated or exceeds the one-hour bound'
  )
  ensure(
    !context.usedPilot,
    'Pilot was already consumed; reconcile its recorded outcome, never resubmit'
  )
}

export function mutationArguments(pr, action) {
  ensure(
    Number.isSafeInteger(pr) && pr > 0 && oid(action?.head) && oid(action.base),
    'Invalid mutation identity'
  )
  const api = ['api', '--hostname', 'github.com', '--method', 'PUT']
  const target = `repos/${REPO}/pulls/${pr}`
  if (action.kind === 'refresh-base') {
    ensure(action.baseRef === 'main' && typeof action.headRef === 'string' && action.headRef.trim() &&
      oid(action.previousBase) && action.previousBase !== action.base && oid(action.merge) && oid(action.tree),
    'Base metadata refresh requires the unchanged main target and exact reviewed identities')
    return ['api', '--hostname', 'github.com', '--method', 'PATCH', target, '-f', 'base=main']
  }
  if (action.kind === 'refresh') {
    ensure(oid(action.tree), 'Refresh requires its reviewed deterministic tree')
    return [...api, `${target}/update-branch`, '-f', `expected_head_sha=${action.head}`]
  }
  if (action.kind === 'draft')
    return ['pr', 'ready', String(pr), '--undo', '--repo', `github.com/${REPO}`]
  if (action.kind === 'ready') return ['pr', 'ready', String(pr), '--repo', `github.com/${REPO}`]
  ensure(
    action.kind === 'merge' && oid(action.tree) && oid(action.merge),
    'Unknown or unbound mutation'
  )
  return [...api, `${target}/merge`, '-f', `sha=${action.head}`, '-f', 'merge_method=merge']
}

const execute = args =>
  execFileSync('gh', args, {
    encoding: 'utf8',
    timeout: 30_000,
    maxBuffer: 1024 * 1024,
    env: { ...process.env, GH_PROMPT_DISABLED: '1', GH_PAGER: 'cat' },
  })

// A pilot is one effect, not an auto-merge permission. The caller owns the locked,
// fsynced journal; even a timeout consumes the pilot and leaves its intent pending.
export function submitPilot({
  apply = false,
  entry,
  decision,
  plan,
  pilot,
  context,
  observe,
  persist,
  transport = execute,
  clock = Date.now,
}) {
  if (!apply) return { status: 'dry-run', action: decision.action }
  validatePilot(entry, decision, plan, pilot, context, clock())
  const fresh = decide(entry, observe(), decision.checkpoint, clock())
  validatePilot(entry, fresh, plan, pilot, context, clock())
  const args = mutationArguments(entry.pr, fresh.action)
  const checkpoint = recordIntent(fresh)
  persist(checkpoint, { status: 'intent', command: ['gh', ...args] })
  let result
  try {
    const output = transport(args)
    if (fresh.action.kind === 'merge') {
      const response = JSON.parse(output)
      ensure(
        response.merged === true && oid(response.sha),
        'Merge response did not confirm a merge; reconcile remotely'
      )
    }
    result = {
      status: 'submitted',
      command: ['gh', ...args],
      outputSha256: sha256(output),
      output,
      reason: 'Submission returned; verify remote outcome on the next observation',
    }
  } catch (error) {
    result = {
      status: 'uncertain',
      command: ['gh', ...args],
      reason: 'Submission outcome is uncertain; reconcile remotely before any further action',
      error: error.message,
      stdout: error.stdout?.toString() ?? '',
      stderr: error.stderr?.toString() ?? '',
    }
  }
  persist(checkpoint, result)
  return result
}
