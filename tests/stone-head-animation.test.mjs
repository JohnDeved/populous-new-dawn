import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import {
  animateStoneHeads, createStoneHeadAnimation, initializeStoneHead, originalStoneHeadSource,
  stepStoneHeadAnimation, stoneHeadFrame, stoneHeadPositions, stoneHeadRawPoints,
} from '../app/stone-head-animation.ts'
import { createWorld, command } from '../app/model.ts'
import { advanceGame } from '../app/game-clock.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { liveWorshippers } from '../app/live-worship.ts'
import { modelStage } from '../app/model-faces.ts'
import models from '../app/original-models.json' with { type: 'json' }
import data from '../app/original-stone-heads.json' with { type: 'json' }

const source = { triggerIndex: 30, sceneryIndex: 32 }
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const advance = (w, clock, turns) => { for (let i = 0; i < turns; i++) advanceGame(w, clock, 1 / 12) }
function scenario() {
  const w = createWorld(1)
  // Same bounded gameplay fixture as the existing worship regression: isolate
  // Blue actors, but use their normal shared command/order/path/reward handlers.
  w.manaWorld.gameFlags = 32
  w.units = w.units.filter(u => u.team === 'blue')
  w.selected = w.units.map(u => u.id)
  return { w, head: w.shrines.find(s => s.kind === 'bridge'), clock: { animationTime: 0, animationFrame: 0 } }
}
function withoutPresentation(world) {
  const copy = structuredClone(world)
  const clear = s => { delete s.stoneHead; if (s.linkedShrine) clear(s.linkedShrine) }
  copy.shrines.forEach(clear)
  return copy
}

test('only reward-derived model45 sources are initialized; unrelated head families and Vault remain separate', () => {
  const w = createWorld(1), head = w.shrines.find(s => s.kind === 'bridge')
  assert.deepEqual(originalStoneHeadSource(1, head), source)
  assert.equal(head.stoneHead.family, 45)
  assert.equal(head.stoneHead.enabled, true)
  assert.equal(w.shrines.find(s => s.kind === 'vault').stoneHead, undefined)
  assert.ok(createWorld(22).shrines.every(s => !s.stoneHead), 'Mode3 does not masquerade as45')
  assert.equal(originalStoneHeadSource(1, { x: 0, z: 0 }), null)
})

test('enabled idle cycles18native animation visits without followers; hold/refill retain the original counter rules', () => {
  const state = createStoneHeadAnimation(true, source), frames = []
  for (let i = 0; i < 36; i++) { frames.push(stoneHeadFrame(state)); stepStoneHeadAnimation(state, true) }
  assert.deepEqual(frames, [...Array(18).keys(), ...Array(18).keys()])
  for (let i = 0; i < 5; i++) stepStoneHeadAnimation(state, true)
  const counter = state.f1
  for (let i = 0; i < 20; i++) { stepStoneHeadAnimation(state, false); assert.equal(stoneHeadFrame(state), 1); assert.equal(state.f1, counter) }
  stepStoneHeadAnimation(state, true)
  assert.equal(state.f1, 4, 'Refill reselects/reset-to-zero then advances once')
  assert.equal(stoneHeadFrame(state), 1)
  assert.equal(state.renderFlags & 0xc00, 0)
})

test('raw keypoints use base45indices/scale rather than endpoint face layout; all18cached outputs are distinct', () => {
  assert.equal(data.base, 45); assert.equal(data.scale, 150)
  assert.deepEqual(data.segments.map(s => [s.from, s.to, s.duration]), [[46,47,9],[47,46,9]])
  const expectedVertices = modelStage(models[45], 4).p.length / 3
  assert.equal(data.visiblePointIndices.length, expectedVertices)
  const hashes = new Set()
  for (let frame = 0; frame < 18; frame++) {
    const raw = stoneHeadRawPoints(frame), positions = stoneHeadPositions(frame)
    assert.equal(raw.length, 52 * 3)
    assert.equal(positions.length, expectedVertices * 3)
    assert.equal(positions, stoneHeadPositions(frame), 'Unchanged frames reuse bounded caches')
    for (let i = 0; i < data.visiblePointIndices.length; i++) {
      const index = data.visiblePointIndices[i]
      for (let axis = 0; axis < 3; axis++)
        assert.equal(Math.round(positions[i * 3 + axis] * 450 * (axis === 2 ? -1 : 1)), raw[index * 3 + axis])
    }
    hashes.add(digest([...positions]))
  }
  assert.ok(hashes.size >= 9, 'The original morph must visibly vary; symmetric return frames may match')
  assert.deepEqual(stoneHeadRawPoints(0), data.keypoints[46])
  assert.deepEqual(stoneHeadRawPoints(9), data.keypoints[47])
  for (const frame of [-1, 18, NaN, 0.5]) assert.throws(() => stoneHeadRawPoints(frame), RangeError)
})

