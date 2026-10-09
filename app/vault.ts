import { beginWorshipTurn, finishWorship, type WorshipState } from './worship.ts'
import type { Shrine, Unit, World } from './world-types.ts'
import { short } from './native-math.ts'
import { clearLivePath, replanLivePath } from './live-pathfinding.ts'
import { recoverPersonMovement, stopPersonMovement } from './person-state.ts'
import { setLivePersonAnimation, type LivePerson } from './live-people.ts'
import { sound } from './world-effects.ts'
import { currentPersonOrder } from './person-orders.ts'
import { samePersonCell } from './person-idle.ts'
import { unitAnimationSource } from './unit-animation-source.ts'
import { vaultAtPersonCell, vaultPoints } from './vault-geometry.ts'

export function vaultWorkEligible(w: World, shaman: Unit | undefined, head: Shrine) {
  if (!shaman || shaman.hp <= 0 || shaman.lift || shaman.fight || shaman.casting) return false
  const person = unitAnimationSource(shaman)
  if (
    !person ||
    person !== shaman.native ||
    person.model !== 7 ||
    person.state !== 10 ||
    person.commandStatus !== 33 ||
    w.objectCells.objects.get(shaman.id) !== person
  )
    return false
  const order = currentPersonOrder(w.buildingOrders, person),
    target = person.commandPhase ? person.workTarget : person.target
  if (
    order?.model !== 33 ||
    order.flags & 1 ||
    order.a !== target ||
    shaman.vault?.head !== target ||
    !w.shrines.some(shrine => shrine.id === target && shrine.kind === 'vault' && shrine.model)
  )
    return false
  // 004fb270 accepts any occupied model-18 cell or the linked body's outside cell.
  // The current order must be real, but need not target the trigger being sampled.
  return !!vaultAtPersonCell(w, person) || samePersonCell(person, vaultPoints(head).outside)
}

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
export function stepVaultTask(
  task: VaultTask,
  input: VaultInput,
  consume?: (action: VaultAction) => void
) {
  const actions: VaultAction[] = []
  const act = (action: VaultAction) => {
    actions.push(action)
    consume?.(action)
  }
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
      act('approach')
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
      if (first) act('face')
      act('pray')
      if (!input.arrived) next(1) // Native task returns to its approach state.
      else if (input.ready) next(3)
      break
    case 3:
      if (first) {
        task.remaining = 40
        act('open')
      }
      if (--task.remaining < 1) next(4)
      break
    case 4:
      if (first) act('enter')
      if (input.arrived) next(5)
      break
    case 5:
      if (first) task.remaining = 24
      if (--task.remaining < 1) {
        act('trigger')
        next(6)
      }
      break
    case 6:
      if (first) task.remaining = 24
      if (--task.remaining < 1) next(7)
      break
    case 7:
      if (first) act('exit')
      if (input.arrived) next(8)
      break
    case 8:
      if (first) {
        task.remaining = 40
        act('face')
        act('close')
      }
      if (--task.remaining < 1) next(9)
      break
    case 9:
      if (first) act('leave')
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
    head = w.shrines.find(s => s.id === target && s.kind === 'vault' && s.model),
    points = head && vaultPoints(head)
  const previous = task.phase
  const destination = (goal: { x: number; y: number }) => {
    replanLivePath(w, u, p, goal)
    recoverPersonMovement(w, p, (person, object) =>
      setLivePersonAnimation(w, person as LivePerson, object)
    )
  }
  const { done } = stepVaultTask(
    task,
    {
      target,
      targetValid: !!head,
      // First-entry actions install their goal before this is read. A saved task
      // with entering=false instead retains its already-dispatched route endpoint.
      get arrived() {
        return (
          Math.abs(short(p.x) - short(p.goalX)) <= 11 && Math.abs(short(p.y) - short(p.goalY)) <= 11
        )
      },
      ready: !!head && head.work >= head.target,
      triggerExists: !!head?.active,
      adjacent: !!vaultAtPersonCell(w, p),
      open: head?.model === 153,
    },
    action => {
      if (!head || !points) return
      if (action === 'approach' || action === 'exit') destination(points.outside)
      if (action === 'enter') destination(points.inside)
      if (action === 'leave') destination(points.leave)
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
  )
  p.workTarget = task.head
  p.commandPhase = task.phase
  p.timer = task.remaining
  p.flags2 = (task.entering ? p.flags2 | 0x40000000 : p.flags2 & ~0x40000000) >>> 0
  u.vault = done ? null : { ...task }
  u.work = done ? null : task.head
  if (head && previous === 3 && task.phase === 4) {
    head.model = 153
    head.morph = null
  }
  return Number(done)
}
