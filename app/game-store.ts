import { routeNoticeCell } from './route-notice.ts'
import { validSceneryProvenance } from './scenery-provenance.ts'
import { validAngelPresentation } from './angel-presentation.ts'
import { validTornadoAppearance } from './tornado-appearance.ts'
import { applySpellTestCheat, CHEAT_SAVE_NOTICE, type SpellTestCheat } from './spell-test-cheats.ts'
import { worldEnvironment } from './world-environment.ts'
import { restoreCapacityPolicy } from './capacity-policy.ts'
import { rebuildSecondaryLists } from './secondary-effects.ts'
import { restoreSecondaryEffects } from './hut-smoke-runtime.ts'
import { createWorld, syncLandscapeObjects, type World } from './model.ts'
import { tutorialLevel } from './mission-data.ts'
import {
  applyCampaignEvent,
  campaignCompleted,
  campaignSelectable,
  joinCampaignProgress,
  mergeCampaignProfile,
  readCampaignProfile,
  supportedCampaignMission,
  type CampaignEvent,
} from './campaign-profile.ts'
import {
  transitionNativeCampaign,
  type NativeCampaignMission,
} from './native-campaign-progression.ts'
import { initializeVaultKnowledge } from './vault-appearance.ts'
import { discardInvalidResident } from './building-resident.ts'
import { initializeVaultKnowledgeGift } from './world-effects.ts'
import { createSharedAniblResource, type PresentationBinding } from './shared-anibl.ts'

import { CHECKPOINT_VERSION } from './checkpoint-format.ts'
export { CHECKPOINT_VERSION } from './checkpoint-format.ts'

const CHECKPOINT_DATABASE = 'populous-new-dawn',
  CHECKPOINT_STORE = 'checkpoints'
let checkpointDatabase: Promise<IDBDatabase | null> | null = null

export type CheckpointReadStatus =
  | 'idle'
  | 'pending'
  | 'read'
  | 'unavailable'
  | 'failed'
  | 'incompatible'

// Normalize current runtime ownership/presentation after cloning. Despite the
// established function name, this is not an older-save upgrader. Shipping store
// boundaries require the current envelope and scalable schema before calling it.
export function migrateCheckpoint(world: World) {
  // Normalize only the cloned optional presentation anchors. Keep unknown data
  // unknown instead of turning malformed saved integers into plausible map cells.
  if (routeNoticeCell(world.lastOrderCell) === undefined) delete world.lastOrderCell
  if (world.routeNotice && routeNoticeCell(world.routeNotice.cell) === undefined)
    delete world.routeNotice.cell
  restoreCapacityPolicy(world)
  for (const unit of world.units) discardInvalidResident(world, unit)
  restoreSecondaryEffects(world)
  for (const shrine of world.shrines)
    if (
      !shrine.reward &&
      shrine.kind !== 'bridgeEffect' &&
      shrine.kind !== 'erosionEffect' &&
      shrine.kind !== 'flattenEffect' &&
      shrine.kind !== 'volcanoEffect' &&
      shrine.kind !== 'linkedEffects' &&
      shrine.kind !== 'boat' &&
      shrine.kind !== 'inert' &&
      !(shrine.kind === 'angel' && shrine.angelTarget)
    )
      shrine.reward = shrine.kind === 'vault' ? 'camp' : shrine.kind
  for (const unit of world.units)
    for (const person of [
      unit.native,
      unit.flight,
      unit.entry?.person,
      unit.builder?.person,
      unit.fight?.motion,
      unit.resident?.person,
    ])
      if (person?.class === 1 && person.model >= 2 && person.model <= 7)
        person.flags3 = (person.flags3 | 0x40000) >>> 0
  syncLandscapeObjects(world)
  for (const shrine of world.shrines) initializeVaultKnowledge(shrine, world.outcome.level)
  for (const gift of world.gifts) initializeVaultKnowledgeGift(world, gift)
  // Normalization must not orphan authoritative current-format pool ownership.
  restoreCapacityPolicy(world)
  return world
}

