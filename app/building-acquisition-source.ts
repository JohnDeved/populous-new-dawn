import { missionData } from './mission-data.ts'
import type { Gift, Point, World } from './world-types.ts'

export interface BuildingAcquisitionSource {
  mission: 1
  head: 1
  reward: 2
  slot: number
  rewardClass: 2
  model: 7
}

/** Creation-only provenance. Coordinates/artwork or a camp-valued gift do not
 * establish the authored head → reward link, and legacy gifts are never retagged. */
export function buildingAcquisitionSource(world: World, reward: Gift['reward'], point: Point) {
  if (world.outcome.level !== 1 || reward !== 'camp') return
  const shrine = world.shrines.find(candidate => candidate === point)
  if (!shrine || shrine.kind !== 'vault' || shrine.mode !== 4 || shrine.reward !== 'camp') return
  if ((shrine.rewardRecipient ?? 0) !== world.manaWorld.playerTribe) return
  const objects = missionData(1).level.objects,
    head = objects.find(object => object.index === 1),
    gift = objects.find(object => object.index === 2)
  if (
    head?.type !== 6 || head.model !== 6 || head.settings?.[0] !== 4 ||
    head.x !== shrine.x || head.z !== shrine.z ||
    gift?.type !== 6 || gift.model !== 2 || gift.settings?.[0] !== 2 ||
    gift.settings[1] !== 7 || gift.settings[2] !== 1 || gift.settings[3] !== 1
  ) return
  const slots = Array.from({ length: 10 }, (_, slot) => slot).filter(slot =>
    (head.settings[6 + slot * 2] | (head.settings[7 + slot * 2] << 8)) === 3)
  if (slots.length !== 1) return
  return { mission: 1, head: 1, reward: 2, slot: slots[0], rewardClass: 2, model: 7 } satisfies BuildingAcquisitionSource
}
