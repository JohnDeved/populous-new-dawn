import assert from 'node:assert/strict'
import test from 'node:test'
import { FollowerNearbyMode } from '../app/follower-nearby.ts'

const world = flags => ({ castingTribes: [{ flags }] })
const mode = w => !!(w.castingTribes[0].flags & 128)

test('first pending desired value wins, cues are per release, and other flag bits survive', () => {
  for (const initial of [0x100040, 0x1000c0]) {
    const w = world(initial), input = new FollowerNearbyMode(), cues = []
    input.advance(w, 0)
    assert.equal(input.request(w, 1, cue => cues.push(cue)), true)
    assert.equal(input.request(w, 2, cue => cues.push(cue)), false)
    assert.equal(w.castingTribes[0].flags, initial)
    assert.deepEqual(cues, [initial & 128 ? 111 : 110, initial & 128 ? 111 : 110])
    assert.equal(input.advance(w, 1000 / 12), true)
    assert.equal(w.castingTribes[0].flags, initial ^ 128)
    assert.equal(input.advance(w, 1000), false)
    input.request(w, 1001, cue => cues.push(cue))
    assert.equal(input.advance(w, 1100), true)
    assert.equal(w.castingTribes[0].flags, initial)
    assert.equal(cues.length, 3)
  }
})

test('first frame only anchors; equality is eligible and just-after arrival waits', () => {
  const w = world(0), input = new FollowerNearbyMode()
  input.request(w, 10, () => {})
  assert.equal(input.advance(w, 20), false)
  assert.equal(input.advance(w, 20 + 1000 / 12), true)
  input.request(w, 20 + 2000 / 12 + 0.001, () => {})
  assert.equal(input.advance(w, 20 + 2000 / 12), false)
  assert.equal(input.advance(w, 20 + 3000 / 12), true)
  input.request(w, 20 + 4000 / 12, () => {})
  assert.equal(input.advance(w, 20 + 4000 / 12), true)
})

test('catch-up cannot consume an opportunity before arrival or replay crossed visits', () => {
  const w = world(0), input = new FollowerNearbyMode(), cues = []
  input.advance(w, 0)
  input.request(w, 1001, id => cues.push(id))
  assert.equal(input.advance(w, 1030), false, 'last elapsed opportunity1000 predates input')
  assert.equal(mode(w), false)
  assert.equal(input.advance(w, 1100), true)
  assert.equal(input.advance(w, 9000), false)
  assert.deepEqual(cues, [110])
})

test('elapsed schedules agree and invalid/equal/backward visits cannot move phase', () => {
  for (const schedule of [[1000 / 30], [1000 / 60], [1000 / 144], [7, 13, 280, 600, 100]]) {
    const w = world(0), input = new FollowerNearbyMode()
    input.advance(w, 0)
    input.request(w, 50, () => {})
    let now = 0, commits = 0, steps = 0
    while (now < 1000) {
      now = Math.min(1000, now + schedule[steps++ % schedule.length])
      commits += Number(input.advance(w, now))
    }
    assert.equal(commits, 1)
    assert.equal(mode(w), true)
    input.request(w, 1001, () => {})
    for (const invalid of [1000, 0, -1, NaN, Infinity]) assert.equal(input.advance(w, invalid), false)
    assert.equal(input.advance(w, 1100), true)
    assert.equal(mode(w), false)
  }
})

test('cancel, reset and a different World cannot inherit transient desired state', () => {
  const w = world(0), replacement = world(0), input = new FollowerNearbyMode()
  input.advance(w, 0)
  input.request(w, 1, () => {})
  assert.equal(input.advance(replacement, 100), false)
  assert.equal(input.advance(w, 200), false)
  input.request(w, 201, () => {})
  input.cancel()
  assert.equal(input.advance(w, 300), false)
  input.request(w, 301, () => {})
  input.reset()
  assert.equal(input.advance(w, 9000), false)
  assert.equal(input.advance(w, 9100), false)
  assert.equal(mode(w), false)
  assert.equal(input.request(w, NaN, () => assert.fail('invalid arrival must not request sound')), false)
})
