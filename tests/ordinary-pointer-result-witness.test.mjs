import test from 'node:test'
import assert from 'node:assert/strict'
import { ordinaryPointerResultWitness as witness } from '../scripts/browser-performance/ordinary-pointer-result-witness.mjs'

const point = [903, 400]
const sample = () => ({ mode: 0, navigationPointer: {x:903,y:400,buttons:0}, navigationButtons:0,
  pointerScreen: { clientX: 903, clientY: 400 }, hoveredObject: null,
  tooltipInput: { pointer: { clientX: 903, clientY: 400 }, route: 'world',
    picked: null, cell: 0, inspectionTarget: null } })

test('retains null and zero without treating packed cell as a terrain hit', () => {
  assert.deepEqual(witness(sample(), point), { route: 'world', picked: null, cell: 0, inspectionTarget: null, hoveredObject: null })
})
test('retains distinct object, inspection and hovered identities on admitted routes', () => {
  for (const route of ['world', 'unmapped-cell', 'unmapped-object']) {
    const s = sample(); Object.assign(s.tooltipInput, { route, picked: 4, inspectionTarget: 6 }); s.hoveredObject = 9
    assert.deepEqual(witness(s, point), { route, picked: 4, cell: 0, inspectionTarget: 6, hoveredObject: 9 })
  }
})
test('rejects missing sample and non-world route', () => {
  const s = sample(); s.tooltipInput = null; assert.throws(() => witness(s, point))
  for (const route of ['hud', 'outside', 'message', 'unmapped-panel', undefined]) {
    const s = sample(); s.tooltipInput.route = route; assert.throws(() => witness(s, point))
  }
})
test('rejects stale screen or tooltip coordinates independently', () => {
  for (const key of ['pointerScreen', 'tooltipInput']) {
    const s = sample(); (key === 'pointerScreen' ? s.pointerScreen : s.tooltipInput.pointer).clientX++
    assert.throws(() => witness(s, point))
  }
})
test('rejects alternate input modes and navigation owner', () => {
  const s = sample(); s.mode = 1; assert.throws(() => witness(s, point))
  s.mode = 0; s.navigationPointer = { x: 903, y: 400 }; assert.throws(() => witness(s, point))
})
test('rejects malformed IDs instead of coercing them to absent', () => {
  for (const key of ['picked', 'cell', 'inspectionTarget', 'hoveredObject']) for (const bad of [undefined, -1, 1.5, NaN, Infinity, '2']) {
    const s = sample(); (key === 'hoveredObject' ? s : s.tooltipInput)[key] = bad
    assert.throws(() => witness(s, point))
  }
})
test('returned witness is detached and immutable', () => {
  const s = sample(), result = witness(s, point); s.tooltipInput.cell = 200
  assert.equal(result.cell, 0); assert.ok(Object.isFrozen(result)); assert.throws(() => { result.cell = 2 })
})
test('rejects nonfinite or malformed coordinate declaration', () => {
  for (const p of [[NaN, 400], [903], [903, 400, 0], ['903', 400]]) assert.throws(() => witness(sample(), p))
  const s = sample(); s.tooltipInput.pointer = null; assert.throws(() => witness(s, point))
})

test('requires exact tracker coordinates, zero raw buttons and zero effective navigation',()=>{
 for(const change of [s=>s.navigationPointer=null,s=>s.navigationPointer.x++,s=>s.navigationPointer.buttons=1,s=>s.navigationButtons=1,s=>delete s.navigationButtons]){
  const s=sample();change(s);assert.throws(()=>witness(s,point))
 }
})
