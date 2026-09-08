import { setAnimationObject, type AnimatedUnit } from './animation.ts'
import { terrainPointHeight, type NativeTerrain } from './native-terrain.ts'
import { moveDirectedEffect } from './effect-motion.ts'
import { random } from './native-math.ts'

type Ground = Pick<NativeTerrain, 'heights' | 'flags'>
export type SpellTrail = AnimatedUnit & {
  x: number
  y: number
  h: number
  state: number
  remaining: number
  flags2: number
  flags4: number
  speed: number
  yaw: number
  pitch: number
  velocity: { x: number; y: number; z: number }
}
const short = (n: number) => (n << 16) >> 16

// Effect 3 / 4 initializers, 0x50bf60 / 0x50c380, after common allocation.
// counter is the class-7 allocation byte; the RNG is 0x89bc72, not game RNG.
export function createSpellTrail(
  land: Ground,
  position: { x: number; y: number; h: number },
  model: 3 | 4,
  counter: number,
  cosmetic: { randomState: number }
): SpellTrail {
  const p: SpellTrail = {
    ...position,
    x: position.x & 65535,
    y: position.y & 65535,
    object: 0,
    draw: 0,
    morph: 0,
    palette: 0,
    renderFlags: 0,
    f1: model === 4 ? (counter & 3) * 4 : 0,
    f2: 0,
    stamp: 0,
    flags3: 0,
    morphTimer: 0,
    morphFrames: 0,
    state: model === 3 ? 3 : 5,
    remaining: 4,
    flags2: model === 3 ? 0x40180 : 0x40080,
    flags4: model === 3 ? 0x100 : 0,
    speed: model === 3 ? 20 : 0,
    yaw: 0,
    pitch: 0,
    velocity: { x: 0, y: 0, z: 0 },
  }
  p.h = Math.max(short(p.h), terrainPointHeight(land, p))
  setAnimationObject(p, 1, model === 3 ? 314 : 322)
  if (model === 3) random(cosmetic)
  return p
}

// 0x50bd70 -> 0x50beb0, then 0x50a750 state 4. Physics runs before expiry.
export function stepSpellTrail(land: Ground, p: SpellTrail) {
  moveDirectedEffect(land, p, 10)
  if (p.state === 4) {
    p.remaining = short(p.remaining - 1)
    return p.remaining > 0
  }
  if (p.remaining >= 0) {
    p.remaining = short(p.remaining - 1)
    if (p.remaining < 1) {
      if (p.flags4 & 0x200) return false
      if (!(p.flags2 & 0x100000)) p.state = 4
      const flags = p.renderFlags
      setAnimationObject(p, (p.palette << 24) >> 24 > -16 ? 29 : 1, short(p.object) + 4)
      p.renderFlags = (p.renderFlags & ~0xc050) | (flags & 0x4050)
      p.f1 = 0
      p.flags2 = (p.flags2 & ~0x10000000) >>> 0
      p.remaining = 3
    }
  }
  return true
}
