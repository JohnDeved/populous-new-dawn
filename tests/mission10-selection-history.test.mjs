import test from 'node:test'
import assert from 'node:assert/strict'
import { runInNewContext } from 'node:vm'
import { createWorld } from '../app/world-initialization.ts'
import { createLivePerson } from '../app/live-people.ts'
import { boardLiveVehicle } from '../app/live-vehicles.ts'
import { cancelInteraction, selectFollowers } from '../app/selection-runtime.ts'
import { readMission10Selection } from '../scripts/tutorial-browser/mission10-input.mjs'
import { mission10EscapePreserved, mission10SelectionPreserved } from '../scripts/local-render/mission10-selection.mjs'
import { checkMission10FollowerStrip } from '../scripts/local-render/mission10-boat-checkpoint.mjs'
import { validateMission10SelectionEvidence } from '../scripts/local-render/mission10-selection-evidence.mjs'

const party = [63, 111, 112, 113, 114], capturedExtra = [116, 118, 120, 122]
function world() {
  const w = createWorld(10); w.paused = true; w.mode = null; w.selected = []
  for (const u of w.units) if (u.team !== 'wild') u.native ??= createLivePerson(w, u)
  return w
}
function observe(w) {
  const before = structuredClone(w), boat = w.vehicles.find(v => v.id === 62)
  const result = structuredClone(runInNewContext(`(${readMission10Selection.toString()})()`, {
    window: { testSceneRef: { current: { world: w, cameraPosition: { x: boat.x, y: boat.y, angle: 0 } } } },
  }))
  assert.deepEqual(w, before, 'The serialized observer must remain read-only')
  return result
}
function selectFixture(w, ids) {
  w.selected = ids
  for (const u of w.units) if (u.team === 'blue')
    u.native.selectionFlags = (u.native.selectionFlags & ~128) | (ids.includes(u.id) ? 128 : 0)
}

test('captured four-person 0→128→1 histories require adjacent Escape validation, not initial baseline masking', () => {
  // Controlled reproduction of the exact hosted IDs and bit changes, not a
  // replay claim for the entire authored browser World or original process.
  const w = world()
  for (const id of capturedExtra) w.units.find(u => u.id === id).native.selectionFlags = 0
  const initial = observe(w)
  selectFixture(w, [...party, ...capturedExtra]); const selected = observe(w)
  cancelInteraction(w); const cleared = observe(w)
  for (const id of capturedExtra) {
    const flags = s => s.people.find(p => p.id === id).owners.native.selectionFlags
    assert.deepEqual([flags(initial), flags(selected), flags(cleared)], [0, 128, 1])
  }
  assert.throws(() => mission10SelectionPreserved(initial, cleared), /ownership/)
  assert.doesNotThrow(() => mission10EscapePreserved(selected, cleared))
  assert.throws(() => mission10EscapePreserved(initial, cleared), /history/)
  for (const id of capturedExtra) for (const byte of [0, 128, 129, 3]) {
    const bad = structuredClone(cleared); bad.people.find(p => p.id === id).owners.native.selectionFlags = byte
    assert.throws(() => mission10EscapePreserved(selected, bad), /history/)
  }
  const ordinary = structuredClone(cleared)
  ordinary.people.find(p => p.id === 116).owners.native.selectionFlags ^= 1
  assert.throws(() => mission10SelectionPreserved(cleared, ordinary), /ownership/)
})

test('Escape normalizes from displayed selection, clears prior history for others, and preserves empty selection and other tribes', () => {
  const w = world(), chosen = w.units.find(u => u.id === 116), other = w.units.find(u => u.id === 118)
  const enemy = w.units.find(u => u.team === 'red' || u.team === 'green' || u.team === 'yellow')
  chosen.native.selectionFlags = 0; chosen.native.flags3 |= 128
  other.native.selectionFlags = 129; other.native.flags3 |= 128
  enemy.native.selectionFlags = 129; enemy.native.flags3 |= 128
  w.selected = [116]; const before = observe(w); cancelInteraction(w); const after = observe(w)
  mission10EscapePreserved(before, after)
  assert.equal(chosen.native.selectionFlags, 1); assert.equal(other.native.selectionFlags, 0)
  assert.equal(chosen.native.flags3 & 128, 0); assert.equal(enemy.native.selectionFlags, 129)
  assert.deepEqual(after.people.find(p => p.id === enemy.id), before.people.find(p => p.id === enemy.id))
  // A second empty Escape does not erase history or clean any owner work flags.
  chosen.native.flags3 |= 128; const empty = observe(w); cancelInteraction(w); const again = observe(w)
  mission10EscapePreserved(empty, again); assert.equal(chosen.native.selectionFlags, 1); assert.ok(chosen.native.flags3 & 128)
  for (const mutate of [
    s => { s.people.find(p => p.id === 116).owners.native.selectionFlags = 0 },
    s => { s.people.find(p => p.id === 116).owners.native.flags3 &= ~128 },
    s => { s.people.find(p => p.id === enemy.id).owners.native.selectionFlags = 1 },
    s => { s.people.find(p => p.id === 116).vehicle = 62 },
  ]) { const bad = structuredClone(again); mutate(bad); assert.throws(() => mission10EscapePreserved(empty, bad)) }
})

