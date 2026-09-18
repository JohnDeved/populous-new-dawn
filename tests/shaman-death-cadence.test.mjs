import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, select, command, tick } from '../app/model.ts'
import { advanceGame } from '../app/game-clock.ts'
import { migrateCheckpoint } from '../app/game-store.ts'

const clock = () => ({ animationTime: 0, animationFrame: 0 })
const deathEffect = w => w.effects.find(f => f.reincarnation?.team === 'blue')
let phases
function phaseWorld(phase = 0) {
  if (!phases) {
    // Authored Mission 2, normal command/movement/combat: no HP, position,
    // entity, RNG, AI, phase or outcome injection to create this death.
    const w = createWorld(2), shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
    select(w, 'shaman')
    assert.equal(command(w, w.units.find(u => u.id === 13)), true)
    for (let i = 0; i < 2000 && !deathEffect(w); i++) tick(w, 1 / 12)
    assert.equal(shaman.hp, 0)
    assert.equal(w.units.includes(shaman), false)
    assert.equal(deathEffect(w)?.reincarnation.phase, 0)
    assert.equal(w.effects.filter(f => f.reincarnation?.team === 'blue').length, 1)
    phases = [structuredClone(w)]
    for (let i = 0; i < 200 && !phases[4]; i++) {
      tick(w, 1 / 12)
      const phase = deathEffect(w).reincarnation.phase
      phases[phase] ??= structuredClone(w)
    }
    assert.ok(phases[4])
  }
  return structuredClone(phases[phase])
}
const pose = f => [f.reincarnation.displayedFrame, f.animation?.f2]

// Native 005029d0 entry resets; 004a4c07 draws before 004a4c9a advances.
// These use the actual presentation clock, not a direct helper invocation.
test('first and second actual presentation visits display 0 then 1, not 1 then 2', () => {
  for (const phase of [0, 2]) {
    const w = phaseWorld(phase), c = clock(), f = deathEffect(w)
    w.speed = 0
    assert.deepEqual(pose(f), [0, 0], `phase ${phase} entry`)
    advanceGame(w, c, 1 / 24)
    assert.deepEqual(pose(f), [0, 1], `phase ${phase} first visit`)
    advanceGame(w, c, 1 / 24)
    assert.deepEqual(pose(f), [1, 2], `phase ${phase} second visit`)
    advanceGame(w, c, 0)
    assert.deepEqual(pose(f), [1, 2], 'repeated render without elapsed time is read-only')
  }
})

test('normal processed phases reset, loop independently of simulation, then freeze and hide', async () => {
  const { shamanDeathVfx } = await import('../app/shaman-death-vfx.ts')
  const w = phaseWorld(), c = clock()
  for (let phase = 0; phase <= 4; phase++) {
    while (deathEffect(w).reincarnation.phase < phase) { w.speed = 1; tick(w, 1 / 12) }
    const f = deathEffect(w), expected = phase >= 3 ? 9 : 0
    assert.deepEqual(pose(f), [expected, expected], `processed phase ${phase} resets`)
    assert.equal(f.animation.object, [680, 352, 360, 360, 360][phase])
    w.speed = 0
    const frames = []
    for (let i = 0; i < 22; i++) { advanceGame(w, c, 1 / 24); frames.push(f.reincarnation.displayedFrame) }
    assert.deepEqual(frames, Array.from({ length: 22 }, (_, i) => phase >= 3 ? 9 : i % [8, 1, 10][phase]))
    assert.deepEqual(shamanDeathVfx(phase, f.reincarnation.displayedFrame), {
      visible: phase < 4, frame: phase >= 3 ? 9 : 21 % [8, 1, 10][phase],
    })
  }
})

