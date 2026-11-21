import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { isDeepStrictEqual } from 'node:util'
import { createStartedWorld } from './level-start-fixture.mjs'
import {
  pageEffect,
  evaluatePage,
  noOp,
  messageBoxBindings,
} from './support/follower-nearby-page.mjs'
import { selectUnit, guardShaman, SPELLS } from '../app/model.ts'
import { interruptFlyby } from '../app/flyby.ts'
import { spellHudVisibility } from '../app/spell-visibility.ts'
import { followerGroupShortcut } from '../app/follower-groups.ts'
import {
  quickCameraAction,
  quickCameraTarget,
  overviewShortcut,
} from '../app/quick-camera-shortcuts.ts'
import { currentPersonOrder } from '../app/person-orders.ts'

// Execute the actual public Skip introduction owner without importing its
// unrelated browser-only sky/texture modules into Node.
const source = readFileSync(new URL('../app/scene-camera-runtime.ts', import.meta.url), 'utf8')
const start = source.indexOf('export function skipIntroduction(')
const end = source.indexOf('export function updateCameraMotion(', start)
assert.ok(start >= 0 && end > start)
const skipIntroduction = evaluatePage(source.slice(start, end).replace('export ', ''), {
  interruptFlyby,
})

function keyboard() {
  const world = createStartedWorld(1),
    listeners = new Map()
  skipIntroduction({ world, flybyCamera: { x: 0, y: 0, angle: 0, zoom: 0 }, onChange: noOp })
  assert.equal(world.inputMask, 0)
  const brave = world.units.find(u => u.team === 'blue' && u.kind === 'brave')
  selectUnit(world, brave.id, false)
  assert.deepEqual(world.selected, [brave.id])
  const cleanup = pageEffect("window.addEventListener('keydown', key)", {
    world,
    ready: true,
    menu: false,
    cheatsOpen: false,
    selectorOpen: false,
    messageDetails: { current: new Map() },
    ...messageBoxBindings,
    SPELLS,
    spellHudVisibility,
    followerGroupShortcut,
    store: { getWorld: () => world, change: action => action(world) },
    window: {
      addEventListener: (name, fn) => listeners.set(name, fn),
      removeEventListener: name => listeners.delete(name),
    },
    setTab: noOp,
    engine: { current: { world } },
    audio: { current: null },
    update: noOp,
    openMenu: noOp,
    cancelInteraction: noOp,
    guardShaman,
    HOME: {},
    tutorialLevel: 79,
    rotateBuildingPlan: () => false,
    quickCameraAction,
    quickCameraTarget,
    overviewShortcut,
  })()
  return {
    world,
    brave,
    cleanup,
    key(extra = {}) {
      listeners.get('keydown')({
        key: 'g',
        code: 'KeyG',
        repeat: false,
        shiftKey: false,
        ctrlKey: false,
        metaKey: false,
        altKey: false,
        target: { closest: () => false },
        preventDefault: noOp,
        stopImmediatePropagation: noOp,
        ...extra,
      })
    },
  }
}

test('fresh unmodified G still queues Guard and a later fresh press replaces it', () => {
  const k = keyboard()
  k.key()
  const first = currentPersonOrder(k.world.buildingOrders, k.brave.native)
  assert.equal(first.model, 30)
  assert.equal(first.a, k.world.units.find(u => u.team === 'blue' && u.kind === 'shaman').id)
  k.key()
  const second = currentPersonOrder(k.world.buildingOrders, k.brave.native)
  assert.equal(second.model, 30)
  assert.notEqual(second, first, 'distinct presses retain ordinary replacement semantics')
  k.cleanup()
})

for (const extra of [
  { shiftKey: true, key: 'G' },
  { repeat: true },
  { ctrlKey: true },
  { altKey: true },
  { metaKey: true },
])
  test(`G rejects ${JSON.stringify(extra)} without changing the authored world`, () => {
    const k = keyboard(),
      before = structuredClone(k.world)
    k.key(extra)
    assert.ok(
      isDeepStrictEqual(k.world, before),
      'nonmatching G must not mutate any World or order-pool state'
    )
    k.cleanup()
  })

test('held G cannot allocate or reinitialize an order after the fresh press', () => {
  const k = keyboard()
  k.key()
  const order = currentPersonOrder(k.world.buildingOrders, k.brave.native)
  const before = structuredClone(k.world)
  k.key({ repeat: true })
  assert.equal(currentPersonOrder(k.world.buildingOrders, k.brave.native), order)
  assert.ok(isDeepStrictEqual(k.world, before), 'repeat retains the complete post-press world')
  k.cleanup()
})
