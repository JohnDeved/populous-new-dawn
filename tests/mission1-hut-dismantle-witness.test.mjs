// Composed production-caller coverage, not browser evidence. The authored M1
// opening, natural resident, shipped panel handler, store, Scene.start and fixed
// turns execute. DOM/event trust, constructor/WebGL, disposal and RAF are supplied.
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { tooltipCallerFixture } from './support/tooltip-scene.mjs'
import { supplyPanelDom } from './support/camp-panel-scene.mjs'
import {
  assertHutResidentReady,
  assertHutPartialCheckpoint,
  assertHutDismantleFinished,
  assertHutTimberVisit,
} from '../scripts/local-render/mission1-hut-dismantle-contract.mjs'

const noop = () => {}

// Supply DOM capture/bubble ordering. isTrusted is an explicit Node token; it
// does not establish genuine browser input. Keep the actual shipped listeners.
function events(element = {}) {
  const listeners = []
  Object.assign(element, {
    isConnected: true,
    disabled: false,
    addEventListener(type, fn, options = false) {
      listeners.push({ type, fn, capture: !!(options?.capture ?? options), once: !!options?.once })
    },
    removeEventListener(type, fn, options = false) {
      const capture = !!(options?.capture ?? options)
      for (let index = listeners.length - 1; index >= 0; index--)
        if (
          listeners[index].type === type &&
          listeners[index].fn === fn &&
          listeners[index].capture === capture
        )
          listeners.splice(index, 1)
    },
    contains: () => false,
    getAttribute(name) {
      return this.attributes?.[name] ?? null
    },
    click() {
      const event = { target: this, isTrusted: true, eventPhase: 2, shiftKey: false }
      let result
      try {
        for (const capture of [true, false])
          for (const listener of [...listeners]) {
            if (listener.type !== 'click' || listener.capture !== capture) continue
            if (listener.once) this.removeEventListener('click', listener.fn, capture)
            const value = listener.fn.call(this, event)
            if (value !== undefined) result = value
          }
        return result
      } finally {
        event.eventPhase = 0
      }
    },
    listenerCount: () => listeners.length,
  })
  return element
}

function pageLoad(store) {
  const source = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8'),
    start = source.indexOf('  function beginLoad(request: LoadRequest) {'),
    end = source.indexOf('\n  function restart()', start),
    bindings = {
      store,
      cancelNearbyInput: noop,
      engine: { current: null },
      setSelectorOpen: noop,
      audio: { current: { reset: noop } },
      setMenu: noop,
      setReady: noop,
      setError: noop,
      loadRequest: { current: null },
      setTab: noop,
      setStartup: noop,
    }
  assert(start >= 0 && end > start, 'execute the shipped Page Load body')
  return new Function(
    ...Object.keys(bindings),
    `${source.slice(start, end).replace('request: LoadRequest', 'request')}; return beginLoad;`
  )(...Object.values(bindings))
}

function ownGlobal(t, name, value) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, name)
  Object.defineProperty(globalThis, name, { configurable: true, writable: true, value })
  t.after(() => {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor)
    else delete globalThis[name]
  })
}

