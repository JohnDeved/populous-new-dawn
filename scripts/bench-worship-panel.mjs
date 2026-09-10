// CPU microbenchmark only: bounded panel lookup versus the previous full roster.
import assert from 'node:assert/strict'
import { cpus } from 'node:os'
import { createWorld, command } from '../app/model.ts'
import { advanceGame } from '../app/game-clock.ts'
import { liveWorshippers } from '../app/live-worship.ts'

const w = createWorld(),
  clock = { animationTime: 0, animationFrame: 0 }
w.manaWorld.gameFlags = 32
w.units = w.units.filter(u => u.team === 'blue')
w.selected = w.units.map(u => u.id)
const head = w.shrines.find(s => s.kind === 'bridge')
command(w, head)
for (let i = 0; i < 150; i++) advanceGame(w, clock, 1 / 12)
const before = () => liveWorshippers(w, head).slice(0, head.followers)
const after = () => liveWorshippers(w, head, Math.min(head.required, head.followers))
assert.equal(before().length, 7)
assert.deepEqual(after(), before().slice(0, head.required))
const iterations = 10000,
  medians = []
for (const query of [before, after]) {
  for (let i = 0; i < iterations; i++) query()
  const samples = []
  for (let round = 0; round < 9; round++) {
    const start = performance.now()
    for (let i = 0; i < iterations; i++) query()
    samples.push(((performance.now() - start) * 1000) / iterations)
  }
  medians.push(samples.sort((a, b) => a - b)[4])
}
console.log(
  JSON.stringify({
    node: process.version,
    cpu: cpus()[0].model,
    people: 7,
    visibleSlots: head.required,
    iterations,
    rounds: 9,
    medianMicroseconds: { before: medians[0], after: medians[1] },
  })
)
