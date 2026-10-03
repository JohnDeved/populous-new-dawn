import { missionData } from './mission-data.ts'
import { findStoneHeadHeading, type StoneScenery } from './stone-head-orientation.ts'
import type { Shrine } from './world-types.ts'

export const STONE_HEAD_149_MODEL = 149

type AuthoredObject = StoneScenery & { angle: number; settings?: readonly number[] }
type HeadIdentity = Pick<Shrine, 'x' | 'z' | 'range' | 'angle'>
export interface StoneHead149Source {
  triggerIndex: number
  sceneryIndex: number
}

// 004851e0 supplies the scenery and derives flags from actual reward links.
// 004fbd20 selects 149 for mode0 with neither flag0x10 nor flag0x20. Other
// modes/families are intentionally not inferred from the legacy model45 fallback.
export function findStoneHead149Source(
  objects: readonly AuthoredObject[],
  shrine: HeadIdentity
): StoneHead149Source | null {
  const heading = Math.round((shrine.angle * 1024) / Math.PI) & 2047,
    matches = objects.filter(
      object =>
        object.type === 6 &&
        object.model === 6 &&
        object.x === shrine.x &&
        object.z === shrine.z &&
        object.settings?.[1] === shrine.range &&
        (object.angle & 2047) === heading
    )
  // An ambiguous or incomplete authored identity is not evidence for this family.
  if (matches.length !== 1) return null
  const [trigger] = matches,
    settings = trigger.settings!
  if (settings[0] !== 0 || settings.length < 26) return null
  const byLink = new Map(objects.map(object => [object.index + 1, object]))
  for (let link = 0; link < 10; link++) {
    const index = settings[6 + link * 2] | (settings[7 + link * 2] << 8)
    if (!index) continue
    const reward = byLink.get(index)
    if (!reward) return null
    if (reward.type === 6 && reward.model === 2) {
      const mode = reward.settings?.[2]
      if (mode === undefined || mode === 1 || mode === 3) return null
    }
  }
  const scenery = findStoneHeadHeading(objects, trigger)
  return scenery ? { triggerIndex: trigger.index, sceneryIndex: scenery.sceneryIndex } : null
}

const sources = new Map<number, Map<string, StoneHead149Source | null>>()
export function originalStoneHead149Source(mission: number, shrine: HeadIdentity) {
  let heads = sources.get(mission)
  if (!heads) {
    heads = new Map()
    sources.set(mission, heads)
  }
  const heading = Math.round((shrine.angle * 1024) / Math.PI) & 2047,
    key = `${shrine.x}:${shrine.z}:${shrine.range}:${heading}`
  if (!heads.has(key))
    heads.set(key, findStoneHead149Source(missionData(mission).level.objects, shrine))
  return heads.get(key) ?? null
}

// Static presentation only: controller identity, work, RNG, headings, visibility
// and old/new checkpoint data remain untouched. No morph state or clock is added.
export function stoneHead149Model(shrine: Shrine, mission: number): number {
  if (
    shrine.kind === 'vault' ||
    shrine.model !== 45 ||
    shrine.morph ||
    shrine.stoneHead ||
    (shrine.mode !== undefined && shrine.mode !== 0)
  )
    return shrine.model
  return originalStoneHead149Source(mission, shrine) ? STONE_HEAD_149_MODEL : shrine.model
}
