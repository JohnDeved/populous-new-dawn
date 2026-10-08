import { missionData } from './mission-data.ts'
import type { Gift, Point, World } from './world-types.ts'

const sources = [
  { mission: 1, head: 1, reward: 2, model: 7, kind: 'camp' },
  { mission: 3, head: 91, reward: 92, model: 5, kind: 'temple' },
] as const

export type BuildingAcquisitionSource = {
  mission: 1 | 3
  head: 1 | 91
  reward: 2 | 92
  slot: number
  rewardClass: 2
  model: 5 | 7
}

/** Creation-only provenance. Coordinates/artwork or a building-valued gift do not
 * establish the authored head → reward link, and legacy gifts are never retagged. */
export function buildingAcquisitionSource(world: World, reward: Gift['reward'], point: Point) {
  const source = sources.find(candidate => candidate.mission === world.outcome.level && candidate.kind === reward)
  if (!source) return
  const shrine = world.shrines.find(candidate => candidate === point)
  if (!shrine || shrine.kind !== 'vault' || shrine.mode !== 4 || shrine.reward !== source.kind) return
  if ((shrine.rewardRecipient ?? 0) !== world.manaWorld.playerTribe) return
  const { objects } = missionData(source.mission).level
  const head = objects.find(object => object.index === source.head),
    gift = objects.find(object => object.index === source.reward),
    settings = head?.settings
  if (
    !settings ||
    head?.type !== 6 ||
    head.model !== 6 ||
    settings[0] !== 4 ||
    head.x !== shrine.x ||
    head.z !== shrine.z ||
    gift?.type !== 6 ||
    gift.model !== 2 ||
    gift.settings?.[0] !== 2 ||
    gift.settings[1] !== source.model ||
    gift.settings[2] !== 1 ||
    gift.settings[3] !== 1
  )
    return
  const slots = Array.from({ length: 10 }, (_, slot) => slot).filter(
    slot => (settings[6 + slot * 2] | (settings[7 + slot * 2] << 8)) === source.reward + 1
  )
  if (slots.length !== 1) return
  return {
    mission: source.mission,
    head: source.head,
    reward: source.reward,
    slot: slots[0],
    rewardClass: 2,
    model: source.model,
  } satisfies BuildingAcquisitionSource
}
