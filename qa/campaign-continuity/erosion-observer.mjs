// Read-only, prospective shrine-linked Erosion evidence stored outside World.
const insist = (value, message) => { if (!value) throw Error(message) }
const samePoint = (a, b) => a.x === b.x && a.z === b.z
const refs = new WeakMap()
const terrain = (world, center) => {
  insist(world.land.heights.length === 16384 && world.land.walkMasks.every(mask => mask.length === 8192),
    'Native terrain has128×128 heights and256×256 packed walk bits')
  const x = (center.x >>> 9) & 127, y = (center.y >>> 9) & 127, cells = []
  for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) {
    const index = ((y + dy) & 127) * 128 + ((x + dx) & 127)
    const nativeCell = ((index & 127) * 2) | ((index >>> 7) * 2 << 8)
    const quarters = [nativeCell, nativeCell + 1, nativeCell + 256, nativeCell + 257]
    cells.push({ index, height: world.land.heights[index], walkMasks: world.land.walkMasks.map(mask =>
      quarters.map(cell => Number(!!(mask[cell >>> 3] & (1 << (cell & 7)))))) })
  }
  const versions = {}
  for (const key of ['landVersion', 'terrainVersion']) if (world[key] !== undefined) {
    insist(Number.isFinite(world[key]), 'Nonfinite observed terrain version')
    versions[key] = world[key]
  }
  return { turn: world.turn, versions, cells,
    otherTerrainControllers: (world.effects ?? []).filter(effect => effect.bridge || effect.flatten || effect.earthquake || effect.volcano)
      .map(effect => ({ id: effect.id, kind: effect.kind })) }
}
const state = effect => {
  insist([effect.id, effect.x, effect.z, effect.age, effect.erosion.remaining,
    effect.erosion.center.x, effect.erosion.center.y, effect.erosion.center.h].every(Number.isFinite),
  'Lifecycle evidence requires finite observed scalars')
  return { id: effect.id, kind: effect.kind, x: effect.x, z: effect.z, age: effect.age,
    remaining: effect.erosion.remaining, center: { x: effect.erosion.center.x, y: effect.erosion.center.y, h: effect.erosion.center.h } }
}

export function armErosionObservation(epoch, world, shrineId) {
  insist(!epoch.erosion, 'Erosion observation cannot be re-armed')
  const shrine = world.shrines.find(shrine => shrine.id === shrineId)
  insist(shrine?.kind === 'erosionEffect' && shrine.active && shrine.uses === 0 && shrine.remaining > 0,
    'Arm before the actual unused Erosion shrine fires')
  const targets = (shrine.effectTargets ?? [shrine.effectTarget]).map(target => ({ x: target?.x, z: target?.z }))
  insist(targets.length > 0 && targets.length <= 8 && targets.every(target => Number.isFinite(target.x) && Number.isFinite(target.z)), 'Bounded authored Erosion targets required')
  insist(new Set(targets.map(target => JSON.stringify(target))).size === targets.length, 'Ambiguous duplicate Erosion targets')
  const existingIds = (world.effects ?? []).filter(effect => effect.kind === 'erosion').map(effect => effect.id)
  insist(!(world.effects ?? []).some(effect => effect.kind === 'erosion' && targets.some(target => samePoint(effect, target))), 'A matching Erosion effect already exists')
  epoch.erosion = { shrineId, targets, armedAtTurn: world.turn, lastTurn: world.turn, initialUses: shrine.uses,
    existingIds, use: null, effects: [], samples: 0,
    terrainScope: 'Observed radius6 native cells during the effect. Correlated changes do not exclude other terrain producers.' }
  refs.set(epoch.erosion, new Map())
  return epoch.erosion
}

