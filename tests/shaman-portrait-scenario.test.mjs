import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import vm from 'node:vm'
import { withinPortraitScenario } from '../scripts/local-render/shaman-portrait.mjs'
import { inspectPortraitPixels } from '../scripts/local-render/shaman-portrait-pixels.mjs'
import { setWorldPaused } from '../scripts/browser-world-input.mjs'
import { beginSpaceOwnership, endSpaceOwnership } from '../scripts/browser-space-ownership.mjs'
import { clearPortraitSelection } from '../scripts/browser-portrait-input.mjs'
import { waitForPortraitReadiness } from '../scripts/browser-portrait-readiness.mjs'
import { changeHudSize } from '../scripts/browser-native-options.mjs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const source = read('scripts/local-render/shaman-portrait.mjs')
const sizes = ['auto', '1', '1.5', '2', '2.5', '3', '4']
const tick = async () => { for (let n = 0; n < 40; n++) await Promise.resolve() }
// Unexpected setup failure must still observe the already-created rejection
// assertion; otherwise a failing mock can leak an unhandled rejection after test end.
const expectRejection = (...args) => {
  const result = assert.rejects(...args)
  void result.catch(() => {})
  return result
}
async function waitForStall(entered, run, rejected) {
  try { await Promise.race([entered, run.then(() => { throw Error('Expected a stalled phase') })]) }
  catch (error) { await rejected.catch(() => {}); throw error }
}
const ordered = (text, fragments) => {
  let at = 0
  for (const fragment of fragments) {
    const next = text.indexOf(fragment, at)
    assert.notEqual(next, -1, `Actual source retains ordered step: ${fragment}`)
    at = next + fragment.length
  }
}

