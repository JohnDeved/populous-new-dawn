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
  origin: number
  entity: number
  damage: number
  retries: number
  retreatPercent: number
  quotas: number[]
  members: number[]
  route: MarkerEntry[]
}
export type MarkerEntry = { marker: number; secondary: number; quotas: number[] }
export type ComputerQueue = {
  tasks: ComputerTask[]
  cursor: number
  flags: number
  coordinateLatch: number
  selectionOwner: number
  commandDelay: number
  markerValue: number
  markerEntries: MarkerEntry[]
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
      origin: 0,
      entity: 0,
      damage: 0,
      retries: 0,
      retreatPercent: 0,
      quotas: [],
      members: [],
      route: Array.from({ length: 4 }, () => ({ marker: 0, secondary: 0, quotas: [0, 0, 0, 0] })),
    })),
    cursor: 0,
    flags: 0,
    coordinateLatch: 0,
    selectionOwner: 10,
    commandDelay: 0,
    markerValue: 0,
    markerEntries: Array.from({ length: 36 }, () => ({
      marker: 0,
      secondary: 0,
      quotas: [0, 0, 0, 0],
    })),
  }
}

// 0x4e67b0: command 1097 allocates one tower-staffing task in the first free slot.
export function requestTowerStaffing(ai: ComputerQueue, target: number, model: number) {
  const task = ai.tasks.find(t => !(t.flags & 1))
  if (!task) return
  Object.assign(task, {
    flags: ((task.flags & ~2) | 1) >>> 0,
    type: 7,
    phase: 0,
    target: target & 65535,
    requested: model | 0,
    members: [],
  })
}

// 0x4e6550: type 24 snapshots up to four marker-entry records into the first free task.
export function requestMarkerTask(ai: ComputerQueue, entries: number[], special: boolean) {
  const task = ai.tasks.find(t => !(t.flags & 1))
  if (!task) return
  for (let i = 0; i < 4; i++) {
    const index = entries[i] ?? -1
    if (index === -1) task.route[i].marker = -1
    else {
      const entry = ai.markerEntries[index]
      if (!entry) throw new RangeError('Invalid computer marker entry')
      task.route[i] = { ...entry, quotas: [...entry.quotas] }
    }
  }
  Object.assign(task, {
    flags: ((task.flags & ~2) | 1) >>> 0,
    type: 24,
    phase: 0,
    target: -1,
    mode: 0,
    extra: special ? 1 : 0,
  })
}

export type MarkerInput = {
  existing: (marker: number, secondary: number) => number
  select: (model: number, count: number, marker: number) => number[]
}
export type MarkerAction =
  | { kind: 'select'; id: number }
  | { kind: 'order'; ids: number[]; marker: number }
  | { kind: 'guard'; ids: number[]; marker: number; secondary: number }
  | { kind: 'restore'; ids: number[] }

