import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'
import { startPendingWorshipAcquisitions } from '../app/worship-acquisition-runtime.ts'

const geometry = {
  viewport: { x: 100, y: 0, width: 540, height: 480 },
  origin: { x: 420, y: 180 },
  target: { x: 71, y: 232 },
  targetRect: { x: 48, y: 206, width: 46, height: 52 },
  targetHud: { x: 71, y: 232 },
  hudScale: 1,
}
const failures = [undefined, null, false, 0, '', new Error('audio driver failure')]

function queuedTower() {
  const world = createWorld(4)
  const head = world.shrines.find(shrine => shrine.kind === 'vault')
  // Supplied completion fixture uses the real authored Vault -> gift -> queue path.
  head.reset = false
  head.forced = true
  tick(world, 1 / 12)
  const gift = world.gifts.find(gift => gift.reward === 'tower')
  assert.ok(gift?.buildingAcquisition)
  for (let i = 0; i < 6; i++) tick(world, 1 / 12)
  assert.deepEqual(world.worshipAcquisition.requests, [gift.id])
  return { world, gift }
}
function thrownBy(callback) {
  let thrown = false, value
  try { callback() } catch (error) { thrown = true; value = error }
  return { thrown, value }
}
function handoff(world, trace, overrides = {}) {
  startPendingWorshipAcquisitions(world, {
    cue: cue => trace.push(['cue', cue]),
    geometry: gift => { trace.push(['geometry', gift.id]); return geometry },
    failed: gift => trace.push(['failed', gift.id]),
    ...overrides,
  })
}
function nextBuilding(world, gift, head) {
  // Extra same-batch members are supplied clones, not natural simultaneous rewards.
  const next = structuredClone(gift)
  next.id = world.nextId++
  next.buildingAcquisition = { ...next.buildingAcquisition, head, serial: next.id }
  world.gifts.push(next)
  return next
}

for (const failedCue of [0, 1]) {
  test(`building cue ${failedCue + 1} failure still completes the handoff and preserves the exact thrown value`, () => {
    for (const failure of failures) {
      const { world, gift } = queuedTower(), control = structuredClone(world)
      const expected = [], actual = []
      handoff(control, expected)
      let index = 0
      const result = thrownBy(() => handoff(world, actual, {
        cue: cue => { actual.push(['cue', cue]); if (index++ === failedCue) throw failure },
      }))
      assert.equal(result.thrown, true)
      assert.equal(result.value, failure)
      assert.deepEqual(actual, expected)
      assert.deepEqual(world, control, 'only callback observation may differ')
      assert.equal(world.worshipAcquisition.controllers.building.giftId, gift.id)
      assert.equal(world.worshipAcquisition.controllers.building.active, true)
      assert.deepEqual(world.worshipAcquisition.requests, [])
      const before = structuredClone(world)
      handoff(world, actual)
      assert.deepEqual(actual, expected, 'a retry does not replay completed notifications')
      assert.deepEqual(world, before)
    }
  })
}

test('a failing geometry diagnostic does not discard later queued handoffs', () => {
  for (const failure of failures) {
    const { world, gift } = queuedTower(), later = nextBuilding(world, gift, 2)
    world.worshipAcquisition.requests.push(later.id)
    const control = structuredClone(world), expected = [], actual = []
    const geometryFor = trace => candidate => {
      trace.push(['geometry', candidate.id])
      return candidate.id === gift.id ? null : geometry
    }
    handoff(control, expected, { geometry: geometryFor(expected) })
    const result = thrownBy(() => handoff(world, actual, {
      geometry: geometryFor(actual),
      failed: candidate => { actual.push(['failed', candidate.id]); throw failure },
    }))
    assert.equal(result.thrown, true)
    assert.equal(result.value, failure)
    assert.deepEqual(actual, expected)
    assert.deepEqual(world, control)
    assert.equal(world.worshipAcquisition.controllers.building.giftId, later.id)
  }
})

