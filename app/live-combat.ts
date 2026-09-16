import { tribeForTeam, type World, type Unit, type Building } from './world-types.ts'
import { buildingModel } from './building-shapes.ts'
import { automaticCombatScanner, engagementRange, inEngagementArea } from './melee-engagement.ts'
import {
  allocatePersonOrder,
  attachPersonOrder,
  currentPersonOrder,
  emptyPersonOrder,
  prepareCellOrder,
  type OrderedPerson,
  type OrderEffects,
} from './person-orders.ts'
import { shareCombatOrder, startCombatResponse } from './combat-orders.ts'
import {
  detectCombatThreat,
  selectCombatTarget,
  type AttackReservation,
  type CombatTarget,
  type CombatPerson,
  type CombatBuilding,
  type CombatTargetWorld,
} from './combat-targets.ts'
import rules from './original-rules.json' with { type: 'json' }
import { nativeUnitModel } from './unit-kinds.ts'
import { objectsInCell } from './object-cells.ts'

export const nativePersonModel = (u: Pick<Unit, 'team' | 'kind'>) =>
  u.team === 'wild' ? 1 : nativeUnitModel(u.kind)
export const nativePersonTribe = (u: Pick<Unit, 'team'>) => tribeForTeam(u.team)
const position = (u: { x: number; z: number }) => ({
  x: Math.round((u.x + 8) * 256) & 65535,
  y: Math.round((-u.z - 8) * 256) & 65535,
})
const reservation = (owner: { attackReservation?: AttackReservation }) =>
  owner.attackReservation ?? { flags4: 0, reactionTimer: 0, reactionDuration: 0 }

export function combatPerson(u: Unit): CombatPerson {
  const p = u.builder?.person ?? u.flight ?? u.fight?.motion ?? u.native ?? u.entry?.person
  const held = reservation(u)
  let state = u.path.length || u.work !== null ? 10 : 17
  if (u.fight) state = 25
  return {
    ...position(u),
    ...held,
    id: u.id,
    class: 1,
    model: nativePersonModel(u),
    tribe: nativePersonTribe(u),
    flags2: (p?.flags2 ?? 0) | (u.inside === null ? 0 : 0x800000),
    flags4:
      (p?.flags4 ?? 0) |
      held.flags4 |
      (u.lift > 0 ? 0x400 : 0) |
      (u.invisibility ? 0x1000 : 0) |
      (u.ghost ? 0x800 : 0),
    state: p?.state ?? state,
    life: Math.round(u.hp * 20),
    vehicle: p?.vehicle ?? 0,
    group: u.fight?.group ?? 0,
    disguise: 0,
  }
}

