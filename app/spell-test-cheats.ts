import rules from './original-rules.json' with { type: 'json' }
import { SPELLS } from './world-rules.ts'
import type { World } from './world-types.ts'

export type SpellTestCheat = 'unlock' | 'refill' | 'mana'
export const CHEAT_SAVE_NOTICE =
  'Testing cheats are active. Saving and campaign progress are disabled until you restart, load a checkpoint or start another mission.'

// One-shot resource grants only. Normal spell costs, targeting, cast ownership,
// cooldowns and projectile timers remain authoritative after every grant.
export function applySpellTestCheat(world: World, action: SpellTestCheat) {
  if (world.status !== 'playing' || world.inputMask || world.manaWorld.gameFlags & 32) return false
  const player = world.manaWorld.playerTribe,
    tribe = world.manaTribes[player],
    stock = world.manaWorld.spells[tribe.spellOwner]
  if (action === 'mana') {
    tribe.available = Math.max(tribe.available, 1_000_000)
    return true
  }
  if (action === 'unlock') for (const spell of SPELLS) stock.available |= 1 << spell.model
  for (const spell of SPELLS) {
    if (!(stock.available & (1 << spell.model)) && !(world.shots[spell.id] & 15)) continue
    const count = Math.max(world.shots[spell.id] & 15, rules.spellCharging[spell.model].normalLimit)
    world.shots[spell.id] = count
    stock.stocks[spell.model] = (stock.stocks[spell.model] & 240) | count
  }
  return true
}

// F9 may close its own dialog, but never steals keys from another modal or editor.
export function spellTestShortcut(event: KeyboardEvent, open: boolean) {
  return (
    event.key === 'F9' &&
    !event.repeat &&
    !event.ctrlKey &&
    !event.altKey &&
    !event.metaKey &&
    !event.shiftKey &&
    !(event.target as HTMLElement | null)?.closest?.(
      open
        ? 'input,textarea,select,[contenteditable]'
        : 'input,textarea,select,dialog,a,[contenteditable]'
    )
  )
}
