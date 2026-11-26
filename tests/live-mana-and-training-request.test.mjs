import assert from 'node:assert/strict'
import test from 'node:test'
import {addUnit, cast, command, createWorld, setSelection, tick} from '../app/model.ts'
import {registerHooks, stripTypeScriptTypes} from 'node:module'

// The stock Node test runner strips erasable TypeScript only. Transform the
// actual panel implementation's constructor parameter property, without stubbing it.
const panelUrl = import.meta.resolve('../app/object-panels.ts')
const panelTypes = registerHooks({load(url, context, next) {
  if (url !== panelUrl) return next(url, context)
  const loaded = next(url, {...context, format: 'module-typescript'})
  return {format: 'module', source: stripTypeScriptTypes(Buffer.from(loaded.source).toString(), {mode: 'transform'}), shortCircuit: true}
}})
const {ObjectPanels} = await import(panelUrl)
panelTypes.deregister()
import {rightClickSpellCharging} from '../app/spell-charging.ts'
import {bindTrainingPanelRequests} from '../app/training-panel-requests.ts'
import {SPELLS} from '../app/world-rules.ts'

function advance(w, count) {
  assert.ok(Number.isInteger(count) && count >= 0 && count <= 200)
  for (let i = 0; i < count; i++) {
    const prior = w.turn
    assert.equal(w.status, 'playing')
    tick(w, 1 / 12)
    assert.equal(w.turn, prior + 1)
  }
}

test('registered living followers contribute on the authored Mission 17 world mana pulse, ghosts do not', () => {
  for (const [kind, expected] of [['none', 37], ['brave', 42], ['ghost', 37]]) {
    const w = createWorld(17, 'scalable')
    const [shaman] = w.units.filter(u => u.team === 'blue')
    assert.equal(shaman.kind, 'shaman')
    if (kind !== 'none') {
      // Supply the added follower / ghost as the control; world ticking owns registration.
      const follower = addUnit(w, 'blue', 'brave', {x: shaman.x + 2, z: shaman.z})
      follower.ghost = kind === 'ghost'
      advance(w, 1)
      assert.strictEqual(w.objectCells.objects.get(follower.id), follower.native)
      assert.equal(follower.native.flags4 & 0x800, kind === 'ghost' ? 0x800 : 0)
    } else advance(w, 1)
    advance(w, 2)
    const blue = w.manaTribes[0]
    assert.equal(blue.previousRate, 0, 'generation does not run before its fourth-turn pulse')
    advance(w, 1)
    assert.equal(blue.previousRate, expected, `${kind} arm fourth-turn contribution`)
    advance(w, 3)
    assert.equal(blue.previousRate, expected)
  }
})

test('ordinary Mission 17 training producer retries a rejected panel request, then keeps the owner latched', t => {
  const oldDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
  Object.defineProperty(globalThis, 'document', {configurable: true, value: {querySelector: () => null}})
  t.after(() => {
    if (oldDocument) Object.defineProperty(globalThis, 'document', oldDocument)
    else delete globalThis.document
  })
  const w = createWorld(17, 'scalable')
  const camp = w.buildings.find(b => b.id === 399)
  assert.deepEqual([camp.team, camp.kind, camp.progress], ['blue', 'camp', 1])
  const scene = {world: w, overviewStage: false, overviewActive: false, isCurrent: () => true,
    buildingPanels: new Map(), tooltip: {}}
  const panels = scene.objectPanels = new ObjectPanels(scene)
  t.after(bindTrainingPanelRequests(w, panels))
  for (let id = 10000; id < 10032; id++) panels.panels.set(id, {})
  assert.ok(rightClickSpellCharging(w, SPELLS.find(s => s.id === 'convertWild'), {ctrlKey: true, shiftKey: false}))
  advance(w, 32)
  const wild = w.units.find(u => u.id === 182)
  assert.ok(cast(w, 'convertWild', wild, wild.id))
  advance(w, 35)
  const ids = w.units.filter(u => u.team === 'blue' && u.kind === 'brave').map(u => u.id).sort((a,b) => a-b)
  assert.deepEqual(ids, [1062, 1096, 1130])
  setSelection(w, ids)
  assert.ok(command(w, camp))
  advance(w, 87)
  assert.equal(w.turn, 154)
  assert.equal(panels.automaticTrainingLatches.has(camp.id), false)
  advance(w, 2)
  assert.equal(w.turn, 156)
  assert.equal(camp.admission.activity & 128, 128)
  assert.equal(panels.buildingRecords.has(camp.id), false)
  assert.equal(panels.automaticTrainingLatches.has(camp.id), false, 'capacity rejection must not latch')
  panels.panels.delete(10000)
  advance(w, 1)
  const record = panels.buildingRecords.get(camp.id)
  assert.ok(record?.automatic, 'next live training visit retries and allocates after capacity returns')
  assert.equal(panels.automaticTrainingLatches.has(camp.id), true)
  const owner = `building-panel:${camp.id}`
  assert.equal(w.secondaryEffects.reservations.filter(x => x === owner).length, 1)
  advance(w, 3)
  assert.strictEqual(panels.buildingRecords.get(camp.id), record)
  assert.equal(w.secondaryEffects.reservations.filter(x => x === owner).length, 1)
})
