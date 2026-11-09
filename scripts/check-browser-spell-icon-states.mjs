import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'
import { runSpellIconMatrix, spellIconLimits } from './spell-icon-state-browser.mjs'
import { runSpellIconEvidence, spellIconSourceSnapshot } from './spell-icon-state-evidence.mjs'

const outputIndex = process.argv.indexOf('--output-dir')
assert.ok(outputIndex >= 0 && process.argv[outputIndex + 1], 'Required --output-dir (new directory)')
const output = resolve(process.argv[outputIndex + 1])
const url = process.env.POPULOUS_URL
assert.ok(url, 'Required local POPULOUS_URL')
assert.ok(['localhost', '127.0.0.1'].includes(new URL(url).hostname))
mkdirSync(output, { recursive: false })
const report = { status: 'running', startedAt: new Date().toISOString(), states: [], errors: [], limits: spellIconLimits }
const save = () => writeFileSync(join(output, 'evidence.json'), JSON.stringify(report, null, 2) + '\n')
await runSpellIconEvidence({ report, save,
  snapshot: () => spellIconSourceSnapshot(fileURLToPath(new URL('../', import.meta.url))),
  launch: () => chromium.launch({ headless: true, chromiumSandbox: true }),
  run: (browser, observedBrowser) => runSpellIconMatrix({ browser, observedBrowser, open: openGame, url, output, report, save }),
})
process.exitCode = report.status === 'passed' ? 0 : 1
console.log(JSON.stringify({ status: report.status, states: report.states.length, sourceUnchanged: report.sourceUnchanged, output, error: report.error }))
