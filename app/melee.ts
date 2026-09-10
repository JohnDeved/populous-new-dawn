import type { UnitKind } from './model.ts'
import rules from './original-rules.json' with { type: 'json' }
import sprites from './original-units.json' with { type: 'json' }

export type MeleeAttack = 'attack' | 'strike' | 'special'
const models = { brave: 2, warrior: 3, shaman: 7 }
const animationRows = { attack: 10, strike: 8, special: 16, recoil: 9 }

export function meleeAnimationObject(kind: UnitKind, action: MeleeAttack | 'recoil') {
  return rules.personAnimationObjects[animationRows[action] * 9 + models[kind]]
}

// Timers in 0x518fb0 use the authored object duration. Recoil substates 5/6
// override it for knockback and shamans respectively.
export function meleeDuration(kind: UnitKind, action: MeleeAttack | 'recoil', knockback = false) {
  if (action === 'recoil') {
    if (knockback) return 4
    if (kind === 'shaman') return 7
  }
  const [object, draw] = rules.animationObjects[meleeAnimationObject(kind, action)]
  return (rules.animationDescriptors[draw].step + 1) * sprites.frameCounts[object]
}

// 0x518fb0, ready fighter decision. Distance is from the opponent's assigned
// fight slot, not from the attacker. Choosing an attack consumes no extra RNG.
export function chooseMeleeAttack(
  kind: UnitKind,
  choice: number,
  opponent: { ready: boolean; fighting: boolean; slotDistanceSquared: number },
  groupSize: number
): MeleeAttack | null {
  if (opponent.ready) {
    if (kind === 'shaman') return choice <= 6 ? 'attack' : 'special'
    if (choice <= 4) return 'attack'
    return choice < 14 ? 'special' : 'strike'
  }
  if (choice >= 4 || opponent.slotDistanceSquared >= 129600) return null
  if (!opponent.fighting) return 'special'
  if (groupSize <= 2) return null
  return choice & 1 ? 'strike' : 'special'
}
