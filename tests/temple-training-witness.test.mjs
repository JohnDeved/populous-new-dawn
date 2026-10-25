import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, addBuilding, addUnit } from '../app/model.ts'
import { command } from '../app/live-command.ts'
import { buildingAdmission, stepLiveTraining } from '../app/live-building-entry.ts'
import { bindTrainingPanelRequests } from '../app/training-panel-requests.ts'
import { stepPersonPanel } from '../app/person-panel.ts'
import { createTempleTrainingEpoch } from '../scripts/local-render/temple-training-witness.mjs'
import {
  assertTempleTrainInput,
  assertTempleFreshRequest,
  assertTempleLifecycle,
} from '../scripts/local-render/temple-training-contract.mjs'

// Controlled supporting composition: real command/adoptLiveOrders, training
// conversion and panel time producer. Geometry, trusted events, admission and
// the future Temple consumer/DOM are supplied. This is not ordinary-game proof.
class Events {
  listeners = []
  addEventListener(type, fn, capture = false) {
    this.listeners.push({ type, fn, capture })
  }
  removeEventListener(type, fn, capture = false) {
    this.listeners = this.listeners.filter(
      r => r.type !== type || r.fn !== fn || r.capture !== capture
    )
  }
  fire(type, args = {}) {
    const event = {
      type,
      target: this,
      isTrusted: true,
      button: 0,
      buttons: type === 'pointerdown' ? 1 : 0,
      clientX: 800,
      clientY: 400,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      ...args,
    }
    for (const capture of [true, false])
      for (const r of [...this.listeners]) if (r.type === type && r.capture === capture) r.fn(event)
  }
}
function fixture({ request, maxRecords } = {}) {
  const world = createWorld(3),
    canvas = new Events(),
    doc = new Events(),
    hud = {}
  const temple = addBuilding(world, 'blue', 'temple', { x: 24, z: 70 }, true)
  const brave = addUnit(world, 'blue', 'brave', { x: 26, z: 71 })
  const admission = buildingAdmission(world, temple)
  Object.assign(world, {
    turn: 100,
    paused: false,
    status: 'playing',
    selected: [brave.id],
    inputMask: 0,
    unlockedTemple: true,
  })
  doc.activeElement = null
  doc.elementFromPoint = x => (x < 200 ? hud : canvas)
  const panels = new Map(),
    buildingRecords = new Map(),
    automaticTrainingLatches = new Set()
  const scene = {
    world,
    renderer: { domElement: canvas },
    frame: 1,
    pointerScreen: { clientX: 20, clientY: 975 },
    hoveredObject: null,
    buildingPanels: panels,
    isCurrent: () => true,
    gameClock: {
      animationFrame: 1,
      afterTurn() {
        return 'after-turn'
      },
    },
    dispose() {
      buildingRecords.clear()
      automaticTrainingLatches.clear()
      panels.clear()
      world.secondaryEffects.reservations = []
      return 'disposed'
    },
    objectPanels: {
      buildingRecords,
      automaticTrainingLatches,
      requestAutomaticTraining:
        request ??
        function (id) {
          assert.equal(this, scene.objectPanels)
          assert.equal(id, temple.id)
          if (automaticTrainingLatches.has(id)) return 'automatic:latched'
          buildingRecords.set(id, { automatic: true, phase: -1, remaining: 0, hold: 16 })
          automaticTrainingLatches.add(id)
          world.secondaryEffects.reservations.push(`building-panel:${id}`)
          return 'automatic:created'
        },
      stepBuildingInspections() {
        const record = buildingRecords.get(temple.id)
        if (!record) return 'step'
        const active = !!(admission.activity & 128)
        if (record.phase === 1 && !active) {
          record.remaining = 0
          automaticTrainingLatches.delete(temple.id)
        }
        if (!stepPersonPanel(record, active)) {
          buildingRecords.delete(temple.id)
          automaticTrainingLatches.delete(temple.id)
          panels.delete(temple.id)
          world.secondaryEffects.reservations = []
        } else panels.set(temple.id, { hidden: false, contains: () => false, matches: () => false })
        return 'step'
      },
    },
  }
  const store = { getWorld: () => world },
    release = bindTrainingPanelRequests(world, scene.objectPanels)
  canvas.addEventListener('pointerup', () => assert.equal(command(world, temple), true))
  const epoch = createTempleTrainingEpoch({
    scene,
    store,
    targetId: temple.id,
    epoch: 1,
    doc,
    maxRecords,
  })
  epoch.armInput(brave.id)
  canvas.fire('pointerdown')
  canvas.fire('pointerup')
  const input = epoch.finishInput()
  const person = brave.entry.person
  Object.assign(admission, {
    activity: admission.activity | 128,
    inside: 1,
    trainingCost: 3500,
    storedMana: 0,
  })
  admission.occupants[0] = brave.id
  brave.inside = temple.id
  person.flags2 |= 0x800000
  const step = () => {
    world.turn++
    scene.gameClock.animationFrame++
    return scene.objectPanels.stepBuildingInspections()
  }
  return {
    world,
    temple,
    brave,
    admission,
    person,
    scene,
    doc,
    canvas,
    epoch,
    input,
    step,
    release,
  }
}
function complete(f) {
  // Start a fresh supporting epoch from the active state, as the Load attachment
  // does before the first frontend step. The earlier real input stays detached.
  f.epoch.close()
  f.scene.pointerScreen = null // A real newly constructed Scene has no pointer sample.
  f.epoch = createTempleTrainingEpoch({
    scene: f.scene,
    store: { getWorld: () => f.world },
    targetId: f.temple.id,
    epoch: 2,
    doc: f.doc,
  })
  f.epoch.setTrainee(f.brave.id)
  assert.equal(f.epoch.status().current.offTarget, false)
  f.doc.fire('pointermove', { clientX: 20, clientY: 975 })
  assert.equal(f.epoch.status().current.offTarget, true)
  stepLiveTraining(f.world, f.temple)
  for (let n = 0; n < 8; n++) f.step()
  f.admission.storedMana = 3500
  f.temple.timer = 3500 // Public live adapter restores stored mana from the building timer.
  f.world.turn++
  stepLiveTraining(f.world, f.temple)
  f.scene.gameClock.afterTurn()
  for (let n = 0; n < 5; n++) f.step()
  const result = f.epoch.close()
  f.release()
  return result
}
const options = f => ({
  targetId: f.temple.id,
  traineeId: f.brave.id,
  initialPreachers: [],
  initialTrained: 0,
})

