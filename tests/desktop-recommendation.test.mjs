import test from 'node:test'
import assert from 'node:assert/strict'
import ts from 'typescript'
import { evaluatePage, pageNearby, pageNode, pageSource } from './support/follower-nearby-page.mjs'

const advisory = pageNode(node => ts.isJsxElement(node) &&
  node.openingElement.tagName.getText(pageSource) === 'aside' &&
  node.openingElement.attributes.properties.some(attribute =>
    attribute.name?.getText(pageSource) === 'className' &&
    attribute.initializer?.text === 'desktop-recommendation'))

function fixture(paused) {
  let world = { paused, inputMask: 0, manaWorld: { gameFlags: 0 }, castingTribes: [{ flags: 0 }] }
  let notice = true
  const scene = { world, cancelNearbyFollowers() {}, setModalSuspended(value) { this.modalSuspended = value } }
  const store = { getWorld: () => world, change: action => action(world) }
  const page = pageNearby(scene, { store })
  const render = () => evaluatePage(advisory.getText(pageSource), {
    store, setDesktopNotice: value => { notice = value },
  })
  const dismiss = () => render().children.find(child => child?.type === 'button').props.onClick()
  return { page, scene, store, dismiss, get notice() { return notice }, replace(next) { world = next } }
}

for (const paused of [false, true]) {
  test(`advisory dismissal and repeated activation preserve the ${paused ? 'paused' : 'running'} world`, () => {
    const ui = fixture(paused), world = ui.store.getWorld(), before = structuredClone(world)
    ui.dismiss(); ui.dismiss()
    assert.equal(ui.notice, false)
    assert.equal(ui.store.getWorld(), world)
    assert.deepEqual(world, before)
  })
  test(`advisory does not release menu/selector suspension or overwrite captured pause=${paused}`, () => {
    const ui = fixture(paused)
    ui.page.openMenu(); ui.page.openSelector()
    const session = ui.page.bindings.menuSession.current
    ui.dismiss(); ui.dismiss()
    assert.equal(ui.store.getWorld().paused, true)
    assert.equal(ui.scene.modalSuspended, true)
    assert.equal(ui.page.bindings.menuSession.current, session)
    assert.equal(session.paused, paused)
    ui.page.closeMenu()
    assert.equal(ui.store.getWorld().paused, paused)
  })
  test(`late advisory activation cannot change a replacement world with paused=${paused}`, () => {
    const ui = fixture(!paused), old = ui.store.getWorld()
    const replacement = { paused, inputMask: 1 }
    ui.replace(replacement)
    ui.dismiss()
    assert.deepEqual(replacement, { paused, inputMask: 1 })
    assert.equal(old.paused, !paused)
  })
}
