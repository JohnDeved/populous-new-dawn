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
    // Wrangler 4.92 otherwise always inherits runtime secrets on versions upload.
    // Fixed API metadata prevents that, even if a secret appears after preflight.
    unsafe: { metadata: { keep_bindings: [] } }, send_metrics: false }
}
export function materializeBuild(zip, destination) {
  const files = readArtifactZip(zip, { maxArchiveBytes, maxFileBytes: 32 * 1024 * 1024,
    maxTotalBytes: 1024 * 1024 * 1024, maxEntries: 30000,
    allowName: name => /^(client|server)\//.test(name) })
  assert.ok(files.has('server/index.js') && [...files.keys()].some(name => name.startsWith('client/')), 'Missing build output')
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
  return count
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
export function renderComment({ run, status, publication, urls }) {
  assert.ok(sha(run.head_sha) && positive(run.id) && positive(run.run_attempt))
  const lines = [marker, `<!-- source:${run.id}:${run.run_attempt} -->`, '## Cloudflare preview',
    `Status: ${status}`, `Commit: [\`${run.head_sha.slice(0, 8)}\`](https://github.com/${repository}/commit/${run.head_sha})`,
    `[Build logs](https://github.com/${repository}/actions/runs/${run.id}/attempts/${run.run_attempt})`]
  if (publication) lines.push(`[Publish logs](https://github.com/${repository}/actions/runs/${publication.id}/attempts/${publication.run_attempt})`)
  if (urls) lines.push(`Branch preview (moves with this branch): ${urls.branchUrl}`,
    `Exact commit preview (immutable uploaded version): ${urls.commitUrl}`)
  else lines.push('No verified preview links for this attempt. Previous URLs are not evidence for this commit.')
  lines.push('Preview publication is not production deployment, review approval, or a passing Full check.')
  return lines.join('\n\n')
}
