import { createCampaignFixtureStore } from './support/campaign-fixture.mjs'
import assert from 'node:assert/strict'
import test from 'node:test'
import { browserPosition, cast, command, createWorld, select, tick } from '../app/model.ts'
import { vaultPoints, vaultShapePose } from '../app/vault-geometry.ts'
import { buildingFootprintCells } from '../app/building-shapes.ts'
import { currentPersonOrder, personReachedOrder } from '../app/person-orders.ts'
import { collisionWorld, stepLiveImpulse } from '../app/live-people.ts'
import { personStepCollision } from '../app/person-collision.ts'
import { syncLandscapeObjects } from '../app/world-terrain-runtime.ts'
import { emitBlastWave, stepLiveBlastWave } from '../app/spell-effects-runtime.ts'
import { liveBuildingAttackTarget } from '../app/live-building-combat.ts'
import { liveBuildingModel, liveBuildingShape } from '../app/live-building-shapes.ts'
import { processVaultTask } from '../app/vault.ts'
import { randomPersonSpeed } from '../app/person-state.ts'
import { short } from '../app/native-math.ts'
import { finishLevelStart } from './level-start-fixture.mjs'

const cell = p => ((p.y & 65535) >>> 9) * 128 + ((p.x & 65535) >>> 9)
const person = world => world.units.find(u => u.team === 'blue' && u.kind === 'shaman')
const head = world => world.shrines.find(s => s.kind === 'vault')
const footprint = vault => new Set(buildingFootprintCells(vaultShapePose(vault)))
const step = world => tick(world, 1 / 12)
const noVehicle = () => { throw new Error('Unexpected transport in on-foot witness') }

function openFirstMissionBridge(world) {
  // Earn the actual prerequisite. M1's Vault island is not initially reachable.
  const brave = world.units.find(u => u.team === 'blue' && u.kind === 'brave')
  const bridge = world.shrines.find(s => s.kind === 'bridge')
  world.selected = [brave.id]
  assert.equal(command(world, bridge), true)
  for (let turns = 0; turns < 720 && world.shots.bridge < 3; turns++) step(world)
  assert.ok(world.shots.bridge >= 3)
  select(world, 'shaman')
  assert.equal(command(world, { x: 0, z: 20 }), true)
  for (let turns = 0; turns < 120; turns++) step(world)
  assert.equal(cast(world, 'bridge', { x: 0, z: 4 }), true)
  for (let turns = 0; turns < 72; turns++) step(world)
  assert.equal(command(world, { x: 0, z: 0 }), true)
  for (let turns = 0; turns < 108; turns++) step(world)
  const guard = world.units.find(u => u.team === 'red' && u.z > -10)
  assert.ok(guard)
  assert.equal(cast(world, 'blast', { x: guard.x + 1, z: guard.z }), true)
  for (let turns = 0; turns < 24; turns++) step(world)
  assert.equal(world.units.includes(guard), false)
}

async function approach(mission, side = false) {
  const store = await createCampaignFixtureStore([mission])
  assert.equal(store.startMission(mission), true)
  const world = finishLevelStart(store.getWorld())
  assert.equal(world.capacityPolicy.mode, 'scalable')
  assert.ok(world.objectCells.heads instanceof Float64Array)
  if (mission === 1) openFirstMissionBridge(world)
  const shaman = person(world), vault = head(world), points = vaultPoints(vault)
  const dx = short(points.inside.x - points.outside.x), dy = short(points.inside.y - points.outside.y)
  const staging = {
    x: (points.inside.x + (side ? -dy : dx) * 1.5) & 65535,
    y: (points.inside.y + (side ? dx : dy) * 1.5) & 65535,
  }
  select(world, 'shaman')
  assert.equal(command(world, browserPosition(staging)), true)
  const movement = structuredClone(currentPersonOrder(world.buildingOrders, shaman.native))
  assert.equal(movement.model, 3)
  // Ordinary movement owns its descriptor radius (Shaman160 + point56), not
  // Vault arrival's <=11 square. Wait for that actual order to complete.
  for (let turns = 0; turns < 2000 && currentPersonOrder(world.buildingOrders, shaman.native); turns++) step(world)
  assert.equal(currentPersonOrder(world.buildingOrders, shaman.native), undefined)
  assert.equal(personReachedOrder(shaman.native, movement, noVehicle), true)
  assert.equal(footprint(vault).has(cell(shaman.native)), false)
  select(world, 'shaman')
  assert.equal(command(world, vault), true)
  const order = currentPersonOrder(world.buildingOrders, shaman.native)
  assert.equal(order.model, 33)
  assert.equal(order.a, vault.id)
  return { store, world, shaman, vault, points }
}

