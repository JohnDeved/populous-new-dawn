import { positionDistance } from './native-math.ts'
import { spyDisguisedFrom } from './computer-spells.ts'
import type { NativeTerrain } from './native-terrain.ts'
import type { PersonOrder } from './person-orders.ts'
import { stepPersonReaction } from './person-update.ts'
import rules from './original-rules.json' with { type: 'json' }

export interface AttackReservation {
  flags4: number
  reactionTimer: number
  reactionDuration: number
}
type Target = AttackReservation & {
  id: number
  model: number
  tribe: number
  x: number
  y: number
  flags2: number
}
export type CombatPerson = Target & {
  class: 1
  state: number
  life: number
  vehicle: number
  group: number
  disguise: number
}
export type CombatFight = Target & {
  class: 10
  members: number[]
  tribes: number[]
  center: number
}
export type CombatBuilding = Target & { class: 2 | 9; planKind: number; activity: number }
export type CombatTarget = CombatPerson | CombatFight | CombatBuilding
export interface CombatTargetWorld {
  land: Pick<NativeTerrain, 'flags' | 'owners' | 'categories'>
  objects: ReadonlyMap<number, CombatTarget>
  cellObjects: (cell: number) => Iterable<CombatTarget>
  buildingAt: (cell: number) => CombatBuilding | undefined
  playerTypes: number[]
  alliances: number[]
  gameFlags: number
}
type AreaOrder = Pick<PersonOrder, 'model' | 'flags' | 'a' | 'b'>
const allied = (w: CombatTargetWorld, tribe: number, other: number) =>
  tribe === -1 || other === -1 || tribe === other || !!(w.alliances[tribe] & (1 << other))

function* areaCells(order: Pick<PersonOrder, 'a' | 'b'>) {
  const rx = order.b & 255,
    ry = order.b >>> 8
  for (let row = 0; row <= ry; row++)
    for (let col = 0; col <= rx; col++) {
      const x = ((order.a & 255) - rx + col * 2) & 254
      const y = ((order.a >>> 8) - ry + row * 2) & 254
      yield y * 64 + (x >> 1)
    }
}

function planAttackable(w: CombatTargetWorld, p: CombatPerson, plan: CombatBuilding) {
  return w.playerTypes[p.tribe] === 1 ? plan.planKind !== 4 : !(p.flags2 & 0x800000)
}

// 0x51eab0 determines the response order's flags before target selection runs.
export function detectCombatThreat(
  w: CombatTargetWorld,
  p: CombatPerson,
  area: Pick<PersonOrder, 'a' | 'b'>,
  checkBuildings: boolean,
  force: boolean
) {
  const reservationMask = rules.personModels[p.model].flags & 64 ? 0x200000 : 0x100000
  for (const cell of areaCells(area)) {
    const water = rules.terrainCategoryFlags[w.land.categories[cell] & 15] & 2
    for (const object of w.cellObjects(cell)) {
      if (object.class === 1 && !water && eligibleCombatPerson(w, p, object)) return 2
      if (
        object.class === 10 &&
        object.model === 8 &&
        (force || !(object.flags4 & reservationMask))
      )
        return 1
    }
    if (!checkBuildings) continue
    const flags = w.land.flags[cell]
    if (!(flags & 0x600)) continue
    const building = w.buildingAt(cell)
    if (!building) continue
    if (!allied(w, p.tribe, (w.land.owners[cell] & 15) - 1)) {
      if (flags & 512 || (flags & 1024 && planAttackable(w, p, building))) return 3
    } else if (flags & 512 && building.activity & 16) return 3
  }
  return 0
}

export function stepAttackReservation(reservation: AttackReservation, counter: number) {
  const p = { ...reservation, class: 1, counter }
  stepPersonReaction(p)
  reservation.flags4 = p.flags4
  reservation.reactionTimer = p.reactionTimer
  reservation.reactionDuration = p.reactionDuration
}

// Shared person eligibility in 0x51eab0 and 0x51c4c0; the latter additionally
// excludes airborne people. Fight members are considered through their group.
export function eligibleCombatPerson(w: CombatTargetWorld, p: CombatPerson, target: CombatPerson) {
  if (target.flags2 & 0x810000 || target.life < 1 || target.vehicle || target.state === 23)
    return false
  if (target.group && w.objects.get(target.group)?.model !== 9) return false
  if (rules.personStateFlags[target.state] & 0x400 || target.flags4 & 0x1000) return false
  if (
    allied(w, p.tribe, target.tribe) ||
    spyDisguisedFrom(target, p.tribe) ||
    spyDisguisedFrom(p, target.tribe)
  )
    return false
  if (p.model === 4) return !!(w.gameFlags & 2) || target.model === 4 || target.model === 7
  if (p.model === 6) return !(w.gameFlags & 2 && target.model === 7)
  return p.model === 8 || target.model !== 8
}

