import {
  TRIBE_TEAMS,
  teamForTribe,
  tribeForTeam,
  type CampaignAI,
  type TribeTeam,
  type World,
} from './world-types.ts'
import { height, nativeCellPoint } from './world-coordinates.ts'
import { nativePosition, originalTerrain } from './world-terrain-runtime.ts'
import { short, random } from './native-math.ts'
import { nativePersonModel } from './live-combat.ts'
import { buildingModel, buildingPose, buildingPosition } from './building-shapes.ts'
import { createComputerQueue, creditAttackTask, type AttackTarget } from './computer.ts'
import { runScript, scriptState } from './popscript.ts'
import constants from './original-constants.json' with { type: 'json' }
import { missionData, missionEnemyTribe, missionPosition } from './mission-data.ts'
import type { PopScript } from './popscript.ts'
import { defeatTribe, ensureBuildingDamage } from './building-damage.ts'
import { SPELLS } from './world-rules.ts'

const spellMana = (model: number) => SPELLS.find(spell => spell.model === model)!.cost * 1000

export const HOME = missionPosition(1, 'blue'),
  ENEMY = missionPosition(1, 'red')
export const campaignPosition = (w: World, team: TribeTeam) =>
  missionPosition(w.outcome.level, team)
export const campaignShamanTeams = (w: World) =>
  TRIBE_TEAMS.filter((_, tribe) =>
    missionData(w.outcome.level).level.objects.some(
      object => object.type === 1 && object.model === 7 && object.owner === tribe
    )
  )
export const campaignTribe = (w: World) => w.activeCampaignTribe
export const campaignTeam = (_w: World, tribe: number) => teamForTribe(tribe)

export function withCampaignTribe<T>(w: World, tribe: number, run: (ai: CampaignAI) => T) {
  const ai = w.campaignAIs[tribe]
  if (!ai) throw new Error(`Missing campaign AI for tribe ${tribe}`)
  const previousTribe = w.activeCampaignTribe,
    previousAI = w.ai,
    previousScan = w.spellScan
  w.activeCampaignTribe = tribe
  w.ai = ai
  w.spellScan = w.spellScans[tribe]
  try {
    return run(ai)
  } finally {
    w.activeCampaignTribe = previousTribe
    w.ai = previousAI
    w.spellScan = previousScan
  }
}

export function creditCampaignAttackTask(w: World, person: number, damage: number) {
  for (const ai of w.campaignAIs) if (ai) creditAttackTask(ai, person, damage)
}

export function cleanupDefeatedTribe(w: World, id: number) {
  // ponytail: browser entity IDs/list order stand in for native registration;
  // ghosts and internal objects join this adapter with the common object store.
  const units = w.buildings
    .filter(b => b.hp > 0)
    .map(building => ({
      building,
      id: building.id,
      class: 2,
      model: buildingModel(building),
      tribe: tribeForTeam(building.team),
      flags4: 0,
      hp: 0,
      buildingFlags: building.damageState?.buildingFlags ?? 0,
      damage: building.damageState?.damage ?? 0,
      internalModel: 0,
    }))
  const context = {
    turn: w.turn,
    lastDefeated: w.outcome.lastDefeated,
    skyCounter: w.outcome.skyCounter,
    units,
  }
  const team = teamForTribe(id),
    origin =
      w.units.find(unit => unit.team === team) ??
      w.buildings.find(building => building.team === team) ??
      campaignPosition(w, 'blue')
  defeatTribe(context, id, w.castingTribes[id].flags, nativePosition(w, origin), {
    // Tribe-death sky objects and reveal/camera effects need their native consumers.
    allocate: () => {},
    reveal: () => {},
    remove: () => {},
  })
  w.outcome.skyCounter = context.skyCounter
  for (const p of units)
    if (p.tribe === id) {
      const state = ensureBuildingDamage(p.building)
      state.buildingFlags = p.buildingFlags
      state.damage = p.damage
    }
}

export function markerHeight(
  terrain: number[],
  index: number,
  missionNumber = 1,
  nativeTerrain: Int16Array | undefined = missionNumber === 1 ? originalTerrain : undefined
) {
  const level = missionData(missionNumber).level
  if (!Number.isInteger(index) || index < 0 || index >= level.markers.length)
    throw new RangeError('Invalid campaign marker')
  const packed = level.markers[index],
    p = nativeCellPoint(packed)
  if (Math.abs(p.x) > 48 || Math.abs(p.z) > 48) {
    if (!nativeTerrain) throw new RangeError('Campaign marker is outside the browser terrain')
    return nativeTerrain[((packed & 0xfe00) >> 9) * 128 + ((packed & 254) >> 1)]
  }
  const h = height(terrain, p.x, p.z)
  return h === -0.35 ? 0 : short(Math.round(h * 45)) // Convert the browser's artificial seabed back to native zero.
}

