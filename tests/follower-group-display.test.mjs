import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  createFollowerGroupDisplay,
  followerGroupDigitArt,
  followerGroupDigitPlacement,
  followerGroupDigits,
  followerGroupDisplayActive,
  followerGroupDisplayKey,
  releaseFollowerGroupDisplayKeys,
  showFollowerGroup,
  stepFollowerGroupDisplay,
} from '../app/follower-group-display.ts'
import art from '../app/original-group-digits.json' with { type: 'json' }

const key = (code, extra = {}) => ({
  code, shiftKey: false, ctrlKey: false, altKey: false, metaKey: false, ...extra,
})
const tick = 1 / 24
const timers = d => [...d.timers]
// The scene passes a monotonic clock; the first reading only starts it.
const clocks = new WeakMap()
const step = (d, dt) => {
  if (!clocks.has(d)) stepFollowerGroupDisplay(d, 1000)
  clocks.set(d, (clocks.get(d) ?? 1000) + dt)
  stepFollowerGroupDisplay(d, clocks.get(d))
}

test('0047c350 tail: group keys 1-6 start a six-iteration timer that 0041c120 counts down', () => {
  const d = createFollowerGroupDisplay()
  assert.equal(followerGroupDisplayActive(d), false)
  showFollowerGroup(d, 0) // Shift+Backspace has no display.
  assert.deepEqual(timers(d), [0, 0, 0, 0, 0, 0])
  showFollowerGroup(d, 3)
  assert.deepEqual(timers(d), [0, 0, 6, 0, 0, 0])
  step(d, tick / 2)
  assert.deepEqual(timers(d), [0, 0, 6, 0, 0, 0], 'a partial 24 Hz tick does not count')
  for (let i = 5; i >= 0; i--) {
    step(d, tick)
    assert.equal(d.timers[2], i)
  }
  assert.equal(followerGroupDisplayActive(d), false)
  showFollowerGroup(d, 6)
  step(d, 60) // A long hidden-tab frame is bounded and still settles.
  assert.deepEqual(timers(d), [0, 0, 0, 0, 0, 0])
})

test('the scene clock: the first reading only starts it and a backwards reading never counts', () => {
  const d = createFollowerGroupDisplay()
  showFollowerGroup(d, 2)
  stepFollowerGroupDisplay(d, 50)
  assert.deepEqual(timers(d), [0, 6, 0, 0, 0, 0])
  stepFollowerGroupDisplay(d, 40)
  assert.deepEqual(timers(d), [0, 6, 0, 0, 0, 0])
  stepFollowerGroupDisplay(d, 40 + 2 * tick)
  assert.deepEqual(timers(d), [0, 4, 0, 0, 0, 0])
})

test('held number-row keys refresh their timer whatever the modifiers; release lets it run out', () => {
  const d = createFollowerGroupDisplay()
  followerGroupDisplayKey(d, key('Digit2', { shiftKey: true, altKey: true }), true)
  for (let i = 0; i < 30; i++) step(d, tick)
  assert.deepEqual(timers(d), [0, 5, 0, 0, 0, 0], 'refreshed to 6, then decremented, every iteration')
  followerGroupDisplayKey(d, key('Digit2'), false)
  for (let i = 0; i < 5; i++) step(d, tick)
  assert.deepEqual(timers(d), [0, 0, 0, 0, 0, 0])
  followerGroupDisplayKey(d, key('Digit7'), true)
  followerGroupDisplayKey(d, key('Numpad1'), true)
  step(d, tick)
  assert.equal(followerGroupDisplayActive(d), false)
})

