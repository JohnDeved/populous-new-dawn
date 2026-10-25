import assert from 'node:assert/strict'
import test from 'node:test'
import witness from './fixtures/follower-source-witness.json' with { type: 'json' }
import { loadSceneFixture } from './support/bloodlust-scene.mjs'
import { makeBuilderAnimationScene } from './support/builder-animation-scene.mjs'

async function inputs() {
  const api = await loadSceneFixture(),
    { default: units } = await import('../app/original-units.json'),
    { default: rules } = await import('../app/original-rules.json'),
    { createLivePerson } = await import('../app/live-people.ts'),
    { followerNativeDirections, nativeSpriteHidden } = await import('../app/follower-appearance.ts')
  return { api, units, rules, createLivePerson, followerNativeDirections, nativeSpriteHidden }
}

async function sceneCase(kind = 'spy') {
  const input = await inputs(),
    world = input.api.createWorld(1)
  world.units = []
  world.selected = []
  world.buildings = []
  world.shrines = []
  world.trees = []
  const unit = input.api.addUnit(world, 'blue', kind, { x: 0, z: 0 }),
    fixture = await makeBuilderAnimationScene(world)
  return { ...input, world, unit, fixture }
}

function setPose(input, source, draw) {
  const { world, unit } = input
  unit.native = input.createLivePerson(world, unit)
  Object.assign(unit.native, { commandStatus: 3, object: source, draw, f2: 0 })
  unit.heading = Math.PI
}

function render(input, direction = 0) {
  // Original 004673b0 directional expression, independent of spriteDirection().
  input.fixture.scene.cameraBearing = ((direction * 256 + 0x380) * Math.PI) / 1024
  const before = structuredClone(input.world)
  input.fixture.render()
  assert.deepEqual(input.world, before, 'the actual Scene consumer never advances gameplay')
  const group = input.fixture.scene.unitMeshes.get(input.unit.id),
    call = input.fixture.personCalls.find(args => args[0] === group)
  return { group, call }
}

function assertNativeFrame(input, source, direction, phase, draw) {
  const { group, call } = render(input, direction),
    original = witness.sources[source][direction]
  assert.equal(group.visible, true)
  assert.ok(call)
  assert.equal(call[2], input.units.followerSources[source])
  assert.equal(call[3], 0)
  assert.equal(call[4], false)
  assert.equal(call[5], phase)
  assert.equal(group.userData.draw, draw)
  assert.equal(group.userData.missingNativeSource, undefined)
  assert.equal(group.userData.nativeSpriteHidden, false)
  assert.equal(input.units.frames[group.userData.frame].source, original.frames[phase])
  assert.equal(group.userData.frameFlip, original.flip)
  assert.ok(group.userData.layers.some(layer => layer.visible))
  return group
}

test('all original model1–6 and proven direct sources resolve to independently read VSTART/VFRA cycles', async () => {
  const { units, rules, followerNativeDirections } = await inputs()
  assert.equal(witness.provenance.exeSha256,
    '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f')
  assert.equal(Object.keys(witness.sources).length, 39)
  for (const entry of witness.personRows) {
    assert.equal(rules.personAnimationObjects[entry.row * 9 + entry.model], entry.object)
    assert.deepEqual(rules.animationObjects[entry.object], [entry.source, entry.draw])
  }
  for (const entry of witness.directObjects)
    assert.deepEqual(rules.animationObjects[entry.object], [entry.source, entry.draw])
  for (const [source, original] of Object.entries(witness.sources)) {
    const directions = followerNativeDirections(Number(source))
    assert.equal(directions, units.followerSources[source], 'catalog arrays are shared, not copied')
    assert.deepEqual(directions.map(cycle => ({
      source: cycle.source,
      frames: cycle.frames.map(index => units.frames[index].source),
      flip: cycle.flip,
    })), original, `source${source}: original-byte witness, not a named-table oracle`)
  }
  // 00439fd1 pushes101; the original tables, not nativeUnitDraw('spy'), supply22.
  assert.deepEqual(rules.animationObjects[101], [136, 22])
  assert.equal(rules.animationDescriptors[22].step, 1)
  assert.equal(witness.sources[136][0].frames.length, 12)
})

