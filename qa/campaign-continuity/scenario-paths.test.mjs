import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { requireContinueBoundary, requireLoadedCheckpoint, continueControlName, validateRunPolicy, sermonContinuation } from './boundaries.mjs'
import { requiredActorStop, objectiveProgress } from './observation.mjs'
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
      const { assert, calls, boundary, requireContinueBoundary, continueControlName } = deps;
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
      await assert.rejects(execute({ assert, calls, boundary, requireContinueBoundary, continueControlName }), /replaces the scene/)
      assert.ok(!calls.includes('initialize new mission'))
    } else {
      const result = await execute({ assert, calls, boundary, requireContinueBoundary, continueControlName })
      assert.deepEqual(calls, ['old proof validated', 'profile 1', 'pause', 'dispose epoch', 'subscribe before input', 'Continue to Mission 2 ↗', 'bind current scene', 'continue-2-0', 'initialize new mission'])
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
  progress(state, { type: 'shrine-used', id: 101, workerId: 5000 }, 'worship', [99]); assert.deepEqual(seen.pop(), [101, 5000])
  progress(state, { type: 'trained-kind', kind: 'warrior', existingIds: [] }, 'training', [55, 77]); assert.deepEqual(seen.pop(), [55, 99])
  assert.throws(() => progress(state, { type: 'trained-kind', kind: 'warrior' }, 'training', [55]))
  assert.throws(() => progress(state, { type: 'target-gone' }, 'combat', [99]), /name its objective/)
})