// Mock public controls/DOM, not rendered acceptance. Actual owner/input/options
// helpers and their browser callbacks run against this isolated observation VM.
function fixture({ paused = true, mode = null, selected = [1], hudSize = 'auto' } = {}) {
  const world = { status: 'playing', outcome: { level: 1 }, inputMask: 0, paused, mode, selected,
    turn: 70, randomState: 123, buildingOrders: [], sounds: [], soundSerial: 0, flyby: { flags: 0 },
    units: [{ id: 1, team: 'blue', kind: 'shaman', hp: 100, x: 8, z: 9, path: [] },
      { id: 2, team: 'blue', kind: 'brave', hp: 100, x: 7, z: 8, path: [] }] }
  const scene = { world, renderer: { domElement: { isConnected: true } }, cameraPosition: { x: 0, y: 0 }, cameraMotion: { active: false } }
  const f = { world, current: world, scene, messages: [{ serial: '17', open: false }], actions: [], writes: [],
    size: hudSize, menu: false, foreign: false, fullscreen: false, focused: null, disposed: 0,
    background: { backgroundImage: 'url(original)', backgroundColor: 'original' } }
  const listeners = new Set()
  const window = {
    testStore: { getWorld: () => f.current, change: fn => { f.actions.push('supplied-write'); fn(f.current) } },
    testSceneRef: { get current() { return f.scene } },
    addEventListener: (_name, fn) => listeners.add(fn), removeEventListener: (_name, fn) => listeners.delete(fn),
  }
  f.replaceStore = () => { window.testStore = { ...window.testStore } }
  const document = {
    get fullscreenElement() { return f.fullscreen ? {} : null },
    querySelectorAll(selector) {
      if (selector === 'dialog[open]') return f.menu ? [{ hasAttribute: () => !f.foreign }] : []
      assert.ok(['.campaign-messages details', '.campaign-messages details[open]'].includes(selector),
        `Only the actual retained/all or open campaign detail query is supported: ${selector}`)
      const messages = selector.endsWith('[open]') ? f.messages.filter(message => message.open) : f.messages
      return messages.map(message => ({ open: message.open, getAttribute: () => message.serial }))
    },
    querySelector(selector) {
      if (selector === 'button.portrait') return { disabled: !f.current.units.some(u => u.id === 1 && u.hp > 0) }
      if (selector === '.campaign-messages details[open]') return f.messages.find(m => m.open) ?? null
      if (selector.includes('data-fullscreen-control')) return null
      if (selector.includes('dialog[open]')) return f.menu ? {} : null
      return f.foreign ? {} : null
    },
  }
  const context = vm.createContext({ window, document, structuredClone,
    setTimeout: (fn, ms) => { const timer = setTimeout(fn, ms); timer.unref(); return timer }, clearTimeout,
    requestAnimationFrame: fn => fn(),
  })
  const unwrap = arg => arg?.handle ? arg.value : arg && typeof arg === 'object' && !Array.isArray(arg)
    ? Object.fromEntries(Object.entries(arg).map(([key, value]) => [key, value?.handle ? value.value : value])) : arg
  const evaluate = (fn, argument) => {
    context.argument = unwrap(argument)
    return vm.runInContext(`(${fn.toString()})(argument)`, context)
  }
  const mark = async name => { f.actions.push(name); await f.onAction?.(name) }
  const options = value => assert.ok(value.timeout > 0 && value.timeout <= 2000, 'Delegated wait has the remaining total budget')
  const locator = name => ({
    _apiName: 'Locator', toString: () => `mock Locator(${name})`,
    async click(settings) {
      options(settings); await mark(`click:${name}`)
      if (name === 'Menu') { f.menuPause = f.current.paused; f.current.paused = true; f.menu = true; f.scene.modalSuspended = true }
      else if (name === 'Continue Game') { f.menu = false; f.scene.modalSuspended = false; if (!f.failRestore) f.current.paused = f.menuPause }
      else if (name === 'HUD size') f.size = sizes[(sizes.indexOf(f.size) + 1) % sizes.length]
      else if (name === 'Select brave') f.current.selected = [2]
      else if (name === 'Select shaman') {
        if (settings.button === 'right') {
          const u = f.current.units.find(u => u.id === 1)
          f.scene.cameraPosition = { x: Math.round(u.x * 256 + 2048) & 65535, y: Math.round(-u.z * 256 - 2048) & 65535 }
        } else {
          f.current.selected = [...new Set([...f.current.selected, 1])].sort((a, b) => a - b)
          for (const cue of settings.modifiers?.includes('Shift') ? [0x18, 0x58] : [0x18])
            f.current.sounds.push({ serial: ++f.current.soundSerial, cue })
        }
      }
    },
    async focus(settings) { options(settings); await mark(`focus:${name}`); f.focused = name },
    async hover(settings) { options(settings); await mark('hover') },
    async screenshot(settings) { options(settings); await mark('portrait-screenshot'); return Buffer.from([1]) },
    async evaluate(fn, arg, settings) {
      options(settings)
      await mark(fn.toString().includes('createImageBitmap') ? 'pixel-decode' : 'background')
      if (name === '.native-hud') {
        context.element = { style: f.background }; context.argument = unwrap(arg)
        return structuredClone(await vm.runInContext(`(${fn.toString()})(element, argument)`, context))
      }
      throw Error('Pixel decode is deliberately not mocked as rendered success')
    },
    async boundingBox(settings) { options(settings); return { x: 2, y: 2, width: 30, height: 35 } },
    async getAttribute(attribute, settings) { options(settings); assert.equal(attribute, 'data-hud-size'); await mark('hud-read'); return f.size },
    async _expect(expression, settings) {
      options(settings); await mark('hud-expect')
      assert.equal(expression, 'to.have.attribute.value')
      assert.equal(settings.expressionArg, 'data-hud-size')
      return { matches: settings.expectedText[0].string === f.size, received: f.size, log: [] }
    },
    async waitFor(settings) { options(settings); await mark('menu-hidden'); assert.equal(f.menu, false) },
    locator: selector => { throw Error(`No summary/ACK/Delete or unowned nested control: ${selector}`) },
  })
  f.page = {
    async evaluate(fn, argument) {
      const text = fn.toString()
      if (text.includes('campaign-portrait-readiness.mjs')) {
        await mark('readiness-evaluate')
        return { ready: f.current.paused === false && f.ready !== false, turn: f.current.turn, selected: [...f.current.selected] }
      }
      if (text.includes('hudPersonSource')) {
        await mark('snapshot')
        return structuredClone({ selected: f.current.selected, camera: f.scene.cameraPosition, turn: world.turn, paused: world.paused,
          randomState: world.randomState, orders: world.buildingOrders,
          people: world.units.map(u => ({ ...u, work: undefined, target: undefined, vehicle: undefined, controllerCommands: null })),
          sounds: world.sounds, soundSerial: world.soundSerial,
          shaman: world.units.find(u => u.id === 1 && u.hp > 0)?.id })
      }
      if (text.includes('WEBGL_debug_renderer_info')) return { version: 'mock', renderer: 'mock' }
      if (fn.name !== 'readPortraitOwner') await mark(text.includes('requestAnimationFrame') ? 'raf' : `evaluate:${fn.name || 'callback'}`)
      return structuredClone(await evaluate(fn, argument))
    },
    async evaluateHandle(fn) {
      await mark('handle')
      return { handle: true, value: evaluate(fn), async dispose() { f.disposed++ } }
    },
    getByRole(role, { name }) { assert.equal(role, 'button'); return locator(name instanceof RegExp ? 'HUD size' : name) },
    locator,
    async waitForFunction(fn, argument, settings) {
      options(settings); await mark('wait')
      if (fn.toString().includes('window.testSceneRef = scene')) return // Mock binder observes the already-bound owner.
      assert.equal(evaluate(fn, argument), true)
    },
    async waitForSelector(selector, settings) { options(settings); assert.equal(selector, '.world-viewport canvas'); await mark('readiness-bind') },
    async waitForTimeout(duration) { assert.ok(duration > 0 && duration <= 100); await mark('readiness-poll'); await new Promise(resolve => setTimeout(resolve, duration)) },
    async setViewportSize(size) { await mark(`viewport:${size.width}x${size.height}`) },
    async screenshot(settings) { options(settings); await mark('page-screenshot') },
    keyboard: { async press(key) {
      await mark(`key:${key}`)
      const event = { code: key, isTrusted: true, repeat: false, defaultPrevented: false }
      for (const listener of listeners) listener(event)
      if (f.messages.some(m => m.open)) event.defaultPrevented = true
      else if (key === 'Space' && f.focused !== 'Select shaman' && !f.failPause) f.current.paused = !f.current.paused
      else if (key === 'Escape' && !f.failClear) {
        if (f.current.mode) f.current.mode = null
        else if (f.current.selected.length) f.current.selected = []
        else throw Error('Empty Escape would open Menu')
      }
    } },
    mouse: { async move() { await mark('mouse') } },
  }
  f.entry = async (mission, flags) => {
    assert.equal(mission, 1); assert.deepEqual(flags, { nativeCampaign: true }); await mark('native-entry')
  }
  return f
}

