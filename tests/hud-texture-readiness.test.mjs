import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import { waitForHudTexture } from '../scripts/hud-texture-readiness.mjs'

const callers = [
  { name: 'building menu', file: 'check-browser-building-menu.mjs', timeout: 30000 },
  { name: 'building hover Mission 1', file: 'check-browser-building-panel-hover.mjs', timeout: 30000 },
  { name: 'building hover Mission 2', file: 'check-browser-building-panel-hover.mjs', timeout: 30000 },
  { name: 'worship Tutorial', file: 'check-browser-worship-panel-live.mjs', timeout: 30000 },
  { name: 'worship Mission 1', file: 'check-browser-worship-panel-live.mjs', timeout: 20000 },
]

function callerSource({ name, file }) {
  const source = readFileSync(new URL(`../scripts/${file}`, import.meta.url), 'utf8')
  if (source.includes('await waitForHudTexture('))
    assert.ok(source.includes("import { waitForHudTexture } from './hud-texture-readiness.mjs'"), 'Resolve the production helper import')
  // Execute the maintained gate and its local wrapper, not a copied predicate.
  // Keeping the old wrapper executable also makes the regression fail first.
  if (name === 'building menu') {
    const marker = '  await page.evaluate(() => { window.testScene = window.testSceneRef.current })'
    const start = source.indexOf(marker) + marker.length
    const end = source.indexOf('  const panel = ', start)
    assert.ok(start >= marker.length && end > start)
    return source.slice(start, end)
  }
  const wrapper = source.slice(source.indexOf('async function waitHud('), source.indexOf('\nasync function ', source.indexOf('async function waitHud(') + 1))
  const startMarker = name === 'building hover Mission 1' ? 'async function ordinaryMissionOneHouse(page) {'
    : name === 'building hover Mission 2' ? 'async function ordinaryMissionTwoTrainingHut(page) {'
    : name === 'worship Mission 1' ? '    page.setDefaultTimeout(20_000)' : "      () => window.testScene.world.ai.variables[9] === 6 && !window.testScene.world.inputMask"
  const start = source.indexOf('await waitHud(', source.indexOf(startMarker))
  const end = source.indexOf('\n', start)
  assert.ok(start >= 0 && end > start && wrapper.startsWith('async function waitHud('))
  return `${wrapper}\n${source.slice(start, end)}`
}

function fixture(t, values, { readLatency = 0 } = {}) {
  let elapsed = 0, reads = 0, imports = 0, getters = 0, pending = false, generation = 0
  const events = []
  const clock = t.mock.method(performance, 'now', () => elapsed)
  t.after(() => clock.mock.restore())
  const page = {
    async evaluate(observe) {
      assert.equal(pending, false, 'Observations must not overlap')
      pending = true
      const currentGeneration = generation
      const value = values[Math.min(reads++, values.length - 1)]
      const Image = class HTMLImageElement {}
      // Substitute only the module-loader boundary. Run the real callback in a
      // fresh document realm, with no window/global function aliases available.
      const callback = observe.toString().replace("import('/app/scene-assets.ts')", "importSceneAssets('/app/scene-assets.ts')")
      try {
        return await vm.runInNewContext(`(${callback})()`, {
          HTMLImageElement: Image,
          async importSceneAssets(path) {
            assert.equal(path, '/app/scene-assets.ts')
            imports++
            events.push(['import', currentGeneration])
            await new Promise(resolve => setImmediate(resolve))
            elapsed += readLatency
            if (value instanceof Error) throw value
            return {
              texture(kind) {
                assert.equal(kind, 'hud')
                assert.equal(pending, true, 'Await the import before acquiring the image')
                getters++
                events.push(['texture', currentGeneration])
                const image = value?.element === false ? {} : new Image()
                return { image: Object.assign(image, value) }
              },
            }
          },
        })
      } finally {
        pending = false
      }
    },
    async waitForFunction(predicate) {
      // Installed Playwright 1.63 tests predicate truthiness before adopting its
      // Promise. A false settlement returns a false handle without another poll.
      const success = this.evaluate(predicate)
      assert.ok(success)
      return { value: await success }
    },
    async waitForTimeout(ms) {
      assert.equal(pending, false, 'Pause only after the previous read settles')
      assert.ok(ms > 0 && ms <= 100)
      elapsed += ms
      generation++
      events.push(['pause', ms])
    },
  }
  return {
    page, events,
    replaceDocument() { generation++ },
    get elapsed() { return elapsed },
    get reads() { return reads },
    get imports() { return imports },
    get getters() { return getters },
  }
}
const readyImage = { complete: true, naturalWidth: 640 }

