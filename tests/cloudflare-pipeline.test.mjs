import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { deflateRawSync } from 'node:zlib'
import { repository, buildPath, publishPath, marker, branchAlias, publisherSource,
  currentPreview, fixedConfig, materializeBuild, uploadedVersion } from '../scripts/cloudflare/protocol.mjs'
import { report, prepare, route, currentSource, productionGate, oneArtifact } from '../scripts/cloudflare/control.mjs'

const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const root = new URL('../', import.meta.url), prefix = `/repos/${repository}`
const digest = 'a'.repeat(40), main = 'b'.repeat(40)
const workerHost = 'populous-new-dawn.webtorrent.workers.dev'
const version = '01234567-89ab-cdef-0123-456789abcdef'
const branch = 'feature/preview'; const alias = branchAlias(branch)
const upload = `Worker Version ID: ${version}\nVersion Preview URL: https://01234567-${workerHost}\nVersion Preview Alias URL: https://${alias}-${workerHost}\n`
function archive(files) {
  const locals = [], centrals = []; let offset = 0
  for (const [name, text, mode = 0x81a4] of files) {
    const bytes = Buffer.from(text), data = deflateRawSync(bytes), filename = Buffer.from(name)
    let crc = 0xffffffff
    for (const byte of bytes) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0) }
    crc = (crc ^ 0xffffffff) >>> 0
    const local = Buffer.alloc(30), central = Buffer.alloc(46)
    local.writeUInt32LE(0x04034b50); local.writeUInt16LE(20, 4); local.writeUInt16LE(8, 8); local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(data.length, 18); local.writeUInt32LE(bytes.length, 22); local.writeUInt16LE(filename.length, 26)
    central.writeUInt32LE(0x02014b50); central.writeUInt16LE(0x0314, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(8, 10)
    central.writeUInt32LE(crc, 16); central.writeUInt32LE(data.length, 20); central.writeUInt32LE(bytes.length, 24)
    central.writeUInt16LE(filename.length, 28); central.writeUInt32LE((mode << 16) >>> 0, 38); central.writeUInt32LE(offset, 42)
    locals.push(local, filename, data); centrals.push(central, filename); offset += local.length + filename.length + data.length
  }
  const end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10)
  end.writeUInt32LE(centrals.reduce((n, bytes) => n + bytes.length, 0), 12); end.writeUInt32LE(offset, 16)
  return Buffer.concat([...locals, ...centrals, end])
}
const resultZip = result => archive([['cloudflare-result.json', JSON.stringify(result)]])
const result = () => ({ version: 1, source: 100, sourceAttempt: 1, sha: digest, pr: 7, alias, status: 'preview-published', output: upload })
function fixture() {
  const run = { id: 100, run_attempt: 1, workflow_id: 10, repository: { full_name: repository },
    head_repository: { full_name: repository }, path: buildPath, head_sha: digest, head_branch: branch,
    event: 'pull_request', status: 'completed', conclusion: 'success', pull_requests: [{ number: 7 }] }
  const pr = { number: 7, state: 'open', base: { ref: 'main', repo: { full_name: repository } },
    head: { sha: digest, ref: branch, repo: { full_name: repository } } }
  const publication = { ...run, id: 200, workflow_id: 20, path: publishPath, event: 'workflow_run', head_sha: main,
    display_title: 'Cloudflare publish build 100 attempt 1' }
  const state = { run, pr, publication, comments: [], writes: [], newer: [], result: result(), builds: 0, publishers: [publication] }
  const api = async (path, options = {}) => {
    if (options.method) {
      state.writes.push({ path, ...options })
      if (options.method === 'POST') state.comments.push({ id: 300, body: options.body.body,
        user: { id: 41898282, type: 'Bot', login: 'github-actions[bot]' } })
      else state.comments.find(comment => path.endsWith(`/${comment.id}`)).body = options.body.body
      return {}
    }
    if (path === `${prefix}/actions/runs/100`) return structuredClone(state.run)
    if (path === `${prefix}/actions/runs/200`) return structuredClone(state.publication)
    if (path === `${prefix}/actions/workflows/10`) return { path: buildPath }
    if (path === `${prefix}/actions/workflows/20`) return { path: publishPath }
    if (path === `${prefix}/pulls/7`) return structuredClone(state.pr)
    if (path.startsWith(`${prefix}/contents/`)) {
      const name = path.slice(`${prefix}/contents/`.length).split('?')[0]
      const content = readFileSync(new URL(name, root)); return { type: 'file', encoding: 'base64', size: content.length, content: content.toString('base64') }
    }
    if (path.startsWith(`${prefix}/actions/workflows/cloudflare-build.yml/runs?`)) return { total_count: 1 + state.newer.length, workflow_runs: [state.run, ...state.newer] }
    if (path.startsWith(`${prefix}/actions/workflows/cloudflare-publish.yml/runs?`)) return { total_count: state.publishers.length, workflow_runs: state.publishers }
    if (path === `${prefix}/actions/runs/200/artifacts?per_page=100`) return { total_count: state.result ? 1 : 0,
      artifacts: state.result ? [{ id: 400, name: `cloudflare-result-200-${state.publication.run_attempt}`, expired: false, size_in_bytes: 1000, workflow_run: { id: 200 }, digest: `sha256:${hash(resultZip(state.result))}` }] : [] }
    if (path.startsWith(`${prefix}/issues/7/comments?`)) return structuredClone(state.comments)
    if (path === `${prefix}/git/ref/heads/main`) return { object: { sha: main } }
    throw Error(`Unexpected mock request: ${path}`)
  }
  const download = async id => { assert.equal(id, 400); return resultZip(state.result) }
  return { state, api, download, sourceId: 100, expectedPr: 7, mode: 'preview' }
}

