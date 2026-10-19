import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { assertSpellIconInventory, runSpellIconEvidence, spellIconStateNames } from '../scripts/spell-icon-state-evidence.mjs'

function harness() {
  const contexts = [], saved = [], report = { status: 'running', states: [] }
  const browser = {
    async newContext() { const context = new EventEmitter(); contexts.push(context); return context },
    async close() { contexts.forEach(context => context.emit('close')) },
  }
  return { contexts, saved, browser, options: { report, launch: async () => browser,
    run: async () => {}, snapshot: () => ({ head: 'unchanged' }),
    save: () => saved.push(structuredClone(report)) } }
}

test('browser launch failures retain terminal evidence without claiming cleanup', async () => {
  const h = harness()
  const result = await runSpellIconEvidence({ ...h.options, launch: async () => { throw Error('launch denied') } })
  assert.equal(result.status, 'failed')
  assert.match(result.error, /launch denied/)
  assert.equal(result.browserClosed, false)
  assert.equal(result.sourceUnchanged, true)
  assert.deepEqual(h.saved.at(-1), result)
})

test('errors from both contexts survive failed Mission 16 startup before it returns', async () => {
  const h = harness()
  const result = await runSpellIconEvidence({ ...h.options, async run(browser, observed) {
    for (const [index, message] of ['Mission 1 error', 'Mission 16 error'].entries()) {
      const context = await observed.newContext(), page = new EventEmitter()
      context.emit('page', page)
      page.emit('pageerror', Error(message))
      page.emit('console', { type: () => 'error', text: () => `console ${index}` })
    }
    throw Error('Mission 16 navigation timed out')
  } })
  assert.equal(result.status, 'failed')
  assert.match(result.error, /Mission 16 navigation timed out/)
  assert.deepEqual(result.errors.map(e => [e.context, e.type]), [[0, 'pageerror'], [0, 'console'], [1, 'pageerror'], [1, 'console']])
  assert.ok(result.contexts.every(c => c.closed && c.errors.length === 2))
  assert.equal(h.saved.at(-1).errors.length, 4)
  assert.equal(result.browserClosed, true)
})

test('a completed run with browser errors cannot pass', async () => {
  const h = harness()
  const result = await runSpellIconEvidence({ ...h.options, async run(browser, observed) {
    const context = await observed.newContext(), page = new EventEmitter()
    context.emit('page', page)
    page.emit('console', { type: () => 'error', text: () => 'render error' })
  } })
  assert.equal(result.status, 'failed')
  assert.equal(result.errors[0].message, 'render error')
})

test('a close-time console error cannot leave passed terminal evidence', async () => {
  const h = harness(), page = new EventEmitter()
  h.browser.close = async () => {
    await Promise.resolve()
    page.emit('console', { type: () => 'error', text: () => 'late close error' })
    h.contexts.forEach(context => context.emit('close'))
  }
  const result = await runSpellIconEvidence({ ...h.options, async run(browser, observed) {
    const context = await observed.newContext()
    context.emit('page', page)
  } })
  assert.equal(result.status, 'failed')
  assert.equal(result.errors[0].message, 'late close error')
  assert.equal(result.browserClosed, true)
  assert.deepEqual(h.saved.at(-1), result)
})

test('source or dependency drift invalidates a successful browser run', async () => {
  const h = harness()
  let calls = 0
  const result = await runSpellIconEvidence({ ...h.options,
    snapshot: () => ({ head: 'same', inputs: { dependency: calls++ ? 'changed' : 'original' } }) })
  assert.equal(result.status, 'invalidated')
  assert.equal(result.sourceUnchanged, false)
  assert.equal(result.browserClosed, true)
})

test('cleanup failures are retained as failed evidence', async () => {
  const h = harness()
  h.browser.close = async () => { throw Error('close failed') }
  const result = await runSpellIconEvidence(h.options)
  assert.equal(result.status, 'failed')
  assert.match(result.cleanupError, /close failed/)
  assert.equal(result.browserClosed, false)
  assert.deepEqual(h.saved.at(-1), result)
})

test('timeout close rejection saves terminal failed evidence without an unhandled rejection', () => {
  const directory = mkdtempSync(join(tmpdir(), 'spell-timeout-evidence-'))
  const file = join(directory, 'report.json')
  try {
    const child = spawnSync(process.execPath, ['--unhandled-rejections=strict', '--input-type=module', '-e', `
      import { writeFileSync } from 'node:fs'
      import { runSpellIconEvidence } from ${JSON.stringify(new URL('../scripts/spell-icon-state-evidence.mjs', import.meta.url).href)}
      const report = { status: 'running' }
      let closeCalls = 0
      await runSpellIconEvidence({ report, timeout: 5,
        launch: async () => ({ async close() {
          if (++closeCalls === 1) throw Error('timeout close rejected')
        } }),
        run: () => new Promise(() => {}),
        snapshot: () => ({ head: 'unchanged' }),
        save: () => writeFileSync(${JSON.stringify(file)}, JSON.stringify({ ...report, closeCalls })),
      })
      if (report.status !== 'passed') process.exitCode = 1
    `], { encoding: 'utf8', timeout: 5000 })
    assert.equal(child.error, undefined)
    assert.equal(child.signal, null)
    assert.equal(child.status, 1, 'Failure exits through the caller, not a crash')
    assert.equal(child.stderr, '', 'No unhandled rejection')
    const saved = JSON.parse(readFileSync(file, 'utf8'))
    assert.equal(saved.status, 'failed')
    assert.equal(saved.expired, true)
    assert.match(saved.timeoutCleanupError, /timeout close rejected/)
    assert.match(saved.error, /timed out/)
    assert.equal(saved.browserClosed, true, 'Final cleanup retries the rejected close')
    assert.equal(saved.closeCalls, 2)
    assert.equal(saved.sourceUnchanged, true)
    assert.ok(Number.isFinite(Date.parse(saved.finishedAt)))
  } finally { rmSync(directory, { recursive: true, force: true }) }
})

