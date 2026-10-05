import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, createGift, tick } from '../app/model.ts'
import { advanceGame } from '../app/game-clock.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { startWorshipAcquisition } from '../app/worship-acquisition.ts'
import { startPendingWorshipAcquisitions, visitWorshipAcquisition, worshipDeadline } from '../app/worship-acquisition-runtime.ts'
import { worshipDrawPoint, worshipHandoffGeometry, interpolateWorshipPoint } from '../app/worship-acquisition-layout.ts'

const geometry = (model = 12) => ({
  viewport: { x: 100, y: 0, width: 540, height: 480 },
  origin: { x: 420, y: 180 }, target: { x: model === 3 ? 80 : 48, y: model === 4 ? 320 : 364 },
  targetRect: { x: model === 3 ? 65 : 33, y: model === 4 ? 299 : 343, width: 31, height: 43 },
  targetHud: { x: model === 3 ? 80 : 48, y: model === 4 ? 320 : 364 }, hudScale: 1,
})
const schedules = [[1 / 30], [1 / 60], [1 / 120], [1 / 144], [.007, .13, .28, .003, .6]]
function advance(world, clock, seconds, schedule) {
  for (let i = 0; seconds > 1e-10; i++) {
    const dt = Math.min(seconds, schedule[i % schedule.length])
    advanceGame(world, clock, dt)
    seconds -= dt
  }
}
function binding(world, events = [], getGeometry = gift => geometry(gift.ordinaryWorship.model)) {
  const clock = {
    animationTime: 0, animationFrame: 0,
    afterTurn() {
      startPendingWorshipAcquisitions(world, {
        cue: () => events.push(['cue', world.turn]),
        geometry: gift => { events.push(['handoff', gift.reward, world.turn]); return getGeometry(gift) },
        failed: gift => events.push(['failed', gift.id, world.turn]),
      })
      if (world.giftCounts.bridge !== (clock.gifts ?? 0)) {
        clock.gifts = world.giftCounts.bridge
        events.push(['payout', world.turn, world.shots.bridge, world.giftCounts.bridge])
      }
    },
    worshipVisit() {
      const before = world.gifts.map(g => [g.id, g.remaining]), time = world.worshipAcquisition.clock.nextVisit
      visitWorshipAcquisition(world, model => events.push(['reselect', model, time]))
      for (const [id, remaining] of before) {
        const gift = world.gifts.find(g => g.id === id)
        if (remaining > 1 && gift?.remaining === 1) events.push(['clamp', gift.reward, time, world.turn])
      }
    },
  }
  return clock
}

test('native before/after limiter selection owns activation, active and tail deadlines', () => {
  const clock = { elapsed: 100, nextVisit: 100, limiter: 4, normalRate: 40 }
  assert.equal(worshipDeadline(clock, 0), 116)
  assert.equal(worshipDeadline(clock, 4), 150)
  clock.limiter = 0
  assert.equal(worshipDeadline(clock, 4), 125)
  clock.limiter = 6
  assert.equal(worshipDeadline(clock, 6), 171)
  clock.limiter = 1
  assert.equal(worshipDeadline(clock, 1), 141)
  clock.limiter = 0
  clock.normalRate = 12
  assert.equal(worshipDeadline(clock, 4), 183)
  clock.normalRate = 60
  assert.equal(worshipDeadline(clock, 4), 116)
})

test('ordinary phase handoff, arrival and next-object payout keep elapsed deadlines across refresh schedules', () => {
  const results = schedules.map(schedule => {
    const world = createWorld(), head = world.shrines.find(s => s.kind === 'bridge'), events = []
    head.reset = false
    head.forced = true
    const clock = binding(world, events)
    advance(world, clock, 3, schedule)
    assert.equal(world.shots.bridge, 1)
    assert.equal(world.giftCounts.bridge, 1)
    assert.equal(events.filter(e => e[0] === 'cue').length, 1)
    assert.equal(events.filter(e => e[0] === 'clamp').length, 1)
    assert.equal(events.filter(e => e[0] === 'payout').length, 1)
    const clamp = events.find(e => e[0] === 'clamp'), payout = events.find(e => e[0] === 'payout')
    assert.equal(payout[1], clamp[3] + 1, 'only the next gift object visit grants stock')
    assert.deepEqual(world.worshipAcquisition.controllers.drawCommands, [])
    assert.ok(!world.effects.some(effect => effect.kind === 'birth'))
    return { events, controllers: world.worshipAcquisition.controllers, random: world.cosmeticRandom, turn: world.turn }
  })
  results.forEach(result => assert.deepEqual(result, results[0]))
})

test('simultaneous authored M1 handoffs use native clone priority without reversing payouts', () => {
  const world = createWorld(), events = [], clock = binding(world, events)
  for (const head of world.shrines.filter(s => s.ordinarySpellReward)) {
    head.reset = false
    head.forced = true
  }
  advance(world, clock, .59, [1 / 144])
  assert.deepEqual(events.filter(e => e[0] === 'handoff').map(e => e[1]), ['lightning', 'bridge'])
  assert.equal(events.filter(e => e[0] === 'cue').length, 2)
  assert.equal(world.worshipAcquisition.controllers.spell.model, 12)
  assert.equal(world.worshipAcquisition.controllers.companion.step, 0)
  assert.equal(world.worshipAcquisition.controllers.companion.visits, 0)
})

