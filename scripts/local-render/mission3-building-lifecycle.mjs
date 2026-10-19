import { installMission3BuildingScreenWitness } from './mission3-building-screen-witness.mjs'
import { templeArt, templeSpriteMaterial, templeTileOffset } from '../../app/temple-art.ts'
import {
  buildingDrawPoint,
  interpolateWorshipPoint,
  interpolateBuildingSubmissions,
} from '../../app/worship-acquisition-layout.ts'
import { collectBuildingAcquisitionTriangles } from '../../app/building-acquisition-triangles.ts'

// start only schedules RAF. Attach after its real successful return, within the
// same synchronous stack, before that first callback can advance the new World.
export function armBuildingSceneStart({ prototype, store, expectedWorld, sceneRef, attach }) {
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'start'),
    original = prototype.start
  if (typeof original !== 'function') throw new Error('GameScene.start unavailable')
  const evidence = {
    calls: 0,
    result: null,
    originalThrew: false,
    attached: false,
    restored: false,
    errors: [],
  }
  const error = value => evidence.errors.push(String(value?.stack ?? value))
  const close = () => {
    if (evidence.restored) return evidence
    if (prototype.start !== wrapped) throw new Error('Scene start observation ownership changed')
    if (descriptor) Object.defineProperty(prototype, 'start', descriptor)
    else delete prototype.start
    evidence.restored = true
    return evidence
  }
  function wrapped(...args) {
    let result,
      failed = false,
      failure
    evidence.calls++
    try {
      result = original.apply(this, args)
      evidence.result = result
    } catch (value) {
      failed = true
      failure = value
      evidence.originalThrew = true
      error(value)
    }
    try {
      if (!failed) {
        if (result !== true) throw new Error('Loaded scene did not start')
        const world = expectedWorld(),
          ref = sceneRef(this)
        if (!world || this.world !== world || store.getWorld() !== world || ref?.current !== this)
          throw new Error('Loaded Scene/World/store reference mismatch')
        attach(this, ref, store)
        evidence.attached = true
      }
    } catch (value) {
      error(value)
    } finally {
      try {
        close()
      } catch (value) {
        error(value)
      }
    }
    if (failed) throw failure
    return result
  }
  prototype.start = wrapped
  return { evidence, close }
}

function currentSceneRef(scene) {
  const main = document.querySelector('main')
  let fiber = main?.[Object.keys(main).find(key => key.startsWith('__reactFiber'))]
  for (; fiber; fiber = fiber.return)
    for (let hook = fiber.memoizedState; hook; hook = hook.next)
      if (hook.memoizedState?.current === scene) return hook.memoizedState
  return null
}

export function installM3Screen(shamanId, birth = null) {
  return installMission3BuildingScreenWitness({
    shamanId,
    birth,
    templeArt,
    templeSpriteMaterial,
    templeTileOffset,
    mapDraw(command, current, width, height, previous, fraction, resource) {
      const anchor = interpolateWorshipPoint(
        command.anchor,
        previous?.giftId === command.giftId && previous.geometry === command.geometry
          ? previous.anchor
          : undefined,
        fraction
      )
      const submissions = interpolateBuildingSubmissions(command, previous, fraction).map(
        submission => ({
          ...submission,
          projected: submission.projected.map(([x, y]) => {
            const point = buildingDrawPoint(
              { x, y },
              command.geometry,
              current,
              submission.flight,
              anchor
            )
            return [point.x, point.y]
          }),
        })
      )
      return collectBuildingAcquisitionTriangles(
        { whole: command.whole, submissions },
        { width, height, model: 95, templeTile: resource.tile }
      )
    },
  })
}

export function installM3CheckpointState() {
  window.m3CheckpointState = world => {
    const vault = world.shrines.find(
      head => head.kind === 'vault' && head.reward === 'temple' && head.x === -37 && head.z === -133
    )
    if (world.outcome.level !== 3 || !vault) throw new Error('Authored M3 checkpoint required')
    return structuredClone({
      level: 3,
      turn: world.turn,
      time: world.time,
      paused: world.paused,
      temple: world.unlockedTemple,
      stats: world.stats,
      landFlags: world.land.landFlags,
      vault: { id: vault.id, active: vault.active, uses: vault.uses },
      gifts: world.gifts.filter(gift => gift.buildingAcquisition?.mission === 3),
      acquisition: world.worshipAcquisition,
      cosmeticRandom: world.cosmeticRandom,
      actors: world.units
        .filter(unit => unit.team === 'blue')
        .map(unit => ({ id: unit.id, kind: unit.kind, hp: unit.hp, x: unit.x, z: unit.z })),
    })
  }
}

export function armM3Save() {
  const button = [...document.querySelectorAll('button')].find(
    button => button.textContent.trim() === 'Save checkpoint'
  )
  if (!button?.isConnected || button.disabled || window.finishM3Save)
    throw new Error('Public Save unavailable or already observed')
  const evidence = { snapshot: null, resource: null, trusted: false, errors: [] }
  const capture = event => {
    try {
      if (!event.isTrusted || (event.target !== button && !button.contains(event.target)))
        throw new Error('Trusted public Save required')
      evidence.trusted = true
      evidence.snapshot = window.m3CheckpointState(window.testStore.getWorld())
      evidence.resource = structuredClone(window.testStore.getPresentationSnapshot())
    } catch (error) {
      evidence.errors.push(String(error))
    }
  }
  button.addEventListener('click', capture, { capture: true, once: true })
  window.finishM3Save = () => {
    if (window.finishM3Save !== close) throw new Error('Save observer ownership changed')
    button.removeEventListener('click', capture, true)
    delete window.finishM3Save
    return evidence
  }
  const close = window.finishM3Save
}