test('branch aliases are bounded, shell-safe, stable and collision-resistant', () => {
  for (const text of ['a/b', 'a_b', "$(touch /tmp/pwned);'", 'é'.repeat(100), '7'.repeat(255)]) {
    const value = branchAlias(text); assert.match(value, /^[a-z][a-z0-9-]*$/); assert.ok(value.length + 'populous-new-dawn'.length + 1 <= 63)
    assert.equal(value, branchAlias(text))
  }
  assert.notEqual(branchAlias('a/b'), branchAlias('a_b'))
})
test('publisher routing requires exact trusted path and numeric source provenance', () => {
  const { state } = fixture(); assert.deepEqual(publisherSource(state.publication), { source: 100, attempt: 1 })
  assert.throws(() => publisherSource({ ...state.publication, display_title: 'Cloudflare publish build 1;echo hi attempt 1' }))
  assert.throws(() => publisherSource({ ...state.publication, path: '.github/workflows/evil.yml' }))
})
test('preview admission rejects forks, stale heads, closed PRs and non-main targets', () => {
  const { state: { run, pr } } = fixture(); assert.equal(currentPreview(run, pr), true)
  for (const change of [p => { p.head.repo.full_name = 'other/fork' }, p => { p.head.sha = main }, p => { p.state = 'closed' }, p => { p.base.ref = 'dev' }]) {
    const copy = structuredClone(pr); change(copy); assert.equal(currentPreview(run, copy), false)
  }
})
test('fixed deployment config has no build hooks or arbitrary inherited bindings', () => {
  const config = fixedConfig(); assert.equal(config.no_bundle, true); assert.equal(config.main, './worker/index.js')
  assert.deepEqual(config.unsafe.metadata.keep_bindings, []); assert.equal(config.build, undefined)
  for (const field of ['routes', 'vars', 'services', 'd1_databases', 'kv_namespaces', 'r2_buckets', 'secrets']) assert.equal(config[field], undefined)
})
test('materializer treats output as bytes and discards executable configuration', t => {
  const directory = mkdtempSync(join(tmpdir(), 'cloudflare-data-')); t.after(() => rmSync(directory, { recursive: true, force: true }))
  const code = 'throw new Error("MUST NOT EXECUTE")'
  materializeBuild(archive([['server/index.js', code], ['server/wrangler.json', '{"build":{"command":"evil"}}'],
    ['server/package.json', '{"scripts":{"postinstall":"evil"}}'], ['server/.env', 'secret'],
    ['server/chunks/child.mjs', code], ['client/index.html', '<html/>']]), directory)
  assert.equal(readFileSync(join(directory, 'worker/index.js'), 'utf8'), code)
  assert.deepEqual(readdirSync(join(directory, 'worker')).sort(), ['chunks', 'index.js'])
  assert.deepEqual(JSON.parse(readFileSync(join(directory, 'wrangler.json'))), fixedConfig())
})
test('materializer rejects traversal, symlinks, duplicate paths and unrelated files', t => {
  const directory = mkdtempSync(join(tmpdir(), 'cloudflare-reject-')); t.after(() => rmSync(directory, { recursive: true, force: true }))
  for (const entry of [['server/../../escape.js', 'x'], ['server/link.js', '/proc/self/environ', 0xa1ff],
    ['package.json', '{}'], ['server/index.js', 'duplicate']]) {
    assert.throws(() => materializeBuild(archive([['server/index.js', 'x'], ['client/index.html', 'x'], entry]), join(directory, String(Math.random()))))
  }
})
test('upload parsing requires both exact trusted URLs and an immutable matching version', () => {
  assert.deepEqual(uploadedVersion(upload, alias), { id: version, commitUrl: `https://01234567-${workerHost}`, branchUrl: `https://${alias}-${workerHost}` })
  for (const bad of [upload.replace(workerHost, 'evil.example'), upload.replace('01234567-populous', 'deadbeef-populous'),
    upload.replace('Version Preview Alias URL:', 'Other:'), upload + upload]) assert.throws(() => uploadedVersion(bad, alias))
})
test('comment creates once, updates in place and is idempotent', async () => {
  const f = fixture(); assert.equal(await report(f), 'created'); assert.equal(f.state.writes.length, 1)
  assert.equal(await report(f), 'unchanged'); assert.equal(f.state.writes.length, 1)
  f.state.publication.conclusion = 'failure'
  assert.equal(await report(f), 'updated'); assert.equal(f.state.writes[1].method, 'PATCH')
  assert.equal(f.state.comments.length, 1); assert.match(f.state.comments[0].body, /Publication failure/)
  assert.doesNotMatch(f.state.comments[0].body, /Branch preview \(moves/)
})
test('manual publisher cancellation removes stale success links and admits uncertainty', async () => {
  const f = fixture(); await report(f); f.state.publication.conclusion = 'cancelled'
  await report(f); assert.match(f.state.comments[0].body, /Publication cancelled; remote outcome is not verified/)
})
test('failed/cancelled/timed-out builds never claim a deployed revision', async () => {
  for (const conclusion of ['failure', 'cancelled', 'timed_out', 'skipped', null]) {
    const f = fixture(); f.state.run.conclusion = conclusion; await report(f)
    assert.match(f.state.comments[0].body, /not published/); assert.doesNotMatch(f.state.comments[0].body, /published successfully/)
  }
})
test('pending build, disabled deployment and no publisher each have truthful status', async () => {
  for (const [change, expression] of [[f => { f.state.run.status = 'in_progress' }, /Building on GitHub/],
    [f => { f.mode = '' }, /publishing is disabled/], [f => { f.state.publishers = [] }, /queued or not yet observed/],
    [f => { f.state.result = null }, /no verified deployment/]]) {
    const f = fixture(); change(f); await report(f); assert.match(f.state.comments[0].body, expression)
  }
})
test('fork builds are reported skipped, never receive deployment URLs', async () => {
  const f = fixture(); f.state.pr.head.repo.full_name = 'someone/fork'; await report(f)
  assert.match(f.state.comments[0].body, /fork previews are not published/)
})
test('stale or closed PR and newer build run cannot overwrite a current comment', async () => {
  for (const change of [f => { f.state.pr.head.sha = main }, f => { f.state.pr.state = 'closed' },
    f => { f.state.newer = [{ ...f.state.run, id: 101 }] }]) {
    const f = fixture(); change(f); assert.equal(await report(f), 'stale'); assert.equal(f.state.writes.length, 0)
  }
})
test('recheck immediately before comment catches a PR update during report assembly', async () => {
  const f = fixture(), original = f.api; let reads = 0
  f.api = async (path, options) => { if (path === `${prefix}/pulls/7` && ++reads === 2) f.state.pr.head.sha = main; return original(path, options) }
  assert.equal(await report(f), 'stale'); assert.equal(f.state.writes.length, 0)
})
test('older build cannot overwrite a higher source marker, even on the same SHA', async () => {
  const f = fixture(); f.state.comments = [{ id: 300, user: { id: 41898282, type: 'Bot', login: 'github-actions[bot]' }, body: `${marker}\n<!-- source:101:1 -->` }]
  assert.equal(await report(f), 'older'); assert.equal(f.state.writes.length, 0)
})
test('human-supplied marker and Cloudflare app comments are not modified', async () => {
  const f = fixture(); f.state.comments = [{ id: 999, user: { id: 1, type: 'User', login: 'person' }, body: marker },
    { id: 998, user: { id: 2, type: 'Bot', login: 'cloudflare-workers-and-pages[bot]' }, body: marker }]
  assert.equal(await report(f), 'created'); assert.equal(f.state.comments.length, 3)
})
test('ambiguous own comments fail closed rather than create a third', async () => {
  const f = fixture(); await report(f); f.state.comments.push({ ...f.state.comments[0], id: 301 })
  await assert.rejects(report(f), /Ambiguous/); assert.equal(f.state.writes.length, 1)
})
test('wrong artifact commit, run, attempt or URLs cannot manufacture preview success', async () => {
  for (const change of [r => { r.sha = main }, r => { r.source = 101 }, r => { r.sourceAttempt = 2 },
    r => { r.output = upload.replace(workerHost, 'evil.example') }]) {
    const f = fixture(); change(f.state.result); await assert.rejects(report(f)); assert.equal(f.state.writes.length, 0)
  }
})
test('publisher event routes back to GitHub-associated source PR', async () => {
  const f = fixture(); assert.deepEqual(await route(f.api, f.state.publication), { source: 100, pr: 7 })
  f.state.run.pull_requests = []; assert.equal(await route(f.api, f.state.run), null)
})
test('current-source gate rejects superseded attempts and main commits', async () => {
  const f = fixture(); const old = { ...f.state.run }; f.state.run.run_attempt = 2
  assert.equal(await currentSource(f.api, old, f.state.pr), false)
  assert.equal(await currentSource(f.api, { ...f.state.run, event: 'push', head_branch: 'main' }, null), false)
})
test('prepare refuses disabled publishing and fork/stale sources without artifacts', async () => {
  for (const change of [f => { f.mode = '' }, f => { f.state.pr.head.repo.full_name = 'someone/fork' }, f => { f.state.pr.head.sha = main }]) {
    const f = fixture(); change(f)
    assert.equal(await prepare({ ...f, runId: 100, destination: '/unused' }), null)
  }
})
test('production gate refuses arbitrary direct pushes', async () => {
  const f = fixture(); await assert.rejects(productionGate(async () => [], f.download,
    { ...f.state.run, event: 'push', head_branch: 'main' }), /merged PR/)
})
test('workflow trust boundary stays separate and action dependencies stay pinned', () => {
  const build = readFileSync(new URL(buildPath, root), 'utf8')
  const publish = readFileSync(new URL(publishPath, root), 'utf8')
  const reporter = readFileSync(new URL('.github/workflows/cloudflare-report.yml', root), 'utf8')
  assert.doesNotMatch(build, /secrets\.|:\s*write\s*$|pull_request_target/m)
  assert.match(build, /pnpm install --frozen-lockfile --ignore-scripts/); assert.match(build, /pnpm run build:cloudflare/)
  assert.match(publish, /environment: cloudflare-worker/); assert.match(publish, /ref: \$\{\{ github.sha \}\}/)
  assert.match(publish, /workingDirectory: .cloudflare-publisher/); assert.match(publish, /--no-bundle/)
  assert.doesNotMatch(publish, /pull_request_target|pnpm run|npm ci|pull-requests: write/)
  assert.match(reporter, /workflows: \[Cloudflare build, Cloudflare publish\]/)
  for (const content of [build, publish, reporter]) for (const match of content.matchAll(/uses: ([^\s]+)@([^\s]+)/g)) assert.match(match[2], /^[a-f0-9]{40}$/)
})

function productionFixture() {
  const gatePath = '.github/workflows/ready-pr-check.yml', tree = 'c'.repeat(40)
  const source = { ...fixture().state.run, event: 'push', head_branch: 'main', head_sha: main }
  const pr = { ...fixture().state.pr, merged: true, merged_at: '2026-10-22T00:00:00Z', merge_commit_sha: main }
  const gate = { ...fixture().state.run, id: 500, workflow_id: 50, path: gatePath }
  const receipt = { kind: 'quality', status: 'passed', identity: { repository, headSha: digest,
    runId: '500', runAttempt: '1', treeSha: tree, workflowSha256: hash(readFileSync(new URL(gatePath, root))) } }
  const jobs = ['Quality and build', ...[1, 2, 3, 4].map(n => `Test shard ${n}/4`), 'Full check'].map(name => ({ name, conclusion: 'success' }))
  const state = { source, pr, gate, receipt, jobs, tree, workflow: readFileSync(new URL(gatePath, root)), associated: [pr], badDigest: false }
  const zip = () => archive([['receipt.json', JSON.stringify(state.receipt)]])
  const api = async path => {
    if (path === `${prefix}/commits/${main}/pulls?per_page=100`) return state.associated
    if (path === `${prefix}/pulls/7`) return state.pr
    if (path.startsWith(`${prefix}/actions/workflows/ready-pr-check.yml/runs?`)) return { total_count: 1, workflow_runs: [state.gate] }
    if (path === `${prefix}/actions/runs/500`) return state.gate
    if (path === `${prefix}/actions/workflows/50`) return { path: gatePath }
    if (path === `${prefix}/contents/${gatePath}?ref=${digest}`) return { type: 'file', encoding: 'base64', size: state.workflow.length, content: state.workflow.toString('base64') }
    if (path.startsWith(`${prefix}/actions/runs/500/attempts/`)) return { total_count: state.jobs.length, jobs: state.jobs }
    if (path === `${prefix}/actions/runs/500/artifacts?per_page=100`) return { total_count: 1, artifacts: [{
      id: 600, name: `full-check-500-${state.gate.run_attempt}-quality`, expired: false, workflow_run: { id: 500 },
      size_in_bytes: zip().length, digest: `sha256:${state.badDigest ? '0'.repeat(64) : hash(zip())}` }] }
    if (path === `${prefix}/git/commits/${main}`) return { tree: { sha: state.tree } }
    throw Error(`Unexpected production request: ${path}`)
  }
  return { state, api, download: async id => { assert.equal(id, 600); return zip() } }
}
test('production admits only the exact successful tested merge tree', async () => {
  const f = productionFixture()
  assert.deepEqual(await productionGate(f.api, f.download, f.state.source), { pr: 7, gate: 500, tree: 'c'.repeat(40) })
})
test('production rejects mismatched merged PR, workflow, gate and receipt provenance', async () => {
  const mutations = [
    s => { s.associated = [] }, s => { s.associated.push({ ...s.pr, number: 8 }) },
    s => { s.pr.merged = false }, s => { s.pr.base.ref = 'other' },
    s => { s.gate.head_sha = main }, s => { s.gate.path = '.github/workflows/evil.yml' },
    s => { s.gate.conclusion = 'cancelled' }, s => { s.gate.pull_requests = [] },
    s => { s.gate.run_attempt = 2 }, s => { s.workflow = Buffer.from('different workflow') },
    s => { s.jobs[0].conclusion = 'failure' }, s => { s.jobs.pop() },
    s => { s.jobs[1].name = 'Another check' }, s => { s.jobs.push({ ...s.jobs[0] }) },
    s => { s.receipt.kind = 'test' }, s => { s.receipt.status = 'failed' },
    s => { s.receipt.identity.repository = 'other/repo' }, s => { s.receipt.identity.headSha = main },
    s => { s.receipt.identity.runId = '499' }, s => { s.receipt.identity.runAttempt = '2' },
    s => { s.receipt.identity.workflowSha256 = '0'.repeat(64) }, s => { s.receipt.identity.treeSha = main },
    s => { s.tree = main }, s => { s.badDigest = true },
  ]
  for (const [index, mutation] of mutations.entries()) {
    const f = productionFixture(); mutation(f.state)
    await assert.rejects(productionGate(f.api, f.download, f.state.source), `Mutation ${index} must reject`)
  }
})
test('artifact download verifies SHA-256 before reading even valid ZIP bytes', async () => {
  const f = fixture()
  await assert.rejects(oneArtifact(f.api, async () => resultZip({ ...result(), sha: main }), f.state.publication, 'cloudflare-result-200-1', 65536), /SHA-256 mismatch/)
  const original = f.api
  f.api = async path => { const response = await original(path); if (response.artifacts) delete response.artifacts[0].digest; return response }
  await assert.rejects(oneArtifact(f.api, f.download, f.state.publication, 'cloudflare-result-200-1', 65536), /Missing artifact SHA-256/)
})
