import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fixture } from './help-composition-fixture.mjs'
import { helpPanelLayout } from '../app/help-layout.ts'
import { helpPreview } from '../app/help-preview.ts'
import help from '../app/original-help.json' with { type: 'json' }

const input = (patch = {}) => ({ topic: 1051,
  // Explicit fixture, never asserted to be complete current World knowledge.
  discovery: { status: 'provided', value: { spellBits: 0, buildingBits: 0,
    stock: [], levelFlags: 0, spellDefinitionByte: [] } },
  scrollPosition: 0, controls: { counter: 4, leftDown: false, leftUp: false },
  animation: { counter: 0, phase: { counter: 0, frame: 0 } },
  hoverPoint: null, vehiclePreview: 'disabled', ...patch })
const topicOf = kind => Number(Object.keys(help.topics).find(topic => help.topics[topic].illustration.kind === kind))
const ready = async (owner, request = input()) => {
  const state = await owner.present(request)
  assert.equal(state.status, 'presented', state.reason)
  return state
}

test('full-frame document, pane, wrapper and both canvas styles come from one measured snapshot', async t => {
  const f = fixture(t, { scale: 1.3, width: 913, height: 701, x: 17.25, y: 4.5 })
  const owner = f.create(), state = await ready(owner)
  const { frame } = state.snapshot
  assert.deepEqual([state.document.width, state.document.height], [frame.width, frame.height])
  assert.deepEqual(state.document.panels, helpPanelLayout(frame.width, frame.height, frame.hudWidth))
  assert.deepEqual(frame.preview, state.document.panels.inner.preview)
  assert.equal(frame.articleStyle.transform, 'scale(1.3)')
  for (const canvas of [owner.personCanvas, owner.vehicleCanvas]) {
    assert.equal(canvas.style.left, '0px'); assert.equal(canvas.style.top, '0px')
    assert.equal(canvas.style.width, `${frame.width}px`); assert.equal(canvas.style.height, `${frame.height}px`)
    assert.equal(canvas.style.transform, undefined)
  }
  assert.equal(f.loadingCalls, 0)
})

test('person uses exact cache assets and caller counter/phase without mutating source inputs or World', async t => {
  const f = fixture(t); f.ready()
  const owner = f.create(), request = input({ topic: topicOf(0) })
  const before = structuredClone({ world: f.scene.world, request })
  const state = await ready(owner, request)
  assert.equal(state.preview.status, 'drawn'); assert.equal(state.preview.kind, 'person')
  assert.equal(f.calls.some(call => call[0] === '2d:drawImage'), true)
  assert.deepEqual({ world: f.scene.world, request }, before)
  assert.equal(state.controls.counter, 4)
  assert.equal(request.animation.counter, 0)
  assert.equal(f.loadingCalls, 2)
  owner.dispose()
  assert.deepEqual([...f.loads.values()].map(load => load.disposed), [0, 0])
})

test('shared dispatch counts stay unchanged and vehicle rendering needs explicit opt-in', async t => {
  const f = fixture(t); f.ready()
  const owner = f.create(), empty = await ready(owner)
  const counts = {}
  for (const topic of Object.values(help.topics)) {
    const result = helpPreview(topic.illustration, { ...input().animation, treeVariant: 0,
      pane: empty.snapshot.frame.preview, person: empty.snapshot.person.context })
    counts[result.status] = (counts[result.status] ?? 0) + 1
  }
  assert.deepEqual(counts, { 'native-empty': 34, ready: 8, unsupported: 46 })
  assert.equal((await owner.present(input({ topic: topicOf(2) }))).status, 'unavailable')
  const vehicle = await ready(owner, input({ topic: topicOf(2), vehiclePreview: 'browser-owned-linear' }))
  assert.deepEqual(vehicle.preview, { status: 'drawn', kind: 'vehicle' })
  assert.equal((await owner.present(input({ topic: topicOf(1) }))).status, 'unavailable')
})

test('incomplete discovery and missing person atlas do not become false bits or successful blanks', async t => {
  const f = fixture(t), owner = f.create()
  assert.deepEqual(await owner.present(input({ discovery: { status: 'unavailable', reason: 'unowned-building-bit' } })),
    { status: 'unavailable', reason: 'unowned-building-bit' })
  assert.equal((await owner.present(input({ topic: topicOf(0) }))).status, 'unavailable')
  assert.equal(f.loadingCalls, 0)
  assert.equal(owner.getSnapshot().status, 'unavailable')
})

