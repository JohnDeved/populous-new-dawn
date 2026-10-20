import assert from 'node:assert/strict'
import test from 'node:test'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'
import { makeBuilderAnimationScene } from './support/builder-animation-scene.mjs'

const baselines = new Map()
async function inputs() {
  const api = await loadSceneFixture(),
    { stepLiveBuildingAttack } = await import('../app/live-building-combat.ts'),
    { currentPersonOrder } = await import('../app/person-orders.ts'),
    { browserPosition } = await import('../app/model.ts')
  return { api, stepLiveBuildingAttack, currentPersonOrder, browserPosition }
}

function until(api, w, label, condition, limit = 2000) {
  for (let turn = 0; turn < limit && !condition(); turn++) api.tick(w, 1 / 12)
  assert.ok(condition(), `${label} at ${w.turn}`)
}

async function scenario(mode = 'classic') {
  const input = await inputs()
  let baseline = baselines.get(mode)
  if (!baseline) {
    const { createStartedWorld, retainFixtureUnits } = await import('./level-start-fixture.mjs'),
      { api } = input,
      w = createStartedWorld(1, mode)
    // Supplied school, terrain and funding; public training, disguise and
    // command15 own the Spy and phase1 arrival. This is not a campaign/browser run.
    w.manaWorld.gameFlags = 32
    retainFixtureUnits(w, unit => unit.kind === 'shaman')
    w.terrain.fill(3)
    w.terrainVersion++
    const school = api.addBuilding(w, 'blue', 'spyHut', { x: -2, z: 32 }, true,
        { angle: (3 * Math.PI) / 2 }),
      brave = api.addUnit(w, 'blue', 'brave', { x: 7, z: 33 })
    w.selected = [brave.id]
    assert.ok(api.command(w, school))
    until(api, w, 'admitted', () => brave.inside === school.id && !brave.entry?.person.speed)
    w.manaWorld.gameFlags = 0
    school.timer = 65535
    until(api, w, 'trained', () => w.units.some(unit => unit.team === 'blue' && unit.kind === 'spy'))
    const spy = w.units.find(unit => unit.team === 'blue' && unit.kind === 'spy')
    until(api, w, 'departed', () => !spy.path.length)
    w.selected = [spy.id]
    assert.ok(api.disguiseSelectedSpies(w, 1))
    input.api.tick(w, 1 / 12)
    until(api, w, 'disguised', () => spy.native.disguise === 0x40)
    const target = api.addBuilding(w, 'red', 'hut', { x: 20, z: 40 }, true)
    assert.ok(api.command(w, target))
    until(api, w, 'last phase1 wait visit',
      () => spy.native.substate === 1 && spy.native.timer === 1, 600)
    baseline = { w, spyId: spy.id, targetId: target.id }
    baselines.set(mode, baseline)
  }
  const { w, spyId, targetId } = structuredClone(baseline),
    spy = w.units.find(unit => unit.id === spyId),
    target = w.buildings.find(building => building.id === targetId)
  assert.equal(input.currentPersonOrder(w.buildingOrders, spy.native).model, 15)
  return { ...input, w, spy, target, p: spy.native }
}

const pose = p => [p.object, p.draw, p.f1, p.f2, p.timer, p.heading, p.angle, p.turnAngle]
function arm(input) {
  input.stepLiveBuildingAttack(input.w, input.spy)
  assert.equal(input.p.substate, 2)
  assert.ok(input.p.flags2 & 0x40000000)
}

