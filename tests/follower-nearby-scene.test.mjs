// Actual Page handlers, Scene methods/animate, store ownership and fixed-clock
// consumer. DOM/GPU and event trust are supplied; this is not browser evidence.
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'
import { pageNearby, nearbyEvent, noOp } from './support/follower-nearby-page.mjs'

const source = ts.createSourceFile('scene.ts', readFileSync(new URL('../app/scene.ts', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true)
const declaration = source.statements.find(node => ts.isClassDeclaration(node) && node.name.text === 'GameScene')
const animateSource = declaration.members.find(node => node.name?.getText(source) === 'animate').initializer.getText(source)
const execute = (expression, bindings, receiver) => Function(...Object.keys(bindings), `return ${ts.transpileModule(`(${expression})`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText}`).call(receiver, ...Object.values(bindings))

async function fixture(t) {
  const api = await loadSceneFixture(),
    { GameScene } = await import('../app/scene.ts'),
    { createGameStore } = await import('../app/game-store.ts'),
    store = createGameStore(), logs = [], globals = new Map()
  let arrival = 1, modal = false
  for (const [name, value] of Object.entries({ document: { hidden: false, querySelector: () => modal ? {} : null }, performance: { now: () => arrival }, devicePixelRatio: 1, requestAnimationFrame: () => 1, cancelAnimationFrame: noOp })) {
    globals.set(name, Object.getOwnPropertyDescriptor(globalThis, name))
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value })
  }
  t.after(() => {
    for (const [name, descriptor] of globals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor)
      else delete globalThis[name]
    }
  })
  function bind() {
    const world = store.getWorld()
    world.inputMask = 0
    world.manaWorld.gameFlags &= ~32
    world.paused = true
    const scene = Object.assign(Object.create(GameScene.prototype), {
      world, presentationBinding: store.bindPresentation(world), started: true, disposed: false,
      nearbyFollowersHudActive: true, previous: null, fpsGraph: null,
      gameClock: { animationTime: 0, animationFrame: 0 }, overviewActive: false, overviewStage: null,
      renderer: { getPixelRatio: () => 1 }, hoveredObject: null, buildingPanels: new Map(),
      onSound: (...args) => logs.push(['cue', ...args]),
      onChange: () => logs.push(['change', world.castingTribes[0].flags]),
      updateCameraMotion: () => true,
    })
    for (const name of ['playWorldSounds', 'updateTerrainFrame', 'updateDecorationsFrame', 'cancelTooltipInspection', 'updateUnitsFrame', 'renderTooltip', 'updateBuildingsFrame', 'updateEffectsFrame', 'updateShrinesFrame', 'updatePointerFrame', 'updatePlacement', 'updateSpellPointerFrame', 'updateEnvironmentFrame', 'renderSceneFrame', 'updateHudFrame']) scene[name] = noOp
    scene.animate = execute(animateSource, {
      syncSecondaryReservations: noOp, updateVehiclesFrame: noOp, SPELLS: [], worldTooltipObject: noOp,
      advanceGame: (w, clock, seconds) => { logs.push(['advanceGame', w.castingTribes[0].flags]); api.advanceGame(w, clock, seconds) },
    }, scene)
    const page = pageNearby(scene)
    scene.onNearbyFollowersCancel = page.clearNearbyPress
    return { scene, page, world }
  }
  const owned = bind()
  return { ...owned, store, logs, bind, at: value => { arrival = value }, modal: value => { modal = value } }
}
function release(page) {
  const control = page.render().props, event = nearbyEvent()
  control.onPointerDown(event)
  control.onPointerUp(event)
  control.onClick(event)
}
const mode = world => !!(world.castingTribes[0].flags & 128)

test('actual Page release reaches Scene first-wins dispatch before simulation, even while paused', async t => {
  const f = await fixture(t), flags = f.world.castingTribes[0].flags | 0x100040
  f.world.castingTribes[0].flags = flags
  f.scene.animate(0)
  f.at(1); release(f.page)
  f.at(2); release(f.page)
  assert.equal(mode(f.world), false)
  const turn = f.world.turn
  f.scene.animate(100)
  assert.equal(mode(f.world), true)
  assert.equal(f.world.castingTribes[0].flags, flags | 128)
  assert.equal(f.world.turn, turn)
  assert.deepEqual(f.logs.filter(row => row[0] === 'cue'), [['cue', 110, 1, 0], ['cue', 110, 1, 0]])
  assert.deepEqual(f.logs.slice(-2), [['change', flags | 128], ['advanceGame', flags | 128]])
  f.at(101); release(f.page)
  f.scene.animate(200)
  assert.equal(f.world.castingTribes[0].flags, flags)
  assert.deepEqual(f.logs.filter(row => row[0] === 'cue').at(-1), ['cue', 111, 1, 0])
})

test('a second valid held press survives earlier commitment and releases against the new mode', async t => {
  const f = await fixture(t)
  f.scene.animate(0)
  f.at(1); release(f.page)
  const control = f.page.render().props, event = nearbyEvent()
  control.onPointerDown(event)
  f.scene.animate(100)
  assert.equal(f.page.pressed, true)
  assert.equal(f.page.render().children[0].props.id, 878)
  f.at(101); control.onPointerUp(event)
  f.scene.animate(200)
  assert.equal(mode(f.world), false)
  assert.deepEqual(f.logs.filter(row => row[0] === 'cue').map(row => row[1]), [110, 111])
})

