import { terrainPointHeight, type NativeTerrain } from './native-terrain.ts'
import { limitPersonVelocity } from './person-physics.ts'
import rules from './original-rules.json' with { type: 'json' }

export interface DirectedEffect {
  x: number
  y: number
  h: number
  flags2: number
  flags4: number
  speed: number
  yaw: number
  pitch: number
  velocity: { x: number; y: number; z: number }
}
const short = (n: number) => (n << 16) >> 16
function drag(n: number) {
  if (Math.abs(n) < 2) return 0
  return short(n < 0 ? n + 2 : n - 2)
}

// Directed branch of 0x4e7a80, shared by spell trails and detached building faces.
// Flags 0x40000 suppress gravity; impulses and free-motion objects use other branches.
export function moveDirectedEffect(
  land: Pick<NativeTerrain, 'heights' | 'flags'>,
  p: DirectedEffect,
  physics: number
) {
  if (p.flags2 & 0x4000) return
  if (p.flags2 & 0x82000 || !(p.flags2 & 0x80)) throw new Error('Unported effect motion flags')
  const v = p.velocity
  v.x = 0
  v.z = 0
  if (p.flags2 & 0x40000) v.y = 0
  if (p.speed >= 0) {
    const horizontal = Math.imul(rules.sine[p.pitch & 2047], p.speed) >> 16
    v.x = short(Math.imul(rules.sine[p.yaw & 2047], horizontal) >> 16)
    v.z = short(Math.imul(rules.sine[(p.yaw + 512) & 2047], horizontal) >> 16)
    const vertical = Math.imul(rules.sine[(p.pitch + 512) & 2047], p.speed >> 1) >> 16
    v.y = short(v.y + vertical)
    if (!(p.flags2 & 0x40000)) v.y = short(v.y - short(rules.personGravity[physics]))
    v.x = drag(v.x)
    v.z = drag(v.z)
    limitPersonVelocity(physics, v)
    p.x = (p.x + v.x) & 65535
    p.y = (p.y + v.z) & 65535
    p.h = short(p.h + v.y)
  }
  const ground = terrainPointHeight(land, p)
  p.flags4 = (p.flags4 | 0x400) >>> 0
  if (p.h <= ground) {
    p.flags4 &= ~0x400
    v.y = 0
  }
  if (!(p.flags2 & 2)) p.h = Math.max(p.h, ground)
}
