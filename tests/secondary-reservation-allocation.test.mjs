import assert from 'node:assert/strict'
import test from 'node:test'
import { syncSecondaryReservations } from '../app/scene-secondary-effects.ts'
import {
  bindTrainingPanelRequests,
  trainingPanelRequestOwner,
} from '../app/training-panel-requests.ts'

// Frozen behavior oracle: main 55770f1a, before the allocation-only change.
function reference(scene) {
  if (!scene.world.secondaryEffects) return
  const current = trainingPanelRequestOwner(scene.world)
  if (current && current !== scene.objectPanels) return
  const buildingOwners = new Set(scene.objectPanels?.buildingRecords?.keys() ?? [])
  for (const [id, panel] of scene.buildingPanels ?? [])
    if (
      !panel.hidden &&
      !scene.world.buildings.some(b => b.id === id && b.kind === 'hut' && b.progress >= 1)
    )
      buildingOwners.add(id)
  scene.world.secondaryEffects.reservations = [
    ...[...(scene.objectPanels?.panels.keys() ?? [])].map(id => `object-panel:${id}`),
    ...[...buildingOwners].map(id => `building-panel:${id}`),
    ...(scene.cursor?.visible ? ['placement-preview'] : []),
  ]
}

function fixture() {
  return {
    world: {
      secondaryEffects: { reservations: ['previous'], order: [2, 1], counter: 37 },
      buildings: [],
      turn: 81,
      randomState: 0x12345678,
    },
    objectPanels: { panels: new Map(), buildingRecords: new Map() },
    buildingPanels: new Map(),
    cursor: { visible: false },
  }
}

test('reservation arrays match the old caller for ordered duplicate and unusual IDs', () => {
  const ids = [9, -0, NaN, Infinity, -3, 4]
  for (let mask = 0; mask < 128; mask++) {
    const scene = fixture()
    scene.cursor.visible = !!(mask & 1)
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i]
      if (mask & (1 << i)) scene.objectPanels.panels.set(id, {})
      if (mask & (1 << ((i + 1) % 7))) scene.objectPanels.buildingRecords.set(id, {})
      scene.buildingPanels.set(id, { hidden: !!(mask & (1 << ((i + 2) % 7))) })
      // The qualifying duplicate may be later; NaN still cannot match ===.
      scene.world.buildings.push({ id, kind: 'camp', progress: 1 })
      scene.world.buildings.push({ id, kind: 'hut', progress: i % 2 ? 0.5 : 1 })
    }
    const expected = structuredClone(scene), before = structuredClone(scene)
    reference(expected)
    syncSecondaryReservations(scene)
    assert.deepEqual(scene, expected)
    before.world.secondaryEffects.reservations = scene.world.secondaryEffects.reservations
    assert.deepEqual(scene, before, 'only the published reservation array changes')
  }
})

test('each publication has fresh identity across spawn, hide, removal and world restore', () => {
  const scene = fixture(), original = scene.world.secondaryEffects.reservations
  syncSecondaryReservations(scene)
  const empty = scene.world.secondaryEffects.reservations
  assert.notEqual(empty, original)
  assert.deepEqual(original, ['previous'])
  scene.objectPanels.panels.set(10, {})
  scene.objectPanels.buildingRecords.set(20, {})
  scene.buildingPanels.set(20, { hidden: false })
  scene.buildingPanels.set(30, { hidden: false })
  scene.cursor.visible = true
  syncSecondaryReservations(scene)
  const active = scene.world.secondaryEffects.reservations
  assert.deepEqual(active, ['object-panel:10', 'building-panel:20', 'building-panel:30', 'placement-preview'])
  assert.deepEqual(empty, [])
  scene.objectPanels.panels.clear()
  scene.objectPanels.buildingRecords.clear()
  scene.buildingPanels.get(30).hidden = true
  scene.world.buildings = [{ id: 20, kind: 'hut', progress: 1 }]
  scene.cursor.visible = false
  syncSecondaryReservations(scene)
  assert.deepEqual(scene.world.secondaryEffects.reservations, [])
  assert.deepEqual(active, ['object-panel:10', 'building-panel:20', 'building-panel:30', 'placement-preview'])
  const retired = scene.world
  scene.world = structuredClone(retired)
  scene.world.buildings = []
  scene.buildingPanels.delete(30)
  syncSecondaryReservations(scene)
  assert.deepEqual(scene.world.secondaryEffects.reservations, ['building-panel:20'])
  assert.deepEqual(retired.secondaryEffects.reservations, [])
})

