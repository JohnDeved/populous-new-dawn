import type { ManaTribe, ManaWorld } from './mana.ts'
import { SPELLS } from './world-rules.ts'
import { spellHudCanCharge, spellHudPermanent } from './spell-visibility.ts'
import type { World } from './world-types.ts'

// Spell-panel charging controls. See decomp/research/spell-modifier-controls.md.
// The right-click producer 0x49e650 emits one of three tribe commands, which
// process_tribe_cmd (0x43e8e0) applies to the paused-charging mask
// (field10, bit model-1; a set bit pauses charging).
export const SpellChargingCommand = { Toggle: 0x56, All: 0x74, Focus: 0x75 } as const
export type SpellChargingCommand = (typeof SpellChargingCommand)[keyof typeof SpellChargingCommand]

type ChargingWorld = Pick<World, 'manaWorld' | 'manaTribes' | 'shots' | 'outcome' | 'charging'>
type SpellDescriptor = (typeof SPELLS)[number]

// 0x4c2ba0: charging is active for a nonzero model whose paused bit is clear.
const charging = (w: ManaWorld, owner: number, model: number) =>
  !!model && !(w.spells[owner].disabled & (1 << ((model - 1) & 31)))
// 0x4c2be0 clears and 0x4c2c10 sets the paused bit.
const setCharging = (w: ManaWorld, owner: number, model: number, enable: boolean) => {
  const bit = 1 << ((model - 1) & 31)
  if (enable) w.spells[owner].disabled &= ~bit
  else w.spells[owner].disabled |= bit
}

// 0x49e650 after its alternate-mode and 0x4c2ca0 mode-2 gates. Ctrl (scancodes
// 1d/9d) is tested before Shift (2a/36); Alt has no branch. Only the plain
// toggle requires the permanent spell bit.
export function spellChargingCommand(
  world: ChargingWorld,
  spell: SpellDescriptor,
  modifiers: { ctrlKey: boolean; shiftKey: boolean }
) {
  if (!spellHudCanCharge(world, spell)) return null
  const player = world.manaWorld.playerTribe,
    paused = !charging(world.manaWorld, player, spell.model)
  if (modifiers.ctrlKey)
    return { command: SpellChargingCommand.Focus, model: spell.model, enable: false }
  if (modifiers.shiftKey)
    return { command: SpellChargingCommand.All, model: spell.model, enable: paused }
  if (!spellHudPermanent(world, spell)) return null
  return { command: SpellChargingCommand.Toggle, model: spell.model, enable: paused }
}

// process_tribe_cmd cases 0x56/0x74/0x75. The command tribe keeps the focus
// memory (+0x9e9 mask, bit 0 marking an active focus; +0xc25 focused model);
// the masks belong to its spell owner (+0xc22). Loops follow `available`
// bit(index) while paused bits use bit(index - 1).
export function applySpellChargingCommand(
  w: ManaWorld,
  tribe: Pick<ManaTribe, 'spellOwner' | 'chargeFocusMask' | 'chargeFocusModel'>,
  command: SpellChargingCommand,
  model: number,
  enable: boolean
) {
  const owner = tribe.spellOwner,
    available = w.spells[owner].available
  if (command === SpellChargingCommand.Toggle) setCharging(w, owner, model, enable)
  else if (command === SpellChargingCommand.All) {
    for (let index = 0; index < 32; index++)
      if (available & (1 << index)) setCharging(w, owner, index, enable)
  } else if (tribe.chargeFocusModel === model && tribe.chargeFocusMask & 1) {
    for (let index = 0; index < 32; index++)
      if (available & (1 << index))
        setCharging(w, owner, index, !!(tribe.chargeFocusMask & (1 << index)))
    tribe.chargeFocusMask &= ~1
    tribe.chargeFocusModel = 0
    return
  } else {
    tribe.chargeFocusMask = 0
    for (let index = 0; index < 32; index++)
      if (available & (1 << index) && charging(w, owner, index)) {
        tribe.chargeFocusMask |= 1 << index
        setCharging(w, owner, index, false)
      }
    setCharging(w, owner, model, true)
    tribe.chargeFocusModel = model
    tribe.chargeFocusMask |= 1
    return
  }
  tribe.chargeFocusMask &= ~1
}

// Shipped spell-card right-click: producer, then the player's command consumer.
export function rightClickSpellCharging(
  world: ChargingWorld,
  spell: SpellDescriptor,
  modifiers: { ctrlKey: boolean; shiftKey: boolean }
) {
  const request = spellChargingCommand(world, spell, modifiers)
  if (!request) return false
  const tribe = world.manaTribes[world.manaWorld.playerTribe]
  applySpellChargingCommand(world.manaWorld, tribe, request.command, request.model, request.enable)
  // The turn reconciles player Blast (bit 1) from this legacy flag.
  world.charging = !(world.manaWorld.spells[0].disabled & 2)
  return true
}
