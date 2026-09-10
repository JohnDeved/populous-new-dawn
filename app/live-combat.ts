import type { World, Unit, Building } from './model.ts'
import { buildingModel } from './building-shapes.ts'
import { automaticCombatScanner, engagementRange, inEngagementArea } from './melee-engagement.ts'
import { currentPersonOrder, emptyPersonOrder, prepareCombatOrder } from './person-orders.ts'
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

const models = { brave: 2, warrior: 3, shaman: 7 }
export const nativePersonModel = (u: Pick<Unit, 'team' | 'kind'>) =>
  u.team === 'wild' ? 1 : models[u.kind]
const tribes = { wild: -1, blue: 0, red: 1 }
const tribe = (u: Pick<Unit, 'team'>) => tribes[u.team]
const position = (u: { x: number; z: number }) => ({
  x: Math.round((u.x + 8) * 256) & 65535,
  y: Math.round((-u.z - 8) * 256) & 65535,
})
const reservation = (owner: { attackReservation?: AttackReservation }) =>
  owner.attackReservation ?? { flags4: 0, reactionTimer: 0, reactionDuration: 0 }

function person(u: Unit): CombatPerson {
  const p = u.builder?.person ?? u.flight ?? u.fight?.motion ?? u.native
  const held = reservation(u)
  let state = u.path.length || u.work !== null ? 10 : 17
  if (u.fight) state = 25
  return {
    ...position(u),
    ...held,
    id: u.id,
    class: 1,
    model: nativePersonModel(u),
    tribe: tribe(u),
    flags2: (p?.flags2 ?? 0) | (u.inside === null ? 0 : 0x800000),
    flags4: (p?.flags4 ?? 0) | held.flags4 | (u.lift > 0 ? 0x400 : 0),
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
function combatWorld(w: World, source: CombatPerson, range: number) {
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
    if (u.hp > 0 && inEngagementArea(source, position(u), range)) add(person(u), u, true)
  for (const fight of w.fights) {
    const point = position(fight)
    if (!inEngagementArea(source, point, range)) continue
    const members = fight.members.map(id => w.units.find(u => u.id === id)).filter(u => !!u)
    for (const u of members) if (!objects.has(u.id)) add(person(u), u, false)
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
        tribes: fight.tribes ?? [...new Set(members.map(tribe))],
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
      for (let id = w.objectCells.heads[cell]; id; id = w.objectCells.objects.get(id)!.cellNext) {
        const object = objects.get(id)
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
        class: b.progress === 1 ? 2 : 9,
        model: buildingModel(b),
        tribe: tribe(b),
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

export function automaticMeleeTarget(w: World, u: Unit): Unit | Building | undefined {
  if (u.team === 'wild') return
  const native = u.builder?.person ?? u.native
  const model = nativePersonModel(u)
  // Ordinary counters retain the world phase until native allocation owns them.
  if (w.turn & rules.personModels[model].scanMask && !((native?.flags3 ?? 0) & 0x800)) return
  const source = person(u)
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
  const scan = { ...p, counter: w.turn & 255 }
  const scanner = automaticCombatScanner(
    scan,
    current,
    w.levelFlags2,
    () => false,
    false,
    () => false
  )
  p.flags3 = scan.flags3
  if (scanner !== 'melee' || current?.model === 27) return
  const range = engagementRange(p, current, false)
  if (!range) return
  const radius = Math.trunc(range / 2) * 2
  const area = { a: ((source.x >>> 8) & 254) | (source.y & 0xfe00), b: radius | (radius << 8) }
  const buildings = !!(rules.personStateFlags[p.state] & 8) && !p.vehicle
  const response = emptyPersonOrder()
  prepareCombatOrder(response, area, 32 | (buildings ? 16 : 0), w.land.categories)
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
