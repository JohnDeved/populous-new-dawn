import assert from 'node:assert/strict'
import { dependencyInputPaths } from './orchestration/dependency-profile.mjs'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { isDeepStrictEqual } from 'node:util'
import { sha256 } from './spell-hud-checker-contract.mjs'

export const spellIconStateNames = ['normal', 'inactive', 'selected', 'selected-inactive',
  'charging', 'hover', 'disabled', 'disabled-inactive']

// Disjoint presentation episodes share the existing hosted jobs. The local CLI
// keeps the complete matrix; no case is dropped to fit a job's inherited cap.
export const spellIconPartitions = Object.freeze({
  tutorial: Object.freeze({ states: Object.freeze(spellIconStateNames.slice(0, 4)), missions: Object.freeze([1, 16]) }),
  'frontend-held-escape': Object.freeze({ states: Object.freeze(spellIconStateNames.slice(4)), missions: Object.freeze([]) }),
})

export function spellIconPartition(episode = 'full') {
  if (episode === 'full') return { states: spellIconStateNames, missions: [1, 16] }
  assert.ok(Object.hasOwn(spellIconPartitions, episode), 'Unknown spell icon episode')
  return spellIconPartitions[episode]
}

export function spellIconInventory(spells, episode = 'full') {
  const partition = spellIconPartition(episode)
  const expected = spells.flatMap(spell => partition.states.map(state => `${spell.id}/${state}`))
  for (const mission of partition.missions) for (const slot of [0, 1])
    expected.push(`authored/undiscovered-m${mission}-${slot}`)
  return expected.sort()
}

export function assertSpellIconInventory(states, spells, episode = 'full') {
  assert.deepEqual(states.map(s => `${s.spell}/${s.state}`).sort(), spellIconInventory(spells, episode), 'Exact rendered state inventory')
}

export function spellIconSourceSnapshot(root) {
  const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 32 * 1024 * 1024 })
  const files = git('ls-files', '-z', '--', 'app', 'public/original').toString().split('\0').filter(Boolean)
  files.push('scripts/check-browser-spell-icon-states.mjs', 'scripts/spell-icon-state-evidence.mjs',
    'scripts/spell-hud-checker-contract.mjs', 'scripts/browser-game.mjs', 'scripts/browser-new-game.mjs',
    'scripts/spell-icon-state-browser.mjs', 'scripts/spell-icon-pixel-evidence.mjs',
    'scripts/check-static-spell-icon-pixels.py', 'scripts/import-original.py',
    'tests/fixtures/spell-icon-pixels.json', 'tests/fixtures/spell-icon-states.json', 'package.json', 'package-lock.json',
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
export async function runSpellIconEvidence({ report, launch, run, save, snapshot, timeout = 240000, closeBrowser = true }) {
  let browser, timer, timeoutClose
  const contexts = []
  async function closeScope() {
    if (closeBrowser) return browser.close()
    const results = await Promise.allSettled(contexts.map(context => context.close()))
    const errors = results.filter(result => result.status === 'rejected').map(result => result.reason)
    if (errors.length) throw new AggregateError(errors, 'Spell icon context cleanup failed')
  }
  report.contexts = []
  report.errors = []
  report.browserClosed = false
  report.cleanupTarget = closeBrowser ? 'browser' : 'owned-contexts'
  report.contextsClosed = false
  try {
    report.sourceBefore = snapshot()
    save()
    browser = await launch()
    const deadline = new Promise((_, reject) => {
      timer = setTimeout(() => {
        report.expired = true
        timeoutClose = Promise.resolve().then(closeScope).catch(error => {
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
        contexts.push(context)
        context.on('close', () => { record.closed = true })
        if (report.expired) { await context.close(); throw Error('Spell icon evidence expired during context creation') }
        context.on('page', page => {
          const add = (type, message) => {
            const error = { context: record.index, type, message }
            record.errors.push(error)
            report.errors.push(error)
          }
          page.on('crash', () => add('crash', 'Spell icon page crashed'))
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
      try { await closeScope(); report.browserClosed = closeBrowser; report.contextsClosed = report.contexts.every(context => context.closed) }
      catch (error) { report.status = 'failed'; report.cleanupError = error.stack ?? String(error) }
    }
    try {
      if (browser) assert.equal(report.contextsClosed, true, 'Spell icon contexts must close')
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
