import type { Point, Shrine, World } from './world-types.ts'
import { addBuilding } from './construction-runtime.ts'
import { campaignPosition, withCampaignTribe } from './campaign-runtime.ts'
import { campaignCommand } from './campaign-command-runtime.ts'
import { nativePosition, syncLandscapeObjects } from './world-terrain-runtime.ts'
import { distance } from './world-coordinates.ts'
import { short } from './native-math.ts'
import { addUnit, breedingWork, createWorldState } from './world-state.ts'
import { isShaman, SPELLS, TURNS_PER_SECOND } from './world-rules.ts'
import { missionData, tutorialLevel } from './mission-data.ts'
import { createWorship } from './worship.ts'
import { unitKindFromModel } from './unit-kinds.ts'
import { teamForTribe } from './world-types.ts'
import rules from './original-rules.json' with { type: 'json' }

export function createWorld(missionNumber = 1): World {
  const mission = missionData(missionNumber),
    level = mission.level
  const linkedObjects = (object: (typeof level.objects)[number]) =>
    Array.from(
      { length: 10 },
      (_, i) => object.settings![6 + i * 2] | (object.settings![7 + i * 2] << 8)
    )
      .filter(Boolean)
      .flatMap(index => {
        const overloaded = missionNumber === 20 && index >= 0x06ac && index <= 0x06b1
        const linked =
          level.objects.find(candidate => candidate.index + 1 === index) ??
          (overloaded
            ? level.objects.find(candidate => candidate.index + 1 === (index & 255))
            : undefined)
        return linked ?? []
      })
  const linkedReward = (object: (typeof level.objects)[number]): Shrine['reward'] => {
    const reward = object.settings!
    if (reward[0] === 11) return SPELLS.find(spell => spell.model === reward[1])?.id
    if (reward[0] !== 2) return
    return reward[1] === 4
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
  }
  const w = createWorldState(missionNumber),
    linkedObjectIds = new Set(
      level.objects
        .filter(object => object.type === 6 && object.model === 6)
        .flatMap(object => linkedObjects(object).map(linked => linked.index + 1))
    )
  function missionTwentyShrine(object: (typeof level.objects)[number]): Shrine {
    const settings = object.settings!,
      links = linkedObjects(object),
      rewards = links
        .filter(link => link.type === 6 && link.model === 2)
        .flatMap(link => linkedReward(link) ?? []),
      worship = createWorship(settings),
      linkedHead = links.find(link => link.type === 6 && link.model === 6),
      rewardSpell = SPELLS.find(spell => spell.id === rewards[0])
    return {
      ...worship,
      nextSlot: 0,
      slotTimer: 0,
      range: settings[1],
      followers: 0,
      forced: false,
      morph: null,
      model: 45,
      angle: ((object.angle & 2047) / 2048) * Math.PI * 2,
      id: w.nextId++,
      x: object.x,
      z: object.z,
      kind: 'linkedEffects',
      reward: rewards[0],
      ...(rewards.length > 1 ? { rewards } : {}),
      earthquakeTargets: links
        .filter(link => link.type === 7 && link.model === 26)
        .map(link => ({ x: link.x, z: link.z })),
      lightningTargets: links
        .filter(link => link.type === 7 && link.model === 30)
        .map(link => ({ x: link.x, z: link.z })),
      firestormTargets: links
        .filter(link => link.type === 7 && link.model === 22)
        .map(link => ({ x: link.x, z: link.z })),
      volcanoTargets: links
        .filter(link => link.type === 7 && link.model === 15)
        .map(link => ({ x: link.x, z: link.z })),
      linkedTrees: links
        .filter(link => link.type === 5 && link.model <= 6)
        .map(link => ({ x: link.x, z: link.z, model: link.model })),
      ...(linkedHead ? { linkedShrine: missionTwentyShrine(linkedHead) } : {}),
      name: `${rewardSpell?.name ?? 'Linked'} stone head`,
      progress: 0,
      duration: (worship.target * 4) / TURNS_PER_SECOND,
      uses: 0,
    }
  }
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
                    : o.model === 15
                      ? 'balloonHut'
                      : o.model === 19
                        ? 'prison'
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
        life: rules.vehicleLife[o.model],
        destructionState: 0,
      })
    }
    if (o.type === 5 && o.model <= 6 && !(missionNumber === 20 && linkedObjectIds.has(o.index + 1)))
      w.trees.push({ id: w.nextId++, x: o.x, z: o.z, logs: 4, model: o.model })
    if (o.type === 6 && o.model === 6) {
      if (linkedObjectIds.has(o.index + 1)) continue
      if (missionNumber === tutorialLevel && o.index === 2) {
        const worship = createWorship(o.settings!),
          linkedHead = linkedObjects(o).find(object => object.type === 6 && object.model === 6)!,
          linkedWorship = createWorship(linkedHead.settings!)
        w.shrines.push({
          ...worship,
          nextSlot: 0,
          slotTimer: 0,
          range: o.settings![1],
          followers: 0,
          forced: false,
          morph: null,
          model: 0,
          angle: ((o.angle & 2047) / 2048) * Math.PI * 2,
          id: w.nextId++,
          x: o.x,
          z: o.z,
          kind: 'linkedEffects',
          linkedShrine: {
            ...linkedWorship,
            // ponytail: mode-3 Shaman admission and its visit delay ship with the worship lesson.
            enabled: false,
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
            kind: 'inert',
            name: 'Obelisk',
            progress: 0,
            duration: (linkedWorship.target * 4) / TURNS_PER_SECOND,
            uses: 0,
          },
          name: 'Tutorial Obelisk trigger',
          progress: 0,
          duration: (worship.target * 4) / TURNS_PER_SECOND,
          uses: 0,
        })
        continue
      }
      // ponytail: bind later tutorial trigger heads only when their authored lessons ship.
      if (missionNumber === tutorialLevel && ![74, 76].includes(o.index)) continue
      if (missionNumber === 20 && o.index === 322) {
        w.shrines.push(missionTwentyShrine(o))
        continue
      }
      const settings = o.settings!,
        links = linkedObjects(o),
        rewardObjects = links.filter(object => object.type === 6 && object.model === 2),
        rewardObject = rewardObjects[0],
        rewards = rewardObjects.flatMap(object => linkedReward(object) ?? []),
        manaReward =
          missionNumber === 22
            ? rewardObjects.find(
                object => object.settings?.[0] === 6 && [3, 5].includes(object.settings[1])
              )
            : undefined,
        rewardMana = manaReward
          ? (manaReward.settings![4] |
              (manaReward.settings![5] << 8) |
              (manaReward.settings![6] << 16) |
              (manaReward.settings![7] << 24)) >>>
            0
          : undefined,
        linkedVehicle = links.find(object => object.type === 4),
        bridge = links.find(object => object.type === 7 && object.model === 24),
        erosion = links.find(object => object.type === 7 && object.model === 23),
        flatten =
          missionNumber === 21 && o.index === 46
            ? links.find(object => object.type === 7 && object.model === 31)
            : undefined,
        volcano =
          missionNumber === 21 && o.index === 68
            ? links.find(object => object.type === 7 && object.model === 15)
            : undefined,
        earthquakes = links.filter(object => object.type === 7 && object.model === 26),
        linkedHead = links.find(object => object.type === 6 && object.model === 6),
        inert = links.find(object => object.type === 7 && object.model === 92),
        angelStatue = links.find(object => object.type === 7 && object.model === 91),
        angelTarget = links.find(object => object.type === 7 && object.model === 88),
        linked = linkedVehicle ?? bridge ?? erosion ?? rewardObject,
        bridgeTarget = bridge && 'target' in bridge ? (bridge.target as Point) : undefined,
        effectTarget =
          erosion || flatten
            ? { x: (erosion ?? flatten)!.x, z: (erosion ?? flatten)!.z }
            : undefined,
        effectTargets = links
          .filter(object => object.type === 7 && object.model === 23)
          .map(object => ({ x: object.x, z: object.z })),
        earthquakeTargets = earthquakes.map(object => ({ x: object.x, z: object.z })),
        linkedHeadObjects = linkedHead ? linkedObjects(linkedHead) : [],
        linkedHeadTargets = linkedHeadObjects
          .filter(object => object.type === 7 && object.model === 23)
          .map(object => ({ x: object.x, z: object.z }))
      const rewardSpell = SPELLS.find(spell => spell.id === rewards[0]),
        isAngelHead = !!(angelStatue && angelTarget),
        kind =
          settings[0] === 4
            ? 'vault'
            : isAngelHead
              ? 'angel'
              : manaReward
                ? 'mana'
                : missionNumber === 22 && inert
                  ? 'inert'
                  : earthquakeTargets.length && linkedHead
                    ? 'linkedEffects'
                    : missionNumber === 23 && linkedHead
                      ? 'linkedEffects'
                      : linked?.type === 4
                        ? 'boat'
                        : linked?.type === 7 && linked.model === 24 && bridgeTarget
                          ? 'bridgeEffect'
                          : flatten
                            ? 'flattenEffect'
                            : volcano
                              ? 'volcanoEffect'
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
      // ponytail: keep unsupported Mission 21 linked scenery inert until its objective lands.
      if (!kind && missionNumber === 21) continue
      if (!kind) throw new Error(`Unbound shrine reward ${o.index}`)
      const shrineReward =
        kind === 'vault'
          ? rewards[0]
          : kind === 'bridgeEffect' ||
              kind === 'erosionEffect' ||
              kind === 'flattenEffect' ||
              kind === 'volcanoEffect' ||
              kind === 'linkedEffects' ||
              kind === 'boat' ||
              kind === 'mana' ||
              kind === 'inert' ||
              isAngelHead
            ? undefined
            : kind
      if (
        kind !== 'bridgeEffect' &&
        kind !== 'erosionEffect' &&
        kind !== 'flattenEffect' &&
        kind !== 'volcanoEffect' &&
        kind !== 'linkedEffects' &&
        kind !== 'boat' &&
        kind !== 'mana' &&
        kind !== 'inert' &&
        !isAngelHead &&
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
        ...(rewards.length > 1 ? { rewards } : {}),
        ...(kind === 'bridgeEffect' ? { bridgeTarget } : {}),
        ...(kind === 'erosionEffect' ? { effectTarget, effectTargets } : {}),
        ...(kind === 'flattenEffect' ? { effectTarget } : {}),
        ...(kind === 'volcanoEffect' ? { effectTarget: { x: volcano!.x, z: volcano!.z } } : {}),
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
                kind: missionNumber === 23 ? 'linkedEffects' : 'erosionEffect',
                ...(missionNumber === 23
                  ? {
                      rewardMana: 0,
                      rewardModel: linkedHeadObjects.find(object => object.settings?.[0] === 6)
                        ?.settings?.[1],
                      effectTarget: linkedHeadObjects.find(object => object.settings?.[0] === 6),
                    }
                  : { effectTarget: linkedHeadTargets[0], effectTargets: linkedHeadTargets }),
                name: missionNumber === 23 ? 'Stone head' : 'Erosion Totem Pole',
                progress: 0,
                duration: (linkedWorship!.target * 4) / TURNS_PER_SECOND,
                uses: 0,
              },
            }
          : {}),
        ...(kind === 'boat'
          ? { rewardVehicle: w.vehicles.find(v => v.model === linked!.model && !v.active)!.id }
          : {}),
        ...(kind === 'mana'
          ? { rewardMana, rewardModel: manaReward!.settings![1], rewardDelay: 0 }
          : {}),
        ...(isAngelHead ? { angelTarget: { x: angelTarget!.x, z: angelTarget!.z } } : {}),
        name:
          kind === 'vault'
            ? 'Vault of Knowledge'
            : kind === 'bridgeEffect'
              ? 'Land raising stone head'
              : kind === 'erosionEffect'
                ? 'Erosion stone head'
                : kind === 'flattenEffect'
                  ? 'Flatten stone head'
                  : kind === 'volcanoEffect'
                    ? 'Volcano stone head'
                    : kind === 'linkedEffects'
                      ? 'Totem Pole'
                      : kind === 'boat'
                        ? 'Boat stone head'
                        : kind === 'mana'
                          ? 'Mana stone head'
                          : kind === 'inert'
                            ? 'Stone head'
                            : isAngelHead
                              ? 'Angel of Death stone head'
                              : `${SPELLS.find(spell => spell.id === shrineReward)!.name} stone head`,
        progress: 0,
        duration: (worship.target * 4) / TURNS_PER_SECOND,
        uses: 0,
      })
    }
  }
  if (missionNumber === 15) {
    const prison = w.buildings.find(b => b.kind === 'prison'),
      captive = w.units.find(u => u.team === 'blue' && isShaman(u))
    if (!prison || !captive) throw new Error('Missing authored Mission 15 Prison objective')
    captive.inside = prison.id
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
              ...(missionNumber === 15 ? [1174, 1187, 1200] : []),
              ...(missionNumber === 12 ? [1085, 1138, 1190] : []),
              ...(missionNumber === 21 ? [1085, 1138] : []),
              ...([4, 10, 11, 12, 13, 17, 18, 19, 20, 21, 22].includes(missionNumber)
                ? [1174, 1187]
                : []),
            ].includes(c.opcode)
          )
            return true
          campaignCommand(w, c.opcode, c.args)
          return false
        })
      })
  w.selected = w.units
    .filter(u => u.team === 'blue' && isShaman(u) && u.inside === null)
    .map(u => u.id)
  w.wood = w.trees.reduce((s, t) => s + Math.floor(t.logs), 0)
  for (const b of w.buildings) if (b.kind === 'hut') b.timer = short(breedingWork(w, b) - 54)
  syncLandscapeObjects(w)
  w.lightView = nativePosition(w, campaignPosition(w, 'blue'))
  return w
}
