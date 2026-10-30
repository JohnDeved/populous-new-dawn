import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { inspectPortraitPixels } from './shaman-portrait-pixels.mjs'
import { setWorldPaused } from '../browser-world-input.mjs'
import { clearPortraitSelection } from '../browser-portrait-input.mjs'
import { waitForPortraitReadiness } from '../browser-portrait-readiness.mjs'
import { changeHudSize } from '../browser-native-options.mjs'

// Observation only. The handle pins both owners, not just a same-level World.
export function readPortraitOwner(expected) {
  const scene = window.testSceneRef?.current, store = window.testStore, world = store?.getWorld()
  const dialogs = [...document.querySelectorAll('dialog[open]')]
  return {
    sameWorld: store === expected.store && world === expected.world && scene === expected.scene && scene?.world === world,
    connected: !!scene?.renderer?.domElement?.isConnected,
    status: world?.status, level: world?.outcome?.level, inputMask: world?.inputMask,
    paused: world?.paused, modal: !!scene?.modalSuspended,
    overview: !!scene?.overviewActive || !!scene?.overviewStage,
    nativeMenu: dialogs.some(dialog => dialog.hasAttribute('data-original-pause-menu')),
    foreignMenu: dialogs.some(dialog => !dialog.hasAttribute('data-original-pause-menu')) ||
      !!document.querySelector('[data-spell-test-menu], [data-world-selector], [data-debug-mission-picker], .loading-world'),
    fullscreen: !!document.fullscreenElement || !!document.querySelector('[data-fullscreen-control] button[aria-disabled="true"]'),
    popups: [...document.querySelectorAll('.campaign-messages details')]
      .map(detail => ({ serial: detail.getAttribute('data-message-serial'), open: detail.open })),
  }
}

