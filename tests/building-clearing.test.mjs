import test from 'node:test'
import assert from 'node:assert/strict'
import scenery from './fixtures/building-scenery.json' with { type: 'json' }
import people from './fixtures/building-people.json' with { type: 'json' }
import manifest from '../decomp/exports.json' with { type: 'json' }
import rules from '../app/original-rules.json' with { type: 'json' }
import { stepBuildingScenery, stepBuildingPeople, SceneryPhase } from '../app/building-clearing.ts'
import { restingCellAvailable } from '../app/resting-slots.ts'
import { resetPersonMotion, defaultPersonState } from '../app/person-state.ts'
import {
  createWorld,
  addUnit,
  placeBuilding,
  tick,
  buildingPose,
  nativePosition,
  browserPosition,
  command,
  unitAnimationSource,
} from '../app/model.ts'
import { buildingFootprintCells } from '../app/building-shapes.ts'

function run(c) {
  const p = { ...c.person, motionGroup: 0, motionIndex: 0 },
    task = { ...c.task },
    rng = { randomState: c.seed },
    events = [],
    records = structuredClone(c.records),
    pool = Uint8Array.from(c.pool),
    flags = new Uint32Array(16384),
    categories = new Uint8Array(16384),
    orders = { records: c.orders, cursor: 0, active: 0 }
  c.land.forEach(v => {
    flags[v.index] = v.flags
    categories[v.index] = v.category
  })
  const before = flags.slice()
  const cellPeople = i => records.filter(o => o.class && (o.y >> 9) * 128 + (o.x >> 9) === i),
    occupants = () => c.cells.flatMap(cellPeople)
  const effects = {
    animation: (_, id) => events.push(['animation', id]),
    destination: to => {
      to = { x: to.x, y: to.y }
      events.push(['destination', to])
      p.goalX = to.x
      p.goalY = to.y
    },
    releaseMotion: () => events.push(['releaseMotion']),
    sound: (cue, flags) => events.push(['sound', cue, flags]),
    transfer: (id, n) => {
      events.push(['transfer', id, n])
      p.cargo = (p.cargo + 7) & 65535
    },
    remove: id => events.push(['remove', id]),
    dropTimber: () => {
      events.push(['drop'])
      p.cargo = 0
    },
    allocateOrder: to => {
      const id = c.allocationFails ? 0 : 77
      events.push(['allocate', id])
      if (id) events.push(['order', to])
      return id
    },
    displace: (o, id) => {
      events.push(['clear', o.id], ['attach', o.id, id], ['reset', o.id])
      resetPersonMotion(o)
      if (!(o.flags2 & 0x100000)) {
        o.previousState = o.state
        events.push(['empty', o.id])
        o.state = defaultPersonState(o, 32)
        events.push(['init', o.id, o.state])
      }
    },
  }
  const result =
    task.task === 3
      ? stepBuildingScenery(
          rng,
          p,
          task,
          { outside: c.outside, scenery: occupants, target: id => records.find(o => o.id === id) },
          effects
        )
      : stepBuildingPeople(
          rng,
          p,
          task,
          {
            tribe: 0,
            orders,
            search: pool,
            flags,
            occupants,
            cellPeople,
            available: i =>
              restingCellAvailable(
                {
                  land: { flags, categories },
                  orders,
                  cellObjects: cell => cellPeople((cell >> 9) * 128 + ((cell & 254) >> 1)),
                },
                ((i & 127) << 1) | ((i >> 7) << 9)
              ),
          },
          effects
        )
  delete p.motionGroup
  delete p.motionIndex
  const changes = []
  flags.forEach((f, i) => {
    if (f !== before[i]) changes.push([i, f])
  })
  return {
    person: p,
    task,
    randomState: rng.randomState,
    events,
    result,
    pool: [...pool],
    records: task.task === 4 ? records : [],
    changes,
  }
}

for (const [name, fixture] of [
  ['scenery', scenery],
  ['people', people],
])
  test(`complete native ${name} clearing, shared waits and ownership requests`, () => {
    assert.equal(fixture.executableSha256, manifest.executableSha256)
    fixture.cases.forEach((c, i) => assert.deepEqual(run(c), fixture.expected[i]))
  })

