// npm run dev, then node scripts/check-browser-model-lighting.mjs.
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'
import models from '../app/original-models.json' with { type: 'json' }
import { modelLighting, modelShade } from '../app/model-lighting.ts'
import { modelTextureModes } from '../app/model-faces.ts'
import materials from '../tests/fixtures/model-materials.json' with { type: 'json' }
import camera from '../app/original-camera.json' with { type: 'json' }

const browser = await chromium.launch({ headless: true })
try {
  assert.equal(materials.executableSha256, camera.executableSha256)
  const { page, errors } = await openGame(browser)
  await page.evaluate(() => {
    const s = window.testScene
    s.world.speed = 0
    const b = s.world.buildings.find(b => b.team === 'red')
    s.focus(b)
  })
  await page.waitForFunction(() => {
    let ready = true
    window.testScene.scene.traverse(o => {
      if (o.userData.nativeModel !== undefined && !o.geometry.hasAttribute('faceShade'))
        ready = false
    })
    return ready
  })
  const changed = await page.evaluate(() => {
    const s = window.testScene
    let mesh
    s.scene.traverse(o => {
      if (o.userData.nativeModel === 30) mesh = o
    })
    window.lightProbe = {
      mesh,
      heading: mesh.parent.userData.nativeHeading,
      size: mesh.userData.nativeSize,
      shade: mesh.geometry.getAttribute('faceShade'),
      anchor: mesh.geometry.getAttribute('faceAnchor'),
    }
    mesh.parent.userData.nativeHeading = 512
    mesh.userData.nativeSize = 128
    return mesh.userData.lightKey
  })
  await page.waitForFunction(key => window.lightProbe.mesh.userData.lightKey !== key, changed)
  const rotated = await page.evaluate(() => {
    const { mesh, shade, anchor } = window.lightProbe
    return {
      shades: Array.from(shade.array),
      positions: Array.from(mesh.geometry.getAttribute('position').array),
      reused:
        shade === mesh.geometry.getAttribute('faceShade') &&
        anchor === mesh.geometry.getAttribute('faceAnchor'),
    }
  })
  assert.equal(rotated.reused, true, 'Lighting updates reuse GPU attributes')
  assert.deepEqual(rotated.shades, modelLighting(models[30], rotated.positions, 4, 512, 128).shades)
  const restored = await page.evaluate(() => {
    const p = window.lightProbe
    p.mesh.parent.userData.nativeHeading = p.heading
    p.mesh.userData.nativeSize = p.size
    return p.mesh.userData.lightKey
  })
  await page.waitForFunction(key => window.lightProbe.mesh.userData.lightKey !== key, restored)
  const meshes = await page.evaluate(() => {
    const result = []
    window.testScene.scene.traverse(o => {
      if (o.userData.nativeModel === undefined) return
      result.push({
        id: o.userData.nativeModel,
        heading: o.parent.userData.nativeHeading ?? 0,
        size: o.userData.nativeSize,
        stage: o.userData.stage,
        positions: Array.from(o.geometry.getAttribute('position').array),
        shades: Array.from(o.geometry.getAttribute('faceShade').array),
        anchors: Array.from(o.geometry.getAttribute('faceAnchor').array),
        modes: Array.from(o.geometry.getAttribute('textureMode').array),
      })
    })
    return result
  })
  assert.ok(meshes.length > 20)
  for (const m of meshes) {
    const expected = modelLighting(models[m.id], m.positions, m.stage, m.heading, m.size)
    assert.deepEqual(m.shades, expected.shades)
    assert.deepEqual(m.anchors, expected.anchors)
    assert.deepEqual(m.modes, modelTextureModes(models[m.id], m.stage))
  }
  await page.screenshot({ path: '/private/tmp/populous-model-lighting.png' })
  // Sample the real model material on the GPU with a flat gray texture input.
  // One shared anchor makes every visible face a known diffuse/specular value.
  const samples = await page.evaluate(() => {
    const s = window.testScene
    cancelAnimationFrame(s.frame)
    const drawables = []
    s.scene.traverse(o => {
      if (o.isMesh || o.isSprite || o.isLine) drawables.push([o, o.visible])
    })
    const mesh = drawables.find(
      ([o]) => o.userData.nativeModel >= 79 && o.userData.nativeModel <= 136
    )[0]
    s.focus(mesh.parent.position)
    // Keep the settled camera used by the previous frame for the sample.
    drawables.forEach(([o]) => {
      o.visible = o === mesh
    })
    mesh.visible = true
    const material = mesh.material,
      shade = mesh.geometry.getAttribute('faceShade'),
      anchor = mesh.geometry.getAttribute('faceAnchor')
    material.map = null
    material.color.setHex(0x404040)
    material.toneMapped = false
    material.needsUpdate = true
    const gl = s.renderer.getContext(),
      rows = []
    const origin = mesh.getWorldPosition(mesh.position.clone())
    const depth = s.view.project(origin, (origin.y * 128) / 45).z
    anchor.array.fill(0)
    anchor.needsUpdate = true
    for (const mode of [3, 4, 6, 7, 32])
      for (const [value, highlight] of [
        [1, 0],
        [15, 0],
        [28, 0],
        [32, 0],
        [43, 0],
        [80, 0],
        [80, 200],
        [80, 255],
      ]) {
        mesh.userData.highlight.value = highlight
        shade.array.fill(value)
        shade.needsUpdate = true
        const modes = mesh.geometry.getAttribute('textureMode')
        modes.array.fill(mode)
        modes.needsUpdate = true
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
        const counts = new Map()
        for (let i = 0; i < pixels.length; i += 4) {
          const key = `${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`
          // The scene clear color is common; retain every other color for matching.
          counts.set(key, (counts.get(key) ?? 0) + 1)
        }
        rows.push({
          mode,
          value,
          highlight,
          depth,
          colors: [...counts].sort((a, b) => b[1] - a[1]).slice(0, 8),
        })
      }
    return rows
  })
  for (const sample of samples) {
    const shade = sample.highlight
      ? (0xff000000 | (sample.highlight * 0x10101)) >>> 0
      : modelShade(sample.value, sample.depth)
    const c = materials.cases.find(c => c.mode === sample.mode && c.shade === shade)
    assert.ok(c, JSON.stringify(sample))
    const expected = [16, 8, 0].map(shift =>
      Math.min(
        255,
        Math.round((64 * ((c.diffuse >>> shift) & 255)) / 255 + ((c.specular >>> shift) & 255))
      )
    )
    assert.ok(
      sample.colors.some(
        ([rgb, count]) =>
          count > 20 && rgb.split(',').every((v, i) => Math.abs(Number(v) - expected[i]) <= 1)
      ),
      JSON.stringify({ sample, expected })
    )
  }
  assert.deepEqual(errors, [])
  console.log(
    `PASS: ${meshes.length} live models retain native shades/anchors/material modes; 40 GPU brightness, additive-light, depth-fade and hover samples match original vertex submissions; no browser errors`
  )
} finally {
  await browser.close()
}
