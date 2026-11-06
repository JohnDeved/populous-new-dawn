import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { candidateDependency, candidateDependencyExport } from '../native-ui-evidence/identity.mjs'

// The candidate declares @playwright/test. Do not resolve its unhoisted transitive
// playwright package from the project root or fall back to global installations.
export function candidateBrowserBinding(root) {
  const playwrightEntry = fileURLToPath(candidateDependency(root, '@playwright/test'))
  const tooling = Object.fromEntries(['@playwright/test', 'playwright-core'].map(name => {
    const version = JSON.parse(readFileSync(fileURLToPath(candidateDependency(root, `${name}/package.json`)), 'utf8')).version
    assert.equal(version, '1.63.0')
    return [name, version]
  }))
  return { playwrightEntry, tooling }
}
export async function loadCandidateBrowser(root, expectedEntry) {
  assert.equal(candidateBrowserBinding(root).playwrightEntry, expectedEntry, 'Candidate browser entry changed')
  const chromium = await candidateDependencyExport(root, '@playwright/test', 'chromium')
  assert.equal(typeof chromium.launch, 'function', 'Declared candidate package must expose Chromium')
  return chromium
}