test('mixed building/spell notifications finish in retained order and rethrow the first failure', () => {
  const { world, gift } = queuedTower()
  const spell = nextBuilding(world, gift, 2), later = nextBuilding(world, gift, 3)
  spell.ordinaryWorship = { ...spell.buildingAcquisition, model: 3 }
  delete spell.buildingAcquisition
  world.worshipAcquisition.requests = [later.id, spell.id, gift.id]
  const control = structuredClone(world), expected = [], actual = []
  const geometryFor = trace => candidate => {
    trace.push(['geometry', candidate.id])
    return candidate.id === spell.id ? null : geometry
  }
  handoff(control, expected, { geometry: geometryFor(expected) })
  let cueIndex = 0
  const result = thrownBy(() => handoff(world, actual, {
    cue: cue => { actual.push(['cue', cue]); if (cueIndex++ === 0) throw undefined; throw new Error('later cue') },
    geometry: geometryFor(actual),
    failed: candidate => { actual.push(['failed', candidate.id]); throw false },
  }))
  assert.equal(result.thrown, true)
  assert.equal(result.value, undefined, 'later failures must not replace an earlier falsey value')
  assert.deepEqual(actual, [
    ['cue', 0xcc], ['cue', 0xcb], ['geometry', gift.id],
    ['cue', 0x71], ['geometry', spell.id], ['failed', spell.id],
    ['cue', 0xcc], ['cue', 0xcb], ['geometry', later.id],
  ])
  assert.deepEqual(actual, expected)
  assert.deepEqual(world, control)
  assert.equal(world.worshipAcquisition.controllers.building.giftId, later.id)
})

test('a detached geometry exception retains its existing diagnostic-only behavior', () => {
  const { world, gift } = queuedTower(), beforeRandom = structuredClone(world.cosmeticRandom)
  const trace = []
  handoff(world, trace, {
    geometry: candidate => { trace.push(['geometry', candidate.id]); throw new Error('detached HUD') },
  })
  assert.deepEqual(trace, [['cue', 0xcc], ['cue', 0xcb], ['geometry', gift.id], ['failed', gift.id]])
  assert.deepEqual(world.worshipAcquisition.requests, [])
  assert.equal(world.worshipAcquisition.controllers.building, null)
  assert.deepEqual(world.cosmeticRandom, beforeRandom)
})

test('requests queued by a failing notification remain deferred to the next handoff call', () => {
  const { world, gift } = queuedTower(), next = nextBuilding(world, gift, 2)
  const trace = [], failure = new Error('notification')
  let first = true
  const result = thrownBy(() => handoff(world, trace, {
    cue: cue => {
      trace.push(['cue', cue])
      if (first) { first = false; world.worshipAcquisition.requests.push(next.id); throw failure }
    },
  }))
  assert.equal(result.thrown, true)
  assert.equal(result.value, failure)
  assert.deepEqual(trace, [['cue', 0xcc], ['cue', 0xcb], ['geometry', gift.id]])
  assert.deepEqual(world.worshipAcquisition.requests, [next.id])
  assert.equal(world.worshipAcquisition.controllers.building.giftId, gift.id)
  handoff(world, trace)
  assert.deepEqual(trace.slice(3), [['cue', 0xcc], ['cue', 0xcb], ['geometry', next.id]])
  assert.deepEqual(world.worshipAcquisition.requests, [])
  assert.equal(world.worshipAcquisition.controllers.building.giftId, next.id)
})

test('missing, nonlocal and ineligible requests do not call notifications or initialize controllers', () => {
  const { world, gift } = queuedTower()
  gift.recipient = (world.manaWorld.playerTribe + 1) % 4
  const legacy = structuredClone(gift)
  legacy.id = world.nextId++
  legacy.recipient = world.manaWorld.playerTribe
  delete legacy.buildingAcquisition
  world.gifts.push(legacy)
  world.worshipAcquisition.requests = [-1, gift.id, legacy.id]
  const beforeRandom = structuredClone(world.cosmeticRandom), trace = []
  handoff(world, trace, { cue: () => assert.fail('ineligible cue'), failed: () => assert.fail('ineligible diagnostic') })
  assert.deepEqual(trace, [])
  assert.deepEqual(world.worshipAcquisition.requests, [])
  assert.equal(world.worshipAcquisition.controllers.building, null)
  assert.deepEqual(world.cosmeticRandom, beforeRandom)
})
