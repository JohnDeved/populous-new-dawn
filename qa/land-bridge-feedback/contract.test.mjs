// Supplied World, synthetic trusted events and DOM. These contracts exercise
// actual cast/tick production code; they are not ordinary/browser evidence.
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { createWorld, cast, tick } from '../../app/model.ts'
import { spellTargetError } from '../../app/live-command.ts'
import { blastPersonTargeting } from '../../app/blast-targeting.ts'
import * as pointer from '../erosion-ordinary/input.mjs'
import { createMission1VaultInput } from '../../scripts/local-render/mission1-vault-input.mjs'
import { installLandBridgeFeedbackWitness } from '../../scripts/local-render/land-bridge-feedback-witness.mjs'
import scenario from '../../scripts/local-render/land-bridge-feedback.mjs'
import { parseOptions, launchOptions } from '../../scripts/local-render/harness.mjs'

const source = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8')
const inputSource = source('app/scene-input-runtime.ts')
const targetStart = inputSource.indexOf('  const directBlast =', inputSource.indexOf('if (event.button !== 0) return'))
const targetEnd = inputSource.indexOf('  if (!p) return', targetStart)
assert.ok(targetStart > 0 && targetEnd > targetStart)
const handlerTarget = Function('blastPersonTargeting', 'scene', 'event', inputSource.slice(targetStart, targetEnd) + '\nreturn p')

function fixture(t, { originalThrow = false, saveThrow = false, invalidBeforeRead = false } = {}) {
  const world = createWorld(), actor = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
  Object.assign(actor, { x: 0, z: 20, path: [], casting: null })
  Object.assign(world, { selected: [actor.id], inputMask: 0, paused: false, mode: 'bridge' })
  world.shots.bridge = 1; world.giftCounts.bridge = 1
  const listeners = [], calls = [], point = { x: 0.1, z: 4.1 }
  const canvas = { isConnected: true, getBoundingClientRect: () => ({ left: 0, top: 0, width: 1440, height: 1000 }),
    addEventListener(type, callback, capture = false) { listeners.push({ type, callback, capture }) },
    removeEventListener(type, callback, capture = false) {
      const index = listeners.findIndex(item => item.type === type && item.callback === callback && item.capture === capture)
      assert.ok(index >= 0); listeners.splice(index, 1)
    } }
  const clock = { beforeTurn(...args) { assert.equal(this, clock); calls.push(['before', args]); if (originalThrow) throw null; return 'before-return' },
    afterTurn(...args) { assert.equal(this, clock); calls.push(['after', args]); return 'after-return' } }
  const scene = { world, gameClock: clock, renderer: { domElement: canvas }, started: true, disposed: false,
    ground: {}, fxMeshes: new Map(), overviewActive: false, down: {}, pointerAck: { target: 0, until: 0 },
    picking: { pickPerson: () => null },
    pickUnit: () => null, pickWorldObject: () => null, pick() { return point },
    animateFx(...args) { assert.equal(this, scene); calls.push(['animateFx', args]); return 'effect-return' } }
  const descriptors = [[clock, 'beforeTurn'], [clock, 'afterTurn'], [scene, 'animateFx']]
    .map(([owner, key]) => ({ owner, key, descriptor: Object.getOwnPropertyDescriptor(owner, key) }))
  let currentElement = null, mutation, disconnected = false
  const style = { display: 'block', visibility: 'visible', opacity: '1', color: 'rgb(239, 231, 200)', zIndex: '2' }
  const element = { isConnected: true, hidden: false, parentElement: null, textContent: '',
    checkVisibility: () => true,
    getBoundingClientRect: () => ({ x: 590, y: 950, left: 590, top: 950, right: 850, bottom: 980, width: 260, height: 30 }) }
  globalThis.window = { testSceneRef: { current: scene }, testStore: { getWorld: () => world } }
  globalThis.document = { body: {}, hidden: false, elementFromPoint: () => canvas,
    querySelector: selector => selector.startsWith('.world-message') ? currentElement : null }
  globalThis.getComputedStyle = () => style
  Object.assign(globalThis, { innerWidth: 1440, innerHeight: 1000, devicePixelRatio: 1,
    MutationObserver: class { constructor(callback) { mutation = callback } observe() {} disconnect() { disconnected = true } } })
  t.after(() => {
    window.landBridgeFeedback?.close()
    for (const key of ['window', 'document', 'getComputedStyle', 'innerWidth', 'innerHeight', 'devicePixelRatio', 'MutationObserver']) delete globalThis[key]
  })
  const modules = { '/app/live-command.ts': { spellTargetError }, '/qa/erosion-ordinary/input.mjs': pointer }
  const page = { evaluate: async (fn, arg) => Function('imports', `return (${fn.toString().replaceAll('import(', 'imports(')})`)(async path => {
    assert.ok(modules[path], path); return modules[path]
  })(arg), mouse: { async click(x, y) {
    for (const type of ['pointerdown', 'pointerup']) {
      const event = { type, clientX: x, clientY: y, button: 0, buttons: Number(type === 'pointerdown'),
        isTrusted: true, target: canvas, ctrlKey: false, shiftKey: false, altKey: false, metaKey: false }
      for (const listener of [...listeners].filter(item => item.type === type && item.capture)) listener.callback(event)
      if (type === 'pointerup') assert.equal(cast(world, 'bridge', handlerTarget(blastPersonTargeting, scene, event)), true)
      for (const listener of [...listeners].filter(item => item.type === type && !item.capture)) listener.callback(event)
    }
  } } }
  const report = { actions: [] }, input = createMission1VaultInput({ page, signal: new AbortController().signal, report,
    originalShamanId: actor.id, save() { if (saveThrow) throw 'save-primary' } })
  installLandBridgeFeedbackWitness({ actorId: actor.id })
  const observer = window.landBridgeFeedback
  if (invalidBeforeRead) world.outcome.level = 2
  const fire = () => input.castInput({ x: 800, y: 450, point }, 'bridge')
  const birth = () => {
    for (let visit = 0; visit < 128 && !observer.read().birth; visit++) tick(world, 1 / 12, clock)
    assert.ok(observer.read().birth, 'actual cast must reach effect allocation within the finite fixture')
    return world.effects.find(effect => effect.bridge)
  }
  const consume = effect => {
    const group = { parent: scene.ground }; scene.fxMeshes.set(effect.id, group)
    assert.equal(scene.animateFx(group, effect), 'effect-return')
  }
  const commit = text => { element.textContent = text ?? `✧${world.message}`; currentElement = element; mutation() }
  const restore = () => {
    const result = observer.close()
    assert.equal(disconnected, true); assert.equal(window.landBridgeFeedback, undefined)
    for (const entry of descriptors) assert.deepEqual(Object.getOwnPropertyDescriptor(entry.owner, entry.key), entry.descriptor)
    assert.equal(listeners.length, 0)
    return result
  }
  return { world, scene, actor, calls, observer, fire, birth, consume, commit, restore, element, style, report }
}

