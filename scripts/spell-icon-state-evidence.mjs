import assert from 'node:assert/strict'
import { dependencyInputPaths } from './orchestration/dependency-profile.mjs'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { isDeepStrictEqual } from 'node:util'
import { sha256 } from './spell-hud-checker-contract.mjs'

export const spellIconStateNames = ['normal', 'inactive', 'selected', 'selected-inactive',
  'charging', 'hover', 'disabled', 'disabled-inactive']

export function assertSpellIconInventory(states, spells) {
  const expected = spells.flatMap(spell => spellIconStateNames.map(state => `${spell.id}/${state}`))
  for (const mission of [1, 16]) for (const slot of [0, 1])
    expected.push(`authored/undiscovered-m${mission}-${slot}`)
  assert.deepEqual(states.map(s => `${s.spell}/${s.state}`).sort(), expected.sort(), 'Exact rendered state inventory')
}

export function spellIconSourceSnapshot(root) {
  const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 32 * 1024 * 1024 })
  const files = git('ls-files', '-z', '--', 'app', 'public/original').toString().split('\0').filter(Boolean)
  files.push('scripts/check-browser-spell-icon-states.mjs', 'scripts/spell-icon-state-evidence.mjs',
    'scripts/spell-hud-checker-contract.mjs', 'scripts/browser-game.mjs', 'scripts/browser-new-game.mjs',
    'tests/fixtures/spell-icon-states.json', 'package.json', 'package-lock.json',
    'scripts/orchestration/dependency-profile.mjs', ...dependencyInputPaths(root), 'node_modules/@playwright/test/package.json',
    'node_modules/playwright-core/package.json', 'node_modules/vinext/package.json', 'vite.config.ts')
  return {
    head: git('rev-parse', 'HEAD').toString().trim(),
    trackedDiffSHA256: sha256(git('diff', 'HEAD', '--binary')),
    runtime: { node: process.version, platform: process.platform, arch: process.arch },
    inputs: Object.fromEntries(files.sort().map(file => [file, sha256(readFileSync(join(root, file)))])),
  }
}

// Observe pages before navigation, including contexts whose startup never returns.
export async function runSpellIconEvidence({ report, launch, run, save, snapshot, timeout = 240000 }) {
  let browser, timer, timeoutClose
  report.contexts = []
  report.errors = []
  report.browserClosed = false
  try {
    report.sourceBefore = snapshot()
    save()
    browser = await launch()
    const deadline = new Promise((_, reject) => {
      timer = setTimeout(() => {
        report.expired = true
        timeoutClose = Promise.resolve().then(() => browser.close()).catch(error => {
          report.timeoutCleanupError = error.stack ?? String(error)
        })
        reject(Error('Spell icon evidence timed out'))
      }, timeout)
    })
    const observedBrowser = {
      async newContext(options) {
        const record = { index: report.contexts.length, errors: [], closed: false }
        report.contexts.push(record)
        const context = await browser.newContext(options)
        context.on('close', () => { record.closed = true })
        context.on('page', page => {
          const add = (type, message) => {
            const error = { context: record.index, type, message }
            record.errors.push(error)
            report.errors.push(error)
          }
          page.on('pageerror', error => add('pageerror', error.stack ?? error.message))
          page.on('console', message => { if (message.type() === 'error') add('console', message.text()) })
        })
        return context
      },
    }
    await Promise.race([run(browser, observedBrowser), deadline])
    report.status = 'passed'
  } catch (error) {
    report.status = 'failed'
    report.error = error.stack ?? String(error)
  } finally {
    clearTimeout(timer)
    await timeoutClose
    if (browser) {
      try { await browser.close(); report.browserClosed = true }
      catch (error) { report.status = 'failed'; report.cleanupError = error.stack ?? String(error) }
    }
    try {
      assert.deepEqual(report.errors, [])
      assert.equal(report.expired, undefined)
    } catch (error) { report.status = 'failed'; report.error ??= error.stack ?? String(error) }
    try {
      report.sourceAfter = snapshot()
      report.sourceUnchanged = isDeepStrictEqual(report.sourceBefore, report.sourceAfter)
      if (!report.sourceUnchanged) report.status = 'invalidated'
    } catch (error) { report.status = 'failed'; report.sourceError = error.stack ?? String(error) }
    report.finishedAt = new Date().toISOString()
    save()
  }
  return report
}
