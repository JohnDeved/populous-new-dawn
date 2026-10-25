import test from 'node:test'
import assert from 'node:assert/strict'
import * as browserGame from '../scripts/browser-game.mjs'

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
      assert.match(observe.toString(), /campaign-start-readiness\.mjs/)
      assert.doesNotMatch(observe.toString(), /missionTwoObserveReady|campaignObserveShaman/)
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
  assert.equal(typeof browserGame.readShamanReadiness, 'function')
  const f = fixture()
  assert.equal((await browserGame.readShamanReadiness(f.page)).ready, true)
  f.page.reload()
  assert.equal((await browserGame.readShamanReadiness(f.page)).ready, true)
  assert.equal((await browserGame.readShamanReadiness(f.page)).ready, true)
  f.page.replaceScene()
  assert.equal((await browserGame.readShamanReadiness(f.page)).ready, true)
  assert.deepEqual(f.events.filter(e => e[0] === 'bound'), [['bound', 0], ['bound', 1], ['bound', 1], ['bound', 2]])
  assert.equal(f.reads, 4)
})

test('readiness wait sequentially awaits false samples before accepting literal true', async () => {
  assert.equal(typeof browserGame.waitForShamanReadiness, 'function')
  const f = fixture([{ ready: false, turn: 21 }, { ready: false, turn: 40 }, { ready: true, turn: 70 }])
  const result = await browserGame.waitForShamanReadiness(f.page, { timeout: 1000, polling: 1 })
  assert.equal(result.before.ready, false)
  assert.equal(result.after.ready, true)
  assert.equal(result.after.turn, 70)
  assert.equal(result.samples, 3)
  assert.equal(f.events.filter(e => e[0] === 'pause').length, 2)
})

test('a truthy non-boolean readiness field does not pass the wait', async () => {
  const f = fixture([{ ready: 'pending', turn: 21 }, { ready: true, turn: 70 }])
  const result = await browserGame.waitForShamanReadiness(f.page, { timeout: 1000, polling: 1 })
  assert.equal(result.samples, 2)
  assert.equal(f.reads, 2)
})

test('read errors propagate and repeated unready samples time out without mutation', async () => {
  const broken = fixture([new Error('read-only module unavailable')])
  await assert.rejects(browserGame.waitForShamanReadiness(broken.page), /read-only module unavailable/)
  const waiting = fixture([{ ready: false, paused: true, turn: 20 }])
  await assert.rejects(browserGame.waitForShamanReadiness(waiting.page, { timeout: 15, polling: 2 }), /Shaman readiness timed out/)
  assert.ok(waiting.reads > 0)
  assert.ok(waiting.events.every(e => ['canvas', 'bound', 'read', 'pause'].includes(e[0])))
  for (const options of [{ timeout: 0 }, { timeout: NaN }, { polling: 0 }, { polling: Infinity }])
    await assert.rejects(browserGame.waitForShamanReadiness(fixture().page, options), /Invalid readiness wait/)
})
