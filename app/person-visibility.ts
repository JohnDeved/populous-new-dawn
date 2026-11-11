import { teamForTribe, type World, type Unit } from './world-types.ts'

export function unitInvisibleToPlayer(w: World, u: Unit) {
  return !!(
    u.invisibility &&
    u.team !== teamForTribe(w.manaWorld.playerTribe) &&
    !(w.manaTribes[w.manaWorld.playerTribe]?.flags2 & 8)
  )
}
