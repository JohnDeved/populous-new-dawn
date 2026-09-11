import { createWorld, type World } from './model.ts'

// The simulation owns its mutable world. React subscribes to published revisions
// instead of treating that world as immutable component state.
export function createGameStore() {
  let world = createWorld(),
    checkpoint: World | null = null,
    revision = 0
  const listeners = new Set<() => void>()
  const update = () => {
    revision++
    for (const listener of listeners) listener()
  }
  return {
    getWorld: () => world,
    getSnapshot: () => revision,
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    update,
    change: (action: (world: World) => void) => {
      action(world)
      update()
    },
    hasCheckpoint: () => !!checkpoint,
    saveCheckpoint: () => {
      checkpoint = structuredClone(world)
      update()
    },
    loadCheckpoint: () => {
      if (!checkpoint) return false
      world = structuredClone(checkpoint)
      update()
      return true
    },
    restart: () => {
      world = createWorld()
      update()
    },
  }
}
