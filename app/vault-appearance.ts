import { buildingSocketPoint } from './building-shapes.ts'
import { browserPosition } from './world-coordinates.ts'
import { SPELLS } from './world-rules.ts'
import { setAnimationObject, type AnimatedUnit } from './animation.ts'
import type { Gift, Point, Shrine, World } from './world-types.ts'
import knowledge from './original-vault-knowledge.json' with { type: 'json' }

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
export function vaultKnowledgeFrame(
  reward: Shrine['reward'],
  rewardModel = 0,
  mission?: number
): number | null {
  if (!reward) return null
  if (reward === 'temple' && mission === knowledge.mission) return knowledge.body.source
  if (BUILDING_REWARDS.has(reward)) return 1077
  if (reward === 'mana') return 1056 + rewardModel
  const spell = SPELLS.find(entry => entry.id === reward)
  return spell ? 1056 + spell.model : null
}

// This resource contract is proven only for Mission 3's authored Temple Vault.
export function isTempleKnowledgeVault(shrine: Shrine, mission: number) {
  return (
    mission === knowledge.mission &&
    shrine.kind === 'vault' &&
    shrine.mode === 4 &&
    shrine.reward === 'temple' &&
    shrine.x === knowledge.source.x &&
    shrine.z === knowledge.source.z
  )
}

export function templeKnowledgeSource(world: Pick<World, 'outcome' | 'shrines'>, point: Point) {
  return world.shrines.find(
    shrine =>
      (shrine.x - point.x) % 256 === 0 &&
      (shrine.z - point.z) % 256 === 0 &&
      isTempleKnowledgeVault(shrine, world.outcome.level)
  )
}

export function createKnowledgeGlow(): AnimatedUnit {
  const state: AnimatedUnit = {
    object: 0,
    draw: 0,
    morph: 0,
    palette: 0,
    renderFlags: 0,
    f1: 0,
    f2: 0,
    stamp: 0,
    flags3: 0x400,
    morphTimer: 0,
    morphFrames: 0,
  }
  setAnimationObject(state, knowledge.glow.draw, knowledge.glow.frames[0].source)
  state.morph = 1 // Native sprite depth bias, not a geometry morph.
  return state
}

// Creation/migration only. Rendering reads the saved cursor without changing it.
export function initializeVaultKnowledge(shrine: Shrine, mission: number) {
  if (shrine.active && isTempleKnowledgeVault(shrine, mission))
    shrine.knowledgeGlow ??= { ...createKnowledgeGlow(), displayedFrame: 0 }
}

export function isTempleKnowledgeGift(gift: Gift) {
  return (
    gift.reward === 'temple' &&
    gift.frame === knowledge.body.source &&
    gift.animation?.object === knowledge.glow.frames[0].source &&
    gift.animation.draw === knowledge.glow.draw
  )
}

export function vaultKnowledgeVisible(shrine: Pick<Shrine, 'kind' | 'active' | 'reward'>): boolean {
  return shrine.kind === 'vault' && shrine.active && !!shrine.reward
}

// 0x4faaf0 replaces the class-6/model-2 reward position with the colocated
// model-18 Vault's 0x404540 socket 1. Shrine x/z is the rendered Vault origin,
// so recover its snapped building anchor before applying the original socket.
export function vaultKnowledgePlacement(shrine: Pick<Shrine, 'x' | 'z' | 'model' | 'angle'>): {
  x: number
  z: number
  heightOffset: number
} {
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
