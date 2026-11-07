import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { observeBuildingPanelPointerTarget } from '../scripts/tutorial-browser/building-panel-pointer-target.mjs'

const source = readFileSync(new URL('../scripts/tutorial-browser/building-panel-identity.mjs', import.meta.url), 'utf8')
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
const plain = value => JSON.parse(JSON.stringify(value))
function fixture() {
  const rect = { left: 100, top: 100, width: 20, height: 30 }, calls = [], listeners = new Set()
  const child = {}, unrelated = {}
  const p = { isConnected: true, hidden: false, hovered: false,
    style: { display: 'block', visibility: 'visible' },
    getClientRects: () => [rect], getBoundingClientRect: () => ({ ...rect }),
    contains: element => element === child, matches: selector => { assert.equal(selector, ':hover'); return p.hovered } }
  const building = { id: 7, team: 'blue' },
    scene = { buildingPanels: new Map([[7, p]]), visible: () => true, navigationButtons: () => 0,
      renderer: { info: { render: { frame: 9 } } }, viewPoint: { x: 1, z: 2 } },
    h = { panel: p, building, scene }
  const context = { window: { buildingIdentity: h, innerWidth: 1440, innerHeight: 1000 },
    document: { querySelectorAll: () => p.hidden ? [] : [p], activeElement: null,
      addEventListener: (type, callback, options) => {
        assert.equal(type, 'pointermove'); assert.deepEqual(plain(options), { capture: true, once: true }); listeners.add(callback)
      },
      removeEventListener: (type, callback, capture) => {
        assert.equal(type, 'pointermove'); assert.equal(capture, true); listeners.delete(callback)
      },
      elementFromPoint: (x, y) => { calls.push(['hit', x, y]); return p } },
    getComputedStyle: element => element.style, HTMLElement: class {} }
  const focused = new context.HTMLElement()
  p.contains = element => element === child || element === focused
  focused.blur = () => { calls.push(['blur']); context.document.activeElement = null }
  scene.focus = point => { calls.push(['focus', plain(point)]); scene.viewPoint = point; scene.visible = () => false }
  context.window.testSceneRef = { current: scene }
  const dispatch = (patch = {}) => {
    const event = { isTrusted: true, pointerType: 'mouse', clientX: 110, clientY: 115, target: p, ...patch }
    for (const listener of [...listeners]) { listeners.delete(listener); listener(event) }
  }
  return { rect, p, child, unrelated, building, scene, h, context, calls, focused, listeners, dispatch }
}
function observe(f) {
  // Execute the actual Playwright-serialized callback with supplied DOM inputs.
  return runInNewContext(`(${observeBuildingPanelPointerTarget.toString()})()`, f.context)
}
function actualCallback(name, f, hold = 'pointer', boundary = 'ownership') {
  const prefix = `const ${name} = await page.evaluate(`,
    at = source.indexOf(prefix), start = at + prefix.length,
    end = source.indexOf(', { hold, boundary })', start)
  assert.ok(at >= 0 && end > start)
  return runInNewContext(`(${source.slice(start, end)})(${JSON.stringify({ hold, boundary })})`, f.context)
}
function holdBlock() {
  const start = source.indexOf('        timing.mark(`${hold}/${boundary}/hold-input:start`)'),
    endMark = '        timing.mark(`${hold}/${boundary}/hold-input:complete`)',
    end = source.indexOf(endMark, start)
  assert.ok(start > 0 && end > start)
  return new AsyncFunction('hold', 'boundary', 'timing', 'page', 'panel', 'assert', 'observeBuildingPanelPointerTarget', source.slice(start, end + endMark.length))
}
const runHold = holdBlock()

