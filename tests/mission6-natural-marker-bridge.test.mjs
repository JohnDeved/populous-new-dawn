import { createCampaignFixtureStore } from './support/campaign-fixture.mjs'
import assert from 'node:assert/strict'
import test from 'node:test'
import { cast, command, selectUnit, cancelInteraction, tick, findPath } from '../app/model.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { spellInRange } from '../app/spell-casting.ts'
import { missionData } from '../app/mission-data.ts'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

// Fresh shipped opening and ordinary commands. No task, stock, entity, terrain,
// outcome or script mutation; only the authored AI creates the land connection.
test('ordinary Mission6 stages at marker0 and bridges to marker16 with checkpoint continuity', async () => {
  await loadSceneFixture()
  const { skipIntroduction } = await import('../app/scene-camera-runtime.ts')
  const store = await createCampaignFixtureStore([6])
  assert.equal(store.startMission(6), true)
  const world = store.getWorld(),
    shaman = world.units.find(u => u.team === 'blue' && u.kind === 'shaman'),
    population = team => world.units.filter(u => u.team === team && u.hp > 0).length,
    raid = () => world.campaignAIs[3].tasks.find(t => t.flags & 1 && t.type === 20),
    selectShaman = () => {
      cancelInteraction(world)
      selectUnit(world, shaman.id, false)
      assert.deepEqual(world.selected, [shaman.id])
    }
  while (!(world.flyby.flags & 1) && world.turn < 40) tick(world, 1 / 12)
  if (world.flyby.flags & 1 && world.flyby.warmup > 0)
    skipIntroduction({ world, flybyCamera: { x: 0, y: 0, angle: 0, zoom: 0 }, onChange() {} })
  assert.equal(world.inputMask, 0)
  const vault = world.shrines.find(s => s.reward === 'convertWild')
  selectShaman()
  assert.ok(command(world, { ...vault, id: vault.id }))
  assert.equal(currentPersonOrder(world.buildingOrders, shaman.native)?.model, 33)
  for (let i = 0; i < 3000 && !world.shots.convertWild; i++) tick(world, 1 / 12)
  assert.ok(world.shots.convertWild > 0)
  assert.equal(world.turn, 566)
  const wrap = value => ((((value + 128) % 256) + 256) % 256) - 128
  for (let n = 0; n < 4 && world.shots.convertWild > 0; n++) {
    const wild = world.units
        .filter(
          u =>
            u.team === 'wild' && u.hp > 0 && u.inside === null && spellInRange(world, shaman, 17, u)
        )
        .sort(
          (a, b) =>
            Math.hypot(wrap(a.x - shaman.x), wrap(a.z - shaman.z)) -
            Math.hypot(wrap(b.x - shaman.x), wrap(b.z - shaman.z))
        )[0],
      before = population('blue'),
      stock = world.shots.convertWild
    assert.ok(wild)
    selectShaman()
    assert.ok(cast(world, 'convertWild', { x: wild.x, z: wild.z }))
    assert.equal(world.shots.convertWild, stock - 1)
    for (let i = 0; i < 1200 && population('blue') <= before; i++) tick(world, 1 / 12)
    assert.ok(population('blue') > before)
  }
  assert.equal(world.turn, 580)
  const home = { x: -49, z: -121 },
    markers = missionData(6).level.markers
  assert.equal(findPath(world, shaman, home).length, 0)
  const raidLimit = world.turn + 15000
  while (world.turn < raidLimit && !raid() && world.status === 'playing') tick(world, 1 / 12)
  const task = raid()
  assert.ok(task)
  assert.deepEqual(task.spells, [12, 3, 2])
  assert.equal(task.stagingMarker, markers[0])
  assert.equal(task.spellMarker, 16)
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  const replay = store.getWorld()
  assert.deepEqual(replay, world)
  const phases = new Set(),
    advance = () => {
      tick(world, 1 / 12)
      tick(replay, 1 / 12)
      assert.deepEqual(replay, world)
    }
  const castLimit = world.turn + 6000
  let projectile
  while (world.turn < castLimit && world.status === 'playing' && !projectile) {
    phases.add(task.phase)
    advance()
    projectile = world.projectiles.find(p => p.spell === 'bridge' && p.team === 'green')
  }
  assert.ok(projectile, 'authored marker branch must allocate its real Bridge')
  assert.ok(phases.has(8) && phases.has(21), 'actual group stages before marker casting')
  const green = world.units.find(u => u.id === projectile.caster)
  assert.ok(task.members.includes(green.id))
  assert.equal(world.objectCells.objects.get(green.id), green.native)
  assert.deepEqual(projectile.source, { x: green.x, z: green.z })
  assert.equal(
    ((projectile.destination.x >>> 8) & 254) | (projectile.destination.y & 0xfe00),
    markers[16]
  )
  assert.deepEqual(task.spells, [0, 3, 2])
  assert.equal(task.stagingMarker, -1)
  const terrainLimit = world.turn + 1600
  while (world.turn < terrainLimit && (!world.stats.bridges || world.effects.some(e => e.bridge)))
    advance()
  assert.equal(world.stats.bridges, 1)
  assert.ok(
    !world.effects.some(e => e.bridge),
    'terrain controller must finish, not merely allocate'
  )
  const queryWorld = structuredClone(world),
    queryShaman = queryWorld.units.find(u => u.id === shaman.id)
  assert.ok(
    findPath(queryWorld, queryShaman, home).length > 0,
    'actual terrain connects original Matak land'
  )
  // Current deterministic campaign trace after native ground-cast ownership.
  // The original-source contract is staging/marker16 allocation and real terrain
  // connectivity above, not the former browser-only cast's global RNG schedule.
  assert.equal(world.turn, 7339)
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  assert.deepEqual(store.getWorld(), world)
})
