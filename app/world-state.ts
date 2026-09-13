import type { World, Team, Building, Unit, Point } from './world-types.ts'
import type { UnitKind } from './unit-kinds.ts'
import { maxHp } from './world-rules.ts'
import { buildingModel } from './building-shapes.ts'
import { nativeTrainingCost } from './building-occupants.ts'
import constants from './original-constants.json' with { type: 'json' }
import rules from './original-rules.json' with { type: 'json' }

export const housing = (b: Building) => rules.buildingCapacity[buildingModel(b)]
export function population(w: World, team: Team) {
  return (
    1 + w.units.filter(u => u.team === team && u.kind !== 'shaman' && !u.ghost && u.hp > 0).length
  )
}
export function populationLimit(w: World, team: Team) {
  return Math.min(
    200,
    6 +
      w.buildings
        .filter(b => b.team === team && b.kind === 'hut' && b.progress === 1 && b.hp > 0)
        .reduce(
          (sum, b) =>
            sum +
            [
              constants.MAX_POP_VALUE__HUT_1,
              constants.MAX_POP_VALUE__HUT_2,
              constants.MAX_POP_VALUE__HUT_3,
            ][b.level - 1],
          0
        )
  )
}
export function breedingWork(w: World, b: Building) {
  return Math.floor(
    (rules.hutBreedingWork[b.level - 1] *
      rules.breedingBands[Math.min(19, Math.floor(population(w, b.team) / 10))]) /
      256
  )
}
export function trainingCost(w: World, team: Team) {
  return nativeTrainingCost(
    w.units.filter(u => u.team === team && u.kind === 'warrior' && !u.ghost && u.hp > 0).length,
    3,
    team === 'blue' ? 2 : 1
  )
}
export function addUnit(w: World, team: Team, kind: UnitKind, p: Point) {
  const u: Unit = {
    native: null,
    vault: null,
    x: p.x,
    z: p.z,
    id: w.nextId++,
    team,
    kind,
    hp: maxHp(kind),
    path: [],
    target: null,
    cooldown: 0,
    work: null,
    inside: null,
    cargo: 0,
    tree: null,
    timer: 0,
    guard: false,
    lift: 0,
    idleTurns: 0,
    heading: Math.PI,
    fighting: false,
    fight: null,
    casting: null,
  }
  w.units.push(u)
  return u
}
