// Start a game server, then run this check with POPULOUS_URL pointing to it.
// Deterministic presentation samples and GPU readbacks, never hardware FPS.
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const output = resolve(process.env.POPULOUS_ZOOM_ARTIFACTS ?? 'work/browser-zoom-edges')
mkdirSync(output, { recursive: true })
const report = {
  commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  mode: 'deterministic ordinary zoom controls; no hardware performance claim',
  samples: [], controls: [],
}
const executablePath = process.env.POPULOUS_HEADLESS_SHELL
const browser = await chromium.launch(executablePath ? {
  executablePath, headless: true, chromiumSandbox: true,
  ignoreDefaultArgs: true, args: ['--remote-debugging-pipe'],
} : { headless: true })
try {
  const { page, errors } = await openGame(browser)
  await page.evaluate(() => {
    const s = window.testScene
    cancelAnimationFrame(s.frame)
    s.world.speed = 0
    s.world.paused = true
    s.cameraTime = 0
    s.world.flyby.flags &= ~1
    s.cameraBearing = 0
    s.focus({ x: 2, z: 30 })
    window.zoomEdgeFrame = dt => {
      s.animate(s.previous + dt * 1000)
      cancelAnimationFrame(s.frame)
    }
    window.zoomEdgeFrame(0)
  })
  const sample = async name => {
    const value = await page.evaluate(() => {
      const s = window.testScene
      const rows = s.view.bounds, data = s.view.boundsTexture.image.data
      return {
        config: s.view.config, remaining: s.viewTransition?.remaining ?? 0,
        fraction: s.viewTransition?.previewFraction ?? 0,
        center: s.view.rawCenter, angle: s.view.angle,
        cells: rows.reduce((sum, row) => sum + row[1] - row[0], 0),
        sharedRows: Array.from(data).every((v, i) => v === rows[i >> 1][i & 1]),
        turn: s.world.turn,
      }
    })
    assert.ok(value.sharedRows, `${name}: CPU and shader footprint disagree`)
    report.samples.push({ name, ...value })
    await page.screenshot({ path: `${output}/${name}.png` })
  }
  const advance = async (label, count = 108) => {
    for (let i = 0; i <= count; i++) {
      if (i) await page.evaluate(() => window.zoomEdgeFrame(1 / 144))
      if ([0, 1, 5, 18, 36, 54, 72, 90, 105, 108].includes(i))
        await sample(`${label}-${String(i).padStart(3, '0')}`)
    }
  }
  // Keys enter the shipped command adapter. No direct camera-config injection.
  for (const [label, key] of [['out', '-'], ['in', '='], ['close', '='], ['normal', '-']]) {
    await page.keyboard.press(key)
    await advance(label)
  }
  await page.keyboard.press('-')
  await advance('before-reversal', 36)
  const before = await page.evaluate(() => window.testScene.view.config)
  await page.keyboard.press('=')
  assert.deepEqual(await page.evaluate(() => window.testScene.view.config), before)
  await advance('reversed')
  await page.keyboard.down('w')
  await page.keyboard.down('q')
  await page.keyboard.press('-')
  await advance('pan-rotate-out')
  await page.keyboard.up('w')
  await page.keyboard.up('q')
  await page.keyboard.press('=')
  await advance('return-normal')

  // Positive control: disabling only the already-shipped display footprint must
  // expose missing pixels at the SAME intermediate pose. Restoring it must also
  // restore those exact pixels and allow the normal pointer path to pick them.
  for (const [label, viewport, point] of [
    ['desktop', { width: 1440, height: 1000 }, { x: 2, z: 30 }],
    ['resized', { width: 1280, height: 900 }, { x: 2, z: 30 }],
    ['seam', { width: 1440, height: 1000 }, { x: 119.75, z: -120.125 }],
  ]) {
    await page.setViewportSize(viewport)
    await page.evaluate(point => {
      const s = window.testScene
      s.cameraTime = 0
      s.cameraBearing = 0
      s.focus(point)
      window.zoomEdgeFrame(0)
    }, point)
    await page.keyboard.press('-')
    await page.evaluate(() => {
      for (let i = 0; i < 105; i++) window.zoomEdgeFrame(1 / 144)
    })
    const control = await page.evaluate(async () => {
      const s = window.testScene, view = s.view,
        { circularMeshBounds, meshCellVisible } = await import('/app/projection.ts'),
        gl = s.renderer.getContext(), width = gl.drawingBufferWidth, height = gl.drawingBufferHeight,
        native = circularMeshBounds(view.config.diameter), helper = view.displayGroundFootprint,
        original = helper.cover, config = JSON.stringify(view.config), turn = s.world.turn
      const pixels = () => {
        const data = new Uint8Array(width * height * 4)
        s.renderer.render(s.scene, s.camera)
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data)
        return data
      }
      const covered = pixels(), cells = view.bounds.reduce((n, r) => n + r[1] - r[0], 0)
      let legacy
      try {
        helper.cover = rows => rows
        window.zoomEdgeFrame(0)
        legacy = pixels()
      } finally {
        helper.cover = original
        window.zoomEdgeFrame(0)
      }
      const restored = pixels(), rect = s.renderer.domElement.getBoundingClientRect()
      let changed = 0, restoredMismatch = 0, edgePick = null
      for (let y = 4; y < height - 4; y++) {
        for (let x = 4; x < width - 4; x++) {
          const i = ((height - 1 - y) * width + x) * 4
          if (covered[i] !== legacy[i] || covered[i + 1] !== legacy[i + 1] || covered[i + 2] !== legacy[i + 2]) {
            changed++
            if (!edgePick && x % 16 === 0 && y % 16 === 0) {
              const point = s.pick({ clientX: rect.left + (x + .5) * rect.width / width,
                clientY: rect.top + (y + .5) * rect.height / height })
              if (point && !meshCellVisible(native,
                { x: Math.round((point.x + 8) * 256), y: Math.round((-point.z - 8) * 256) }, view.center))
                edgePick = { pixel: [x, y], point }
            }
          }
          if (covered[i] !== restored[i] || covered[i + 1] !== restored[i + 1] || covered[i + 2] !== restored[i + 2]) restoredMismatch++
        }
      }
      return { changed, restoredMismatch, edgePick, cells,
        nativeCells: native.reduce((n, r) => n + r[1] - r[0], 0),
        unchangedConfig: config === JSON.stringify(view.config), unchangedTurn: turn === s.world.turn,
        remaining: s.viewTransition?.remaining ?? 0 }
    })
    report.controls.push({ label, ...control })
    assert.ok(control.remaining > 0, `${label}: control must be intermediate`)
    assert.ok(control.changed > 100, `${label}: positive control failed to expose cutoff pixels`)
    assert.equal(control.restoredMismatch, 0, `${label}: restoring coverage must restore pixels`)
    assert.ok(control.edgePick, `${label}: added rendered edge must be reachable by normal picking`)
    assert.ok(control.unchangedConfig && control.unchangedTurn)
    await sample(`control-${label}`)
    await page.evaluate(() => {
      while (window.testScene.viewTransition) window.zoomEdgeFrame(1 / 144)
    })
    await page.keyboard.press('=')
    await page.evaluate(() => {
      while (window.testScene.viewTransition) window.zoomEdgeFrame(1 / 144)
    })
  }
  report.renderer = await page.evaluate(() => {
    const gl = window.testScene.renderer.getContext(), e = gl.getExtension('WEBGL_debug_renderer_info')
    return { version: gl.getParameter(gl.VERSION), renderer: e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER) }
  })
  assert.deepEqual(errors, [])
  report.errors = errors
  report.status = 'passed'
  console.log('PASS: ordinary zoom frames, shared display bounds, legacy-cutoff positive controls and added-edge picking', JSON.stringify(report.controls))
} catch (error) {
  report.status = 'failed'
  report.error = error.stack ?? String(error)
  throw error
} finally {
  writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2) + '\n')
  await browser.close()
}
