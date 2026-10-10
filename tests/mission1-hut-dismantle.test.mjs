// Composed production-caller coverage. Authored M1, opening, public model
// population, fixed turns and the shipped panel listener run. Supplied DOM,
// projection, frame deltas and in-memory Save/Load are not a browser receipt.
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { tooltipCallerFixture } from './support/tooltip-scene.mjs'
import { supplyPanelDom } from './support/camp-panel-scene.mjs'
import {
  mission1Huts,
  hutDismantleSnapshot,
  hutResidentIdentity,
} from '../scripts/local-render/mission1-hut-dismantle-snapshot.mjs'
import {
  assertHutResidentReady,
  assertHutDismantleStarted,
  assertHutTimberVisit,
  assertHutPartialCheckpoint,
  assertHutDismantleFinished,
} from '../scripts/local-render/mission1-hut-dismantle-contract.mjs'

// Supplied event token, never a claim of trusted browser input. The maintained
// observer and real store publication execute inside the same dispatch window.
function checkpointControl(handler) {
  const listeners = new Set()
  return {
    isConnected: true,
    disabled: false,
    addEventListener: (_type, listener) => listeners.add(listener),
    removeEventListener: (_type, listener) => listeners.delete(listener),
    contains: () => false,
    click() {
      const event = { isTrusted: true, target: this, eventPhase: 2 }
      try {
        for (const listener of listeners) listener(event)
        return handler()
      } finally {
        event.eventPhase = 0
      }
    },
    listenerCount: () => listeners.size,
  }
}

function pageLoad(store) {
  const source = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8'),
    start = source.indexOf('  function beginLoad(request: LoadRequest) {'),
    end = source.indexOf('\n  function restart()', start),
    noop = () => {},
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
  assert(start >= 0 && end > start)
  const body = source.slice(start, end).replace('request: LoadRequest', 'request')
  return new Function(...Object.keys(bindings), `${body}; return beginLoad;`)(
    ...Object.values(bindings)
  )
}

