import { normalizeHistoricalFixture } from './helpers/historical-checkpoint.ts'
// Construction animation through the actual full unit frame/Scene wrapper.
// Controlled transitions/cloned worker populations are explicitly diagnostic.
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  normalWorkingConstruction,
  makeBuilderAnimationScene,
} from './support/builder-animation-scene.mjs'

async function controlledWorker() {
  const input = await normalWorkingConstruction(),
    { world, workerId, buildingId } = input,
    worker = world.units.find(unit => unit.id === workerId),
    building = world.buildings.find(candidate => candidate.id === buildingId)
  // Narrow only the render diagnostic; no simulation is advanced in this shape.
  world.units = [worker]
  world.selected = []
  world.buildings = [building]
  return { ...input, worker, building }
}

function assertFrame(fixture, world) {
  const before = structuredClone(world),
    previous = new Map([...fixture.scene.unitMeshes].map(([id, group]) => [id, {
      state: group.userData.state, frame: group.userData.frame, since: group.userData.since,
    }]))
  fixture.render()
  assert.deepEqual(world, before, 'unit rendering preserves the full World and both RNG owners')
  for (const unit of world.units) {
    const group = fixture.scene.unitMeshes.get(unit.id),
      call = fixture.personCalls.find(args => args[0] === group),
      source = fixture.api.unitAnimationSource(unit),
      hidden = !!unit.native?.vehicle || source?.object === 0x650 ||
        !!(source?.renderFlags & 16) ||
        (unit.inside !== null && (!unit.entry || !!(unit.entry.person.renderFlags & 16))) ||
        fixture.api.unitInvisibleToPlayer(world, unit)
    assert.equal(group.visible, !hidden, 'native hiding and actual occupancy own visibility')
    if (hidden) {
      assert.equal(call, undefined, 'hidden occupants submit no stale or fallback body')
      if (previous.has(unit.id))
        assert.deepEqual(
          { state: group.userData.state, frame: group.userData.frame, since: group.userData.since },
          previous.get(unit.id),
          'a hidden body retains its last drawn metadata rather than inventing a redraw'
        )
    } else {
      assert.ok(call, 'every visible worker reaches the actual person wrapper')
      assert.equal(group.userData.state, fixture.api.unitAnimation(world, unit))
    }
    assert.equal(group.userData.cellPosition, unit)
  }
}

const spriteSnapshot = group => ({
  frame: group.userData.frame,
  flip: group.userData.frameFlip,
  draw: group.userData.draw,
  drawFlags: group.userData.drawFlags,
  bounds: { ...group.userData.bounds },
  position: group.position.toArray(),
  quaternion: group.quaternion.toArray(),
  layers: group.userData.layers.map(layer => ({
    piece: layer.userData.piece,
    visible: layer.visible,
    center: layer.center.toArray(),
    scale: layer.scale.toArray(),
    uv: layer.userData.atlasTransform?.toArray(),
    opacity: layer.material.opacity,
  })),
})

