import assert from 'node:assert/strict'
import test from 'node:test'
import { createStartedWorld } from './level-start-fixture.mjs'
import { addUnit, nativePosition, setSelection } from '../app/model.ts'
import { liveCommandContext } from '../app/live-command.ts'
import { createLivePerson, registerLivePerson } from '../app/live-people.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { isStaySelectedDryTarget } from '../app/stay-selected-dry-target.ts'
import {
  startOrdinaryMoveOwner, observeOrdinaryMoveOwner, leaveOrdinaryMoveOwner,
} from '../app/stay-selected-move-owner.ts'
import { dispatchOrdinarySceneRelease } from '../app/stay-selected-scene-command.ts'
import { canOrder } from '../app/selection-runtime.ts'
import { syncLandscapeObjects, syncNativeTerrain } from '../app/world-terrain-runtime.ts'

function fixture(recipient = true) {
  const w = createStartedWorld()
  assert.equal(w.status, 'playing')
  assert.equal(w.mode, null)
  assert.equal(w.orderCursor, 0)
  w.inputMask = 0 // Supplied UI admission, not DOM coverage.
  const start = w.units.find(u => u.team === 'blue' && u.kind === 'brave')
  assert.ok(start)
  const unit = addUnit(w, 'blue', 'brave', { x: start.x, z: start.z })
  setSelection(w, [unit.id])
  const person = (unit.native = createLivePerson(w, unit))
  registerLivePerson(w, person)
  if (!recipient) {
    person.state = 17 // Retain the registered native animation owner.
    person.flags2 |= 0x100000
  }
  assert.equal(canOrder(unit), recipient)
  assert.equal(currentPersonOrder(w.buildingOrders, person), undefined)
  syncNativeTerrain(w)
  syncLandscapeObjects(w)
  let point
  for (let d = 2; d <= 12 && !point; d++)
    for (const [x, z] of [[d, 0], [0, d], [-d, 0], [0, -d], [d, d], [-d, -d]]) {
      const p = { x: unit.x + x, z: unit.z + z }
      const n = nativePosition(w, p)
      const i = ((n.y & 65535) >> 9) * 128 + ((n.x & 65535) >> 9)
      const ctx = liveCommandContext(w, p)
      if (ctx && isStaySelectedDryTarget(undefined, ctx,
        { flags: w.land.flags[i], category: w.land.categories[i] }, w.land.walkMasks[0], n)) {
        point = p
        break
      }
    }
  assert.ok(point)
  return { w, unit, person, point, owned: { kind: 'owned-unmodified-release', point } }
}

function release(w, readCanvasBounds) {
  const ctx = {
    scene: {}, world: w, canvas: {}, selected: w.selected, ordinary: true, readCanvasBounds,
  }
  const press = {
    pointerId: 7, pointerType: 'mouse', isPrimary: true, isTrusted: true,
    button: 0, buttons: 1, clientX: 10, clientY: 10, currentTarget: ctx.canvas,
    shiftKey: false, ctrlKey: false, altKey: false, metaKey: false,
  }
  return { ctx, press, event: { ...press, buttons: 0 }, token: startOrdinaryMoveOwner(ctx, press) }
}

for (const recipient of [false, true]) {
  for (const keep of [false, true]) {
    test(`owned release, recipients ${recipient}, Keep ${keep}`, () => {
      const { w, unit, person, point } = fixture(recipient)
      const { ctx, token, event } = release(w)
      assert.ok(token)
      assert.equal(dispatchOrdinarySceneRelease(token, () => ctx, event, point, true, () => keep, () => w), true)
      assert.equal(token.spent, true)
      assert.deepEqual(w.selected, keep ? [unit.id] : [])
      const order = currentPersonOrder(w.buildingOrders, person)
      if (recipient) {
        assert.equal(w.objectCells.objects.get(unit.id), person)
        assert.equal(order?.model, 3)
        assert.equal(order.flags & 1, 0)
        assert.equal(order.references, 1)
      } else {
        assert.equal(order, undefined)
      }
    })
  }
}

