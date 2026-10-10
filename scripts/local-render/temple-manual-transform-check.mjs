// Node-only maintained Vite pipeline check in middleware mode; no browser/gameplay.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createServer } from 'vite'

const root = process.cwd(),
  started = Date.now(),
  bounds = { ms: 45000, modules: 1024, bytes: 64 * 1024 * 1024 }
assert.equal(process.env.POPULOUS_GAME_ROOT, root)
assert.equal(process.env.CLOUDFLARE_CF_FETCH_ENABLED, 'false')
assert(process.env.TMPDIR?.startsWith(resolve(root, 'work/')))
const file = 'scripts/local-render/temple-manual-witness.mjs'
const old = execFileSync('git', ['show', `02da50391dd2968d7389a78160370bafb6004f51:${file}`], {
  encoding: 'utf8',
})
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const report = {
  bounds,
  baselineSha256: sha(old),
  currentSha256: sha(readFileSync(file)),
  modules: [],
  bytes: 0,
}
let server
try {
  server = await createServer({
    configFile: resolve(root, 'scripts/local-render/vite.config.mjs'),
    cacheDir: resolve(process.env.TMPDIR, 'node_modules/.vite'),
    server: { middlewareMode: true, hmr: false, watch: null },
  })
  assert(!server.httpServer?.listening, 'Transform check must not listen')
  assert.equal(server.config.server.hmr, false)
  assert(server.config.plugins.some(plugin => plugin.name.includes('commonjs')))
  try {
    await server.environments.client.pluginContainer.transform(old, resolve(root, file))
    assert.fail('Historical local require must reproduce the real maintained transform rejection')
  } catch (error) {
    assert.match(String(error), /invalid import.*require|cannot be statically analyzed/s)
    report.baselineRejected = String(error)
  }
  const queue = [
      '/' + file,
      '/scripts/local-render/temple-training-witness.mjs',
      '/scripts/local-render/temple-training-checkpoint.mjs',
    ],
    seen = new Set()
  while (queue.length) {
    assert(Date.now() - started < bounds.ms, 'Transform closure exceeded time bound')
    const url = queue.shift()
    if (seen.has(url)) continue
    seen.add(url)
    assert(seen.size <= bounds.modules, 'Transform closure exceeded module bound')
    const result = await server.transformRequest(url)
    assert(result?.code, `No maintained transformed module: ${url}`)
    report.bytes += Buffer.byteLength(result.code)
    assert(report.bytes <= bounds.bytes, 'Transform closure exceeded byte bound')
    report.modules.push({ url, sha256: sha(result.code), bytes: Buffer.byteLength(result.code) })
    const module = await server.moduleGraph.getModuleByUrl(url)
    for (const imported of module.importedModules)
      if (/^\/(app|qa|scripts)\//.test(imported.url)) queue.push(imported.url)
  }
  assert(report.modules.some(row => row.url === '/qa/erosion-ordinary/input.mjs'))
  report.status = 'passed'
} catch (error) {
  report.status = 'failed'
  report.failure = String(error?.stack ?? error)
  process.exitCode = 1
} finally {
  try {
    await server?.close()
    report.closed = !!server
  } catch (error) {
    report.status = 'failed'
    report.cleanupFailure = String(error)
    process.exitCode = 1
  }
  report.elapsedMs = Date.now() - started
  console.log(JSON.stringify(report))
}
