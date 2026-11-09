import test from 'node:test'
import assert from 'node:assert/strict'
import { bindTrainingPanelRequests, trainingPanelRequestOwner, requestTrainingPanel, requestVaultPanel } from '../app/training-panel-requests.ts'

function fixture() {
  const world = {}, calls = []
  const owner = { requestAutomaticTraining: id => calls.push(['training', id]), requestAutomaticVault: id => calls.push(['vault', id]) }
  return { world, owner, calls }
}

test('older release cannot revoke a newer binding of the same owner', () => {
  const { world, owner, calls } = fixture()
  const oldRelease = bindTrainingPanelRequests(world, owner)
  const release = bindTrainingPanelRequests(world, owner)
  oldRelease()
  assert.equal(trainingPanelRequestOwner(world), owner)
  requestTrainingPanel(world, 11)
  requestVaultPanel(world, 12)
  assert.deepEqual(calls, [['training', 11], ['vault', 12]])
  release()
  assert.equal(trainingPanelRequestOwner(world), undefined)
})

test('an already released binding cannot revoke later reuse of its owner', () => {
  const { world, owner } = fixture()
  const oldRelease = bindTrainingPanelRequests(world, owner)
  oldRelease()
  const release = bindTrainingPanelRequests(world, owner)
  oldRelease()
  assert.equal(trainingPanelRequestOwner(world), owner)
  release()
})

test('distinct owners, worlds, synchronous dispatch and repeated release remain isolated', () => {
  const a = fixture(), b = fixture()
  const oldRelease = bindTrainingPanelRequests(a.world, a.owner)
  const release = bindTrainingPanelRequests(a.world, b.owner)
  const releaseB = bindTrainingPanelRequests(b.world, b.owner)
  oldRelease()
  requestTrainingPanel(a.world, 0)
  requestVaultPanel(b.world, 9)
  assert.deepEqual(a.calls, [])
  assert.deepEqual(b.calls, [['training', 0], ['vault', 9]])
  release(); release()
  assert.equal(trainingPanelRequestOwner(a.world), undefined)
  assert.equal(trainingPanelRequestOwner(b.world), b.owner)
  requestTrainingPanel(a.world, 3)
  assert.equal(b.calls.length, 2)
  releaseB()
  assert.equal(trainingPanelRequestOwner(b.world), undefined)
})

test('dispatch preserves the owner receiver and synchronous failure identity', () => {
  const world = {}, failure = new Error('owner failed')
  let called = false
  const owner = {
    requestAutomaticTraining(id) {
      assert.equal(this, owner)
      assert.equal(id, 17)
      called = true
      throw failure
    },
    requestAutomaticVault(id) {
      assert.equal(this, owner)
      assert.equal(id, 18)
      throw failure
    },
  }
  const release = bindTrainingPanelRequests(world, owner)
  assert.throws(() => requestTrainingPanel(world, 17), error => error === failure)
  assert.equal(called, true)
  assert.throws(() => requestVaultPanel(world, 18), error => error === failure)
  assert.equal(trainingPanelRequestOwner(world), owner)
  release()
})