test('current visible unobscured panel or descendant returns its finite center without an input', () => {
  for (const descendant of [false, true]) {
    const f = fixture()
    if (descendant) f.context.document.elementFromPoint = () => f.child
    assert.deepEqual(plain(observe(f)), { x: 110, y: 115 })
    assert.equal(f.h.pointerTargetBefore.panel, f.p)
    assert.equal(f.h.pointerTargetBefore.building, f.building)
    assert.equal(f.h.pointerTargetBefore.scene, f.scene)
    assert.equal(f.p.hovered, false, 'Observation must not manufacture hover')
    assert.equal(f.scene.renderer.info.render.frame, 9)
    assert.equal(f.building.team, 'blue')
  }
})

const invalid = [
  ['offscreen', f => { f.rect.left = 5000 }],
  ['viewport edge', f => { f.rect.left = -10 }],
  ['zero width', f => { f.rect.width = 0 }],
  ['negative height', f => { f.rect.height = -1 }],
  ['nonfinite position', f => { f.rect.left = NaN }],
  ['infinite size', f => { f.rect.width = Infinity }],
  ['nonfinite viewport', f => { f.context.window.innerHeight = NaN }],
  ['zero viewport', f => { f.context.window.innerWidth = 0 }],
  ['occluded', f => { f.context.document.elementFromPoint = () => f.unrelated }],
  ['no hit', f => { f.context.document.elementFromPoint = () => null }],
  ['hidden', f => { f.p.hidden = true }],
  ['disconnected', f => { f.p.isConnected = false }],
  ['display none', f => { f.p.style.display = 'none' }],
  ['visibility hidden', f => { f.p.style.visibility = 'hidden' }],
  ['visibility collapse', f => { f.p.style.visibility = 'collapse' }],
  ['no layout boxes', f => { f.p.getClientRects = () => [] }],
  ['stale map', f => { f.scene.buildingPanels.set(7, {}) }],
  ['duplicate visible panel', f => { f.context.document.querySelectorAll = () => [f.p, { ...f.p }] }],
  ['unrelated visible panel', f => { f.context.document.querySelectorAll = () => [{ ...f.p }] }],
  ['foreign ownership', f => { f.building.team = 'red' }],
  ['camera excluded', f => { f.scene.visible = () => false }],
  ['active navigation', f => { f.scene.navigationButtons = () => 1 }],
]
for (const [name, damage] of invalid) test(`immediate target rejects ${name} and removes any prior witness`, () => {
  const f = fixture()
  observe(f)
  damage(f)
  assert.throws(() => observe(f))
  assert.equal(Object.hasOwn(f.h, 'pointerTargetBefore'), false)
  assert.equal(f.listeners.size, 0)
  assert.equal(f.p.hovered, false)
})

test('actual pointer block observes once and sends exactly one real move before the original blur/hold snapshot', async () => {
  const f = fixture(), marks = [], inputs = []
  f.context.document.activeElement = f.focused
  const page = { evaluate: async callback => { assert.equal(callback, observeBuildingPanelPointerTarget); inputs.push('observe'); return observe(f) },
    mouse: { move: async (x, y) => { inputs.push(['move', x, y]); f.p.hovered = true; f.dispatch({ clientX: x, clientY: y }) } } }
  await runHold('pointer', 'ownership', { mark: mark => marks.push(mark) }, page, {}, assert, observeBuildingPanelPointerTarget)
  assert.deepEqual(inputs, ['observe', ['move', 110, 115]])
  assert.deepEqual(marks, ['pointer/ownership/hold-input:start', 'pointer/ownership/hold-input:complete'])
  assert.equal(actualCallback('before', f).held, true)
  assert.equal(f.context.document.activeElement, null)
  assert.equal(Object.hasOwn(f.h, 'pointerTargetBefore'), false, 'Witness is consumed, not reusable')
  assert.deepEqual(f.calls.filter(call => call[0] === 'blur'), [['blur']])
  assert.throws(() => actualCallback('before', f), /identity changed/)
})

