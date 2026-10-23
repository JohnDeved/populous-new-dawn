import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import ts from 'typescript'
import { evaluatePage, pageEffect, pageNode, pageSource } from './support/follower-nearby-page.mjs'

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8')

// Execute shipped Home handlers with a supplied DOM boundary. The Options
// component's direct activation, disabled/busy state and keyboard ownership are
// covered in browser-help-tips, original-options and original-pause-menu tests.
const homeMain = pageNode(node => ts.isJsxOpeningElement(node) && node.tagName.getText(pageSource) === 'main')
const homeClickCapture = homeMain.attributes.properties.find(attribute => attribute.name?.getText(pageSource) === 'onClickCapture').initializer.expression.getText(pageSource)
const loadingInteraction = pageNode(node => ts.isFunctionDeclaration(node) && node.name?.text === 'blockLoadingInteraction').getText(pageSource)
function homeClickFixture({ ready = true, inputMask = 0, hud = true, button = true, extraSelectors = [] } = {}) {
  const world = { inputMask }, focus = { active: true, blurs: 0 }
  const node = { blur() { focus.active = false; focus.blurs++ } }
  const selectors = new Set([...(hud ? ['.native-hud'] : []), ...(button ? ['button'] : []), ...extraSelectors])
  node.closest = selector => selector.split(',').some(part => selectors.has(part.trim())) ? node : null
  const blockLoadingInteraction = evaluatePage(loadingInteraction, { ready })
  const capture = evaluatePage(homeClickCapture, { world, blockLoadingInteraction })
  return { focus, click(detail = 1) {
    const result = { stopped: false, prevented: false }
    capture({ target: node, detail, stopPropagation() { result.stopped = true }, preventDefault() { result.prevented = true } })
    return result
  } }
}

test('sound has one surviving Options action, not a permanent gameplay control or obsolete exemption', () => {
  const page = read('app/page.tsx')
  assert.doesNotMatch(page, /SoundControl|data-sound-control|top-actions/)
  assert.doesNotMatch(read('app/globals.css'), /top-actions/)
  assert.doesNotMatch(read('app/campaign-popup-session.ts'), /data-sound-control/)
  assert.equal(existsSync(new URL('../app/sound-control.tsx', import.meta.url)), false)
  assert.equal(existsSync(new URL('../app/sound-control.module.css', import.meta.url)), false)
  assert.equal(page.match(/onSound: toggleSound/g)?.length, 1)
  const options = read('app/original-options.tsx')
  assert.match(options, /compatibility\.onSound/)
  assert.match(options, /disabled: compatibility\.soundPending/)
  assert.match(options, /busy: compatibility\.soundPending/)
  assert.match(options, /role="status" aria-label=\{notice\}/)
  assert.match(page, /<SpellTestMenu/, 'the explicitly exempt cheat menu remains mounted')
  assert.match(page, /togglePerformance\(\)/, 'F8 remains reachable')
})

test('Home capture keeps ordinary HUD pointer blur and keyboard focus without touching Options', () => {
  for (const detail of [0, 1, 2]) {
    const ordinary = homeClickFixture()
    assert.deepEqual(ordinary.click(detail), { stopped: false, prevented: false })
    assert.deepEqual(ordinary.focus, { active: detail === 0, blurs: detail === 0 ? 0 : 1 })
    const options = homeClickFixture({ hud: false, extraSelectors: ['[data-original-pause-menu]'] })
    assert.deepEqual(options.click(detail), { stopped: false, prevented: false })
    assert.deepEqual(options.focus, { active: true, blurs: 0 })
  }
  const background = homeClickFixture({ button: false })
  background.click(); assert.deepEqual(background.focus, { active: true, blurs: 0 })
})

