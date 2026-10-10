import rules from '../../app/original-rules.json' with { type: 'json' }
import { buildingModel } from '../../app/building-shapes.ts'
import { buildingWorkStage } from '../../app/building-damage.ts'
import { buildingHp } from '../../app/world-rules.ts'

const insist = (ok, message) => { if (!ok) throw Error(message) }
const short = n => (n << 16) >> 16
const native = point => ({ x: short(Math.round((point.x + 8) * 256)),
  y: short(Math.round((-point.z - 8) * 256)) })
const cell = point => ((point.y & 0xfe00) | ((point.x >>> 8) & 254)) >>> 0
const harmful = new Set(['blast', 'blastWave', 'lightning', 'fire', 'firestorm',
  'swamp', 'swarm', 'tornado', 'earthquake', 'volcano', 'erosion', 'angel', 'firewarriorShot'])

export function assertTornadoBuildingCast({ before, after, pointer }, shamanId) {
  insist(before.mode === 'tornado' && after.mode === null && !before.overviewActive,
    'Actual Tornado mode did not complete')
  insist(before.worldMatches && after.worldMatches && before.caster === shamanId &&
    after.caster === shamanId && before.turn === after.turn && after.stock === before.stock - 1,
    'Cast receipt lost synchronous World/caster/stock ownership')
  insist(pointer.restored && !pointer.errors.length, 'Pointer observation was not cleanly restored')
  const releases = pointer.events.filter(event => event.type === 'pointerup')
  insist(releases.length === 1, 'Exactly one actual pointer release required')
  const release = releases[0]
  insist(release.trusted && release.button === 0 && release.canvasTarget && release.canvasOwned &&
    release.state.currentSceneMatches && release.state.currentWorldMatches &&
    release.state.armedWorldMatches && release.state.armedCanvasMatches,
    'Actual pointer release lost canvas/World ownership')
  const picks = release.picks.filter(pick => pick.owner === 'scene' && pick.name === 'pick')
  insist(picks.length === 1 && picks[0].receiverMatches && !picks[0].threw &&
    JSON.stringify(picks[0].args) === JSON.stringify(release.args), 'Actual terrain picker chain changed')
  insist(!release.picks.some(pick => ['pickPerson', 'pickUnit', 'pickWorldObject'].includes(pick.name)),
    'Tornado unexpectedly used a person/object target route')
  const point = picks[0].point
  insist(point && Number.isFinite(point.x) && Number.isFinite(point.z), 'No delivered terrain point')
  const fresh = after.projectiles.filter(p => !before.projectiles.some(old => old.id === p.id))
  insist(fresh.length === 1 && fresh[0].spell === 'tornado' && fresh[0].caster === shamanId &&
    fresh[0].phase === 'windup' && fresh[0].remaining === 6 && fresh[0].turns === 0 &&
    fresh[0].visuals.length === 0 && fresh[0].blastTarget === undefined,
    'Unique actual Tornado projectile was not initialized')
  const target = { x: Math.floor(point.x / 2) * 2 + 1, z: -Math.floor(-point.z / 2) * 2 - 1 }
  insist(fresh[0].target.x === target.x && fresh[0].target.z === target.z,
    'Projectile target does not quantize the actual delivered terrain pick')
  const position = native(target)
  insist(fresh[0].destination.x === position.x && fresh[0].destination.y === position.y,
    'Projectile destination disagrees with its delivered target')
  return { projectileId: fresh[0].id, point, target }
}

// Plain-data contract. Net work loss alone never attributes an impact to Tornado.
export function tornadoWoodImpact(before, after, logs) {
  const loss = before.building.work - after.building.work
  if (!loss && !logs.length) return null
  insist(before.building.hp > 0, 'Impact target was already retired')
  insist(before.competing.length === 0 && after.competing.length === 0,
    'Competing damage/timber work prevents Tornado attribution')
  // Deliberately narrower than the last phase0 visit that switches to phase1.
  // Such a late hit is rejected by this witness, not relabelled as a game failure.
  insist(after.tornado && after.tornado.phase === 0, 'No active owned Tornado at impact')
  insist(cell(after.tornado) === cell(native(after.building)), 'Owned Tornado missed target cell')
  insist(loss === 100, 'Impact must remove exactly 100 work')
  insist(logs.length === 1, 'Impact must create exactly one target-position loose log')
  const log = logs[0]
  insist(log.model === 11 && log.logs === 1, 'Incorrect loose timber model/quantity')
  const position = native(after.building)
  insist(log.x === short(position.x - 2048) / 256 &&
    log.z === -short(position.y + 2048) / 256, 'Timber did not use current target position')
  insist(after.building.stage === buildingWorkStage(after.building.work, before.building.life),
    'Final damage stage disagrees with remaining work')
  insist(after.building.work > 0 || !after.building.present, 'Exhausted building was not retired')
  return { turn: after.turn, before: before.building, after: after.building,
    tornado: after.tornado, log }
}