// Scenario-local adapter, not a replacement for any shared input owner. Every
// delegated await is guarded before AND after: an outer race alone would allow
// a late helper to launch its next click, RAF, screenshot or report write.
export async function withinPortraitScenario(raw, { timeout = 90000, signal } = {}, run) {
  assert.ok(Number.isFinite(timeout) && timeout > 0, 'Invalid portrait scenario timeout')
  const deadline = performance.now() + timeout
  let expired = false, timer, rejectStop, expected, initial, pause, allowPause = false, allowMenu = false
  const stopped = new Promise((_, reject) => { rejectStop = reject })
  const abort = () => { expired = true; rejectStop(signal.reason ?? Error('Portrait scenario aborted')) }
  const remaining = () => {
    signal?.throwIfAborted()
    const value = deadline - performance.now()
    assert.ok(!expired && value > 0, 'Portrait scenario timed out')
    return value
  }
  const rawPhase = async action => {
    remaining()
    const value = await action()
    remaining()
    return value
  }
  const check = async () => {
    assert.ok(expected, 'Native campaign entry must bind the portrait owner before page actions')
    const state = await rawPhase(() => raw.evaluate(readPortraitOwner, expected))
    assert.equal(state.sameWorld, true, 'Portrait Scene/Store/World replaced')
    assert.equal(state.connected, true, 'Portrait canvas is detached')
    assert.equal(state.status, 'playing', 'Portrait requires a playing world')
    assert.equal(state.level, 1, 'Portrait ordinary phase requires native Mission 1')
    assert.equal(state.inputMask, 0, 'Portrait cannot skip an introduction')
    assert.equal(state.overview, false, 'Overview owns portrait input')
    assert.equal(state.foreignMenu, false, 'A foreign menu owns portrait input')
    assert.equal(state.fullscreen, false, 'Fullscreen owns portrait input')
    assert.ok(state.popups.every(popup => !popup.open), 'Open campaign popup owns input; never collapse or acknowledge it')
    if (initial) assert.deepEqual(state.popups, initial.popups, 'Retain every campaign popup record and serial')
    assert.ok(allowMenu || !state.nativeMenu, 'Native menu is outside the explicit Options route')
    assert.ok(!state.modal || (allowMenu && state.nativeMenu), 'A modal owns portrait input')
    if (allowMenu && state.nativeMenu) assert.equal(state.paused, true, 'Native Options must retain its owning pause')
    else if (!allowPause) assert.equal(state.paused, pause, 'Portrait pause ownership changed')
    return state
  }
  const phase = async action => {
    await check()
    const value = await rawPhase(action)
    await check()
    return value
  }
  const options = value => ({ ...value, timeout: Math.min(
    Number.isFinite(value?.timeout) && value.timeout > 0 ? value.timeout : Infinity, remaining()) })
  // Retain actual Locator identity for Playwright expect, but do not expose an
  // unguarded callable method. _expect is the pinned Playwright attribute wait.
  const locator = target => new Proxy(target, { get(object, key) {
    if (key === 'constructor') return object.constructor
    if (key === 'toString') return object.toString.bind(object)
    if (['locator', 'getByRole'].includes(key)) return (...args) => { remaining(); return locator(object[key](...args)) }
    if (['click', 'focus', 'hover', 'screenshot', 'waitFor'].includes(key))
      return settings => phase(() => object[key](options(settings)))
    if (key === 'getAttribute') return (name, settings) => phase(() => object.getAttribute(name, options(settings)))
    if (key === '_expect') return (expression, settings) => phase(() => object._expect(expression, options(settings)))
    if (key === 'evaluate') return (fn, arg, settings) => phase(() => object.evaluate(fn, arg, options(settings)))
    if (key === 'boundingBox') return settings => phase(() => object.boundingBox(options(settings)))
    const value = Reflect.get(object, key, object)
    if (typeof value === 'function') throw Error(`Unguarded portrait locator method: ${String(key)}`)
    return value
  } })
  const page = {
    getByRole: (...args) => { remaining(); return locator(raw.getByRole(...args)) },
    locator: (...args) => { remaining(); return locator(raw.locator(...args)) },
    evaluate: (...args) => phase(() => raw.evaluate(...args)),
    evaluateHandle: (...args) => phase(() => raw.evaluateHandle(...args)),
    waitForFunction: (fn, arg, settings) => phase(() => raw.waitForFunction(fn, arg, options(settings))),
    waitForSelector: (selector, settings) => phase(() => raw.waitForSelector(selector, options(settings))),
    waitForTimeout: duration => phase(() => raw.waitForTimeout(Math.min(duration, remaining()))),
    setViewportSize: size => phase(() => raw.setViewportSize(size)),
    screenshot: settings => phase(() => raw.screenshot(options(settings))),
    keyboard: { press: (key, settings) => phase(() => raw.keyboard.press(key, settings)) },
    mouse: { move: (...args) => phase(() => raw.mouse.move(...args)) },
  }
  const control = {
    page, remaining, check,
    // openMission is a harness closure bound to raw page. We bound our wait and
    // prohibit continuation after it; we do NOT claim to cancel its internals.
    entry: async open => {
      assert.equal(expected, undefined)
      await rawPhase(open)
      expected = await rawPhase(() => raw.evaluateHandle(() => ({
        store: window.testStore, world: window.testStore?.getWorld(), scene: window.testSceneRef?.current,
      })))
      const state = await rawPhase(() => raw.evaluate(readPortraitOwner, expected))
      pause = state.paused
      initial = await check()
      return initial
    },
    ready: async () => waitForPortraitReadiness(page, { timeout: remaining(), signal }),
    pause: async value => {
      await check()
      allowPause = true
      try {
        const collapsed = await setWorldPaused(page, value, { timeout: remaining(), signal })
        assert.deepEqual(collapsed, [], 'Portrait pause setup must not collapse real messages')
        pause = value
      } finally { allowPause = false }
      return check()
    },
    clear: async () => clearPortraitSelection(page, { timeout: remaining(), signal }),
    hudSize: async value => {
      const before = await check()
      allowMenu = true
      try { await changeHudSize(page, value) }
      finally { allowMenu = false }
      const after = await check()
      assert.equal(after.paused, before.paused, 'Native Options restores its preexisting pause')
      return { before, after, value }
    },
    // Synchronous report writes have no await between their final guard and IO.
    save: async action => { await check(); remaining(); return action() },
  }
  try {
    remaining()
    signal?.addEventListener('abort', abort, { once: true })
    timer = setTimeout(() => { expired = true; rejectStop(Error('Portrait scenario timed out')) }, remaining())
    return await Promise.race([run(control), stopped])
  } finally {
    expired = true
    clearTimeout(timer)
    signal?.removeEventListener('abort', abort)
    // Handle disposal releases only a remote reference, never gameplay. Do not
    // extend the deadline or replace a primary scenario failure with cleanup.
    if (expected) void expected.dispose().catch(() => {})
  }
}

const sourceInputs = [
  'scripts/local-render/shaman-portrait.mjs', 'scripts/local-render/shaman-portrait-pixels.mjs',
  'scripts/browser-portrait-input.mjs', 'scripts/browser-portrait-readiness.mjs', 'scripts/campaign-portrait-readiness.mjs',
  'scripts/browser-world-input.mjs', 'scripts/browser-space-ownership.mjs',
  'scripts/browser-native-options.mjs', 'scripts/local-render/harness.mjs', 'scripts/browser-game.mjs',
  'app/page.tsx', 'app/hud-person-source.ts', 'app/scene-hud-runtime.ts', 'app/globals.css',
  'app/original-options.tsx', 'app/original-pause-menu.tsx', 'app/original-hud.json',
  'decomp/research/shaman-portrait/descriptor.json',
]