test('actual focus block remains focus then away with no target observation or blur', async () => {
  const f = fixture(), inputs = []
  const panel = { locator: selector => { assert.equal(selector, '.dismantle-control'); return { focus: async () => { inputs.push('focus'); f.context.document.activeElement = f.focused } } } }
  const page = { evaluate: () => { throw Error('Unexpected pointer observation') }, mouse: { move: async (x, y) => inputs.push(['move', x, y]) } }
  await runHold('focus', 'ownership', { mark() {} }, page, panel, assert, observeBuildingPanelPointerTarget)
  assert.deepEqual(inputs, ['focus', ['move', 10, 10]])
  assert.equal(actualCallback('before', f, 'focus').held, true)
  assert.equal(f.context.document.activeElement, f.focused)
})

test('changed identity, geometry, viewport or hit between observation and real-input snapshot fails closed', () => {
  for (const damage of [
    f => { const replacement = { ...f.p }; f.h.panel = replacement; f.scene.buildingPanels.set(7, replacement) },
    f => { f.h.building = { ...f.building } },
    f => { f.h.building.id++; f.scene.buildingPanels.set(f.h.building.id, f.p) },
    f => { f.h.scene = { ...f.scene } },
    f => { f.context.window.buildingIdentity = { panel: f.p, building: f.building, scene: f.scene } },
    f => { f.rect.left += 1 },
    f => { f.rect.top += 1 },
    f => { f.rect.width += 1 },
    f => { f.rect.height += 1 },
    f => { f.context.window.innerWidth += 1 },
    f => { f.context.window.innerHeight += 1 },
    f => { f.context.document.elementFromPoint = () => f.unrelated },
    f => { delete f.h.pointerTargetBefore },
  ]) {
    const f = fixture(); observe(f); f.dispatch(); f.p.hovered = true; damage(f)
    assert.throws(() => actualCallback('before', f), /Observed pointer target/)
    assert.equal(f.building.team, 'blue')
    assert.equal(f.h.heldVisibilityBefore, undefined)
  }
})

test('a missing, synthetic, wrong-target, wrong-type or wrong-coordinate event cannot certify the hold', () => {
  for (const event of [null, { isTrusted: false }, { pointerType: 'pen' }, { clientX: 111 }, { clientY: 116 }, { target: {} }]) {
    const f = fixture(); observe(f); f.p.hovered = true
    if (event) f.dispatch(event)
    assert.throws(() => actualCallback('before', f), /expected trusted mouse move/)
    assert.equal(f.listeners.size, 0)
    assert.equal(f.h.heldVisibilityBefore, undefined)
  }
})

test('movement, replacement and occlusion at event delivery cannot be repaired before the snapshot', () => {
  for (const temporarilyChange of [
    f => { f.rect.left++; return () => { f.rect.left-- } },
    f => { f.h.building = { ...f.building }; return () => { f.h.building = f.building } },
    f => { f.h.scene = { ...f.scene }; return () => { f.h.scene = f.scene } },
    f => { const hit = f.context.document.elementFromPoint; f.context.document.elementFromPoint = () => f.unrelated; return () => { f.context.document.elementFromPoint = hit } },
    f => { f.p.hidden = true; return () => { f.p.hidden = false } },
    f => { f.scene.navigationButtons = () => 1; return () => { f.scene.navigationButtons = () => 0 } },
  ]) {
    const f = fixture(); observe(f)
    const restore = temporarilyChange(f)
    f.dispatch(); restore(); f.p.hovered = true
    // A second correct event cannot rescue the first failed observation.
    f.dispatch()
    assert.equal(f.h.pointerTargetBefore.received, false)
    assert.throws(() => actualCallback('before', f), /expected trusted mouse move/)
    assert.equal(f.h.heldVisibilityBefore, undefined)
  }
})

test('a successful event is still not a hold or a rendered-frame witness', () => {
  const f = fixture(); observe(f); f.dispatch({ target: f.child })
  assert.equal(f.h.pointerTargetBefore.received, true)
  assert.equal(f.p.hovered, false)
  assert.equal(f.scene.renderer.info.render.frame, 9)
  assert.throws(() => actualCallback('before', f), /Expected held, owned and visible/)
})

