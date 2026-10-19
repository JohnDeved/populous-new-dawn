// Frozen exhaustive live adapter from main 55770f1a, before issue #656.
// Deliberately retain full roster/fight scans and independent cell ordering.
// This is a correctness oracle, never a production fallback or benchmark gain claim.
import { tribeForTeam } from '../../app/world-types.ts'
import { buildingModel } from '../../app/building-shapes.ts'
import { nativeUnitModel } from '../../app/unit-kinds.ts'
import { objectsInCell } from '../../app/object-cells.ts'
const engagementCellDelta = (a, b) => ((((a >>> 8) & 254) - ((b >>> 8) & 254) + 128) & 255) - 128
const inEngagementArea = (source, target, range) => !!range &&
  Math.abs(engagementCellDelta(source.x, target.x)) <= Math.trunc(range / 2) * 2 &&
  Math.abs(engagementCellDelta(source.y, target.y)) <= Math.trunc(range / 2) * 2
export const nativePersonModel = (u                             ) =>
  u.team === 'wild' ? 1 : nativeUnitModel(u.kind)
export const nativePersonTribe = (u                    ) => tribeForTeam(u.team)
const position = (u                          ) => ({
  x: Math.round((u.x + 8) * 256) & 65535,
  y: Math.round((-u.z - 8) * 256) & 65535,
})
const reservation = (owner                                           ) =>
  owner.attackReservation ?? { flags4: 0, reactionTimer: 0, reactionDuration: 0 }

export function combatPerson(u      )               {
  const p = u.builder?.person ?? u.flight ?? u.fight?.motion ?? u.native ?? u.entry?.person
  const held = reservation(u)
  let state = u.path.length || u.work !== null ? 10 : 17
  if (u.fight) state = 25
  return {
    x: Math.round((u.x + 8) * 256) & 65535,
    y: Math.round((-u.z - 8) * 256) & 65535,
    reactionTimer: held.reactionTimer,
    reactionDuration: held.reactionDuration,
    id: u.id,
    class: 1,
    model: nativePersonModel(u),
    tribe: nativePersonTribe(u),
    flags2: (p?.flags2 ?? 0) | (u.inside === null ? 0 : 0x800000),
    flags4:
      (p?.flags4 ?? 0) |
      held.flags4 |
      (u.lift > 0 ? 0x400 : 0) |
      (u.invisibility ? 0x1000 : 0) |
      (u.ghost ? 0x800 : 0),
    state: p?.state ?? state,
    life: Math.round(u.hp * 20),
    vehicle: p?.vehicle ?? 0,
    group: u.fight?.group ?? 0,
    disguise: p?.disguise ?? 0,
  }
}

// Adapt existing live ownership without allocating native sprite/state records.
// ponytail: ordinary people/fights still use browser list ties; retain native
// cell-chain order where owned, and replace the fallback with mixed-class allocation.
export function exhaustiveCombatWorld(w       , source              , range        ) {
  const objects = new Map                      ()
  const owners = new Map                                                   ()
  const cells = new Map                        ()
  const add = (o              , owner                                , insert         ) => {
    objects.set(o.id, o)
    owners.set(o.id, owner)
    if (!insert) return
    const cell = (o.y >> 9) * 128 + (o.x >> 9)
    const row = cells.get(cell) ?? []
    row.push(o)
    cells.set(cell, row)
  }
  const radius = Math.trunc(range / 2) * 2
  for (const u of w.units) {
    if (!(u.hp > 0) || !range) continue
    // Reject on each wrapped cell axis before constructing a target record.
    // Most distant people need neither a Y projection nor a combat snapshot.
    const x = Math.round((u.x + 8) * 256)
    if (!(Math.abs(engagementCellDelta(source.x, x)) <= radius)) continue
    const y = Math.round((-u.z - 8) * 256)
    if (Math.abs(engagementCellDelta(source.y, y)) <= radius) add(combatPerson(u), u, true)
  }
  for (const fight of w.fights) {
    const point = position(fight)
    if (!inEngagementArea(source, point, range)) continue
    const members = fight.members.map(id => w.units.find(u => u.id === id)).filter(u => !!u)
    for (const u of members) if (!objects.has(u.id)) add(combatPerson(u), u, false)
    add(
      {
        ...point,
        ...reservation(fight),
        id: fight.id,
        class: 10,
        model: fight.encounter ? 9 : 8,
        tribe: -1,
        flags2: 0,
        members: fight.slots ?? [
          ...fight.members,
          ...Array(Math.max(0, 6 - fight.members.length)).fill(0),
        ],
        tribes: fight.tribes ?? [...new Set(members.map(nativePersonTribe))],
        center: fight.center ?? fight.members[0],
      },
      fight,
      true
    )
  }
  const buildings = new Map                        ()
  const world                    = {
    land: w.land,
    objects,
    alliances: w.outcome.alliances,
    playerTypes: w.manaTribes.map(t => t.playerType),
    gameFlags: w.manaWorld.gameFlags,
    cellObjects: cell => {
      const row = cells.get(cell)
      if (!row) return []
      const ordered                 = []
      // Combat scans use dense landscape indices; the native chain API takes
      // packed even-byte X/Y coordinates instead.
      const packedCell = ((cell & 127) << 1) | ((cell >>> 7) << 9)
      for (const indexed of objectsInCell(w.objectCells, packedCell)) {
        const object = objects.get(indexed.id)
        if (object && row.includes(object)) ordered.push(object)
      }
      return ordered.length ? [...ordered, ...row.filter(o => !ordered.includes(o))] : row
    },
    buildingAt: cell => {
      const id = w.land.buildingIds[cell] & 1023
      if (!id) return
      const cached = buildings.get(id)
      if (cached) return cached
      const b = w.buildings.find(candidate => (candidate.id & 1023) === id && candidate.hp > 0)
      if (!b) return
      const record                 = {
        ...position(b),
        ...reservation(b),
        id: b.id,
        class: b.preparation ? 9 : 2,
        model: buildingModel(b),
        tribe: nativePersonTribe(b),
        flags2: 0,
        planKind: 0, // Ordinary live plans; native special plan kinds remain unallocated.
        activity: b.admission?.activity ?? 0,
      }
      buildings.set(id, record)
      owners.set(b.id, b)
      return record
    },
  }
  return { world, owners }
}

