import test from 'node:test'
import assert from 'node:assert/strict'
import { missionData } from '../app/mission-data.ts'
import { createWorld } from '../app/model.ts'
import { createWorldState } from '../app/world-state.ts'
import { createGameStore, migrateCheckpoint } from '../app/game-store.ts'
import { checkpointCodec } from '../scripts/tutorial-browser/checkpoint-codec.mjs'
import { validSceneryProvenance, treeSceneryOrigin, resolveTreeSource, resolveShrineTriggerSource } from '../app/scenery-provenance.ts'

const marked = (level = 5) => {
  const source = missionData(level).level
  return { outcome: { level }, scenerySource: { version: 1, sourceSha256: source.sourceSha256, headerSha256: source.headerSha256 }, trees: [], shrines: [] }
}
const tree = () => ({ id: 901, x: -123, z: 456, model: 11, logs: 0, authoredSlot: 0, sceneryBirth: 'initial' })

test('authored zero resolves by immutable source identity, not runtime ID/model/position/wood', () => {
  const world = marked(), live = tree()
  world.trees.push(live)
  assert.equal(validSceneryProvenance(world), true)
  assert.equal(resolveTreeSource(world, live), missionData(5).level.objects.find(o => o.index === 0))
  assert.deepEqual(treeSceneryOrigin(world, live), { kind: 'authored', slot: 0, birth: 'initial' })
  world.trees.push({ ...live, id: 902, sceneryBirth: 'linked-release' })
  assert.equal(validSceneryProvenance(world), true, 'multiple live copies may share a source slot')
})

test('absence remains unknown; explicit dynamic births require a valid marker', () => {
  const world = marked(), unknown = { id: 1 }
  assert.deepEqual(treeSceneryOrigin(world, unknown), { kind: 'unknown' })
  assert.equal(resolveTreeSource(world, unknown), null)
  for (const birth of ['replant', 'loose-log']) {
    const dynamic = { authoredSlot: null, sceneryBirth: birth }
    world.trees = [dynamic, unknown]
    assert.equal(validSceneryProvenance(world), true)
    assert.deepEqual(treeSceneryOrigin(world, dynamic), { kind: 'dynamic', birth })
    assert.equal(resolveTreeSource(world, dynamic), null)
    const legacy = { ...world }; delete legacy.scenerySource
    assert.equal(validSceneryProvenance(legacy), false)
    assert.throws(() => resolveTreeSource(legacy, dynamic), RangeError)
  }
  const legacy = { outcome: { level: 5 }, trees: [unknown], shrines: [{}] }
  assert.equal(validSceneryProvenance(legacy), true)
  assert.equal(resolveShrineTriggerSource(legacy, legacy.shrines[0]), null)
  assert.equal('scenerySource' in createWorldState(), false)
})

test('partial, undefined, mismatched and invented source claims fail closed', () => {
  const invalid = [
    { authoredSlot: 0 }, { sceneryBirth: 'initial' }, { authoredSlot: undefined, sceneryBirth: undefined },
    { authoredSlot: null, sceneryBirth: 'initial' }, { authoredSlot: 0, sceneryBirth: 'loose-log' },
    { authoredSlot: 0, sceneryBirth: 'invented' },
    ...[-1, 0.5, 1999, 2000, NaN, '0'].map(authoredSlot => ({ authoredSlot, sceneryBirth: 'initial' })),
  ]
  // 1999 is a legal slot number but absent in this pinned mission; do not fabricate an authored record.
  assert.equal(missionData(5).level.objects.some(o => o.index === 1999), false)
  const nonTree = missionData(5).level.objects.find(o => o.type !== 5 || o.model > 6)
  invalid.push({ authoredSlot: nonTree.index, sceneryBirth: 'initial' })
  for (const claim of invalid) {
    const world = marked(); world.trees = [claim]
    assert.equal(validSceneryProvenance(world), false, JSON.stringify(claim))
    assert.throws(() => resolveTreeSource(world, claim), RangeError)
  }
  for (const patch of [{ version: 2 }, { sourceSha256: '0'.repeat(64) }, { headerSha256: '0'.repeat(64) }]) {
    const world = marked(); Object.assign(world.scenerySource, patch)
    assert.equal(validSceneryProvenance(world), false)
    assert.throws(() => treeSceneryOrigin(world, {}), RangeError)
  }
  const dated = marked(); dated.scenerySource = Object.assign(new Date(0), dated.scenerySource)
  assert.equal(validSceneryProvenance(dated), false, 'decorated Date fields are lost by clone/codec')
  assert.throws(() => resolveTreeSource(dated, {}), RangeError)
  const undefinedMarker = marked(); undefinedMarker.scenerySource = undefined
  assert.equal(validSceneryProvenance(undefinedMarker), false)
  for (const level of [undefined, null, '1', 1.5]) {
    const world = marked(1); world.outcome.level = level
    assert.equal(validSceneryProvenance(world), false, 'no default-to-mission-one source inference')
    assert.throws(() => resolveTreeSource(world, {}), RangeError)
  }
  const missingLevel = marked(1); delete missingLevel.outcome.level
  assert.equal(validSceneryProvenance(missingLevel), false)
  assert.throws(() => resolveTreeSource(missingLevel, {}), RangeError)
  const wrongMission = marked(); wrongMission.outcome.level = 999
  assert.equal(validSceneryProvenance(wrongMission), false)
})