test('new checkpoints retain shown/next frames; legacy checkpoints start at a bounded deterministic frame', async () => {
  const { shamanDeathVfx } = await import('../app/shaman-death-vfx.ts')
  for (const phase of [0, 2, 3, 4]) {
    const w = phaseWorld(phase), c = clock()
    w.speed = 0
    advanceGame(w, c, 3 / 24)
    const restored = migrateCheckpoint(structuredClone(w))
    assert.deepEqual(deathEffect(restored), deathEffect(w))
    advanceGame(w, c, 1 / 24)
    advanceGame(restored, clock(), 1 / 24)
    assert.deepEqual(deathEffect(restored), deathEffect(w))
    assert.deepEqual(restored.respawns, w.respawns)
    assert.equal(restored.randomState, w.randomState)
    const legacy = structuredClone(restored), f = deathEffect(legacy)
    delete f.animation
    delete f.reincarnation.displayedFrame
    const loaded = migrateCheckpoint(legacy), before = structuredClone(loaded)
    assert.deepEqual(shamanDeathVfx(phase, deathEffect(loaded).reincarnation.displayedFrame), {
      visible: phase < 4, frame: phase >= 3 ? 9 : 0,
    })
    assert.deepEqual(loaded, before, 'render fallback must not initialize or replay simulation')
    const lc = clock()
    advanceGame(loaded, lc, 1 / 24)
    assert.deepEqual(pose(deathEffect(loaded)), phase >= 3 ? [9, 9] : [0, 1])
    advanceGame(loaded, lc, 1 / 24)
    assert.deepEqual(pose(deathEffect(loaded)), phase >= 3 ? [9, 9] : [1, 2])
    assert.deepEqual(loaded.respawns, before.respawns)
    assert.equal(loaded.randomState, before.randomState)
  }
})

test('pause and native land-pause freeze the latch as well as the counter', () => {
  for (const landPause of [false, true]) {
    const w = phaseWorld(), c = clock()
    w.speed = 0
    advanceGame(w, c, 2 / 24)
    if (landPause) w.land.landFlags |= 2
    else w.paused = true
    const before = structuredClone(deathEffect(w))
    advanceGame(w, c, 10)
    assert.deepEqual(deathEffect(w), before)
  }
})

function gameplay(w) {
  const result = structuredClone(w)
  result.pendingTime = 0
  for (const f of result.effects) if (f.reincarnation) {
    delete f.animation
    delete f.reincarnation.displayedFrame
  }
  return result
}
function advance(w, c, seconds, schedule) {
  for (let i = 0; seconds > 1e-10; i++) {
    const dt = Math.min(seconds, schedule[i % schedule.length])
    advanceGame(w, c, dt)
    seconds -= dt
  }
}

test('render schedules and effect-only animation cannot change gameplay, either RNG or respawn', () => {
  const schedules = [30, 60, 120, 144].map(hz => [1 / hz]).concat([[0.007, 0.08, 0.013, 0.4]])
  for (const speed of [0, 0.25, 1, 4, 400]) {
    const seconds = speed ? 140 / (12 * speed) : 1
    let reference
    for (const schedule of schedules) {
      const w = phaseWorld(), control = structuredClone(w), c = clock(), cc = clock()
      w.speed = control.speed = speed
      // Use the existing stamp gate to suppress only this effect's animation;
      // phase setters preserve these fields. All normal game systems still run.
      Object.assign(deathEffect(control).animation, { flags3: 0x40000, stamp: 1 })
      advance(w, c, seconds, schedule)
      advance(control, cc, seconds, schedule)
      assert.deepEqual(gameplay(w), gameplay(control), `presentation-neutral speed ${speed}`)
      const state = { world: gameplay(w), effect: deathEffect(w), clock: c.animationFrame }
      if (state.effect) state.effect = structuredClone(state.effect)
      reference ??= state
      assert.deepEqual(state, reference, `render schedule ${schedule}, speed ${speed}`)
    }
  }
})

test('ordinary combat death finishes existing wait and respawn without a duplicate effect', () => {
  const w = phaseWorld(), oldId = 54, c = clock()
  w.speed = 1
  for (let i = 0; i < 1000 && deathEffect(w); i++) advanceGame(w, c, 1 / 24)
  assert.equal(deathEffect(w), undefined)
  assert.equal(w.status, 'playing')
  const shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
  assert.ok(shaman && shaman.id !== oldId)
  assert.equal(w.respawns[0], 0)
})
