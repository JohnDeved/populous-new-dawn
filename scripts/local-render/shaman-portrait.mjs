import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { inspectPortraitPixels } from './shaman-portrait-pixels.mjs'

// The ordinary Mission 1 phase uses public inputs and read-only observations,
// with no world writes, forced steps, clock override or private selection.
// A separately labelled absent-Shaman fixture follows that complete phase.
export default async function ({ page, openMission, output, signal }) {
  const report = { method: 'Ordinary M1, public pause/selection/focus; actual rendered pixels', checks: [],
    limits: 'On-foot portrait acceptance. Occupied/dead/reincarnating edge cases have separate portable fixtures. No native execution, shared-ring cadence or hardware-performance claim.' }
  const save = () => writeFileSync(resolve(output, 'shaman-portrait.json'), JSON.stringify(report, null, 2) + '\n')
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
  try {
    await openMission(1)
    await page.waitForFunction(() => { const s = window.testSceneRef.current; return !s.world.inputMask && !s.cameraMotion.active && !s.viewTransition })
    await page.getByRole('button', { name: 'Pause game', exact: true }).click()
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Select brave', exact: true }).click()
    report.before = await snapshot()
    assert.equal(report.before.paused, true)
    assert.equal(report.before.selected.length, 1)
    assert.notEqual(report.before.selected[0], report.before.shaman)
    await page.screenshot({ path: resolve(output, 'portrait-before-input.png') })
    for (const modifiers of [[], ['Control'], ['Shift'], ['Control', 'Shift']]) {
      for (let repeat = 0; repeat < 2; repeat++) {
        signal.throwIfAborted()
        const before = await snapshot()
        await portrait.click({ modifiers })
        const after = await snapshot()
        assert.deepEqual(after.selected, [...new Set([...before.selected, before.shaman])].sort((a, b) => a - b))
        assert.deepEqual(after.camera, before.camera, 'left-click must not start a focus journey')
        preserved(before, after)
        const cues = after.sounds.filter(s => s.serial > before.soundSerial).map(s => s.cue)
        assert.deepEqual(cues, modifiers.includes('Shift') ? [0x18, 0x58] : [0x18])
        report.checks.push({ kind: 'left', modifiers, repeat, before, after }); save()
      }
    }
    await page.screenshot({ path: resolve(output, 'portrait-preserved-group.png') })
    const beforeKeyboard = await snapshot()
    await portrait.focus(); await page.keyboard.press('Enter'); await page.keyboard.press('Space')
    const afterKeyboard = await snapshot()
    assert.deepEqual(afterKeyboard.selected, beforeKeyboard.selected)
    assert.deepEqual(afterKeyboard.camera, beforeKeyboard.camera)
    preserved(beforeKeyboard, afterKeyboard)
    report.checks.push({ kind: 'keyboard', before: beforeKeyboard, after: afterKeyboard }); save()
    for (const modifiers of [[], ['Control'], ['Shift'], ['Control', 'Shift']]) {
      signal.throwIfAborted()
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
      report.checks.push({ kind: 'right', modifiers, before, after }); save()
    }
    await page.screenshot({ path: resolve(output, 'portrait-right-focus.png') })
    await page.setViewportSize({ width: 1280, height: 720 })
    await portrait.click()
    const box = await portrait.boundingBox()
    assert.ok(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= 1280 && box.y + box.height <= 720)
    await page.screenshot({ path: resolve(output, 'portrait-compact.png') })
    // Separate supplied presentation fixtures after ordinary acceptance:
    // flat HUD backgrounds and live -> hp0 -> absent -> live. These are not
    // naturally reached death/reincarnation episodes.
    // The compact viewport deliberately caps HUD scale below 2; restore enough
    // vertical space for both exact integer-scale pixel comparisons.
    await page.setViewportSize({ width: 1440, height: 1000 })
    report.pixelChecks = []
    const originalBackground = await page.locator('.native-hud').evaluate(element => ({
      image: element.style.backgroundImage, color: element.style.backgroundColor,
    }))
    const restoreBackground = () => page.locator('.native-hud').evaluate((element, original) => {
      element.style.backgroundImage = original.image; element.style.backgroundColor = original.color
    }, originalBackground)
    const pixels = async (state, enabled, scale) => {
      for (const hover of [false, true]) for (const [color, background] of [
        ['black', [0, 0, 0]], ['sand', [219, 184, 133]],
      ]) {
        const observation = await inspectPortraitPixels(page, portrait, output, {
          name: `portrait-${state}-${scale}x-${hover ? 'hover' : 'normal'}-${color}`,
          background, enabled, hover,
        })
        report.pixelChecks.push(observation); save()
      }
      await restoreBackground()
    }
    await page.evaluate(() => {
      const world = window.testStore.getWorld()
      const shaman = world.units.find(u => u.team === 'blue' && u.kind === 'shaman' && !u.ghost)
      window.portraitFixture = { units: [...world.units], shaman, health: shaman.hp }
    })
    for (const scale of [1, 2]) {
      await page.getByRole('button', { name: 'Menu', exact: true }).click()
      await page.getByRole('button', { name: 'Options', exact: true }).click()
      await page.getByRole('button', { name: 'Browser compatibility and help', exact: true }).click()
      await page.getByRole('combobox', { name: 'HUD size', exact: true }).selectOption(String(scale))
      await page.getByRole('button', { name: 'Back to Options', exact: true }).click()
      await page.getByRole('button', { name: 'Back', exact: true }).click()
      await page.getByRole('button', { name: 'Continue Game', exact: true }).click()
      for (const state of ['alive', 'dead', 'absent', 'returned']) {
        await page.evaluate(state => window.testStore.change(world => {
          const fixture = window.portraitFixture
          world.units = state === 'absent' ? fixture.units.filter(u => u !== fixture.shaman) : [...fixture.units]
          fixture.shaman.hp = state === 'dead' ? 0 : fixture.health
        }), state)
        const enabled = state === 'alive' || state === 'returned'
        await page.waitForFunction(enabled => document.querySelector('button.portrait')?.disabled === !enabled, enabled)
        await pixels(state, enabled, scale)
        if (scale === 2) {
          await page.mouse.move(1000, 600)
          await page.screenshot({ path: resolve(output, `portrait-${state}-fixture.png`) })
        }
      }
    }
    const failures = report.pixelChecks.filter(check => check.mismatches)
    assert.deepEqual(failures, [], 'frame alpha and opaque interior must match independent native expectations')
    report.renderer = await page.evaluate(() => {
      const gl = window.testSceneRef.current.renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info')
      return { version: gl.getParameter(gl.VERSION), renderer: gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER) }
    })
    report.status = 'passed'; save(); return report
  } catch (error) { report.status = 'failed'; report.error = error.stack; save(); throw error }
}