test('exact inventory rejects omitted, duplicate, renamed and extra rendered states', () => {
  const spells = [{ id: 'blast' }, { id: 'bloodlust' }]
  const states = spells.flatMap(spell => spellIconStateNames.map(state => ({ spell: spell.id, state })))
  for (const mission of [1, 16]) for (const slot of [0, 1])
    states.push({ spell: 'authored', state: `undiscovered-m${mission}-${slot}` })
  assert.doesNotThrow(() => assertSpellIconInventory(states, spells))
  for (const wrong of [states.slice(1), [...states.slice(1), states[1]],
    [...states, { spell: 'extra', state: 'normal' }],
    states.map((s, i) => i ? s : { ...s, state: 'renamed' }), states.slice(0, -1)])
    assert.throws(() => assertSpellIconInventory(wrong, spells), /Exact rendered state inventory/)
})

test('shared hosted browser cleanup closes only the episode contexts, preserving the runner browser', async () => {
  const h = harness()
  let browserCloses = 0, contextCloses = 0
  h.browser.close = async () => { browserCloses++ }
  h.browser.newContext = async () => {
    const context = new EventEmitter()
    context.close = async () => { contextCloses++; context.emit('close') }
    return context
  }
  const result = await runSpellIconEvidence({ ...h.options, closeBrowser: false,
    async run(browser, observed) { await observed.newContext(); await observed.newContext() } })
  assert.equal(result.status, 'passed')
  assert.equal(result.cleanupTarget, 'owned-contexts')
  assert.equal(result.browserClosed, false)
  assert.equal(result.contextsClosed, true)
  assert.ok(result.contexts.every(c => c.closed))
  assert.equal(browserCloses, 0)
  assert.equal(contextCloses, 2)
})

test('shared scope cleanup attempts every owned context when one close fails', async () => {
  const h = harness()
  let count = 0, closes = 0
  h.browser.close = async () => { throw Error('Shared browser must not be closed') }
  h.browser.newContext = async () => {
    const index = count++, context = new EventEmitter()
    context.close = async () => { closes++; if (!index) throw Error('context close failed'); context.emit('close') }
    return context
  }
  const result = await runSpellIconEvidence({ ...h.options, closeBrowser: false,
    async run(browser, observed) { await observed.newContext(); await observed.newContext() } })
  assert.equal(result.status, 'failed')
  assert.match(result.cleanupError, /context cleanup failed/)
  assert.equal(result.contextsClosed, false)
  assert.equal(result.browserClosed, false)
  assert.equal(closes, 2)
  assert.equal(result.contexts[1].closed, true)
})

test('shared scope preserves close-time console errors and page crashes', async () => {
  for (const type of ['console', 'crash']) {
    const h = harness(), page = new EventEmitter()
    h.browser.newContext = async () => {
      const context = new EventEmitter()
      context.close = async () => {
        page.emit(type, { type: () => 'error', text: () => 'late context error' })
        context.emit('close')
      }
      return context
    }
    const result = await runSpellIconEvidence({ ...h.options, closeBrowser: false,
      async run(browser, observed) { (await observed.newContext()).emit('page', page) } })
    assert.equal(result.status, 'failed')
    assert.equal(result.errors[0].type, type)
    assert.equal(result.contextsClosed, true)
    assert.equal(result.browserClosed, false)
  }
})

test('shared scope timeout closes owned contexts but never the runner browser', async () => {
  const h = harness()
  let browserCloses = 0, contextCloses = 0
  h.browser.close = async () => { browserCloses++ }
  h.browser.newContext = async () => {
    const context = new EventEmitter()
    context.close = async () => { contextCloses++; context.emit('close') }
    return context
  }
  const result = await runSpellIconEvidence({ ...h.options, closeBrowser: false, timeout: 5,
    async run(browser, observed) { await observed.newContext(); await new Promise(() => {}) } })
  assert.equal(result.status, 'failed')
  assert.equal(result.expired, true)
  assert.match(result.error, /timed out/)
  assert.equal(result.browserClosed, false)
  assert.equal(result.contextsClosed, true)
  assert.equal(browserCloses, 0)
  assert.equal(contextCloses, 2)
})

test('hosted spell icon partitions form the exact 164-case inventory with no duplicates', async () => {
  const { spellIconInventory, spellIconPartition } = await import('../scripts/spell-icon-state-evidence.mjs')
  const { SPELLS } = await import('../app/world-rules.ts')
  const tutorial = spellIconInventory(SPELLS, 'tutorial')
  const frontend = spellIconInventory(SPELLS, 'frontend-held-escape')
  assert.equal(tutorial.length, 84)
  assert.equal(frontend.length, 80)
  const combined = [...tutorial, ...frontend]
  assert.equal(new Set(combined).size, 164)
  assert.deepEqual(combined.sort(), spellIconInventory(SPELLS))
  for (const episode of ['tutorial', 'frontend-held-escape']) {
    const actual = spellIconInventory(SPELLS, episode).map(key => {
      const [spell, state] = key.split('/')
      return { spell, state }
    })
    assert.doesNotThrow(() => assertSpellIconInventory(actual, SPELLS, episode))
    assert.throws(() => assertSpellIconInventory(actual.slice(1), SPELLS, episode))
  }
  for (const invalid of ['', 'unknown', null])
    assert.throws(() => spellIconPartition(invalid), /Unknown spell icon episode/)
})