// Adapt existing live ownership without allocating native sprite/state records.
// ponytail: ordinary people/fights still use browser list ties; retain native
// cell-chain order where owned, and replace the fallback with mixed-class allocation.
export function combatWorld(w: World, source: CombatPerson, range: number) {
  const objects = new Map<number, CombatTarget>()
  const owners = new Map<number, Unit | Building | World['fights'][number]>()
  const cells = new Map<number, CombatTarget[]>()
  const add = (o: CombatTarget, owner: Unit | World['fights'][number], insert: boolean) => {
    objects.set(o.id, o)
    owners.set(o.id, owner)
    if (!insert) return
    const cell = (o.y >> 9) * 128 + (o.x >> 9)
    const row = cells.get(cell) ?? []
    row.push(o)
    cells.set(cell, row)
  }
  for (const u of w.units)
    if (u.hp > 0 && inEngagementArea(source, position(u), range)) add(combatPerson(u), u, true)
  for (const fight of w.fights) {
    const point = position(fight)
    if (!inEngagementArea(source, point, range)) continue
    const members = fight.members.map(id => w.units.find(u => u.id === id)).filter(u => !!u)
    for (const u of members) if (!objects.has(u.id)) add(combatPerson(u), u, false)
    add(
      {
        ...point,
        ...reservation(fight),
        id: fight.id,
        class: 10,
        model: fight.encounter ? 9 : 8,
        tribe: -1,
        flags2: 0,
        members: fight.slots ?? [
          ...fight.members,
          ...Array(Math.max(0, 6 - fight.members.length)).fill(0),
        ],
        tribes: fight.tribes ?? [...new Set(members.map(nativePersonTribe))],
        center: fight.center ?? fight.members[0],
      },
      fight,
      true
    )
  }
  const buildings = new Map<number, CombatBuilding>()
  const world: CombatTargetWorld = {
    land: w.land,
    objects,
    alliances: w.outcome.alliances,
    playerTypes: w.manaTribes.map(t => t.playerType),
    gameFlags: w.manaWorld.gameFlags,
    cellObjects: cell => {
      const row = cells.get(cell)
      if (!row) return []
      const ordered: CombatTarget[] = []
      for (const indexed of objectsInCell(w.objectCells, cell)) {
        const object = objects.get(indexed.id)
        if (object && row.includes(object)) ordered.push(object)
      }
      return ordered.length ? [...ordered, ...row.filter(o => !ordered.includes(o))] : row
    },
    buildingAt: cell => {
      const id = w.land.buildingIds[cell] & 1023
      if (!id) return
      const cached = buildings.get(id)
      if (cached) return cached
      const b = w.buildings.find(candidate => (candidate.id & 1023) === id && candidate.hp > 0)
      if (!b) return
      const record: CombatBuilding = {
        ...position(b),
        ...reservation(b),
        id: b.id,
        class: b.preparation ? 9 : 2,
        model: buildingModel(b),
        tribe: nativePersonTribe(b),
        flags2: 0,
        planKind: 0, // Ordinary live plans; native special plan kinds remain unallocated.
        activity: b.admission?.activity ?? 0,
      }
      buildings.set(id, record)
      owners.set(b.id, b)
      return record
    },
  }
  return { world, owners }
}

export function selectLiveCombatTarget(
  w: World,
  u: Unit,
  order: { model: number; flags: number; a: number; b: number }
) {
  const source = combatPerson(u)
  const center = { ...source, x: (order.a & 254) * 256, y: order.a & 0xfe00 }
  const { world, owners } = combatWorld(w, center, Math.max(order.b & 255, order.b >>> 8) + 2)
  const result = selectCombatTarget(world, source, order)
  if (!result) return
  const owner = owners.get(result.target.id)!
  owner.attackReservation = {
    flags4: result.target.flags4 & 0x300000,
    reactionTimer: result.target.reactionTimer,
    reactionDuration: result.target.reactionDuration,
  }
  return { ...result, owner }
}

function combatScan(
  w: World,
  p: Omit<Parameters<typeof automaticCombatScanner>[0], 'counter'>,
  order: Parameters<typeof automaticCombatScanner>[1],
  inTower = false,
  firewarriorReady = () => false
) {
  const scan = { ...p, counter: w.turn & 255 },
    scanner = automaticCombatScanner(
      scan,
      order,
      w.levelFlags2,
      () => false,
      inTower,
      firewarriorReady
    )
  p.flags3 = scan.flags3
  return scanner
}

function startPreacherResponse(
  w: World,
  p: CombatPerson & OrderedPerson & { h: number },
  peers: () => Iterable<CombatPerson & OrderedPerson & { h: number }>,
  effects: OrderEffects
) {
  const range = engagementRange(p, currentPersonOrder(w.buildingOrders, p), false)
  if (!range) return 0
  const radius = Math.trunc(range / 2) * 2,
    area = { a: ((p.x >>> 8) & 254) | (p.y & 0xfe00), b: radius | (radius << 8) },
    { world } = combatWorld(w, p, range)
  if (!detectCombatThreat(world, p, area, false, false)) return 0
  const id = allocatePersonOrder(w.buildingOrders)
  if (!id) return 0
  prepareCellOrder(w.buildingOrders.records[id], area, 32, w.land.categories)
  p.flags2 = (p.flags2 | 16) >>> 0
  attachPersonOrder(w.buildingOrders, p, id, -1, effects)
  shareCombatOrder(w.buildingOrders, p, id, peers(), effects)
  return id
}

