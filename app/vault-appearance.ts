import { SPELLS } from './world-rules.ts'
import type { Shrine } from './world-types.ts'

export const VAULT_KNOWLEDGE_NATIVE_HEIGHT = 800

const BUILDING_REWARDS = new Set<NonNullable<Shrine['reward']>>([
  'camp',
  'tower',
  'temple',
  'spyHut',
  'firewarriorHut',
  'boatHouse',
  'balloonHut',
])

// Native class-6/model-2 reward templates use the building/spell object tables
// directly. Vaults author one of those templates beside the class-6/model-6
// trigger, so the pre-acquisition marker must use the same original frame.
export function vaultKnowledgeFrame(reward: Shrine['reward'], rewardModel = 0): number | null {
  if (!reward) return null
  if (BUILDING_REWARDS.has(reward)) return 1077
  if (reward === 'mana') return 1056 + rewardModel
  const spell = SPELLS.find(entry => entry.id === reward)
  return spell ? 1056 + spell.model : null
}

export function vaultKnowledgeVisible(shrine: Pick<Shrine, 'kind' | 'active' | 'reward'>): boolean {
  return shrine.kind === 'vault' && shrine.active && !!shrine.reward
}