// No world writes occur until the complete ordinary-control phase finishes.
// The later supplied HP/absence/background fixture is NOT natural reincarnation.
export default async function ({ page: raw, openMission, root, output, signal, timeout = 90000 }) {
  return withinPortraitScenario(raw, { timeout, signal }, async control => {
    const { page } = control
    const report = {
      method: 'Native campaign Mission 1 public controls; separately supplied portrait pixel fixtures',
      entry: 'Harness openMission(1, { nativeCampaign: true }); no diagnostic mission availability fixture',
      limits: 'On-foot controls only. Supplied HP/absence/return/background/scale is not natural death or reincarnation. No native execution, shared-ring cadence or hardware-performance claim. Harness entry internals retain their own lifecycle owner.',
      sources: Object.fromEntries(sourceInputs.map(path => [path, createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex')])),
      checks: [], pixelChecks: [],
    }
    const save = () => control.save(() => writeFileSync(resolve(output, 'shaman-portrait.json'), JSON.stringify(report, null, 2) + '\n'))
    const portrait = page.getByRole('button', { name: 'Select shaman', exact: true })
    const snapshot = () => page.evaluate(async () => {
      const { hudPersonSource } = await import('/app/hud-person-source.ts')
      const s = window.testSceneRef.current, w = s.world
      const commands = u => {
        const p = hudPersonSource(w, u).source
        return p ? {
          commands: [...p.commands], commandCursor: p.commandCursor,
          immediateCommand: p.immediateCommand, orderLocation: p.orderLocation,
          commandStatus: p.commandStatus, workTarget: p.workTarget,
        } : null
      }
      return { selected: [...w.selected], camera: { ...s.cameraPosition }, turn: w.turn, paused: w.paused,
        randomState: w.randomState, orders: structuredClone(w.buildingOrders),
        people: w.units.map(u => ({ id: u.id, team: u.team, kind: u.kind, hp: u.hp, x: u.x, z: u.z,
          path: structuredClone(u.path), work: u.work, target: u.target, vehicle: u.native?.vehicle,
          controllerCommands: commands(u) })),
        sounds: w.sounds.map(s => ({ serial: s.serial, cue: s.cue })), soundSerial: w.soundSerial,
        shaman: w.units.find(u => u.team === 'blue' && u.kind === 'shaman' && !u.ghost && u.hp > 0)?.id }
    })
    const preserved = (before, after) => {
      for (const key of ['turn', 'paused', 'randomState', 'orders', 'people'])
        assert.deepEqual(after[key], before[key], `portrait preserves ${key}`)
    }
    let fixture, originalBackground, primary
    const restoreBackground = () => page.locator('.native-hud').evaluate((element, original) => {
      element.style.backgroundImage = original.image; element.style.backgroundColor = original.color
    }, originalBackground)
    try {
      report.owner = await control.entry(() => openMission(1, { nativeCampaign: true }))
      await page.waitForFunction(() => { const s = window.testSceneRef.current; return !s.world.inputMask && !s.cameraMotion.active && !s.viewTransition })
      report.readiness = await control.ready()
      assert.equal(report.readiness.after.ready, true, 'Native primary portrait readiness precedes pause')
      await control.pause(true)
      report.cohortSetup = await control.clear()
      await page.getByRole('button', { name: 'Select brave', exact: true }).click()
      report.before = await snapshot()
      assert.equal(report.before.paused, true)
      assert.equal(report.before.selected.length, 1)
      assert.notEqual(report.before.selected[0], report.before.shaman)
      await page.screenshot({ path: resolve(output, 'portrait-before-input.png') })
      for (const modifiers of [[], ['Control'], ['Shift'], ['Control', 'Shift']]) {
        for (let repeat = 0; repeat < 2; repeat++) {
          control.remaining()
          const before = await snapshot()
          await portrait.click({ modifiers })
          const after = await snapshot()
          assert.deepEqual(after.selected, [...new Set([...before.selected, before.shaman])].sort((a, b) => a - b))
          assert.deepEqual(after.camera, before.camera, 'left-click must not start a focus journey')
          preserved(before, after)
          const cues = after.sounds.filter(s => s.serial > before.soundSerial).map(s => s.cue)
          assert.deepEqual(cues, modifiers.includes('Shift') ? [0x18, 0x58] : [0x18])
          report.checks.push({ kind: 'left', modifiers, repeat, before, after }); await save()
        }
      }
      await page.screenshot({ path: resolve(output, 'portrait-preserved-group.png') })
      const beforeKeyboard = await snapshot()
      await portrait.focus(); await page.keyboard.press('Enter'); await page.keyboard.press('Space')
      const afterKeyboard = await snapshot()
      assert.deepEqual(afterKeyboard.selected, beforeKeyboard.selected)
      assert.deepEqual(afterKeyboard.camera, beforeKeyboard.camera)
      preserved(beforeKeyboard, afterKeyboard)
      report.checks.push({ kind: 'keyboard', before: beforeKeyboard, after: afterKeyboard }); await save()
      for (const modifiers of [[], ['Control'], ['Shift'], ['Control', 'Shift']]) {
        control.remaining()
        const before = await snapshot()
        await portrait.click({ button: 'right', modifiers })
        await page.waitForFunction(() => !window.testSceneRef.current.cameraMotion.active)
        const after = await snapshot()
        assert.deepEqual(after.selected, before.selected)
        assert.equal(after.soundSerial, before.soundSerial)
        preserved(before, after)
        const shaman = after.people.find(u => u.id === after.shaman)
        const target = { x: Math.round(shaman.x * 256 + 2048) & 65535, y: Math.round(-shaman.z * 256 - 2048) & 65535 }
        assert.equal(after.camera.x, target.x); assert.equal(after.camera.y, target.y)
        report.checks.push({ kind: 'right', modifiers, before, after }); await save()
      }
      await page.screenshot({ path: resolve(output, 'portrait-right-focus.png') })
      await page.setViewportSize({ width: 1280, height: 720 })
      await portrait.click()
      const box = await portrait.boundingBox()
      assert.ok(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= 1280 && box.y + box.height <= 720)
      await page.screenshot({ path: resolve(output, 'portrait-compact.png') })
      assert.equal(report.checks.length, 13)
      report.ordinaryCompleted = true
      await save()
      // Supplied presentation fixture only, after ordinary input acceptance.
      await page.setViewportSize({ width: 1440, height: 1000 })
      originalBackground = await page.locator('.native-hud').evaluate(element => ({
        image: element.style.backgroundImage, color: element.style.backgroundColor,
      }))
      fixture = await page.evaluateHandle(() => {
        const world = window.testStore.getWorld()
        const shaman = world.units.find(u => u.team === 'blue' && u.kind === 'shaman' && !u.ghost)
        return { world, units: [...world.units], shaman, health: shaman.hp }
      })
      for (const scale of [1, 2]) {
        report.checks.push({ kind: 'native-options', ...await control.hudSize(String(scale)) })
        for (const state of ['alive', 'dead', 'absent', 'returned']) {
          await page.evaluate(({ state, fixture }) => window.testStore.change(world => {
            if (world !== fixture.world) throw Error('Supplied portrait fixture lost its World')
            world.units = state === 'absent' ? fixture.units.filter(u => u !== fixture.shaman) : [...fixture.units]
            fixture.shaman.hp = state === 'dead' ? 0 : fixture.health
          }), { state, fixture })
          const enabled = state === 'alive' || state === 'returned'
          await page.waitForFunction(enabled => document.querySelector('button.portrait')?.disabled === !enabled, enabled)
          for (const hover of [false, true]) for (const [color, background] of [
            ['black', [0, 0, 0]], ['sand', [219, 184, 133]],
          ]) {
            const observation = await inspectPortraitPixels(page, portrait, output, {
              name: `portrait-supplied-${state}-${scale}x-${hover ? 'hover' : 'normal'}-${color}`,
              background, enabled, hover,
            })
            control.remaining()
            assert.equal(observation.scale, scale, 'Native Options must produce the exact requested integer pixel scale')
            report.pixelChecks.push({ fixture: 'supplied, not natural lifecycle', ...observation }); await save()
          }
          await restoreBackground()
          if (scale === 2) {
            await page.mouse.move(1000, 600)
            await page.screenshot({ path: resolve(output, `portrait-supplied-${state}-fixture.png`) })
          }
        }
      }
      assert.equal(report.pixelChecks.length, 32)
      assert.deepEqual(report.pixelChecks.filter(check => check.mismatches), [], 'frame alpha and opaque interior must match independent native expectations')
      report.renderer = await page.evaluate(() => {
        const gl = window.testSceneRef.current.renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info')
        return { version: gl.getParameter(gl.VERSION), renderer: gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER) }
      })
    } catch (error) { primary = error }
    finally {
      // Same owner/budget only. An expired/replaced context is left to harness
      // teardown, not late gameplay writes. Cleanup never replaces the first error.
      try {
        if (fixture) await page.evaluate(fixture => window.testStore.change(world => {
          if (world !== fixture.world) throw Error('Supplied portrait cleanup lost its World')
          world.units = [...fixture.units]; fixture.shaman.hp = fixture.health
        }), fixture)
        if (originalBackground) await restoreBackground()
      } catch (error) { primary ??= error }
      if (fixture) void fixture.dispose().catch(() => {})
    }
    if (primary) {
      report.status = 'failed'; report.error = primary.stack
      try { await save() } catch { /* A lost owner cannot write a late report. */ }
      throw primary
    }
    report.status = 'passed'; await save(); return report
  })
}
