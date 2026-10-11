import { residentPerson } from './building-resident.ts'
import type { LivePerson } from './live-people.ts'
import type { Unit, World } from './world-types.ts'

export type PersonClock =
  | { mode: 'allocation'; next: number }
  | { mode: 'legacy'; reason: 'checkpoint' | 'armageddon' }

type Pass = { people: Unit[]; members: Set<Unit>; visited: Set<Unit> }
// A primary traversal, not a world-turn stamp. No checkpoint occurs inside tick.
const passes = new WeakMap<World, Pass>()
const byte = (n: unknown): n is number => Number.isInteger(n) && Number(n) >= 0 && Number(n) < 256
export const hasPersonClock = (w: World) => w.personClock?.mode === 'allocation'

export function allocatePersonCounter(w: World) {
  if (w.personClock?.mode !== 'allocation') return undefined
  const counter = w.personClock.next
  if (!byte(counter)) throw new Error('Invalid person allocation clock')
  w.personClock.next = (counter + 1) & 255
  return counter
}

export function personCounter(w: World, u: Unit) {
  if (!hasPersonClock(w)) return (w.turn - 1) & 255
  if (!byte(u.personCounter)) throw new Error('Missing retained person clock')
  return u.personCounter
}

export function projectPersonCounter(w: World, u: Unit, p: Pick<LivePerson, 'counter'>) {
  if (hasPersonClock(w)) p.counter = personCounter(w, u)
}

function projectOwners(w: World, u: Unit) {
  if (u.hypnotise) u.hypnotise.counter = personCounter(w, u)
  for (const p of [
    u.native,
    u.flight,
    u.entry?.person,
    u.builder?.person,
    u.fight?.motion,
    residentPerson(w, u),
    w.pathfinding.people.get(u.id),
  ])
    if (p) projectPersonCounter(w, u, p)
}

// Active native states, including seated/reserved/casting/training people, own
// visits. Legacy living people have an implicit active record. A passive Hut
// resident keeps its active record clock without owning movement/rendering.
// Dead flight, Tornado and electrocution still have dispatched state bodies.
export function hasPrimaryPersonVisit(w: World, u: Unit) {
  const p =
    u.flight ??
    u.fight?.motion ??
    u.native ??
    u.entry?.person ??
    u.builder?.person ??
    residentPerson(w, u)
  if (u.hp <= 0 && !u.flight && ![24, 44].includes(u.native?.state ?? 0)) return false
  if (p) return p.state !== 0
  return u.inside === null
}

export function beginPrimaryPersonPass(w: World) {
  if (!hasPersonClock(w)) return
  if (passes.has(w)) throw new Error('Nested primary person pass')
  const people = [...w.units]
  passes.set(w, { people, members: new Set(people), visited: new Set() })
}

export function primaryPersonMembers(w: World) {
  return hasPersonClock(w) ? (passes.get(w)?.people ?? w.units) : w.units
}

export function isPrimaryPersonMember(w: World, u: Unit) {
  return (
    !hasPersonClock(w) || ((!passes.has(w) || passes.get(w)!.members.has(u)) && w.units.includes(u))
  )
}

// Controller calls outside a composed pass are explicit standalone visits.
// Inside it, physics/state/route handoffs share the same pre-dispatch increment.
export function visitPrimaryPerson(w: World, u: Unit, p?: Pick<LivePerson, 'counter'>) {
  if (!hasPersonClock(w)) {
    if (p) p.counter = (p.counter + 1) & 255
    return
  }
  const pass = passes.get(w)
  if (isPrimaryPersonMember(w, u) && hasPrimaryPersonVisit(w, u) && !pass?.visited.has(u)) {
    u.personCounter = (personCounter(w, u) + 1) & 255
    pass?.visited.add(u)
    projectOwners(w, u)
  }
  if (p) projectPersonCounter(w, u, p)
}

export function visitedPrimaryPerson(w: World, u: Unit) {
  return hasPersonClock(w) && !!passes.get(w)?.visited.has(u)
}

export function endPrimaryPersonPass(w: World) {
  passes.delete(w)
}

// The browser arena reconstructs Shamans that the original retains. Until that
// mapping is repaired, the entire world permanently resumes the legacy policy.
export function useLegacyPersonClock(w: World, reason: 'checkpoint' | 'armageddon') {
  w.personClock = { mode: 'legacy', reason }
  for (const u of w.units) delete u.personCounter
  endPrimaryPersonPass(w)
}

export function restorePersonClock(w: World) {
  if (!w.personClock || w.personClock.mode === 'legacy') {
    useLegacyPersonClock(w, w.personClock?.reason ?? 'checkpoint')
    return
  }
  if (
    w.personClock.mode !== 'allocation' ||
    !byte(w.personClock.next) ||
    w.units.some(u => !byte(u.personCounter))
  )
    throw new Error('Incomplete saved person allocation clock')
  // Unit counters are authoritative; cached adapters cannot overwrite them.
  for (const u of w.units) projectOwners(w, u)
}
