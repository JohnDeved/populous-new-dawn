import { type Unit, type World } from './world-types.ts'
import { leaveLiveBuilding, cancelBuildingEntry } from './live-people.ts'
import { cancelLiveResting } from './live-resting.ts'
import { cancelLiveBuildingAttack } from './live-building-combat.ts'
import { cancelLiveOrder } from './live-movement.ts'
import { clearLivePath } from './live-pathfinding.ts'

export function clearFightAssignment(u: Unit) {
  if (u.flight && u.flight.workFlags === u.fight?.group) u.flight.workFlags = 0
  if (u.fight?.motion) {
    const p = u.fight.motion
    p.workFlags = 0
    if (p.immediateCommand || p.commands.some(Boolean)) u.native = p
  }
  u.fight = null
}

export function release(w: World, u: Unit, preserveOrders = false) {
  const occupant = u.inside !== null ? leaveLiveBuilding(w, u) : undefined
  u.inside = null
  releaseTasks(w, u, preserveOrders)
  return occupant
}
export function releaseTasks(w: World, u: Unit, preserveOrders = false) {
  const directTree = preserveOrders && u.work === null ? u.tree : null
  cancelLiveResting(w, u)
  if (preserveOrders) {
    // Combat takes the same person/queue; its state initializer releases training slots.
    u.entry = undefined
  } else {
    cancelLiveBuildingAttack(w, u)
    cancelLiveOrder(w, u)
    cancelBuildingEntry(w, u)
  }
  clearLivePath(w, u)
  u.vault = null
  u.work = null
  u.tree = directTree
  u.harvest = undefined
  u.delivery = undefined
  u.builder = undefined
  u.target = null
  u.guard = false
  u.timer = 0
  u.casting = null
  u.fighting = false
  clearFightAssignment(u)
  u.idleTurns = 0
}
