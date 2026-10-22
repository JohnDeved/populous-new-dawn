export interface HelpDiscovery {
  spellBits: number
  buildingBits: number
  stock: readonly number[]
  levelFlags: number
  spellDefinitionByte: readonly number[]
}

/** Source predicates 004250f0/00425110 and spell code 004c29a0. This is the
 * native availability mask/stock, not inferred campaign or display-name data. */
export function helpLinkAvailable(predicate: string, argument: number, state: HelpDiscovery) {
  if (predicate === '00000000') return true
  if (predicate === '00425110') return !!(state.buildingBits & (1 << argument))
  if (predicate !== '004250f0') throw new Error('Unimported help discovery predicate')
  const stock = (state.stock[argument] ?? 0) & 15
  return state.levelFlags & 0x20
    ? !!(state.spellDefinitionByte[argument] && stock)
    : !!(state.spellBits & (1 << argument) || stock)
}

// Failed links stay present and activatable, but open the original unavailable
// topic 1057. Direct contextual Query selection does not use this link gate.
export function helpLinkTarget(relativeTopic: number, available: boolean) {
  if (!Number.isInteger(relativeTopic) || relativeTopic < 0 || relativeTopic > 87)
    throw new RangeError('Unimported help link')
  return available ? relativeTopic + 983 : 1057
}
