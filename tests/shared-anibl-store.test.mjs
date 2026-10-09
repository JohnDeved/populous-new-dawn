import assert from 'node:assert/strict'
import test from 'node:test'
import { createGameStore } from '../app/game-store.ts'
import { advanceGame } from '../app/game-clock.ts'
import { visitWorshipAcquisition } from '../app/worship-acquisition-runtime.ts'

test('M3 resources publish atomically with World and expose immutable shared selections', () => {
  const store = createGameStore()
  assert.equal(store.getPresentationSnapshot(), null)
  const published = []
  store.subscribe(() =>
    published.push({
      world: store.getWorld(),
      resource: store.getPresentationSnapshot(),
    })
  )
  store.startMission(3)
  const first = store.getPresentationSnapshot()
  assert.equal(published[0].world, store.getWorld())
  assert.deepEqual(published[0].resource, first)
  assert.deepEqual(
    { bank: first.bank, counter: first.counter, tile: first.tile },
    { bank: 'p', counter: 0, tile: 92 }
  )
  assert.ok(Object.isFrozen(first))
  const binding = store.bindPresentation(store.getWorld())
  const frames = []
  for (let i = 0; i < 9; i++) {
    binding.advance()
    frames.push(binding.snapshot().tile)
  }
  assert.deepEqual(frames, [93, 94, 95, 100, 101, 102, 103, 108, 92])
  assert.equal(first.counter, 0, 'previous frame snapshots never mutate')
  const beforeReads = binding.snapshot()
  for (let i = 0; i < 5; i++) assert.deepEqual(binding.snapshot(), beforeReads)
  store.startMission(1)
  assert.equal(published.at(-1).world.outcome.level, 1)
  assert.equal(published.at(-1).resource, null, 'invalidation precedes publication')
  assert.equal(binding.isCurrent(), false)
})

test('Save and storage restore preserve the bank; Load atomically resets it while restoring the World clock', async () => {
  const store = createGameStore()
  store.startMission(3)
  const world = store.getWorld(),
    old = store.bindPresentation(world)
  old.advance()
  old.advance()
  world.worshipAcquisition.clock.elapsed = 17
  world.worshipAcquisition.clock.nextVisit = 25
  const savedClock = structuredClone(world.worshipAcquisition.clock)
  const savedResource = store.getPresentationSnapshot()
  await store.saveCheckpoint()
  assert.deepEqual(store.getPresentationSnapshot(), savedResource)
  await store.restoreCheckpoint()
  assert.deepEqual(store.getPresentationSnapshot(), savedResource)
  for (let i = 0; i < 4; i++) old.advance()
  world.worshipAcquisition.clock.elapsed = 23
  let publication
  const unsubscribe = store.subscribe(() => {
    publication = { world: store.getWorld(), resource: store.getPresentationSnapshot() }
  })
  assert.equal(store.loadCheckpoint(), true)
  unsubscribe()
  assert.notEqual(publication.world, world)
  assert.equal(publication.world, store.getWorld())
  assert.equal(publication.resource.counter, 0)
  assert.equal(publication.resource.tile, 92)
  assert.ok(publication.resource.epoch > savedResource.epoch)
  assert.deepEqual(store.getWorld().worshipAcquisition.clock, savedClock)
  assert.equal(old.isCurrent(), false)
  old.advance()
  assert.equal(store.getPresentationSnapshot().counter, 0)
  const current = store.bindPresentation(store.getWorld())
  old.release()
  assert.equal(current.isCurrent(), true)
  current.advance()
  assert.equal(current.snapshot().counter, 1)
  const retryEpoch = current.snapshot().epoch
  assert.equal(store.loadCheckpoint(), true, 'explicit Load retry repeats the committed reset')
  assert.ok(store.getPresentationSnapshot().epoch > retryEpoch)
  assert.equal(store.getPresentationSnapshot().counter, 0)
})

test('same-resource Restart retains phase and epoch, replaces the World clock, and rejects the old binding', () => {
  const store = createGameStore()
  store.startMission(3)
  const previousWorld = store.getWorld(),
    old = store.bindPresentation(previousWorld)
  old.advance()
  old.advance()
  previousWorld.worshipAcquisition.clock.elapsed = 17
  previousWorld.worshipAcquisition.clock.nextVisit = 50
  previousWorld.worshipAcquisition.clock.limiter = 4
  const retained = old.snapshot()
  let publication
  store.subscribe(() => {
    publication = { world: store.getWorld(), resource: store.getPresentationSnapshot() }
  })
  store.restart()
  assert.notEqual(publication.world, previousWorld)
  assert.deepEqual(publication.resource, retained)
  assert.deepEqual(store.getWorld().worshipAcquisition.clock, {
    elapsed: 0,
    nextVisit: 0,
    lastVisit: 0,
    limiter: 0,
    normalRate: 40,
  })
  assert.equal(old.isCurrent(), false)
  old.advance()
  assert.deepEqual(store.getPresentationSnapshot(), retained)
  const current = store.bindPresentation(store.getWorld())
  const staleLateBinding = store.bindPresentation(previousWorld)
  assert.equal(staleLateBinding.isCurrent(), false, 'late old Scene cannot claim the live token')
  old.release()
  staleLateBinding.release()
  assert.equal(current.isCurrent(), true)
  current.advance()
  assert.equal(current.snapshot().counter, 3)
})

