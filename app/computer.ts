// Reviewed AI queue and training controller. Native entity selection and person
// command execution are separate inputs/actions; this is not a movement port.
export type ComputerTask = {
  flags: number
  type: number
  phase: number
  target: number
  requested: number
  extra: number
  selected: number
  remaining: number
  elapsed: number
  mode: number
  fallback: number
  regroup: number
  quotas: number[]
  members: number[]
}
export type ComputerQueue = {
  tasks: ComputerTask[]
  cursor: number
  flags: number
  selectionOwner: number
  commandDelay: number
}

export function createComputerQueue(): ComputerQueue {
  return {
    tasks: Array.from({ length: 10 }, () => ({
      flags: 0,
      type: 0,
      phase: 0,
      target: 0,
      requested: 0,
      extra: 0,
      selected: 0,
      remaining: 0,
      elapsed: 0,
      mode: 0,
      fallback: 0,
      regroup: 0,
      quotas: [],
      members: [],
    })),
    cursor: 0,
    flags: 0,
    selectionOwner: 10,
    commandDelay: 0,
  }
}

// 0x4615f0: script execution precedes this choice. These two maintenance turns
// do not advance the task cursor, even when maintenance has nothing to do.
export function computerPhase(turn: number, tribe: number) {
  const phase = (turn + ((tribe << 24) >> 24)) | 0
  return ((phase + 13) & 63) === 0 ? 'radius' : ((phase + 1) & 63) === 0 ? 'produce' : 'dispatch'
}

// 0x4623e0: at most one active task per call. An empty queue still advances once.
export function dispatchComputerTask(ai: ComputerQueue, process: (index: number) => void) {
  let scanned = 0
  while (scanned < 10 && !(ai.tasks[ai.cursor].flags & 1)) {
    ai.cursor = (ai.cursor + 1) % 10
    scanned++
  }
  if (scanned < 10) process(ai.cursor)
  ai.cursor = (ai.cursor + 1) % 10
}

// 0x4e6640 / 0x462730 / 0x462790. Availability and first completed building
// come from the native person/building lists, not a nearest-building heuristic.
export function requestTraining(
  ai: ComputerQueue,
  count: number,
  model: number,
  available: number,
  firstBuilding: (model: number) => number
) {
  const index = ai.tasks.findIndex(t => !(t.flags & 1))
  if (index < 0 || !available) return
  const buildingModel = ({ 3: 7, 4: 5, 5: 6, 6: 8 } as Record<number, number>)[model]
  if (!buildingModel) return
  const target = firstBuilding(buildingModel)
  if (!target) return
  const task = ai.tasks[index]
  Object.assign(task, {
    flags: ((task.flags & ~2) | 1) >>> 0,
    type: 6,
    target: target | 0,
    requested: count | 0,
    extra: 0,
    phase: 0,
  })
  // Type 6 has no reset case in 0x462ca0: scratch fields retain their old values.
}

// 0x4e6640 / 0x4c14c0: mission ATTACK allocation is capped separately from
// the ten-slot task queue and snapshots the six away-class percentages.
export function requestAttack(
  ai: ComputerQueue,
  target: number,
  marker: number,
  requested: number,
  damage: number,
  quotas: number[],
  enabled: boolean,
  maximum: number
) {
  if (!enabled || ai.tasks.filter(t => t.flags & 1 && t.type === 20).length >= maximum) return
  const task = ai.tasks.find(t => !(t.flags & 1))
  if (!task) return
  Object.assign(task, {
    flags: ((task.flags & ~2) | 1) >>> 0,
    type: 20,
    phase: 0,
    target: target & 65535,
    requested: requested | 0,
    extra: damage | 0,
    selected: 0,
    remaining: 0,
    elapsed: 0,
    mode: marker & 255,
    fallback: 0,
    regroup: 0,
    quotas: quotas.slice(0, 6).map(n => n & 255),
    members: [],
  })
}

