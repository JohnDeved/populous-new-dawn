import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'
const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  const cases = await page.evaluate(async () => {
    const s = window.testScene,
      { addUnit, createWorld } = await import('/app/model.ts')
    s.world = createWorld()
    s.world.flyby.flags &= ~1
    s.world.inputMask = 0
    s.world.speed = 0
    s.focus({ x: 2, z: 30 })
    s.animate(s.previous)
    cancelAnimationFrame(s.frame)
    const results = [],
      gl = s.renderer.getContext()
    const compare = name => {
      const capture = enabled => {
        s.view.healthBars.enabled = enabled
        s.renderer.render(s.scene, s.camera)
        const pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
        gl.readPixels(
          0,
          0,
          gl.drawingBufferWidth,
          gl.drawingBufferHeight,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          pixels
        )
        return {
          pixels,
          depth: s.view.painter.texture.image.data.slice(),
          ...s.renderer.info.render,
        }
      }
      const before = capture(false),
        after = capture(true)
      let changedPixels = 0,
        changedDepths = 0
      const deltas = {}
      for (let i = 0; i < before.pixels.length; i++)
        if (before.pixels[i] !== after.pixels[i]) {
          changedPixels++
          const d = after.pixels[i] - before.pixels[i]
          deltas[d] = (deltas[d] ?? 0) + 1
        }
      for (let i = 0; i < before.depth.length; i++)
        if (before.depth[i] !== after.depth[i]) changedDepths++
      results.push({
        name,
        buffer: [gl.drawingBufferWidth, gl.drawingBufferHeight],
        changedPixels,
        changedDepths,
        deltas,
        beforeCalls: before.calls,
        afterCalls: after.calls,
        triangles: [before.triangles, after.triangles],
        retained: s.view.healthBars.batches.map(b => b.instanceMatrix.count),
        hiddenAfterDraw: s.view.healthBars.hidden.length,
        attachedAfterDraw: s.view.healthBars.batches.filter(b => b.parent).length,
      })
    }
    compare('unselected opening')
    s.world.selected = s.world.units.filter(u => u.team === 'blue').map(u => u.id)
    s.animate(s.previous)
    cancelAnimationFrame(s.frame)
    compare('selected opening')
    for (let i = 0; i < 200; i++) {
      const u = addUnit(s.world, i % 4 === 0 ? 'red' : 'blue', 'brave', {
        x: -8 + (i % 20),
        z: 23 + Math.floor(i / 20),
      })
      u.hp = 1 + (i % 64)
    }
    s.world.selected = s.world.units.filter(u => u.team === 'blue').map(u => u.id)
    s.animate(s.previous)
    cancelAnimationFrame(s.frame)
    for (const heading of [0, 256, 512, 1024, 1536, 2047]) {
      s.view.update(
        s.container.clientWidth,
        s.container.clientHeight,
        { x: 2, z: 30 },
        (heading * Math.PI) / 1024,
        0,
        false
      )
      compare(`damaged crowd heading ${heading}`)
    }
    for (const [width, height, ratio] of [
      [1920, 1080, 1],
      [3440, 1440, 1],
      [3840, 2160, 1],
      [1920, 1080, 1.8],
    ]) {
      s.renderer.setPixelRatio(ratio)
      s.renderer.setSize(width, height, false)
      s.view.update(width, height, { x: 2, z: 30 }, 0, 0, false)
      compare(`render size ${width}x${height} DPR ${ratio}`)
    }
    s.renderer.setPixelRatio(1)
    s.renderer.setSize(s.container.clientWidth, s.container.clientHeight, false)
    s.world.units.splice(-190)
    s.world.selected = []
    s.animate(s.previous)
    cancelAnimationFrame(s.frame)
    compare('removed units and selection')
    const units = s.world.units
    s.world.units = []
    s.animate(s.previous)
    cancelAnimationFrame(s.frame)
    compare('all people removed')
    s.world.units = units
    s.animate(s.previous)
    cancelAnimationFrame(s.frame)
    compare('new meshes reuse retained batches')
    s.view.overview = true
    s.view.uniforms.nativeMode.value = 0
    compare('overview bypass')
    const geometries = s.renderer.info.memory.geometries
    s.view.healthBars.dispose()
    if (s.renderer.info.memory.geometries !== geometries - 2)
      throw Error('Batch geometry GPU resources not released')
    if (s.view.healthBars.batches.length) throw Error('Batches retained after disposal')
    return results
  })
  console.log(JSON.stringify(cases, null, 2))
  for (const c of cases) {
    assert.equal(c.changedPixels, 0, c.name)
    assert.equal(c.changedDepths, 0, c.name)
    assert.equal(c.triangles[0], c.triangles[1], c.name)
    assert.equal(c.hiddenAfterDraw, 0, c.name)
    assert.equal(c.attachedAfterDraw, 0, c.name)
  }
  assert.ok(
    cases.find(c => c.name === 'damaged crowd heading 0').afterCalls <
      cases.find(c => c.name === 'damaged crowd heading 0').beforeCalls - 300
  )
  assert.deepEqual(errors, [])
  writeFileSync(
    process.argv[2] ?? '/private/tmp/populous-health-bars.json',
    JSON.stringify({ cases }, null, 2) + '\n'
  )
  console.log(
    `PASS: ${cases.length} health-bar batching cases preserve RGBA, painter slots and triangle counts; source visibility and lifecycle restored`
  )
} finally {
  await browser.close()
}
