import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, addUnit } from '../app/model.ts'
import { stepComputerTasks } from '../app/computer-runtime.ts'
import { campaignRules, campaignCommand } from '../app/campaign-command-runtime.ts'
import { requestConvertTask } from '../app/computer-convert.ts'

function fixture() {
  const w = createWorld(7)
  // Controlled producer isolation: retain the real producer table and caller,
  // disable competing building/training states, never request type2 directly.
  w.ai.states = 4
  for (const task of w.ai.tasks) task.flags = 0
  w.turn = 61
  return w
}
const active = w => w.ai.tasks.filter(t => t.flags & 1 && t.type === 2)

test('M7 real producer allocates Convert with zero mana and empty stock', () => {
  const w = fixture()
  w.manaTribes[2].mana = 0
  assert.equal(w.manaWorld.spells[2].stocks[17], 0)
  stepComputerTasks(w, 2)
  assert.equal(active(w).length, 1)
  assert.equal(active(w)[0].phase, 0)
  assert.equal(w.manaTribes[2].mana, 0)
})
for (const gate of ['off', 'no-wild', 'duplicate', 'full-pool'])
  test(`M7 actual producer respects ${gate}`, () => {
    const w = fixture()
    if (gate === 'off') w.ai.states = 0
    if (gate === 'no-wild') w.units = w.units.filter(u => u.team !== 'wild')
    if (gate === 'duplicate') requestConvertTask(w.ai, 4, 1)
    if (gate === 'full-pool') for (const t of w.ai.tasks) Object.assign(t, { flags: 1, type: 0 })
    const before = structuredClone(w.ai.tasks)
    stepComputerTasks(w, 2)
    assert.deepEqual(w.ai.tasks, before)
  })

test('M7 actual dispatcher continues an allocated task after authored OFF', () => {
  const w = fixture()
  requestConvertTask(w.ai, 4, 1)
  w.ai.tasks[0].phase = 6
  campaignCommand(w, 1030, [1023])
  assert.equal(w.ai.states & 4, 0)
  w.turn = 1
  w.ai.cursor = 0
  const rng = w.randomState
  stepComputerTasks(w, 2)
  assert.equal(w.ai.tasks[0].phase, 7)
  assert.equal(w.randomState, rng)
})

test('M7 retained EVERY255 threshold is OFF above29, ON below20, otherwise retained', () => {
  for (const population of [19, 20, 29, 30]) for (const initial of [0, 4]) {
    const w = createWorld(7)
    while (w.units.filter(u => u.team === 'yellow').length < population)
      addUnit(w, 'yellow', 'brave', { x: 0, z: 0 })
    w.ai.states = (w.ai.states & ~4) | initial
    w.turn = 253
    campaignRules(w)
    assert.equal(w.ai.states & 4, initial)
    w.turn = 254
    campaignRules(w)
    assert.equal(w.ai.states & 4, population > 29 ? 0 : population < 20 ? 4 : initial)
  }
})