test('missing geometry consumes one request while world countdown continues without replay', () => {
  const world = createWorld(), head = world.shrines.find(s => s.kind === 'bridge'), events = []
  head.reset = false
  head.forced = true
  const clock = binding(world, events, () => null)
  advance(world, clock, 7, [1 / 60])
  assert.equal(world.shots.bridge, 1)
  assert.equal(world.giftCounts.bridge, 1)
  assert.equal(world.worshipAcquisition.controllers.spell, null)
  assert.equal(events.filter(e => e[0] === 'failed').length, 1)
  assert.equal(events.filter(e => e[0] === 'cue').length, 1)
  advance(world, binding(world, events), .5, [1 / 60])
  assert.equal(events.filter(e => e[0] === 'cue').length, 1)
})

test('arrival suppression and capped stock preserve ordinary payout ownership', () => {
  for (const blocked of [false, true]) {
    const world = createWorld(), head = world.shrines.find(s => s.kind === 'bridge'), events = []
    const gift = createGift(world, 'bridge', head, 0, head.ordinarySpellReward)
    gift.phase = 0
    gift.remaining = 76
    world.shots.bridge = 9
    startWorshipAcquisition(world.worshipAcquisition.controllers, { giftId: gift.id, model: 12, geometry: geometry() })
    if (blocked) world.land.landFlags |= 8
    advance(world, binding(world, events), 3, [1 / 60])
    assert.equal(world.shots.bridge, 9)
    assert.equal(world.giftCounts.bridge, blocked ? 0 : 1)
    assert.equal(events.filter(e => e[0] === 'clamp').length, blocked ? 0 : 1)
    if (blocked) {
      for (let turn = 0; world.gifts.includes(gift) && turn < 80; turn++) tick(world, 1 / 12)
      assert.equal(world.giftCounts.bridge, 1)
    }
  }
})

test('visible acquisition pause preserves original order without broadening land-bit pause', () => {
  for (const landPause of [false, true]) {
    const world = createWorld(), clock = binding(world)
    startWorshipAcquisition(world.worshipAcquisition.controllers, { giftId: 100, model: 12, geometry: geometry() })
    if (landPause) world.land.landFlags |= 2
    else world.paused = true
    advanceGame(world, clock, .01)
    const companion = world.worshipAcquisition.controllers.companion
    assert.equal(companion.step, 1)
    assert.equal(companion.visits, 0)
    assert.equal(world.cosmeticRandom.randomState, 1275068418)
    advanceGame(world, clock, .2)
    assert.equal(world.cosmeticRandom.randomState, 1275068418)
    assert.equal(companion.visits, 0)
    assert.equal(world.turn, 0)
    assert.equal(clock.animationFrame, landPause ? 5 : 0)
    world.paused = true
    clock.presentationHidden = () => true
    const snapshot = structuredClone(world.worshipAcquisition)
    advanceGame(world, clock, 300)
    assert.deepEqual(world.worshipAcquisition, snapshot)
  }
})

test('checkpoint continuation retains controller, queue, clock and cosmetic state without initialization replay', () => {
  const world = createWorld(), head = world.shrines.find(s => s.kind === 'bridge'), events = []
  head.reset = false
  head.forced = true
  const clock = binding(world, events)
  advance(world, clock, 1, [1 / 60])
  const restored = migrateCheckpoint(structuredClone(world)), restoredEvents = []
  assert.deepEqual(restored.worshipAcquisition, world.worshipAcquisition)
  advance(world, clock, 2, [1 / 60])
  advance(restored, binding(restored, restoredEvents), 2, [1 / 144])
  assert.equal(restored.shots.bridge, world.shots.bridge)
  assert.equal(restored.giftCounts.bridge, world.giftCounts.bridge)
  assert.deepEqual(restored.worshipAcquisition.controllers, world.worshipAcquisition.controllers)
  assert.equal(restoredEvents.filter(e => e[0] === 'cue').length, 0)
})

test('layout transforms move only draw output and retain raised-body/fallback anchors', () => {
  const reference = geometry(),
    current = { viewport: reference.viewport, targetRect: reference.targetRect, targetHud: reference.targetHud, hudScale: 1 },
    initial = worshipHandoffGeometry(current, { point: reference.origin, viewport: reference.viewport, valid: true })
  assert.deepEqual(initial.origin, reference.origin)
  for (const point of [{ x: 100, y: 50 }, { x: 700, y: 50 }])
    assert.deepEqual(worshipHandoffGeometry(current, { point, viewport: reference.viewport, valid: true }).origin, { x: 370, y: 240 })
  const saved = structuredClone(reference),
    resized = { viewport: { x: 200, y: 0, width: 1200, height: 900 }, targetRect: { x: 66, y: 686, width: 62, height: 86 }, targetHud: reference.targetHud, hudScale: 2 }
  assert.deepEqual(worshipDrawPoint(reference.target, reference, resized, true), { x: 96, y: 728 })
  assert.deepEqual(worshipDrawPoint(reference.target, reference, current, true), reference.target)
  assert.deepEqual(reference, saved)
  const currentPoint = { x: 100, y: 80 }, previous = { x: 60, y: 40 }
  assert.deepEqual(interpolateWorshipPoint(currentPoint, previous, .5), { x: 80, y: 60 })
  assert.deepEqual(interpolateWorshipPoint(currentPoint, previous, 1), currentPoint)
  assert.deepEqual(currentPoint, { x: 100, y: 80 })
  assert.deepEqual(previous, { x: 60, y: 40 })
})
