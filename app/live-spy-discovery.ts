import type { World, Unit } from './world-types.ts'
import { unitAnimationSource } from './unit-animation-source.ts'
import { spyDisguisedFrom } from './computer-selection.ts'
import { unitInvisibleToPlayer } from './spell-effects-runtime.ts'

const personFor = (unit: Unit) =>
  unitAnimationSource(unit) ?? unit.native ?? unit.entry?.person ?? unit.builder?.person

type Discovery = {
  unit: Unit
  id: number
  person: NonNullable<ReturnType<typeof personFor>>
}

// Frontend input belongs to the World that received it, not a later loaded or
// restarted World. Only the existing person's disguise enters checkpoints.
// This one-slot adapter covers discovery; other browser player commands still
// dispatch directly, so it is not the complete native tribe-command scheduler.
const pending = new WeakMap<World, Discovery>()

// Manual inspection stages discovery from the visible ScenePicking hit,
// never a proximity or all-units scan. See decomp/research/spy-manual-discovery.md.
export function requestSpyDiscovery(world: World, picked: number | null) {
  if (
    picked === null ||
    pending.has(world) ||
    world.status !== 'playing' ||
    world.inputMask ||
    world.mode ||
    world.selected.length ||
    world.land.landFlags & 0x800 ||
    world.manaWorld.gameFlags & 0x20
  )
    return false
  const unit = world.units.find(candidate => candidate.id === picked)
  if (
    !unit ||
    unit.kind !== 'spy' ||
    unit.hp <= 0 ||
    unit.inside !== null ||
    unitInvisibleToPlayer(world, unit)
  )
    return false
  const person = personFor(unit),
    player = world.manaWorld.playerTribe
  if (
    !person ||
    person.class !== 1 ||
    person.model !== 5 ||
    person.flags2 & 1 ||
    person.vehicle ||
    person.tribe === player ||
    !spyDisguisedFrom(person, player)
  )
    return false
  pending.set(world, { unit, id: unit.id, person })
  return true
}

// Consume before tribe/object work. Preserve delayed mutation and discard stale
// browser owners instead of revealing a reused ID.
export function processSpyDiscovery(world: World) {
  const command = pending.get(world)
  if (!command) return false
  pending.delete(world)
  const { unit, id, person } = command
  if (
    world.units.find(candidate => candidate.id === id) !== unit ||
    unit.hp <= 0 ||
    unit.kind !== 'spy' ||
    personFor(unit) !== person ||
    person.class !== 1 ||
    person.model !== 5 ||
    person.flags2 & 1
  )
    return false
  // The admitted command does not repeat the apparent-tribe gate or alter
  // orders, RNG, invisibility or feedback. Keep the existing person owner.
  person.disguise = (person.tribe << 6) & 255
  return true
}
