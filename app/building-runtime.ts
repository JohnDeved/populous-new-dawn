import { tribeForTeam, type Building, type Tree, type World } from './world-types.ts'
import {
  queueTerrain,
  processTerrain,
  updateWalkMasks,
  terrainPointHeight,
} from './native-terrain.ts'
import {
  terrainTextures,
  nativePosition,
  refreshTerrainSurface,
  buildingStage,
  notifyHeightChanges,
} from './world-terrain-runtime.ts'
import {
  buildingPose,
  buildingModel,
  buildingObject,
  buildingSmokePoint,
} from './building-shapes.ts'
import { collapseBuildingFaces } from './building-debris.ts'
import { effect, stepDebrisEffect, moveVisual, sound, depleteTree } from './world-effects.ts'
import { emitBlastWave } from './spell-effects-runtime.ts'
import { browserPosition } from './world-coordinates.ts'
import {
  ensureBuildingDamage,
  stepBuildingBurn,
  processBuildingDamage,
  changeBuildingWork,
  advanceCollapse,
} from './building-damage.ts'
import { stepBuildingTerrain, stepTerrainCollapse } from './building-terrain.ts'
import { release } from './world-tasks.ts'
import { initializeLivePanic } from './live-people.ts'
import { createBuildingSmoke, type BuildingSmoke } from './building-smoke.ts'
import { random } from './native-math.ts'
import { buildingHp } from './world-rules.ts'
import { creditCampaignAttackTask } from './campaign-runtime.ts'
import modelAssets from './original-models.json' with { type: 'json' }
import type { NativeModel } from './model-faces.ts'
import rules from './original-rules.json' with { type: 'json' }

export const debrisModels: Record<number, NativeModel> = modelAssets

export function changedBuildingGround(w: World, index: number) {
  const cell = ((index & 127) << 1) | ((index >> 7) << 9)
  queueTerrain(w.land, cell, 2, 1, terrainTextures)
  processTerrain(w.land, terrainTextures)
  updateWalkMasks(w.land, cell, 3)
  notifyHeightChanges(w, [{ cell, radius: 1 }])
  refreshTerrainSurface(w)
}

function emitBuildingDebris(w: World, b: Building, stage: number, rng: { randomState: number }) {
  const source = {
    ...nativePosition(w, b),
    h: Math.round(b.foundation * 45),
    angle: buildingPose(b).angle,
    flags3: b.damageState?.flags3 ?? 0,
    tribe: tribeForTeam(b.team),
    stage: buildingStage(b),
  }
  for (const fragment of collapseBuildingFaces(
    w.land,
    debrisModels[buildingObject(b)],
    source,
    stage,
    rng
  )) {
    const fx = effect(w, 'debris', browserPosition(fragment))
    fx.debris = fragment
    fx.duration = Infinity
    if (!stepDebrisEffect(w, fx, rng)) w.effects.splice(w.effects.indexOf(fx), 1)
  }
}

export function stepBuildingGroundResponse(w: World, b: Building) {
  const terrain = b.terrainState
  if (!terrain || b.preparation) return
  if (terrain.dirty && !((b.damageState?.flags2 ?? 0) & 0x2000000)) {
    const state = {
      ...buildingPose(b),
      ...terrain,
      model: buildingModel(b),
      counter: b.counter,
      state: b.damageState?.state ?? (b.progress === 1 ? 2 : 1),
      flags2: (b.damageState?.flags2 ?? 0) | 4,
      h: Math.round(b.foundation * 45),
    }
    stepBuildingTerrain(w.land, state, {
      // These linked indicator/attachment and dock-warning objects have no live
      // owner yet. The first mission's playable buildings do not allocate them.
      indicator: () => {},
      attachment: () => {},
      dock: () => {},
      terrainChanged: index => changedBuildingGround(w, index),
      occupants: () => {
        for (const u of w.units) {
          if (u.inside !== b.id || u.hp <= 0 || !u.native || !(u.native.flags2 & 0x20000)) continue
          const p = nativePosition(w, u),
            i = (p.y >> 9) * 128 + (p.x >> 9)
          if ((w.land.buildingIds[i] & 1023) === (b.id & 1023))
            u.native.h = terrainPointHeight(w.land, p)
        }
      },
      collapse: () => {
        state.flags2 |= 0x100000
        state.delay = 2
        ensureBuildingDamage(b).state = 3
      },
    })
    Object.assign(terrain, {
      flooded: state.flooded,
      delay: state.delay,
      reason: state.reason,
      dirty: !!(state.flags2 & 4),
    })
    b.foundation = state.h / 45
    if (b.damageState) b.damageState.flags2 = state.flags2
  }
  if (b.damageState?.state !== 3) return
  stepTerrainCollapse(terrain, {
    eject: () => evacuateBuilding(w, b),
    destroy: reason => {
      if (reason === 1) {
        emitBuildingDebris(w, b, -1, w)
        emitBlastWave(w, b, b.team, true)
      } else if (reason === 2) {
        const fx = effect(w, 'sinking', b)
        fx.sinking = {
          ...buildingPose(b),
          ...nativePosition(w, b),
          h: Math.round(b.foundation * 45),
          stage: buildingStage(b),
          counter: (w.effectCounter - 1) & 255,
          remaining: 80,
          phase: 0,
          tilt: 0,
          roll: 0,
          direction: 0,
          target: 0,
          speed: 0,
          fallSpeed: 0,
          spin: 0,
          spinDirection: 0,
          sector: 0,
          shoreScore: 0,
        }
        fx.height = b.foundation
        fx.duration = Infinity
      }
      // Native attacker statistics and mixed-class allocation ordering remain open.
      b.hp = 0
      for (const u of w.units.filter(u => u.work === b.id || u.inside === b.id)) release(w, u)
      if (b.burn?.soundPlaying) sound(w, 0x53, b, b.id).stop = true
    },
  })
}

