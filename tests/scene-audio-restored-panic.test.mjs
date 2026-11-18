import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { createGameStore } from '../app/game-store.ts'
import { finishLevelStart } from './level-start-fixture.mjs'
import { command, tick } from '../app/model.ts'
import { setSelection } from '../app/selection-runtime.ts'
import { playWorldSounds } from '../app/audio.ts'
import { residentPerson } from '../app/building-resident.ts'
import { disturbLiveVolcanoPerson } from '../app/live-people.ts'

// Model save/load and supplied Volcano disturbance, not an acquired spell,
// full GameScene construction, browser storage, or audible media playback.
test('loaded retained person can emit panic after supplied Volcano disturbance', async () => {
  const store = createGameStore(),
    world = finishLevelStart(store.getWorld())
  const actor = world.units.find(u => u.id === 13),
    shrine = world.shrines.find(h => h.id === 29),
    hut = world.buildings.find(b => b.id === 36)
  let finished
  const oldScene = {
    world,
    ownedSounds: new Map(),
    soundSerial: world.soundSerial,
    get viewPoint() {
      return { x: actor.x, z: actor.z }
    },
    screen: () => ({ x: 0 }),
    onSound(cue, _attenuation, _pan, end) {
      if (cue === 82 && end) finished = end
      return () => {}
    },
  }
  setSelection(world, [actor.id])
  assert(command(world, shrine))
  let event
  for (let i = 0; i < 600 && !event; i++) {
    tick(world, 1 / 12)
    playWorldSounds(oldScene)
    event = world.sounds.find(e => e.cue === 82 && e.owner === actor.id)
  }
  assert(event && finished)
  const originalPerson = actor.native
  assert(originalPerson.flags4 & 16)
  assert(command(world, hut))
  tick(world, 1 / 12)
  assert.equal(actor.entry.person, originalPerson)
  assert.equal(actor.native, null)
  await store.saveCheckpoint()
  assert(store.hasCheckpoint())
  assert(store.loadCheckpoint())
  const restored = store.getWorld(),
    newActor = restored.units.find(u => u.id === actor.id)
  assert.notEqual(restored, world)
  assert.notEqual(newActor.entry.person, originalPerson)
  const before = newActor.entry.person.flags4
  finished() // Supplied WebAudio-ended delivery to the OLD scene, not natural media time.
  assert.equal(originalPerson.flags4 & 16, 0)
  assert.equal(newActor.entry.person.flags4, before, 'Old callback must not mutate loaded world')
  const sceneSource = readFileSync(new URL('../app/scene.ts', import.meta.url), 'utf8')
  const start = sceneSource.indexOf('    this.soundSerial = world.soundSerial')
  const end = sceneSource.indexOf('    this.onChange = onChange', start)
  assert(start >= 0 && end > start)
  const newScene = { world: restored }
  new Function('world', 'residentPerson', sceneSource.slice(start, end)).call(
    newScene,
    restored,
    residentPerson
  )
  Object.assign(newScene, {
    ownedSounds: new Map(),
    soundSerial: restored.soundSerial,
    viewPoint: { x: newActor.x, z: newActor.z },
    screen: () => ({ x: 0 }),
    onSound() {
      return () => {}
    },
  })
  const retained = newActor.entry.person
  const serial = restored.soundSerial
  disturbLiveVolcanoPerson(restored, newActor, 1)
  assert.equal(newActor.native, retained)
  let cue
  for (let i = 0; i < 20 && !cue; i++) {
    tick(restored, 1 / 12)
    cue = restored.sounds.find(e => e.serial > serial && e.cue === 81 && e.owner === newActor.id)
  }
  assert(cue, 'A fresh scene must not suppress the restored person’s panic cue')
  assert.equal(newActor.native, retained)
  assert.equal(newActor.native.state, 31)
  assert(newActor.hp > 0)
})