export function recordErosionTurn(epoch, world) {
  const observation = epoch.erosion
  if (!observation) return
  insist(world.turn === observation.lastTurn + 1, 'Missing adjacent Erosion turn observation')
  observation.lastTurn = world.turn; observation.samples++
  const shrine = world.shrines.find(shrine => shrine.id === observation.shrineId)
  insist(shrine?.kind === 'erosionEffect', 'Observed Erosion shrine disappeared')
  const currentTargets = (shrine.effectTargets ?? [shrine.effectTarget]).map(target => ({ x: target?.x, z: target?.z }))
  insist(JSON.stringify(currentTargets) === JSON.stringify(observation.targets), 'Authored Erosion targets changed')
  if (observation.use) insist(shrine.uses === observation.initialUses + 1, 'Unexpected additional Erosion shrine use')
  if (!observation.use && shrine.uses !== observation.initialUses) {
    insist(shrine.uses === observation.initialUses + 1, 'Erosion use transition was not exactly one')
    const newEffects = (world.effects ?? []).filter(effect => effect.kind === 'erosion' && !observation.existingIds.includes(effect.id))
    observation.use = { turn: world.turn, uses: shrine.uses, remaining: shrine.remaining, active: shrine.active, ...(shrine.forced === undefined ? {} : { forced: shrine.forced }) }
    for (const target of observation.targets) {
      const matches = newEffects.filter(effect => samePoint(effect, target))
      insist(matches.length === 1, 'The observed shrine use needs one unique new Erosion at each authored target')
      const effect = matches[0]
      insist(effect.erosion?.remaining === 64 && effect.age === 0, 'Observe actual Erosion onset before its first processing turn')
      const center = effect.erosion.center
      insist(center.x === (Math.round((target.x + 8) * 256) & 65535) && center.y === (Math.round((-target.z - 8) * 256) & 65535), 'Erosion native center differs from its authored target')
      const record = { onsetTurn: world.turn, onset: state(effect), samples: [[world.turn, 64]],
        last: state(effect), retired: null, terrain: { onset: terrain(world, center) } }
      observation.effects.push(record); refs.get(observation).set(effect.id, { effect, controller: effect.erosion })
    }
  }
  for (const record of observation.effects) {
    if (record.retired || record.onsetTurn === world.turn) continue
    const elapsed = world.turn - record.onsetTurn
    const effect = (world.effects ?? []).find(effect => effect.id === record.onset.id)
    const retained = refs.get(observation).get(record.onset.id)
    insist(retained.effect.id === record.onset.id && retained.effect.kind === 'erosion' &&
      samePoint(retained.effect, record.onset), 'Erosion effect identity or target changed')
    insist(retained.effect.erosion === retained.controller, 'Erosion controller identity changed')
    insist(['x', 'y', 'h'].every(key => retained.controller.center?.[key] === record.onset.center[key]),
      'Erosion native center changed from its authored onset')
    if (elapsed < 64) {
      insist(effect?.kind === 'erosion' && effect === retained.effect, 'Erosion effect identity changed before retirement')
      insist(effect.erosion?.remaining === 64 - elapsed && samePoint(effect, record.onset), 'Erosion countdown/target changed')
      record.last = state(effect); record.samples.push([world.turn, effect.erosion.remaining])
      if (elapsed === 1) record.terrain.firstActive = terrain(world, effect.erosion.center)
      if (elapsed === 63) record.terrain.lastActive = terrain(world, effect.erosion.center)
    } else {
      insist(elapsed === 64 && !effect && record.last.remaining === 1 && retained.controller.remaining === 0 &&
        Number.isFinite(retained.effect.age) && Number.isFinite(retained.effect.duration) &&
        retained.effect.duration === retained.effect.age, 'Erosion retirement needs its actual zero-counter removal on turn64')
      record.retired = { turnBefore: world.turn - 1, turnAfter: world.turn, remaining: retained.controller.remaining,
        age: retained.effect.age, duration: retained.effect.duration, absentFromWorld: true }
      record.terrain.retired = terrain(world, retained.controller.center)
      record.changedCells = record.terrain.retired.cells.filter((cell, i) =>
        cell.height !== record.terrain.onset.cells[i].height ||
        JSON.stringify(cell.walkMasks) !== JSON.stringify(record.terrain.onset.cells[i].walkMasks))
      refs.get(observation).delete(record.onset.id)
    }
  }
}

export function erosionProgress(snapshot, shrineId) {
  const observation = snapshot.observation?.erosion
  if (!observation || observation.shrineId !== shrineId) return JSON.stringify(null)
  return JSON.stringify([observation.use, observation.effects.map(effect => [effect.onset.id, effect.last.remaining, effect.retired])])
}
export function requireErosionEvidence(epoch, shrineId, retired = false) {
  insist(epoch && !epoch.errors.length && !epoch.speedViolations.length, 'Erosion observer errors invalidate evidence')
  const observation = epoch.erosion
  insist(observation?.shrineId === shrineId && observation.use && observation.effects.length === observation.targets.length,
    'Require the prospectively observed shrine-linked Erosion onset')
  if (retired) insist(observation.effects.every(effect => effect.retired && effect.samples.length === 64),
    'Require every actually observed64-turn Erosion retirement')
  return structuredClone(observation)
}
