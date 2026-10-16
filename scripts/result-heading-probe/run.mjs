import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, readlinkSync, writeFileSync } from 'node:fs'
import { resolve, relative } from 'node:path'
import { platform, arch, release } from 'node:os'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/postcss'
import { chromium } from '@playwright/test'

const root = resolve(import.meta.dirname, '../..')
const fixture = resolve(import.meta.dirname, 'fixture')
const output = resolve(process.argv[2] ?? 'work/result-heading-before')
const browserPath = process.env.POPULOUS_BROWSER
const port = Number(process.env.POPULOUS_RESULT_PORT ?? 4362)
const phase = process.env.POPULOUS_RESULT_PHASE ?? 'before'
assert.ok(['before', 'after'].includes(phase), 'Phase must be before or after')
assert.ok(browserPath && existsSync(browserPath), 'Set POPULOUS_BROWSER to the installed Chrome executable')
assert.ok(Number.isInteger(port) && port >= 1024 && port <= 65535)
assert.equal(existsSync(output), false, 'Use a fresh output directory')
mkdirSync(output, { recursive: true })

const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const hash = file => sha(readFileSync(file))
const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 32 * 1024 * 1024 }).toString().trim()
const inputs = [
  'app/original-result-screen.tsx', 'app/original-result-screen.module.css',
  'app/original-result-layout.ts', 'app/original-result-ui.json', 'app/hud-layout.ts',
  'app/globals.css', 'app/page.tsx', 'public/original/result-panel.png',
  'public/original/result-font.png', 'package.json', 'package-lock.json', 'tsconfig.json',
  'scripts/result-heading-probe/run.mjs', 'scripts/result-heading-probe/fixture/main.tsx',
  'scripts/result-heading-probe/fixture/index.html',
]
function treeHashes(directory, prefix = '') {
  const result = {}
  for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const file = resolve(directory, entry.name), key = prefix + entry.name
    if (entry.isDirectory()) Object.assign(result, treeHashes(file, key + '/'))
    else if (entry.isSymbolicLink()) result[key] = { link: readlinkSync(file), targetSha256: hash(file) }
    else if (entry.isFile()) result[key] = hash(file)
  }
  return result
}
const snapshot = () => ({
  head: git('rev-parse', 'HEAD'), diffSha256: sha(git('diff', 'HEAD', '--binary')),
  files: Object.fromEntries(inputs.map(file => [file, hash(resolve(root, file))])),
  dependencies: treeHashes(resolve(root, 'node_modules')),
})
const art = JSON.parse(readFileSync(resolve(root, 'app/original-result-ui.json')))
const width = text => [...text].reduce((sum, c) => sum + (art.font.rects[c.charCodeAt(0) - 32]?.advance ?? 8), 0)
const longest = Object.entries(art.titles).sort((a, b) => width(b[1]) - width(a[1]))[0]
const cases = []
for (const viewport of [{ width: 640, height: 480 }, { width: 1920, height: 1080 }]) {
  for (const status of ['won', 'lost']) for (const level of [1, Number(longest[0])]) {
    cases.push({ viewport, status, level })
  }
}
const receipt = {
  status: 'running', phase, command: process.argv, startedAt: new Date().toISOString(),
  node: { version: process.version, binary: process.execPath, sha256: hash(process.execPath) },
  host: { platform: platform(), arch: arch(), release: release() },
  browserPath, browserSha256: hash(browserPath), cases, longestRetainedTitle: longest,
  observations: [], errors: [], expectedFontFailures: [], screenshots: {},
  limits: [
    'Observation only: use compare.mjs for matched fallback-centering acceptance.',
    'Real OriginalResultScreen, globals.css and hudScale; neutral battlefield and inert callbacks.',
    'No Home lifecycle, natural game outcome, native execution or hardware performance claim.',
    'Delay recovery uses the same component mount; failed decode recovery reloads a fresh mount.',
    'DOM advance-box offsets require inspection of retained screenshots before calling a visual defect.',
  ],
}
const save = () => writeFileSync(resolve(output, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n')
const fontBytes = readFileSync(resolve(root, 'public/original/result-font.png'))
let before, browser, server, timer, timeoutClose
save()

async function capture(page, scenario, stage, fontReady) {
  await page.waitForFunction(ready => document.querySelector('[data-original-result]')?.dataset.fontReady === String(ready), fontReady)
  await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))))
  const details = await page.locator('[data-original-result]').evaluate((screen, layout) => {
    const box = node => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height } }
    const panel = screen.querySelector('section'), panelBox = box(panel)
    const scale = panelBox.width / layout.panelWidth
    const center = panelBox.x + (layout.contentInset[0] + layout.contentWidth / 2) * scale
    const headings = Array.from(panel.children).filter(node => node.getAttribute('role') === 'img').slice(0, 3).map(node => {
      const child = node.firstElementChild, b = box(child), line = box(node)
      return { label: node.getAttribute('aria-label'), line, content: b,
        localLeft: (line.x - panelBox.x) / scale, localTop: (line.y - panelBox.y) / scale,
        localWidth: b.width / scale, offsetPx: b.x + b.width / 2 - center,
        offsetLocal: (b.x + b.width / 2 - center) / scale,
        font: getComputedStyle(child).font, glyphs: child.querySelectorAll('i').length }
    })
    return { viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
      panel: panelBox, screen: box(screen), scale, targetCenterPx: center,
      hudScale: getComputedStyle(screen).getPropertyValue('--hud-scale'), headings,
      fontReady: screen.dataset.fontReady, panelFailed: screen.dataset.panelFailed,
      panelDecoded: Boolean(panel.querySelector('img')?.naturalWidth) }
  }, art.layout640)
  assert.deepEqual(details.viewport, { ...scenario.viewport, dpr: 1 })
  assert.equal(details.panelFailed, 'false')
  assert.equal(details.panelDecoded, true)
  const texts = [art.titles[String(scenario.level)], `${art.labels.player} 1.`,
    `${art.labels.status}: ${scenario.status === 'won' ? art.labels.completed : art.labels.failed}`]
  assert.deepEqual(details.headings.map(h => h.label), texts)
  const ys = [art.layout640.headingY, art.layout640.playerY, art.layout640.statusY]
  for (const [i, heading] of details.headings.entries()) {
    heading.nativeExpected = { left: art.layout640.contentInset[0] + Math.floor((art.layout640.contentWidth - width(texts[i])) / 2), top: ys[i], width: width(texts[i]) }
    if (fontReady) {
      assert.ok(Math.abs(heading.localLeft - heading.nativeExpected.left) < 0.02, 'Ready native left changed')
      assert.ok(Math.abs(heading.localTop - ys[i]) < 0.02, 'Ready native top changed')
      assert.ok(Math.abs(heading.localWidth - width(texts[i])) < 0.02, 'Ready native width changed')
      assert.equal(heading.glyphs, texts[i].length)
    } else assert.equal(heading.glyphs, 0, 'Fallback must actually render')
  }
  const name = `${scenario.status}-level${scenario.level}-${scenario.viewport.width}x${scenario.viewport.height}-${stage}.png`
  await page.screenshot({ path: resolve(output, name), animations: 'disabled' })
  receipt.screenshots[name] = hash(resolve(output, name))
  receipt.observations.push({ ...scenario, stage, screenshot: name, ...details })
  save()
  return details
}

