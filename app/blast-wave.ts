import rules from './original-rules.json' with { type: 'json' }
import { startIndexedSearch, nextIndexedSearch, endIndexedSearch } from './indexed-search.ts'
import { nativeAngle, positionDistance, random } from './native-math.ts'
import { groundVelocity } from './person-motion.ts'
import { terrainPointHeight, type NativeTerrain } from './native-terrain.ts'

export interface BlastWave {
  x: number
  y: number
  h: number
  tribe: number
  remaining: number
  radius: number
  maxRadius: number
  range: number
  spread: number
  horizontal: number
  vertical: number
  friendlyFire: boolean
  applied: boolean
  panic: boolean
  scatter: boolean
}
export interface BlastTarget {
  id: number
  class: number
  model: number
  tribe: number
  state: number
  previousState: number
  flags2: number
  flags3: number
  flags4: number
  x: number
  y: number
  h: number
  velocity: { x: number; y: number; z: number }
  vehicle: number
  burnTrail: number
  life: number
  shake: number
  shakeOrigin: number
}
const short = (n: number) => (n << 16) >> 16

// 0x50b630 default; collapse's 0x50b6f0 configuration is identical even in
// the special load mode. Object allocation supplies grounding and cue 0xa1.
export function createBlastWave(
  p: { x: number; y: number; h: number },
  tribe: number,
  special = false
): BlastWave {
  return {
    x: p.x & 65535,
    y: p.y & 65535,
    h: short(p.h),
    tribe,
    remaining: 3,
    radius: 2,
    maxRadius: special ? 2 : 5,
    range: special ? 512 : 1280,
    spread: 2,
    horizontal: 140,
    vertical: special ? 30 : 98,
    friendlyFire: true,
    applied: false,
    panic: false,
    scatter: false,
  }
}

// 0x416d70 considers unowned objects friendly, including wild followers.
export function blastAllied(tribe: number, owner: number, alliances: ArrayLike<number>) {
  return (
    tribe === -1 ||
    tribe === 255 ||
    owner === -1 ||
    owner === 255 ||
    tribe === owner ||
    !!(alliances[owner] & (1 << tribe))
  )
}

// 0x50b740. Keep indexed-cell order and repeated visits: force/damage are
// applied per visit, and the friendly-follower cap is shared across the pass.
export function stepBlastWave<T extends BlastTarget>(
  w: {
    randomState: number
    search: Uint8Array
    land: Pick<NativeTerrain, 'heights' | 'flags' | 'buildingIds'>
    alliances: ArrayLike<number>
    special: boolean
  },
  wave: BlastWave,
  objects: { cell: (index: number) => Iterable<T>; building: (id: number) => T | undefined },
  effects: {
    panic: (p: T) => void
    animation: (p: T) => void
    damage: (p: T, amount: number) => void
    buildingDamage: (p: T, amount: number) => void
    vehicleDamage: (p: T, amount: number) => void
    remove: (p: T) => void
  }
) {
  const search = startIndexedSearch(w.search, 2, 0, 0, wave.radius),
    center = ((wave.x >>> 8) & 254) | (wave.y & 0xfe00),
    allied = (p: T) => blastAllied(p.tribe, wave.tribe, w.alliances)
  let friendly = false,
    alliedCount = 0
  const shake = (p: T) => {
    if (!p.shake) {
      p.shake = 1
      p.shakeOrigin = center
    }
  }
  if (search) {
    for (
      let offset = nextIndexedSearch(w.search, search);
      offset;
      offset = nextIndexedSearch(w.search, search)
    ) {
      const cell =
          (((center & 255) + offset.x * 2) & 255) | ((((center >> 8) + offset.y * 2) & 255) << 8),
        index = (cell >> 9) * 128 + ((cell & 254) >> 1)
      for (const p of objects.cell(index)) {
        if (p.flags4 & 256) {
          let push = true,
            hurt = false
          friendly = allied(p)
          if (p.class === 1) {
            push =
              !(p.model === 7 && p.tribe === wave.tribe) &&
              p.model !== 8 &&
              (wave.friendlyFire || !friendly) &&
              !p.vehicle &&
              !(p.flags3 & 0x20000)
            hurt = !(p.flags3 & 0x20000)
            if (friendly) {
              if (wave.remaining === 1 && alliedCount < rules.blastAlliedLimit) alliedCount++
              else {
                push = false
                hurt = false
              }
            }
          } else if (p.class === 4) effects.vehicleDamage(p, rules.blastPersonDamage)
          if (p.flags3 & 0x8000) {
            push = false
            hurt = false
          }
          if (push) {
            if (wave.panic && p.class === 1 && p.state !== 26) {
              if (!(p.flags2 & 0x100000)) {
                p.previousState = p.state
                p.state = 26
                effects.panic(p)
              }
              p.burnTrail = 24
            }
            p.flags2 = (p.flags2 | 0x82000) >>> 0
            if (!wave.applied) p.flags3 |= 8
            const angle = (nativeAngle(short(wave.x - p.x), -short(wave.y - p.y)) + 1024) & 2047,
              distance = Math.max(0, Math.min(wave.range, positionDistance(p, wave))),
              strength = (n: number) => Math.trunc((n * (wave.range - distance)) / wave.range)
            groundVelocity(p.velocity, p, strength(wave.horizontal), angle, (x, y) =>
              terrainPointHeight(w.land, { x, y })
            )
            p.velocity.y = short(p.velocity.y + strength(wave.vertical))
            if (p.class === 1 && p.state === 26) p.flags4 |= 0x2000
          }
          if (hurt) {
            effects.animation(p)
            if (!friendly) {
              if (wave.scatter && cell === center && p.tribe !== -1 && p.tribe !== 255)
                p.burnTrail = (random(w) & 15) + 16
              effects.damage(p, w.special ? p.life + 1 : rules.blastPersonDamage)
              if (p.flags4 & 0x800 && cell === center) effects.remove(p)
            }
          }
        }
        if (p.class === 2 || (p.class === 5 && rules.sceneryResourceFlags[p.model] & 0x40000)) {
          shake(p)
          if (!wave.applied && p.class === 2 && !friendly)
            effects.buildingDamage(p, rules.blastBuildingDamage)
        }
      }
      const building = w.land.buildingIds[index] & 1023
      if (building && w.land.flags[index] & 512) {
        const p = objects.building(building)
        if (!p) throw new Error(`Missing blast building ${building}`)
        shake(p)
        if (!wave.applied && !allied(p)) effects.buildingDamage(p, rules.blastBuildingDamage)
      }
    }
    endIndexedSearch(w.search, search)
  }
  wave.applied = true
  wave.remaining = (wave.remaining - 1) | 0
  if (wave.remaining < 1) return false
  wave.radius = Math.min(short(wave.radius + wave.spread), wave.maxRadius)
  return true
}
