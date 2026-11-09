import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { verifyCredentialRead, verificationFailure, readVerified } from '../scripts/cloudflare/verify-access.mjs'
import { account, repository, worker } from '../scripts/cloudflare/protocol.mjs'

const context = { GITHUB_REPOSITORY: repository, GITHUB_REF: 'refs/heads/main', GITHUB_EVENT_NAME: 'workflow_dispatch' }
const sentinel = 'synthetic-secret-do-not-print'
const diagnostic = async action => {
  try { await action(); assert.fail('Expected refusal') } catch (error) {
    const message = verificationFailure(error)
    assert.ok(!message.includes(sentinel))
    assert.equal(error.cause, undefined)
    return message
  }
}

test('manual main verification uses exactly one scoped GET and claims read access only', async () => {
  const calls = []
  const result = await verifyCredentialRead(context, async (...args) => { calls.push(args); return [] })
  assert.deepEqual(calls, [[`/accounts/${account}/workers/scripts/${worker}/secrets`, { method: 'GET' }]])
  assert.equal(result, readVerified)
  assert.match(result, /No upload or promotion was attempted/)
  assert.match(result, /Write and deployment permissions remain unverified/)
})

for (const [name, change] of [
  ['wrong repository', { GITHUB_REPOSITORY: 'other/repository' }],
  ['fork repository', { GITHUB_REPOSITORY: 'fork/populous-new-dawn' }],
  ['branch ref', { GITHUB_REF: 'refs/heads/pilot' }],
  ['tag named main', { GITHUB_REF: 'refs/tags/main' }],
  ['pull request ref', { GITHUB_REF: 'refs/pull/749/merge' }],
  ['pull request event', { GITHUB_EVENT_NAME: 'pull_request' }],
  ['workflow run event', { GITHUB_EVENT_NAME: 'workflow_run' }],
  ['missing event', { GITHUB_EVENT_NAME: undefined }],
]) {
  test(`rejects ${name} before any request`, async () => {
    let calls = 0
    const message = await diagnostic(() => verifyCredentialRead({ ...context, ...change }, async () => { calls++; return [] }))
    assert.equal(calls, 0)
    assert.match(message, /only a manual dispatch/)
  })
}

for (const value of [undefined, null, {}, { length: 0 }, '', '[]', 0, false]) {
  test(`rejects malformed secret inventory ${JSON.stringify(value)}`, async () => {
    assert.match(await diagnostic(() => verifyCredentialRead(context, async () => value)), /unexpected Worker secret-name response/)
  })
}

test('rejects a nonempty inventory without reading or printing secret records', async () => {
  const inventory = [new Proxy({}, { get() { throw new Error(sentinel) } })]
  assert.match(await diagnostic(() => verifyCredentialRead(context, async () => inventory)), /Worker runtime secrets exist/)
})

test('sanitizes an inventory length getter exception', async () => {
  const inventory = new Proxy([], { get(target, name) {
    if (name === 'length') throw new Error(sentinel)
    return Reflect.get(target, name)
  } })
  assert.match(await diagnostic(() => verifyCredentialRead(context, async () => inventory)), /unexpected Worker secret-name response/)
})

test('request exceptions retain no raw message, cause or secret', async () => {
  assert.match(await diagnostic(() => verifyCredentialRead(context, async () => {
    throw new Error(sentinel, { cause: new Error(sentinel) })
  })), /could not read the selected Worker/)
})

test('unknown errors and message getters have fixed safe diagnostics', () => {
  for (const error of [new Error(sentinel), sentinel, { get message() { throw new Error(sentinel) } }]) {
    assert.equal(verificationFailure(error), 'Credential read preflight failed without verified access. No upload or promotion was attempted.')
  }
  let reads = 0
  const fixed = 'Credential read preflight refused: unexpected Worker secret-name response. No upload or promotion was attempted.'
  const changing = { get message() { return ++reads === 1 ? fixed : sentinel } }
  assert.equal(verificationFailure(changing), fixed)
  assert.equal(reads, 1)
})