// 0x4f2290 / 0x4f5c80: selection is locked across task calls; type-20 tasks
// can also block acquisition while the lock itself is free.
function acquireSelection(ai: ComputerQueue, index: number) {
  const task = ai.tasks[index]
  if (!(ai.flags & 2)) {
    if (
      task.type !== 20 &&
      ai.tasks.some(
        (other, i) =>
          i !== index &&
          other.flags & 1 &&
          other.type === 20 &&
          (task.mode === 0 ? [2, 7, 11, 14] : [3, 15]).includes(other.phase)
      )
    )
      return false
    ai.flags = (ai.flags | 2) >>> 0
    ai.selectionOwner = index
  }
  return ai.selectionOwner === index
}
function releaseSelection(ai: ComputerQueue, index: number) {
  if (ai.selectionOwner !== index) return
  ai.flags = (ai.flags & ~2) >>> 0
  ai.selectionOwner = 10
}

export type AttackInput = {
  staging: number
  select: (model: number, count: number, destination: number) => number[]
  settled: () => boolean | null
  memberWithin: (target: number, radius: number) => number | null
  ready: () => boolean
}
export type AttackAction =
  | { kind: 'select'; id: number }
  | { kind: 'move'; target: number; replace: boolean }

// Bounded ordinary type-20 route: 0x4cb400 phases 0-12 and 18. Automatic
// hostile command 21 remains person-owned while phase-15 targeting is unported.
export function stepAttackTask(
  ai: ComputerQueue,
  index: number,
  input: AttackInput
): AttackAction[] {
  const task = ai.tasks[index],
    actions: AttackAction[] = []
  if (task.phase === 0) {
    task.selected = 0
    task.remaining = 0
    task.elapsed = 0
    task.members.length = 0
    task.phase = 2
  }
  if (task.phase === 2) {
    if (acquireSelection(ai, index)) task.phase = 3
    return actions
  }
  if (task.phase === 3) {
    while (task.remaining < 6) {
      const model = task.remaining + 2,
        count = Math.min(
          100,
          Math.trunc(((task.quotas[task.remaining++] ?? 0) * task.requested) / 100)
        )
      if (!count) continue
      const ids = input.select(model, count, input.staging)
      task.members.push(...ids)
      task.selected += ids.length
      return ids.map(id => ({ kind: 'select' as const, id }))
    }
    const ids = input.select(-1, Math.max(0, task.requested - task.selected), input.staging)
    task.members.push(...ids)
    task.selected += ids.length
    if (!task.selected) {
      releaseSelection(ai, index)
      task.flags &= ~3
    } else task.phase = 4
    return [...actions, ...ids.map(id => ({ kind: 'select' as const, id }))]
  }
  if (task.phase === 4) {
    task.phase = 5
    return actions
  }
  if (task.phase === 5) {
    releaseSelection(ai, index)
    task.phase = 6
    task.fallback = 18
    task.elapsed = 0
    return [{ kind: 'move', target: input.staging, replace: true }]
  }
  if (task.phase === 6) {
    task.elapsed += ai.tasks.filter(t => t.flags & 1).length
    const settled = input.settled()
    if (settled === null) {
      releaseSelection(ai, index)
      task.flags &= ~3
      task.members.length = 0
      return actions
    }
    if (settled || task.elapsed > 1800) task.phase = task.fallback
    return actions
  }
  if (task.phase === 18) {
    task.phase = 7
    return actions
  }
  if (task.phase === 7) {
    if (!input.ready()) return actions
    if (acquireSelection(ai, index)) task.phase = 9
    return actions
  }
  if (task.phase === 9) {
    if (!input.ready()) {
      releaseSelection(ai, index)
      task.phase = 7
      return actions
    }
    releaseSelection(ai, index)
    task.phase = 10
    task.elapsed = 0
    return [{ kind: 'move', target: task.target, replace: true }]
  }
  if (task.phase === 10) {
    const regroup = input.memberWithin(task.target, 20)
    if (regroup !== null) {
      task.regroup = regroup
      task.phase = 11
    }
    return actions
  }
  if (task.phase === 11) {
    if (!input.ready()) return actions
    if (acquireSelection(ai, index)) task.phase = 12
    return actions
  }
  if (task.phase === 12) {
    if (!input.ready()) {
      releaseSelection(ai, index)
      task.phase = 11
      return actions
    }
    releaseSelection(ai, index)
    task.phase = 6
    task.fallback = 14
    task.elapsed = 0
    return [{ kind: 'move', target: task.regroup, replace: false }]
  }
  // ponytail: stop at phase 14; add phase 15 only with its target-controller evidence.
  return actions
}

