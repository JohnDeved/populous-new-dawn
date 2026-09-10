import type { UnitKind } from './model.ts'

export type MeleeAttack = 'attack' | 'strike' | 'special'

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