function requireCurrentCheckpoint(world: World) {
  if (world.capacityPolicy?.version !== 1 || world.capacityPolicy.mode !== 'scalable')
    throw new RangeError('Checkpoint is incompatible with this development version')
  restoreCapacityPolicy(world)
  if (
    !validSceneryProvenance(world) ||
    !(world.objectCells.heads instanceof Float64Array) ||
    !world.secondaryEffects ||
    !world.worshipAcquisition ||
    !Array.isArray(world.campaignAIs) ||
    !Array.isArray(world.vehicles) ||
    !Array.isArray(world.levelStart) ||
    !Array.isArray(world.spellScans) ||
    !Array.isArray(world.respawns) ||
    !Array.isArray(world.respawnPoints) ||
    !Number.isInteger(world.outcome.level) ||
    world.effects.some(
      effect =>
        (effect.tornado && !effect.tornado.particles.every(validTornadoAppearance)) ||
        (effect.angel &&
          'presentation' in effect.angel &&
          !validAngelPresentation(effect.angel.presentation))
    )
  )
    throw new RangeError('Checkpoint is incompatible with this development version')
}

function openCheckpointDatabase() {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null)
  if (checkpointDatabase) return checkpointDatabase
  const pending = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(CHECKPOINT_DATABASE, 1)
    request.addEventListener('upgradeneeded', () =>
      request.result.createObjectStore(CHECKPOINT_STORE)
    )
    request.addEventListener('success', () => resolve(request.result))
    request.addEventListener('error', () => reject(request.error))
  })
  checkpointDatabase = pending
  // A transient open failure must not disable persistence for the whole session.
  // Keep the original rejection for callers and only release this attempt's cache.
  void pending.catch(() => {
    if (checkpointDatabase === pending) checkpointDatabase = null
  })
  return pending
}

async function readStoredState() {
  const database = await openCheckpointDatabase()
  if (!database) return null
  return new Promise<{ checkpoint: World | null; profile: unknown; incompatible: boolean }>(
    (resolve, reject) => {
      const transaction = database.transaction(CHECKPOINT_STORE),
        store = transaction.objectStore(CHECKPOINT_STORE),
        checkpointRequest = store.get('latest'),
        profileRequest = store.get('profile')
      transaction.addEventListener('complete', () => {
        const saved = checkpointRequest.result as { version?: number; world?: World } | undefined,
          profile = profileRequest.result
        resolve({
          checkpoint:
            saved?.world &&
            saved.version === CHECKPOINT_VERSION &&
            saved.world.capacityPolicy?.version === 1 &&
            saved.world.capacityPolicy.mode === 'scalable'
              ? saved.world
              : null,
          incompatible:
            saved !== undefined &&
            !(
              saved?.version === CHECKPOINT_VERSION &&
              saved.world?.capacityPolicy?.version === 1 &&
              saved.world.capacityPolicy.mode === 'scalable'
            ),
          profile,
        })
      })
      const fail = () => reject(transaction.error)
      transaction.addEventListener('error', fail)
      transaction.addEventListener('abort', fail)
    }
  )
}

async function writeStoredValue(key: 'latest', value: unknown) {
  const database = await openCheckpointDatabase()
  if (!database) return false
  return new Promise<boolean>((resolve, reject) => {
    const transaction = database.transaction(CHECKPOINT_STORE, 'readwrite')
    transaction.objectStore(CHECKPOINT_STORE).put(value, key)
    transaction.addEventListener('complete', () => resolve(true))
    const fail = () => reject(transaction.error)
    transaction.addEventListener('error', fail)
    transaction.addEventListener('abort', fail)
  })
}

async function writeCampaignProgress(
  local: ReturnType<typeof readCampaignProfile>['progress'],
  events: readonly CampaignEvent[]
) {
  const database = await openCheckpointDatabase()
  if (!database) return null
  return new Promise<ReturnType<typeof mergeCampaignProfile>>((resolve, reject) => {
    const transaction = database.transaction(CHECKPOINT_STORE, 'readwrite'),
      store = transaction.objectStore(CHECKPOINT_STORE),
      request = store.get('profile')
    let merged: ReturnType<typeof mergeCampaignProfile> = null
    request.addEventListener('success', () => {
      merged = mergeCampaignProfile(request.result, local, events)
      if (merged) store.put(merged.profile, 'profile')
    })
    transaction.addEventListener('complete', () => resolve(merged))
    const fail = () => reject(transaction.error)
    transaction.addEventListener('error', fail)
    transaction.addEventListener('abort', fail)
  })
}

