import { GAMEPLAY_OWNERSHIP_POLICY, GAMEPLAY_OWNERSHIP_INPUTS, GAMEPLAY_THREE_CYCLE_POLICY, GAMEPLAY_THREE_CYCLE_INPUTS, GAMEPLAY_MATCHED_POLICY, GAMEPLAY_HEAP_POLICY, GAMEPLAY_RESOURCE_POLICIES, gameplayResourceInputs, GAMEPLAY_RESOURCE_JOB, gameplayResourceArchiveLimit,
  validateGameplayResourceBrowserJobs, gameplayResourceArtifactUpload, validateGameplayResourceArtifactMetadata,
  resolveGameplayResourceArtifact } from './gameplay-resources-policy.mjs'
import { COMPOSED_SOURCE_INPUTS, composedContract } from './composed-profile-artifact.mjs'
import { SPELL_VISUAL_POLICY, SPELL_VISUAL_JOB, SPELL_VISUAL_INPUTS, validateSpellVisualBrowserJobs,
  readSpellVisualReceiptLog, resolveSpellVisualArtifact } from './spell-visuals-policy.mjs'
import { spellVisualArtifactUpload, validateSpellVisualArtifactMetadata, spellVisualArchiveLimit } from './spell-visuals-artifact.mjs'
import { validateSplitBrowserJobs } from './browser-jobs.mjs'
import { MISSION10_JOB, MISSION10_STEPS, MISSION10_INPUTS, mission10CrewLog, validateMission10Crew } from './mission10-recovery.mjs'
import { profileArtifactUpload, mission10ArtifactUpload, validateProfileArtifactMetadata, resolveProfileArtifact, resolveProfileCasesArtifact, resolveMission10Artifact, profileArchiveLimit } from './profile-artifact.mjs'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { stripVTControlCharacters } from 'node:util'
import { CLOUDFLARE, GATES, REPO, sha256, validateEntry, gatesFor, SHARDED_FULL_GATE } from './policy.mjs'

import { PROFILE_JOB, PROFILE_STEPS, PROFILE_INPUTS, profileRecoveryLog, validateProfileRecovery, profileCasesLog, validateProfileCases } from './profile-recovery.mjs'

import { RECOVERY_JOB, RECOVERY_STEPS, RECOVERY_INPUTS, pauseRecoveryLog, validatePauseRecovery } from './pause-recovery.mjs'

import { BASELINE_DIAGNOSTIC, SHARDED_JOBS, shardedLogReceipt, validateShardedReceipt, validateBaselineLog } from './sharded.mjs'

const sha = value => /^[0-9a-f]{40}$/.test(value ?? '')
const ensure = (condition, message) => {
  if (!condition) throw new Error(message)
}
const run = (file, args, cwd) => {
  try {
    return execFileSync(file, args, {
      cwd,
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 30_000,
      maxBuffer: 16 * 1024 * 1024,
      env: { ...process.env, GH_PROMPT_DISABLED: '1', GH_PAGER: 'cat' },
    })
  } catch (error) {
    throw new Error(stripVTControlCharacters(error.message))
  }
}