test('actual reused entry validates before Load, restores typed sermon history and requires fresh current identity', async () => {
  const start = source.indexOf('  const loadPriorSegment ='), end = source.indexOf('  let index = 0', start)
  assert.ok(start >= 0 && end > start)
  assert.match(source.slice(end), /else \{\s+await loadPriorSegment\(\)/)
  const execute = new AsyncFunction('deps', `
    const { assert, sermonContinuation, calls, reject } = deps;
    const receipt = { profile: { previousRun: { runId: sermonContinuation.runId, receiptPath: 'real-receipt', receiptSha256: 'bound' } }, source: {} };
    const policy = { limits: 'fixed' }, prior = { level: 3, policy, ownedWallMs: 5801958, missionWallMs: { 1: 1, 2: 2, 3: 2172699 },
      failures: ['one', 'two', 'envelope'], controlStops: ['progress-stall'], browserErrors: [], epochs: ['closed', 'terminal-observation'],
      milestones: [{ level: 3, name: 'conversion', missionActiveSeconds: 704.0833333333333 }], transitions: [], checkpointProofs: [], acceptedCasts: [],
      ids: { preacher: 3181, victim: 2631 }, protectedLatest: { checkpoint: 'actual7424' }, savedSermon: { victimId: 2631 },
      victimSelection: { inherited: true }, sermonPlan: { inherited: true }, sermonContinuation: { historyScope: 'inherited' } };
    const readSermonPredecessor = () => { calls.push('validate hash-bound predecessor'); if (reject) throw Error('predecessor mismatch'); return prior; };
    let inheritedSermon, savedSermon, victimSelection, sermonPlan, level, inheritedWallMs, missionWallStarted, protectedLatest;
    const missionWallMs = {}, ids = {}, inputs = [], failures = [], controlStops = [], priorBrowserErrors = [], epochs = [], milestones = [], transitions = [], checkpointProofs = [], acceptedCasts = [];
    const reloadCheckpoint = async options => { assert.equal(protectedLatest, prior.protectedLatest); assert.equal(ids.replacement, undefined);
      assert.equal(inheritedWallMs, 5801958); assert.equal(missionWallMs[3], 2172699); assert.equal(failures.length, 3); assert.equal(controlStops.length, 1);
      assert.deepEqual(options, { segment: true, sermon: true }); calls.push('ordinary protected Load'); };
    const campaignActive = () => 2692.666666666667, log = () => calls.push('new Load record'), snapshot = async () => calls.push('opening');
    ${source.slice(start, end)}
    await loadPriorSegment(); return { ids, savedSermon, milestones, inheritedSermon };
  `)
  for (const reject of [true, false]) {
    const calls = [], operation = execute({ assert, sermonContinuation, calls, reject })
    if (reject) { await assert.rejects(operation, /predecessor mismatch/); assert.deepEqual(calls, ['validate hash-bound predecessor']) }
    else { const result = await operation; assert.equal(result.ids.replacement, undefined); assert.equal(result.milestones.length, 1)
      assert.deepEqual(calls, ['validate hash-bound predecessor', 'ordinary protected Load', 'new Load record', 'opening']) }
  }
})

test('actual active wait stops on named worker loss before a flyby and preserves queued-stop priority', async () => {
  const execute = new AsyncFunction('deps', `
    const { assert, requiredActorStop, objectiveProgress, calls, queuedStop, states } = deps;
    const condition = { type: 'shrine-used', id: 101, workerId: 5000 };
    const consumeQueuedStop = async () => { calls.push('stop poll'); if (queuedStop) throw queuedStop; };
    let readIndex = 0;
    const read = async () => states[Math.min(readIndex++, states.length - 1)], requireOrderableForWait = () => {}, currentActive = () => 0;
    const signal = { throwIfAborted() {} }, health = () => {}, savedSermon = {}, conditionMet = () => false;
    const skipFlyby = async () => { calls.push('flyby'); throw Error('incorrect flyby'); }, log = entry => calls.push(entry);
    ${body('progressFor', 'pauseForPreservation')}
    ${body('waitFor', 'consumeQueuedStop')}
    await waitFor(condition, 'worship', [101, 5000]);
  `)
  const ready = { turn: 1, animationFrame: 1, paused: false, inputMask: 0, buildings: [],
    units: [{ id: 5000, hp: 50, team: 'blue', kind: 'brave', x: 1, z: 2, order: { model: 27, a: 101 } }], shrines: [{ id: 101, uses: 0 }] }
  for (const units of [[], [{ ...ready.units[0], order: { model: 3, a: 0 } }], [{ ...ready.units[0], personOwner: 'fight' }]]) {
    const failed = { ...ready, turn: 2, animationFrame: 2, inputMask: 1, units }
    for (const states of [[failed], [ready, failed]]) for (const queuedStop of [null, Error('authenticated preserving stop')]) {
      const calls = []
      await assert.rejects(execute({ assert, requiredActorStop, objectiveProgress, calls, queuedStop, states }), queuedStop ? error => error === queuedStop : /Required (Blue )?Brave5000/)
      assert.ok(!calls.includes('flyby'))
      const logged = calls.find(entry => entry.action === 'required-actor-unavailable')
      if (queuedStop) assert.equal(logged, undefined)
      else { assert.equal(logged.turn, 2); assert.deepEqual(logged.units, units) }
    }
  }
})

test('actual Erosion body selects only the fresh converted Brave and arms before the ordinary order', async () => {
  const execute = new AsyncFunction('deps', `
    const { assert, calls, stale } = deps;
    const milestones = [{ level: 3, name: 'conversion' }], ids = { preacher: 3181, victim: 2631, replacement: 5000, erosion: 101 };
    const state = { turn: 8000, units: [{ id: 3181, order: { model: 17, a: 2, b: 3 } }, { id: 5000 }] };
    const pause = async () => calls.push('pause'), read = async () => state;
    const requireCurrentConvertedWorker = () => { calls.push('current conversion'); if (stale) throw Error('stale worker'); return { id: 5000 }; };
    const selectUnits = async ids => { assert.deepEqual(ids, [5000]); calls.push('select actual Brave'); };
    const resume = async () => calls.push('resume'), page = { evaluate: async (fn, arg) => { calls.push(typeof arg === 'number' ? 'arm' : 'lifecycle evidence'); return {}; } };
    const log = () => {}, clickOrder = async () => calls.push('ordinary head input'), targetEntity = async () => ({ id: 101 });
    const waitFor = async condition => { if (condition.type === 'shrine-used') assert.equal(condition.workerId, 5000); calls.push(condition.type); };
    const mark = async () => {}, IncompleteRun = Error;
    ${body('erosion', 'conditionMet')}
    await erosion();
  `)
  for (const stale of [true, false]) {
    const calls = [], operation = execute({ assert, calls, stale })
    if (stale) { await assert.rejects(operation, /stale worker/); assert.deepEqual(calls, ['pause', 'current conversion']) }
    else { await operation; assert.ok(calls.indexOf('arm') < calls.indexOf('ordinary head input')); assert.ok(calls.includes('shrine-used')); assert.ok(calls.includes('erosion-retired')) }
  }
})

test('actual conversion and mark bodies retain the original budget milestone while recording a fresh successor proof', async () => {
  const execute = new AsyncFunction('deps', `
    const { assert } = deps;
    const original = { level: 3, name: 'conversion', missionActiveSeconds: 704.0833333333333, epoch: 'old-reload' };
    const milestones = [{ level: 3, name: 'sermon-reloaded', epoch: 'old-reload' }, original], ids = { victim: 2631, preacher: 3181 };
    const inheritedSermon = { priorRunId: 'old' }, receipt = { profile: { runId: 'new' } }, level = 3, epochs = [];
    const state = { turn: 8090, time: 674, units: [{ id: 5000, team: 'blue', kind: 'brave', hp: 50, flags3: 0x1000000, flags4: 0x40000 }],
      observation: { name: 'reload-new', level: 3, activeSeconds: 20 } };
    const read = async () => state, resume = async () => {}, waitFor = async () => {}, page = { evaluate: async () => ({ replacements: [{ id: 5000 }] }) };
    const calls = [], log = () => {}, clear = async () => {}, map = async () => {}, safeLabel = () => {}, health = () => {},
      snapshot = async label => { calls.push(label); return state; }, saveProgress = () => calls.push('progress retained'),
      campaignActive = () => 873.6666666666666, currentActive = () => 2712.666666666667;
    ${body('mark', 'readStorage')}
    ${body('completeConversion', 'erosion')}
    await completeConversion();
    assert.equal(milestones.filter(mark => mark.name === 'conversion').length, 1);
    assert.equal(milestones.find(mark => mark.name === 'conversion'), original);
    assert.equal(original.missionActiveSeconds, 704.0833333333333);
    assert.equal(inheritedSermon.currentConversion.runId, 'new');
    assert.equal(inheritedSermon.currentConversion.epoch, 'reload-new');
    assert.equal(ids.replacement, 5000);
    assert.deepEqual(calls, ['m3-current-conversion', 'progress retained']);
    await assert.rejects(completeConversion(), /one fresh conversion/);
  `)
  await execute({ assert })
})

test('inherited conversion proof cannot authorize overwriting the freshly restored sermon', async () => {
  const execute = new AsyncFunction('assert', `
    const inheritedSermon = { priorRunId: 'old' }, savedSermon = { turn: 7424 };
    const milestones = [{ level: 3, name: 'conversion' }];
    ${body('saveCheckpoint', 'returnShamanHome')}
    await saveCheckpoint('attempted-overwrite');
  `)
  await assert.rejects(execute(assert), /until this segment observes its conversion/)
})

test('module guard rejects disabled policy and enabled import remains preparation-only', async () => {
  const policy = JSON.parse(readFileSync(new URL('./run-policy.json', import.meta.url)))
  const guard = source.match(/^const policy = validateRunPolicy\(JSON\.parse\(readFileSync.*$/m)?.[0]
  assert.ok(guard && source.indexOf(guard) < source.indexOf('export default async function'))
  const evaluateGuard = new Function('validateRunPolicy', 'readFileSync',
    guard.replace("new URL('./run-policy.json', import.meta.url)", "'fixture-policy'") + '; return policy;')
  assert.throws(() => evaluateGuard(validateRunPolicy, () => JSON.stringify({ ...policy, launchEnabled: false })), /Source-only checkpoint/)
  assert.equal(evaluateGuard(validateRunPolicy, () => JSON.stringify({ ...policy, launchEnabled: true })).launchEnabled, true)
  if (policy.launchEnabled) {
    const scenario = await import('./scenario.mjs')
    assert.equal(typeof scenario.default, 'function')
    assert.equal(scenario.default.constructor.name, 'AsyncFunction')
    // Import only: the maintained harness/scenario function is never invoked.
  } else await assert.rejects(import('./scenario.mjs'), /Source-only checkpoint/)
})

// This fixture derives the accessible name from the actual JSX text and its
// visible child, instead of teaching a permissive button stub the QA spelling.
const pageSource = readFileSync(new URL('../../app/page.tsx', import.meta.url), 'utf8')
function renderedContinueName(nextMission) {
  const start = pageSource.indexOf("onClick={world.status === 'won' && nextMission ? continueCampaign : restart}")
  assert.ok(start >= 0, 'Locate the actual result control')
  const buttonSource = pageSource.slice(start, pageSource.indexOf('</button>', start))
  assert.doesNotMatch(buttonSource, /aria-(?:label|hidden)/, 'Accessible-name override requires fixture review')
  const content = buttonSource.match(/\? `([^`]+)`\s*: 'Restart Level'}\{' '}\s*<span>([^<]+)<\/span>/)
  assert.ok(content, 'Recognize the shipped result-control text and visible suffix')
  return `${content[1].replace('${nextMission}', String(nextMission))} ${content[2]}`
}
test('actual victory matcher and Continue dispatch match the complete current JSX accessible name', async () => {
  for (const level of [1, 2, 3]) {
    const expected = renderedContinueName(level + 1), calls = []
    assert.notEqual(expected, `Continue to Mission ${level + 1}`, 'Visible icon contributes to the accessible name')
    const prove = new AsyncFunction('deps', `
      const { assert, level, expected, calls, continueControlName } = deps;
      const read = async () => ({ status: 'won' }), health = () => {}, pause = async () => {};
      const page = { evaluate: async () => true, getByRole: (role, options) => {
        assert.equal(role, 'button'); assert.equal(options.exact, true);
        calls.push(options.name); return { isVisible: async () => options.name === expected }; } };
      const pollUI = async check => assert.equal(await check(), true, 'Exact matcher must select the shipped visible text');
      const assertCompleted = async () => {}, mark = async () => {};
      ${body('proveVictory', 'continueMission')}
      await proveVictory();
    `)
    await prove({ assert, level, expected, calls, continueControlName }); assert.deepEqual(calls, [expected])
    if (level === 3) continue
    const dispatch = new AsyncFunction('deps', `
      const { assert, expected, initialLevel, identity, requireContinueBoundary, continueControlName } = deps;
      let level = initialLevel, missionWallStarted = Date.now(), training, victimSelection, sermonPlan, savedSermon;
      const missionWallMs = { 1: 0, 2: 0 }, milestones = [], transitions = [], checkpointProofs = [{ level, loaded: true }], epochs = [];
      const validateMissionMilestones = () => {}, read = async () => ({ status: 'won' });
      const assertCompleted = async () => {}, pause = async () => {}, endEpoch = async () => {};
      const installReplacementObservation = () => {}, replacementIdentity = () => {};
      const page = { evaluate: async fn => fn === installReplacementObservation ? undefined : identity(initialLevel + 1),
        getByRole: (role, options) => { assert.equal(role, 'button'); assert.equal(options.exact, true);
          return { isVisible: async () => options.name === expected, isEnabled: async () => true,
            click: async () => assert.equal(options.name, expected, 'Exact dispatched control must match shipped text') }; } };
      const terminalHandling = false, preserveStopRequested = false, pollUI = async check => assert.equal(await check(), true);
      ${body('button', 'safeLabel')}
      const bindGameWithPreservation = async () => {}, bindObservation = async () => {}, log = () => {}, initializeMission = async () => {};
      ${body('continueMission', 'markRoute')}
      await continueMission(false);
    `)
    await dispatch({ assert, expected, initialLevel: level, identity, requireContinueBoundary, continueControlName })
  }
})
test('actual named-effect routing reaches the retained handler and excludes unrelated effects', async () => {
  const { objectiveProgress } = await import('./observation.mjs')
  const execute = new Function('deps', `const { assert, objectiveProgress } = deps; const conditionMet = () => false;
    ${body('progressFor', 'pauseForPreservation')} return progressFor;`)
  const progress = execute({ assert, objectiveProgress })
  const state = { effects: [{ id: 1, kind: 'bridge', age: 4 }, { id: 2, kind: 'blast', age: 8 }] }
  for (const type of ['effect-present', 'effect-finished']) {
    const condition = { type, kind: 'bridge' }, key = progress(state, condition, 'effect', [])
    assert.equal(key, objectiveProgress(state, condition, 'effect'))
    const unrelated = structuredClone(state); unrelated.effects[1].age++
    unrelated.effects.push({ id: 3, kind: 'lightning', age: 0 })
    Object.assign(unrelated, { turn: 9999, time: 833.25, animationFrame: 9999, units: [{ id: 99, x: 1, z: 2, hp: 1 }] })
    assert.equal(progress(unrelated, condition, 'effect', [2, 3]), key)
    const relevant = structuredClone(state); relevant.effects[0].age++
    assert.notEqual(progress(relevant, condition, 'effect', []), key)
    assert.notEqual(progress({ effects: [] }, condition, 'effect', []), key)
    for (const kind of [undefined, '', '*', 123]) assert.throws(() => progress(state, { type, kind }, 'effect', [1]))
  }
})

test('actual Continue/Save producer binds the exact deliberate error that reaches the terminal harness', async () => {
  const { createHash } = await import('node:crypto'), { resolve } = await import('node:path')
  const sha256 = value => createHash('sha256').update(value).digest('hex')
  for (const failedPrefix of [false, true]) {
    const execute = new AsyncFunction('deps', `
      const { assert, failedPrefix, identity, requireContinueBoundary, continueControlName, resolve, sha256 } = deps;
      let level = 1, missionWallStarted = Date.now(), training, victimSelection, sermonPlan, savedSermon;
      const missionWallMs = { 1: 0, 2: 0 }, milestones = [], transitions = [], checkpointProofs = [{ level: 1, loaded: true }], epochs = [];
      const failures = failedPrefix ? [{ error: 'earlier ordinary input rejected' }] : [], controlStops = [], priorBrowserErrors = [];
      const receipt = { errors: [] }, output = '/test-only-output', archives = [];
      const validateMissionMilestones = () => {}, read = async () => ({ status: 'won' });
      const assertCompleted = async () => {}, pause = async () => {}, endEpoch = async () => {};
      const installReplacementObservation = () => {}, replacementIdentity = () => {};
      const page = { evaluate: async fn => fn === installReplacementObservation ? undefined : identity(2) };
      const button = async () => {}, bindGameWithPreservation = async () => {}, bindObservation = async () => {}, log = () => {}, initializeMission = async () => {};
      const saveCheckpoint = async () => {}, stateRecord = () => ({ failures, controlStops, browserErrors: [] });
      const writeFileSync = (path, bytes, options) => { assert.equal(options.flag, 'wx'); archives.push({ path, bytes }); };
      class CampaignBoundaryClosed extends Error {}
      ${body('continueMission', 'markRoute')}
      let value, error; try { value = await continueMission(true); } catch (caught) { error = caught; }
      return { value, error, archives, receipt };
    `)
    const result = await execute({ assert, failedPrefix, identity, requireContinueBoundary, continueControlName, resolve, sha256 })
    assert.equal(result.archives.length, 1)
    const archived = JSON.parse(result.archives[0].bytes)
    assert.equal(result.receipt.campaignBoundary.path, result.archives[0].path)
    assert.equal(result.receipt.campaignBoundary.sha256, sha256(result.archives[0].bytes))
    assert.equal(archived.terminal.status, failedPrefix ? 'failed' : 'passed')
    if (failedPrefix) {
      assert.ok(result.error); assert.equal(result.value, undefined)
      assert.equal(archived.terminal.failureSha256, sha256(result.error.stack))
      assert.deepEqual(archived.failures, [{ error: 'earlier ordinary input rejected' }])
    } else {
      assert.equal(result.error, undefined); assert.equal(result.value.finished, true)
      assert.equal(archived.terminal.failureSha256, null)
    }
  }
})