test('real construction command reaches Work animation, pauses, cancels and releases the completed crew through the full unit frame', async () => {
  const { api, world, clock, workerId, buildingId } = await normalWorkingConstruction(),
    worker = world.units.find(unit => unit.id === workerId),
    building = world.buildings.find(candidate => candidate.id === buildingId),
    fixture = await makeBuilderAnimationScene(world, { clock })
  try {
    assertFrame(fixture, world)
    const group = fixture.scene.unitMeshes.get(workerId),
      groups = new Map(fixture.scene.unitMeshes),
      frames = new Set([group.userData.frame])
    assert.equal(group.userData.state, 'work')
    assert.equal(api.unitAnimationSource(worker), worker.builder.person)
    assert.equal(group.userData.cellPosition, worker)
    for (let visit = 0; visit < 8; visit++) {
      fixture.advance(1 / 12)
      assertFrame(fixture, world)
      frames.add(group.userData.frame)
    }
    assert.ok(frames.size > 1, 'the construction-owned logical sprite advances')
    world.paused = true
    const paused = structuredClone(world),
      pausedSprite = spriteSnapshot(group)
    fixture.advance(1)
    assert.deepEqual(world, paused)
    assertFrame(fixture, world)
    assert.deepEqual(spriteSnapshot(group), pausedSprite)
    world.paused = false
    api.setSelection(world, [workerId])
    api.command(world, { x: -5, z: 29 })
    assert.equal(worker.builder, undefined)
    assert.equal(api.unitAnimationSource(worker), worker.native)
    assert.equal(worker.native.commandStatus, 3)
    assertFrame(fixture, world)
    assert.equal(fixture.scene.unitMeshes.get(workerId), group)
    for (let turn = 0; turn < 2000 && building.progress < 1; turn++) api.tick(world, 1 / 12)
    assert.equal(building.progress, 1)
    for (let turn = 0; turn < 600 && world.units.some(unit => unit.builder); turn++)
      api.tick(world, 1 / 12)
    assert.ok(
      world.units.every(unit => !unit.builder),
      'completion releases construction owners'
    )
    assertFrame(fixture, world)
    for (const [id, original] of groups)
      if (world.units.some(unit => unit.id === id))
        assert.equal(fixture.scene.unitMeshes.get(id), original)
    const home = world.buildings.find(candidate => candidate.id === worker.inside)
    assert.equal(home?.kind, 'hut', 'the cancelled worker naturally enters a real hut while the crew finishes')
    assert.equal(home.progress, 1)
    assert.equal(worker.resident.building, home.id)
    assert.equal(home.admission.occupants[worker.resident.slot], worker.id)
    assert.equal(group.visible, false)
    api.setSelection(world, [workerId])
    assert.equal(api.command(world, { x: 9, z: 30 }), true)
    assert.equal(worker.inside, null, 'public movement releases actual housing ownership')
    assert.equal(worker.resident, undefined)
    assert.equal(home.admission.occupants.includes(worker.id), false)
    assert.equal(api.unitAnimationSource(worker), worker.native, 'the public command owns the departed animation')
    assert.equal(worker.native.commandStatus, 3)
    fixture.advance(1 / 12)
    assertFrame(fixture, world)
    assert.equal(fixture.scene.unitMeshes.get(workerId), group)
    assert.equal(group.visible, true, 'the same worker body reappears on ordinary departure')
    assert.equal(group.userData.state, 'walk')
    const call = fixture.personCalls.find(args => args[0] === group),
      source = api.unitAnimationSource(worker),
      { default: units } = await import('../app/original-units.json', { with: { type: 'json' } })
    assert.equal(call[2], units.followerSources[source.object])
    assert.equal(call[5], source.f2, 'departure redraw consumes the current native frame, not the hidden one')
  } finally {
    fixture.close()
  }
})

test('per-frame first-match building lookup follows live preparation edits, same-array ID changes and replacement without changing sprite identity', async () => {
  const { world, worker, building, preparationAtPlacement } = await controlledWorker(),
    fixture = await makeBuilderAnimationScene(world)
  try {
    assertFrame(fixture, world)
    const group = fixture.scene.unitMeshes.get(worker.id),
      originalSprite = spriteSnapshot(group),
      array = world.buildings,
      first = {
        ...structuredClone(building),
        preparation: structuredClone(preparationAtPlacement),
      },
      second = structuredClone(building)
    array.splice(0, array.length, first, second)
    assertFrame(fixture, world)
    assert.equal(group.userData.state, 'idle', 'the first duplicate has a preparation owner')
    delete first.preparation
    assertFrame(fixture, world)
    assert.equal(group.userData.state, 'work', 'the indexed record retains live preparation edits')
    first.preparation = structuredClone(preparationAtPlacement)
    array.reverse()
    assertFrame(fixture, world)
    assert.equal(
      group.userData.state,
      'work',
      'reordered duplicates retain the first complete record'
    )
    second.id += 10000
    assertFrame(fixture, world)
    assert.equal(group.userData.state, 'idle', 'in-place IDs are reread every frame')
    first.id += 10000
    assertFrame(fixture, world)
    assert.equal(
      group.userData.state,
      'work',
      'a missing work target retains the original work fallback'
    )
    assert.equal(world.buildings, array)
    world.buildings = [{ ...structuredClone(building), preparation: null }]
    assertFrame(fixture, world)
    assert.equal(group.userData.state, 'work')
    assert.equal(fixture.scene.unitMeshes.get(worker.id), group)
    assert.deepEqual(
      spriteSnapshot(group),
      originalSprite,
      'lookup changes do not rewrite native sprite output'
    )
    world.buildings = []
    assertFrame(fixture, world)
    assert.equal(group.userData.state, 'work')
    world.buildings = [structuredClone(building)]
    assertFrame(fixture, world)
    assert.equal(fixture.scene.unitMeshes.get(worker.id), group)
  } finally {
    fixture.close()
  }
})