function reachPrayer(state) {
  const { world, shaman, vault } = state, mask = footprint(vault)
  let samples = 0
  for (let turns = 0; turns < 1200; turns++) {
    step(world)
    const p = shaman.native
    assert.ok(shaman.hp > 0)
    assert.equal(currentPersonOrder(world.buildingOrders, p)?.model, 33)
    assert.equal(vault.model, 154, 'this is closed approach/prayer, not intentional open entry')
    assert.equal(mask.has(cell(p)), false, `closed approach entered the Vault at turn ${world.turn}`)
    samples++
    if (p.commandPhase === 2 && vault.work > 0) return samples
  }
  assert.fail('ordinary approach did not reach prayer within 1,200 turns')
}

test('ordinary rear/side prayer approaches and the M1 uint16 seam avoid the closed Vault', async t => {
  for (const [mission, side] of [[3, false], [3, true], [1, false]]) {
    await t.test(`mission ${mission}, ${side ? 'side' : 'rear'}`, async () => {
      const state = await approach(mission, side)
      const samples = reachPrayer(state)
      assert.deepEqual({ x: state.shaman.native.goalX, y: state.shaman.native.goalY }, state.points.outside)
      t.diagnostic(JSON.stringify({ mission, side, turn: state.world.turn, samples }))
    })
  }
})

test('Vault footprint registration follows the modeled top-level body, not trigger activity or hidden links', () => {
  const world = createWorld(3), vault = head(world), cells = footprint(vault)
  const assertRegistered = () => {
    for (const i of cells) {
      assert.equal(world.land.flags[i] & 512, 512)
      assert.equal(world.land.buildingIds[i] & 1023, vault.id)
    }
    assert.equal(world.buildingFootprints.has(vault.id), true)
  }
  assertRegistered()
  const actor = person(world).native
  assert.equal(personStepCollision(collisionWorld(world), actor, vaultPoints(vault).inside), 1)
  vault.active = false
  vault.linkedShrine = { ...vault, linkedShrine: undefined, id: 800, x: vault.x + 40 }
  for (const model of [152, 153, 155]) {
    vault.model = model
    syncLandscapeObjects(world)
    assertRegistered()
    assert.equal(world.buildingFootprints.has(800), false)
  }
  vault.model = 0
  syncLandscapeObjects(world)
  for (const i of cells) {
    assert.equal(world.land.flags[i] & 512, 0)
    assert.equal(world.land.buildingIds[i] & 1023, 0)
  }
  assert.equal(world.buildingFootprints.has(vault.id), false)
  vault.model = 154
  vault.x += 16
  syncLandscapeObjects(world)
  for (const i of cells) assert.equal(world.land.flags[i] & 512, 0)
  const moved = footprint(vault)
  for (const i of moved) assert.equal(world.land.buildingIds[i] & 1023, vault.id)
  world.shrines = world.shrines.filter(s => s !== vault)
  syncLandscapeObjects(world)
  for (const i of moved) assert.equal(world.land.flags[i] & 512, 0)
})