test('actual command uses entry.person; snapshots detach before host reads, with bounded fresh-epoch status', () => {
  const f = fixture()
  try {
    const accepted = assertTempleTrainInput(f.input, f.temple.id, f.brave.id)
    assert.equal(f.brave.native, null)
    assert.equal(f.brave.entry.orders, f.world.buildingOrders)
    assert.equal(accepted.orderId, f.brave.entry.person.commands[0])
    const copied = structuredClone(f.input)
    f.person.commands[0] = 0
    assert.deepEqual(f.input, copied)
    const status = f.epoch.status()
    assert.equal(status.count, 0)
    assert(!Object.hasOwn(status, 'records'))
    assert.equal(
      f.canvas.listeners.length,
      1,
      'Only supplied game listener remains after pointer cleanup'
    )
  } finally {
    f.epoch.close()
    f.release()
  }
})

test('real training callback precedes real Preacher replacement, full panel progression and release', () => {
  const f = fixture(),
    result = complete(f)
  const accepted = assertTempleLifecycle(result, options(f))
  assert.equal(accepted.trained, 1)
  assert.notEqual(accepted.replacementId, f.brave.id)
  assert.equal(result.final.preachers[0].kind, 'preacher')
  assert.equal(result.records.filter(r => r.kind === 'request').length, 2)
  assert.equal(result.records.filter(r => r.kind === 'turn').length, 1)
  assert.equal(f.doc.listeners.length, 0)
  assert.throws(() => f.epoch.close(), /already collected/)
})

