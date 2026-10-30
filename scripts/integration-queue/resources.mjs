import { dependencyReceipt } from '../orchestration/dependency-profile.mjs'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  helperFingerprint,
  planTestRun,
  productionFingerprint,
} from '../orchestration/test-runner.mjs'
import { assertSafeGitConfiguration } from './github.mjs'
import { digest, sha256 } from './policy.mjs'

export function resourcePreflight(repo, git, approval = null, installReceipt = null) {
  const result = { status: 'blocked', proposal: null }
  try {
    assertSafeGitConfiguration(git('config', '--null', '--list'))
    result.candidate = git('rev-parse', 'HEAD')
    result.tree = git('rev-parse', 'HEAD^{tree}')
    if (git('status', '--porcelain', '--untracked-files=normal'))
      throw new Error('Candidate checkout must be clean')
    const plan = planTestRun(repo, 'all')
    result.fullSuite = plan.fullSuite
    result.parallelEligibility = plan.parallelEligibility
    result.files = plan.files.length
    result.groups = plan.groups.map(g => ({ concurrency: g.concurrency, files: g.files.length }))
    result.runtime = { node: process.versions.node, platform: process.platform, arch: process.arch }
    Object.assign(result, dependencyReceipt(repo))
    result.status = 'observed'
    result.reason =
      plan.parallelEligibility === 'reviewed'
        ? 'Reviewed resource policy is eligible'
        : `Conservative serial fallback: ${plan.parallelEligibility}`
    if (approval) result.proposal = productionOnlyProposal(repo, result, approval, installReceipt)
  } catch (error) {
    result.status = 'blocked'
    result.reason = error.message
  }
  return result
}

export function productionOnlyProposal(repo, preflight, approval, installReceipt = null) {
  const raw = readFileSync(join(repo, 'engineering/test-resources.json'), 'utf8')
  const policy = JSON.parse(raw)
  const production = productionFingerprint(repo)
  // The historical v1 approval cannot authorize a new pnpm concurrency profile.
  // Observing pnpm is supported above; C1 remains until a separately reviewed
  // source/helper/resource-policy renewal. Do not auto-refresh resource hashes.
  if (preflight.dependencyFormat) throw new Error('Pnpm resource renewal requires a separately reviewed explicit approval schema; conservative C1 remains')
  if (
    approval.version !== 1 ||
    approval.kind !== 'productionSha256-only' ||
    !approval.approvedBy?.trim() ||
    approval.candidate !== preflight.candidate ||
    approval.tree !== preflight.tree ||
    approval.policySha256 !== sha256(raw) ||
    approval.installedLockSha256 !== preflight.installedLockSha256 ||
    digest(approval.runtime) !== digest(preflight.runtime) ||
    digest(preflight.runtime) !==
      digest({ node: process.versions.node, platform: process.platform, arch: process.arch }) ||
    preflight.runtime.node !== '24.19.0' ||
    preflight.runtime.platform !== 'linux' ||
    preflight.runtime.arch !== 'x64' ||
    approval.npm !== '11.9.0' ||
    installReceipt?.status !== 'passed' ||
    installReceipt.candidate !== preflight.candidate ||
    installReceipt.tree !== preflight.tree ||
    installReceipt.npm !== '11.9.0' ||
    digest(installReceipt.runtime) !== digest(preflight.runtime) ||
    installReceipt.installedLockSha256 !== preflight.installedLockSha256 ||
    installReceipt.packageLockSha256 !== sha256(readFileSync(join(repo, 'package-lock.json'))) ||
    digest(installReceipt.command) !== digest(['npm', 'ci', '--no-audit', '--no-fund']) ||
    !approval.ciInstallReceipt?.file ||
    !/^[a-f0-9]{64}$/.test(approval.ciInstallReceipt?.sha256 ?? '') ||
    preflight.parallelEligibility !== 'production-config-runtime-drift' ||
    helperFingerprint(repo) !== policy.helpersSha256 ||
    production !== approval.productionSha256
  ) {
    throw new Error(
      'Resource approval does not match exact candidate, unchanged helpers, policy, runtime or CI install'
    )
  }
  // This is a proposal only. A commit changes the source identity and needs a new
  // reviewed allowlist. No helper hash, per-test hash or serial exclusion is altered.
  return { ...policy, productionSha256: production }
}
