import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { IncompleteRun, requireDeclaredPreacherOrder } from './observation.mjs'
import { requirePreservedCheckpoint } from './sermon-checkpoint.mjs'

const driver = readFileSync(new URL('./driver.mjs', import.meta.url), 'utf8')
const block = (start, end) => driver.slice(driver.indexOf(start), driver.indexOf(end))
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
const sha256 = value => createHash('sha256').update(value).digest('hex')

test('the actual saved-sermon entry admits a subsequent Preacher cancellation order without rearming', async () => {
  const source = { fingerprint: 'b'.repeat(64) }, profile = { runId: 'new-run', previousRun: { runId: 'saved-run' } }
  const record = { kind: 'mission3-ui-sermon', gameplayContinuation: { history: { activeSeconds: 0, failures: [], controlStops: [] } }, source, savedByRunId: 'saved-run', activeSeconds: 401, checkpoint: { turn: 4813, time: 401 },
    ids: { preacher: 3163, victim: 50 }, retainedBlueIds: [3163], epoch: 'original-entry',
    declaration: { preacherId: 3163, armedAtTurn: 4101, candidateIds: [50] },
    firstOwned: { victim: { id: 50 } }, milestones: [{ name: 'sermon-saved' }], failures: [{ error: 'retained' }] }
  const bytes = Buffer.from(JSON.stringify(record)), calls = [], loaded = { turn: 4830, observation: { name: 'saved-sermon-entry' } }
  const execute = new AsyncFunction('deps', `
    const { assert, resolve, readFileSync, writeFileSync, sha256, validateSermonRecord,
      validateLoadedSermon, observeCheckpoint, button, bindGame, bindObservation, read,
      health, readStorage, pause, snapshot, log, saveProgress, source, profile } = deps;
    const root = '/owned', output = '/owned/output', url = 'http://127.0.0.1:4366', page = {};
    const receipt = { source, profile }, inputs = [], ids = {}, milestones = [], failures = [], controlStops = [];
    let continuation, sermonRecord, protectedLatest, inheritedActiveSeconds, victimSelection, sermonPlan, savedSermon;
    ${block('  const loadSavedSermon =', '  const stopPreserveLatest =')}
    await loadSavedSermon('/owned/work/orchestration/mission-three-controls/prior/sermon-record.json');
    return { sermonPlan, savedSermon, victimSelection, milestones, failures, protectedLatest, inheritedActiveSeconds, controlStops };
  `)
  const result = await execute({ assert, resolve, sha256, source, profile,
    readFileSync: () => bytes, writeFileSync: () => calls.push('write-provenance'),
    validateSermonRecord: value => value, validateLoadedSermon: (_, state, options) => {
      assert.deepEqual(options, { pausedByEntryControl: true }); calls.push('validate-loaded')
    },
    observeCheckpoint: async () => ({ checkpoint: record.checkpoint }),
    button: async name => calls.push(name), bindGame: async () => calls.push('bind-game'),
    bindObservation: async name => calls.push(`epoch:${name}`), read: async () => { calls.push('full-read'); return loaded },
    health: () => {}, readStorage: async () => ({ completed: [] }), pause: async () => calls.push('Pause'),
    snapshot: async () => {}, log: () => {}, saveProgress: () => {} })
  requireDeclaredPreacherOrder({ selected: [3163], units: [{ id: 3163, team: 'blue', kind: 'preacher' }] }, !!result.sermonPlan)
  assert.deepEqual(result.sermonPlan.declaration, record.declaration)
  assert.equal(result.sermonPlan.epoch, 'original-entry', 'Inherited declaration keeps its original epoch label')
  assert.deepEqual(result.sermonPlan.inheritedFromSavedSermon.source, source)
  assert.ok(result.failures[0].inheritedFromSavedSermon)
  assert.equal(result.inheritedActiveSeconds, 401, 'Unvalidated history on an ordinary record cannot reset time')
  assert.equal(result.failures.length, 1, 'Unvalidated history on an ordinary record cannot erase failures')
  assert.deepEqual(calls.filter(c => c.startsWith('epoch:')), ['epoch:saved-sermon-entry'])
  assert.deepEqual(calls.filter(c => ['Load Game', 'Pause game', 'bind-game', 'full-read', 'validate-loaded'].includes(c)),
    ['Load Game', 'Pause game', 'bind-game', 'full-read', 'validate-loaded'])
  assert.ok(calls.indexOf('Pause game') < calls.indexOf('epoch:saved-sermon-entry'), 'No observer import precedes the first ordinary Pause')
  assert.ok(!calls.includes('Pause'), 'Entry does not run the full-read pause helper before its first Pause')
  assert.ok(!calls.includes('Save checkpoint'))
})

