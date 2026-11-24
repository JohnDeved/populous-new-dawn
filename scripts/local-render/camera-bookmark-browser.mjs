import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Reuse the ordinary post-Load game after all existing HUD controls, before
// the runner closes that page. No world writes or supplied camera positions.
export const cameraBookmarkEpisodeLimitMs = 24000
const center = ({ x, y, angle }) => ({ x: (x & 0xfe00) | 0x100, y: (y & 0xfe00) | 0x100, angle })
const distance = (a, b) => {
  const axis = (x, y) => Math.abs(((x - y + 32768) & 65535) - 32768)
  return axis(a.x, b.x) + axis(a.y, b.y)
}

export async function checkCameraBookmarks(page, output) {
  const report = { status: 'running', events: [], screenshots: [], limitMs: cameraBookmarkEpisodeLimitMs,
    case: 'Ordinary checkpoint-loaded Mission 1, paused public input; X/Z only. Not native or audible parity.' }
  const save = () => writeFileSync(resolve(output, 'camera-bookmarks.json'), JSON.stringify(report, null, 2) + '\n')
  const button = name => page.getByRole('button', { name, exact: true })
  let observer, timedOut = false
  const started = performance.now()
  const timer = setTimeout(() => { timedOut = true; void page.close().catch(() => {}) }, cameraBookmarkEpisodeLimitMs)
  const setPaused = async paused => {
    const before = await page.evaluate(() => window.testStore.getWorld().paused)
    if (before !== paused) await button(before ? 'Resume game' : 'Pause game').click()
    await page.waitForFunction(value => {
      const world = window.testStore.getWorld()
      return window.testSceneRef.current?.world === world && world.paused === value
    }, paused, { timeout: 3000 })
  }
  const state = () => observer.evaluate(({ sample }) => sample())
  const journal = () => observer.evaluate(({ events }) => structuredClone(events))
  const last = async (type, code, repeat, shift) => {
    report.events = await journal()
    const row = report.events.at(-1)
    assert(row, 'Missing bookmark key event')
    assert.deepEqual([row.type, row.code, row.trusted, row.repeat, row.shift, row.canvasFocus],
      [type, code, true, repeat, shift, true])
    return row
  }
  const pan = async origin => {
    // ArrowUp is the fixed forward camera command. ArrowRight alone rotates
    // by default and would not reliably change the X/Y bookmark cell.
    await page.keyboard.down('ArrowUp')
    try {
      await page.waitForFunction(({ observer, origin }) => {
        const p = observer.sample().pos
        const axis = (a, b) => Math.abs(((a - b + 32768) & 65535) - 32768)
        return axis(p.x, origin.x) + axis(p.y, origin.y) >= 1536
      }, { observer, origin }, { timeout: 3500 })
    } finally {
      if (!page.isClosed()) await page.keyboard.up('ArrowUp')
    }
  }
  const capture = async (file, expected) => {
    const start = await state()
    assert.deepEqual(start.pos, expected)
    assert.equal(start.moving, false)
    await page.waitForFunction(({ observer, frame }) => observer.sample().renderFrame > frame,
      { observer, frame: start.renderFrame }, { timeout: 2000 })
    await page.screenshot({ path: resolve(output, file), timeout: 3000 })
    const end = await state()
    assert.deepEqual(end.pos, expected)
    assert.equal(end.moving, false)
    report.screenshots.push({ file, expected, startFrame: start.renderFrame, endFrame: end.renderFrame,
      sha256: createHash('sha256').update(readFileSync(resolve(output, file))).digest('hex') })
  }
  save()
  try {
    await page.waitForFunction(() => {
      const w = window.testStore.getWorld(), s = window.testSceneRef.current
      return s?.world === w && w.outcome.level === 1 && !w.inputMask &&
        !s.messageModal && !s.cameraMotion.active && !s.viewTransition &&
        !document.querySelector('.loading-world,dialog[open]')
    }, undefined, { timeout: 3000 })
    report.startedPaused = await page.evaluate(() => window.testStore.getWorld().paused)
    await setPaused(true)
    const canvas = page.locator('.world-viewport canvas.battlefield')
    await canvas.hover({ timeout: 3000 })
    await canvas.focus({ timeout: 3000 })
    observer = await page.evaluateHandle(() => {
      const initial = window.testSceneRef.current, currentWorld = initial.world, events = []
      const sample = () => {
        const s = window.testSceneRef.current, w = window.testStore.getWorld()
        if (s !== initial || w !== currentWorld || s.world !== w || !s.renderer.domElement.isConnected ||
            !w.paused || w.inputMask || s.messageModal || document.querySelector('.loading-world,dialog[open]'))
          throw Error('Bookmark check lost the paused current canvas')
        return { pos: { ...s.cameraPosition }, z: s.cameraBookmarks[0] ?? null, x: s.cameraBookmarks[1] ?? null,
          moving: !!s.cameraMotion.active, renderFrame: s.renderer.info.render.frame, turn: w.turn,
          selection: [...w.selected], canvasFocus: document.activeElement === s.renderer.domElement }
      }
      // Bubble, after the scene owner. An immediate snapshot distinguishes the
      // actual saved center from later movement or deferred recapture.
      const record = e => {
        if (!['KeyX', 'KeyZ'].includes(e.code)) return
        events.push({ type: e.type, code: e.code, trusted: e.isTrusted, repeat: e.repeat, shift: e.shiftKey,
          prevented: e.defaultPrevented, ...sample() })
      }
      window.addEventListener('keydown', record)
      window.addEventListener('keyup', record)
      return { sample, events, close() {
        window.removeEventListener('keydown', record)
        window.removeEventListener('keyup', record)
      } }
    })
    const initial = await state()
    report.initial = initial
    assert.equal(initial.canvasFocus, true)
    await page.keyboard.down('Shift')
    await page.keyboard.down('z')
    const savedZ = await last('keydown', 'KeyZ', false, true)
    assert.equal(savedZ.prevented, true)
    assert.deepEqual(savedZ.z, savedZ.pos)
    await page.keyboard.up('z')
    await last('keyup', 'KeyZ', false, true)
    await page.keyboard.up('Shift')
    await pan(savedZ.pos)
    await page.keyboard.down('Shift')
    await page.keyboard.down('x')
    const savedX = await last('keydown', 'KeyX', false, true)
    assert.equal(savedX.prevented, true)
    assert.deepEqual(savedX.x, savedX.pos)
    assert.ok(distance(center(savedZ.z), center(savedX.x)) >= 512, 'X and Z must own distinct saved cells')
    await pan(savedX.pos)
    report.repeatBefore = await state()
    assert.ok(distance(center(report.repeatBefore.pos), center(savedX.x)) >= 512,
      'Camera must enter another cell before the held event is issued')
    await page.keyboard.down('x')
    const held = await last('keydown', 'KeyX', true, true)
    assert.ok(distance(center(held.pos), center(savedX.x)) >= 512, 'Camera must move to another cell while X is held')
    assert.deepEqual(held.x, savedX.x, 'Held Shift+X must not overwrite the first save')
    assert.deepEqual(held.z, savedZ.z, 'Held Shift+X must not overwrite Z')
    assert.equal(held.prevented, false, 'Rejected bookmark repeat leaves default ownership untouched')
    await page.keyboard.up('x')
    await last('keyup', 'KeyX', false, true)
    await page.keyboard.up('Shift')
    for (const [key, code, expected, file] of [
      ['x', 'KeyX', center(savedX.x), 'camera-bookmark-recall-x.png'],
      ['z', 'KeyZ', center(savedZ.z), 'camera-bookmark-recall-z.png'],
    ]) {
      assert.ok(distance((await state()).pos, expected) >= 512, 'Fresh recall starts away from destination')
      await page.keyboard.down(key)
      const recall = await last('keydown', code, false, false)
      assert.equal(recall.prevented, true)
      assert.equal(recall.moving, true)
      await page.keyboard.up(key)
      await last('keyup', code, false, false)
      await page.waitForFunction(({ observer, target }) => {
        const s = observer.sample()
        return !s.moving && s.pos.x === target.x && s.pos.y === target.y && s.pos.angle === target.angle
      }, { observer, target: expected }, { timeout: 4500 })
      await capture(file, expected)
    }
    assert.equal(report.events.length, 9)
    report.final = await state()
    assert.deepEqual(report.final.x, savedX.x)
    assert.deepEqual(report.final.z, savedZ.z)
    assert.equal(report.final.turn, initial.turn)
    assert.deepEqual(report.final.selection, initial.selection)
    assert.equal(timedOut, false)
    if (!report.startedPaused) await setPaused(false)
    report.status = 'passed'
    return report
  } catch (error) {
    report.error = String(error); report.status = 'failed'; report.timedOut = timedOut
    throw error
  } finally {
    clearTimeout(timer)
    report.elapsedMs = performance.now() - started
    save()
    if (!page.isClosed()) {
      if (observer) {
        try { await observer.evaluate(({ close }) => close()) }
        finally { await observer.dispose() }
      }
      for (const key of ['ArrowUp', 'x', 'z', 'Shift']) await page.keyboard.up(key)
    }
  }
}
