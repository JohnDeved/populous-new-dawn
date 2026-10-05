import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, symlinkSync, linkSync, unlinkSync } from 'node:fs'
import { resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { createHash } from 'node:crypto'
import { readQueuedPreservingStop, pollWithPreservation } from './queued-stop.mjs'
import { IncompleteRun } from './observation.mjs'

const driver = readFileSync(process.env.M3_WAIT_TEST_DRIVER ?? new URL('./driver.mjs', import.meta.url), 'utf8')
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
async function filesystem(fn) {
  const root = mkdtempSync(resolve(tmpdir(), 'm3-queued-stop-'))
  try { return await fn(root) } finally { rmSync(root, { recursive: true, force: true }) }
}

test('only the exact next owned sole stop is exposed; ordinary and later commands stay untouched; malformed inputs fail closed', () => filesystem(root => {
  assert.equal(readQueuedPreservingStop(root, 4, 'current'), null)
  writeFileSync(resolve(root, '0005.json'), '[{"action":"stop-preserve-latest"}]')
  assert.equal(readQueuedPreservingStop(root, 4, 'current'), null, 'Do not skip a missing ordinal')
  const path = resolve(root, '0004.json')
  for (const bytes of ['[{"action":"resume"}]', '{}']) {
    writeFileSync(path, bytes); assert.equal(readQueuedPreservingStop(root, 4, 'current'), null)
    assert.equal(readFileSync(path, 'utf8'), bytes)
  }
  for (const bytes of ['[{"action":', '[{"action":"stop-preserve-latest"},]', '{"action":"stop-preserve-latest"}']) {
    writeFileSync(path, bytes)
    const pending = readQueuedPreservingStop(root, 4, 'current')
    assert.equal(pending.valid, false); assert.equal(pending.preserving, true)
    assert.equal(pending.bytes.toString(), bytes); assert.equal(pending.sha256, sha256(bytes))
  }
  const bytes = '[{"action":"stop-preserve-latest","runId":"current"}]'
  writeFileSync(path, bytes)
  const result = readQueuedPreservingStop(root, 4, 'current')
  assert.equal(result.valid, true); assert.equal(result.runId, 'current'); assert.equal(result.ordinal, 4)
  assert.equal(result.sha256, sha256(bytes)); assert.equal(result.bytes.toString(), bytes)
  for (const commands of [[{ action: 'resume' }, { action: 'stop-preserve-latest' }],
    [{ action: 'stop-preserve-latest', runId: 'other' }], [{ action: 'stop-preserve-latest', arbitrary: 'ignored?' }]]) {
    writeFileSync(path, JSON.stringify(commands)); assert.equal(readQueuedPreservingStop(root, 4, 'current').valid, false)
  }
}))

test('queued control rejects symlink, hardlink, oversized files and invalid current-run boundaries', () => filesystem(root => {
  const source = resolve(root, 'source'), target = resolve(root, '0001.json')
  writeFileSync(source, '[{"action":"stop-preserve-latest"}]'); symlinkSync(source, target)
  assert.throws(() => readQueuedPreservingStop(root, 1, 'current')); unlinkSync(target)
  linkSync(source, target); assert.throws(() => readQueuedPreservingStop(root, 1, 'current')); unlinkSync(target)
  writeFileSync(target, ' '.repeat(65537)); assert.throws(() => readQueuedPreservingStop(root, 1, 'current'))
  for (const [ordinal, runId] of [[0, 'current'], [502, 'current'], [1, '']])
    assert.throws(() => readQueuedPreservingStop(root, ordinal, runId))
}))

test('all bounded host polls check a queued stop before the first predicate and between samples', async () => {
  for (const stopAt of [1, 2, 3]) {
    const calls = [], stop = new IncompleteRun('preserve-latest', 'test stop'); let checks = 0
    await assert.rejects(pollWithPreservation(async () => { calls.push('predicate'); return false }, {
      checkStop: async () => { calls.push('control'); if (++checks === stopAt) throw stop },
      timeout: 100, sleep: async () => calls.push('sleep'), now: () => 0,
    }), error => error === stop)
    assert.equal(calls[0], 'control'); assert.equal(calls.at(-1), 'control')
    assert.equal(calls.filter(value => value === 'predicate').length, stopAt - 1)
  }
  let time = 0
  await assert.rejects(pollWithPreservation(async () => false, { checkStop: async () => {}, timeout: 2,
    label: 'bounded fixture', now: () => time++, sleep: async () => {} }), /Timed out.*bounded fixture/)
})

test('actual active-condition wait services preservation before diagnostics, health, budget or objective', async () => {
  const start = driver.indexOf('  const waitFor ='), end = driver.indexOf('\n  const ', start + 10)
  const execute = new AsyncFunction('deps', `
    const { consumeQueuedStop, read } = deps;
    ${driver.slice(start, end)}
    return waitFor({ type: 'effect-present', kind: 'erosion' });
  `)
  const stop = new IncompleteRun('preserve-latest', 'test stop'), calls = []
  await assert.rejects(execute({ consumeQueuedStop: async () => { calls.push('stop'); throw stop },
    read: async () => { calls.push('ordinary diagnostic'); throw Error('Read before stop') } }), error => error === stop)
  assert.deepEqual(calls, ['stop'])
})

async function actualConsume(root, commands, { defer = false, mutateAfterArchive = false,
  main = false, rawBytes = JSON.stringify(commands), unsafe = false } = {}) {
  const commandsPath = resolve(root, 'commands'), output = resolve(root, 'output')
  mkdirSync(commandsPath); mkdirSync(output)
  const path = resolve(commandsPath, '0004.json')
  if (unsafe) {
    const source = resolve(root, 'unsafe-source'); writeFileSync(source, rawBytes); symlinkSync(source, path)
  } else writeFileSync(path, rawBytes)
  const entryStart = driver.indexOf('      const pending = await consumeQueuedStop({ includeOrdinary: true })')
  const entryEnd = driver.indexOf('      inBatch = true', entryStart)
  assert.ok(entryStart >= 0 && entryEnd > entryStart)
  const entry = main ? driver.slice(entryStart, entryEnd) : 'await consumeQueuedStop({ defer });'

  const start = driver.indexOf('  const consumeQueuedStop ='), end = driver.indexOf('  const pollUI =', start)
  const execute = new AsyncFunction('deps', `
    const { assert, resolve, readQueuedPreservingStop, writeFileSync, commandsPath, output, defer, main, stopPreserveLatest, log } = deps;
    const receipt = { profile: { runId: 'current' } }, inputs = []; let index = main ? 4 : 3, inBatch = !main;
    let preserveStopRequested = false, deferredPreservingStop = false, terminalHandling = false; const saveProgress = () => {};
    ${driver.slice(start, end)}
    let caught; try { ${entry} } catch(error) { caught = error; }
    return { index, inputs, preserveStopRequested, deferredPreservingStop, caught };
  `)
  const calls = [], stop = new IncompleteRun('preserve-latest', 'test stop')
  const result = await execute({ assert, resolve, readQueuedPreservingStop, commandsPath, output, defer, main,
    writeFileSync: (...args) => { writeFileSync(...args); if (mutateAfterArchive) writeFileSync(path, '[{"action":"resume"}]') },
    log: entry => calls.push(entry), stopPreserveLatest: async () => { calls.push('stop'); throw stop } })
  return { result, calls, stop, output }
}

test('actual active-batch stop records bytes/hash/current run and terminates mixed or changed inputs', async () => {
  for (const mode of ['valid', 'mixed', 'wrong-run', 'changed']) await filesystem(async root => {
    const commands = mode === 'mixed' ? [{ action: 'resume' }, { action: 'stop-preserve-latest' }] :
      [{ action: 'stop-preserve-latest', runId: mode === 'wrong-run' ? 'other' : 'current' }]
    const { result, calls, stop, output } = await actualConsume(root, commands, { mutateAfterArchive: mode === 'changed' })
    assert.equal(result.preserveStopRequested, true); assert.equal(result.index, 4)
    assert.equal(result.inputs.length, 1); assert.equal(calls[0].runId, 'current')
    assert.equal(calls[0].interruptedIndex, 3); assert.equal(calls[0].ordinal, 4)
    assert.deepEqual(JSON.parse(readFileSync(resolve(output, 'consumed-0004.json'))), commands)
    if (mode === 'valid') assert.equal(result.caught, stop)
    else { assert.ok(result.caught); assert.ok(!calls.includes('stop')) }
  })
})

test('actual already-present and active-wait controls share authentication and terminal preservation on failure', async () => {
  for (const main of [false, true]) for (const mode of ['valid', 'mixed', 'wrong-run', 'unknown-field', 'malformed', 'unsafe', 'ordinary'])
    await filesystem(async root => {
      const commands = mode === 'mixed' ? [{ action: 'resume' }, { action: 'stop-preserve-latest' }] :
        mode === 'ordinary' ? [{ action: 'resume' }] : [{ action: 'stop-preserve-latest',
          ...(mode === 'wrong-run' ? { runId: 'other' } : {}), ...(mode === 'unknown-field' ? { extra: true } : {}) }]
      const rawBytes = mode === 'malformed' ? '[{"action":"stop-preserve-latest"},]' : JSON.stringify(commands)
      const { result, calls, stop, output } = await actualConsume(root, commands,
        { main, rawBytes, unsafe: mode === 'unsafe' })
      assert.equal(result.preserveStopRequested, mode !== 'ordinary', `${main}:${mode}`)
      if (mode === 'ordinary') {
        assert.equal(result.caught, undefined); assert.ok(!calls.includes('stop'))
        assert.equal(result.inputs.length, main ? 1 : 0, 'Active wait never consumes ordinary input')
      } else {
        assert.ok(result.caught); assert.equal(calls.includes('stop'), mode === 'valid')
        if (mode === 'valid') assert.equal(result.caught, stop)
        if (mode === 'unsafe') {
          assert.equal(result.inputs.length, 0); assert.equal(calls[0].readableInputRecorded, false)
          assert.equal(calls[0].runId, 'current'); assert.equal(calls[0].ordinal, 4)
        } else {
          assert.equal(result.inputs[0].sha256, sha256(rawBytes))
          assert.equal(readFileSync(resolve(output, 'consumed-0004.json'), 'utf8'), rawBytes)
          assert.equal(calls[0].runId, 'current'); assert.equal(calls[0].ordinal, 4)
          assert.equal(calls[0].interruptedIndex, main ? 4 : 3)
        }
      }
    })
})

test('a queued stop during a pending Save is recorded but deferred until actual committed identity is known', async () => {
  await filesystem(async root => {
    const { result, calls } = await actualConsume(root, [{ action: 'stop-preserve-latest' }], { defer: true })
    assert.equal(result.preserveStopRequested, true); assert.equal(result.deferredPreservingStop, true)
    assert.equal(result.caught, undefined); assert.ok(!calls.includes('stop'))
    assert.equal(calls[0].deferredForCommittedReadback, true)
  })
})

test('active command-error handler cannot swallow an invalid preserving request and dispatch another action', async () => {
  const start = driver.indexOf('      } catch (error) {\n        if (preserveStopRequested)'),
    end = driver.indexOf('        if (error instanceof SermonCaptured)', start)
  const body = start < 0 ? '' : driver.slice(start + '      } catch (error) {\n'.length, end)
  const execute = new AsyncFunction('preserveStopRequested', 'error', body)
  const failure = Error('Mixed preserving input')
  await assert.rejects(execute(true, failure), error => error === failure)
})

test('actual Save readback commits protectedLatest before servicing its deferred preserving stop', async () => {
  const start = driver.indexOf('  const saveCheckpoint ='), end = driver.indexOf('  // This digest comes', start)
  const execute = new AsyncFunction('deps', `
    const { assert, saved, committed, observed, calls, stop } = deps;
    let protectedLatest = { checkpoint: { turn: 4813 } }, deferredPreservingStop = false, savedSermon;
    const receipt = { profile: { runId: 'current' } }, ids = {}, page = { getByRole: () => ({ click: async () => calls.push('unexpected Continue') }) };
    const pause = async () => calls.push('Pause'), snapshot = async () => saved;
    const button = async name => calls.push(name), readStorage = async () => { calls.push('committed read'); return committed };
    const observeCheckpoint = async () => { calls.push('full digest'); return observed }, log = () => {};
    const consumeQueuedStop = async ({ defer = false } = {}) => { assert.equal(defer, true); deferredPreservingStop = true; calls.push('stop noticed during readback') };
    const waitForCheckpointReadback = async check => check();
    const stopPreserveLatest = async () => { assert.deepEqual(protectedLatest, observed); calls.push('preserve actual new latest'); throw stop };
    ${driver.slice(start, end)}
    await saveCheckpoint('fixture');
  `)
  const saved = { turn: 6000, time: 500 }, committed = { world: { outcome: { level: 3 }, turn: 6000 } },
    observed = { checkpoint: { level: 3, turn: 6000, time: 500, checkpointSha256: 'real-readback' } },
    calls = [], stop = new IncompleteRun('preserve-latest', 'test stop')
  await assert.rejects(execute({ assert, saved, committed, observed, calls, stop }), error => error === stop)
  assert.deepEqual(calls, ['Pause', 'Game settings', 'Save checkpoint', 'stop noticed during readback',
    'committed read', 'committed read', 'full digest', 'preserve actual new latest'])
})

test('actual flyby, camera, dispatch and victory polling route through preserving control before browser predicates', async () => {
  const cases = [
    ['  const skipFlyby =', '  const clear =', 'await skipFlyby()', { inputMask: 1 }],
    ['  const map =', '  const rotate =', 'await map({ x: 0, z: 0 })', { mode: null }],
    ['  const clickOrder =', '  const groundHit =', 'await clickOrder({})', { turn: 1, lastOrderTurn: 1, selected: [] }],
    ['  const proveVictory =', '  let training =', 'await proveVictory()', { status: 'won' }],
  ]
  for (const [startText, endText, call, value] of cases) {
    const start = driver.indexOf(startText), end = driver.indexOf(endText, start)
    assert.ok(start >= 0 && end > start, startText)
    const stop = new IncompleteRun('preserve-latest', 'test stop'), calls = []
    const execute = new AsyncFunction('deps', `
      const { assert, value, stop, calls, pollWithPreservation } = deps;
      const read = async () => value, health = () => {}, requireOrderable = () => {}, requireDeclaredPreacherOrder = () => {};
      const capturePendingSermon = async () => {}, sermonPlan = {}, log = () => {};
      const page = { getByRole: () => ({ isVisible: async () => false }), evaluate: async () => { calls.push('unexpected predicate'); return false } };
      const pollUI = (check, timeout, label) => pollWithPreservation(check, { timeout, label,
        checkStop: async () => { calls.push('stop'); throw stop } });
      ${driver.slice(start, end)}
      ${call};
    `)
    await assert.rejects(execute({ assert, value, stop, calls, pollWithPreservation }), error => error === stop, startText)
    assert.deepEqual(calls, ['stop'])
  }
})


test('preserving Pause can run before diagnostic binding and never invents missing UI state', async () => {
  const start = driver.indexOf('  const pauseForPreservation ='), end = driver.indexOf('  const stopPreserveLatest =', start)
  const execute = new AsyncFunction('page', 'button', 'log', `${driver.slice(start, end)}; await pauseForPreservation();`)
  for (const visible of [true, false]) {
    const calls = []
    await execute({ getByRole: () => ({ isVisible: async () => visible }) }, async (...args) => calls.push(args), entry => calls.push(entry))
    assert.equal(calls.length, visible ? 2 : 1)
    assert.equal(calls.at(-1).visible, visible); assert.equal(calls.at(-1).clicked, visible)
    if (visible) assert.deepEqual(calls[0], ['Pause game', { timeout: 5000 }])
  }
})
