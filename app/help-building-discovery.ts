import { missionAllowsBuilding } from './mission-data.ts'
import type { World } from './world-types.ts'

// The distinct arguments of the imported 00425110 predicates. These are
// knowledge bits, not object models inferred from a picked/rendered building.
export const helpBuildingDiscoveryModels = Object.freeze([1, 4, 5, 6, 7, 8, 13, 15, 17] as const)

const owners = {
  1: 'unlockedHut',
  4: 'unlockedTower',
  5: 'unlockedTemple',
  6: 'unlockedSpyHut',
  7: 'unlockedCamp',
  8: 'unlockedFirewarriorHut',
  13: 'unlockedBoatHouse',
  15: 'unlockedBalloonHut',
  17: 'unlockedGuardPost',
} as const

type OwnedField = (typeof owners)[keyof typeof owners]
export type HelpBuildingKnowledgeWorld = Readonly<Pick<World, OwnedField>> & {
  readonly manaWorld: Readonly<Pick<World['manaWorld'], 'playerTribe'>>
}

export type HelpBuildingKnowledge =
  | { kind: 'known'; available: boolean; source: 'browser-current-unlock'; field: OwnedField }
  | {
      kind: 'unsupported'
      reason: 'unowned-player' | 'unowned-building-bit' | 'not-help-building-predicate'
    }

/** Read the existing browser knowledge owner, without caching or changing it.
 * Native 00425110 reads only the current player's permanent building mask.
 * World owns the corresponding player-0 booleans. Hut1/GuardPost17 are optional
 * in existing checkpoints; never reconstruct missing current state from a level
 * header, placement, counts or HUD state. The supported browser producers do not
 * change these two bits yet. Future primary script/reward/debug producers must
 * update the actual World owner, not this reader; temporary grants must not.
 * This is current browser ownership, not complete native producer parity. */
export function readHelpBuildingKnowledge(
  world: HelpBuildingKnowledgeWorld,
  model: number
): HelpBuildingKnowledge {
  if (!Number.isInteger(model) || model < 0 || model > 31)
    throw new RangeError('Invalid native building knowledge bit')
  const player = world.manaWorld.playerTribe
  if (!Number.isInteger(player) || player < 0 || player > 3)
    throw new RangeError('Invalid current Help player')
  if (player !== 0) return { kind: 'unsupported', reason: 'unowned-player' }
  const field = owners[model as keyof typeof owners]
  if (!field) return { kind: 'unsupported', reason: 'not-help-building-predicate' }
  const available = world[field]
  if ((model === 1 || model === 17) && available === undefined)
    return { kind: 'unsupported', reason: 'unowned-building-bit' }
  if (typeof available !== 'boolean') throw new Error('Missing owned building knowledge')
  return { kind: 'known', available, source: 'browser-current-unlock', field }
}

/** Authored INITIAL player-0 profile only. Native 00486160 copies header bytes
 * 0..55; subsequent 00408e30/00408e50 and gift writes may change the live mask.
 * Deliberately not a HelpDiscovery mask or a fallback for unsupported live bits.
 * Read the bound World's actual mission identity, never campaign progress. */
export function readHelpInitialBuildingProfile(world: {
  readonly outcome: Readonly<Pick<World['outcome'], 'level'>>
}) {
  const level = world.outcome.level
  if (!Number.isInteger(level)) throw new RangeError('Invalid Help profile level')
  return {
    kind: 'authored-initial-profile' as const,
    level,
    player: 0 as const,
    buildings: helpBuildingDiscoveryModels.map(model => ({
      model,
      initiallyAvailable: missionAllowsBuilding(level, model),
    })),
  }
}
