import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import { waitForCheckpointReadback } from '../scripts/checkpoint-readback.mjs'

const checker = readFileSync(new URL('../scripts/check-browser-checkpoint.mjs', import.meta.url), 'utf8')
const start = checker.indexOf('  const saved = await page.evaluate(')
const end = checker.indexOf('  const startup = ', start)
assert.ok(start >= 0 && end > start, 'Extract the maintained save/readback/reload callsite')
const source = checker.slice(start, end)

function fixture(values) {
  const events = []
  let reads = 0, pending = false, reloads = 0, closes = 0, openDatabases = 0
  const request = (value, error) => {
    const listeners = {}
    const result = {
      result: value,
      error,
      addEventListener(type, listener) { listeners[type] = listener },
    }
    setImmediate(() => listeners[error ? 'error' : 'success']())
    return result
  }
  const database = {
    transaction(name) {
      assert.equal(name, 'checkpoints')
      return {
        objectStore(name) {
          assert.equal(name, 'checkpoints')
          return {
            get(key) {
              assert.equal(key, 'latest')
              const value = values[Math.min(reads++, values.length - 1)]
              events.push('read')
              return value instanceof Error ? request(undefined, value) : request(value)
            },
          }
        },
      }
    },
    close() {
      assert.equal(openDatabases, 1, 'Each database closes exactly once')
      openDatabases--
      closes++
      events.push('close')
    },
  }
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
      // Installed Playwright 1.63 checks truthiness before Promise adoption.
      // A Promise resolving false terminates polling and yields a false handle.
      const success = predicate()
      assert.ok(success)
      return { value: await success }
    },
    async waitForTimeout(milliseconds) {
      assert.equal(milliseconds, 100)
      assert.equal(pending, false)
      assert.equal(openDatabases, 0, 'Close the prior read before pausing')
      events.push('pause')
    },
    async reload(options) {
      assert.equal(options.waitUntil, 'networkidle')
      assert.equal(pending, false)
      assert.equal(openDatabases, 0, 'Close the successful read before reload')
      reloads++
      events.push('reload')
    },
  }
  const sandbox = {
    assert,
    page,
    testScene: {
      world: { outcome: { level: 2 }, turn: 707, land: { heights: [17] }, units: [{ hp: 23 }] },
    },
    indexedDB: {
      open(name, version) {
        assert.equal(name, 'populous-new-dawn')
        assert.equal(version, 1)
        assert.equal(openDatabases, 0, 'Close the prior database before another read')
        openDatabases++
        return request(database)
      },
    },
    waitForCheckpointReadback,
  }
  const run = () => vm.runInNewContext(`(async () => { ${source} })()`, sandbox)
  return {
    run,
    events,
    get reads() { return reads },
    get reloads() { return reloads },
    get closes() { return closes },
    get openDatabases() { return openDatabases },
  }
}

test('maintained checkpoint callsite waits for delayed false reads before reloading', async () => {
  const f = fixture([undefined, { version: 0 }, { version: 1 }])
  await f.run()
  assert.equal(f.reads, 3)
  assert.equal(f.closes, 3)
  assert.equal(f.reloads, 1)
  assert.deepEqual(f.events, ['read', 'close', 'pause', 'read', 'close', 'pause', 'read', 'close', 'reload'])
})

test('maintained checkpoint callsite rejects exhausted false reads without reloading', async () => {
  const f = fixture([undefined])
  await assert.rejects(f.run(), /must commit/)
  assert.equal(f.reads, 300)
  assert.equal(f.closes, 300)
  assert.equal(f.events.filter(event => event === 'pause').length, 299)
  assert.equal(f.reloads, 0)
})

test('maintained checkpoint callsite closes rejected reads without reloading', async () => {
  const f = fixture([new Error('IDB read failed')])
  await assert.rejects(f.run(), /IDB read failed/)
  assert.equal(f.reads, 1)
  assert.equal(f.closes, 1)
  assert.equal(f.openDatabases, 0)
  assert.equal(f.reloads, 0)
})
