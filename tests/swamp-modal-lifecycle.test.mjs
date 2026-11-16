import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import vm from 'node:vm'
import ts from 'typescript'
import { removeOwnedSwamp } from '../app/swamp-removal.ts'

// Compose shipped modal setters, gesture cancellation and release handling.
// Supplied world/press and DOM/feedback ports: not a browser or page lifecycle test.
const input = readFileSync(new URL('../app/scene-input-runtime.ts', import.meta.url), 'utf8')
const sceneText = readFileSync(new URL('../app/scene.ts', import.meta.url), 'utf8')
const source = ts.createSourceFile('scene.ts', sceneText, ts.ScriptTarget.Latest, true)
const declaration = source.statements.find(n => ts.isClassDeclaration(n) && n.name?.text === 'GameScene')
const names = ['setModalSuspended', 'setMessageModal', 'invalidateModalRender']
const members = declaration.members.filter(n => names.includes(n.name?.getText(source)))
assert.equal(members.length, names.length)
const inputSource = ts.createSourceFile('input.ts', input, ts.ScriptTarget.Latest, true)
const functions = inputSource.statements.filter(n => ts.isFunctionDeclaration(n) && ['pointerUp', 'cancelPointerGesture'].includes(n.name?.text))
assert.equal(functions.length, 2)
const code = stripTypeScriptTypes(`${functions.map(n => n.getText(inputSource).replace(/^export /, '')).join('\n')}\n({ owner: new (class { ${members.map(n => n.getText(source)).join('\n')} })(), pointerUp })`)

function fixture() {
  const point = { x: 0x4000, y: 0x8000 }, feedback = [], captures = new Set([7])
  const world = {
    paused: false, status: 'playing', inputMask: 0, mode: null, selected: [],
    manaWorld: { playerTribe: 0 }, randomState: 123,
    land: { flags: new Uint16Array(16384), buildingIds: new Uint16Array(16384) },
    buildings: [], objectCells: { objects: new Map() },
    effects: [{ id: 1, age: 0, duration: Infinity, swamp: {
      center: { x: 0x4080, y: 0x8080, h: 0 }, tribe: 0, remaining: 100, counter: 1, kills: 0, variant: 0,
    } }],
  }
  const { owner, pointerUp } = vm.runInNewContext(code, {
    removeOwnedSwamp, nativePosition: (_w, p) => p, queueBuildingInspection() {},
    cancelTooltipInspection() {}, releaseFollowerGroupDisplayKeys() {},
    removeHoveredGuardPost: () => false, commandMarkerPoint: p => p, browserPosition: p => p,
    effect: () => feedback.push('marker'), cancelInteraction() { throw Error('unexpected fallback') },
  })
  Object.assign(owner, {
    world, disposed: false, modalRenderVersion: 0, modalSuspended: false, messageModal: false,
    keys: new Set(['Shift']), groupDisplay: {}, previous: 1,
    renderer: { domElement: { hasPointerCapture: id => captures.has(id), releasePointerCapture: id => captures.delete(id) } },
    cancelNearbyFollowers() {}, cancelTooltipInspection() {},
    dragActive: { value: false }, selectionOverlay: { visible: false },
    globeMotion: { dragging: false, velocity: { x: 0, y: 0 } },
    overviewStage: 0, overviewActive: false, down: { x: 10, y: 10 },
    pick: () => point, picking: { pick: () => undefined },
    onChange: () => feedback.push('change'), onSound: id => feedback.push(id),
    acknowledgePointer: () => feedback.push('ack'),
  })
  const arm = () => {
    owner.pointerGesture = { pointerId: 7, button: 2, moved: false }
    owner.pointerButtons = 2
    captures.add(7)
  }
  const release = () => pointerUp(owner, { pointerId: 7, button: 2, buttons: 0, clientX: 10, clientY: 10, shiftKey: true })
  arm()
  return { owner, world, feedback, captures, arm, release }
}

for (const setter of ['setModalSuspended', 'setMessageModal']) {
  test(`${setter} invalidates an armed Swamp press before unpaused repeated release`, () => {
    const f = fixture(), before = structuredClone(f.world)
    assert.equal(f.owner.pointerGesture.pointerId, 7)
    assert.equal(f.owner.pointerGesture.moved, false)
    f.owner[setter](true)
    // Check immediately, before close or any other action can clear ownership.
    assert.equal(f.owner.pointerGesture, null)
    assert.equal(f.owner.pointerButtons, 0)
    assert.equal(f.captures.has(7), false)
    f.release()
    assert.deepEqual(f.world, before)
    f.owner[setter](false)
    assert.equal(f.world.paused, false)
    assert.equal(f.world.inputMask, 0)
    assert.equal(f.owner.modalSuspended, false)
    assert.equal(f.owner.messageModal, false)
    f.release(); f.release()
    assert.deepEqual(f.world, before)
    assert.deepEqual(f.feedback, [])
    // Same fixture and target must still admit a fresh matching gesture.
    f.arm(); f.release()
    before.effects[0].swamp.remaining = 0
    assert.deepEqual(f.world, before)
    assert.deepEqual(f.feedback, ['marker', 'ack', 0x6a, 'change'])
  })
}

test('overlapping menu/message owners remain blocked until both close without resurrecting press', () => {
  const f = fixture(), before = structuredClone(f.world)
  f.owner.setModalSuspended(true)
  f.owner.setMessageModal(true)
  f.owner.setModalSuspended(false)
  f.release()
  assert.deepEqual(f.world, before)
  f.owner.setMessageModal(false)
  f.release()
  assert.deepEqual(f.world, before)
  assert.deepEqual(f.feedback, [])
  f.arm(); f.release()
  assert.equal(f.world.effects[0].swamp.remaining, 0)
})
