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
    level = mission.level
  const linkedObjects = (object: (typeof level.objects)[number]) =>
    Array.from(
      { length: 10 },
      (_, i) => object.settings![6 + i * 2] | (object.settings![7 + i * 2] << 8)
    )
      .filter(Boolean)
      .flatMap(index => level.objects.find(candidate => candidate.index + 1 === index) ?? [])
  const w = createWorldState(missionNumber),
    linkedObjectIds = new Set(
      level.objects
        .filter(object => object.type === 6 && object.model === 6)
        .flatMap(object => linkedObjects(object).map(linked => linked.index + 1))
    )
  for (const o of level.objects) {
    if (o.type === 2 && o.owner !== 255) {
      const kind =
        o.model === 4
          ? 'tower'
          : o.model === 5
            ? 'temple'
            : o.model === 6
              ? 'spyHut'
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
        active: !linkedObjectIds.has(o.index + 1),
      })
    }
    if (o.type === 5 && o.model <= 6)
      w.trees.push({ id: w.nextId++, x: o.x, z: o.z, logs: 4, model: o.model })
    if (o.type === 6 && o.model === 6) {
      if (linkedObjectIds.has(o.index + 1)) continue
      const settings = o.settings!,
        links = linkedObjects(o),
        rewardObject = links.find(object => object.type === 6 && object.model === 2),
        linkedVehicle = links.find(object => object.type === 4),
        bridge = links.find(object => object.type === 7 && object.model === 24),
        erosion = links.find(object => object.type === 7 && object.model === 23),
        earthquakes = links.filter(object => object.type === 7 && object.model === 26),
        linkedHead = links.find(object => object.type === 6 && object.model === 6),
        angelStatue = links.find(object => object.type === 7 && object.model === 91),
        angelTarget = links.find(object => object.type === 7 && object.model === 88),
        linked = linkedVehicle ?? bridge ?? erosion ?? rewardObject,
        reward = rewardObject?.settings,
        bridgeTarget = bridge && 'target' in bridge ? (bridge.target as Point) : undefined,
        effectTarget = erosion ? { x: erosion.x, z: erosion.z } : undefined,
        effectTargets = links
          .filter(object => object.type === 7 && object.model === 23)
          .map(object => ({ x: object.x, z: object.z })),
        earthquakeTargets = earthquakes.map(object => ({ x: object.x, z: object.z })),
        linkedHeadObjects = linkedHead ? linkedObjects(linkedHead) : [],
        linkedHeadTargets = linkedHeadObjects
          .filter(object => object.type === 7 && object.model === 23)
          .map(object => ({ x: object.x, z: object.z }))
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
                  : reward[1] === 6
                    ? 'spyHut'
                    : reward[1] === 8
                      ? 'firewarriorHut'
                      : reward[1] === 13
                        ? 'boatHouse'
                        : reward[1] === 15
                          ? 'balloonHut'
                          : undefined
            : undefined,
        kind =
          settings[0] === 4
            ? 'vault'
            : angelStatue && angelTarget
              ? 'angel'
              : earthquakeTargets.length && linkedHead
                ? 'linkedEffects'
                : linked?.type === 4
                  ? 'boat'
                  : linked?.type === 7 && linked.model === 24 && bridgeTarget
                    ? 'bridgeEffect'
                    : effectTarget
                      ? 'erosionEffect'
                      : rewardSpell?.id
      // Decorative trigger links have no collectible reward owner.
      if (
        !kind &&
        links.length > 0 &&
        links.every(object => object.type === 7 && object.model === 81)
      )
        continue
      if (!kind) throw new Error(`Unbound shrine reward ${o.index}`)
      const shrineReward =
        kind === 'vault'
          ? (rewardBuilding ?? rewardSpell?.id)
          : kind === 'bridgeEffect' ||
              kind === 'erosionEffect' ||
              kind === 'linkedEffects' ||
              kind === 'boat' ||
              kind === 'angel'
            ? undefined
            : kind
      if (
        kind !== 'bridgeEffect' &&
        kind !== 'erosionEffect' &&
        kind !== 'linkedEffects' &&
        kind !== 'boat' &&
        kind !== 'angel' &&
        !shrineReward
      )
        throw new Error(`Unbound shrine gift ${o.index}`)
      const worship = createWorship(settings),
        linkedWorship = linkedHead ? createWorship(linkedHead.settings!) : undefined
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
        angle: (((vault?.angle ?? o.angle) & 2047) / 2048) * Math.PI * 2,
        id: w.nextId++,
        x: o.x,
        z: o.z,
        kind,
        reward: shrineReward,
        ...(kind === 'bridgeEffect' ? { bridgeTarget } : {}),
        ...(kind === 'erosionEffect' ? { effectTarget, effectTargets } : {}),
        ...(kind === 'linkedEffects' && linkedHead
          ? {
              earthquakeTargets,
              linkedShrine: {
                ...linkedWorship!,
                nextSlot: 0,
                slotTimer: 0,
                range: linkedHead.settings![1],
                followers: 0,
                forced: false,
                morph: null,
                model: 45,
                angle: ((linkedHead.angle & 2047) / 2048) * Math.PI * 2,
                id: w.nextId++,
                x: linkedHead.x,
                z: linkedHead.z,
                kind: 'erosionEffect',
                effectTarget: linkedHeadTargets[0],
                effectTargets: linkedHeadTargets,
                name: 'Erosion Totem Pole',
                progress: 0,
                duration: (linkedWorship!.target * 4) / TURNS_PER_SECOND,
                uses: 0,
              },
            }
          : {}),
        ...(kind === 'boat'
          ? { rewardVehicle: w.vehicles.find(v => v.model === linked!.model && !v.active)!.id }
          : {}),
        ...(kind === 'angel' ? { angelTarget: { x: angelTarget!.x, z: angelTarget!.z } } : {}),
        name:
          kind === 'vault'
            ? 'Vault of Knowledge'
            : kind === 'bridgeEffect'
              ? 'Land raising stone head'
              : kind === 'erosionEffect'
                ? 'Erosion stone head'
                : kind === 'linkedEffects'
                  ? 'Totem Pole'
                  : kind === 'boat'
                    ? 'Boat stone head'
                    : kind === 'angel'
                      ? 'Angel of Death stone head'
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
              ...(missionNumber === 12 ? [1085, 1138, 1190] : []),
              ...([4, 10, 11, 12, 13].includes(missionNumber) ? [1174, 1187] : []),
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
