import {
  type World,
  type Point,
  type NativePoint,
  type Team,
  type Tree,
  type SoundEvent,
  type Effect,
  type Gift,
} from './world-types.ts'
import constants from './original-constants.json' with { type: 'json' }
import rules from './original-rules.json' with { type: 'json' }
import modelAssets from './original-models.json' with { type: 'json' }
import { SPELLS, TURNS_PER_SECOND } from './world-rules.ts'
import { nativePosition } from './world-terrain-runtime.ts'
import { browserPosition } from './world-coordinates.ts'
import { terrainPointHeight } from './native-terrain.ts'
import { setAnimationObject } from './animation.ts'
import { addTerrainLight, updateTerrainLights } from './terrain-light.ts'
import { createSpellTrail } from './spell-trails.ts'
import { stepBuildingDebris } from './building-debris.ts'
import {
  createSceneryFire,
  setFireLifetime,
  stepSceneryFire,
  stepBurningTree,
} from './scenery-fire.ts'
import { createBuildingSmoke } from './building-smoke.ts'
import { replantDelay, stepReplant, findReplantSite, stepTreeGrowth } from './tree-growth.ts'
import { stepTimberReservations } from './timber.ts'
import { campaignPosition, campaignShamanTeams } from './campaign-runtime.ts'
import { reincarnationStones } from './reincarnation.ts'
import { terrainSupportsPerson } from './person-collision.ts'
import type { NativeModel } from './model-faces.ts'

const debrisModels: Record<number, NativeModel> = modelAssets

// Presentation events have their own serial; they never consume simulation IDs or random values.
// ponytail: retain 128 recent cues; a streaming consumer is needed if a catch-up frame exceeds that history.
export function sound(w: World, cue: number, p: Point, owner?: number) {
  const event: SoundEvent = {
    serial: ++w.soundSerial,
    cue,
    x: p.x,
    z: p.z,
    turn: w.turn,
    ...(owner === undefined ? {} : { owner }),
  }
  w.sounds.push(event)
  if (w.sounds.length > 128) w.sounds.shift()
  return event
}
export function requestTutorial(w: World, flags: number, message: number) {
  // 0x499f40 mode 9: a single transient tooltip, not tutorial history.
  if (flags === 0x200000 && message === 603)
    w.routeNotice = { flags, message, serial: (w.routeNotice?.serial ?? 0) + 1 }
}
export function effect(w: World, kind: Effect['kind'], p: Point, silent = false) {
  // Browser allocation adapter; full native class-7 allocation ownership is pending.
  // Debris (class 10) and fire (class 5) have separate native counters.
  if (
    kind !== 'debris' &&
    kind !== 'fire' &&
    kind !== 'orderMarker' &&
    kind !== 'reincarnation' &&
    kind !== 'gift'
  )
    w.effectCounter = (w.effectCounter + 1) & 255
  const f: Effect = {
    x: p.x,
    z: p.z,
    kind,
    id: w.nextId++,
    age: 0,
    duration:
      kind === 'bridge'
        ? constants.LAND_BRIDGE_DURATION / TURNS_PER_SECOND
        : kind === 'hit'
          ? 0.5
          : 1.7,
  }
  if (
    kind === 'blast' ||
    kind === 'lightning' ||
    kind === 'splash' ||
    kind === 'birth' ||
    kind === 'orderMarker'
  ) {
    // Effect 38: 0x509c10 grounds the flash (0x445c20), sets draw 30/HFX1099;
    // state 0x24 in 0x50a750 removes its object after nine simulation turns.
    // Lightning starts hidden: one pending turn, then eight turns of upper flash.
    const position = nativePosition(w, p)
    f.height = (terrainPointHeight(w.land, position) + (kind === 'lightning' ? 1024 : 0)) / 45
    f.turnsRemaining = kind === 'splash' || kind === 'birth' ? 16 : 9
    f.duration = f.turnsRemaining / TURNS_PER_SECOND
    f.animation = {
      object: 0,
      draw: 0,
      morph: 0,
      palette: 0,
      renderFlags: 0,
      f1: 0,
      f2: 0,
      stamp: 0,
      flags3: 0,
      morphTimer: 0,
      morphFrames: 0,
    }
    if (kind === 'orderMarker') {
      // 0x4afff0 overrides class-7/model-61: grounded HFX1294, lowered 160,
      // four processor visits. Secondary allocation preserves the class counter.
      f.height -= 160 / 45
      f.turnsRemaining = 4
      f.duration = 4 / TURNS_PER_SECOND
      f.sprite = { sequence: 'hit', frame: 0 }
      setAnimationObject(f.animation, 46, 1294)
    } else if (kind === 'birth') {
      // 0x404c80 overrides effect 60's initial draw 44/HFX1288 with 41/HFX1441.
      setAnimationObject(f.animation, 44, 1288)
      setAnimationObject(f.animation, 41, 1441)
    } else if (kind === 'splash') {
      // Effect 65, 0x513830: grounded draw 44/HFX1304, cue 44, sixteen turns.
      setAnimationObject(f.animation, 44, 1304)
      f.animation.morph = 0xd3
      f.animation.flags3 |= 0x40400
      if (!silent) sound(w, 0x2c, p)
    } else {
      setAnimationObject(f.animation, kind === 'blast' ? 30 : 41, kind === 'blast' ? 1099 : 0x650)
    }
  }
  w.effects.push(f)
  if (kind === 'blast') registerTerrainLight(w, f, 4)
  return f
}
export function createGift(w: World, reward: Gift['reward'], p: Point) {
  const gift = effect(w, 'gift', p) as Gift
  Object.assign(gift, {
    reward,
    remaining: 82,
    phase: 6,
    frame:
      reward === 'camp' ||
      reward === 'tower' ||
      reward === 'temple' ||
      reward === 'firewarriorHut' ||
      reward === 'vault'
        ? 1077
        : 1056 + SPELLS.find(spell => spell.id === reward)!.model,
    height: (terrainPointHeight(w.land, nativePosition(w, p)) + 800) / 45,
    duration: Infinity,
  })
  w.gifts.push(gift)
  return gift
}
export function shotVisual(w: World, p: NativePoint, team: Team, sequence: string, frame = 0) {
  const fx = effect(w, 'trail', browserPosition(p))
  fx.height = p.h / 45
  fx.sprite = { sequence, frame }
  fx.team = team
  fx.duration = Infinity
  if (sequence === 'blastTrail' || sequence === 'spellTrail') {
    const trail = createSpellTrail(
      w.land,
      p,
      sequence === 'blastTrail' ? 3 : 4,
      (w.effectCounter - 1) & 255,
      w.cosmeticRandom
    )
    // 0x4bb440 overrides Blast jitter trails to expire their first phase next turn.
    if (sequence === 'blastTrail') {
      trail.remaining = 0
      trail.flags3 |= 0x100
    }
    fx.animation = trail
    fx.height = trail.h / 45
  }
  return fx
}
export function moveVisual(f: Effect, p: NativePoint) {
  Object.assign(f, browserPosition(p))
  f.height = p.h / 45
}
// Class-7/model-3 sparks are shared by landings, debris and fire embers.
export function emitGroundSpark(w: World, position: NativePoint) {
  const fx = effect(w, 'trail', browserPosition(position))
  const trail = createSpellTrail(w.land, position, 3, (w.effectCounter - 1) & 255, w.cosmeticRandom)
  fx.animation = trail
  fx.sprite = { sequence: 'blastTrail', frame: 0 }
  fx.duration = Infinity
  moveVisual(fx, trail)
  return trail
}