test('event-time rejection details survive witness cleanup and the actual terminal receipt writer', async () => {
  const prefix = 'export async function finishBuildingPanelIdentity',
    start = source.indexOf(prefix), end = source.indexOf('\n// Serialized directly', start)
  assert.ok(start > 0 && end > start)
  for (const [damage, event, reason] of [
    [() => () => {}, { isTrusted: false }, 'untrusted or non-mouse event'],
    [() => () => {}, { clientX: 111 }, 'unexpected event coordinates'],
    [() => () => {}, { target: {} }, 'event for another element'],
    [f => { f.rect.left++; return () => { f.rect.left-- } }, {}, 'changed at input delivery'],
    [f => { const hit = f.context.document.elementFromPoint; f.context.document.elementFromPoint = () => null; return () => { f.context.document.elementFromPoint = hit } }, {}, 'occluded or has no panel hit'],
    [f => { const hit = f.context.document.elementFromPoint; f.context.document.elementFromPoint = () => { throw undefined }; return () => { f.context.document.elementFromPoint = hit } }, {}, 'undefined'],
    [() => () => {}, null, 'No matching event was observed'],
  ]) {
    const f = fixture(); observe(f)
    const restore = damage(f)
    if (event) f.dispatch(event)
    restore(); f.p.hovered = true
    let failure
    try { actualCallback('before', f) } catch (error) { failure = error }
    assert.ok(failure)
    assert.ok(failure.message.includes(reason), failure.message)
    assert.equal(Object.hasOwn(f.h, 'pointerTargetBefore'), false)
    assert.equal(f.listeners.size, 0)
    let receipt, closed = 0
    const finish = runInNewContext(`(${source.slice(start, end).replace('export ', '')})`, {
      resolve: (...parts) => parts.join('/'),
      writeFileSync: (path, bytes) => { assert.equal(path, '/output/building-panel-identity.json'); receipt = JSON.parse(bytes) },
    })
    const result = await finish({ failure, report: { errors: [] }, output: '/output', context: { close: async () => { closed++ } } })
      .then(() => ({ rejected: false }), error => ({ rejected: true, error }))
    assert.equal(result.rejected, true)
    assert.equal(result.error.errors[0], failure)
    assert.equal(closed, 1)
    assert.equal(receipt.status, 'failed')
    assert.equal(receipt.contextClosed, true)
    assert.ok(receipt.failures[0].message.includes(reason), receipt.failures[0].message)
  }
})

test('the original real blur is before target revalidation; blur movement cannot certify a hold', () => {
  const f = fixture(); observe(f); f.dispatch(); f.p.hovered = true
  f.context.document.activeElement = f.focused
  f.focused.blur = () => { f.context.document.activeElement = null; f.rect.left++ }
  assert.throws(() => actualCallback('before', f), /moved or viewport changed/)
  assert.equal(f.h.heldVisibilityBefore, undefined)
})

test('the original immediate hold and eligibility checks are still independent of target observation', () => {
  for (const damage of [
    f => { f.p.hovered = false },
    f => { f.p.hidden = true },
    f => { f.p.isConnected = false },
    f => { f.scene.buildingPanels.set(7, {}) },
    f => { f.building.team = 'red' },
    f => { f.scene.visible = () => false },
    f => { f.scene.navigationButtons = () => 1 },
    f => { f.context.document.activeElement = f.focused; f.focused.blur = () => {} },
  ]) {
    const f = fixture(); observe(f); f.dispatch(); f.p.hovered = true; damage(f)
    assert.throws(() => actualCallback('before', f), /Expected held, owned and visible/)
    assert.equal(f.h.heldVisibilityBefore, undefined)
  }
})

