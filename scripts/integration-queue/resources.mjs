import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { helperFingerprint, planTestRun, productionFingerprint } from '../orchestration/test-runner.mjs'
import { digest, sha256 } from './policy.mjs'

export function resourcePreflight(repo, git, approval = null) {
  const result = { status: 'blocked', proposal: null }
  try {
    result.candidate = git('rev-parse', 'HEAD')
    result.tree = git('rev-parse', 'HEAD^{tree}')
    if (git('status', '--porcelain', '--untracked-files=normal')) throw new Error('Candidate checkout must be clean')
    const plan = planTestRun(repo, 'all')
    result.fullSuite = plan.fullSuite
    result.parallelEligibility = plan.parallelEligibility
    result.files = plan.files.length
    result.groups = plan.groups.map(g => ({ concurrency: g.concurrency, files: g.files.length }))
    result.runtime = { node: process.versions.node, platform: process.platform, arch: process.arch }
    result.installedLockSha256 = sha256(readFileSync(join(repo, 'node_modules/.package-lock.json')))
    result.status = 'observed'
    result.reason = plan.parallelEligibility === 'reviewed' ? 'Reviewed resource policy is eligible' : `Conservative serial fallback: ${plan.parallelEligibility}`
    if (approval) result.proposal = productionOnlyProposal(repo, result, approval)
  } catch (error) {
    result.status = 'blocked'
    result.reason = error.message
  }
  return result
}

export function productionOnlyProposal(repo, preflight, approval) {
  const raw = readFileSync(join(repo, 'engineering/test-resources.json'), 'utf8')
  const policy = JSON.parse(raw)
  const production = productionFingerprint(repo)
  if (approval.version !== 1 || approval.kind !== 'productionSha256-only' || !approval.approvedBy?.trim() ||
    approval.candidate !== preflight.candidate || approval.tree !== preflight.tree || approval.policySha256 !== sha256(raw) ||
    approval.installedLockSha256 !== preflight.installedLockSha256 ||
    digest(approval.runtime) !== digest(preflight.runtime) ||
    preflight.runtime.node !== '24.19.0' || preflight.runtime.platform !== 'linux' || preflight.runtime.arch !== 'x64' ||
    approval.npm !== '11.9.0' || !approval.ciInstallReceipt?.file || !/^[a-f0-9]{64}$/.test(approval.ciInstallReceipt?.sha256 ?? '') ||
    preflight.parallelEligibility !== 'production-config-runtime-drift' ||
    helperFingerprint(repo) !== policy.helpersSha256 || production !== approval.productionSha256) {
    throw new Error('Resource approval does not match exact candidate, unchanged helpers, policy, runtime or CI install')
  }
  // This is a proposal only. A commit changes the source identity and needs a new
  // reviewed allowlist. No helper hash, per-test hash or serial exclusion is altered.
  return { ...policy, productionSha256: production }
}
