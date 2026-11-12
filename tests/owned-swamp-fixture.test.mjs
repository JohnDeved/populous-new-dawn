import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

// Supplied-loader contract only. No Vite, browser, or production TS graph runs.
const host = readFileSync(new URL('../scripts/tutorial-browser/fixture/main.tsx', import.meta.url), 'utf8')
const boundary = '// Supplied worship-slot boundary in the test host only.\n'
const end = host.indexOf(boundary)
assert.ok(end > 0, 'Reviewed loader/suffix boundary must remain explicit')
const loader = host.slice(0, end)
const specifier = "import('../../owned-swamp-evidence/fixture.mjs')"
assert.equal(loader.split(specifier).length, 2, 'Exactly one controlled import boundary')
const execute = new Function('location', 'load', 'globalThis', loader.replace(specifier, 'load()'))
const key = '__pndOwnedSwampFixtureReady'
const run = (search, load) => {
  const globals = {}
  execute({ search }, load, globals)
  return globals
}

for (const query of ['', '?owned-swamp-evidence=', '?owned-swamp-evidence=0', '?owned-swamp-evidence=true', '?owned-swamp-evidence=2'])
  test(`query ${query || '(absent)'} does not load or publish`, () => {
    let calls = 0
    const globals = run(query, () => { calls++; return Promise.resolve({}) })
    assert.equal(calls, 0)
    assert.equal(Object.hasOwn(globals, key), false)
  })

test('exact value 1 publishes original pending Promise immediately, once', async () => {
  let resolve, calls = 0, settled = false
  const pending = new Promise(done => { resolve = done })
  const globals = run('?owned-swamp-evidence=1', () => { calls++; return pending })
  assert.equal(calls, 1)
  assert.equal(globals[key], pending)
  pending.then(() => { settled = true })
  await Promise.resolve()
  assert.equal(settled, false, 'Published Promise is not completed readiness')
  const advanceGame = () => {}, module = { advanceGame }
  resolve(module)
  assert.equal(await globals[key], module)
  assert.equal((await globals[key]).advanceGame, advanceGame, 'Supplied reference identity, not production identity')
})

test('rejection remains original failure despite auxiliary catch', async () => {
  const failure = new Error('controlled fixture import failure')
  const pending = Promise.reject(failure)
  const globals = run('?owned-swamp-evidence=1', () => pending)
  assert.equal(globals[key], pending)
  await assert.rejects(globals[key], error => error === failure)
})

test('readiness property cannot be reassigned, deleted or redefined', () => {
  const pending = Promise.resolve({ advanceGame() {} })
  const globals = run('?owned-swamp-evidence=1', () => pending)
  const descriptor = Object.getOwnPropertyDescriptor(globals, key)
  assert.equal(descriptor.writable, false)
  assert.equal(descriptor.configurable, false)
  assert.throws(() => { globals[key] = null }, TypeError)
  assert.throws(() => { delete globals[key] }, TypeError)
  assert.throws(() => Object.defineProperty(globals, key, { value: null }), TypeError)
  assert.equal(globals[key], pending)
})

test('initial proposal preserves exact a7a0a47 host suffix', () => {
  // Explicit snapshot contract: intentional later test-host edits must re-review this assertion.
  assert.equal(createHash('sha256').update(host.slice(end)).digest('hex'),
    'a1461b59a2d65ca7f32db9fee19372ac672a32a8c54fea23c40f062678e7bada')
})

test('fixture contains only the sole real advanceGame re-export', () => {
  const fixture = readFileSync(new URL('../scripts/owned-swamp-evidence/fixture.mjs', import.meta.url), 'utf8')
  assert.equal(fixture, "// Test-host-only production reference. No setup or cancellation helper.\nexport { advanceGame } from '../../app/game-clock.ts'\n")
})