const entered = (f, work, settings) => withinPortraitScenario(f.page, { timeout: 2000, ...settings }, async control => {
  await control.entry(() => f.entry(1, { nativeCampaign: true }))
  return work(control)
})

for (const paused of [false, true]) test(`actual native Options row reaches 1x/2x and restores prior pause=${paused}`, async () => {
  const f = fixture({ paused })
  await entered(f, async control => { await control.hudSize('1'); await control.hudSize('2') })
  assert.equal(f.current.paused, paused)
  assert.equal(f.size, '2')
  assert.equal(f.actions.filter(action => action === 'click:HUD size').length, 3)
  assert.equal(f.actions.filter(action => action === 'hud-expect').length, 3, 'Actual Playwright attribute matcher crosses guarded Locator _expect')
  assert.deepEqual(f.actions.filter(action => action.startsWith('click:') && action !== 'click:HUD size'),
    Array(2).fill(['Menu', 'Options', 'Browser compatibility and help', 'Back to Options', 'Back', 'Continue Game']).flat().map(name => `click:${name}`))
  assert.deepEqual(f.messages, [{ serial: '17', open: false }])
})

test('native Options cannot silently certify failed prior-pause restoration', async () => {
  const f = fixture({ paused: false }); f.failRestore = true
  await assert.rejects(entered(f, control => control.hudSize('1')), /pause ownership changed/)
})

for (const operation of ['pause', 'clear']) test(`failed public ${operation} never reaches portrait input`, async () => {
  const f = fixture({ paused: operation !== 'pause' })
  f.failPause = operation === 'pause'; f.failClear = operation === 'clear'
  await assert.rejects(entered(f, async control => {
    await control.pause(true); await control.clear()
    await control.page.getByRole('button', { name: 'Select shaman' }).click()
  }))
  assert.ok(!f.actions.includes('click:Select shaman'))
})

