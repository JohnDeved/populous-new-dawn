import type { World } from './world-types.ts'
import {
  headAt,
  campaignInternal,
  campaignPeopleInMarker,
  campaignAttackEntity,
  campaignAttackTarget,
  forceHead,
  campaignPosition,
  campaignTeam,
  campaignTribe,
  markerHeight,
} from './campaign-runtime.ts'
import { computerSelectionWorld, computerTrainingBuilding } from './computer-runtime.ts'
import { availableTrainingPeople } from './computer-selection.ts'
import {
  requestAttack,
  requestMarkerTask,
  requestShamanGuard,
  requestTowerStaffing,
  requestTraining,
} from './computer.ts'
import { release } from './world-tasks.ts'
import { isShaman, SPELLS } from './world-rules.ts'
import { random } from './native-math.ts'
import { sound } from './world-effects.ts'
import { flybyCommand } from './flyby.ts'
import { addMessage, messageStringId } from './messages.ts'
import { runScript, scriptValue, type PopScript } from './popscript.ts'
import { missionData, missionScript } from './mission-data.ts'
import { buildingFootprintCells, buildingModel, buildingPose } from './building-shapes.ts'
import { nativePersonModel } from './live-combat.ts'
import { buildingCounterattack } from './live-building-combat.ts'
import { appendLiveOrders } from './live-movement.ts'
import { emptyPersonOrder, writePersonOrder } from './person-orders.ts'
import { route } from './live-command.ts'
import { nativePosition } from './world-terrain-runtime.ts'
import rules from './original-rules.json' with { type: 'json' }

function forceCampaignAttack(w: World) {
  const team = campaignTeam(w, campaignTribe(w)),
    target = w.units.find(u => u.team === 'blue' && isShaman(u) && u.hp > 0),
    fallback = campaignPosition(w, 'blue'),
    order = emptyPersonOrder()
  if (target) writePersonOrder(order, 28, target.id, 0, 0)
  else {
    const point = nativePosition(w, fallback)
    writePersonOrder(order, 3, 0, ((point.x >>> 8) & 255) | (point.y & 0xff00), 0)
  }
  for (const unit of w.units.filter(u => {
    const person = u.native ?? u.entry?.person ?? u.builder?.person ?? u.fight?.motion
    return (
      u.team === team &&
      u.hp > 0 &&
      !u.ghost &&
      u.inside === null &&
      !(person && rules.personStateFlags[person.state] & 0x20)
    )
  }))
    if (appendLiveOrders(w, [unit], order, true).count === 1) {
      unit.target = target?.id ?? null
      route(w, unit, target ?? fallback, true)
    }
}

export function stepForcedCampaignAttack(w: World) {
  const state = w.manaTribes[campaignTribe(w)],
    shaman = w.units.some(u => u.team === 'blue' && isShaman(u) && u.hp > 0),
    periodic = !(w.turn & 15) && Boolean(state.flags2 & 0x80) !== shaman,
    retry = !(w.turn & 31) && !!(state.flags2 & 0x400)
  if (!state.active || state.defeatTimer || !(state.flags2 & 0x40) || (!periodic && !retry)) return
  if (retry) state.flags2 &= ~0x400
  forceCampaignAttack(w)
}