export function stepDebrisEffect(w: World, fx: Effect, rng: { randomState: number }) {
  const fragment = fx.debris!
  const alive = stepBuildingDebris(w.land, fragment, rng, water => {
    const position = browserPosition(fragment)
    if (water) {
      effect(w, 'splash', position)
    } else {
      emitGroundSpark(w, fragment)
      sound(w, 0x13, position)
    }
  })
  moveVisual(fx, fragment)
  return alive
}

export function createFire(
  w: World,
  p: Point,
  options: {
    size: number
    snap: boolean
    smoke: boolean
    turns: number
    suppressEmbers?: boolean
    light?: boolean
  }
) {
  const fx = effect(w, 'fire', p)
  fx.fire = createSceneryFire(w.land, nativePosition(w, p), options, w.cosmeticRandom)
  setFireLifetime(fx.fire, options.turns)
  fx.fire.suppressEmbers = options.suppressEmbers ?? false
  fx.fire.expiring = fx.fire.suppressEmbers
  fx.duration = Infinity
  fx.groundVersion = w.landVersion
  moveVisual(fx, fx.fire)
  if (options.light !== false) registerTerrainLight(w, fx, 3)
}

export function depleteTree(w: World, tree: Tree, computer = false) {
  tree.logs = 0
  const remaining = replantDelay(tree.model, computer)
  if (remaining) w.replants.push({ ...nativePosition(w, tree), model: tree.model, remaining })
}

