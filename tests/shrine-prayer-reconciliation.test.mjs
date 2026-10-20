import { normalizeHistoricalFixture } from './helpers/historical-checkpoint.ts'
// Actual unit-frame/Scene/UnitMotion consumers. Natural command owners support
// the route; supplied near-head states and cloned populations are diagnostics.
import assert from 'node:assert/strict'
import test from 'node:test'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'
import { makeBuilderAnimationScene } from './support/builder-animation-scene.mjs'

async function inputs() {
  const api = await loadSceneFixture(),
    opening = await import('./level-start-fixture.mjs'),
    { currentPersonOrder } = await import('../app/person-orders.ts'),
    { liveWorshippers } = await import('../app/live-worship.ts'),
    { default: units } = await import('../app/original-units.json'),
    { shamanAppearance, shamanNativeDirections } = await import('../app/shaman-appearance.ts'),
    { animationTeam, teamForTribe } = await import('../app/world-types.ts'),
    { spriteDirection } = await import('../app/projection.ts')
  return {
    api,
    ...opening,
    currentPersonOrder,
    liveWorshippers,
    units,
    shamanAppearance,
    shamanNativeDirections,
    animationTeam,
    teamForTribe,
    spriteDirection,
  }
}

let headPrayer
async function naturalHead() {
  const input = await inputs()
  if (!headPrayer) {
    const world = input.createStartedWorld(),
      clock = { animationTime: 0, animationFrame: 0 }
    world.manaWorld.gameFlags = 32
    input.retainFixtureUnits(world, unit => unit.team === 'blue')
    world.selected = world.units.map(unit => unit.id)
    const head = world.shrines.find(shrine => shrine.kind === 'bridge')
    assert.ok(input.api.command(world, head))
    for (let turn = 0; turn < 150; turn++) input.api.advanceGame(world, clock, 1 / 12)
    assert.equal(input.liveWorshippers(world, head).length, 7)
    const unit = world.units.find(person => person.kind === 'brave')
    assert.equal(unit.native.commandStatus, 27)
    assert.equal(unit.native.speed, 0)
    assert.equal(unit.path.length, 0)
    assert.equal(input.currentPersonOrder(world.buildingOrders, unit.native).model, 27)
    headPrayer = { world, clock, headId: head.id, unitId: unit.id }
  }
  return { ...input, ...structuredClone(headPrayer) }
}

const clockSample = clock => ({
  animationTime: clock.animationTime,
  animationFrame: clock.animationFrame,
})

function assertPerson(
  input,
  fixture,
  unit,
  expected = input.api.unitAnimation(fixture.scene.world, unit)
) {
  const { scene } = fixture,
    group = scene.unitMeshes.get(unit.id),
    call = fixture.personCalls.find(args => args[0] === group),
    source = input.api.unitAnimationSource(unit),
    table =
      input.units.animations[
        unit.kind === 'shaman'
          ? input.shamanAppearance(unit.team).signature
          : `${input.animationTeam(input.teamForTribe(group.userData.owner))}-${unit.kind}`
      ],
    native =
      source?.object === undefined
        ? undefined
        : unit.kind === 'shaman'
          ? input.shamanNativeDirections(unit.team, source.object)
          : Object.values(table).find(
              direction => 'source' in direction[0] && direction[0].source === source.object
            ),
    directions = native || table[expected] || table.idle,
    age = native
      ? 0
      : scene.world.time - (unit.fight ? unit.fight.started / 12 : group.userData.since),
    once = !native && !!unit.fight && ['attack', 'strike', 'special', 'recoil'].includes(expected),
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
  assert.equal(group.userData.state, expected)
  assert.equal(group.userData.cellPosition, unit)
  assert.equal(call[1], unit.heading)
  assert.equal(
    call[2],
    directions,
    'original native/fallback direction references reach the real wrapper'
  )
  assert.equal(call[3], age)
  assert.equal(call[4], once)
  assert.equal(call[5], frameNumber)
  assert.equal(group.userData.frame, frame)
  return group
}

function pureFrame(input, fixture) {
  const before = structuredClone(fixture.scene.world),
    clock = clockSample(fixture.clock)
  fixture.render()
  assert.deepEqual(
    fixture.scene.world,
    before,
    'full World, terrain and both RNG owners remain unchanged'
  )
  assert.deepEqual(clockSample(fixture.clock), clock, 'render does not advance either frame clock')
  for (const unit of fixture.scene.world.units) assertPerson(input, fixture, unit)
}

