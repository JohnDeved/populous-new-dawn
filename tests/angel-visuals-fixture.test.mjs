import assert from 'node:assert/strict'
import test from 'node:test'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createAngelVisualFixture, angelCheckpointState } from '../scripts/tutorial-browser/angel-visuals-fixture.mjs'
import { checkpointCodec } from '../scripts/tutorial-browser/checkpoint-codec.mjs'
import { createGameStore, migrateCheckpoint } from '../app/game-store.ts'
import { CHECKPOINT_VERSION } from '../app/checkpoint-format.ts'
import { advanceGame } from '../app/game-clock.ts'
import rules from '../app/original-rules.json' with { type: 'json' }
import { nativeModelResource } from '../app/model-resources.ts'
import { validAngelPresentation } from '../app/angel-presentation.ts'
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
const sha = value => createHash('sha256').update(value).digest('hex')
test('supplied fixture is lossless current-v4 with every owner in a genuine prepared transition', () => {
  const f = createAngelVisualFixture({ commit }), record = checkpointCodec(f.transfer, true), w = checkpointCodec(f.expected, true)
  assert.equal(record.version, CHECKPOINT_VERSION); assert.equal(record.version, 4)
  assert.deepEqual(checkpointCodec(record), f.transfer)
  assert.equal(sha(JSON.stringify(f.transfer)), f.receipt.transferSha256)
  assert.equal(sha(JSON.stringify(f.expected)), f.receipt.expectedSha256)
  assert.deepEqual(angelCheckpointState(w), f.receipt.state)
  assert.equal(w.paused, true); assert.equal(w.inputMask, 0); assert.equal(w.turn, 2)
  assert.equal(w.effects.filter(f => f.angel).length, 4)
  assert.equal(new Set(f.receipt.ids).size, 4)
  for (const effect of w.effects.filter(f => f.angel)) {
    assert.equal(effect.angel.lifetime, 78); assert.equal(effect.angel.phase, 'striking')
    assert.ok(validAngelPresentation(effect.angel.presentation))
    assert.equal(effect.angel.presentation.displayed.to, 77)
  }
  assert.ok(w.trees.find(t => t.id === f.receipt.neighbourId && t.model === 1))
  assert.equal(nativeModelResource(rules.sceneryObjects[w.trees.find(t => t.id === f.receipt.neighbourId).model], 2).id, 13)
  assert.ok(w.units.find(u => u.id === f.receipt.shamanId && u.invisibility > 0))
  assert.throws(() => createAngelVisualFixture({ commit: '0'.repeat(40) }))
})
test('normal current-format continuation reaches both mesh loops, transition keys, shrinking death and exact expiry', () => {
  const f = createAngelVisualFixture({ commit }), world = checkpointCodec(f.expected, true)
  world.paused = false
  const clock = { animationTime: 0, animationFrame: 0 }, seen = new Map(f.receipt.ids.map(id => [id, { bases: new Set(), transitions: new Set(), scales: new Set() }]))
  for (let visit = 0; visit < 188; visit++) {
    advanceGame(world, clock, 1 / 24)
    for (const effect of world.effects.filter(f => f.angel)) {
      const p = effect.angel.presentation.displayed, s = seen.get(effect.id)
      assert.ok(validAngelPresentation(effect.angel.presentation))
      if (p.to >= 76) s.transitions.add(p.to); else s.bases.add(p.base)
      if (effect.angel.phase === 'dying') s.scales.add(p.scale)
    }
  }
  assert.equal(world.turn, 96); assert.equal(world.effects.filter(f => f.angel).length, 0)
  for (const s of seen.values()) {
    assert.deepEqual([...s.bases].sort(), [62, 69]); assert.ok(s.transitions.has(76) && s.transitions.has(77) && s.transitions.has(78))
    assert.deepEqual([...s.scales].sort((a,b) => b-a), Array.from({length:16}, (_,i) => 160-i*10))
  }
  assert.ok(world.units.find(u => u.id === f.receipt.shamanId && u.hp > 0))
})


test('a newly publicly saved in-memory checkpoint has one migration at Load, unlike the initial IDB restore plus Load', async () => {
  const fixture = createAngelVisualFixture({ commit }), store = createGameStore()
  Object.assign(store.getWorld(), checkpointCodec(fixture.expected, true))
  await store.saveCheckpoint(true)
  const saved = structuredClone(store.getWorld())
  assert.equal(store.loadCheckpoint(), true)
  assert.deepEqual(checkpointCodec(store.getWorld()), checkpointCodec(migrateCheckpoint(saved)))
})