test('the actual preserve-latest action pauses and observes the saved digest before an incomplete stop, without Save', async () => {
  const checkpoint = { turn: 4813, checkpointSha256: 'a'.repeat(64) }, calls = []
  const execute = new AsyncFunction('deps', `
    const { assert, IncompleteRun, requirePreservedCheckpoint, pause, observeCheckpoint, log, protectedLatest, withholdSermonRecord } = deps;
    ${block('  const stopPreserveLatest =', '  const proveVictory =')}
    return stopPreserveLatest();
  `)
  await assert.rejects(execute({ assert, IncompleteRun, requirePreservedCheckpoint,
    pause: async () => calls.push('Pause'), observeCheckpoint: async () => { calls.push('Read latest'); return { checkpoint } },
    log: () => calls.push('Record stop'), protectedLatest: { checkpoint } }), error => error.code === 'preserve-latest')
  assert.deepEqual(calls, ['Pause', 'Read latest', 'Record stop'])
})

test('the actual batch boundary gives a preserving stop priority over a pending first onset', async () => {
  const start = driver.indexOf('          const beforeCommand ='),
    end = driver.indexOf('          assert.equal(sha256(readFileSync(path))', start)
  const execute = new AsyncFunction('deps', `
    const { read, health, command, capturePendingSermon, dispatch } = deps;
    ${driver.slice(start, end)}
  `)
  const calls = []
  await execute({ read: async () => ({ observation: { sermon: { firstOwned: { victim: { id: 50 } } } } }),
    health: () => {}, command: { action: 'stop-preserve-latest' },
    capturePendingSermon: async () => { calls.push('unexpected Save'); throw Error('automatic capture ran') },
    dispatch: async command => calls.push(command.action) })
  assert.deepEqual(calls, ['stop-preserve-latest'])
})

test('a preserving stop dispatches before any ordinary read, health or budget processing', async () => {
  const start = driver.indexOf('        const commands = JSON.parse(bytes)'),
    end = driver.indexOf('        for (const command of commands)', start)
  const execute = new AsyncFunction('deps', `
    const { assert, bytes, stopPreserveLatest } = deps;
    let preserveStopRequested = false;
    ${driver.slice(start, end)}
    throw Error('Ordinary diagnostic/budget path reached');
  `)
  const stop = new IncompleteRun('preserve-latest', 'preserved')
  await assert.rejects(execute({ assert, bytes: JSON.stringify([{ action: 'stop-preserve-latest' }]),
    stopPreserveLatest: async () => { throw stop } }), error => error === stop)
  await assert.rejects(execute({ assert, bytes: JSON.stringify([{ action: 'resume' }, { action: 'stop-preserve-latest' }]),
    stopPreserveLatest: async () => { throw stop } }), /sole command/)
})

test('the actual terminal preservation branch never invokes Save on unknown checkpoint or readback failure', async () => {
  const start = driver.indexOf('      if (protectedLatest || preserveStopRequested || reusedProfile)'),
    end = driver.indexOf(' else if (protectedPreparation && !savedSermon)', start)
  const execute = new AsyncFunction('deps', `
    const { protectedLatest, preserveStopRequested, pause, snapshot, observeCheckpoint, log, withholdSermonRecord } = deps;
    let preserveVerificationFailed = false; const reusedProfile = false;
    ${driver.slice(start, end)}
  `)
  for (const protectedLatest of [null, { checkpoint: { turn: 4813 } }]) {
    const calls = []
    await execute({ protectedLatest, preserveStopRequested: true, pause: async () => calls.push('Pause'),
      snapshot: async () => calls.push('Snapshot'), observeCheckpoint: async () => { throw Error('readback failure') },
      withholdSermonRecord: reason => calls.push({ withheld: String(reason) }), log: entry => calls.push(entry) })
    assert.deepEqual(calls.slice(0, 2), ['Pause', 'Snapshot'])
    assert.equal(calls[2].withheld, 'Error: readback failure')
    assert.equal(calls[3].readError, 'Error: readback failure')
    assert.equal(calls[3].matches, false)
  }
  const finishingStart = driver.indexOf('        let finishing = false'),
    finishingEnd = driver.indexOf('\n      }\n      requireNotDefeated', finishingStart)
  const terminal = new AsyncFunction('bytes', 'error', driver.slice(finishingStart, finishingEnd))
  const failure = Error('digest mismatch')
  await assert.rejects(terminal(JSON.stringify([{ action: 'stop-preserve-latest' }]), failure), error => error === failure)
})

