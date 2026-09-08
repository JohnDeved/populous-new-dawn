import { beginWorshipTurn, finishWorship, type WorshipState } from './worship.ts'

// 0x4fb270, type 4: the shaman task forces completion separately from the work counter.
export function stepVaultWork(s: WorshipState, phase: number, eligible: boolean, forced: boolean) {
  if (s.reset) forced = false
  if (!beginWorshipTurn(s)) return false
  if (!(phase & 3)) {
    if (eligible && s.work < s.target) s.work++
    else if (!eligible && s.work !== 0) s.work--
  }
  if (!forced) return false
  finishWorship(s)
  return true
}

export type VaultTask = {
  head: number
  phase: number
  entering: boolean
  remaining: number
}
export type VaultAction =
  | 'face'
  | 'pray'
  | 'open'
  | 'enter'
  | 'trigger'
  | 'exit'
  | 'close'
  | 'leave'

// Reviewed post-approach states 2–9 of 0x43c7a0. World movement and object animation
// consume these actions; arrival and trigger existence come from the engine.
export function stepVaultTask(
  task: VaultTask,
  arrived: boolean,
  ready: boolean,
  triggerExists: boolean
) {
  const actions: VaultAction[] = []
  const next = (phase: number) => {
    task.phase = phase
    task.entering = true
  }
  const first = task.entering
  if (task.phase >= 2 && task.phase <= 5 && !triggerExists) return { done: true, actions }
  task.entering = false
  switch (task.phase) {
    case 2:
      if (first) actions.push('face')
      actions.push('pray')
      if (!arrived)
        next(1) // Native task returns to its approach state.
      else if (ready) next(3)
      break
    case 3:
      if (first) {
        task.remaining = 40
        actions.push('open')
      }
      if (--task.remaining < 1) next(4)
      break
    case 4:
      if (first) actions.push('enter')
      if (arrived) next(5)
      break
    case 5:
      if (first) task.remaining = 24
      if (--task.remaining < 1) {
        actions.push('trigger')
        next(6)
      }
      break
    case 6:
      if (first) task.remaining = 24
      if (--task.remaining < 1) next(7)
      break
    case 7:
      if (first) actions.push('exit')
      if (arrived) next(8)
      break
    case 8:
      if (first) {
        task.remaining = 40
        actions.push('face', 'close')
      }
      if (--task.remaining < 1) next(9)
      break
    case 9:
      if (first) actions.push('leave')
      if (arrived) return { done: true, actions }
      break
    default:
      throw new Error(`Vault approach state ${task.phase} must be supplied by the world`)
  }
  return { done: false, actions }
}
