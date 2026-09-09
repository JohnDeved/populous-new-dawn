// Same scene/depth stream, retained versus early-rejection vertex shader.
// --measure uses headed Chrome GPU elapsed queries; it is not display FPS.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const baseline = 'be78f473d1358cb1d437a2c7a6c2fe7bc91484eb'
const commit = execFileSync('git', ['rev-parse', baseline], { encoding: 'utf8' }).trim()
const source = execFileSync('git', ['show', `${commit}:app/render-view.ts`], { encoding: 'utf8' })
const previousShader = source.split('export const nativeVertexShader = `')[1].split('`\nconst fragment')[0]
assert.ok(previousShader.includes('vec4 nativePosition') && !previousShader.includes('bool ordered'))
const measure = process.argv.includes('--measure')
const browser = await chromium.launch({ headless: !measure })
try {
  const { page, errors } = await openGame(browser)
  const result = await page.evaluate(async ({ previousShader, measure }) => {
    const { nativeVertexShader } = await import('/app/render-view.ts')
    if (!nativeVertexShader.includes('bool ordered')) throw Error('Apply references/performance/2026-09-09-early-projection.patch to reproduce this rejected experiment')
    const { cameraPreset, polygonMeshBounds } = await import('/app/projection.ts')
    const { addUnit } = await import('/app/model.ts')
    const s = window.testScene, r = s.renderer, gl = r.getContext()
    cancelAnimationFrame(s.frame)
    s.world.speed = 0
    const wrapped = new WeakSet()
    let early = true, compiled = 0
    const select = value => {
      early = value
      const materials = new Set(s.view.healthBars.batches.map(b => b.material))
      s.scene.traverse(o => {
        for (const m of Array.isArray(o.material) ? o.material : [o.material])
          if (m && s.view.materials.has(m)) materials.add(m)
      })
      for (const material of materials) {
        if (!wrapped.has(material)) {
          const compile = material.onBeforeCompile, key = material.customProgramCacheKey.bind(material)
          material.onBeforeCompile = (shader, renderer) => {
            compile.call(material, shader, renderer)
            if (!early && shader.vertexShader.includes(nativeVertexShader)) {
              shader.vertexShader = shader.vertexShader.replace(nativeVertexShader, previousShader)
              compiled++
            }
          }
          material.customProgramCacheKey = () => `${key()}-early-${early}`
          wrapped.add(material)
        }
        material.needsUpdate = true
      }
    }
    const pixels = () => {
      const data = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
      gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, data)
      return data
    }
    const capture = value => {
      select(value)
      r.render(s.scene, s.camera)
      return { pixels: pixels(), depth: s.view.painter.texture.image.data.slice(),
        calls: r.info.render.calls, triangles: r.info.render.triangles,
        picks: [[0, 0], [-.7, -.6], [.7, -.6]].map(([x, y]) =>
          s.view.pick({ x, y }, [s.terrain, s.objects], s.camera)?.point ?? null) }
    }
    const differences = (a, b) => {
      if (a.length !== b.length) throw Error('Different buffer lengths')
      let count = 0
      for (let i = 0; i < a.length; i++) count += Number(a[i] !== b[i])
      return count
    }
    const cases = []
    const compare = name => {
      // Material batches must exist before installing both shader variants.
      r.render(s.scene, s.camera)
      const before = capture(false), after = capture(true)
      cases.push({ name, buffer: [gl.drawingBufferWidth, gl.drawingBufferHeight],
        changedBytes: differences(before.pixels, after.pixels),
        changedDepths: differences(before.depth, after.depth),
        calls: [before.calls, after.calls], triangles: [before.triangles, after.triangles],
        samePicks: JSON.stringify(before.picks) === JSON.stringify(after.picks) })
    }
    const view = (width, height, heading = 0, point = { x: 2, z: 30 }, preset = 0) => {
      r.setPixelRatio(1)
      r.setSize(width, height, false)
      s.view.update(width, height, point, heading * Math.PI / 1024, 0, false, width,
        cameraPreset(3, preset))
    }
    for (const heading of [0, 256, 512, 768, 1024, 1280, 1536, 2047]) {
      view(1240, 1000, heading)
      compare(`heading ${heading}`)
    }
    for (const point of [{ x: 127, z: -127 }, { x: -127, z: 127 }]) {
      view(1240, 1000, 256, point)
      compare(`seam ${point.x}/${point.z}`)
    }
    for (const preset of [2, 3]) {
      view(1240, 1000, 0, { x: 2, z: 30 }, preset)
      compare(`preset ${preset}`)
    }
    for (const [width, height, ratio] of [[1920, 1080, 1], [3440, 1440, 1], [3840, 2160, 1], [1920, 1080, 1.8]]) {
      view(width, height)
      r.setPixelRatio(ratio)
      compare(`${width}x${height} DPR ${ratio}`)
    }
    const widen = () => {
      s.view.bounds = polygonMeshBounds(s.view.config.bounds.map((n, i) => i % 2 ? n : n + Math.sign(n) * 16), 0)
      s.view.bounds.forEach((row, i) => s.view.boundsTexture.image.data.set(row, i * 2))
      s.view.boundsTexture.needsUpdate = true
    }
    view(3440, 1440)
    widen()
    compare('diagnostic lateral expansion')
    for (let i = 0; i < 80; i++) {
      const u = addUnit(s.world, 'blue', 'brave', { x: -8 + i % 20, z: 23 + Math.floor(i / 20) })
      u.hp = 1 + i % 64
    }
    s.world.selected = s.world.units.filter(u => u.team === 'blue').map(u => u.id)
    s.animate(s.previous)
    cancelAnimationFrame(s.frame)
    view(1240, 1000)
    compare('selected damaged crowd with health instances')
    s.view.healthBars.enabled = false
    compare('individual health meshes')
    s.view.healthBars.enabled = true
    s.view.overview = true
    s.view.uniforms.nativeMode.value = 0
    compare('unordered overview bypass')

    const samples = [], info = gl.getExtension('WEBGL_debug_renderer_info')
    if (measure) {
      const timer = gl.getExtension('EXT_disjoint_timer_query_webgl2')
      if (!timer) throw Error('GPU elapsed queries unavailable')
      // Keep the simulation/camera fixed. Each query surrounds a complete live
      // render, including buffer uploads and driver scheduling; no gl.finish.
      for (const expanded of [false, true]) {
        view(3440, 1440)
        if (expanded) widen()
        const pair = [false, true]
        for (let i = 0; i < 36; i++) {
          for (const early of i % 2 ? pair : [...pair].reverse()) {
            select(early)
            const query = gl.createQuery()
            if (gl.getParameter(timer.GPU_DISJOINT_EXT)) throw Error('Disjoint before GPU query')
            gl.beginQuery(timer.TIME_ELAPSED_EXT, query)
            r.render(s.scene, s.camera)
            gl.endQuery(timer.TIME_ELAPSED_EXT)
            const start = performance.now()
            while (!gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE)) {
              if (performance.now() - start > 10000) throw Error('GPU query timed out')
              await new Promise(resolve => requestAnimationFrame(resolve))
            }
            if (gl.getParameter(timer.GPU_DISJOINT_EXT)) throw Error('Disjoint GPU query')
            const ms = gl.getQueryParameter(query, gl.QUERY_RESULT) / 1e6
            gl.deleteQuery(query)
            if (i >= 6) samples.push({ expanded, early, ms, calls: r.info.render.calls, triangles: r.info.render.triangles })
          }
        }
      }
    }
    return { compiled, cases, samples, environment: { userAgent: navigator.userAgent,
      renderer: gl.getParameter(info.UNMASKED_RENDERER_WEBGL), headed: measure } }
  }, { previousShader, measure })
  assert.ok(result.compiled > 0, 'Retained shader must actually compile')
  for (const c of result.cases) {
    assert.equal(c.changedBytes, 0, c.name)
    assert.equal(c.changedDepths, 0, c.name)
    assert.equal(c.calls[0], c.calls[1], c.name)
    assert.equal(c.triangles[0], c.triangles[1], c.name)
    assert.ok(c.samePicks, c.name)
  }
  assert.deepEqual(errors, [])
  const output = process.argv.find(a => a.endsWith('.json')) ?? '/private/tmp/populous-early-projection.json'
  writeFileSync(output, JSON.stringify({ baseline: commit, ...result }, null, 2) + '\n')
  console.log(`PASS: ${result.cases.length} identical pixel/depth/draw/pick cases; ${result.samples.length} GPU elapsed samples. ${output}`)
} finally {
  await browser.close()
}