for (const phase of ['before', 'focus', 'delivery']) test(`real popup at ${phase} fails closed without ACK, Delete, collapse or later input`, async () => {
  const f = fixture({ paused: false })
  if (phase === 'before') f.messages[0].open = true
  f.onAction = name => {
    if ((phase === 'focus' && name === 'focus:.world-viewport') || (phase === 'delivery' && name === 'key:Space')) f.messages[0].open = true
  }
  await assert.rejects(entered(f, async control => { await control.pause(true); await control.clear() }), /popup owns input/)
  assert.deepEqual(f.messages, [{ serial: '17', open: true }])
  assert.ok(!f.actions.some(action => action.startsWith('click:') || action === 'key:Escape'))
  assert.equal(f.actions.filter(action => action === 'key:Space').length, phase === 'delivery' ? 1 : 0)
})

for (const owner of ['world', 'scene', 'store', 'pause', 'foreign', 'fullscreen', 'overview', 'inputMask', 'status', 'popup-record'])
  test(`rechecks ${owner} after delegated focus before the first Escape`, async () => {
    const f = fixture()
    f.onAction = name => {
      if (name !== 'focus:.world-viewport') return
      if (owner === 'world') { f.current = structuredClone(f.world); f.scene.world = f.current }
      if (owner === 'scene') f.scene = { ...f.scene }
      if (owner === 'store') f.replaceStore()
      if (owner === 'pause') f.current.paused = false
      if (owner === 'foreign') f.foreign = true
      if (owner === 'fullscreen') f.fullscreen = true
      if (owner === 'overview') f.scene.overviewActive = true
      if (owner === 'inputMask') f.current.inputMask = 64
      if (owner === 'status') f.current.status = 'won'
      if (owner === 'popup-record') f.messages = []
    }
    await assert.rejects(entered(f, control => control.clear()))
    assert.ok(!f.actions.includes('key:Escape'))
  })

test('cohort clear uses actual guarded targeting then group transitions and empty clear emits no Escape', async () => {
  const f = fixture({ mode: 'blast', selected: [1, 2] })
  await entered(f, async control => {
    const result = await control.clear()
    assert.deepEqual(result.steps.map(step => step.action), ['cancel-targeting', 'clear-selection'])
    assert.deepEqual(result.steps[0].after.selected, [1, 2])
    await control.clear()
  })
  assert.equal(f.actions.filter(action => action === 'key:Escape').length, 2)
  assert.equal(f.current.paused, true)
  assert.equal(f.current.randomState, 123)
})

for (const stage of ['native-entry', 'readiness-bind', 'readiness-evaluate', 'readiness-poll', 'pause-focus', 'clear-focus', 'hud-read', 'hud-expect', 'raf', 'hover', 'portrait-screenshot', 'pixel-decode'])
  for (const stop of ['abort', 'timeout']) test(`${stop} during ${stage} cannot launch later helper actions or report writes`, async () => {
    const f = fixture({ paused: stage !== 'pause-focus' && !stage.startsWith('readiness-') }), controller = new AbortController()
    let release, didEnter
    const pending = new Promise(resolve => { didEnter = resolve })
    if (stage === 'readiness-poll') f.ready = false
    const target = stage.endsWith('-focus') ? 'focus:.world-viewport' : stage
    f.onAction = name => {
      if (name === target) { didEnter(); return new Promise(resolve => { release = resolve }) }
    }
    const run = entered(f, async control => {
      if (stage.startsWith('readiness-')) await control.ready()
      else if (stage === 'pause-focus') await control.pause(true)
      else if (stage === 'clear-focus') await control.clear()
      else if (stage.startsWith('hud-')) await control.hudSize('2')
      else if (stage !== 'native-entry') await inspectPortraitPixels(control.page, control.page.getByRole('button', { name: 'Select shaman' }), '/not-written', {
        name: 'mock-stalled', background: [0, 0, 0], enabled: true, hover: true,
      })
      await control.save(() => f.writes.push('success'))
    }, { timeout: stop === 'timeout' ? 30 : 2000, signal: controller.signal })
    const rejected = expectRejection(run, stop === 'timeout'
      ? /Portrait (?:scenario|readiness|selection cancellation) timed out|World input preparation timed out|Space ownership input timed out/
      : /Stop portrait stage/)
    await waitForStall(pending, run, rejected)
    if (stop === 'abort') controller.abort(Error('Stop portrait stage'))
    await rejected
    const before = [...f.actions]
    release(); await tick()
    assert.deepEqual(f.actions, before, 'No later delegated action after the stalled await resolves')
    assert.deepEqual(f.writes, [])
  })