test('serialized observer distinguishes real owner aliases from equal-valued independent route owners', () => {
  for (const shared of [true, false]) {
    const w = world(), u = w.units.find(u => u.id === 116), p = u.native
    p.selectionFlags = 128; p.flags3 |= 128
    u.flight = p; u.entry = { person: p }; u.builder = { person: p }
    w.pathfinding.people.set(u.id, shared ? p : structuredClone(p)); w.selected = [u.id]
    const before = observe(w), row = before.people.find(v => v.id === u.id)
    assert.deepEqual(row.ownerAliases, { native: 'native', flight: 'native', fight: null,
      entry: 'native', builder: 'native', route: shared ? 'native' : 'route' })
    assert.deepEqual(row.owners.native, row.owners.route, 'Values alone cannot establish identity')
    cancelInteraction(w); const after = observe(w); mission10EscapePreserved(before, after)
    assert.equal(after.people.find(v => v.id === u.id).owners.route.selectionFlags, shared ? 1 : 128)
    const bad = structuredClone(after); bad.people.find(v => v.id === u.id).owners.route.selectionFlags = shared ? 128 : 1
    assert.throws(() => mission10EscapePreserved(before, bad))
    for (const mutate of [
      s => { delete s.people[0].ownerAliases },
      s => { s.people.find(v => v.id === u.id).ownerAliases.route = shared ? 'route' : 'native' },
      s => { s.people.find(v => v.id === u.id).ownerAliases.native = 'route' },
    ]) { const forged = structuredClone(after); mutate(forged); assert.throws(() => mission10EscapePreserved(before, forged)) }
  }
})

test('real selection/cancel adapters replay all18 witness controls with exact history, artifact replay and unchanged world facts', async () => {
  for (const phase of ['boarded', 'loaded', 'unloaded']) {
    const w = world(), occupied = phase !== 'unloaded', boat = w.vehicles.find(v => v.id === 62)
    if (occupied) for (const id of party) {
      const p = w.units.find(u => u.id === id).native; p.state = 19
      assert.equal(boardLiveVehicle(w, p, boat), true)
    }
    selectFixture(w, party); const observations = []
    const state = async label => {
      const selectionState = observe(w), row = { label, paused: w.paused, turn: w.turn, selected: [...w.selected],
        orders: structuredClone(w.buildingOrders), randomState: w.randomState,
        boat: { id: boat.id, passengers: [...boat.passengers] },
        party: party.map(id => { const u = w.units.find(v => v.id === id); return { id, hp: u.hp, vehicle: u.native.vehicle } }), selectionState }
      observations.push(row); return row
    }
    const page = { keyboard: { press: async key => { assert.equal(key, 'Escape'); cancelInteraction(w) } },
      getByRole: (_role, { name }) => ({ click: async ({ modifiers }) => selectFollowers(w, name === 'Select warrior' ? 3 : 0,
        observe(w).point, modifiers[0] === 'Control' ? 'five' : modifiers[0] === 'Shift' ? 'all' : 'single') }) }
    const input = { action: async (_label, fn) => fn() }
    const selection = [await checkMission10FollowerStrip({ page, input, state, phase, occupied })]
    const result = { status: 'passed', selection, observations }
    assert.equal(validateMission10SelectionEvidence(result, [phase]).length, 1)
    assert.equal(selection[0].checks.length, 6)
    const corrupt = structuredClone(result), first = corrupt.observations.find(o => o.label.endsWith('single selected'))
    first.selectionState.people.find(p => p.id === 116).owners.native.selectionFlags ^= 1
    assert.throws(() => validateMission10SelectionEvidence(corrupt, [phase]))
  }
})
