import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { pathToFileURL } from 'node:url'
import { sha } from './io.mjs'
export async function loadSetup(base) {
  const path = resolve(base, 'scripts/browser-performance/snapshot-setup.mjs'),
    source = readFileSync(path, 'utf8')
  assert.equal(sha(source), '4bb9b653f0116a8d40bad6c61465eb6fba79a7cfa295c27dacabd7a02e1f000d')
  const boundary = '    await bindGame(page)\n    await page.evaluate(() => {'
  assert.equal(source.split(boundary).length, 2)
  const transformed = source.replace(
    boundary,
    '    await bindGame(page)\n    await page.evaluate(() => window.__bodyVerifyStart())\n    await page.evaluate(() => {'
  )
  // Preserve the trusted helper and its imports; only the setup observation is added.
  const linked = transformed.replace(
    /from '(\.\.?\/[^']+)'/g,
    (_, relative) => `from '${pathToFileURL(resolve(dirname(path), relative)).href}'`
  )
  const module = await import(
    `data:text/javascript;base64,${Buffer.from(linked).toString('base64')}`
  )
  return {
    loadSnapshot: module.loadSnapshot,
    binding: {
      originalSha256: sha(source),
      transformedSha256: sha(transformed),
      linkedSha256: sha(linked),
    },
  }
}