const body = group => ({
  frame: group.userData.frame,
  flip: group.userData.frameFlip,
  draw: group.userData.draw,
  flags: group.userData.drawFlags,
  position: group.position.toArray(),
  quaternion: group.quaternion.toArray(),
  bounds: { ...group.userData.bounds },
  layers: group.userData.layers.map(layer => ({
    piece: layer.userData.piece,
    visible: layer.visible,
    center: layer.center.toArray(),
    scale: layer.scale.toArray(),
    uv: layer.userData.atlasTransform?.toArray(),
    material: layer.material.uuid,
  })),
})

async function suppliedHead() {
  const input = await naturalHead(),
    { world, unitId, headId } = input,
    unit = world.units.find(person => person.id === unitId),
    head = world.shrines.find(shrine => shrine.id === headId)
  // Isolate only this render diagnostic. No simulation advances after these edits.
  world.units = [unit]
  world.selected = []
  world.buildings = []
  world.shrines = [head]
  Object.assign(head, { active: true, kind: 'bridge', x: unit.x + 1, z: unit.z })
  assert.equal(unit.cargo, 0)
  assert.equal(unit.builder, undefined)
  assert.equal(unit.native.flags2 & 0x800000, 0, 'no separate tower-picking scan')
  assert.equal(world.landVersion, world.terrainVersion, 'the natural terrain owner is reconciled')
  assert.equal(input.api.unitAnimation(world, unit), 'pray')
  return { ...input, unit, head }
}

test('real command27 worship retains native poses, frame clocks, pause and public cancellation through the full unit caller', async () => {
  const input = await naturalHead(),
    { api, world, clock, unitId } = input,
    unit = world.units.find(person => person.id === unitId),
    person = unit.native,
    fixture = await makeBuilderAnimationScene(world, { clock })
  try {
    pureFrame(input, fixture)
    const group = fixture.scene.unitMeshes.get(unit.id),
      groups = new Map(fixture.scene.unitMeshes),
      frames = new Set([group.userData.frame])
    for (let visit = 0; visit < 8; visit++) {
      fixture.advance(1 / 12)
      pureFrame(input, fixture)
      frames.add(group.userData.frame)
      assert.equal(api.unitAnimationSource(unit), person)
      assert.equal(fixture.scene.unitMeshes.get(unit.id), group)
    }
    assert.ok(frames.size > 1, 'the actual command-owned prayer sprite advances')
    world.paused = true
    const paused = structuredClone(world),
      stoppedBody = body(group)
    fixture.advance(1)
    assert.deepEqual(world, paused)
    pureFrame(input, fixture)
    assert.deepEqual(body(group), stoppedBody)
    world.paused = false
    api.setSelection(world, [unit.id])
    assert.ok(api.command(world, { x: 2, z: 30 }))
    fixture.advance(2 / 12)
    pureFrame(input, fixture)
    assert.equal(unit.work, null)
    assert.equal(unit.native, person, 'cancellation keeps the original native person owner')
    assert.equal(input.currentPersonOrder(world.buildingOrders, person).model, 3)
    assert.deepEqual(new Map(fixture.scene.unitMeshes), groups)
  } finally {
    fixture.close()
  }
})