export function missionAI(script: PopScript = missionData().script, tribe = 1) {
  const ai = {
    ...scriptState(script),
    ...createComputerQueue(),
    states: 0,
    flags: 0,
    enemyTribe: 0,
    defencePosition: 0,
    defenceRadius: 11,
    task9a: 0,
    task9b: 0,
    spellEntries: Array.from({ length: 8 }, () => ({
      model: 0,
      mana: 0,
      range: 0,
      people: 0,
      mode: 0,
    })),
    reincarnation: true,
    includeIncompleteBuildings: false,
    pendingCommands: [] as { opcode: number; args: number[] }[],
    trainingSelections: Array.from({ length: 10 }, () => [] as number[]),
  }
  // ponytail: turn-zero setup only; bind the remaining commands and live reads before recurring execution.
  ai.attributes[43] = 12 // 0x461d70: attribute 43 before the turn-zero script.
  runScript(script, ai, {
    turn: 0,
    tribe,
    readInternal: id => {
      if (id === 0) return 0
      if (id >= 1050 && id <= 1065) return spellMana(id - 1048)
      throw new Error(`Unbound initial script read ${id}`)
    },
    command: (opcode, args) => {
      // 0x48cc60: native state bits, and SET_REINCARNATION's disable flag at tribe+0x93d.
      if (opcode >= 1028 && opcode <= 1051 && opcode !== 1038 && opcode !== 1049) {
        const bit = 1 << (opcode - 1028)
        if (args[0] === 1022) ai.states |= bit
        else if (args[0] === 1023) ai.states &= ~bit
      } else if (opcode === 1066) {
        ai.flags |= 0x10
        ai.task9a = args[0] & 255
      } else if (opcode === 1067) ai.task9b = args[0] & 255
      else if (opcode === 1123) ai.flags |= 0x2000
      else if (opcode === 1125) ai.flags |= 0x4000
      else if (opcode === 1164) {
        if (args[0] === 1022) ai.reincarnation = true
        else if (args[0] === 1023) ai.reincarnation = false
      } else ai.pendingCommands.push({ opcode, args })
    },
  })
  return ai
}

// 0x4f2160 / 0x4f2900 share the same coarse cell lookup.
export function headAt(w: World, x: number, y: number) {
  const p = nativeCellPoint(((y & 255) << 8) | (x & 255))
  return w.shrines.find(s => {
    const n = nativePosition(w, s),
      cell = nativeCellPoint((n.y & 0xff00) | ((n.x >>> 8) & 255))
    return cell.x === p.x && cell.z === p.z
  })
}

export function campaignInternal(w: World, id: number) {
  const self = campaignTribe(w)
  if (id === 0) return w.turn
  // 0x48f350: total population is a dword; per-class counters are signed words.
  if (id >= 1 && id <= 5) return campaignPersonCount(w, id === 1 ? self : id - 2)
  if (id === 6) return w.killCredits[0][self] & 65535
  if (id >= 1146 && id <= 1175) {
    const tribe = id < 1152 ? self : Math.floor((id - 1152) / 6)
    const model = (id < 1152 ? id - 1146 : (id - 1152) % 6) + 2
    return short(campaignPersonCount(w, tribe, model))
  }
  if (id === 1180) return w.killCredits[0][campaignTribe(w)] & 65535
  if (id === 1048) return w.manaTribes[self].mana | 0
  if (id >= 1050 && id <= 1065) return spellMana(id - 1048) // Loaded spell-cost table.
  // 0x48f350: self then four explicit tribes, 16 building models each.
  if (id >= 1066 && id <= 1145) {
    const tribe = id < 1082 ? self : Math.floor((id - 1082) / 16)
    const model = id < 1082 ? id - 1065 : ((id - 1082) % 16) + 1
    const value = campaignBuildingCount(w, tribe, model, w.ai.includeIncompleteBuildings)
    w.ai.includeIncompleteBuildings = false
    return value
  }
  // Native spell constants, including Blast, Lightning and Land Bridge.
  if (id >= 1184 && id <= 1199) return id - 1183
  if (id === 1243) return 19
  if (id === 1244) return 17
  if (id === 1223) return 0 // 0x48f350: no-specific-building selector.
  if (id === 1236) return 10 - w.ai.tasks.filter(task => task.flags & 1).length
  if (id === 1200) return 18 // INT_M_KNOWLEDGE, preceding the person constants.
  if (id >= 1201 && id <= 1206) return id - 1199
  if (id === 1213) return 7 // 0x48f350: Warrior Training Hut model.
  throw new Error(`Unbound campaign internal ${id}`)
}

