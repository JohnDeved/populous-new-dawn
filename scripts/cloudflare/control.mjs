// Trusted default-branch controller. Artifacts are data, never imported/executed.
import assert from 'node:assert/strict'
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'
import { readArtifactZip } from '../artifact-zip.mjs'
import { account, worker, repository, buildPath, publishPath, marker, maxArchiveBytes,
  positive, sha, branchAlias, publisherSource, validateRun, currentPreview,
  materializeBuild, uploadedVersion, renderComment } from './protocol.mjs'

const prefix = `/repos/${repository}`
const gatePath = '.github/workflows/ready-pr-check.yml'
const resultFile = new URL('../../cloudflare-result.json', import.meta.url)
const local = path => readFileSync(new URL(`../../${path}`, import.meta.url))
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
export async function bodyBytes(response, limit) {
  assert.ok(response.ok, `Request failed (${response.status})`)
  const chunks = []; let size = 0
  for await (const chunk of response.body) {
    size += chunk.length; assert.ok(size <= limit, 'Response exceeds bounded size'); chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}
export function githubClient(token) {
  assert.ok(token, 'GitHub token missing')
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }
  const api = async (path, { method = 'GET', body } = {}) => {
    assert.ok(path.startsWith(`${prefix}/`), 'Unexpected GitHub target')
    const response = await fetch(`https://api.github.com${path}`, { method, redirect: 'error',
      headers: { ...headers, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) })
    return JSON.parse(await bodyBytes(response, 4 * 1024 * 1024))
  }
  const download = async (id, maximum) => {
    assert.ok(positive(id))
    const response = await fetch(`https://api.github.com${prefix}/actions/artifacts/${id}/zip`, { redirect: 'manual', headers })
    assert.equal(response.status, 302, 'Expected GitHub artifact redirect')
    const url = new URL(response.headers.get('location')); assert.equal(url.protocol, 'https:')
    // Never forward the GitHub token to storage. Only GitHub's returned URL.
    return bodyBytes(await fetch(url, { redirect: 'error' }), maximum)
  }
  return { api, download }
}
export async function verifiedRun(api, id, path) {
  assert.ok(positive(id)); const run = await api(`${prefix}/actions/runs/${id}`)
  validateRun(run, path); assert.equal(run.id, id)
  const workflow = await api(`${prefix}/actions/workflows/${run.workflow_id}`)
  assert.equal(workflow.path, path)
  return run
}
export async function exactFile(api, path, ref, expected = local(path)) {
  assert.ok(sha(ref))
  const file = await api(`${prefix}/contents/${path}?ref=${ref}`)
  assert.equal(file.type, 'file'); assert.equal(file.encoding, 'base64'); assert.ok(file.size <= 100000)
  assert.ok(Buffer.from(file.content, 'base64').equals(expected), `Untrusted workflow revision: ${path}`)
}
export async function runPr(api, run) {
  if (run.event !== 'pull_request' || run.pull_requests?.length !== 1) return null
  const number = run.pull_requests[0].number; assert.ok(positive(number))
  const pr = await api(`${prefix}/pulls/${number}`)
  assert.equal(pr.number, number); assert.equal(pr.base.repo.full_name, repository)
  return pr
}
export async function currentSource(api, run, pr) {
  const latest = await api(`${prefix}/actions/runs/${run.id}`)
  if (latest.run_attempt !== run.run_attempt) return false
  if (pr) {
    if (!currentPreview(run, await api(`${prefix}/pulls/${pr.number}`))) return false
    return !await newerBuild(api, run, pr.number)
  }
  if (run.event !== 'push' || run.head_branch !== 'main') return false
  return (await api(`${prefix}/git/ref/heads/main`)).object.sha === run.head_sha
}
export async function newerBuild(api, run, prNumber) {
  const list = await api(`${prefix}/actions/workflows/cloudflare-build.yml/runs?event=pull_request&head_sha=${run.head_sha}&per_page=100`)
  assert.ok(list.total_count <= 100 && list.workflow_runs.length === list.total_count, 'Incomplete build inventory')
  return list.workflow_runs.some(item => item.path === buildPath && item.head_sha === run.head_sha &&
    item.pull_requests?.some(pr => pr.number === prNumber) &&
    (item.id > run.id || (item.id === run.id && item.run_attempt > run.run_attempt)))
}
export async function artifacts(api, run) {
  const list = await api(`${prefix}/actions/runs/${run.id}/artifacts?per_page=100`)
  assert.ok(list.total_count <= 100 && list.artifacts.length === list.total_count, 'Incomplete artifact inventory')
  return list.artifacts
}
export async function oneArtifact(api, download, run, name, maximum, optional = false) {
  const matches = (await artifacts(api, run)).filter(item => item.name === name)
  assert.ok(matches.length <= 1, 'Duplicate artifact')
  if (!matches.length && optional) return null
  assert.equal(matches.length, 1, 'Required artifact missing')
  const item = matches[0]
  assert.equal(item.expired, false); assert.equal(item.workflow_run.id, run.id)
  assert.ok(positive(item.id) && item.size_in_bytes > 0 && item.size_in_bytes <= maximum, 'Invalid artifact size')
  assert.match(item.digest ?? '', /^sha256:[a-f0-9]{64}$/, 'Missing artifact SHA-256 digest')
  const bytes = await download(item.id, maximum)
  assert.equal(`sha256:${hash(bytes)}`, item.digest, 'Artifact SHA-256 mismatch')
  return bytes
}
function jsonArtifact(zip, name, maximum = 1024 * 1024) {
  const files = readArtifactZip(zip, { maxArchiveBytes: maximum, maxTotalBytes: maximum,
    maxFileBytes: maximum, maxEntries: 1, allowName: file => file === name })
  assert.ok(files.has(name)); return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(files.get(name)))
}
function mergedGateSource(gate, pr) {
  // GitHub may clear run.pull_requests after merge. That transient metadata is
  // only a consistency check; the merged PR, exact source and tested tree bind
  // production. Missing/malformed or explicitly conflicting metadata still fails.
  return Array.isArray(gate.pull_requests) && (gate.pull_requests.length === 0 ||
    (gate.pull_requests.length === 1 && gate.pull_requests[0]?.number === pr.number)) &&
    gate.repository?.full_name === repository && gate.head_repository?.full_name === pr.head.repo?.full_name &&
    gate.path === gatePath && gate.event === 'pull_request' && gate.status === 'completed' &&
    gate.conclusion === 'success' && gate.head_sha === pr.head.sha && gate.head_branch === pr.head.ref
}
export async function productionGate(api, download, run) {
  assert.equal(run.event, 'push'); assert.equal(run.head_branch, 'main')
  const associated = await api(`${prefix}/commits/${run.head_sha}/pulls?per_page=100`)
  assert.ok(associated.length < 100, 'Incomplete PR association')
  const prs = associated.filter(pr => pr.merged_at && pr.base.ref === 'main' && pr.merge_commit_sha === run.head_sha)
  assert.equal(prs.length, 1, 'Production requires a merged PR, not a direct push')
  const pr = await api(`${prefix}/pulls/${prs[0].number}`)
  assert.equal(pr.number, prs[0].number); assert.equal(pr.base.ref, 'main'); assert.equal(pr.base.repo.full_name, repository)
  assert.equal(pr.merged, true); assert.equal(pr.merge_commit_sha, run.head_sha)
  assert.ok(positive(pr.number) && sha(pr.head.sha) && pr.head.repo?.full_name, 'Invalid merged PR source')
  const list = await api(`${prefix}/actions/workflows/ready-pr-check.yml/runs?event=pull_request&status=success&head_sha=${pr.head.sha}&per_page=100`)
  assert.ok(list.total_count <= 100 && list.workflow_runs.length === list.total_count, 'Incomplete gate inventory')
  const candidates = list.workflow_runs.filter(gate => mergedGateSource(gate, pr))
    .sort((a, b) => b.id - a.id)
  assert.ok(candidates.length, 'No successful trusted ready-PR gate')
  const gate = await verifiedRun(api, candidates[0].id, gatePath)
  assert.ok(mergedGateSource(gate, pr), 'Ready-PR gate source does not match the merged PR')
  await exactFile(api, gatePath, gate.head_sha)
  const jobs = await api(`${prefix}/actions/runs/${gate.id}/attempts/${gate.run_attempt}/jobs?per_page=100`)
  assert.ok(jobs.total_count <= 100 && jobs.jobs.length === jobs.total_count)
  for (const name of ['Quality and build', ...[1, 2, 3, 4].map(n => `Test shard ${n}/4`), 'Full check']) {
    const matching = jobs.jobs.filter(job => job.name === name)
    assert.equal(matching.length, 1); assert.equal(matching[0].conclusion, 'success', `Gate did not pass: ${name}`)
  }
  const zip = await oneArtifact(api, download, gate, `full-check-${gate.id}-${gate.run_attempt}-quality`, 2 * 1024 * 1024)
  const receipt = jsonArtifact(zip, 'receipt.json', 2 * 1024 * 1024)
  assert.equal(receipt.kind, 'quality'); assert.equal(receipt.status, 'passed')
  assert.equal(receipt.identity.repository, repository); assert.equal(receipt.identity.headSha, pr.head.sha)
  assert.equal(receipt.identity.runId, String(gate.id)); assert.equal(receipt.identity.runAttempt, String(gate.run_attempt))
  assert.equal(receipt.identity.workflowSha256, hash(local(gatePath)))
  const commit = await api(`${prefix}/git/commits/${run.head_sha}`)
  assert.equal(receipt.identity.treeSha, commit.tree.sha, 'Production tree differs from the tested proposed merge')
  return { pr: pr.number, gate: gate.id, tree: commit.tree.sha }
}
export async function prepare({ api, download, runId, mode, destination }) {
  const run = await verifiedRun(api, runId, buildPath)
  assert.equal(run.status, 'completed'); assert.equal(run.conclusion, 'success')
  const pr = await runPr(api, run)
  if (!['preview', 'enabled'].includes(mode) || (!pr && mode !== 'enabled')) return null
  if (!await currentSource(api, run, pr)) return null
  assert.equal(run.head_repository?.full_name, repository, 'No fork deployment')
  await exactFile(api, buildPath, run.head_sha)
  const gate = pr ? null : await productionGate(api, download, run)
  const zip = await oneArtifact(api, download, run, `cloudflare-dist-${run.id}-${run.run_attempt}`, maxArchiveBytes)
  materializeBuild(zip, destination, run.head_sha)
  return { version: 1, source: run.id, sourceAttempt: run.run_attempt, sha: run.head_sha,
    pr: pr?.number ?? null, alias: pr ? branchAlias(pr.head.ref) : null, gate, status: 'prepared' }
}
export async function cfRequest(path, input = {}) {
  let url, options
  try {
    const { method = 'GET', body } = input
    assert.ok(typeof path === 'string' && path.startsWith(`/accounts/${account}/workers/scripts/${worker}/`))
    const token = process.env.CLOUDFLARE_API_TOKEN
    // RFC 6750 bearer syntax, checked verbatim. Never repair an ambiguous value
    // by trimming whitespace or joining lines before using it as a credential.
    assert.ok(typeof token === 'string' && /^[A-Za-z0-9._~+/-]+=*/.exec(token)?.[0] === token)
    url = `https://api.cloudflare.com/client/v4${path}`
    options = { method, redirect: 'error',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}) }
    // Validate URL/method/headers/body before fetch, whose errors may include
    // credential bytes. Keep the original exact request arguments unchanged.
    new Request(url, options)
  } catch {
    throw new Error('Cloudflare request not sent: invalid credential or request input.')
  }
  let response
  try {
    response = await fetch(url, options)
  } catch {
    // Never retain the original error (including its cause or stack).
    throw new Error('Cloudflare transport failed; remote outcome is uncertain. Inspect before retrying.')
  }
  let status
  try {
    const candidate = response.status
    if (Number.isInteger(candidate) && candidate >= 100 && candidate <= 599) status = candidate
    // Do not let the shared reader stringify an arbitrary status value. Accessor
    // failures are caught too; only the validated integer may reach diagnostics.
    const result = JSON.parse(await bodyBytes({ ok: response.ok, status, body: response.body }, 1024 * 1024))
    if (result?.success !== true) throw new Error()
    return result.result
  } catch {
    // Covers HTTP failure, stream/size/JSON errors and unsuccessful API results.
    // AssertionError.actual and parser messages can otherwise echo response data.
    throw new Error(`Cloudflare response did not confirm success${status === undefined ? '' : ` (HTTP ${status})`}; remote outcome is uncertain. Inspect before retrying.`)
  }
}
export async function ensureCurrent(api, state) {
  const run = await verifiedRun(api, state.source, buildPath), pr = await runPr(api, run)
  assert.equal(run.head_sha, state.sha); assert.equal(run.run_attempt, state.sourceAttempt)
  assert.ok(await currentSource(api, run, pr), 'Source was superseded; refusing publication')
  return { run, pr }
}
export async function route(api, eventRun) {
  const path = eventRun.path
  assert.ok([buildPath, publishPath].includes(path))
  const run = await verifiedRun(api, eventRun.id, path)
  let source = run
  if (path === publishPath) {
    await exactFile(api, publishPath, run.head_sha)
    source = await verifiedRun(api, publisherSource(run).source, buildPath)
  }
  const pr = await runPr(api, source)
  return pr ? { source: source.id, pr: pr.number } : null
}
export async function report({ api, download, sourceId, expectedPr, mode, reportRun, diagnose = () => {} }) {
  const run = await verifiedRun(api, sourceId, buildPath), pr = await runPr(api, run)
  if (!pr || pr.number !== expectedPr || pr.state !== 'open' || pr.head.sha !== run.head_sha) return 'stale'
  let status, outcome = 'skipped', publication = null, urls = null
  const current = async () => {
    const latestPr = await api(`${prefix}/pulls/${pr.number}`)
    const latestRun = await api(`${prefix}/actions/runs/${run.id}`)
    if (publication) {
      const latest = await verifiedRun(api, publication.id, publishPath)
      if (latest.run_attempt !== publication.run_attempt || latest.status !== publication.status || latest.conclusion !== publication.conclusion || latest.updated_at !== publication.updated_at) return false
    }
    return latestPr.state === 'open' && latestPr.base.ref === 'main' && latestPr.head.sha === run.head_sha && latestRun.run_attempt === run.run_attempt && latestRun.status === run.status &&
      latestRun.conclusion === run.conclusion && latestRun.updated_at === run.updated_at && !await newerBuild(api, run, pr.number)
  }
  if (pr.head.repo?.full_name !== repository) status = 'Skipped: fork previews are not published to this account.'
  else if (run.status !== 'completed') { outcome = 'pending'; status = 'Building on GitHub Actions.' }
  else if (run.conclusion !== 'success') {
    outcome = run.conclusion === 'cancelled' ? 'cancelled' : run.conclusion === 'skipped' ? 'skipped' : 'failure'
    status = `Build ${run.conclusion || 'unknown'}; not published.`
  }
  else if (!['preview', 'enabled'].includes(mode)) status = 'Build succeeded; publishing is disabled pending setup/cutover.'
  else {
    const list = await api(`${prefix}/actions/workflows/cloudflare-publish.yml/runs?event=workflow_run&per_page=100`)
    assert.ok(list.workflow_runs.length <= 100)
    // A bounded recent window is enough for active runs. If absent, report
    // unknown/queued, never manufacture success or replay a deployment.
    const matching = list.workflow_runs.filter(item => {
      if (item.path !== publishPath) return false
      const match = /^Cloudflare publish build (\d+) attempt (\d+)$/.exec(item.display_title)
      return match && Number(match[1]) === run.id && Number(match[2]) === run.run_attempt
    }).sort((a, b) => b.id - a.id || b.run_attempt - a.run_attempt)
    if (!matching.length) { outcome = 'pending'; status = 'Build succeeded; publication queued or not yet observed.' }
    else {
      publication = await verifiedRun(api, matching[0].id, publishPath)
      await exactFile(api, publishPath, publication.head_sha)
      if (publication.status !== 'completed') { outcome = 'pending'; status = 'Build succeeded; publishing preview.' }
      else if (publication.conclusion !== 'success') {
        outcome = publication.conclusion === 'cancelled' ? 'cancelled' : publication.conclusion === 'skipped' ? 'skipped' : 'failure'
        status = `Publication ${publication.conclusion || 'unknown'}; remote outcome is not verified.`
      }
      else {
        try {
          const zip = await oneArtifact(api, download, publication,
            `cloudflare-result-${publication.id}-${publication.run_attempt}`, 65536, true)
          if (!zip) status = 'Publication skipped or result unavailable; no verified deployment.'
          else {
            const result = jsonArtifact(zip, 'cloudflare-result.json', 65536)
            assert.equal(result.version, 1); assert.equal(result.source, run.id); assert.equal(result.sourceAttempt, run.run_attempt)
            assert.equal(result.sha, run.head_sha); assert.equal(result.pr, pr.number)
            assert.equal(result.status, 'preview-published')
            assert.equal(result.alias, branchAlias(pr.head.ref))
            urls = uploadedVersion(result.output, result.alias)
            outcome = 'success'; status = 'Preview published successfully. Production unchanged.'
          }
        } catch {
          // Bad/missing evidence must clear prior success, not leave stale links.
          urls = null; status = 'Publication result could not be verified; no verified deployment.'
        }
      }
    }
  }
  let comments = []
  for (let page = 1; page <= 10; page++) {
    const items = await api(`${prefix}/issues/${pr.number}/comments?per_page=100&page=${page}`)
    comments.push(...items)
    if (items.length < 100) break
    assert.ok(page < 10, 'Incomplete comment inventory')
  }
  const owned = comments.filter(item => item.user?.id === 41898282 && item.user.type === 'Bot' &&
    item.user.login === 'github-actions[bot]' && item.body?.startsWith(marker))
  assert.ok(owned.length <= 1, 'Ambiguous owned preview comments')
  if (owned[0]) {
    const previous = /<!-- source:(\d+):(\d+) -->/.exec(owned[0].body)
    assert.ok(previous, 'Unknown comment provenance')
    if (Number(previous[1]) > run.id || (Number(previous[1]) === run.id && Number(previous[2]) > run.run_attempt)) return 'older'
  }
  // The visible native template has one View logs link. Send it to this trusted
  // report, whose summary explains disabled/unverified states and links both
  // pipeline stages, so exact presentation does not hide actionable diagnostics.
  diagnose({ status, run, publication })
  const body = renderComment({ run, outcome, publication, urls, diagnostic: status, logsRun: reportRun || publication || run })
  // Keep the prior diagnostic-run link when everything it explains is identical.
  // Otherwise a fresh reporter run ID would manufacture a comment edit every time.
  const stableBody = text => text?.replace(/\[View logs\]\(https:\/\/github\.com\/JohnDeved\/populous-new-dawn\/actions\/runs\/\d+\/attempts\/\d+\)/,
    '[View logs](trusted-report)')
  if (stableBody(owned[0]?.body) === stableBody(body)) return 'unchanged'
  if (!await current()) return 'stale'
  await api(owned.length ? `${prefix}/issues/comments/${owned[0].id}` : `${prefix}/issues/${pr.number}/comments`,
    { method: owned.length ? 'PATCH' : 'POST', body: { body } })
  return owned.length ? 'updated' : 'created'
}
export async function main() {
  assert.equal(process.env.GITHUB_REPOSITORY, repository)
  assert.equal(process.env.GITHUB_EVENT_NAME, 'workflow_run')
  assert.equal(process.env.GITHUB_REF, 'refs/heads/main', 'Only trusted main workflows may publish/report')
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'))
  const { api, download } = githubClient(process.env.GITHUB_TOKEN)
  const output = (key, value) => { assert.match(key, /^[a-zA-Z]+$/); assert.ok(!String(value).includes('\n')); appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`) }
  const mode = process.env.CLOUDFLARE_ACTIONS_MODE
  const command = process.argv[2]
  if (command === 'route') {
    const routed = await route(api, event.workflow_run)
    if (routed) for (const [key, value] of Object.entries(routed)) output(key, value)
  } else if (command === 'report') {
    console.log(await report({ api, download, sourceId: Number(process.env.SOURCE_RUN_ID), expectedPr: Number(process.env.EXPECTED_PR), mode,
      reportRun: { id: Number(process.env.GITHUB_RUN_ID), run_attempt: Number(process.env.GITHUB_RUN_ATTEMPT) },
      diagnose: ({ status, run, publication }) => {
        console.log(status)
        const logs = (name, source) => `[${name}](https://github.com/${repository}/actions/runs/${source.id}/attempts/${source.run_attempt})`
        appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${status}\n\n${logs('Build logs', run)}\n\n${publication ? logs('Publish logs', publication) : 'No publisher run was observed.'}\n`)
      } }))
  } else if (command === 'prepare') {
    const state = await prepare({ api, download, runId: event.workflow_run.id, mode, destination: '.cloudflare-publisher' })
    output('publish', Boolean(state))
    if (state) {
      writeFileSync(resultFile, JSON.stringify(state)); output('sha', state.sha)
      output('aliasArgument', state.alias ? `--preview-alias ${state.alias}` : '')
    }
  } else if (command === 'preflight') {
    const state = JSON.parse(readFileSync(resultFile, 'utf8'))
    await ensureCurrent(api, state)
    const secrets = await cfRequest(`/accounts/${account}/workers/scripts/${worker}/secrets`)
    assert.ok(Array.isArray(secrets) && secrets.length === 0, 'Worker secrets exist; this preview design cannot inherit them. Stop for isolated-preview review.')
    await ensureCurrent(api, state)
  } else if (command === 'complete') {
    const state = JSON.parse(readFileSync(resultFile, 'utf8'))
    const uploaded = uploadedVersion(process.env.WRANGLER_OUTPUT, state.alias)
    const { run } = await ensureCurrent(api, state)
    if (!state.pr) {
      assert.equal(mode, 'enabled'); await productionGate(api, download, run); await ensureCurrent(api, state)
      const deployment = await cfRequest(`/accounts/${account}/workers/scripts/${worker}/deployments`, {
        method: 'POST', body: { strategy: 'percentage', versions: [{ version_id: uploaded.id, percentage: 100 }],
          annotations: { 'workers/message': `GitHub build ${run.id}, commit ${run.head_sha}` } } })
      assert.ok(deployment?.id, 'Production promotion unconfirmed')
      state.deployment = deployment.id; state.status = 'production-deployed'
    } else state.status = 'preview-published'
    // Store only the validated upload lines, not unbounded CLI diagnostics.
    state.output = `Worker Version ID: ${uploaded.id}\nVersion Preview URL: ${uploaded.commitUrl}\n` +
      (uploaded.branchUrl ? `Version Preview Alias URL: ${uploaded.branchUrl}\n` : '')
    writeFileSync(resultFile, JSON.stringify(state))
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${state.status}: ${state.sha}\n\n${uploaded.commitUrl}\n${uploaded.branchUrl || ''}\n`)
  } else throw Error('Use route, report, prepare, preflight or complete')
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main()
