import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'
import test from 'node:test'
import { createGameStore } from '../app/game-store.ts'
import { tick } from '../app/world-turn.ts'

const arm = head => {
  Object.assign(head, { kind: 'linkedEffects', remaining: 3, forced: true, reset: false,
    enabled: true, active: true, cooldown: 0, slotTimer: 8, nextSlot: 3 })
  delete head.reward
  delete head.rewards
}

for (const shape of ['self', 'existing-later', 'existing-earlier', 'shared-hidden', 'new-hidden', 'same-id-distinct']) {
  test(`linked shrine publication visits each identity once after current in-session Load: ${shape}`, async () => {
    assert.equal(typeof globalThis.indexedDB, 'undefined', 'no durable storage is claimed')
    const store = createGameStore(), original = store.getWorld()
    const parentIndexes = shape === 'existing-earlier' ? [1] : shape === 'shared-hidden' ? [0, 1] : [0]
    for (const index of parentIndexes) arm(original.shrines[index])
    const parent = original.shrines[parentIndexes[0]]
    const alreadyPublished = shape === 'self' || shape.startsWith('existing-')
    const child = shape === 'self' ? parent
      : shape === 'existing-later' ? original.shrines[1]
      : shape === 'existing-earlier' ? original.shrines[0]
      : { ...structuredClone(parent), id: shape === 'same-id-distinct' ? parent.id : 1023 }
    if (child !== parent) Object.assign(child, { kind: 'linkedEffects', active: false, slotTimer: 8, nextSlot: 3 })
    delete child.linkedShrine
    for (const index of parentIndexes) original.shrines[index].linkedShrine = child
    const originalOrder = original.shrines.map(head => head.id)
    assert.equal(original.capacityPolicy.mode, 'scalable')
    assert.equal(await store.saveCheckpoint(false), false)
    assert.equal(store.hasCheckpoint(), true)
    assert.equal(store.loadCheckpoint(), true)
    const world = store.getWorld(), parents = parentIndexes.map(index => world.shrines[index])
    const loadedChild = parents[0].linkedShrine
    assert.notEqual(world, original)
    assert.notEqual(loadedChild, child)
    assert.equal(world.paused, false)
    for (const owner of parents) assert.equal(owner.linkedShrine, loadedChild)
    if (shape === 'self') assert.equal(loadedChild, parents[0])
    const roster = [...world.shrines], turn = world.turn
    // For an already published identity, consuming the link must have exactly
    // the same complete World result as a turn with that redundant link absent.
    const expected = alreadyPublished ? structuredClone(world) : undefined
    if (expected) {
      for (const index of parentIndexes) delete expected.shrines[index].linkedShrine
      tick(expected, 1 / 12)
    }
    tick(world, 1 / 12)
    assert.equal(world.turn, turn + 1)
    assert.equal(world.shrines.filter(head => head === loadedChild).length, 1)
    assert.equal(world.shrines.length, roster.length + Number(!alreadyPublished))
    assert.deepEqual(world.shrines.map(head => head.id), alreadyPublished ? originalOrder : [...originalOrder, loadedChild.id])
    for (let i = 0; i < roster.length; i++) assert.equal(world.shrines[i], roster[i])
    if (!alreadyPublished) assert.equal(world.shrines.at(-1), loadedChild)
    assert.equal(loadedChild.slotTimer, 7, 'one visit in the release turn, including ordinary new children')
    for (const owner of parents) {
      assert.equal(Object.hasOwn(owner, 'linkedShrine'), false)
      assert.equal(owner.slotTimer, 7)
      assert.equal(owner.uses, 1)
      assert.equal(owner.remaining, 2)
      assert.equal(owner.cooldown, 1)
      assert.equal(owner.enabled, false)
    }
    if (expected) assert.ok(isDeepStrictEqual(world, expected), 'complete World equals the redundant-link-free turn')
    if (shape === 'same-id-distinct') {
      assert.notEqual(loadedChild, parents[0])
      assert.equal(loadedChild.id, parents[0].id, 'the current guard accepts this supplied identity distinction')
    }
    tick(world, 1 / 12)
    assert.equal(world.shrines.filter(head => head === loadedChild).length, 1)
    assert.equal(loadedChild.slotTimer, 6, 'future turns retain one visit and do not republish')
  })
}
