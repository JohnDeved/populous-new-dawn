import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { trainingReadiness, assertAutomaticLifecycle } from '../scripts/local-render/training-panel-input.mjs'
import trainingPanelAuto from '../scripts/local-render/training-panel-auto.mjs'
import { checkpointObservation } from '../scripts/local-render/checkpoint-observer.mjs'

const source = name => readFileSync(new URL(`../app/${name}`, import.meta.url), 'utf8')
const rules = JSON.parse(source('original-rules.json'))
const constants = JSON.parse(source('original-constants.json'))
const loadBody = (file, from, to, bindings, names) => {
  const text = source(file), start = text.indexOf(from), end = to ? text.indexOf(to, start) : text.length
  assert.ok(start >= 0 && end > start)
  return Function(...Object.keys(bindings), `${stripTypeScriptTypes(text.slice(start, end).replaceAll('export ', ''))};return {${names}}`)(...Object.values(bindings))
}

test('one-Brave cost and conservative ordinary mana funding compose actual source owners', async () => {
  const occupancy = loadBody('building-occupants.ts', 'const short =', '\n// Shared activity rebuild', { rules }, 'nativeTrainingCost')
  const mana = loadBody('mana.ts', 'const short =', null, { rules, constants,
    currentPersonOrder: () => undefined, tribeForTeam: () => 0,
    nativePersonModel: u => ({ brave: 2, shaman: 7, warrior: 3 })[u.kind], TURNS_PER_SECOND: 12 },
  'generatedMana,manaPeople,liveManaOrders,generateFollowerMana,distributeMana')
  const t = { id: 0, spellOwner: 0, playerType: 2, available: 0, pending: 0, releaseDelay: 0,
    releaseRate: 0, spellProgress: Array(22).fill(0), previousRate: 0, estimatedRate: 0 }
  const w = { turn: 0, stats: { trained: 0 }, selected: [100], outcome: { level: 2 }, speed: 1, paused: false,
    buildings: [{ id: 500, timer: 0 }], manaTribes: [t, {}, {}, {}],
    units: [...Array.from({ length: 9 }, (_, i) => ({ id: 100 + i, kind: 'brave', team: 'blue', hp: 50,
      inside: null, work: null, path: [], target: null })),
    { id: 57, kind: 'shaman', team: 'blue', hp: 100, inside: null, work: null, path: [], target: null }] }
  const ready = await trainingReadiness({ id: 500, scene: { world: w }, mana, occupancy })
  assert.equal(ready.braves.length, 9); assert.equal(ready.generatedMana, 82); assert.equal(ready.singleCost, 3500)
  w.units[0].work = 500; w.units[0].inside = 500
  assert.equal(mana.generatedMana(mana.liveManaOrders, mana.manaPeople(w), w.manaTribes)[0], 96)
  const b = { id: 500, model: 7, activity: 128, flags3: 0, storedMana: 0, trainingCost: ready.singleCost }
  // Keep one expensive eligible spell charging throughout; training gets only
  // the source's first half-share. No public runtime or game clock is invoked.
  const model = rules.spellCharging.findIndex((entry, model) => model > 0 && entry.mode === 1 && entry.cost > 100000)
  assert.ok(model > 0)
  const mw = { gameFlags: 0, turn: 0, playerTribe: 0, turnsPerSecond: 12, loadFlags: 0,
    spells: [{ available: 1 << model, disabled: 0, stocks: Array(22).fill(0) }] }
  let fundedTurn = null
  for (let turn = 1; turn <= 300; turn++) {
    mw.turn = turn
    mana.generateFollowerMana(mw, w.manaTribes, mana.manaPeople(w), mana.liveManaOrders)
    mana.distributeMana(mw, t, [b], { notify() {}, shouldNotifyFull: () => false })
    if (b.storedMana === b.trainingCost) { fundedTurn = turn; break }
  }
  assert.equal(fundedTurn, 292); assert.equal(fundedTurn / 12, 24 + 1 / 3)
})

test('automatic training continuation retains the accepted construction prefix and typed checkpoints', () => {
  assert.equal(typeof trainingPanelAuto, 'function')
  const driver = readFileSync(new URL('../scripts/local-render/camp-inspection.mjs', import.meta.url), 'utf8')
  assert.ok(driver.indexOf('assert.ok(campCompletion(report.completed, hut))') < driver.indexOf('if (trainingTail)'))
  const tail = readFileSync(new URL('../scripts/local-render/training-panel-auto.mjs', import.meta.url), 'utf8')
  assert.match(tail, /selectedBraves: 1/); assert.match(tail, /trainingSha256, committed.trainingSha256/)
  assert.ok(tail.indexOf('Check public Save control before training') < tail.indexOf("await phase('train-one-brave')"))
})

