import type { World, Unit } from './world-types.ts'
import { teamForTribe, tribeForTeam } from './world-types.ts'
import { missionData } from './mission-data.ts'
import {
  changeLivePersonState,
  createLivePerson,
  registerLivePerson,
  setLivePersonAnimation,
} from './live-people.ts'
import { releaseTasks } from './world-tasks.ts'
import { addUnit } from './world-state.ts'
import { randomPersonSpeed, recoverPersonMovement } from './person-state.ts'
import {
  allocatePersonOrder,
  attachPersonOrder,
  currentPersonOrder,
  removePersonOrder,
} from './person-orders.ts'
import { orderEffects } from './live-movement.ts'
import { startPersonOrders } from './person-order-start.ts'
import { removeObjectFromCell } from './object-cells.ts'
import { effect, sound, shotVisual, moveVisual, registerTerrainLight } from './world-effects.ts'
import {
  nativePosition,
  refreshTerrainSurface,
  notifyHeightChanges,
  terrainTextures,
} from './world-terrain-runtime.ts'
import { browserPosition } from './world-coordinates.ts'
import {
  queueTerrain,
  processTerrain,
  updateWalkMasks,
  terrainPointHeight,
} from './native-terrain.ts'
import { setAnimationObject } from './animation.ts'
import { reincarnationStones } from './reincarnation.ts'
import { short } from './native-math.ts'
import { createSpellTrail } from './spell-trails.ts'
import models from './original-models.json' with { type: 'json' }
import {
  levelStartTargetHeight,
  stepLevelStartWave,
  stepLevelStartCarrier,
  levelStartStoneHeading,
  levelStartBurstParticle,
  type StartPoint,
  type LevelStartSite,
} from './level-start.ts'
import rules from './original-rules.json' with { type: 'json' }

