import { helpSpellLinkAvailable } from './help-discovery.ts'
import rules from './original-rules.json' with { type: 'json' }
import { SPELLS } from './world-rules.ts'
import type { World, Spell } from './world-types.ts'

const spellIds = new Map(SPELLS.map(spell => [spell.model, spell.id]))
export const helpSpellDiscoveryModels = Object.freeze([...spellIds.keys()].sort((a, b) => a - b))

export type HelpSpellKnowledgeWorld = {
  readonly shots: Readonly<World['shots']>
  readonly manaWorld: {
    readonly playerTribe: World['manaWorld']['playerTribe']
    readonly gameFlags: World['manaWorld']['gameFlags']
    readonly spells: readonly Readonly<Pick<World['manaWorld']['spells'][number], 'available'>>[]
  }
}

export type HelpSpellKnowledge =
  | { kind: 'known'; available: boolean; source: 'browser-current-spell'; spell: Spell }
  | { kind: 'unsupported'; reason: 'unowned-player' | 'not-help-spell-predicate' }

const dword = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= -0x80000000 &&
  value <= 0xffffffff
const byte = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 255

/** Read current browser player-0 spell knowledge, never synchronize mana state.
 * One-off payouts update World.shots; the mana stock mirror is refreshed only
 * for rechargeable spells or when beginCast debits a shot. Help indexes the
 * current player directly, not the HUD's spellOwner alias. Other players have
 * no distinct shots owner here and therefore remain explicitly unsupported. */
export function readHelpSpellKnowledge(
  world: HelpSpellKnowledgeWorld,
  model: number
): HelpSpellKnowledge {
  if (!Number.isInteger(model) || model < 0 || model > 31)
    throw new RangeError('Invalid native spell knowledge bit')
  const player = world.manaWorld?.playerTribe
  if (!Number.isInteger(player) || player < 0 || player > 3)
    throw new RangeError('Invalid current Help player')
  if (player !== 0) return { kind: 'unsupported', reason: 'unowned-player' }
  const spell = spellIds.get(model)
  if (!spell) return { kind: 'unsupported', reason: 'not-help-spell-predicate' }
  const permanent = world.manaWorld.spells?.[0]?.available,
    stock = world.shots?.[spell],
    gameFlags = world.manaWorld.gameFlags,
    alternateLimit = rules.spellCharging[model]?.alternateLimit
  if (!dword(permanent)) throw new RangeError('Missing or invalid Help permanent spell mask')
  if (!byte(stock)) throw new RangeError('Missing or invalid Help current spell stock')
  if (!dword(gameFlags)) throw new RangeError('Missing or invalid Help game flags')
  if (!byte(alternateLimit)) throw new RangeError('Missing or invalid Help spell definition byte')
  return {
    kind: 'known',
    available: helpSpellLinkAvailable(model, permanent, stock, gameFlags, alternateLimit),
    source: 'browser-current-spell',
    spell,
  }
}
