import { addUnit, browserPosition, supportsFollower, tick } from '../app/model.ts'
import { vehicleExit } from '../app/live-vehicles.ts'
import { vehicleReady, vehicleCanDisembark } from '../app/vehicle-routing.ts'
import { liveVehicleCellObjects } from '../app/live-vehicles.ts'
import { terrainPointHeight } from '../app/native-terrain.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { removeObjectFromCell, deleteCellObject } from '../app/object-cells.ts'

const pose = v => v ? ({ id: v.id, model: v.model, team: v.team, x: v.x, y: v.y, h: v.h,
  heading: v.heading, active: v.active, speed: v.speed, life: v.life,
  navigationFlags: v.navigationFlags, count: v.passengerCount, ids: [...v.passengers] }) : null

// Supplied geometry, not a replay of the ordinary Mission22 voyage. The unchanged
// mission22 test identifies this coast through vehicleCanDisembark. Keep terrain,
// authored craft identity/heading and ordinary boarding/unload owners intact.
export function prepareVehiclePanelFixture(w, v, remove = []) {
  if (!v) return { before: null, errors: ['vehicle owner missing'], roster: [] }
  const before = pose(v), errors = []
  if (!v.active || v.life <= 0 || v.passengerCount) errors.push('craft must be active, living and empty')
  for (const id of remove) {
    const u = w.units.find(u => u.id === id)
    if (!u || u.hp <= 0 || u.flight || u.native?.vehicle) errors.push(`prior crew ${id} is not living and settled`)
  }
  const target = v.model === 1 ? { x: 6912, y: 11520 } : { x: v.x, y: v.y }
  const candidate = { ...v, ...target, h: v.model === 1 ? terrainPointHeight(w.land, target) : v.h }
  const land = { flags: w.land.flags, categories: w.land.categories, cellObjects: cell => liveVehicleCellObjects(w, cell) }
  const exit = vehicleExit(w, candidate), point = browserPosition(exit.point)
  if (!vehicleCanDisembark(land, candidate, target)) errors.push('fixture coast fails disembark admission')
  if (!vehicleReady(w.land, candidate)) errors.push('fixture craft is not ready')
  if (!exit.found || !supportsFollower(w, point)) errors.push('fixture exit does not support a follower')
  if (errors.length) return { before, candidate: pose(candidate), exit, point, errors, roster: [] }
  // Class4 occupancy is the live vehicle collection, not the person objectCells chain.
  Object.assign(v, { x: candidate.x, y: candidate.y, h: candidate.h })
  for (const id of remove) {
    const person = w.objectCells.objects.get(id)
    if (person?.flags2 & 0x20000) removeObjectFromCell(w.objectCells, person)
    deleteCellObject(w.objectCells, id)
    w.pathfinding.people.delete(id)
  }
  w.units = w.units.filter(u => !remove.includes(u.id))
  w.selected = []
  const units = ['brave', 'warrior'].map(kind => addUnit(w, 'blue', kind, point))
  const roster = units.map(u => ({ id: u.id, kind: u.kind, team: u.team, cargo: u.cargo }))
  return { before, after: pose(v), exit, point, errors, roster,
    staged: vehicleRosterSnapshot(w, v, roster, units) }
}

// Every requested ID produces a row, including absent members. Native aliases may
// retire after landing; a present conflicting owner or seated unregistered owner
// is always an error. Keeping exact Unit refs catches same-ID replacement mid-step.
export function vehicleRosterSnapshot(w, v, roster, owners = null) {
  const errors = [], people = roster.map((expected, index) => {
    const u = w.units.find(u => u.id === expected.id)
    if (!u) { errors.push(`missing roster member ${expected.id}`); return { ...expected, present: false } }
    const mapped = w.pathfinding.people.get(u.id), cell = w.objectCells.objects.get(u.id), p = u.native ?? mapped
    if (owners && u !== owners[index]) errors.push(`replaced Unit owner ${u.id}`)
    if (u.hp <= 0) errors.push(`dead roster member ${u.id}`)
    if (u.team !== expected.team || u.kind !== expected.kind || u.cargo !== expected.cargo || (p && p.cargo !== expected.cargo * 100)) errors.push(`roster identity/cargo changed ${u.id}`)
    if (u.native && mapped && u.native !== mapped) errors.push(`pathfinding owner mismatch ${u.id}`)
    if (p && (p.id !== u.id || (cell && cell !== p))) errors.push(`native/cell owner mismatch ${u.id}`)
    if (p?.vehicle && (p.vehicle !== v?.id || !v?.passengers.includes(u.id) || cell !== p)) errors.push(`seat owner mismatch ${u.id}`)
    if (v?.passengers.includes(u.id) && (!u.native || u.native.vehicle !== v.id)) errors.push(`passenger native owner missing ${u.id}`)
    const order = p && currentPersonOrder(w.buildingOrders, p)
    return { id: u.id, present: true, kind: u.kind, team: u.team, hp: u.hp, cargo: u.cargo,
      x: u.x, z: u.z, supported: supportsFollower(w, u), flight: !!u.flight,
      vehicle: p?.vehicle ?? 0, native: p ? { id: p.id, class: p.class, state: p.state,
        x: p.x, y: p.y, h: p.h, vehicle: p.vehicle, cargo: p.cargo,
        commandStatus: p.commandStatus, commandCursor: p.commandCursor, commands: [...p.commands] } : null,
      aliases: { unitNative: !!u.native, pathfinding: !!mapped, objectCells: !!cell,
        pathfindingIsNative: !!mapped && mapped === u.native, cellIsNative: !!cell && cell === u.native },
      order: order ? { ...order } : null }
  })
  if (!v || w.vehicles.find(candidate => candidate.id === v.id) !== v || !v.active) errors.push('vehicle owner removed/replaced/inactive')
  return { turn: w.turn, selected: [...w.selected], vehicle: pose(v), people, errors }
}

export function advanceVehicleRoster(w, v, roster, phase) {
  if (!['boarding', 'landing'].includes(phase)) throw Error('Unknown vehicle fixture phase')
  const owners = roster.map(({ id }) => w.units.find(u => u.id === id))
  const before = vehicleRosterSnapshot(w, v, roster, owners)
  let after = before, turns = 0
  const pending = () => phase === 'boarding' ? v.passengerCount < roster.length : after.people.some(u => u.flight)
  const limit = phase === 'boarding' ? 120 : 200
  while (!after.errors.length && turns < limit && pending()) {
    tick(w, 1 / 12)
    turns++
    after = vehicleRosterSnapshot(w, v, roster, owners)
  }
  return { phase, turns, before, after, errors: after.errors, count: v?.passengerCount ?? null,
    ids: v ? [...v.passengers] : [], people: after.people }
}
