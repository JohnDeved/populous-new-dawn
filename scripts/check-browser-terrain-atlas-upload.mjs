// Dev-server renderer regression. No parity recording, deployment, or timing claim.
// Use the existing owned browser/server supervisor; set POPULOUS_URL and optional
// POPULOUS_TERRAIN_UPLOAD_SCREENSHOT to task-private paths.
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser, 2)
  await page.waitForFunction(() => !!window.testScene.terrainTextures)
  const results = await page.evaluate(async () => {
    const moduleSource = await (await fetch('/app/scene-terrain-runtime.ts')).text()
    const threeUrl = moduleSource.match(/from ["']([^"']*\/three(?:\.js|[/?])[^"']*)["']/)?.[1]
    if (!threeUrl) throw new Error('Cannot resolve the scene module’s transformed Three.js import')
    const THREE = await import(threeUrl)
    const { stampFootprints } = await import('/app/footprints.ts')
    const s = window.testScene, w = s.world, renderer = s.renderer, gl = renderer.getContext()
    cancelAnimationFrame(s.frame)
    w.paused = true
    const target = new THREE.WebGLRenderTarget(4096, 4096, { depthBuffer: false, stencilBuffer: false })
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      uniforms: { atlas: { value: s.terrainMap } },
      vertexShader: 'varying vec2 v; void main(){ v=uv; gl_Position=vec4(position,1.); }',
      fragmentShader: 'uniform sampler2D atlas; varying vec2 v; void main(){ gl_FragColor=texture2D(atlas,v); }',
      depthTest: false, depthWrite: false,
    }))
    const view = new THREE.Scene(), camera = new THREE.Camera()
    view.add(quad)
    const uploads = [], originalUpload = gl.texSubImage2D, originalImage = gl.texImage2D
    let capture = false
    gl.texSubImage2D = function (...args) {
      if (capture) uploads.push({ operation: 'sub', width: args[4], height: args[5] })
      return originalUpload.apply(this, args)
    }
    gl.texImage2D = function (...args) {
      if (capture) uploads.push({ operation: 'image', width: args[3], height: args[4] })
      return originalImage.apply(this, args)
    }
    const cellAt = (x, z) => ((68 + x) & 127) | (((59 - z) & 127) << 7)
    const read = () => {
      const previous = renderer.getRenderTarget()
      renderer.setRenderTarget(target)
      renderer.render(view, camera)
      const bytes = new Uint8Array(4096 * 4096 * 4)
      renderer.readRenderTargetPixels(target, 0, 0, 4096, 4096, bytes)
      renderer.setRenderTarget(previous)
      return bytes
    }
    const compare = (a, b) => {
      let mismatches = 0
      for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) mismatches++
      return mismatches
    }
    const check = (name, mutate) => {
      uploads.length = 0
      capture = true
      mutate()
      s.updateTerrainTexture()
      renderer.initTexture(s.terrainMap)
      capture = false
      const transfers = uploads.map(item => ({ ...item, bytes: item.width * item.height * 4 }))
      const partial = read(), cpuMismatches = compare(partial, s.terrainAtlasState.pixels)
      s.terrainMap.needsUpdate = true
      renderer.initTexture(s.terrainMap)
      const full = read(), fullMismatches = compare(partial, full)
      return { name, transfers, bytes: transfers.reduce((sum, item) => sum + item.bytes, 0),
        cpuMismatches, fullMismatches, updated: s.terrainAtlasState.updated,
        bounds: s.terrainAtlasState.updatedBounds }
    }
    try {
      const results = []
      results.push(check('first-full', () => {
        s.terrainMap.dispose(); s.terrainAtlasState = undefined; s.terrainMapVersion = null
      }))
      results.push(check('local-height', () => { w.land.heights[cellAt(20, 30)] += 31; w.landVersion++ }))
      results.push(check('repeat-local-height', () => { w.land.heights[cellAt(20, 30)] += 17; w.landVersion++ }))
      results.push(check('shadow-only', () => { w.land.shadows[cellAt(50, 70)] ^= 7 }))
      results.push(check('stable', () => {}))
      results.push(check('native-seams', () => { w.land.heights[0] += 23; w.land.heights[16383] += 29; w.landVersion++ }))
      results.push(check('atlas-seams', () => {
        w.land.heights[cellAt(0, 0)] += 13; w.land.heights[cellAt(127, 127)] += 19; w.landVersion++
      }))
      results.push(check('footprints-and-height', () => {
        const inside = cellAt(20, 30), outside = cellAt(90, 100)
        w.land.heights[inside] += 29; w.landVersion++
        for (const cell of [inside, outside]) stampFootprints(w.footprints,
          (cell & 127) * 512 + 64, (cell >> 7) * 512 + 96)
      }))
      results.push(check('dense', () => { for (let i = 0; i < 16384; i++) w.land.heights[i]++; w.landVersion++ }))
      results.push(check('disposed-destination', () => {
        s.terrainMap.dispose(); w.land.heights[cellAt(20, 30)] += 7; w.landVersion++
      }))
      window.terrainUploadCheck = { check, read, compare, results, target, quad, gl,
        originalUpload, originalImage, renderer, scene: s, cellAt }
      return results
    } catch (error) {
      gl.texSubImage2D = originalUpload; gl.texImage2D = originalImage
      target.dispose(); quad.geometry.dispose(); quad.material.dispose()
      throw error
    }
  })
  for (const result of results) {
    assert.equal(result.cpuMismatches, 0, `${result.name}: exact GPU/CPU atlas bytes`)
    assert.equal(result.fullMismatches, 0, `${result.name}: partial/full GPU agreement`)
  }
  const byName = Object.fromEntries(results.map(result => [result.name, result]))
  assert.equal(byName['first-full'].bytes, 67108864)
  assert.equal(byName['stable'].transfers.length, 0)
  for (const name of ['local-height', 'repeat-local-height', 'shadow-only']) {
    assert.equal(byName[name].transfers.length, 1, name)
    assert.ok(byName[name].bytes < 67108864 / 100, name)
  }
  assert.equal(byName.dense.transfers.length, 1)
  assert.equal(byName.dense.bytes, 67108864)
  assert.equal(byName['disposed-destination'].transfers.length, 2)

  await page.evaluate(() => {
    const { renderer } = window.terrainUploadCheck
    window.terrainContextLost = false; window.terrainContextRestored = false
    renderer.domElement.addEventListener('webglcontextlost', () => { window.terrainContextLost = true }, { once: true })
    renderer.domElement.addEventListener('webglcontextrestored', () => { window.terrainContextRestored = true }, { once: true })
    renderer.forceContextLoss()
  })
  await page.waitForFunction(() => window.terrainContextLost === true)
  const lost = await page.evaluate(() => {
    const { scene: s, cellAt } = window.terrainUploadCheck
    const before = s.terrainMap.version
    for (let i = 0; i < 2; i++) {
      s.world.land.heights[cellAt(20, 30)] += 7; s.world.landVersion++; s.updateTerrainTexture()
    }
    return { lost: s.renderer.getContext().isContextLost(), pendingVersions: s.terrainMap.version - before }
  })
  assert.equal(lost.lost, true)
  assert.equal(lost.pendingVersions, 2)
  await page.evaluate(() => window.terrainUploadCheck.renderer.forceContextRestore())
  await page.waitForFunction(() => window.terrainContextRestored === true)
  const restored = await page.evaluate(() => {
    const c = window.terrainUploadCheck, s = c.scene
    c.renderer.initTexture(s.terrainMap)
    const cpuMismatches = c.compare(c.read(), s.terrainAtlasState.pixels)
    const next = c.check('after-context-restore', () => {
      s.world.land.heights[c.cellAt(20, 30)] += 7; s.world.landVersion++
    })
    c.gl.texSubImage2D = c.originalUpload; c.gl.texImage2D = c.originalImage
    c.target.dispose(); c.quad.geometry.dispose(); c.quad.material.dispose()
    // Return to the actual scene's frame composition after the targeted atlas probe.
    s.animate(s.previous); cancelAnimationFrame(s.frame)
    const debug = c.gl.getExtension('WEBGL_debug_renderer_info')
    return { cpuMismatches, next, renderer: debug ? c.gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : null,
      vendor: debug ? c.gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : null }
  })
  assert.equal(restored.cpuMismatches, 0, 'restored texture includes edits made while lost')
  assert.equal(restored.next.cpuMismatches, 0)
  assert.equal(restored.next.fullMismatches, 0)
  assert.equal(restored.next.transfers.length, 1, 'sparse transfer resumes after restoration')
  if (process.env.POPULOUS_TERRAIN_UPLOAD_SCREENSHOT)
    await page.screenshot({ path: process.env.POPULOUS_TERRAIN_UPLOAD_SCREENSHOT })
  assert.deepEqual(errors, [])
  console.log(JSON.stringify({ status: 'passed', browser: browser.version(), viewport: { width: 1440, height: 1000 },
    mission: 2, results, lost, restored,
    limits: 'Targeted dev-server caller/GPU regression with injected invalidations. Upload bytes/calls are actual GL observations; no timing, FPS, controlled gameplay improvement, or attribution of prior captured spikes is claimed.' }, null, 2))
} finally {
  await browser.close()
}
