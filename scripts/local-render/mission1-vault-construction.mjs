// Renderer-hit and detached placement pattern from ordinary-shared-training
// a3d3f2f92a7dc7e84f54f6ddac9f6c989b0ee435, scoped to the actual home-island camp.
export async function findMission1CampGround({ point, radius = 14, ids }) {
  const [{ placementError }, { createMoveContextProbe, inspectEntityPoint }, { planLivePath },
    { syncNativeTerrain, syncLandscapeObjects }, { releasePersonRoute }] = await Promise.all([
    import('/app/model.ts'), import('/qa/erosion-ordinary/input.mjs'), import('/app/live-pathfinding.ts'),
    import('/app/world-terrain-runtime.ts'), import('/app/person-routes.ts')])
  const s = window.testSceneRef.current, r = s.renderer.domElement.getBoundingClientRect()
  const probe = structuredClone(s.world)
  syncNativeTerrain(probe); syncLandscapeObjects(probe)
  const context = createMoveContextProbe(probe)
  const workers = ids.map(id => probe.units.find(u => u.id === id))
  if (!workers.length || workers.some(u => !u || u.team !== 'blue' || u.kind !== 'brave' || u.hp <= 0))
    throw Error('Camp placement requires actual living selected Braves')
  for (let distance = 0; distance <= radius; distance++) for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
    const p = { x: point.x + Math.cos(angle) * distance, z: point.z + Math.sin(angle) * distance }, q = s.screen(p)
    const hit = { x: r.x + (q.x + 1) * r.width / 2, y: r.y + (1 - q.y) * r.height / 2 }
    const picked = s.pick({ clientX: hit.x, clientY: hit.y }), inspected = inspectEntityPoint(s, 'buildings', hit)
    if (!picked || !inspected.canvasOwned || inspected.hitId !== null || Math.hypot(picked.x - p.x, picked.z - p.z) >= 1.5) continue
    // The home-island bounds come from the original opening cohort, not a remote injected fixture.
    if (picked.z < 19 || Math.hypot(picked.x - point.x, picked.z - point.z) > radius + 1.5) continue
    if (placementError(probe, 'camp', picked)) continue
    if (!context(picked).enabled || context(picked).model !== 3) continue
    const reachable = []
    for (const worker of workers) {
      const route = planLivePath(probe, worker, picked)
      if (route) {
        try { reachable.push(worker.id) }
        finally { releasePersonRoute(probe.motionRoutes, route) }
      }
    }
    if (!reachable.length) continue
    return { ...hit, point: { x: picked.x, z: picked.z }, reachable, selected: [...s.world.selected] }
  }
  return null
}

// A real turn observer records ordinary log arrival and work through construction.
// It never advances a turn or changes a plan, worker, cargo, tree or render.
export function installMission1CampConstruction(id) {
  const s = window.testSceneRef.current, w = s.world, clock = s.gameClock
  const descriptor = Object.getOwnPropertyDescriptor(clock, 'afterTurn'), original = clock.afterTurn
  const evidence = window.mission1CampConstruction = { id, samples: [], carried: [], delivered: [], errors: [], restored: false }
  let before = new Map(), priorLogs = w.buildings.find(b => b.id === id)?.logs
  const replacement = function (...args) {
    const result = original.apply(this, args)
    try {
      const b = w.buildings.find(b => b.id === id)
      if (!b) throw Error('Ordinarily placed camp disappeared')
      const workers = w.units.filter(u => u.work === id && u.kind === 'brave' && u.team === 'blue' && u.hp > 0)
      for (const u of workers) {
        if (u.cargo > 0 && !evidence.carried.some(row => row.id === u.id)) evidence.carried.push({ turn: w.turn, id: u.id, cargo: u.cargo, tree: u.tree })
        if ((before.get(u.id) ?? 0) > u.cargo && b.logs > priorLogs)
          evidence.delivered.push({ turn: w.turn, id: u.id, beforeCargo: before.get(u.id), cargo: u.cargo, beforeLogs: priorLogs, logs: b.logs })
      }
      before = new Map(workers.map(u => [u.id, u.cargo])); priorLogs = b.logs
      const last = evidence.samples.at(-1)
      if (!last || last.logs !== b.logs || last.progress !== b.progress) {
        if (evidence.samples.length < 256) evidence.samples.push({ turn: w.turn, logs: b.logs, progress: b.progress, hp: b.hp,
          workers: workers.map(u => ({ id: u.id, work: u.work, cargo: u.cargo, tree: u.tree, task: u.builder?.task })) })
      }
      if (b.progress === 1 && b.hp > 0) evidence.completed = { turn: w.turn, id, progress: b.progress, logs: b.logs, hp: b.hp }
    } catch (error) { if (evidence.errors.length < 8) evidence.errors.push(String(error)) }
    return result
  }
  clock.afterTurn = replacement
  window.restoreMission1CampConstruction = () => {
    if (clock.afterTurn !== replacement) evidence.errors.push('Construction observer ownership changed')
    else if (descriptor) Object.defineProperty(clock, 'afterTurn', descriptor)
    else delete clock.afterTurn
    evidence.restored = clock.afterTurn === original
    delete window.restoreMission1CampConstruction
    return evidence
  }
}