test('typed training checkpoint digest preserves queues and mana while ignoring transient reservations', async () => {
  const name = '__trainingCheckpointContract', previous = Object.getOwnPropertyDescriptor(globalThis, name)
  const person = { id: 100, commands: [1, 0, 0, 0, 0, 0, 0, 0], flags3: 0x40000 }
  const record = { version: 1, world: { outcome: { level: 2 }, turn: 900, time: 75,
    buildings: [{ id: 500, admission: { activity: 128, occupants: [100], storedMana: 100, trainingCost: 3500 } }],
    units: [{ id: 100, team: 'blue', kind: 'brave', hp: 50, x: -99, z: -105, entry: { person } }],
    buildingOrders: { records: [{}, { model: 8, a: 500, references: 1 }] }, manaTribes: [{ available: 0 }],
    stats: { trained: 0 }, terrain: new Uint16Array([1, 2]), shots: {}, giftCounts: {},
    secondaryEffects: { reservations: ['building-panel:500'] } } }
  try {
    globalThis[name] = record
    const saved = await checkpointObservation({ observationName: name, trainingTargetId: 500 })
    globalThis[name] = structuredClone(record)
    globalThis[name].world.secondaryEffects.reservations = []
    const loaded = await checkpointObservation({ observationName: name, trainingTargetId: 500 })
    assert.notEqual(loaded.checkpointSha256, saved.checkpointSha256)
    assert.equal(loaded.trainingSha256, saved.trainingSha256)
    for (const change of [w => { w.buildings[0].admission.storedMana++ }, w => { w.buildings[0].admission.activity = 0 },
      w => { w.units[0].entry.person.commands[0] = 0 }, w => { w.manaTribes[0].available++ }, w => { w.stats.trained++ }]) {
      globalThis[name] = structuredClone(record); change(globalThis[name].world)
      assert.notEqual((await checkpointObservation({ observationName: name, trainingTargetId: 500 })).trainingSha256, saved.trainingSha256)
    }
  } finally {
    if (previous) Object.defineProperty(globalThis, name, previous)
    else delete globalThis[name]
  }
})

