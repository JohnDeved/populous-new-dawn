// Keep every maintained fresh-hut UI assertion; the harness owns Chromium/Vite.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export default async function secondaryHutSmoke(args) {
  const { root, openMission, output, receipt, signal } = args
  signal.throwIfAborted()
  await openMission(1)
  const original = readFileSync(
    resolve(root, 'scripts/check-browser-hut-occupancy-smoke.mjs'),
    'utf8'
  )
  const replacements = [
    [
      "import { chromium } from '@playwright/test'",
      '// Browser supplied by sandbox-preserving harness',
    ],
    [
      "import { bindGame, openGame } from './browser-game.mjs'",
      `import { bindGame } from ${JSON.stringify(pathToFileURL(resolve(root, 'scripts/browser-game.mjs')).href)}; const openGame = async () => ({ page: globalThis.secondaryHutQA.page, errors: globalThis.secondaryHutQA.receipt.errors })`,
    ],
    [
      "import effects from '../app/original-effects.json'",
      `import effects from ${JSON.stringify(pathToFileURL(resolve(root, 'app/original-effects.json')).href)}`,
    ],
    [
      "import rules from '../app/original-rules.json'",
      `import rules from ${JSON.stringify(pathToFileURL(resolve(root, 'app/original-rules.json')).href)}`,
    ],
    [
      "(process.env.PND_QUEUE_OUTPUT ?? '/private/tmp') + '/issue73-fresh-hut-acceptance.json'",
      JSON.stringify(resolve(output, 'issue73-fresh-hut-acceptance.json')),
    ],
    [
      "const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })",
      'const browser = { close: async () => {} }',
    ],
  ]
  let source = original
  for (const [before, after] of replacements) {
    assert.ok(source.includes(before), `Maintained checker scaffold changed: ${before}`)
    source = source.replace(before, after)
  }
  const adapter = resolve(output, 'smoke-adapter.mjs')
  writeFileSync(adapter, source)
  globalThis.secondaryHutQA = args
  try {
    await import(pathToFileURL(adapter).href)
    signal.throwIfAborted()
  } finally {
    delete globalThis.secondaryHutQA
  }
  const result = JSON.parse(
    readFileSync(resolve(output, 'issue73-fresh-hut-acceptance.json'), 'utf8')
  )
  assert.equal(result.stage, 'complete')
  assert.ok(result.secondary.pixels > 0)
  assert.deepEqual(receipt.errors, [])
  return {
    label:
      'Fresh Mission 1 construction and shipped residency controls; full-hut original child puffs and checkpoint continuity',
    originalCheckerSha256: createHash('sha256').update(original).digest('hex'),
    result,
  }
}