test('00439f86 only arms phase2; 00439fb5 next visit selects object101 and resets its clock', async () => {
  const input = await scenario(),
    { w, spy, p, target, stepLiveBuildingAttack } = input,
    previous = [p.object, p.draw],
    rng = w.randomState
  assert.notEqual(p.object, 136)
  p.f1 = 7
  p.f2 = 3
  arm(input)
  assert.deepEqual([p.object, p.draw, p.f1, p.f2, p.timer], [...previous, 7, 3, 0])
  assert.equal(target.burn, undefined)
  stepLiveBuildingAttack(w, spy)
  // Static original bytes: 00439fd1 object101 -> raw table [136,22];
  // 00439fde/fe2 f2=0/f1=1; descriptor22 step1 and VSTART136 count12
  // give24 at 0043a010, then23 at 0043a014–1a on this same visit.
  assert.deepEqual([p.object, p.draw, p.f1, p.f2, p.timer], [136, 22, 1, 0, 23])
  assert.equal(p.flags2 & 0x40000000, 0)
  assert.equal(p.flags2 & 0x1080, 0x1080)
  assert.equal(p.turnAngle, p.heading)
  assert.equal(spy.heading, Math.PI - p.angle * Math.PI / 1024)
  assert.equal(w.pathfinding.people.has(spy.id), false)
  assert.equal(p.motionGroup, 0)
  assert.deepEqual(spy.path, [])
  assert.equal(w.randomState, rng)
  assert.equal(p.disguise, 0x40)
})

test('later phase2 visits and classic fixture clone normalization never replay entry or reset animation', async () => {
  for (const pending of [true, false]) {
    const input = await scenario(),
      { w, spy, p, target, api, stepLiveBuildingAttack } = input
    arm(input)
    if (!pending) {
      stepLiveBuildingAttack(w, spy)
      p.f1 = 9
      p.f2 = 5
      target.angle += Math.PI / 2
    }
    const restored = api.migrateCheckpoint(structuredClone(w)),
      copy = restored.units.find(unit => unit.id === spy.id),
      enteredHeading = p.heading
    assert.equal(restored.objectCells.objects.get(spy.id), copy.native)
    for (let visit = 0; visit < 3; visit++) {
      stepLiveBuildingAttack(w, spy)
      stepLiveBuildingAttack(restored, copy)
      assert.deepEqual(pose(copy.native), pose(p))
      assert.equal(copy.native.flags2, p.flags2)
      assert.equal(restored.randomState, w.randomState)
      assert.deepEqual(restored.buildingOrders, w.buildingOrders)
      assert.equal(p.timer, (pending ? 23 : 22) - visit)
      assert.deepEqual([p.f1, p.f2], pending ? [1, 0] : [9, 5])
      if (!pending) assert.equal(p.heading, enteredHeading, 'later visits do not reface')
    }
  }
})