test('absent supplier leaves actual legacy Move and selection intact', () => {
  const { w, unit, person, point } = fixture()
  const { event } = release(w)
  assert.equal(dispatchOrdinarySceneRelease(undefined, () => assert.fail('legacy path must stay lazy'),
    event, point, true, undefined, () => w), true)
  assert.deepEqual(w.selected, [unit.id])
  assert.equal(currentPersonOrder(w.buildingOrders, person)?.model, 3)
})

for (const kind of ['changed selection', 'untrusted release', 'dirty ground', 'revoked travel', 'spent token']) {
  test(`${kind} uses the original Move path, with no deselection`, () => {
    const { w, unit, person, point } = fixture()
    const { ctx, token, event, press } = release(w)
    let current = ctx
    if (kind === 'changed selection') {
      w.selected = [...w.selected]
      current = { ...ctx, selected: w.selected }
    }
    if (kind === 'untrusted release') event.isTrusted = false
    if (kind === 'revoked travel') observeOrdinaryMoveOwner(token, { ...press, clientX: 150 })
    if (kind === 'spent token') token.spent = true
    assert.equal(dispatchOrdinarySceneRelease(token, () => current,
      event, point, kind !== 'dirty ground', () => false, () => w), true)
    assert.deepEqual(w.selected, [unit.id])
    assert.equal(currentPersonOrder(w.buildingOrders, person)?.model, 3)
  })
}

test('rejected command cannot clear selection even if release ownership was valid', () => {
  const { w, unit, person, point } = fixture()
  const { ctx, token, event } = release(w)
  assert.equal(dispatchOrdinarySceneRelease(token, () => ctx, event,
    { ...point, id: Number.MAX_SAFE_INTEGER }, true, () => false, () => w), false)
  assert.deepEqual(w.selected, [unit.id])
  assert.equal(currentPersonOrder(w.buildingOrders, person), undefined)
})

for (const matching of [false, true]) {
  test(`same-position release after ${matching ? 'owned' : 'unrelated'} canvas leave`, () => {
    const { w, unit, person, point } = fixture()
    const { ctx, token, event, press } = release(w)
    assert.ok(token)
    leaveOrdinaryMoveOwner(token, { ...press, currentTarget: matching ? ctx.canvas : {} })
    let policyReads = 0
    assert.equal(dispatchOrdinarySceneRelease(token, () => ctx, event, point, true, () => {
      policyReads++
      return false
    }, () => w), true)
    assert.equal(token.spent, true)
    assert.equal(policyReads, matching ? 0 : 1)
    assert.deepEqual(w.selected, matching ? [unit.id] : [])
    assert.equal(w.objectCells.objects.get(unit.id), person)
    const order = currentPersonOrder(w.buildingOrders, person)
    assert.equal(order?.model, 3)
    assert.equal(order.flags & 1, 0)
    assert.equal(order.references, 1)
  })
}

const capturedCanvasBounds = () => ({ left: 8, top: 8, right: 120, bottom: 120 })

for (const kind of ['outside capture move', 'inside capture move', 'matching capture loss',
  'unrelated capture loss', 'outside captured release']) {
  test(`captured scene ownership: ${kind}`, () => {
    const { w, unit, point } = fixture()
    const { ctx, token, press, event } = release(w, capturedCanvasBounds)
    assert.ok(token)
    if (kind === 'outside capture move')
      observeOrdinaryMoveOwner(token, { ...press, clientX: 7 }) // 3 px; no pointerleave supplied.
    if (kind === 'inside capture move')
      observeOrdinaryMoveOwner(token, { ...press, clientX: 8 })
    if (kind === 'matching capture loss')
      leaveOrdinaryMoveOwner(token, press) // Same invalidator used by lostpointercapture listener.
    if (kind === 'unrelated capture loss')
      leaveOrdinaryMoveOwner(token, { ...press, pointerId: press.pointerId + 1 })
    if (kind === 'outside captured release') event.clientX = 7
    let policyReads = 0
    assert.equal(dispatchOrdinarySceneRelease(token, () => ctx, event, point, true,
      () => { policyReads++; return false }, () => w), true)
    const admitted = kind === 'inside capture move' || kind === 'unrelated capture loss'
    assert.equal(policyReads, admitted ? 1 : 0)
    assert.deepEqual(w.selected, admitted ? [] : [unit.id])
  })
}
