import { campaignCommand, createGift, createWorld, type Gift, type World } from './model.ts'

const CHECKPOINT_DATABASE = 'populous-new-dawn',
  CHECKPOINT_STORE = 'checkpoints',
  CHECKPOINT_VERSION = 1
let checkpointDatabase: Promise<IDBDatabase | null> | null = null

type LegacyGift = {
  x: number
  z: number
  kind: 'vault' | 'lightning' | 'bridge'
  remaining: number
}

export function migrateCheckpoint(world: World) {
  world.outcome.level ??= 1
  world.unlockedTower ??= false
  world.unlockedTemple ??= false
  const oldMissionTwo = world.outcome.level === 2 && !Object.hasOwn(world.ai, 'coordinateLatch')
  world.ai.coordinateLatch ??= 0
  if (oldMissionTwo) {
    world.manaTribes[3] = structuredClone(world.manaTribes[1])
    world.castingTribes[3] = structuredClone(world.castingTribes[1])
    world.manaWorld.spells[3] = structuredClone(world.manaWorld.spells[1])
    world.spellCasts[3] = [...world.spellCasts[1]]
    world.killCredits[3] = [...world.killCredits[1]]
    for (const row of world.killCredits) row[3] = row[1]
    world.tribeCount = 4
    world.manaTribes[1].active = false
    Object.assign(world.manaTribes[3], { id: 3, spellOwner: 3, active: true })
    world.ai.pendingCommands = world.ai.pendingCommands.filter(command => {
      if (![1069, 1097].includes(command.opcode)) return true
      campaignCommand(world, command.opcode, command.args)
      return false
    })
  }
  if (world.outcome.level === 2) {
    world.killCredits[0][3] = Math.max(world.killCredits[0][3], world.killCredits[0][1])
    world.killCredits[3][0] = Math.max(world.killCredits[3][0], world.killCredits[1][0])
  }
  for (const shrine of world.shrines)
    if (!shrine.reward && shrine.kind !== 'bridgeEffect' && shrine.kind !== 'erosionEffect')
      shrine.reward = shrine.kind === 'vault' ? 'camp' : shrine.kind
  for (const gift of world.gifts) if ((gift.reward as string) === 'vault') gift.reward = 'camp'
  world.shots.convertWild ??= 0
  world.giftCounts.convertWild ??= 0
  world.shots.hypnotise ??= 0
  world.giftCounts.hypnotise ??= 0
  world.shots.ghostArmy ??= 0
  world.giftCounts.ghostArmy ??= 0
  world.shots.shield ??= 0
  world.giftCounts.shield ??= 0
  world.shots.swarm ??= 0
  world.giftCounts.swarm ??= 0
  world.shots.invisibility ??= 0
  world.giftCounts.invisibility ??= 0
  world.shots.volcano ??= 0
  world.giftCounts.volcano ??= 0
  const gifts = world.gifts as unknown as (Gift | LegacyGift)[]
  if (!gifts.some(gift => gift.kind !== 'gift')) return world
  world.gifts = []
  for (const saved of gifts) {
    if (saved.kind === 'gift') {
      world.gifts.push(saved)
      continue
    }
    const gift = createGift(world, saved.kind === 'vault' ? 'camp' : saved.kind, saved)
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
      world = createWorld(world.outcome.level)
      update()
    },
    startMission: (mission: number) => {
      world = createWorld(mission)
      update()
    },
  }
}