export async function readM3Committed() {
  if (!(await indexedDB.databases()).some(db => db.name === 'populous-new-dawn')) return null
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('populous-new-dawn')
    request.onupgradeneeded = () => {
      request.transaction.abort()
      reject(new Error('Missing checkpoint database'))
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  try {
    const record = await new Promise((resolve, reject) => {
      const transaction = db.transaction('checkpoints', 'readonly'),
        request = transaction.objectStore('checkpoints').get('latest')
      transaction.oncomplete = () => resolve(request.result)
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error ?? new Error('Checkpoint read aborted'))
    })
    return record
      ? { version: record.version, snapshot: window.m3CheckpointState(record.world) }
      : null
  } finally {
    db.close()
  }
}

// Same replacement subscription and early-start mechanism as PR274. Resource
// snapshots are observed separately: only World/UI state belongs to the save.
export async function prepareM3Replacement({ kind, shamanId, birth, startup = false }) {
  if (!['load', 'restart'].includes(kind) || window.m3Replacement)
    throw new Error('One declared replacement at a time')
  const { GameScene } = kind === 'load' ? await import('/app/scene.ts') : {}
  if (startup && kind !== 'load') throw new Error('Startup supports only public Load Game')
  const name = startup ? 'Load Game' : kind === 'load' ? 'Load checkpoint' : 'Restart world'
  const button = [...document.querySelectorAll('button')].find(
    button => button.textContent.trim() === name
  )
  if (!button?.isConnected || button.disabled) throw new Error(`Public ${name} unavailable`)
  // Same actual React-store discovery as PR274's startup Load witness.
  let store = window.testStore
  if (startup) {
    store = null
    const main = document.querySelector('main')
    let fiber = main?.[Object.keys(main).find(key => key.startsWith('__reactFiber'))]
    for (; fiber && !store; fiber = fiber.return)
      for (let hook = fiber.memoizedState; hook; hook = hook.next)
        if (hook.memoizedState?.getWorld && hook.memoizedState?.subscribe) {
          store = hook.memoizedState
          break
        }
  }
  if (!store) throw new Error('Store unavailable before public Load')
  const prior = store.getWorld()
  const evidence = {
    kind,
    startup,
    trusted: false,
    before: null,
    after: null,
    screen: null,
    start: null,
    errors: [],
  }
  let loaded = null,
    start
  const read = world => ({
    snapshot: window.m3CheckpointState(world),
    resource: structuredClone(store.getPresentationSnapshot()),
  })
  const unsubscribe = store.subscribe(() => {
    const next = store.getWorld()
    if (next === prior) return
    try {
      loaded = next
      evidence.after = read(next)
      if (kind === 'load') window.m3LoadedBoundary = { version: 1, world: structuredClone(next) }
    } catch (error) {
      evidence.errors.push(String(error))
    } finally {
      unsubscribe()
    }
  })
  const capture = event => {
    try {
      if (!event.isTrusted || (event.target !== button && !button.contains(event.target)))
        throw new Error(`Trusted public ${name} required`)
      evidence.trusted = true
      if (store.getWorld() !== prior) throw new Error('World replaced before trusted input')
      evidence.before = startup
        ? {
            snapshot: { level: prior.outcome.level, turn: prior.turn },
            resource: structuredClone(store.getPresentationSnapshot()),
          }
        : read(prior)
      if (window.m3BuildingScreen) evidence.screen = window.m3BuildingScreen.close()
      window.m3TempleRoute?.close()
    } catch (error) {
      evidence.errors.push(String(error))
    }
  }
  try {
    if (kind === 'load') {
      start = armBuildingSceneStart({
        prototype: GameScene.prototype,
        store,
        expectedWorld: () => loaded,
        sceneRef: currentSceneRef,
        attach(scene, ref, owner) {
          window.testSceneRef = ref
          window.testScene = scene
          window.testStore = owner
          installM3Screen(shamanId, birth)
        },
      })
      evidence.start = start.evidence
    }
    button.addEventListener('click', capture, { capture: true, once: true })
  } catch (error) {
    unsubscribe()
    start?.close()
    throw error
  }
  window.m3Replacement = {
    close() {
      const owned = window.m3Replacement === owner
      if (!owned) evidence.errors.push('Replacement observer ownership changed')
      // Preserve all boundary/PNG evidence even when one cleanup owner changed.
      // Each owned cleanup still gets its own attempt; never replace the foreign owner.
      for (const cleanup of [
        () => start?.close(),
        () => button.removeEventListener('click', capture, true),
        unsubscribe,
      ])
        try {
          cleanup()
        } catch (error) {
          evidence.errors.push(String(error?.stack ?? error))
        }
      if (owned) delete window.m3Replacement
      return evidence
    },
  }
  const owner = window.m3Replacement
}
