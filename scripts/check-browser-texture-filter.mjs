// Start npm run dev, then node scripts/check-browser-texture-filter.mjs.
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { LinearFilter, NearestFilter, NoColorSpace } from 'three'
import { openGame } from './browser-game.mjs'
const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  await page.waitForFunction(() => {
    const s = window.testScene
    return (
      s.terrainTextures && s.skyClouds.every(m => m.material.uniforms.map.value.image?.complete)
    )
  })
  await page.evaluate(() => {
    const s = window.testScene
    s.world.speed = 0
    s.cameraBearing = 0
    s.focus({ x: 2, z: 30 })
  })
  await page.screenshot({ path: '/private/tmp/populous-texture-filter-after.png' })
  const result = await page.evaluate(
    ({ LinearFilter, NearestFilter, NoColorSpace }) => {
      const s = window.testScene,
        renderer = s.renderer,
        gl = renderer.getContext()
      cancelAnimationFrame(s.frame)
      const models = []
      s.scene.traverse(o => {
        if (o.userData.nativeModel !== undefined) models.push(o)
      })
      const model = models.find(m => m.userData.nativeModel >= 79 && m.userData.nativeModel <= 136)
      const atlas = model.material.map
      const targets = [
        { name: 'model', mesh: model, map: atlas },
        { name: 'terrain', mesh: s.terrain, map: s.terrainMap },
        { name: 'water', mesh: s.terrain, map: s.waterMap },
        { name: 'sky', mesh: s.skyBackdrop, map: s.skyBackdrop.material.uniforms.map.value },
        ...s.skyClouds.map((mesh, i) => ({
          name: `cloud-${i}`,
          mesh,
          map: mesh.material.uniforms.map.value,
        })),
      ]
      const settings = targets.map(({ name, map }) => ({
        name,
        linear: map.minFilter === LinearFilter && map.magFilter === LinearFilter,
        encoded: map.colorSpace === NoColorSpace,
        mipmaps: map.generateMipmaps,
        anisotropy: map.anisotropy,
      }))
      const sprites = [...s.unitMeshes.values()].flatMap(g => g.userData.layers ?? [])
      const spritesNearest =
        sprites.length > 0 &&
        sprites.every(
          sprite =>
            sprite.material.map.minFilter === NearestFilter &&
            sprite.material.map.magFilter === NearestFilter
        )
      const isolated = new s.scene.constructor()
      renderer.setPixelRatio(1)
      renderer.setSize(256, 256, false)
      renderer.setClearColor(0xff00ff, 1)
      const pixels = new Uint8Array(256 * 256 * 4),
        samples = []
      const palettes = [
        [0, 10, 20, 31],
        [32, 64, 128, 255],
        [17, 55, 99, 200],
        [40, 80, 120, 160],
      ]
      for (const { name, mesh, map } of targets) {
        isolated.clear()
        if (name === 'model') {
          const group = mesh.parent
          s.focus(group.position)
          isolated.add(group)
          group.traverse(o => {
            if (o.isMesh || o.isSprite) o.visible = o === mesh
          })
          mesh.userData.highlight.value = 255
        } else {
          s.focus({ x: 2, z: 30 })
          isolated.add(mesh)
        }
        s.view.update(256, 256, s.viewPoint, 0, 0, false, 640)
        mesh.visible = true
        if (name.startsWith('cloud')) mesh.material.transparent = false
        const geometry = mesh.geometry,
          uv = geometry.getAttribute(name === 'terrain' ? 'landUv' : 'uv')
        if (name === 'terrain' || name === 'water') {
          const surface = geometry.getAttribute('surface'),
            light = geometry.getAttribute('light'),
            highlight = geometry.getAttribute('highlight')
          for (let i = 0; i < surface.count; i++) {
            surface.setX(i, name === 'water' ? 1 : 0)
            light.setXYZ(i, 1, 1, 1)
            highlight.setXYZ(i, 0, 0, 0)
          }
          surface.needsUpdate = light.needsUpdate = highlight.needsUpdate = true
          s.waterScroll.value = 0
        }
        if (name.startsWith('cloud')) {
          const fade = geometry.getAttribute('fade')
          fade.array.fill(1)
          fade.needsUpdate = true
        }
        // Probe the actual material with four original palette colors. A Canvas2D
        // round trip changes RGB under translucent PNG pixels, so it is not an oracle.
        for (const palette of palettes) {
          const colors = palette.map(index => [
            ...s.terrainTextures.palette.slice(index * 4, index * 4 + 3),
            255,
          ])
          const probe = new s.waterMap.constructor(new Uint8Array(colors.flat()), 2, 2)
          Object.assign(probe, {
            colorSpace: map.colorSpace,
            minFilter: map.minFilter,
            magFilter: map.magFilter,
            generateMipmaps: map.generateMipmaps,
            anisotropy: map.anisotropy,
            flipY: false,
          })
          probe.needsUpdate = true
          if (name === 'model') {
            mesh.material.map = probe
            mesh.material.needsUpdate = true
          } else mesh.material.uniforms[name === 'water' ? 'waterMap' : 'map'].value = probe
          for (const [fx, fy] of [
            [0, 0],
            [0.25, 0.75],
            [0.5, 0.5],
            [1, 1],
          ]) {
            const u = (0.5 + fx) / 2,
              v = (0.5 + fy) / 2
            let x = u,
              y = v
            if (name.startsWith('cloud')) y = 1 - v
            // Invert the backdrop's screen-to-horizon UV mapping for this sample.
            if (name === 'sky') y = 1 - (1 - v) * mesh.material.uniforms.height.value
            if (name === 'water') {
              x = u * 16 - 8
              y = -v * 16 - 8
            }
            for (let i = 0; i < uv.count; i++) uv.setXY(i, x, y)
            uv.needsUpdate = true
            renderer.render(isolated, s.camera)
            gl.readPixels(0, 0, 256, 256, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
            const weights = [(1 - fx) * (1 - fy), fx * (1 - fy), (1 - fx) * fy, fx * fy]
            const expected = [0, 1, 2].map(channel =>
              Math.round(colors.reduce((sum, color, i) => sum + color[channel] * weights[i], 0))
            )
            let matching = 0
            for (let i = 0; i < pixels.length; i += 4)
              if (expected.every((value, channel) => Math.abs(value - pixels[i + channel]) <= 1))
                matching++
            const counts = new Map()
            if (matching <= 4)
              for (let i = 0; i < pixels.length; i += 4) {
                const key = Array.from(pixels.slice(i, i + 4)).join(',')
                counts.set(key, (counts.get(key) ?? 0) + 1)
              }
            samples.push({
              name,
              palette,
              fx,
              fy,
              expected,
              matching,
              colors: [...counts].sort((a, b) => b[1] - a[1]).slice(0, 4),
            })
          }
          probe.dispose()
        }
      }
      return { settings, spritesNearest, samples, error: gl.getError() }
    },
    { LinearFilter, NearestFilter, NoColorSpace }
  )
  assert.equal(result.error, 0)
  assert.equal(result.spritesNearest, true, 'Unit sprites retain their native point sampling')
  for (const setting of result.settings)
    assert.deepEqual(setting, {
      name: setting.name,
      linear: true,
      encoded: true,
      mipmaps: false,
      anisotropy: 1,
    })
  assert.equal(result.samples.length, 96)
  for (const sample of result.samples) assert.ok(sample.matching > 4, JSON.stringify(sample))
  assert.deepEqual(errors, [])
  console.log(
    'PASS: 96 GPU palette-color samples across real model, terrain, water, sky backdrop and both cloud materials; bilinear encoded-color averages, sampler settings and unchanged point-sampled units'
  )
} finally {
  await browser.close()
}