test('presentation pauses with world and native land pause without touching simulation or RNG', () => {
  const { w, head, clock } = scenario()
  assert.equal(head.followers, 0)
  advance(w, clock, 3)
  assert.notEqual(head.stoneHead.f1, 0, 'No worship required for enabled idle animation')
  const before = structuredClone(head.stoneHead), random = w.randomState
  w.paused = true; advanceGame(w, clock, 3)
  assert.deepEqual(head.stoneHead, before)
  w.paused = false; w.land.landFlags |= 2; animateStoneHeads(w)
  assert.deepEqual(head.stoneHead, before); assert.equal(w.randomState, random)
})

test('normal authored worship earns Bridge stock while presentation leaves the entire gameplay state unchanged', () => {
  const enabled = scenario(), baseline = scenario()
  baseline.w.shrines.forEach(s => { if (s.kind !== 'vault') s.stoneHead = null })
  command(enabled.w, enabled.head); command(baseline.w, baseline.head)
  advance(enabled.w, enabled.clock, 240); advance(baseline.w, baseline.clock, 240)
  assert.ok(enabled.head.uses >= 1 && enabled.w.shots.bridge > 0)
  assert.equal(liveWorshippers(enabled.w, enabled.head).length, 7)
  assert.deepEqual(withoutPresentation(enabled.w), withoutPresentation(baseline.w))
  assert.equal(enabled.w.randomState, baseline.w.randomState)
  assert.deepEqual(enabled.w.cosmeticRandom, baseline.w.cosmeticRandom)
})

test('exhausted trigger does not remove its independent enabled decorative model45 animation', () => {
  const { w, head, clock } = scenario()
  // The final-use counter is an explicit edge fixture; work threshold, admission
  // and completion are still the ordinary authored handler, never forced work.
  head.remaining = 1
  command(w, head)
  advance(w, clock, 260)
  assert.equal(head.active, false); assert.equal(head.remaining, 0)
  assert.ok(head.uses > 0 && w.shots.bridge > 0)
  const before = head.stoneHead.f1
  advanceGame(w, clock, 1 / 24)
  assert.notEqual(head.stoneHead.f1, before)
  assert.equal(head.stoneHead.enabled, true)
})

test('mid-animation new checkpoint keeps phase and old optional-field checkpoint restores safely without rewards', () => {
  const { w, head, clock } = scenario()
  advance(w, clock, 5)
  const restored = migrateCheckpoint(structuredClone(w)), loaded = restored.shrines.find(s => s.id === head.id)
  assert.deepEqual(loaded.stoneHead, head.stoneHead)
  const replayClock = structuredClone(clock)
  advance(w, clock, 3); advance(restored, replayClock, 3)
  assert.deepEqual(loaded.stoneHead, head.stoneHead)
  delete loaded.stoneHead
  const gameplay = withoutPresentation(restored)
  initializeStoneHead(loaded, restored.outcome.level)
  assert.equal(stoneHeadFrame(loaded.stoneHead), 0)
  assert.deepEqual(withoutPresentation(restored), gameplay)
  loaded.enabled = false; delete loaded.stoneHead
  initializeStoneHead(loaded, restored.outcome.level)
  assert.equal(stoneHeadFrame(loaded.stoneHead), 1)
})

test('multiple heads keep separate state while30/60/120/144Hz and irregular schedules share one animation timeline', () => {
  function run(schedule) {
    const { w, head, clock } = scenario()
    command(w, head)
    let elapsed = 0, i = 0
    while (elapsed < 24 - 1e-9) {
      const dt = Math.min(schedule[i++ % schedule.length], 24 - elapsed)
      advanceGame(w, clock, dt); elapsed += dt
    }
    return { states: w.shrines.map(s => s.stoneHead), work: head.work, uses: head.uses,
      shots: w.shots, random: w.randomState, cosmetic: w.cosmeticRandom, frame: clock.animationFrame }
  }
  const expected = run([1 / 60])
  assert.equal(expected.frame, 576)
  for (const schedule of [[1/30], [1/120], [1/144], [0.13,0.007,0.031,0.002]]) assert.deepEqual(run(schedule), expected)
  const { w } = scenario(), heads = w.shrines.filter(s => s.stoneHead)
  assert.notEqual(heads[0].stoneHead, heads[1].stoneHead)
  heads[0].enabled = false; animateStoneHeads(w)
  assert.equal(heads[0].stoneHead.renderFlags & 0x400, 0x400)
  assert.equal(heads[1].stoneHead.renderFlags & 0x400, 0)
})

test('shipped scene updates ordinary head positions byphase and leaves Vault on the existing path', () => {
  const scene = readFileSync(new URL('../app/scene-entities.ts', import.meta.url), 'utf8')
  assert.ok(scene.includes('position.copyArray(stoneHeadPositions(frame))'))
  assert.ok(scene.includes('!!stone || shrine.active'))
  assert.ok(scene.includes('} else if (shrine.morph) {'))
  const clock = readFileSync(new URL('../app/game-clock.ts', import.meta.url), 'utf8')
  assert.ok(clock.indexOf('animateStoneHeads(w)') > clock.indexOf('animateLiveObjects(w)'))
})