export function removeHead(w: World, x: number, y: number) {
  const head = headAt(w, x, y)
  if (!head) return
  w.shrines.splice(w.shrines.indexOf(head), 1)
  head.active = false
  for (const u of w.units) if (u.work === head.id) release(w, u)
}
// Reviewed DO query handlers. Unknown commands/unsupported world state fail explicitly.
export function campaignCommand(
  w: World,
  opcode: number,
  args: number[],
  script: PopScript = missionScript(w.outcome.level, campaignTribe(w))
) {
  const level = missionData(w.outcome.level).level
  const arity = (
    {
      1028: 1,
      1038: 3,
      1059: 13,
      1068: 4,
      1069: 2,
      1073: 1,
      1081: 1,
      1091: 7,
      1092: 4,
      1095: 2,
      1097: 3,
      1102: 1,
      1108: 6,
      1109: 0,
      1112: 0,
      1117: 0,
      1196: 1,
      1198: 0,
      1204: 1,
      1076: 3,
      1077: 3,
      1085: 2,
      1131: 3,
      1136: 0,
      1151: 1,
      1171: 2,
      1172: 1,
      1173: 2,
      1174: 1,
      1176: 1,
      1177: 4,
      1179: 1,
      1113: 0,
      1115: 2,
      1180: 0,
      1187: 0,
      1197: 0,
      1205: 0,
      1206: 0,
      1207: 0,
      1208: 1,
      1209: 4,
      1210: 3,
      1211: 3,
      1212: 4,
      1213: 5,
      1214: 4,
      1215: 2,
      1221: 1,
    } as Record<number, number>
  )[opcode]
  if (arity === undefined) throw new Error(`Unbound campaign command ${opcode}`)
  if (args.length !== arity) throw new Error(`Invalid campaign command arguments ${opcode}`)
  const read = (index: number) => scriptValue(script, w.ai, index, id => campaignInternal(w, id))
  const writeVariable = (token: number, value: number) => {
    const index = script.fields[token]?.[1]
    if (!Number.isInteger(index) || index < 0 || index >= 64)
      throw new RangeError('Invalid campaign query destination')
    w.ai.variables[index] = value | 0
  }

  if (opcode === 1028) {
    if (args[0] === 1022) w.ai.states = (w.ai.states | 1) >>> 0
    else if (args[0] === 1023) w.ai.states = (w.ai.states & ~1) >>> 0
    return
  }
  if (opcode === 1172) {
    const mode = (args[0] << 16) >> 16
    if (mode === 1022) w.ai.flags = (w.ai.flags | 0x40000) >>> 0
    else if (mode === 1023) w.ai.flags = (w.ai.flags & ~0x40000) >>> 0
    return
  }
  if (opcode === 1173) {
    const index = read(args[0])
    if (!Number.isInteger(index) || index < 0 || index >= w.ai.attributes.length)
      throw new RangeError('Invalid computer attribute')
    w.ai.attributes[index] = read(args[1]) & 255
    return
  }

  if (opcode === 1069) {
    const [x, y] = args.map(read)
    w.ai.flags = (w.ai.flags | 0x20) >>> 0
    w.ai.coordinateLatch = (x & 255) | ((y & 255) << 8)
    return
  }
  if (opcode === 1073) {
    const marker = read(args[0]),
      target = level.markers[marker]
    if (!Number.isInteger(marker) || target === undefined)
      throw new RangeError('Invalid computer marker override')
    w.ai.flags = (w.ai.flags | 0x40) >>> 0
    w.ai.coordinateLatch = target
    return
  }
  if (opcode === 1097) {
    const [model, x, y] = args.map(read),
      target = w.buildings.find(building => {
        if (
          building.team !== campaignTeam(w, campaignTribe(w)) ||
          building.hp <= 0 ||
          buildingModel(building) !== 4
        )
          return false
        const cell = ((y & 254) >>> 1) * 128 + ((x & 254) >>> 1)
        return buildingFootprintCells(buildingPose(building)).includes(cell)
      })
    if (
      !target ||
      w.units.some(
        unit => unit.inside === target.id && (nativePersonModel(unit) === model || isShaman(unit))
      )
    )
      return
    requestTowerStaffing(w.ai, target.id, model)
    return
  }

  if (opcode === 1081) {
    const field = script.fields[args[0]]
    if (!field) throw new RangeError('Invalid script field')
    w.ai.markerValue = (field[1] << 16) >> 16
    return
  }
  if (opcode === 1091) {
    const [index, marker, secondary, ...quotas] = args.map(read),
      entry = w.ai.markerEntries[index]
    if (!entry) throw new RangeError('Invalid computer marker entry')
    entry.marker = (marker << 24) >> 24
    entry.secondary = (secondary << 24) >> 24
    entry.quotas = quotas.map(n => Math.max(0, Math.min(100, n)))
    return
  }
  if (opcode === 1117) {
    w.ai.flags = (w.ai.flags | 0x800) >>> 0
    return
  }
  if (opcode === 1092) {
    requestMarkerTask(w.ai, args.map(read), !!(w.ai.flags & 0x800))
    w.ai.flags = (w.ai.flags & ~0x800) >>> 0
    return
  }

  if (opcode === 1059) {
    const field = (index: number, type: number, value: number) => {
        const field = script.fields[args[index]]
        return field?.[0] === type && field[1] === value
      },
      none = (index: number) => field(index, 2, 1224),
      requested = read(args[1]),
      marker = read(args[3]),
      damage = read(args[4]),
      options = [9, 10, 11, 12].map(index => read(args[index])),
      targetMode = args[2],
      missionTwoAttack =
        targetMode === 1071 &&
        [2, 4].includes(requested) &&
        field(1, 0, requested) &&
        field(3, 2, 1213) &&
        marker === 7 &&
        damage === 10 &&
        field(5, 2, 1188) &&
        field(6, 2, 1188) &&
        field(7, 2, 1185) &&
        options.every((value, index) => value === [0, -1, -1, -1][index]),
      missionFiveAttack =
        targetMode === 1072 &&
        requested === 2 &&
        field(1, 0, 2) &&
        field(3, 2, 1206) &&
        marker === 7 &&
        damage === 6 &&
        field(5, 2, 1188) &&
        field(6, 2, 1185) &&
        field(7, 2, 1185) &&
        options.every((value, index) => value === [0, -1, -1, -1][index]),
      missionSixAttack =
        w.outcome.level === 6 &&
        campaignTribe(w) === 3 &&
        targetMode === 1071 &&
        requested === 5 &&
        field(1, 1, 16) &&
        field(3, 2, 1223) &&
        marker === 0 &&
        damage === 128 &&
        field(5, 2, 1195) &&
        field(6, 2, 1186) &&
        field(7, 2, 1185) &&
        options.every((value, index) => value === [0, 0, 16, -1][index]),
      missionSixChumaraAttack =
        w.outcome.level === 6 &&
        campaignTribe(w) === 2 &&
        targetMode === 1071 &&
        requested === 4 &&
        field(1, 0, 4) &&
        field(3, 2, 1223) &&
        marker === 0 &&
        damage === 20 &&
        field(5, 2, 1188) &&
        field(6, 2, 1186) &&
        field(7, 2, 1188) &&
        options.every((value, index) => value === [0, 7, -1, -1][index]),
      validTarget =
        (targetMode === 1070 && requested === 3 && marker === 3) ||
        (targetMode === 1071 &&
          ((field(1, 2, 1) && field(3, 2, 1223) && marker === 0) || missionTwoAttack)) ||
        missionFiveAttack ||
        missionSixAttack ||
        missionSixChumaraAttack
    if (
      args[0] !== 1118 ||
      args[8] !== 1078 ||
      !validTarget ||
      (!missionTwoAttack &&
        !missionFiveAttack &&
        !missionSixAttack &&
        !missionSixChumaraAttack &&
        (![5, 6, 7].every(none) ||
          damage !== 999 ||
          options.some((value, index) => value !== [0, -1, -1, 0][index])))
    )
      throw new Error('Unsupported computer attack')
    const target =
      targetMode === 1070
        ? { id: 0, target: level.markers[marker] }
        : targetMode === 1072
          ? campaignAttackEntity(
              w,
              w.units.find(u => u.team === campaignTeam(w, 0) && isShaman(u) && u.hp > 0)?.id ?? 0
            )
          : campaignAttackTarget(w, 0, marker)
    if (target === null) return
    requestAttack(
      w.ai,
      target.target,
      marker,
      requested,
      damage,
      [11, 12, 13, 16, 17, 19].map(index => w.ai.attributes[index]),
      w.ai.attributes[28],
      !!(w.ai.states & (1 << 20)),
      campaignTribe(w),
      target.id
    )
    return
  }

  if (opcode === 1068) {
    const tribe =
      args[0] === 1058 ? -1 : args[0] >= 1118 && args[0] <= 1121 ? args[0] - 1118 : read(args[0])
    writeVariable(args[3], campaignPeopleInMarker(w, tribe, read(args[1]), read(args[2])))
    return
  }

  if (opcode === 1095) {
    const [count, model] = args.map(read)
    if (count <= 0 || ![3, 4].includes(model))
      throw new Error(`Unsupported computer training ${count}:${model}`)
    const selection = computerSelectionWorld(w, campaignTribe(w))
    requestTraining(w.ai, count, model, availableTrainingPeople(selection.world), targetModel =>
      computerTrainingBuilding(w, targetModel, campaignTribe(w))
    )
    return
  }

  if (opcode === 1102) {
    const team = campaignTeam(w, campaignTribe(w)),
      shaman = w.units.some(u => u.team === team && isShaman(u) && u.hp > 0)
    requestShamanGuard(
      w.ai,
      read(args[0]),
      [0, 29, 6, 2, 30].map(index => w.ai.attributes[index]),
      shaman
    )
    return
  }

  if (opcode === 1038) {
    // 0x492c30 reads both coordinates even for OFF; disabled orders retain the old target.
    const x = read(args[0]) & 255,
      y = read(args[1]) & 255
    if (args[2] === 1022) w.ai.states = (w.ai.states | 0x400) >>> 0
    else if (args[2] === 1023) w.ai.states = (w.ai.states & ~0x400) >>> 0
    if (w.ai.states & 0x400) {
      w.ai.flags = (w.ai.flags | 0x100) >>> 0
      w.ai.defencePosition = x | (y << 8)
    } else w.ai.flags = (w.ai.flags & ~0x100) >>> 0
    return
  }
  if (opcode === 1196) {
    w.ai.defenceRadius = read(args[0]) & 255
    return
  }
  if (opcode === 1198) {
    buildingCounterattack(w, campaignTeam(w, campaignTribe(w)))
    return
  }
  if (opcode === 1108) {
    // 0x4902e0: preserve the native dword/word/byte widths of the five written fields.
    const [index, model, mana, range, people, mode] = args.map(read)
    if (!Number.isInteger(index) || index < 0 || index >= w.ai.spellEntries.length)
      throw new RangeError('Invalid computer spell entry')
    w.ai.spellEntries[index] = {
      model: model & 255,
      mana: mana | 0,
      range: range & 65535,
      people: people & 255,
      mode: mode & 255,
    }
    return
  }

  if (opcode === 1115) {
    const model = read(args[0]),
      tribe = args[1] >= 1118 && args[1] <= 1121 ? args[1] - 1118 : read(args[1]),
      stock = w.manaWorld.spells[tribe]
    if (!stock || !Number.isInteger(model) || model < 1 || model >= 22)
      throw new RangeError('Invalid one-shot spell grant')
    const count = stock.stocks[model] & 15
    if (count < rules.spellCharging[model].normalLimit)
      stock.stocks[model] = (stock.stocks[model] & 240) | (count + 1)
    return
  }

  if (opcode === 1197) {
    const tribe = campaignTribe(w)
    w.manaTribes[tribe].flags2 = (w.manaTribes[tribe].flags2 | 2) >>> 0
    return
  }

  if (opcode === 1221) {
    const tribe = campaignTribe(w)
    if (args[0] === 1023) {
      w.manaTribes[tribe].flags2 &= ~0x40
      return
    }
    if (args[0] !== 1022) throw new RangeError('Invalid forced attack mode')
    w.manaTribes[tribe].flags2 |= 0x40
    forceCampaignAttack(w)
    return
  }

  // 0x4f2e30 and 0x48cc60 case 0xb0 preserve every unrelated mode bit.
  if (opcode === 1109) {
    w.ai.flags = (w.ai.flags | 0x400) >>> 0
    return
  }
  if (opcode === 1204) {
    if (args[0] === 1022) w.manaWorld.gameFlags = (w.manaWorld.gameFlags & ~0x40) >>> 0
    else if (args[0] === 1023) w.manaWorld.gameFlags = (w.manaWorld.gameFlags | 0x40) >>> 0
    return
  }

  if (opcode === 1112) {
    if (!(w.manaWorld.levelFlags & 0x1000000)) {
      w.manaWorld.levelFlags = (w.manaWorld.levelFlags | 0x20000000) >>> 0
      w.inputMask |= 128
    }
    return
  }
  if (opcode === 1113) {
    if (!(w.manaWorld.levelFlags & 0x1000000)) {
      w.manaWorld.levelFlags = (w.manaWorld.levelFlags & ~0x20000000) >>> 0
      w.inputMask &= ~128
    }
    return
  }
  if (opcode === 1174) {
    const message = read(args[0])
    if (!(w.manaWorld.levelFlags & 0x1000000)) {
      w.lastMessage = addMessage(w.messages, messageStringId(message), () => random(w), 480, 1)
      if (w.lastMessage >= 0) sound(w, 0xe3, campaignPosition(w, 'blue'))
    }
    return
  }
  if (opcode === 1180 || opcode === 1187) {
    const message = w.messages.slots[w.lastMessage]
    if (message) message.flags |= opcode === 1180 ? 0x200 : 0x20000
    return
  }
  if (opcode >= 1205 && opcode <= 1215) {
    flybyCommand(w.flyby, opcode, opcode === 1208 ? [args[0] === 1022 ? 1 : 0] : args.map(read))
    if (opcode === 1206) w.inputMask |= 64
    if (opcode === 1207) w.inputMask &= ~64
    return
  }

  if (opcode === 1136) {
    w.ai.includeIncompleteBuildings = true
    return
  }
  if (opcode === 1151) {
    forceHead(w, read(args[0]))
    return
  }

  if (opcode === 1176) {
    w.lastMessage = addMessage(w.messages, messageStringId(read(args[0])), () => random(w))
    sound(w, 0xe3, campaignPosition(w, 'blue'))
    return
  }
  if (opcode === 1179) {
    const lifetime = read(args[0]),
      message = w.messages.slots[w.lastMessage]
    if (!(w.manaWorld.levelFlags & 0x1000000) && message && message.flags & 1)
      message.lifetime = (lifetime << 16) >> 16
    return
  }
  if (opcode === 1177) {
    const [number, x, y, payload] = args.map(read)
    if (w.manaWorld.levelFlags & 0x1000000) return
    w.lastMessage = addMessage(w.messages, messageStringId(number), () => random(w))
    const message = w.messages.slots[w.lastMessage]
    if (message) {
      message.lifetime = 3000
      message.view = { cell: ((y & 254) << 8) | (x & 254), payload: payload & 65535 }
      message.flags |= 0x3620
      sound(w, 0xe3, campaignPosition(w, 'blue'))
    }
    return
  }

  if (opcode === 1171) {
    removeHead(w, read(args[0]), read(args[1]))
    return
  }
  let value: number
  if (opcode === 1085) {
    value = markerHeight(w.terrain, read(args[0]), w.outcome.level, w.land.heights)
  } else if (opcode === 1131) {
    const x = read(args[0]),
      y = read(args[1]),
      remaining =
        headAt(w, x, y)?.remaining ?? (w.outcome.level === 5 && x === 166 && y === 130 ? 1 : 0)
    // ponytail: Mission 5's Angel reward is still deferred; remove this fallback when that head becomes playable.
    value = (remaining << 24) >> 24
  } else {
    const tribe = args[0] >= 1118 && args[0] <= 1121 ? args[0] - 1118 : read(args[0])
    const model = read(args[1])
    if (
      !Number.isInteger(tribe) ||
      tribe < 0 ||
      tribe > 3 ||
      !Number.isInteger(model) ||
      model < 0 ||
      model >= 22
    ) {
      throw new RangeError('Invalid campaign spell query')
    }
    if (opcode === 1076) {
      value = w.spellCasts[tribe][model] & 255
    } else {
      const spell = SPELLS.find(s => s.model === model)?.id
      if (tribe !== 0 || !spell) throw new Error(`Unbound one-off spell stock ${tribe}:${model}`)
      value = w.shots[spell] & 15 // 0x4c2b40 excludes the separate upper-nibble gift counter.
    }
  }
  // Native destinations use the field's value as a user-variable index, regardless of type.
  writeVariable(args.at(-1)!, value)
}