test('absent owners and replaced-Scene guards preserve reservation identity', () => {
  const scene = fixture(), previous = scene.world.secondaryEffects.reservations
  const unbind = bindTrainingPanelRequests(scene.world, { requestAutomaticTraining() {} })
  try {
    syncSecondaryReservations(scene)
    assert.equal(scene.world.secondaryEffects.reservations, previous)
  } finally {
    unbind()
  }
  delete scene.objectPanels
  delete scene.buildingPanels
  delete scene.cursor
  syncSecondaryReservations(scene)
  assert.deepEqual(scene.world.secondaryEffects.reservations, [])
  delete scene.world.secondaryEffects
  assert.doesNotThrow(() => syncSecondaryReservations(scene))
})

function observed(sync) {
  const scene = fixture(), log = [], old = scene.world.secondaryEffects
  scene.objectPanels.buildingRecords.set(8, {})
  scene.objectPanels.panels.set(4, {})
  scene.world.buildings = [{ id: 5, kind: 'hut', progress: 0 }]
  scene.buildingPanels.set(5, {
    get hidden() {
      log.push('panel:5')
      scene.world.buildings[0].progress = 1
      return false
    },
  })
  scene.buildingPanels.set(6, {
    get hidden() {
      log.push('panel:6')
      scene.world.buildings.push({ id: 6, kind: 'hut', progress: 1 })
      return false
    },
  })
  const panels = scene.objectPanels.panels
  Object.defineProperty(scene.objectPanels, 'panels', { get() {
    log.push('person-owners')
    scene.world.secondaryEffects = { reservations: ['successor'] }
    return panels
  } })
  Object.defineProperty(scene.cursor, 'visible', { get() {
    log.push('preview')
    assert.deepEqual(old.reservations, ['previous'], 'no partial publication')
    panels.set(99, {})
    return true
  } })
  sync(scene)
  return { log, old: old.reservations, successor: scene.world.secondaryEffects.reservations }
}

test('live panel getters and assignment-target capture keep their observation order', () => {
  assert.deepEqual(observed(syncSecondaryReservations), observed(reference))
  assert.deepEqual(observed(syncSecondaryReservations), {
    log: ['panel:5', 'panel:6', 'person-owners', 'preview'],
    old: ['object-panel:4', 'building-panel:8', 'placement-preview'],
    successor: ['successor'],
  })
})

function reentrant(sync) {
  const scene = fixture(), publications = []
  scene.objectPanels.panels.set(1, {})
  let current = scene.world.secondaryEffects.reservations, entered = false, nested
  Object.defineProperty(scene.world.secondaryEffects, 'reservations', {
    get: () => current,
    set(value) { publications.push(value.slice()); current = value },
  })
  Object.defineProperty(scene.cursor, 'visible', { get() {
    if (!entered) {
      entered = true
      scene.objectPanels.panels.set(2, {})
      sync(scene)
      nested = current
    }
    return !entered
  } })
  sync(scene)
  assert.notEqual(current, nested)
  assert.deepEqual(nested, ['object-panel:1', 'object-panel:2'])
  return { publications, current, nested }
}

test('reentrant calls publish independent complete arrays without corrupting the outer snapshot', () => {
  assert.deepEqual(reentrant(syncSecondaryReservations), reentrant(reference))
})

test('a throwing preview getter does not publish a partial array', () => {
  const scene = fixture(), previous = scene.world.secondaryEffects.reservations
  scene.objectPanels.panels.set(1, {})
  Object.defineProperty(scene.cursor, 'visible', { get() { throw new Error('preview interrupted') } })
  assert.throws(() => syncSecondaryReservations(scene), /preview interrupted/)
  assert.equal(scene.world.secondaryEffects.reservations, previous)
})

test('the full reservation caller no longer creates map-result temporary arrays', () => {
  const scene = fixture(), map = Array.prototype.map
  scene.objectPanels.panels.set(1, {})
  scene.objectPanels.buildingRecords.set(2, {})
  scene.cursor.visible = true
  let calls = 0
  Array.prototype.map = function (...args) { calls++; return map.apply(this, args) }
  try {
    syncSecondaryReservations(scene)
  } finally {
    Array.prototype.map = map
  }
  assert.equal(calls, 0, 'no intermediate object/building reservation map arrays')
  assert.deepEqual(scene.world.secondaryEffects.reservations, [
    'object-panel:1', 'building-panel:2', 'placement-preview',
  ])
})
