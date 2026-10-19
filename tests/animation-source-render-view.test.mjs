import { normalizeHistoricalFixture } from './helpers/historical-checkpoint.ts'
// Actual full unit-frame/Scene animation and UnitMotion consumers. Imported
// tables remain untouched; controlled poses/populations are Node diagnostics.
import assert from 'node:assert/strict'
import test from 'node:test'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'
import {
  normalWorkingConstruction,
  makeBuilderAnimationScene,
} from './support/builder-animation-scene.mjs'

async function inputs() {
  const api = await loadSceneFixture(),
    { default: units } = await import('../app/original-units.json'),
    { createLivePerson } = await import('../app/live-people.ts'),
    { nativeUnitDraw } = await import('../app/unit-kinds.ts'),
    { shamanNativeDirections } = await import('../app/shaman-appearance.ts'),
    { spriteDirection } = await import('../app/projection.ts')
  return { api, units, createLivePerson, nativeUnitDraw, shamanNativeDirections, spriteDirection }
}

function nativePose(input, world, unit, source = 104) {
  // A maintained initializer supplies the record. Only this diagnostic sprite
  // pose is controlled; no simulation is advanced in the cloned populations.
  unit.native = input.createLivePerson(world, unit)
  Object.assign(unit.native, {
    commandStatus: 3,
    object: source,
    draw: input.nativeUnitDraw(unit.kind),
    f2: 0,
  })
  assert.equal(input.api.unitAnimationSource(unit), unit.native)
  assert.equal(unit.native.flags2 & 0x800000, 0, 'no separate tower-picking scan')
  assert.equal(world.landVersion, world.terrainVersion, 'terrain is already reconciled')
}

async function quietWorld(count = 1) {
  const input = await inputs(),
    world = input.api.createWorld(1)
  world.units = []
  world.selected = []
  world.buildings = []
  world.shrines = []
  world.trees = []
  for (let index = 0; index < count; index++) {
    const unit = input.api.addUnit(world, 'blue', 'brave', { x: index % 16, z: 0 })
    nativePose(input, world, unit)
  }
  return { ...input, world }
}

function pureFrame(fixture) {
  const world = fixture.scene.world,
    before = structuredClone(world)
  fixture.render()
  assert.deepEqual(
    world,
    before,
    'render preserves the complete World, terrain and both RNG owners'
  )
}

function assertAnimation(input, fixture, unit, table) {
  const { scene } = fixture,
    group = scene.unitMeshes.get(unit.id),
    call = fixture.personCalls.find(args => args[0] === group),
    source = input.api.unitAnimationSource(unit),
    // Frozen previous expression is an output reference, not an executed base run.
    native =
      source?.object === undefined
        ? undefined
        : unit.kind === 'shaman'
          ? input.shamanNativeDirections(unit.team, source.object)
          : Object.values(table).find(d => 'source' in d[0] && d[0].source === source.object),
    state = input.api.unitAnimation(scene.world, unit),
    directions = native || table[state] || table.idle,
    age = native
      ? 0
      : scene.world.time - (unit.fight ? unit.fight.started / 12 : group.userData.since),
    once = !native && !!unit.fight && ['attack', 'strike', 'special', 'recoil'].includes(state),
    frameNumber = native ? source.f2 : undefined,
    direction = input.spriteDirection(
      Math.round((scene.cameraBearing * 1024) / Math.PI),
      Math.round(((Math.PI - unit.heading) * 1024) / Math.PI)
    ),
    cycle = directions[direction],
    step = frameNumber ?? Math.floor(age * input.units.fps),
    frame =
      cycle.frames[once ? Math.min(step, cycle.frames.length - 1) : step % cycle.frames.length]
  assert.ok(call)
  assert.equal(call[1], unit.heading)
  assert.equal(call[2], directions, 'the exact original direction array reaches the actual wrapper')
  for (let index = 0; index < directions.length; index++)
    assert.equal(
      call[2][index].frames,
      directions[index].frames,
      'frame-array identity is retained'
    )
  assert.equal(call[3], age)
  assert.equal(call[4], once)
  assert.equal(call[5], frameNumber)
  assert.deepEqual([...call[6]], [...new Set(scene.world.selected)])
  assert.equal(group.userData.state, state)
  assert.equal(group.userData.cellPosition, unit)
  assert.equal(group.userData.frame, frame)
  assert.equal(group.userData.frameFlip, cycle.flip)
  assert.equal(group.userData.nativeFrameHeight, input.units.frames[frame].nativeHeight)
  return { group, call, directions }
}

test('real construction Work poses reach the actual animation wrapper and advance their native frames', async () => {
  const input = await inputs(),
    { world, clock, workerId } = await normalWorkingConstruction(),
    fixture = await makeBuilderAnimationScene(world, { clock }),
    worker = world.units.find(unit => unit.id === workerId),
    table = input.units.animations[`${worker.team}-${worker.kind}`],
    frames = new Set()
  try {
    for (let visit = 0; visit < 8; visit++) {
      pureFrame(fixture)
      const { group } = assertAnimation(input, fixture, worker, table)
      frames.add(group.userData.frame)
      assert.ok(
        group.userData.layers.some(layer => layer.visible),
        'the real Work body is rendered'
      )
      if (!visit) assert.equal(group.userData.state, 'work')
      fixture.advance(1 / 12)
    }
    assert.ok(frames.size > 1, 'the shipped construction clock changes the displayed native sprite')
  } finally {
    fixture.close()
  }
})

