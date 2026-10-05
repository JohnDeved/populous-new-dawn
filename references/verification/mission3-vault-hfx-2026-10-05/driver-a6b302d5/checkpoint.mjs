// Same read-only IDB and store-replacement pattern as the maintained
// scripts/local-render/checkpoint-restart.mjs, scoped to the introduced cursor.
export async function readVaultCheckpoint() {
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
    if (!record) return null
    const w = record.world, vault = w.shrines.find(s => s.kind === 'vault' && s.reward === 'temple')
    return { version: record.version, level: w.outcome.level, turn: w.turn, time: w.time,
      active: vault.active, glow: vault.knowledgeGlow, temple: w.unlockedTemple, gifts: w.gifts.length }
  } finally { db.close() }
}

export function installVaultLoadWitness() {
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
    try {
      const vault = w.shrines.find(s => s.kind === 'vault' && s.reward === 'temple')
      window.vaultLoadedBoundary = structuredClone({ version: 1, level: w.outcome.level,
        turn: w.turn, time: w.time, active: vault.active, glow: vault.knowledgeGlow,
        temple: w.unlockedTemple, gifts: w.gifts.length })
    } catch (error) { window.vaultLoadedError = String(error) }
    finally { unsubscribe(); delete window.restoreVaultLoadWitness }
  })
  window.restoreVaultLoadWitness = unsubscribe
}
