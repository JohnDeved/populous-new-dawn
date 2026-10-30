import assert from 'node:assert/strict'
import test from 'node:test'
import { observePauseKeyboardFocus } from '../scripts/local-render/pause-focus-observation.mjs'
import { reachPauseKeyboardFocus } from '../scripts/local-render/original-pause-checkpoint-style.mjs'
import { assertFullscreenClearance } from '../scripts/local-render/fullscreen-clearance.mjs'

const node = (visible = true) => ({ matches(selector) { assert.equal(selector, ':focus-visible'); return visible } })
function fixture({ nodes, active = nodes[0], fallbackNodes = nodes, fallbackActive = active, fallbackError, beforeFallback } = {}) {
  const calls = []
  const invoke = (predicate, value, activeElement) => new Function('document', 'value', `return (${predicate})(value)`)(
    { activeElement }, value)
  const strictError = Error('locator.evaluate: strict mode violation: target resolved to multiple elements')
  const missingError = Error('locator.evaluate: Timeout 25000ms exceeded while waiting for target to attach')
  const target = {
    async evaluateAll(predicate) { calls.push('evaluateAll'); return invoke(predicate, nodes, active) },
    async evaluate(predicate) {
      calls.push('evaluate'); beforeFallback?.()
      if (fallbackError) throw fallbackError
      if (!fallbackNodes.length) throw missingError
      if (fallbackNodes.length > 1) throw strictError
      return invoke(predicate, fallbackNodes[0], fallbackActive)
    },
    focus() { assert.fail('No synthetic focus') },
    elementHandle() { assert.fail('No cached target handle') },
  }
  return { target, calls, strictError, missingError }
}

test('one current locator match uses the exact active-element and focus-visible predicate', async () => {
  for (const active of [false, true]) for (const visible of [false, true]) {
    const n = node(visible), f = fixture({ nodes: [n], active: active ? n : {} })
    assert.equal(await observePauseKeyboardFocus(f.target), active && visible)
    assert.deepEqual(f.calls, ['evaluateAll'])
  }
})

test('missing targets preserve original attachment waiting and exact timeout rejection', async () => {
  const f = fixture({ nodes: [] })
  await assert.rejects(observePauseKeyboardFocus(f.target), error => error === f.missingError)
  assert.deepEqual(f.calls, ['evaluateAll', 'evaluate'])
})

test('missing targets that appear during original attachment waiting can regain genuine focus', async () => {
  const replacement = node(), f = fixture({ nodes: [], fallbackNodes: [replacement], fallbackActive: replacement })
  assert.equal(await observePauseKeyboardFocus(f.target), true)
  assert.deepEqual(f.calls, ['evaluateAll', 'evaluate'])
})

test('duplicate and open-shadow duplicate matches retain original strict locator errors', async () => {
  for (const nodes of [[node(), node()], [node(), { ...node(), shadowRoot: true }],
    [{ ...node(), shadowRoot: true }, { ...node(), shadowRoot: true }]]) {
    const f = fixture({ nodes })
    await assert.rejects(observePauseKeyboardFocus(f.target), error => error === f.strictError)
    assert.deepEqual(f.calls, ['evaluateAll', 'evaluate'])
  }
})

test('ambiguous preflight is not a new decision point: the original strict path resolves current matches', async () => {
  const current = node(), f = fixture({ nodes: [node(), node()], fallbackNodes: [current], fallbackActive: current })
  assert.equal(await observePauseKeyboardFocus(f.target), true)
  assert.deepEqual(f.calls, ['evaluateAll', 'evaluate'])
})

test('fast-path API rejection is propagated unchanged rather than fabricated as absent focus', async () => {
  const error = Error('original API rejection')
  await assert.rejects(observePauseKeyboardFocus({ evaluateAll: async () => { throw error },
    evaluate() { assert.fail('Do not swallow the actual API failure') } }), found => found === error)
})

test('a shadow target is not mistaken for document.activeElement when only its host is active', async () => {
  const shadow = node(), f = fixture({ nodes: [shadow], active: { shadowRoot: true } })
  assert.equal(await observePauseKeyboardFocus(f.target), false)
})

test('each read resolves the current locator after detachment or replacement, never a cached node', async () => {
  const old = node(), replacement = node(), f = fixture({ nodes: [old], active: {} })
  assert.equal(await observePauseKeyboardFocus(f.target), false)
  const next = fixture({ nodes: [], fallbackNodes: [replacement], fallbackActive: replacement })
  f.target.evaluateAll = next.target.evaluateAll; f.target.evaluate = next.target.evaluate
  assert.equal(await observePauseKeyboardFocus(f.target), true)
  assert.deepEqual(next.calls, ['evaluateAll', 'evaluate'])
})

test('a detached target that does not reappear preserves the original locator failure', async () => {
  const detached = Error('locator.evaluate: Element is not attached to the DOM'), f = fixture({ nodes: [], fallbackError: detached })
  await assert.rejects(observePauseKeyboardFocus(f.target), error => error === detached)
})

test('pointer-only focus still requires real Tab input and a fresh visible-focus observation', async () => {
  const pointer = node(false), keyboard = node(), first = fixture({ nodes: [pointer], active: pointer }),
    second = fixture({ nodes: [keyboard], active: keyboard })
  let tabs = 0
  const target = { evaluateAll: predicate => (tabs ? second : first).target.evaluateAll(predicate) }
  assert.equal(await reachPauseKeyboardFocus({ keyboard: { async press(key) { assert.equal(key, 'Tab'); tabs++ } } },
    target, new AbortController().signal), 1)
  assert.equal(tabs, 1)
})

test('wrong-owner focus cannot satisfy the unchanged fullscreen ownership assertion', async () => {
  const n = node(), f = fixture({ nodes: [n] })
  // Focus observation has never replaced the independent owner/geometry gate.
  assert.equal(await observePauseKeyboardFocus(f.target), true)
  assert.throws(() => assertFullscreenClearance({ owner: false, count: 1 }), /owner/i)
})

test('an original fallback error is not replaced and an abort cannot dispatch a late Tab', async () => {
  const reason = Error('original locator failure'), f = fixture({ nodes: [], fallbackError: reason })
  await assert.rejects(observePauseKeyboardFocus(f.target), error => error === reason)
  const controller = new AbortController(), deadline = Error('episode deadline'), n = node(),
    late = fixture({ nodes: [], fallbackNodes: [n], fallbackActive: n, beforeFallback: () => controller.abort(deadline) })
  await assert.rejects(reachPauseKeyboardFocus({ keyboard: { press() { assert.fail('No late key') } } },
    late.target, controller.signal), error => error === deadline)
})
