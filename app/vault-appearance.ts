import { buildingSocketPoint } from './building-shapes.ts'
import { browserPosition } from './world-coordinates.ts'
import { SPELLS } from './world-rules.ts'
import type { Shrine } from './world-types.ts'

export const VAULT_KNOWLEDGE_SOCKET = 1

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

// 0x4faaf0 replaces the class-6/model-2 reward position with the colocated
// model-18 Vault's 0x404540 socket 1. Shrine x/z is the rendered Vault origin,
// so recover its snapped building anchor before applying the original socket.
export function vaultKnowledgePlacement(
  shrine: Pick<Shrine, 'x' | 'z' | 'model' | 'angle'>
): { x: number; z: number; heightOffset: number } {
  const socket = buildingSocketPoint(
    {
      object: shrine.model,
      angle: Math.round((shrine.angle * 2048) / (Math.PI * 2)) & 2047,
      anchorX: Math.round((shrine.x + 8) * 256) & 0xfe00,
      anchorY: Math.round((-shrine.z - 8) * 256) & 0xfe00,
    },
    VAULT_KNOWLEDGE_SOCKET
  )
  return { ...browserPosition(socket), heightOffset: socket.heightOffset }
}
