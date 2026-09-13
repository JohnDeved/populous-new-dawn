import constants from './original-constants.json' with { type: 'json' }
import { createLivePerson, registerLivePerson, type LivePerson } from './live-people.ts'
import { nativePersonModel } from './live-combat.ts'
import { positionDistance } from './native-math.ts'
import { removeObjectFromCell } from './object-cells.ts'
import { unitAnimationSource } from './selection-runtime.ts'
import { sound } from './world-effects.ts'
import { addUnit } from './world-state.ts'
import { nativePosition } from './world-terrain-runtime.ts'
import { releaseTasks } from './world-tasks.ts'
import type { Point, Team, Unit, World } from './world-types.ts'

const SHIELD_TURNS = constants.SHIELD_COUNT_X8 * 8
const INVISIBILITY_TURNS = constants.INVISIBLE_COUNT_X8 * 8
const HYPNOTISE_COUNT = constants.HYPNO_COUNT_X8

function retainedPeople(u: Unit) {
  return [
    ...new Set([u.native, u.flight, u.fight?.motion, u.entry?.person, u.builder?.person]),
  ].filter(Boolean) as LivePerson[]
}

function replaceHypnotisedUnit(w: World, source: Unit, team: Team, originalTeam?: Team) {
  const slot = w.units.indexOf(source)
  if (slot < 0) return
  const position = { x: source.x, z: source.z },
    { hp, cargo, heading, kind } = source,
    people = retainedPeople(source)
  releaseTasks(w, source)
  for (const p of people) if (p.flags2 & 0x20000) removeObjectFromCell(w.objectCells, p)
  w.objectCells.objects.delete(source.id)
  w.selected = w.selected.filter(id => id !== source.id)
  const replacement = addUnit(w, team, kind, position)
  Object.assign(replacement, { hp, cargo, heading })
  replacement.native = createLivePerson(w, replacement)
  if (originalTeam) {
    replacement.hypnotise = {
      originalTeam,
      remaining: HYPNOTISE_COUNT,
      counter: replacement.native.counter,
    }
    replacement.native.flags4 = (replacement.native.flags4 | 0x4000) >>> 0
  }
  registerLivePerson(w, replacement.native)
  w.units[slot] = replacement
  w.units.pop()
  return replacement
}

export function applyHypnotise(w: World, point: Point, team: Team) {
  const center = nativePosition(w, point),
    x = (center.x >>> 8) & 254,
    y = (center.y >>> 8) & 254,
    order = new Map<string, number>()
  for (const dy of [-2, 0, 2])
    for (const dx of [-2, 0, 2]) order.set(`${(x + dx) & 254}:${(y + dy) & 254}`, order.size)
  const targets = w.units
    .map((u, index) => {
      const p = nativePosition(w, u),
        scan = order.get(`${(p.x >>> 8) & 254}:${(p.y >>> 8) & 254}`)
      return { u, p, scan: scan === undefined ? -1 : scan * w.units.length + index }
    })
    .filter(({ u, scan }) => {
      const p = unitAnimationSource(u)
      return (
        scan >= 0 &&
        u.inside === null &&
        ![1, 7, 8].includes(nativePersonModel(u)) &&
        u.team !== team &&
        !((p?.flags4 ?? 0) & 0x1000) &&
        !u.invisibility
      )
    })
    .toSorted(
      (a, b) => positionDistance(a.p, center) - positionDistance(b.p, center) || b.scan - a.scan
    )
    .slice(0, constants.HYPNO_NUM_PEOPLE)
  for (const { u } of targets) {
    const p = unitAnimationSource(u)
    if ((p?.flags4 ?? 0) & 0x800) {
      releaseTasks(w, u)
      if ((p?.flags2 ?? 0) & 0x20000) removeObjectFromCell(w.objectCells, p as LivePerson)
      w.objectCells.objects.delete(u.id)
      w.selected = w.selected.filter(id => id !== u.id)
      w.units.splice(w.units.indexOf(u), 1)
      continue
    }
    replaceHypnotisedUnit(w, u, team, u.hypnotise?.originalTeam ?? u.team)
  }
  return targets
}

export function stepUnitHypnotise(w: World) {
  for (const u of [...w.units]) {
    const status = u.hypnotise
    if (!status || u.hp <= 0) continue
    status.counter = (status.counter + 1) & 255
    if (status.counter & 7 || --status.remaining > 0) continue
    const tribe = status.originalTeam === 'blue' ? 0 : status.originalTeam === 'red' ? 1 : -1
    if (tribe >= 0 && w.manaTribes[tribe].defeatTimer) {
      delete u.hypnotise
      for (const p of retainedPeople(u)) p.flags4 = (p.flags4 & ~0x4000) >>> 0
    } else replaceHypnotisedUnit(w, u, status.originalTeam)
  }
}

export function restoreDeadHypnotisedUnit(u: Unit) {
  if (!u.hypnotise) return
  u.team = u.hypnotise.originalTeam
  delete u.hypnotise
  for (const p of retainedPeople(u)) {
    p.tribe = u.team === 'blue' ? 0 : u.team === 'red' ? 1 : -1
    p.flags4 = (p.flags4 & ~0x4000) >>> 0
  }
}