try {
  before = snapshot()
  writeFileSync(resolve(output, 'inputs-before.json'), JSON.stringify(before, null, 2) + '\n')
  receipt.inputsBeforeSha256 = hash(resolve(output, 'inputs-before.json')); save()
  server = await createServer({
    configFile: false, root: fixture, publicDir: resolve(root, 'public'),
    cacheDir: resolve(output, 'vite-cache'), plugins: [react()],
    css: { postcss: { plugins: [tailwindcss({ base: fixture })] } },
    server: { host: '127.0.0.1', port, strictPort: true, fs: { allow: [root] } }, logLevel: 'warn',
  })
  await server.listen()
  receipt.serverAddress = server.httpServer.address(); save()
  browser = await chromium.launch({ executablePath: browserPath, headless: true, chromiumSandbox: true, timeout: 30000 })
  receipt.browserVersion = browser.version()
  timer = setTimeout(() => {
    receipt.timedOut = true
    timeoutClose = browser.close().catch(error => receipt.errors.push(`Timeout cleanup: ${error}`))
  }, 180000)
  for (const scenario of cases) {
    const context = await browser.newContext({ viewport: scenario.viewport, deviceScaleFactor: 1 })
    let releaseFont
    try {
      const page = await context.newPage()
      page.setDefaultTimeout(15000)
      page.on('pageerror', error => receipt.errors.push(String(error)))
      page.on('crash', () => receipt.errors.push('Page crashed'))
      page.on('console', message => { if (message.type() === 'error') receipt.errors.push(message.text()) })
      page.on('requestfailed', request => receipt.errors.push(`${request.url()}: ${request.failure()?.errorText}`))
      let mode = 'ready', notifyDelayed
      const delayedRequest = new Promise(done => { notifyDelayed = done })
      const gate = new Promise(done => { releaseFont = done })
      await page.route('**/original/result-font.png', async route => {
        if (mode === 'delayed') { notifyDelayed(); await gate }
        if (mode === 'failed') {
          receipt.expectedFontFailures.push({ scenario, url: route.request().url(), response: '200 invalid PNG bytes' })
          await route.fulfill({ status: 200, contentType: 'image/png', body: 'deliberately invalid PNG' })
        } else await route.fulfill({ status: 200, contentType: 'image/png', body: fontBytes })
      })
      const url = `http://127.0.0.1:${port}/?status=${scenario.status}&level=${scenario.level}`
      const open = async () => {
        await page.goto(url, { waitUntil: 'domcontentloaded' })
        await page.locator('[data-original-result] section img').evaluate(img => img.decode())
      }
      await open()
      if (!receipt.renderer) receipt.renderer = await page.evaluate(() => {
        const gl = document.createElement('canvas').getContext('webgl2')
        if (!gl) return { available: false }
        const debug = gl.getExtension('WEBGL_debug_renderer_info')
        return { renderer: gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER), version: gl.getParameter(gl.VERSION) }
      })
      const ready = await capture(page, scenario, 'ready', true)
      mode = 'failed'
      await open()
      // A separate decode confirms the intercepted response is invalid, without replacing Image or component state.
      assert.equal(await page.evaluate(async () => { const img = new Image(); img.src = '/original/result-font.png'; try { await img.decode(); return true } catch { return false } }), false)
      await capture(page, scenario, 'failed', false)
      mode = 'ready'
      await open()
      const failedRecovery = await capture(page, scenario, 'failed-reload-recovered', true)
      assert.deepEqual(failedRecovery.headings, ready.headings, 'Ready geometry changed after failed reload')
      mode = 'delayed'
      await open()
      await Promise.race([delayedRequest, new Promise((_, reject) => {
        const timeout = setTimeout(() => reject(Error('Delayed font request was not intercepted')), 15000)
        delayedRequest.then(() => clearTimeout(timeout))
      })])
      await capture(page, scenario, 'delayed', false)
      releaseFont()
      const recovery = await capture(page, scenario, 'delay-recovered', true)
      assert.deepEqual(recovery.headings, ready.headings, 'Ready geometry changed after delayed decode')
    } finally {
      releaseFont?.()
      await context.close()
    }
  }
  assert.equal(receipt.observations.length, 40)
  receipt.status = `completed-${phase}-observation`
} catch (error) {
  receipt.status = 'failed'; receipt.failure = String(error); receipt.stack = error.stack; process.exitCode = 1
} finally {
  clearTimeout(timer)
  await timeoutClose
  for (const [name, close] of [['browser', () => browser?.close()], ['server', () => server?.close()]]) {
    try { await close(); receipt[`${name}Closed`] = true }
    catch (error) { receipt.errors.push(`${name} cleanup: ${error}`) }
  }
  try {
    const after = snapshot()
    writeFileSync(resolve(output, 'inputs-after.json'), JSON.stringify(after, null, 2) + '\n')
    receipt.inputsAfterSha256 = hash(resolve(output, 'inputs-after.json'))
    assert.deepEqual(after, before, 'Source or dependencies changed during observation')
    receipt.inputsUnchanged = true
  } catch (error) { receipt.errors.push(String(error)) }
  if (receipt.errors.length || receipt.timedOut) { receipt.status = 'failed'; process.exitCode = 1 }
  receipt.endedAt = new Date().toISOString(); save()
  console.log(JSON.stringify({ status: receipt.status, observations: receipt.observations.length, output: relative(root, output), errors: receipt.errors }))
}
