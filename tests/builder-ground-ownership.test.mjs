import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld } from '../app/model.ts'
import { advanceGame } from '../app/game-clock.ts'
import { syncLivePersonCells } from '../app/live-people.ts'
import { migrateCheckpoint } from '../app/game-store.ts'

function ordinaryBuilder() {
  const w = createWorld(7),
    clock = { animationTime: 0, animationFrame: 0 }
  for (let n = 0; n < 400; n++) {
    advanceGame(w, clock, 1 / 12)
    const u = w.units.find(u => u.builder?.person && u.path.length)
    if (u) return { w, clock, u }
  }
  assert.fail('ordinary M7 construction must acquire a moving builder')
}

function assertOwner(w, u) {
  const p = u.builder.person
  assert.equal(
    w.objectCells.objects.get(u.id),
    p,
    'construction keeps its physical person registered'
  )
  if (u.path.length)
    assert.equal(w.pathfinding.people.get(u.id), p, 'construction route uses its physical person')
}

test('ordinary builder retains one physical owner through reconciliation and checkpoint', () => {
  const { w, clock, u } = ordinaryBuilder()
  assertOwner(w, u)
  syncLivePersonCells(w)
  assertOwner(w, u)
  const replay = migrateCheckpoint(structuredClone(w)),
    replayClock = structuredClone(clock)
  assertOwner(
    replay,
    replay.units.find(other => other.id === u.id)
  )
  for (let n = 0; n < 16; n++) {
    advanceGame(w, clock, 1 / 12)
    advanceGame(replay, replayClock, 1 / 12)
    assert.deepEqual(replay, w)
    if (u.builder?.person) assertOwner(w, u)
  }
})
