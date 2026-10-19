import type { LivePerson } from './live-people.ts'
import type { Building, Unit, World } from './world-types.ts'

// Passive storage never supplies an animation, simulation or cell-list owner.
// Require the physical slot, including during death/destruction cleanup.
export function residentPerson(w: Pick<World, 'buildings'>, u: Unit) {
  const { resident } = u,
    p = resident?.person
  if (
    !resident ||
    !p ||
    typeof p !== 'object' ||
    u.entry ||
    u.native ||
    u.flight ||
    u.fight?.motion ||
    u.builder?.person ||
    !Number.isInteger(resident.slot) ||
    resident.slot < 0 ||
    resident.slot >= 6 ||
    u.inside !== resident.building ||
    p.building !== resident.building ||
    p.id !== u.id ||
    p.class !== 1 ||
    !Array.isArray(p.commands) ||
    p.commands.length !== 8 ||
    p.commands.some(id => id !== 0) ||
    p.immediateCommand !== 0 ||
    !p.displacement ||
    ![p.displacement.x, p.displacement.y, p.displacement.h].every(Number.isFinite) ||
    ![
      p.model,
      p.state,
      p.life,
      p.flags2,
      p.flags3,
      p.flags4,
      p.x,
      p.y,
      p.h,
      p.assignment,
      p.renderFlags,
      p.angle,
      p.heading,
      p.turnAngle,
      p.anchorX,
      p.anchorY,
      p.anchorFlags,
      p.commandCursor,
    ].every(Number.isFinite)
  )
    return
  const admission = w.buildings.find(building => building.id === resident.building)?.admission
  if (
    !admission ||
    admission.id !== resident.building ||
    admission.occupants[resident.slot] !== u.id ||
    admission.occupants.slice(0, 6).filter(id => id === u.id).length !== 1
  )
    return
  return p
}

export function retainHutResident(w: World, u: Unit, b: Building, p: LivePerson) {
  if (
    b.kind !== 'hut' ||
    b.preparation ||
    b.progress !== 1 ||
    b.hp <= 0 ||
    u.hp <= 0 ||
    p.life <= 0
  )
    return
  const slot = b.admission?.occupants.slice(0, 6).indexOf(u.id) ?? -1
  if (slot < 0 || p.flags2 & 1) return
  u.resident = { building: b.id, slot, person: p }
  discardInvalidResident(w, u)
}

export function discardInvalidResident(w: Pick<World, 'buildings'>, u: Unit) {
  if (u.resident !== undefined && !residentPerson(w, u)) delete u.resident
}
