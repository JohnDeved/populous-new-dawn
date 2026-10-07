import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import { waitForCheckpointReadback } from '../scripts/checkpoint-readback.mjs'

const checker = readFileSync(new URL('../scripts/check-browser-mission4-natural-victory.mjs', import.meta.url), 'utf8')
const helperStart = checker.indexOf('async function waitForStoredMissionFour(page) {')
const helperEnd = checker.indexOf('\nlet browser', helperStart)
const callStart = checker.indexOf('  await waitForStoredMissionFour(page)')
const callEnd = checker.indexOf('\n  assert.deepEqual(errors, [])', callStart)
assert.ok(helperStart >= 0 && helperEnd > helperStart, 'Extract the maintained profile readback helper')
assert.ok(callStart > helperEnd && callEnd > callStart, 'Extract the maintained readback/continuation/reload callsite')
const source = `${checker.slice(helperStart, helperEnd)}\n${checker.slice(callStart, callEnd)}`
const completed = { version: 1, completed: [4] }

function fixture(values, { openError, readError, missingStore = false, poll = waitForCheckpointReadback } = {}) {
  const events = []
  let reads = 0, opens = 0, closes = 0, openDatabases = 0, pending = false, continuations = 0
  const request = (value, error, onSuccess = () => {}) => {
    const result = { result: value, error }
    setImmediate(() => {
      if (error) result.onerror()
      else {
        onSuccess()
        result.onsuccess()
      }
    })
    return result
  }
  const database = {
    objectStoreNames: {
      contains(name) {
        assert.equal(name, 'checkpoints')
        return !missingStore
      },
    },
    transaction(name, mode) {
      assert.equal(name, 'checkpoints')
      assert.equal(mode, 'readonly')
      if (readError) throw readError
      return {
        objectStore(name) {
          assert.equal(name, 'checkpoints')
          return {
            get(key) {
              assert.equal(key, 'profile')
              const value = values[Math.min(reads++, values.length - 1)]
              events.push('read')
              return value instanceof Error ? request(undefined, value) : request(value)
            },
          }
        },
      }
    },
    close() {
      assert.equal(openDatabases, 1, 'Each opened database closes exactly once')
      openDatabases--
      closes++
      events.push('close')
    },
  }
  const world = { outcome: { cameraPlaying: false, level: 4 } }
  const page = {
    async evaluate(read) {
      assert.equal(pending, false, 'Storage reads must not overlap')
      pending = true
      try {
        return await read()
      } finally {
        pending = false
      }
    },
    async waitForFunction(predicate) {
      // Installed Playwright 1.63 tests truthiness before Promise adoption.
      // The old async storage predicate stops polling even when it resolves false.
      const success = predicate()
      assert.ok(success)
      return { value: await success }
    },
    async waitForTimeout(milliseconds) {
      assert.equal(milliseconds, 100)
      assert.equal(pending, false, 'Wait for the current read before pausing')
      assert.equal(openDatabases, 0, 'Close the current database before pausing')
      events.push('pause')
    },
    getByRole(role, options) {
      assert.equal(role, 'button')
      if (options.name === 'Continue to Mission 5') {
        assert.equal(options.exact, false)
        return {
          async waitFor() { events.push('continue-ready') },
          async click() { world.outcome.level = 5; events.push('continue-click') },
        }
      }
      assert.equal(options.name, 'Mission 4, completed')
      assert.equal(options.exact, true)
      return { async waitFor() { events.push('completed-after-reload') } }
    },
    async reload(options) {
      assert.equal(options.waitUntil, 'networkidle')
      events.push('reload')
    },
  }
  const sandbox = {
    assert,
    page,
    window: { testStore: { getWorld: () => world }, testSceneRef: { current: { world } } },
    indexedDB: {
      open(name, version) {
        assert.equal(name, 'populous-new-dawn')
        assert.equal(version, 1)
        assert.equal(openDatabases, 0, 'Close the prior database before another read')
        opens++
        return request(database, openError, () => { openDatabases++ })
      },
    },
    waitForCheckpointReadback: poll,
    async releaseRaf() { continuations++; events.push('release-raf') },
    async showAllMissions() { events.push('show-all-missions') },
    record(name) { events.push(`record:${name}`) },
  }
  const run = () => vm.runInNewContext(`(async () => { ${source} })()`, sandbox)
  return {
    run,
    events,
    get reads() { return reads },
    get opens() { return opens },
    get closes() { return closes },
    get openDatabases() { return openDatabases },
    get continuations() { return continuations },
  }
}

