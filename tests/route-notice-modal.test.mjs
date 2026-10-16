import test from 'node:test'
import assert from 'node:assert/strict'
import ts from 'typescript'
import { requestTutorial } from '../app/model.ts'
import { pageNode, pageSource, evaluatePage, pageNearby } from './support/follower-nearby-page.mjs'

const notice = pageNode(node => ts.isJsxElement(node) &&
  node.openingElement.attributes.properties.some(attribute =>
    attribute.name?.getText(pageSource) === 'className' &&
    attribute.initializer?.text === 'world-message route-notice'))

// Execute Home's shipped JSX and menu handlers; this does not simulate CSS time.
function fixture(paused = false) {
  const makeWorld = () => ({ paused, routeNotice: { serial: 1 }, castingTribes: [{ flags: 0 }],
    manaWorld: { gameFlags: 0 }, inputMask: 0 })
  let world = makeWorld(), menu = false, selectorOpen = false
  const scene = { world, cancelNearbyFollowers() {}, setModalSuspended(value) { this.modalSuspended = value } }
  const store = { getWorld: () => world, change: action => action(world) }
  const page = pageNearby(scene, { store, setMenu(value) { menu = value; if (value) selectorOpen = false },
    setSelectorOpen(value) { selectorOpen = value } })
  const render = () => evaluatePage(notice.getText(pageSource), {
    store, world, routeNotice: world.routeNotice, menu, selectorOpen,
    menuSession: page.bindings.menuSession, ROUTE_FAILURE_TEXT: 'Route failure',
  })
  return { page, scene, render, world: () => world,
    inspect() { menu = false; page.openSelector() },
    replace() { world = makeWorld(); return world },
  }
}

for (const paused of [false, true]) {
  test(`Home keeps the notice through menu/selector/reopen and restores prior pause=${paused}`, () => {
    const ui = fixture(paused), original = ui.world().routeNotice
    ui.page.openMenu()
    const session = ui.page.bindings.menuSession.current
    for (const action of [() => {}, () => ui.inspect(), () => ui.page.openMenu()]) {
      action()
      assert.equal(ui.page.bindings.menuSession.current, session)
      assert.equal(ui.scene.modalSuspended, true)
      const element = ui.render()
      assert.equal(element.props.style.animationPlayState, 'paused')
      assert.equal(ui.world().routeNotice, original)
    }
    ui.page.closeMenu()
    assert.equal(ui.world().paused, paused)
    assert.equal(ui.scene.modalSuspended, false)
    assert.notEqual(ui.render().props.style.animationPlayState, 'paused')
    ui.page.openMenu()
    assert.equal(ui.render().props.style.animationPlayState, 'paused')
    ui.page.closeMenu()
    ui.render().props.onAnimationEnd()
    assert.equal(ui.world().routeNotice, null)
  })
}

test('ordinary game pause without a menu retains the presentation timer', () => {
  const ui = fixture(true)
  assert.equal(ui.page.bindings.menuSession.current, null)
  assert.notEqual(ui.render().props.style.animationPlayState, 'paused')
  ui.render().props.onAnimationEnd()
  assert.equal(ui.world().routeNotice, null)
})

test('an obsolete animation callback cannot consume a replacement world notice with the same serial', () => {
  const ui = fixture(), expired = ui.render().props.onAnimationEnd
  const replacement = ui.replace(), retained = replacement.routeNotice
  expired()
  assert.equal(replacement.routeNotice, retained)
})

test('a canceled notice callback cannot consume a newly issued notice', () => {
  const ui = fixture(), expired = ui.render().props.onAnimationEnd
  ui.world().routeNotice = { serial: 2 }
  expired()
  assert.equal(ui.world().routeNotice.serial, 2)
})

test('actual producer serial reuse does not give an old callback ownership of a new notice', () => {
  const ui = fixture()
  ui.world().routeNotice = null
  requestTutorial(ui.world(), 0x200000, 603)
  const first = ui.world().routeNotice, complete = ui.render().props.onAnimationEnd
  assert.equal(first.serial, 1)
  complete()
  assert.equal(ui.world().routeNotice, null)
  requestTutorial(ui.world(), 0x200000, 603)
  const next = ui.world().routeNotice
  assert.equal(next.serial, first.serial)
  assert.notEqual(next, first)
  complete()
  assert.equal(ui.world().routeNotice, next)
})
