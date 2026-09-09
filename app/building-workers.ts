import rules from './original-rules.json' with { type: 'json' }

// 0x4b9cc0: preserve existing registration, otherwise occupy the first free slot.
// The caller sizes the slots from the original building descriptor.
export function assignBuilder(slots: number[], id: number) {
  if (slots.includes(id)) return true
  const empty = slots.indexOf(0)
  if (empty === -1) return false
  slots[empty] = id
  return true
}

// 0x4ba1b0 retains slot order and holes while removing stale assignments.
export function pruneBuilders(slots: number[], eligible: (id: number) => boolean) {
  slots.forEach((id, i) => {
    if (id && !eligible(id)) slots[i] = 0
  })
}

export const BuilderTask = {
  Approach: 1,
  Work: 2,
  ClearScenery: 3,
  ClearPeople: 4,
  Fetch: 7,
  Level: 8,
  Leave: 9,
} as const
export interface Builder {
  task: number
  busy: number
  phase: number
  restart: boolean
}
interface ConstructionPlan {
  model: number
  counter: number
  work: number
  repairDelay: number
  burning: boolean
}

function setTask(worker: Builder, task: number) {
  worker.task = task
  worker.restart = true
}

export interface UnbuiltPlan {
  model: number
  counter: number
  dirty: boolean
  revalidate: boolean
  timeout: number
}
export interface SiteObstacles {
  timber: boolean
  grade: boolean
  scenery: number
  friendly: number
  enemies: number
  vehicles: number
  crew: number
  wooden: boolean
}

// 0x4b8470 after registration pruning. The caller owns footprint queries,
// allocation/removal and the assignment-entry flag after allocation attempts.
export function stepUnbuiltPlan(
  plan: UnbuiltPlan,
  workers: Builder[],
  validate: () => boolean,
  scan: () => SiteObstacles
): 'allocate' | 'remove' | null {
  if (plan.revalidate) {
    plan.revalidate = false
    if (!validate()) return 'remove'
  }
  const count = workers.length,
    minimum = rules.buildingMinWorkers[plan.model]
  if (!count) {
    if (count < rules.buildingTimeoutWorkers[plan.model] && !(plan.counter & 127)) {
      plan.timeout = (plan.timeout + 1) & 255
      if (plan.timeout > 50) return 'remove'
    }
    return null
  }
  const ready = workers.filter(w => w.task === BuilderTask.Work && !w.busy)
  if (count < minimum) {
    if (ready.length < count)
      for (const worker of workers)
        if (worker.task !== BuilderTask.Work && worker.task !== BuilderTask.Approach)
          setTask(worker, BuilderTask.Work)
    return null
  }
  const leaving = workers.filter(w => w.task === BuilderTask.Leave).length
  if (plan.counter & 15 || !(plan.dirty || ready.length || count <= leaving + ready.length))
    return null
  plan.dirty = false
  const obstacles = scan()
  const needed = [
    Number(obstacles.timber),
    Number(obstacles.grade && plan.model !== 10),
    obstacles.scenery,
    obstacles.friendly,
    obstacles.enemies,
    obstacles.vehicles,
    obstacles.crew,
  ].map(n => n & 255)
  if (needed.every(n => !n) && workers.some(w => w.task === BuilderTask.Leave && w.phase === 6)) {
    for (const worker of workers) {
      setTask(worker, BuilderTask.Work)
      worker.phase = 21
    }
    return 'allocate'
  }
  const restartWork = leaving === count && !needed[6]
  const tasks = Array<number>(10).fill(0)
  for (const w of workers) if (w.task !== BuilderTask.Work || !w.busy) tasks[w.task]++
  let assigned = 0
  for (let i = 0; i < 6 && assigned < ready.length; i++) {
    const task = rules.buildingPreparationTasks[i]
    let limit = 1
    if (i === 1) limit = rules.buildingLevelWorkers[plan.model]
    else if (i === 2 && obstacles.wooden) limit = rules.buildingLevelWorkers[plan.model] >> 1
    while (needed[i] && tasks[task] < limit && assigned < ready.length) {
      setTask(ready[assigned++], task)
      tasks[task]++
    }
  }
  if (leaving + ready.length - assigned === count && needed[6])
    for (const worker of workers)
      if (worker.task !== BuilderTask.Leave) setTask(worker, BuilderTask.Leave)
  if (restartWork) setTask(workers[0], BuilderTask.Work)
  return null
}

// 0x4b8bb0, after registration pruning. Workers retain their plan-slot order.
// Movement, fire reactions, smoke cleanup and plan removal belong to the caller.
export function stepConstructionCrew<T extends Builder>(
  plan: ConstructionPlan,
  workers: T[],
  effects: { evacuate: (worker: T) => void; resume: () => void }
) {
  const missing = rules.buildingLife[plan.model] - plan.work,
    minimum = rules.buildingMinWorkers[plan.model],
    scheduled = !(plan.counter & 15)
  if ((plan.repairDelay & 65535) > 1) plan.repairDelay = ((plan.repairDelay - 1) << 16) >> 16
  if (scheduled && plan.burning) {
    workers.forEach(effects.evacuate)
    workers = []
  }
  const ready = workers.filter(w => w.task === BuilderTask.Work && !w.busy)
  if (workers.length < minimum) {
    if (missing !== 0 && ready.length < workers.length)
      workers.forEach(w => setTask(w, BuilderTask.Work))
  } else if (workers.length) {
    if (!scheduled) return false
    if (plan.repairDelay !== 0) {
      plan.repairDelay = ((plan.repairDelay - 1) << 16) >> 16
      if (plan.repairDelay === 0) effects.resume()
    }
    if (plan.repairDelay !== 0) return false
    if (missing > 0) {
      const fetching = workers.filter(w => w.task === BuilderTask.Fetch).length,
        target = Math.max(1, workers.length >> 1),
        count = Math.min(missing, target - fetching)
      ready.slice(0, Math.max(0, count)).forEach(w => setTask(w, BuilderTask.Fetch))
      return false
    }
  }
  if (missing > 0) return false
  let finished = true
  for (const worker of workers) {
    if (worker.task === BuilderTask.Approach) continue
    if (worker.task === BuilderTask.Leave) finished &&= worker.phase === 6
    else {
      setTask(worker, BuilderTask.Leave)
      finished = false
    }
  }
  return finished
}
