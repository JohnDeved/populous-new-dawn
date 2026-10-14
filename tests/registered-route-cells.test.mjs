import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { deserialize } from 'node:v8'
import { createHash } from 'node:crypto'
import { createWorld, addUnit, nativePosition } from '../app/model.ts'
import { createLivePerson, registerLivePerson, syncLivePersonCells } from '../app/live-people.ts'
import { removeObjectFromCell } from '../app/object-cells.ts'
import { stepLiveRoute } from '../app/live-pathfinding.ts'
import { advanceGame } from '../app/game-clock.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { withStorage } from './support/profile-storage.mjs'
const index = p => ((p.y & 65535) >> 9) * 128 + ((p.x & 65535) >> 9)
function validCells(w) {
  const seen = new Set()
  for (let i = 0; i < w.objectCells.heads.length; i++) {
    let id = w.objectCells.heads[i],
      previous = 0
    while (id) {
      assert.ok(!seen.has(id), `Unique linked owner ${id}`)
      seen.add(id)
      const p = w.objectCells.objects.get(id)
      assert.ok(p, `Registered cell head/member ${id}`)
      assert.equal(index(p), i, `Actual cell for ${id}`)
      assert.ok(p.flags2 & 0x20000)
      assert.equal(p.cellPrevious, previous)
      previous = id
      id = p.cellNext
    }
  }
  for (const p of w.objectCells.objects.values()) if (p.flags2 & 0x20000) assert.ok(seen.has(p.id))
  return seen
}
function supplied() {
  const w = createWorld()
  w.units = []
  w.buildings = []
  w.shrines = []
  w.terrain.fill(3)
  w.terrainVersion++
  const u = addUnit(w, 'blue', 'brave', { x: 0, z: 0 }),
    p = createLivePerson(w, u)
  u.native = null
  registerLivePerson(w, p)
  w.pathfinding.people.set(u.id, p)
  w.turn = 123
  return { w, u, p }
}
test('registered route aliases relink same/cross-cell movement before ordinary retirement without changing route timing', () => {
  for (const dx of [0.25, 3]) {
    const { w, u, p } = supplied()
    const neighbor = addUnit(w, 'blue', 'brave', { x: 0, z: 0 }),
      np = createLivePerson(w, neighbor)
    neighbor.native = np
    registerLivePerson(w, np)
    const destination = addUnit(w, 'blue', 'brave', { x: 3, z: 0 }),
      dp = createLivePerson(w, destination)
    destination.native = dp
    registerLivePerson(w, dp)
    const old = index(p),
      newId = index(dp),
      heads = Array.from(w.objectCells.heads),
      before = {
        next: w.nextId,
        random: w.randomState,
        route: p.motionGroup,
        goalX: p.goalX,
        goalY: p.goalY,
      }
    u.x += dx
    stepLiveRoute(w, u)
    assert.equal(w.pathfinding.people.get(u.id), p)
    assert.equal(w.objectCells.objects.get(u.id), p)
    assert.equal(p.counter, 123)
    const expected = nativePosition(w, u)
    assert.deepEqual(
      { x: p.x, y: p.y, h: p.h },
      { x: expected.x & 65535, y: expected.y & 65535, h: expected.h }
    )
    assert.deepEqual(
      {
        next: w.nextId,
        random: w.randomState,
        route: p.motionGroup,
        goalX: p.goalX,
        goalY: p.goalY,
      },
      before
    )
    validCells(w)
    if (dx < 1) assert.deepEqual(Array.from(w.objectCells.heads), heads)
    else {
      assert.equal(w.objectCells.heads[old], np.id)
      assert.equal(w.objectCells.heads[newId], p.id)
    }
    syncLivePersonCells(w)
    assert.equal(w.objectCells.objects.has(p.id), false)
    assert.equal(
      w.pathfinding.people.get(u.id),
      p,
      'Route-only allocation survives physical retirement'
    )
    validCells(w)
    assert.equal(w.objectCells.heads[old], np.id)
    assert.equal(w.objectCells.heads[newId], dp.id)
  }
})
test('unlinked, route-only, nonmatching registration and native-owned records preserve their existing copy contract', () => {
  for (const kind of ['unlinked', 'route-only', 'nonmatching', 'native-owned']) {
    const { w, u, p } = supplied()
    if (kind === 'unlinked') removeObjectFromCell(w.objectCells, p)
    if (kind === 'route-only') {
      removeObjectFromCell(w.objectCells, p)
      w.objectCells.objects.delete(p.id)
    }
    if (kind === 'nonmatching') {
      const other = { ...p, displacement: { ...p.displacement } }
      removeObjectFromCell(w.objectCells, p)
      registerLivePerson(w, other)
    }
    if (kind === 'native-owned') u.native = p
    const heads = Array.from(w.objectCells.heads),
      old = { x: p.x, y: p.y, counter: p.counter },
      registered = w.objectCells.objects.get(p.id)
    u.x += 3
    stepLiveRoute(w, u)
    assert.deepEqual(Array.from(w.objectCells.heads), heads)
    assert.equal(w.objectCells.objects.get(p.id), registered)
    if (kind === 'native-owned') assert.deepEqual({ x: p.x, y: p.y, counter: p.counter }, old)
    else {
      const to = nativePosition(w, u)
      assert.equal(p.x, to.x & 65535)
      assert.equal(p.y, to.y & 65535)
      assert.equal(p.counter, 123)
    }
    validCells(w)
  }
})
test('genuine M17 retired encounter route crosses cells and unlinks cleanly through Save/Load twins', async () => {
  const bytes = gunzipSync(
    readFileSync(
      new URL('../references/fixtures/m17-route-cells/before-retirement.v8.gz', import.meta.url)
    )
  )
  assert.equal(
    createHash('sha256').update(bytes).digest('hex'),
    'ce30378c3199cbb4a561cbe7cd74d52065a77f117516ff82bb453fce4672b548'
  )
  await withStorage({}, async ({ freshStore }) => {
    const store = await freshStore()
    store.startMission(17)
    const w = store.getWorld()
    Object.assign(w, migrateCheckpoint(deserialize(bytes)))
    assert.equal(w.turn, 6052)
    const p = w.objectCells.objects.get(4088)
    assert.equal(w.pathfinding.people.get(4088), p)
    assert.equal(w.units.find(u => u.id === 4088).fight.motion, p)
    assert.equal(w.objectCells.heads[13031], 4088)
    validCells(w)
    assert.ok(await store.saveCheckpoint())
    assert.ok(store.loadCheckpoint())
    const twin = store.getWorld(),
      clocks = [w, twin].map(() => ({ animationTime: 0, animationFrame: 0 }))
    for (let n = 0; n < 25; n++) {
      advanceGame(w, clocks[0], 1 / 12)
      advanceGame(twin, clocks[1], 1 / 12)
      assert.deepEqual(w, twin)
      validCells(w)
      if (w.turn === 6055) {
        assert.equal(w.objectCells.objects.has(4088), false)
        assert.notEqual(w.objectCells.heads[13031], 4088)
        assert.ok(w.units.find(u => u.id === 4088).hp > 0)
        assert.equal(w.pathfinding.people.get(4088), p)
      }
    }
  })
})