test('every imported follower source keeps its first table entry and original direction/frame references', async () => {
  const input = await quietWorld(),
    { world } = input,
    unit = world.units[0],
    fixture = await makeBuilderAnimationScene(world)
  try {
    for (const [family, table] of Object.entries(input.units.animations)) {
      const [team, kind] = family.split('-')
      if (kind === 'shaman') continue
      unit.team = team
      unit.kind = kind
      nativePose(input, world, unit)
      for (const entry of Object.values(table)) {
        unit.native.object = entry[0].source
        unit.native.f2 = 1
        unit.heading = Math.PI / 4
        pureFrame(fixture)
        assertAnimation(input, fixture, unit, table)
      }
      if (family !== 'wild-brave') {
        unit.native.object = 104
        pureFrame(fixture)
        const { directions } = assertAnimation(input, fixture, unit, table)
        assert.equal(directions, table.chop, 'source104 uses chop before the later strike alias')
        assert.notEqual(
          directions,
          table.strike,
          'equal frame content does not erase first-entry identity'
        )
      }
    }
  } finally {
    fixture.close()
  }
})

test('undefined, unknown and NaN sources retain live fallback age/once while Shamans keep their direct source owner', async () => {
  const input = await quietWorld(),
    { world } = input,
    unit = world.units[0],
    table = input.units.animations['blue-brave'],
    fixture = await makeBuilderAnimationScene(world)
  try {
    unit.native = null
    unit.fight = { action: 'strike', started: world.turn }
    pureFrame(fixture)
    assert.equal(assertAnimation(input, fixture, unit, table).directions, table.strike)
    world.time += 0.5
    pureFrame(fixture)
    assertAnimation(input, fixture, unit, table)
    for (const source of [999999, NaN]) {
      nativePose(input, world, unit, source)
      unit.native.f2 = 200
      pureFrame(fixture)
      const { call } = assertAnimation(input, fixture, unit, table)
      assert.equal(call[2], table.strike)
      assert.equal(call[4], true, 'fallback attack-style animation retains once semantics')
      assert.equal(call[5], undefined, 'unknown source does not forward native f2')
    }
    unit.fight = null
    unit.kind = 'shaman'
    for (const team of ['blue', 'red', 'yellow', 'green']) {
      unit.team = team
      for (const source of [424, 552]) {
        nativePose(input, world, unit, source)
        unit.native.f2 = 2
        pureFrame(fixture)
        const { call } = assertAnimation(
          input,
          fixture,
          unit,
          input.units.animations[`${team}-shaman`]
        )
        assert.equal(call[2], input.shamanNativeDirections(team, source))
        assert.equal(call[5], 2)
      }
    }
  } finally {
    fixture.close()
  }
})

test('disguise/render-team transitions select the current table while signature changes retain real resource ownership', async () => {
  const input = await quietWorld(),
    { world } = input,
    unit = world.units[0],
    fixture = await makeBuilderAnimationScene(world)
  try {
    unit.kind = 'spy'
    nativePose(input, world, unit)
    unit.native.disguise = 65
    fixture.scene.gameClock.animationFrame = 0
    pureFrame(fixture)
    const { group } = assertAnimation(input, fixture, unit, input.units.animations['red-spy']),
      atlas = group.userData.layers.find(layer => layer.visible).material.map,
      releases = [],
      release = fixture.scene.releaseGroup
    let atlasDisposals = 0
    atlas.addEventListener('dispose', () => atlasDisposals++)
    fixture.scene.releaseGroup = stale => {
      releases.push(stale)
      return release(stale)
    }
    assert.equal(group.userData.owner, 1)
    fixture.scene.gameClock.animationFrame = 2
    pureFrame(fixture)
    assertAnimation(input, fixture, unit, input.units.animations['blue-spy'])
    assert.equal(fixture.scene.unitMeshes.get(unit.id), group)
    assert.equal(group.userData.owner, 0)
    assert.deepEqual(releases, [])
    const selection = group.userData.selection,
      disposalOrder = []
    selection.material.map.addEventListener('dispose', () => disposalOrder.push('selection-map'))
    selection.material.addEventListener('dispose', () => disposalOrder.push('selection-material'))
    unit.team = 'yellow'
    unit.kind = 'warrior'
    nativePose(input, world, unit)
    pureFrame(fixture)
    const replacement = assertAnimation(
      input,
      fixture,
      unit,
      input.units.animations['red-warrior']
    ).group
    assert.notEqual(replacement, group)
    assert.equal(group.parent, null)
    assert.deepEqual(releases, [group])
    assert.deepEqual(disposalOrder, ['selection-map', 'selection-material'])
    assert.equal(atlasDisposals, 0, 'the shared imported atlas survives replacement')
    assert.equal(replacement.userData.signature, 'yellow-warrior')
    assert.equal(replacement.userData.owner, 2)
    pureFrame(fixture)
    assertAnimation(input, fixture, unit, input.units.animations['red-warrior'])
    assert.equal(fixture.scene.unitMeshes.get(unit.id), replacement)
    assert.deepEqual(releases, [group])
  } finally {
    fixture.close()
  }
})

