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
  | 'approach'
  | 'face'
  | 'pray'
  | 'open'
  | 'enter'
  | 'trigger'
  | 'exit'
  | 'close'
  | 'leave'

export type VaultInput = {
  target: number
  targetValid: boolean
  arrived: boolean
  ready: boolean
  triggerExists: boolean
  adjacent: boolean
  open: boolean
}

// Complete 0x43c7a0 task phases; world movement and object animation consume actions.
export function stepVaultTask(task: VaultTask, input: VaultInput) {
  const actions: VaultAction[] = []
  const next = (phase: number) => {
    task.phase = phase
    task.entering = true
  }
  if (!task.phase) {
    task.phase = 1
    task.head = input.target
  }
  if (!input.targetValid) return { done: true, actions }
  if (task.phase === 1) {
    let done = false
    const first = task.entering
    task.entering = false
    if (first) {
      actions.push('approach')
      if (!input.triggerExists) {
        if (!input.adjacent) done = true
        else next(7)
      } else if (input.adjacent && input.ready) next(4)
    }
    if (task.phase === 1 && input.arrived) next(input.open ? 4 : 2)
    if (done) return { done: true, actions: [] }
    if (task.phase === 1) return { done: false, actions }
  }
  const first = task.entering
  if (task.phase >= 2 && task.phase <= 5 && !input.triggerExists) return { done: true, actions }
  task.entering = false
  switch (task.phase) {
    case 2:
      if (first) actions.push('face')
      actions.push('pray')
      if (!input.arrived)
        next(1) // Native task returns to its approach state.
      else if (input.ready) next(3)
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
      if (input.arrived) next(5)
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
      if (input.arrived) next(8)
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
      if (input.arrived) return { done: true, actions }
      break
    default:
      throw new Error(`Unsupported Vault task phase ${task.phase}`)
  }
  return { done: false, actions }
}
