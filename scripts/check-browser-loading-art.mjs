import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { inflateSync } from 'node:zlib'
import { chromium } from '@playwright/test'
import { bindGame } from './browser-game.mjs'

const url = process.env.POPULOUS_URL ?? 'http://localhost:3000'
const MASK_SHA256 = '73437a1d2e8ec54551489d2c39d0e293aa1f52072f3287fd2b9e58ece3fe190d'

function sha256(data) {
  return createHash('sha256').update(data).digest('hex')
}

function verifyMaskPng() {
  const png = readFileSync(new URL('../public/original/loading-mask.png', import.meta.url))
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10])
  let at = 8,
    width = 0,
    height = 0,
    bitDepth = 0,
    colorType = 0
  const idat = []
  while (at < png.length) {
    const length = png.readUInt32BE(at),
      kind = png.toString('ascii', at + 4, at + 8),
      data = png.subarray(at + 8, at + 8 + length)
    at += length + 12
    if (kind === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      bitDepth = data[8]
      colorType = data[9]
    } else if (kind === 'IDAT') idat.push(data)
    else if (kind === 'IEND') break
  }
  assert.equal(width, 130)
  assert.equal(height, 161)
  assert.equal(bitDepth, 8)
  assert.equal(colorType, 6)
  const raw = inflateSync(Buffer.concat(idat)),
    stride = width * 4,
    alpha = Buffer.alloc(width * height)
  assert.equal(raw.length, height * (stride + 1))
  for (let y = 0; y < height; y++) {
    const row = y * (stride + 1)
    assert.equal(raw[row], 0, 'importer must emit deterministic filter-0 rows')
    for (let x = 0; x < width; x++) {
      const pixel = row + 1 + x * 4,
        a = raw[pixel + 3]
      assert.equal(raw[pixel], 255)
      assert.equal(raw[pixel + 1], 255)
      assert.equal(raw[pixel + 2], 255)
      assert.ok(a === 0 || a === 255, `unexpected loading-mask alpha ${a}`)
      alpha[y * width + x] = a
    }
  }
  assert.equal(sha256(alpha), MASK_SHA256)
}

async function waitForCount(read, expected, timeout = 10000) {
  const end = Date.now() + timeout
  while (read() < expected && Date.now() < end) await new Promise(resolve => setTimeout(resolve, 25))
  assert.ok(read() >= expected, `expected ${expected} held requests, got ${read()}`)
}

async function selectMission(page, mission) {
  const button = page.getByRole('button', { name: `Mission ${mission}`, exact: true })
  await button.waitFor()
  await button.focus()
  await page.keyboard.press('Enter')
}

async function loadingLayout(page) {
  return page.evaluate(() => {
    const shell = document.querySelector('.game-shell'),
      overlay = document.querySelector('.loading-world'),
      art = document.querySelector('.loading-original-art'),
      img = art?.querySelector('img'),
      label = art?.querySelector('.loading-original-label')
    if (!shell || !overlay || !art || !img || !label) return null
    const s = shell.getBoundingClientRect(),
      o = overlay.getBoundingClientRect(),
      a = art.getBoundingClientRect(),
      i = img.getBoundingClientRect(),
      l = label.getBoundingClientRect()
    return {
      shell: { x: s.x, y: s.y, width: s.width, height: s.height },
      viewport: { width: innerWidth, height: innerHeight },
      overlay: { x: o.x, y: o.y, width: o.width, height: o.height },
      art: { x: a.x, y: a.y, width: a.width, height: a.height },
      image: { x: i.x, y: i.y, width: i.width, height: i.height },
      label: { x: l.x, y: l.y, width: l.width, height: l.height, text: label.textContent },
      natural: { width: img.naturalWidth, height: img.naturalHeight },
      source: img.getAttribute('src'),
      heading: overlay.querySelector('h2')?.textContent ?? null,
    }
  })
}

