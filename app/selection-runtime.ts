import { type Unit, type World } from './world-types.ts'
import { BuilderTask } from './building-workers.ts'
import { buildingModel } from './building-shapes.ts'
import { type UnitKind } from './unit-kinds.ts'
import { nativePosition } from './world-terrain-runtime.ts'
import { nativePersonModel } from './live-combat.ts'
import { type HudSelectionMode, selectHudPeople } from './hud-selection.ts'
import { sound } from './world-effects.ts'
import { markPersonSelected, clickPersonSelection, selectedPersonVoice, canDragPerson, selectedGroupVoices } from './person-selection.ts'
import { dragCommandCorners, unwrapDragCorners, dragCellBounds, inDragCells, inDragSelection } from './drag-selection.ts'
import { currentPersonOrder, deselectPerson } from './person-orders.ts'

export function builderActivity(u: Unit) {
  const task = u.builder?.task
  return (
    task === BuilderTask.Approach ||
    task === BuilderTask.Work ||
    task === BuilderTask.Fetch ||
    task === BuilderTask.Level ||
    task === BuilderTask.ClearScenery ||
    task === BuilderTask.ClearPeople ||
    task === BuilderTask.Leave
  )
}
export function unitAnimationSource(u: Unit) {
  if (u.flight) return u.flight
  if (u.fight?.action === 'encounter') return u.fight.motion!
  if (u.fight?.motion && ['walk', 'idle'].includes(u.fight.animation ?? '')) return u.fight.motion
  if (
    u.native &&
    (u.native.state !== 10 ||
      [3, 6, 17, 19, 21, 27, 30, 31, 32, 33].includes(u.native.commandStatus))
  )
    return u.native
  if (u.entry) return u.entry.person
  return builderActivity(u) && !u.fight && !u.fighting && !u.casting && !u.lift
    ? (u.builder?.person ?? null)
    : null
}

export function selectionBuilding(w: World, point: { x: number; y: number }) {
  const cell = ((point.y & 65535) >> 9) * 128 + ((point.x & 65535) >> 9)
  const b =
    w.land.flags[cell] & 512
      ? w.buildings.find(b => b.id === (w.land.buildingIds[cell] & 1023))
      : undefined
  return b && { model: buildingModel(b), state: b.damageState?.state ?? (b.progress === 1 ? 2 : 1) }
}

export function canOrder(u: Unit) {
  return u.hp > 0 && !((unitAnimationSource(u)?.flags2 ?? 0) & 0x100000)
}

export function select(w: World, kind: UnitKind | 'all') {
  setSelection(
    w,
    w.units
      .filter(u => u.team === 'blue' && canOrder(u) && (kind === 'all' || u.kind === kind))
      .map(u => u.id)
  )
  w.mode = null
}

export function selectionPeople(w: World, units = w.units) {
  const selected = new Set(w.selected)
  return units
    .filter(u => u.team === 'blue' && u.hp > 0)
    .map(u => {
      // Selection must not create a simulation owner before a real controller handoff.
      const p = unitAnimationSource(u) ??
        u.native ??
        u.entry?.person ??
        u.builder?.person ?? {
          id: u.id,
          flags3: 0,
          flags4: 0,
          selectionFlags: 0,
        }
      // The displayed roster owns selection until every native input producer is live.
      p.selectionFlags = (p.selectionFlags & ~128) | (selected.has(u.id) ? 128 : 0)
      return p
    })
}

// HUD queries read active positions without taking ownership of legacy simulation.
export function hudPeople(w: World) {
  const selected = new Set(w.selected)
  return w.units
    .filter(u => u.team === 'blue' && u.hp > 0)
    .map(u => {
      const active = unitAnimationSource(u) ?? u.native ?? u.entry?.person
      const source = active ?? u.builder?.person
      const point = active ?? nativePosition(w, u)
      return {
        id: u.id,
        model: nativePersonModel(u),
        x: point.x,
        y: point.y,
        assignment: source?.assignment ?? 0,
        flags3: source?.flags3 ?? 0,
        flags4: source?.flags4 ?? 0,
        selectionFlags: ((source?.selectionFlags ?? 0) & ~128) | (selected.has(u.id) ? 128 : 0),
        source,
      }
    })
}

