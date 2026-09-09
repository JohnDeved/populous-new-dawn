import { random } from './native-math.ts'
import { terrainPointHeight, type NativeTerrain } from './native-terrain.ts'

interface Point {
  x: number
  y: number
  h: number
}
type Ground = Pick<NativeTerrain, 'heights' | 'flags' | 'buildingIds' | 'landFlags'>
export interface TerrainLight {
  owner: number
  strength: number
  flicker: number
  flags: number
  position: Point
  contributions: Int8Array
}
export type TerrainLights = (TerrainLight | null)[]
const short = (n: number) => (n << 16) >> 16
const cell = (p: Point, offset: number) =>
  ((((p.y >> 9) - 3 + Math.floor(offset / 7)) & 127) << 7) | (((p.x >> 9) - 3 + (offset % 7)) & 127)

// 0x4010b0: fifty slots, with the first freed slot reused before later owners.
export function addTerrainLight(
  lights: TerrainLights,
  source: Omit<TerrainLight, 'contributions'>
) {
  const slot = lights.indexOf(null)
  if (slot === -1) return false
  lights[slot] = {
    ...source,
    position: {
      x: source.position.x & 65535,
      y: source.position.y & 65535,
      h: source.position.h & 65535,
    },
    contributions: new Int8Array(49),
  }
  return true
}

// 0x401140/0x401230: subtract only this light's saved contribution. The low ten
// bits belong to building occupancy and must survive lighting and cleanup.
function clearLight(land: Ground, light: TerrainLight) {
  light.contributions.forEach((value, offset) => {
    const i = cell(light.position, offset)
    land.buildingIds[i] -= value * 1024
  })
  light.contributions.fill(0)
}

// 0x401350/0x4015f0: refresh the original 7×7 footprint, with toroidal distance,
// height attenuation, saturation, and a private copy of the gameplay RNG.
export function updateTerrainLights(
  land: Ground,
  lights: TerrainLights,
  ownerPosition: (id: number) => Point | undefined,
  view: { x: number; y: number },
  seed: number,
  enabled: boolean
) {
  let changed = false
  for (const [slot, light] of lights.entries()) {
    if (!light || ownerPosition(light.owner)) continue
    clearLight(land, light)
    lights[slot] = null
    changed = true
  }
  if (land.landFlags & 2 || !enabled) return changed
  for (const light of lights) if (light) clearLight(land, light)
  const rng = { randomState: seed }
  for (const light of lights) {
    if (!light) continue
    changed = true
    const position = ownerPosition(light.owner)!
    light.position.x = position.x & 65535
    light.position.y = position.y & 65535
    const dx = short(position.x - view.x),
      dy = short(position.y - view.y)
    if (((Math.imul(dx, dx) + Math.imul(dy, dy)) | 0) >= 0x6910000) continue
    light.position.h = position.h & 65535
    const flicker = (random(rng) % light.flicker) - (light.flicker >> 1)
    for (let offset = 0; offset < 49; offset++) {
      const i = cell(light.position, offset),
        existing = land.buildingIds[i] >>> 10
      if (existing >= 31) continue
      const point = { x: (i & 127) * 512, y: (i >> 7) * 512 }
      const x = short(point.x - position.x),
        y = short(point.y - position.y),
        h = short(terrainPointHeight(land, point) - position.h)
      const distance = (Math.imul(x, x) + Math.imul(y, y) + Math.imul(h, h)) | 0
      if (distance >= 0x24c000) continue
      const falloff = Math.trunc(((0x24c000 - distance) * 31) / 0xc4000)
      const value = Math.max(
        0,
        Math.min(31 - existing, flicker + Math.trunc((light.strength * falloff * 3) / 128))
      )
      land.buildingIds[i] += value * 1024
      light.contributions[offset] = value
    }
  }
  return changed
}
