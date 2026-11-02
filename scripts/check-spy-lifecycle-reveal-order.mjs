import fs from 'node:fs'
import assert from 'node:assert/strict'

// Exercise the real checker assertions with supplied observations, not gameplay.
const source = fs.readFileSync(new URL('./check-browser-spy-combat-lifecycle.mjs', import.meta.url), 'utf8')
const start = source.indexOf('  report.combat = result', source.indexOf('async function ordinaryEncounter'))
const end = source.indexOf('\n  return result', start)
assert.ok(start >= 0 && end > start, 'Lifecycle assertions must remain identifiable')
const validate = new Function('result', 'assert', 'report', 'save', source.slice(start, end))
const observation = damageTurn => ({
  reveal: { turn: 3, hp: 20, priorHP: 20, disguise: 0 },
  firstDamage: damageTurn === null ? null : { turn: damageTurn, disguise: 0 },
  outcome: { spyAlive: false },
  cleanup: { spyAlive: false, selected: false },
})
const check = result => validate(result, assert, {}, () => {})
for (const damageTurn of [1, 3])
  assert.throws(() => check(observation(damageTurn)), /Reveal must precede first observed damage/)
for (const damageTurn of [4, null]) assert.doesNotThrow(() => check(observation(damageTurn)))
console.log('PASS: 4 supplied reveal-order assertion scenarios; not gameplay/browser evidence')