test('ordinary open entry, current in-session Load, exit/departure and interrupted inside owners retain collision lifecycle', async t => {
  const state = await approach(3), { store, world, shaman, vault, points } = state
  reachPrayer(state)
  const mask = footprint(vault), observed = new Set(), phaseEntries = new Map()
  let insideWorld, restored, completed = false
  for (let turns = 0; turns < 3000; turns++) {
    const entering = shaman.native
    if ([4, 7, 9].includes(entering.commandPhase) && entering.flags2 & 0x40000000 && !phaseEntries.has(entering.commandPhase)) {
      phaseEntries.set(entering.commandPhase, structuredClone(world))
      // Retain the earned current-store phase9 entry for the supplied occupied
      // leave-cell probe below, without injecting a research world into Save.
      if (entering.commandPhase === 9) {
        assert.deepEqual(store.getWorld(), world)
        await store.saveCheckpoint()
      }
    }
    step(world)
    if (restored) step(restored)
    const p = shaman.native, order = p && currentPersonOrder(world.buildingOrders, p)
    if (order?.model !== 33) { completed = true; break }
    if (p.flags2 & 0x40000000) continue
    if ([4, 7, 9].includes(p.commandPhase)) {
      // Entry dispatch is direct (004e9dd0). Subsequent shared obstacle
      // recovery may replan, so do not assert route-free movement forever.
      if (!observed.has(p.commandPhase))
        assert.equal(p.motionGroup, 0, `phase ${p.commandPhase} dispatches direct movement`)
      assert.equal(p.flags4 & 0x10007, p.commandPhase === 4 ? 2 : 0)
      assert.deepEqual({ x: p.goalX, y: p.goalY }, p.commandPhase === 4 ? points.inside : p.commandPhase === 7 ? points.outside : points.leave)
      if (p.commandPhase === 9)
        assert.deepEqual([p.anchorX, p.anchorY, p.anchorFlags], [(points.leave.x & 0xfe00) + 256, (points.leave.y & 0xfe00) + 256, 0])
      observed.add(p.commandPhase)
    }
    if (!insideWorld && p.commandPhase === 4 && mask.has(cell(p))) {
      assert.equal(vault.model, 153)
      assert.equal(personStepCollision(collisionWorld(world), p, points.inside), 0)
      assert.equal(personStepCollision(collisionWorld(world), { ...p, workTarget: 0 }, points.inside), 1)
      insideWorld = structuredClone(world)
      await store.saveCheckpoint()
      assert.equal(store.loadCheckpoint(), true)
      restored = store.getWorld()
      assert.equal(restored.capacityPolicy.mode, 'scalable')
      assert.ok(restored.objectCells.heads instanceof Float64Array)
      syncLandscapeObjects(restored)
      assert.deepEqual(restored.buildingFootprints, world.buildingFootprints)
      assert.deepEqual(restored.land.buildingIds, world.land.buildingIds)
    }
  }
  assert.equal(completed, true)
  assert.deepEqual(observed, new Set([4, 7, 9]))
  assert.ok(insideWorld)
  assert.equal(vault.uses, 1)
  assert.equal(mask.has(cell(shaman.native)), false)
  assert.equal(shaman.native.flags4 & 0x10007, 0)
  assert.deepEqual(person(restored), shaman)
  assert.deepEqual(head(restored), vault)
  assert.equal(restored.randomState, world.randomState)
  assert.deepEqual(restored.buildingOrders, world.buildingOrders)

  function assertEntryDispatch(w, phase, expectedAnchor) {
    const u = person(w), p = u.native, beforeRng = w.randomState
    const rng = { randomState: beforeRng }, speed = randomPersonSpeed(rng, p)
    const expectedGoal = phase === 4 ? points.inside : phase === 7 ? points.outside : points.leave
    const writes = []
    let goalX = p.goalX
    Object.defineProperty(p, 'goalX', {
      configurable: true, enumerable: true,
      get: () => goalX,
      set: value => {
        goalX = value
        writes.push({ rng: w.randomState, access: p.flags4 & 0x10007,
          anchor: [p.anchorX, p.anchorY, p.anchorFlags] })
      },
    })
    assert.equal(processVaultTask(w, u), 0)
    Object.defineProperty(p, 'goalX', { value: goalX, writable: true, enumerable: true, configurable: true })
    assert.equal(writes.length, 1, 'one direct destination, not a planned route')
    assert.equal(writes[0].rng, phase === 9 ? rng.randomState : beforeRng,
      'phase9 recovers before dispatch; phase4/7 dispatch before recovery')
    assert.equal(writes[0].access, phase === 4 ? 2 : 0)
    assert.equal(w.randomState, rng.randomState, 'one recovery speed draw, no extra RNG')
    assert.equal(p.speed, speed)
    assert.equal(p.motionGroup, 0)
    assert.deepEqual([p.goalX, p.goalY], [expectedGoal.x, expectedGoal.y])
    if (expectedAnchor)
      assert.deepEqual(writes[0].anchor, [(expectedAnchor.x & 0xfe00) + 256, (expectedAnchor.y & 0xfe00) + 256, 0])
  }
  await t.test('earned phase entries retain exact direct/recovery ordering and departure anchor', () => {
    assert.deepEqual([...phaseEntries.keys()], [4, 7, 9])
    for (const [phase, entry] of phaseEntries)
      assertEntryDispatch(structuredClone(entry), phase, phase === 9 ? points.leave : undefined)
  })
  await t.test('supplied occupied leave cell corrects only the idle anchor and survives current Load', async () => {
    assert.equal(store.loadCheckpoint(), true)
    const w = store.getWorld(), h = head(w)
    assert.deepEqual(w, phaseEntries.get(9))
    const id = 900
    assert.equal([...w.units, ...w.buildings, ...w.shrines].some(o => o.id === id), false)
    // Supplied physical body at the already-earned leave point, not a naturally
    // constructed second Vault. Keep its unique packed handle and actual mask.
    const other = { ...structuredClone(h), ...browserPosition(points.leave), id, model: 154, active: false }
    w.shrines.push(other)
    syncLandscapeObjects(w)
    assert.equal(w.land.buildingIds[cell(points.leave)] & 1023, id)
    const outside = vaultPoints(other).outside
    await store.saveCheckpoint()
    assert.equal(store.loadCheckpoint(), true)
    const loaded = store.getWorld()
    assertEntryDispatch(w, 9, outside)
    assertEntryDispatch(loaded, 9, outside)
    assert.deepEqual(person(loaded), person(w))
    assert.deepEqual(loaded.buildingOrders, w.buildingOrders)
    assert.equal(loaded.randomState, w.randomState)
    for (let turns = 0; turns < 12; turns++) { step(w); step(loaded) }
    assert.deepEqual(person(loaded), person(w))
    assert.deepEqual(head(loaded), head(w))
    assert.equal(loaded.randomState, w.randomState)
  })

  await t.test('replacement while inside clears access and recovers outside', () => {
    const w = structuredClone(insideWorld), u = person(w), h = head(w)
    select(w, 'shaman')
    assert.equal(command(w, browserPosition(points.leave)), true)
    assert.equal(u.native.flags4 & 0x10007, 0)
    for (let turns = 0; turns < 400 && (mask.has(cell(u.native)) || currentPersonOrder(w.buildingOrders, u.native)); turns++) step(w)
    assert.equal(mask.has(cell(u.native)), false)
    assert.notEqual(currentPersonOrder(w.buildingOrders, u.native)?.model, 33)
    assert.equal(h.uses, 0)
    for (const i of mask) assert.equal(w.land.buildingIds[i] & 1023, h.id)
  })
  await t.test('supplied impulse recovery inside resolves the same Vault body geometry', () => {
    const w = structuredClone(insideWorld), u = person(w), p = u.native
    // Explicit supplied recovery/impulse boundary; ordinary entry above owns the
    // position, task and body. This is not a naturally inflicted spell episode.
    p.flags4 &= ~0x10007
    p.flags2 |= 0x20000800
    p.motionTimer = 0
    p.speed = 40
    u.flight = p
    stepLiveImpulse(w, u)
    assert.equal(w.objectCells.objects.get(u.id), p)
    assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y))
  })
  await t.test('supplied death inside retires the task without unregistering the Vault', () => {
    const w = structuredClone(insideWorld), u = person(w), h = head(w)
    u.hp = 0
    for (let turns = 0; turns < 4; turns++) step(w)
    // Ordinary zero-health cleanup removes the person, rather than applying a
    // live replacement-state initializer to this retired object reference.
    assert.equal(w.units.includes(u), false)
    assert.equal(w.objectCells.objects.has(u.id), false)
    assert.notEqual(u.native && currentPersonOrder(w.buildingOrders, u.native)?.model, 33)
    assert.equal(h.uses, 0)
    for (const i of mask) assert.equal(w.land.buildingIds[i] & 1023, h.id)
  })
})


