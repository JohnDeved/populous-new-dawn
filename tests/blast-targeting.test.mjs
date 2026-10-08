import assert from 'node:assert/strict'
import test from 'node:test'
import { addUnit, cast, createWorld, nativePosition } from '../app/model.ts'
import { processProjectiles } from '../app/spell-effects-runtime.ts'
import { createLivePerson } from '../app/live-people.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { browserPosition } from '../app/world-coordinates.ts'

// Controlled contract fixtures; the ordinary moving-person pointer journey is separate.
function scenario() {
  const world = createWorld()
  world.units = []
  world.buildings = []
  world.trees = []
  world.shrines = []
  world.terrain.fill(3)
  world.terrainVersion++
  const shaman = addUnit(world, 'blue', 'shaman', { x: -8, z: 0 })
  const bystander = addUnit(world, 'red', 'brave', { x: 0, z: 0 })
  const target = addUnit(world, 'red', 'warrior', { x: 0.25, z: 0.25 })
  return { world, shaman, bystander, target }
}

test('a direct Blast retains the exact person and follows motion during windup', () => {
  const { world, target } = scenario()
  assert.ok(cast(world, 'blast', target, target.id))
  const shot = world.projectiles[0]
  assert.equal(shot.blastTarget?.personId, target.id)
  assert.deepEqual(shot.destination, nativePosition(world, target), 'direct aim is not cell-centered')
  world.units.reverse()
  target.x += 1
  processProjectiles(world)
  assert.equal(shot.blastTarget.personId, target.id)
  assert.deepEqual(shot.blastTarget.destination, nativePosition(world, target))
  assert.deepEqual(shot.target, { x: target.x, z: target.z })
})

function fire(world, shot) {
  for (let visits = 0; shot.phase === 'windup' && visits < 6; visits++) processProjectiles(world)
  assert.equal(shot.phase, 'flying')
}

test('Blast follows the same moving person in flight and updates the later impact point', () => {
  const { world, target } = scenario()
  assert.ok(cast(world, 'blast', target, target.id))
  const shot = world.projectiles[0]
  fire(world, shot)
  target.x += 0.5
  processProjectiles(world)
  assert.deepEqual(shot.destination, nativePosition(world, target))
  assert.equal(shot.blastTarget.shotPersonId, target.id)
  for (let visits = 0; shot.phase !== 'arrived' && visits < 10; visits++) processProjectiles(world)
  assert.equal(shot.phase, 'arrived')
  const arrival = { ...shot.position }
  target.x += 1
  processProjectiles(world)
  assert.equal(world.projectiles.length, 0)
  const wave = world.effects.find(effect => effect.wave).wave
  const impact = nativePosition(world, target)
  assert.deepEqual({ x: wave.x, y: wave.y }, { x: impact.x & 65535, y: impact.y & 65535 },
    'wave uses the later parent spell point')
  assert.notEqual(wave.x, arrival.x, 'parent spell continues tracking through the impact visit')
})

test('loss in windup or flight retains the last destination and never acquires the nearby person', () => {
  for (const phase of ['windup', 'flying']) {
    const { world, target, bystander } = scenario()
    assert.ok(cast(world, 'blast', target, target.id))
    const shot = world.projectiles[0]
    target.x += 0.5
    processProjectiles(world)
    if (phase === 'flying') fire(world, shot)
    const last = { ...shot.blastTarget.destination }
    target.hp = 0
    bystander.x = 3
    processProjectiles(world)
    assert.equal(shot.blastTarget.personId, null)
    assert.equal(shot.blastTarget.shotPersonId, null)
    assert.deepEqual(shot.blastTarget.destination, last)
    if (phase === 'windup') fire(world, shot)
    assert.deepEqual(shot.destination, last)
    assert.deepEqual(shot.target, browserPosition(last))
  }
})

test('parent and shot ownership remain independent after one identity is cleared', () => {
  const { world, target } = scenario()
  assert.ok(cast(world, 'blast', target, target.id))
  const shot = world.projectiles[0]
  fire(world, shot)
  shot.blastTarget.personId = null // Supporting owner-boundary fixture, not an ordinary episode.
  const parent = { ...shot.blastTarget.destination }
  target.x += 1
  processProjectiles(world)
  assert.deepEqual(shot.blastTarget.destination, parent)
  assert.deepEqual(shot.destination, nativePosition(world, target))
})

