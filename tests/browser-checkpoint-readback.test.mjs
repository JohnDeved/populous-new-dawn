import { CHECKPOINT_VERSION } from '../app/checkpoint-format.ts'
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
    async evaluate(read, argument) {
      assert.equal(pending, false, 'Storage reads must not overlap')
      pending = true
      try {
        return await read(argument)
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
    CHECKPOINT_VERSION,
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

for (const version of [CHECKPOINT_VERSION]) test(`maintained checkpoint callsite waits for delayed v${version} reads before reloading`, async () => {
  const f = fixture([undefined, { version: 0 }, { version }])
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

for (const [file, variable, field] of [
  ['mission3-building-screen.mjs', 'saved', 'snapshot'],
  ['mission3-temple-checkpoint.mjs', 'entry', 'summary'],
]) test(`${file} committed predicate accepts the current envelope only with matching full state`, async () => {
  const { isDeepStrictEqual } = await import('node:util')
  const script = readFileSync(new URL(`../scripts/local-render/${file}`, import.meta.url), 'utf8'),
    predicate = script.match(/return \(\s*\w+\.committed\?\.version === 3[\s\S]*?\n\s*\)/)?.[0]
  assert.ok(predicate, 'Exercise the maintained committed-readback predicate')
  const check = new Function(variable, 'isDeepStrictEqual', predicate)
  for (const version of [0, 1, 2, 3, 4]) {
    const snapshot = { turn: 73, owner: 1024, commands: [0, 1024] },
      boundary = variable === 'saved' ? { snapshot } : { saved: snapshot },
      value = { committed: { version, [field]: structuredClone(snapshot) }, boundary }
    assert.equal(check(value, isDeepStrictEqual), version === 3)
    value.committed[field].commands[1]++
    assert.equal(check(value, isDeepStrictEqual), false, 'Envelope compatibility cannot mask state drift')
  }
})

// Supplied browser setup is current-format data, not an obsolete-save adapter.
test('Mission 2 supplied browser checkpoint uses current scalable schema and normalization', async t => {
  const { mkdtempSync, rmSync } = await import('node:fs'),
    { tmpdir } = await import('node:os'),
    { join } = await import('node:path'),
    { createM2Checkpoint } = await import('../scripts/tutorial-browser/m2-checkpoint.mjs'),
    { checkpointCodec } = await import('../scripts/tutorial-browser/checkpoint-codec.mjs'),
    { createGameStore } = await import('../app/game-store.ts'),
    output = mkdtempSync(join(tmpdir(), 'pnd-current-m2-'))
  t.after(() => rmSync(output, { recursive: true, force: true }))
  const fixture = await createM2Checkpoint(output, { commit: 'controlled-current-source', files: [] }),
    record = checkpointCodec(fixture.transfer, true), store = createGameStore()
  assert.equal(record.version, CHECKPOINT_VERSION)
  assert.deepEqual(record.world.capacityPolicy, { version: 1, mode: 'scalable' })
  Object.assign(store.getWorld(), record.world)
  await store.saveCheckpoint()
  assert.equal(store.loadCheckpoint(), true)
  assert.deepEqual(store.getWorld(), checkpointCodec(fixture.expected, true))
})
