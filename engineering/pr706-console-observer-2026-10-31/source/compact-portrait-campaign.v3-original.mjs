import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { compactLayoutEvaluationSource, assertCompactLayout } from './compact-layout-observer.mjs'

// Public controls only: fresh M1, pause, advice dismissal, Brave/portrait inputs.
// Evaluations observe state/geometry; no world, DOM, storage or clock injection.
export default async function ({ browser, url, root, output, signal }) {
  const { bindGame } = await import(pathToFileURL(resolve(root, 'scripts/browser-game.mjs')).href)
  const { openCampaignFromMainMenu } = await import(pathToFileURL(resolve(root, 'scripts/browser-new-game.mjs')).href)
  const { compactMessageWitness } = await import(pathToFileURL(resolve(root, 'scripts/tutorial-browser/compact-message-layout.mjs')).href)
  const layoutSource = new Function(`return (${compactLayoutEvaluationSource(compactMessageWitness)})`)()
  assert.equal(typeof layoutSource, 'function', 'evaluateAll requires an actual function')
  const report = { status: 'running', scenarioSha256: createHash('sha256').update(readFileSync(import.meta.filename)).digest('hex'),
    method: 'Fresh ordinary M1 and public controls at each compact viewport/DPR; read-only observations',
    limits: 'No death, Swamp, native framebuffer or hardware-performance claim. Before-input images are not pre-repair images.',
    cases: [], errors: [] }
  const save = () => writeFileSync(resolve(output, 'compact-portrait-campaign.json'), JSON.stringify(report, null, 2) + '\n')
  const preserved = (a, b) => {
    for (const key of ['turn', 'paused', 'randomState', 'orders', 'people']) assert.deepEqual(b[key], a[key], key)
  }
  try {
    for (const dpr of [1, 2]) for (const [width, height] of [[640, 480], [900, 360]]) {
      signal.throwIfAborted()
      const context = await browser.newContext({ viewport: { width: 960, height: 720 }, deviceScaleFactor: dpr })
      const item = { width, height, dpr, checks: [], captures: [] }; report.cases.push(item); save()
      try {
        const page = await context.newPage()
        page.setDefaultTimeout(20000)
        page.on('pageerror', error => { report.errors.push(String(error)); save() })
        const button = name => page.getByRole('button', { name, exact: true })
        const portrait = button('Select shaman')
        const snapshot = () => page.evaluate(async () => {
          const { hudPersonSource } = await import('/app/hud-person-source.ts')
          const s = window.testSceneRef.current, w = s.world
          return { selected: [...w.selected], camera: { ...s.cameraPosition }, turn: w.turn, paused: w.paused,
            randomState: w.randomState, orders: structuredClone(w.buildingOrders), soundSerial: w.soundSerial,
            sounds: w.sounds.map(s => ({ serial: s.serial, cue: s.cue })),
            shaman: w.units.find(u => u.team === 'blue' && u.kind === 'shaman' && !u.ghost && u.hp > 0)?.id,
            people: w.units.map(u => {
              const p = hudPersonSource(w, u).source
              return { id: u.id, team: u.team, kind: u.kind, hp: u.hp, x: u.x, z: u.z,
                path: structuredClone(u.path), work: u.work, target: u.target, vehicle: u.native?.vehicle,
                controllerCommands: p ? { commands: [...p.commands], commandCursor: p.commandCursor,
                  immediateCommand: p.immediateCommand, orderLocation: p.orderLocation,
                  commandStatus: p.commandStatus, workTarget: p.workTarget } : null }
            }) }
        })
        const layoutTargets = portrait.or(button('Select brave')).or(button('Resume game'))
          .or(button('Game settings')).or(page.getByLabel('Read campaign message').first())
          .or(button('Dismiss campaign message').first())
        const layout = async () => {
          signal.throwIfAborted()
          await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))))
          return assertCompactLayout(await layoutTargets.evaluateAll(layoutSource), width, height)
        }
        const capture = async name => {
          const geometry = await layout(), state = await snapshot()
          const filename = `${width}x${height}-dpr${dpr}-${name}.png`
          await page.screenshot({ path: resolve(output, filename) })
          item.captures.push({ filename, geometry, state, sha256: createHash('sha256').update(readFileSync(resolve(output, filename))).digest('hex') }); save()
        }
        await page.goto(url, { waitUntil: 'domcontentloaded' })
        await openCampaignFromMainMenu(page); await button('Start Mission 1').click(); await bindGame(page)
        await page.getByRole('button', { name: /Skip introduction/ }).click()
        await page.waitForFunction(() => { const s = window.testSceneRef.current; return !s.world.inputMask && !s.cameraMotion.active && !s.viewTransition })
        await button('Pause game').click(); await page.keyboard.press('Escape')
        const beforeResize = await snapshot()
        assert.equal(beforeResize.paused, true)
        await page.setViewportSize({ width, height })
        const advisory = page.getByRole('button', { name: /^Continue anyway/ })
        await advisory.waitFor(); await advisory.focus(); await page.keyboard.press('Enter')
        preserved(beforeResize, await snapshot()); assert.equal(await advisory.count(), 0)
        await button('Select brave').click()
        item.before = await snapshot(); assert.equal(item.before.selected.length, 1)
        assert.notEqual(item.before.selected[0], item.before.shaman); assert.ok(Number.isInteger(item.before.shaman))
        await capture('before-input')
        for (const modifiers of [[], ['Control'], ['Shift'], ['Control', 'Shift']]) for (let repeat = 0; repeat < 2; repeat++) {
          signal.throwIfAborted()
          const before = await snapshot(); await portrait.click({ modifiers }); const after = await snapshot()
          assert.deepEqual(after.selected, [...new Set([...before.selected, before.shaman])].sort((a, b) => a - b))
          assert.deepEqual(after.camera, before.camera); preserved(before, after)
          assert.deepEqual(after.sounds.filter(s => s.serial > before.soundSerial).map(s => s.cue), modifiers.includes('Shift') ? [0x18, 0x58] : [0x18])
          item.checks.push({ kind: 'primary', modifiers, repeat, before, after, layout: await layout() }); save()
        }
        await capture('after-primary')
        for (let repeat = 0; repeat < 2; repeat++) for (const key of ['Enter', 'Space']) {
          signal.throwIfAborted()
          const before = await snapshot(); await portrait.focus(); await page.keyboard.press(key); const after = await snapshot()
          assert.deepEqual(after.selected, before.selected); assert.deepEqual(after.camera, before.camera); preserved(before, after)
          assert.deepEqual(after.sounds.filter(s => s.serial > before.soundSerial).map(s => s.cue), [0x18])
          item.checks.push({ kind: 'keyboard', key, repeat, before, after, layout: await layout() }); save()
        }
        await capture('after-keyboard')
        for (const modifiers of [[], ['Control'], ['Shift'], ['Control', 'Shift']]) for (let repeat = 0; repeat < 2; repeat++) {
          signal.throwIfAborted()
          const before = await snapshot(); await portrait.click({ button: 'right', modifiers })
          await page.waitForFunction(() => !window.testSceneRef.current.cameraMotion.active)
          const after = await snapshot(), shaman = after.people.find(u => u.id === after.shaman)
          assert.deepEqual(after.selected, before.selected); assert.equal(after.soundSerial, before.soundSerial); preserved(before, after)
          assert.equal(after.camera.x, Math.round(shaman.x * 256 + 2048) & 65535)
          assert.equal(after.camera.y, Math.round(-shaman.z * 256 - 2048) & 65535)
          item.checks.push({ kind: 'secondary', modifiers, repeat, before, after, layout: await layout() }); save()
        }
        await capture('after-secondary')
        await button('Game settings').click(); await button('Continue Game').click()
        preserved(item.before, await snapshot()); await capture('after-menu-return')
        item.renderer = await page.evaluate(() => {
          const gl = window.testSceneRef.current.renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info')
          return { version: gl.getParameter(gl.VERSION), renderer: gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER), dpr: devicePixelRatio }
        })
        assert.equal(item.renderer.dpr, dpr); item.status = 'passed'; save()
      } finally { await context.close() }
    }
    assert.equal(report.cases.length, 4); assert.ok(report.cases.every(c => c.status === 'passed'))
    assert.deepEqual(report.errors, []); report.status = 'passed'; save(); return report
  } catch (error) { report.status = 'failed'; report.failure = String(error.stack ?? error); save(); throw error }
}
