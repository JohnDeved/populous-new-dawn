import { beginWorshipTurn, finishWorship, type WorshipState } from './worship.ts'
import type { Point, Unit, World } from './world-types.ts'
import { entrance } from './live-command.ts'
import { nativePosition } from './world-terrain-runtime.ts'
import { short } from './native-math.ts'
import { clearLivePath, replanLivePath } from './live-pathfinding.ts'
import { recoverPersonMovement, stopPersonMovement } from './person-state.ts'
import { setLivePersonAnimation, type LivePerson } from './live-people.ts'
import { sound } from './world-effects.ts'

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

export function processVaultTask(w: World, u: Unit) {
  const p = u.native!,
    task: VaultTask = {
      head: p.workTarget,
      phase: p.commandPhase,
      entering: !!(p.flags2 & 0x40000000),
      remaining: p.timer,
    },
    target = task.phase ? task.head : p.target,
    head = w.shrines.find(s => s.id === target && s.kind === 'vault'),
    door = head && entrance(w, head, 2),
    goal = head && (task.phase === 4 ? head : task.phase === 9 ? entrance(w, head, 6) : door),
    point = goal && nativePosition(w, goal),
    doorPoint = door && nativePosition(w, door),
    arrived = !!(
      point &&
      Math.abs(short(p.x) - short(point.x)) <= 11 &&
      Math.abs(short(p.y) - short(point.y)) <= 11
    ),
    adjacent = !!(
      doorPoint &&
      Math.abs(short(p.x - doorPoint.x)) < 512 &&
      Math.abs(short(p.y - doorPoint.y)) < 512
    )
  const previous = task.phase
  const { done, actions } = stepVaultTask(task, {
    target,
    targetValid: !!head,
    arrived,
    ready: !!head && head.work >= head.target,
    triggerExists: !!head?.active,
    adjacent,
    open: head?.model === 153,
  })
  p.workTarget = task.head
  p.commandPhase = task.phase
  p.timer = task.remaining
  p.flags2 = (task.entering ? p.flags2 | 0x40000000 : p.flags2 & ~0x40000000) >>> 0
  u.vault = done ? null : { ...task }
  u.work = done ? null : task.head
  if (!head || !door) return Number(done)
  const destination = (goal: Point) => {
    replanLivePath(w, u, p, nativePosition(w, goal))
    recoverPersonMovement(w, p, (person, object) =>
      setLivePersonAnimation(w, person as LivePerson, object)
    )
  }
  for (const action of actions) {
    if (action === 'approach' || action === 'exit') destination(door)
    if (action === 'enter') destination(head)
    if (action === 'leave') destination(entrance(w, head, 6))
    if (action === 'open' || action === 'close') {
      sound(w, 0x9f, head)
      head.model = 152
      head.morph = {
        from: action === 'open' ? 154 : 153,
        to: action === 'open' ? 153 : 155,
        started: w.turn,
        duration: 40,
      }
    }
    if (action === 'trigger') head.forced = true
    if (action === 'face') u.heading = Math.atan2(head.x - u.x, head.z - u.z)
    if (action === 'pray') {
      stopPersonMovement(p, (person, object) =>
        setLivePersonAnimation(w, person as LivePerson, object)
      )
      clearLivePath(w, u)
    }
  }
  if (previous === 3 && task.phase === 4) {
    head.model = 153
    head.morph = null
  }
  return Number(done)
}