test('pending asset completion cannot resurrect a superseded topic, invalidation or disposed scene', async t => {
  const f = fixture(t), owner = f.create()
  let resolve
  f.state.pendingDecode = new Promise(done => { resolve = done })
  const first = owner.present(input())
  const second = owner.present(input({ topic: 984 }))
  resolve(); await first
  const latest = await second
  assert.equal(latest.document.topic, 984)
  owner.invalidate('explicit-host-hide')
  assert.equal(owner.isCurrent(latest), false)
  f.state.pendingDecode = new Promise(done => { resolve = done })
  const pending = owner.present(input())
  f.scene.disposeListeners.forEach(listener => listener())
  resolve(); await pending
  assert.deepEqual(owner.getSnapshot(), { status: 'unavailable', reason: 'help-article-disposed' })
  assert.equal((await owner.present(input())).status, 'unavailable')
})

test('changed scene, World, player, environment and sub-integer geometry invalidate old presentations', async t => {
  for (const change of [f => { f.state.current = false }, f => { f.scene.world = { ...f.scene.world } },
    f => { f.scene.world.manaWorld.playerTribe = 1 }, f => { f.scene.environment = { ...f.scene.environment } },
    f => { f.state.width += 0.1 }, f => { f.state.attached = false }]) {
    const f = fixture(t), owner = f.create(), state = await ready(owner)
    change(f)
    assert.equal(owner.isCurrent(state), false)
    assert.equal(owner.getSnapshot().status, 'unavailable')
    assert.equal(owner.afterDraw(state, { counter: 1, mouseY: 55, leftDown: true, leftUp: false }), null)
    owner.dispose()
  }
})

test('original scroll position remains track units; explicit after-draw sample survives subsequent same-topic draws', async t => {
  const f = fixture(t), owner = f.create()
  let state
  for (const topic of Object.keys(help.topics)) {
    const next = await owner.present(input({ topic: Number(topic), scrollPosition: 7 }))
    if (next.status === 'presented' && next.maximum > 20) { state = next; break }
  }
  assert.ok(state, 'one supported article must have scrollable content')
  owner.scrollController.begin(50)
  assert.equal(owner.afterDraw(state, { counter: 9, mouseY: 55, leftDown: true, leftUp: false }), 12)
  const next = await ready(owner, input({ topic: state.document.topic, scrollPosition: 12 }))
  assert.equal(owner.afterDraw(next, { counter: 9, mouseY: 90, leftDown: true, leftUp: false }), 12)
  assert.equal(owner.afterDraw(next, { counter: 10, mouseY: 60, leftDown: true, leftUp: false }), 17)
  const other = await ready(owner)
  assert.equal(owner.afterDraw(other, { counter: 11, mouseY: 90, leftDown: true, leftUp: false }), 0)
})

test('exact image-dimension failure clears article and caller can retry without hidden fallback', async t => {
  const f = fixture(t, { wrongDimensions: true }), owner = f.create()
  const failed = await owner.present(input())
  assert.equal(failed.status, 'unavailable'); assert.match(failed.reason, /dimensions differ/)
  f.state.wrongDimensions = false
  await ready(owner)
  for (const patch of [{ controls: { counter: -1, leftDown: false, leftUp: false } },
    { animation: { counter: 1, phase: { counter: 0, frame: -1 } } }, { scrollPosition: NaN }])
    assert.equal((await owner.present(input(patch))).status, 'unavailable')
})

test('mount replay is not terminal; real unmount and scene cleanup are terminal and failure-isolated', async t => {
  const f = fixture(t), owner = f.create()
  const release = owner.mount(); release()
  const mountedAgain = owner.mount()
  await Promise.resolve()
  await ready(owner)
  assert.throws(() => owner.mount(), /already mounted/)
  let later = 0
  owner.subscribe(() => { throw Error('Injected subscriber failure') })
  f.scene.disposeListeners.push(() => { later++ })
  f.state.throw2d = ['clearRect']; f.state.throwRemove = true
  mountedAgain()
  await Promise.resolve()
  assert.equal(owner.getSnapshot().reason, 'help-article-disposed')
  assert.ok(owner.disposalFailures.length > 0)
  assert.equal(Object.isFrozen(owner.disposalFailures), true)
  f.scene.disposeListeners.forEach(listener => listener())
  assert.equal(later, 1)
  assert.throws(() => owner.mount(), /disposed/)
  owner.dispose()
})

test('composition remains unreachable from live Home/Scene and introduces no timer or native stand-ins', () => {
  for (const file of ['page.tsx', 'scene.ts']) {
    const source = readFileSync(new URL(`../app/${file}`, import.meta.url), 'utf8')
    assert.doesNotMatch(source, /help-browser-article/)
  }
  const owner = readFileSync(new URL('../app/help-browser-article.ts', import.meta.url), 'utf8')
  assert.doesNotMatch(owner, /requestAnimationFrame|setInterval|setTimeout|World\.turn|createHelpSession/)
})