test('explicit building maps are authoritative for empty/missing hits and live records while omitted direct calls retain current world lookup', async () => {
  const { api, world, worker, building, preparationAtPlacement } = await controlledWorker(),
    fixture = await makeBuilderAnimationScene(world)
  try {
    assertFrame(fixture, world)
    building.preparation = structuredClone(preparationAtPlacement)
    const before = structuredClone(world),
      empty = new Map(),
      unrelated = new Map([[building.id + 1, building]]),
      complete = structuredClone(building)
    delete complete.preparation
    assert.equal(
      api.unitAnimation(world, worker),
      'idle',
      'the omitted fourth argument reads the live world'
    )
    assert.equal(
      api.unitAnimation(world, worker, new Set()),
      'idle',
      'the existing selected-set contract stays independent'
    )
    assert.equal(
      api.unitAnimation(world, worker, undefined, empty),
      'work',
      'empty explicit map cannot fall back to the world'
    )
    assert.equal(
      api.unitAnimation(world, worker, undefined, unrelated),
      'work',
      'missing explicit key cannot rescan the world'
    )
    const explicit = new Map([[building.id, complete]])
    assert.equal(api.unitAnimation(world, worker, undefined, explicit), 'work')
    complete.preparation = structuredClone(preparationAtPlacement)
    assert.equal(
      api.unitAnimation(world, worker, undefined, explicit),
      'idle',
      'map values remain live records'
    )
    delete building.preparation
    assert.equal(
      api.unitAnimation(world, worker),
      'work',
      'default caller observes edits after the cached frame'
    )
    building.preparation = before.buildings[0].preparation
    assert.deepEqual(world, before)
  } finally {
    fixture.close()
  }
})

test('accepted null, NaN, signed-zero, Infinity and duplicate work IDs keep strict lookup semantics through migrated checkpoints', async () => {
  const { api, world, worker, building, preparationAtPlacement } = await controlledWorker(),
    fixture = await makeBuilderAnimationScene(world)
  try {
    for (const id of [null, NaN, -0, 0, Infinity, -Infinity]) {
      worker.work = id
      const first = {
          ...structuredClone(building),
          id,
          preparation: structuredClone(preparationAtPlacement),
        },
        second = { ...structuredClone(building), id }
      world.buildings = [first, second]
      const loaded = api.migrateCheckpoint(structuredClone(world)),
        restored = loaded.units[0]
      fixture.scene.world = loaded
      assert.equal(restored.work, id)
      assertFrame(fixture, loaded)
      assert.equal(
        fixture.scene.unitMeshes.get(restored.id).userData.state,
        Number.isNaN(id) ? 'work' : 'idle'
      )
      assert.equal(
        api.unitAnimation(loaded, restored, undefined, new Map([[id, loaded.buildings[0]]])),
        Number.isNaN(id) ? 'work' : 'idle',
        'even an explicit NaN-key map preserves the strict miss'
      )
      loaded.buildings.reverse()
      assertFrame(fixture, loaded)
      assert.equal(fixture.scene.unitMeshes.get(restored.id).userData.state, 'work')
      assertFrame(fixture, loaded)
    }
  } finally {
    fixture.close()
  }
})

test('loaded/current and legacy worlds, empty refill and independent Scenes rebuild building lookup while earlier animation owners stay unchanged', async () => {
  const { api, world, worker, building, preparationAtPlacement } = await controlledWorker(),
    left = await makeBuilderAnimationScene(world),
    other = structuredClone(world)
  other.buildings[0].preparation = structuredClone(preparationAtPlacement)
  const right = await makeBuilderAnimationScene(other)
  try {
    assertFrame(left, world)
    assertFrame(right, other)
    assert.equal(left.scene.unitMeshes.get(worker.id).userData.state, 'work')
    assert.equal(right.scene.unitMeshes.get(worker.id).userData.state, 'idle')
    assertFrame(left, world)
    const originalGroup = left.scene.unitMeshes.get(worker.id),
      current = api.migrateCheckpoint(structuredClone(world)),
      legacy = structuredClone(current)
    delete legacy.vehicles
    delete legacy.levelStart
    delete legacy.drawMode
    left.scene.world = normalizeHistoricalFixture(legacy)
    assertFrame(left, left.scene.world)
    assert.equal(left.scene.unitMeshes.get(worker.id), originalGroup)
    const empty = structuredClone(current)
    empty.units = []
    empty.buildings = []
    left.scene.world = empty
    assertFrame(left, empty)
    assert.equal(left.scene.unitMeshes.size, 0)
    left.scene.world = current
    assertFrame(left, current)
    assert.notEqual(left.scene.unitMeshes.get(worker.id), originalGroup)
    const emptyMap = new Map(),
      prepMap = new Map([[building.id, { ...building, preparation: preparationAtPlacement }]])
    for (const [change, expected] of [
      [{ lift: 1 }, 'airborne'],
      [{ casting: {} }, 'cast'],
      [{ fight: { animation: 'special' } }, 'special'],
      [{ fighting: true }, 'attack'],
      [{ builder: { ...worker.builder, person: { ...worker.builder.person, speed: 32 } } }, 'walk'],
      [
        {
          cargo: 1,
          builder: { ...worker.builder, person: { ...worker.builder.person, speed: 32 } },
        },
        'carry',
      ],
      [{ builder: { ...worker.builder, task: 8, phase: 28 } }, 'dance'],
      [{ builder: { ...worker.builder, task: 3, phase: 51 } }, 'work'],
      [{ builder: { ...worker.builder, task: 7 } }, 'idle'],
      [{ cargo: 1, builder: { ...worker.builder, task: 7 } }, 'carryIdle'],
      [{ builder: undefined, path: [{ x: worker.x + 1, z: worker.z }] }, 'walk'],
      [{ builder: undefined, cargo: 1 }, 'carryIdle'],
      [{ builder: undefined, harvest: { remaining: 1 } }, 'work'],
    ]) {
      const controlled = { ...worker, ...change }
      assert.equal(api.unitAnimation(world, controlled), expected)
      assert.equal(api.unitAnimation(world, controlled, undefined, emptyMap), expected)
      assert.equal(api.unitAnimation(world, controlled, undefined, prepMap), expected)
    }
    assertFrame(right, other)
    assert.equal(right.scene.unitMeshes.get(worker.id).userData.state, 'idle')
  } finally {
    right.close()
    left.close()
  }
})