test('ordinary M3 Vault phase2 keeps its true outside point, default state and native directions through prayer Load and cancellation', async () => {
  const input = await inputs(),
    { api } = input,
    world = input.finishLevelStart(api.createWorld(3)),
    unit = world.units.find(person => person.team === 'blue' && person.kind === 'shaman'),
    head = world.shrines.find(shrine => shrine.kind === 'vault' && shrine.reward === 'temple'),
    home = { x: unit.x, z: unit.z },
    clock = { animationTime: 0, animationFrame: 0 }
  api.select(world, 'shaman')
  assert.ok(api.command(world, head))
  let arrived = false
  for (let turn = 0; turn < 4000 && !arrived; turn++) {
    const phase = unit.native.commandPhase,
      work = head.work
    api.advanceGame(world, clock, 1 / 12)
    arrived = phase === 2 && unit.native.commandPhase === 2 && head.work > work
  }
  assert.equal(arrived, true, 'the unchanged ordinary command33 reaches actual prayer work')
  assert.equal(input.currentPersonOrder(world.buildingOrders, unit.native).model, 33)
  assert.equal(unit.vault.phase, 2)
  assert.deepEqual({ x: unit.native.goalX, y: unit.native.goalY }, { x: 58112, y: 30976 })
  const center = api.nativePosition(world, head)
  assert.deepEqual({ x: center.x & 65535, y: center.y & 65535 }, { x: 58112, y: 32000 })
  assert.equal(
    Math.hypot(unit.native.goalX - (center.x & 65535), unit.native.goalY - center.y) / 256,
    4
  )
  assert.ok(
    api.distance(head, unit) >= 3,
    'retain the existing unwrapped fallback radius and World coordinates'
  )
  assert.notEqual(
    api.unitAnimation(world, unit),
    'pray',
    'native prayer is not the near-head fallback state'
  )
  const fixture = await makeBuilderAnimationScene(world, { clock })
  let restoredScene
  try {
    pureFrame(input, fixture)
    const group = fixture.scene.unitMeshes.get(unit.id),
      person = unit.native,
      restored = api.migrateCheckpoint(structuredClone(world))
    restoredScene = await makeBuilderAnimationScene(restored, { clock })
    pureFrame(input, restoredScene)
    for (let visit = 0; visit < 3; visit++) {
      fixture.advance(1 / 12)
      restoredScene.advance(1 / 12)
      assert.deepEqual(
        restored,
        world,
        'the genuine prayer checkpoint continues without owner replacement'
      )
      pureFrame(input, fixture)
      pureFrame(input, restoredScene)
      assert.deepEqual(body(restoredScene.scene.unitMeshes.get(unit.id)), {
        ...body(group),
        layers: body(group).layers.map((layer, index) => ({
          ...layer,
          material: restoredScene.scene.unitMeshes.get(unit.id).userData.layers[index].material
            .uuid,
        })),
      })
    }
    api.select(world, 'shaman')
    assert.ok(api.command(world, home))
    pureFrame(input, fixture)
    assert.equal(unit.vault, null)
    assert.equal(unit.work, null)
    assert.equal(unit.native, person)
    assert.equal(fixture.scene.unitMeshes.get(unit.id), group)
  } finally {
    restoredScene?.close()
    fixture.close()
  }
})

test('ordered duplicate shrine references preserve later qualifiers and live active pose kind edits at each actual draw', async () => {
  const input = await suppliedHead(),
    { api, world, unit, head } = input,
    other = { ...structuredClone(unit), id: world.nextId++ },
    later = { ...structuredClone(head), active: false, kind: 'vault', x: unit.x + 30 }
  other.native.id = other.id
  other.x += 0.25
  world.units.push(other)
  world.shrines = [head, later]
  head.active = false
  unit.vault = { head: head.id, phase: 1, entering: false, remaining: 0 }
  other.vault = { ...unit.vault }
  const fixture = await makeBuilderAnimationScene(world)
  try {
    pureFrame(input, fixture)
    const groups = new Map(fixture.scene.unitMeshes),
      originalBody = body(groups.get(unit.id)),
      expected = structuredClone(world),
      clock = clockSample(fixture.clock),
      draw = fixture.scene.animatePerson,
      samples = []
    Object.assign(expected.shrines[1], { active: true, x: other.x + 1, z: other.z, kind: 'bridge' })
    fixture.scene.animatePerson = function (...args) {
      const person = world.units.find(candidate => candidate.id === args[0].userData.unit),
        state = api.unitAnimation(world, person)
      samples.push([person.id, state])
      assert.equal(args[0].userData.state, state, 'each query sees the prior live property state')
      const result = draw.apply(this, args)
      if (person === unit)
        Object.assign(later, { active: true, x: other.x + 1, z: other.z, kind: 'bridge' })
      return result
    }
    fixture.render()
    fixture.scene.animatePerson = draw
    assert.deepEqual(samples, [
      [unit.id, 'idle'],
      [other.id, 'pray'],
    ])
    assert.equal(
      groups.get(unit.id).userData.state,
      'idle',
      'retain the first captured sample after later edits'
    )
    assert.equal(groups.get(other.id).userData.state, 'pray')
    assertPerson(input, fixture, unit, 'idle')
    assertPerson(input, fixture, other, 'pray')
    assert.deepEqual(world, expected)
    assert.deepEqual(clockSample(fixture.clock), clock)
    assert.deepEqual(new Map(fixture.scene.unitMeshes), groups)
    assert.deepEqual(body(groups.get(unit.id)), originalBody)
    assert.equal(world.shrines[0], head)
    assert.equal(world.shrines[1], later)
    pureFrame(input, fixture)
    assert.equal(
      groups.get(unit.id).userData.state,
      'pray',
      'a later duplicate can qualify without first-match filtering'
    )
    Object.assign(later, { kind: 'vault' })
    pureFrame(input, fixture)
    assert.equal(groups.get(unit.id).userData.state, 'idle')
    unit.vault.phase = 2
    pureFrame(input, fixture)
    assert.equal(groups.get(unit.id).userData.state, 'pray', 'vault phase is read live')
    later.x = unit.x + 3
    pureFrame(input, fixture)
    assert.equal(groups.get(unit.id).userData.state, 'idle', 'distance3 is excluded')
    head.active = true
    head.model = 0
    pureFrame(input, fixture)
    assert.equal(
      groups.get(unit.id).userData.state,
      'pray',
      'model visibility is not prayer eligibility'
    )
    world.shrines = [head, head, later]
    delete world.shrines[0]
    pureFrame(input, fixture) // Diagnostic in-memory sparse list; no malformed-save claim.
  } finally {
    fixture.close()
  }
})