// 0x4cedd0 marker routes.
export function stepMarkerTask(ai: ComputerQueue, index: number, input: MarkerInput) {
  const task = ai.tasks[index],
    actions: MarkerAction[] = []
  const route = task.route[task.mode]
  if (task.phase === 0) {
    task.selected = 0
    task.remaining = 0
    task.members.length = 0
    task.phase = 2
    let existing = input.existing(route.marker, route.secondary)
    if (existing >= route.quotas.reduce((sum, n) => sum + n, 0)) {
      task.phase = 6
      return actions
    }
    for (let i = 0; i < 4 && existing; i++) {
      const used = Math.min(existing, route.quotas[i])
      route.quotas[i] -= used
      existing -= used
    }
  }
  if (task.phase === 2) {
    if (acquireSelection(ai, index)) task.phase = 3
    return actions
  }
  if (task.phase === 3) {
    while (task.remaining < 4) {
      const model = [2, 3, 6, 4][task.remaining],
        count = route.quotas[task.remaining++]
      if (!count) continue
      const ids = input.select(model, count, route.marker)
      task.members.push(...ids)
      task.selected += ids.length
      return ids.map(id => ({ kind: 'select' as const, id }))
    }
    if (!task.selected) task.phase = 6
    else {
      task.phase = 4
      ai.commandDelay = 20
    }
    return actions
  }
  if (task.phase === 4) {
    task.phase = 5
    return actions
  }
  if (task.phase === 5) {
    const ids = [...task.members]
    actions.push(
      task.extra
        ? { kind: 'order', ids, marker: route.marker }
        : { kind: 'guard', ids, marker: route.marker, secondary: route.secondary },
      { kind: 'restore', ids }
    )
    task.members.length = 0
    releaseSelection(ai, index)
    task.phase = 6
    return actions
  }
  if (task.phase === 6) {
    releaseSelection(ai, index)
    task.mode++
    if (task.mode >= 4 || task.route[task.mode].marker === -1) task.flags &= ~3
    else task.phase = 0
  }
  return actions
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
// the ten-slot task queue and snapshots the six away-class percentages and
// attribute-28 retreat percentage.
export function requestAttack(
  ai: ComputerQueue,
  target: number,
  marker: number,
  requested: number,
  damage: number,
  quotas: number[],
  retreatPercent: number,
  enabled: boolean,
  maximum: number,
  entity = 0
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
    origin: target & 65535,
    entity: entity | 0,
    damage: 0,
    retries: 0,
    retreatPercent: retreatPercent & 255,
    quotas: quotas.slice(0, 6).map(n => n & 255),
    members: [],
  })
}

// 0x4e68e0 / 0x4d04c0: one periodic task selects the configured follower mix
// and gives the selected group a persistent order targeting the current shaman.
export function requestShamanGuard(
  ai: ComputerQueue,
  requested: number,
  quotas: number[],
  hasShaman: boolean
) {
  if (!hasShaman || ai.tasks.some(t => t.flags & 1 && t.type === 28)) return
  const task = ai.tasks.find(t => !(t.flags & 1))
  if (!task) return
  Object.assign(task, {
    flags: ((task.flags & ~2) | 1) >>> 0,
    type: 28,
    phase: 0,
    requested: requested | 0,
    selected: 0,
    remaining: 0,
    quotas: quotas.slice(0, 5).map(n => n & 255),
    members: [],
  })
}

export type ShamanGuardInput = {
  existing: () => number
  select: (model: number, count: number) => number[]
}
export type ShamanGuardAction =
  | { kind: 'select'; id: number }
  | { kind: 'order' | 'restore'; ids: number[] }

export function stepShamanGuardTask(
  ai: ComputerQueue,
  index: number,
  input: ShamanGuardInput
): ShamanGuardAction[] {
  const task = ai.tasks[index],
    actions: ShamanGuardAction[] = [],
    models = [2, 3, 6, 4, 5]
  if (task.phase === 0) {
    const existing = input.existing()
    task.quotas = task.quotas.map(n => Math.trunc((n * task.requested) / 100))
    task.requested = Math.max(0, task.requested - existing)
    let remaining = existing
    for (const quota of [0, 4, 3, 2, 1]) {
      const used = Math.min(remaining, task.quotas[quota])
      task.quotas[quota] -= used
      remaining -= used
    }
    task.selected = 0
    task.remaining = 0
    task.members.length = 0
    task.phase = task.requested ? 2 : 6
  }
  if (task.phase === 2) {
    if (acquireSelection(ai, index)) task.phase = 3
    return actions
  }
  if (task.phase === 3) {
    while (task.remaining < models.length) {
      const model = models[task.remaining],
        count = task.quotas[task.remaining++] ?? 0
      if (!count) continue
      const ids = input.select(model, count)
      task.members.push(...ids)
      task.selected += ids.length
      return ids.map(id => ({ kind: 'select' as const, id }))
    }
    const ids = input.select(-1, Math.max(0, task.requested - task.selected))
    task.members.push(...ids)
    task.selected += ids.length
    if (!task.selected) task.phase = 6
    else {
      task.phase = 4
      ai.commandDelay = 20
    }
    return ids.map(id => ({ kind: 'select' as const, id }))
  }
  if (task.phase === 4) {
    task.phase = 5
    return actions
  }
  if (task.phase === 5) {
    const ids = [...task.members]
    releaseSelection(ai, index)
    task.phase = 6
    return [
      { kind: 'order', ids },
      { kind: 'restore', ids },
    ]
  }
  if (task.phase === 6) {
    releaseSelection(ai, index)
    task.flags &= ~3
    task.members.length = 0
  }
  return actions
}

