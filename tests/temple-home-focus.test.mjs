// Controlled caller coverage; DOM layout, trusted event flags and frame delivery
// are supplied. Failed ordinary01 did not retain its exact failure-time camera.
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { tooltipCallerFixture } from './support/tooltip-scene.mjs'
import { supplyPanelDom } from './support/camp-panel-scene.mjs'
import { createMission1VaultInput } from '../scripts/local-render/mission1-vault-input.mjs'
import { armTempleHomeFocus } from '../scripts/local-render/mission3-temple-witness.mjs'
import {
  focusTempleHome,
  assertTempleHomeFocus,
} from '../scripts/local-render/mission3-temple-checkpoint.mjs'

const nop = () => {}
function globals(t, values) {
  for (const [name, value] of Object.entries(values)) {
    const before = Object.getOwnPropertyDescriptor(globalThis, name)
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value })
    t.after(() =>
      before ? Object.defineProperty(globalThis, name, before) : delete globalThis[name]
    )
  }
}
function dom() {
  const listeners = [],
    button = { disabled: false, tagName: 'BUTTON', getAttribute: () => 'Select brave' }
  button.closest = () => button
  return {
    button,
    listeners,
    addEventListener(type, fn, capture = false) {
      listeners.push({ type, fn, capture })
    },
    removeEventListener(type, fn, capture = false) {
      const i = listeners.findIndex(
        row => row.type === type && row.fn === fn && row.capture === capture
      )
      if (i >= 0) listeners.splice(i, 1)
    },
    fire(event, handler) {
      for (const row of [...listeners].filter(row => row.capture)) row.fn(event)
      handler(event)
      for (const row of [...listeners].filter(row => !row.capture)) row.fn(event)
    },
  }
}
function actualFollowerControl(scene) {
  const source = ts.createSourceFile(
    'page.tsx',
    readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8'),
    ts.ScriptTarget.Latest,
    true
  )
  let declaration
  const walk = node => {
    if (ts.isFunctionDeclaration(node) && node.name?.text === 'followerControl') declaration = node
    ts.forEachChild(node, walk)
  }
  walk(source)
  assert(declaration)
  const code = ts.transpileModule(declaration.getText(source), {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText
  return Function(
    'engine',
    'followerPress',
    `${code};return followerControl`
  )(
    { current: scene },
    { current: null }
  )(2)
}
async function evaluate(fn, arg) {
  return Function(
    'imports',
    `return (${fn.toString().replaceAll('import(', 'imports(')})`
  )(async path => {
    assert(['/app/minimap.ts', '/qa/erosion-ordinary/minimap-input.mjs'].includes(path))
    return import(new URL('..' + path, import.meta.url))
  })(arg)
}

test('public Page Brave contextmenu focuses home while preserving the actual selected Shaman order', async t => {
  const f = await tooltipCallerFixture(t, {
    level: 3,
    prepareTarget: ({ world }) => world.buildings.find(b => b.team === 'blue' && b.kind === 'hut'),
  })
  const { scene, world, api } = f,
    doc = dom(),
    shaman = world.units.find(u => u.kind === 'shaman' && u.team === 'blue')
  const { currentPersonOrder } = await import('../app/person-orders.ts')
  const { createCameraMotion, stepCameraMotion } = await import('../app/camera-motion.ts')
  world.speed = 1
  api.select(world, 'shaman')
  assert(
    api.command(
      world,
      world.shrines.find(s => s.kind === 'vault')
    )
  )
  for (let i = 0; i < 4000 && !world.unlockedTemple; i++) f.frame(1 / 12)
  assert(world.unlockedTemple)
  api.select(world, 'shaman')
  Object.assign(scene, {
    hudFocus: Array(8).fill(0),
    cameraMotion: createCameraMotion(),
    cameraPosition: { ...api.nativePosition(world, shaman), angle: 1148 },
    cameraBearing: (1148 * Math.PI) / 1024,
    captureCamera: nop,
    resultCamera: { active: 0 },
    viewTransition: null,
    mini: {
      width: 100,
      height: 96,
      getAttribute: () => null,
      getBoundingClientRect: () => ({ x: 0, y: 0, width: 200, height: 192 }),
    },
  })
  scene.viewPoint = { x: shaman.x, z: shaman.z }
  const read = () => ({
    turn: world.turn,
    selected: [...world.selected],
    sceneMatches: true,
    units: [
      (() => {
        const p =
          shaman.builder?.person ??
          shaman.flight ??
          shaman.fight?.motion ??
          shaman.native ??
          shaman.entry?.person
        return {
          id: shaman.id,
          x: shaman.x,
          z: shaman.z,
          work: shaman.work,
          inside: shaman.inside,
          orderId: p.immediateCommand || p.commands[p.commandCursor],
          order: structuredClone(currentPersonOrder(world.buildingOrders, p)),
        }
      })(),
    ],
  })
  const ownership = (x, y) => (y >= 170 && x >= 6 && x < 192 ? doc.button : scene.mini)
  doc.elementFromPoint = ownership
  globals(t, {
    document: doc,
    window: { testSceneRef: { current: scene }, m3TempleRoute: { read } },
  })
  supplyPanelDom(t, scene)
  scene.container.insertBefore = nop
  const create = doc.createElement
  doc.createElement = tag => {
    const element = create(tag)
    element.insertBefore = child => element.appendChild(child)
    return element
  }
  const control = actualFollowerControl(scene),
    clicks = [],
    report = { actions: [] }
  const page = {
    evaluate,
    async waitForFunction(predicate) {
      for (let i = 0; i < 1000 && !predicate(); i++) {
        stepCameraMotion(scene.cameraMotion, scene.cameraPosition, 0, { rotate: nop, globe: nop })
        scene.viewPoint = api.browserPosition(scene.cameraPosition)
      }
      assert(predicate())
    },
    getByRole(role, options) {
      assert.equal(role, 'button')
      assert.equal(options.name, 'Select brave')
      return {
        async click(options) {
          assert.equal(options.button, 'right')
          doc.fire(
            {
              type: 'contextmenu',
              button: 2,
              isTrusted: true,
              target: doc.button,
              currentTarget: doc.button,
              preventDefault: nop,
            },
            control.onContextMenu
          )
        },
      }
    },
    mouse: {
      async click(x, y) {
        assert.equal(ownership(x, y), scene.mini)
        clicks.push({ x, y })
      },
    },
  }
  const input = createMission1VaultInput({
    page,
    report,
    save: nop,
    signal: new AbortController().signal,
    originalShamanId: shaman.id,
  })
  await focusTempleHome({ page, input, report, save: nop, shamanId: shaman.id })
  assertTempleHomeFocus(report.homeFocus, shaman.id)
  assert.deepEqual(doc.listeners, [])
  assert.equal(window.finishTempleHomeFocus, undefined)
  await input.view({ x: 35, z: 70 })
  assert.equal(clicks.length, 1)
  const probe = report.actions.find(row => row.label === 'minimap-probe')
  assert(probe.hit && probe.hit.distance <= 2048)
  assert(probe.diagnostics.nearestOwned.owned)
  assert.deepEqual(world.selected, [shaman.id])
  const source = readFileSync(
    new URL('../scripts/local-render/mission3-temple-checkpoint.mjs', import.meta.url),
    'utf8'
  )
  assert.match(
    source,
    /await focusTempleHome\(\{ page, input, report, save, shamanId \}\)\s+await input.view\(\{ x: 35, z: 70 \}\)\s+const movement = await input.moveGround\(\{ x: 35, z: 70 \}\)/
  )
  for (const mutate of [
    r => (r.events[0].trusted = false),
    r => (r.calls[1].target.kind = 'warrior'),
    r => r.events[0].after.shaman.orderId++,
    r => (r.events[0].after.selected = []),
  ]) {
    const changed = structuredClone(report.homeFocus)
    mutate(changed)
    assert.throws(() => assertTempleHomeFocus(changed, shaman.id))
  }
})

test('maintained minimap view retains an exact rejected geometry and never clicks a covered candidate', async t => {
  const mini = {
    width: 100,
    height: 96,
    getAttribute: () => null,
    getBoundingClientRect: () => ({ x: 0, y: 0, width: 200, height: 192 }),
  }
  const button = { tagName: 'BUTTON', getAttribute: () => 'buildings B' }
  const scene = {
    mini,
    world: { inputMask: 0, turn: 1 },
    cameraMotion: { active: 0 },
    resultCamera: { active: 0 },
    viewTransition: null,
    viewPoint: { x: -35, z: -124 },
    cameraBearing: (1148 * Math.PI) / 1024,
  }
  const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8')
  assert.match(css, /\.dock-tabs\{position:absolute;left:3px;top:85px;/)
  globals(t, {
    window: { testSceneRef: { current: scene } },
    document: { elementFromPoint: (x, y) => (y >= 170 && x >= 6 && x < 192 ? button : mini) },
  })
  const report = { actions: [] }
  let clicks = 0,
    saves = 0
  const input = createMission1VaultInput({
    page: {
      evaluate,
      waitForFunction: async fn => assert(fn()),
      mouse: { click: async () => clicks++ },
    },
    report,
    save: () => saves++,
    signal: new AbortController().signal,
  })
  await assert.rejects(input.view({ x: 35, z: 70 }), /No owned minimap input/)
  assert.equal(clicks, 0)
  assert.equal(saves, 1)
  const { hit, diagnostics: d } = report.actions[0]
  assert.equal(hit, null)
  assert.equal(d.geometry.maxDistance, 2048)
  assert.deepEqual(d.geometry.center, { x: -6912, y: 29696 })
  assert.equal(d.projected, 96 * 92)
  assert(d.nearestProjected.distance < 2048 && d.nearestProjected.owned === false)
  assert(d.nearestOwned.distance > 2048 && d.nearestOwned.owned)
})

test('home focus observation forwards once through capture faults, preserves throws and cleans independently', t => {
  const doc = dom(),
    marker = Error('original producer failure'),
    scene = {
      world: { units: [] },
      hudFocus: [],
      chooseFollowers() {
        return this
      },
      focus() {
        throw marker
      },
    }
  const original = scene.chooseFollowers,
    originalFocus = scene.focus
  globals(t, {
    document: doc,
    window: {
      testSceneRef: { current: scene },
      m3TempleRoute: {
        read: () => {
          throw Error('capture failed')
        },
      },
    },
  })
  armTempleHomeFocus(46)
  assert.equal(scene.chooseFollowers(2, {}, true), scene)
  assert.throws(
    () => scene.focus({ x: 1, z: 2 }),
    error => error === marker
  )
  const remove = doc.removeEventListener
  doc.removeEventListener = function (...args) {
    remove.apply(this, args)
    if (!args[2]) throw Error('cleanup failed')
  }
  const foreign = () => 'foreign'
  scene.focus = foreign
  const receipt = window.finishTempleHomeFocus()
  assert.equal(scene.chooseFollowers, original)
  assert.equal(scene.focus, foreign)
  assert.notEqual(scene.focus, originalFocus)
  assert.deepEqual(doc.listeners, [])
  assert(receipt.errors.some(e => e.includes('capture failed')))
  assert(receipt.errors.some(e => e.includes('cleanup failed')))
  assert(receipt.errors.some(e => e.includes('owner changed')))
  assert.equal(window.finishTempleHomeFocus, undefined)
  const frozen = { value: originalFocus, writable: false, configurable: true }
  Object.defineProperty(scene, 'focus', frozen)
  assert.throws(() => armTempleHomeFocus(46), /read only|Cannot assign/)
  assert.equal(scene.chooseFollowers, original)
  assert.equal(scene.focus, originalFocus)
  assert.deepEqual(doc.listeners, [])
})

test('home focus host retains the primary click failure and separate cleanup failure', async () => {
  const primary = Error('click failed'),
    report = {},
    page = {
      evaluate: async fn => {
        if (fn === armTempleHomeFocus) return
        throw Error('export failed')
      },
      getByRole: () => ({
        click: async () => {
          throw primary
        },
      }),
    }
  await assert.rejects(
    focusTempleHome({ page, input: { action: (_, fn) => fn() }, report, save: nop, shamanId: 46 }),
    error => error === primary
  )
  assert.match(report.homeFocusFailure, /click failed/)
  assert.match(report.homeFocusCleanupErrors[0], /export failed/)
})
