// Inspect the actual PNG upload and model material, including RGB under zero alpha.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { chromium } from '@playwright/test'
import { NoBlending } from 'three'
import { openGame } from './browser-game.mjs'
import fixture from '../tests/fixtures/texture-edges.json' with { type: 'json' }
import camera from '../app/original-camera.json' with { type: 'json' }

const browser = await chromium.launch({ headless: true })
try {
  assert.equal(fixture.executableSha256, camera.executableSha256)
  assert.equal(fixture.format, 'ARGB4444')
  const { page, errors } = await openGame(browser)
  const response = await page.request.get(
    `${process.env.POPULOUS_URL ?? 'http://localhost:3000'}/original/atlas.png`
  )
  assert.equal(
    createHash('sha256')
      .update(await response.body())
      .digest('hex'),
    fixture.atlasSha256
  )
  const visible = await page.evaluate(() => {
    const s = window.testScene,
      r = s.renderer,
      gl = r.getContext()
    cancelAnimationFrame(s.frame)
    s.world.speed = 0
    const read = () => {
      r.render(s.scene, s.camera)
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
      return pixels
    }
    const corrected = read(),
      materials = new Set()
    s.scene.traverse(o => {
      if (o.isMesh && o.material.map?.image?.src?.includes('/atlas.png')) materials.add(o.material)
    })
    const atlas = [...materials][0].map
    // Read the uploaded texture directly: Canvas2D discards RGB under zero alpha.
    const previous = gl.getParameter(gl.FRAMEBUFFER_BINDING),
      target = gl.createFramebuffer()
    const pixels = new Uint8Array(256 * 1024 * 4)
    try {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target)
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        r.properties.get(atlas).__webglTexture,
        0
      )
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
        throw Error('Atlas readback unavailable')
      gl.readPixels(0, 0, 256, 1024, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
    } finally {
      gl.bindFramebuffer(gl.FRAMEBUFFER, previous)
      gl.deleteFramebuffer(target)
    }
    let texels = 0
    for (let i = 0; i < pixels.length; i += 4)
      if (!pixels[i + 3]) {
        texels += Number(!!(pixels[i] || pixels[i + 1] || pixels[i + 2]))
        pixels.fill(0, i, i + 3)
      }
    const baseline = new s.waterMap.constructor(pixels, 256, 1024)
    Object.assign(baseline, {
      minFilter: atlas.minFilter,
      magFilter: atlas.magFilter,
      wrapS: atlas.wrapS,
      wrapT: atlas.wrapT,
      colorSpace: atlas.colorSpace,
      generateMipmaps: false,
      needsUpdate: true,
    })
    window.textureEdgeBaseline = enabled => {
      materials.forEach(material => {
        material.map = enabled ? baseline : atlas
      })
      return read()
    }
    const before = window.textureEdgeBaseline(true)
    window.textureEdgeBaseline(false)
    let brighter = 0,
      dimmer = 0
    for (let i = 0; i < before.length; i += 4) {
      const change =
        corrected[i] +
        corrected[i + 1] +
        corrected[i + 2] -
        before[i] -
        before[i + 1] -
        before[i + 2]
      brighter += Number(change > 0)
      dimmer += Number(change < 0)
      if (corrected[i + 3] !== before[i + 3]) throw Error('Edge preparation changed opacity')
    }
    return { texels, brighter, dimmer }
  })
  assert.equal(visible.texels, fixture.changedTexels)
  assert.ok(visible.brighter > 100, JSON.stringify(visible))
  assert.equal(visible.dimmer, 0)
  await page.screenshot({ path: '/private/tmp/populous-texture-edges-after.png' })
  await page.evaluate(() => {
    window.textureEdgeBaseline(true)
  })
  await page.screenshot({ path: '/private/tmp/populous-texture-edges-before.png' })
  await page.evaluate(() => {
    window.textureEdgeBaseline(false)
  })
  const samples = await page.evaluate(
    ({ samples, NoBlending }) => {
      const s = window.testScene,
        r = s.renderer,
        gl = r.getContext()
      cancelAnimationFrame(s.frame)
      s.world.speed = 0
      let mesh
      s.scene.traverse(o => {
        if (!mesh && o.userData.nativeModel >= 107 && o.userData.nativeModel <= 142) mesh = o
      })
      const scene = new s.scene.constructor(),
        group = mesh.parent
      group.traverse(o => {
        if (o.isMesh || o.isSprite) o.visible = o === mesh
      })
      scene.add(group)
      s.focus(group.position)
      r.setPixelRatio(1)
      r.setSize(256, 256, false)
      r.setClearColor(0xff00ff, 1)
      s.view.update(256, 256, s.viewPoint, 0, 0, false, 640)
      mesh.userData.highlight.value = 255
      // Expose stored RGB even for fully transparent samples. The native edge pass
      // leaves alpha untouched; normal gameplay still uses its material alpha gate.
      mesh.material.alphaTest = 0
      mesh.material.transparent = true
      mesh.material.blending = NoBlending
      mesh.material.needsUpdate = true
      const uv = mesh.geometry.getAttribute('uv')
      return samples.map(sample => {
        for (let i = 0; i < uv.count; i++) uv.setXY(i, sample.x / 256, 1 - sample.y / 1024)
        uv.needsUpdate = true
        s.view.prepare(scene)
        r.render(scene, s.camera)
        const pixels = new Uint8Array(256 * 256 * 4),
          counts = new Map()
        gl.readPixels(0, 0, 256, 256, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
        for (let i = 0; i < pixels.length; i += 4) {
          const key = Array.from(pixels.subarray(i, i + 4)).join(',')
          if (key !== '255,0,255,255') counts.set(key, (counts.get(key) ?? 0) + 1)
        }
        return [...counts].sort((a, b) => b[1] - a[1])[0]
      })
    },
    { samples: fixture.samples, NoBlending }
  )
  samples.forEach((sample, i) => {
    assert.ok(sample?.[1] > 20)
    sample[0]
      .split(',')
      .forEach((value, channel) =>
        assert.ok(
          Math.abs(Number(value) - fixture.samples[i].rgba[channel]) <= 1,
          JSON.stringify({ expected: fixture.samples[i], actual: sample })
        )
      )
  })
  assert.deepEqual(errors, [])
  console.log(
    `PASS: ${samples.length} actual object-atlas GPU samples retain transparent RGB and bilinear color/alpha; ${visible.brighter} scene pixels lose dark fringes with unchanged opacity; served atlas hash matches native-checked import`
  )
} finally {
  await browser.close()
}