// 0x4f2290 / 0x4f5c80: selection is locked across task calls; type-20 tasks
// can also block acquisition while the lock itself is free.
export function acquireSelection(ai: ComputerQueue, index: number) {
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
export function releaseSelection(ai: ComputerQueue, index: number) {
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
  activeMembers: () => number
  targetsRemain: (target: number) => boolean
  random: () => number
  entity?: (id: number) => AttackTarget | null
  tracking?: (id: number) => boolean
  reacquire?: () => AttackTarget | null
}
export type AttackTarget = { id: number; target: number; direct?: boolean; contained?: boolean }
export type AttackAction =
  | { kind: 'select'; id: number }
  | { kind: 'move' | 'attack' | 'attackPerson'; target: number; replace: boolean }

export function creditAttackTask(ai: ComputerQueue, person: number, damage: number) {
  const task = ai.tasks.find(
    task => task.flags & 1 && task.type === 20 && task.phase === 16 && task.members.includes(person)
  )
  if (task) task.damage = (task.damage + damage) | 0
}

// Ordinary type-20 route in 0x4cb400. Person command 19 owns the actual fight;
// this task only dispatches it, observes its native stop conditions and regroups.
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
    const target = task.entity ? input.entity?.(task.entity) : null
    if (target?.direct) {
      task.target = target.target
      task.phase = 17
      return [{ kind: 'attackPerson', target: target.id, replace: true }]
    }
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
  if (task.phase === 14) {
    if (acquireSelection(ai, index)) task.phase = 15
    return actions
  }
  if (task.phase === 15) {
    releaseSelection(ai, index)
    task.phase = 16
    task.retries = 0
    return [{ kind: 'attack', target: task.target, replace: true }]
  }
  if (task.phase === 16) {
    const active = input.activeMembers()
    if (!active) {
      task.phase = 23
      return actions
    }
    if (Math.trunc(((task.retreatPercent & 255) * task.requested) / 100) > active) {
      task.phase = 6
      task.fallback = 23
      task.elapsed = 0
      return [{ kind: 'move', target: input.staging, replace: true }]
    }
    const target = task.entity ? input.entity?.(task.entity) : null
    if (task.damage < task.extra && target) {
      const moved = task.target !== target.target
      task.target = target.target
      if (moved || !input.targetsRemain(task.target))
        return [{ kind: 'attack', target: task.target, replace: true }]
      return actions
    }
    if (task.damage < task.extra && input.targetsRemain(task.target)) return actions
    if (task.damage < task.extra) {
      const x = ((task.origin & 255) + (input.random() & 63) - 32) & 255,
        y = ((task.origin >>> 8) + (input.random() & 63) - 32) & 255
      task.target = x | (y << 8)
      if (++task.retries <= 32) return actions
    }
    task.phase = 6
    task.fallback = 23
    task.elapsed = 0
    return [{ kind: 'move', target: input.staging, replace: true }]
  }
  if (task.phase === 17) {
    if (!input.activeMembers()) {
      task.phase = 23
      return actions
    }
    const target = input.entity?.(task.entity)
    if (target?.contained) {
      const replacement = input.reacquire?.()
      if (replacement) {
        task.entity = replacement.id
        task.target = replacement.target
        task.phase = 16
        return [{ kind: 'move', target: task.target, replace: true }]
      }
      task.phase = 23
      return actions
    } else if (target) {
      task.target = target.target
      if (input.ready() && !input.tracking?.(task.entity))
        return [{ kind: 'attackPerson', target: task.entity, replace: true }]
      return actions
    }
    task.phase = 23
    return [{ kind: 'move', target: input.staging, replace: true }]
  }
  if (task.phase === 23) {
    releaseSelection(ai, index)
    task.flags &= ~3
    task.members.length = 0
  }
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
