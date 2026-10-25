import test from 'node:test'
import assert from 'node:assert/strict'
import { inspect } from 'node:util'
import { cfRequest } from '../scripts/cloudflare/control.mjs'
import { account, worker } from '../scripts/cloudflare/protocol.mjs'

const synthetic = 'SYNTHETIC_CF_CREDENTIAL_not_a_real_token_92q'
const responseSecret = 'SYNTHETIC_PRIVATE_API_RESPONSE_37z'
const path = `/accounts/${account}/workers/scripts/${worker}/secrets`
const invalid = 'Cloudflare request not sent: invalid credential or request input.'
const transport = 'Cloudflare transport failed; remote outcome is uncertain. Inspect before retrying.'
const unconfirmed = 'Cloudflare response did not confirm success; remote outcome is uncertain. Inspect before retrying.'
const withStatus = status => `Cloudflare response did not confirm success (HTTP ${status}); remote outcome is uncertain. Inspect before retrying.`

// Sequential tests overwrite, then remove this process-local synthetic value.
// Never read or preserve a real credential; every request uses a mocked fetch.
function fixture(t, token = synthetic, fetch = () => { throw new Error('Unexpected mock request') }) {
  delete process.env.CLOUDFLARE_API_TOKEN
  if (token !== null) process.env.CLOUDFLARE_API_TOKEN = token
  t.after(() => { delete process.env.CLOUDFLARE_API_TOKEN })
  return t.mock.method(globalThis, 'fetch', fetch)
}
async function safeRejection(promise, expected) {
  await assert.rejects(promise, error => {
    assert.equal(error.constructor, Error)
    assert.equal(error.message, expected)
    assert.equal(Object.hasOwn(error, 'cause'), false)
    assert.deepEqual(Object.getOwnPropertyNames(error).sort(), ['message', 'stack'])
    for (const rendered of [String(error), error.stack, inspect(error, { depth: null }), JSON.stringify(error)]) {
      assert.equal(rendered.includes(synthetic), false)
      assert.equal(rendered.includes(responseSecret), false)
    }
    return true
  })
}