test('authored Hut resident reaches shipped dismantle input, partial Save/Load and exact recovery', async t => {
  const { scene, world, hut, api, frame } = await tooltipCallerFixture(t),
    { renderBuildingPanels } = await import('../app/building-panels.ts'),
    { createGameStore } = await import('../app/game-store.ts'),
    { armTempleCheckpoint } = await import('../scripts/local-render/temple-training-checkpoint.mjs')
  supplyPanelDom(t, scene)
  const create = document.createElement
  document.createElement = tag => {
    const element = create(tag),
      listeners = new Map()
    element.addEventListener = (type, listener) => listeners.set(type, listener)
    element.click = () => listeners.get('click')?.({ shiftKey: false })
    return element
  }
  const paint = () => renderBuildingPanels(scene, { complete: true, naturalWidth: 2048 })
  scene.renderBuildingPanels = paint
  const sources = mission1Huts(world)
  assert.deepEqual(
    sources.map(source => source.sourceIndex),
    [41, 42]
  )
  assert(sources.some(source => source.id === hut.id))
  assert(
    sources.every(source => source.id !== source.sourceIndex),
    'DAT index is not the live ID'
  )
  t.diagnostic(
    JSON.stringify({
      openingTurn: world.turn,
      huts: sources.map(source => ({
        ...source,
        residents: world.units.filter(unit => unit.inside === source.id).map(unit => unit.id),
      })),
    })
  )
  const residents = world.units.filter(unit => unit.inside === hut.id && unit.hp > 0)
  assert.equal(residents.length, 1, 'this slice reuses one naturally admitted resident')
  const brave = residents[0]
  world.speed = 1 // Controlled frame driver only; browser proposal uses real RAF.
  api.cancelInteraction(world)
  const ids = { targetId: hut.id, workerId: brave.id },
    snapshot = () => hutDismantleSnapshot(scene.world, { ...ids, scene })
  const baseline = snapshot()
  assertHutResidentReady(baseline)
  const unchanged = structuredClone(world)
  snapshot()
  assert.deepEqual(world, unchanged, 'snapshot must not create or alter runtime owners')
  for (let visits = 0; visits < 40 && !scene.objectPanels.buildingRecords.has(hut.id); visits++)
    frame(1 / 24)
  paint()
  const panel = scene.buildingPanels.get(hut.id)
  assert(panel && !panel.hidden, 'actual pointer dwell admits the inspection panel')
  assert.equal(panel.lastElementChild.attributes['aria-label'], 'Dismantle hut')
  const identity = hutResidentIdentity(world, brave.id),
    before = snapshot()
  panel.lastElementChild.click()
  const after = snapshot()
  assertHutDismantleStarted(before, after, identity())
  let partial,
    previous = after
  for (let turns = 0; turns < 1200; turns++) {
    frame(1 / 12)
    const current = snapshot(),
      ledger = assertHutTimberVisit(baseline, previous, current)
    previous = current
    if (ledger.remaining < 300) {
      partial = current
      break
    }
  }
  assert.equal(partial?.target.remaining, 200, 'observe the first actual 100-unit transfer')
  world.paused = true // Controlled store test supplies the public menu's paused state.
  const saved = snapshot()
  assertHutPartialCheckpoint(baseline, saved)

  // Use the actual store methods without injecting browser storage. This tests
  // synchronous publication and migration; committed IDB remains browser-only.
  const store = createGameStore()
  store.change(current => Object.assign(current, world))
  const publications = []
  const unsubscribe = store.subscribe(() =>
    publications.push(hutDismantleSnapshot(store.getWorld(), ids))
  )
  const saveButton = checkpointControl(() => store.saveCheckpoint()),
    saveBoundary = armTempleCheckpoint({
      kind: 'save',
      store,
      button: saveButton,
      snapshot: ({ world }) => hutDismantleSnapshot(world, ids),
    }),
    save = saveButton.click()
  assert.equal(publications.length, 1, 'Save publishes before its storage await')
  assert.deepEqual(publications[0], hutDismantleSnapshot(world, ids))
  assert.equal(saveBoundary.status().captured, true)
  assertHutPartialCheckpoint(baseline, saveBoundary.status().publication.target)
  assert.deepEqual(saveBoundary.status().errors, [])
  assert.equal(await save, false, 'Node has no durable IndexedDB; do not claim committed Save')
  const expectedLoad = await saveBoundary.expectedLoadDigest(),
    loadButton = checkpointControl(() => pageLoad(store)({ kind: 'checkpoint' })),
    loadBoundary = armTempleCheckpoint({
      kind: 'load',
      store,
      button: loadButton,
      snapshot: ({ world }) => hutDismantleSnapshot(world, ids),
    })
  loadButton.click()
  assert.equal(publications.length, 3, 'Page publishes Load replacement then auto-resume')
  assert.notEqual(store.getWorld(), world)
  assert.deepEqual(
    publications[1],
    publications[0],
    'partial worker/order/timber survive migration'
  )
  assert.equal(publications[2].paused, false)
  assert.equal(loadBoundary.status().captured, true)
  assertHutPartialCheckpoint(baseline, loadBoundary.status().publication.target)
  assert.deepEqual(loadBoundary.status().errors, [])
  assert.deepEqual(
    await loadBoundary.digest(),
    expectedLoad,
    'full typed production-migrated Load boundary'
  )
  for (const [observer, button] of [
    [saveBoundary, saveButton],
    [loadBoundary, loadButton],
  ]) {
    assert.deepEqual(observer.close().cleanup, { listener: true, subscription: true })
    assert.equal(button.listenerCount(), 0)
  }
  unsubscribe()

  // Finish the migrated World through the production fixed-turn caller. The old
  // scene is retained only as a supplied presentation fixture for cleanup paint.
  scene.world = store.getWorld()
  scene.world.paused = false
  previous = snapshot()
  let final
  for (let turns = 0; turns < 1600; turns++) {
    api.tick(scene.world, 1 / 12)
    const current = snapshot()
    assertHutTimberVisit(baseline, previous, current)
    previous = current
    if (!current.target && !current.worker.entry && !current.targetOrders.length) {
      scene.hoveredObject = null
      scene.objectPanels.stepBuildingInspections(false)
      paint()
      final = snapshot()
      break
    }
  }
  assert(final, 'bounded production turns must reach completion and cleanup')
  const ledger = assertHutDismantleFinished(baseline, final)
  assert.equal(ledger.carried, 100)
  assert.equal(ledger.loose, 200)
  assert.equal(new Set(ledger.droppedIds).size, 2)
  assert.deepEqual(
    assertHutDismantleFinished(baseline, { ...final, displayedWood: -999 }),
    ledger,
    'the global scenery total does not supply recovery credit'
  )

  for (const [label, alter] of [
    [
      'extra resident',
      copy => {
        copy.target.inside++
        copy.target.occupants[1] = 999
      },
    ],
    ['incoming worker', copy => copy.staff.push(999)],
    ['damaged target', copy => copy.target.hp--],
  ]) {
    const copy = structuredClone(baseline)
    alter(copy)
    assert.throws(() => assertHutResidentReady(copy), undefined, label)
  }
  for (const [label, alter] of [
    ['other harvester', copy => copy.otherTimberActors.push(999)],
    ['missing original timber', copy => copy.timber.shift()],
    [
      'lost recovered log',
      copy => {
        copy.timber = copy.timber.filter(tree => tree.id !== ledger.droppedIds[0])
      },
    ],
    [
      'wrong new scenery',
      copy => {
        copy.timber.find(tree => tree.id === ledger.droppedIds[0]).model = 1
      },
    ],
    ['retained order', copy => copy.targetOrders.push({ id: 77, model: 10, references: 1 })],
    [
      'retained panel',
      copy => {
        copy.presentation.panel = true
      },
    ],
    [
      'open menu',
      copy => {
        copy.presentation.menuOpen = true
      },
    ],
    [
      'retained reservation',
      copy => {
        copy.reservations = 1
      },
    ],
  ]) {
    const copy = structuredClone(final)
    alter(copy)
    assert.throws(() => assertHutDismantleFinished(baseline, copy), undefined, label)
  }
})
