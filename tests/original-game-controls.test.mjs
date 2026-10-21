import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, readdirSync } from 'node:fs'
import ts from 'typescript'
import { evaluatePage, pageButton, pageEffect, pageNode, pageSource } from './support/follower-nearby-page.mjs'

test('actual HUD has one original Menu entry and retains only browser audio recovery in its footer', () => {
  const source = pageSource.getFullText()
  assert.doesNotMatch(source, /aria-label="Game settings"|aria-label=\{world\.paused \? 'Resume game'/)
  const openMenu = () => {}, menu = evaluatePage(pageButton(['help-button']).getText(pageSource), { openMenu })
  assert.equal(menu.type, 'button')
  assert.equal(menu.props['aria-label'], 'Menu')
  assert.equal(menu.props.onClick, openMenu)
  assert.equal(menu.props.tabIndex, undefined, 'The real button remains in ordinary keyboard navigation')
  const footer = pageNode(node => ts.isJsxElement(node) && node.openingElement.attributes.properties.some(
    attribute => attribute.name?.getText(pageSource) === 'className' && attribute.initializer?.text === 'top-actions'))
  for (const sound of [false, true]) {
    const toggleSound = () => {}, rendered = evaluatePage(footer.getText(pageSource), { sound, toggleSound, soundPending: false })
    assert.equal(rendered.children.length, 1)
    const control = rendered.children[0]
    assert.equal(control.type, 'button')
    assert.equal(control.props['aria-label'], sound ? 'Mute sound' : 'Enable sound')
    assert.equal(control.props.onClick, toggleSound)
  }
})

function keyboardFixture(overrides = {}) {
  const world = { paused: false, inputMask: 0, flyby: { flags: 0 }, outcome: { level: 1 } }
  const calls = { skip: 0, rotate: 0, cue: 0, menu: 0 }
  let key, rotate = false
  const bindings = {
    ready: true, menu: false, cheatsOpen: false, messageDetails: { current: new Map() }, world,
    window: { addEventListener(_type, listener) { key = listener } },
    store: { getWorld: () => world, change: action => action(world) },
    engine: { current: { skipIntroduction() { calls.skip++ } } },
    audio: { current: { cue(value) { assert.equal(value, 0x26); calls.cue++ } } },
    rotateBuildingPlan() { calls.rotate++; return rotate },
    SPELLS: [], tutorialLevel: 79, openMenu() { calls.menu++ }, update() {}, ...overrides,
  }
  pageEffect("window.addEventListener('keydown', key)", bindings)()
  return { world, calls, rotate(value) { rotate = value }, press(extra = {}) {
    let prevented = false
    key({ key: ' ', code: 'Space', repeat: false, target: { closest: () => null },
      preventDefault() { prevented = true }, ...extra })
    return prevented
  } }
}

test('actual Space remains pause/resume and repeat-safe, but rotates an active building plan instead', () => {
  const f = keyboardFixture()
  assert.equal(f.press(), true); assert.equal(f.world.paused, true)
  f.press({ repeat: true }); assert.equal(f.world.paused, true); assert.equal(f.calls.rotate, 1)
  f.press(); assert.equal(f.world.paused, false)
  f.rotate(true); f.press(); assert.equal(f.world.paused, false); assert.equal(f.calls.cue, 1)
  assert.equal(f.calls.menu, 0)
})

test('actual Space respects focused buttons, modal ownership, modifiers and the native introduction gate', () => {
  for (const overrides of [{ ready: false }, { menu: true }, { cheatsOpen: true },
    { messageDetails: { current: new Map([[1, { open: true }]]) } }]) {
    const f = keyboardFixture(overrides)
    assert.equal(f.press(), false); assert.equal(f.world.paused, false); assert.equal(f.calls.rotate, 0)
  }
  for (const extra of [{ ctrlKey: true }, { altKey: true }, { metaKey: true },
    { target: { closest: selector => selector === 'button' ? {} : null } },
    { target: { closest: selector => selector === 'input,dialog' ? {} : null } }]) {
    const f = keyboardFixture()
    assert.equal(f.press(extra), false); assert.equal(f.world.paused, false); assert.equal(f.calls.rotate, 0)
  }
  const f = keyboardFixture()
  f.world.inputMask = 64; f.world.flyby.flags = 1
  assert.equal(f.press(), true); assert.equal(f.calls.skip, 1); assert.equal(f.world.paused, false)
  f.world.flyby.flags = 0
  assert.equal(f.press(), false); assert.equal(f.calls.skip, 1); assert.equal(f.calls.rotate, 0)
})

test('active browser harnesses never target the retired duplicate buttons', () => {
  function inspect(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const file = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory)
      if (entry.isDirectory()) inspect(file)
      else if (entry.name.endsWith('.mjs')) {
        const source = readFileSync(file, 'utf8')
        assert.doesNotMatch(source, /getByRole\('button',\s*\{\s*name:\s*'(?:Pause game|Resume game|Game settings)'/, file.pathname)
        assert.doesNotMatch(source, /(?:input\.)?button\('(?:Pause game|Resume game|Game settings)'\)/, file.pathname)
      }
    }
  }
  inspect(new URL('../scripts/', import.meta.url))
  const input = readFileSync(new URL('../scripts/local-render/mission1-vault-input.mjs', import.meta.url), 'utf8')
  assert.match(input, /action\('Resume game', \(\) => page\.locator\('\.world-viewport'\)\.press\('Space', waitOptions\(\)\)\)/,
    'The new native input retains the original bounded action timeout and semantic receipt label')
})

test('placement fixture releases the native rotation owner before resume and reselects its Hut through the HUD', () => {
  const source = readFileSync(new URL('../scripts/tutorial-browser/scenery-placement.mjs', import.meta.url), 'utf8')
  const resume = source.slice(source.indexOf('report.repeated = await read()'))
  let previous = -1
  for (const step of ["page.keyboard.press('Escape')", 'getWorld().mode === null',
    "page.locator('.world-viewport').press('Space')", '!window.testStore.getWorld().paused',
    "button('Hut, 3 wood').click()", "getWorld().mode === 'hut'", 'page.mouse.move(invalid.x']) {
    const index = resume.indexOf(step)
    assert.ok(index > previous, `Missing or reordered native control: ${step}`)
    previous = index
  }
})

test('actual audio preference enable path leaves Sound for Game help and returns to Sound before reading sliders', async () => {
  const source = readFileSync(new URL('../scripts/check-browser-audio-preferences.mjs', import.meta.url), 'utf8')
  const start = source.indexOf("report.stage = 'real-audio-enable-gains'")
  const flow = source.slice(start, source.indexOf('assert.equal(enabled.enabled', start))
  assert.ok(flow.includes('const enabled = await assertValues'))
  let category = 'Sound', help = false, enabled = false
  const actions = [], page = {
    getByRole(role, { name, exact }) {
      assert.equal(role, 'button'); assert.equal(exact, true)
      return { async click() {
        actions.push(name)
        if (name === 'Browser compatibility and help') {
          assert.equal(category, 'Game'); assert.equal(help, false); help = true
        } else if (name === 'Back to Options') {
          assert.equal(help, true); help = false
        } else {
          assert.equal(help, false); assert.ok(['Game', 'Sound'].includes(name)); category = name
        }
      } }
    },
    locator(selector) {
      assert.equal(selector, '.audio-settings button'); assert.equal(help, true)
      return { async click() { enabled = true; actions.push('Enable sound') } }
    },
  }
  const expect = () => ({ async toHaveText(text, options) {
    assert.equal(enabled, true); assert.equal(text, '♪ Sound on'); assert.deepEqual(options, { timeout: 90000 })
  } })
  const assertValues = async (actualPage, master, music, label) => {
    assert.equal(actualPage, page); assert.equal(help, false); assert.equal(category, 'Sound')
    assert.deepEqual([master, music, label], [0.2, 0.4, 'real-audio-gains']); actions.push('Read Sound sliders')
    return { enabled }
  }
  await new Function('report', 'page', 'expect', 'assertValues', `return (async () => {${flow}})()`)(
    {}, page, expect, assertValues)
  assert.deepEqual(actions, ['Game', 'Browser compatibility and help', 'Enable sound', 'Back to Options', 'Sound', 'Read Sound sliders'])
})
