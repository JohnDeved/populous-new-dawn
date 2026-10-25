import { missionData } from './mission-data.ts'
import type { Shrine } from './world-types.ts'

export interface OrdinaryWorshipSource {
  head: number
  reward: number
  slot: number
  model: 3 | 4 | 12
}

// Keep the proved ordinary M1/M2 source distinct from spell-valued Vault rewards.
export function ordinaryWorshipSource(
  mission: number,
  headIndex: number
): OrdinaryWorshipSource | undefined {
  if (mission !== 1 && mission !== 2) return
  const objects = missionData(mission).level.objects,
    head = objects.find(object => object.index === headIndex)
  if (head?.type !== 6 || head.model !== 6 || head.settings?.[0] !== 0) return
  const rewards = []
  for (let slot = 0; slot < 10; slot++) {
    const token = head.settings[6 + slot * 2] | (head.settings[7 + slot * 2] << 8),
      reward = objects.find(object => object.index === token - 1)
    if (reward?.type === 6 && reward.model === 2) rewards.push({ reward, slot })
  }
  if (rewards.length !== 1 || rewards[0].reward.settings?.[0] !== 11) return
  const model = rewards[0].reward.settings[1]
  if (model !== 3 && model !== 4 && model !== 12) return
  return { head: head.index, reward: rewards[0].reward.index, slot: rewards[0].slot, model }
}

// Recover only an unambiguous authored head for an older checkpoint. Existing
// gifts have lost this provenance and must never acquire the tag retroactively.
export function restoreOrdinaryWorshipSource(mission: number, shrine: Shrine) {
  if (shrine.kind === 'vault' || (shrine.mode !== undefined && shrine.mode !== 0)) return
  const heading = Math.round((shrine.angle * 2048) / (Math.PI * 2)) & 2047,
    sources = missionData(mission)
      .level.objects.filter(
        object =>
          object.x === shrine.x &&
          object.z === shrine.z &&
          object.settings?.[1] === shrine.range &&
          (object.angle & 2047) === heading
      )
      .flatMap(object => ordinaryWorshipSource(mission, object.index) ?? [])
  return sources.length === 1 ? sources[0] : undefined
}