export function evacuateBuilding(w: World, b: Building, burning = false) {
  for (const u of w.units.filter(u => u.inside === b.id && u.hp > 0)) {
    const p = release(w, u)!
    if (burning) {
      u.burnTrail = 24
      u.native = p
      p.flags2 &= ~16
      initializeLivePanic(w, u)
    }
  }
}

export function damageDisasterBuilding(
  w: World,
  b: Building,
  rng: { randomState: number },
  attacker?: number
) {
  const state = ensureBuildingDamage(b),
    oldStage = state.stage
  if (attacker !== undefined && attacker !== -1) state.attacker = attacker
  if (
    changeBuildingWork(state.plan, -100, state, null, {
      move: () => {},
      release: () => {},
      init: () => {},
    })
  ) {
    emitBuildingDebris(w, b, oldStage, rng)
    sound(w, 0x12, b)
  }
  if (attacker !== undefined) state.plan.repairDelay = rules.buildingRepairDelay
  if (attacker !== undefined && attacker !== -1) state.plan.attacker = attacker
  b.progress = Math.max(0, state.plan.remaining) / rules.buildingLife[state.model]
  b.logs = Math.max(0, Math.floor(state.plan.remaining / 100))
  b.hp = Math.min(b.hp, buildingHp(b.kind) * b.progress)
}

export function damageTornadoTree(w: World, tree: Tree) {
  const wood = Math.max(
    0,
    Math.min(rules.sceneryWood[tree.model], Math.round(tree.logs * 100) - 100)
  )
  if (wood < 100) depleteTree(w, tree)
  else tree.logs = wood / 100
}

function emitBuildingSmoke(w: World, b: Building, rng: { randomState: number }) {
  const point = buildingSmokePoint(buildingPose(b), rng)
  if (!point) return null
  const cloud = createBuildingSmoke(w.land, point, rng)
  const fx = effect(w, 'buildingSmoke', browserPosition(point))
  fx.animation = fx.smoke = cloud
  fx.groundVersion = w.landVersion
  fx.duration = Infinity
  moveVisual(fx, cloud)
  return cloud
}

export function stepBurningBuilding(w: World, b: Building) {
  const state = b.damageState!,
    burn = b.burn!
  state.occupants = w.units.filter(u => u.inside === b.id && u.hp > 0).length
  stepBuildingBurn(state, burn, {
    eject: () => evacuateBuilding(w, b, true),
    sound: () => {
      sound(w, 0x53, b, b.id)
      burn.soundPlaying = true
    },
    damage: () => {
      sound(w, 0x53, b, b.id).stop = true
      const plan = state.plan
      if (
        changeBuildingWork(plan, -100, state, null, {
          move: () => {},
          release: () => {},
          init: () => {},
        })
      ) {
        const smoke = emitBuildingSmoke(w, b, w)
        if (smoke) smoke.lifetime = (((random(w) & 255) + rules.buildingSmokeDuration) << 16) >> 16
      }
      plan.repairDelay = rules.buildingRepairDelay
      if (state.attacker !== 255) plan.attacker = state.attacker
      b.hp = Math.min(
        b.hp,
        (buildingHp(b.kind) * Math.max(0, plan.remaining)) / rules.buildingLife[state.model]
      )
    },
    finish: () => {
      b.burn = undefined
      b.progress = Math.max(0, state.plan.remaining) / rules.buildingLife[state.model]
      b.logs = Math.max(0, Math.floor(state.plan.remaining / 100))
    },
  })
}

export function stepDamagedBuilding(w: World, b: Building) {
  const state = b.damageState!
  state.counter = b.counter
  state.occupants = w.units.filter(u => u.inside === b.id && u.hp > 0).length
  advanceCollapse(w, state)
  const smoke = { duration: 0, cloud: null as BuildingSmoke | null },
    context = { randomState: w.randomState, tribes: [] }
  processBuildingDamage(context, state, {
    ensurePlan: () => {
      if (state.state === 2 && !(state.flags2 & 0x100000)) state.state = 1
    },
    plan: () => state.plan,
    changeWork: (p, n) =>
      changeBuildingWork(p, n, state, null, { move: () => {}, release: () => {}, init: () => {} }),
    removeOccupant: () => {
      const u = w.units.find(u => u.inside === b.id && u.hp > 0)
      if (u) release(w, u)
      state.occupants--
    },
    smoke: () => {
      smoke.cloud = emitBuildingSmoke(w, b, context)
      return smoke.cloud ? smoke : null
    },
    debris: oldStage => emitBuildingDebris(w, b, oldStage, context),
    canRespond: () => false,
    reserve: () => {},
    removePlan: () => {},
    notify: () => {},
    removeBuilding: () => {
      if (b.attackTaskMember !== undefined) creditCampaignAttackTask(w, b.attackTaskMember, 1)
      b.hp = 0
    },
    sound: () => sound(w, 0x34, b),
  })
  // ponytail: native plan stages drive collapse; combat HP,
  // plan geometry and AI repair selection await the rest of the building port.
  b.hp = Math.min(
    b.hp,
    (buildingHp(b.kind) * Math.max(0, state.plan.remaining)) / rules.buildingLife[state.model]
  )
  w.randomState = context.randomState
  if (smoke.cloud) smoke.cloud.lifetime = smoke.duration
}
