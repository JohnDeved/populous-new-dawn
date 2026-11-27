import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { createStartedWorld } from './level-start-fixture.mjs'
import {
  pageEffect,
  pageNode,
  pageSource,
  evaluatePage,
  noOp,
  messageBoxBindings,
} from './support/follower-nearby-page.mjs'
import { guardShaman, SPELLS, rotateBuildingPlan, resetGuardPostChain, tick } from '../app/model.ts'
import { interruptFlyby } from '../app/flyby.ts'
import { spellHudVisibility } from '../app/spell-visibility.ts'
import { followerGroupShortcut } from '../app/follower-groups.ts'
import {
  quickCameraAction,
  quickCameraTarget,
  overviewShortcut,
} from '../app/quick-camera-shortcuts.ts'

// Execute the actual public Skip introduction owner without importing its
// unrelated browser-only sky/texture modules into Node.
const source = readFileSync(new URL('../app/scene-camera-runtime.ts', import.meta.url), 'utf8')
const start = source.indexOf('export function skipIntroduction(')
const end = source.indexOf('export function updateCameraMotion(', start)
assert.ok(start >= 0 && end > start)
const skipIntroduction = evaluatePage(source.slice(start, end).replace('export ', ''), {
  interruptFlyby,
})

function keyboard({ plan = true, flyby = false } = {}) {
  const world = createStartedWorld(1),
    listeners = new Map()
  const scene = { world, flybyCamera: { x: 0, y: 0, angle: 0, zoom: 0 }, onChange: noOp }
  scene.skipIntroduction = () => skipIntroduction(scene)
  if (!flyby) scene.skipIntroduction()
  const store = { getWorld: () => world, change: action => action(world) },
    sounds = []
  if (plan) {
    // Invoke the shipped building-card click owner; no copied mode-toggle implementation.
    const attribute = pageNode(
      node =>
        ts.isJsxAttribute(node) &&
        node.name.getText(pageSource) === 'onClick' &&
        node.initializer?.getText(pageSource).includes('w.mode = w.mode === b.id ? null : b.id')
    )
    evaluatePage(attribute.initializer.expression.getText(pageSource), {
      store,
      b: { id: 'hut' },
      resetGuardPostChain,
    })({ shiftKey: false })
    assert.equal(world.mode, 'hut')
  }
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
    store,
    window: {
      addEventListener: (name, fn) => listeners.set(name, fn),
      removeEventListener: name => listeners.delete(name),
    },
    setTab: noOp,
    engine: { current: scene },
    audio: { current: { cue: cue => sounds.push(cue) } },
    update: noOp,
    openMenu: noOp,
    cancelInteraction: noOp,
    guardShaman,
    HOME: {},
    tutorialLevel: 79,
    rotateBuildingPlan,
    quickCameraAction,
    quickCameraTarget,
    overviewShortcut,
  })()
  return {
    world,
    sounds,
    cleanup,
    key(extra = {}) {
      listeners.get('keydown')({
        key: ' ',
        code: 'Space',
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

test('fresh plain Space rotates the selected building once per press and preserves pause', () => {
  const k = keyboard()
  for (let i = 1; i <= 4; i++) {
    k.key()
    assert.equal(k.world.buildingDirections.hut, i & 3)
    assert.equal(k.world.paused, false)
    const before = structuredClone(k.world)
    k.key({ repeat: true })
    assert.deepEqual(k.world, before)
  }
  assert.deepEqual(k.sounds, [0x26, 0x26, 0x26, 0x26])
  k.cleanup()
})

for (const paused of [false, true])
  test(`Shift+Space preserves the complete building-plan world when paused=${paused}`, () => {
    const k = keyboard()
    k.world.paused = paused
    const before = structuredClone(k.world)
    k.key({ shiftKey: true })
    assert.deepEqual(k.world, before, 'Rejected rotation must not fall through to pause')
    assert.deepEqual(k.sounds, [])
    k.cleanup()
  })

for (const extra of [{ ctrlKey: true }, { altKey: true }, { metaKey: true }, { repeat: true }])
  test(`building rotation preserves existing exclusion ${JSON.stringify(extra)}`, () => {
    const k = keyboard(),
      before = structuredClone(k.world)
    k.key(extra)
    assert.deepEqual(k.world, before)
    assert.deepEqual(k.sounds, [])
    k.cleanup()
  })

test('Shift+Space without a building plan retains the existing browser pause shortcut', () => {
  const k = keyboard({ plan: false })
  k.key({ shiftKey: true })
  assert.equal(k.world.paused, true)
  k.key({ shiftKey: true })
  assert.equal(k.world.paused, false)
  assert.deepEqual(k.sounds, [])
  k.cleanup()
})

test('Shift+Space still reaches the existing introductory flyby skip before rotation admission', () => {
  const k = keyboard({ plan: false, flyby: true })
  assert.ok(k.world.inputMask)
  assert.ok(k.world.flyby.flags & 1)
  const directions = structuredClone(k.world.buildingDirections)
  k.key({ shiftKey: true })
  assert.equal(k.world.inputMask, 0)
  assert.equal(k.world.flyby.flags & 1, 0)
  assert.deepEqual(k.world.buildingDirections, directions)
  assert.deepEqual(k.sounds, [])
  k.cleanup()
})

test('bare Space does not freeze the visible victory result background', () => {
  const k = keyboard({ plan: false })
  try {
    // Supply the authored outcome condition; ordinary tick publishes victory.
    k.world.land.landFlags |= 0x2000000
    tick(k.world, 1 / 12)
    assert.equal(k.world.status, 'won')
    assert.equal(k.world.outcome.cameraPlaying, false)
    let prevented = false
    k.key({ preventDefault: () => { prevented = true } })
    const turn = k.world.turn
    tick(k.world, 1 / 12)
    assert.equal(k.world.turn, turn + 1, 'bare Space must not freeze the result background')
    assert.equal(k.world.paused, false)
    assert.equal(prevented, false)
  } finally {
    k.cleanup()
  }
})

test('Space still toggles Pause while victory camera keeps the result hidden', () => {
  const k = keyboard({ plan: false })
  try {
    k.world.land.landFlags |= 0x2000000
    tick(k.world, 1 / 12)
    assert.equal(k.world.status, 'won')
    k.world.outcome.cameraPlaying = true
    k.key()
    assert.equal(k.world.paused, true)
    k.key()
    assert.equal(k.world.paused, false)
  } finally {
    k.cleanup()
  }
})
