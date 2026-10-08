// Save reads await the readonly transaction, not merely the request callback.
// The same bounded snapshot is reused synchronously at store replacement on Load.
export function installMission1VaultCheckpointState() {
  window.mission1VaultCheckpointState = (w, version = 1) => {
  const vault = w.shrines.find(s => s.kind === 'vault' && s.mode === 4 && s.reward === 'camp' && s.x === -5 && s.z === -3)
  if (w.outcome.level !== 1 || !vault) throw Error('Exact authored Mission 1 camp Vault required')
  return structuredClone({ version, level: w.outcome.level, turn: w.turn, time: w.time,
    active: vault.active, glow: vault.knowledgeGlow, camp: w.unlockedCamp,
    paused: w.paused, mode: w.mode, selected: w.selected, acquisition: w.worshipAcquisition,
    cosmeticRandom: w.cosmeticRandom, buildingGifts: w.gifts.filter(gift => gift.buildingAcquisition),
    gifts: w.gifts.length, bridges: w.stats.bridges, landVersion: w.landVersion,
    heights: Array.from(w.land.heights),
    shaman: w.units.filter(u => u.team === 'blue' && u.kind === 'shaman').map(u => ({ id: u.id, hp: u.hp, x: u.x, z: u.z })) })
  }
}

export async function readMission1VaultCheckpoint() {
  if (!(await indexedDB.databases()).some(db => db.name === 'populous-new-dawn')) return null
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('populous-new-dawn')
    request.onupgradeneeded = () => { request.transaction.abort(); reject(Error('Missing existing checkpoint database')) }
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error)
  })
  try {
    const record = await new Promise((resolve, reject) => {
      const tx = db.transaction('checkpoints', 'readonly'), request = tx.objectStore('checkpoints').get('latest')
      tx.oncomplete = () => resolve(request.result)
      tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error)
    })
    return record ? window.mission1VaultCheckpointState(record.world, record.version) : null
  } finally { db.close() }
}

// Capture the same synchronous public click that calls store.saveCheckpoint.
// UI presentation may advance while paused, so an earlier host read is not equal.
export function installMission1VaultSaveWitness() {
  if (window.restoreVaultSaveWitness) throw Error('A Save observer is already armed')
  const button = [...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Save checkpoint')
  if (!button?.isConnected || button.disabled) throw Error('Public Save checkpoint control unavailable')
  window.vaultSavedBoundary = null
  window.vaultSaveError = null
  const capture = event => {
    try {
      if (!event.isTrusted || event.target !== button && !button.contains(event.target)) throw Error('Save requires the trusted public control')
      window.vaultSavedBoundary = window.mission1VaultCheckpointState(window.testStore.getWorld())
    } catch (error) { window.vaultSaveError = String(error?.stack ?? error) }
  }
  button.addEventListener('click', capture, { capture: true, once: true })
  window.restoreVaultSaveWitness = () => {
    button.removeEventListener('click', capture, true)
    delete window.restoreVaultSaveWitness
    return { saved: window.vaultSavedBoundary, error: window.vaultSaveError }
  }
}

export function installMission1VaultLoadWitness() {
  const main = document.querySelector('main')
  let fiber = main[Object.keys(main).find(key => key.startsWith('__reactFiber'))], store
  for (; fiber && !store; fiber = fiber.return)
    for (let hook = fiber.memoizedState; hook; hook = hook.next)
      if (hook.memoizedState?.getWorld && hook.memoizedState?.subscribe) { store = hook.memoizedState; break }
  if (!store) throw Error('Store unavailable before public Load Game')
  const before = store.getWorld()
  window.vaultLoadedBoundary = null
  window.vaultLoadedError = null
  const unsubscribe = store.subscribe(() => {
    const w = store.getWorld()
    if (w === before) return
    try { window.vaultLoadedBoundary = window.mission1VaultCheckpointState(w) }
    catch (error) { window.vaultLoadedError = String(error) }
    finally { unsubscribe(); delete window.restoreVaultLoadWitness }
  })
  window.restoreVaultLoadWitness = unsubscribe
}