// A small observer of the actual fixed-turn callbacks. It never calls tick,
// changes game state, wraps allocation, reconstructs RNG, or substitutes damage.
export function attachTornadoBuildingObservation(scene, store, expected, currentScene = () => scene) {
  const world = scene.world, clock = scene.gameClock
  const building = world.buildings.find(b => b.id === expected.targetId)
  const shaman = world.units.find(u => u.id === expected.shamanId)
  let projectile = world.projectiles.find(p => p.id === expected.projectileId)
  insist(building && shaman && (!expected.projectileId ||
    projectile?.spell === 'tornado' && projectile.caster === shaman.id),
    'Actual target, original caster and optional accepted Tornado projectile required')
  insist(world.outcome.level === 2 && expected.targetId === 1 && expected.shamanId === 54 &&
    shaman.team === 'blue' && shaman.kind === 'shaman' && shaman.hp > 0 &&
    building.team === 'green' && building.kind === 'camp' && buildingModel(building) === 7 &&
    building.hp > 0 && !building.preparation && !building.burn && !building.upgrading,
    'Original Blue Shaman54 and live authored Green Camp1 required')
  insist(!world.effects.some(f => f.tornado), 'Earlier Tornado prevents effect attribution')
  insist(!world.projectiles.some(p => p !== projectile && p.spell === 'tornado'),
    'Earlier Tornado projectile prevents attribution')
  const originalIds = new Set(world.effects.map(f => f.id))
  const originalProjectiles = new Set(world.projectiles.map(p => p.id))
  const treeIds = new Set(world.trees.map(tree => tree.id))
  const evidence = { expected, initialTurn: world.turn, visits: [], impacts: [], errors: [],
    cleanupErrors: [], restored: false, terminal: null }
  const descriptors = new Map(['beforeTurn', 'afterTurn'].map(name =>
    [name, Object.getOwnPropertyDescriptor(clock, name)]))
  const originals = { beforeTurn: clock.beforeTurn, afterTurn: clock.afterTurn }
  insist(Object.values(originals).every(fn => typeof fn === 'function'), 'Real turn callbacks required')
  let before = null, owned = null, finished = false
  const checkOwner = () => {
    insist(currentScene() === scene && scene.world === world && store.getWorld() === world &&
      scene.gameClock === clock, 'Scene/store/clock ownership changed')
    insist(world.units.find(u => u.id === shaman.id) === shaman && shaman.hp > 0 &&
      shaman.team === 'blue' && shaman.kind === 'shaman',
      'Original Shaman lost during observation')
    const target = world.buildings.find(b => b.id === building.id)
    insist(!target || target === building, 'Building identity replaced during observation')
    insist(building.kind === 'camp' && building.team === 'green' && buildingModel(building) === 7,
      'Authored Camp model/ownership changed')
  }
  const capture = () => {
    checkOwner()
    if (!projectile) {
      const fresh = world.projectiles.filter(p => !originalProjectiles.has(p.id) && p.spell === 'tornado')
      insist(fresh.length <= 1 && (!fresh.length || fresh[0].caster === shaman.id),
        'New Tornado projectile has ambiguous ownership')
      if (fresh.length) projectile = fresh[0]
    }
    const fresh = world.effects.filter(f => f.tornado && !originalIds.has(f.id))
    if (!owned && fresh.length) {
      insist(projectile && fresh.length === 1 && fresh[0].tornado.tribe === 0, 'Ambiguous Tornado ownership')
      owned = fresh[0]
    }
    insist(fresh.length <= 1 && (!fresh.length || fresh[0] === owned) &&
      (!owned || owned.tornado.tribe === 0), 'Owned Tornado was replaced or joined by a second effect')
    const model = buildingModel(building), life = rules.buildingLife[model]
    const work = building.damageState?.plan.remaining ??
      Math.trunc(Math.min(building.progress, building.hp / buildingHp(building.kind)) * life)
    const competing = [
      ...world.effects.filter(f => f !== owned && harmful.has(f.kind)).map(f => `effect:${f.id}`),
      ...world.projectiles.filter(p => p.id !== projectile?.id).map(p => `projectile:${p.id}`),
      ...world.units.filter(u => u.hp > 0 && (u.target === building.id ||
        (u.work === building.id && (u.builder || u.delivery || u.cargo > 0))))
        .map(u => `worker:${u.id}`),
    ]
    if (building.burn || building.preparation || building.upgrading ||
      (building.admission?.activity ?? 0) & 0x8000 ||
      (building.damageState?.buildingFlags ?? 0) & 64 ||
      (building.damageState?.damage ?? 0) >= rules.buildingDamageThreshold[model] ||
      building.damageState?.state === 3) competing.push('building-controller')
    const tornado = owned && world.effects.includes(owned) ? owned.tornado : null
    return { turn: world.turn, competing, building: { id: building.id, x: building.x, z: building.z,
      hp: building.hp, life, work, stage: building.damageState?.stage ?? buildingWorkStage(work, life),
      present: world.buildings.includes(building), attacker: building.damageState?.attacker ?? null },
      tornado: tornado && { id: owned.id, x: tornado.x, y: tornado.y, phase: tornado.phase,
        remaining: tornado.remaining, tribe: tornado.tribe },
      projectilePresent: !!projectile && world.projectiles.includes(projectile) }
  }
  const errorText = error => String(error?.stack ?? error)
  const close = reason => {
    if (finished) return evidence
    finished = true
    evidence.terminal = { reason, turn: world.turn }
    for (const [name, wrapper] of [['beforeTurn', wrappedBefore], ['afterTurn', wrappedAfter]]) {
      try {
        if (clock[name] === originals[name]) continue
        if (clock[name] !== wrapper) evidence.cleanupErrors.push(`${name} ownership changed`)
        else if (descriptors.get(name)) Object.defineProperty(clock, name, descriptors.get(name))
        else delete clock[name]
      } catch (error) { evidence.cleanupErrors.push(`${name}: ${errorText(error)}`) }
    }
    for (const name of Object.keys(originals)) {
      try { if (clock[name] !== originals[name] && !evidence.cleanupErrors.some(row => row.startsWith(name)))
        evidence.cleanupErrors.push(`${name} restoration was not verified`) }
      catch (error) { evidence.cleanupErrors.push(`${name} readback: ${errorText(error)}`) }
    }
    evidence.restored = !evidence.cleanupErrors.length
    return evidence
  }
  const safe = fn => {
    if (finished) return
    try { fn() } catch (error) {
      evidence.errors.push(errorText(error))
      close('error')
    }
  }
  const wrappedBefore = function (...args) {
    let result
    try { result = originals.beforeTurn.apply(this, args) }
    catch (error) {
      evidence.errors.push(errorText(error))
      close('original-before-throw')
      throw error
    }
    safe(() => { before = capture() })
    return result
  }
  const wrappedAfter = function (...args) {
    let result
    try { result = originals.afterTurn.apply(this, args) }
    catch (error) {
      evidence.errors.push(errorText(error))
      close('original-after-throw')
      throw error
    }
    safe(() => {
      const after = capture()
      insist(before && after.turn === before.turn + 1, 'Missing or duplicate turn observation')
      const logs = world.trees.filter(tree => !treeIds.has(tree.id) && tree.model === 11 &&
        tree.x === building.x && tree.z === building.z).map(tree =>
        ({ id: tree.id, x: tree.x, z: tree.z, model: tree.model, logs: tree.logs }))
      for (const tree of world.trees) treeIds.add(tree.id)
      const impact = tornadoWoodImpact(before, after, logs)
      if (impact) evidence.impacts.push(impact)
      evidence.visits.push({ before, after, logs })
      if (impact) close('impact')
      else if (evidence.visits.length === 320)
        throw Error('Declared 320-turn Tornado observation exhausted')
    })
    return result
  }
  try {
    clock.beforeTurn = wrappedBefore
    clock.afterTurn = wrappedAfter
  } catch (error) {
    evidence.errors.push(errorText(error))
    close('installation-error')
    throw error
  }
  return {
    status() {
      return { turn: evidence.terminal?.turn ?? world.turn, impacts: evidence.impacts.length, visits: evidence.visits.length,
        projectileId: projectile?.id ?? null, effectId: owned?.id ?? null, ended: !!owned && !world.effects.includes(owned),
        terminal: evidence.terminal, errors: [...evidence.errors], cleanupErrors: [...evidence.cleanupErrors] }
    },
    finish: () => close('manual'),
  }
}
