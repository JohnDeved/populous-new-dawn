// Portable caller/observer contracts. Synthetic DOM and direct fixed turns below
// are explicitly model tests, never ordinary-browser/checkpoint evidence.
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createWorld, command, tick, select, setSelection, placeBuilding } from '../../app/model.ts'
import { placementError } from '../../app/model.ts'
import * as pointer from '../erosion-ordinary/input.mjs'
import { currentPersonOrder, personReachedOrder } from '../../app/person-orders.ts'
import { nativeUnitModel } from '../../app/unit-kinds.ts'
import { samePersonCell } from '../../app/person-idle.ts'
import { selectFollowers } from '../../app/selection-runtime.ts'
import { buildingStage } from '../../app/world-terrain-runtime.ts'
import { campaignShamanReadiness } from '../../scripts/campaign-start-readiness.mjs'
import rules from '../../app/original-rules.json' with { type: 'json' }
import { finishLevelStart } from '../../tests/level-start-fixture.mjs'
import { isQueuedMission1VaultEntry } from '../../scripts/local-render/mission1-vault-input.mjs'
import { installMission1MoveWitness } from '../../scripts/local-render/mission1-vault-arrival.mjs'
import {
  installTempleRouteObservation,
  armTempleSave,
  readCommittedTempleSummary,
  armTemplePlacement,
} from '../../scripts/local-render/mission3-temple-witness.mjs'
import {
  assertTempleRouteHealth,
  saveTempleCheckpoint,
  assertTemplePlacement,
} from '../../scripts/local-render/mission3-temple-checkpoint.mjs'
import { checkpointObservation } from '../../scripts/local-render/checkpoint-observer.mjs'

const modules = {
  '/app/person-orders.ts': { currentPersonOrder, personReachedOrder },
  '/app/original-rules.json': { default: rules },
  '/app/unit-kinds.ts': { nativeUnitModel },
  '/app/person-idle.ts': { samePersonCell },
  '/app/world-terrain-runtime.ts': { buildingStage },
  '/scripts/campaign-start-readiness.mjs': { campaignShamanReadiness },
  '/app/model.ts': { placementError },
  '/qa/erosion-ordinary/input.mjs': pointer,
}
const evaluate = (fn, argument) =>
  Function(
    'imports',
    `return (${fn.toString().replaceAll('import(', 'imports(')})`
  )(async path => {
    assert.ok(modules[path], path)
    return modules[path]
  })(argument)

function fixture(t) {
  const world = finishLevelStart(createWorld(3))
  // Portable stand-in for public Skip's camera input release. Browser code uses
  // maintained openMission and native readiness, never this fixture assignment.
  world.inputMask = 0
  const actor = world.units.find(u => u.team === 'blue' && u.kind === 'shaman')
  const clock = { animationFrame: 0, beforeTurn() {}, afterTurn() {} }
  const scene = {
    world,
    started: true,
    gameClock: clock,
    renderer: {
      domElement: { isConnected: true },
      getContext: () => ({ isContextLost: () => false }),
    },
  }
  globalThis.window = { testSceneRef: { current: scene }, testStore: { getWorld: () => world } }
  globalThis.document = { querySelector: () => null }
  t.after(() => {
    window.restoreMission1MoveWitness?.()
    for (const key of ['window', 'document', 'indexedDB']) delete globalThis[key]
  })
  const step = () => {
    clock.beforeTurn()
    tick(world, 1 / 12)
    clock.animationFrame++
    clock.afterTurn()
  }
  const until = predicate => {
    for (let n = 0; !predicate() && n < 6000; n++) {
      assert.equal(world.status, 'playing')
      assert.ok(actor.hp > 0)
      step()
    }
    assert.ok(predicate(), `Route predicate did not complete at turn ${world.turn}`)
  }
  return { world, actor, scene, step, until }
}