for (const pending of [true, false])
  test(`current scalable store Save/Load preserves ${pending ? 'pending entry' : 'entered phase2'} and its continuation`, async () => {
    const input = await scenario('scalable'),
      { w, spy, p, api, stepLiveBuildingAttack } = input,
      { createGameStore } = await import('../app/game-store.ts'),
      store = createGameStore(),
      clock = { animationTime: 0, animationFrame: 0 }
    arm(input)
    if (!pending) {
      stepLiveBuildingAttack(w, spy)
      for (let visit = 0; visit < 6; visit++) api.advanceGame(w, clock, 1 / 24)
      assert.equal(p.object, 136)
      assert.equal(p.draw, 22)
      assert.ok(p.timer > 0 && p.timer < 23)
      assert.ok(p.f2 > 0, 'save an ordinarily advanced frame, not just frame zero')
    }
    assert.deepEqual(w.capacityPolicy, { version: 1, mode: 'scalable' })
    assert.ok(w.objectCells.heads instanceof Float64Array)
    assert.equal(!!(p.flags2 & 0x40000000), pending)
    assert.equal(p.substate, 2)
    assert.equal(p.disguise, 0x40)
    if (pending) {
      assert.notEqual(p.object, 136)
      assert.equal(p.timer, 0)
    }
    const savedPerson = structuredClone(p), savedOrder = structuredClone(input.currentPersonOrder(w.buildingOrders, p))
    // Use the shipping store's current-schema Save and Load boundaries. Node has
    // no IndexedDB here: this is a genuine session save, not disk persistence.
    assert.equal(typeof globalThis.indexedDB, 'undefined')
    store.change(world => Object.assign(world, w))
    assert.equal(await store.saveCheckpoint(), false, 'no disk write is claimed')
    assert.equal(store.hasCheckpoint(), true)
    store.restart()
    assert.equal(store.loadCheckpoint(), true)
    const restored = store.getWorld(), copy = restored.units.find(unit => unit.id === spy.id)
    assert.notEqual(restored, w)
    assert.notEqual(copy.native, p)
    assert.deepEqual(restored.capacityPolicy, w.capacityPolicy)
    assert.ok(restored.objectCells.heads instanceof Float64Array)
    assert.equal(restored.objectCells.objects.get(spy.id), copy.native)
    assert.deepEqual(pose(copy.native), pose(savedPerson))
    for (const field of ['substate', 'flags2', 'disguise', 'state', 'commands', 'commandCursor', 'immediateCommand', 'motionGroup']) {
      assert.ok(Object.hasOwn(savedPerson, field), `actual person field: ${field}`)
      assert.deepEqual(copy.native[field], savedPerson[field], field)
    }
    assert.deepEqual(input.currentPersonOrder(restored.buildingOrders, copy.native), savedOrder)
    const restoredClock = { ...clock }
    for (let visit = 0; visit < 8; visit++) {
      api.advanceGame(w, clock, 1 / 24)
      api.advanceGame(restored, restoredClock, 1 / 24)
      assert.deepEqual(copy.native, p, `same ordinary animation/controller visit ${visit}`)
      assert.deepEqual(restored.buildingOrders, w.buildingOrders)
      assert.equal(restored.randomState, w.randomState)
      assert.equal(restored.turn, w.turn)
    }
    assert.equal(copy.native.object, 136)
    assert.equal(copy.native.flags2 & 0x40000000, 0)
    assert.ok(copy.native.timer < (pending ? 24 : savedPerson.timer))
    assert.ok(copy.native.f2 > (pending ? 0 : savedPerson.f2))
  })

test('0040a980 faces raw rotated INSIDE coordinates across octants, wrap and reverse-facing', async () => {
  const input = await scenario(),
    { w, spy, target, p, stepLiveBuildingAttack, browserPosition } = input,
    { moveObjectInCells } = await import('../app/object-cells.ts'),
    // Hash-verified objs0-2.dat object134 +44: [15,16,17,18].
    // shapes.dat records15–18 bytes0..7:
    // 0505040414171406,0505040416140614,0505040414131423,0505040412142314.
    // 0040a9c2–9fb computes insideByte*64 - originByte*256 + anchor.
    // Raw SHA256: ae1188129d84c266d91a1e9e75d960e99e80cdfd573f85d524742e970a0b2849.
    insideOffsets = [[256, 448], [384, 256], [256, 192], [128, 256]],
    // Exact axis/diagonal results of original 00586074, not nativeAngle() calls.
    rays = [[0, 1024], [1024, 1024], [1024, 0], [1024, -1024],
      [0, -1024], [-1024, -1024], [-1024, 0], [-1024, 1024]]
  arm(input)
  target.object = 134
  for (const anchor of [8192, 65024])
    for (let rotation = 0; rotation < 4; rotation++) {
      // Controlled pose/position matrix at the real public command's entry.
      // This is not a claim that a live building rotates during sabotage.
      target.anchor = { x: anchor, y: anchor }
      target.angle = rotation * Math.PI / 2
      const [ix, iy] = insideOffsets[rotation],
        inside = [(anchor + ix) & 65535, (anchor + iy) & 65535]
      for (let direction = 0; direction < 8; direction++)
        for (const reverse of [false, true]) {
          const [dx, dy] = rays[direction],
            position = { x: (inside[0] - dx) & 65535, y: (inside[1] - dy) & 65535, h: p.h },
            heading = direction * 256,
            angle = (heading + (reverse ? 1024 : 0)) & 2047
          moveObjectInCells(w.objectCells, p, position)
          Object.assign(spy, browserPosition(position))
          p.flags2 = ((p.flags2 & ~0x8000) | 0x40000000 | (reverse ? 0x8000 : 0)) >>> 0
          stepLiveBuildingAttack(w, spy)
          assert.deepEqual([p.heading, p.turnAngle, p.angle], [heading, heading, angle])
          assert.equal(spy.heading, Math.PI - angle * Math.PI / 1024)
          assert.deepEqual([p.object, p.draw, p.f1, p.f2, p.timer], [136, 22, 1, 0, 23])
          assert.equal(p.flags2 & 0x40000000, 0)
        }
    }
})

