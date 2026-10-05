import assert from 'node:assert/strict'
import test from 'node:test'
import { installVaultWitness } from './witness.mjs'

function fixture() {
  const world = { turn: 0, time: 0, paused: false, speed: 1, unlockedTemple: false,
    shrines: [{ id: 91, kind: 'vault', reward: 'temple', active: true, remaining: 1 }],
    outcome: { level: 3 }, gifts: [], manaWorld: { playerTribe: 0 } }
  const calls = [], scene = { world, scene: {}, camera: {}, shrineMeshes: new Map(), fxMeshes: new Map() }
  const before = function (...args) { calls.push(['before', this === scene.gameClock, args]); return 10 }
  const after = function (...args) { calls.push(['after', this === scene.gameClock, args]); return 11 }
  const render = function (...args) { calls.push(['render', this === scene.renderer, args]); return 12 }
  scene.gameClock = { beforeTurn: before, afterTurn: after }
  scene.renderer = { render, domElement: { width: 100, height: 100, toDataURL() {
    assert.equal(calls.at(-1)[0], 'render'); return 'data:image/png;base64,AAAA'
  } } }
  globalThis.window = { testSceneRef: { current: scene }, testStore: { getWorld: () => world } }
  return { scene, world, calls, before, after, render }
}

test('observer preserves production calls, observes state without writes, and captures after the real render', async () => {
  const f = fixture(), initial = structuredClone(f.world)
  await installVaultWitness()
  assert.deepEqual(f.world, initial)
  assert.equal(f.scene.gameClock.beforeTurn('input'), 10)
  f.world.turn++
  const afterTurn = structuredClone(f.world)
  assert.equal(f.scene.gameClock.afterTurn('output'), 11)
  assert.deepEqual(f.world, afterTurn)
  assert.equal(window.vaultEvidence.stages.preflight.postRender, undefined)
  assert.equal(f.scene.renderer.render(f.scene.scene, f.scene.camera), 12)
  assert.deepEqual(f.world, afterTurn)
  assert.equal(window.vaultEvidence.stages.preflight.postRender.state.turn, 1)
  assert.equal(window.vaultRenderedPixels.preflight, 'data:image/png;base64,AAAA')
  assert.deepEqual(f.calls.map(c => [c[0], c[1]]), [['before', true], ['after', true], ['render', true]])
  assert.deepEqual(f.calls[0][2], ['input']); assert.deepEqual(f.calls[1][2], ['output'])
  const result = window.restoreVaultWitness()
  assert.equal(result.restored, true); assert.deepEqual(result.errors, [])
  assert.equal(f.scene.gameClock.beforeTurn, f.before)
  assert.equal(f.scene.gameClock.afterTurn, f.after)
  assert.equal(f.scene.renderer.render, f.render)
})

test('original renderer errors propagate exactly; diagnostic errors do not suppress it', async () => {
  const f = fixture(), originalFailure = Error('application failure')
  let calls = 0
  f.scene.renderer.render = () => { calls++; throw originalFailure }
  await installVaultWitness()
  assert.throws(() => f.scene.renderer.render(f.scene.scene, f.scene.camera), error => error === originalFailure)
  assert.equal(calls, 1)
  assert.deepEqual(window.vaultEvidence.errors, [])
  window.restoreVaultWitness()
  const g = fixture()
  g.scene.renderer.domElement.toDataURL = () => { throw Error('capture failure') }
  await installVaultWitness()
  g.scene.gameClock.beforeTurn(); g.world.turn++; g.scene.gameClock.afterTurn()
  assert.equal(g.scene.renderer.render(g.scene.scene, g.scene.camera), 12)
  assert.equal(g.calls.filter(c => c[0] === 'render').length, 1)
  assert.match(window.vaultEvidence.errors[0], /capture failure/)
  assert.equal(g.world.paused, false)
  const result = window.restoreVaultWitness()
  assert.equal(result.restored, false)
  assert.equal(g.scene.renderer.render, g.render)
})

test('crossed birth and retirement remain separate when no real render occurs between them', async () => {
  const f = fixture()
  await installVaultWitness()
  window.vaultEvidence.arm = 'birth'
  const visit = mutate => {
    f.scene.gameClock.beforeTurn(); f.world.turn++; mutate(); f.scene.gameClock.afterTurn()
  }
  visit(() => f.world.gifts.push({ id: 200, reward: 'temple', recipient: 0, remaining: 82, phase: 6 }))
  assert.equal(window.vaultEvidence.arm, 'retirement')
  for (let i = 1; i <= 6; i++) visit(() => { f.world.gifts[0].remaining--; f.world.gifts[0].phase-- })
  assert.equal(window.vaultEvidence.arm, 'payout')
  assert.equal(window.vaultEvidence.stages.birth.afterTurn.gift.phase, 6)
  assert.equal(window.vaultEvidence.stages.retirement.afterTurn.gift.phase, 0)
  assert.equal(window.vaultEvidence.stages.birth.postRender, undefined)
  f.scene.renderer.render(f.scene.scene, f.scene.camera)
  assert.equal(window.vaultEvidence.stages.birth.postRender.state.gift.phase, 0,
    'Late first real frame is reported honestly, not relabelled as a visible birth')
  assert.equal(window.vaultEvidence.stages.retirement.postRender.state.gift.remaining, 76)
  assert.equal(f.world.paused, false)
  assert.equal(window.restoreVaultWitness().restored, true)
})
