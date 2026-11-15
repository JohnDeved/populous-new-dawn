// Opt-in test-host fixture. The shipped Home entry never imports this module.
// Supplies one Spy and its disguise after ordinary Mission1 startup, then leaves
// discovery to real public input and ordinary turns. No discovery helper import.
import { addUnit } from '../../app/world-state.ts'
import { createLivePerson, registerLivePerson } from '../../app/live-people.ts'
import { supportsFollower } from '../../app/world-terrain-runtime.ts'
import { height } from '../../app/world-coordinates.ts'

const prepared = new WeakSet()
const cases = Object.freeze({
  visible: Object.freeze({ team: 'red', disguise: 0, invisibility: 0 }),
  invisible: Object.freeze({ team: 'red', disguise: 0, invisibility: 100 }),
  'other-colour': Object.freeze({ team: 'red', disguise: 128, invisibility: 0 }),
  changing: Object.freeze({ team: 'red', disguise: 63, invisibility: 0 }),
  own: Object.freeze({ team: 'blue', disguise: 0, invisibility: 0 }),
})
const requireState = (condition, message) => { if (!condition) throw Error(message) }

// Adapter waits while ordinary simulation is running, then pauses publicly and
// rechecks. Never complete the opening by stamping flags or deleting controllers.
export function discoveryFixtureReady(scene) {
  const world = scene?.world
  return !!(scene?.isCurrent() && world?.outcome.level === 1 && world.status === 'playing' &&
    !world.inputMask && world.levelStart.every(site => site.phase === 4 && !site.wave &&
      !site.carriers.length && site.stoneTurns.every(turn => turn === null || world.turn - turn >= 20)))
}

export function prepareDiscoveryFixture(scene, { caseName = 'visible' } = {}) {
  requireState(Object.hasOwn(cases, caseName), 'Unknown Spy discovery fixture case')
  requireState(discoveryFixtureReady(scene), 'Ordinary Mission1 startup is not ready')
  const world = scene.world, scenario = cases[caseName]
  requireState(world.paused && !world.selected.length && !world.mode, 'Need public Pause and empty interaction state')
  requireState(!scene.overviewActive && !scene.modalSuspended, 'Need ordinary active surface view')
  requireState(world.manaWorld.playerTribe === 0 && !(world.manaWorld.gameFlags & 0x20) &&
    !(world.land.landFlags & 0x800), 'Existing gameplay gates must allow the isolated fixture')
  requireState(!prepared.has(world), 'This World already owns a discovery fixture attempt')
  const shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman' && unit.hp > 0)
  requireState(shaman, 'Mission1 living Blue Shaman is required')
  // Keep authored actors and terrain. Choose from a finite list on existing dry
  // ground; actual visibility/occlusion must still be checked by the real picker.
  const offsets = [[8, 0], [-8, 0], [0, 8], [0, -8], [6, 6], [-6, 6], [6, -6], [-6, -6],
    [10, 3], [-10, 3], [3, 10], [3, -10], [10, -3], [-10, -3], [-3, 10], [-3, -10]]
  const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z)
  const point = offsets.map(([x, z]) => ({ x: shaman.x + x, z: shaman.z + z })).find(point =>
    Math.abs(point.x) < 45 && Math.abs(point.z) < 45 && height(world.terrain, point.x, point.z) > 0.45 &&
    supportsFollower(world, point) &&
    world.units.every(unit => unit.hp <= 0 || distance(unit, point) >= 3) &&
    world.buildings.every(building => building.hp <= 0 || distance(building, point) >= 8) &&
    world.trees.every(tree => tree.logs <= 0 || distance(tree, point) >= 2) &&
    world.shrines.every(shrine => distance(shrine, point) >= 4))
  requireState(point, 'No clear supported point among the sixteen fixture candidates')
  // Mark before mutation: a partial attempt requires a new isolated context,
  // not an accidental second actor or a silent in-place repair.
  prepared.add(world)
  const before = { turn: world.turn, randomState: world.randomState, units: world.units.length,
    nextId: world.nextId, gameFlags: world.manaWorld.gameFlags }
  const unit = addUnit(world, scenario.team, 'spy', point)
  unit.invisibility = scenario.invisibility
  const person = unit.native = createLivePerson(world, unit)
  person.disguise = scenario.disguise
  registerLivePerson(world, person)
  // Disclosed fixture isolation: suppress unrelated computer-player work only.
  world.manaWorld.gameFlags |= 2
  requireState(world.objectCells.objects.get(unit.id) === person && person.class === 1 &&
    person.model === 5 && person.tribe === (scenario.team === 'red' ? 1 : 0), 'Supplied owner registration failed')
  requireState(world.turn === before.turn && world.randomState === before.randomState &&
    world.units.length === before.units + 1, 'Fixture preparation changed simulation time/RNG or unexpected actors')
  scene.onChange()
  return { schema: 1, caseName, spyId: unit.id, shamanId: shaman.id, point, before,
    after: { turn: world.turn, randomState: world.randomState, units: world.units.length,
      nextId: world.nextId, gameFlags: world.manaWorld.gameFlags },
    supplied: { ...scenario, class: person.class, model: person.model, tribe: person.tribe },
    limits: 'One supplied Spy and completed/changing disguise on authored Mission1 terrain; unrelated computer work suppressed. No natural acquisition, native reference execution, accelerated turns or visibility proof.' }
}
