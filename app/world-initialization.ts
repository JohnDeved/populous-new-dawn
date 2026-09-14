import type { Point, World } from './world-types.ts'
import { addBuilding } from './construction-runtime.ts'
import { campaignPosition } from './campaign-runtime.ts'
import { campaignCommand } from './campaign-command-runtime.ts'
import { nativePosition, syncLandscapeObjects } from './world-terrain-runtime.ts'
import { distance } from './world-coordinates.ts'
import { short } from './native-math.ts'
import { addUnit, breedingWork, createWorldState } from './world-state.ts'
import { isShaman, SPELLS, TURNS_PER_SECOND } from './world-rules.ts'
import { missionData } from './mission-data.ts'
import { createWorship } from './worship.ts'
import { unitKindFromModel } from './unit-kinds.ts'

export function createWorld(missionNumber = 1): World {
  const mission = missionData(missionNumber),
    level = mission.level,
    w = createWorldState(missionNumber)
  for (const o of level.objects) {
    if (o.type === 2 && o.owner !== 255) {
      const kind =
        o.model === 4 ? 'tower' : o.model === 5 ? 'temple' : o.model === 7 ? 'camp' : 'hut'
      addBuilding(w, o.owner === 0 ? 'blue' : 'red', kind, o, true, {
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
            : o.owner === 0
              ? 'blue'
              : 'red',
        unitKindFromModel(o.model),
        o
      )
    if (o.type === 5 && o.model <= 6)
      w.trees.push({ id: w.nextId++, x: o.x, z: o.z, logs: 4, model: o.model })
    if (o.type === 6 && o.model === 6) {
      const settings = o.settings!,
        linked = level.objects.find(r => r.index + 1 === (settings[6] | (settings[7] << 8))),
        reward = linked?.settings,
        bridgeTarget = linked && 'target' in linked ? (linked.target as Point) : undefined,
        effectTarget =
          linked?.type === 7 && linked.model === 23 ? { x: linked.x, z: linked.z } : undefined
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
                  : undefined
            : undefined,
        kind =
          settings[0] === 4
            ? 'vault'
            : linked?.type === 7 && linked.model === 24 && bridgeTarget
              ? 'bridgeEffect'
              : effectTarget
                ? 'erosionEffect'
                : rewardSpell?.id
      if (!kind) throw new Error(`Unbound shrine reward ${o.index}`)
      const shrineReward =
        kind === 'vault'
          ? (rewardBuilding ?? rewardSpell?.id)
          : kind === 'bridgeEffect' || kind === 'erosionEffect'
            ? undefined
            : kind
      if (kind !== 'bridgeEffect' && kind !== 'erosionEffect' && !shrineReward)
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
        name:
          kind === 'vault'
            ? 'Vault of Knowledge'
            : kind === 'bridgeEffect'
              ? 'Land raising stone head'
              : kind === 'erosionEffect'
                ? 'Erosion stone head'
                : `${rewardSpell!.name} stone head`,
        progress: 0,
        duration: (worship.target * 4) / TURNS_PER_SECOND,
        uses: 0,
      })
    }
  }
  w.ai.pendingCommands = w.ai.pendingCommands.filter(c => {
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
  w.selected = [w.units.find(u => u.team === 'blue' && isShaman(u))!.id]
  w.wood = w.trees.reduce((s, t) => s + Math.floor(t.logs), 0)
  for (const b of w.buildings) if (b.kind === 'hut') b.timer = short(breedingWork(w, b) - 54)
  syncLandscapeObjects(w)
  w.lightView = nativePosition(w, campaignPosition(w, 'blue'))
  return w
}