test('previously missing native sources reach the actual Scene in every direction and authored phase', async () => {
  const input = await sceneCase()
  try {
    // These are render diagnostics, not proof of vehicle/death controller reachability.
    for (const [source, kind, draw] of [
      [136, 'spy', 22], [304, 'brave', 14], [320, 'warrior', 15], [408, 'firewarrior', 18],
    ]) {
      input.unit.kind = kind
      setPose(input, source, draw)
      for (let direction = 0; direction < 8; direction++)
        for (let phase = 0; phase < witness.sources[source][direction].frames.length; phase++) {
          input.unit.native.f2 = phase
          assertNativeFrame(input, source, direction, phase, draw)
        }
    }
    input.unit.team = 'wild'
    input.unit.kind = 'brave'
    setPose(input, 0, 13)
    assertNativeFrame(input, 0, 0, 0, 13)
  } finally {
    input.fixture.close()
  }
})

test('Spy sabotage shares source136 while all real/disguised tribes select original draw22 layers', async () => {
  const input = await sceneCase()
  // Raw VELE for VFRA592. Owner layers213/238/264; draw22 selects piece5788,
  // not the alternative class piece4550. The default blue body is shared.
  const pieces = [
    [22, 188, 5788], [22, 188, 213, 5788],
    [22, 188, 238, 5788], [22, 188, 264, 5788],
  ]
  try {
    for (const [owner, team] of ['blue', 'red', 'yellow', 'green'].entries()) {
      input.unit.team = team
      setPose(input, 136, 22)
      for (let target = 0; target < 4; target++)
        for (const pending of [false, true])
          for (const frame of [0, 2]) {
            input.unit.native.disguise = (target << 6) | Number(pending)
            input.fixture.clock.animationFrame = frame
            const apparent = target !== owner && (!pending || frame === 0) ? target : owner,
              group = assertNativeFrame(input, 136, 0, 0, 22)
            assert.equal(group.userData.owner, apparent)
            assert.deepEqual(group.userData.layers.filter(layer => layer.visible)
              .map(layer => input.units.pieces[layer.userData.piece].source), pieces[apparent])
          }
    }
  } finally {
    input.fixture.close()
  }
})

test('native no-draw and hidden flags never become idle; unknown and genuine legacy paths remain distinct', async () => {
  const input = await sceneCase()
  try {
    setPose(input, 136, 22)
    assertNativeFrame(input, 136, 0, 0, 22)
    for (const [source, flags] of [[0x650, 0], [136, 16], [999999, 16]]) {
      Object.assign(input.unit.native, { object: source, renderFlags: flags })
      const { group, call } = render(input)
      assert.equal(input.nativeSpriteHidden(source, flags), true)
      assert.equal(group.visible, false)
      assert.equal(call, undefined, 'no fallback or stale body draw is submitted')
      assert.equal(group.userData.nativeSpriteHidden, true)
      assert.equal(group.userData.missingNativeSource, undefined)
    }
    for (const source of [999999, NaN, Infinity]) {
      Object.assign(input.unit.native, { object: source, renderFlags: 0, f2: 200 })
      const { group, call } = render(input)
      assert.equal(group.visible, true, 'unknown imports do not erase a live unit')
      assert.equal(group.userData.nativeSpriteHidden, false)
      assert.ok(Object.is(group.userData.missingNativeSource, source))
      assert.equal(call[5], undefined, 'native phase cannot index an unrelated fallback')
      assert.equal(call[2], input.units.animations['blue-spy'].idle)
    }
    input.unit.native = null
    const { group, call } = render(input)
    assert.equal(group.userData.missingNativeSource, undefined)
    assert.equal(call[2], input.units.animations['blue-spy'].idle)
    setPose(input, 136, 22)
    assertNativeFrame(input, 136, 0, 0, 22)
    input.world.units = []
    input.fixture.render()
    assert.equal(input.fixture.scene.unitMeshes.has(input.unit.id), false,
      'retired/removed units leave through actual mesh reconciliation, not idle fallback')
  } finally {
    input.fixture.close()
  }
})