test('maintained Mission 4 callsite awaits valid profile completion before continuing and reloading', async () => {
  const f = fixture([undefined, { version: 0, completed: [4] }, { version: 1, completed: '4' },
    { version: 1, completed: ['4'] }, { version: 1, completed: [3] }, completed])
  await f.run()
  assert.equal(f.reads, 6)
  assert.equal(f.closes, 6)
  assert.equal(f.openDatabases, 0)
  assert.equal(f.continuations, 1)
  assert.deepEqual(f.events, [
    ...Array.from({ length: 5 }, () => ['read', 'close', 'pause']).flat(),
    'read', 'close', 'release-raf', 'continue-ready', 'record:result-ui', 'continue-click',
    'record:continuation', 'reload', 'show-all-missions', 'completed-after-reload', 'record:persistence',
  ])
})

test('maintained Mission 4 callsite exhausts false reads without starting continuation', async () => {
  const f = fixture([undefined])
  await assert.rejects(f.run(), /must commit/)
  assert.equal(f.reads, 300)
  assert.equal(f.closes, 300)
  assert.equal(f.events.filter(event => event === 'pause').length, 299)
  assert.equal(f.continuations, 0)
})

test('maintained Mission 4 callsite accepts completion on the last read without a final pause', async () => {
  const f = fixture([...Array(299), completed])
  await f.run()
  assert.equal(f.reads, 300)
  assert.equal(f.closes, 300)
  assert.equal(f.events.filter(event => event === 'pause').length, 299)
  assert.equal(f.continuations, 1)
})

test('maintained Mission 4 callsite rejects failed opens without starting continuation', async () => {
  const f = fixture([completed], { openError: new Error('IDB open failed') })
  await assert.rejects(f.run(), /IDB open failed/)
  assert.equal(f.opens, 1)
  assert.equal(f.reads, 0)
  assert.equal(f.closes, 0)
  assert.equal(f.openDatabases, 0)
  assert.equal(f.continuations, 0)
})

test('maintained Mission 4 callsite closes rejected reads without starting continuation', async () => {
  const f = fixture([new Error('IDB read failed')])
  await assert.rejects(f.run(), /IDB read failed/)
  assert.equal(f.reads, 1)
  assert.equal(f.closes, 1)
  assert.equal(f.openDatabases, 0)
  assert.equal(f.continuations, 0)
})

test('maintained Mission 4 callsite closes a database when starting its read throws', async () => {
  const f = fixture([completed], { readError: new Error('IDB transaction failed') })
  await assert.rejects(f.run(), /IDB transaction failed/)
  assert.equal(f.reads, 0)
  assert.equal(f.closes, 1)
  assert.equal(f.openDatabases, 0)
  assert.equal(f.continuations, 0)
})

test('maintained Mission 4 callsite closes databases with a missing store and fails closed', async () => {
  const f = fixture([completed], { missingStore: true })
  await assert.rejects(f.run(), /must commit/)
  assert.equal(f.opens, 300)
  assert.equal(f.reads, 0)
  assert.equal(f.closes, 300)
  assert.equal(f.openDatabases, 0)
  assert.equal(f.continuations, 0)
})

test('maintained Mission 4 callsite requires literal true before starting continuation', async () => {
  const f = fixture([completed], { poll: async () => ({ value: true }) })
  await assert.rejects(f.run(), /must commit/)
  assert.equal(f.continuations, 0)
})