function setUnitShield(u: Unit, turns: number) {
  u.shield = turns
  for (const p of [u.native, u.flight, u.fight?.motion, u.entry?.person, u.builder?.person])
    if (p) p.flags3 = turns ? (p.flags3 | 0x80000) >>> 0 : (p.flags3 & ~0x80000) >>> 0
}

export function stepUnitShields(w: World) {
  for (const u of w.units) if (u.shield) setUnitShield(u, u.shield - 1)
}

export function shieldFollowers(w: World, point: Point, team: Team) {
  const center = nativePosition(w, point)
  // ponytail: nearest candidates approximate the unavailable native radius-3
  // land-list callbacks; replace this ordering when 00515e30 is exportable.
  const targets = w.units
    .filter(
      u =>
        u.team === team &&
        u.kind !== 'shaman' &&
        u.hp > 0 &&
        u.inside === null &&
        positionDistance(nativePosition(w, u), center) <= 3 * 512
    )
    .toSorted(
      (a, b) =>
        positionDistance(nativePosition(w, a), center) -
        positionDistance(nativePosition(w, b), center)
    )
    .slice(0, constants.SHIELD_NUM_PEOPLE)
  for (const u of targets) setUnitShield(u, SHIELD_TURNS)
  return targets
}

export function setUnitInvisibility(w: World, u: Unit, turns: number) {
  const wasInvisible = !!u.invisibility,
    renderFlag = unitInvisibilityRenderBit(w, u)
  u.invisibility = turns
  for (const p of new Set([
    u.native,
    u.flight,
    u.fight?.motion,
    u.entry?.person,
    u.builder?.person,
  ])) {
    if (!p) continue
    if (turns) {
      if (!wasInvisible) p.invisibilityRender = p.renderFlags & renderFlag ? 0 : renderFlag
      p.flags4 = (p.flags4 | 0x1000) >>> 0
      p.renderFlags |= renderFlag
    } else {
      if (p.invisibilityRender) p.renderFlags &= ~p.invisibilityRender
      delete p.invisibilityRender
      p.flags4 = (p.flags4 & ~0x1000) >>> 0
    }
  }
}

export function unitInvisibleToPlayer(w: World, u: Unit) {
  return !!(
    u.invisibility &&
    u.team !== (w.manaWorld.playerTribe === 0 ? 'blue' : 'red') &&
    !(w.manaTribes[w.manaWorld.playerTribe]?.flags2 & 8)
  )
}

export function unitInvisibilityRenderBit(w: World, u: Unit) {
  return u.team !== (w.manaWorld.playerTribe === 0 ? 'blue' : 'red') &&
    !(w.manaTribes[w.manaWorld.playerTribe]?.flags2 & 8)
    ? 16
    : 0x4000
}

export function unitInvisibilityRenderFlag(w: World, u: Unit) {
  if (!u.invisibility) return 0
  const flag = unitInvisibilityRenderBit(w, u)
  if (flag !== 0x4000 || u.team !== (w.manaWorld.playerTribe === 0 ? 'blue' : 'red')) return flag
  const timer = Math.ceil(u.invisibility! / 8),
    mask = timer < 6 ? 1 : timer < 14 ? 2 : timer < 24 ? 4 : 0
  return mask && !(w.turn & mask) ? 0 : flag
}

export function revealUnitInvisibility(w: World, u: Unit, audible = true) {
  if (!u.invisibility) return false
  if (audible) sound(w, 0x35, u, u.id)
  setUnitInvisibility(w, u, 0)
  return true
}

export function stepUnitInvisibility(w: World) {
  for (const u of w.units)
    if (u.invisibility && u.invisibility <= 1) revealUnitInvisibility(w, u)
    else if (u.invisibility) u.invisibility--
}

export function invisibilityFollowers(w: World, point: Point, team: Team) {
  const center = nativePosition(w, point),
    x = (center.x >>> 8) & 254,
    y = (center.y >>> 8) & 254,
    order = new Map<string, number>()
  for (const dy of [-2, 0, 2])
    for (const dx of [-2, 0, 2]) order.set(`${(x + dx) & 254}:${(y + dy) & 254}`, order.size)
  const targets = w.units
    .map((u, index) => {
      const p = nativePosition(w, u),
        scan = order.get(`${(p.x >>> 8) & 254}:${(p.y >>> 8) & 254}`)
      return { u, p, scan: scan === undefined ? -1 : scan * w.units.length + index }
    })
    .filter(
      ({ u, scan }) =>
        scan >= 0 &&
        u.team === team &&
        u.kind !== 'shaman' &&
        u.hp > 0 &&
        u.inside === null &&
        !u.invisibility &&
        !((unitAnimationSource(u)?.flags4 ?? 0) & 0x1000)
    )
    .toSorted(
      (a, b) => positionDistance(a.p, center) - positionDistance(b.p, center) || b.scan - a.scan
    )
    .slice(0, constants.INVIS_NUM_PEOPLE)
    .map(({ u }) => u)
  for (const u of targets) setUnitInvisibility(w, u, INVISIBILITY_TURNS)
  return targets
}
