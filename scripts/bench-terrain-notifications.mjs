// Paired complete-turn comparison at the terrain-change spike. Unchanged modules
// are shared; model.ts and its extracted world turn are loaded from the baseline commit.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { writeFile, rm } from 'node:fs/promises'
import { cpus } from 'node:os'
import { createWorld, addUnit, addBuilding, command, tick, GRID } from '../app/model.ts'
const baseline = process.argv[2] ?? '8cbe966'
const source = new URL('../app/.terrain-notifications-baseline.ts', import.meta.url)
const turn = new URL('../app/.terrain-notifications-world-turn-baseline.ts', import.meta.url)
const show = path => { try { return execFileSync('git', ['show', `${baseline}:app/${path}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }) } catch { return null } }
try {
  let model = show('model.ts')
  const previousTurn = show('world-turn.ts')
  assert.ok(model, 'baseline must contain model.ts')
  if (previousTurn) {
    assert.ok(model.includes("'./world-turn.ts'"), 'baseline model must import its world turn')
    await writeFile(turn, previousTurn)
    model = model.replace("'./world-turn.ts'", "'./.terrain-notifications-world-turn-baseline.ts'")
  } else assert.ok(model.includes('function stepTurn('), 'historical baseline model must contain its world turn')
  await writeFile(source, model)
  const previous = (await import(source.href)).tick
  const seed = createWorld()
  Object.assign(seed, { units: [], buildings: [], trees: [], shrines: [] })
  seed.manaWorld.gameFlags = 96
  seed.terrain.fill(0)
  for (let z = -9; z <= 9; z++) for (let x = -29; x <= 29; x++)
    if (x <= -10 || x >= 10) seed.terrain[(z + 48) * GRID + x + 48] = 3
  seed.terrainVersion++
  const hut = addBuilding(seed, 'red', 'hut', { x: 20, z: 0 })
  for (let i = 0; i < 200; i++) addUnit(seed, 'blue', 'warrior', { x: -20 + i % 20 / 5, z: Math.floor(i / 20) / 5 })
  seed.selected = seed.units.map(u => u.id)
  command(seed, hut, { ctrlKey: true })
  command(seed, { x: 20, z: 6 })
  const samples = [[], []], invoke = [previous, tick]
  for (let trial = 0; trial < 30; trial++) {
    const worlds = [structuredClone(seed), structuredClone(seed)]
    for (const mode of trial % 2 ? [1, 0] : [0, 1]) {
      const w = worlds[mode]
      for (let i = 0; i < 120; i++) invoke[mode](w, 1 / 12)
      assert.ok(w.units.every(u => u.native?.state === 33))
      w.terrain.fill(3); w.terrainVersion++
      const start = performance.now()
      invoke[mode](w, 1 / 12)
      const elapsed = performance.now() - start
      if (trial >= 10) samples[mode].push(elapsed)
    }
    assert.deepEqual(worlds[1], worlds[0], `complete terrain-change turn ${trial}`)
    if (trial === 29) {
      for (let turn = 121; turn < 600; turn++) {
        previous(worlds[0], 1 / 12); tick(worlds[1], 1 / 12)
        assert.deepEqual(worlds[1].units, worlds[0].units, `recovery turn ${turn}`)
      }
      assert.deepEqual(worlds[1], worlds[0], 'complete arrival state')
      assert.equal(worlds[1].buildingOrders.active, 0)
      assert.equal(worlds[1].buildings.find(b => b.id === hut.id)?.hp ?? 0, 0)
    }
  }
  const stats = samples => {
    const sorted = samples.toSorted((a, b) => a - b)
    return { median: sorted[10], p95: sorted[19], max: sorted.at(-1) }
  }
  console.log(JSON.stringify({ date: new Date().toISOString(), baseline, cpu: cpus()[0].model, node: process.version,
    people: 200, warmups: 10, pairedSamples: 20, milliseconds: { before: stats(samples[0]), after: stats(samples[1]) }, samples,
    scope: 'Complete simulation turn joining two islands after 120 blocked turns; alternating pairs. Full world equality after each pair; final pair continues to turn 600, comparing people every turn and the final full world. No renderer or hardware FPS claim.' }, null, 2))
} finally { await rm(source, { force: true }); await rm(turn, { force: true }) }
