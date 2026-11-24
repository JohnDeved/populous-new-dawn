import test from 'node:test'
import assert from 'node:assert/strict'
import { command, tick } from '../app/model.ts'
import { assignFollowerGroup, recallFollowerGroup } from '../app/follower-groups.ts'
import { cancelInteraction, setSelection } from '../app/selection-runtime.ts'
import { residentPerson } from '../app/building-resident.ts'
import { createStartedWorld } from './level-start-fixture.mjs'

test('ordinary Hut entry clears previous selection but preserves all numbered groups', () => {
  const world = createStartedWorld(1)
  const person = world.units.find(u => u.team === 'blue' && u.kind === 'brave' && u.hp > 0)
  const hut = world.buildings.find(b => b.team === 'blue' && b.kind === 'hut' && b.progress === 1)
  assert.ok(person && hut)
  setSelection(world, [person.id])
  for (let slot = 1; slot <= 6; slot++) assignFollowerGroup(world, slot)
  assert.equal(person.groups, 127)
  assert.equal(command(world, hut), true)
  cancelInteraction(world)
  for (let n = 0; n < 600 && person.inside !== hut.id && person.hp > 0; n++) tick(world, 1 / 12)
  assert.equal(person.inside, hut.id, 'authored brave reaches authored Hut through ordinary ticks')
  assert.equal(residentPerson(world, person).selectionFlags & 1, 0)
  assert.equal(person.groups, 126, 'only previous-selection membership is cleared')
  setSelection(world, [])
  recallFollowerGroup(world, 0, true)
  assert.deepEqual(world.selected, [])
  for (let slot = 1; slot <= 6; slot++) {
    recallFollowerGroup(world, slot)
    assert.deepEqual(world.selected, [person.id], `numbered group ${slot} remains available`)
    setSelection(world, [])
  }
})

test('snapshot callback follows only the native even-counter, nearby, non-training entry branch', async () => {
  const { stepTrainingPerson } = await import('../app/training.ts')
  for (const [model, counter, distance, clears] of [
    [1, 2, 111, true], [1, 3, 0, false], [1, 2, 112, false],
    [7, 2, 0, false], [13, 2, 0, false],
  ]) {
    const person = { id: 1, class: 1, assignment: 0, substate: 5, workTarget: 2,
      counter, x: 0, y: 0, goalX: distance, goalY: 0, selectionFlags: 255 }
    const building = { id: 2, class: 2, model, activity: 8, flags2: 0, inside: 0 }
    const world = { people: new Map([[1, person]]), buildings: new Map([[2, building]]) }
    const events = []
    const unexpected = () => assert.fail('unexpected entry effect')
    stepTrainingPerson(world, person, {
      setAnimation: unexpected, releaseMotion: unexpected, adjacentBuilding: unexpected,
      setDestination: unexpected, directDestination: unexpected, dropCargo: unexpected,
      // A void admission effect deliberately does not certify successful admission.
      enterBuilding: () => { events.push('enter') },
      clearPreviousSelection: p => { assert.equal(p, person); events.push('clear') },
      workInside: unexpected,
    })
    assert.equal(events.includes('clear'), clears, `${model}/${counter}/${distance}`)
    assert.equal(person.selectionFlags, clears ? 254 : 255)
    if (clears) assert.deepEqual(events, ['enter', 'clear'])
  }
})