test('Comma press holds all six at 0xff, only unmodified; any release clears all six', () => {
  const d = createFollowerGroupDisplay()
  showFollowerGroup(d, 1)
  for (const modifier of ['shiftKey', 'ctrlKey', 'altKey', 'metaKey']) {
    followerGroupDisplayKey(d, key('Comma', { [modifier]: true }), true)
    assert.deepEqual(timers(d), [6, 0, 0, 0, 0, 0], modifier)
  }
  followerGroupDisplayKey(d, key('Comma'), true)
  assert.deepEqual(timers(d), [-1, -1, -1, -1, -1, -1])
  showFollowerGroup(d, 4) // The 0xff guard keeps a group key from shortening the hold.
  followerGroupDisplayKey(d, key('Digit5'), true)
  for (let i = 0; i < 20; i++) step(d, tick)
  assert.deepEqual(timers(d), [-1, -1, -1, -1, -1, -1], 'a held 0xff never counts down')
  followerGroupDisplayKey(d, key('Digit5'), false)
  followerGroupDisplayKey(d, key('Comma', { shiftKey: true }), false)
  assert.deepEqual(timers(d), [0, 0, 0, 0, 0, 0])
  showFollowerGroup(d, 2)
  followerGroupDisplayKey(d, key('Comma'), false) // Release also clears a key-started timer.
  assert.equal(followerGroupDisplayActive(d), false)
})

test('focus loss releases held digits and a Comma hold, but not an ordinary countdown', () => {
  const d = createFollowerGroupDisplay()
  followerGroupDisplayKey(d, key('Digit1'), true)
  showFollowerGroup(d, 1)
  releaseFollowerGroupDisplayKeys(d)
  step(d, tick)
  assert.deepEqual(timers(d), [5, 0, 0, 0, 0, 0])
  followerGroupDisplayKey(d, key('Comma'), true)
  releaseFollowerGroupDisplayKeys(d)
  assert.equal(followerGroupDisplayActive(d), false)
})

test('00469515: member groups with a live timer, collected from 6 down to 1', () => {
  const live = [6, 0, -1, 1, 0, 3]
  assert.deepEqual(followerGroupDigits(0b1111111, live), [6, 4, 3, 1])
  assert.deepEqual(followerGroupDigits(1, [-1, -1, -1, -1, -1, -1]), [], 'bit 0 is not a group number')
  assert.deepEqual(followerGroupDigits(0b0000100, live), [])
  assert.deepEqual(followerGroupDigits(0b1001010, live), [6, 3, 1])
})

test('00469610..0046979f: column centred on F00T8 A, above the arrow height, 11 px apart', () => {
  assert.deepEqual(art.reference, { w: 9, h: 15 })
  // Selected: frame height (the arrow's top); otherwise trunc(height*24/32).
  assert.deepEqual(followerGroupDigitPlacement(0, true, 40), { x: -4, y: -55 })
  assert.deepEqual(followerGroupDigitPlacement(0, false, 40), { x: -4, y: -45 })
  assert.deepEqual(followerGroupDigitPlacement(0, false, 37), { x: -4, y: -42 })
  assert.deepEqual(followerGroupDigitPlacement(2, false, 37), { x: -4, y: -64 })
  const one = followerGroupDigitArt(1), six = followerGroupDigitArt(6)
  assert.deepEqual([one.width, one.height, six.width, six.height], [6, 15, 7, 15])
  assert.deepEqual(one.uv, [6 / art.width, 1, 0, 0])
  assert.deepEqual(six.uv, [7 / art.width, 1, 39 / art.width, 0])
})

test('the digit atlas is the importer-owned F00T8 output in tribe-0 colour 0xdb', () => {
  const owners = JSON.parse(readFileSync(new URL('../engineering/generated-files.json', import.meta.url)))
  const outputs = owners.owners.flatMap(owner => owner.outputs ?? [])
  for (const path of ['app/original-group-digits.json', 'public/original/group-digits.png'])
    assert.equal(outputs.find(o => o.path === path)?.producer, 'scripts/import-group-digits.py', path)
  assert.equal(art.colourIndex, 0xdb)
  assert.match(art.inputs['data/f00t8-0.dat'], /^[0-9a-f]{64}$/)
  const png = readFileSync(new URL('../public/original/group-digits.png', import.meta.url))
  assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [art.width, art.height])
})