test('actual Bridge input, cast, tick, consumed effect and first DOM commit stay linked', async t => {
  const f = fixture(t), delivery = await f.fire()
  assert.equal(delivery.before.stock, 1); assert.equal(delivery.after.stock, 0)
  assert.deepEqual(delivery.pointer.events[1].picks.map(pick => [pick.owner, pick.name]), [['scene', 'pick']])
  assert.equal(f.observer.read().birth, null)
  const effect = f.birth(), birth = f.observer.read().birth
  assert.equal(birth.projectile.id, delivery.after.projectiles[0].id); assert.equal(birth.effect.bridge.turn, 0)
  assert.equal(birth.after.message, 'Land Bridge cast.'); assert.equal(birth.after.messageUntil, birth.after.time + 9)
  f.consume(effect); f.commit()
  const first = f.observer.read().firstVisible
  assert.equal(first.effectId, effect.id); assert.equal(first.visible, true)
  tick(f.world, 1 / 12, f.scene.gameClock); f.commit()
  assert.deepEqual(f.observer.read().firstVisible, first, 'later natural commits cannot replace the first visible record')
  const result = f.restore(); assert.equal(result.restored, true); assert.deepEqual(result.errors, [])
})

test('hidden, clipped and unrelated DOM never substitutes for visible feedback', async t => {
  const f = fixture(t); await f.fire(); f.consume(f.birth())
  f.commit('✧Land Bridge received. 1 shots ready.'); assert.equal(f.observer.read().firstVisible, null)
  f.style.opacity = '0'; f.commit(); assert.equal(f.observer.read().firstVisible, null)
  f.style.opacity = '1'; f.element.hidden = true; f.commit(); assert.equal(f.observer.read().firstVisible, null)
  f.element.hidden = false; const rect = f.element.getBoundingClientRect
  f.element.getBoundingClientRect = () => ({ ...rect(), right: 1500 }); f.commit(); assert.equal(f.observer.read().firstVisible, null)
  f.element.getBoundingClientRect = rect; f.commit(); assert.equal(f.observer.read().firstVisible.visible, true)
  assert.deepEqual(f.restore().errors, [])
})

test('DOM success without actual effect consumption is rejected with first failure retained', async t => {
  const f = fixture(t); await f.fire(); f.birth(); f.commit()
  assert.match(f.observer.status().errors[0], /actual consumed effect/)
  assert.equal(f.observer.read().firstVisible, null); assert.equal(f.restore().restored, false)
})

