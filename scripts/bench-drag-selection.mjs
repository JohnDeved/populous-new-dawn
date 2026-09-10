// Compare complete ordinary-person release commands against the previous source.
// This measures input CPU, not continuous rendering or hardware GPU frame time.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { stripTypeScriptTypes } from 'node:module'
import { cpus } from 'node:os'
import * as model from '../app/model.ts'
import * as drag from '../app/drag-selection.ts'
import * as selection from '../app/person-selection.ts'
import { nativePersonModel } from '../app/live-combat.ts'
import { createLivePerson, syncLivePersonCells } from '../app/live-people.ts'

const revision = '89b2e5c40a15757d01010a0caf29d2b90c37469c'
const source = execFileSync('git', ['show', `${revision}:app/model.ts`], {
  encoding: 'utf8',
  cwd: new URL('..', import.meta.url),
})
const body = source.slice(
  source.indexOf('export function selectArea('),
  source.indexOf('// Native right-click/Escape cancels')
)
const bindings = { ...model, ...drag, ...selection, nativePersonModel }
const before = new Function(
  ...Object.keys(bindings),
  stripTypeScriptTypes(body.replace('export ', '')) + '\nreturn selectArea'
)(...Object.values(bindings))
const w = model.createWorld()
w.units = []
w.selected = []
w.buildings = []
w.objectCells.heads.fill(0)
w.objectCells.objects.clear()
w.land.flags.fill(0)
for (let i = 0; i < 200; i++) {
  const u = model.addUnit(w, 'blue', i % 5 ? 'brave' : 'warrior', {
    x: (i % 20) * 0.5,
    z: 8 + Math.floor(i / 20) * 0.5,
  })
  u.native = createLivePerson(w, u)
}
syncLivePersonCells(w)
const start = model.nativePosition(w, { x: -2, z: 16 }),
  end = model.nativePosition(w, { x: 6, z: 6 })
const packed = drag.dragCommand(start, end, 0)
const invoke = fn => {
  w.selected = []
  w.sounds.length = 0
  fn(w, start, packed, false)
}
const snapshot = () => ({
  selected: w.selected,
  flags: w.units.map(u => [u.native.flags3, u.native.selectionFlags]),
  cues: w.sounds.map(s => s.cue),
})
invoke(before)
const expected = snapshot()
invoke(model.selectArea)
assert.deepEqual(snapshot(), expected)
assert.ok(w.selected.length > 0 && w.selected.length < 200)
const iterations = 1000,
  rounds = 9,
  medians = []
for (const fn of [before, model.selectArea]) {
  for (let i = 0; i < iterations; i++) invoke(fn)
  const samples = []
  for (let round = 0; round < rounds; round++) {
    const start = performance.now()
    for (let i = 0; i < iterations; i++) invoke(fn)
    samples.push(((performance.now() - start) * 1000) / iterations)
  }
  medians.push(samples.sort((a, b) => a - b)[4])
}
console.log(
  JSON.stringify({
    baseline: revision,
    node: process.version,
    cpu: cpus()[0].model,
    people: 200,
    selected: w.selected.length,
    iterations,
    rounds,
    medianMicroseconds: { before: medians[0], after: medians[1] },
  })
)
