import rules from './original-rules.json' with { type: 'json' }
import type { Unit, World } from './world-types.ts'
import { nativePersonModel } from './live-combat.ts'
import { nativePosition } from './world-terrain-runtime.ts'
import { buildingModel } from './building-shapes.ts'
import { currentPersonOrder } from './person-orders.ts'
import { unitAnimationSource, builderActivity, selectionBuilding } from './selection-runtime.ts'
import { classifyFollowerTask, selectTaskFollowers, type FollowerTask } from './hud-tasks.ts'
import type { HudSelectionMode } from './hud-selection.ts'
import { markPersonSelected } from './person-selection.ts'
import { sound } from './world-effects.ts'

// Read the same controller precedence as the live turn. Legacy command adapters
// retain task ownership separately from a dormant native person/route record.
// Project their proved command identity; never allocate a simulation person here.
function taskCategory(w: World, u: Unit, source: ReturnType<typeof unitAnimationSource>) {
  const model = nativePersonModel(u),
    route = w.pathfinding.people.get(u.id),
    order = source && currentPersonOrder(w.buildingOrders, source)
  const classify = () =>
    classifyFollowerTask(
      source ?? undefined,
      source ? selectionBuilding(w, source)?.model : undefined,
      order || undefined
    )
  if (u.flight || u.fight?.motion || (source && ![1, 10, 17, 19].includes(source.state)))
    return classify()
  if (source?.state === 10 && order && !(order.flags & 1)) return classify()
  if (u.entry)
    return classifyFollowerTask(
      u.entry.person,
      selectionBuilding(w, u.entry.person)?.model,
      currentPersonOrder(w.buildingOrders, u.entry.person)
    )
  const building = w.buildings.find(b => b.id === (u.inside ?? u.work) && b.hp > 0)
  // Legacy checkpoint occupants still have an authoritative building owner.
  if (u.inside !== null && building)
    return classifyFollowerTask(
      {
        state: 21,
        model,
        commandStatus: 0,
        flags2: 0x800000,
        assignment: source?.assignment ?? 0,
        vehicle: source?.vehicle ?? 0,
      },
      buildingModel(building)
    )
  const independentRoute =
    u.path.length && (route !== source || !source || ![1, 17, 19].includes(source.state))
  let command = 0
  if (builderActivity(u)) command = 6
  else if (u.guard) command = 30
  else if (u.tree !== null || u.harvest || u.delivery) command = 7
  else if (building) command = 8
  else if (independentRoute) command = 3
  if (command)
    return classifyFollowerTask({
      state: 10,
      model,
      commandStatus: command,
      flags2: source?.flags2 ?? 0,
      assignment: source?.assignment ?? 0,
      vehicle: source?.vehicle ?? 0,
    })
  // Existing state10/status0 stays category0. Brand-new browser people have no
  // task owner yet; their first live resting visit establishes Idle normally.
  return classify()
}

export function hudTaskPeople(w: World) {
  const selected = new Set(w.selected)
  return w.units
    .filter(u => u.team === 'blue' && u.hp > 0)
    .map(u => {
      const active = unitAnimationSource(u),
        route = w.pathfinding.people.get(u.id),
        special = u.native && ![1, 10, 17, 19].includes(u.native.state) ? u.native : null,
        source =
          u.flight ??
          u.fight?.motion ??
          special ??
          u.entry?.person ??
          (route?.vehicle ? route : null) ??
          active ??
          u.native ??
          u.builder?.person ??
          route ??
          null,
        position = source?.vehicle ? source : (active ?? nativePosition(w, u))
      return {
        id: u.id,
        model: nativePersonModel(u),
        x: position.x,
        y: position.y,
        assignment: source?.assignment ?? 0,
        flags3: source?.flags3 ?? 0,
        flags4: source?.flags4 ?? 0x20000000 | (u.ghost ? 0x800 : 0),
        selectionFlags: ((source?.selectionFlags ?? 0) & ~128) | (selected.has(u.id) ? 128 : 0),
        category: taskCategory(w, u, source),
        vehicle: source?.vehicle ?? 0,
        source,
      }
    })
}

export function selectFollowerTask(
  w: World,
  model: number,
  category: FollowerTask,
  point: { x: number; y: number },
  mode: HudSelectionMode
) {
  const people = hudTaskPeople(w),
    byId = new Map(people.map(p => [p.id, p])),
    vehicles = new Map(w.vehicles.filter(v => v.active && v.passengerCount).map(v => [v.id, v]))
  const result = selectTaskFollowers(
    people,
    model,
    category,
    point,
    mode,
    !!(w.castingTribes[0].flags & 128),
    (p, selected) => {
      markPersonSelected(p, selected)
      if (!p.vehicle) return
      const vehicle = vehicles.get(p.vehicle)
      if (!vehicle) return
      for (const id of vehicle.passengers.slice(0, rules.vehicleCapacity[vehicle.model])) {
        const passenger = byId.get(id)
        if (passenger && passenger !== p) markPersonSelected(passenger, selected)
      }
    }
  )
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
