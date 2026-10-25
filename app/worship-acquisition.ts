import {
  initializeBuildingAcquisition,
  visitBuildingAcquisition,
  type BuildingAcquisitionController,
  type BuildingAcquisitionDrawCommand,
} from './building-acquisition.ts'
import { movePosition, nativeAngle, positionDistance, short } from './native-math.ts'
import rules from './original-rules.json' with { type: 'json' }
import hud from './original-hud.json' with { type: 'json' }
import effects from './original-effects.json' with { type: 'json' }

export interface WorshipPoint {
  x: number
  y: number
}
export interface WorshipRect extends WorshipPoint {
  width: number
  height: number
}
export type WorshipSpellModel = 3 | 4 | 12
export type WorshipTargetModel = WorshipSpellModel | 5 | 7
export type WorshipAcquisitionFamily = 'spell' | 'building'
/** Immutable handoff coordinates, in HUD-logical pixels. targetHud is the measured
 * card center relative to the HUD, retained for drawing while its tab is unmounted. */
export interface WorshipAcquisitionGeometry {
  shell?: WorshipRect
  viewport: WorshipRect
  origin: WorshipPoint
  target: WorshipPoint
  targetRect: WorshipRect
  targetHud: WorshipPoint
  hudScale: number
}
interface Controller extends DrawBinding {
  active: boolean
  step: number
  visits: number
  next: boolean
}
export interface WorshipSpellController extends Controller {
  model: WorshipSpellModel
  giftId: number
  position: WorshipPoint
  destination: WorshipPoint
  speed: number
  angle: number
  rotation: number
  spin: number
  scale: number
}
export interface WorshipParticle extends WorshipPoint {
  speed: number
  angle: number
  turn: number
  life: number
  baseFrame: number
  frame: number
  frameCount: number
  palette: number
}
interface TrailParticle extends WorshipPoint {
  angle: number
  speed: number
}
export interface WorshipCompanionController extends Controller {
  particles: WorshipParticle[]
  trails: { age: number; particles: TrailParticle[] }[]
  trailIndex: number
  target: WorshipPoint
  drift: number
  direction: number
  driftRemaining: number
  colorVisits: number
  changingColor: boolean
  colorDone: boolean
}
export interface WorshipPulse extends DrawBinding {
  active: boolean
  frame: number
  remaining: number
}
interface DrawBinding {
  family?: WorshipAcquisitionFamily
  giftId?: number
  model: WorshipTargetModel
  geometry: WorshipAcquisitionGeometry
}
export interface WorshipSpriteCommand extends DrawBinding {
  kind: 'sprite'
  owner: 'companion' | 'pulse'
  frame: number
  x: number
  y: number
  width: number
  height: number
  palette: number | 'ghost'
  rgb: number
  flags: 8
  particle?: number
}
export interface WorshipBodyCommand extends DrawBinding {
  model: WorshipSpellModel
  kind: 'body'
  frame: number
  x: number
  y: number
  radians: number
  scale: number
  flags: 0
  finalLeg: boolean
}
export type WorshipAcquisitionDrawCommand =
  | WorshipSpriteCommand
  | WorshipBodyCommand
  | BuildingAcquisitionDrawCommand
export interface WorshipAcquisitionState {
  building: BuildingAcquisitionController | null
  spell: WorshipSpellController | null
  companion: WorshipCompanionController | null
  pulse: WorshipPulse | null
  drawCommands: WorshipAcquisitionDrawCommand[]
}
export interface WorshipAcquisitionArrival {
  giftId: number
  model: WorshipSpellModel
}

export function createWorshipAcquisitionState(): WorshipAcquisitionState {
  return { building: null, spell: null, companion: null, pulse: null, drawCommands: [] }
}

const integerPoint = (p: WorshipPoint): WorshipPoint => ({ x: short(p.x), y: short(p.y) })
const center = (g: WorshipAcquisitionGeometry): WorshipPoint => ({
  x: short(g.viewport.x + Math.trunc(g.viewport.width / 2)),
  y: short(g.viewport.y + Math.trunc(g.viewport.height / 2)),
})
const angleTo = (a: WorshipPoint, b: WorshipPoint) =>
  nativeAngle(short(b.x - a.x), -short(b.y - a.y))

/** The caller has already selected the panel, played the cue and validated geometry.
 * Reinitialization replaces both singletons but does not touch an older pulse. */
