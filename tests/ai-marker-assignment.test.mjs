import assert from 'node:assert/strict'
import test from 'node:test'
import { withCampaignTribe } from '../app/campaign-runtime.ts'
import { stepComputerTasks } from '../app/computer-runtime.ts'
import { requestMarkerTask } from '../app/computer.ts'
import { createLivePerson } from '../app/live-people.ts'
import { createWorld } from '../app/world-initialization.ts'

function selectMarkerBrave(extra, representedByte) {
  const world = createWorld(1)
  const tribe = 1
  const brave = world.units.find(unit => unit.id === 38)
  assert.equal(brave.team, 'red')
  assert.equal(brave.kind, 'brave')
  const person = brave.native ??= createLivePerson(world, brave)
  assert.equal(person.computerAssignment, 0)
  person.flags3 = (person.flags3 | 0x2000) >>> 0
  if (representedByte !== undefined) brave.nativeFlags7f = representedByte
  else assert.equal(Object.hasOwn(brave, 'nativeFlags7f'), false)

  withCampaignTribe(world, tribe, ai => {
    for (const task of ai.tasks) task.flags &= ~1
    ai.cursor = 0
    ai.markerEntries[0] = { marker: 17, secondary: -1, quotas: [1, 0, 0, 0] }
    requestMarkerTask(ai, [0], extra)
    const task = ai.tasks.find(task => task.type === 24 && task.flags & 1)
    for (world.turn = 24; world.turn <= 26 && task.members.length === 0; world.turn++) {
      stepComputerTasks(world, tribe)
    }
    assert.deepEqual(task.members, [brave.id])
    assert.equal(task.phase, 3)
  })
  assert.equal(brave.native, person)
  assert.equal(world.objectCells.objects.get(brave.id), person)
  assert.equal(person.state, 14)
  assert.equal(person.flags3 & 0x2000, 0x2000, 'nonzero and unstamped owners both preserve this prior bit')
  return { assignment: person.computerAssignment, flags7f: brave.nativeFlags7f, represented: Object.hasOwn(brave, 'nativeFlags7f') }
}

test('special type-24 marker selection stamps owner 99 and clears only modeled +0x7f bit 0', () => {
  assert.deepEqual(selectMarkerBrave(true, 0xa7), { assignment: 99, flags7f: 0xa6, represented: true })
})

test('ordinary type-24 marker selection does not stamp or clear the modeled byte', () => {
  assert.deepEqual(selectMarkerBrave(false, 0xa7), { assignment: 0, flags7f: 0xa7, represented: true })
})

test('special type-24 marker selection does not invent an unavailable native byte', () => {
  assert.deepEqual(selectMarkerBrave(true, undefined), { assignment: 99, flags7f: undefined, represented: false })
})
