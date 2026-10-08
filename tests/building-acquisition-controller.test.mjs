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

test('face draw interpolation and resize preserve source state and replacement identity', async () => {
  const { interpolateBuildingSubmissions, buildingDrawPoint } = await import('../app/worship-acquisition-layout.ts')
  const { collectBuildingAcquisitionTriangles } = await import('../app/building-acquisition-triangles.ts')
  const state = createWorshipAcquisitionState(), rng = { randomState: 1 }
  startBuildingAcquisition(state, { giftId: 900, geometry: geometry() }, () => random(rng))
  for (let ui = 0; ui < 95; ui++) stepWorshipAcquisition(state, { paused: false, random: () => random(rng) })
  const previous = state.drawCommands.find(command => command.kind === 'building')
  stepWorshipAcquisition(state, { paused: false, random: () => random(rng) })
  const current = state.drawCommands.find(command => command.kind === 'building'), before = structuredClone({ state, rng, previous })
  const resized = { viewport: { x: 150, y: 0, width: 1130, height: 960 }, targetRect: { x: 10, y: 522, width: 92, height: 104 }, targetHud: { x: 28, y: 287 }, hudScale: 2 }
  for (const fraction of [0, .25, .5, 1]) {
    const submissions = interpolateBuildingSubmissions(current, previous, fraction)
    const triangles = collectBuildingAcquisitionTriangles({ whole: current.whole, submissions }, { width: 640, height: 480 })
    for (const triangle of triangles)
      for (const point of triangle.points) {
        const mapped = buildingDrawPoint(point, current.geometry, resized, triangle.flight)
        assert.ok(Number.isFinite(mapped.x + mapped.y))
      }
    assert.deepEqual({ state, rng, previous }, before)
  }
  assert.deepEqual(buildingDrawPoint(current.geometry.target, current.geometry, resized, 1), { x: 56, y: 574 })
  const a = buildingDrawPoint({ x: 370, y: 240 }, current.geometry, resized, 0),
    b = buildingDrawPoint({ x: 380, y: 250 }, current.geometry, resized, 0)
  assert.deepEqual({ x: b.x - a.x, y: b.y - a.y }, { x: 20, y: 20 }, 'model proportions follow uniform HUD scale, not viewport aspect')
  const replaced = { ...current, giftId: 901 }
  assert.equal(interpolateBuildingSubmissions(replaced, previous, .5), replaced.submissions)
  const first = interpolateBuildingSubmissions(current, previous, 0)
  assert.deepEqual(first.map(face => face.projected), previous.submissions.map(face => face.projected))
})
