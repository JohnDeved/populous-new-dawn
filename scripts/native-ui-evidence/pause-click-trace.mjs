import assert from 'node:assert/strict'
import { existsSync, lstatSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

export const pauseTraceLimits = Object.freeze({ bytes: 8 * 1024 * 1024,
  receiptReserve: 64 * 1024, files: 128, directories: 16, stopMs: 1000 })
const modes = Object.freeze({ 'pause-checkpoint-native': 'native', 'pause-checkpoint-fallback': 'fallback' })
const rootName = 'pause-click-traces'
const message = error => { try { return String(error).slice(0, 256) } catch { return 'Unprintable trace failure' } }

export function assertPauseTraceVersions(versions) {
  assert.deepEqual(versions, { '@playwright/test': '1.63.0', 'playwright-core': '1.63.0' },
    'Pause trace storage/lifecycle requires its reviewed Playwright version')
}

export function acceptPauseTraceInventory({ bytes, allocatedBytes, files, directories }) {
  assert.ok([bytes, allocatedBytes, files, directories].every(n => Number.isSafeInteger(n) && n >= 0))
  assert.ok(Math.max(bytes, allocatedBytes) + pauseTraceLimits.receiptReserve <= pauseTraceLimits.bytes,
    'Pause trace sampled byte threshold exceeded (including receipt reserve)')
  assert.ok(files <= pauseTraceLimits.files && directories <= pauseTraceLimits.directories, 'Pause trace entry threshold exceeded')
}

// Called by the existing parent inventory sampler, as well as at trace boundaries.
// This observes disk bytes, not buffered memory, and is not a kernel quota.
export function inspectPauseTraceStorage(output) {
  const root = resolve(output, rootName)
  try { lstatSync(root) } catch (error) { if (error.code === 'ENOENT') return null; throw error }
  const totals = { bytes: 0, allocatedBytes: 0, files: 0, directories: 0 }
  function walk(path) {
    const stat = lstatSync(path)
    assert.equal(stat.isSymbolicLink(), false, 'Pause trace must not contain symlinks')
    assert.ok(Number.isSafeInteger(stat.blocks) && stat.blocks >= 0, 'Pause trace allocation must be observable')
    totals.allocatedBytes += stat.blocks * 512
    if (stat.isDirectory()) {
      totals.directories++
      acceptPauseTraceInventory(totals)
      for (const name of readdirSync(path)) walk(resolve(path, name))
    } else {
      assert.ok(stat.isFile() && stat.nlink === 1, 'Pause trace must contain private regular files only')
      totals.files++; totals.bytes += stat.size
    }
    acceptPauseTraceInventory(totals)
  }
  walk(root)
  return totals
}

export function createPauseTraceStorage(output) {
  const root = resolve(output, rootName), work = resolve(root, 'work'), archives = resolve(root, 'archives')
  assert.ok(lstatSync(output).isDirectory() && !lstatSync(output).isSymbolicLink())
  mkdirSync(root, { mode: 0o700 }) // Exclusive reservation: never adopt or erase another output.
  mkdirSync(work, { mode: 0o700 }); mkdirSync(archives, { mode: 0o700 })
  inspectPauseTraceStorage(output)
  return Object.freeze({ output: resolve(output), root, work, archives })
}

// Public Playwright tracing only. The launch-level tracesDir must be storage.work;
// it owns both server files and client stacks. No app calls/inputs are replaced.
export function createPauseTraceOwner(storage, {
  now = () => performance.now(), setTimer = setTimeout, clearTimer = clearTimeout,
} = {}) {
  assert.equal(storage.root, resolve(storage.output, rootName))
  assert.equal(storage.work, resolve(storage.root, 'work'))
  assert.equal(storage.archives, resolve(storage.root, 'archives'))
  assert.ok(inspectPauseTraceStorage(storage.output))
  const records = {}, claimed = new Set()
  let finalized = false
  const report = { version: 'pause-click-trace-v1', limits: pauseTraceLimits,
    sampling: 'existing one-second parent inventory; overshoot possible; no RSS or descendant-reaping guarantee', records }
  function fail(state, stage, error) {
    state.failure ??= Object.freeze({ stage, message: message(error), observedMs: now() })
    state.status = 'failed'
  }
  function save(state, suffix) {
    try {
      inspectPauseTraceStorage(storage.output)
      const raw = JSON.stringify(state, null, 2) + '\n'
      assert.ok(Buffer.byteLength(raw) <= 4096, 'Pause trace receipt must stay bounded')
      writeFileSync(resolve(storage.root, `${state.mode}-${suffix}.json`), raw, { flag: 'wx', mode: 0o600 })
      inspectPauseTraceStorage(storage.output)
    } catch (error) { fail(state, 'receipt', error) }
  }
  async function observeStop(state, work, abandon) {
    const started = now()
    return new Promise(resolve => {
      let done = false, timer, assigned = false
      const clear = () => { try { clearTimer(timer) } catch (error) { fail(state, 'timer-clear', error) } }
      const finish = (status, error) => {
        if (done) return
        done = true
        abandon()
        if (assigned) clear()
        if (now() - started >= pauseTraceLimits.stopMs) status = 'timed-out'
        if (status !== 'fulfilled') fail(state, 'stop', error ?? new Error('Pause trace stop observation deadline exceeded'))
        resolve(status)
      }
      // Sinks are installed before timer setup, including a synchronous timer failure.
      work.then(() => finish('fulfilled'), error => finish('rejected', error))
      try {
        timer = setTimer(() => finish('timed-out'), pauseTraceLimits.stopMs)
        assigned = true
        if (done) clear()
      } catch (error) { finish('timer', error) }
    })
  }
  return { report,
    async attach(context, episode) {
      const mode = modes[episode?.id]
      if (!mode) return
      assert.equal(episode.pauseMode, mode, 'Pause trace episode identity mismatch')
      assert.equal(finalized, false); assert.equal(claimed.has(mode), false, 'Only one trace context per pause mode')
      claimed.add(mode)
      const state = records[mode] = { mode, episode: episode.id, status: 'starting', start: 'pending',
        stop: 'not-started', context: 'open', failure: null, archive: `archives/${mode}.zip` }
      const originalClose = context.close.bind(context)
      const start = context.tracing.start.bind(context.tracing), stop = context.tracing.stop.bind(context.tracing)
      const path = resolve(storage.archives, `${mode}.zip`)
      assert.equal(existsSync(path), false, 'Fresh trace archive required')
      let closePromise, abandonStop = false, closeStarted = false
      context.on('close', () => {
        state.context = 'closed'
        if (!closeStarted) fail(state, 'context', new Error('Context closed before owned trace stop'))
      })
      // Assign the wrapper before starting; even a partially failed start has an owner.
      context.close = (...args) => {
        if (closePromise) return closePromise
        closePromise = Promise.resolve().then(async () => {
          closeStarted = true
          state.stop = 'pending'; save(state, 'stop-intent')
          const stopping = startPromise.catch(() => {}).then(async () => {
            if (abandonStop || state.context === 'closed') throw new Error('Trace stop not admitted after context closure')
            inspectPauseTraceStorage(storage.output)
            await stop({ path })
            const file = lstatSync(path)
            assert.ok(file.isFile() && !file.isSymbolicLink() && file.nlink === 1 && file.size > 0, 'Trace archive missing or unsafe')
            inspectPauseTraceStorage(storage.output)
          })
          state.stop = await observeStop(state, stopping, () => { abandonStop = true })
          abandonStop = true // A late start must not begin a new stop after the grace.
          save(state, 'stop-result')
          try {
            // A trace error is metadata, never a replacement for genuine close/primary errors.
            const result = await originalClose(...args)
            state.context = 'closed'
            if (!state.failure && state.start === 'fulfilled' && state.stop === 'fulfilled') state.status = 'completed'
            return result
          } catch (error) { state.context = 'close-failed'; fail(state, 'context-close', error); throw error }
          finally { save(state, 'closed') }
        })
        closePromise.catch(() => {})
        return closePromise
      }
      save(state, 'start-intent')
      const startPromise = Promise.resolve().then(async () => {
        if (closeStarted || finalized) throw new Error('Trace start not admitted after cleanup')
        inspectPauseTraceStorage(storage.output)
        await start({ name: `pause-${mode}`, snapshots: false, screenshots: false, sources: false, live: false })
        state.start = 'fulfilled'
        if (!state.failure) state.status = 'recording'
        inspectPauseTraceStorage(storage.output)
      }).catch(error => { state.start = 'rejected'; fail(state, 'start', error); throw error })
      startPromise.catch(() => {})
      await startPromise
      if (state.failure) throw new Error(`Pause trace start failed: ${state.failure.message}`)
    },
    assertEpisode(episode) {
      const mode = modes[episode?.id]
      if (!mode) return
      const state = records[mode]
      assert.ok(state && state.status === 'completed' && state.context === 'closed' && !state.failure,
        'Pause trace did not complete before context close')
      inspectPauseTraceStorage(storage.output)
    },
    finish() {
      assert.equal(finalized, false); finalized = true
      const failures = Object.values(records).filter(state => state.status !== 'completed' || state.failure)
      const raw = JSON.stringify(report, null, 2) + '\n'
      assert.ok(Buffer.byteLength(raw) <= 16384, 'Pause trace final receipt must stay bounded')
      inspectPauseTraceStorage(storage.output)
      writeFileSync(resolve(storage.root, 'final.json'), raw, { flag: 'wx', mode: 0o600 })
      inspectPauseTraceStorage(storage.output)
      assert.equal(failures.length, 0, 'Pause trace evidence incomplete; retained working files are not acceptance')
    },
  }
}
