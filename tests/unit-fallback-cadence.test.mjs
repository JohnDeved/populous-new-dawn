// Legacy elapsed-time unit artwork cadence (#214). Mission 10 people that render
// through the shipped fallback branch (no native frame owner; the step-1 Firewarrior
// and step-0 Brave are supplied area-guard witnesses, see legacyWalkers) are advanced
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
  // Authored computer Firewarriors walk command-25 marker routes through the
  // native movement body (#1042), so no authored step-1 person uses the fallback.
  // Supplied step-1 witness: a Firewarrior given an ordinary Ctrl+Alt area guard
  // (command 11), whose walk still renders through the shipped fallback branch.
  const { addUnit, command, cancelInteraction, selectUnit } = await import('../app/model.ts')
  const shaman = world.units.find(u => u.team === 'blue' && u.kind === 'shaman')
  const supplied = addUnit(world, 'blue', 'firewarrior', { x: shaman.x + 2, z: shaman.z })
  selectUnit(world, supplied.id, false)
  assert.ok(command(world, { x: supplied.x - 14, z: supplied.z }, { ctrlKey: true, altKey: true }))
  cancelInteraction(world)
  // Step-0 control, supplied the same way. The authored control was Green
  // Preacher 5 walking a command-11 guard; natively (0x4cedd0, #1059) a
  // single-marker Preacher only takes the command-3 move, which the native
  // movement body owns, so no authored Brave/Warrior/Preacher uses the fallback.
  const control = addUnit(world, 'blue', 'brave', { x: shaman.x + 2, z: shaman.z + 2 })
  selectUnit(world, control.id, false)
  assert.ok(command(world, { x: control.x - 14, z: control.z }, { ctrlKey: true, altKey: true }))
  cancelInteraction(world)
  api.tick(world, 1 / 12)
  assert.equal(world.objectCells.objects.get(supplied.id), supplied.native)
  assert.equal(world.objectCells.objects.get(control.id), control.native)
  const firewarrior = world.units.find(u => u.kind === 'firewarrior' && legacy(u))
  const brave = world.units.find(u => ['brave', 'warrior', 'preacher'].includes(u.kind) && u.team !== 'wild' && legacy(u))
  assert.equal(firewarrior, supplied, 'supplied legacy-walking Firewarrior')
  assert.equal(brave, control, 'supplied legacy-walking step-0 control (Brave)')
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

test('rendering the fallback does not change simulation outcomes (rendered vs unrendered run)', async () => {
  const a = await observe(1, 60, 2), b = await legacyWalkers()
  const clock = { animationTime: 0, animationFrame: 0 }
  for (let i = 0; i < 120; i++) b.api.advanceGame(b.world, clock, 1 / 60)
  assert.equal(a.world.turn, b.world.turn)
  assert.deepEqual(
    a.world.units.map(u => [u.id, u.x, u.z, u.hp]),
    b.world.units.map(u => [u.id, u.x, u.z, u.hp])
  )
})