test('Hut witness follows real input, partial Save/Load and a fresh Scene before its first RAF', async t => {
  const fixture = await tooltipCallerFixture(t),
    { scene, hut, api, frame } = fixture,
    { GameScene } = await import('../app/scene.ts'),
    { ObjectPanels } = await import('../app/object-panels.ts'),
    { renderBuildingPanels } = await import('../app/building-panels.ts'),
    { trainingPanelRequestOwner } = await import('../app/training-panel-requests.ts'),
    { createGameStore } = await import('../app/game-store.ts'),
    { hutDismantleSnapshot, mission1Huts } =
      await import('../scripts/local-render/mission1-hut-dismantle-snapshot.mjs'),
    { createHutDismantleEpoch, installHutDismantleRuntime } =
      await import('../scripts/local-render/mission1-hut-dismantle-witness.mjs')

  supplyPanelDom(t, scene)
  const create = document.createElement
  document.createElement = tag => events(create(tag))
  scene.renderBuildingPanels = () =>
    renderBuildingPanels(scene, { complete: true, naturalWidth: 2048 })
  const store = createGameStore()
  // Supplied setup binds the naturally advanced fixture graph into a real store.
  // No resident, order, admission, input lock or elapsed turn is manufactured.
  store.change(world => Object.assign(world, fixture.world))
  scene.world = store.getWorld()
  scene.presentationBinding = store.bindPresentation(scene.world)
  scene.world.speed = 1 // Supplied Node frame cadence, not the browser acceptance.
  const world = scene.world,
    residents = world.units.filter(unit => unit.hp > 0 && unit.inside === hut.id)
  assert.equal(residents.length, 1)
  assert.equal(mission1Huts(world).find(item => item.id === hut.id)?.sourceIndex, 42)
  const worker = residents[0],
    ids = { targetId: hut.id, workerId: worker.id },
    snapshot = () => hutDismantleSnapshot(store.getWorld(), { ...ids, scene })
  assertHutResidentReady(snapshot())
  for (let visits = 0; visits < 40 && !scene.objectPanels.buildingRecords.has(hut.id); visits++)
    frame(1 / 24)
  scene.renderBuildingPanels()
  const control = scene.buildingPanels.get(hut.id)?.lastElementChild
  assert.equal(control?.getAttribute('aria-label'), 'Dismantle hut')
  assert.equal(scene.buildingPanels.get(hut.id).hidden, false)
  assertHutResidentReady(snapshot())

  let originalCalls = 0
  const originalAfter = function () {
    originalCalls++
    return 'original afterTurn'
  }
  scene.gameClock.afterTurn = originalAfter // Supplied presentation callback, real turn caller.
  const beforeDescriptor = Object.getOwnPropertyDescriptor(scene.gameClock, 'afterTurn'),
    prototypeDescriptor = Object.getOwnPropertyDescriptor(GameScene.prototype, 'start'),
    ref = { current: scene },
    saveButton = events({ textContent: 'Save checkpoint' }),
    loadButton = events({ textContent: 'Load checkpoint' }),
    controls = { querySelectorAll: () => [saveButton, loadButton] }

  await t.test('input cleanup uses captured methods and preserves foreign replacements', () => {
    const epoch = createHutDismantleEpoch({ scene, store, ids, record: noop }),
      remove = control.removeEventListener,
      count = control.listenerCount(),
      foreignRemove = () => {
        throw Error('foreign remover must never run')
      },
      foreignTurn = () => 'foreign afterTurn'
    epoch.armInput(control)
    control.removeEventListener = foreignRemove
    scene.gameClock.afterTurn = foreignTurn
    try {
      const closed = epoch.close()
      assert.equal(control.listenerCount(), count)
      assert.equal(control.removeEventListener, foreignRemove)
      assert.equal(scene.gameClock.afterTurn, foreignTurn)
      assert.match(closed.errors.join(), /Foreign afterTurn replacement preserved/)
      assert.doesNotMatch(closed.errors.join(), /foreign remover must never run/)
    } finally {
      control.removeEventListener = remove
      Object.defineProperty(scene.gameClock, 'afterTurn', beforeDescriptor)
    }
  })

  await t.test(
    'a failing capture cleanup still removes bubble input and restores the clock',
    () => {
      const remove = control.removeEventListener,
        count = control.listenerCount(),
        attempts = []
      control.removeEventListener = function (type, listener, capture) {
        assert.equal(this, control)
        attempts.push(capture)
        remove.call(this, type, listener, capture)
        if (capture) throw Error('injected capture removal failure')
      }
      const epoch = createHutDismantleEpoch({ scene, store, ids, record: noop })
      try {
        epoch.armInput(control)
        const closed = epoch.close()
        assert.deepEqual(attempts, [true, false])
        assert.match(closed.errors.join(), /injected capture removal failure/)
        assert.equal(control.listenerCount(), count)
        assert.deepEqual(
          Object.getOwnPropertyDescriptor(scene.gameClock, 'afterTurn'),
          beforeDescriptor
        )
      } finally {
        control.removeEventListener = remove
        epoch.close()
      }
    }
  )

  await t.test('partial input installation removes both attempted listeners', () => {
    const add = control.addEventListener,
      count = control.listenerCount()
    control.addEventListener = function (type, listener, capture) {
      assert.equal(this, control)
      add.call(this, type, listener, capture)
      if (!capture) throw Error('injected bubble installation failure')
    }
    const epoch = createHutDismantleEpoch({ scene, store, ids, record: noop })
    try {
      assert.throws(() => epoch.armInput(control), /injected bubble installation failure/)
      assert.equal(control.listenerCount(), count)
    } finally {
      control.addEventListener = add
      epoch.close()
    }
    assert.deepEqual(
      Object.getOwnPropertyDescriptor(scene.gameClock, 'afterTurn'),
      beforeDescriptor
    )
  })

  saveButton.addEventListener('click', () => store.saveCheckpoint())
  loadButton.addEventListener('click', () => pageLoad(store)({ kind: 'checkpoint' }))
  const install = maxEvents =>
    installHutDismantleRuntime({
      scene,
      store,
      ids,
      prototype: GameScene.prototype,
      sceneRef: () => ref,
      doc: controls,
      maxEvents,
    })
  const runtime = install(16),
    capped = install(1)
  let injected = null
  t.after(() => {
    injected?.close()
    capped.close()
    runtime.close()
  })
  const pristine = structuredClone(world)
  capped.status()
  runtime.snapshot()
  assert.deepEqual(world, pristine, 'passive observation leaves the World unchanged')
  const listenerCount = control.listenerCount()
  runtime.armInput()
  capped.armInput()
  assert.equal(control.listenerCount(), listenerCount + 4)
  assert.doesNotThrow(() => control.click(), 'observer cap cannot interrupt the shipped click')
  assert.equal(runtime.input().sameResidentPerson, true)
  assert.equal(runtime.input().before.turn, runtime.input().after.turn)
  assert.equal(worker.entry.person, world.objectCells.objects.get(worker.id))
  assert.equal(worker.entry.orders, world.buildingOrders)
  assert.equal(capped.status().overflow, false)

  const capturedInput = runtime.input(),
    baseline = capturedInput.before
  let injectedCalls = 0
  injected = createHutDismantleEpoch({
    scene,
    store,
    ids,
    baseline,
    record() {
      injectedCalls++
      throw Error('injected record failure')
    },
  })
  const initialTurn = world.turn
  for (
    let callbacks = 0;
    callbacks < 400 && runtime.snapshot().target.remaining === 300;
    callbacks++
  )
    assert.doesNotThrow(() => frame(1 / 4), 'multiple real fixed turns run despite observer errors')
  assert.equal(runtime.snapshot().target.remaining, 200)
  assert(injectedCalls > 0, 'fault is injected at an actual meaningful work event')
  assert.match(injected.status().errors.join(), /injected record failure/)
  assert.doesNotThrow(() => frame(1 / 4))
  const observedTurns = world.turn - initialTurn
  const injectedStatus = injected.status()
  assert.throws(() => injected.finish(), /preserves prior observation errors/)
  injected.close()
  const cappedStatus = capped.status()
  assert.throws(
    () => capped.finish(),
    /preserves prior observer\/checkpoint\/start errors or overflow/
  )
  const cappedResult = capped.close()
  const runtimeStatus = runtime.status().current
  for (const status of [runtimeStatus, cappedStatus.current, injectedStatus]) {
    assert.equal(
      status.visits.count,
      observedTurns,
      'every fixed turn is counted even past the event cap'
    )
    assert.equal(status.visits.first, initialTurn + 1)
    assert.equal(status.visits.last, world.turn)
  }
  assert(
    observedTurns > cappedResult.events.length,
    'turn accounting is independent of the meaningful event budget'
  )
  assert.equal(originalCalls, observedTurns)
  assert.deepEqual(runtimeStatus.errors, [])
  assert.equal(cappedStatus.overflow, true)
  assert.match(cappedStatus.current.errors.join(), /capacity exceeded/)
  assert.doesNotMatch(cappedStatus.current.errors.join(), /unobserved simulation turns/)
  assert.doesNotMatch(injectedStatus.errors.join(), /unobserved simulation turns/)
  assert.equal(cappedResult.events.length, 1)
  assert.equal(control.listenerCount(), listenerCount + 2)

  world.paused = true // Supplied public-menu pause state; real Save handler follows.
  const partial = runtime.snapshot()
  assertHutPartialCheckpoint(baseline, partial)
  const publications = [],
    unsubscribe = store.subscribe(() => {
      publications.push(hutDismantleSnapshot(store.getWorld(), ids))
    })
  t.after(unsubscribe)
  runtime.armSave()
  const saving = saveButton.click()
  assert.equal(publications.length, 1, 'Save publication occurs inside click dispatch')
  const saved = await runtime.saved()
  assert.equal(saved.status.captured, true)
  assert.deepEqual(saved.status.errors, [])
  assertHutPartialCheckpoint(baseline, saved.status.publication.target)
  assert.equal(await saving, false, 'Node has no durable IDB; this is an in-session Save receipt')
  const savedWorker = world.units.find(unit => unit.id === ids.workerId),
    savedPerson = savedWorker.entry.person,
    savedOrderId = partial.worker.orderId,
    savedOrders = world.buildingOrders
  runtime.armLoad()
  loadButton.click()
  assert.equal(publications.length, 3, 'actual Page Load publishes replacement then resume')
  const loadedWorld = store.getWorld()
  assert.notEqual(loadedWorld, world)
  assert.equal(scene.world, world, 'the old Scene is never rebound to the replacement World')
  assert.equal(scene.isCurrent(), false, 'real store replacement invalidates the old binding')
  assert.equal(runtime.status().epochs, 1, 'attachment waits for an actual new Scene.start')
  assert.deepEqual(publications[1], publications[0])
  assert.equal(publications[1].paused, true)
  assert.equal(publications[2].paused, false)

  // New receiver with supplied constructor/WebGL/DOM/RAF boundaries. Execute
  // actual GameScene.prototype.start and its training-owner/input registration.
  // The callback supplies frame duration while calling actual advanceGame.
  const queued = [],
    inputListeners = [],
    originalNewCalls = [],
    newAfter = () => originalNewCalls.push(loadedWorld.turn),
    next = Object.assign(Object.create(GameScene.prototype), {
      world: loadedWorld,
      disposed: false,
      started: false,
      presentationBinding: store.bindPresentation(loadedWorld),
      terrainLoad: new AbortController(),
      container: { ...scene.container },
      renderer: {
        domElement: events({
          getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
        }),
      },
      mini: events(),
      buildingPanels: new Map(),
      hoveredObject: null,
      overviewActive: false,
      overviewStage: 0,
      tooltip: fixture.tooltipApi.createTooltip(),
      gameClock: { animationTime: 0, animationFrame: 0, afterTurn: newAfter },
      drawMinimap: noop,
      listen: (...args) => inputListeners.push(args),
      visible: () => true,
      screen: () => ({ x: 0, y: 0, z: 0 }),
      onChange: noop,
      onSound: noop,
    })
  next.objectPanels = new ObjectPanels(next)
  next.renderBuildingPanels = () =>
    renderBuildingPanels(next, { complete: true, naturalWidth: 2048 })
  let firstRaf = true,
    rafCount = 0
  next.animate = () => {
    if (!next.isCurrent()) return
    if (firstRaf) {
      assert.equal(runtime.status().epochs, 2)
      assert.equal(runtime.status().start.attached, true)
      assert.equal(runtime.status().current.visits.count, 0)
      firstRaf = false
    }
    rafCount++
    api.advanceGame(next.world, next.gameClock, 1 / 4)
    next.objectPanels.stepBuildingInspections(false)
    next.renderBuildingPanels()
    requestAnimationFrame(next.animate)
  }
  ownGlobal(t, 'window', {})
  // tooltipCallerFixture already owns restoration of the original global RAF.
  globalThis.requestAnimationFrame = callback => {
    queued.push(callback)
    return queued.length
  }
  // Supplied disposal boundary; old binding was already invalidated by the real store.
  scene.disposed = true
  scene.presentationBinding.release()
  ref.current = next
  const beforeStart = structuredClone(loadedWorld)
  assert.equal(next.start(), true)
  assert.equal(queued.length, 1)
  assert.equal(rafCount, 0, 'real start schedules but does not execute the first RAF')
  assert.equal(next.started, true)
  assert.equal(next.isCurrent(), true)
  assert.equal(trainingPanelRequestOwner(loadedWorld), next.objectPanels)
  assert.notEqual(next.objectPanels, scene.objectPanels)
  assert.notEqual(next.buildingPanels, scene.buildingPanels)
  assert(inputListeners.some(([, name]) => name === 'pointerdown'))
  assert.deepEqual(
    loadedWorld,
    beforeStart,
    'start and observer attach do not advance or rewrite World'
  )
  assert.equal(runtime.status().oldDisposed, true)
  assert.equal(runtime.status().start.attached, true)
  assert.equal(runtime.status().start.restored, true)
  assert.deepEqual(runtime.status().start.errors, [])
  assert.deepEqual(
    Object.getOwnPropertyDescriptor(GameScene.prototype, 'start'),
    prototypeDescriptor
  )
  assert.deepEqual(Object.getOwnPropertyDescriptor(scene.gameClock, 'afterTurn'), beforeDescriptor)
  assert.equal(control.listenerCount(), listenerCount, 'old epoch detaches its input listeners')
  t.after(() => {
    next.releaseTrainingPanelRequests?.()
    next.presentationBinding.release()
  })

  const loaded = await runtime.loaded(),
    loadedWorker = loadedWorld.units.find(unit => unit.id === ids.workerId)
  assert.equal(loaded.status.captured, true)
  assert.deepEqual(loaded.status.errors, [])
  assert.deepEqual(
    loaded.digest,
    saved.expectedLoad,
    'full typed migrated boundary, not only target fields'
  )
  assert.equal(loaded.initial.turn, partial.turn)
  assert.equal(loaded.initial.paused, false)
  assert.equal(loaded.initial.worker.orderId, savedOrderId)
  assert.deepEqual(loaded.initial.worker, partial.worker)
  assert.deepEqual(loaded.initial.target, partial.target)
  assert.notEqual(loadedWorker, savedWorker)
  assert.notEqual(loadedWorker.entry.person, savedPerson)
  assert.notEqual(loadedWorld.buildingOrders, savedOrders)
  assert.equal(loadedWorker.entry.person, loadedWorld.objectCells.objects.get(ids.workerId))
  assert.equal(loadedWorker.entry.orders, loadedWorld.buildingOrders)
  assert.equal(loadedWorld.buildingFootprints instanceof Map, true)
  assert.equal(loadedWorld.objectCells.objects instanceof Map, true)
  assert.equal(ArrayBuffer.isView(loadedWorld.land.flags), true)
  await t.test('early finish rejects partial work without detaching either owner', () => {
    const attached = next.gameClock.afterTurn,
      before = runtime.status().current
    assert.throws(() => runtime.finish())
    assert.equal(next.gameClock.afterTurn, attached)
    assert.deepEqual(runtime.status().current, before)
    assert.equal(runtime.status().current.closed, false)
    const epoch = createHutDismantleEpoch({ scene: next, store, ids, baseline, record: noop }),
      wrapped = next.gameClock.afterTurn
    try {
      assert.throws(() => epoch.finish())
      assert.equal(next.gameClock.afterTurn, wrapped)
      assert.equal(epoch.status().closed, false)
      assert.deepEqual(epoch.status().errors, [])
    } finally {
      assert.deepEqual(epoch.close().errors, [])
    }
    assert.equal(next.gameClock.afterTurn, attached)
  })

  const newInitialTurn = loadedWorld.turn
  queued.shift()()
  assert(loadedWorld.turn - newInitialTurn > 1, 'one supplied RAF contains multiple fixed turns')
  const oldTurn = world.turn
  frame(1 / 4)
  assert.equal(world.turn, oldTurn, 'a stale old Scene callback cannot advance its former World')
  assert.equal(originalCalls, observedTurns)
  assert.equal(queued.length, 1)
  for (let callbacks = 0; callbacks < 600; callbacks++) {
    const state = runtime.snapshot()
    if (!state.target && !state.worker.entry && !state.targetOrders.length) break
    assert.equal(queued.length, 1)
    queued.shift()()
  }
  const final = runtime.snapshot(),
    ledger = assertHutDismantleFinished(baseline, final)
  assert.deepEqual({ carried: ledger.carried, loose: ledger.loose }, { carried: 100, loose: 200 })
  assert.equal(new Set(ledger.droppedIds).size, 2)
  assert.equal(runtime.status().current.visits.count, loadedWorld.turn - newInitialTurn)
  assert.equal(originalNewCalls.length, loadedWorld.turn - newInitialTurn)
  assert.deepEqual(
    originalNewCalls,
    Array.from({ length: originalNewCalls.length }, (_, i) => newInitialTurn + i + 1)
  )
  assert.deepEqual(runtime.status().current.errors, [])

  const rejectedEpochs = []
  for (const fault of ['foreign callback', 'captured observer failure'])
    await t.test(`finish rejects ${fault} even when the actual endpoint is valid`, () => {
      const localClock = { animationTime: 0, animationFrame: 0, afterTurn: noop },
        receiver = Object.assign(Object.create(GameScene.prototype), next, {
          gameClock: localClock,
        }),
        epoch = createHutDismantleEpoch({
          scene: receiver,
          store,
          ids,
          baseline,
          record: noop,
        }),
        foreign = () => 'foreign callback'
      assertHutDismantleFinished(baseline, epoch.snapshot())
      try {
        if (fault === 'foreign callback') localClock.afterTurn = foreign
        else {
          assert.doesNotThrow(() => localClock.afterTurn())
          assert.match(epoch.status().errors.join(), /Skipped or duplicate/)
        }
        assert.throws(() => epoch.finish())
        if (fault === 'foreign callback') assert.equal(localClock.afterTurn, foreign)
      } finally {
        const closed = epoch.close()
        assert.match(
          closed.errors.join(),
          fault === 'foreign callback' ? /ownership|Foreign afterTurn/ : /Skipped or duplicate/
        )
        assert.equal(localClock.afterTurn, fault === 'foreign callback' ? foreign : noop)
        rejectedEpochs.push({ epoch, closed })
      }
      assert.deepEqual(runtime.status().current.errors, [])
    })

  const finishVisits = runtime.status().current.visits,
    finished = runtime.finish()
  assert.deepEqual(finished, { final, recovery: ledger, turn: final.turn })
  assert.equal(next.gameClock.afterTurn, newAfter, 'finish synchronously detaches the observer')
  assert.equal(runtime.status().current.closed, true)

  // Continue ordinary gameplay through the same follower's native resting caller.
  // This observed Node turn is not the unrecorded drop turn in a browser attempt.
  let restingDrop = null
  for (let turns = 0; turns < 120; turns++) {
    const before = hutDismantleSnapshot(loadedWorld, { ...ids, scene: next }),
      nativeBefore = loadedWorker.native && {
        state: loadedWorker.native.state,
        substate: loadedWorker.native.substate,
        cargo: loadedWorker.native.cargo,
      }
    assert.doesNotThrow(() => api.advanceGame(loadedWorld, next.gameClock, 1 / 12))
    const current = hutDismantleSnapshot(loadedWorld, { ...ids, scene: next })
    assert.equal(current.turn, before.turn + 1)
    assert.equal(
      loadedWorld.units.find(unit => unit.id === ids.workerId),
      loadedWorker
    )
    if (current.worker.cargo === 0) {
      restingDrop = {
        before,
        current,
        nativeBefore,
        nativeAfter: {
          state: loadedWorker.native.state,
          substate: loadedWorker.native.substate,
          cargo: loadedWorker.native.cargo,
        },
      }
      break
    }
  }
  assert(restingDrop, 'actual resting turns must release the final carried 100 units')
  assert.equal(restingDrop.nativeBefore.state, 19)
  assert.equal(restingDrop.nativeBefore.cargo, 100)
  assert.equal(restingDrop.nativeAfter.cargo, 0)
  assert.equal(restingDrop.before.worker.order, null)
  const restingLedger = assertHutDismantleFinished(baseline, restingDrop.current)
  assert.deepEqual(
    { carried: restingLedger.carried, loose: restingLedger.loose },
    { carried: 0, loose: 300 }
  )
  assert.equal(new Set(restingLedger.droppedIds).size, 3)
  assert.deepEqual(
    restingLedger.droppedIds.filter(id => !ledger.droppedIds.includes(id)),
    restingDrop.current.timber
      .filter(tree => !final.timber.some(previous => previous.id === tree.id))
      .map(tree => tree.id)
  )
  assert.throws(
    () => assertHutTimberVisit(baseline, restingDrop.before, restingDrop.current),
    /undefined !== 10/,
    'the command-10 drop ownership contract remains strict outside the completed episode'
  )
  assert.deepEqual(finished, { final, recovery: ledger, turn: final.turn })
  assert.deepEqual(runtime.status().current.visits, finishVisits)
  assert.deepEqual(runtime.status().current.errors, [])
  assert.equal(originalNewCalls.length, loadedWorld.turn - newInitialTurn)
  assert.equal(originalNewCalls.at(-1), restingDrop.current.turn)
  assert(originalNewCalls.length > finishVisits.count, 'the original afterTurn still runs')
  t.diagnostic(
    JSON.stringify({
      evidence: 'Node actual advanceGame after successful finish; not browser timing',
      finishedTurn: final.turn,
      restingDropTurn: restingDrop.current.turn,
      nativeBefore: restingDrop.nativeBefore,
      nativeAfter: restingDrop.nativeAfter,
      recoveredLogIds: restingLedger.droppedIds,
    })
  )
  for (const { epoch, closed } of rejectedEpochs)
    assert.deepEqual(epoch.close(), closed, 'later cleanup preserves captured failure and snapshot')

  const result = runtime.close()
  assert.deepEqual(result.errors, [])
  assert.equal(result.epochs.length, 2)
  assert.deepEqual(result.epochs[1].final, final, 'cleanup retains the exact finished snapshot')
  assert.deepEqual(result.epochs[1].visits, finishVisits)
  assert.deepEqual(
    result.epochs[0].input,
    capturedInput,
    'close retains synchronous input evidence'
  )
  assert.deepEqual(result.epochs[0].baseline, baseline)
  assert.deepEqual(
    result.epochs[1].baseline,
    baseline,
    'close retains the pre-Load ledger baseline'
  )
  assert.equal(result.epochs[1].input, null, 'Load does not fabricate another Dismantle click')
  assert.equal(result.oldDisposed, true)
  assert.equal(result.start.calls, 1)
  assert.equal(result.start.attached, true)
  assert.equal(result.start.restored, true)
  assert.deepEqual(result.start.errors, [])
  assert(result.events.length < 16)
  assert(result.epochs.reduce((sum, epoch) => sum + epoch.visits.count, 0) > result.events.length)
  assert.equal(result.events.filter(event => event.kind === 'input').length, 1)
  assert.equal(result.events.filter(event => event.transferred === 100).length, 3)
  assert.deepEqual(
    result.events.flatMap(event => event.dropped ?? []),
    ledger.droppedIds
  )
  assert.equal(next.gameClock.afterTurn, newAfter)
  for (const status of Object.values(result.boundaries))
    assert.deepEqual(status.cleanup, { listener: true, subscription: true })
  assert.equal(saveButton.listenerCount(), 1, 'shipped Save listener remains')
  assert.equal(loadButton.listenerCount(), 1, 'shipped Load listener remains')

  await t.test(
    'skipped and duplicate fixed-turn observations are rejected without breaking their caller',
    () => {
      // Explicit fault injection bypasses the observed clock with real model turns;
      // it does not write turn, pendingTime or any worker/building field.
      const epoch = createHutDismantleEpoch({ scene: next, store, ids, record: noop })
      try {
        assert.doesNotThrow(() => next.gameClock.afterTurn())
        assert.match(epoch.status().errors.join(), /Skipped or duplicate/)
        assert.equal(epoch.status().visits.count, 0)
        api.tick(loadedWorld, 2 / 12)
        assert.doesNotThrow(() => next.gameClock.afterTurn())
        const rejected = epoch.status()
        assert.equal(rejected.errors.filter(error => /Skipped or duplicate/.test(error)).length, 2)
        assert.match(rejected.errors.join(), /missed a visit/)
        assert.equal(rejected.visits.count, 0)
      } finally {
        epoch.close()
      }
      assert.equal(next.gameClock.afterTurn, newAfter)
    }
  )

  await t.test('cleanup restores inherited callbacks and preserves a foreign replacement', () => {
    const inherited = { afterTurn: noop },
      localClock = Object.assign(Object.create(inherited), {
        animationTime: 0,
        animationFrame: 0,
      }),
      receiver = Object.assign(Object.create(GameScene.prototype), next, { gameClock: localClock }),
      epoch = createHutDismantleEpoch({ scene: receiver, store, ids, record: noop })
    assert.equal(Object.hasOwn(localClock, 'afterTurn'), true)
    epoch.close()
    assert.equal(Object.hasOwn(localClock, 'afterTurn'), false)
    assert.equal(localClock.afterTurn, inherited.afterTurn)
    const foreignEpoch = createHutDismantleEpoch({ scene: receiver, store, ids, record: noop }),
      foreign = () => 'foreign callback'
    localClock.afterTurn = foreign
    const closed = foreignEpoch.close()
    assert.equal(localClock.afterTurn, foreign)
    assert.match(closed.errors.join(), /Foreign afterTurn replacement preserved/)
    foreignEpoch.close()
    assert.equal(localClock.afterTurn, foreign)
  })
})
