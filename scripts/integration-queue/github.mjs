import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { stripVTControlCharacters } from 'node:util'
import { CLOUDFLARE, GATES, REPO, sha256, validateEntry } from './policy.mjs'

const sha = value => /^[0-9a-f]{40}$/.test(value ?? '')
const ensure = (condition, message) => {
  if (!condition) throw new Error(message)
}
const run = (file, args, cwd) =>
  execFileSync(file, args, {
    cwd,
    encoding: 'utf8',
    timeout: 30_000,
    maxBuffer: 16 * 1024 * 1024,
    env: { ...process.env, GH_PROMPT_DISABLED: '1', GH_PAGER: 'cat' },
  })

// This reader only issues GET requests. The separately armed writer owns mutations.
export class GitHubReader {
  constructor({ cwd = process.cwd(), execute = run } = {}) {
    this.cwd = cwd
    this.execute = execute
  }
  get(endpoint, text = false) {
    ensure(
      endpoint.startsWith(`repos/${REPO}/`) && !endpoint.includes('..'),
      'Unexpected GitHub endpoint'
    )
    const raw = this.execute(
      'gh',
      ['api', '--hostname', 'github.com', '--method', 'GET', endpoint],
      this.cwd
    )
    return text ? raw : JSON.parse(raw)
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
  git(...args) {
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
    return this.execute('git', [...prefix, ...args], this.cwd).trim()
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
    for (const gate of GATES) {
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
            j => j.name === gate.job || j.name === 'Draft PR (not validated)'
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
          const log = this.get(`repos/${REPO}/actions/jobs/${job.id}/logs`, true)
          const identity = logIdentity(log)
          row.head = identity.head ?? row.head
          row.base = identity.base ?? row.base
          row.merge = identity.merge
          row.logSha256 = sha256(log)
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
          row.draftAdmission =
            job.name === 'Draft PR (not validated)' &&
            row.workflowSha256 === entry.workflowHashes[gate.workflow] &&
            exact.conclusion === 'failure' &&
            job.conclusion === 'failure' &&
            check.conclusion === 'failure' &&
            /(?:^|\n)[^\n]*?\bIS_DRAFT: true\s*(?=\n|$)/.test(log) &&
            stage('Require a ready pull request', 'failure') &&
            gate.steps.slice(1).every(name => stage(name, 'skipped'))
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
  inspect(entry, allowlistDirectory) {
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
        base: main,
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
      result.protection = this.protection()
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
        ensure(pr.base.sha === main, 'PR base view differs from main; obtain a fresh observation')
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
        if (pr.mergeable === true && sha(pr.merge_commit_sha)) {
          result.synthetic = this.commit(pr.merge_commit_sha)
          result.workflows.push(...GATES.map(g => this.workflow(g.workflow, result.synthetic.sha)))
        }
        result.runs = this.runs(entry, pr, result.synthetic)
        result.currentChecks = this.pages(
          `${root}/commits/${pr.head.sha}/check-runs?filter=all`,
          'check_runs'
        )
          .filter(c => c.app?.id === 15368 && GATES.some(g => g.job === c.name))
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
        endMain === main &&
        endPr.draft === pr.draft &&
        endPr.merged === pr.merged &&
        endPr.merge_commit_sha === pr.merge_commit_sha &&
        endPr.updated_at === pr.updated_at
      result.complete = true
      result.observedAt = Date.now()
    } catch (error) {
      // GH errors may include request details; retain a concise diagnostic, never env/auth output.
      result.error = String(error.message).split('\n')[0]
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
    .toSorted((a, b) => b.id - a.id)
  if (!matches.length) return null
  const c = matches[0]
  const build = c.details_url?.startsWith(CLOUDFLARE.productionBuildPrefix)
    ? c.details_url.slice(CLOUDFLARE.productionBuildPrefix.length)
    : ''
  const identityVerified =
    c.head_sha === commit &&
    c.app?.slug === CLOUDFLARE.appSlug &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(build)
  return {
    ...CLOUDFLARE,
    sha: c.head_sha,
    identityVerified,
    checkId: c.id,
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
