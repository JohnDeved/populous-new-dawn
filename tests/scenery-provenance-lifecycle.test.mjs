import test from 'node:test'
import assert from 'node:assert/strict'
import { createWorld, tick } from '../app/model.ts'
import { missionData, missionNumbers, tutorialLevel } from '../app/mission-data.ts'
import { validSceneryProvenance, resolveTreeSource, resolveShrineTriggerSource } from '../app/scenery-provenance.ts'
import { depleteTree, stepScenery } from '../app/world-effects.ts'
import { damageTornadoBuilding } from '../app/building-runtime.ts'
import { finishLevelStart } from './level-start-fixture.mjs'

function strip(world) {
  delete world.scenerySource
  for (const tree of world.trees) { delete tree.authoredSlot; delete tree.sceneryBirth }
  const visit = shrine => {
    delete shrine.triggerSlot; delete shrine.verifiedDecorationSlot
    for (const tree of shrine.linkedTrees ?? []) delete tree.authoredSlot
    if (shrine.linkedShrine) visit(shrine.linkedShrine)
  }
  world.shrines.forEach(visit)
  return world
}
function linkedObjects(level, object, mission) {
  const settings = object.settings ?? []
  return Array.from({ length: 10 }, (_, i) => settings[6+i*2] | settings[7+i*2]<<8).filter(Boolean).flatMap(link =>
    level.objects.find(o => o.index + 1 === link) ??
    (mission === 20 && link >= 0x06ac && link <= 0x06b1 ? level.objects.find(o => o.index + 1 === (link & 255)) : undefined) ?? [])
}

test('every imported mission constructor records exact initial and linked source slots', () => {
  for (const mission of [...missionNumbers, tutorialLevel]) {
    const world = createWorld(mission), level = missionData(mission).level
    assert.equal(validSceneryProvenance(world), true, `mission ${mission}`)
    const excluded = new Set(level.objects.filter(o => o.type === 6 && o.model === 6).flatMap(o => linkedObjects(level, o, mission).map(o => o.index)))
    const expected = level.objects.filter(o => o.type === 5 && o.model <= 6 && !(mission === 20 && excluded.has(o.index))).map(o => o.index)
    assert.deepEqual(world.trees.map(t => t.authoredSlot), expected, `initial mission ${mission}`)
    for (const tree of world.trees) assert.equal(tree.sceneryBirth, 'initial')
    // The complete slot array above checks every constructor; one diagnostic
    // resolver per mission avoids rebuilding its lookup Map for every tree.
    if (world.trees.length) assert.equal(resolveTreeSource(world, world.trees[0]).index, world.trees[0].authoredSlot)
    const visit = shrine => {
      const source = resolveShrineTriggerSource(world, shrine)
      assert.ok(source, `recorded trigger mission ${mission}`)
      assert.equal(shrine.verifiedDecorationSlot, null)
      const expectedTrees = linkedObjects(level, source, mission).filter(o => o.type === 5 && o.model <= 6)
      for (const template of shrine.linkedTrees ?? []) {
        assert.ok(expectedTrees.some(o => o.index === template.authoredSlot), `resolved template mission ${mission}`)
        assert.equal('sceneryBirth' in template, false)
      }
      if (shrine.linkedShrine) visit(shrine.linkedShrine)
    }
    world.shrines.forEach(visit)
  }
})

test('Mission 20 overloaded link references resolve to actual imported slots, not raw link minus one', () => {
  const world = createWorld(20), level = missionData(20).level
  let checked = 0
  const visit = shrine => {
    const source = resolveShrineTriggerSource(world, shrine), settings = source.settings ?? []
    for (let i=0; i<10; i++) {
      const link = settings[6+i*2] | settings[7+i*2]<<8
      if (link < 0x06ac || link > 0x06b1) continue
      const resolved = level.objects.find(o => o.index+1 === link) ?? level.objects.find(o => o.index+1 === (link&255))
      if (resolved?.type === 5 && resolved.model <= 6) {
        assert.ok(shrine.linkedTrees.some(t => t.authoredSlot === resolved.index))
        assert.notEqual(resolved.index, link-1)
        checked++
      }
    }
    if (shrine.linkedShrine) visit(shrine.linkedShrine)
  }
  world.shrines.forEach(visit)
  assert.ok(checked > 0, 'fixture must actually cover fallback tree references')
})

