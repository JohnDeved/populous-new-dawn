import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash } from 'node:crypto'
import vectors from './fixtures/building-acquisition-source.json' with { type: 'json' }
import { createWorshipAcquisitionState, startBuildingAcquisition, startWorshipAcquisition, stepWorshipAcquisition, getWorshipAcquisitionDrawCommands } from '../app/worship-acquisition.ts'
import { random } from '../app/native-math.ts'
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const geometry = (target = [25, 286], origin = [420, 180]) => ({
  viewport: { x: 100, y: 0, width: 540, height: 480 },
  origin: { x: origin[0], y: origin[1] }, target: { x: target[0], y: target[1] },
  targetRect: { x: target[0] - 23, y: target[1] - 26, width: 46, height: 52 },
  targetHud: { x: target[0], y: target[1] }, hudScale: 1,
})
for (const sample of vectors.cases) test(`source-derived controller/vertices/shared RNG: ${sample.name}`, () => {
  const state = createWorshipAcquisitionState(), rng = { randomState: sample.seed }
  startBuildingAcquisition(state, { giftId: 900, geometry: geometry([25, 286], sample.name.endsWith('fallback') ? [370, 240] : [420, 180]) }, () => random(rng))
  assert.equal(rng.randomState, sample.initialPostBuildingRng)
  for (const expected of sample.rows) {
    const [ui, paused] = expected
    if (sample.name === `103-spell-overlap-${ui}`) startWorshipAcquisition(state, { giftId: 950, model: 3, geometry: geometry([80, 364], [250, 300]) })
    const result = stepWorshipAcquisition(state, { paused: !!paused, random: () => random(rng) })
    const c = state.building, draw = state.drawCommands.find(command => command.kind === 'building')
    const actual = [ui, paused, c.phase, c.visits, draw?.whole ? 1 : 0, draw?.selected ?? [],
      c.faces.filter(face => face.flags & 1).length, c.allStarted ? 1 : 0,
      state.companion?.active ? 1 : 0, state.pulse?.active ? state.pulse.remaining : 0,
      state.spell?.active ? 1 : 0, result.limiterActive ? 1 : 0, rng.randomState,
      hash(c.faces), hash(draw?.submissions.map(({ face, transformed, projected }) => ({ face, transformed, projected })) ?? []),
      hash(state.drawCommands.filter(command => command.kind !== 'building').map(d => [d.kind, d.frame, d.x, d.y, d.palette ?? null]))]
    assert.deepEqual(actual, expected, `UI visit ${ui}`)
  }
  assert.equal(state.building.active, false)
})

test('building replacement, pure draw and restore keep distinct owners without replay', () => {
  const state = createWorshipAcquisitionState(), rng = { randomState: 1 }
  startWorshipAcquisition(state, { giftId: 1, model: 3, geometry: geometry([80, 364]) })
  const spell = state.spell
  startBuildingAcquisition(state, { giftId: 2, geometry: geometry() }, () => random(rng))
  assert.equal(state.spell, spell)
  for (let ui = 0; ui < 95; ui++) stepWorshipAcquisition(state, { paused: false, random: () => random(rng) })
  const pulse = state.pulse, companion = state.companion
  startBuildingAcquisition(state, { giftId: 3, geometry: geometry() }, () => random(rng))
  assert.equal(state.spell, spell)
  assert.equal(state.pulse, pulse)
  assert.notEqual(state.companion, companion)
  assert.equal(state.companion.giftId, 3)
  const restored = structuredClone({ state, rng }), saved = structuredClone({ state, rng })
  for (let draw = 0; draw < 20; draw++) getWorshipAcquisitionDrawCommands(state)
  assert.deepEqual({ state, rng }, saved)
  for (let ui = 0; ui < 140; ui++) {
    const paused = ui === 5 || ui === 6
    const a = stepWorshipAcquisition(state, { paused, random: () => random(rng) })
    const b = stepWorshipAcquisition(restored.state, { paused, random: () => random(restored.rng) })
    assert.deepEqual(a, b)
    assert.deepEqual({ state, rng }, restored)
  }
})