export function selectFollowers(
  w: World,
  model: number,
  point: { x: number; y: number },
  mode: HudSelectionMode
) {
  const people = hudPeople(w)
  const result = selectHudPeople(people, model, point, mode, !!(w.castingTribes[0].flags & 128))
  for (const p of people)
    if (p.source) {
      p.source.flags3 = p.flags3
      p.source.selectionFlags = p.selectionFlags
    }
  w.selected = people.filter(p => p.selectionFlags & 128).map(p => p.id)
  w.mode = null
  const speaker = w.units.find(u => u.id === result.speaker)
  if (speaker) for (const cue of result.cues) sound(w, cue, speaker)
}

export function setSelection(w: World, ids: number[]) {
  const selected = new Set(ids)
  const people = selectionPeople(w)
  for (const p of people) {
    const next = selected.has(p.id) && !(p.flags4 & 128)
    if (next !== !!(p.selectionFlags & 128)) markPersonSelected(p, next)
  }
  w.selected = people.filter(p => p.selectionFlags & 128).map(p => p.id)
}

export function selectUnit(w: World, id: number, extend: boolean) {
  const people = selectionPeople(w)
  const newlySelected = clickPersonSelection(people, id, extend)
  w.selected = people.filter(p => p.selectionFlags & 128).map(p => p.id)
  if (newlySelected) {
    const u = w.units.find(unit => unit.id === id)!
    sound(w, selectedPersonVoice(nativePersonModel(u)), u)
  }
}

export function selectArea(
  w: World,
  start: { x: number; y: number },
  packed: number,
  extend: boolean
) {
  const wrapped = dragCommandCorners(start, packed)
  const corners = unwrapDragCorners(wrapped),
    bounds = dragCellBounds(wrapped, (packed & 1023) * 2)
  const people = selectionPeople(w)
  const ids = new Set(
    w.units
      .filter(u => {
        if (u.team !== 'blue' || u.hp <= 0) return false
        const active = unitAnimationSource(u) ?? u.native ?? u.entry?.person
        const p = active ?? u.builder?.person
        // Registered native occupants retain their actual land-list membership.
        // Legacy people have no list owner yet; keep their existing occupancy gate.
        if (p && w.objectCells.objects.get(u.id) === p) {
          if (!(p.flags2 & 0x20000)) return false
        } else if (u.inside !== null) return false
        const point = active ?? nativePosition(w, u)
        if (!inDragCells(point, bounds) || !inDragSelection(point, corners)) return false
        if (!p) return true
        return canDragPerson(
          p,
          currentPersonOrder(w.buildingOrders, p),
          selectionBuilding(w, point)
        )
      })
      .map(u => u.id)
  )
  const eligible = new Set(people.filter(p => ids.has(p.id) && !(p.flags4 & 128)).map(p => p.id))
  // The original clears the previous group only after finding an eligible member.
  if (!eligible.size) return
  if (!extend) {
    w.orderCursor = 0
    for (const p of people) markPersonSelected(p, false)
  }
  for (const p of people) if (eligible.has(p.id)) markPersonSelected(p, true)
  w.selected = people.filter(p => p.selectionFlags & 128).map(p => p.id)
  const selected = new Set(w.selected),
    group = w.units.filter(u => selected.has(u.id))
  const speaker = w.units.findLast(u => eligible.has(u.id))!
  for (const cue of selectedGroupVoices(group.map(nativePersonModel))) sound(w, cue, speaker)
}

// Native right-click/Escape cancels a targeting mode before clearing followers.
export function cancelInteraction(w: World) {
  if (w.mode) {
    w.mode = null
    return
  }
  w.orderCursor = 0
  if (!w.selected.length) return
  const selected = new Set(w.selected)
  for (const u of w.units) {
    if (u.team !== 'blue') continue
    // The displayed roster still owns selection across the legacy/native boundary.
    // Clear every retained representation so resuming work cannot resurrect it.
    for (const p of new Set([
      u.native,
      u.flight,
      u.fight?.motion,
      u.entry?.person,
      u.builder?.person,
    ])) {
      if (!p) continue
      p.selectionFlags = (p.selectionFlags & ~128) | (selected.has(u.id) ? 128 : 0)
      deselectPerson(p)
    }
  }
  w.selected = []
}