function assertOriginalLayout(layout) {
  assert.ok(layout)
  assert.deepEqual(layout.natural, { width: 130, height: 161 })
  assert.equal(layout.source, '/original/loading-mask.png')
  assert.equal(layout.art.width, 130)
  assert.equal(layout.art.height, 161)
  assert.equal(layout.image.width, 130)
  assert.equal(layout.image.height, 161)
  assert.equal(layout.label.text, 'Loading...')
  assert.equal(layout.heading, null)
  assert.equal(layout.shell.width, layout.viewport.width)
  assert.equal(layout.shell.height, layout.viewport.height)
  assert.ok(Math.abs(layout.shell.x) < 0.01, { shellX: layout.shell.x, layout })
  assert.ok(Math.abs(layout.shell.y) < 0.01, { shellY: layout.shell.y, layout })
  const expectedX = layout.shell.x + Math.trunc((layout.shell.width - 130) / 2),
    expectedY = layout.shell.y + Math.trunc((layout.shell.height - 161) / 2)
  assert.ok(Math.abs(layout.image.x - expectedX) < 0.01, { expectedX, actualX: layout.image.x, layout })
  assert.ok(Math.abs(layout.image.y - expectedY) < 0.01, { expectedY, actualY: layout.image.y, layout })
  assert.ok(Math.abs(layout.art.x - expectedX) < 0.01, { expectedX, actualX: layout.art.x, layout })
  assert.ok(Math.abs(layout.art.y - expectedY) < 0.01, { expectedY, actualY: layout.art.y, layout })
  assert.ok(layout.label.y + layout.label.height <= layout.image.y + 0.01, layout)
}

verifyMaskPng()

const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } }),
    page = await context.newPage(),
    pageErrors = []
  page.on('pageerror', error => pageErrors.push(error.stack ?? error.message))
  page.on('console', message => {
    if (message.type() === 'error' && !message.text().includes('Failed to load resource'))
      pageErrors.push(message.text())
  })

  let activeHold = null
  const beginHold = () => {
    assert.equal(activeHold, null)
    let settle
    const hold = {
      count: 0,
      gate: new Promise(resolve => { settle = resolve }),
      release() {
        if (activeHold === hold) activeHold = null
        settle('continue')
      },
      fail() {
        if (activeHold === hold) activeHold = null
        settle('fail')
      },
    }
    activeHold = hold
    return hold
  }
  await page.route('**/original/**', async route => {
    const pathname = new URL(route.request().url()).pathname,
      hold = activeHold
    if (hold && (pathname.endsWith('/landscape.bin') || pathname.endsWith('/waves.bin'))) {
      hold.count++
      const action = await hold.gate
      try {
        if (action === 'fail') await route.abort('failed')
        else await route.continue()
      } catch {}
      return
    }
    try { await route.continue() } catch {}
  })

  await page.goto(url, { waitUntil: 'networkidle' })
  assert.equal(await page.locator('.loading-original-art').count(), 0, 'mission choice must remain modern/browser UI')

  let hold = beginHold()
  await selectMission(page, 1)
  await waitForCount(() => hold.count, 2)
  await page.locator('.loading-original-art').waitFor()
  assertOriginalLayout(await loadingLayout(page))

  await page.setViewportSize({ width: 1100, height: 700 })
  assertOriginalLayout(await loadingLayout(page))
  await page.setViewportSize({ width: 800, height: 700 })
  assertOriginalLayout(await loadingLayout(page))

  // Native failure presentation is unresolved: retain the readable browser error/retry surface.
  hold.fail()
  await page.getByRole('heading', { name: 'The world could not awaken' }).waitFor()
  assert.equal(await page.locator('.loading-original-art').count(), 0)
  const retry = page.getByRole('button', { name: 'Try again' })
  await retry.waitFor()
  const retryReachable = await retry.evaluate(button => {
    const rect = button.getBoundingClientRect(),
      top = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
    return top === button || button.contains(top)
  })
  assert.equal(retryReachable, true)

  hold = beginHold()
  await retry.focus()
  await page.keyboard.press('Enter')
  await waitForCount(() => hold.count, 2)
  await page.locator('.loading-original-art').waitFor()
  assertOriginalLayout(await loadingLayout(page))
  hold.release()
  await page.locator('.loading-world').waitFor({ state: 'detached' })
  await bindGame(page)
  assert.equal(await page.locator('.loading-original-art').count(), 0)
  assert.equal(await page.evaluate(() => globalThis.testStore.getWorld().outcome.level), 1)
  assert.deepEqual(pageErrors, [])
  await context.close()
  console.log('PASS: proved 130x161 loadlog2 mask stays intrinsic and centered during real resource loading/resizes; browser error/retry remains reachable and retry restores then clears the loading art at real readiness')
} finally {
  await browser.close()
}