// Live adapter for the already recovered 0x51e5e0/0x520480 allocator. The
// caller owns actual person creation/adoption; this function only owns the scan.
export function allocateLiveCombatResponse(
  w: World,
  p: CombatPerson & OrderedPerson & { h: number; commandPhase: number },
  peers: () => Iterable<CombatPerson & OrderedPerson & { h: number }>,
  effects: OrderEffects
) {
  const order = currentPersonOrder(w.buildingOrders, p)
  const scanner = combatScan(w, p, order)
  if (scanner !== 'melee' && scanner !== 'preacher') return 0
  if (order?.model === 27) return 0
  if (scanner === 'preacher') return startPreacherResponse(w, p, peers, effects)
  const range = engagementRange(p, order, false),
    { world } = combatWorld(w, p, range)
  startCombatResponse(world, w.buildingOrders, p, peers, effects)
  const id = p.immediateCommand
  return id && w.buildingOrders.records[id].model === 21 ? id : 0
}

function automaticTarget(
  w: World,
  u: Unit,
  expected: 'melee' | 'firewarrior',
  inTower: boolean
): Unit | Building | undefined {
  if (u.team === 'wild') return
  const native = u.builder?.person ?? u.native ?? u.entry?.person
  const model = nativePersonModel(u)
  // Ordinary counters retain the world phase until native allocation owns them.
  if (w.turn & rules.personModels[model].scanMask && !((native?.flags3 ?? 0) & 0x800)) return
  const source = combatPerson(u)
  const p = native ?? {
    ...source,
    substate: 0,
    flags3: 0,
    assignment: 0,
    commandPhase: 0,
    commandStatus: 0,
    h: 0,
  }
  const order = native ? currentPersonOrder(w.buildingOrders, native) : undefined
  const current = order ?? (u.path.length ? { model: 3, flags: 0 } : undefined)
  // Ritual ownership and full automatic order allocation/sharing/restoration
  // remain in the command migration; do not invent the ritual eligibility result.
  // The ordinary live roster uses the melee scanner. Specialist response
  // controllers must own their distinct searches rather than fall through here.
  if (combatScan(w, p, current, inTower, () => !u.cooldown) !== expected || current?.model === 27)
    return
  const range = engagementRange(p, current, inTower)
  if (!range) return
  const radius = Math.trunc(range / 2) * 2
  const area = { a: ((source.x >>> 8) & 254) | (source.y & 0xfe00), b: radius | (radius << 8) }
  // Building attacks remain outside the Firewarrior tower slice. Letting one
  // reserve a building here would starve eligible person targets we can fire at.
  const buildings = !inTower && !!(rules.personStateFlags[p.state] & 8) && !p.vehicle
  const response = emptyPersonOrder()
  prepareCellOrder(response, area, 32 | (buildings ? 16 : 0), w.land.categories)
  // Coastal preparation can move the order center by one cell. Include that
  // outer ring in the adapter; each native scan still traverses its exact area.
  const { world, owners } = combatWorld(w, source, range + (response.a === area.a ? 0 : 2))
  const threat = detectCombatThreat(world, source, area, buildings, buildings)
  if (!threat) return
  if (threat === 3) response.flags |= 2
  const result = selectCombatTarget(world, source, response)
  if (!result) return
  const { target } = result
  const owner = owners.get(target.id)!
  owner.attackReservation = {
    flags4: target.flags4 & 0x300000,
    reactionTimer: target.reactionTimer,
    reactionDuration: target.reactionDuration,
  }
  // The existing fight controller still owns approach/group allocation.
  return 'members' in owner
    ? w.units.find(t => owner.members.includes(t.id) && t.hp > 0 && t.team !== u.team)
    : owner
}

export const automaticMeleeTarget = (w: World, u: Unit) => automaticTarget(w, u, 'melee', false)

export function automaticTowerFirewarriorTarget(w: World, u: Unit) {
  const target = automaticTarget(w, u, 'firewarrior', true)
  return target && !('progress' in target) ? target : undefined
}
