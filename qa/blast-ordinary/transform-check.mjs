// Opt-in checker regression. Uses the actual maintained local-render Vite config;
// disables the main Vite HTTP/HMR listener and never starts a browser or game World.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const root = fileURLToPath(new URL('../../', import.meta.url))
assert.equal(resolve(process.env.POPULOUS_GAME_ROOT ?? root), resolve(root))
process.env.POPULOUS_GAME_ROOT = root
const configFile = resolve(root, 'scripts/local-render/vite.config.mjs')
const cacheDir = process.env.POPULOUS_TRANSFORM_CACHE
assert.ok(cacheDir && isAbsolute(cacheDir) && relative(root, cacheDir).startsWith('work/orchestration/'), 'A dedicated absolute cache under work/orchestration is required')
assert.equal(existsSync(cacheDir), false, 'Preserve old transform caches; use a fresh path')
const sha256 = value => createHash('sha256').update(value).digest('hex')
let server
try {
  server = await createServer({ configFile, cacheDir, server: { middlewareMode: true, hmr: false, watch: null } })
  assert.equal(server.httpServer, null, 'The main Vite HTTP listener must remain absent')
  assert.equal(server.config.server.hmr, false, 'HMR must be disabled')
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
  console.log(JSON.stringify({ status: 'passed', configFile, cacheDir, mainHttpListener: false, hmr: false, configSha256: sha256(readFileSync(configFile)), legacyFailureObserved: true, transformed, limits: 'Real Vite client transform only; no ordinary-input, render or gameplay result.' }, null, 2))
} finally {
  await server?.close()
}