// 0x51dcc0: three members per tribe, then replace a weaker friendly member.
// 255 is the native specialist sentinel, distinct from an ordinary empty slot.
export function availableFightSlot(
  w: Pick<CombatTargetWorld, 'objects'>,
  fight: CombatFight,
  p: CombatPerson
) {
  if (!fight.tribes.includes(p.tribe)) return 0
  if (rules.personModels[p.model].flags & 64) return 255
  const members = fight.members.map(id => w.objects.get(id))
  if (members.filter(member => member?.tribe === p.tribe).length < 3) {
    const empty = fight.members.findIndex(id => !id)
    if (empty !== -1) return empty + 1
  }
  const weaker = members.findIndex(
    member =>
      member?.tribe === p.tribe &&
      rules.personModels[member.model].fightRank < rules.personModels[p.model].fightRank
  )
  return weaker + 1
}

// 0x51fe40. These are reservations, not the number of ongoing damage exchanges.
export function reserveCombatTarget(target: CombatTarget, p: CombatPerson) {
  if (rules.personModels[p.model].flags & 64) {
    target.reactionDuration = 48
    target.flags4 = (target.flags4 | 0x200000) >>> 0
  } else if (!(target.flags4 & 0x100000)) {
    target.reactionTimer = (target.reactionTimer + 1) & 255
    target.reactionDuration = 48
    const limit = target.class === 2 ? rules.buildingAttackers[target.model] : 3
    if (target.reactionTimer >= limit) target.flags4 = (target.flags4 | 0x100000) >>> 0
  }
}

function reserveFight(w: CombatTargetWorld, fight: CombatFight) {
  const center = w.objects.get(fight.center)
  if (!center || center.flags2 & 1) return
  const limit =
    Math.trunc(rules.personModels[center.model].fightDamage / rules.personModels[2].fightDamage) + 4
  if (fight.reactionTimer < limit) {
    fight.reactionDuration = 32
    fight.reactionTimer = (fight.reactionTimer + 1) & 255
  } else fight.flags4 = (fight.flags4 | 0x100000) >>> 0
}

const targetPriority = { 1: 2, 2: 3, 9: 4 }

function collectTargets(w: CombatTargetWorld, p: CombatPerson, order: AreaOrder) {
  const candidates: CombatTarget[] = []
  const buildings = order.model === 19 || !!(order.flags & 2)
  for (const cell of areaCells(order)) {
    for (const object of w.cellObjects(cell)) {
      if (
        (object.class === 10 && object.model === 8) ||
        (object.class === 1 && !(object.flags4 & 0x400) && eligibleCombatPerson(w, p, object))
      ) {
        candidates.push(object)
        if (candidates.length === 64) return candidates
      }
    }
    if (!buildings || allied(w, p.tribe, (w.land.owners[cell] & 15) - 1)) continue
    const flags = w.land.flags[cell]
    if (!(flags & 0x600)) continue
    const building = w.buildingAt(cell)
    if (!building || candidates.includes(building)) continue
    if (!(flags & 512) && !planAttackable(w, p, building)) continue
    if (building.class === 2 && building.model === 10 && w.playerTypes[p.tribe] === 1) continue
    candidates.push(building)
    if (candidates.length === 64) return candidates
  }
  return candidates
}

// 0x51c4c0. Native bubble sort becomes a stable standard-library sort.
// The authored 64-candidate cap and cell/list ties remain; no RNG is consumed.
export function selectCombatTarget(w: CombatTargetWorld, p: CombatPerson, order: AreaOrder) {
  const forced = order.model === 19 || !!(order.flags & 16)
  const sorted = collectTargets(w, p, order)
    .map(target => ({ target, distance: positionDistance(p, target) }))
    .toSorted((a, b) => a.distance - b.distance)
  const available: { target: CombatTarget; band: number; type: number }[] = []
  const fullFights: CombatFight[] = []
  for (const { target, distance } of sorted) {
    const band = (distance - sorted[0].distance) >>> 9
    if (target.class === 10) {
      if (!availableFightSlot(w, target, p)) {
        fullFights.push(target)
        continue
      }
      available.push({ target, band, type: 1 })
    } else available.push({ target, band, type: targetPriority[target.class] })
  }
  const reserved = (target: CombatTarget) =>
    !!(target.flags4 & (rules.personModels[p.model].flags & 64 ? 0x200000 : 0x100000))
  // Within a distance band: joinable fights, people, buildings, then plans.
  available.sort((a, b) => a.band - b.band || a.type - b.type)
  const choice = available.find(candidate => !reserved(candidate.target)) ?? available[0]
  const target =
    choice?.target ??
    fullFights.find(fight => !reserved(fight)) ??
    (forced ? fullFights[0] : undefined)
  if (!target) return null
  if (target.class === 10) reserveFight(w, target)
  else reserveCombatTarget(target, p)
  return { target, type: choice?.type ?? 1 }
}