test('first phase2 direction reaches original first frames in the actual Scene and pause is inert', async () => {
  const input = await scenario(),
    { w, spy, p, stepLiveBuildingAttack } = input,
    fixture = await makeBuilderAnimationScene(w),
    { default: units } = await import('../app/original-units.json')
  try {
    arm(input)
    w.paused = true
    const armed = structuredClone(w)
    fixture.advance(1 / 12)
    fixture.render()
    assert.deepEqual(w, armed, 'pause leaves the pending entry unconsumed')
    w.paused = false
    stepLiveBuildingAttack(w, spy)
    for (let direction = 0; direction < 8; direction++) {
      fixture.scene.cameraBearing = (p.angle + direction * 256 + 0x380) * Math.PI / 1024
      fixture.render()
      const group = fixture.scene.unitMeshes.get(spy.id),
        call = fixture.personCalls.find(args => args[0] === group)
      assert.equal(call[5], 0)
      assert.equal(units.frames[group.userData.frame].source, 592 + 12 * direction,
        'raw VSTART136–143 starts, not candidate packed frame indices')
      assert.equal(group.userData.frameFlip, direction > 4)
      assert.equal(group.userData.draw, 22)
      assert.equal(group.userData.owner, 1)
    }
    w.paused = true
    const entered = structuredClone(w)
    for (let visit = 0; visit < 3; visit++) {
      fixture.advance(1 / 12)
      fixture.render()
    }
    assert.deepEqual(w, entered)
  } finally {
    fixture.close()
  }
})

test('public cancellation before entry retires that command; a fresh command owns a fresh entry', async () => {
  const input = await scenario(),
    { api, w, spy, target, p, currentPersonOrder, stepLiveBuildingAttack } = input
  arm(input)
  const oldOrder = currentPersonOrder(w.buildingOrders, p)
  assert.ok(api.command(w, { x: spy.x - 12, z: spy.z }))
  stepLiveBuildingAttack(w, spy)
  assert.notEqual(currentPersonOrder(w.buildingOrders, spy.native ?? p), oldOrder)
  assert.notEqual((spy.native ?? p).object, 136)
  assert.equal(target.burn, undefined)
  assert.ok(api.command(w, target))
  until(api, w, 'fresh final wait', () => spy.native.substate === 1 && spy.native.timer === 1, 600)
  const renewed = { ...input, p: spy.native }
  renewed.p.f1 = 8
  renewed.p.f2 = 4
  arm(renewed)
  assert.notEqual(renewed.p.object, 136)
  stepLiveBuildingAttack(w, spy)
  assert.deepEqual([renewed.p.object, renewed.p.draw, renewed.p.f1, renewed.p.f2, renewed.p.timer],
    [136, 22, 1, 0, 23])
})

test('target removal while phase2 entry is armed aborts before source136 can be selected', async () => {
  const input = await scenario(),
    { w, spy, target, p, currentPersonOrder, stepLiveBuildingAttack } = input
  arm(input)
  const order = currentPersonOrder(w.buildingOrders, p)
  w.buildings = w.buildings.filter(building => building !== target)
  stepLiveBuildingAttack(w, spy)
  assert.notEqual(currentPersonOrder(w.buildingOrders, spy.native ?? p), order)
  assert.notEqual((spy.native ?? p).object, 136)
  assert.equal(target.burn, undefined)
})
