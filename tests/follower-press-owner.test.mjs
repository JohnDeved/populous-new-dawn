import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'

// Actual page callback source; supplied Scene endpoints isolate dispatch ownership.
// This is not mounted React, browser event reachability, or native parity proof.
const source = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
const start = source.indexOf('  function followerControl(')
const end = source.indexOf('  function currentNearbyScene()', start)
assert.ok(start >= 0 && end > start, 'Exact page callback markers required')
const callback = stripTypeScriptTypes(source.slice(start, end))
function setup(model = 0, category, vehicle) {
  let currentWorld = {}
  const calls = [], makeScene = (world = currentWorld) => ({ world,
    chooseFollowers: (...args) => calls.push({ kind: 'followers', args }),
    chooseTransport: (...args) => calls.push({ kind: 'transport', args }) })
  const engine = { current: makeScene() }, followerPress = { current: null }
  const control = new Function('engine', 'followerPress', 'store', `${callback}; return followerControl`)(
    engine, followerPress, { getWorld: () => currentWorld })(model, category, vehicle)
  let blurs = 0, prevented = 0
  const target = { disabled: false, blur: () => { blurs++ } }
  const event = (extra = {}) => ({ currentTarget: target, button: 0, ctrlKey: true, detail: 1,
    preventDefault: () => { prevented++ }, ...extra })
  return { control, engine, followerPress, calls, makeScene, target, event,
    replaceWorld: () => { currentWorld = {} }, blurs: () => blurs, prevented: () => prevented }
}
for (const [name, model, category, vehicle] of [['Total', 0], ['brave', 1], ['task', 1, 'idle'], ['Boat', 1, undefined, 'boat']]) {
  test(`${name}: current Ctrl release dispatches exactly once and consumes the press`, () => {
    const t = setup(model, category, vehicle)
    t.control.onPointerDown(t.event()); t.control.onPointerUp(t.event()); t.control.onClick(t.event())
    t.control.onPointerUp(t.event())
    assert.equal(t.calls.length, 1); assert.equal(t.blurs(), 1); assert.equal(t.followerPress.current, null)
    assert.equal(t.calls[0].kind, vehicle ? 'transport' : 'followers')
    assert.equal(t.calls[0].args[0], vehicle ?? model)
    if (vehicle) assert.equal(t.calls[0].args[1], model)
    else assert.equal(t.calls[0].args[3], category)
  })
  test(`${name}: a retained press cannot dispatch into a replacement Scene`, () => {
    const t = setup(model, category, vehicle)
    t.control.onPointerDown(t.event()); t.engine.current = t.makeScene(); t.control.onPointerUp(t.event())
    assert.equal(t.calls.length, 0); assert.equal(t.blurs(), 0); assert.equal(t.followerPress.current, null)
  })
}
test('world replacement before Scene cleanup rejects the old press', () => {
  const t = setup(); t.control.onPointerDown(t.event()); t.replaceWorld(); t.control.onPointerUp(t.event())
  assert.equal(t.calls.length, 0); assert.equal(t.followerPress.current, null)
})
test('absent Scene at press cannot arm a later Scene', () => {
  const t = setup(); t.engine.current = null; t.control.onPointerDown(t.event())
  t.engine.current = t.makeScene(); t.control.onPointerUp(t.event())
  assert.equal(t.calls.length, 0); assert.equal(t.blurs(), 0)
})
test('cancellation, wrong target, nonprimary release and disabled target do not dispatch', () => {
  for (const modify of [t => t.control.onPointerCancel(), t => { t.target.disabled = true },
    t => { t.release = t.event({ currentTarget: { disabled: false, blur() {} } }) },
    t => { t.release = t.event({ button: 2 }) }]) {
    const t = setup(); t.control.onPointerDown(t.event()); modify(t)
    t.control.onPointerUp(t.release ?? t.event())
    assert.equal(t.calls.length, 0); assert.equal(t.followerPress.current, null)
  }
})
test('plain, Shift and detail-zero assistive activation retain their existing path', () => {
  for (const extra of [{ ctrlKey: false }, { ctrlKey: false, shiftKey: true }, { detail: 0 }]) {
    const t = setup(); t.control.onClick(t.event(extra))
    assert.equal(t.calls.length, 1); assert.equal(t.blurs(), 0)
    assert.equal(t.calls[0].args[2], false)
  }
})
test('right-focus remains distinct and Ctrl-primary contextmenu stays suppressed', () => {
  const t = setup(); t.control.onContextMenu(t.event()); assert.equal(t.calls.length, 0)
  t.control.onContextMenu(t.event({ button: 2, ctrlKey: false }))
  assert.equal(t.calls.length, 1); assert.equal(t.calls[0].args[2], true); assert.equal(t.prevented(), 2)
})
test('Scene cleanup releases its own retained press without clearing another owner', () => {
  const cleanup = source.match(/return \(\) => \{\n {6}disposed = true\n([\s\S]*?)\n {4}\}\n {2}\}, \[world, update, store, startup, measureWorshipHud\]\)/)
  assert.ok(cleanup, 'Actual Scene effect cleanup must be found')
  const run = new Function('scene', 'engine', 'followerPress', cleanup[1])
  let disposals = 0
  const scene = { dispose() { disposals++ } }, other = {}, engine = { current: scene }
  const own = { current: { target: {}, scene } }; run(scene, engine, own)
  assert.equal(own.current, null); assert.equal(engine.current, null)
  const foreign = { current: { target: {}, scene: other } }; run(scene, engine, foreign)
  assert.equal(foreign.current.scene, other); assert.equal(disposals, 2)
})
test('beginLoad cancels an armed press only after rejecting a missing checkpoint', () => {
  assert.match(source, /function beginLoad\(request: LoadRequest\) \{\s*setCheatsOpen\(false\)\s*if \(request.kind === 'checkpoint' && !store.hasCheckpoint\(\)\) return\s*followerPress.current = null/)
})
