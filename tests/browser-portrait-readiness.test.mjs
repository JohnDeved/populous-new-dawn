import test from 'node:test'
import assert from 'node:assert/strict'
import * as browserGame from '../scripts/browser-portrait-readiness.mjs'

function fixture(samples = [{ ready: true, turn: 70, level: 3 }]) {
  let generation = 0, boundGeneration = -1, reads = 0, pending = false
  const events = []
  const page = {
    async waitForSelector(selector) {
      assert.equal(selector, '.world-viewport canvas')
      events.push(['canvas', generation])
    },
    async waitForFunction(predicate) {
      assert.notEqual(predicate.constructor.name, 'AsyncFunction')
      if (predicate.toString().includes('window.testSceneRef = scene')) {
        boundGeneration = generation
        events.push(['bound', generation])
      }
    },
    async evaluate(observe) {
      assert.equal(boundGeneration, generation, 'Each read must bind the current document')
      assert.equal(pending, false, 'Observation promises must never overlap')
      assert.match(observe.toString(), /campaign-portrait-readiness\.mjs/)
      assert.doesNotMatch(observe.toString(), /missionTwoObserveReady|campaignObserveShaman/)
      assert.match(observe.toString(), /scene\.world !== store\?\.getWorld\(\)/)
      assert.match(observe.toString(), /scene\.overviewActive \|\| scene\.overviewStage/)
      assert.match(observe.toString(), /isConnected/)
      pending = true
      await new Promise(resolve => setImmediate(resolve))
      pending = false
      events.push(['read', generation])
      const result = samples[Math.min(reads++, samples.length - 1)]
      if (result instanceof Error) throw result
      return structuredClone(result)
    },
    async waitForTimeout(ms) {
      assert.equal(pending, false, 'Only pause after the awaited observation finishes')
      events.push(['pause', ms])
      await new Promise(resolve => setTimeout(resolve, ms))
    },
    replaceScene() {
      generation++
      boundGeneration = -1
      events.push(['replace', generation])
    },
    reload() {
      generation++
      boundGeneration = -1
      events.push(['reload', generation])
    },
  }
  return { page, events, get reads() { return reads } }
}

test('readiness reads rebind after fresh page reload and on repeated calls', async () => {
  assert.equal(typeof browserGame.readPortraitReadiness, 'function')
  const f = fixture()
  assert.equal((await browserGame.readPortraitReadiness(f.page)).ready, true)
  f.page.reload()
  assert.equal((await browserGame.readPortraitReadiness(f.page)).ready, true)
  assert.equal((await browserGame.readPortraitReadiness(f.page)).ready, true)
  f.page.replaceScene()
  assert.equal((await browserGame.readPortraitReadiness(f.page)).ready, true)
  assert.deepEqual(f.events.filter(e => e[0] === 'bound'), [['bound', 0], ['bound', 1], ['bound', 1], ['bound', 2]])
  assert.equal(f.reads, 4)
})

test('readiness wait sequentially awaits false samples before accepting literal true', async () => {
  assert.equal(typeof browserGame.waitForPortraitReadiness, 'function')
  const f = fixture([{ ready: false, turn: 21 }, { ready: false, turn: 40 }, { ready: true, turn: 70 }])
  const result = await browserGame.waitForPortraitReadiness(f.page, { timeout: 1000, polling: 1 })
  assert.equal(result.before.ready, false)
  assert.equal(result.after.ready, true)
  assert.equal(result.after.turn, 70)
  assert.equal(result.samples, 3)
  assert.equal(f.events.filter(e => e[0] === 'pause').length, 2)
})

test('a truthy non-boolean readiness field does not pass the wait', async () => {
  const f = fixture([{ ready: 'pending', turn: 21 }, { ready: true, turn: 70 }])
  const result = await browserGame.waitForPortraitReadiness(f.page, { timeout: 1000, polling: 1 })
  assert.equal(result.samples, 2)
  assert.equal(f.reads, 2)
})

