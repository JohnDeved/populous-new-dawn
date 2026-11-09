// Plain React fixture imports the unchanged production Home, CSS and assets.
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/postcss'
import { mkdirSync, writeFileSync, symlinkSync, existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { launchOptions } from '../../scripts/local-render/harness.mjs'
const root = process.cwd(), output = resolve(process.env.POPULOUS_UI_PRELOAD_OUTPUT)
const fixture = resolve(output, 'fixture'), port = 4401
mkdirSync(fixture, { recursive: true })
for (const name of ['app', 'node_modules']) {
  const target = resolve(fixture, name)
  if (!existsSync(target)) symlinkSync(resolve(root, name), target, 'dir')
}
writeFileSync(resolve(fixture, 'index.html'), '<div id="root"></div><script type="module" src="/main.tsx"></script>')
writeFileSync(resolve(fixture, 'main.tsx'), "import {createRoot} from 'react-dom/client'; import Home from './app/page.tsx'; import './app/globals.css'; createRoot(document.getElementById('root')).render(<Home />)")
const hash = file => createHash('sha256').update(readFileSync(file)).digest('hex')
const files = execFileSync('git', ['ls-files', 'app', 'public', 'package.json', 'package-lock.json', 'scripts/browser-game.mjs', 'scripts/browser-new-game.mjs', 'scripts/local-render/harness.mjs', 'scripts/local-render/ui-preload-baseline.mjs'], { encoding: 'utf8' }).trim().split('\n')
const inputs = Object.fromEntries(files.map(file => [file, hash(file)]))
const metadata = { source: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), inputs,
  runnerSha256: hash(import.meta.filename), browserSha256: hash(process.env.POPULOUS_BROWSER),
  node: process.version, platform: process.platform, arch: process.arch,
  installedLockSha256: hash('node_modules/.package-lock.json'),
  limits: ['Actual Home, store, GameScene, CSS and assets through a plain React/Vite fixture; excludes Vinext/Cloudflare/RSC serving and hydration.', 'Actual Home frontend navigation with gated network responses and forwarding image-decode observation; no application state/readiness injection. Cold context; routing disables HTTP cache while enabled; reopen is same-document reuse, not an HTTP-cache benchmark.', 'Sandboxed headless Chrome; no hardware performance or native parity claim.'] }
writeFileSync(resolve(output, 'source.json'), JSON.stringify(metadata, null, 2) + '\n')
const server = await createServer({ configFile: false, root: fixture, publicDir: resolve(root, 'public'),
  cacheDir: resolve(fixture, 'cache'), plugins: [react()], css: { postcss: { plugins: [tailwindcss({ base: fixture })] } },
  server: { host: '127.0.0.1', port, strictPort: true, fs: { allow: [root] } }, logLevel: 'warn' })
let browser, context, timer
const profile = mkdtempSync(resolve(tmpdir(), 'pnd-ui-preload-'))
try {
  await server.listen()
  const launch = launchOptions(process.env.POPULOUS_BROWSER)
  const actualLaunch = { ...launch, args: [...launch.args, `--user-data-dir=${profile}`] }
  metadata.actualLaunch = actualLaunch
  browser = await chromium.launch(actualLaunch)
  metadata.browserVersion = browser.version()
  writeFileSync(resolve(output, 'source.json'), JSON.stringify(metadata, null, 2) + '\n')
  context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await context.newPage()
  page.setDefaultTimeout(30000)
  timer = setTimeout(() => { void browser.close() }, 180000)
  process.env.POPULOUS_URL = `http://127.0.0.1:${port}`
  const scenario = (await import(pathToFileURL(resolve(root, 'scripts/local-render/ui-preload-baseline.mjs')))).default
  console.log(JSON.stringify(await scenario({ page, context, output, url: process.env.POPULOUS_URL })))
} finally {
  clearTimeout(timer)
  await context?.close()
  await browser?.close()
  await server.close()
  rmSync(profile, { recursive: true, force: true })
  for (const [file, expected] of Object.entries(inputs)) assert.equal(hash(file), expected, `Source drift: ${file}`)
  console.log('Production and probe inputs unchanged after run')
}