test('loading and input-mask guards retain their existing recovery and menu ownership', () => {
  for (const detail of [0, 1]) {
    const loading = homeClickFixture({ ready: false })
    assert.deepEqual(loading.click(detail), { stopped: true, prevented: true })
    assert.deepEqual(loading.focus, { active: true, blurs: 0 })
  }
  for (const extraSelectors of [[], ['.top-actions'], ['[data-sound-control]']]) {
    const masked = homeClickFixture({ inputMask: 1, extraSelectors })
    assert.deepEqual(masked.click(), { stopped: true, prevented: true }, 'removed controls cannot bypass the mask')
    assert.deepEqual(masked.focus, { active: true, blurs: 0 })
  }
  for (const extraSelectors of [['.loading-world'], ['[data-fullscreen-control]'], ['[data-original-main-menu]']]) {
    const allowed = homeClickFixture({ ready: false, inputMask: 1, hud: false, extraSelectors })
    assert.deepEqual(allowed.click(), { stopped: false, prevented: false })
    assert.deepEqual(allowed.focus, { active: true, blurs: 0 })
  }
  const options = homeClickFixture({ inputMask: 1, hud: false, extraSelectors: ['[data-original-pause-menu]'] })
  assert.deepEqual(options.click(), { stopped: false, prevented: false })
})

test('actual Home activation still owns pending, failure notice, retry, mute and saved volume independence', async () => {
  const toggle = pageNode(node => ts.isFunctionDeclaration(node) && node.name?.text === 'toggleSound').getText(pageSource)
  const calls = [], world = {}, environment = {}, audio = { volume: .2, musicVolume: .4, mute() { calls.push('mute') } }
  let finish, fail = true
  audio.enable = () => { calls.push('enable'); return new Promise((resolve, reject) => { finish = () => fail ? reject(new Error('blocked')) : resolve(true) }) }
  const state = { sound: false, pending: false, notice: '' }
  const handler = () => evaluatePage(toggle, {
    sound: state.sound, world, audio: { current: audio }, engine: { current: { soundEnvironment: () => environment } },
    setSound: value => { state.sound = value }, setSoundPending: value => { state.pending = value },
    setAudioStartNotice: value => { state.notice = value },
    tell: (target, text) => { assert.equal(target, world); calls.push(text) }, update: () => calls.push('update'),
  })
  const failed = handler()()
  assert.equal(state.pending, true); assert.equal(state.sound, false)
  assert.equal(audio.environment, environment)
  finish(); await failed
  assert.equal(state.pending, false)
  assert.equal(state.notice, 'Audio could not start. Try Enable sound again.')
  assert.deepEqual(calls, ['enable', 'mute', 'Audio could not start. Retry in Menu > Options > Game > Browser controls and help.', 'update'])
  fail = false
  const retry = handler()()
  assert.equal(state.notice, ''); assert.equal(state.pending, true)
  finish(); await retry
  assert.equal(state.sound, true); assert.equal(state.pending, false)
  await handler()()
  assert.equal(state.sound, false); assert.equal(calls.at(-1), 'mute')
  assert.deepEqual([audio.volume, audio.musicVolume], [.2, .4])
})

test('pause/resume audio failure mutes and reports the surviving Options retry route', async () => {
  for (const paused of [false, true]) for (const hidden of [false, true]) for (const reject of [false, true]) {
    const calls = [], world = { paused }, state = { sound: true, notice: '' }
    const audio = { current: {
      setPaused(value) { calls.push(['paused', value]); return reject ? Promise.reject(new Error('browser resume blocked')) : Promise.resolve() },
      mute() { calls.push(['mute']) },
    } }
    pageEffect('void audio.current?.setPaused', {
      audio, world, document: { hidden }, setSound(value) { state.sound = value },
      setAudioStartNotice(value) { state.notice = value },
      tell(target, text) { assert.equal(target, world); calls.push(['notice', text]) }, update() { calls.push(['update']) },
    })()
    await new Promise(resolve => setImmediate(resolve))
    assert.equal(state.sound, !reject)
    if (reject) {
      assert.equal(state.notice, 'Audio stopped. Try Enable sound again.')
      assert.deepEqual(calls, [['paused', paused || hidden], ['mute'], ['notice', 'Audio stopped. Enable sound in Menu > Options > Game > Browser controls and help.'], ['update']])
    } else {
      assert.equal(state.notice, '')
      assert.deepEqual(calls, [['paused', paused || hidden]])
    }
  }
})