for (const caller of callers) {
  const source = callerSource(caller)
  const run = page => vm.runInNewContext(`(async () => { ${source} })()`, { page, waitForHudTexture })
  test(`${caller.name} waits through delayed false images before continuing`, async t => {
    const f = fixture(t, [{ ...readyImage, element: false }, { ...readyImage, complete: false }, { ...readyImage, naturalWidth: 0 }, readyImage])
    await run(f.page)
    assert.equal(f.reads, 4)
    assert.equal(f.imports, 4, 'Reimport in the current document for every read')
    assert.equal(f.getters, 4, 'Acquire the current image on every read')
    assert.deepEqual(f.events.filter(([event]) => event === 'texture').map(([, generation]) => generation), [0, 1, 2, 3])
  })
  test(`${caller.name} exhausts its existing ${caller.timeout} ms scope without continuing`, async t => {
    const f = fixture(t, [{ complete: false, naturalWidth: 0 }])
    await assert.rejects(run(f.page), new RegExp(`HUD texture readiness timed out after ${caller.timeout} ms`))
    assert.equal(f.elapsed, caller.timeout)
    assert.equal(f.reads, caller.timeout / 100)
  })
  test(`${caller.name} propagates failed texture acquisition without retrying`, async t => {
    const f = fixture(t, [new Error('HUD module unavailable')])
    await assert.rejects(run(f.page), /HUD module unavailable/)
    assert.equal(f.reads, 1)
    assert.equal(f.getters, 0)
    assert.equal(f.events.some(([event]) => event === 'pause'), false)
  })
}

test('repeated helper calls acquire the replacement document image', async t => {
  const f = fixture(t, [readyImage, { ...readyImage, complete: false }, readyImage])
  assert.equal(await waitForHudTexture(f.page), true)
  f.replaceDocument()
  assert.equal(await waitForHudTexture(f.page), true)
  assert.equal(f.reads, 3)
  assert.deepEqual(f.events.filter(([event]) => event === 'texture'), [['texture', 0], ['texture', 1], ['texture', 2]])
})

test('only literal true permits readiness, never a truthy observation value', async t => {
  const f = fixture(t, [readyImage])
  const values = ['pending', 1, {}, true]
  f.page.evaluate = async () => values.shift()
  assert.equal(await waitForHudTexture(f.page), true)
  assert.equal(values.length, 0)
})

test('late true is rejected after the awaited read settles, without another observation', async t => {
  const f = fixture(t, [readyImage], { readLatency: 25 })
  await assert.rejects(waitForHudTexture(f.page, { timeout: 20 }), /timed out after 20 ms/)
  assert.equal(f.elapsed, 25, 'The deadline cannot cancel an in-flight evaluation')
  assert.equal(f.reads, 1)
  assert.equal(f.events.some(([event]) => event === 'pause'), false)
})

test('the last pause fits the deadline and no read starts after it', async t => {
  const f = fixture(t, [{ ...readyImage, complete: false }])
  await assert.rejects(waitForHudTexture(f.page, { timeout: 150 }), /timed out after 150 ms/)
  assert.equal(f.reads, 2)
  assert.deepEqual(f.events.filter(([event]) => event === 'pause'), [['pause', 100], ['pause', 50]])
})

test('invalid wait bounds fail before reading', async () => {
  for (const options of [{ timeout: 0 }, { timeout: NaN }, { timeout: Infinity }, { polling: 0 }, { polling: NaN }, { polling: Infinity }])
    await assert.rejects(waitForHudTexture({}, options), /Invalid HUD texture/)
})
