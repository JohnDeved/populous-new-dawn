#!/usr/bin/env node
import assert from 'node:assert/strict'
import { createWorld, tick } from '../app/model.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { advanceGame } from '../app/game-clock.ts'
// Reviewed current-port outcome observation after canonical native-order builder
// physics, not an original-game deadline. Historical 8000 failure and first RNG
// divergence are retained in references/builder-ground-motion.md. Keep every
// outcome assertion and the complete 64-turn checkpoint twin under both clocks.
const CURRENT_PORT_SETTLEMENT_TURN = 9216

for (const shipped of [false, true]) {
  const w = createWorld(7),
    clock = { animationTime: 0, animationFrame: 0 }
  const advance = (world, timing) =>
    shipped ? advanceGame(world, timing, 1 / 12) : tick(world, 1 / 12)
  const initialIds = new Set(w.units.map(u => u.id))
  assert.equal(w.units.filter(u => u.team === 'yellow').length, 11)
  while (w.turn < CURRENT_PORT_SETTLEMENT_TURN && w.status === 'playing') advance(w, clock)
  assert.equal(w.turn, CURRENT_PORT_SETTLEMENT_TURN)
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
  const replay = migrateCheckpoint(structuredClone(w)),
    replayClock = structuredClone(clock)
  for (let n = 0; n < 64; n++) {
    advance(w, clock)
    advance(replay, replayClock)
  }
  assert.deepEqual(replay, w)
  console.log(
    JSON.stringify({
      clock: shipped ? 'shipped advanceGame' : 'simulation-only tick',
      currentPortSettlementTurn: CURRENT_PORT_SETTLEMENT_TURN,
      turn: w.turn,
      population: own.length,
      buildings: w.buildings.filter(b => b.team === 'yellow').length,
      checkpointReplay: true,
    })
  )
}