test('four original boundaries require held snapshots and ordinary-frame predicate before transition', () => {
  for (const hold of ['pointer', 'focus']) for (const boundary of ['ownership', 'visibility']) {
    const f = fixture()
    if (hold === 'pointer') { observe(f); f.dispatch(); f.p.hovered = true }
    else f.context.document.activeElement = f.focused
    const before = actualCallback('before', f, hold, boundary)
    assert.equal(before.frame, 9)
    f.scene.renderer.info.render.frame += 2 // Supplied frame counter, not real rendering proof.
    const transition = actualCallback('transition', f, hold, boundary)
    assert.equal(transition.held, true)
    assert.equal(transition.frame, 11)
    assert.equal(transition.team, boundary === 'ownership' ? 'red' : 'blue')
    assert.equal(transition.afterVisible, boundary === 'ownership')
  }
  assert.match(source, /await page\.waitForFunction\(frame => window\.testSceneRef\.current\.renderer\.info\.render\.frame >= frame \+ 2, before\.frame\)/)
})

test('post-frame loss, replacement and cross-hold still reject before the eligibility boundary', () => {
  for (const damage of [
    f => { f.p.hovered = false },
    f => { f.context.document.activeElement = f.focused },
    f => { const replacement = { ...f.p }; f.h.panel = replacement; f.scene.buildingPanels.set(7, replacement) },
    f => { f.h.building = { ...f.building } },
    f => { f.h.scene = { ...f.scene } },
    f => { delete f.h.heldVisibilityBefore },
  ]) {
    const f = fixture(); observe(f); f.dispatch(); f.p.hovered = true; actualCallback('before', f)
    f.scene.renderer.info.render.frame += 2; damage(f)
    assert.throws(() => actualCallback('transition', f, 'pointer', 'visibility'))
    assert.equal(f.calls.filter(call => call[0] === 'focus').length, 0)
    assert.equal(f.building.team, 'blue')
  }
})

for (const stage of ['observe', 'move']) test(`actual input block retains every falsey ${stage} rejection with no retry`, async () => {
  for (const failure of [undefined, null, false, 0, NaN, '', Error('transport')]) {
    const calls = [], marks = []
    const operation = name => { calls.push(name); if (name === stage) throw failure; return { x: 110, y: 115 } }
    const page = { evaluate: async () => operation('observe'), mouse: { move: async () => operation('move') } }
    const result = await runHold('pointer', 'ownership', { mark: mark => marks.push(mark) }, page, {}, assert, observeBuildingPanelPointerTarget)
      .then(() => ({ rejected: false }), error => ({ rejected: true, error }))
    assert.equal(result.rejected, true)
    assert.ok(Object.is(result.error, failure))
    assert.deepEqual(calls, stage === 'observe' ? ['observe'] : ['observe', 'move'])
    assert.deepEqual(marks, ['pointer/ownership/hold-input:start'])
  }
})

test('invalid resolved observation cannot produce a mouse move', async () => {
  for (const target of [undefined, null, false, 0, NaN, '', {}, { x: NaN, y: 5 }, { x: 5, y: Infinity }]) {
    let moves = 0
    const page = { evaluate: async () => target, mouse: { move: async () => { moves++ } } }
    await assert.rejects(runHold('pointer', 'ownership', { mark() {} }, page, {}, assert, observeBuildingPanelPointerTarget), /Expected observed pointer/)
    assert.equal(moves, 0)
  }
})

test('hold completion waits for both observation and real move to settle', async () => {
  const marks = [], calls = []; let releaseObservation, releaseMove
  const observation = new Promise(resolve => { releaseObservation = () => resolve({ x: 110, y: 115 }) }),
    move = new Promise(resolve => { releaseMove = resolve })
  const page = { evaluate: () => { calls.push('observe'); return observation }, mouse: { move: () => { calls.push('move'); return move } } }
  const result = runHold('pointer', 'ownership', { mark: mark => marks.push(mark) }, page, {}, assert, observeBuildingPanelPointerTarget)
  assert.deepEqual(calls, ['observe'])
  releaseObservation(); await Promise.resolve(); await Promise.resolve()
  assert.deepEqual(calls, ['observe', 'move'])
  assert.deepEqual(marks, ['pointer/ownership/hold-input:start'])
  releaseMove(); await result
  assert.deepEqual(marks, ['pointer/ownership/hold-input:start', 'pointer/ownership/hold-input:complete'])
})
