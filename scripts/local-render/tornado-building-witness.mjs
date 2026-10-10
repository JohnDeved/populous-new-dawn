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

// Plain-data contract. Net work loss alone never attributes an impact to Tornado.
export function tornadoWoodImpact(before, after, logs) {
  const loss = before.building.work - after.building.work
  if (!loss && !logs.length) return null
  insist(before.building.hp > 0, 'Impact target was already retired')
  insist(before.competing.length === 0 && after.competing.length === 0,
    'Competing damage/timber work prevents Tornado attribution')
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
  const projectile = world.projectiles.find(p => p.id === expected.projectileId)
  insist(building && shaman && projectile?.spell === 'tornado' && projectile.caster === shaman.id,
    'Actual target, original caster and accepted Tornado projectile required')
  insist(!world.effects.some(f => f.tornado), 'Earlier Tornado prevents effect attribution')
  const originalIds = new Set(world.effects.map(f => f.id))
  const treeIds = new Set(world.trees.map(tree => tree.id))
  const evidence = { expected, initialTurn: world.turn, visits: [], impacts: [], errors: [],
    cleanupErrors: [], restored: false }
  const descriptors = new Map(['beforeTurn', 'afterTurn'].map(name =>
    [name, Object.getOwnPropertyDescriptor(clock, name)]))
  const originals = { beforeTurn: clock.beforeTurn, afterTurn: clock.afterTurn }
  insist(Object.values(originals).every(fn => typeof fn === 'function'), 'Real turn callbacks required')
  let before = null, owned = null, finished = false
  const checkOwner = () => {
    insist(currentScene() === scene && scene.world === world && store.getWorld() === world &&
      scene.gameClock === clock, 'Scene/store/clock ownership changed')
    insist(world.units.find(u => u.id === shaman.id) === shaman && shaman.hp > 0,
      'Original Shaman lost during observation')
    const target = world.buildings.find(b => b.id === building.id)
    insist(!target || target === building, 'Building identity replaced during observation')
  }
  const capture = () => {
    checkOwner()
    const fresh = world.effects.filter(f => f.tornado && !originalIds.has(f.id))
    if (!owned && fresh.length) {
      insist(fresh.length === 1 && fresh[0].tornado.tribe === 0, 'Ambiguous Tornado ownership')
      owned = fresh[0]
    }
    const model = buildingModel(building), life = rules.buildingLife[model]
    const work = building.damageState?.plan.remaining ??
      Math.trunc(Math.min(building.progress, building.hp / buildingHp(building.kind)) * life)
    const competing = [
      ...world.effects.filter(f => f !== owned && harmful.has(f.kind)).map(f => `effect:${f.id}`),
      ...world.projectiles.filter(p => p.id !== projectile.id).map(p => `projectile:${p.id}`),
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
      projectilePresent: world.projectiles.includes(projectile) }
  }
  const safe = fn => {
    try { fn() } catch (error) {
      if (evidence.errors.length < 8) evidence.errors.push(String(error?.stack ?? error))
    }
  }
  const wrappedBefore = function (...args) {
    const result = originals.beforeTurn.apply(this, args)
    safe(() => { before = capture() })
    return result
  }
  const wrappedAfter = function (...args) {
    try { return originals.afterTurn.apply(this, args) }
    finally { safe(() => {
      const after = capture()
      insist(before && after.turn === before.turn + 1, 'Missing or duplicate turn observation')
      insist(evidence.visits.length < 320, 'Declared 320-turn Tornado observation exhausted')
      const logs = world.trees.filter(tree => !treeIds.has(tree.id) && tree.model === 11 &&
        tree.x === building.x && tree.z === building.z).map(tree =>
        ({ id: tree.id, x: tree.x, z: tree.z, model: tree.model, logs: tree.logs }))
      for (const tree of world.trees) treeIds.add(tree.id)
      const impact = tornadoWoodImpact(before, after, logs)
      if (impact) evidence.impacts.push(impact)
      evidence.visits.push({ before, after, logs })
    }) }
  }
  clock.beforeTurn = wrappedBefore
  clock.afterTurn = wrappedAfter
  return {
    status() {
      checkOwner()
      return { turn: world.turn, impacts: evidence.impacts.length, visits: evidence.visits.length,
        effectId: owned?.id ?? null, ended: !!owned && !world.effects.includes(owned),
        errors: [...evidence.errors] }
    },
    finish() {
      if (finished) return evidence
      finished = true
      for (const [name, wrapper] of [['beforeTurn', wrappedBefore], ['afterTurn', wrappedAfter]]) {
        if (clock[name] !== wrapper) evidence.cleanupErrors.push(`${name} ownership changed`)
        else if (descriptors.get(name)) Object.defineProperty(clock, name, descriptors.get(name))
        else delete clock[name]
      }
      evidence.restored = !evidence.cleanupErrors.length &&
        Object.keys(originals).every(name => clock[name] === originals[name])
      return evidence
    },
  }
}