export function startWorshipAcquisition(
  state: WorshipAcquisitionState,
  request: { giftId: number; model: WorshipSpellModel; geometry: WorshipAcquisitionGeometry }
) {
  const geometry = structuredClone(request.geometry)
  geometry.origin = integerPoint(geometry.origin)
  geometry.target = integerPoint(geometry.target)
  const common = {
    family: 'spell' as const,
    giftId: request.giftId,
    active: true,
    step: 0,
    visits: 0,
    next: true,
    model: request.model,
    geometry,
  }
  state.spell = {
    ...common,
    giftId: request.giftId,
    position: { x: 0, y: 0 },
    destination: { x: 0, y: 0 },
    speed: 0,
    angle: 0,
    rotation: 0,
    spin: 0,
    scale: 0,
  }
  startCompanion(state, common)
}

function startCompanion(state: WorshipAcquisitionState, common: Controller) {
  state.companion = {
    ...common,
    particles: Array.from({ length: 200 }, () => ({
      x: 0,
      y: 0,
      speed: 0,
      angle: 0,
      turn: 0,
      life: 0,
      baseFrame: 0,
      frame: 0,
      frameCount: 0,
      palette: 0,
    })),
    trails: Array.from({ length: 4 }, () => ({ age: 0, particles: [] })),
    trailIndex: 0,
    target: { x: 0, y: 0 },
    drift: 0,
    direction: 0,
    driftRemaining: 0,
    colorVisits: 0,
    changingColor: false,
    colorDone: false,
  }
}

/** Building and spell retain separate controllers; either replaces the one shared
 * companion. Pulse survives until its own visit or a source-owned reinitialization. */
export function startBuildingAcquisition(
  state: WorshipAcquisitionState,
  request: { giftId: number; geometry: WorshipAcquisitionGeometry; model?: 5 | 7 },
  random: () => number
) {
  const c = initializeBuildingAcquisition(
    request.giftId,
    request.geometry,
    random,
    request.model === 5 ? 95 : 103
  )
  state.building = c
  startCompanion(state, {
    family: 'building',
    giftId: c.giftId,
    model: request.model ?? 7,
    geometry: c.geometry,
    active: true,
    step: 0,
    visits: 0,
    next: true,
  })
}

function move(p: WorshipPoint, angle: number, distance: number) {
  movePosition(p, angle, distance)
  p.x = short(p.x)
  p.y = short(p.y)
}

function sprite(
  state: WorshipAcquisitionState,
  binding: DrawBinding,
  owner: WorshipSpriteCommand['owner'],
  p: WorshipPoint,
  frame: number,
  palette: number | 'ghost',
  trail = false,
  particle?: number
) {
  // Reuse the original HFX dimensions and preserve each native draw anchor.
  const { w: width, h: height } = trail
    ? effects.animations.blastTrail[frame - 314]
    : effects.animations.sparkle[frame - 1288]
  state.drawCommands.push({
    kind: 'sprite',
    family: binding.family,
    giftId: binding.giftId,
    owner,
    model: binding.model,
    geometry: binding.geometry,
    frame,
    x: p.x - (width >> 1),
    y: p.y + (trail ? -(height >> 1) : Math.trunc((-height * 176) / 256)),
    width,
    height,
    palette,
    rgb:
      palette === 'ghost'
        ? 0xffffff
        : Number.parseInt(hud.colors[hud.alphaColors[palette + 2]].slice(1), 16),
    flags: 8,
    ...(particle === undefined ? {} : { particle }),
  })
}

