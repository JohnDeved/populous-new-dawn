// Candidate-only measured freshness repair. No input, simulation or world mutation.
// The sampler records only existing picker calls, in the specified original order.
export function groundSampler(scene, doc, target, groundFirst = false) {
  const samples = []
  const cache = () => ({ lastId: scene.picking.lastId ?? null, lastKind: scene.picking.lastKind ?? null })
  const inspect = pixel => {
    const canvasOwned = doc.elementFromPoint(pixel.x, pixel.y) === scene.renderer.domElement
    const event = { clientX: pixel.x, clientY: pixel.y }, beforeCache = cache()
    let ground = null, objectId = null, groundCalled = false, objectCalled = false
    const pickGround = () => { groundCalled = true; ground = scene.pick(event) }
    const pickObject = () => { objectCalled = true; objectId = scene.picking.pick(event) }
    if (canvasOwned) {
      if (groundFirst) { pickGround(); if (ground) pickObject() }
      else { pickObject(); if (objectId === null) pickGround() }
    }
    const distance = ground ? Math.hypot(ground.x - target.x, ground.z - target.z) : null
    const reason = !canvasOwned ? 'not-canvas-owned' : objectCalled && objectId !== null ? 'competing-object' :
      !ground ? 'no-ground-pick' : !(distance <= 1.5) ? 'outside-target-radius' : 'accepted-ground-pixel'
    samples.push({ ...pixel, canvasOwned, groundCalled, objectCalled,
      objectId: objectId === undefined ? 'undefined' : objectId,
      ground: ground ? { x: ground.x, z: ground.z } : null, distance, reason,
      turn: scene.world.turn, frame: scene.frame, beforeCache, afterCache: cache() })
    return { canvasOwned, hitId: reason === 'accepted-ground-pixel' ? 0 : null }
  }
  return { inspect, samples }
}

// Exact accepted firing cross sequence: 20 entries, 17 unique integer centers.
export function freshGroundCandidates(hit) {
  const candidates = []
  for (let r = 0; r <= 8; r += 2)
    for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r]])
      candidates.push({ x: hit.x + dx, y: hit.y + dy })
  return candidates
}

export function findFreshGround({ scene, doc, hit, selected, findEntityInput, contextAt, collisionAt,
  currentScene = scene, currentWorld = scene.world }) {
  const w = scene.world, sampler = groundSampler(scene, doc, hit.point)
  const diagnostics = { turn: w.turn, frame: scene.frame, now: performance.now(),
    selected: [...w.selected], candidates: freshGroundCandidates(hit), samples: sampler.samples,
    centers: [], sameScene: currentScene === scene, sameWorld: currentWorld === w }
  const result = (decision, fresh = null) => ({ hit: fresh, diagnostics: { ...diagnostics, decision } })
  if (!Number.isInteger(hit.x) || !Number.isInteger(hit.y) || !diagnostics.sameScene || !diagnostics.sameWorld ||
    w.paused || w.status !== 'playing' || w.inputMask || w.mode !== null ||
    JSON.stringify(w.selected) !== JSON.stringify(selected) || !selected.length)
    return result('input-owner-or-recipient-changed')
  // One inherited memoized sampler covers the finite list. A valid 5x5 center
  // outside the original <0.25 drift guard is excluded before neighborhood scan.
  function* eligibleCandidates() {
    const visited = new Set()
    for (const pixel of diagnostics.candidates) {
      const key = `${pixel.x},${pixel.y}`
      if (visited.has(key)) continue
      visited.add(key)
      const ground = scene.pick({ clientX: pixel.x, clientY: pixel.y })
      const distance = ground ? Math.hypot(ground.x - hit.point.x, ground.z - hit.point.z) : null
      const context = ground ? contextAt(ground) : null, collision = ground ? collisionAt(ground) : null
      const valid = !!ground && distance < 0.25 && context?.model === 3 && context.enabled === true &&
        ['buildingId', 'personId', 'shrineId', 'treeId', 'vehicleId'].every(key => context[key] === null) && !collision
      diagnostics.centers.push({ ...pixel, ground: ground ? { x: ground.x, z: ground.z } : null,
        distance, context, collision, valid })
      if (valid) yield pixel
    }
  }
  const interior = findEntityInput(eligibleCandidates(), 0, sampler.inspect)
  if (!interior) return result('no-fresh-integer-5x5-interior')
  const center = diagnostics.centers.find(p => p.x === interior.x && p.y === interior.y && p.valid)
  return result('fresh-enabled-model3-interior', { ...interior, point: center.ground, context: center.context })
}
