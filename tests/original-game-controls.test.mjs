import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, readdirSync } from 'node:fs'
import { evaluatePage, pageButton, pageEffect, pageSource } from './support/follower-nearby-page.mjs'

test('actual HUD has one original Menu entry and no invented browser footer', () => {
  const source = pageSource.getFullText()
  assert.doesNotMatch(source, /aria-label="Game settings"|aria-label=\{world\.paused \? 'Resume game'/)
  const openMenu = () => {}, menu = evaluatePage(pageButton(['help-button']).getText(pageSource), { openMenu, QueryControlArt: 'NativeQueryArt' })
  assert.equal(menu.type, 'button')
  assert.equal(menu.props['aria-label'], 'Menu')
  assert.equal(menu.props.onClick, openMenu)
  assert.equal(menu.props.tabIndex, undefined, 'The real button remains in ordinary keyboard navigation')
  assert.doesNotMatch(source, /className="top-actions"|SoundControl|data-sound-control/)
  assert.match(source, /onSound: toggleSound/, 'audio unlock/retry remains in Options')
})

function keyboardFixture(overrides = {}) {
  const world = { paused: false, inputMask: 0, flyby: { flags: 0 }, outcome: { level: 1 } }
  const calls = { skip: 0, rotate: 0, cue: 0, menu: 0 }
  let key, rotate = false
  const bindings = {
    ready: true, menu: false, cheatsOpen: false, messageDetails: { current: new Map() }, world,
    globalThis: { addEventListener(_type, listener) { key = listener } },
    store: { getWorld: () => world, change: action => action(world) },
    engine: { current: { skipIntroduction() { calls.skip++ } } },
    audio: { current: { cue(value) { assert.equal(value, 0x26); calls.cue++ } } },
    rotateBuildingPlan() { calls.rotate++; return rotate },
    SPELLS: [], tutorialLevel: 79, openMenu() { calls.menu++ }, update() {}, ...overrides,
  }
  pageEffect("globalThis.addEventListener('keydown', key)", bindings)()
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
  assert.match(input, /action\('Resume game', \(\) => setWorldPaused\(page, false, waitOptions\(2500\)\)\)/,
    'The new native input retains the original bounded action timeout and semantic receipt label')
})

test('placement fixture releases the native rotation owner before resume and reselects its Hut through the HUD', () => {
  const source = readFileSync(new URL('../scripts/tutorial-browser/scenery-placement.mjs', import.meta.url), 'utf8')
  const resume = source.slice(source.indexOf('report.repeated = await read()'))
  let previous = -1
  for (const step of ["page.keyboard.press('Escape')", 'getWorld().mode === null',
    'setWorldPaused(page, false, { timeout: 15000 })', '!window.testStore.getWorld().paused',
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
  const expect = () => ({ async toHaveAccessibleName(text, options) {
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

test('actual audio checkpoint/restart sequence returns from Sound and uses each native final-action panel', async () => {
  const source = readFileSync(new URL('../scripts/check-browser-audio-preferences.mjs', import.meta.url), 'utf8')
  const start = source.indexOf("report.stage = 'checkpoint-and-restart'")
  const flow = source.slice(start, source.indexOf("report.stage = 'fresh-page-and-mission'", start))
  let panel = 'options', checkpoint = false
  const actions = [], page = { getByRole(role, { name, exact }) {
    assert.equal(role, 'button'); assert.equal(exact, true)
    return { async click() {
      actions.push(name)
      if (name === 'Back') { assert.ok(['options', 'save'].includes(panel)); panel = 'root' }
      else if (name === 'Save Game') { assert.equal(panel, 'root'); panel = 'save' }
      else if (name === 'Save checkpoint') { assert.equal(panel, 'save'); checkpoint = true }
      else if (name === 'Restart Level') { assert.equal(panel, 'root'); panel = 'restart' }
      else if (name === 'Yes') { assert.equal(panel, 'restart'); panel = 'closed' }
      else if (name === 'Load Game') { assert.equal(panel, 'root'); panel = 'load' }
      else { assert.equal(name, 'Load checkpoint'); assert.equal(panel, 'load'); assert.equal(checkpoint, true); panel = 'closed' }
    } }
  }, waitForFunction: async () => assert.equal(checkpoint, true) }
  const ready = async () => assert.equal(panel, 'closed')
  const settings = async () => { assert.equal(panel, 'closed'); panel = 'options' }
  const assertValues = async () => assert.equal(panel, 'options')
  const playbackGains = async () => assert.equal(panel, 'options')
  await new Function('report', 'page', 'ready', 'settings', 'assertValues', 'playbackGains', `return (async () => {${flow}})()`)(
    {}, page, ready, settings, assertValues, playbackGains)
  assert.deepEqual(actions, ['Back', 'Save Game', 'Save checkpoint', 'Back', 'Restart Level', 'Yes', 'Back', 'Load Game', 'Load checkpoint'])
})