test('route notice and an expired deadline cannot certify visible success', async t => {
  const f = fixture(t); await f.fire(); f.consume(f.birth())
  f.world.routeNotice = { flags: 0x200000, message: 603, serial: 1 }; f.commit()
  f.world.routeNotice = null; f.world.messageUntil = f.world.time; f.commit()
  assert.equal(f.observer.read().firstVisible, null)
  assert.equal(f.restore().errors.length, 2)
})

test('diagnostic failure does not suppress a callback or change its primitive throw', t => {
  const f = fixture(t, { invalidBeforeRead: true, originalThrow: true })
  let caught = false
  try { f.scene.gameClock.beforeTurn('arg') } catch (error) { caught = true; assert.equal(error, null) }
  assert.equal(caught, true); assert.deepEqual(f.calls, [['before', ['arg']]])
  assert.match(f.restore().errors[0], /Ordinary M1 state changed/)
})

test('post-arm save failure retains primitive cause and cleans the sole pointer owner', async t => {
  const f = fixture(t, { saveThrow: true })
  await assert.rejects(f.fire(), error => error === 'save-primary')
  assert.equal(f.world.shots.bridge, 1); assert.equal(f.observer.read().birth, null)
  assert.equal(f.restore().restored, true)
})

test('a replaced effect controller is rejected at the actual consumer', async t => {
  const f = fixture(t); await f.fire(); const effect = f.birth(); effect.bridge = { ...effect.bridge }; f.consume(effect)
  assert.match(f.restore().errors[0], /consumer ownership differs/)
})

test('a foreign wrapper is preserved and cleanup is reported as failed', t => {
  const f = fixture(t), replacement = () => {}
  f.scene.animateFx = replacement
  const result = f.observer.close()
  assert.equal(result.restored, false); assert.equal(f.scene.animateFx, replacement)
  assert.match(result.errors[0], /ownership changed: animateFx/)
})

test('current source labels, native gates, producer, consumer and owned harness compose', () => {
  const page = source('app/page.tsx'), turn = source('app/world-turn.ts'), scene = source('app/scene.ts')
  for (const label of ['Select and focus shaman', 'Resume game', 'Pause game']) assert.ok(page.includes(label))
  assert.match(inputSource, /if \(scene\.world\.inputMask \|\| scene\.overviewStage\) return/)
  assert.ok(page.indexOf('if (world.inputMask)') < page.indexOf("SPELLS.find(s => s.key === e.key"))
  assert.match(page, /ready && !routeNotice && world\.messageUntil > world\.time/)
  assert.match(page, /className="world-message" role="status"/)
  assert.ok(turn.indexOf('if (fx.bridge)') < turn.indexOf('processProjectiles(w)'))
  assert.ok(scene.indexOf('this.updateEffectsFrame()') < scene.indexOf('this.updateHudFrame(now, dt)'))
  assert.match(source('app/scene-hud-runtime.ts'), /scene\.uiTimer > 0\.2/)
  assert.match(source('app/spell-effects-runtime.ts'), /tell\(w, 'Land Bridge cast\.'\)/)
  assert.match(source('app/live-command.ts'), /w\.messageUntil = w\.time \+ 9/)
  assert.equal(typeof scenario, 'function')
  const options = parseOptions(['--game-root', '/review-only', '--scenario', '/review-only/scripts/local-render/land-bridge-feedback.mjs',
    '--browser', '/review-only/browser154', '--profile', '/review-only/work/local-render-profiles/bridge-feedback',
    '--output', '/review-only/work/orchestration/bridge-feedback', '--port', '4199', '--mission', '1', '--timeout', '420000'])
  assert.equal(options.timeout, 420000); assert.equal(launchOptions(options.browserPath).chromiumSandbox, true)
})

test('all proposal inputs match their frozen source and borrowed helpers remain exact', () => {
  const pins = JSON.parse(source('qa/land-bridge-feedback/source-correspondence.json'))
  for (const [path, digest] of Object.entries(pins.inputs))
    assert.equal(createHash('sha256').update(source(path)).digest('hex'), digest, path)
  const gitSource = (commit, path) => execFileSync('git', ['show', `${commit}:${path}`],
    { cwd: new URL('../../', import.meta.url), encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 })
  for (const path of pins.borrowedUnchanged) assert.equal(source(path), gitSource(pins.borrowedFrom, path))
  assert.equal(source('app/original-messages.json'), gitSource(pins.mainBase, 'app/original-messages.json'))
  assert.equal(source('app/spell-effects-runtime.ts'), gitSource(pins.mainBase, 'app/spell-effects-runtime.ts')
    .replace('The earth rises. Lead your followers across the new Land Bridge.', 'Land Bridge cast.'))
})