test('trigger and decoration are distinct; aliases and cycles preserved, malformed graph claims rejected', () => {
  const world = marked(14), shrine = { triggerSlot: 0, verifiedDecorationSlot: null }
  world.shrines = [shrine, shrine]
  assert.equal(validSceneryProvenance(world), true)
  assert.equal(resolveShrineTriggerSource(world, shrine), missionData(14).level.objects.find(o => o.index === 0))
  for (const claim of [{ triggerSlot: 0 }, { verifiedDecorationSlot: null }, { triggerSlot: undefined, verifiedDecorationSlot: null }, { triggerSlot: 0, verifiedDecorationSlot: 0 }]) {
    world.shrines = [claim]
    assert.equal(validSceneryProvenance(world), false)
    assert.throws(() => resolveShrineTriggerSource(world, claim), RangeError)
  }
  world.shrines = [shrine]; shrine.linkedShrine = shrine
  assert.equal(validSceneryProvenance(world), true, 'existing cyclic graphs stay supported')
  shrine.verifiedDecorationSlot = 0
  assert.equal(validSceneryProvenance(world), false, 'cycle must not hide an invalid claim')
  shrine.verifiedDecorationSlot = null
  shrine.linkedShrine = { triggerSlot: 0, linkedShrine: shrine }
  assert.equal(validSceneryProvenance(world), false, 'malformed child in a cycle is still checked')
  shrine.linkedShrine.verifiedDecorationSlot = null
  assert.equal(validSceneryProvenance(world), true)
  for (const copy of [structuredClone(world), checkpointCodec(checkpointCodec(world), true)]) {
    assert.equal(validSceneryProvenance(copy), true)
    assert.equal(copy.shrines[0].linkedShrine.linkedShrine, copy.shrines[0])
  }
  delete shrine.linkedShrine
  const trees = marked(); trees.shrines = [{ linkedTrees: [{ authoredSlot: 0 }] }]
  assert.equal(validSceneryProvenance(trees), true)
  for (const template of [{ authoredSlot: undefined }, { authoredSlot: null }, { authoredSlot: 0, sceneryBirth: 'initial' }, { sceneryBirth: undefined }]) {
    trees.shrines[0].linkedTrees = [template]
    assert.equal(validSceneryProvenance(trees), false)
  }
  trees.shrines[0].linkedTrees = [{}]
  assert.equal(validSceneryProvenance(trees), true, 'marked worlds can contain unknown legacy templates')
})

test('clone, codec and current normalization preserve provenance without filling legacy absence', () => {
  const world = createWorld(5, 'scalable')
  for (const copy of [structuredClone(world), checkpointCodec(checkpointCodec(world), true)]) {
    assert.deepEqual(copy.scenerySource, world.scenerySource)
    assert.deepEqual(copy.trees.map(t => [t.authoredSlot, t.sceneryBirth]), world.trees.map(t => [t.authoredSlot, t.sceneryBirth]))
    assert.equal(validSceneryProvenance(copy), true)
    migrateCheckpoint(copy)
    assert.equal(validSceneryProvenance(copy), true)
  }
  delete world.scenerySource
  for (const t of world.trees) { delete t.authoredSlot; delete t.sceneryBirth }
  const strip = shrine => { delete shrine.triggerSlot; delete shrine.verifiedDecorationSlot; for (const t of shrine.linkedTrees ?? []) delete t.authoredSlot; if (shrine.linkedShrine) strip(shrine.linkedShrine) }
  world.shrines.forEach(strip)
  migrateCheckpoint(world)
  assert.equal('scenerySource' in world, false)
  assert.equal(world.trees.some(t => 'authoredSlot' in t || 'sceneryBirth' in t), false)
  assert.equal(validSceneryProvenance(world), true)
})

test('public save boundary rejects malformed provenance without replacing prior in-session checkpoint', async () => {
  const store = createGameStore(), world = store.getWorld(), original = world.trees[0].authoredSlot
  await store.saveCheckpoint() // No IndexedDB here: this exercises the in-session boundary, not browser persistence.
  world.trees[0].authoredSlot = 2000
  await assert.rejects(store.saveCheckpoint(), /checkpoint|scenery|provenance/i)
  assert.equal(store.loadCheckpoint(), true)
  assert.equal(store.getWorld().trees[0].authoredSlot, original)
  assert.equal(validSceneryProvenance(store.getWorld()), true)
})