test('explicit fifth shrine maps are authoritative for empty and missing buckets while omitted calls retain live prayer lookup', async () => {
  const { api, world, unit, head } = await suppliedHead(),
    empty = new Map(),
    absent = new Map([[head.id + 1, [head]]]),
    live = new Map([[head.id, [head]]])
  assert.equal(api.unitAnimation(world, unit), 'pray')
  assert.equal(api.unitAnimation(world, unit, undefined, undefined, empty), 'idle')
  assert.equal(api.unitAnimation(world, unit, undefined, undefined, absent), 'idle')
  assert.equal(api.unitAnimation(world, unit, undefined, undefined, live), 'pray')
  head.active = false
  assert.equal(api.unitAnimation(world, unit, undefined, undefined, live), 'idle')
  head.active = true
  world.shrines = []
  assert.equal(api.unitAnimation(world, unit), 'idle', 'omitted direct calls use the current World')
  assert.equal(
    api.unitAnimation(world, unit, undefined, undefined, live),
    'pray',
    'explicit bucket references remain authoritative'
  )
  const unread = new Map()
  unread.get = () => {
    throw new Error('earlier animation owners must not query shrine buckets')
  }
  for (const [change, expected] of [
    [{ lift: 1 }, 'airborne'],
    [{ casting: {} }, 'cast'],
    [{ fight: { animation: 'special' } }, 'special'],
    [{ fight: { action: 'ready' } }, 'idle'],
    [{ fighting: true }, 'attack'],
    [{ path: [{ x: unit.x + 1, z: unit.z }] }, 'walk'],
    [{ cargo: 1 }, 'carryIdle'],
    [{ harvest: { remaining: 1 } }, 'work'],
  ]) {
    const controlled = { ...unit, ...change }
    assert.equal(api.unitAnimation(world, controlled), expected)
    assert.equal(api.unitAnimation(world, controlled, undefined, undefined, unread), expected)
  }
})

test('strict work aliases retain signed zero Infinity null NaN and ordered duplicates through Load while undefined is a direct diagnostic', async () => {
  for (const id of [0, -0, Infinity, null, undefined, NaN]) {
    const input = await suppliedHead(),
      { api, world, unit, head } = input
    head.id = id
    unit.work = id === 0 ? (Object.is(id, -0) ? 0 : -0) : id
    const loaded =
        id === undefined ? structuredClone(world) : api.migrateCheckpoint(structuredClone(world)),
      person = loaded.units[0],
      matched = !Number.isNaN(id),
      fixture = await makeBuilderAnimationScene(loaded)
    try {
      pureFrame(input, fixture)
      assert.equal(
        fixture.scene.unitMeshes.get(person.id).userData.state,
        matched ? 'pray' : 'idle'
      )
      assert.equal(
        api.unitAnimation(loaded, person, undefined, undefined, new Map([[id, loaded.shrines]])),
        matched ? 'pray' : 'idle'
      )
      pureFrame(input, fixture)
      loaded.shrines.unshift({ ...structuredClone(loaded.shrines[0]), active: false })
      pureFrame(input, fixture)
      assert.equal(
        fixture.scene.unitMeshes.get(person.id).userData.state,
        matched ? 'pray' : 'idle'
      )
    } finally {
      fixture.close()
    }
  }
})

