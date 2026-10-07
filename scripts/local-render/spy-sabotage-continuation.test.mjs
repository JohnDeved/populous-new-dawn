import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { SPY_RESTART, requireSpyRestart, spyRouteLength, probeSpyRoutes } from './spy-sabotage-continuation.mjs'

test('continuation requires exact genuine save, source, profile, origin and closed prior run', () => {
  const checkpoint = { version: 1, level: 16, turn: SPY_RESTART.turn, checkpointSha256: SPY_RESTART.checkpointSha256 }
  const profile = { mode: 'reused', id: SPY_RESTART.profileId, origin: SPY_RESTART.origin,
    checkpointAtStart: checkpoint, correspondence: { decision: 'ACCEPT' },
    previousRun: { runId: SPY_RESTART.priorRunId, sourceCommit: SPY_RESTART.priorSource,
      cleanupVerified: true, continuationVerified: true, checkpointAtEnd: checkpoint } }
  assert.equal(requireSpyRestart(profile), checkpoint)
  for (const mutate of [p => { p.mode = 'created' }, p => { p.id = 'other' }, p => { p.origin = 'http://127.0.0.1:4494' },
    p => { p.correspondence = null }, p => { p.previousRun.cleanupVerified = false },
    p => { p.previousRun.continuationVerified = false }, p => { p.previousRun.sourceCommit = 'other' },
    p => { p.previousRun.runId = 'other' }, p => { p.checkpointAtStart.checkpointSha256 = 'different' },
    p => { p.checkpointAtStart.turn++ }, p => { p.checkpointAtStart.level = 15 }]) {
    const changed = structuredClone(profile); mutate(changed); assert.throws(() => requireSpyRestart(changed))
  }
})

test('actual maintained checkpoint-label contract rejects the failed semicolon and accepts every scenario label', () => {
  const harness = readFileSync(new URL('./harness.mjs', import.meta.url), 'utf8')
  const guard = harness.split('\n').find(line => line.includes("throw Error('Checkpoint label must be short plain text')"))
  assert.ok(guard, 'Use the actual maintained label guard')
  const validate = new Function('label', guard)
  assert.throws(() => validate('Genuine Spy02 Load; original committed Save retained'), /Checkpoint label/)
  const scenario = readFileSync(new URL('./ordinary-spy-sabotage.mjs', import.meta.url), 'utf8')
  const labels = [...scenario.matchAll(/\b(?:observeCheckpoint|checkpoint)\('([^']+)'/g)].map(match => match[1])
  assert.ok(labels.length > 0)
  for (const label of labels) assert.doesNotThrow(() => validate(label), label)
})

test('route length measures wrapped segments and rejects absent or non-finite routes', () => {
  assert.equal(spyRouteLength({ x: 120, z: 0 }, [{ x: -120, z: 0 }, { x: -120, z: 12 }]), 28)
  assert.throws(() => spyRouteLength({ x: 0, z: 0 }, []))
  assert.throws(() => spyRouteLength({ x: 0, z: 0 }, [{ x: NaN, z: 1 }]))
})

test('three-target navigation gives every mutating goal probe an isolated full-world clone', () => {
  const native = { goalX: 0 }, actor = { id: 394, hp: 30, native, x: 0, z: 0, team: 'blue', inside: null }
  const world = { units: [actor, { id: 22, hp: 10, team: 'yellow', kind: 'firewarrior', x: 8, z: 0, inside: null }],
    objectCells: { objects: new Map([[394, native]]) }, land: { flags: new Uint32Array([7, 8]) }, stock: new Map([['mana', 21]]) }
  const before = structuredClone(world), calls = []
  const candidates = [
    { id: 285, team: 'yellow', goals: [{ x: 1, y: 1 }, { x: 2, y: 2 }] },
    { id: 286, team: 'yellow', goals: [{ x: 3, y: 3 }] },
  ]
  const result = probeSpyRoutes(world, candidates, (probe, unit, goal) => {
    assert.notEqual(probe, world); assert.notEqual(unit, actor)
    assert.equal(probe.objectCells.objects.get(394), unit.native)
    assert.deepEqual(probe, before, 'Earlier probes must not affect later candidates/goals')
    calls.push(goal.x); probe.land.flags[0] = 999; probe.stock.set('mana', 0); unit.native.goalX = 42
    return goal.x === 1 ? [] : goal.x === 2 ? [{ x: 10, z: 0 }] : [{ x: 100, z: 0 }, { x: -100, z: 0 }, { x: -100, z: 40 }]
  })
  assert.deepEqual(world, before); assert.deepEqual(calls, [1, 2, 3])
  assert.deepEqual(result.map(r => r.id), [285, 286, 287])
  assert.equal(result[0].eligible, true); assert.equal(result[0].attempts.length, 2)
  assert.equal(result[0].defenders[0].id, 22)
  assert.equal(result[1].eligible, false); assert.equal(result[1].length, 196)
  assert.match(result[2].rejected, /missing/)
  const broken = structuredClone(world); broken.objectCells.objects.delete(394)
  assert.throws(() => probeSpyRoutes(broken, candidates, () => []), /registry/)
})