test('current M3 earned-Vault, native-arrival and five-Brave construction compose with maintained helpers', async t => {
  const { world, actor, scene, until, step } = fixture(t)
  const initial = await evaluate(installTempleRouteObservation)
  assertTempleRouteHealth(initial, actor.id)
  assert.equal(initial.readiness.ready, true)
  assert.equal(initial.unlocked, false)
  assert.deepEqual(initial.temples, [])
  assert.equal(initial.vault.length, 1)
  const vault = world.shrines.find(h => h.id === initial.vault[0].id)
  select(world, 'shaman')
  assert.deepEqual(world.selected, [actor.id])
  assert.equal(command(world, vault), true)
  const person = actor.native
  assert.equal(
    isQueuedMission1VaultEntry(
      {
        hp: actor.hp,
        kind: actor.kind,
        orderId: person.immediateCommand || person.commands[person.commandCursor],
        work: actor.work,
        vaultTask: { ...actor.vault },
        order: { ...currentPersonOrder(world.buildingOrders, person) },
        orderOwner: {
          native: person === actor.native,
          registered: world.objectCells.objects.get(actor.id) === person,
          phase: person.commandPhase,
          workTarget: person.workTarget,
          flags2: person.flags2,
          timer: person.timer,
        },
      },
      vault.id
    ),
    true
  )
  until(() => world.unlockedTemple)
  assert.equal(vault.uses, 1)
  select(world, 'shaman')
  const point = { x: 35, z: 81 }
  assert.equal(command(world, point), true)
  const current = actor.native
  await evaluate(installMission1MoveWitness, {
    id: actor.id,
    point,
    orderId: current.immediateCommand || current.commands[current.commandCursor],
    order: { ...currentPersonOrder(world.buildingOrders, current) },
    acknowledgedTurn: world.lastOrderTurn,
  })
  until(
    () => !!window.mission1MoveEvidence.completed || !!window.mission1MoveEvidence.errors.length
  )
  const arrival = window.restoreMission1MoveWitness()
  assert.deepEqual(arrival.errors, [])
  assert.equal(arrival.restored, true)
  assert.ok(arrival.completed.after.nativeReached)
  setSelection(world, [])
  selectFollowers(
    world,
    nativeUnitModel('brave'),
    { x: (35 + 8) * 256, y: (-81 - 8) * 256 },
    'five'
  )
  const selected = [...world.selected]
  assert.equal(selected.length, 5)
  assert.ok(
    world.units.filter(u => selected.includes(u.id)).every(u => u.kind === 'brave' && u.hp > 0)
  )
  const listeners = [],
    canvas = scene.renderer.domElement
  Object.assign(canvas, {
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1440, height: 1000 }),
    addEventListener(type, callback, capture = false) {
      listeners.push({ type, callback, capture })
    },
    removeEventListener(type, callback, capture = false) {
      const index = listeners.findIndex(
        item => item.type === type && item.callback === callback && item.capture === capture
      )
      assert.ok(index >= 0)
      listeners.splice(index, 1)
    },
  })
  const hit = { x: 500, y: 400, point: { x: 24, z: 70 } }
  Object.assign(scene, {
    pick: () => hit.point,
    pickUnit: () => null,
    pickWorldObject: () => null,
    picking: { pickPerson: () => null },
  })
  document.elementFromPoint = () => canvas
  world.mode = 'temple' // Synthetic stand-in for the public building-card selection.
  await assert.rejects(evaluate(armTemplePlacement, { hit, selected: [] }), /precondition changed/)
  assert.equal(listeners.length, 0)
  await evaluate(armTemplePlacement, { hit, selected })
  step() // A legitimate real turn can occur after arming and before input.
  for (const type of ['pointerdown', 'pointerup']) {
    const event = {
      type,
      clientX: hit.x,
      clientY: hit.y,
      button: 0,
      buttons: Number(type === 'pointerdown'),
      isTrusted: true,
      target: canvas,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
    }
    for (const listener of [...listeners].filter(item => item.type === type && item.capture))
      listener.callback(event)
    if (type === 'pointerup') assert.equal(placeBuilding(world, 'temple', scene.pick(event)), true)
    for (const listener of [...listeners].filter(item => item.type === type && !item.capture))
      listener.callback(event)
  }
  const evidence = window.finishTemplePlacement()
  assert.equal(listeners.length, 0)
  assert.equal(evidence.before.turn, evidence.preflight.turn + 1)
  assert.equal(evidence.after.turn, evidence.before.turn)
  assert.equal(assertTemplePlacement(evidence, hit, selected).id, 1021)
  const wrongRecipients = structuredClone(evidence)
  wrongRecipients.after.units.find(u => selected.includes(u.id)).work = null
  wrongRecipients.after.units.find(u => selected.includes(u.id)).order = null
  assert.throws(
    () => assertTemplePlacement(wrongRecipients, hit, selected),
    /construction recipients/
  )
  const temple = world.buildings.find(b => b.team === 'blue' && b.kind === 'temple')
  const recipients = world.units.filter(u => u.work === temple.id)
  assert.deepEqual(
    recipients.map(u => u.id).sort((a, b) => a - b),
    selected.sort((a, b) => a - b)
  )
  until(() => temple.progress === 1)
  assert.deepEqual(
    { hp: temple.hp, logs: temple.logs, object: temple.object, stage: buildingStage(temple) },
    { hp: 260, logs: 8, object: 95, stage: 4 }
  )
  const complete = window.m3TempleRoute.read()
  assertTempleRouteHealth(complete, actor.id)
  for (const mutate of [
    state => (state.actorMatches = false),
    state => (state.inputMask = 64),
    state => (state.units.find(u => u.id === actor.id).hp = 0),
    state => (state.contextLost = true),
  ]) {
    const invalid = structuredClone(complete)
    mutate(invalid)
    assert.throws(() => assertTempleRouteHealth(invalid, actor.id))
  }
  t.diagnostic(
    `Synthetic fixed-turn endpoint: turn ${world.turn}, Temple ${temple.id}, no casts/bridges/training`
  )
})