test('current legacy replacement and independent Scenes rebuild all current shrine references with ordered resource ownership on empty refill', async () => {
  const input = await suppliedHead(),
    { api, world, unit, head } = input,
    fixture = await makeBuilderAnimationScene(world),
    otherWorld = structuredClone(world)
  otherWorld.shrines[0].active = false
  const other = await makeBuilderAnimationScene(otherWorld)
  let atlas, atlasListener
  try {
    pureFrame(input, fixture)
    pureFrame(input, other)
    const original = fixture.scene.unitMeshes.get(unit.id),
      independent = other.scene.unitMeshes.get(unit.id),
      arrow = original.userData.selection,
      disposals = []
    assert.notEqual(original, independent)
    atlas = original.userData.layers[0].material.map
    let atlasDisposals = 0
    atlasListener = () => atlasDisposals++
    atlas.addEventListener('dispose', atlasListener)
    arrow.material.map.addEventListener('dispose', () => disposals.push('selection-map'))
    arrow.material.addEventListener('dispose', () => disposals.push('selection-material'))
    head.id = world.nextId++
    unit.work = head.id
    pureFrame(input, fixture)
    assert.equal(fixture.scene.unitMeshes.get(unit.id), original)
    const current = api.migrateCheckpoint(structuredClone(world)),
      legacy = structuredClone(current)
    delete legacy.vehicles
    delete legacy.levelStart
    delete legacy.drawMode
    fixture.scene.world = normalizeHistoricalFixture(legacy)
    pureFrame(input, fixture)
    assert.equal(fixture.scene.unitMeshes.get(unit.id), original)
    fixture.scene.world.shrines = []
    pureFrame(input, fixture)
    assert.equal(original.userData.state, 'idle')
    pureFrame(input, other)
    assert.equal(other.scene.unitMeshes.get(unit.id), independent)
    assert.equal(independent.userData.state, 'idle')
    const empty = structuredClone(current)
    empty.units = []
    empty.shrines = []
    fixture.scene.world = empty
    pureFrame(input, fixture)
    assert.deepEqual(disposals, ['selection-map', 'selection-material'])
    assert.equal(atlasDisposals, 0, 'the shared unit atlas survives owned group teardown')
    fixture.scene.world = current
    pureFrame(input, fixture)
    assert.notEqual(fixture.scene.unitMeshes.get(unit.id), original)
    assert.equal(fixture.scene.unitMeshes.get(unit.id).userData.state, 'pray')
    assert.deepEqual(disposals, ['selection-map', 'selection-material'])
  } finally {
    if (atlas && atlasListener) atlas.removeEventListener('dispose', atlasListener)
    other.close()
    fixture.close()
  }
})

test('full unit caller limits shrine-ID reads to frame indexing and matching ordered buckets for unique hit and miss populations', async t => {
  const rows = []
  for (const count of [64, 256, 1024]) {
    for (const mode of ['hit', 'miss']) {
      const input = await suppliedHead(),
        { world, unit, head } = input
      // Cloned genuine Work/prayer owners, not a claim about a native head/person cap.
      world.shrines = Array.from({ length: count }, () => ({
        ...structuredClone(head),
        id: world.nextId++,
      }))
      world.units = world.shrines.map(shrine => {
        const clone = {
          ...structuredClone(unit),
          id: world.nextId++,
          work: mode === 'hit' ? shrine.id : -1,
        }
        clone.native.id = clone.id
        return clone
      })
      assert.equal(world.landVersion, world.terrainVersion)
      assert.ok(world.units.every(person => !(person.native.flags2 & 0x800000)))
      const fixture = await makeBuilderAnimationScene(world),
        ids = world.shrines.map(shrine => shrine.id)
      let reads = 0
      try {
        pureFrame(input, fixture) // Identical warm work; semantic reference reads stay outside measurement.
        const before = structuredClone(world),
          groups = new Map(fixture.scene.unitMeshes),
          clock = clockSample(fixture.clock)
        for (let index = 0; index < world.shrines.length; index++)
          Object.defineProperty(world.shrines[index], 'id', {
            configurable: true,
            enumerable: true,
            get() {
              reads++
              return ids[index]
            },
          })
        for (let frame = 0; frame < 3; frame++) {
          reads = 0
          fixture.render()
          rows.push({ count, mode, frame, shrineIdReads: reads })
        }
        for (let index = 0; index < world.shrines.length; index++)
          Object.defineProperty(world.shrines[index], 'id', {
            configurable: true,
            enumerable: true,
            writable: true,
            value: ids[index],
          })
        assert.deepEqual(world, before)
        assert.deepEqual(clockSample(fixture.clock), clock)
        assert.deepEqual(new Map(fixture.scene.unitMeshes), groups)
        for (const person of world.units) assertPerson(input, fixture, person)
      } finally {
        for (let index = 0; index < world.shrines.length; index++)
          Object.defineProperty(world.shrines[index], 'id', {
            configurable: true,
            enumerable: true,
            writable: true,
            value: ids[index],
          })
        fixture.close()
      }
    }
  }
  t.diagnostic(JSON.stringify({ boundary: 'unique-shrine-prayer-query-reads', rows }))
  for (const row of rows)
    assert.equal(row.shrineIdReads, row.mode === 'hit' ? row.count * 2 : row.count)
  // Matching duplicate buckets still require ordered live predicates. Their worst
  // case is quadratic; allocations/GC/timing/browser/hardware remain unmeasured.
})
