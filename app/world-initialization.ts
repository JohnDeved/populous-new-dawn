import type { Point, World } from './world-types.ts'
import { addBuilding } from './construction-runtime.ts'
import { campaignPosition, withCampaignTribe } from './campaign-runtime.ts'
import { campaignCommand } from './campaign-command-runtime.ts'
import { nativePosition, syncLandscapeObjects } from './world-terrain-runtime.ts'
import { distance } from './world-coordinates.ts'
import { short } from './native-math.ts'
import { addUnit, breedingWork, createWorldState } from './world-state.ts'
import { isShaman, SPELLS, TURNS_PER_SECOND } from './world-rules.ts'
import { missionData } from './mission-data.ts'
import { createWorship } from './worship.ts'
import { unitKindFromModel } from './unit-kinds.ts'
import { teamForTribe } from './world-types.ts'

export function createWorld(missionNumber = 1): World {
  const mission = missionData(missionNumber),
    level = mission.level,
    w = createWorldState(missionNumber)
  for (const o of level.objects) {
    if (o.type === 2 && o.owner !== 255) {
      const kind =
        o.model === 4
          ? 'tower'
          : o.model === 5
            ? 'temple'
            : o.model === 7
              ? 'camp'
              : o.model === 8
                ? 'firewarriorHut'
                : o.model === 13
                  ? 'boatHouse'
                  : 'hut'
      addBuilding(w, teamForTribe(o.owner), kind, o, true, {
        level: kind === 'hut' ? o.model : 1,
        angle: (o.angle / 2048) * Math.PI * 2,
      })
    }
    if (o.type === 1)
      addUnit(
        w,
        o.owner === 255 && missionNumber === 2 && distance(o, campaignPosition(w, 'blue')) < 6
          ? 'blue'
          : o.owner === 255
            ? 'wild'
            : teamForTribe(o.owner),
        unitKindFromModel(o.model),
        o
      )
    if (o.type === 4) {
      const point = nativePosition(w, o)
      w.vehicles.push({
        ...point,
        id: w.nextId++,
        class: 4,
        model: o.model,
        team: teamForTribe(o.owner),
        physics: 1,
        speed: -1,
        navigationFlags: 0,
        passengerCount: 0,
        passengers: [],
        reservation: 0,
        turnAngle: point.x,
        turnY: point.y,
        heading: (o.angle / 2048) * Math.PI * 2,
        active: false,
      })
    }
    if (o.type === 5 && o.model <= 6)
      w.trees.push({ id: w.nextId++, x: o.x, z: o.z, logs: 4, model: o.model })
    if (o.type === 6 && o.model === 6) {
      const settings = o.settings!,
        linkedObjects = Array.from(
          { length: 10 },
          (_, i) => settings[6 + i * 2] | (settings[7 + i * 2] << 8)
        )
          .filter(Boolean)
          .flatMap(index => level.objects.find(object => object.index + 1 === index) ?? []),
        rewardObject = linkedObjects.find(object => object.type === 6 && object.model === 2),
        linkedVehicle = linkedObjects.find(object => object.type === 4),
        bridge = linkedObjects.find(object => object.type === 7 && object.model === 24),
        erosion = linkedObjects.find(object => object.type === 7 && object.model === 23),
        linked = linkedVehicle ?? bridge ?? erosion ?? rewardObject,
        reward = rewardObject?.settings,
        bridgeTarget = bridge && 'target' in bridge ? (bridge.target as Point) : undefined,
        effectTarget = erosion ? { x: erosion.x, z: erosion.z } : undefined
      const rewardSpell =
          reward?.[0] === 11 ? SPELLS.find(spell => spell.model === reward[1]) : undefined,
        rewardBuilding =
          reward?.[0] === 2
            ? reward[1] === 4
              ? 'tower'
              : reward[1] === 7
                ? 'camp'
                : reward[1] === 5
                  ? 'temple'
                  : reward[1] === 8
                    ? 'firewarriorHut'
                    : reward[1] === 13
                      ? 'boatHouse'
                      : undefined
            : undefined,
        kind =
          settings[0] === 4
            ? 'vault'
            : linked?.type === 4
              ? 'boat'
              : linked?.type === 7 && linked.model === 24 && bridgeTarget
                ? 'bridgeEffect'
                : effectTarget
                  ? 'erosionEffect'
                  : rewardSpell?.id
      // Mission 5's Angel head has a dedicated class-7 owner.
      if (!kind && missionNumber === 5) continue
      // Decorative trigger links have no collectible reward owner.
      if (
        !kind &&
        linkedObjects.length > 0 &&
        linkedObjects.every(object => object.type === 7 && object.model === 81)
      )
        continue
      if (!kind) throw new Error(`Unbound shrine reward ${o.index}`)
      const shrineReward =
        kind === 'vault'
          ? (rewardBuilding ?? rewardSpell?.id)
          : kind === 'bridgeEffect' || kind === 'erosionEffect' || kind === 'boat'
            ? undefined
            : kind
      if (kind !== 'bridgeEffect' && kind !== 'erosionEffect' && kind !== 'boat' && !shrineReward)
        throw new Error(`Unbound shrine gift ${o.index}`)
      const worship = createWorship(settings)
      const vault =
        kind === 'vault'
          ? level.objects.find(r => r.type === 2 && r.model === 18 && distance(r, o) < 3)
          : undefined
      w.shrines.push({
        ...worship,
        nextSlot: 0,
        slotTimer: 0,
        range: settings[1],
        followers: 0,
        forced: false,
        morph: null,
        model: kind === 'vault' ? 154 : 45,
        angle: ((vault?.angle ?? 0) / 2048) * Math.PI * 2,
        id: w.nextId++,
        x: o.x,
        z: o.z,
        kind,
        reward: shrineReward,
        ...(kind === 'bridgeEffect' ? { bridgeTarget } : {}),
        ...(kind === 'erosionEffect' ? { effectTarget } : {}),
        ...(kind === 'boat'
          ? { rewardVehicle: w.vehicles.find(v => v.model === linked!.model && !v.active)!.id }
          : {}),
        name:
          kind === 'vault'
            ? 'Vault of Knowledge'
            : kind === 'bridgeEffect'
              ? 'Land raising stone head'
              : kind === 'erosionEffect'
                ? 'Erosion stone head'
                : kind === 'boat'
                  ? 'Boat stone head'
                  : `${rewardSpell!.name} stone head`,
        progress: 0,
        duration: (worship.target * 4) / TURNS_PER_SECOND,
        uses: 0,
      })
    }
  }
  for (let tribe = 1; tribe < w.campaignAIs.length; tribe++)
    if (w.campaignAIs[tribe])
      withCampaignTribe(w, tribe, ai => {
        ai.pendingCommands = ai.pendingCommands.filter(c => {
          if (
            ![
              1038,
              1069,
              1073,
              1081,
              1091,
              1092,
              1095,
              1097,
              1108,
              1109,
              1112,
              1115,
              1117,
              1196,
              1197,
              1204,
              ...(missionNumber === 4 ? [1174, 1187] : []),
            ].includes(c.opcode)
          )
            return true
          campaignCommand(w, c.opcode, c.args)
          return false
        })
      })
  w.selected = [w.units.find(u => u.team === 'blue' && isShaman(u))!.id]
  w.wood = w.trees.reduce((s, t) => s + Math.floor(t.logs), 0)
  for (const b of w.buildings) if (b.kind === 'hut') b.timer = short(breedingWork(w, b) - 54)
  syncLandscapeObjects(w)
  w.lightView = nativePosition(w, campaignPosition(w, 'blue'))
  return w
}