function stepCompanion(state: WorshipAcquisitionState, paused: boolean, random: () => number) {
  const c = state.companion
  if (!c?.active) return
  if (c.next) {
    if (!c.step) {
      const radius = Math.trunc(c.geometry.viewport.width / 8)
      c.drift = short(((random() >>> 0) % (radius * 2)) - radius)
    }
    c.next = false
    c.visits = 0
    if (++c.step >= 3) {
      c.active = false
      return
    }
  }
  if (!paused) {
    if (c.step === 1) {
      const angle = angleTo(c.geometry.origin, c.target)
      for (const p of c.particles) {
        const baseFrame = (random() & 15) === 1 ? 1288 : 1294
        p.x = c.geometry.origin.x
        p.y = c.geometry.origin.y
        p.speed = ((random() >>> 0) % 30) + 14
        p.angle = ((random() & 511) + angle - 256) & 2047
        p.turn = ((random() >>> 0) % 68) + 68
        p.life = ((random() >>> 0) % 40) + 20
        p.baseFrame = baseFrame
        p.frameCount = 6
        p.frame = (random() >>> 0) % 6
        p.palette = rules.tribeEffectPalettes[random() & 3] - 2
      }
      if (c.visits >= 1) c.next = true
    } else {
      let retired = 0
      for (const p of c.particles) {
        if (p.baseFrame) {
          p.baseFrame = 0
          if (++retired === 10) break
        }
      }
      if (c.visits >= 20) c.next = true
    }
    c.visits++
    if (--c.driftRemaining <= 0) {
      c.driftRemaining = (random() & 15) + 16
      if (c.driftRemaining & 1) c.direction = -c.direction
    }
    const radius = Math.trunc(c.geometry.viewport.width / 8)
    c.drift = short(c.drift + c.direction * 8)
    if (c.direction > 0 && c.drift > radius) {
      c.direction = -1
      c.drift = radius
    } else if (c.direction <= 0 && c.drift < -radius) {
      c.direction = 1
      c.drift = -radius
    }
    const midpoint = center(c.geometry)
    c.target = { x: short(midpoint.x + c.drift), y: midpoint.y }
    const current = c.trails[c.trailIndex]
    current.age = 0
    current.particles = c.particles
      .filter(p => p.baseFrame)
      .map(p => ({
        x: p.x,
        y: p.y,
        angle: p.angle,
        speed: Math.trunc(p.speed / 2),
      }))
    c.trailIndex = (c.trailIndex + 1) & 3
    for (const p of c.particles) if (p.baseFrame) move(p, p.angle, p.speed)
    if (!c.colorDone) {
      if (c.colorVisits === 8) c.changingColor = true
      c.colorVisits++
      if (c.changingColor) {
        let changed = 0
        for (const p of c.particles) {
          if (p.baseFrame && p.palette !== 0) {
            p.palette = 0
            if (++changed === 14) break
          }
        }
        if (c.colorVisits === 22) {
          c.changingColor = false
          c.colorDone = true
        }
      }
    }
    for (let i = 0; i < 3; i++) {
      const trail = c.trails[(c.trailIndex + i) & 3]
      trail.age++
      for (const p of trail.particles) {
        move(p, p.angle, p.speed)
        p.speed = short(Math.trunc((p.speed * 6) / 16))
      }
    }
  }
  // Native draw work follows the pause gate and advances the particle frame byte.
  for (const trail of c.trails) {
    for (const p of trail.particles)
      sprite(state, c, 'companion', p, 318 + trail.age, 'ghost', true)
  }
  for (const [index, p] of c.particles.entries()) {
    if (!p.baseFrame) continue
    sprite(state, c, 'companion', p, p.baseFrame + p.frame, p.palette, false, index)
    p.frame = (p.frame + 1) % p.frameCount
  }
}

function startPulse(state: WorshipAcquisitionState, c: DrawBinding, remaining: number) {
  state.pulse = {
    active: true,
    frame: 0,
    remaining,
    family: c.family,
    giftId: c.giftId,
    model: c.model,
    geometry: c.geometry,
  }
}