test('real request helper sanitizes token-bearing transport and body failures', async () => {
  const originalFetch = globalThis.fetch, originalToken = process.env.CLOUDFLARE_API_TOKEN
  process.env.CLOUDFLARE_API_TOKEN = sentinel
  try {
    for (const fetcher of [
      async () => { throw new Error(sentinel) },
      async () => ({ ok: true, status: 200, body: (async function* () { throw new Error(sentinel) })() }),
      async () => ({ ok: false, status: 403, body: (async function* () { yield Buffer.from(sentinel) })() }),
    ]) {
      let calls = 0
      globalThis.fetch = async (url, options) => {
        calls++
        assert.equal(url, `https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/${worker}/secrets`)
        assert.equal(options.method, 'GET'); assert.equal(options.redirect, 'error'); assert.equal(options.body, undefined)
        return fetcher()
      }
      assert.match(await diagnostic(() => verifyCredentialRead(context)), /could not read the selected Worker/)
      assert.equal(calls, 1)
    }
  } finally {
    globalThis.fetch = originalFetch
    if (originalToken === undefined) delete process.env.CLOUDFLARE_API_TOKEN
    else process.env.CLOUDFLARE_API_TOKEN = originalToken
  }
})

test('missing and malformed synthetic credentials cannot issue a request', async () => {
  const originalFetch = globalThis.fetch, originalToken = process.env.CLOUDFLARE_API_TOKEN
  let calls = 0
  globalThis.fetch = async () => { calls++; throw new Error('Unexpected network') }
  try {
    for (const token of [undefined, '', `${sentinel}\n`, `${sentinel} whitespace`]) {
      if (token === undefined) delete process.env.CLOUDFLARE_API_TOKEN
      else process.env.CLOUDFLARE_API_TOKEN = token
      assert.match(await diagnostic(() => verifyCredentialRead(context)), /could not read the selected Worker/)
    }
    assert.equal(calls, 0)
  } finally {
    globalThis.fetch = originalFetch
    if (originalToken === undefined) delete process.env.CLOUDFLARE_API_TOKEN
    else process.env.CLOUDFLARE_API_TOKEN = originalToken
  }
})

test('verification workflow is manual, main-only, read-only and step-scopes the secret', () => {
  const workflow = readFileSync(new URL('../.github/workflows/cloudflare-verify-credential.yml', import.meta.url), 'utf8')
  assert.match(workflow, /^on:\n  workflow_dispatch:\n/m)
  assert.doesNotMatch(workflow, /^  (pull_request|push|workflow_run|schedule|inputs):/m)
  const guard = "if: ${{ github.repository == 'JohnDeved/populous-new-dawn' && github.ref == 'refs/heads/main' }}"
  assert.ok(workflow.indexOf(guard) < workflow.indexOf('environment: cloudflare-worker'))
  assert.match(workflow, /^permissions: \{\}/m)
  assert.match(workflow, /    permissions:\n      contents: read\n/)
  assert.doesNotMatch(workflow, /: write|secrets: inherit|CLOUDFLARE_ACTIONS_MODE|wrangler-action|versions upload|deployments|npm install|pnpm install/)
  assert.match(workflow, /ref: \$\{\{ github.sha \}\}/)
  assert.match(workflow, /persist-credentials: false/)
  assert.match(workflow, /node-version: '24\.19\.0'/)
  for (const match of workflow.matchAll(/uses: (\S+)/g)) assert.match(match[1], /@[a-f0-9]{40}$/)
  assert.equal((workflow.match(/secrets\.CLOUDFLARE_API_TOKEN/g) || []).length, 1)
  assert.match(workflow, /      - name: Verify stored credential read access only\n        env:\n          CLOUDFLARE_API_TOKEN: \$\{\{ secrets.CLOUDFLARE_API_TOKEN \}\}\n        run: node scripts\/cloudflare\/verify-access.mjs/)
})