export function stepScenery(w: World) {
  // Snapshot requests before this turn's fire/harvesting can create new ones.
  w.replants = w.replants.filter(
    request =>
      !stepReplant(request, () => {
        const occupied = new Map<number, { class: number; model: number }[]>()
        const add = (p: NativePoint, model: number) => {
          const cell = ((p.y & 65535) >> 9) * 128 + ((p.x & 65535) >> 9)
          const row = occupied.get(cell) ?? []
          row.push({ class: 5, model })
          occupied.set(cell, row)
        }
        for (const tree of w.trees) if (tree.logs > 0) add(nativePosition(w, tree), tree.model)
        for (const shrine of w.shrines) add(nativePosition(w, shrine), 9)
        for (const team of campaignShamanTeams(w)) {
          const center = campaignPosition(w, team)
          for (const stone of reincarnationStones(w.land, nativePosition(w, center))) add(stone, 12)
        }
        for (const fx of w.effects) if (fx.fire) add(fx.fire, 10)
        const point = findReplantSite(
          w.land,
          w.indexedSearch,
          request,
          cell => occupied.get(cell) ?? []
        )
        if (!point) return false
        // Native scenery initialization snaps the allocated corner to its cell center.
        w.trees.push({
          ...browserPosition({ x: point.x + 256, y: point.y + 256 }),
          id: w.nextId++,
          model: request.model,
          logs: 1,
          counter: 0,
          growth: rules.sceneryGrowth[request.model],
        })
        return true
      })
  )
  // Snapshot before tree/fire callbacks allocate this turn's new scenery.
  const fires = w.effects.filter(fx => fx.fire)
  for (const tree of w.trees) {
    stepTimberReservations(tree)
    tree.counter = ((tree.counter ?? 0) + 1) & 255
    if (tree.logs <= 0) continue
    if (!tree.burn) {
      const state = {
        model: tree.model,
        counter: tree.counter,
        wood: Math.round(tree.logs * 100),
        growth: tree.growth ?? rules.sceneryGrowth[tree.model],
      }
      stepTreeGrowth(state)
      tree.logs = state.wood / 100
      tree.growth = state.growth
      continue
    }
    tree.burn.wood = Math.round(tree.logs * 100)
    const alive = stepBurningTree(
      tree.burn,
      rules.sceneryWood[tree.model],
      debrisModels[tree.model + 12]?.scale ?? 0,
      () => createFire(w, tree, { size: 32, snap: false, smoke: true, turns: 76 })
    )
    if (alive) tree.logs = tree.burn.wood / 100
    else if (tree.burn.remaining >= 0 && tree.burn.wood < 100) depleteTree(w, tree)
    else tree.logs = 0 // 0x4a7bd0's expiry removal does not allocate a replant request.
  }
  for (const fx of fires) {
    const fire = fx.fire!
    if (fx.groundVersion !== w.landVersion) fire.groundDirty = true
    fx.groundVersion = w.landVersion
    const alive = stepSceneryFire(w.land, fire, w, {
      isLand: () =>
        !!terrainSupportsPerson(w.land.categories[(fire.y >> 9) * 128 + (fire.x >> 9)], fire),
      sound: () => {
        sound(w, 6, fx, fx.id)
        fire.soundPlaying = true // Cleared when its audio voice ends.
      },
      ember: (position, speed, flags) => {
        const trail = emitGroundSpark(w, position)
        trail.speed = speed
        trail.flags4 |= flags
      },
      smoke: () => {
        const cloud = createBuildingSmoke(w.land, fire, w)
        const smoke = effect(w, 'buildingSmoke', browserPosition(fire))
        smoke.animation = smoke.smoke = cloud
        smoke.groundVersion = w.landVersion
        smoke.duration = Infinity
        moveVisual(smoke, cloud)
      },
    })
    moveVisual(fx, fire)
    if (!alive) fx.duration = fx.age
  }
}
function lightPosition(w: World, f: Effect) {
  if (f.fire) return f.fire
  const position = nativePosition(w, f)
  if (f.height !== undefined) position.h = Math.round(f.height * 45)
  return position
}
export function registerTerrainLight(w: World, f: Effect, strength: number) {
  if (
    addTerrainLight(w.lights, {
      owner: f.id,
      strength,
      flicker: 4,
      flags: 0,
      position: lightPosition(w, f),
    })
  )
    refreshTerrainLights(w)
}
export function refreshTerrainLights(w: World) {
  if (
    updateTerrainLights(
      w.land,
      w.lights,
      id => {
        const f = w.effects.find(f => f.id === id)
        return f && lightPosition(w, f)
      },
      w.lightView,
      w.randomState,
      true // Desktop rendering enables native dynamic landscape lighting.
    )
  )
    w.lightRevision++
}