test('failed preserving-stop validation withholds its sermon record and never reaches an ordinary action', async () => {
  const execute = new AsyncFunction('deps', `
    const { assert, IncompleteRun, requirePreservedCheckpoint, pause, observeCheckpoint, log,
      protectedLatest, withholdSermonRecord } = deps;
    ${block('  const stopPreserveLatest =', '  const proveVictory =')}
    return stopPreserveLatest();
  `)
  for (const mode of ['missing', 'mismatch', 'read-error']) {
    const calls = [], expected = { turn: 4813, checkpointSha256: 'a'.repeat(64) }
    await assert.rejects(execute({ assert, IncompleteRun, requirePreservedCheckpoint,
      protectedLatest: mode === 'missing' ? null : { checkpoint: expected },
      pause: async () => calls.push('Pause'), log: () => calls.push('unexpected verified stop'),
      observeCheckpoint: async () => { if (mode === 'read-error') throw Error('readback failed');
        return { checkpoint: { ...expected, turn: 4893 } } },
      withholdSermonRecord: error => calls.push({ withheld: String(error) }) }))
    assert.ok(calls.at(-1).withheld)
    assert.ok(!calls.includes('unexpected verified stop'))
  }
})

test('the actual withholding path removes the forwardable filename and retains the first failure reason', async () => {
  const files = new Map(), initial = { kind: 'mission3-ui-sermon', source: { fingerprint: 'unchanged' } }
  const execute = new AsyncFunction('deps', `
    const { resolve, writeFileSync, renameSync, log, saveProgress, initial } = deps;
    const output = '/owned/output'; let sermonRecord = initial, preserveVerificationFailed = false;
    ${block('  const withholdSermonRecord =', '  const stopPreserveLatest =')}
    withholdSermonRecord('first readback failed');
    withholdSermonRecord('later readback failed');
    return { sermonRecord, preserveVerificationFailed };
  `)
  const result = await execute({ resolve, initial,
    writeFileSync: (path, bytes) => files.set(path, bytes),
    renameSync: (from, to) => { files.set(to, files.get(from)); files.delete(from) }, log: () => {}, saveProgress: () => {} })
  assert.equal(files.has('/owned/output/sermon-record.json'), false)
  const withheld = JSON.parse(files.get('/owned/output/sermon-record-withheld.json'))
  assert.equal(withheld.continuationBlockedReason, 'first readback failed')
  assert.deepEqual(withheld.source, initial.source)
  assert.equal(result.preserveVerificationFailed, true)
})

test('first-good then final-failed preservation ends failed and withholds the forwarded record', async () => {
  const start = driver.indexOf('      if (protectedLatest || preserveStopRequested || reusedProfile)'),
    end = driver.indexOf(' else if (protectedPreparation && !savedSermon)', start)
  const status = driver.match(/    const terminalStatus = .*/)[0]
  const execute = new AsyncFunction('deps', `
    const { resolve, writeFileSync, renameSync, pause, snapshot, log, saveProgress } = deps;
    const output = '/owned/output', protectedLatest = { checkpoint: { turn: 4813 } };
    const preserveStopRequested = true, incomplete = true, failures = [], reusedProfile = false;
    let preserveVerificationFailed = false, sermonRecord = { source: { fingerprint: 'original' } };
    ${block('  const withholdSermonRecord =', '  const stopPreserveLatest =')}
    // The first explicit read matched; only the final preservation read fails.
    const observeCheckpoint = async () => { throw Error('final read failed') };
    ${driver.slice(start, end)}
    ${status}
    return { terminalStatus, preserveVerificationFailed, sermonRecord };
  `)
  const files = new Map()
  const result = await execute({ resolve, writeFileSync: (path, bytes) => files.set(path, bytes),
    renameSync: (from, to) => { files.set(to, files.get(from)); files.delete(from) },
    pause: async () => {}, snapshot: async () => {}, log: () => {}, saveProgress: () => {} })
  assert.equal(result.terminalStatus, 'failed')
  assert.equal(result.preserveVerificationFailed, true)
  assert.equal(files.has('/owned/output/sermon-record.json'), false)
  assert.match(result.sermonRecord.continuationBlockedReason, /final read failed/)
})

