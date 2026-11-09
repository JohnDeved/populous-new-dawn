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
const root = process.cwd(), output = resolve(process.env.POPULOUS_PROFILE_RECOVERY_OUTPUT)
const fixture = resolve(output, 'fixture'), port = 4400
mkdirSync(fixture, { recursive: true })
for (const name of ['app', 'scripts', 'node_modules']) {
  const target = resolve(fixture, name)
  if (!existsSync(target)) symlinkSync(resolve(root, name), target, 'dir')
}
writeFileSync(resolve(fixture, 'index.html'), '<div id="root"></div><script type="module" src="/main.tsx"></script>')
writeFileSync(resolve(fixture, 'main.tsx'), "import {createRoot} from 'react-dom/client'; import Home from './app/page.tsx'; import './app/globals.css'; createRoot(document.getElementById('root')).render(<Home />)")
const hash = file => createHash('sha256').update(readFileSync(file)).digest('hex')
const files = execFileSync('git', ['ls-files', 'app', 'public', 'package.json', 'package-lock.json', 'scripts/browser-game.mjs', 'scripts/browser-new-game.mjs', 'scripts/local-render/harness.mjs', 'scripts/local-render/campaign-profile-recovery.mjs', 'scripts/local-render/checkpoint-observer.mjs', 'scripts/checkpoint-readback.mjs', 'scripts/campaign-start-readiness.mjs'], { encoding: 'utf8' }).trim().split('\n')
const inputs = Object.fromEntries(files.map(file => [file, hash(file)]))
const metadata = { source: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), inputs,
  runnerSha256: hash(import.meta.filename), browserSha256: hash(process.env.POPULOUS_BROWSER),
  node: process.version, platform: process.platform, arch: process.arch,
  installedLockSha256: hash('node_modules/.package-lock.json'),
  limits: ['Actual Home, store, GameScene, CSS and assets through a plain React/Vite fixture; excludes Vinext/Cloudflare/RSC serving and hydration.', 'Nine real IndexedDB cases. Seeded records/direct restore are explicit diagnostic fixtures; ordinary Start/Save/page-reload/Load is separately observed without storage or gameplay injection.', 'Sandboxed headless Chrome; no hardware performance or native parity claim.'] }
writeFileSync(resolve(output, 'source.json'), JSON.stringify(metadata, null, 2) + '\n')
const server = await createServer({ configFile: false, root: fixture, publicDir: resolve(root, 'public'),
  cacheDir: resolve(fixture, 'cache'), plugins: [react()], css: { postcss: { plugins: [tailwindcss({ base: fixture })] } },
  server: { host: '127.0.0.1', port, strictPort: true, fs: { allow: [root] } }, logLevel: 'warn' })
let browser, context, timer
const signal = new AbortController()
const profile = mkdtempSync(resolve(tmpdir(), 'pnd-profile-recovery-'))
try {
  await server.listen()
  const launch = launchOptions(process.env.POPULOUS_BROWSER)
  browser = await chromium.launch({ ...launch, args: [...launch.args, `--user-data-dir=${profile}`] })
  metadata.browserVersion = browser.version()
  writeFileSync(resolve(output, 'source.json'), JSON.stringify(metadata, null, 2) + '\n')
  context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await context.newPage()
  page.setDefaultTimeout(30000)
  timer = setTimeout(() => { signal.abort(Error('Five-minute profile matrix limit')); void browser.close() }, 300000)
  process.env.POPULOUS_URL = `http://127.0.0.1:${port}`
  await page.goto(process.env.POPULOUS_URL, { waitUntil: 'networkidle' })
  await page.getByRole('dialog', { name: 'Main menu', exact: true }).waitFor()
  const scenario = (await import(pathToFileURL(resolve(root, 'scripts/local-render/campaign-profile-recovery.mjs')))).default
  const receipt = { browserVersion: browser.version(), launch, errors: [], warnings: [] }
  page.on('pageerror', error => receipt.errors.push(String(error)))
  page.on('console', message => {
    if (message.type() === 'error') receipt.errors.push(message.text())
    if (message.type() === 'warning') receipt.warnings.push(message.text())
  })
  try { console.log(JSON.stringify(await scenario({ page, output, root, browser, context, url: process.env.POPULOUS_URL, receipt, signal: signal.signal }))) }
  finally { writeFileSync(resolve(output, 'browser-events.json'), JSON.stringify(receipt, null, 2) + '\n') }
} finally {
  clearTimeout(timer)
  await context?.close()
  await browser?.close()
  await server.close()
  rmSync(profile, { recursive: true, force: true })
  for (const [file, expected] of Object.entries(inputs)) assert.equal(hash(file), expected, `Source drift: ${file}`)
  console.log('Production and probe inputs unchanged after run')
}