test('ground aim, other spells and the bit-set mode do not acquire person identity', () => {
  for (const [spell, gameFlags, direct] of [['blast', 0, false], ['blast', 32, true], ['lightning', 0, true]]) {
    const { world, target } = scenario()
    world.manaWorld.gameFlags = gameFlags
    world.shots[spell] = 1
    assert.ok(cast(world, spell, target, direct ? target.id : undefined))
    const shot = world.projectiles[0], destination = { ...shot.destination }
    assert.equal(shot.blastTarget, undefined)
    target.x += 2
    processProjectiles(world)
    assert.deepEqual(shot.destination, destination)
  }
})

test('direct-person eligibility does not depend on allegiance and uses native airborne pose', () => {
  const { world, target } = scenario()
  target.team = 'blue'
  target.flight = createLivePerson(world, target)
  target.flight.h += 700
  assert.ok(cast(world, 'blast', target, target.id))
  const shot = world.projectiles[0]
  assert.equal(shot.destination.h, target.flight.h)
  target.team = 'green'
  target.flight.x += 64
  target.flight.h += 200
  processProjectiles(world)
  assert.equal(shot.blastTarget.personId, target.id)
  assert.equal(shot.blastTarget.destination.h, target.flight.h)
  assert.deepEqual(shot.target, browserPosition(target.flight))
  target.flight.flags2 |= 1
  processProjectiles(world)
  assert.equal(shot.blastTarget.personId, null)
})

test('direct aim preserves payment/RNG and rejects out-of-range targets before payment', () => {
  const direct = scenario(), ground = scenario()
  assert.ok(cast(direct.world, 'blast', direct.target, direct.target.id))
  assert.ok(cast(ground.world, 'blast', ground.target))
  for (const key of ['shots', 'manaTribes', 'castingTribes', 'stats', 'randomState', 'cosmeticRandom'])
    assert.deepEqual(direct.world[key], ground.world[key], key)
  const { world, target } = scenario(), before = structuredClone(world)
  target.x += 80
  assert.equal(cast(world, 'blast', target, target.id), false)
  assert.equal(world.projectiles.length, 0)
  for (const key of ['shots', 'manaTribes', 'stats', 'randomState', 'cosmeticRandom'])
    assert.deepEqual(world[key], before[key], key)
})

test('current saves preserve target ownership and old point-only saves stay point-only', () => {
  const { world, target } = scenario()
  assert.ok(cast(world, 'blast', target, target.id))
  fire(world, world.projectiles[0])
  const saved = migrateCheckpoint(structuredClone(world))
  assert.deepEqual(saved.projectiles, world.projectiles)
  target.x += 0.5
  saved.units.find(person => person.id === target.id).x += 0.5
  processProjectiles(world)
  processProjectiles(saved)
  assert.deepEqual(saved.projectiles, world.projectiles)
  assert.equal(saved.randomState, world.randomState)
  const legacy = structuredClone(world)
  delete legacy.projectiles[0].blastTarget
  const point = { ...legacy.projectiles[0].destination }
  migrateCheckpoint(legacy)
  legacy.units.find(person => person.id === target.id).x += 1
  processProjectiles(legacy)
  assert.equal(legacy.projectiles[0].blastTarget, undefined)
  assert.deepEqual(legacy.projectiles[0].destination, point)
})

test('removed IDs never select an overlapping replacement and missing stock remains rejected', () => {
  const { world, target, bystander } = scenario()
  assert.ok(cast(world, 'blast', target, target.id))
  const shot = world.projectiles[0]
  fire(world, shot)
  const last = { ...shot.destination }
  world.units = world.units.filter(unit => unit !== target)
  bystander.x = target.x
  bystander.z = target.z
  processProjectiles(world)
  assert.equal(shot.blastTarget.personId, null)
  assert.equal(shot.blastTarget.shotPersonId, null)
  assert.deepEqual(shot.destination, last)
  const unavailable = scenario()
  unavailable.world.shots.blast = 0
  assert.equal(cast(unavailable.world, 'blast', unavailable.target, unavailable.target.id), false)
  assert.equal(unavailable.world.projectiles.length, 0)
})
