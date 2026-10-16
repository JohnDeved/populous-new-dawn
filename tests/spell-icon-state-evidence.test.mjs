import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
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