function lifecycleFixture() {
  const id = 500, traineeId = 100, record = { id, identity: 77, automatic: true, phase: -1, remaining: 0, hold: 16 }
  const state = { turn: 1000, records: [], panels: [], input: { object: { id: 0 } }, training: {
    trained: 0, latches: [], camps: [{ id, identity: 44, hp: 800, progress: 1, reservationCount: 0,
      admission: { model: 7, activity: 128, inside: 1, occupants: [traineeId, 0, 0, 0, 0], queueHead: 0, queueFrom: 0, entering: 0 } }],
    people: [{ id: traineeId, team: 'blue', kind: 'brave', hp: 50, inside: id }] } }
  const before = structuredClone(state)
  state.records = [record]; state.training.latches = [id]; state.training.camps[0].reservationCount = 1
  const rows = [{ ordinal: 1, epoch: 2, kind: 'automatic-training-request', target: id,
    receiverMatches: true, threw: false, before, after: structuredClone(state) }]
  const { stepPersonPanel } = loadBody('person-panel.ts', 'export function stepPersonPanel(', '\nexport interface OrderFocusObject', {}, 'stepPersonPanel')
  const tick = () => {
    const before = structuredClone(state), active = !!(state.training.camps[0].admission.activity & 128)
    if (record.phase === 1 && !active) { state.training.latches = []; record.remaining = 0 }
    if (!stepPersonPanel(record, active)) {
      state.records = []; state.panels = []; state.training.camps[0].reservationCount = 0
    } else state.panels = [{ id, hovered: false, focused: false }]
    rows.push({ ordinal: rows.length + 1, epoch: 2, kind: 'tick', before, after: structuredClone(state) })
  }
  for (let n = 0; n < 8; n++) tick()

  // Execute the actual conversion producer. Geometry and pool bookkeeping are
  // supplied leaves; replacement allocation/deletion and conversion count are
  // decided by the real function, with an arbitrary new ID (not id+1).
  const original = { id: traineeId, class: 1, model: 2, tribe: 0, flags2: 0, flags4: 0,
    commands: Array(8).fill(0), commandCursor: 0 }
  const conversionWorld = { turn: 1000, playerTribe: 0, people: new Map([[traineeId, original]]),
    tribes: [{ playerType: 2 }], orders: { records: [{}, {}] } }
  const camp = Object.assign(structuredClone(state.training.camps[0].admission), {
    id, class: 2, tribe: 0, counter: 1, trainingCost: 3500, storedMana: 3500 })
  const conversions = [], retired = []
  const { stepTrainingConversion } = loadBody('training-conversion.ts', 'function live(', null, {
    rules, repriceTraining() {}, trainingOccupantWeight: () => 1,
    buildingInsidePoint: () => ({ x: 10, y: 20 }), buildingExitPoint: () => ({ x: 11, y: 21 }),
    allocatePersonOrder: () => 1, hasFollowingPersonOrder: () => false,
    attachPersonOrder(_pool, person, order) { person.commands[0] = order }, clearPersonOrders() {},
    removeBuildingOccupant(_w, b, person) { assert.equal(person.id, traineeId); b.inside = 0; b.occupants.fill(0); b.activity &= ~128 },
  }, 'stepTrainingConversion')
  stepTrainingConversion(conversionWorld, camp, {
    updateTrainingPanel(b) { assert.equal(b.inside, 1); assert.equal(b.occupants[0], traineeId) },
    orders: { prepare() {}, deleteObject(id) { retired.push(id); conversionWorld.people.get(id).class = 0 } },
    allocateTrainee(model, tribe) {
      const p = { id: 923, class: 1, model, tribe, flags2: 0, flags4: 0, commands: Array(8).fill(0) }
      conversions.push(p); conversionWorld.people.set(p.id, p); return p
    }, addMana() { throw Error('Human conversion must not refund computer mana') },
  })
  assert.deepEqual(retired, [traineeId]); assert.equal(conversions.length, 1); assert.equal(conversions[0].model, 3)
  assert.notEqual(conversions[0].id, traineeId); assert.ok(conversions[0].flags2 & 16)
  state.training.camps[0].admission = camp
  state.training.people = [{ id: conversions[0].id, team: 'blue', kind: 'warrior', hp: 50, inside: null }]
  state.training.trained = conversions.length
  for (let n = 0; n < 4; n++) tick()
  return { rows, id, traineeId }
}

test('lifecycle assertion follows the real conversion replacement and complete 3/16/3 record sequence', () => {
  const { rows, id, traineeId } = lifecycleFixture()
  const result = assertAutomaticLifecycle(rows, id, 2, 0, traineeId)
  assert.equal(result.replacementId, 923); assert.equal(result.traineeId, 100)
  assert.equal(result.heldVisits, 4)
  assert.deepEqual(rows.slice(-4).map(row => row.after.records[0]?.remaining ?? null), [2, 1, 0, null])
})

test('lifecycle assertion rejects unrelated conversion, broken visits and leaked owners', () => {
  const { rows, id, traineeId } = lifecycleFixture()
  const changes = [
    rows => { rows[0].before.training.camps[0].admission.occupants[0] = 101 },
    rows => { rows.at(-4).after.training.people[0].kind = 'brave' },
    rows => { rows.at(-4).after.training.trained = 2 },
    rows => { rows.at(-4).after.training.people.push({ id: traineeId, kind: 'brave', hp: 50 }) },
    rows => { rows.at(-1).after.training.camps[0].admission.queueHead = 101 },
    rows => { rows[2].after.records = [] },
    rows => { rows[2].after.records[0].identity++ },
    rows => { rows[1].after.records[0].phase = 1 },
    rows => { rows[2].after.records[0].remaining = 0 },
    rows => { rows.at(-2).after.records[0].remaining = 1 },
    rows => { rows.at(-1).after.training.camps[0].reservationCount = 1 },
    rows => { rows.at(-1).after.panels.push({ id }) },
    rows => { rows.at(-1).after.training.latches = [id] },
    rows => { rows[5].after.panels[0].focused = true },
    rows => { rows.at(-1).after.training.camps[0].hp = 0 },
    rows => { rows.splice(6, 1) },
  ]
  for (const change of changes) { const bad = structuredClone(rows); change(bad); assert.throws(() => assertAutomaticLifecycle(bad, id, 2, 0, traineeId)) }
})