export function campaignRules(w: World) {
  const tribe = campaignTribe(w),
    script = missionScript(w.outcome.level, tribe)
  const boundCampaignScript = {
    ...script,
    codes:
      w.outcome.level === 6
        ? tribe === 2
          ? [
              12,
              1003,
              ...script.codes.slice(636, 716),
              ...script.codes.slice(731, 746),
              ...script.codes.slice(787, 837),
              ...script.codes.slice(1409, 1464),
              1004,
              1019,
            ]
          : tribe === 3
            ? [
                12,
                1003,
                ...script.codes.slice(352, 501),
                ...script.codes.slice(681, 752),
                1002,
                1004,
                ...script.codes.slice(1185, 1220),
                1004,
                1019,
              ]
            : [12, 1003, 1004, 1019]
        : w.outcome.level === 1
          ? [12, 1003, ...script.codes.slice(382, 1524), 1004, 1019]
          : w.outcome.level === 2
            ? [12, 1003, ...script.codes.slice(251, 938), 1004, 1019]
            : w.outcome.level === 3
              ? [
                  12,
                  1003,
                  ...script.codes.slice(729, 768),
                  ...script.codes.slice(833, 984),
                  1004,
                  1019,
                ]
              : w.outcome.level === 4
                ? [
                    12,
                    1003,
                    ...script.codes.slice(1113, 1246),
                    ...script.codes.slice(1425, 1654),
                    1004,
                    1019,
                  ]
                : w.outcome.level === 5
                  ? [
                      12,
                      1003,
                      ...script.codes.slice(529, 546),
                      ...script.codes.slice(599, 706),
                      1004,
                      ...script.codes.slice(707, 744),
                      1004,
                      ...script.codes.slice(818, 827),
                      1004,
                      ...script.codes.slice(992, 1085),
                      1004,
                      1019,
                    ]
                  : w.outcome.level === 7
                    ? [
                        12,
                        1003,
                        ...script.codes.slice(254, 259),
                        ...script.codes.slice(1892, 1978),
                        1004,
                        1019,
                      ]
                    : [12, 1003, 1004, 1019],
  }
  // ponytail: Missions 4–7 bind only complete delivered blocks; add later AI blocks with their hosts.
  runScript(boundCampaignScript, w.ai, {
    turn: w.turn,
    tribe,
    readInternal: id => campaignInternal(w, id),
    command: (opcode, args) => campaignCommand(w, opcode, args, script),
  })
}
