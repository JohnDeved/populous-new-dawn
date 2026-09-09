import type { ManaTribe, ManaWorld } from './mana.ts'

// 0x49e8b0: production relative to estimated demand, not an individual spell's charge.
// ponytail: logical 640×480 HUD; native per-resolution integer scaling remains separate.
export function manaMeter(
  tribe: Pick<ManaTribe, 'previousRate' | 'estimatedRate'>,
  world: Pick<ManaWorld, 'gameFlags' | 'manaFlags'>,
  override = false
) {
  if (world.gameFlags & 32) return []
  const maximum =
    tribe.estimatedRate > 0
      ? tribe.estimatedRate + Math.trunc(Math.imul(tribe.estimatedRate, 200) / 256)
      : 256
  const value = tribe.estimatedRate > 0 ? Math.min(tribe.previousRate, maximum) : 256
  const end = Math.trunc(Math.imul(88, value) / maximum)
  return Array.from({ length: 44 }, (_, i) => {
    if (world.manaFlags & 1 && !override) return 139
    const bright = i * 2 < end
    if (i * 2 < 68) return bright ? 130 : 175
    return bright ? 231 : 225
  })
}
