import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../scripts/tutorial-browser/spell-test-menu.mjs', import.meta.url), 'utf8')
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
function extract(start, end, context) {
  const first = source.indexOf(start), last = source.indexOf(end, first)
  assert.ok(first >= 0 && last > first)
  return new AsyncFunction(...Object.keys(context), source.slice(first, last + end.length))(...Object.values(context))
}
const tick = () => new Promise(resolve => setImmediate(resolve))
const state = { turn: 12, paused: true, shots: { teleport: 0 }, cheatsUsed: false }

function escape(read) {
  const actions = []
  const pending = extract("    await page.keyboard.up('Escape')", "    await page.keyboard.press('Shift+F9')", {
    assert, beforeOpen: state, snapshot: () => read('world'),
    button: name => { assert.equal(name, 'Resume game'); return { evaluate: () => read('focus') } },
    page: {
      locator: selector => { assert.equal(selector, '[data-original-pause-menu]'); return { count: () => read('count') } },
      keyboard: { up: async key => { actions.push(`up:${key}`) }, press: async key => { actions.push(`press:${key}`) } },
    },
  })
  return { pending, actions }
}
const valid = { count: 0, focus: true, world: state }

test('Escape observations start together and every response precedes the next keyboard action', async () => {
  const calls = [], pending = []
  const run = escape(name => { calls.push(name); return new Promise(resolve => pending.push(() => resolve(valid[name]))) })
  await tick()
  const initial = [...calls]
  for (let i = 0; i < 3; i++) {
    assert.deepEqual(run.actions, ['up:Escape'])
    pending.pop()()
    await tick()
  }
  await run.pending
  assert.deepEqual(initial, ['count', 'focus', 'world'])
  assert.deepEqual(calls, initial)
  assert.deepEqual(run.actions, ['up:Escape', 'press:Shift+F9'])
})

test('every Escape assertion still rejects and blocks the following action', async () => {
  for (const bad of [{ count: 1 }, { focus: false }, { world: { ...state, turn: 13 } }]) {
    const values = { ...valid, ...bad }, run = escape(async name => values[name])
    await assert.rejects(run.pending, { code: 'ERR_ASSERTION' })
    assert.deepEqual(run.actions, ['up:Escape'])
  }
})

test('each observation failure preserves its error and blocks the following action', async () => {
  for (const failed of Object.keys(valid)) {
    const error = Error(failed), run = escape(async name => { if (name === failed) throw error; return valid[name] })
    await assert.rejects(run.pending, value => value === error)
    assert.deepEqual(run.actions, ['up:Escape'])
  }
})

test('saved storage and paused world are read concurrently before focus changes', async () => {
  const calls = [], pending = [], actions = []
  const read = name => { calls.push(name); return new Promise(resolve => pending.push(() => resolve(name))) }
  const run = extract(source.includes('    const [saved, beforeOpen]') ? '    const [saved, beforeOpen]' : '    const saved =', "    await button('Resume game').focus()", {
    storage: () => read('storage'), snapshot: () => read('world'),
    diagnostics: { stage: () => actions.push('stage') },
    button: name => { assert.equal(name, 'Resume game'); return { focus: async () => actions.push('focus') } },
  })
  await tick()
  const initial = [...calls]
  pending.pop()(); await tick(); assert.deepEqual(actions, [])
  pending.pop()(); await run
  assert.deepEqual(initial, ['storage', 'world'])
  assert.deepEqual(calls, ['storage', 'world'])
  assert.deepEqual(actions, ['stage', 'focus'])
})

for (const [phase, end] of [['checkpoint load', "    diagnostics.stage('grant and restart')"], ['restart', '    report.savePreservedAndLoadRestartReset = true']]) {
  test(`${phase} checks both reset fields from one post-readiness snapshot`, async () => {
    for (const bad of [null, 'cheats', 'stock']) {
      const actions = [], value = structuredClone(state)
      if (bad === 'cheats') value.cheatsUsed = true
      if (bad === 'stock') value.shots.teleport = 1
      const run = extract(`    await waitReady('${phase}')`, end, {
        assert, waitReady: async name => { assert.equal(name, phase); actions.push('ready') },
        snapshot: async () => { actions.push('snapshot'); return value },
        diagnostics: { stage: () => actions.push('next') },
        report: { set savePreservedAndLoadRestartReset(value) { assert.equal(value, true); actions.push('next') } },
      })
      if (bad) { await assert.rejects(run, { code: 'ERR_ASSERTION' }); assert.deepEqual(actions, ['ready', 'snapshot']) }
      else { await run; assert.deepEqual(actions, ['ready', 'snapshot', 'next']) }
    }
  })
}

test('saved pair rejects either read failure without moving focus', async () => {
  for (const failed of ['storage', 'world']) {
    const error = Error(failed), actions = []
    const read = async name => { if (name === failed) throw error; return name }
    const run = extract(source.includes('    const [saved, beforeOpen]') ? '    const [saved, beforeOpen]' : '    const saved =', "    await button('Resume game').focus()", {
      storage: () => read('storage'), snapshot: () => read('world'),
      diagnostics: { stage: () => actions.push('stage') },
      button: () => ({ focus: async () => actions.push('focus') }),
    })
    await assert.rejects(run, value => value === error)
    assert.deepEqual(actions, [])
  }
})

for (const [phase, end] of [['checkpoint load', "    diagnostics.stage('grant and restart')"], ['restart', '    report.savePreservedAndLoadRestartReset = true']]) {
  test(`${phase} snapshot rejection preserves the error and blocks progress`, async () => {
    const error = Error('snapshot failed'), actions = []
    const run = extract(`    await waitReady('${phase}')`, end, {
      assert, waitReady: async () => actions.push('ready'),
      snapshot: async () => { actions.push('snapshot'); throw error },
      diagnostics: { stage: () => actions.push('next') },
      report: { set savePreservedAndLoadRestartReset(value) { actions.push(value) } },
    })
    await assert.rejects(run, value => value === error)
    assert.deepEqual(actions, ['ready', 'snapshot'])
  })
}
