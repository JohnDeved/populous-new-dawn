import test from 'node:test'
import assert from 'node:assert/strict'
import { createWorld, browserPosition, command, supportsFollower } from '../app/model.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { unloadLiveVehicle } from '../app/vehicle-panel-runtime.ts'
import { prepareVehiclePanelFixture, vehicleRosterSnapshot, advanceVehicleRoster } from '../scripts/browser-vehicle-fixture.mjs'

function fixture(model = 1) {
  const w = createWorld(22), v = w.vehicles.find(v => v.model === model)
  const prepared = prepareVehiclePanelFixture(w, v)
  assert.deepEqual(prepared.errors, [])
  return { w, v, prepared, roster: prepared.roster }
}
for (const model of [1, 3]) test(`supplied model${model} geometry retains terrain and living crew across both checkpoints`, () => {
  let w = createWorld(22), v = w.vehicles.find(v => v.model === model)
  const terrain = structuredClone(w.land), authored = w.units.map(u => u.id), original = { ...v }, turn = w.turn
  const prepared = prepareVehiclePanelFixture(w, v), { roster } = prepared
  assert.deepEqual(prepared.errors, [])
  assert.equal(w.turn, turn)
  assert.deepEqual(w.land, terrain)
  assert.deepEqual(w.units.slice(0, authored.length).map(u => u.id), authored)
  assert.equal(v.heading, original.heading)
  assert.equal(v.id, original.id)
  assert.ok(prepared.staged.people.every(p => p.supported && p.hp > 0))
  w.selected = roster.map(u => u.id)
  assert.equal(command(w, { ...browserPosition(v), id: v.id }), true)
  const boarded = advanceVehicleRoster(w, v, roster, 'boarding')
  assert.deepEqual(boarded.errors, [])
  assert.equal(boarded.count, 2)
  assert.deepEqual(boarded.ids, roster.map(u => u.id))
  assert.ok(boarded.people.every(p => p.vehicle === v.id && p.hp > 0))
  w = migrateCheckpoint(structuredClone(w)); v = w.vehicles.find(u => u.id === original.id)
  assert.deepEqual(vehicleRosterSnapshot(w, v, roster).errors, [])
  assert.equal(unloadLiveVehicle(w, v), true)
  assert.ok(roster.every(({ id }) => w.units.find(u => u.id === id).flight))
  w = migrateCheckpoint(structuredClone(w)); v = w.vehicles.find(u => u.id === original.id)
  const landed = advanceVehicleRoster(w, v, roster, 'landing')
  assert.deepEqual(landed.errors, [])
  assert.ok(landed.turns > 1 && landed.turns < 200)
  assert.ok(landed.people.every(p => p.present && p.hp > 0 && !p.flight && !p.vehicle && p.supported && p.cargo === 0))
  assert.equal(v.passengerCount, 0)
  assert.deepEqual(w.land, terrain)
  console.log(JSON.stringify({ model, prepared, boarded, landed }))
})
test('unsupported exit fails admission without spawning, moving or ticking', () => {
  const w = createWorld(22), v = w.vehicles.find(v => v.model === 1)
  w.land.flags.fill(4)
  const before = structuredClone(w), result = prepareVehiclePanelFixture(w, v)
  assert.ok(result.errors.includes('fixture exit does not support a follower'))
  assert.deepEqual(result.roster, [])
  assert.deepEqual(w, before)
})
for (const failure of ['missing', 'dead', 'wrong vehicle', 'wrong cell', 'changed cargo']) test(`roster ${failure} fails before progression without filtering`, () => {
  const { w, v, roster } = fixture()
  w.selected = roster.map(u => u.id); command(w, { ...browserPosition(v), id: v.id })
  const boarded = advanceVehicleRoster(w, v, roster, 'boarding'); assert.deepEqual(boarded.errors, [])
  const u = w.units.find(u => u.id === roster[0].id)
  if (failure === 'missing') w.units = w.units.filter(p => p !== u)
  if (failure === 'dead') u.hp = 0
  if (failure === 'wrong vehicle') u.native.vehicle = 999
  if (failure === 'wrong cell') w.objectCells.objects.set(u.id, { ...u.native })
  if (failure === 'changed cargo') u.cargo++
  const turn = w.turn, failed = advanceVehicleRoster(w, v, roster, 'boarding')
  assert.ok(failed.errors.length)
  assert.equal(failed.people.length, 2)
  assert.deepEqual(failed.people.map(p => p.id), roster.map(p => p.id))
  assert.equal(failed.turns, 0); assert.equal(w.turn, turn)
})
test('same-ID Unit replacement is distinct from the staged owner', () => {
  const { w, v, roster } = fixture(), owners = roster.map(({ id }) => w.units.find(u => u.id === id))
  w.units = w.units.map(u => u === owners[0] ? { ...u } : u)
  assert.ok(vehicleRosterSnapshot(w, v, roster, owners).errors.includes(`replaced Unit owner ${owners[0].id}`))
})

test('first lost crew turn is retained and stops further simulation', () => {
  const { w, v, roster } = fixture(), u = w.units.find(u => u.id === roster[0].id)
  Object.assign(u, browserPosition(v))
  assert.equal(supportsFollower(w, u), false)
  const before = w.turn, result = advanceVehicleRoster(w, v, roster, 'boarding')
  assert.equal(result.turns, 1)
  assert.equal(w.turn, before + 1)
  assert.ok(result.errors.length)
  assert.equal(result.people.length, 2)
  assert.deepEqual(result.people.map(p => p.id), roster.map(p => p.id))
  assert.ok(!result.people[0].present || result.people[0].hp <= 0)
})
test('missing vehicle retains every roster row and fails closed', () => {
  const { w, roster } = fixture(), result = vehicleRosterSnapshot(w, undefined, roster)
  assert.ok(result.errors.includes('vehicle owner removed/replaced/inactive'))
  assert.equal(result.vehicle, null)
  assert.equal(result.people.length, 2)
})
