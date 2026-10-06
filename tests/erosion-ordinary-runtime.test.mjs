import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { observeLoadedModules, sourceCorrespondence } from '../qa/erosion-ordinary/runtime.mjs'
import { browserModules, sha256 } from '../qa/erosion-ordinary/source-policy.mjs'

const origin = 'http://127.0.0.1:4188'
const inlineMap = source => 'data:application/json;charset=utf-8;base64,' +
  Buffer.from(JSON.stringify({ version: 3, sources: ['original.ts'], sourcesContent: [source] })).toString('base64')

// Synthetic page/CDP only. The observer never receives a browser connection.
async function fixture(t, { alterEvents = events => events, readSource, checkStop = async () => {} } = {}) {
  const root = mkdtempSync(resolve(tmpdir(), 'erosion-runtime-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const sources = new Map(), scripts = new Map()
  const events = browserModules.map((path, index) => {
    const original = `export const source${index} = ${JSON.stringify(path)}\n`
    const served = index % 2 ? original.replace('const', 'let') : original
    mkdirSync(dirname(resolve(root, path)), { recursive: true })
    writeFileSync(resolve(root, path), original)
    const event = {
      scriptId: String(index + 1), url: `${origin}/${path}?loaded=1`, executionContextId: 7,
      hash: `synthetic-cdp-hash-${index}`, sourceMapURL: index % 2 ? inlineMap(original) : '',
    }
    sources.set(path, { original, served, event })
    scripts.set(event.scriptId, served)
    return event
  })
  const calls = [], session = new EventEmitter()
  session.detached = false
  session.send = async (method, parameters) => {
    assert.ok(['Debugger.enable', 'Debugger.getScriptSource'].includes(method), `Unexpected CDP action: ${method}`)
    calls.push({ method, parameters })
    if (method === 'Debugger.enable') {
      assert.equal(parameters, undefined)
      for (const event of alterEvents(events)) session.emit('Debugger.scriptParsed', event)
      return {}
    }
    assert.deepEqual(Object.keys(parameters), ['scriptId'])
    assert.ok(scripts.has(parameters.scriptId), 'only a recorded script can be read')
    const scriptSource = scripts.get(parameters.scriptId)
    return readSource ? await readSource(parameters.scriptId, scriptSource) : { scriptSource }
  }
  session.detach = async () => { session.detached = true }
  const externalListener = () => {}
  session.on('Debugger.scriptParsed', externalListener)
  const page = { context: () => ({
    newCDPSession: async target => { assert.equal(target, page); return session },
  }) }
  const observer = await observeLoadedModules(page, root, origin, checkStop)
  t.after(async () => { if (!session.detached) await observer.dispose() })
  return { observer, session, calls, sources, externalListener }
}

test('source correspondence accepts exact bytes or inline maps containing the pinned source', () => {
  const original = 'export const value: number = 1\n'
  const transformed = 'export const value = 1;\n'
  assert.equal(sourceCorrespondence(original, original), 'exact')
  assert.equal(sourceCorrespondence(transformed, original, inlineMap(original)), 'inline-source-map')
  assert.equal(
    sourceCorrespondence(transformed, original, inlineMap(original).replace(';charset=utf-8', '')),
    'inline-source-map'
  )
  for (const map of [undefined, `${origin}/source.map`, 'data:application/json;base64,%%%'])
    assert.throws(() => sourceCorrespondence(transformed, original, map), /exact bytes or a captured inline source map/)
  assert.throws(() => sourceCorrespondence(transformed, original, inlineMap(original.trim())), /pinned source bytes/)
  const invalidMap = 'data:application/json;base64,' + Buffer.from('{invalid').toString('base64')
  assert.throws(() => sourceCorrespondence(transformed, original, invalidMap), SyntaxError)
  const missingSources = 'data:application/json;base64,' + Buffer.from('{}').toString('base64')
  assert.throws(() => sourceCorrespondence(transformed, original, missingSources), /pinned source bytes/)
})

test('module read covers all eight prescribed scripts using only observational CDP calls', async t => {
  assert.deepEqual(browserModules, [
    'app/erosion.ts', 'app/erosion-observation.ts', 'app/world-turn.ts', 'app/game-clock.ts',
    'qa/erosion-native-replay/capture.mjs', 'qa/erosion-ordinary/lifecycle.mjs',
    'qa/erosion-ordinary/input.mjs', 'qa/erosion-ordinary/minimap-input.mjs',
  ])
  let stops = 0
  const f = await fixture(t, {
    checkStop: async () => { stops++ },
    alterEvents: events => [
      { ...events[0], scriptId: 'foreign', url: `http://other.invalid/${browserModules[0]}` },
      { ...events[0], scriptId: 'unrelated', url: `${origin}/unrelated.mjs` },
      { ...events[0], scriptId: 'invalid', url: 'not a URL' },
      ...events, events[0],
    ],
  })
  const result = await f.observer.read()
  assert.deepEqual(Object.keys(result.modules), browserModules)
  assert.equal(result.observations.length, 8)
  for (const [index, path] of browserModules.entries()) {
    const { original, served, event } = f.sources.get(path)
    assert.deepEqual(result.modules[path], {
      sourceSha256: sha256(original), servedSha256: sha256(served), servedBody: served,
    })
    assert.deepEqual(result.observations[index], {
      path, scriptId: event.scriptId, url: event.url, executionContextId: 7,
      cdpHash: event.hash, sourceMapSha256: sha256(event.sourceMapURL),
      correspondence: index % 2 ? 'inline-source-map' : 'exact',
    })
  }
  assert.equal(stops, 16, 'check stop both before and after each awaited source read')
  assert.deepEqual(f.calls, [
    { method: 'Debugger.enable', parameters: undefined },
    ...browserModules.map((_, index) => ({
      method: 'Debugger.getScriptSource', parameters: { scriptId: String(index + 1) },
    })),
  ])
})

test('missing required module is rejected before a source read', async t => {
  const f = await fixture(t, { alterEvents: events => events.slice(1) })
  await assert.rejects(f.observer.read(), /One actually parsed module required: app\/erosion\.ts/)
  assert.deepEqual(f.calls.map(call => call.method), ['Debugger.enable'])
})

test('a required module parsed under another origin does not satisfy admission', async t => {
  const f = await fixture(t, {
    alterEvents: events => events.map((event, index) => index ? event : {
      ...event, url: `http://other.invalid/${browserModules[0]}`,
    }),
  })
  await assert.rejects(f.observer.read(), /One actually parsed module required: app\/erosion\.ts/)
})

test('two script identities for one required module are rejected', async t => {
  const f = await fixture(t, {
    alterEvents: events => [...events, { ...events[0], scriptId: 'duplicate' }],
  })
  await assert.rejects(f.observer.read(), /One actually parsed module required: app\/erosion\.ts/)
  assert.deepEqual(f.calls.map(call => call.method), ['Debugger.enable'])
})

test('required modules from different execution contexts are rejected', async t => {
  const f = await fixture(t, {
    alterEvents: events => events.map((event, index) => index ? event : {
      ...event, executionContextId: 99,
    }),
  })
  await assert.rejects(f.observer.read(), /must share the actual page execution context/)
})

test('a stop arriving during an awaited source read prevents any result or next read', async t => {
  const requested = Promise.withResolvers(), response = Promise.withResolvers()
  let stopped = false, stops = 0
  const f = await fixture(t, {
    readSource: async (scriptId, scriptSource) => {
      requested.resolve({ scriptId, scriptSource })
      return await response.promise
    },
    checkStop: async () => {
      stops++
      if (stopped) throw new Error('Stop requested during source read')
    },
  })
  const pending = f.observer.read()
  const rejection = assert.rejects(pending, /Stop requested during source read/)
  const first = await requested.promise
  assert.equal(first.scriptId, '1')
  assert.equal(stops, 1)
  stopped = true
  response.resolve({ scriptSource: first.scriptSource })
  await rejection
  assert.equal(stops, 2)
  assert.deepEqual(f.calls.map(call => call.method), ['Debugger.enable', 'Debugger.getScriptSource'])
})

test('dispose removes its parsed-event listener and detaches without removing other listeners', async t => {
  const f = await fixture(t)
  assert.equal(f.session.listenerCount('Debugger.scriptParsed'), 2)
  assert.equal(f.session.detached, false)
  await f.observer.dispose()
  assert.deepEqual(f.session.listeners('Debugger.scriptParsed'), [f.externalListener])
  assert.equal(f.session.detached, true)
  assert.deepEqual(f.calls.map(call => call.method), ['Debugger.enable'])
})
