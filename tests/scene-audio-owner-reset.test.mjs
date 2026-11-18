import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { residentPerson } from '../app/building-resident.ts'
import { createGameStore } from '../app/game-store.ts'
import { finishLevelStart } from './level-start-fixture.mjs'
import { command, tick } from '../app/model.ts'
import { setSelection } from '../app/selection-runtime.ts'
import { playWorldSounds } from '../app/audio.ts'

// Execute the shipped constructor's audio reset without supplying a renderer.
// This is not full GameScene/WebGL construction or browser storage evidence.
const source = readFileSync(new URL('../app/scene.ts', import.meta.url), 'utf8')
const start = source.indexOf('    this.soundSerial = world.soundSerial')
const end = source.indexOf('    this.onChange = onChange', start)
assert(start >= 0 && end > start)
const reset = new Function('world', 'residentPerson', source.slice(start, end))
const attachScene = world => {
  const scene = { world, ownedSounds: new Map() }
  reset.call(scene, world, residentPerson)
  return scene
}

test('current save/load during natural worship-to-Hut handoff resets the new scene owner', async () => {
  const store = createGameStore(), world = finishLevelStart(store.getWorld())
  const actor = world.units.find(u => u.id === 13)
  const shrine = world.shrines.find(h => h.id === 29), hut = world.buildings.find(b => b.id === 36)
  const oldScene = attachScene(world)
  let finished
  Object.assign(oldScene, { viewPoint: { x: actor.x, z: actor.z }, screen: () => ({ x: 0 }),
    onSound(cue, _attenuation, _pan, end) {
      if (cue === 82 && end) finished = end
      return () => {}
    } })
  setSelection(world, [actor.id]); assert(command(world, shrine))
  let event
  for (let i = 0; i < 600 && !event; i++) {
    tick(world, 1 / 12); oldScene.viewPoint = { x: actor.x, z: actor.z }; playWorldSounds(oldScene)
    event = world.sounds.find(e => e.cue === 82 && e.owner === actor.id)
  }
  assert(event && finished, 'Actual model must naturally emit the owned worship cue')
  const originalPerson = actor.native
  assert(originalPerson.flags4 & 16)
  assert(command(world, hut)); tick(world, 1 / 12)
  assert.equal(actor.entry.person, originalPerson); assert.equal(actor.native, null)
  await store.saveCheckpoint()
  assert(store.hasCheckpoint()); assert(store.loadCheckpoint())
  const restored = store.getWorld(), restoredActor = restored.units.find(u => u.id === actor.id)
  const restoredPerson = restoredActor.entry.person
  assert.notEqual(restored, world); assert.notEqual(restoredPerson, originalPerson)
  const before = restoredPerson.flags4
  assert(before & 16)
  finished() // Supplied old-scene media completion, not a real AudioContext clock.
  assert.equal(originalPerson.flags4 & 16, 0)
  assert.equal(restoredPerson.flags4, before, 'Old completion cannot modify a newly loaded world')
  const scene = attachScene(restored)
  assert.equal(restoredPerson.flags4, before & ~16)
  assert.equal(scene.soundSerial, restored.soundSerial)
  assert.equal(scene.ownedSounds.size, 0)
  assert.equal(store.loadCheckpoint(), true)
  assert.equal(store.getWorld().units.find(u => u.id === actor.id).entry.person.flags4, before,
    'Scene-local reset must not rewrite the retained checkpoint')
})

function retainedOwner(destination) {
  const person = { flags4: 48 }, unit = { id: 17 }
  const world = { soundSerial: 9, units: [unit], effects: [{ fire: { soundPlaying: true } }],
    buildings: [{ id: 31, burn: { soundPlaying: true }, admission: { id: 31, occupants: [17, 0, 0, 0, 0, 0] } }] }
  if (destination === 'resident') {
    for (const k of ['model', 'state', 'life', 'flags2', 'flags3', 'x', 'y', 'h', 'assignment',
      'renderFlags', 'angle', 'heading', 'turnAngle', 'anchorX', 'anchorY', 'anchorFlags', 'commandCursor']) person[k] = 0
    Object.assign(person, { id: 17, class: 1, building: 31, commands: Array(8).fill(0), immediateCommand: 0,
      displacement: { x: 0, y: 0, h: 0 } })
    unit.inside = 31; unit.resident = { building: 31, slot: 0, person }
  } else if (destination === 'fight') unit.fight = { motion: person }
  else if (destination === 'native' || destination === 'flight') unit[destination] = person
  else unit[destination] = { person }
  return { world, unit, person }
}
for (const destination of ['native', 'flight', 'entry', 'builder', 'fight', 'resident'])
  test(`fresh scene retires supplied ${destination} voice state, preserving non-sound flags`, () => {
    const { world, person } = retainedOwner(destination)
    attachScene(world)
    assert.equal(person.flags4, 32)
    assert.equal(world.effects[0].fire.soundPlaying, false)
    assert.equal(world.buildings[0].burn.soundPlaying, false)
  })

test('fresh scene does not mutate detached invalid resident storage', () => {
  const { world, person } = retainedOwner('resident')
  world.buildings[0].admission.occupants[0] = 0
  attachScene(world)
  assert.equal(person.flags4, 48)
})