test('live clearers harvest on-site trees, carry and deposit logs, then move bystanders before allocation', () => {
  for (let direction = 0; direction < 4; direction++) {
    const w = createWorld()
    w.manaWorld.gameFlags = 32
    w.buildingDirections.hut = direction
    w.selected = w.units.filter(u => u.kind === 'brave' && u.team === 'blue').map(u => u.id)
    assert.ok(placeBuilding(w, 'hut', { x: 4, z: 32 }))
    const b = w.buildings.at(-1),
      cells = buildingFootprintCells(buildingPose(b)),
      mask = new Set(cells)
    const center = i => browserPosition({ x: (i & 127) * 512 + 256, y: (i >> 7) * 512 + 256 })
    const onSite = u => {
      const p = nativePosition(w, u)
      return mask.has(((p.y & 65535) >> 9) * 128 + ((p.x & 65535) >> 9))
    }
    const tree = w.trees.find(t => t.model === 1 && t.logs === 4)
    Object.assign(tree, center(cells[0]))
    const shaman = w.units.find(u => u.kind === 'shaman' && u.team === 'blue')
    Object.assign(shaman, {
      ...center(cells.at(-1)),
      path: [],
      work: null,
      target: null,
      native: null,
      casting: null,
    })
    const bystander = addUnit(w, 'blue', 'brave', center(cells.at(-1)))
    bystander.idleTurns = -10000
    const sceneryPhases = new Set(),
      peoplePhases = new Set()
    let harvested = false,
      deposited = false,
      moved = false
    for (let turn = 0; turn < 3000 && b.preparation; turn++) {
      const before = { x: shaman.x, z: shaman.z },
        crew = w.units.filter(u => u.work === b.id)
      for (const u of crew) {
        if (u.builder?.task === 3) {
          sceneryPhases.add(u.builder.phase)
          harvested ||=
            u.builder.phase === SceneryPhase.Harvest &&
            u.builder.person?.object ===
              rules.animationObjects[rules.personAnimationObjects[6 * 9 + 2]][0]
          deposited ||= u.builder.phase === SceneryPhase.Deposit && u.cargo > 0
        }
        if (u.builder?.task === 4) peoplePhases.add(u.builder.phase)
      }
      tick(w, 1 / 12)
      assert.ok(
        Math.hypot(shaman.x - before.x, shaman.z - before.z) < 0.3,
        'displacement walks instead of teleporting'
      )
      if (shaman.x !== before.x || shaman.z !== before.z) {
        moved = true
        assert.ok(peoplePhases.has(16), 'bystanders wait for the native clearance command')
      }
      if (!b.preparation) {
        assert.equal(tree.logs, 0)
        assert.ok(!onSite(shaman) && !onSite(bystander))
      }
    }
    assert.equal(b.preparation, undefined)
    assert.ok(harvested && deposited && moved)
    for (const phase of [4, 10, 11, 21, 51, 1])
      assert.ok(sceneryPhases.has(phase), `missing scenery phase ${phase}`)
    for (const phase of [4, 14, 15, 5, 16])
      assert.ok(peoplePhases.has(phase), `missing people phase ${phase}`)
    assert.ok(w.sounds.some(s => s.cue === 1))
    assert.ok(w.sounds.some(s => s.cue === 11))
    for (let n = 0; n < 3000 && (b.progress < 1 || b.builders.some(Boolean)); n++) tick(w, 1 / 12)
    assert.equal(b.progress, 1)
    assert.ok(b.builders.every(id => !id))
    assert.ok(
      w.indexedSearch.every((v, i) => i % 12 !== 0 || v === 0),
      'search slots are released'
    )
  }
})

test('clearing pauses without advancing and cancellation releases its native animation and route', () => {
  const w = createWorld()
  w.manaWorld.gameFlags = 32
  w.selected = w.units.filter(u => u.kind === 'brave' && u.team === 'blue').map(u => u.id)
  assert.ok(placeBuilding(w, 'hut', { x: 4, z: 32 }))
  const b = w.buildings.at(-1),
    i = buildingFootprintCells(buildingPose(b))[0]
  Object.assign(
    w.trees.find(t => t.model === 1),
    browserPosition({ x: (i & 127) * 512 + 256, y: (i >> 7) * 512 + 256 })
  )
  let worker
  for (let n = 0; n < 2000 && !worker; n++) {
    tick(w, 1 / 12)
    worker = w.units.find(u => u.builder?.task === 3 && u.builder.phase === 51)
  }
  assert.ok(worker)
  const before = JSON.stringify(worker)
  w.paused = true
  tick(w, 10)
  assert.equal(JSON.stringify(worker), before)
  w.paused = false
  w.selected = [worker.id]
  command(w, { x: 9, z: 33 })
  assert.equal(worker.builder, undefined)
  assert.equal(unitAnimationSource(worker), null)
  tick(w, 1 / 12)
  assert.ok(!b.builders.includes(worker.id))
})

test('clearing bushes starts the original fire and retreats before the site is allocated', () => {
  const w = createWorld()
  w.manaWorld.gameFlags = 32
  w.selected = w.units.filter(u => u.kind === 'brave' && u.team === 'blue').map(u => u.id)
  assert.ok(placeBuilding(w, 'hut', { x: 4, z: 32 }))
  const b = w.buildings.at(-1),
    cell = buildingFootprintCells(buildingPose(b))[0]
  const tree = w.trees.find(t => t.model === 1)
  Object.assign(tree, browserPosition({ x: (cell & 127) * 512 + 256, y: (cell >> 7) * 512 + 256 }))
  for (let n = 0; n < 2000 && !w.units.some(u => u.builder?.task === 3); n++) tick(w, 1 / 12)
  assert.ok(w.units.some(u => u.builder?.task === 3))
  tree.model = 7
  tree.logs = 1
  let burning = false,
    retreating = false
  for (let n = 0; n < 500 && b.preparation; n++) {
    tick(w, 1 / 12)
    burning ||= !!tree.burn?.started && tree.logs === 1
    retreating ||= w.units.some(
      u => u.builder?.task === 3 && u.builder.phase === SceneryPhase.Retreat
    )
  }
  assert.ok(burning && retreating)
  assert.equal(tree.logs, 0)
  assert.equal(b.preparation, undefined)
  assert.ok(w.effects.some(fx => fx.fire && Math.hypot(fx.x - tree.x, fx.z - tree.z) < 0.01))
})
