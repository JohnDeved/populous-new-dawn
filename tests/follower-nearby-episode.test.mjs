// Actual Page/Scene/store/count/focus owners composed with the ordinary witness.
// HUD readiness, event trust, rendering and elapsed timestamps are supplied here.
// This does not replace the public-input-only ordinary browser episode.
import assert from 'node:assert/strict'
import test from 'node:test'
import ts from 'typescript'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'
import { pageNearby, nearbyEvent, evaluatePage, pageNode, pageSource, noOp } from './support/follower-nearby-page.mjs'
import { createNearbyFollowerWitness } from '../scripts/local-render/follower-nearby-witness.mjs'
import { nearbySnapshot, nearbyCheckpointState } from '../scripts/local-render/follower-nearby-snapshot.mjs'
import { assertNearbyEvidence } from '../scripts/local-render/follower-nearby-contract.mjs'
import { armTempleCheckpoint } from '../scripts/local-render/temple-training-checkpoint.mjs'
import { createCameraMotion } from '../app/camera-motion.ts'

test('ordinary observer joins actual Page activation, deferred Scene commit, count/focus and typed Load', async t => {
  const api = await loadSceneFixture(), { GameScene } = await import('../app/scene.ts'),
    { createGameStore } = await import('../app/game-store.ts'), store = createGameStore(),
    world = store.getWorld(), listeners = [], globals = new Map()
  let arrival = 0
  for (const [name, value] of Object.entries({
    document: { hidden: false, querySelector: () => null }, performance: { now: () => arrival },
  })) {
    globals.set(name, Object.getOwnPropertyDescriptor(globalThis, name))
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value })
  }
  t.after(() => {
    for (const [name, descriptor] of globals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor)
      else delete globalThis[name]
    }
  })
  // Supplied controlled-caller prerequisites only; the browser reaches these
  // through actual opening/readiness/Pause controls and never assigns them.
  world.inputMask = 0
  world.manaWorld.gameFlags &= ~32
  world.paused = true
  const panels = new Map(), scene = Object.assign(Object.create(GameScene.prototype), {
    world, presentationBinding: store.bindPresentation(world), started: true, disposed: false,
    nearbyFollowersHudActive: true, overviewActive: false, overviewStage: null,
    cameraPosition: { ...api.nativePosition(world, { x: 9, z: 33 }), angle: 0 },
    cameraMotion: createCameraMotion(), tooltip: { draw: 0 }, captureCamera: noOp,
    hudFocus: Array(8).fill(0), hudTaskFocus: Array(48).fill(0),
    objectPanels: { panels, open: id => panels.set(id, {}) }, onChange: noOp, onSound: noOp,
  }), page = pageNearby(scene), root = {
    addEventListener(type, callback, capture) { listeners.push({ type, callback, capture }) },
    removeEventListener(type, callback, capture) {
      const index = listeners.findIndex(item => item.type === type && item.callback === callback && item.capture === capture)
      if (index >= 0) listeners.splice(index, 1)
    },
  }
  scene.onNearbyFollowersCancel = page.clearNearbyPress
  const beforeRead = structuredClone(world), first = nearbySnapshot(scene, store)
  assert.equal(first.global.displayTotals[0], 6)
  assert.equal(first.global.displayTotals[2], 6)
  assert.deepEqual(world, beforeRead, 'The actual snapshot reader never mutates the World')
  const witness = createNearbyFollowerWitness({ scene, store, root, read: nearbySnapshot })
  t.after(() => witness.close())
  const deliver = (type, handler, label, extra = {}) => {
    const button = { getAttribute: name => name === 'aria-label' ? label : null },
      event = { ...nearbyEvent(extra), type, isTrusted: true, eventPhase: 1,
        target: { closest: () => button } }
    try {
      for (const item of [...listeners]) if (item.type === type && item.capture) item.callback(event)
      event.eventPhase = 3
      const result = handler(event)
      for (const item of [...listeners]) if (item.type === type && !item.capture) item.callback(event)
      return result
    } finally { event.eventPhase = 0 }
  }
  const release = () => {
    const control = page.render()
    assert.equal(control.props['aria-label'], 'Nearby followers')
    deliver('pointerdown', control.props.onPointerDown, 'Nearby followers')
    deliver('pointerup', control.props.onPointerUp, 'Nearby followers')
    deliver('click', control.props.onClick, 'Nearby followers')
  }
  scene.dispatchNearbyFollowers(0)
  witness.mark('nearby')
  arrival = 1
  release()
  assert.equal(witness.snapshot().nearby, false)
  scene.dispatchNearbyFollowers(100)
  assert.equal(witness.snapshot().nearby, true)
  const followerFunction = pageNode(node => ts.isFunctionDeclaration(node) && node.name?.text === 'followerControl'),
    controls = evaluatePage(`function(){${followerFunction.getText(pageSource)};return followerControl;}`, {
      engine: { current: scene }, followerPress: { current: null },
    })()(2)
  deliver('click', controls.onClick, 'Select brave')
  assert.equal(world.units.filter(unit => unit.kind === 'brave' && world.selected.includes(unit.id)).length, 1)
  deliver('contextmenu', controls.onContextMenu, 'Select brave', { button: 2 })
  assert.ok(panels.has(scene.hudFocus[2]))
  assert.equal(scene.cameraMotion.active, 1, 'Actual focus owner starts camera movement')

  function checkpointButton() {
    const hooks = new Map(), button = { isConnected: true, disabled: false,
      addEventListener(type, fn, capture) { assert.equal(type, 'click'); hooks.set(fn, capture) },
      removeEventListener(type, fn) { assert.equal(type, 'click'); hooks.delete(fn) },
      contains: () => false,
      click(handler) {
        const event = { isTrusted: true, target: button, eventPhase: 2 }
        try {
          for (const [fn, capture] of hooks) if (capture) fn(event)
          event.eventPhase = 3
          return handler()
        } finally { event.eventPhase = 0 }
      },
    }
    return button
  }
  const saveButton = checkpointButton(), save = armTempleCheckpoint({ kind: 'save', store,
    button: saveButton, snapshot: nearbyCheckpointState })
  t.after(() => save.close())
  const saveFunction = pageNode(node => ts.isFunctionDeclaration(node) && node.name?.text === 'saveCheckpoint'),
    savePage = evaluatePage(`function(){${saveFunction.getText(pageSource)};return saveCheckpoint;}`, {
      store, setCheckpointNotice: noOp,
    })()
  await saveButton.click(savePage)
  assert.equal(save.status().captured, true)
  assert.equal(save.status().publication.target.flags & 128, 128)
  const expectedLoad = await save.expectedLoadDigest()
  witness.mark('global')
  arrival = 101
  release()
  scene.dispatchNearbyFollowers(200)
  assert.equal(witness.snapshot().nearby, false)
  const evidence = witness.take({ phases: ['nearby', 'global'], nearby: false })
  assertNearbyEvidence(evidence, { phases: ['nearby', 'global'], nearby: false })
  assert.equal(listeners.length, 0)

  const loadButton = checkpointButton(), load = armTempleCheckpoint({ kind: 'load', store,
    button: loadButton, snapshot: nearbyCheckpointState })
  t.after(() => load.close())
  const loadFunction = pageNode(node => ts.isFunctionDeclaration(node) && node.name?.text === 'beginLoad'),
    loadPage = evaluatePage(`function(){${loadFunction.getText(pageSource)};return beginLoad;}`, {
      store, cancelNearbyInput: page.cancelNearbyInput, setSelectorOpen: noOp,
      audio: { current: { reset: noOp } }, setMenu: noOp, setReady: noOp, setError: noOp,
      loadRequest: { current: null }, setTab: noOp, setStartup: noOp,
    })()
  loadButton.click(() => loadPage({ kind: 'checkpoint' }))
  assert.deepEqual(load.status().errors, [])
  assert.deepEqual(await load.digest(), expectedLoad)
  assert.equal(load.status().publication.paused, true, 'Synchronous replacement precedes Page unpause')
  assert.equal(store.getWorld().paused, false)
  assert.equal(store.getWorld().castingTribes[0].flags & 128, 128)
  assert.equal(scene.isCurrent(), false, 'Real store replacement invalidates the observed Scene')
  assert.equal(scene.requestNearbyFollowers(), false)
  assert.equal(world.castingTribes[0].flags & 128, 0, 'Old World remains unchanged')
  // IDB is deliberately absent here. The browser separately requires a committed
  // transaction; the in-session snapshot/digest cannot claim persistent storage.
  assert.deepEqual(save.close().cleanup, { listener: true, subscription: true })
  assert.deepEqual(load.close().cleanup, { listener: true, subscription: true })
})