test('actual elapsed dispatch continues at speed zero and across an ordinary speed change', async t => {
  const f = await fixture(t)
  f.world.paused = false
  f.world.speed = 0
  f.scene.animate(0)
  f.at(1); release(f.page)
  const before = f.world.turn
  f.scene.animate(100)
  assert.equal(mode(f.world), true)
  assert.equal(f.world.turn, before, 'mode dispatch does not force a simulation turn')
  f.world.speed = 2
  f.at(101); release(f.page)
  f.scene.animate(200)
  assert.equal(mode(f.world), false)
  assert.ok(f.world.turn > before, 'only the subsequent ordinary clock advances simulation')
  assert.equal(f.logs.filter(row => row[0] === 'change').length, 2)
})

test('blocked, modal and hidden visits cancel pending and armed input without deferred actions', async t => {
  const f = await fixture(t)
  for (const [block, clear] of [
    [() => { f.world.inputMask = 1 }, () => { f.world.inputMask = 0 }],
    [() => { f.world.manaWorld.gameFlags |= 32 }, () => { f.world.manaWorld.gameFlags &= ~32 }],
    [() => { f.scene.overviewActive = true }, () => { f.scene.overviewActive = false }],
    [() => { f.scene.overviewStage = 'enter' }, () => { f.scene.overviewStage = null }],
    [() => f.modal(true), () => f.modal(false)],
    [() => { document.hidden = true }, () => { document.hidden = false }],
  ]) {
    f.at(1); release(f.page)
    f.page.render().props.onPointerDown(nearbyEvent())
    const cues = f.logs.filter(row => row[0] === 'cue').length
    block()
    assert.equal(f.scene.requestNearbyFollowers(), false)
    f.scene.dispatchNearbyFollowers(100)
    assert.equal(f.page.pressed, false)
    clear()
    f.scene.dispatchNearbyFollowers(10000)
    assert.equal(mode(f.world), false)
    assert.equal(f.logs.filter(row => row[0] === 'cue').length, cues)
  }
})

test('actual store replacement and same-World rebinding reject stale callbacks before disposal', async t => {
  const f = await fixture(t)
  for (const replace of [() => f.store.restart(), () => f.store.startMission(2), () => f.store.loadCheckpoint(), old => f.store.bindPresentation(old.world)]) {
    await f.store.saveCheckpoint()
    const old = f.bind()
    old.scene.animate(0)
    f.at(1); release(old.page)
    const before = old.world.castingTribes[0].flags
    replace(old)
    const replacement = f.store.getWorld(), after = replacement.castingTribes[0].flags
    const cues = f.logs.filter(row => row[0] === 'cue').length
    old.scene.animate(200)
    assert.equal(old.scene.requestNearbyFollowers(), false)
    assert.equal(old.world.castingTribes[0].flags, before)
    assert.equal(replacement.castingTribes[0].flags, after)
    assert.equal(f.logs.filter(row => row[0] === 'cue').length, cues)
    assert.equal(old.page.pressed, false)
  }
})

test('actual Save clones committed mode without flushing; ordinary menu cancels synchronously', async t => {
  const f = await fixture(t)
  f.scene.animate(0)
  f.at(1); release(f.page)
  const keys = Object.keys(f.world)
  await f.store.saveCheckpoint()
  f.scene.animate(100)
  assert.equal(mode(f.world), true)
  assert.deepEqual(Object.keys(f.world), keys, 'no transient checkpoint fields')
  f.store.loadCheckpoint()
  assert.equal(mode(f.store.getWorld()), false, 'saved clone did not change with live commit')
  const next = f.bind()
  next.scene.animate(200)
  f.at(201); release(next.page)
  next.scene.animate(300)
  await f.store.saveCheckpoint()
  f.store.loadCheckpoint()
  assert.equal(mode(f.store.getWorld()), true)
  const menu = f.bind()
  menu.scene.animate(400)
  f.at(401); release(menu.page)
  menu.page.openMenu()
  await f.store.saveCheckpoint()
  menu.scene.dispatchNearbyFollowers(500)
  assert.equal(mode(menu.world), true, 'same-handler Save cannot flush canceled input')
  f.store.restart()
  assert.equal(mode(f.store.getWorld()), false)
})

test('actual Scene disposal cancels pending input and the elapsed phase', async t => {
  const f = await fixture(t), disposable = () => ({ dispose: noOp, remove: noOp })
  f.scene.animate(0)
  f.at(1); release(f.page)
  f.page.render().props.onPointerDown(nearbyEvent())
  Object.assign(f.scene, {
    ownedSounds: new Map(), terrainLoad: new AbortController(), resize: { disconnect: noOp },
    disposeListeners: [], scene: { remove: noOp }, globe: disposable(), waterMap: disposable(),
    terrainMap: disposable(), view: disposable(), renderer: { ...f.scene.renderer, dispose: noOp, domElement: disposable() },
    tooltipElement: disposable(), pointerOutline: disposable(), spellPointer: disposable(),
    objectPanels: disposable(), worshipPresentation: disposable(), releaseGroup: noOp,
  })
  f.scene.dispose()
  f.scene.dispose()
  assert.equal(f.page.pressed, false)
  f.scene.animate(1000)
  assert.equal(mode(f.world), false)
  assert.equal(f.scene.requestNearbyFollowers(), false)
})