test('registered Vault blast lookup remains a neutral shake-only body, not an attack target', () => {
  const world = finishLevelStart(createWorld(3)), vault = head(world), before = structuredClone(vault)
  const wave = emitBlastWave(world, vault, 'blue')
  for (let pass = 0; pass < 3; pass++) stepLiveBlastWave(world, wave)
  assert.equal(vault.shake, 1)
  assert.equal(vault.shakeOrigin, ((wave.x >>> 8) & 254) | (wave.y & 0xfe00))
  assert.deepEqual({ ...vault, shake: undefined, shakeOrigin: undefined },
    { ...before, shake: undefined, shakeOrigin: undefined })
  assert.equal(world.buildings.some(b => b.id === vault.id), false)
  assert.equal(liveBuildingModel(world, vault.id), 18)
  assert.deepEqual(liveBuildingShape(world, vault.id), vaultShapePose(vault))
  const shaman = person(world)
  select(world, 'shaman')
  assert.equal(command(world, vault), true)
  const order = currentPersonOrder(world.buildingOrders, shaman.native)
  // Explicit attack-command probe, not an ordinary user-generated attack.
  const inside = vaultPoints(vault).inside
  order.model = 19
  order.a = ((inside.x >>> 8) & 254) | (inside.y & 0xfe00)
  assert.equal(liveBuildingAttackTarget(world, shaman.native), undefined)
})
