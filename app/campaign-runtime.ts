import type { World } from './world-types.ts'
import { height, nativeCellPoint } from './world-coordinates.ts'
import { nativePosition, originalTerrain } from './world-terrain-runtime.ts'
import { short, random } from './native-math.ts'
import { nativePersonModel } from './live-combat.ts'
import { buildingModel, buildingPose, buildingPosition } from './building-shapes.ts'
import { createComputerQueue, type AttackTarget } from './computer.ts'
import { runScript, scriptState } from './popscript.ts'
import constants from './original-constants.json' with { type: 'json' }
import { missionData, missionPosition } from './mission-data.ts'
import type { PopScript } from './popscript.ts'

export const HOME = missionPosition(1, 'blue'),
  ENEMY = missionPosition(1, 'red')
export const campaignPosition = (w: World, team: 'blue' | 'red') =>
  missionPosition(w.outcome.level, team)

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

export function missionAI(script: PopScript = missionData().script) {
  const ai = {
    ...scriptState(script),
    ...createComputerQueue(),
    states: 0,
    flags: 0,
    enemyTribe: 0,
    defencePosition: 0,
    defenceRadius: 11,
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
    tribe: 1,
    readInternal: id => {
      if (id === 0) return 0
      throw new Error(`Unbound initial script read ${id}`)
    },
    command: (opcode, args) => {
      // 0x48cc60: native state bits, and SET_REINCARNATION's disable flag at tribe+0x93d.
      if (opcode >= 1028 && opcode <= 1051 && opcode !== 1038 && opcode !== 1049) {
        const bit = 1 << (opcode - 1028)
        if (args[0] === 1022) ai.states |= bit
        else if (args[0] === 1023) ai.states &= ~bit
      } else if (opcode === 1164) {
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
  if (id === 0) return w.turn
  // 0x48f350: total population is a dword; per-class counters are signed words.
  if (id >= 1 && id <= 5) return campaignPersonCount(w, id === 1 ? 1 : id - 2)
  if (id >= 1146 && id <= 1175) {
    const tribe = id < 1152 ? 1 : Math.floor((id - 1152) / 6)
    const model = (id < 1152 ? id - 1146 : (id - 1152) % 6) + 2
    return short(campaignPersonCount(w, tribe, model))
  }
  if (id === 1180) return w.killCredits[0][1] & 65535
  if (id === 1050) return constants.SPELL_BLAST // 0x48f350 reads the loaded spell-cost table.
  // 0x48f350: self then four explicit tribes, 16 building models each.
  if (id >= 1066 && id <= 1145) {
    const tribe = id < 1082 ? 1 : Math.floor((id - 1082) / 16)
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
  if (id === 1200) return 18 // INT_M_KNOWLEDGE, preceding the person constants.
  if (id >= 1201 && id <= 1206) return id - 1199
  throw new Error(`Unbound campaign internal ${id}`)
}

// 0x4ecac0: active tribe followers count even while housed or selected by the AI.
// Ghosts are excluded from tribe aggregates; remaining person classes are not represented yet.
export function campaignPersonCount(w: World, tribe: number, model?: number) {
  const team = tribe === 0 ? 'blue' : tribe === 1 ? 'red' : null
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
    team = tribe === -1 ? 'wild' : tribe === 0 ? 'blue' : tribe === 1 ? 'red' : null,
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
  const team = tribe === 0 ? 'blue' : tribe === 1 ? 'red' : null
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
export function campaignAttackTarget(w: World, tribe: number): AttackTarget | null {
  const team = tribe === 0 ? 'blue' : tribe === 1 ? 'red' : null
  if (!team) return null
  const buildings = w.buildings.filter(b => b.team === team && b.hp > 0)
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
