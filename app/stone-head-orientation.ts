import { missionData } from './mission-data.ts'
import type { Point, Shrine } from './world-types.ts'

export type StoneScenery = Point & {
  index: number
  type: number
  model: number
  heading?: number
}

// 004851e0 links the first class5/model9 in the same native512-unit cell.
// This is independent of reward mode, morph family and the current camera.
const cell = (p: Point) =>
  ((Math.round((p.x + 8) * 256) & 65535) >>> 9) |
  (((Math.round((-p.z - 8) * 256) & 65535) >>> 9) << 7)

export function findStoneHeadHeading(objects: readonly StoneScenery[], point: Point) {
  const source = objects.find(o => o.type === 5 && o.model === 9 && cell(o) === cell(point))
  if (!source || !Number.isInteger(source.heading)) return null
  // Only the native0..2047angle range is consumed by the sine table. The actual
  // uint16 source word must be preserved by the producer, including its high byte.
  return { sceneryIndex: source.index, heading: source.heading! & 2047 }
}

const sources = new Map<number, Map<number, number>>()
export function stoneHeadAngle(shrine: Pick<Shrine, 'kind' | 'angle' | 'x' | 'z'>, mission: number) {
  if (shrine.kind === 'vault') return shrine.angle
  let headings = sources.get(mission)
  if (!headings) {
    headings = new Map()
    const seen = new Set<number>()
    for (const object of missionData(mission).level.objects as readonly StoneScenery[])
      if (object.type === 5 && object.model === 9 && !seen.has(cell(object))) {
        seen.add(cell(object))
        // A missing field is not a zero heading. Preserve the existing fallback
        // until the canonical source metadata is available; never invent offsets.
        if (Number.isInteger(object.heading)) headings.set(cell(object), object.heading! & 2047)
      }
    sources.set(mission, headings)
  }
  const heading = headings.get(cell(shrine))
  return heading === undefined ? shrine.angle : (heading * Math.PI) / 1024
}
