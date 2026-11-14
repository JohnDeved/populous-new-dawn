import type { World, Unit } from './world-types.ts'
import { unitAnimationSource } from './unit-animation-source.ts'
import { spyDisguisedFrom } from './computer-selection.ts'
import { unitInvisibleToPlayer } from './person-visibility.ts'

const personFor = (unit: Unit) =>
  unitAnimationSource(unit) ?? unit.native ?? unit.entry?.person ?? unit.builder?.person

// The pending command is World state (world.spyDiscovery), so it is saved,
// loaded and discarded by new-game/restart with its World. Only the target ID is
// stored; consumption revalidates the live owner instead of trusting references.
// This one-slot adapter covers discovery; other browser player commands still
// dispatch directly, so it is not the complete native tribe-command scheduler.

// Manual inspection stages discovery from the visible ScenePicking hit,
// never a proximity or all-units scan. See decomp/research/spy-manual-discovery.md.
export function requestSpyDiscovery(world: World, picked: number | null) {
  if (
    picked === null ||
    world.spyDiscovery !== null ||
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
  world.spyDiscovery = { id: unit.id }
  return true
}

// Consume before tribe/object work. Preserve delayed mutation; discard the command
// when the ID no longer names a live Spy whose person is its registered object owner.
export function processSpyDiscovery(world: World) {
  const command = world.spyDiscovery
  if (!command) return false
  world.spyDiscovery = null
  const { id } = command,
    unit = world.units.find(candidate => candidate.id === id),
    person = unit && personFor(unit)
  if (
    !unit ||
    unit.hp <= 0 ||
    unit.kind !== 'spy' ||
    !person ||
    world.objectCells.objects.get(id) !== person ||
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