test('initial active epoch can close only after actual disposal for the Load boundary', () => {
  const f = fixture()
  stepLiveTraining(f.world, f.temple)
  for (let n = 0; n < 8; n++) f.step()
  assert.equal(f.scene.dispose(), 'disposed')
  const result = f.epoch.close()
  f.release()
  assert.equal(assertTempleLifecycle(result, { ...options(f), complete: false }).heldVisits, 4)
  const wrong = structuredClone(result)
  wrong.disposed = false
  assert.throws(() => assertTempleLifecycle(wrong, { ...options(f), complete: false }))
})

test('request original result/throw identity and receivers are preserved', () => {
  const failure = { original: 'throw' }
  const f = fixture({
    request: function (id) {
      assert.equal(this, f.scene.objectPanels)
      assert.equal(id, f.temple.id)
      throw failure
    },
  })
  assert.throws(
    () => f.scene.objectPanels.requestAutomaticTraining(f.temple.id),
    value => value === failure
  )
  const result = f.epoch.close()
  f.release()
  const row = result.records.find(r => r.kind === 'request')
  assert.equal(row.threw, true)
  assert.equal(row.receiverMatches, true)
  assert.deepEqual(result.errors, [])
})

test('foreign method replacement is preserved; other wrappers and listeners still restore', () => {
  const f = fixture(),
    foreign = () => 'foreign'
  f.scene.objectPanels.stepBuildingInspections = foreign
  const result = f.epoch.close()
  f.release()
  assert.match(result.errors.join(), /Foreign replacement/)
  assert.equal(f.scene.objectPanels.stepBuildingInspections, foreign)
  assert.equal(f.doc.listeners.length, 0)
  assert.equal(f.scene.gameClock.afterTurn(), 'after-turn')
})

test('record overflow is an explicit incomplete-evidence failure', () => {
  const f = fixture({ maxRecords: 1 })
  f.step()
  f.step()
  assert.equal(f.epoch.status().overflow, true)
  const result = f.epoch.close()
  f.release()
  assert.equal(result.records.length, 1)
  assert.match(result.errors.join(), /evidence incomplete/)
  assert.throws(() => assertTempleLifecycle(result, options(f)))
})

test('direct lifecycle negatives reject unrelated conversion, replaced owners, bad sequence and leaks', async t => {
  const f = fixture(),
    good = complete(f),
    opts = options(f)
  const mutations = {
    'loaded activity missing': r => {
      r.initial.target.admission.activity &= ~128
    },
    'loaded hidden cache leak': r => {
      r.initial.dom = { present: true, hidden: true, focused: false, hovered: false }
    },
    'final hidden cache leak': r => {
      r.final.dom = { present: true, hidden: true, focused: false, hovered: false }
    },
    'loaded transient owner': r => {
      r.initial.latch = true
    },
    'worker still exiting': r => {
      r.final.target.workers.push(opts.traineeId)
    },
    'wrong trainee': r => {
      r.records.find(x => x.kind === 'request').before.trainee.id++
    },
    'unrelated occupant': r => {
      r.records.find(x => x.kind === 'request').before.target.admission.occupants[0]++
    },
    'missing request': r => {
      r.records = r.records.filter(x => x.kind !== 'request')
    },
    'premature record': r => {
      const x = r.records.find(x => x.kind === 'request')
      x.before.record = x.after.record
    },
    'replaced record': r => {
      r.records.find(x => x.kind === 'step').after.record.identity++
    },
    'bad remaining': r => {
      r.records.find(x => x.kind === 'step').after.record.remaining++
    },
    'bad phase': r => {
      r.records.find(x => x.kind === 'step').after.record.phase++
    },
    'entry transition plus only three held visits': r => {
      r.records.find(x => x.kind === 'step' && x.before.record?.phase === 1).after.offTarget = false
    },
    'no held visits': r => {
      for (const x of r.records) if (x.kind === 'step') x.after.offTarget = false
    },
    'reservation leak': r => {
      r.final.reservations = 1
    },
    'latch leak': r => {
      r.final.latch = true
    },
    'DOM leak': r => {
      r.final.dom.present = true
    },
    'activity leak': r => {
      r.final.target.admission.activity |= 128
    },
    'queued occupant': r => {
      r.final.target.admission.queueHead = opts.traineeId
    },
    'original still living': r => {
      r.final.trainee.hp = 50
    },
    'no training increment': r => {
      r.final.trained = 0
    },
    'two Preachers': r => {
      r.final.preachers.push({ ...r.final.preachers[0], id: 99999 })
    },
    'wrong replacement team': r => {
      r.final.preachers[0].team = 'red'
    },
    'dead replacement': r => {
      r.final.preachers[0].hp = 0
    },
    'target replaced': r => {
      r.records.find(x => x.kind === 'step').after.target.identity++
    },
  }
  for (const [name, mutate] of Object.entries(mutations))
    await t.test(name, () => {
      const changed = structuredClone(good)
      mutate(changed)
      assert.throws(() => assertTempleLifecycle(changed, opts))
    })
})