function stepSpell(
  state: WorshipAcquisitionState,
  paused: boolean,
  arrivals: WorshipAcquisitionArrival[]
) {
  const c = state.spell
  if (!c?.active) return
  let entered = false
  if (c.next) {
    entered = true
    c.next = false
    c.visits = 0
    if (++c.step >= 5) {
      c.active = false
      return
    }
  }
  if (!paused) {
    let moving = true
    let rotating = false
    if (c.step === 1) {
      c.position = { ...c.geometry.origin }
      c.destination = center(c.geometry)
      c.angle = angleTo(c.position, c.destination)
      c.speed = 0
      c.next = true
      c.rotation = 0
      c.spin = 0
      c.scale = 52
      moving = false
    } else if (c.step === 2) {
      const speed = Math.trunc(
        Math.trunc((positionDistance(c.geometry.origin, c.destination) * 180) / 256) / 5
      )
      c.speed = Math.max(2, c.visits < 5 ? speed : Math.trunc(((11 - c.visits) * speed) / 7))
      c.spin = short(c.visits < 9 ? Math.trunc((1934 - c.rotation) / (9 - c.visits)) : c.spin - 51)
      if (c.visits < 5) c.scale = short(c.scale + Math.trunc((256 - c.scale) / (5 - c.visits)))
      if (c.visits >= 12) c.next = true
      rotating = true
    } else if (c.step === 3) {
      if (entered) c.speed = 2
      c.spin = short(c.spin - 45)
      if (c.visits >= 4) c.next = true
      rotating = true
    } else if (c.step === 4) {
      if (entered) {
        c.destination = { ...c.geometry.target }
        c.spin = short(c.spin - 28)
        c.angle = angleTo(c.position, c.destination)
      }
      c.spin = short(
        c.visits < 6 ? c.spin - 34 : c.visits === 6 ? Math.trunc(c.spin / 2) : c.spin - 22
      )
      c.scale = Math.max(52, short(c.scale - 20))
      if (c.visits === 4) startPulse(state, c, 100)
      c.speed = Math.min(80, short(Math.trunc((c.speed * 48) / 32)))
      const distance = positionDistance(c.position, c.destination)
      if (c.speed * 3 >= distance) arrivals.push({ giftId: c.giftId, model: c.model })
      rotating = true
      if (c.speed > distance) {
        c.speed = distance
        c.rotation = 0
        c.visits = 160
        rotating = false
      }
      if (c.visits >= 160) {
        c.next = true
        startPulse(state, c, 4)
      }
    }
    if (moving) move(c.position, c.angle, c.speed)
    c.visits++
    if (rotating && c.spin) c.rotation = (c.rotation + c.spin) & 2047
  }
  state.drawCommands.push({
    kind: 'body',
    family: c.family,
    giftId: c.giftId,
    model: c.model,
    geometry: c.geometry,
    frame: 1056 + c.model,
    x: c.position.x,
    y: c.position.y,
    radians: Math.fround(c.rotation * 0.0030679609375),
    scale: Math.fround(c.scale / 32),
    flags: 0,
    finalLeg: c.step === 4,
  })
}

/** One native UI visit: pulse, companion, building, spell. The caller owns the deadline,
 * panel reselection, saved-gift validation, bit-8 gate, timer clamp and payout. */
export function stepWorshipAcquisition(
  state: WorshipAcquisitionState,
  input: { paused: boolean; random: () => number }
): { arrivals: WorshipAcquisitionArrival[]; buildingPanel: 5 | 7 | null; limiterActive: boolean } {
  state.drawCommands = []
  const pulse = state.pulse
  if (pulse?.active) {
    sprite(state, pulse, 'pulse', pulse.geometry.target, 1288 + pulse.frame, 0)
    if (--pulse.remaining < 1) pulse.active = false
    else pulse.frame = (pulse.frame + 1) % 6
  }
  stepCompanion(state, input.paused, input.random)
  const { building } = state
  const result = visitBuildingAcquisition(building, input.paused)
  if (building && result && !('retired' in result)) {
    const binding = {
      family: 'building' as const,
      giftId: building.giftId,
      model: (building.model === 95 ? 5 : 7) as 5 | 7,
      geometry: building.geometry,
    }
    if (result.pulse) startPulse(state, binding, result.pulse)
    state.drawCommands.push({
      kind: 'building',
      geometryModel: building.model,
      anchor: { x: building.x, y: building.y },
      ...binding,
      whole: result.whole,
      selected: result.selected,
      submissions: result.submissions,
    })
  }
  let buildingPanel: 5 | 7 | null = null
  if (result && 'selectPanel' in result && result.selectPanel)
    buildingPanel = building?.model === 95 ? 5 : 7
  const arrivals: WorshipAcquisitionArrival[] = []
  stepSpell(state, input.paused, arrivals)
  return {
    arrivals,
    buildingPanel,
    limiterActive: !!(state.building?.active || state.spell?.active || state.companion?.active),
  }
}

/** Rendering is a read-only consumer of the last UI visit, including its final
 * pulse draw before retirement. It never consumes RNG or advances sprite frames. */
export function getWorshipAcquisitionDrawCommands(
  state: WorshipAcquisitionState
): readonly WorshipAcquisitionDrawCommand[] {
  return state.drawCommands
}
