import test, { afterEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  AUDIO_PREFERENCES_KEY,
  DEFAULT_AUDIO_PREFERENCES,
  readAudioPreferences,
  saveAudioPreferences,
} from '../app/audio-preferences.ts'
import { Soundscape } from '../app/audio.ts'

const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
afterEach(() => {
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage)
  else delete globalThis.localStorage
})
function storage(initial = null) {
  const values = new Map(initial === null ? [] : [[AUDIO_PREFERENCES_KEY, initial]])
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

test('first visit and non-browser rendering keep the existing defaults without writing', () => {
  const local = storage()
  assert.deepEqual(readAudioPreferences(), DEFAULT_AUDIO_PREFERENCES)
  assert.deepEqual(local.writes, [])
  const mutable = readAudioPreferences()
  mutable.volume = 0
  assert.equal(DEFAULT_AUDIO_PREFERENCES.volume, 0.35)
  delete globalThis.localStorage
  assert.deepEqual(readAudioPreferences(), DEFAULT_AUDIO_PREFERENCES)
  assert.equal(saveAudioPreferences({ volume: 0.2, musicVolume: 0.4 }), false)
})

test('versioned zero/full volume restores without truthiness fallback or autoplay data', () => {
  const local = storage(JSON.stringify({ version: 1, volume: 0, musicVolume: 1, enabled: true }))
  assert.deepEqual(readAudioPreferences(), { volume: 0, musicVolume: 1 })
  assert.deepEqual(local.writes, [])
})

test('malformed, unsupported and unsafe values fall back without overwriting the record', () => {
  for (const raw of [
    '{',
    'null',
    '[]',
    'true',
    '0',
    '"settings"',
    JSON.stringify({ version: 2, volume: 0.2, musicVolume: 0.4 }),
    JSON.stringify({ volume: 0.2, musicVolume: 0.4 }),
    JSON.stringify({ version: 1, volume: '0.2', musicVolume: 0.4 }),
    JSON.stringify({ version: 1, volume: -0.1, musicVolume: 0.4 }),
    JSON.stringify({ version: 1, volume: 1.1, musicVolume: 0.4 }),
    JSON.stringify({ version: 1, volume: 0.2, musicVolume: null }),
    '{"version":1,"volume":1e999,"musicVolume":0.4}',
    JSON.stringify({ version: 1, volume: 0.2 }),
  ]) {
    const local = storage(raw)
    assert.deepEqual(readAudioPreferences(), DEFAULT_AUDIO_PREFERENCES, raw)
    assert.equal(local.values.get(AUDIO_PREFERENCES_KEY), raw)
    assert.deepEqual(local.writes, [], raw)
  }
})

test('only an explicit valid change writes the known preference fields and leaves other storage alone', () => {
  const local = storage('{broken')
  local.values.set('hud-size', '2')
  local.values.set('profile-sentinel', 'unchanged')
  assert.equal(saveAudioPreferences({ volume: 0.15, musicVolume: 0.8, enabled: true }), true)
  assert.deepEqual(local.writes, [
    [AUDIO_PREFERENCES_KEY, '{"version":1,"volume":0.15,"musicVolume":0.8}'],
  ])
  assert.deepEqual(readAudioPreferences(), { volume: 0.15, musicVolume: 0.8 })
  assert.equal(local.values.get('hud-size'), '2')
  assert.equal(local.values.get('profile-sentinel'), 'unchanged')
})

test('invalid programmatic values never persist or replace the last valid choice', () => {
  const raw = '{"version":1,"volume":0.2,"musicVolume":0.4}',
    local = storage(raw)
  for (const preferences of [
    null,
    {},
    { volume: NaN, musicVolume: 0 },
    { volume: Infinity, musicVolume: 0.4 },
    { volume: 0, musicVolume: -1 },
    { volume: 0, musicVolume: 2 },
    { volume: '0', musicVolume: 0.4 },
  ])
    assert.equal(saveAudioPreferences(preferences), false)
  assert.equal(local.values.get(AUDIO_PREFERENCES_KEY), raw)
  assert.deepEqual(local.writes, [])
})

test('denied storage getter, reads and writes are safe session-only fallbacks', () => {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      throw new Error('denied')
    },
  })
  assert.deepEqual(readAudioPreferences(), DEFAULT_AUDIO_PREFERENCES)
  assert.equal(saveAudioPreferences({ volume: 0.2, musicVolume: 0.4 }), false)
  const local = storage()
  local.mock.getItem = () => {
    throw new Error('read denied')
  }
  local.mock.setItem = () => {
    throw new Error('quota')
  }
  assert.deepEqual(readAudioPreferences(), DEFAULT_AUDIO_PREFERENCES)
  assert.equal(saveAudioPreferences({ volume: 0.2, musicVolume: 0.4 }), false)
})

test('restoring volumes does not create audio, enable playback, or change audio RNG/reset semantics', () => {
  storage('{"version":1,"volume":0,"musicVolume":0.25}')
  const audio = new Soundscape(),
    preferences = readAudioPreferences()
  assert.equal(audio.volume, DEFAULT_AUDIO_PREFERENCES.volume)
  assert.equal(audio.musicVolume, DEFAULT_AUDIO_PREFERENCES.musicVolume)
  audio.setVolume(preferences.volume)
  audio.setMusicVolume(preferences.musicVolume)
  assert.equal(audio.enabled, false)
  assert.equal(audio.context, null)
  assert.equal(audio.music, null)
  assert.equal(audio.randomState, 1)
  audio.reset()
  assert.equal(audio.volume, 0)
  assert.equal(audio.musicVolume, 0.25)
  assert.equal(audio.enabled, false)
})
