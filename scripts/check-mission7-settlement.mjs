#!/usr/bin/env node
import assert from 'node:assert/strict'
import { createWorld, tick } from '../app/model.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
const w = createWorld(7)
const initialIds = new Set(w.units.map(u => u.id))
assert.equal(w.units.filter(u => u.team === 'yellow').length, 11)
while (w.turn < 8000 && w.status === 'playing') tick(w, 1 / 12)
assert.equal(w.turn, 8000)
assert.equal(w.status, 'playing')
const own = w.units.filter(u => u.team === 'yellow')
assert.ok(own.length > 30, 'natural hut births must grow the original roster')
for (const kind of ['warrior', 'preacher'])
  assert.ok(
    own.some(u => u.kind === kind && !initialIds.has(u.id)),
    `naturally trained ${kind}`
  )
for (const kind of ['tower', 'hut', 'camp', 'temple'])
  assert.ok(
    w.buildings.some(b => b.team === 'yellow' && b.kind === kind && b.progress === 1),
    `completed ${kind}`
  )
assert.ok(w.buildings.some(b => b.team === 'yellow' && b.kind === 'hut' && b.level > 1))
const replay = migrateCheckpoint(structuredClone(w))
for (let n = 0; n < 64; n++) {
  tick(w, 1 / 12)
  tick(replay, 1 / 12)
}
assert.deepEqual(replay, w)
console.log(
  JSON.stringify({
    turn: w.turn,
    population: own.length,
    buildings: w.buildings.filter(b => b.team === 'yellow').length,
    checkpointReplay: true,
  })
)
