import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { SPELLS } from '../app/world-rules.ts'

const source = readFileSync(new URL('../scripts/tutorial-browser/spell-test-menu.mjs', import.meta.url), 'utf8'),
  start = source.indexOf("    assert.equal(unlocked.cheatsUsed, true)"),
  nextAction = "    await button('Refill mana').click()",
  end = source.indexOf(nextAction, start)
assert.ok(start >= 0 && end > start, 'the exact grant-read block and following action are present')
const check = new (Object.getPrototypeOf(async function () {}).constructor)(
  'SPELLS', 'rules', 'unlocked', 'button', 'assert', source.slice(start, end + nextAction.length)),
  rules = { spellCharging: Object.fromEntries(SPELLS.map((spell, index) =>
    [spell.model, { normalLimit: 1 + index % 4 }])) },
  unlocked = { cheatsUsed: true, shots: Object.fromEntries(SPELLS.map(spell =>
    [spell.id, rules.spellCharging[spell.model].normalLimit])) },
  names = SPELLS.map(spell => `Test ${spell.name}, ${unlocked.shots[spell.id]} shots`),
  nextTurn = () => new Promise(resolve => setImmediate(resolve))

// Actual spell inventory with supplied read-only locator/stock boundaries.
// These controls do not run or time Chromium or establish native charging rules.
function run(read, state = unlocked) {
  const actions = []
  const pending = check(SPELLS, rules, state, name => name === 'Refill mana'
    ? { click: async () => { actions.push(name) } }
    : { isEnabled: () => read(name) }, assert)
  return { pending, actions }
}

test('every exact enabled-state read starts before any response; reverse responses preserve success', async () => {
  const calls = [], releases = []
  const result = run(name => {
    calls.push(name)
    return new Promise(resolve => releases.push(resolve))
  })
  // Capture concurrency before releasing anything, then settle even a serial control.
  await nextTurn()
  const started = [...calls]
  assert.deepEqual(result.actions, [])
  for (let i = 0; i < SPELLS.length; i++) {
    releases.splice(0).reverse().forEach(resolve => resolve(true))
    await nextTurn()
  }
  await result.pending
  assert.deepEqual(calls, names, 'each exact accessible name is queried once')
  assert.deepEqual(started, names, 'no protocol response serializes the other reads')
  assert.deepEqual(result.actions, ['Refill mana'])
})

test('no following action runs while any enabled-state read remains pending', async () => {
  const releases = []
  const result = run(() => new Promise(resolve => releases.push(resolve)))
  await nextTurn()
  for (let i = 0; i < SPELLS.length; i++) {
    assert.deepEqual(result.actions, [])
    releases.pop()(true)
    await nextTurn()
  }
  await result.pending
  assert.deepEqual(result.actions, ['Refill mana'])
})

test('each disabled spell still fails before the following action', async () => {
  for (const disabled of names) {
    const result = run(async name => name !== disabled)
    await assert.rejects(result.pending, { code: 'ERR_ASSERTION' })
    assert.deepEqual(result.actions, [])
  }
})

test('each missing or failed locator read still rejects before the following action', async () => {
  for (const missing of names) {
    const result = run(async name => { if (name === missing) throw Error('missing exact button'); return true })
    await assert.rejects(result.pending, /missing exact button/)
    assert.deepEqual(result.actions, [])
  }
})

test('each insufficient stock count still fails before the following action', async () => {
  for (const spell of SPELLS) {
    const state = structuredClone(unlocked)
    state.shots[spell.id]--
    const result = run(async () => true, state)
    await assert.rejects(result.pending, { code: 'ERR_ASSERTION' })
    assert.deepEqual(result.actions, [])
  }
})

test('the session must still be marked as using cheats', async () => {
  const result = run(async () => true, { ...unlocked, cheatsUsed: false })
  await assert.rejects(result.pending, { code: 'ERR_ASSERTION' })
  assert.deepEqual(result.actions, [])
})
