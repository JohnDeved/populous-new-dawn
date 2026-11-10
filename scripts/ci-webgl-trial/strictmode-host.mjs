import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import { observedHome, fixtureMain } from './strictmode-transform.mjs'

const [rootArg, outputArg, revision] = process.argv.slice(2)
const root = resolve(rootArg), output = resolve(outputArg)
assert.equal(revision, '1a8dec3c9d5dce83051c3e8faae0b93a127dd11e')
assert.ok(!process.env.NODE_ENV || process.env.NODE_ENV === 'development')
process.env.NODE_ENV = 'development'
const require = createRequire(resolve(root, 'package.json'))
const dependency = name => import(pathToFileURL(require.resolve(name)).href)
const { createServer } = await dependency('vite')
const { default: react } = await dependency('@vitejs/plugin-react')
const { default: tailwindcss } = await dependency('@tailwindcss/postcss')
const fixture = resolve(root, 'work/hud-strictmode-fixture')
assert.equal(existsSync(fixture), false, 'Fresh test host only')
mkdirSync(fixture, { recursive: true })
const home = resolve(root, 'app/page.tsx'), probe = resolve(import.meta.dirname, 'strictmode-probe.mjs')
const hash = value => createHash('sha256').update(value).digest('hex')
const source = readFileSync(home, 'utf8'), observed = observedHome(source)
const main = fixtureMain('/@fs' + home, '/@fs' + resolve(root, 'app/globals.css'), '/@fs' + probe)
const html = '<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Populous HUD development StrictMode fixture</title></head><body><div id="root"></div><script type="module" src="/main.tsx"></script></body></html>'
writeFileSync(resolve(fixture, 'main.tsx'), main)
writeFileSync(resolve(fixture, 'index.html'), html)
const receipt = { status: 'starting', root, fixture, revision, mode: 'development', node: process.version,
  originalHomeSha256: hash(source), observedHomeSha256: hash(observed), mainSha256: hash(main), htmlSha256: hash(html), transforms: 0, closed: false }
const save = () => writeFileSync(resolve(output, 'host.json'), JSON.stringify(receipt, null, 2) + '\n')
save()
let server, closing = false
async function close(signal) {
  if (closing) return
  closing = true
  try { await server?.close(); receipt.closed = true; receipt.signal = signal; if (receipt.status !== 'failed') receipt.status = 'closed'; save() }
  catch (error) { receipt.status = 'failed'; receipt.failure = String(error); save(); process.exitCode = 1 }
}
process.once('SIGTERM', () => { void close('SIGTERM') })
process.once('SIGINT', () => { void close('SIGINT') })
try {
  server = await createServer({ configFile: false, mode: 'development', root: fixture,
    publicDir: resolve(root, 'public'), cacheDir: resolve(root, 'work/hud-strictmode-cache'),
    define: { __PND_BUILD_REVISION__: JSON.stringify(revision) },
    resolve: { dedupe: ['react', 'react-dom', 'three'] },
    css: { postcss: { plugins: [tailwindcss({ base: root })] } },
    plugins: [{ name: 'observe-one-hud-subscription', enforce: 'pre', transform(code, id) {
      if (id.split('?')[0] !== home) return
      assert.equal(code, source)
      if (++receipt.transforms > 4) throw Error('Unexpected repeated Home transform')
      save()
      return { code: observedHome(code), map: null }
    } }, react()],
    server: { host: '127.0.0.1', port: 5200, strictPort: true, hmr: false, open: false,
      fs: { strict: true, allow: [root, import.meta.dirname] }, watch: { ignored: ['**/work/**'] } },
  })
  await server.listen()
  receipt.status = 'ready'; receipt.url = 'http://127.0.0.1:5200/'; save()
} catch (error) {
  receipt.status = 'failed'; receipt.failure = error?.stack ?? String(error); save()
  await close('startup-failure'); process.exitCode = 1
}
