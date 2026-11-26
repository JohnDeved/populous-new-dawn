import assert from 'node:assert/strict'
import test from 'node:test'
import { playWorldSounds, Soundscape, soundAttenuation } from '../app/audio.ts'
import { buildingModel, createWorld, placeBuilding, rotateBuildingPlan, tick } from '../app/model.ts'

const bell = 0xd7
function plan(mission, kind, direction, x, z) {
  const w = createWorld(mission, 'scalable')
  const initial = new Set(w.buildings)
  w.mode = kind
  for (let i = 0; w.buildingDirections[kind] !== direction && i < 4; i++)
    assert.equal(rotateBuildingPlan(w), true)
  assert.equal(w.buildingDirections[kind], direction)
  assert.equal(placeBuilding(w, kind, { x, z }), true)
  const b = w.buildings.find(candidate => !initial.has(candidate))
  assert.ok(b)
  assert.equal(b.id, 1023)
  assert.equal(b.team, 'blue')
  assert.deepEqual([b.progress, b.logs], [0, 0])
  return { w, b }
}
function advance(w, turn) {
  while (w.turn < turn) tick(w, 1 / 12)
  assert.equal(w.turn, turn)
}
const bells = w => w.sounds.filter(s => s.cue === bell)

test('authored M20 Boat House queues one positional completion bell', () => {
  const { w, b } = plan(20, 'boatHouse', 1, -1, -25)
  assert.equal(buildingModel(b), 13)
  advance(w, 455)
  assert.ok(w.buildings.includes(b))
  assert.deepEqual([b.progress, b.logs], [0.8, 4])
  assert.deepEqual(bells(w), [])
  advance(w, 456)
  assert.ok(w.buildings.includes(b))
  assert.deepEqual([b.progress, b.logs], [1, 5])
  assert.deepEqual(bells(w).map(({ cue, turn, x, z, owner }) => ({ cue, turn, x, z, owner })), [
    { cue: bell, turn: 456, x: b.x, z: b.z, owner: undefined },
  ])
  advance(w, 480)
  assert.deepEqual(bells(w).map(({ turn }) => turn), [456])
})

test('authored M16 Balloon Hut model 15 completes without a model 13/14 bell', () => {
  const { w, b } = plan(16, 'balloonHut', 0, 25, -35)
  assert.equal(buildingModel(b), 15)
  advance(w, 981)
  assert.equal(b.progress, 10 / 11)
  assert.equal(b.logs, 10)
  const serial = w.soundSerial
  advance(w, 982)
  assert.ok(w.buildings.includes(b))
  assert.deepEqual([b.progress, b.logs], [1, 11])
  assert.deepEqual(bells(w).filter(s => s.serial > serial), [])
})

test('authored M10 already-complete Boat Houses do not queue a live completion bell on load', () => {
  const w = createWorld(10, 'scalable')
  const boats = w.buildings.filter(b => b.kind === 'boatHouse' && b.team === 'blue')
  assert.deepEqual(boats.map(b => b.id), [61, 107])
  assert.ok(boats.every(b => b.progress === 1))
  advance(w, 5)
  assert.deepEqual(bells(w), [])
})

test('normal sound dispatch loads both bell variants and starts the authored near event once', async t => {
  const requests = [], started = []
  const node = () => ({ connect() {}, disconnect() {} })
  const gain = () => ({ ...node(), gain: { value: 0, setValueAtTime() {} } })
  const sound = new Soundscape()
  sound.context = {
    state: 'suspended', currentTime: 0,
    createGain: gain,
    createStereoPanner() { return { ...node(), pan: { value: 0 } } },
    createBufferSource() {
      let ended
      return {
        ...node(), playbackRate: { value: 1 },
        addEventListener(_event, callback) { ended = callback },
        start() { started.push(this.buffer.key) },
        stop() { ended?.() },
      }
    },
    decodeAudioData: async key => ({ key }),
    async resume() { this.state = 'running' },
    async suspend() { this.state = 'suspended' },
    async close() { this.state = 'closed' },
  }
  sound.master = gain()
  sound.music = {
    loading: Promise.resolve(), gain: gain(),
    element: { play: async () => {}, pause() {} },
    dispose() {},
  }
  t.mock.method(globalThis, 'fetch', async url => {
    requests.push(url)
    return { ok: true, arrayBuffer: async () => url }
  })
  t.mock.method(globalThis, 'setInterval', () => ({}))
  t.mock.method(globalThis, 'clearInterval', () => {})
  t.after(() => sound.dispose())
  assert.equal(await sound.enable(), true)
  const samples = [476, 477].map(id => `/original/audio/sound-${id}.wav`)
  for (const url of samples) assert.ok(requests.includes(url), `preloads ${url}`)

  const { w, b } = plan(20, 'boatHouse', 1, -1, -25)
  advance(w, 455)
  const priorSerial = w.soundSerial
  advance(w, 456)

  // The game chose the cue and coordinates. Supply only a camera/screen
  // fixture and browser API stand-ins, not a cue or a loaded buffer.
  const dispatch = x => {
    const calls = []
    const scene = {
      world: w, soundSerial: priorSerial, ownedSounds: new Map(),
      viewPoint: { x, z: b.z }, screen: () => ({ x: 0.25 }),
      onSound(cue, attenuation, pan, ended) {
        calls.push([cue, attenuation, pan])
        return sound.cue(cue, attenuation, pan, ended)
      },
    }
    return { scene, calls }
  }
  const far = dispatch(b.x + 90)
  playWorldSounds(far.scene)
  assert.deepEqual(far.calls.filter(([cue]) => cue === bell), [[bell, 0, 0.25]])
  assert.deepEqual(started.filter(key => samples.includes(key)), [])

  const near = dispatch(b.x + 8)
  playWorldSounds(near.scene)
  playWorldSounds(near.scene)
  assert.deepEqual(near.calls.filter(([cue]) => cue === bell),
    [[bell, soundAttenuation(2048 ** 2), 0.25]])
  assert.equal(started.filter(key => samples.includes(key)).length, 1)
})
