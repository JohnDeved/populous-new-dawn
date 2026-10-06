import assert from 'node:assert/strict'

export function requireGestureProgress(samples) {
  const gesture = samples.filter(sample => sample?.object === 720)
  assert.ok(gesture.some((next, index) => gesture.slice(0, index).some(previous =>
    next.turn > previous.turn && next.f2 > previous.f2)),
  'Source720 must advance native f2 across distinct logical turns before completion')
  return { turns: [...new Set(gesture.map(sample => sample.turn))],
    frames: [...new Set(gesture.map(sample => sample.f2))] }
}