test('seat, occupant and enemy invisibility gates stay hidden without changing the native source', async () => {
  const input = await sceneCase()
  try {
    for (const hiddenBy of ['seat', 'occupant', 'invisibility']) {
      input.unit.team = hiddenBy === 'invisibility' ? 'red' : 'blue'
      input.unit.inside = hiddenBy === 'occupant' ? 321 : null
      input.unit.invisibility = hiddenBy === 'invisibility' ? 64 : 0
      setPose(input, 136, 22)
      input.unit.native.vehicle = hiddenBy === 'seat' ? 123 : 0
      const { group, call } = render(input)
      assert.equal(group.visible, false, hiddenBy)
      assert.equal(call, undefined, hiddenBy)
      assert.equal(group.userData.missingNativeSource, undefined)
      assert.equal(input.unit.native.object, 136)
    }
  } finally {
    input.fixture.close()
  }
})

test('a publicly trained/disguised Spy reaches source136 through real command15 and stays unchanged while paused', async () => {
  const input = await inputs(),
    { createStartedWorld, retainFixtureUnits } = await import('./level-start-fixture.mjs'),
    { currentPersonOrder } = await import('../app/person-orders.ts'),
    world = createStartedWorld()
  // Supplied school/terrain/funding, as in spy-aftermath.test.mjs. Training,
  // disguise and sabotage run through real controls, not an injected sprite.
  world.manaWorld.gameFlags = 32
  retainFixtureUnits(world, unit => unit.kind === 'shaman')
  world.terrain.fill(3)
  world.terrainVersion++
  const school = input.api.addBuilding(world, 'blue', 'spyHut', { x: -2, z: 32 }, true,
      { angle: (3 * Math.PI) / 2 }),
    brave = input.api.addUnit(world, 'blue', 'brave', { x: 7, z: 33 }),
    until = (label, condition, limit = 2000) => {
      for (let turn = 0; turn < limit && !condition(); turn++) input.api.tick(world, 1 / 12)
      assert.ok(condition(), label)
    }
  world.selected = [brave.id]
  assert.ok(input.api.command(world, school))
  until('admitted', () => brave.inside === school.id && !brave.entry?.person.speed)
  world.manaWorld.gameFlags = 0
  school.timer = 65535
  until('trained', () => world.units.some(unit => unit.team === 'blue' && unit.kind === 'spy'))
  const unit = world.units.find(unit => unit.team === 'blue' && unit.kind === 'spy')
  until('departed', () => !unit.path.length)
  world.selected = [unit.id]
  assert.ok(input.api.disguiseSelectedSpies(world, 1))
  input.api.tick(world, 1 / 12)
  until('disguised', () => unit.native.disguise === 0x40)
  const target = input.api.addBuilding(world, 'red', 'hut', { x: 20, z: 40 }, true)
  assert.ok(input.api.command(world, target))
  until('command15 selects original object101',
    () => unit.native.substate === 2 && unit.native.object === 136, 600)
  assert.equal(currentPersonOrder(world.buildingOrders, unit.native).model, 15)
  assert.equal(unit.native.draw, 22)
  assert.equal(unit.native.disguise, 0x40)
  const fixture = await makeBuilderAnimationScene(world)
  try {
    fixture.render()
    const group = fixture.scene.unitMeshes.get(unit.id),
      call = fixture.personCalls.find(args => args[0] === group),
      phase = unit.native.f2,
      // Calculate the original direction independently, without the production helper.
      direction = ((Math.round(fixture.scene.cameraBearing * 1024 / Math.PI) -
        Math.round((Math.PI - unit.heading) * 1024 / Math.PI) - 0x380) & 0x700) >> 8
    assert.equal(call[2], input.units.followerSources[136])
    assert.equal(call[5], phase)
    assert.equal(input.units.frames[group.userData.frame].source, witness.sources[136][direction].frames[phase])
    assert.equal(group.userData.owner, 1)
    assert.equal(group.userData.draw, 22)
    assert.equal(group.userData.missingNativeSource, undefined)
    world.paused = true
    const before = [unit.native.f1, unit.native.f2, unit.native.timer, world.randomState, world.turn],
      frame = group.userData.frame
    for (let visit = 0; visit < 4; visit++) {
      fixture.advance(1 / 12)
      fixture.render()
      assert.deepEqual([unit.native.f1, unit.native.f2, unit.native.timer, world.randomState, world.turn], before)
      assert.equal(group.userData.frame, frame)
    }
  } finally {
    fixture.close()
  }
})
