import assert from 'node:assert/strict'
import { artifactInventory as commonInventory } from '../native-ui-evidence/browser-owner.mjs'

export const captureLimits = Object.freeze({ browserMs: 180000, caseMs: 75000,
  contexts: 1, pages: 1, screenshots: 9, artifactBytes: 64 * 1024 * 1024,
  sidecarBytes: 8 * 1024 * 1024 })
export const captureContract = 'same-frame-ab-v1'
export const candidateEntry = 'scripts/tutorial-browser/melee-capture-diagnostic.mjs'
export const recordedBrowser = Object.freeze({ sha256: 'da143614d917f346b02c1b29587cc13bf891d4b73faf2bea7b20cbd8fa61510f',
  version: 'Google Chrome 156.0.8078.79', protocolVersion: '156.0.8078.79', playwright: '1.63.0' })
const receipts = new Set(['receipt.json', 'receipt-finalization-failure.json', 'candidate-source.json',
  'infrastructure-source.json', 'dependencies.json', 'public-links.json', 'build-manifest.json',
  'browser-provenance.json', 'capture-worker-failure.json', 'melee-capture-series.json',
  'melee-attack.json', 'melee-capture-diagnostic.json', 'build.log', 'browser.log'])
const crop = /^(?:melee-attack-frame-|diagnostic-melee-B-frame-)[0-3]\.png$/
const contextImage = /^melee-attack-(?:context|failure)\.png$/
const sidecar = path => path === 'melee-capture-diagnostic.json' || /^diagnostic-melee-B-frame-[0-3]\.png$/.test(path)

export function assertCaptureInventory(inventory) {
  assert.ok(inventory && Array.isArray(inventory.files), 'Missing diagnostic inventory')
  const names = new Set()
  for (const file of inventory.files) {
    assert.equal(typeof file.path, 'string')
    assert.ok(!names.has(file.path), 'Duplicate artifact path'); names.add(file.path)
    assert.ok(receipts.has(file.path) || crop.test(file.path) || contextImage.test(file.path),
      `Unexpected capture artifact: ${file.path}`)
    assert.ok(Number.isSafeInteger(file.bytes) && file.bytes >= 0, 'Invalid artifact size')
  }
  const bytes = inventory.files.reduce((sum, file) => sum + file.bytes, 0)
  const screenshots = inventory.files.filter(file => file.path.endsWith('.png')).length
  assert.equal(inventory.bytes, bytes); assert.equal(inventory.screenshots, screenshots)
  assert.ok(bytes <= captureLimits.artifactBytes, 'Capture total artifact bound exceeded')
  assert.ok(screenshots <= captureLimits.screenshots, 'Capture screenshot bound exceeded')
  assert.ok(inventory.files.filter(file => contextImage.test(file.path)).length <= 1,
    'Context and failure screenshots are mutually exclusive')
  const sidecarBytes = inventory.files.filter(file => sidecar(file.path)).reduce((sum, file) => sum + file.bytes, 0)
  assert.ok(sidecarBytes <= captureLimits.sidecarBytes, 'Capture sidecar artifact bound exceeded')
  return inventory
}
export const artifactInventory = output => assertCaptureInventory(commonInventory(output))

export function assertCaptureBrowser(identity) {
  assert.equal(identity.browserPath, '/opt/google/chrome/chrome')
  assert.equal(identity.browserPathSource, 'hosted-default')
  assert.deepEqual(identity.launch, { channel: 'chrome', headless: true, chromiumSandbox: true,
    ignoreDefaultArgs: true, args: ['--headless', '--remote-debugging-pipe'], timeout: 30000 })
  assert.equal(identity.sha256, recordedBrowser.sha256, 'Unreviewed Chrome executable')
  assert.equal(identity.version, recordedBrowser.version, 'Unreviewed Chrome version')
  assert.deepEqual(identity.traceVersions, { '@playwright/test': recordedBrowser.playwright,
    'playwright-core': recordedBrowser.playwright })
  if (identity.status === 'launched') assert.equal(identity.playwrightVersion, recordedBrowser.protocolVersion)
  else assert.equal(identity.status, 'not-launched')
  return identity
}

// Reserve once before awaiting creation. The established owner remains
// responsible for late resources and closure, including failed admissions.
export function singleCaptureBrowser(browser, accounting) {
  assert.deepEqual(accounting, { contextsRequested: 0, pagesRequested: 0, pagesObserved: 0, errors: [] })
  return new Proxy(browser, { get(target, key) {
    if (key === 'newContext') return async options => {
      accounting.contextsRequested++
      if (accounting.contextsRequested !== 1) {
        if (!accounting.errors.includes('Repeated diagnostic context attempt'))
          accounting.errors.push('Repeated diagnostic context attempt')
        throw Error('Only one diagnostic context attempt')
      }
      assert.deepEqual(options, { viewport: { width: 960, height: 720 }, deviceScaleFactor: 1 })
      const context = await target.newContext(options)
      context.on('page', page => {
        accounting.pagesObserved++
        if (accounting.pagesObserved > 1) {
          accounting.errors.push('Unadmitted additional diagnostic page')
          void page.close().catch(error => accounting.errors.push(`Additional page cleanup: ${String(error)}`))
        }
      })
      const createPage = context.newPage.bind(context)
      context.newPage = async () => {
        accounting.pagesRequested++
        if (accounting.pagesRequested !== 1) {
          if (!accounting.errors.includes('Repeated diagnostic page attempt'))
            accounting.errors.push('Repeated diagnostic page attempt')
          throw Error('Only one diagnostic page attempt')
        }
        return createPage()
      }
      return context
    }
    if (key !== 'newContext') {
      if (!accounting.errors.includes('Unadmitted diagnostic browser API'))
        accounting.errors.push('Unadmitted diagnostic browser API')
      throw Error(`Unadmitted diagnostic browser API: ${String(key).slice(0, 80)}`)
    }
  } })
}
