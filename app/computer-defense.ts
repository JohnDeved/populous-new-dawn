import {
  acquireSelection,
  releaseSelection,
  type ComputerQueue,
  type ComputerTask,
} from './computer.ts'
import { cellDistanceSquared, spiralCell } from './native-math.ts'
import { spyDisguisedFrom, type SpellTargetUnit } from './computer-spells.ts'

//0x4c5cf0/0x4627f0. The caller supplies the actual0x4f4030 area assessment.
export function requestDefenseTask(
  ai: ComputerQueue,
  states: number,
  maximum: number,
  entity: number,
  cell: number,
  summarize: () => {
    total: number
    requiredBraves: number
    requiredWarriors: number
    requiredFirewarriors: number
    requiredPreachers: number
  }
) {
  const task = ai.tasks.find(candidate => !(candidate.flags & 1))
  if (
    !task ||
    !(states & 256) ||
    ai.tasks.filter(t => t.flags & 1 && t.type === 8).length >= (maximum & 255)
  )
    return false
  Object.assign(task, {
    flags: ((task.flags & ~2) | 1) >>> 0,
    type: 8,
    phase: 0,
    entity: entity & 65535,
    target: cell & 65535,
    mode: 0,
    //0x462790 preserves scratch; normalphase0/2 own its reinitialization.
    defense: task.defense ?? { center: 0, recenter: false, cursor: 0, fallback: false },
  })
  const area = summarize()
  task.quotas = [
    area.requiredBraves,
    area.requiredWarriors,
    area.requiredFirewarriors,
    area.requiredPreachers,
  ]
  if (!area.total) task.flags &= ~3
  return true
}

//0x4f3f20: native squared-cell threshold, including coordinate seams.
export function defendedResponseCell(ai: ComputerQueue, cell: number) {
  return ai.tasks.some(
    task =>
      task.flags & 1 &&
      task.type === 8 &&
      cellDistanceSquared(cell & 0xfefe, task.defense?.center ?? 0) < 26
  )
}

export type DefenseObject = SpellTargetUnit & { id: number }

//0x4f5950: center first, then223 spiral positions at radius7, not224.
// People and buildings have independent caps and retain cell/list ordering.
export function collectDefenseTargets(
  tribe: number,
  alliances: number,
  center: number,
  objects: (cell: number) => Iterable<DefenseObject>,
  maximum = 10,
  radius = 7
) {
  const people: DefenseObject[] = [],
    buildings: DefenseObject[] = []
  const visit = (cell: number) => {
    for (const p of objects(cell & 0xfefe)) {
      if (tribe === -1 || p.tribe === -1 || tribe === p.tribe || alliances & (1 << p.tribe))
        continue
      if (p.class === 2) {
        if (buildings.length < maximum) buildings.push(p)
      } else if (
        p.class === 1 &&
        !(p.flags2 & 0x10000) &&
        ![1, 8].includes(p.model) &&
        p.state !== 23 &&
        !(p.flags4 & 0x1000) &&
        !spyDisguisedFrom(p, tribe) &&
        people.length < maximum
      )
        people.push(p)
    }
  }
  visit(center)
  const count = (radius + 1) * radius * 4 - 1
  for (let index = 0; index < count; index++) {
    visit(spiralCell(center, index, 0))
    if (people.length >= maximum && buildings.length >= maximum) break
  }
  return { people, buildings }
}

export interface DefenseInput {
  targetAlive: () => boolean
  cast: (center: number) => void
  select: (model: number, count: number, center: number) => number
  dispatch: (center: number) => void
  monitor: (task: ComputerTask) => boolean
  cleanup: () => void
}

//0x4c5f70. Real selection/order/monitor effects remain synchronous caller inputs.
// Cancellation is intentionally ignored beforephase3 while the target is valid.
export function stepDefenseTask(ai: ComputerQueue, index: number, input: DefenseInput) {
  const task = ai.tasks[index],
    defense = task.defense!
  if (task.phase < 3 ? !input.targetAlive() : !!(task.flags & 2)) task.phase = 7
  if (task.phase === 0) {
    defense.center = task.target & 65535
    defense.recenter = true
    defense.fallback = true
    task.phase = 2
  }
  if (task.phase === 2) {
    if (!acquireSelection(ai, index)) return
    task.selected = 0
    input.cast(defense.center)
    defense.cursor = 0
    task.phase = 3
    return
  }
  if (task.phase === 3) {
    let requested = 0,
      model = -1
    while (defense.cursor < 5) {
      const category = defense.cursor++
      if (category < 4) {
        requested = task.quotas[category] & 65535
        model = [2, 3, 6, 4][category]
      }
      if (requested) break
    }
    if (requested) {
      const selected = input.select(model, Math.min(100, requested), defense.center)
      task.selected = (task.selected + selected) | 0
      const category = [2, 3, 6, 4].indexOf(model)
      // The shipped executable adds, rather than subtracts, Firewarrior count.
      task.quotas[category] = (task.quotas[category] + (model === 6 ? selected : -selected)) & 65535
    }
    if (defense.cursor !== 5) return
    if (defense.fallback) {
      const remaining = task.quotas.reduce((sum, count) => sum + (count & 65535), 0)
      if (remaining) {
        defense.cursor = 0
        task.quotas[0] = task.quotas[3] = 0
        if (!task.quotas[2]) {
          task.quotas[2] = remaining & 65535
          return
        }
        if (!task.quotas[1]) {
          task.quotas[1] = remaining & 65535
          return
        }
      }
      defense.fallback = false
    }
    if (!task.selected) {
      releaseSelection(ai, index)
      task.phase = 7
    } else {
      task.phase = 4
      ai.commandDelay = 20
    }
    return
  }
  if (task.phase === 4) {
    task.phase = 5
    return
  }
  if (task.phase === 5) {
    input.dispatch(defense.center)
    task.phase = 6
    return
  }
  if (task.phase === 6) {
    if (input.monitor(task)) task.phase = 7
    return
  }
  if (task.phase === 7) {
    input.cleanup()
    task.flags &= ~3
  }
}