test('malformed or missing credentials are rejected verbatim before any fetch', async t => {
  for (const token of [null, '', ` ${synthetic}`, `${synthetic} `, `${synthetic}\n`, `${synthetic}\r`,
    `${synthetic}\r\nSECOND_LINE`, `${synthetic}\nSECOND_LINE`, `${synthetic}\t`,
    `${synthetic}\u0001`, `${synthetic}\u007f`, `${synthetic}é`, `Bearer ${synthetic}`,
    `"${synthetic}"`, `${synthetic}=middle`, `=${synthetic}`]) {
    await t.test('reject malformed synthetic input without reflecting it', async t => {
      const fetch = fixture(t, token)
      await safeRejection(cfRequest(path), invalid)
      assert.equal(fetch.mock.callCount(), 0)
    })
  }
})
test('valid bearer token bytes and GET request arguments remain unchanged', async t => {
  const token = `${synthetic}.-_~+/==`
  const fetch = fixture(t, token, async (url, options) => {
    assert.equal(url, `https://api.cloudflare.com/client/v4${path}`)
    assert.deepEqual(options, { method: 'GET', redirect: 'error',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } })
    return Response.json({ success: true, result: [] })
  })
  assert.deepEqual(await cfRequest(path), [])
  assert.equal(fetch.mock.callCount(), 1)
})
test('valid production POST serialization and returned result remain unchanged', async t => {
  const body = { strategy: 'percentage', versions: [{ version_id: 'version-id', percentage: 100 }] }
  const deploymentPath = path.replace(/secrets$/, 'deployments')
  const fetch = fixture(t, synthetic, async (url, options) => {
    assert.equal(url, `https://api.cloudflare.com/client/v4${deploymentPath}`)
    assert.deepEqual(options, { method: 'POST', redirect: 'error',
      headers: { Authorization: `Bearer ${synthetic}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    return Response.json({ success: true, result: { id: 'deployment-id' } })
  })
  assert.deepEqual(await cfRequest(deploymentPath, { method: 'POST', body }), { id: 'deployment-id' })
  assert.equal(fetch.mock.callCount(), 1)
})
test('invalid method, target, options and body exceptions fail safely before fetch', async t => {
  const fetch = fixture(t)
  for (const options of [{ method: `GET\r\n${synthetic}` }, { method: 'TRACE' }, null,
    { get method() { throw new Error(synthetic) } },
    { method: 'POST', body: { toJSON() { throw new Error(synthetic) } } }]) {
    await safeRejection(cfRequest(path, options), invalid)
  }
  await safeRejection(cfRequest(`/invalid/${synthetic}`), invalid)
  await safeRejection(cfRequest(null), invalid)
  assert.equal(fetch.mock.callCount(), 0)
})
test('fetch exceptions discard their message, cause, stack and custom properties', async t => {
  const fetch = fixture(t, synthetic, async () => {
    const error = new Error(synthetic, { cause: new Error(responseSecret) })
    error.stack = `${synthetic}\n${responseSecret}`
    error.headers = { Authorization: synthetic }
    throw error
  })
  await safeRejection(cfRequest(path), transport)
  assert.equal(fetch.mock.callCount(), 1)
})
test('unreadable or invalid responses never reflect response bodies or parser errors', async t => {
  const responses = [
    [() => new Response(`invalid JSON ${synthetic} ${responseSecret}`), withStatus(200)],
    [() => Response.json({ success: `${synthetic} ${responseSecret}` }), withStatus(200)],
    [() => Response.json({ success: false, errors: [{ message: `${synthetic} ${responseSecret}` }] }), withStatus(200)],
    [() => Response.json(null), withStatus(200)],
    [() => new Response(`${synthetic} ${responseSecret}`, { status: 403 }), withStatus(403)],
    [() => new Response('x'.repeat(1024 * 1024 + 1)), withStatus(200)],
    [() => ({ ok: true, body: { async *[Symbol.asyncIterator]() {
      yield Buffer.from('partial response'); throw new Error(`${synthetic} ${responseSecret}`)
    } } }), unconfirmed],
  ]
  for (const [response, expected] of responses) {
    await t.test('reject unconfirmed mock response with uncertain outcome', async t => {
      const fetch = fixture(t, synthetic, async () => response())
      await safeRejection(cfRequest(path), expected)
      assert.equal(fetch.mock.callCount(), 1)
    })
  }
})
test('only integer HTTP status 100 through 599 can reach a response diagnostic', async t => {
  for (const status of [100, 401, 403, 500, 599]) {
    await t.test('preserve a valid numeric HTTP status', async t => {
      const fetch = fixture(t, synthetic, async () => ({ ok: false, status }))
      await safeRejection(cfRequest(path), withStatus(status))
      assert.equal(fetch.mock.callCount(), 1)
    })
  }
  let conversions = 0
  const hostile = { toString() { conversions++; throw new Error(synthetic) },
    valueOf() { conversions++; throw new Error(responseSecret) } }
  for (const status of [undefined, null, '403', synthetic, NaN, Infinity, 99, 600, 403.5, hostile]) {
    await t.test('discard an invalid status without coercing it', async t => {
      const fetch = fixture(t, synthetic, async () => ({ ok: false, status }))
      await safeRejection(cfRequest(path), unconfirmed)
      assert.equal(fetch.mock.callCount(), 1)
      assert.equal(conversions, 0)
    })
  }
  await t.test('discard a throwing status accessor and its original exception', async t => {
    const fetch = fixture(t, synthetic, async () => ({ ok: false,
      get status() { throw new Error(synthetic, { cause: new Error(responseSecret) }) } }))
    await safeRejection(cfRequest(path), unconfirmed)
    assert.equal(fetch.mock.callCount(), 1)
  })
})
