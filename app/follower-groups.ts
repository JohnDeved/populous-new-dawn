import rules from './original-rules.json' with { type: 'json' }
import { markPersonSelected } from './person-selection.ts'
import { hudPeople } from './selection-runtime.ts'
import { browserPosition } from './world-coordinates.ts'
import type { Point, Unit, World } from './world-types.ts'

// Numbered follower groups (issue #1005). Native evidence:
// decomp/research/follower-groups.md. Each person carries its own membership
// mask (native person +0x7a bits 1..6); there is no separate group table, so
// death and replacement (conversion/hypnotise) drop membership with the person.
export type FollowerGroupShortcut =
  | { slot: number; action: 'assign' }
  | { slot: number; action: 'recall'; additive: boolean; focus: boolean }

type ShortcutEvent = Pick<
  KeyboardEvent,
  'code' | 'repeat' | 'shiftKey' | 'ctrlKey' | 'altKey' | 'metaKey'
>

// Default key records 005d62c8..005d6394: Shift+1..6 assign (Ctrl not ignored);
// 1..6 and Alt+1..6 recall with Ctrl ignored by the matcher but read as additive.
// Physical number-row codes keep Shift/Option characters from changing the slot.
export function followerGroupShortcut(event: ShortcutEvent): FollowerGroupShortcut | null {
  const match = /^Digit([1-6])$/.exec(event.code)
  if (!match || event.repeat || event.metaKey) return null
  const slot = Number(match[1])
  if (event.shiftKey) return event.altKey || event.ctrlKey ? null : { slot, action: 'assign' }
  return { slot, action: 'recall', additive: event.ctrlKey, focus: event.altKey }
}

const playerPerson = (u: Unit) => u.team === 'blue' && u.hp > 0

// Tribe command 0x46 (process_tribe_cmd 0043f525): every person of the tribe
// gains the bit when selected and loses it otherwise. Assigning with nothing
// selected therefore empties the group. Selection itself is unchanged.
export function assignFollowerGroup(w: World, slot: number) {
  const bit = 1 << slot,
    selected = new Set(w.selected)
  for (const u of w.units) {
    if (!playerPerson(u)) continue
    const groups = selected.has(u.id) ? (u.groups ?? 0) | bit : (u.groups ?? 0) & ~bit
    if (groups) u.groups = groups
    else delete u.groups
  }
}

// Tribe command 0x47 (0043f572). Members are visited in roster order and must
// pass 004e3430(person, 1) (flags4 bit 0x80 excludes; reservation 0x800 does
// not). The first eligible member clears the previous selection unless Ctrl
// was held. Each selected member also selects its occupied craft's crew.
// An empty or wholly unavailable group leaves the selection untouched.
export function recallFollowerGroup(w: World, slot: number, additive: boolean) {
  const bit = 1 << slot,
    people = hudPeople(w, false),
    byId = new Map(people.map(p => [p.id, p])),
    blue = new Set(w.units.filter(u => u.team === 'blue').map(u => u.id)),
    owned = people.filter(p => blue.has(p.id)),
    members = new Set(w.units.filter(u => playerPerson(u) && (u.groups ?? 0) & bit).map(u => u.id)),
    vehicles = new Map(w.vehicles.filter(v => v.active && v.passengerCount).map(v => [v.id, v])),
    updated = new Set<(typeof people)[number]>()
  let count = 0
  const mark = (p: (typeof people)[number], selected: boolean) => {
    markPersonSelected(p, selected)
    updated.add(p)
    const vehicle = vehicles.get(p.vehicle)
    if (!vehicle) return
    for (const id of vehicle.passengers.slice(0, rules.vehicleCapacity[vehicle.model])) {
      const passenger = byId.get(id)
      if (passenger && passenger !== p) {
        markPersonSelected(passenger, selected)
        updated.add(passenger)
      }
    }
  }
  for (const p of owned) {
    if (!members.has(p.id) || p.flags4 & 128) continue
    if (!count && !additive) for (const other of owned) mark(other, false)
    mark(p, true)
    count++
  }
  if (!count) return false
  for (const p of updated)
    if (p.source) {
      p.source.flags3 = p.flags3
      p.source.selectionFlags = p.selectionFlags
    }
  w.selected = people.filter(p => p.selectionFlags & 128).map(p => p.id)
  // 0047a550(0xc) leaves any armed spell/building interaction for group mode.
  w.mode = null
  return true
}

// 0047c350's local Alt branch runs before the command is processed: the first
// roster member carrying the bit, without the availability test, receives the
// camera (00417ca0, current heading kept) and its object panel (00504590).
export function followerGroupFocus(w: World, slot: number) {
  const bit = 1 << slot,
    unit = w.units.find(u => playerPerson(u) && (u.groups ?? 0) & bit)
  return unit ? hudPeople(w, false).find(p => p.id === unit.id) : undefined
}

type GroupScene = {
  world: World
  overviewStage: unknown
  focus(point: Point, options: { animate: boolean }): void
  objectPanels: { open(id: number): void }
  onChange(): void
}

// Scene owner for the keyboard path. Recall records use predicate 004fee90,
// which rejects game flag 0x20; assignment has none. Alt focuses through the
// existing camera/panel owners before the recall command is applied.
export function followerGroup(scene: GroupScene, shortcut: FollowerGroupShortcut) {
  const w = scene.world
  if (w.inputMask || scene.overviewStage) return false
  if (shortcut.action === 'assign') {
    assignFollowerGroup(w, shortcut.slot)
    scene.onChange()
    return true
  }
  if (w.manaWorld.gameFlags & 32) return false
  const target = shortcut.focus ? followerGroupFocus(w, shortcut.slot) : undefined
  if (target) {
    scene.focus(browserPosition(target), { animate: true })
    scene.objectPanels.open(target.id)
  }
  recallFollowerGroup(w, shortcut.slot, shortcut.additive)
  scene.onChange()
  return true
}