test('reused-entry record failures preserve the harness checkpoint before admission and never fall back to Save', async () => {
  const preserveStart = driver.indexOf('      if (protectedLatest || preserveStopRequested || reusedProfile)'),
    preserveEnd = driver.indexOf('\n    }\n    const terminalStatus =', preserveStart)
  for (const kind of ['sermon', 'preparation']) for (const mode of ['missing', 'invalid-json', 'read-failure', 'rejected-record'])
    for (const checkpointKnown of [true, false]) {
    const checkpoint = { turn: 4813, checkpointSha256: 'a'.repeat(64) }, calls = [], writes = []
    const definition = kind === 'sermon' ? block('  const loadSavedSermon =', '  const withholdSermonRecord =') :
      block('  const loadPreparation =', '  const reloadSermon =')
    const execute = new AsyncFunction('deps', `
      const { assert, resolve, sha256, readFileSync, writeFileSync, observeCheckpoint, observePreparationStorage,
        validateSermonRecord, validatePreparationRecord, pause, snapshot, log, saveCheckpoint, withholdSermonRecord, profile } = deps;
      const root = '/owned', output = '/owned/output', url = 'http://127.0.0.1:4366', page = {};
      const receipt = { profile, source: { fingerprint: 'current' } }, inputs = [], ids = {}, milestones = [];
      let savedSermon = null;
      ${block('  const reusedProfile =', '  mkdirSync(commandsPath')}
      ${definition}
      try { await ${kind === 'sermon' ? 'loadSavedSermon' : 'loadPreparation'}('/owned/work/orchestration/mission-three-controls/prior/${kind}-record.json'); }
      catch (error) {
        ${driver.slice(preserveStart, preserveEnd)}
        return { error: String(error), continuation, sermonRecord, protectedLatest };
      }
      throw Error('Admission unexpectedly succeeded');
    `)
    const profile = { id: 'owned', runId: 'new-run', mode: 'reused', checkpointAtStart: checkpointKnown ? checkpoint : null }
    const observe = async label => {
      calls.push(label)
      if (mode === 'read-failure' && label.includes('before')) throw Error('entry read failed')
      return { checkpoint }
    }
    const result = await execute({ assert, resolve, sha256, profile,
      readFileSync: () => { if (mode === 'missing') throw Error('missing file');
        return Buffer.from(mode === 'invalid-json' ? '{bad' : '{}') },
      writeFileSync: path => writes.push(path), observeCheckpoint: observe,
      observePreparationStorage: async label => ({ observed: await observe(label), checkpoint }),
      validateSermonRecord: () => { throw Error('rejected record') },
      validatePreparationRecord: () => { throw Error('rejected record') },
      pause: async () => calls.push('Pause'), snapshot: async () => {}, log: () => {},
      withholdSermonRecord: () => {}, saveCheckpoint: async () => calls.push('FORBIDDEN Save') })
    assert.ok(result.error); assert.equal(result.continuation, null); assert.equal(result.sermonRecord, null)
    assert.deepEqual(result.protectedLatest?.checkpoint ?? null, checkpointKnown ? checkpoint : null)
    assert.ok(calls.includes('m3-latest-retained-on-stop'))
    assert.ok(!calls.includes('FORBIDDEN Save'))
    assert.ok(!writes.includes('/owned/output/sermon-record.json'))
    assert.ok(!writes.includes('/owned/output/preparation-record.json'))
  }
})


test('the actual successor driver consumes only the harness-validated cumulative history', async () => {
  const start = driver.indexOf('    const priorHistory ='), end = driver.indexOf('    victimSelection = sermonRecord.firstOwned', start)
  const execute = new AsyncFunction('sermonRecord', 'receipt', `
    const ids = {}, milestones = [], failures = [], controlStops = []; let inheritedActiveSeconds;
    ${driver.slice(start, end)}
    return { inheritedActiveSeconds, failures, controlStops };
  `)
  const history = { activeSeconds: 418.08333333333337, failures: [{ index: 29 }, { index: 48 }, { index: 1 }],
    controlStops: [{ code: 'preserve-latest' }] }
  const record = { kind: 'mission3-recovered-sermon-successor', activeSeconds: 407.75, ids: {}, milestones: [], failures: [],
    gameplayContinuation: { history: { activeSeconds: 0, failures: [], controlStops: [] } } }
  const result = await execute(record, { profile: { gameplayContinuation: { history } } })
  assert.equal(result.inheritedActiveSeconds, history.activeSeconds); assert.equal(result.failures.length, 3)
  assert.equal(result.controlStops[0].code, 'preserve-latest')
  assert.equal(result.controlStops[0].inheritedFromPriorGameplay, true)
})
