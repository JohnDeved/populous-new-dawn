// Differential diagnostic: native captured triangle order versus live depth shader.
// Use --require-parity to fail on the known geometric-depth discrepancy.
// Screen coverage is fixed to isolate ordering; this is not a whole-scene comparison.
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import fixture from '../tests/fixtures/painter-order.json' with { type: 'json' }
import { openGame } from './browser-game.mjs'
const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  const results = await page.evaluate(cases => {
    const s = window.testScene, r = s.renderer, gl = r.getContext()
    cancelAnimationFrame(s.frame)
    s.world.speed = 0
    r.setPixelRatio(1)
    r.setSize(128, 128, false)
    r.setClearColor(0, 1)
    s.view.update(128, 128, { x: -8, z: -8 }, 0, 0, false)
    s.view.uniforms.nativeBasis.value.set([16384, 0, 0, 0, 16384, 0, 0, 0, 16384])
    s.view.boundsTexture.image.data.set(Array.from({ length: 222 }, () => [1, 221]).flat())
    s.view.boundsTexture.needsUpdate = true
    const results = []
    for (const c of cases) {
      const scene = new s.scene.constructor()
      for (const [i, triangle] of c.triangles.entries()) {
        const geometry = s.skyBackdrop.geometry.clone()
        geometry.setIndex(null)
        const Attribute = geometry.getAttribute('position').constructor
        geometry.setAttribute('position', new Attribute(new Float32Array(
          triangle.depths.flatMap(z => [0, 0, -z / 128])
        ), 3))
        geometry.setAttribute('coverage', new Attribute(new Float32Array([-0.9, -0.9, 0.9, -0.9, -0.9, 0.9]), 2))
        const material = new s.terrain.material.constructor({
          uniforms: { captured: { value: 0 }, depth: { value: c.rasterDepths[i] } },
          vertexShader: `attribute vec2 coverage;uniform float captured;uniform float depth;
void main(){vec3 p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
gl_Position.xy=coverage;if(captured>0.)gl_Position.z=depth*2.-1.;}`,
          fragmentShader: `void main(){gl_FragColor=vec4(${i === 0 ? '1.,0.,0.' : '0.,1.,0.'},1.);}`,
        })
        const mesh = new s.skyBackdrop.constructor(geometry, material)
        mesh.position.set(-8, 0, -8)
        scene.add(mesh)
      }
      s.view.prepare(scene)
      const pixels = []
      for (const captured of [0, 1]) {
        scene.children.forEach(m => { m.material.uniforms.captured.value = captured })
        r.render(scene, s.camera)
        const image = new Uint8Array(128 * 128 * 4)
        gl.readPixels(0, 0, 128, 128, gl.RGBA, gl.UNSIGNED_BYTE, image)
        pixels.push(image)
      }
      let changed = 0, covered = 0, invalidReference = 0
      const winner = c.order.at(-1)
      for (let p = 0; p < pixels[0].length; p += 4) {
        // Exclude multisample boundary coverage from the ordering measurement.
        if (pixels[1][p] === 255 || pixels[1][p + 1] === 255) {
          covered++
          if (pixels[1][p + winner] !== 255) invalidReference++
          if (pixels[0][p] !== pixels[1][p] || pixels[0][p + 1] !== pixels[1][p + 1]) changed++
        }
      }
      results.push({ buckets: c.buckets, nativeWinner: winner, covered, changed, invalidReference })
      scene.children.forEach(m => { m.geometry.dispose(); m.material.dispose() })
    }
    return results
  }, fixture.cases.slice(0, 6))
  assert.deepEqual(errors, [])
  for (const result of results) {
    assert.ok(result.covered > 6000, JSON.stringify(result))
    assert.equal(result.invalidReference, 0, JSON.stringify(result))
  }
  console.log(JSON.stringify(results, null, 2))
  const changed = results.reduce((sum, r) => sum + r.changed, 0)
  console.log(`${changed} pixels differ across six isolated native/live depth comparisons; whole-scene occlusion remains unverified.`)
  if (process.argv.includes('--require-parity')) assert.equal(changed, 0, 'Native painter ordering is not integrated')
} finally {
  await browser.close()
}