// The simulation owns its mutable world. React subscribes to published revisions
// instead of treating that world as immutable component state.
export function createGameStore() {
  let cheatsUsed = false
  let launch: 'campaign' | 'debug' | 'tutorial' | 'checkpoint' = 'campaign'
  let earnedCompletion = false
  let progress = readCampaignProfile(undefined).progress
  let selected: NativeCampaignMission = 1,
    anchor: NativeCampaignMission = 1
  let selectionRevision = 0,
    anchorRevision = 0
  const pending: CampaignEvent[] = []
  let writing = false
  let checkpointReadStatus: CheckpointReadStatus = 'idle'
  let checkpointRestore: Promise<boolean> | null = null
  let committedCheckpointRevision = 0
  let world = createWorld(1, 'scalable'),
    checkpoint: World | null = null,
    observedCompletion = world.outcome.completedLevel,
    revision = 0
  const presentation = createSharedAniblResource()
  presentation.transition(worldEnvironment(world).landscape)
  let presentationToken: symbol | null = null
  const listeners = new Set<() => void>()
  const persistProgress = async () => {
    if (writing || !pending.length) return
    writing = true
    const events = [...pending],
      selection = selectionRevision,
      anchorVersion = anchorRevision
    let committed = false
    try {
      const merged = await writeCampaignProgress(progress, events)
      if (merged) {
        committed = true
        pending.splice(0, events.length)
        progress = joinCampaignProgress(progress, merged.progress)
        if (anchorRevision === anchorVersion && merged.recommendation !== null) {
          anchor = merged.recommendation
          if (selectionRevision === selection) selected = anchor
        }
        update()
      }
    } catch {
      // Keep local earned events through failed reads/aborts. A later authorized
      // progress event retries them; restore itself never writes damaged storage.
    } finally {
      writing = false
      if (committed && pending.length) void persistProgress()
    }
  }
  const recordProgress = (event: CampaignEvent) => {
    const next = applyCampaignEvent(progress, event)
    progress = next.progress
    pending.push(event)
    if (next.recommendation !== null) {
      anchorRevision++
      anchor = next.recommendation
      selected = anchor
    }
    void persistProgress()
  }
  const update = () => {
    if (world.outcome.completedLevel !== observedCompletion) {
      observedCompletion = world.outcome.completedLevel
      const mission = observedCompletion === null ? null : observedCompletion + 1
      if (
        !cheatsUsed &&
        launch !== 'debug' &&
        launch !== 'tutorial' &&
        mission === world.outcome.level &&
        supportedCampaignMission(mission)
      ) {
        earnedCompletion = true
        recordProgress({ kind: 'completion', mission: mission as NativeCampaignMission })
      }
    }
    revision++
    for (const listener of listeners) listener()
  }
  const replaceWorld = (next: World, provenance: typeof launch, retainResource = false) => {
    // Preparation has already succeeded. Commit both owners before publication;
    // old Scene callbacks lose authority even when Restart retains the resource.
    presentation.transition(worldEnvironment(next).landscape, retainResource)
    world = next
    cheatsUsed = false
    earnedCompletion =
      provenance === 'checkpoint' &&
      next.status === 'won' &&
      supportedCampaignMission(next.outcome.level) &&
      next.outcome.completedLevel === next.outcome.level - 1
    launch = provenance
    presentationToken = null
    observedCompletion = world.outcome.completedLevel
    update()
  }
  return {
    getWorld: () => world,
    hasUsedCheats: () => cheatsUsed,
    isDebugLaunch: () => launch === 'debug',
    canSave: () => !cheatsUsed && launch !== 'debug',
    getCampaignSelection: () => ({
      selected,
      progressionMission: anchor,
      available: campaignSelectable(progress),
    }),
    selectCampaignMission: (mission: number) => {
      if (!campaignSelectable(progress).includes(mission as NativeCampaignMission)) return false
      selected = mission as NativeCampaignMission
      selectionRevision++
      update()
      return true
    },
    enterCampaignSelector: (resultWorld?: World) => {
      if (resultWorld && resultWorld !== world) return false
      selectionRevision++
      const victory = !!resultWorld && earnedCompletion && !cheatsUsed && launch !== 'debug'
      if (victory && !(progress.flags[world.outcome.level - 1] & 1)) {
        // A clean current-format terminal checkpoint may outlive a failed profile
        // write. Restore/Load never write; its later result exit replays only the
        // matching earned completion before applying the victory transition.
        recordProgress({
          kind: 'completion',
          mission: world.outcome.level as NativeCampaignMission,
        })
      }
      recordProgress(
        victory
          ? { kind: 'victory', mission: world.outcome.level as NativeCampaignMission }
          : { kind: 'return' }
      )
      update()
      return true
    },
    applySpellTestCheat: (action: SpellTestCheat) => {
      if (!applySpellTestCheat(world, action)) return false
      cheatsUsed = true
      update()
      return true
    },
    getPresentationSnapshot: presentation.snapshot,
    bindPresentation: (boundWorld: World): PresentationBinding => {
      const token = Symbol()
      let released = false
      if (boundWorld === world) presentationToken = token
      const isCurrent = () => !released && presentationToken === token && boundWorld === world
      return {
        isCurrent,
        snapshot: () => (isCurrent() ? presentation.snapshot() : null),
        advance: () => {
          if (isCurrent()) presentation.advance()
        },
        release: () => {
          released = true
          if (presentationToken === token) presentationToken = null
        },
      }
    },
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
    getCheckpointReadStatus: () => checkpointReadStatus,
    getCompletedMissions: () => campaignCompleted(progress),
    restoreCheckpoint: () => {
      if (checkpointRestore) return checkpointRestore
      checkpointReadStatus = 'pending'
      const readRevision = committedCheckpointRevision
      checkpointRestore = (async () => {
        try {
          const saved = await readStoredState()
          if (saved) {
            if (!checkpoint && saved.checkpoint) {
              try {
                requireCurrentCheckpoint(saved.checkpoint)
                checkpoint = migrateCheckpoint(structuredClone(saved.checkpoint))
              } catch {
                saved.incompatible = true
                // Invalid saves do not suppress the independent campaign profile.
              }
            }
            progress = joinCampaignProgress(progress, readCampaignProfile(saved.profile).progress)
            if (selectionRevision === 0) {
              anchor =
                transitionNativeCampaign(progress.flags, { kind: 'return' }).recommendation ??
                anchor
              selected = anchor
            }
          }
          // A successful explicit Save supersedes any older storage-read snapshot.
          if (readRevision === committedCheckpointRevision)
            checkpointReadStatus = saved
              ? saved.incompatible
                ? 'incompatible'
                : 'read'
              : 'unavailable'
        } catch {
          // Browser storage is optional; retain any in-session checkpoint.
          if (readRevision === committedCheckpointRevision) checkpointReadStatus = 'failed'
        } finally {
          checkpointRestore = null
          update()
        }
        return !!checkpoint
      })()
      update()
      return checkpointRestore
    },
    saveCheckpoint: async (paused = world.paused) => {
      if (cheatsUsed || launch === 'debug') throw new Error(CHEAT_SAVE_NOTICE)
      requireCurrentCheckpoint(world)
      rebuildSecondaryLists(world.secondaryEffects)
      const saved = structuredClone(world)
      saved.paused = paused
      checkpoint = saved
      update()
      try {
        const written = await writeStoredValue('latest', {
          version: CHECKPOINT_VERSION,
          world: saved,
        })
        if (written) {
          committedCheckpointRevision++
          checkpointReadStatus = 'read'
          update()
        }
        return written
      } catch {
        return false
      }
    },
    loadCheckpoint: () => {
      if (!checkpoint) return false
      requireCurrentCheckpoint(checkpoint)
      replaceWorld(migrateCheckpoint(structuredClone(checkpoint)), 'checkpoint')
      return true
    },
    restart: () => {
      const retainResource = !(world.land.landFlags & 8)
      replaceWorld(createWorld(world.outcome.level, 'scalable'), launch, retainResource)
    },
    startMission: (mission: number) => {
      if (
        !supportedCampaignMission(mission) ||
        !campaignSelectable(progress).includes(mission as NativeCampaignMission)
      )
        return false
      replaceWorld(createWorld(mission, 'scalable'), 'campaign')
      return true
    },
    startDebugMission: (mission: number) => {
      if (!supportedCampaignMission(mission)) return false
      replaceWorld(createWorld(mission, 'scalable'), 'debug')
      return true
    },
    startTutorial: () => {
      replaceWorld(createWorld(tutorialLevel, 'scalable'), 'tutorial')
      return true
    },
  }
}