// Supplied activation fixture, not evidence of native head discovery/worship.
// The real opening and opposing roster are retained; only this head's activation
// and effect list are controlled to isolate tree-copy versus shrine-move semantics.
function releaseFixture() {
  const world = finishLevelStart(createWorld(20))
  let head
  const find = shrine => { if (!head && shrine.linkedTrees?.length && shrine.linkedShrine) head = shrine; if (shrine.linkedShrine) find(shrine.linkedShrine) }
  world.shrines.forEach(find)
  assert.ok(head)
  if (!world.shrines.includes(head)) world.shrines.push(head)
  for (const field of ['rewards', 'earthquakeTargets', 'lightningTargets', 'firestormTargets', 'volcanoTargets']) head[field] = []
  return { world, head }
}
function release(world, head) {
  Object.assign(head, { reset: false, enabled: true, active: true, forced: true, remaining: 3 })
  tick(world, 1/12)
}

test('linked releases copy trees with fresh IDs but move the allocated linked shrine only once', () => {
  const { world, head } = releaseFixture(), moved = head.linkedShrine, movedId = moved.id
  const templateSlots = head.linkedTrees.map(t => t.authoredSlot), before = new Set(world.trees.map(t => t.id))
  release(world, head)
  const first = world.trees.filter(t => !before.has(t.id) && t.sceneryBirth === 'linked-release')
  assert.deepEqual(first.map(t => t.authoredSlot), templateSlots)
  assert.ok(world.shrines.includes(moved)); assert.equal(moved.id, movedId)
  assert.equal('linkedShrine' in head, false)
  const secondBefore = new Set(world.trees.map(t => t.id))
  release(world, head)
  const second = world.trees.filter(t => !secondBefore.has(t.id) && t.sceneryBirth === 'linked-release')
  assert.deepEqual(second.map(t => t.authoredSlot), templateSlots)
  assert.equal(world.shrines.filter(s => s === moved).length, 1)
  assert.equal(new Set([...first, ...second].map(t => t.id)).size, first.length+second.length)
  assert.equal(validSceneryProvenance(world), true)
})

test('marked world releasing an unknown legacy template does not manufacture half a claim', () => {
  const { world, head } = releaseFixture()
  head.linkedTrees = head.linkedTrees.map(template => {
    const unknown = { ...template }; delete unknown.authoredSlot; return unknown
  })
  const before = new Set(world.trees.map(t => t.id))
  release(world, head)
  const copies = world.trees.filter(t => !before.has(t.id))
  assert.ok(copies.length)
  for (const copy of copies) { assert.equal('authoredSlot' in copy, false); assert.equal('sceneryBirth' in copy, false) }
  assert.equal(validSceneryProvenance(world), true)
})

test('replant and tornado log births are explicit dynamic only in marked worlds', () => {
  for (const legacy of [false, true]) {
    const world = createWorld(); if (legacy) strip(world)
    const old = world.trees.find(t => t.model === 1), slot = old.authoredSlot
    depleteTree(world, old)
    // Shortened request tests the existing allocation callback, not the native delay.
    world.replants[0].remaining = 1
    const before = new Set(world.trees.map(t => t.id))
    stepScenery(world)
    const sapling = world.trees.find(t => !before.has(t.id))
    assert.ok(sapling); assert.equal(old.authoredSlot, slot); assert.equal(old.logs, 0)
    const hut = world.buildings.find(b => b.kind === 'hut' && b.progress > 0)
    assert.ok(hut)
    const beforeLog = new Set(world.trees.map(t => t.id))
    damageTornadoBuilding(world, hut, 0)
    const log = world.trees.find(t => !beforeLog.has(t.id))
    assert.ok(log); assert.equal(log.model, 11)
    for (const [birth, object] of [['replant', sapling], ['loose-log', log]]) {
      if (legacy) { assert.equal('authoredSlot' in object, false); assert.equal('sceneryBirth' in object, false) }
      else { assert.equal(object.authoredSlot, null); assert.equal(object.sceneryBirth, birth) }
    }
    assert.equal(validSceneryProvenance(world), true)
  }
})

test('optional annotations do not alter bounded gameplay continuation, RNG or allocation IDs', () => {
  const annotated = createWorld(5), unknown = strip(structuredClone(annotated))
  for (let i=0; i<16; i++) { tick(annotated, 1/12); tick(unknown, 1/12) }
  assert.equal(annotated.nextId, unknown.nextId)
  assert.equal(annotated.randomState, unknown.randomState)
  assert.deepEqual(strip(structuredClone(annotated)), unknown)
})
