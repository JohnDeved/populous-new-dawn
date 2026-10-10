import type { Shrine } from './world-types.ts'

type AutomaticWorshipHead = Pick<
  Shrine,
  'kind' | 'mode' | 'target' | 'rewardMana' | 'active' | 'panelActivity'
>

// Shrine is the browser's combined Vault body/trigger. Its active flag records
// finite trigger retirement; enabled is only the refill/sampling gate.
export function automaticVaultPanelActive(
  head: Pick<Shrine, 'kind' | 'mode' | 'model' | 'active' | 'followers'>
) {
  return (
    head.kind === 'vault' &&
    head.mode === 4 &&
    !!head.model &&
    head.active &&
    (head.followers & 0xff) !== 0
  )
}

export function automaticWorshipPanelFamily(head: AutomaticWorshipHead) {
  return (
    head.mode === 0 &&
    head.target > 0 &&
    head.kind !== 'vault' &&
    head.kind !== 'mana' &&
    head.kind !== 'inert' &&
    head.rewardMana === undefined
  )
}

// 004fb270 -> 00509290: the world sampler is the sole writer of this
// player-specific cached activity. Presentation only consumes the completed sample.
export function recordWorshipPanelActivity(
  head: AutomaticWorshipHead,
  turn: number,
  playerCount: number
) {
  if (!automaticWorshipPanelFamily(head)) return false
  head.panelActivity = { turn, count: playerCount }
  return true
}

// 005092e0 tests the cached local-player count's low byte.
export function automaticWorshipPanelActive(head: AutomaticWorshipHead) {
  return (
    head.active &&
    automaticWorshipPanelFamily(head) &&
    ((head.panelActivity?.count ?? 0) & 0xff) !== 0
  )
}
