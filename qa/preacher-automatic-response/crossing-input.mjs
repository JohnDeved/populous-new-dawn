const wrap = n => ((n + 128) % 256 + 256) % 256 - 128
const cellDelta = (a, b) => ((a - b + 64) & 127) - 64
const pointNative = p => ({ x: Math.round((p.x + 8) * 256) & 65535, y: Math.round((-p.z - 8) * 256) & 65535 })
const nearCell = (a, b, radius) => Math.abs(cellDelta(a[0], b[0])) <= radius && Math.abs(cellDelta(a[1], b[1])) <= radius

export function coherentCrossingBrave(item) {
  return item.kind === 'brave' && item.team === 'yellow' && item.hp > 0 && item.inside === null &&
    item.nativeOnly && item.native && [17, 19].includes(item.native.state) && !item.pathLength &&
    !item.predicates.nativeReverse.length && !item.predicates.ownership.length &&
    item.predicates.oldQaPrefilter.every(reason => ['not-idle17', 'outside-secondary3x3'].includes(reason))
}

// findLivePath returns smoothed route vertices, not per-turn positions. Split
// each wrapped segment at native512 cell boundaries; never advance a controller.
export function crossingWitness(path, targetCell, destination, primaryCells, context, origin) {
  if (path.length > 512) throw Error('Detached crossing path exceeds512 points')
  if (!origin || !context || context.model !== 3 || context.enabled !== true ||
    !['buildingId', 'personId', 'shrineId', 'treeId', 'vehicleId'].every(k => context[k] === null)) return null
  const witnesses = [], goal = pointNative(destination), points = [origin, ...path].map(pointNative)
  const short = n => (n << 16) >> 16
  for (let index = 1; index < points.length; index++) {
    const a = points[index - 1], b = points[index], dx = short(b.x - a.x), dy = short(b.y - a.y),
      length = Math.hypot(dx, dy), cuts = [0, 1]
    if (!length) continue
    for (const [start, delta] of [[a.x, dx], [a.y, dy]]) {
      if (!delta) continue
      const low = Math.min(start, start + delta), high = Math.max(start, start + delta)
      for (let edge = (Math.floor(low / 512) + 1) * 512; edge < high; edge += 512)
        cuts.push((edge - start) / delta)
    }
    cuts.sort((a, b) => a - b)
    for (let i = 1; i < cuts.length; i++) {
      const low = cuts[i - 1], high = cuts[i], span = (high - low) * length
      if (span < 256) continue
      const middle = (low + high) / 2, x = a.x + middle * dx, y = a.y + middle * dy,
        cell = [Math.floor(x / 512) & 127, Math.floor(y / 512) & 127]
      if (!nearCell(cell, targetCell, 1) || primaryCells.some(p => nearCell(cell, p, 2))) continue
      // Use the nearest wrapped goal image, then its closest point on this cell
      // interval. This bounds the whole interval's destination distance.
      const gx = goal.x + Math.round((x - goal.x) / 65536) * 65536,
        gy = goal.y + Math.round((y - goal.y) / 65536) * 65536,
        closest = Math.max(low, Math.min(high, ((gx - a.x) * dx + (gy - a.y) * dy) / (length * length))),
        remaining = Math.hypot(gx - a.x - closest * dx, gy - a.y - closest * dy)
      if (remaining <= 768) continue
      witnesses.push({ segment: index - 1, interval: [low, high], cell, spanNative: span,
        remainingNative: remaining, from: points[index - 1], to: points[index] })
    }
  }
  if (!witnesses.length) return null
  return { witnesses, targetCell, destination, primaryCells, origin: { x: origin.x, z: origin.z }, margin: 768, minimumCellSpanNative: 256,
    scope: 'Wrapped polyline cell intersections only; no simulated visits. Actual adjacent moving3/cadence/eligibility still required' }
}