// Execute the actual scenario body with only IO and pixel-result substitution.
// This proves orchestration/counts, never a screenshot or independent pixel pass.
function loadScenario(f, { inspect = async (_page, _portrait, _output, options) => ({
  ...options, scale: Number(f.size), mismatches: 0, mocked: true,
}) } = {}) {
  assert.equal((source.match(/^import /gm) ?? []).length, 9, 'Fail on stale source-adapter imports')
  const adapted = source.replace(/^import .*\n/gm, '')
    .replace('export function readPortraitOwner', 'function readPortraitOwner')
    .replace('export async function withinPortraitScenario', 'async function withinPortraitScenario')
    .replace('export default async function', 'async function scenario')
  assert.doesNotMatch(adapted, /^export |^import /m)
  return new Function('assert', 'createHash', 'readFileSync', 'writeFileSync', 'resolve', 'inspectPortraitPixels', 'setWorldPaused', 'clearPortraitSelection', 'waitForPortraitReadiness', 'changeHudSize',
    `${adapted}\nreturn scenario;`)(assert, createHash, () => 'mock source fingerprint', (_path, json) => f.writes.push(JSON.parse(json)), resolve, inspect, setWorldPaused, clearPortraitSelection, waitForPortraitReadiness, changeHudSize)
}

test('scenario retains all ordinary assertions before 32 explicitly supplied comparisons and restores supplied data', async () => {
  const f = fixture({ paused: false }), original = [...f.world.units], background = { ...f.background }
  const result = await loadScenario(f)({ page: f.page, openMission: f.entry, root: '/mock', output: '/not-written', timeout: 2000 })
  assert.equal(result.status, 'passed')
  assert.equal(result.ordinaryCompleted, true)
  assert.equal(result.checks.filter(check => check.kind === 'left').length, 8)
  assert.equal(result.checks.filter(check => check.kind === 'keyboard').length, 1)
  assert.equal(result.checks.filter(check => check.kind === 'right').length, 4)
  assert.equal(result.pixelChecks.length, 32)
  assert.ok(result.pixelChecks.every(check => check.mocked && check.fixture === 'supplied, not natural lifecycle'))
  assert.deepEqual(structuredClone(f.world.units), original); assert.equal(original[0].hp, 100)
  assert.deepEqual(f.background, background)
  ordered(f.actions.join('\n'), ['native-entry', 'readiness-evaluate', 'key:Space', 'key:Escape', 'click:Select brave', 'click:Select shaman', 'viewport:1280x720', 'viewport:1440x1000', 'supplied-write'])
  assert.ok(f.writes.at(-1).sources['scripts/browser-portrait-input.mjs'])
})

test('fixture cleanup error does not replace the original oracle failure', async () => {
  const f = fixture({ paused: false })
  let failed = false
  const original = f.page.evaluate
  f.page.evaluate = async (fn, arg) => {
    if (failed && fn.toString().includes('Supplied portrait cleanup')) throw Error('Secondary cleanup failure')
    return original(fn, arg)
  }
  const run = loadScenario(f, { inspect: async () => { failed = true; throw Error('Primary oracle failure') } })
  await assert.rejects(run({ page: f.page, openMission: f.entry, root: '/mock', output: '/not-written', timeout: 2000 }), /Primary oracle failure/)
  assert.equal(f.writes.at(-1).status, 'failed')
  assert.match(f.writes.at(-1).error, /Primary oracle failure/)
})

test('late pixel observer resolution cannot write success or dispatch expired fixture cleanup', async () => {
  const f = fixture({ paused: false }), controller = new AbortController()
  let release, didEnter
  const pending = new Promise(resolve => { didEnter = resolve })
  const scenario = loadScenario(f, { inspect: async () => { didEnter(); return new Promise(resolve => { release = resolve }) } })
  const run = scenario({ page: f.page, openMission: f.entry, root: '/mock', output: '/not-written', timeout: 2000, signal: controller.signal })
  const rejected = expectRejection(run, /Stop late observer/)
  await waitForStall(pending, run, rejected); controller.abort(Error('Stop late observer')); await rejected
  const actions = [...f.actions], writes = [...f.writes]
  release({ scale: 1, mismatches: 0 }); await tick()
  assert.deepEqual(f.actions, actions); assert.deepEqual(f.writes, writes)
  assert.ok(!f.writes.some(report => report.status === 'passed'))
})

