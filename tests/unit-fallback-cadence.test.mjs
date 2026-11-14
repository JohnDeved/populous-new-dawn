// Legacy elapsed-time unit artwork cadence (#214). Authored Mission 10 people that
// render through the shipped fallback branch (no native frame owner) are advanced
// by the actual game clock and drawn by the actual Scene unit loop in Node.
// The original advances person draw descriptors in mode 2 once per (step + 1)
// logical visits; the Firewarrior's descriptor 18 has step 1, Braves' 14 step 0.
import assert from 'node:assert/strict'
import test from 'node:test'
import { makeSceneFixture } from './support/bloodlust-scene.mjs'

async function legacyWalkers() {
  const { loadSceneFixture } = await import('./support/bloodlust-scene.mjs')
  const api = await loadSceneFixture()
  const { unitRenderAnimationSource } = await import('../app/unit-animation-source.ts')
  const world = api.createWorld(10)
  for (let turn = 0; turn < 48; turn++) api.tick(world, 1 / 12)
  const legacy = u => !unitRenderAnimationSource(u) && api.unitAnimation(world, u) === 'walk'
  const firewarrior = world.units.find(u => u.kind === 'firewarrior' && legacy(u))
  const brave = world.units.find(u => ['brave', 'warrior', 'preacher'].includes(u.kind) && u.team !== 'wild' && legacy(u))
  assert.ok(firewarrior, 'authored legacy-walking Firewarrior')
  assert.ok(brave, 'authored legacy-walking step-0 control (Brave/Warrior/Preacher)')
  return { api, world, ids: [firewarrior.id, brave.id], legacy }
}

// Cycle index shown for one unit: locate the rendered frame inside the
// direction cycle the Scene supplied (walk cycles have distinct frames).
function shownIndex(calls, g) {
  const call = calls.findLast(args => args[0] === g)
  assert.ok(call, 'unit drawn through Scene.animatePerson')
  const [, , directions, , , frameNumber] = call
  assert.equal(frameNumber, undefined, 'fallback branch, not a native frame owner')
  for (const cycle of directions) {
    const index = cycle.frames.indexOf(g.userData.frame)
    if (index >= 0) return { index, length: cycle.frames.length }
  }
  assert.fail(`frame ${g.userData.frame} not in supplied directions`)
}

async function observe(speed, refresh, seconds) {
  const { api, world, ids, legacy } = await legacyWalkers()
  world.speed = speed
  const fixture = await makeSceneFixture(world)
  const calls = []
  fixture.scene.animatePerson = (...args) => {
    calls.push(args)
    return api.animatePerson(fixture.scene, ...args)
  }
  const clock = { animationTime: 0, animationFrame: 0 }
  const samples = new Map(ids.map(id => [id, []]))
  try {
    for (let i = 0; i < seconds * refresh; i++) {
      api.advanceGame(world, clock, 1 / refresh)
      calls.length = 0
      fixture.render()
      for (const id of ids) {
        const u = world.units.find(unit => unit.id === id)
        const g = fixture.scene.unitMeshes.get(id)
        if (!u || !legacy(u) || !g?.visible) continue
        samples.get(id).push({ turn: world.turn, since: g.userData.since, ...shownIndex(calls, g) })
      }
    }
  } finally {
    fixture.close()
  }
  return { world, ids, samples }
}

// Logical turns per displayed cycle step over each uninterrupted run of one
// state (same `since`), accumulating every observed step including wraps.
function turnsPerStep(samples) {
  const runs = new Map()
  for (const s of samples) {
    if (!runs.has(s.since)) runs.set(s.since, [])
    runs.get(s.since).push(s)
  }
  const spans = []
  for (const run of runs.values()) {
    let steps = 0
    for (let i = 1; i < run.length; i++) {
      // Consecutive samples are at most one logical turn apart here.
      assert.ok(run[i].turn - run[i - 1].turn <= 1)
      steps += (run[i].index - run[i - 1].index + run[i].length) % run[i].length
    }
    const turns = run.at(-1).turn - run[0].turn
    if (turns >= 8) spans.push(turns / steps)
  }
  return spans
}

for (const [speed, refresh] of [
  [1, 60],
  [2, 144],
  [1, 30],
]) {
  test(`legacy fallback follows the native descriptor hold at ${speed}x / ${refresh} Hz`, async () => {
    const { ids, samples } = await observe(speed, refresh, 3)
    const [firewarrior, brave] = ids.map(id => samples.get(id))
    assert.ok(firewarrior.length > 20 && brave.length > 20, 'both units sampled while legacy-walking')
    // One cycle step per two logical turns (descriptor 18 step 1) vs one per turn.
    for (const span of turnsPerStep(firewarrior)) assert.ok(span >= 1.75 && span <= 2.3, `Firewarrior ${span} turns/step`)
    for (const span of turnsPerStep(brave)) assert.ok(span >= 0.9 && span <= 1.15, `Brave ${span} turns/step`)
    assert.ok(turnsPerStep(firewarrior).length && turnsPerStep(brave).length)
    // Exact holds: every displayed step is floor(turns since the state began /
    // turns per frame), so no frame is shortened or doubled by rounding.
    for (const [series, hold] of [
      [firewarrior, 2],
      [brave, 1],
    ])
      for (const s of series)
        assert.equal(
          s.index,
          Math.floor((s.turn - Math.round(s.since * 12)) / hold) % s.length,
          `turn ${s.turn} since ${s.since} hold ${hold}`
        )
    // Within one logical turn the displayed step never changes (no presentation
    // or refresh-rate dependence of the elapsed-time adapter).
    for (const series of [firewarrior, brave])
      for (let i = 1; i < series.length; i++)
        if (series[i].turn === series[i - 1].turn && series[i].since === series[i - 1].since)
          assert.equal(series[i].index, series[i - 1].index)
  })
}

test('fallback cadence is presentation-only: simulation outcomes are unchanged', async () => {
  const a = await observe(1, 60, 2), b = await legacyWalkers()
  const clock = { animationTime: 0, animationFrame: 0 }
  for (let i = 0; i < 120; i++) b.api.advanceGame(b.world, clock, 1 / 60)
  assert.equal(a.world.turn, b.world.turn)
  assert.deepEqual(
    a.world.units.map(u => [u.id, u.x, u.z, u.hp]),
    b.world.units.map(u => [u.id, u.x, u.z, u.hp])
  )
})
