import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { deserialize } from 'node:v8'
import { createHash } from 'node:crypto'
import { createWorld, addUnit } from '../app/model.ts'
import {
  createLivePerson,
  registerLivePerson,
  syncBrowserPersonPosition,
  enterLiveCombat,
} from '../app/live-people.ts'
import { browserPosition, wrappedDistance } from '../app/world-coordinates.ts'
import { advanceGame } from '../app/game-clock.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { withStorage } from './support/profile-storage.mjs'
const cell = p => ((p.y & 65535) >> 9) * 128 + ((p.x & 65535) >> 9)
function linked(w, p) {
  assert.equal(w.objectCells.objects.get(p.id), p)
  let id = w.objectCells.heads[cell(p)],
    found = false
  const seen = new Set()
  while (id) {
    assert.ok(!seen.has(id))
    seen.add(id)
    if (id === p.id) found = true
    id = w.objectCells.objects.get(id).cellNext
  }
  assert.ok(found)
}
function supplied() {
  const w = createWorld()
  w.units = []
  w.buildings = []
  w.shrines = []
  w.terrain.fill(3)
  w.terrainVersion++
  const u = addUnit(w, 'blue', 'brave', { x: 0, z: 0 })
  u.native = createLivePerson(w, u)
  registerLivePerson(w, u.native)
  return { w, u, p: u.native }
}
test('ordinary browser pose publication preserves physical identity, same-cell order and cross-cell linkage', () => {
  for (const dx of [0, 0.25, 3]) {
    const { w, u, p } = supplied()
    const before = {
      counter: p.counter,
      random: w.randomState,
      next: w.nextId,
      route: p.motionGroup,
      cell: cell(p),
      head: w.objectCells.heads[cell(p)],
      nextCell: p.cellNext,
      previous: p.cellPrevious,
    }
    const h = p.h
    u.x += dx
    syncBrowserPersonPosition(w, u, p)
    assert.equal(wrappedDistance(u, browserPosition(p)), 0)
    linked(w, p)
    assert.deepEqual(
      { counter: p.counter, random: w.randomState, next: w.nextId, route: p.motionGroup },
      { counter: before.counter, random: before.random, next: before.next, route: before.route }
    )
    if (!dx) assert.equal(p.h, h)
    if (cell(p) === before.cell) {
      assert.equal(w.objectCells.heads[cell(p)], before.head)
      assert.equal(p.cellNext, before.nextCell)
      assert.equal(p.cellPrevious, before.previous)
    } else assert.notEqual(w.objectCells.heads[before.cell], p.id)
    const adopted = enterLiveCombat(w, u, 29)
    assert.equal(adopted, p)
    assert.equal(wrappedDistance(u, browserPosition(p)), 0)
    linked(w, p)
  }
})
test('existing flight, combat and vehicle physical owners are never overwritten by browser reconciliation', () => {
  for (const owner of ['flight', 'fight', 'vehicle']) {
    const { w, u, p } = supplied()
    if (owner === 'flight') u.flight = p
    else if (owner === 'fight') u.fight = { motion: p }
    else p.vehicle = 123
    const original = structuredClone(p)
    u.x += 3
    syncBrowserPersonPosition(w, u, p)
    assert.deepEqual(p, original)
    linked(w, p)
  }
})
test('genuine M17 arena walk publishes current pose before encounter adoption and remains deterministic after Save/Load', async () => {
  const bytes = gunzipSync(
    readFileSync(
      new URL('../references/fixtures/m17-combat-pose/before-encounter.v8.gz', import.meta.url)
    )
  )
  assert.equal(
    createHash('sha256').update(bytes).digest('hex'),
    '908e458d89e5bfcff568b7b36254e4da3e688d9928b4f980ec05933e3948fe5f'
  )
  await withStorage({}, async ({ freshStore }) => {
    const store = await freshStore()
    store.startMission(17)
    const w = store.getWorld()
    Object.assign(w, migrateCheckpoint(deserialize(bytes)))
    assert.equal(w.turn, 6619)
    assert.ok(await store.saveCheckpoint())
    assert.ok(store.loadCheckpoint())
    const twin = store.getWorld()
    const clocks = [
      { animationTime: 0, animationFrame: 0 },
      { animationTime: 0, animationFrame: 0 },
    ]
    let seen = false
    for (let i = 0; i < 80; i++) {
      advanceGame(w, clocks[0], 1 / 12)
      advanceGame(twin, clocks[1], 1 / 12)
      assert.deepEqual(w, twin)
      for (const u of w.units) {
        const p = u.flight ?? u.fight?.motion ?? u.native
        if (p) {
          assert.equal(wrappedDistance(u, browserPosition(p)), 0, `${u.id} at ${w.turn}`)
          linked(w, p)
        }
      }
      const u = w.units.find(u => u.id === 1586)
      if (u?.fight) {
        seen = true
        assert.equal(u.fight.motion, w.objectCells.objects.get(u.id))
      }
    }
    assert.ok(seen, 'actual participant1586 enters an encounter')
    assert.equal(w.status, 'playing')
  })
})
