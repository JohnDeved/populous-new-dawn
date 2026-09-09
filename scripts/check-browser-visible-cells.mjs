// Probe the shared native visibility shader independently of screen projection.
// This keeps offscreen geometry from hiding a wrong cell-membership decision.
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import fixture from '../tests/fixtures/visible-cells.json' with { type: 'json' }
import { openGame } from './browser-game.mjs'
const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  const result = await page.evaluate(
    cases => {
      const s = window.testScene,
        r = s.renderer,
        gl = r.getContext(),
        isolated = new s.scene.constructor()
      cancelAnimationFrame(s.frame)
      s.world.speed = 0
      const probes = [false, true].map(unwrapped => {
        const material = new s.terrain.material.constructor({
          vertexShader:
            'void main(){vec3 p=vec3(0.);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);gl_Position=vec4(position.xy,0.,1.);}',
          fragmentShader: 'void main(){gl_FragColor=vec4(1.,0.,0.,1.);}',
        })
        const mesh = new s.skyBackdrop.constructor(s.skyBackdrop.geometry.clone(), material)
        mesh.userData.nativeRelative = unwrapped
        isolated.add(mesh)
        return mesh
      })
      s.view.prepare(isolated)
      r.setPixelRatio(1)
      r.setSize(8, 8, false)
      r.setClearColor(0, 1)
      const pixel = new Uint8Array(4),
        failures = []
      let checked = 0
      for (const c of cases) {
        const [cx, cy] = c.center,
          visible = new Set(c.visible)
        s.view.update(8, 8, { x: cx / 256 - 8, z: -cy / 256 - 8 }, 0, 0, false)
        s.view.bounds = c.spans
        c.spans.forEach((span, i) => s.view.boundsTexture.image.data.set(span, i * 2))
        s.view.boundsTexture.needsUpdate = true
        // Cells at both ends of several native row spans, including their excluded
        // neighbors; exact boundaries and odd subcell coordinates use the same gate.
        const ids = new Set()
        for (const row of [
          0,
          Math.floor(c.visible.length / 3),
          Math.floor((c.visible.length * 2) / 3),
          c.visible.length - 1,
        ]) {
          const i = c.visible[row]
          for (const delta of [-128, -1, 0, 1, 128]) ids.add((i + delta + 16384) % 16384)
        }
        for (const i of ids)
          for (const offset of [0, 1, 255, 511])
            for (const [j, mesh] of probes.entries()) {
              probes.forEach(p => {
                p.visible = p === mesh
              })
              let x = (i & 127) * 512 + offset,
                y = (i >> 7) * 512 + offset
              if (j) {
                x = ((((i & 127) - (cx >> 9) + 64) & 127) - 64 + (cx >> 9)) * 512 + offset
                y = ((((i >> 7) - (cy >> 9) + 64) & 127) - 64 + (cy >> 9)) * 512 + offset
              }
              const p = { x: x / 256 - 8, z: -y / 256 - 8 }
              mesh.position.set(p.x, 0, p.z)
              r.render(isolated, s.camera)
              gl.readPixels(4, 4, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel)
              const expected = visible.has(i),
                gpu = pixel[0] > 0,
                cpu = s.view.visible(p, !!j)
              if (gpu !== expected || cpu !== expected)
                failures.push({
                  center: c.center,
                  heading: c.heading,
                  i,
                  offset,
                  unwrapped: !!j,
                  expected,
                  gpu,
                  cpu,
                })
              checked++
            }
      }
      for (const m of probes) {
        m.geometry.dispose()
        m.material.dispose()
      }
      r.setSize(s.container.clientWidth, s.container.clientHeight, false)
      s.focus({ x: 2, z: 30 })
      s.startGroundView(0)
      for (let i = 0; i < 18; i++) s.updateCameraMotion(1 / 24)
      s.animate(s.previous)
      cancelAnimationFrame(s.frame)
      return { checked, failures, error: gl.getError() }
    },
    fixture.cases.filter((_, i) => i % 9 === 0)
  )
  assert.deepEqual(result.failures, [])
  assert.equal(result.error, 0)
  await page.screenshot({ path: '/private/tmp/populous-visible-cells-after.png' })
  assert.deepEqual(errors, [])
  console.log(
    'PASS:',
    result.checked,
    'native-captured GPU/CPU visibility decisions, row endpoints, odd coordinates, headings and wrapped/unwrapped copies; no GL/page errors'
  )
} finally {
  await browser.close()
}