function checkpointFixture(t, { clickFailure = false, malformed = false } = {}) {
  const base = fixture(t),
    listeners = new Set(),
    calls = [],
    savedReports = []
  // Explicit synthetic Save fixture. The preceding test covers the ordinary
  // model acquisition/build path; this fixture tests storage boundaries only.
  base.world.unlockedTemple = true
  base.world.buildings.push({
    id: 1021,
    kind: 'temple',
    team: 'blue',
    object: 95,
    x: 24.99609375,
    z: 69.07421875,
    hp: 260,
    progress: 1,
    logs: 8,
    level: 1,
    damageState: null,
  })
  let record,
    activeReads = 0,
    closed = 0
  const button = {
    textContent: 'Save checkpoint',
    isConnected: true,
    disabled: false,
    contains: target => target === button,
    addEventListener: (type, fn) => {
      assert.equal(type, 'click')
      listeners.add(fn)
    },
    removeEventListener: (type, fn) => {
      assert.equal(type, 'click')
      listeners.delete(fn)
    },
  }
  document.querySelectorAll = () => [button]
  const db = {
    transaction(name, mode) {
      assert.equal(name, 'checkpoints')
      assert.equal(mode, 'readonly')
      assert.equal(activeReads++, 0)
      const tx = {
        objectStore: () => ({
          get(key) {
            assert.equal(key, 'latest')
            const request = { result: record }
            setImmediate(() => {
              activeReads--
              tx.oncomplete()
            })
            return request
          },
        }),
      }
      return tx
    },
    close() {
      assert.equal(activeReads, 0)
      closed++
    },
  }
  globalThis.indexedDB = {
    databases: async () => [{ name: 'populous-new-dawn' }],
    open() {
      const request = { result: db }
      setImmediate(() => request.onsuccess())
      return request
    },
  }
  const report = {},
    page = { evaluate }
  const input = {
    async button(name) {
      calls.push(name)
      if (name !== 'Save checkpoint') return
      if (clickFailure) throw Error('Synthetic physical click failed')
      for (const listener of [...listeners]) listener({ isTrusted: true, target: button })
      record = { version: 1, world: structuredClone(base.world) }
      if (malformed) record.world.turn++
    },
  }
  const save = () => savedReports.push(structuredClone(report))
  const observeCheckpoint = async () => {
    globalThis.syntheticCommitted = record
    try {
      return { checkpoint: await checkpointObservation({ observationName: 'syntheticCommitted' }) }
    } finally {
      delete globalThis.syntheticCommitted
    }
  }
  return {
    ...base,
    report,
    calls,
    listeners,
    savedReports,
    page,
    input,
    save,
    observeCheckpoint,
    signal: new AbortController().signal,
    closed: () => closed,
  }
}