// This reader only issues GET requests. The separately armed writer owns mutations.
export class GitHubReader {
  constructor({ cwd = process.cwd(), execute = run, executeBinary = execute === run ? execFileSync : null } = {}) {
    this.cwd = cwd
    this.execute = execute
    this.executeBinary = executeBinary
  }
  get(endpoint, text = false) {
    ensure(
      endpoint.startsWith(`repos/${REPO}/`) && !endpoint.includes('..'),
      'Unexpected GitHub endpoint'
    )
    const args = ['api', '--hostname', 'github.com', '--method', 'GET', endpoint]
    if (text) {
      ensure(
        new RegExp(`^repos/${REPO}/actions/jobs/[1-9][0-9]*/logs$`).test(endpoint),
        'Raw text capture is restricted to numeric Actions job logs'
      )
      args.push('--allow-escape-sequences')
    }
    const raw = this.execute('gh', args, this.cwd)
    return text ? raw : JSON.parse(raw)
  }
  artifactArchive(id) {
    ensure(Number.isSafeInteger(id) && id > 0, 'Invalid numeric artifact ID')
    ensure(typeof this.executeBinary === 'function', 'Binary artifact transport must be explicitly injected')
    return this.executeBinary('gh', ['api', '--hostname', 'github.com', '--method', 'GET',
      `repos/${REPO}/actions/artifacts/${id}/zip`], {
      cwd: this.cwd, stdio: 'pipe', timeout: 30_000, maxBuffer: profileArchiveLimit,
      env: { ...process.env, GH_PROMPT_DISABLED: '1', GH_PAGER: 'cat' },
    })
  }
  spellVisualArchive(id) {
    ensure(Number.isSafeInteger(id) && id > 0, 'Invalid numeric spell visuals artifact ID')
    ensure(typeof this.executeBinary === 'function', 'Binary spell visuals transport must be explicitly injected')
    const bytes = this.executeBinary('gh', ['api', '--hostname', 'github.com', '--method', 'GET',
      `repos/${REPO}/actions/artifacts/${id}/zip`], {
      cwd: this.cwd, stdio: 'pipe', timeout: 30_000, maxBuffer: spellVisualArchiveLimit,
      env: { ...process.env, GH_PROMPT_DISABLED: '1', GH_PAGER: 'cat' },
    })
    ensure(Buffer.isBuffer(bytes) && bytes.length <= spellVisualArchiveLimit, 'Invalid synchronous spell visuals archive bytes')
    return bytes
  }
  gameplayResourceArchive(id) {
    ensure(Number.isSafeInteger(id) && id > 0, 'Invalid numeric gameplay resources artifact ID')
    ensure(typeof this.executeBinary === 'function', 'Binary gameplay resources transport must be explicitly injected')
    const bytes = this.executeBinary('gh', ['api', '--hostname', 'github.com', '--method', 'GET',
      `repos/${REPO}/actions/artifacts/${id}/zip`], {
      cwd: this.cwd, stdio: 'pipe', timeout: 30_000, maxBuffer: gameplayResourceArchiveLimit,
      env: { ...process.env, GH_PROMPT_DISABLED: '1', GH_PAGER: 'cat' },
    })
    ensure(Buffer.isBuffer(bytes) && bytes.length <= gameplayResourceArchiveLimit, 'Invalid synchronous gameplay resources archive bytes')
    return bytes
  }
  // Immutable data-only blob read: no checkout, filters, text conversion or imports.
  // Explicitly bounded and byte-exact, including PNGs that cannot round-trip UTF-8.
  spellVisualBlob(commit, path) {
    ensure(sha(commit) && SPELL_VISUAL_INPUTS.includes(path), 'Unreviewed spell visuals input')
    return this.immutableBlob(commit, path)
  }
  composedSourceBlob(commit, path) {
    ensure(sha(commit) && COMPOSED_SOURCE_INPUTS.includes(path), 'Unreviewed composed source input')
    return this.immutableBlob(commit, path)
  }
  immutableBlob(commit, path) {
    ensure(sha(commit) && (SPELL_VISUAL_INPUTS.includes(path) || COMPOSED_SOURCE_INPUTS.includes(path) || GAMEPLAY_OWNERSHIP_INPUTS.includes(path)), 'Unreviewed immutable source input')
    ensure(typeof this.executeBinary === 'function', 'Binary Git transport must be explicitly injected')
    const prefix = ['--no-replace-objects', '-c', 'core.hooksPath=/dev/null',
      '-c', 'core.fsmonitor=false', '-c', 'core.attributesFile=/dev/null']
    assertSafeGitConfiguration(this.execute('git', [...prefix, 'config', '--null', '--list'], this.cwd))
    const bytes = this.executeBinary('git', [...prefix, 'cat-file', 'blob', `${commit}:${path}`], {
      cwd: this.cwd, stdio: 'pipe', timeout: 30_000, maxBuffer: 32 * 1024 * 1024,
      env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1', GIT_NO_LAZY_FETCH: '1' },
    })
    ensure(Buffer.isBuffer(bytes) && bytes.length <= 32 * 1024 * 1024, 'Invalid synchronous Git blob bytes')
    return bytes
  }
  pages(endpoint, key = null) {
    const values = []
    let expected
    for (let page = 1; page <= 10; page++) {
      const response = this.get(
        `${endpoint}${endpoint.includes('?') ? '&' : '?'}per_page=100&page=${page}`
      )
      const rows = key ? response[key] : response
      ensure(Array.isArray(rows), `Incomplete collection: ${endpoint}`)
      if (key) {
        ensure(
          Number.isSafeInteger(response.total_count) && response.total_count >= 0,
          `Missing total_count: ${endpoint}`
        )
        ensure(
          response.total_count < 1000,
          `GitHub collection cap reached: ${endpoint}; narrow scope manually`
        )
        expected ??= response.total_count
        ensure(
          expected === response.total_count,
          `Collection changed during pagination: ${endpoint}`
        )
      }
      values.push(...rows)
      if (key)
        ensure(
          values.length <= expected && new Set(values.map(v => v.id)).size === values.length,
          `Duplicate or excess collection entries: ${endpoint}`
        )
      if (rows.length < 100) {
        ensure(
          !key || values.length === expected,
          `Incomplete enumeration despite short page: ${endpoint}`
        )
        return values
      }
    }
    throw new Error(`Pagination bound reached: ${endpoint}; cannot claim a complete observation`)
  }
  git(...args) { return this.gitOutput(...args).trim() }
  gitOutput(...args) {
    const prefix = [
      '-c',
      'core.hooksPath=/dev/null',
      '-c',
      'core.fsmonitor=false',
      '-c',
      'core.attributesFile=/dev/null',
    ]
    // config --null --list does not inspect working files or invoke clean filters.
    // Run it before every other Git operation, including status in preflight.
    assertSafeGitConfiguration(
      this.execute('git', [...prefix, 'config', '--null', '--list'], this.cwd)
    )
    return this.execute('git', [...prefix, ...args], this.cwd)
  }
  commit(oid) {
    ensure(sha(oid), 'Missing immutable commit SHA')
    const value = this.get(`repos/${REPO}/git/commits/${oid}`)
    ensure(value.sha === oid && sha(value.tree?.sha), 'GitHub commit identity mismatch')
    return { sha: value.sha, tree: value.tree.sha, parents: value.parents.map(p => p.sha) }
  }
  workflow(path, ref) {
    ensure(sha(ref), 'Workflow ref must be immutable')
    const blob = this.get(`repos/${REPO}/contents/${path}?ref=${ref}`)
    ensure(
      blob.encoding === 'base64' && typeof blob.content === 'string',
      'Workflow content missing'
    )
    return { path, ref, sha256: sha256(Buffer.from(blob.content, 'base64')) }
  }
  refresh(entry, head, base) {
    ensure(sha(head) && sha(base), 'Merge proof requires immutable identities')
    // No fetch, checkout or branch write. Missing local Git objects stop inspection.
    ensure(
      this.git('merge-base', entry.reviewBase, head) === entry.reviewBase &&
        this.git('merge-base', entry.reviewBase, base) === entry.reviewBase,
      'Reviewed base is not an ancestor of source and main'
    )
    const names = (a, b) =>
      this.git(
        'diff',
        '--no-ext-diff',
        '--no-textconv',
        '--name-only',
        '-z',
        '--no-renames',
        a,
        b,
        '--'
      )
        .split('\0')
        .filter(Boolean)
    const sourcePaths = names(entry.reviewBase, head)
    const basePaths = new Set(names(entry.reviewBase, base))
    const disjoint = !sourcePaths.some(path => basePaths.has(path))
    // merge-tree writes unreachable tree objects only, never refs or checkout files.
    const tree = disjoint ? this.git('merge-tree', '--write-tree', head, base) : null
    return {
      sourceHead: head,
      base,
      reviewBase: entry.reviewBase,
      disjoint,
      clean: disjoint && sha(tree),
      tree,
    }
  }
  protection() {
    const p = this.get(`repos/${REPO}/branches/main/protection`)
    const rules = this.pages(`repos/${REPO}/rules/branches/main`)
    const required = p.required_status_checks
    const bypass = p.required_pull_request_reviews?.bypass_pull_request_allowances
    return {
      strict: required?.strict === true,
      admins: p.enforce_admins?.enabled === true,
      pullRequests: !!p.required_pull_request_reviews,
      noBypass:
        !bypass ||
        ['users', 'teams', 'apps'].every(k => Array.isArray(bypass[k]) && bypass[k].length === 0),
      fullCheck:
        required?.checks?.some(c => c.context === 'Full check' && c.app_id === 15368) === true,
      supported: !rules.some(r => r.type === 'merge_queue'),
    }
  }
  runs(entry, pr, synthetic) {
    const runs = []
    for (const gate of gatesFor(entry)) {
      const all = this.pages(
        `repos/${REPO}/actions/workflows/${gate.workflow.split('/').at(-1)}/runs?event=pull_request&branch=${encodeURIComponent(pr.head.ref)}`,
        'workflow_runs'
      )
      for (const item of all) {
        ensure(
          Array.isArray(item.pull_requests),
          'Run lacks PR association; manual identity inspection required'
        )
        const association = item.pull_requests.find(p => p.number === entry.pr)
        if (!association) {
          ensure(
            item.pull_requests.length > 0 || item.status === 'completed',
            'Unassociated active run could supersede this PR; wait for identity'
          )
          continue
        }
        const exact = this.get(`repos/${REPO}/actions/runs/${item.id}/attempts/${item.run_attempt}`)
        ensure(
          exact.id === item.id &&
            exact.run_attempt === item.run_attempt &&
            exact.path === gate.workflow &&
            exact.event === 'pull_request',
          'Workflow run identity drift'
        )
        const row = {
          id: exact.id,
          attempt: exact.run_attempt,
          workflow: gate.workflow,
          event: exact.event,
          head: exact.head_sha,
          base: association.base.sha,
          merge: null,
          status: exact.status,
          conclusion: exact.conclusion,
          updatedAt: exact.updated_at,
          startedAt: exact.run_started_at,
          url: exact.html_url,
          identityVerified: false,
        }
        if (exact.status === 'completed' && row.head === pr.head.sha) {
          const jobs = this.pages(
            `repos/${REPO}/actions/runs/${exact.id}/attempts/${exact.run_attempt}/jobs`,
            'jobs'
          )
          const matches = jobs.filter(
            j => j.name === gate.job || (gate.draftJob && j.name === gate.draftJob)
          )
          ensure(matches.length === 1, 'Missing or duplicate validation/admission job')
          const job = matches[0]
          ensure(
            job.check_run_url?.startsWith(`https://api.github.com/repos/${REPO}/check-runs/`),
            'Unexpected check run URL'
          )
          const check = this.get(job.check_run_url.slice('https://api.github.com/'.length))
          ensure(
            check.check_suite?.id === exact.check_suite_id &&
              check.head_sha === row.head &&
              check.name === job.name &&
              check.app?.id === 15368 &&
              check.app?.slug === 'github-actions',
            'Check suite/run/app mismatch'
          )
          const rawLog = this.get(`repos/${REPO}/actions/jobs/${job.id}/logs`, true)
          const log = stripVTControlCharacters(rawLog)
          const identity = logIdentity(log)
          row.head = identity.head ?? row.head
          row.base = identity.base ?? row.base
          row.merge = identity.merge
          row.logSha256 = sha256(rawLog)
          row.app = check.app.slug
          row.appId = check.app.id
          row.checkId = check.id
          row.startedAt = job.started_at ?? exact.run_started_at
          row.job = job.name
          row.jobConclusion = job.conclusion
          row.steps = job.steps.map(s => ({ name: s.name, conclusion: s.conclusion }))
          row.workflowSha256 = this.workflow(gate.workflow, exact.head_sha).sha256
          const stage = (name, conclusion) =>
            row.steps.filter(s => s.name === name).length === 1 &&
            row.steps.find(s => s.name === name).conclusion === conclusion
          row.draftGuardOnly =
            row.workflowSha256 === entry.workflowHashes[gate.workflow] &&
            exact.conclusion === 'failure' &&
            job.conclusion === 'failure' &&
            check.conclusion === 'failure' &&
            /(?:^|\n)[^\n]*?\bIS_DRAFT: true\s*(?=\n|$)/.test(log) &&
            stage('Require a ready pull request', 'failure') &&
            gate.steps.slice(1).every(name => stage(name, 'skipped'))
          row.draftAdmission = !!gate.draftJob && job.name === gate.draftJob && row.draftGuardOnly
          row.validationVerified =
            identity.head === pr.head.sha &&
            exact.head_sha === identity.head &&
            sha(identity.base) &&
            sha(identity.merge) &&
            check.conclusion === 'success' &&
            row.workflowSha256 === entry.workflowHashes[gate.workflow]
          if (gate === SHARDED_FULL_GATE && job.name === gate.job && exact.conclusion === 'success') {
            this.verifyShardedRun(entry, pr, synthetic, exact, jobs, row, log)
          }
          if (gate.recoveryRequired && exact.conclusion === 'success')
            this.verifyPauseRecoveryRun(entry, pr, synthetic, exact, jobs, row)
          if (gate.profileRequired && exact.conclusion === 'success') {
            const proof = this.verifyProfileRecoveryRun(entry, pr, synthetic, exact, jobs, row)
            if (gate.composedRequired) {
              ensure(proof && typeof proof.then !== 'function' && proof.composedVerified === true, 'Unresolved composed Profile verifier')
              row.profileRecoveryVerified = true; row.tornadoVerified = true
              row.profileRecoveryReceiptSha256 = proof.receiptSha256; row.profileRecoveryCheckId = proof.checkId
            }
          }
          if (gate.mission10Required && exact.conclusion === 'success') {
            const proof = this.verifyMission10Run(entry, pr, synthetic, exact, jobs, row)
            if (gate.composedRequired) {
              ensure(proof && typeof proof.then !== 'function' && proof.composedVerified === true, 'Unresolved composed Mission10 verifier')
              row.mission10Verified = true; row.spySourceVerified = true
              row.mission10ReceiptSha256 = proof.receiptSha256; row.mission10CheckId = proof.checkId
            }
          }
          if (gate.spellVisualsRequired && exact.conclusion === 'success')
            ensure(this.verifySpellVisualRun(entry, pr, synthetic, exact, jobs, row) === true, 'Unresolved spell visuals verification')
          if (gate.gameplayResourcesRequired && exact.conclusion === 'success')
            ensure(this.verifyGameplayResourceRun(entry, pr, synthetic, exact, jobs, row) === true, 'Unresolved gameplay resource verification')
          row.identityVerified =
            identity.head === pr.head.sha &&
            identity.base === pr.base.sha &&
            row.merge === synthetic?.sha &&
            exact.head_sha === identity.head &&
            check.conclusion === 'success' &&
            row.workflowSha256 === entry.workflowHashes[gate.workflow]
        }
        runs.push(row)
      }
    }
    return runs
  }
  validateBrowserJobs(entry, pr, exact, jobs) {
    if (entry.profileArtifactPolicy !== undefined) {
      composedContract({ profileArtifactPolicy: entry.profileArtifactPolicy, browserPolicy: entry.browserPolicy, checkpointVersion: entry.browserCheckpointVersion })
      ensure(jobs.every(j => j.head_sha === pr.head.sha), 'Composed job head differs')
    }
    if (entry.browserPolicy === SPELL_VISUAL_POLICY) {
      ensure(entry.browserCheckpointVersion === 4, 'Nine-job policy requires explicit current-v4 contract')
      ensure(validateSpellVisualBrowserJobs(jobs, exact, { policy: SPELL_VISUAL_POLICY, headSha: pr.head.sha }) === true,
        'Unresolved nine-job inventory')
    } else if (GAMEPLAY_RESOURCE_POLICIES.includes(entry.browserPolicy)) {
      ensure(entry.browserCheckpointVersion === 3, 'Resource policy requires explicit v3 contract')
      ensure(validateGameplayResourceBrowserJobs(jobs, exact, { policy: entry.browserPolicy, headSha: pr.head.sha }) === true,
        'Unresolved resource nine-job inventory')
    } else validateSplitBrowserJobs(jobs, exact)
  }
  verifySpellVisualRun(entry, pr, synthetic, exact, jobs, row) {
    ensure(entry.browserPolicy === SPELL_VISUAL_POLICY && entry.browserCheckpointVersion === 4,
      'Spell visuals requires explicit nine-job/current-v4 contract')
    ensure(exact.status === 'completed' && exact.conclusion === 'success' &&
      exact.event === 'pull_request' && exact.path === GATES[1].workflow && exact.head_sha === pr.head.sha &&
      synthetic && row.merge === synthetic.sha, 'Spell visuals workflow/candidate identity differs')
    this.validateBrowserJobs(entry, pr, exact, jobs)
    const job = jobs.find(j => j.name === SPELL_VISUAL_JOB[1])
    ensure(Number.isSafeInteger(job.id) && job.id > 0 &&
      new RegExp(`^https://api\\.github\\.com/repos/${REPO}/check-runs/[1-9][0-9]*$`).test(job.check_run_url),
      'Unexpected spell visuals job/check identity')
    const check = this.get(job.check_run_url.slice('https://api.github.com/'.length))
    ensure(check.id === Number(job.check_run_url.split('/').at(-1)) &&
      check.check_suite?.id === exact.check_suite_id && check.head_sha === pr.head.sha &&
      check.name === SPELL_VISUAL_JOB[1] && check.app?.id === 15368 && check.app?.slug === 'github-actions' &&
      check.status === 'completed' && check.conclusion === 'success', 'Spell visuals check identity/result mismatch')
    const rawLog = this.get(`repos/${REPO}/actions/jobs/${job.id}/logs`, true)
    const log = stripVTControlCharacters(rawLog), identity = logIdentity(log)
    ensure(identity.head === pr.head.sha && identity.base === pr.base.sha && identity.merge === synthetic.sha,
      'Spell visuals worker tested a different candidate')
    ensure(this.workflow(GATES[1].workflow, synthetic.sha).sha256 === entry.workflowHashes[GATES[1].workflow],
      'Spell visuals workflow source differs')
    const receipt = readSpellVisualReceiptLog(log)
    const inputs = Object.fromEntries(SPELL_VISUAL_INPUTS.map(path => [path, this.spellVisualBlob(synthetic.sha, path)]))
    const expected = { policy: SPELL_VISUAL_POLICY,
      identity: { repository: REPO, runId: String(exact.id), runAttempt: String(exact.run_attempt),
        workflowRef: `${REPO}/${GATES[1].workflow}@refs/pull/${entry.pr}/merge`,
        mergeSha: synthetic.sha, headSha: pr.head.sha, baseSha: pr.base.sha },
      inputs: Object.fromEntries(Object.entries(inputs).map(([path, bytes]) => [path, sha256(bytes)])),
      originalAngel: inputs['app/original-angel.json'],
      originalUnits: inputs['app/original-units.json'],
    }
    const upload = spellVisualArtifactUpload(log, synthetic.sha)
    const artifacts = this.pages(`repos/${REPO}/actions/runs/${exact.id}/artifacts`, 'artifacts')
    const matches = artifacts.filter(a => a.name === upload.name || a.id === upload.id)
    ensure(matches.length === 1, 'Missing, duplicate or reuploaded spell visuals artifact')
    validateSpellVisualArtifactMetadata(matches[0], upload, expected.identity)
    validateSpellVisualArtifactMetadata(this.get(`repos/${REPO}/actions/artifacts/${upload.id}`), upload, expected.identity)
    const evidence = resolveSpellVisualArtifact(this.spellVisualArchive(upload.id), upload, receipt, expected)
    ensure(evidence && typeof evidence.then !== 'function' && evidence.visualReview === 'required',
      'Unresolved spell visuals artifact evidence')
    row.spellVisualsVerified = true
    row.spellVisualsCheckId = check.id
    row.spellVisualsLogSha256 = sha256(rawLog)
    row.spellVisualsArtifactId = upload.id
    row.spellVisualsArtifactSha256 = upload.sha256
    return true
  }
  verifyGameplayResourceRun(entry, pr, synthetic, exact, jobs, row) {
    ensure(GAMEPLAY_RESOURCE_POLICIES.includes(entry.browserPolicy) && entry.browserCheckpointVersion === 3,
      'Gameplay resources requires explicit nine-job/current-v3 contract')
    ensure(exact.status === 'completed' && exact.conclusion === 'success' &&
      exact.event === 'pull_request' && exact.path === GATES[1].workflow && exact.head_sha === pr.head.sha &&
      synthetic && row.merge === synthetic.sha, 'Gameplay resources workflow/candidate identity differs')
    this.validateBrowserJobs(entry, pr, exact, jobs)
    const job = jobs.find(j => j.name === GAMEPLAY_RESOURCE_JOB[1])
    ensure(Number.isSafeInteger(job.id) && job.id > 0 &&
      new RegExp(`^https://api\\.github\\.com/repos/${REPO}/check-runs/[1-9][0-9]*$`).test(job.check_run_url),
      'Unexpected gameplay resources job/check identity')
    const check = this.get(job.check_run_url.slice('https://api.github.com/'.length))
    ensure(check.id === Number(job.check_run_url.split('/').at(-1)) &&
      check.check_suite?.id === exact.check_suite_id && check.head_sha === pr.head.sha &&
      check.name === GAMEPLAY_RESOURCE_JOB[1] && check.app?.id === 15368 && check.app?.slug === 'github-actions' &&
      check.status === 'completed' && check.conclusion === 'success', 'Gameplay resources check identity/result mismatch')
    const rawLog = this.get(`repos/${REPO}/actions/jobs/${job.id}/logs`, true)
    const log = stripVTControlCharacters(rawLog), identity = logIdentity(log)
    ensure(identity.head === pr.head.sha && identity.base === pr.base.sha && identity.merge === synthetic.sha,
      'Gameplay resources worker tested a different candidate')
    ensure(this.workflow(GATES[1].workflow, synthetic.sha).sha256 === entry.workflowHashes[GATES[1].workflow],
      'Gameplay resources workflow source differs')
    const inputs = Object.fromEntries(gameplayResourceInputs(entry.browserPolicy).map(path => [path, this.immutableBlob(synthetic.sha, path)]))
    const expected = { policy: entry.browserPolicy,
      identity: { repository: REPO, runId: String(exact.id), runAttempt: String(exact.run_attempt),
        workflowRef: `${REPO}/${GATES[1].workflow}@refs/pull/${entry.pr}/merge`,
        mergeSha: synthetic.sha, headSha: pr.head.sha, baseSha: pr.base.sha },
      inputs: Object.fromEntries(Object.entries(inputs).map(([path, bytes]) => [path, sha256(bytes)])),
    }
    const upload = gameplayResourceArtifactUpload(log, synthetic.sha)
    const artifacts = this.pages(`repos/${REPO}/actions/runs/${exact.id}/artifacts`, 'artifacts')
    const matches = artifacts.filter(a => a.name === upload.name || a.id === upload.id)
    ensure(matches.length === 1, 'Missing, duplicate or reuploaded gameplay resources artifact')
    validateGameplayResourceArtifactMetadata(matches[0], upload, expected.identity)
    validateGameplayResourceArtifactMetadata(this.get(`repos/${REPO}/actions/artifacts/${upload.id}`), upload, expected.identity)
    const evidence = resolveGameplayResourceArtifact(this.gameplayResourceArchive(upload.id), upload, expected)
    ensure(evidence && typeof evidence.then !== 'function' && evidence.lifecycleVerified === true,
      'Unresolved gameplay resources artifact evidence')
    if ([GAMEPLAY_HEAP_POLICY, GAMEPLAY_MATCHED_POLICY, GAMEPLAY_THREE_CYCLE_POLICY, GAMEPLAY_OWNERSHIP_POLICY].includes(entry.browserPolicy)) {
      ensure(evidence.heapCapabilityVerified === true, 'Missing mandatory isolate byte capability proof')
      row.gameplayHeapVerified = true
    }
    if (entry.browserPolicy === GAMEPLAY_MATCHED_POLICY) {
      ensure(evidence.matchedCyclesVerified === true, 'Missing mandatory matched two-cycle proof')
      row.gameplayMatchedCyclesVerified = true
    }
    if ([GAMEPLAY_THREE_CYCLE_POLICY, GAMEPLAY_OWNERSHIP_POLICY].includes(entry.browserPolicy)) {
      ensure(evidence.threeCyclesVerified === true && evidence.cycleCount === 3, 'Missing mandatory three-cycle proof')
      row.gameplayThreeCyclesVerified = true
    }
    if (entry.browserPolicy === GAMEPLAY_OWNERSHIP_POLICY) {
      ensure(evidence.ownershipVerified === true, 'Missing mandatory bounded ownership proof')
      row.gameplayOwnershipVerified = true
    }
    row.gameplayResourcesVerified = true
    row.gameplayResourcesCheckId = check.id
    row.gameplayResourcesLogSha256 = sha256(rawLog)
    row.gameplayResourcesArtifactId = upload.id
    row.gameplayResourcesArtifactSha256 = upload.sha256
    return true
  }
  verifyPauseRecoveryRun(entry, pr, synthetic, exact, jobs, row) {
    ensure(exact.status === 'completed' && exact.conclusion === 'success' &&
      exact.event === 'pull_request' && exact.path === GATES[1].workflow && exact.head_sha === pr.head.sha,
      'Recovery workflow is not the successful current PR run')
    ensure(['pause-recovery-v1', 'profile-recovery-v1', 'profile-split-v1', SPELL_VISUAL_POLICY, ...GAMEPLAY_RESOURCE_POLICIES].includes(entry.browserPolicy) && synthetic && row.merge === synthetic.sha,
      'Pause recovery requires explicit trusted policy and current synthetic source')
    const nine = [SPELL_VISUAL_POLICY, ...GAMEPLAY_RESOURCE_POLICIES].includes(entry.browserPolicy)
    const split = entry.browserPolicy === 'profile-split-v1' || nine
    if (split) this.validateBrowserJobs(entry, pr, exact, jobs)
    const expectedJobs = nine ? 9 : split ? 8 : entry.browserPolicy === 'profile-recovery-v1' ? 3 : 2
    ensure(jobs.length === expectedJobs && new Set(jobs.map(j => j.id)).size === expectedJobs &&
      (expectedJobs === 2 || jobs.filter(j => j.name === PROFILE_JOB).length === 1) &&
      jobs.filter(j => j.name === 'Tutorial browser').length === 1,
      'Missing, duplicate or extra browser jobs')
    const matches = jobs.filter(j => j.name === RECOVERY_JOB)
    ensure(matches.length === 1, 'Missing or duplicate recovery job')
    const job = matches[0]
    ensure(job.run_id === exact.id && job.run_attempt === exact.run_attempt &&
      job.status === 'completed' && job.conclusion === 'success' &&
      RECOVERY_STEPS.every(name => job.steps?.filter(s => s.name === name).length === 1 &&
        job.steps.find(s => s.name === name).conclusion === 'success'), 'Recovery job did not genuinely succeed')
    ensure(new RegExp(`^https://api\\.github\\.com/repos/${REPO}/check-runs/[1-9][0-9]*$`).test(job.check_run_url),
      'Unexpected recovery check URL')
    const check = this.get(job.check_run_url.slice('https://api.github.com/'.length))
    ensure(check.id === Number(job.check_run_url.split('/').at(-1)) &&
      check.check_suite?.id === exact.check_suite_id && check.head_sha === pr.head.sha &&
      check.name === RECOVERY_JOB && check.app?.id === 15368 && check.app?.slug === 'github-actions' &&
      check.status === 'completed' && check.conclusion === 'success', 'Recovery check identity/result mismatch')
    const log = stripVTControlCharacters(this.get(`repos/${REPO}/actions/jobs/${job.id}/logs`, true))
    const identity = logIdentity(log)
    ensure(identity.head === pr.head.sha && identity.base === pr.base.sha && identity.merge === synthetic.sha,
      'Recovery worker tested a different candidate')
    ensure(this.workflow(GATES[1].workflow, synthetic.sha).sha256 === entry.workflowHashes[GATES[1].workflow],
      'Recovery workflow source differs')
    const receipt = pauseRecoveryLog(log)
    validatePauseRecovery(receipt, {
      identity: { repository: REPO, runId: String(exact.id), runAttempt: String(exact.run_attempt),
        workflowRef: `${REPO}/${GATES[1].workflow}@refs/pull/${entry.pr}/merge`,
        mergeSha: synthetic.sha, headSha: pr.head.sha, baseSha: pr.base.sha },
      inputs: Object.fromEntries(RECOVERY_INPUTS.map(path =>
        [path, sha256(this.gitOutput('show', `${synthetic.sha}:${path}`))])),
    })
    row.pauseRecoveryVerified = true
    row.pauseRecoveryReceiptSha256 = receipt.receiptSha256
    row.pauseRecoveryCheckId = check.id
  }
  composedExpected(entry, identity) {
    if (entry.profileArtifactPolicy === undefined) return undefined
    const contract = { profileArtifactPolicy: entry.profileArtifactPolicy, browserPolicy: entry.browserPolicy,
      checkpointVersion: entry.browserCheckpointVersion, identity }
    ensure(composedContract(contract) === true, 'Invalid composed contract')
    let total = 0
    contract.sourceBytes = Object.fromEntries(COMPOSED_SOURCE_INPUTS.map(path => {
      const bytes = this.composedSourceBlob(identity.mergeSha, path)
      ensure(Buffer.isBuffer(bytes), 'Unresolved composed source blob')
      total += bytes.length; ensure(total <= 128 * 1024 * 1024, 'Composed source byte bound')
      return [path, bytes]
    }))
    return contract
  }
  profileEvidence(log, receipt, identity, recoveryOnly = false, composed) {
    const upload = profileArtifactUpload(log, identity.mergeSha)
    const artifacts = this.pages(`repos/${REPO}/actions/runs/${identity.runId}/artifacts`, 'artifacts')
    const matchesArtifact = artifacts.filter(artifact => artifact.name === upload.name || (composed !== undefined && artifact.id === upload.id))
    ensure(matchesArtifact.length === 1, 'Missing or duplicate profile artifact')
    validateProfileArtifactMetadata(matchesArtifact[0], upload, identity)
    const metadata = this.get(`repos/${REPO}/actions/artifacts/${upload.id}`)
    validateProfileArtifactMetadata(metadata, upload, identity)
    const archive = this.artifactArchive(upload.id)
    const result = recoveryOnly ? resolveProfileCasesArtifact(archive, upload, receipt, composed) : resolveProfileArtifact(archive, upload, receipt)
    if (composed !== undefined) ensure(result && typeof result.then !== 'function' && result.composedVerified === true,
      'Unresolved composed Profile artifact')
    return result
  }
  verifyProfileRecoveryRun(entry, pr, synthetic, exact, jobs, row) {
    ensure(exact.status === 'completed' && exact.conclusion === 'success' &&
      exact.event === 'pull_request' && exact.path === GATES[1].workflow && exact.head_sha === pr.head.sha,
      'Profile recovery workflow is not the successful current PR run')
    ensure(['profile-recovery-v1', 'profile-split-v1', SPELL_VISUAL_POLICY, ...GAMEPLAY_RESOURCE_POLICIES].includes(entry.browserPolicy) && synthetic && row.merge === synthetic.sha,
      'Profile recovery requires explicit trusted policy and current synthetic source')
    const nine = [SPELL_VISUAL_POLICY, ...GAMEPLAY_RESOURCE_POLICIES].includes(entry.browserPolicy)
    const split = entry.browserPolicy === 'profile-split-v1' || nine
    if (split) this.validateBrowserJobs(entry, pr, exact, jobs)
    const expectedJobs = nine ? 9 : split ? 8 : 3
    ensure(jobs.length === expectedJobs && new Set(jobs.map(j => j.id)).size === expectedJobs &&
      jobs.filter(j => j.name === RECOVERY_JOB).length === 1 &&
      jobs.filter(j => j.name === 'Tutorial browser').length === 1,
      'Missing, duplicate or extra browser jobs')
    const matches = jobs.filter(j => j.name === PROFILE_JOB)
    ensure(matches.length === 1, 'Missing or duplicate recovery job')
    const job = matches[0]
    ensure(job.run_id === exact.id && job.run_attempt === exact.run_attempt &&
      job.status === 'completed' && job.conclusion === 'success' &&
      PROFILE_STEPS.every(name => job.steps?.filter(s => s.name === name).length === 1 &&
        job.steps.find(s => s.name === name).conclusion === 'success'), 'Profile recovery job did not genuinely succeed')
    ensure(new RegExp(`^https://api\\.github\\.com/repos/${REPO}/check-runs/[1-9][0-9]*$`).test(job.check_run_url),
      'Unexpected recovery check URL')
    const check = this.get(job.check_run_url.slice('https://api.github.com/'.length))
    ensure(check.id === Number(job.check_run_url.split('/').at(-1)) &&
      check.check_suite?.id === exact.check_suite_id && check.head_sha === pr.head.sha &&
      check.name === PROFILE_JOB && check.app?.id === 15368 && check.app?.slug === 'github-actions' &&
      check.status === 'completed' && check.conclusion === 'success', 'Profile recovery check identity/result mismatch')
    const log = stripVTControlCharacters(this.get(`repos/${REPO}/actions/jobs/${job.id}/logs`, true))
    const identity = logIdentity(log)
    ensure(identity.head === pr.head.sha && identity.base === pr.base.sha && identity.merge === synthetic.sha,
      'Profile recovery worker tested a different candidate')
    ensure(this.workflow(GATES[1].workflow, synthetic.sha).sha256 === entry.workflowHashes[GATES[1].workflow],
      'Profile recovery workflow source differs')
    const receipt = split ? profileCasesLog(log) : profileRecoveryLog(log)
    const expected = {
      ...(entry.browserPolicy === SPELL_VISUAL_POLICY ? { policy: SPELL_VISUAL_POLICY, checkpointVersion: entry.browserCheckpointVersion } : {}),
      identity: { repository: REPO, runId: String(exact.id), runAttempt: String(exact.run_attempt),
        workflowRef: `${REPO}/${GATES[1].workflow}@refs/pull/${entry.pr}/merge`,
        mergeSha: synthetic.sha, headSha: pr.head.sha, baseSha: pr.base.sha },
      inputs: Object.fromEntries(PROFILE_INPUTS.map(path =>
        [path, sha256(this.gitOutput('show', `${synthetic.sha}:${path}`))])),
    }
    const composed = this.composedExpected(entry, expected.identity)
    if (split) {
      ensure(validateProfileCases(receipt, expected) === true, 'Unresolved Profile validation')
      const evidence = this.profileEvidence(log, receipt, expected.identity, true, composed)
      if (composed !== undefined) {
        ensure(evidence && typeof evidence.then !== 'function' && evidence.composedVerified === true, 'Unresolved composed Profile evidence')
        return { composedVerified: true, receiptSha256: receipt.receiptSha256, checkId: check.id }
      }
    } else {
      expected.mission10Evidence = this.profileEvidence(log, receipt, expected.identity)
      validateProfileRecovery(receipt, expected)
    }

    row.profileRecoveryVerified = true
    row.profileRecoveryReceiptSha256 = receipt.receiptSha256
    row.profileRecoveryCheckId = check.id
  }
  mission10Evidence(log, receipt, identity, composed) {
    const upload = mission10ArtifactUpload(log, identity.mergeSha)
    const artifacts = this.pages(`repos/${REPO}/actions/runs/${identity.runId}/artifacts`, 'artifacts')
    const matchesArtifact = artifacts.filter(artifact => artifact.name === upload.name || (composed !== undefined && artifact.id === upload.id))
    ensure(matchesArtifact.length === 1, 'Missing or duplicate Mission 10 artifact')
    validateProfileArtifactMetadata(matchesArtifact[0], upload, identity)
    const metadata = this.get(`repos/${REPO}/actions/artifacts/${upload.id}`)
    validateProfileArtifactMetadata(metadata, upload, identity)
    const result = resolveMission10Artifact(this.artifactArchive(upload.id), upload, receipt, composed)
    if (composed !== undefined) ensure(result && typeof result.then !== 'function' && result.composedVerified === true,
      'Unresolved composed Mission10 artifact')
    return result
  }
  verifyMission10Run(entry, pr, synthetic, exact, jobs, row) {
    ensure(exact.status === 'completed' && exact.conclusion === 'success' &&
      exact.event === 'pull_request' && exact.path === GATES[1].workflow && exact.head_sha === pr.head.sha,
      'Mission 10 workflow is not the successful current PR run')
    ensure(['profile-split-v1', SPELL_VISUAL_POLICY, ...GAMEPLAY_RESOURCE_POLICIES].includes(entry.browserPolicy) && synthetic && row.merge === synthetic.sha,
      'Mission 10 requires explicit trusted policy and current synthetic source')
    this.validateBrowserJobs(entry, pr, exact, jobs)
    const expectedJobs = [SPELL_VISUAL_POLICY, ...GAMEPLAY_RESOURCE_POLICIES].includes(entry.browserPolicy) ? 9 : 8
    ensure(jobs.length === expectedJobs && new Set(jobs.map(j => j.id)).size === expectedJobs &&
      jobs.filter(j => j.name === RECOVERY_JOB).length === 1 &&
      jobs.filter(j => j.name === PROFILE_JOB).length === 1 &&
      jobs.filter(j => j.name === 'Tutorial browser').length === 1,
      'Missing, duplicate or extra browser jobs')
    const matches = jobs.filter(j => j.name === MISSION10_JOB)
    ensure(matches.length === 1, 'Missing or duplicate recovery job')
    const job = matches[0]
    ensure(job.run_id === exact.id && job.run_attempt === exact.run_attempt &&
      job.status === 'completed' && job.conclusion === 'success' &&
      MISSION10_STEPS.every(name => job.steps?.filter(s => s.name === name).length === 1 &&
        job.steps.find(s => s.name === name).conclusion === 'success'), 'Mission 10 job did not genuinely succeed')
    ensure(new RegExp(`^https://api\\.github\\.com/repos/${REPO}/check-runs/[1-9][0-9]*$`).test(job.check_run_url),
      'Unexpected recovery check URL')
    const check = this.get(job.check_run_url.slice('https://api.github.com/'.length))
    ensure(check.id === Number(job.check_run_url.split('/').at(-1)) &&
      check.check_suite?.id === exact.check_suite_id && check.head_sha === pr.head.sha &&
      check.name === MISSION10_JOB && check.app?.id === 15368 && check.app?.slug === 'github-actions' &&
      check.status === 'completed' && check.conclusion === 'success', 'Mission 10 check identity/result mismatch')
    const log = stripVTControlCharacters(this.get(`repos/${REPO}/actions/jobs/${job.id}/logs`, true))
    const identity = logIdentity(log)
    ensure(identity.head === pr.head.sha && identity.base === pr.base.sha && identity.merge === synthetic.sha,
      'Mission 10 worker tested a different candidate')
    ensure(this.workflow(GATES[1].workflow, synthetic.sha).sha256 === entry.workflowHashes[GATES[1].workflow],
      'Mission 10 workflow source differs')
    const receipt = mission10CrewLog(log)
    const expected = {
      ...(entry.browserPolicy === SPELL_VISUAL_POLICY ? { policy: SPELL_VISUAL_POLICY, checkpointVersion: entry.browserCheckpointVersion } : {}),
      identity: { repository: REPO, runId: String(exact.id), runAttempt: String(exact.run_attempt),
        workflowRef: `${REPO}/${GATES[1].workflow}@refs/pull/${entry.pr}/merge`,
        mergeSha: synthetic.sha, headSha: pr.head.sha, baseSha: pr.base.sha },
      inputs: Object.fromEntries(MISSION10_INPUTS.map(path =>
        [path, sha256(this.gitOutput('show', `${synthetic.sha}:${path}`))])),
    }
    const composed = this.composedExpected(entry, expected.identity)
    const evidence = this.mission10Evidence(log, receipt, expected.identity, composed)
    if (composed !== undefined) ensure(evidence && typeof evidence.then !== 'function' && evidence.composedVerified === true,
      'Unresolved composed Mission10 evidence')
    expected.mission10Evidence = composed === undefined ? evidence : evidence.phases
    ensure(validateMission10Crew(receipt, expected) === true, 'Unresolved Mission10 validation')
    if (composed !== undefined) return { composedVerified: true, receiptSha256: receipt.receiptSha256, checkId: check.id }

    row.mission10Verified = true
    row.mission10ReceiptSha256 = receipt.receiptSha256
    row.mission10CheckId = check.id
  }
  verifyShardedRun(entry, pr, synthetic, exact, jobs, row, log) {
    ensure(synthetic && row.merge === synthetic.sha, 'Sharded run lacks current synthetic source')
    const specs = [{ name: SHARDED_FULL_GATE.job, steps: SHARDED_FULL_GATE.steps }, ...SHARDED_JOBS,
      ...(entry.fullCheckDiagnostic ? [BASELINE_DIAGNOSTIC] : [])]
    ensure(jobs.length === specs.length && new Set(jobs.map(j => j.id)).size === jobs.length,
      'Missing, duplicate or extra sharded workflow jobs')
    let baselineLog
    for (const spec of specs) {
      const matches = jobs.filter(j => j.name === spec.name)
      ensure(matches.length === 1, 'Missing or duplicate sharded job')
      const j = matches[0]
      const skippedDiagnostic = spec === BASELINE_DIAGNOSTIC && entry.pr !== entry.fullCheckDiagnostic.activationPr
      const conclusion = skippedDiagnostic ? 'skipped' : 'success'
      ensure(j.run_id === exact.id && j.run_attempt === exact.run_attempt &&
        j.status === 'completed' && j.conclusion === conclusion &&
        (skippedDiagnostic ? Array.isArray(j.steps) && j.steps.every(s => s.conclusion === 'skipped') :
          spec.steps.every(name => j.steps?.filter(s => s.name === name).length === 1 &&
            j.steps.find(s => s.name === name).conclusion === 'success')),
        'Sharded job attempt/stage did not genuinely succeed')
      ensure(new RegExp(`^https://api\\.github\\.com/repos/${REPO}/check-runs/[1-9][0-9]*$`).test(j.check_run_url),
        'Unexpected sharded check URL')
      const check = this.get(j.check_run_url.slice('https://api.github.com/'.length))
      ensure(check.id === Number(j.check_run_url.split('/').at(-1)) &&
        check.check_suite?.id === exact.check_suite_id && check.head_sha === pr.head.sha &&
        check.name === spec.name && check.app?.id === 15368 && check.app?.slug === 'github-actions' &&
        check.status === 'completed' && check.conclusion === conclusion, 'Sharded check identity/result mismatch')
      if (skippedDiagnostic) continue
      const workerLog = spec.name === row.job ? log :
        stripVTControlCharacters(this.get(`repos/${REPO}/actions/jobs/${j.id}/logs`, true))
      if (spec === BASELINE_DIAGNOSTIC) baselineLog = workerLog
      const identity = logIdentity(workerLog)
      ensure(identity.head === pr.head.sha && identity.base === pr.base.sha && identity.merge === synthetic.sha,
        'Sharded worker tested a different candidate')
    }
    const receipt = shardedLogReceipt(log)
    ensure(receipt.identity?.workflowSha === synthetic.sha &&
      receipt.identity.workflowRef === `${REPO}/${SHARDED_FULL_GATE.workflow}@refs/pull/${entry.pr}/merge` &&
      this.workflow(SHARDED_FULL_GATE.workflow, receipt.identity.workflowSha).sha256 ===
        entry.workflowHashes[SHARDED_FULL_GATE.workflow], 'Sharded workflow source/ref differs')
    const identity = { repository: REPO, runId: String(exact.id), runAttempt: String(exact.run_attempt),
      workflowRef: receipt.identity.workflowRef, workflowSha: receipt.identity.workflowSha,
      mergeSha: synthetic.sha, headSha: pr.head.sha, baseSha: pr.base.sha, treeSha: synthetic.tree,
      workflowSha256: entry.workflowHashes[SHARDED_FULL_GATE.workflow] }
    const files = this.git('ls-tree', '-r', '--name-only', synthetic.sha, '--', 'tests').split('\n')
      .filter(file => /^tests\/[^./\0\r\n][^/\0\r\n]*\.test\.mjs$/.test(file)).sort()
    const inventory = files.map(file => ({ file, sha256: sha256(this.gitOutput('show', `${synthetic.sha}:${file}`)) }))
    const packageJson = this.gitOutput('show', `${synthetic.sha}:package.json`)
    const packageManager = JSON.parse(packageJson).packageManager ?? 'npm@11.9.0'
    ensure(['npm@11.9.0', 'pnpm@11.25.0'].includes(packageManager), 'Unsupported source package-manager policy')
    validateShardedReceipt(receipt, { identity, inventory, packageManager,
      ...(packageManager === 'pnpm@11.25.0' ? {
        packageJsonSha256: sha256(packageJson),
        pnpmLockSha256: sha256(this.gitOutput('show', `${synthetic.sha}:pnpm-lock.yaml`)),
        workspaceSha256: sha256(this.gitOutput('show', `${synthetic.sha}:pnpm-workspace.yaml`)),
      } : {}),
      lockSha256: sha256(this.gitOutput('show', `${synthetic.sha}:package-lock.json`)),
      ...(receipt.runtime?.timingReporterSha256 !== undefined ? {
        timingReporterSha256: sha256(this.gitOutput('show', `${synthetic.sha}:scripts/orchestration/test-timing-reporter.mjs`)),
      } : {}) })
    if (baselineLog !== undefined) validateBaselineLog(baselineLog, inventory)
    row.shardedVerified = true
    row.shardedReceiptSha256 = sha256(JSON.stringify(receipt))
  }
  inspect(entry, allowlistDirectory) { return this.inspectMode(entry, allowlistDirectory, false) }
  // Explicit narrower observation surface: never an integration-policy fallback.
  inspectAdmission(entry, allowlistDirectory) { return this.inspectMode(entry, allowlistDirectory, true) }
  inspectMode(entry, allowlistDirectory, admissionOnly) {
    validateEntry(entry)
    const start = Date.now()
    const root = `repos/${REPO}`
    const result = {
      repo: REPO,
      pr: entry.pr,
      baseRef: entry.baseRef,
      observedAt: start,
      complete: false,
      consistent: false,
    }
    try {
      ensure(
        !this.git('status', '--porcelain', '--untracked-files=normal'),
        'Candidate checkout must be clean'
      )
      result.reviewDigest = sha256(readFileSync(resolve(allowlistDirectory, entry.review.file)))
      ensure(
        result.reviewDigest === entry.review.sha256,
        'Local review receipt digest differs from approved allowlist'
      )
      const pr = this.get(`${root}/pulls/${entry.pr}`)
      ensure(
        pr.base.repo.full_name === REPO &&
          pr.head.repo.full_name === REPO &&
          pr.base.ref === 'main',
        'Only same-repository main PRs are supported'
      )
      const main = this.get(`${root}/git/ref/heads/main`).object.sha
      Object.assign(result, {
        head: pr.head.sha,
        headRef: pr.head.ref,
        base: main,
        advertisedBase: { sha: pr.base.sha, ref: pr.base.ref, repo: pr.base.repo.full_name },
        draft: pr.draft,
        state: pr.state,
        merged: pr.merged,
        mergeable: pr.mergeable,
        mergeState: pr.mergeable_state,
        headCommit: this.commit(pr.head.sha),
      })
      if (pr.head.sha !== entry.sourceHead) {
        ensure(
          result.headCommit.parents.length === 2 &&
            result.headCommit.parents[0] === entry.sourceHead,
          'Changed head is not a single merge of the reviewed source'
        )
        const source = this.commit(entry.sourceHead)
        ensure(source.tree === entry.sourceTree, 'Reviewed source tree mismatch')
        result.acceptedRefresh = this.refresh(entry, entry.sourceHead, result.headCommit.parents[1])
      }
      result.protection = admissionOnly ? { unverified: 'admission-only; no merge authority' } : this.protection()
      result.workflows = GATES.flatMap(g => [
        this.workflow(g.workflow, pr.head.sha),
        this.workflow(g.workflow, main),
      ])
      if (pr.merged) {
        result.mergeCommit = this.commit(pr.merge_commit_sha)
        if (entry.deployment.kind === 'cloudflare-check') {
          result.deployment = cloudflareCheck(
            this.pages(
              `${root}/commits/${pr.merge_commit_sha}/check-runs?filter=all`,
              'check_runs'
            ),
            pr.merge_commit_sha
          )
        } else if (entry.deployment.kind !== 'unverified') {
          const deployments = this.pages(
            `${root}/deployments?sha=${pr.merge_commit_sha}&environment=${encodeURIComponent(entry.deployment.environment)}`
          )
          const deployment = deployments.toSorted((a, b) => b.id - a.id)[0]
          if (deployment) {
            const statuses = this.pages(`${root}/deployments/${deployment.id}/statuses`).toSorted(
              (a, b) => b.id - a.id
            )
            if (statuses[0])
              result.deployment = {
                sha: deployment.sha,
                environment: deployment.environment,
                state: statuses[0].state,
                url: statuses[0].environment_url,
              }
          }
        }
      } else {
        result.upToDate = this.git('merge-base', main, pr.head.sha) === main
        result.changedPaths = this.git(
          'diff',
          '--no-ext-diff',
          '--no-textconv',
          '--name-only',
          '-z',
          '--no-renames',
          `${main}...${pr.head.sha}`,
          '--'
        )
          .split('\0')
          .filter(Boolean)
        if (!result.upToDate && pr.head.sha === entry.sourceHead)
          result.refresh = this.refresh(entry, pr.head.sha, main)
        if (pr.base.sha !== main && result.upToDate) {
          // Metadata-only reconciliation is distinct from merging main into a
          // stale source. Admission-only callers have no authority for this effect.
          ensure(
            !admissionOnly && pr.state === 'open' && pr.draft === true &&
              pr.mergeable === true && main === entry.reviewBase &&
              pr.head.sha === entry.sourceHead && result.headCommit.tree === entry.sourceTree &&
              sha(pr.base.sha) && this.git('merge-base', pr.base.sha, main) === pr.base.sha,
            'Stale PR base metadata lacks exact reviewed current-main draft proof'
          )
          result.synthetic = this.commit(pr.merge_commit_sha)
          ensure(
            result.synthetic.parents.length === 2 &&
              result.synthetic.parents[0] === main && result.synthetic.parents[1] === pr.head.sha &&
              result.synthetic.tree === entry.sourceTree,
            'Stale PR base metadata has unexpected synthetic parents or tree'
          )
          result.baseMetadataRefreshOnly = true
          result.workflows.push(...GATES.map(g => this.workflow(g.workflow, result.synthetic.sha)))
        } else if (pr.base.sha !== main) {
          ensure(
            pr.state === 'open' &&
              pr.draft === true &&
              pr.mergeable === true &&
              pr.mergeable_state === 'behind' &&
              pr.base.sha === entry.reviewBase &&
              pr.head.sha === entry.sourceHead &&
              result.headCommit.tree === entry.sourceTree &&
              entry.allowMechanicalRefresh === true &&
              result.upToDate === false &&
              result.refresh?.clean === true &&
              result.refresh.disjoint === true,
            'Stale PR base lacks exact reviewed draft refresh proof'
          )
          const stale = this.commit(pr.merge_commit_sha)
          ensure(
            stale.parents.length === 2 &&
              stale.parents[0] === entry.reviewBase &&
              stale.parents[1] === entry.sourceHead,
            'Stale synthetic does not match the reviewed base and source'
          )
          result.refreshOnly = true
          result.staleSynthetic = stale
        } else if (pr.mergeable === true && sha(pr.merge_commit_sha)) {
          result.synthetic = this.commit(pr.merge_commit_sha)
          result.workflows.push(...GATES.map(g => this.workflow(g.workflow, result.synthetic.sha)))
        }
        result.runs = this.runs(entry, pr, result.synthetic)
        result.currentChecks = this.pages(
          `${root}/commits/${pr.head.sha}/check-runs?filter=all`,
          'check_runs'
        )
          .filter(c => c.app?.id === 15368 && gatesFor(entry).some(g =>
            [g.job, g.recoveryJob, g.profileJob, g.mission10Job, g.spellVisualsJob, g.gameplayResourcesJob].includes(c.name)))
          .map(c => ({
            id: c.id,
            name: c.name,
            appId: c.app.id,
            head: c.head_sha,
            startedAt: c.started_at,
            status: c.status,
            conclusion: c.conclusion,
          }))
      }
      const endPr = this.get(`${root}/pulls/${entry.pr}`)
      const endMain = this.get(`${root}/git/ref/heads/main`).object.sha
      result.consistent =
        endPr.head.sha === result.head &&
        endPr.head.ref === pr.head.ref &&
        endPr.base.sha === pr.base.sha &&
        endPr.base.ref === pr.base.ref &&
        endPr.base.repo.full_name === pr.base.repo.full_name &&
        endPr.head.repo.full_name === pr.head.repo.full_name &&
        endPr.state === pr.state &&
        endPr.mergeable === pr.mergeable &&
        endPr.mergeable_state === pr.mergeable_state &&
        endMain === main &&
        endPr.draft === pr.draft &&
        endPr.merged === pr.merged &&
        endPr.merge_commit_sha === pr.merge_commit_sha &&
        endPr.updated_at === pr.updated_at
      result.complete = true
      result.observedAt = Date.now()
    } catch (error) {
      // GH errors may include request details; retain a concise diagnostic, never env/auth output.
      result.error = stripVTControlCharacters(String(error.message)).split('\n')[0]
    }
    return result
  }
}

