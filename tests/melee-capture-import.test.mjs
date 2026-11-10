import assert from 'node:assert/strict'
import run, { captureDiagnosticContract } from '../scripts/tutorial-browser/melee-capture-diagnostic.mjs'
import meleeAttack, { installMeleeFrameObserver } from '../scripts/tutorial-browser/melee-attack.mjs'
assert.equal(typeof run, 'function'); assert.equal(captureDiagnosticContract, 'same-frame-ab-v1')
let calls = 0
for (const captureDiagnostic of [false, true, 'same-frame-ab-v1', {}, { mode: 'unknown' }])
  await assert.rejects(meleeAttack({ browser: { newContext: () => { calls++; throw Error('must not create') } }, captureDiagnostic }), /Unknown capture diagnostic mode/)
await assert.rejects(meleeAttack({ recoil: true, captureDiagnostic: { mode: 'same-frame-ab-v1' } }), /cannot run recoil/)
assert.throws(() => installMeleeFrameObserver({ mode: 'unknown' }), /Unknown observer mode/)
assert.equal(calls, 0)
console.log(JSON.stringify({ controls: 8, status: 'passed', scope: 'actual source imports and finite-mode rejection before context/RAF creation' }))
