import assert from 'node:assert/strict'
import test from 'node:test'
import { assertPauseCameraKeys, assertPauseCameraSample } from '../scripts/local-render/original-pause-checkpoint-recovery.mjs'

const valid = { paused: true, hWorldUnchanged: true, hCameraUnchanged: true,
  periodPaused: true, periodActive: 1, resumed: true, resumedHActive: 1 }
test('paused camera browser oracle admits all required actual-key outcomes', () => {
  assertPauseCameraKeys(valid)
})
for (const [name, value] of Object.entries(valid)) {
  test(`paused camera browser oracle rejects missing ${name}`, () => {
    assert.throws(() => assertPauseCameraKeys({ ...valid, [name]: typeof value === 'boolean' ? false : 0 }))
  })
}

const handled = { key: 'h', type: 'keydown', trusted: true, handled: true }
test('camera sample requires the handled trusted keydown itself', () => {
  assertPauseCameraSample(handled, 'h')
  for (const invalid of [{ handled: false }, { trusted: false }, { type: 'keyup' }, { key: '.' }])
    assert.throws(() => assertPauseCameraSample({ ...handled, ...invalid }, 'h'))
})
