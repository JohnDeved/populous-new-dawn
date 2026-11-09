import type { Unit } from './world-types.ts'
import { BuilderTask } from './building-workers.ts'

export function builderActivity(u: Unit) {
  const task = u.builder?.task
  return (
    task === BuilderTask.Approach ||
    task === BuilderTask.Work ||
    task === BuilderTask.Fetch ||
    task === BuilderTask.Level ||
    task === BuilderTask.ClearScenery ||
    task === BuilderTask.ClearPeople ||
    task === BuilderTask.Leave
  )
}

export function unitAnimationSource(u: Unit) {
  if (u.flight) return u.flight
  if (u.fight?.action === 'encounter') return u.fight.motion!
  if (u.fight?.motion && ['walk', 'idle'].includes(u.fight.animation ?? '')) return u.fight.motion
  if (
    u.native &&
    (u.native.guardInputPending ||
      u.native.state !== 10 ||
      [3, 6, 15, 16, 17, 18, 19, 21, 27, 30, 31, 32, 33].includes(u.native.commandStatus))
  )
    return u.native
  if (u.entry) return u.entry.person
  return builderActivity(u) && !u.fight && !u.fighting && !u.casting && !u.lift
    ? (u.builder?.person ?? null)
    : null
}

// Fight artwork owns a native phase without changing AI, command or selection
// queries that still use the existing gameplay adapter above.
export function unitRenderAnimationSource(u: Unit) {
  if (
    !u.flight &&
    u.fight?.motion &&
    u.fight.nativeAttackAnimation === true &&
    ['attack', 'strike', 'special', 'approach'].includes(u.fight.action)
  )
    return u.fight.motion
  if (
    !u.flight &&
    u.fight?.motion &&
    u.fight.nativeRecoilAnimation === true &&
    ['recoil', 'push', 'approach'].includes(u.fight.action)
  )
    return u.fight.motion
  return unitAnimationSource(u)
}