function animatedStartEffect(
  w: World,
  p: StartPoint,
  sequence: string,
  object: number,
  draw: number,
  turns: number
) {
  const fx = effect(w, 'trail', browserPosition(p))
  fx.height = p.h / 45
  fx.sprite = { sequence, frame: 0 }
  fx.turnsRemaining = turns
  fx.duration = Infinity
  fx.animation = {
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
  setAnimationObject(fx.animation, draw, object)
  return fx
}

function stoneBurst(w: World, point: StartPoint, tribe: number) {
  const team = teamForTribe(tribe)
  w.effectCounter = (w.effectCounter + 1) & 255 // effect9, 0x50ccd0
  for (let particle = 0; particle < 32; particle++) {
    const position = { ...point, h: short(point.h + 90) },
      burst = effect(w, 'trail', browserPosition(position)),
      trail = createSpellTrail(w.land, position, 3, (w.effectCounter - 1) & 255, w.cosmeticRandom)
    trail.flags4 &= ~0x100
    Object.assign(trail, levelStartBurstParticle(w))
    trail.flags2 |= 0x1080
    burst.animation = trail
    burst.sprite = { sequence: 'blastTrail', frame: 0 }
    burst.height = trail.h / 45
    burst.duration = Infinity
    burst.team = team
  }
}

// Native load 0x42b230 -> 0x419810/0x419880 queues command18 on authored
// shamans. Scope is deliberately limited to the three traced release missions.
export function initializeLevelStart(w: World) {
  w.levelStart = []
  w.levelStartStoneSound = 0
  if (w.outcome.level < 1 || w.outcome.level > 3) return
  const people = missionData(w.outcome.level).level.objects.filter(o => o.type === 1)
  for (const u of w.units) {
    if (u.kind !== 'shaman' || u.team === 'wild') continue
    const p = (u.native ??= createLivePerson(w, u)),
      position = nativePosition(w, u)
    setLivePersonAnimation(w, p, rules.personAnimationObjects[7])
    p.counter = people.findIndex(o => o.model === 7 && o.owner === tribeForTeam(u.team)) & 255
    const center = { x: (position.x & 0xfe00) + 256, y: (position.y & 0xfe00) + 256, h: position.h }
    const order = allocatePersonOrder(w.buildingOrders)
    if (!order) throw new Error('Opening command pool is unexpectedly exhausted')
    Object.assign(w.buildingOrders.records[order], {
      model: 18,
      flags: 32,
      a: center.x,
      b: center.y,
    })
    attachPersonOrder(w.buildingOrders, p, order, 0, orderEffects(w))
    const state = {
      randomState: w.randomState,
      instantFacing: false,
      levelFlags: w.manaWorld.gameFlags,
      orders: w.buildingOrders,
      tribes: w.manaTribes.map(t => ({
        x: 0,
        y: 0,
        angle: 0,
        selectedCount: 0,
        flags: t.flags2,
        vehicleMode: 0,
      })),
    }
    const unsupported = () => {
      throw new Error('Unexpected transport/building in authored startup')
    }
    startPersonOrders(state, p, {
      setAnimation: (person, object) => setLivePersonAnimation(w, person as typeof p, object),
      setDestination: (person, x, y) => {
        ;(person as typeof p).goalX = x
        ;(person as typeof p).goalY = y
      },
      commandPosition: command => ({ x: command.a, y: command.b }),
      allowVehicleOrder: unsupported,
      initializeCommand: unsupported,
      adjacentBuilding: unsupported,
      canStayForTarget: unsupported,
      leaveBuilding: unsupported,
      resetVehicleMovement: unsupported,
      leaveSelectedVehicle: unsupported,
      initializeState: unsupported,
    })
    w.randomState = state.randomState
    w.levelStart.push({
      tribe: tribeForTeam(u.team),
      shaman: u.id,
      center,
      phase: 0,
      entering: true,
      timer: 0,
      counter: p.counter,
      wave: null,
      carriers: [],
      stoneTurns: Array(8).fill(null),
    })
  }
}

export function levelStartOwnsShaman(w: World, u: Unit) {
  return (
    u.native?.state === 10 &&
    currentPersonOrder(w.buildingOrders, u.native)?.model === 18 &&
    (w.levelStart?.some(site => site.shaman === u.id && site.phase < 4) ?? false)
  )
}

function finishStart(w: World, site: LevelStartSite, u?: Unit) {
  site.phase = 4
  if (!u?.native) return
  u.native.flags2 &= ~0x4000
  u.native.flags4 &= ~128
  u.native.commandStatus = 0
  u.native.substate = 0
  if (currentPersonOrder(w.buildingOrders, u.native)?.model === 18)
    removePersonOrder(w.buildingOrders, u.native, u.native.commandCursor, orderEffects(w))
  w.castingTribes[site.tribe].flags |= 2
  changeLivePersonState(w, u, rules.personModels[7].idleState)
}

function convertStartingWildman(w: World, u: Unit, tribe: number) {
  // 0x4d7fd0 allocates a new brave, then removes the wild person. It does not
  // merely recolor the existing entity. Preserve the current allocation adapter.
  const point = nativePosition(w, u),
    slot = w.units.indexOf(u)
  releaseTasks(w, u)
  if (u.native?.flags2 && u.native.flags2 & 0x20000) removeObjectFromCell(w.objectCells, u.native)
  w.objectCells.objects.delete(u.id)
  const replacement = addUnit(w, teamForTribe(tribe), 'brave', browserPosition(point))
  w.units[slot] = replacement
  w.units.pop()
  replacement.heading = u.heading
  replacement.native = createLivePerson(w, replacement)
  replacement.native.speed = randomPersonSpeed(w, replacement.native)
  replacement.native.flags4 |= 0x40000
  registerLivePerson(w, replacement.native)
  sound(w, 5, replacement)
  // 0x4d7fd0's neutral flash plus 0x50c840's owner flash are separate allocations.
  for (let i = 0; i < 2; i++) animatedStartEffect(w, point, 'startConversion', 1240, 45, 8)
}

export function stepLevelStarts(w: World) {
  if (!w.levelStart?.length) return
  const changed = new Set<number>()
  // 0x4ed8a0 prepends allocations; 0x4ec6f0 walks that list newest first.
  const controllers = w.levelStart
    .flatMap(site => [
      ...(site.wave ? [{ site, id: site.wave.id, carrier: null }] : []),
      ...site.carriers.map(carrier => ({ site, id: carrier.id, carrier })),
    ])
    .sort((a, b) => b.id - a.id)
  for (const { site, carrier } of controllers) {
    const team = teamForTribe(site.tribe)
    if (!carrier) {
      if (site.wave) {
        const alive = stepLevelStartWave(w.land, site.wave, {
          orbit: (point, light) => {
            const fx = animatedStartEffect(w, point, 'sparkle', 1288, 44, 32767)
            delete fx.turnsRemaining
            if (light) registerTerrainLight(w, fx, 1)
            return fx.id
          },
          cell: cell => {
            const inCell = (point: { x: number; z: number }) => {
              const p = nativePosition(w, point)
              return (((p.x >>> 8) & 254) | (p.y & 0xfe00)) === cell
            }
            for (const u of [...w.units].reverse())
              if (u.team === 'wild' && u.hp > 0 && u.inside === null && inCell(u))
                convertStartingWildman(w, u, site.tribe)
            let pending = false
            for (const tree of w.trees)
              if (tree.logs > 0 && inCell(tree) && !(rules.sceneryFlags[tree.model] & 0x200)) {
                pending = true
                if (rules.sceneryFlags[tree.model] & 0x20 && !tree.burn)
                  tree.burn = {
                    remaining: 76,
                    started: false,
                    wood: Math.round(tree.logs * 100),
                    scale: models[(tree.model + 12) as unknown as keyof typeof models].scale,
                  }
              }
            return pending
          },
          terrain: cell => changed.add(cell),
          sparkle: point => {
            const fx = animatedStartEffect(w, point, 'hit', 1294, 46, 6)
            fx.team = team
          },
          move: (id, point, displacement) => {
            const fx = w.effects.find(f => f.id === id)
            if (fx) {
              moveVisual(fx, point)
              fx.animation!.flags3 |= 0x300
              fx.animation!.displacement = { ...displacement }
            }
          },
          remove: id => {
            const fx = w.effects.find(f => f.id === id)
            if (fx) fx.duration = fx.age
          },
        })
        if (!alive) {
          site.wave = null
          w.castingTribes[site.tribe].flags &= ~1
        }
      }
    } else {
      if (
        stepLevelStartCarrier(carrier, w, point => {
          const fx = shotVisual(w, point, team, 'spellTrail')
          // Circle carriers explicitly override the ordinary four-turn trail wait to zero.
          if (fx.animation && 'remaining' in fx.animation) fx.animation.remaining = 0
        })
      )
        continue
      w.effectCounter = (w.effectCounter + 1) & 255 // effect7 replaces itself with the stone
      const previousStoneTurn = site.stoneTurns[carrier.index]
      if (previousStoneTurn !== null) {
        const ground = terrainPointHeight(w.land, carrier.destination),
          rise = Math.min(16, w.turn - previousStoneTurn + 1)
        stoneBurst(w, { ...carrier.destination, h: ground - 256 + rise * 16 }, site.tribe)
      }
      site.stoneTurns[carrier.index] = w.turn
      site.carriers.splice(site.carriers.indexOf(carrier), 1)
      const point = {
        ...carrier.destination,
        h: terrainPointHeight(w.land, carrier.destination) - 112,
      }
      const fx = animatedStartEffect(w, point, 'startStoneDust', 1160, 37, 20)
      fx.animation!.palette = 4
      fx.animation!.f1 = 76 // 0x4a7eb0: hold*4-step, before the first animation pass.
      if (++w.levelStartStoneSound & 1) sound(w, 0x9f, browserPosition(point))
      stoneBurst(w, { ...carrier.destination, h: point.h - 128 }, site.tribe)
    }
  }
  for (const site of [...w.levelStart].reverse()) {
    if (site.phase === 4) continue
    const u = w.units.find(u => u.id === site.shaman)
    if (!u?.native || u.hp <= 0) {
      // Death cancels the order; it must not mark an unfinished site completed
      // or run the living person's idle initializer.
      site.phase = 4
      if (u?.native && currentPersonOrder(w.buildingOrders, u.native)?.model === 18)
        removePersonOrder(w.buildingOrders, u.native, u.native.commandCursor, orderEffects(w))
      continue
    }
    const p = u.native
    site.counter = (site.counter + 1) & 255
    p.counter = site.counter
    if (currentPersonOrder(w.buildingOrders, p)?.model !== 18) {
      // A real replacement order cancels this command, not its already-created effects.
      site.phase = 4
      p.flags2 &= ~0x4000
      continue
    }
    if (p.state !== 10) {
      // 0x4c1b80 may enter cast state22 without clearing command18. Its return
      // goes through 0x432260, which reinitializes the command at substate0.
      site.suspended = true
      continue
    }
    if (site.suspended) {
      site.suspended = false
      site.phase = 0
      site.entering = true
      site.timer = 0
    }
    p.substate = site.phase
    if (site.phase === 0) {
      if (site.entering) {
        site.entering = false
        p.flags2 &= ~0x40004000
        recoverPersonMovement(w, p, (person, object) =>
          setLivePersonAnimation(w, person as typeof p, object)
        )
      }
      if (site.tribe && w.campaignAIs[site.tribe]?.reincarnation === false) {
        finishStart(w, site, u)
        continue
      }
      // Authored early-mission shamans are already at their snapped sites.
      if (
        Math.abs(short(p.x - site.center.x)) >= 120 ||
        Math.abs(short(p.y - site.center.y)) >= 120
      )
        continue
      site.phase = 1
      site.entering = true
      p.flags2 |= 0x40000000
    } else if (site.phase === 1) {
      if (site.entering) {
        site.entering = false
        p.flags2 &= ~0x40000000
        p.velocity = { x: 0, y: 0, z: 0 }
        p.speed = 0
        setLivePersonAnimation(w, p, 0x5d)
        p.f1 = p.f2 = 0
        site.timer = 12
      }
      if (site.timer) site.timer--
      if (!site.timer && !(p.flags2 & 0x80000)) {
        site.phase = 2
        site.entering = true
        p.flags2 |= 0x40000000
      }
    } else if (site.phase === 2) {
      if (site.entering) {
        site.entering = false
        p.flags2 &= ~0x40000000
        site.timer = 10
        p.flags2 |= 0x4000
        site.center.h = levelStartTargetHeight(w.land, site.center)
        w.effectCounter = (w.effectCounter + 1) & 255 // effect8 allocation
        const allocation = w.nextId++
        site.awaitedWave = null
        // 0x50c780 deletes a second effect8 while the tribe already owns one.
        if (!site.wave) {
          w.castingTribes[site.tribe].flags |= 1
          site.wave = {
            id: allocation,
            center: { ...site.center },
            visits: 0,
            terrainRadius: 0,
            visualRadius: 0,
            orbits: [],
          }
          site.awaitedWave = allocation
          sound(w, 0x9e, browserPosition(site.center))
        }
      }
      p.h = terrainPointHeight(w.land, p)
      if (site.timer) site.timer--
      const waiting =
        site.awaitedWave === undefined ? !!site.wave : site.wave?.id === site.awaitedWave
      if (!site.timer && !waiting) {
        site.phase = 3
        site.entering = true
        p.flags2 |= 0x40000000
      }
    } else if (site.phase === 3) {
      if (site.entering) {
        site.entering = false
        p.flags2 &= ~0x40000000
        site.timer = 8
      }
      if (site.counter & 1) continue
      if (!site.timer) {
        finishStart(w, site, u)
        continue
      }
      const index = --site.timer,
        destination = reincarnationStones(w.land, site.center)[index]
      p.angle = p.heading = levelStartStoneHeading(site.center, destination)
      u.heading = Math.PI - (p.angle * Math.PI) / 1024
      site.carriers.push({
        id: w.nextId++,
        index,
        position: { x: short(p.x), y: short(p.y), h: p.h },
        destination: { x: short(destination.x), y: short(destination.y), h: destination.h },
        visits: 0,
      })
    }
    p.substate = site.phase
  }
  if (changed.size) {
    for (const cell of changed) queueTerrain(w.land, cell, 2, 1, terrainTextures)
    processTerrain(w.land, terrainTextures)
    for (const cell of changed) updateWalkMasks(w.land, cell, 2)
    refreshTerrainSurface(w)
    notifyHeightChanges(
      w,
      [...changed].map(cell => ({ cell, radius: 1 }))
    )
  }
}