test('current/legacy checkpoint worlds, independent Scenes, empty refill and repeated poses preserve lookup/output ownership', async () => {
  const input = await quietWorld(),
    { api, world } = input,
    unit = world.units[0],
    fixture = await makeBuilderAnimationScene(world),
    table = input.units.animations['blue-brave']
  let other
  try {
    pureFrame(fixture)
    const original = assertAnimation(input, fixture, unit, table).group,
      loaded = api.migrateCheckpoint(structuredClone(world)),
      legacy = structuredClone(loaded)
    delete legacy.drawMode
    delete legacy.levelStart
    delete legacy.vehicles
    fixture.scene.world = normalizeHistoricalFixture(legacy)
    for (let frame = 0; frame < 3; frame++) {
      fixture.scene.world.units[0].native.f2 = frame
      pureFrame(fixture)
      assertAnimation(input, fixture, fixture.scene.world.units[0], table)
      assert.equal(fixture.scene.unitMeshes.get(unit.id), original)
    }
    other = await makeBuilderAnimationScene(loaded)
    pureFrame(other)
    const independent = assertAnimation(input, other, loaded.units[0], table).group
    assert.notEqual(independent, original)
    const empty = structuredClone(loaded)
    empty.units = []
    fixture.scene.world = empty
    pureFrame(fixture)
    assert.equal(fixture.scene.unitMeshes.size, 0)
    fixture.scene.world = loaded
    pureFrame(fixture)
    assert.notEqual(assertAnimation(input, fixture, loaded.units[0], table).group, original)
    pureFrame(other)
    assert.equal(assertAnimation(input, other, loaded.units[0], table).group, independent)
  } finally {
    other?.close()
    fixture.close()
  }
})

function observeLookup(table) {
  const originalValues = Object.values,
    originalFind = Array.prototype.find,
    originalGet = Map.prototype.get,
    counts = { resultArrays: 0, directionVisits: 0, cachedHits: 0 }
  Object.values = function (object) {
    const result = originalValues(object)
    if (object === table) {
      counts.resultArrays++
      // Observe the transient result, leaving imported directions/sources intact.
      Object.defineProperty(result, 'find', {
        value(predicate, thisArg) {
          return originalFind.call(this, (direction, index, array) => {
            counts.directionVisits++
            return predicate.call(thisArg, direction, index, array)
          })
        },
      })
    }
    return result
  }
  Map.prototype.get = function (key) {
    const result = originalGet.call(this, key)
    if (key === 104 && result === table.chop) counts.cachedHits++
    return result
  }
  return {
    counts,
    reset() {
      counts.resultArrays = counts.directionVisits = counts.cachedHits = 0
    },
    close() {
      Object.values = originalValues
      Map.prototype.get = originalGet
    },
  }
}

async function measuredFrames() {
  const rows = []
  for (const count of [128, 512, 1024]) {
    const input = await quietWorld(count),
      { world } = input,
      fixture = await makeBuilderAnimationScene(world),
      table = input.units.animations['blue-brave']
    let observer
    try {
      pureFrame(fixture) // Identical warm workload; cold table construction is excluded.
      const groups = [...fixture.scene.unitMeshes.values()],
        before = structuredClone(world)
      observer = observeLookup(table)
      for (let frame = 0; frame < 3; frame++) {
        observer.reset()
        fixture.render()
        rows.push({ count, frame, ...observer.counts })
      }
      observer.close()
      observer = undefined
      assert.deepEqual(world, before)
      assert.deepEqual([...fixture.scene.unitMeshes.values()], groups)
      for (const unit of world.units) assertAnimation(input, fixture, unit, table)
    } finally {
      observer?.close()
      fixture.close()
    }
  }
  return rows
}

test('warmed actual128/512/1024 follower frames perform direct source lookups without repeated direction-candidate visits', async t => {
  const rows = await measuredFrames()
  t.diagnostic(JSON.stringify({ boundary: 'warmed-imported-source-lookup', rows }))
  for (const row of rows) {
    assert.equal(row.directionVisits, 0, 'no per-person table scan after the common warm frame')
    assert.equal(row.cachedHits, row.count, 'one direct source hit per actual follower')
  }
})

test('warmed actual128/512/1024 follower frames omit only the former Object.values result-array boundary', async t => {
  const rows = await measuredFrames()
  t.diagnostic(JSON.stringify({ boundary: 'warmed-Object.values-result-objects', rows }))
  for (const row of rows)
    assert.equal(row.resultArrays, 0, 'no per-person Object.values result Array')
  // Backing storage, other frame allocations, GC, timing and hardware remain unmeasured.
})