export type TrainingBuilding = {
  id: number
  owner: number
  state: number
  model: number
  capacity: number
  inside: number
  occupants: ({ id: number; model: number } | null)[]
}
export type TrainingInput = {
  tribe: number
  preference: number
  population: number
  trained: number
  committed: number
  maximum: number
  select: (building: TrainingBuilding, count: number) => number[]
}
export type TrainingAction =
  | { kind: 'restore' }
  | { kind: 'eject' | 'select' | 'train'; id: number }

// 0x4c8490, including signed request arithmetic, lock contention, cancellation
// and the >300 arrival timeout. Inputs must describe the current native lists.
export function stepTrainingTask(
  ai: ComputerQueue,
  index: number,
  building: TrainingBuilding | null,
  input: TrainingInput
) {
  const task = ai.tasks[index],
    actions: TrainingAction[] = []
  const cleanup = () => {
    if (acquireSelection(ai, index)) {
      actions.push({ kind: 'restore' })
      releaseSelection(ai, index)
    }
    task.flags = (task.flags & ~3) >>> 0
  }
  if (!building || task.flags & 2) {
    cleanup()
    return actions
  }
  switch (task.phase) {
    case 0:
    case 2: {
      task.remaining = task.requested
      if (!task.requested) {
        const desired =
          (Math.trunc(Math.imul(input.preference & 255, input.population) / 100) -
            ((input.trained << 16) >> 16) -
            input.committed) |
          0
        task.remaining = Math.min(Math.max(0, desired), input.maximum & 255)
      }
      for (const occupant of building.occupants.slice(0, building.capacity)) {
        if (occupant && occupant.model !== 2) actions.push({ kind: 'eject', id: occupant.id })
      }
      // Ejecting a specialist above reduces the native occupancy count immediately.
      if (building.inside - actions.length === building.capacity) {
        actions.push({ kind: 'eject', id: building.occupants[building.capacity - 1]?.id ?? 0 })
      }
      task.selected = 0
      task.phase = task.remaining ? 3 : 8
      break
    }
    case 3:
      if (acquireSelection(ai, index)) task.phase = 4
      break
    case 4: {
      const people = task.remaining < 1 ? [] : input.select(building, Math.min(task.remaining, 100))
      if (!people.length) {
        if (task.selected) {
          task.phase = 5
          ai.commandDelay = 20
        } else {
          releaseSelection(ai, index)
          actions.push({ kind: 'restore' })
          task.phase = 8
        }
      } else {
        task.selected = (task.selected + people.length) | 0
        actions.push(...people.map(id => ({ kind: 'select' as const, id })))
        task.remaining = (task.remaining - people.length) | 0
        if (task.remaining < 1) {
          task.phase = 5
          ai.commandDelay = 20
        }
      }
      break
    }
    case 5:
      task.phase = 6
      break
    case 6:
      releaseSelection(ai, index)
      if (building.owner === input.tribe && building.state !== 1) {
        actions.push({ kind: 'train', id: building.id })
        task.phase = 7
        task.elapsed = 0
      } else {
        actions.push({ kind: 'restore' })
        task.phase = 8
      }
      break
    case 7:
      task.elapsed = (task.elapsed + ai.tasks.filter(t => t.flags & 1).length) | 0
      if (building.inside === building.capacity || task.elapsed > 300) task.phase = 8
      break
    case 8:
      cleanup()
      break
  }
  return actions
}