export function checkoutSha(log) {
  const lines = stripVTControlCharacters(log)
    .split('\n')
    .map(l => l.replace(/^\d{4}-\d\d-\d\dT\S+\s+/, '').trim())
  const hashes = lines.flatMap((line, i) =>
    /(?:^|\/)git log -1 --format=%H$/.test(line) && sha(lines[i + 1]) ? [lines[i + 1]] : []
  )
  return hashes.length === 1 ? hashes[0] : null
}

export function logIdentity(log) {
  const unique = name => {
    const values = [
      ...new Set(
        [
          ...log.matchAll(
            new RegExp(`(?:^|\\n)[^\\n]*?\\b${name}: ([0-9a-f]{40})\\s*(?=\\n|$)`, 'g')
          ),
        ].map(m => m[1])
      ),
    ]
    return values.length === 1 ? values[0] : null
  }
  return { head: unique('PR_HEAD_SHA'), base: unique('PR_BASE_SHA'), merge: checkoutSha(log) }
}

export function cloudflareCheck(checks, commit) {
  const matches = checks
    .filter(c => c.name === CLOUDFLARE.name && c.app?.id === CLOUDFLARE.appId)
    .toSorted((a, b) => Date.parse(b.started_at) - Date.parse(a.started_at))
  if (!matches.length) return null
  const c = matches[0]
  const build = c.details_url?.startsWith(CLOUDFLARE.productionBuildPrefix)
    ? c.details_url.slice(CLOUDFLARE.productionBuildPrefix.length)
    : ''
  const identityVerified =
    matches.every(item => Number.isFinite(Date.parse(item.started_at))) &&
    (matches.length === 1 ||
      Date.parse(matches[0].started_at) !== Date.parse(matches[1].started_at)) &&
    c.head_sha === commit &&
    c.app?.slug === CLOUDFLARE.appSlug &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(build)
  return {
    ...CLOUDFLARE,
    sha: c.head_sha,
    identityVerified,
    checkId: c.id,
    startedAt: c.started_at,
    detailsUrl: c.details_url,
    state:
      c.status === 'completed'
        ? c.conclusion === 'success'
          ? 'success'
          : 'failed'
        : ['queued', 'in_progress'].includes(c.status)
          ? 'pending'
          : 'unknown',
    conclusion: c.conclusion,
  }
}

export function assertSafeGitConfiguration(raw) {
  const keys = raw
    .split('\0')
    .filter(Boolean)
    .map(item => item.split('\n', 1)[0].toLowerCase())
  ensure(
    !keys.some(key => /^(?:merge\..*\.driver|filter\..*\.(?:clean|smudge|process))$/.test(key)),
    'Custom Git merge/filter drivers rejected before inspecting working files'
  )
}

