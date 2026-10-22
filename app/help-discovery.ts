export interface HelpDiscovery {
  spellBits: number
  buildingBits: number
  stock: readonly number[]
  // Historical fixture name for native 0089d17c, which World calls gameFlags.
  levelFlags: number
  spellDefinitionByte: readonly number[]
}

/** Positivity of 004c29a0 as used by Help, not charging/HUD visibility. */
export function helpSpellLinkAvailable(
  model: number,
  permanentMask: number,
  stock: number,
  gameFlags: number,
  alternateLimit: number
) {
  const count = stock & 15
  return gameFlags & 0x20 ? !!(alternateLimit && count) : !!(permanentMask & (1 << model) || count)
}

/** Source predicates 004250f0/00425110 and spell code 004c29a0. This is the
 * native availability mask/stock, not inferred campaign or display-name data. */
export function helpLinkAvailable(predicate: string, argument: number, state: HelpDiscovery) {
  if (predicate === '00000000') return true
  if (predicate === '00425110') return !!(state.buildingBits & (1 << argument))
  if (predicate !== '004250f0') throw new Error('Unimported help discovery predicate')
  return helpSpellLinkAvailable(
    argument,
    state.spellBits,
    state.stock[argument] ?? 0,
    state.levelFlags,
    state.spellDefinitionByte[argument] ?? 0
  )
}

// Failed links stay present and activatable, but open the original unavailable
// topic 1057. Direct contextual Query selection does not use this link gate.
export function helpLinkTarget(relativeTopic: number, available: boolean) {
  if (!Number.isInteger(relativeTopic) || relativeTopic < 0 || relativeTopic > 87)
    throw new RangeError('Unimported help link')
  return available ? relativeTopic + 983 : 1057
}
