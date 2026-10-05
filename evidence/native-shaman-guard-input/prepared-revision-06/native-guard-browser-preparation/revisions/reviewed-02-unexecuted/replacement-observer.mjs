export function installReplacementObservation() {
  if (window.campaignReplacement?.pending) throw Error('Previous replacement observation is still pending')
  const main = document.querySelector('main')
  let fiber = main?.[Object.keys(main).find(key => key.startsWith('__reactFiber'))], store
  for (; fiber && !store; fiber = fiber.return)
    for (let hook = fiber.memoizedState; hook; hook = hook.next)
      if (hook.memoizedState?.getWorld && hook.memoizedState?.subscribe) { store = hook.memoizedState; break }
  if (!store) throw Error('Store unavailable before ordinary replacement')
  const before = store.getWorld(), scene = window.testSceneRef?.current
  const observation = { store, before, scene, pending: true, error: null, world: null }
  window.campaignReplacement = observation; window.campaignLoadBoundary = null
  const unsubscribe = store.subscribe(() => {
    const world = store.getWorld()
    if (world === before) return
    try {
      observation.world = world
      window.campaignLoadBoundary = { version: 1, world: structuredClone(world) }
    } catch (error) { observation.error = String(error) }
    finally { observation.pending = false; unsubscribe() }
  })
  observation.dispose = unsubscribe
}
export function replacementIdentity() {
  const observed = window.campaignReplacement, scene = window.testSceneRef?.current, store = window.testStore
  if (!observed || observed.pending) throw Error('No actual store replacement observed')
  return { sameStore: store === observed.store, newWorld: store.getWorld() !== observed.before,
    newScene: scene !== observed.scene, currentCorrespondence: scene?.world === store.getWorld(),
    level: store.getWorld().outcome.level, replacementLevel: observed.world?.outcome.level, error: observed.error }
}

