import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { chromium } from '@playwright/test'

const url = process.env.POPULOUS_URL ?? 'http://localhost:4334'
const tracked = await readFile(new URL('../public/favicon.ico', import.meta.url))
const trackedSha = createHash('sha256').update(tracked).digest('hex')

function parseIco(data) {
  assert.equal(data.readUInt16LE(0), 0)
  assert.equal(data.readUInt16LE(2), 1)
  const count = data.readUInt16LE(4)
  assert.equal(count, 3)
  const entries = []
  for (let index = 0; index < count; index++) {
    const base = 6 + index * 16
    const widthByte = data[base],
      heightByte = data[base + 1],
      colors = data[base + 2],
      reserved = data[base + 3],
      planes = data.readUInt16LE(base + 4),
      bpp = data.readUInt16LE(base + 6),
      size = data.readUInt32LE(base + 8),
      offset = data.readUInt32LE(base + 12)
    entries.push({
      width: widthByte || 256,
      height: heightByte || 256,
      colors,
      reserved,
      planes,
      bpp,
      size,
      offset,
    })
  }
  return entries
}

assert.deepEqual(
  parseIco(tracked).map(({ width, height, bpp }) => [width, height, bpp]),
  [
    [16, 16, 24],
    [32, 32, 8],
    [48, 48, 24],
  ]
)

const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.stack ?? error.message))
  page.on('console', message => {
    if (message.type() === 'error' && !message.text().includes('Failed to load resource'))
      errors.push(message.text())
  })

  const response = await page.goto(url, { waitUntil: 'domcontentloaded' })
  assert.ok(response?.ok(), `page response failed: ${response?.status()}`)

  const iconHrefs = await page.locator('link[rel~="icon"]').evaluateAll(nodes =>
    nodes.map(node => node.getAttribute('href')).filter(Boolean)
  )
  const iconPaths = iconHrefs.map(href => new URL(href, url).pathname)
  assert.ok(iconPaths.includes('/favicon.ico'), `missing /favicon.ico metadata: ${iconPaths}`)
  assert.equal(iconPaths.includes('/favicon.png'), false, `legacy favicon.png still active: ${iconPaths}`)

  const faviconResponse = await context.request.get(new URL('/favicon.ico', url).href)
  assert.equal(faviconResponse.status(), 200)
  const contentType = faviconResponse.headers()['content-type'] ?? ''
  assert.match(contentType, /^image\/(?:x-icon|vnd\.microsoft\.icon)(?:;|$)/i)
  const served = await faviconResponse.body()
  assert.equal(
    createHash('sha256').update(served).digest('hex'),
    trackedSha,
    'served /favicon.ico must be byte-identical to tracked extracted asset'
  )
  assert.deepEqual(served, tracked)
  assert.deepEqual(
    parseIco(served).map(({ width, height, bpp }) => [width, height, bpp]),
    [
      [16, 16, 24],
      [32, 32, 8],
      [48, 48, 24],
    ]
  )
  assert.deepEqual(errors, [])
  await context.close()

  console.log(
    `PASS: emitted metadata serves byte-exact original multi-image /favicon.ico sha256=${trackedSha} sizes=16x16/24,32x32/8,48x48/24`
  )
} finally {
  await browser.close()
}