test('same-World Scene replacement revokes only the superseded binding and disposal retains phase', () => {
  const store = createGameStore()
  store.startMission(3)
  const world = store.getWorld(),
    old = store.bindPresentation(world)
  old.advance()
  const newer = store.bindPresentation(world),
    retained = newer.snapshot()
  old.advance()
  old.release()
  old.release()
  assert.equal(old.isCurrent(), false)
  assert.equal(old.snapshot(), null)
  assert.equal(newer.isCurrent(), true)
  assert.deepEqual(newer.snapshot(), retained)
  newer.release()
  newer.advance()
  assert.deepEqual(
    store.getPresentationSnapshot(),
    retained,
    'failed/disposed Scene does not roll back a committed bank'
  )
  const retryScene = store.bindPresentation(world)
  assert.deepEqual(retryScene.snapshot(), retained)
  retryScene.advance()
  assert.equal(retryScene.snapshot().counter, 2)
})

test('missing checkpoints and failed preparation preserve World, resource, and live binding', async t => {
  const store = createGameStore()
  store.startMission(3)
  const world = store.getWorld(),
    binding = store.bindPresentation(world)
  binding.advance()
  const retained = binding.snapshot()
  assert.equal(store.loadCheckpoint(), false)
  assert.equal(store.getWorld(), world)
  assert.deepEqual(store.getPresentationSnapshot(), retained)
  await store.saveCheckpoint()
  let publications = 0
  store.subscribe(() => publications++)
  t.mock.method(globalThis, 'structuredClone', () => {
    throw new Error('checkpoint preparation failed')
  })
  assert.throws(() => store.loadCheckpoint(), /checkpoint preparation failed/)
  assert.equal(publications, 0)
  assert.equal(store.getWorld(), world)
  assert.deepEqual(store.getPresentationSnapshot(), retained)
  assert.equal(binding.isCurrent(), true)
})

test('fresh starts, leaving M3, and non-normal Restart cannot retain the old M3 epoch', () => {
  const store = createGameStore()
  store.startMission(3)
  const first = store.bindPresentation(store.getWorld())
  first.advance()
  let { epoch } = first.snapshot()
  store.startMission(3)
  assert.ok(store.getPresentationSnapshot().epoch > epoch)
  assert.equal(store.getPresentationSnapshot().counter, 0)
  ;({ epoch } = store.getPresentationSnapshot())
  store.getWorld().land.landFlags |= 8
  store.restart()
  assert.ok(store.getPresentationSnapshot().epoch > epoch)
  ;({ epoch } = store.getPresentationSnapshot())
  store.startMission(1)
  const unsupported = store.bindPresentation(store.getWorld())
  assert.equal(unsupported.isCurrent(), true, 'Scene liveness is independent of resource support')
  unsupported.advance()
  assert.equal(unsupported.snapshot(), null)
  store.startMission(3)
  assert.ok(store.getPresentationSnapshot().epoch > epoch)
  assert.equal(store.getPresentationSnapshot().counter, 0)
})

test('the existing nominal clock owns catch-up and visible-pause visits, not draw reads or 24-Hz animation', () => {
  const store = createGameStore()
  store.startMission(3)
  const world = store.getWorld(),
    binding = store.bindPresentation(world)
  world.paused = true
  let hidden = false
  const clock = {
    animationTime: 0,
    animationFrame: 0,
    presentationHidden: () => hidden,
    worshipVisit: () => {
      binding.advance()
      visitWorshipAcquisition(world, () => assert.fail('no acquisition is active'))
    },
  }
  advanceGame(world, clock, 0.1)
  assert.equal(
    binding.snapshot().counter,
    5,
    'nominal visits include 0,25,50,75,100ms in one catch-up call'
  )
  assert.equal(clock.animationFrame, 0)
  hidden = true
  advanceGame(world, clock, 1)
  assert.equal(binding.snapshot().counter, 5)
  hidden = false
  advanceGame(world, clock, 0.025)
  assert.equal(binding.snapshot().counter, 6)
})