test('full unit caller uses linear building-ID reads for explicitly cloned real Work people; the default live lookup remains the frozen reference', async t => {
  for (const count of [64, 256, 1024]) {
    const { api, world, worker, building } = await controlledWorker(),
      template = structuredClone(worker),
      buildingTemplate = structuredClone(building)
    assert.equal(template.builder.person.flags2 & 0x800000, 0)
    assert.equal(world.landVersion, world.terrainVersion)
    world.units = []
    world.buildings = []
    let reads = 0
    for (let index = 0; index < count; index++) {
      const id = 10000 + index,
        clone = { ...structuredClone(template), id: 20000 + index, work: id },
        site = { ...structuredClone(buildingTemplate), id }
      Object.defineProperty(site, 'id', {
        enumerable: true,
        configurable: true,
        get: () => {
          reads++
          return id
        },
      })
      world.units.push(clone)
      world.buildings.push(site)
    }
    const fixture = await makeBuilderAnimationScene(world)
    try {
      // This retained default caller executes the original .find expression;
      // the separate pristine-base invocation will run this entire test file.
      reads = 0
      for (const unit of world.units) assert.equal(api.unitAnimation(world, unit), 'work')
      const defaultLookupReads = reads
      assert.equal(defaultLookupReads, (count * (count + 1)) / 2)
      const before = structuredClone(world)
      reads = 0
      fixture.render()
      const frameReads = reads
      t.diagnostic(
        JSON.stringify({
          kind: 'builder-animation-scaling',
          population: count,
          defaultLookupReads,
          fullCallerBuildingIdReads: frameReads,
        })
      )
      assert.ok(
        frameReads <= count * 2,
        `full unit frame read ${frameReads} building IDs at population ${count}; bound ${count * 2}`
      )
      assert.deepEqual(world, before)
      for (const unit of world.units)
        assert.equal(fixture.scene.unitMeshes.get(unit.id).userData.state, 'work')
      const groups = new Map(fixture.scene.unitMeshes)
      reads = 0
      fixture.render()
      assert.ok(reads <= count * 2)
      for (const unit of world.units)
        assert.equal(fixture.scene.unitMeshes.get(unit.id), groups.get(unit.id))
      for (const unit of world.units) unit.work = -1
      reads = 0
      for (const unit of world.units) assert.equal(api.unitAnimation(world, unit), 'work')
      assert.equal(
        reads,
        count * count,
        'default missing targets still use the unchanged live scan'
      )
      const missingBefore = structuredClone(world)
      reads = 0
      fixture.render()
      const missingFrameReads = reads
      t.diagnostic(
        JSON.stringify({
          kind: 'builder-animation-missing-scaling',
          population: count,
          defaultLookupReads: count * count,
          fullCallerBuildingIdReads: missingFrameReads,
        })
      )
      assert.ok(missingFrameReads <= count * 2)
      assert.deepEqual(world, missingBefore)
    } finally {
      fixture.close()
    }
  }
})
