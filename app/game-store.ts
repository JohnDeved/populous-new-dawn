import { createGift, createWorld, type Gift, type World } from './model.ts'

const CHECKPOINT_DATABASE = 'populous-new-dawn',
  CHECKPOINT_STORE = 'checkpoints',
  CHECKPOINT_VERSION = 1
let checkpointDatabase: Promise<IDBDatabase | null> | null = null

type LegacyGift = { x: number; z: number; kind: 'vault' | 'lightning' | 'bridge'; remaining: number }

export function migrateCheckpoint(world: World) {
  world.shots.shield ??= 0
  world.giftCounts.shield ??= 0
  const gifts = world.gifts as unknown as (Gift | LegacyGift)[]
  if (!gifts.some(gift => gift.kind !== 'gift')) return world
  world.gifts = []
  for (const saved of gifts) {
    if (saved.kind === 'gift') {
      world.gifts.push(saved)
      continue
    }
    const gift = createGift(world, saved.kind, saved)
    gift.remaining = saved.remaining
    gift.phase = Math.max(0, Math.min(6, saved.remaining - 76))
  }
  return world
}

function openCheckpointDatabase() {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null)
  return (checkpointDatabase ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(CHECKPOINT_DATABASE, 1)
    request.addEventListener('upgradeneeded', () =>
      request.result.createObjectStore(CHECKPOINT_STORE)
    )
    request.addEventListener('success', () => resolve(request.result))
    request.addEventListener('error', () => reject(request.error))
  }))
}

async function readStoredCheckpoint() {
  const database = await openCheckpointDatabase()
  if (!database) return null
  return new Promise<World | null>((resolve, reject) => {
    const transaction = database.transaction(CHECKPOINT_STORE),
      request = transaction.objectStore(CHECKPOINT_STORE).get('latest')
    transaction.addEventListener('complete', () => {
      const saved = request.result as { version?: number; world?: World } | undefined
      resolve(saved?.version === CHECKPOINT_VERSION && saved.world ? saved.world : null)
    })
    const fail = () => reject(transaction.error)
    transaction.addEventListener('error', fail)
    transaction.addEventListener('abort', fail)
  })
}

async function writeStoredCheckpoint(world: World) {
  const database = await openCheckpointDatabase()
  if (!database) return false
  return new Promise<boolean>((resolve, reject) => {
    const transaction = database.transaction(CHECKPOINT_STORE, 'readwrite')
    transaction.objectStore(CHECKPOINT_STORE).put({ version: CHECKPOINT_VERSION, world }, 'latest')
    transaction.addEventListener('complete', () => resolve(true))
    const fail = () => reject(transaction.error)
    transaction.addEventListener('error', fail)
    transaction.addEventListener('abort', fail)
  })
}

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
    restoreCheckpoint: async () => {
      try {
        const saved = await readStoredCheckpoint()
        if (!checkpoint && saved) {
          checkpoint = migrateCheckpoint(structuredClone(saved))
          update()
        }
      } catch {
        // Browser storage is optional; retain any in-session checkpoint.
      }
      return !!checkpoint
    },
    saveCheckpoint: async () => {
      const saved = structuredClone(world)
      checkpoint = saved
      update()
      try {
        return await writeStoredCheckpoint(saved)
      } catch {
        return false
      }
    },
    loadCheckpoint: () => {
      if (!checkpoint) return false
      world = migrateCheckpoint(structuredClone(checkpoint))
      update()
      return true
    },
    restart: () => {
      world = createWorld()
      update()
    },
  }
}