test('source contract preserves donor control assertions and independent oracle instead of CSS-only equivalence', () => {
  ordered(source, ['openMission(1, { nativeCampaign: true })', 'await control.ready()', 'await control.pause(true)', 'await control.clear()', "name: 'Select brave'", 'report.ordinaryCompleted = true', 'fixture = await page.evaluateHandle'])
  for (const assertion of ["['turn', 'paused', 'randomState', 'orders', 'people']", 'after.camera, before.camera', 'after.selected, before.selected',
    'after.soundSerial, before.soundSerial', "[0x18, 0x58] : [0x18]", 'Math.round(shaman.x * 256 + 2048)', 'Math.round(-shaman.z * 256 - 2048)',
    'box.x + box.width <= 1280', 'box.y + box.height <= 720', 'report.pixelChecks.length, 32', 'observation.scale, scale']) assert.ok(source.includes(assertion))
  assert.doesNotMatch(source, /Pause game|combobox|selectOption|keyboard\.press\('Escape'\)|localStorage|\.setItem\(|portraitFixture|\.style\.visibility|\.style\.display/)
  const oracle = read('scripts/local-render/shaman-portrait-pixels.mjs')
  assert.equal(createHash('sha256').update(oracle).digest('hex'), 'ad7dd31331944b4eb95634108b7e91a4ab030f1a65d5d04d5e4f2c45ee78b57e', 'Independent PR706 pixel oracle stays byte-identical')
  assert.match(oracle, /frame\[source \+ 3\] \/ 255 \* \(enabled \? 1 : 85 \/ 255\)/)
  assert.match(oracle, /if \(!enabled && inside\) expected = interior\[channel\]/)
  for (const dependency of ['browser-portrait-input.mjs', 'browser-portrait-readiness.mjs', 'campaign-portrait-readiness.mjs', 'browser-world-input.mjs', 'browser-space-ownership.mjs', 'browser-native-options.mjs', 'shaman-portrait-pixels.mjs'])
    assert.ok(source.includes(`'scripts/${dependency === 'shaman-portrait-pixels.mjs' ? 'local-render/' : ''}${dependency}'`))
  assert.match(read('scripts/local-render/harness.mjs'), /nativeCampaign = false/)
  assert.match(source, /do NOT claim to cancel its internals/)
})


test('a different Store returning the same World cannot receive a supplied fixture write', async () => {
  const f = fixture()
  await assert.rejects(entered(f, async control => {
    const originalWorld = f.current
    f.replaceStore()
    assert.equal(f.current, originalWorld)
    await control.page.evaluate(() => window.testStore.change(world => { world.selected = [] }))
  }), /Scene\/Store\/World replaced/)
  assert.ok(!f.actions.includes('supplied-write'))
  assert.deepEqual(f.current.selected, [1])
})

test('unready primary portrait state cannot proceed to pause, cohort clear or portrait input', async () => {
  const f = fixture({ paused: false }); f.ready = false
  await assert.rejects(entered(f, async control => {
    await control.ready(); await control.pause(true); await control.clear()
    await control.page.getByRole('button', { name: 'Select shaman' }).click()
  }, { timeout: 30 }), /timed out/)
  assert.ok(f.actions.includes('readiness-evaluate'))
  assert.ok(!f.actions.some(action => action.startsWith('key:') || action.startsWith('click:')))
})


test('the actual Space witness observes only open details without dropping retained closed records', async () => {
  const f = fixture({ paused: false }), id = '__portraitMockSpaceWitness'
  f.messages.push({ serial: '18', open: true })
  const messages = structuredClone(f.messages)
  await f.page.evaluate(beginSpaceOwnership, { id, timeout: 2000 })
  let records
  try { await f.page.keyboard.press('Space') }
  finally { records = await f.page.evaluate(endSpaceOwnership, id) }
  assert.equal(records.length, 1)
  assert.deepEqual(records[0].owners, ['18'])
  assert.equal(records[0].prevented, true)
  assert.equal(records[0].sameWorld, true)
  assert.deepEqual(records[0].after, records[0].before)
  assert.deepEqual(f.messages, messages, 'The closed record and open owner remain untouched')
  assert.ok(!f.actions.some(action => action.startsWith('click:')))
})