export async function chooseCrossing(page, id) {
  return page.evaluate(async id => {
    const [{ readResponsePeople }, { coherentCrossingBrave, crossingWitness }, { findPath }] = await Promise.all([
      import('/qa/preacher-automatic-response/diagnostics.mjs'), import('/qa/preacher-automatic-response/crossing-input.mjs'), import('/app/model.ts')])
    const scene = window.testSceneRef.current, world = scene.world, actor = world.units.find(u => u.id === id)
    if (!actor?.native || world !== window.testStore.getWorld() || world.paused || world.mode || world.inputMask ||
      JSON.stringify(world.selected) !== JSON.stringify([id])) throw Error('Current selected native Preacher required before geometry')
    const diagnostic = readResponsePeople(world, actor.native, { all: true })
    const primaryCells = diagnostic.rows.filter(v => ['preacher', 'shaman'].includes(v.kind))
      .flatMap(v => [v.worldCell, ...(v.nativeCell ? [v.nativeCell] : [])])
    primaryCells.push(...diagnostic.unmatchedPrimary.map(v => v.nativeCell))
    const wrap = n => ((n + 128) % 256 + 256) % 256 - 128
    const distance = v => Math.hypot(wrap(v.world.x - actor.x), wrap(v.world.z - actor.z))
    const candidates = diagnostic.rows.filter(coherentCrossingBrave).sort((a, b) => distance(a) - distance(b) || a.id - b.id).slice(0, 4)
    const contextAt = window.nativeGuardProbes.createMoveContextProbe(world), probes = []
    for (const brave of candidates) for (const beyond of [6, 8]) {
      const dx = wrap(brave.world.x - actor.x), dz = wrap(brave.world.z - actor.z), length = Math.hypot(dx, dz)
      if (length <= 4) continue
      const destination = { x: wrap(brave.world.x + beyond * dx / length), z: wrap(brave.world.z + beyond * dz / length) }
      const context = contextAt(destination), clone = structuredClone(world), clonedActor = clone.units.find(u => u.id === id)
      const path = findPath(clone, clonedActor, destination)
      const witness = crossingWitness(path, brave.nativeCell, destination, primaryCells, context, actor)
      probes.push({ braveId: brave.id, beyond, destination, context, path, witness })
      if (!witness) continue
      const target = world.units.find(u => u.id === brave.id)
      window.preacherCrossingPin = { scene, world, actor, person: actor.native, target, native: target.native }
      return { chosen: { brave, destination, witness }, probes, diagnostic, turn: world.turn }
    }
    return { chosen: null, probes, diagnostic, turn: world.turn }
  }, id)
}

export async function confirmCrossing(page, plan, hit) {
  return page.evaluate(async ({ plan, hit }) => {
    const [{ readResponsePeople }, { coherentCrossingBrave, crossingWitness }, { findPath }] = await Promise.all([
      import('/qa/preacher-automatic-response/diagnostics.mjs'), import('/qa/preacher-automatic-response/crossing-input.mjs'), import('/app/model.ts')])
    const pin = window.preacherCrossingPin, scene = window.testSceneRef.current, w = scene.world
    if (!pin || scene !== pin.scene || w !== pin.world || w !== window.testStore.getWorld() ||
      w.units.find(u => u.id === pin.actor.id) !== pin.actor || pin.actor.native !== pin.person ||
      w.units.find(u => u.id === pin.target.id) !== pin.target || pin.target.native !== pin.native)
      throw Error('Prospective crossing owner changed before delivery')
    const diagnostic = readResponsePeople(w, pin.person, { all: true }), target = diagnostic.rows.find(v => v.id === pin.target.id)
    if (!target || !coherentCrossingBrave(target) || JSON.stringify(target.nativeCell) !== JSON.stringify(plan.chosen.brave.nativeCell))
      throw Error('Chosen Brave no longer has the declared coherent cell/state')
    const primaryCells = diagnostic.rows.filter(v => ['preacher', 'shaman'].includes(v.kind))
      .flatMap(v => [v.worldCell, ...(v.nativeCell ? [v.nativeCell] : [])])
    primaryCells.push(...diagnostic.unmatchedPrimary.map(v => v.nativeCell))
    const context = window.nativeGuardProbes.createMoveContextProbe(w)(hit.point)
    const clone = structuredClone(w), actor = clone.units.find(u => u.id === pin.actor.id), path = findPath(clone, actor, hit.point)
    const witness = crossingWitness(path, target.nativeCell, hit.point, primaryCells, context, pin.actor)
    if (!witness) throw Error('Actual picked ground lacks the declared crossing/pending-destination margin')
    return { turn: w.turn, target, context, path, witness, diagnostic }
  }, { plan, hit })
}
