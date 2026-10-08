import { installMission1VaultCheckpointState, installMission1VaultLoadWitness } from './mission1-vault-checkpoint.mjs'
import { installMission1BuildingScreenWitness } from './mission1-building-screen-witness.mjs'

// start only schedules RAF. Attach after its real successful return, within the
// same synchronous stack, before that first callback can advance the new World.
export function armMission1BuildingSceneStart({ prototype, store, expectedWorld, sceneRef, attach }) {
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'start'), original = prototype.start
  if (typeof original !== 'function') throw Error('GameScene.start unavailable')
  const evidence = { calls: 0, result: null, originalThrew: false, attached: false, restored: false, errors: [] }
  const error = value => evidence.errors.push(String(value?.stack ?? value))
  const close = () => {
    if (evidence.restored) return evidence
    if (prototype.start !== wrapped) throw Error('Scene start observation ownership changed')
    if (descriptor) Object.defineProperty(prototype, 'start', descriptor)
    else delete prototype.start
    evidence.restored = true
    return evidence
  }
  function wrapped(...args) {
    let result, failed = false, failure
    evidence.calls++
    try { result = original.apply(this, args); evidence.result = result }
    catch (value) { failed = true; failure = value; evidence.originalThrew = true; error(value) }
    try {
      if (!failed) {
        if (result !== true) throw Error('Loaded scene did not start')
        const world = expectedWorld(), ref = sceneRef(this)
        if (!world || this.world !== world || store.getWorld() !== world || ref?.current !== this)
          throw Error('Loaded Scene/World/store reference mismatch')
        attach(this, ref, store)
        evidence.attached = true
      }
    } catch (value) { error(value) }
    finally { try { close() } catch (value) { error(value) } }
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

// Imported/preloaded before the trusted Load control. No polling, clock work,
// manufactured scene ref, or input dispatch runs inside either observation.
export async function prepareMission1BuildingLoad({ shamanId, birth }) {
  if (window.m1BuildingLoad || window.restoreVaultLoadWitness || window.m1BuildingScreen)
    throw Error('A lifecycle observer is already installed')
  const { GameScene } = await import('/app/scene.ts')
  installMission1VaultCheckpointState()
  let loadedWorld = null, start
  const { store } = installMission1VaultLoadWitness(world => { loadedWorld = world })
  try {
    start = armMission1BuildingSceneStart({ prototype: GameScene.prototype, store,
      expectedWorld: () => loadedWorld, sceneRef: currentSceneRef,
      attach(scene, ref, owner) {
        window.testSceneRef = ref; window.testScene = scene; window.testStore = owner
        installMission1BuildingScreenWitness({ shamanId, birth })
      } })
  } catch (error) { window.restoreVaultLoadWitness?.(); throw error }
  const owner = window.m1BuildingLoad = {
    evidence: start.evidence,
    close() {
      if (window.m1BuildingLoad !== owner) throw Error('Load observation ownership changed')
      try { start.close() }
      finally { window.restoreVaultLoadWitness?.(); delete window.m1BuildingLoad }
      return { start: start.evidence, loaded: window.vaultLoadedBoundary, error: window.vaultLoadedError }
    },
  }
}

export function installMission1BuildingRestartWitness() {
  if (window.restoreM1BuildingRestart || window.restoreVaultLoadWitness)
    throw Error('A Restart observer is already installed')
  const button = [...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Restart world')
  if (!button?.isConnected || button.disabled) throw Error('Public Restart world unavailable')
  const evidence = { before: null, after: null, screen: null, trusted: false, error: null }
  const { store } = installMission1VaultLoadWitness(world => { evidence.after = window.mission1VaultCheckpointState(world) })
  const capture = event => {
    try {
      if (!event.isTrusted || event.target !== button && !button.contains(event.target))
        throw Error('Restart requires the trusted public control')
      evidence.trusted = true
      evidence.before = window.mission1VaultCheckpointState(store.getWorld())
      evidence.screen = window.m1BuildingScreen.close()
    } catch (error) { evidence.error = String(error?.stack ?? error) }
  }
  button.addEventListener('click', capture, { capture: true, once: true })
  const close = window.restoreM1BuildingRestart = () => {
    if (window.restoreM1BuildingRestart !== close) throw Error('Restart observation ownership changed')
    button.removeEventListener('click', capture, true)
    window.restoreVaultLoadWitness?.(); delete window.restoreM1BuildingRestart
    return { ...evidence, loadError: window.vaultLoadedError }
  }
}
