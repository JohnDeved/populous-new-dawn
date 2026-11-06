import assert from 'node:assert/strict'
import { artifactInventory as commonInventory } from '../native-ui-evidence/browser-owner.mjs'

// Separate focused episode. Existing native UI limits and nine-episode series stay unchanged.
export const towerLimits = Object.freeze({
  browserMs: 600000, maxContexts: 1, maxPages: 1,
  screenshots: 4, artifactBytes: 32 * 1024 * 1024,
})
export function assertTowerArtifactInventory(inventory) {
  assert.ok(Number.isSafeInteger(inventory.screenshots) && inventory.screenshots >= 0)
  assert.ok(Number.isSafeInteger(inventory.bytes) && inventory.bytes >= 0)
  assert.ok(inventory.screenshots <= towerLimits.screenshots, 'Tower screenshot cap exceeded')
  assert.ok(inventory.bytes <= towerLimits.artifactBytes, 'Tower artifact cap exceeded')
  return inventory
}
export const artifactInventory = output => assertTowerArtifactInventory(commonInventory(output))

// Count admissions, including failed attempts, rather than permitting replacement contexts.
export function singleEpisodeBrowser(browser, report) {
  let contexts = 0, pages = 0, screenshots = 0
  const requireBudget = (condition, text) => {
    if (!condition) report.errors.push({ kind: 'resource', text })
    assert.ok(condition, text)
  }
  return new Proxy(browser, { get(target, key) {
    if (key === 'newContext') return async options => {
      requireBudget(++contexts <= towerLimits.maxContexts, 'Tower context budget exceeded')
      const context = await target.newContext(options)
      const createPage = context.newPage.bind(context)
      context.newPage = async () => {
        requireBudget(++pages <= towerLimits.maxPages, 'Tower page budget exceeded')
        return createPage()
      }
      let actualPages = 0
      context.on('page', page => {
        if (++actualPages > towerLimits.maxPages) {
          report.errors.push({ kind: 'resource', text: 'Unexpected Tower popup/page' })
          void page.close().catch(error => report.errors.push({ kind: 'cleanup', text: String(error) }))
          return
        }
        const screenshot = page.screenshot.bind(page)
        page.screenshot = async options => {
          requireBudget(++screenshots <= towerLimits.screenshots, 'Tower screenshot budget exceeded')
          return screenshot(options)
        }
      })
      return context
    }
    const value = target[key]
    return typeof value === 'function' ? value.bind(target) : value
  } })
}

