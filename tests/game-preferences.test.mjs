import test, { afterEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_GAME_PREFERENCES,
  GAME_PREFERENCES_KEY,
  readGamePreferences,
  saveGamePreferences,
} from '../app/game-preferences.ts'

const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
afterEach(() => {
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage)
  else delete globalThis.localStorage
})
function storage(initial = null) {
  const values = new Map(initial === null ? [] : [[GAME_PREFERENCES_KEY, initial]])
  const writes = []
  const mock = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => {
      writes.push([key, value])
      values.set(key, value)
    },
  }
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: mock })
  return { values, writes, mock }
}

test('first visit and non-browser reads preserve Cursor/No without writing shared defaults', () => {
  const local = storage()
  assert.deepEqual(readGamePreferences(), { rotation: 'cursor', flipRotation: false })
  assert.deepEqual(local.writes, [])
  const mutable = readGamePreferences()
  mutable.rotation = 'control-cursor'
  mutable.flipRotation = true
  assert.deepEqual(DEFAULT_GAME_PREFERENCES, { rotation: 'cursor', flipRotation: false })
  delete globalThis.localStorage
  assert.deepEqual(readGamePreferences(), DEFAULT_GAME_PREFERENCES)
  assert.equal(saveGamePreferences(mutable), false)
})

test('all valid choices restore from version one without writes or extra fields', () => {
  for (const rotation of ['cursor', 'control-cursor']) for (const flipRotation of [false, true]) {
    const preferences = { rotation, flipRotation }
    const local = storage(JSON.stringify({ version: 1, ...preferences, autocast: true }))
    assert.deepEqual(readGamePreferences(), preferences)
    assert.deepEqual(local.writes, [])
  }
})

test('malformed, unsupported and invalid choices fall back without replacing saved data', () => {
  for (const raw of [
    '{', 'null', '[]', 'true', '0', '"settings"',
    JSON.stringify({ version: 2, rotation: 'cursor', flipRotation: false }),
    JSON.stringify({ rotation: 'cursor', flipRotation: false }),
    JSON.stringify({ version: '1', rotation: 'cursor', flipRotation: false }),
    JSON.stringify({ version: 1, rotation: 'Cursor', flipRotation: false }),
    JSON.stringify({ version: 1, rotation: 'arrows', flipRotation: false }),
    JSON.stringify({ version: 1, rotation: 0, flipRotation: false }),
    JSON.stringify({ version: 1, rotation: 'cursor', flipRotation: 0 }),
    JSON.stringify({ version: 1, rotation: 'cursor', flipRotation: 'false' }),
    JSON.stringify({ version: 1, rotation: 'cursor', flipRotation: null }),
    JSON.stringify({ version: 1, rotation: 'cursor' }),
    JSON.stringify({ version: 1, flipRotation: true }),
  ]) {
    const local = storage(raw)
    assert.deepEqual(readGamePreferences(), DEFAULT_GAME_PREFERENCES, raw)
    assert.equal(local.values.get(GAME_PREFERENCES_KEY), raw)
    assert.deepEqual(local.writes, [])
  }
})

test('only explicit valid changes write known fields, leaving audio/HUD/profile/checkpoints alone', () => {
  const local = storage('{broken')
  const unrelated = ['populous-audio-preferences', 'hud-size', 'profile', 'checkpoint']
  for (const key of unrelated) local.values.set(key, 'unchanged')
  assert.equal(saveGamePreferences({ rotation: 'control-cursor', flipRotation: true, autocast: true }), true)
  assert.deepEqual(local.writes, [[GAME_PREFERENCES_KEY, '{"version":1,"rotation":"control-cursor","flipRotation":true}']])
  assert.deepEqual(readGamePreferences(), { rotation: 'control-cursor', flipRotation: true })
  for (const key of unrelated) assert.equal(local.values.get(key), 'unchanged')
})

test('invalid programmatic values never persist or replace a valid record', () => {
  const raw = '{"version":1,"rotation":"control-cursor","flipRotation":true}'
  const local = storage(raw)
  for (const preferences of [
    null, {}, [],
    { rotation: 'cursor' },
    { rotation: null, flipRotation: false },
    { rotation: 'control', flipRotation: true },
    { rotation: 'cursor', flipRotation: 1 },
    { rotation: 'cursor', flipRotation: 'false' },
  ]) assert.equal(saveGamePreferences(preferences), false)
  assert.deepEqual(local.writes, [])
  assert.equal(local.values.get(GAME_PREFERENCES_KEY), raw)
})

test('denied storage getter/read/write safely fall back for this session', () => {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() { throw new Error('denied') },
  })
  assert.deepEqual(readGamePreferences(), DEFAULT_GAME_PREFERENCES)
  assert.equal(saveGamePreferences({ rotation: 'cursor', flipRotation: true }), false)
  const local = storage()
  local.mock.getItem = () => { throw new Error('read denied') }
  local.mock.setItem = () => { throw new Error('quota') }
  assert.deepEqual(readGamePreferences(), DEFAULT_GAME_PREFERENCES)
  assert.equal(saveGamePreferences({ rotation: 'control-cursor', flipRotation: false }), false)
})
