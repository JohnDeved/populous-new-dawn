// Opt-in checker regression. Uses the actual maintained local-render Vite config;
// starts no HTTP listener or browser and never imports/runs a game World.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const root = fileURLToPath(new URL('../../', import.meta.url))
assert.equal(resolve(process.env.POPULOUS_GAME_ROOT ?? root), resolve(root))
process.env.POPULOUS_GAME_ROOT = root
const configFile = resolve(root, 'scripts/local-render/vite.config.mjs')
const sha256 = value => createHash('sha256').update(value).digest('hex')
let server
try {
  server = await createServer({ configFile, server: { middlewareMode: true, hmr: false, watch: null } })
  const client = server.environments.client
  assert.ok(client, 'The maintained configuration must expose its real client transform pipeline')
  // The observed old assertion name is a real failure control through that same
  // pipeline, with an existing QA module ID; no source file is replaced.
  const legacy = 'const require = (ok, message) => { if (!ok) throw Error(message) }; export const keys = (v, allowed) => require(Object.keys(v).every(k => allowed.includes(k)), "legacy assertion");'
  await assert.rejects(() => client.pluginContainer.transform(legacy, resolve(root, 'qa/blast-ordinary/contract.mjs')), /invalid import|cannot be statically analyzed/i)
  const transformed = []
  for (const path of ['qa/blast-ordinary/contract.mjs', 'qa/blast-ordinary/setup-observer.mjs', 'qa/blast-ordinary/observer.mjs']) {
    const result = await server.transformRequest(`/${path}`)
    assert.ok(result?.code, `No transformed module returned for ${path}`)
    transformed.push({ path, sourceSha256: sha256(readFileSync(resolve(root, path))), transformedSha256: sha256(result.code) })
  }
  console.log(JSON.stringify({ status: 'passed', configFile, configSha256: sha256(readFileSync(configFile)), legacyFailureObserved: true, transformed, limits: 'Real Vite client transform only; no ordinary-input, render or gameplay result.' }, null, 2))
} finally {
  await server?.close()
}