test('fresh request contract rejects wrong model and synchronous gameplay mutation', () => {
  const f = fixture()
  stepLiveTraining(f.world, f.temple)
  const good = f.epoch.status().firstRequest
  assertTempleFreshRequest(good, f.temple.id, f.brave.id)
  for (const mutate of [
    r => (r.before.target.admission.model = 7),
    r => r.after.trained++,
    r => r.after.target.admission.storedMana++,
  ]) {
    const changed = structuredClone(good)
    mutate(changed)
    assert.throws(() => assertTempleFreshRequest(changed, f.temple.id, f.brave.id))
  }
  f.epoch.close()
  f.release()
})

test('partial installation restores every prior wrapper and pointer listener', () => {
  const f = fixture()
  f.epoch.close()
  const original = f.scene.objectPanels.requestAutomaticTraining
  const originalStep = f.scene.objectPanels.stepBuildingInspections
  const originalTurn = f.scene.gameClock.afterTurn
  const originalDispose = f.scene.dispose
  const existing = f.doc.elementFromPoint
  const failure = new Error('snapshot unavailable')
  f.doc.elementFromPoint = () => {
    throw failure
  }
  assert.throws(
    () =>
      createTempleTrainingEpoch({
        scene: f.scene,
        store: { getWorld: () => f.world },
        targetId: f.temple.id,
        doc: f.doc,
      }),
    value => value === failure
  )
  assert.equal(f.scene.objectPanels.requestAutomaticTraining, original)
  assert.equal(f.scene.objectPanels.stepBuildingInspections, originalStep)
  assert.equal(f.scene.gameClock.afterTurn, originalTurn)
  assert.equal(f.scene.dispose, originalDispose)
  assert.equal(f.doc.listeners.length, 0)
  f.doc.elementFromPoint = existing
  f.release()
})

test('armed input cleanup failure cannot skip other owned restoration', () => {
  const f = fixture(),
    remove = f.canvas.removeEventListener,
    attempts = []
  f.canvas.removeEventListener = function (type, ...args) {
    attempts.push(type)
    if (type === 'pointerdown') throw Error('supplied listener cleanup failure')
    return remove.call(this, type, ...args)
  }
  f.epoch.armInput(f.brave.id)
  const foreign = () => {
    throw Error('foreign remover must not be called')
  }
  f.canvas.removeEventListener = foreign
  const result = f.epoch.close()
  f.release()
  assert.deepEqual(attempts, ['pointerdown', 'pointerup'])
  assert.equal(result.closed, true)
  assert.equal(result.input.restored, false)
  assert.match(result.errors.join(), /supplied listener cleanup failure/)
  assert.equal(f.doc.listeners.length, 0)
  assert.equal(f.canvas.removeEventListener, foreign)
  assert.equal(f.scene.gameClock.afterTurn(), 'after-turn')
  assert.equal(f.scene.objectPanels.stepBuildingInspections(), 'step')
})