// 0x4ecac0: active tribe followers count even while housed or selected by the AI.
// Ghosts are excluded from tribe aggregates; remaining person classes are not represented yet.
export function campaignPersonCount(w: World, tribe: number, model?: number) {
  const team = campaignTeam(w, tribe)
  return (
    w.units.filter(
      u =>
        u.team === team &&
        u.hp > 0 &&
        !u.ghost &&
        (model === undefined || nativePersonModel(u) === model)
    ).length | 0
  )
}

// 0x492680 / 0x4f54f0: inclusive wrapped square around a script marker.
export function campaignPeopleInMarker(w: World, tribe: number, marker: number, radius: number) {
  const level = missionData(w.outcome.level).level
  if (!Number.isInteger(tribe) || tribe < -1 || tribe > 3)
    throw new RangeError('Invalid campaign marker tribe')
  if (!Number.isInteger(marker) || marker < 0 || marker >= level.markers.length)
    throw new RangeError('Invalid campaign marker')
  if (!Number.isInteger(radius) || radius < 0 || radius > 127)
    throw new RangeError('Invalid campaign marker radius')
  const target = level.markers[marker],
    tx = target & 255,
    ty = target >>> 8,
    team = tribe === -1 ? 'wild' : campaignTeam(w, tribe),
    wrapped = (a: number, b: number) => Math.min(Math.abs(a - b), 256 - Math.abs(a - b)) >> 1
  return (
    w.units.filter(u => {
      if (u.team !== team || u.hp <= 0 || u.inside !== null) return false
      const p = nativePosition(w, u)
      return wrapped((p.x >>> 8) & 254, tx) <= radius && wrapped((p.y >>> 8) & 254, ty) <= radius
    }).length | 0
  )
}

// 0x4ecac0 counts completed buildings (state 2) separately from all live buildings.
// Browser progress is the current approximation of native building state.
export function campaignBuildingCount(
  w: World,
  tribe: number,
  model: number,
  includeIncomplete: boolean
) {
  const team = campaignTeam(w, tribe)
  const count = w.buildings.filter(
    b =>
      b.team === team &&
      b.hp > 0 &&
      (includeIncomplete || b.progress >= 1) &&
      buildingModel(b) === model
  ).length
  return short(count)
}

export function campaignAttackEntity(w: World, id: number): AttackTarget | null {
  const building = w.buildings.find(b => b.id === id && b.hp > 0)
  if (building) {
    const p = buildingPosition(buildingPose(building))
    return { id, target: ((p.x >>> 8) & 254) | (p.y & 0xfe00) }
  }
  const person = w.units.find(u => u.id === id && u.hp > 0)
  if (!person) return null
  const p = nativePosition(w, person)
  return {
    id,
    target: ((p.x >>> 8) & 254) | (p.y & 0xfe00),
    direct: person.kind === 'shaman',
    contained: person.inside !== null,
  }
}

// 0x4f6100 / 0x4f6180: sample native allocation order, buildings first.
export function campaignAttackTarget(w: World, tribe: number, model = 0): AttackTarget | null {
  const team = campaignTeam(w, tribe)
  if (!team) return null
  const buildings = w.buildings.filter(b => b.team === team && b.hp > 0)
  if (model) {
    const building = buildings.find(candidate => buildingModel(candidate) === model)
    if (building) return campaignAttackEntity(w, building.id)
  }
  if (buildings.length) {
    for (let i = random(w) % buildings.length; i >= 0; i--) {
      const building = buildings[i]
      if (buildingModel(building) === 10) continue
      return campaignAttackEntity(w, building.id)
    }
  }
  const people = w.units.filter(u => u.team === team && u.hp > 0)
  if (!people.length) return null
  return campaignAttackEntity(w, people[random(w) % people.length].id)
}

// 0x48cc60 / 0x4fbf40: marker coordinates select a coarse cell, not a radius.
export function forceHead(w: World, marker: number) {
  const level = missionData(w.outcome.level).level
  if (!Number.isInteger(marker) || marker < 0 || marker >= level.markers.length)
    throw new RangeError('Invalid trigger marker')
  const packed = level.markers[marker],
    head = headAt(w, packed & 255, packed >>> 8)
  if (head) head.forced = true
}