test('read errors propagate and repeated unready samples time out without mutation', async () => {
  const broken = fixture([new Error('read-only module unavailable')])
  await assert.rejects(browserGame.waitForPortraitReadiness(broken.page), /read-only module unavailable/)
  const waiting = fixture([{ ready: false, paused: true, turn: 20 }])
  await assert.rejects(browserGame.waitForPortraitReadiness(waiting.page, { timeout: 15, polling: 2 }), /Portrait readiness timed out/)
  assert.ok(waiting.reads > 0)
  assert.ok(waiting.events.every(e => ['canvas', 'bound', 'read', 'pause'].includes(e[0])))
  for (const options of [{ timeout: 0 }, { timeout: NaN }, { polling: 0 }, { polling: Infinity }])
    await assert.rejects(browserGame.waitForPortraitReadiness(fixture().page, options), /Invalid readiness wait/)
})


test('portrait readiness retains its caller abort signal without another read', async () => {
  const controller = new AbortController(), f = fixture()
  controller.abort(new Error('Portrait caller aborted'))
  await assert.rejects(browserGame.waitForPortraitReadiness(f.page, { signal: controller.signal }), /Portrait caller aborted/)
  assert.equal(f.reads, 0)
})


for (const phase of ['selector', 'overlay', 'binding', 'evaluate', 'poll']) {
  for (const stop of ['timeout', 'abort']) {
    test(`portrait readiness ${stop} stops a stalled ${phase} without late continuation`, async () => {
      const controller = new AbortController(), events = []
      let release, enteredPhase
      const entered = new Promise(resolve => { enteredPhase = resolve })
      const pending = () => { enteredPhase(); return new Promise(resolve => { release = resolve }) }
      const mark = async name => {
        events.push(name)
        if (name === phase) await pending()
      }
      const boundedOption = options => assert.ok(Number.isFinite(options.timeout) && options.timeout > 0 && options.timeout <= 1000)
      const page = {
        async waitForSelector(selector, options) { boundedOption(options); await mark('selector') },
        async waitForFunction(predicate, argument, options) {
          boundedOption(options)
          await mark(predicate.toString().includes('window.testSceneRef = scene') ? 'binding' : 'overlay')
        },
        async evaluate() { await mark('evaluate'); return { ready: phase !== 'poll' } },
        async waitForTimeout(duration) {
          assert.ok(duration > 0 && duration <= 100)
          await mark('poll')
        },
      }
      const result = browserGame.waitForPortraitReadiness(page, { timeout: stop === 'timeout' ? 20 : 1000, signal: controller.signal })
      const rejected = assert.rejects(result, stop === 'timeout' ? /Portrait readiness timed out/ : /Stop stalled phase/)
      await entered
      if (stop === 'abort') controller.abort(new Error('Stop stalled phase'))
      await rejected
      const stoppedAt = [...events]
      release()
      for (let turn = 0; turn < 12; turn++) await Promise.resolve()
      assert.deepEqual(events, stoppedAt, 'Late settlement cannot bind, observe or poll again')
    })
  }
}

test('a directly requested portrait readiness read is also abortable during binding', async () => {
  const controller = new AbortController(), events = []
  let release, enteredPhase
  const entered = new Promise(resolve => { enteredPhase = resolve })
  const page = {
    waitForSelector() { events.push('selector'); enteredPhase(); return new Promise(resolve => { release = resolve }) },
    waitForFunction() { events.push('late binding'); throw Error('No late binding') },
    evaluate() { events.push('late evaluate'); throw Error('No late observation') },
  }
  const result = browserGame.readPortraitReadiness(page, { signal: controller.signal })
  const rejected = assert.rejects(result, /Stop direct read/)
  await entered
  controller.abort(new Error('Stop direct read'))
  await rejected
  release()
  for (let turn = 0; turn < 12; turn++) await Promise.resolve()
  assert.deepEqual(events, ['selector'])
})
