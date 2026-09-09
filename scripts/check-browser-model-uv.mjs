// Check the playable model UVs, then isolate tile-edge sampling in their material.
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  const result = await page.evaluate(async () => {
    const { default: models } = await import('/app/original-models.json')
    const { modelFaceVisible, modelTextureUV } = await import('/app/model-faces.ts')
    const s = window.testScene,
      r = s.renderer,
      gl = r.getContext(),
      meshes = []
    cancelAnimationFrame(s.frame)
    s.world.speed = 0
    s.scene.traverse(o => {
      if (o.userData.nativeModel !== undefined) meshes.push(o)
    })
    const read = () => {
      r.render(s.scene, s.camera)
      const p = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
      gl.readPixels(
        0,
        0,
        gl.drawingBufferWidth,
        gl.drawingBufferHeight,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        p
      )
      return p
    }
    const corrected = read(),
      saved = [],
      originals = []
    let vertices = 0
    for (const mesh of meshes) {
      const data = models[mesh.userData.nativeModel],
        stage = mesh.userData.stage
      const uv = mesh.geometry.getAttribute('uv'),
        raw = []
      let first = 0
      for (let face = 0; face < data.modes.length; face++) {
        const corners = data.faces[face * 2] === 3 ? [0, 1, 2] : [0, 1, 2, 0, 2, 3]
        if (modelFaceVisible(data, face, stage))
          for (const [i, corner] of corners.entries()) {
            const cap = stage !== 4 && data.faces[face * 2 + 1] & (16 << stage)
            const tile = cap ? 250 : data.tiles[face]
            const source = cap
              ? [
                  (2 + (corner === 1 || corner === 2 ? 2097150 / 2097152 : 0)) / 8,
                  1 - (31 + (corner >= 2 ? 2097150 / 2097152 : 0)) / 32,
                ]
              : data.uv.slice((first + i) * 2, (first + i + 1) * 2)
            const expected = modelTextureUV(tile, ...source),
              index = raw.length / 2
            if (
              Math.abs(uv.getX(index) - expected[0]) > 1e-7 ||
              Math.abs(uv.getY(index) - expected[1]) > 1e-7
            )
              throw Error(`Model UV mismatch ${mesh.userData.nativeModel}:${face}`)
            raw.push(...source)
          }
        first += corners.length
      }
      if (raw.length !== uv.array.length) throw Error('Missing model UV vertices')
      vertices += uv.count
      saved.push(uv.array.slice())
      originals.push(new Float32Array(raw))
      uv.array.set(raw)
      uv.needsUpdate = true
    }
    const old = read()
    meshes.forEach((mesh, i) => {
      const uv = mesh.geometry.getAttribute('uv')
      uv.array.set(saved[i])
      uv.needsUpdate = true
    })
    read()
    let changed = 0
    for (let i = 0; i < old.length; i += 4)
      if (
        old[i] !== corrected[i] ||
        old[i + 1] !== corrected[i + 1] ||
        old[i + 2] !== corrected[i + 2]
      )
        changed++
    window.modelUVBaseline = enabled => {
      meshes.forEach((mesh, i) => {
        const uv = mesh.geometry.getAttribute('uv')
        uv.array.set((enabled ? originals : saved)[i])
        uv.needsUpdate = true
      })
      read()
    }
    return { models: meshes.length, vertices, changed }
  })
  assert.ok(
    result.models > 20 && result.vertices > 1000 && result.changed > 500,
    JSON.stringify(result)
  )
  await page.screenshot({ path: '/private/tmp/populous-model-uv-after.png' })
  await page.evaluate(() => window.modelUVBaseline(true))
  await page.screenshot({ path: '/private/tmp/populous-model-uv-before.png' })
  await page.evaluate(() => window.modelUVBaseline(false))
  const samples = await page.evaluate(async () => {
    const { modelTextureUV } = await import('/app/model-faces.ts')
    const s = window.testScene,
      r = s.renderer,
      gl = r.getContext()
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
    const color = tile => [32 + (tile % 4) * 48, 32 + ((tile >> 2) % 4) * 48, 96]
    const atlas = new Uint8Array(256 * 1024 * 4)
    for (let y = 0; y < 1024; y++)
      for (let x = 0; x < 256; x++) {
        const tile = (x >> 5) + ((1023 - y) >> 5) * 8
        atlas.set([...color(tile), 255], (y * 256 + x) * 4)
      }
    const source = mesh.material.map,
      map = new s.waterMap.constructor(atlas, 256, 1024)
    Object.assign(map, {
      minFilter: source.minFilter,
      magFilter: source.magFilter,
      colorSpace: source.colorSpace,
      generateMipmaps: false,
      needsUpdate: true,
    })
    mesh.material.map = map
    mesh.material.needsUpdate = true
    const uv = mesh.geometry.getAttribute('uv'),
      results = []
    for (const tile of [9, 37, 250, 254])
      for (const [x, y] of [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ]) {
        const raw = [((tile % 8) + x) / 8, 1 - ((tile >> 3) + y) / 32]
        const probe = coordinates => {
          for (let i = 0; i < uv.count; i++) uv.setXY(i, ...coordinates)
          uv.needsUpdate = true
          s.view.prepare(scene)
          r.render(scene, s.camera)
          const pixels = new Uint8Array(256 * 256 * 4),
            counts = new Map()
          gl.readPixels(0, 0, 256, 256, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
          for (let i = 0; i < pixels.length; i += 4) {
            const key = `${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`
            if (key !== '255,0,255') counts.set(key, (counts.get(key) ?? 0) + 1)
          }
          return [...counts].sort((a, b) => b[1] - a[1])[0]
        }
        results.push({
          tile,
          x,
          y,
          expected: color(tile).join(','),
          corrected: probe(modelTextureUV(tile, ...raw)),
          old: probe(raw),
        })
      }
    map.dispose()
    return results
  })
  for (const sample of samples) {
    assert.ok(sample.corrected?.[1] > 20, JSON.stringify(sample))
    assert.equal(sample.corrected[0], sample.expected, JSON.stringify(sample))
    assert.notEqual(
      sample.old[0],
      sample.expected,
      'Old tile-edge UV must expose neighboring color bleed'
    )
  }
  assert.deepEqual(errors, [])
  console.log(
    `PASS: ${result.models} live models/${result.vertices} UV vertices; ${result.changed} changed scene pixels; 16 native tile-edge GPU probes eliminate neighboring atlas bleed`
  )
} finally {
  await browser.close()
}
