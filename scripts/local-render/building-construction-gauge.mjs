// Natural Mission 3 construction gauge regression, using all maintained Convert
// Wild assertions. Tick stepping and camera focus are diagnostic, not a benchmark.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export default async function constructionGauge(args) {
  const { root, page, openMission, output, receipt } = args
  await openMission(3)
  await page.waitForFunction(() => {
    let loaded = true
    window.testScene.scene.traverse(object => {
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        if (!material) continue
        for (const texture of [material.map, ...Object.values(material.uniforms ?? {}).map(u => u.value)]) {
          const image = texture?.isTexture && texture.image
          if (image && typeof image.complete === 'boolean' && (!image.complete || !image.naturalWidth)) loaded = false
        }
      }
    })
    return loaded
  })
  const original = readFileSync(resolve(root, 'scripts/check-browser-mission3-convert-task.mjs'), 'utf8')
  const replacements = [
    ["import { chromium } from '@playwright/test'", '// Browser supplied by sandbox-preserving harness'],
    ["import { openGame } from './browser-game.mjs'", 'const openGame = async () => ({ page: globalThis.constructionGaugeQA.page, errors: globalThis.constructionGaugeQA.receipt.errors })'],
    ["const output = resolve(process.env.PND_CAPTURE_DIR ?? 'work/orchestration/mission3-convert-task/browser')", `const output = ${JSON.stringify(output)}`],
    ["const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })", 'const browser = { close: async () => {} }'],
  ]
  let source = original
  for (const [before, after] of replacements) {
    assert.ok(source.includes(before), `Maintained checker scaffold changed: ${before}`)
    source = source.replace(before, after)
  }
  const adapter = resolve(output, 'convert-adapter.mjs')
  writeFileSync(adapter, source)
  globalThis.constructionGaugeQA = args
  try {
    await import(pathToFileURL(adapter).href)
  } finally {
    delete globalThis.constructionGaugeQA
  }
  const result = await page.evaluate(() => {
    const scene = window.testScene, world = scene.world
    const tower = world.buildings.find(b => b.id === 1023)
    const mesh = scene.buildingMeshes.get(tower?.id)
    const construction = world.buildings.filter(b => b.progress < 1).map(b => {
      const group = scene.buildingMeshes.get(b.id)
      return { id: b.id, kind: b.kind, progress: b.progress, team: b.team,
        meshVisible: !!group?.visible, gaugeVisible: !!group?.userData.health?.visible }
    })
    const gl = scene.renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info')
    const model = mesh?.children[0]
    let modelPixels = 0
    if (model) {
      scene.renderer.render(scene.scene, scene.camera)
      const before = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
      const after = new Uint8Array(before.length), visible = model.visible
      gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, before)
      model.visible = false
      scene.renderer.render(scene.scene, scene.camera)
      gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, after)
      model.visible = visible
      scene.renderer.render(scene.scene, scene.camera)
      for (let i = 0; i < before.length; i += 4)
        if (before[i] !== after[i] || before[i + 1] !== after[i + 1] || before[i + 2] !== after[i + 2]) modelPixels++
    }
    return { turn: world.turn, tower, towerMeshVisible: !!mesh?.visible, modelPixels, construction,
      renderer: debug && gl.getParameter(debug.UNMASKED_RENDERER_WEBGL), contextLost: gl.isContextLost() }
  })
  writeFileSync(resolve(output, 'construction-gauge.json'), `${JSON.stringify(result, null, 2)}\n`)
  assert.equal(result.turn, 260)
  assert.equal(result.tower?.kind, 'tower')
  assert.equal(result.tower?.team, 'yellow')
  assert.equal(result.tower?.progress, 0.2)
  assert.equal(result.towerMeshVisible, true, 'Natural unfinished Tower geometry remains visible')
  assert.ok(result.modelPixels > 0, 'Original staged Tower model contributes rendered pixels')
  assert.equal(result.contextLost, false)
  assert.ok(result.construction.length > 0)
  assert.deepEqual(result.construction.filter(b => b.gaugeVisible), [],
    'Original staged building rendering has no always-on horizontal construction bar')
  assert.deepEqual(receipt.errors, [])
  return { label: 'Natural M3 Tower1023, unchanged construction and Convert Wild outcomes; no placeholder construction bar',
    originalCheckerSha256: createHash('sha256').update(original).digest('hex'), result }
}