test('public Save observer and committed typed digest compose without exporting the checkpoint', async t => {
  const f = checkpointFixture(t)
  await evaluate(installTempleRouteObservation)
  f.world.paused = true
  const entry = await saveTempleCheckpoint(f)
  assert.deepEqual(entry.committed.summary, entry.boundary.saved)
  assert.equal(entry.digest.checkpoint.level, 3)
  assert.match(entry.digest.checkpoint.terrainSha256, /^[a-f0-9]{64}$/)
  assert.equal(f.closed(), 1)
  assert.equal(f.listeners.size, 0)
  assert.deepEqual(f.calls, ['Game settings', 'Save checkpoint'])
  assert.equal(JSON.stringify(f.report).includes('Float32Array'), false)
  assert.ok(f.savedReports.some(report => report.checkpoint.boundary?.saved))
})

test('failed Save input retains its partial boundary and never issues a fallback Save', async t => {
  const f = checkpointFixture(t, { clickFailure: true })
  await evaluate(installTempleRouteObservation)
  f.world.paused = true
  await assert.rejects(saveTempleCheckpoint(f), /Synthetic physical click failed/)
  assert.equal(f.listeners.size, 0)
  assert.deepEqual(f.report.checkpoint.boundary, { saved: null, error: null })
  assert.deepEqual(f.calls, ['Game settings', 'Save checkpoint'])
  assert.equal(f.closed(), 0)
})

test('committed summary read waits for transaction completion and preserves typed source', async t => {
  const f = checkpointFixture(t)
  await evaluate(installTempleRouteObservation)
  await evaluate(armTempleSave)
  await f.input.button('Save checkpoint')
  window.finishTempleSave()
  const record = await evaluate(readCommittedTempleSummary)
  assert.equal(record.version, 1)
  assert.ok(ArrayBuffer.isView(f.world.land.heights))
  assert.equal(f.closed(), 1)
})

test('reused maintained helpers retain the reviewed e504 bytes and public controls still exist', () => {
  const read = path => readFileSync(new URL('../../' + path, import.meta.url))
  const pins = JSON.parse(read('qa/mission3-temple-checkpoint/source-correspondence.json'))
  for (const { path, sha256 } of pins.helpers)
    assert.equal(createHash('sha256').update(read(path)).digest('hex'), sha256, path)
  const page = read('app/page.tsx').toString()
  for (const name of [
    'Select and focus shaman',
    'Save checkpoint',
    'Close menu',
    'Pause game',
    'Resume game',
  ])
    assert.ok(page.includes(name), name)
  assert.ok(page.includes('aria-label={`${b.name}, ${b.cost} wood`}'))
  assert.ok(page.includes('aria-label={`Select ${u.kind}`}'))
  const harness = read('scripts/local-render/harness.mjs').toString()
  assert.ok(harness.includes('const openMission = async mission =>'))
  assert.ok(harness.includes('await bindGame(page)'))
})
