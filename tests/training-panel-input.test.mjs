import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { trainingReadiness } from '../scripts/local-render/training-panel-input.mjs'
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
