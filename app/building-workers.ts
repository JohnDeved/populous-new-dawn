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

export const BuilderTask = { Approach: 1, Work: 2, Fetch: 7, Leave: 9 } as const
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
