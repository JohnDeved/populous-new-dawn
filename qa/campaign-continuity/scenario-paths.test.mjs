import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { requireContinueBoundary, requireLoadedCheckpoint } from './boundaries.mjs'
const source = readFileSync(new URL('./scenario.mjs', import.meta.url), 'utf8')
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
function body(name, next) {
  const start = source.indexOf(`  const ${name} =`), end = source.indexOf(`  const ${next} =`, start)
  assert.ok(start >= 0 && end > start); return source.slice(start, end)
}
const identity = level => ({ sameStore: true, newWorld: true, newScene: true, currentCorrespondence: true, level, replacementLevel: level, error: null })

test('actual Continue path disposes the old epoch, clicks Continue and rebinds before any new mission input', async () => {
  for (const mismatch of [false, true]) {
    const calls = [], boundary = { ...identity(2), newScene: !mismatch }
    const execute = new AsyncFunction('deps', `
      const { assert, calls, boundary, requireContinueBoundary } = deps;
      let level = 1, training = {}, victimSelection = {}, sermonPlan = {}, savedSermon = {}, missionWallStarted = Date.now();
      const missionWallMs = { 1: 0, 2: 0 }, milestones = [], transitions = [], checkpointProofs = [{ level: 1, loaded: true }];
      const validateMissionMilestones = () => calls.push('old proof validated'), read = async () => ({ status: 'won' });
      const assertCompleted = async levels => calls.push('profile ' + levels), pause = async () => calls.push('pause');
      const endEpoch = async () => calls.push('dispose epoch'), epochs = [];
      const installReplacementObservation = () => {}, replacementIdentity = () => {};
      const page = { evaluate: async fn => fn === installReplacementObservation ? calls.push('subscribe before input') : boundary };
      const button = async label => calls.push(label), bindGameWithPreservation = async () => calls.push('bind current scene');
      const bindObservation = async name => calls.push(name), log = () => {}, initializeMission = async () => calls.push('initialize new mission');
      ${body('continueMission', 'markRoute')}
      await continueMission(false);
      return { level, transitions, training, victimSelection, sermonPlan, savedSermon };
    `)
    if (mismatch) {
      await assert.rejects(execute({ assert, calls, boundary, requireContinueBoundary }), /replaces the scene/)
      assert.ok(!calls.includes('initialize new mission'))
    } else {
      const result = await execute({ assert, calls, boundary, requireContinueBoundary })
      assert.deepEqual(calls, ['old proof validated', 'profile 1', 'pause', 'dispose epoch', 'subscribe before input', 'Continue to Mission 2', 'bind current scene', 'continue-2-0', 'initialize new mission'])
      assert.equal(result.level, 2); assert.equal(result.transitions.length, 1)
      for (const key of ['training', 'victimSelection', 'sermonPlan', 'savedSermon']) assert.equal(result[key], null)
    }
  }
})
test('actual Save/Load wrapper clicks ordinary Pause before binding/import/digest work and validates actual stored identity', async () => {
  for (const mismatch of ['none', 'loaded-actors', 'stored-digest']) {
    const calls = [], saved = { level: 1, turn: 100, time: 8, actorsSha256: 'actors', terrainSha256: 'terrain', stockSha256: 'stock', checkpointSha256: 'stored' }
    const loaded = { ...saved, ...(mismatch === 'loaded-actors' ? { actorsSha256: 'changed' } : {}) }
    const after = { ...saved, ...(mismatch === 'stored-digest' ? { checkpointSha256: 'changed' } : {}) }
    const execute = new AsyncFunction('deps', `
      const { assert, calls, saved, loaded, after, requireLoadedCheckpoint, identity } = deps;
      let level = 1; const protectedLatest = { checkpoint: saved }, epochs = [], checkpointProofs = [];
      const pause = async () => calls.push('Pause before reload'), endEpoch = async () => calls.push('close epoch');
      const installReplacementObservation = () => {}, checkpointObservation = () => {}, replacementIdentity = () => {};
      const page = { reload: async () => calls.push('real page reload'), getByRole: () => ({ isVisible: async () => true }),
        evaluate: async fn => { if (fn === installReplacementObservation) { calls.push('subscribe'); return; }
          if (fn === checkpointObservation) { calls.push('replacement digest'); return loaded; } return identity(1); } };
      const pollUI = async check => assert.equal(await check(), true), observeCheckpoint = async label => {
        calls.push(label); return { checkpoint: label.includes('before') ? saved : after }; };
      const button = async label => calls.push(label), bindGameWithPreservation = async () => calls.push('bind diagnostics');
      const bindObservation = async () => calls.push('bind new epoch'), read = async () => ({ paused: true, turn: 101 });
      const health = () => {}, assertCompleted = async levels => { assert.deepEqual(levels, []); calls.push('profile checked'); },
        log = () => {}, mark = async name => calls.push(name);
      ${body('reloadCheckpoint', 'reloadSermon')}
      await reloadCheckpoint(); return checkpointProofs;
    `)
    const operation = execute({ assert, calls, saved, loaded, after, requireLoadedCheckpoint, identity })
    if (mismatch === 'none') {
      const proofs = await operation; assert.equal(proofs.length, 1); assert.equal(proofs[0].loaded, true)
      assert.ok(calls.indexOf('Load Game') < calls.indexOf('Pause game'))
      assert.ok(calls.indexOf('Pause game') < calls.indexOf('bind diagnostics'))
      assert.ok(calls.indexOf('Pause game') < calls.indexOf('replacement digest'))
      assert.equal(calls.at(-1), 'checkpoint-reloaded')
    } else {
      await assert.rejects(operation)
      assert.ok(!calls.includes('bind new epoch')); assert.ok(!calls.includes('checkpoint-reloaded'))
    }
  }
})
test('actual progress adapter rejects unscoped combat and ignores unrelated watch IDs', () => {
  const execute = new Function('deps', `const { assert, objectiveProgress } = deps; const conditionMet = () => false;
    ${body('progressFor', 'pauseForPreservation')} return progressFor;`)
  const seen = [], progress = execute({ assert, objectiveProgress: (state, condition, scope, ids) => { seen.push(ids); return JSON.stringify(ids) } })
  const state = { units: [{ id: 99, work: 55 }], buildings: [{ id: 55, kind: 'camp', team: 'blue' }], shrines: [], stats: {}, shots: {} }
  progress(state, { type: 'target-gone', id: 10 }, 'combat', [99, 77]); assert.deepEqual(seen.pop(), [10])
  progress(state, { type: 'units-near', id: 10 }, 'movement', [99]); assert.deepEqual(seen.pop(), [10])
  progress(state, { type: 'trained-kind', kind: 'warrior', existingIds: [] }, 'training', [55, 77]); assert.deepEqual(seen.pop(), [55, 99])
  assert.throws(() => progress(state, { type: 'trained-kind', kind: 'warrior' }, 'training', [55]))
  assert.throws(() => progress(state, { type: 'target-gone' }, 'combat', [99]), /name its objective/)
})

test('disabled source checkpoint rejects scenario import before the harness may launch', async () => {
  await assert.rejects(import('./scenario.mjs'), /Source-only checkpoint/)
})
