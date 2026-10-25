import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { readArtifactZip } from '../artifact-zip.mjs'

export const repository = 'JohnDeved/populous-new-dawn'
export const account = '19321bcee0ed17a93b709cb602dd070c'
export const worker = 'populous-new-dawn'
export const hostname = `${worker}.webtorrent.workers.dev`
export const buildPath = '.github/workflows/cloudflare-build.yml'
export const publishPath = '.github/workflows/cloudflare-publish.yml'
export const marker = '<!-- populous-cloudflare-preview:v1 -->'
export const buildIdentityPath = 'pnd-build-identity.txt'
export const maxArchiveBytes = 512 * 1024 * 1024
export const positive = value => Number.isSafeInteger(value) && value > 0
export const sha = value => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value)
export function branchAlias(branch) {
  assert.ok(typeof branch === 'string' && branch.length > 0 && branch.length <= 255)
  // Always start with a letter and hash the full original to prevent collisions.
  const slug = branch.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 25)
  return `b-${slug || 'branch'}-${createHash('sha256').update(branch).digest('hex').slice(0, 8)}`
}
export function publisherSource(run) {
  assert.equal(run.path, publishPath); assert.equal(run.event, 'workflow_run')
  const match = /^Cloudflare publish build (\d+) attempt (\d+)$/.exec(run.display_title)
  assert.ok(match, 'Invalid trusted publisher title')
  const source = Number(match[1]), attempt = Number(match[2])
  assert.ok(positive(source) && positive(attempt))
  return { source, attempt }
}
export function validateRun(run, path) {
  assert.ok(positive(run.id) && positive(run.run_attempt) && positive(run.workflow_id) && sha(run.head_sha))
  assert.equal(run.repository.full_name, repository); assert.equal(run.path, path)
}
export function currentPreview(run, pr) {
  return run.event === 'pull_request' && pr.state === 'open' && pr.base.ref === 'main' &&
    pr.base.repo.full_name === repository && pr.head.repo?.full_name === repository &&
    pr.head.sha === run.head_sha && pr.head.ref === run.head_branch
}
export function fixedConfig() {
  return { name: worker, account_id: account, main: './worker/index.js',
    compatibility_date: '2026-09-17', compatibility_flags: ['nodejs_compat'],
    workers_dev: true, preview_urls: true, no_bundle: true,
    rules: [{ type: 'ESModule', globs: ['**/*.js', '**/*.mjs'] }],
    assets: { directory: './client', binding: 'ASSETS' }, images: { binding: 'IMAGES' },
    // Wrangler otherwise inherits runtime secrets on versions upload.
    // Fixed API metadata prevents that, even if a secret appears after preflight.
    unsafe: { metadata: { keep_bindings: [] } }, send_metrics: false }
}
export function materializeBuild(zip, destination, sourceSha) {
  assert.ok(sha(sourceSha) && sourceSha.length === 40, 'Invalid build identity source SHA')
  const files = readArtifactZip(zip, { maxArchiveBytes, maxFileBytes: 32 * 1024 * 1024,
    maxTotalBytes: 1024 * 1024 * 1024, maxEntries: 30000,
    allowName: name => /^(client|server)\//.test(name) })
  assert.ok(files.has('server/index.js') && [...files.keys()].some(name => name.startsWith('client/')), 'Missing build output')
  const identityAsset = `client/${buildIdentityPath}`
  assert.ok(![...files.keys()].some(name => name === identityAsset || name.startsWith(`${identityAsset}/`)),
    'Build output collides with reserved publisher identity asset')
  let count = 0
  for (const [name, bytes] of files) {
    // No configuration, package-manager files, .env, .dev.vars, source maps,
    // hidden files or executable hooks cross the boundary. ZIP parser rejects
    // traversal, symlinks, duplicate/hidden entries and expansion bombs first.
    const parts = name.split('/')
    if (parts.some(part => part.startsWith('.') || part === 'node_modules') ||
        /(?:^|\/)(?:wrangler[^/]*|package(?:-lock)?\.json|pnpm[^/]*|yarn\.lock)$/.test(name)) continue
    if (name.startsWith('server/') && !/\.(?:js|mjs|wasm|txt|html|bin)$/.test(name)) continue
    const target = join(destination, name.replace(/^server\//, 'worker/'))
    mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, bytes, { flag: 'wx' }); count++
  }
  writeFileSync(join(destination, 'wrangler.json'), `${JSON.stringify(fixedConfig(), null, 2)}\n`, { flag: 'wx' })
  // Public publisher attestation only: never copy artifact metadata or environment.
  writeFileSync(join(destination, identityAsset), `schema=1\nsource_sha=${sourceSha}\n`, { flag: 'wx' })
  return count + 1
}
export function uploadedVersion(output, alias) {
  assert.ok(typeof output === 'string' && output.length < 1024 * 1024)
  const one = expression => { const matches = [...output.matchAll(expression)]; assert.equal(matches.length, 1, 'Missing or ambiguous Wrangler upload output'); return matches[0][1] }
  const id = one(/^Worker Version ID: ([a-f0-9-]{36})\s*$/gm)
  assert.match(id, /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/)
  const commitUrl = one(/^Version Preview URL: (https:\/\/\S+)\s*$/gm)
  assert.equal(commitUrl, `https://${id.slice(0, 8)}-${hostname}`)
  const branchUrl = alias ? one(/^Version Preview Alias URL: (https:\/\/\S+)\s*$/gm) : null
  if (alias) assert.equal(branchUrl, `https://${alias}-${hostname}`)
  return { id, commitUrl, branchUrl }
}
// Visible markup is copied from the real Workers app comments linked in
// engineering/cloudflare-actions.md. Only run-specific values are substituted.
const deploymentStatus = {
  success: '✅ Deployment successful!',
  failure: '❌ Deployment failed',
  skipped: '⚠️ Deployment skipped',
  // No retained native pending/cancelled comment exists. Keep these truthful
  // lifecycle adaptations explicit rather than claiming exact native wording.
  pending: '⏳ Deployment in progress',
  cancelled: '⚠️ Deployment cancelled',
}
export function commentTimestamp(value) {
  assert.ok(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value), 'Missing trusted update time')
  const date = new Date(value); assert.ok(Number.isFinite(date.getTime()), 'Invalid update time')
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getUTCMonth()]
  const pad = number => String(number).padStart(2, '0')
  return `${month} ${pad(date.getUTCDate())} ${date.getUTCFullYear()}, ${pad(date.getUTCHours() % 12 || 12)}:${pad(date.getUTCMinutes())} ${date.getUTCHours() < 12 ? 'AM' : 'PM'}`
}
export function renderComment({ run, outcome, publication, urls, diagnostic = '', logsRun = publication || run }) {
  assert.ok(sha(run.head_sha) && positive(run.id) && positive(run.run_attempt))
  assert.ok(Object.hasOwn(deploymentStatus, outcome), 'Unknown deployment outcome')
  assert.ok(positive(logsRun.id) && positive(logsRun.run_attempt), 'Invalid log identity')
  assert.equal(Boolean(urls), outcome === 'success', 'Success requires verified preview URLs')
  if (urls) {
    assert.match(urls.id ?? '', /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/)
    assert.equal(urls.commitUrl, `https://${urls.id.slice(0, 8)}-${hostname}`)
    assert.match(urls.branchUrl ?? '', /^https:\/\/b-[a-z0-9-]+-populous-new-dawn\.webtorrent\.workers\.dev$/)
  }
  const previewHeading = urls ? ' Preview URL |' : ''
  const previewCell = urls ? ` <a href='${urls.commitUrl}'>Commit Preview URL</a><br><br><a href='${urls.branchUrl}'>Branch Preview URL</a> |` : ''
  const logs = `https://github.com/${repository}/actions/runs/${logsRun.id}/attempts/${logsRun.run_attempt}`
  const updated = commentTimestamp(publication?.updated_at || run.updated_at)
  // Display time intentionally has native minute precision; hidden provenance
  // must retain full precision and publisher identity so a same-minute retry
  // updates the diagnostic link rather than preserving an earlier attempt.
  const lifecycle = value => value ? { id: value.id, attempt: value.run_attempt,
    status: value.status, conclusion: value.conclusion, updatedAt: value.updated_at } : null
  const detail = createHash('sha256').update(JSON.stringify({ diagnostic,
    source: lifecycle(run), publication: lifecycle(publication) })).digest('hex')
  return `${marker}
<!-- source:${run.id}:${run.run_attempt} -->
<!-- detail:${detail} -->

## Deploying with &nbsp;<a href="https://workers.dev"><img alt="Cloudflare Workers" src="https://workers.cloudflare.com/logo.svg" width="16"></a> &nbsp;Cloudflare Workers
The latest updates on your project. Learn more about [integrating Git with Workers](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/).

| Status | Name | Latest Commit |${previewHeading} Updated (UTC) |
| -|-|-|${urls ? '-|' : ''}-|
| ${deploymentStatus[outcome]} <br>[View logs](${logs}) | ${worker} | ${run.head_sha.slice(0, 8)} |${previewCell} ${updated} |`
}
