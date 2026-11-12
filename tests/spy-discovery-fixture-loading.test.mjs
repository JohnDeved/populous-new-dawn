import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

const host = readFileSync(new URL('../scripts/tutorial-browser/fixture/main.tsx', import.meta.url), 'utf8')
const start = host.indexOf('// Opt-in supplied Spy discovery state in the test host, never the shipped entry.')
const boundary = host.indexOf('// Supplied worship-slot boundary in the test host only.', start)
const staticImport = host.indexOf("import { Matrix4 as PndReaderMatrix4 } from 'three'", boundary)
assert.ok(start >= 0 && boundary > start && staticImport > boundary, 'Expected independent host gates')
const spyGate = host.slice(start, boundary), bothGates = host.slice(start, staticImport)
const modulePath = '../spy-discovery-fixture.mjs', slot = '__pndSpyDiscoveryFixtureReady'

function deferred() {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

function launch(search, loaders = {}, source = spyGate) {
  const requested = [], context = vm.createContext({ URLSearchParams, location: { search },
    loadFixture(path) {
      requested.push(path)
      assert.ok(Object.hasOwn(loaders, path), `Unexpected import ${path}`)
      return loaders[path]
    },
  })
  // Parse the actual JavaScript gate first. Only the dynamic-import boundary is
  // supplied for execution; this does not import the production fixture graph.
  new vm.Script(source)
  const transformed = source.replaceAll('import(', 'loadFixture(')
  assert.equal((source.match(/\bimport\(/g) ?? []).length, (transformed.match(/\bloadFixture\(/g) ?? []).length)
  new vm.Script(transformed).runInContext(context)
  return { requested, context, ready: context[slot] }
}

test('actual gate syntax closes before the next independent host route', () => {
  assert.doesNotThrow(() => new vm.Script(spyGate))
  assert.doesNotThrow(() => new vm.Script(bothGates))
  assert.throws(() => new vm.Script(spyGate.replace(/}\s*$/, '')), SyntaxError)
})

for (const search of ['', '?spy-discovery-fixture=0', '?spy-discovery-fixture=true', '?another-fixture=1'])
  test(`no Spy import or readiness slot for ${search || 'ordinary host'}`, () => {
    const result = launch(search)
    assert.deepEqual(result.requested, [])
    assert.equal(Object.hasOwn(result.context, slot), false)
  })

test('enabled gate exposes the exact pending import Promise synchronously', async () => {
  const load = deferred(), result = launch('?spy-discovery-fixture=1', { [modulePath]: load.promise })
  assert.deepEqual(result.requested, [modulePath])
  assert.equal(result.ready, load.promise)
  assert.equal(result.context.__pndSpyDiscoveryFixture, undefined, 'Do not expose the old eventual module slot')
  const descriptor = Object.getOwnPropertyDescriptor(result.context, slot)
  assert.equal(descriptor.writable, false)
  assert.equal(descriptor.configurable, false)
  assert.equal(descriptor.enumerable, false)
  assert.equal(Reflect.set(result.context, slot, Promise.resolve({})), false)
  assert.equal(Reflect.deleteProperty(result.context, slot), false)
  const module = Object.freeze({ prepareDiscoveryFixture() {}, discoveryFixtureReady() {} })
  load.resolve(module)
  assert.equal(await result.ready, module)
  assert.equal(result.context[slot], load.promise)
})

test('a rejected import stays rejected for a later awaiting runner', async () => {
  const load = deferred(), result = launch('?spy-discovery-fixture=1', { [modulePath]: load.promise }),
    failure = new Error('Supplied fixture import failed')
  load.reject(failure)
  // Allow the attached rejection observer to settle before the runner attaches.
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(result.ready, load.promise)
  await assert.rejects(result.ready, error => error === failure)
  assert.equal(result.context.__pndSpyDiscoveryFixture, undefined)
})

test('the existing worship route does not require the Spy query', async () => {
  const worship = '../worship-panel-fixture.mjs', module = { marker: 'worship' },
    result = launch('?worship-panel-lifecycle=1', { [worship]: Promise.resolve(module) }, bothGates)
  await new Promise(resolve => setImmediate(resolve))
  assert.deepEqual(result.requested, [worship])
  assert.equal(result.context.__pndWorshipPanelFixture.marker, 'worship')
  assert.equal(Object.hasOwn(result.context, slot), false)
})

test('Spy and worship loading remain independent when both are enabled', async () => {
  const spy = deferred(), worship = '../worship-panel-fixture.mjs',
    result = launch('?spy-discovery-fixture=1&worship-panel-lifecycle=1', {
      [modulePath]: spy.promise, [worship]: Promise.resolve({ marker: 'worship' }),
    }, bothGates)
  await new Promise(resolve => setImmediate(resolve))
  assert.deepEqual(result.requested, [modulePath, worship])
  assert.equal(result.context.__pndWorshipPanelFixture.marker, 'worship')
  assert.equal(result.ready, spy.promise)
  spy.resolve({ marker: 'spy' })
  assert.equal((await result.ready).marker, 'spy')
})
