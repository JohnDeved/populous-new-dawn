// Capture real first-mission model submissions for check-native-live-models.py.
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'
import { modelMatrix, modelPoint, projectPoint } from '../app/projection.ts'
import { modelShade } from '../app/model-lighting.ts'
import { modelTriangleVisible, polygonBucket } from '../app/painter-order.ts'

const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  await page.waitForFunction(() => !!window.testScene.terrainTextures)
  const frames = []
  for (const preset of [0, 3, 2]) {
    for (const bearing of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
      const frame = await page.evaluate(
        ({ preset, bearing }) => {
          const s = window.testScene
          s.world.paused = true
          s.startGroundView(preset, bearing)
          for (let i = 0; i < 24; i++) s.updateCameraMotion(1 / 24)
          s.animate(s.previous)
          cancelAnimationFrame(s.frame)
          const models = []
          s.scene.traverseVisible(mesh => {
            const d = mesh.userData
            // Vault morphs need the original morph controller, not a static record.
            if (d.nativeModel === undefined || d.stage !== 4 || d.nativeModel >= 152) return
            const origin = mesh.getWorldPosition(mesh.position.clone())
            if (!s.view.visible(origin)) return
            const attribute = name => Array.from(mesh.geometry.getAttribute(name).array)
            models.push({
              id: d.nativeModel,
              picking: s.picking.model(mesh, `${preset},${bearing}`).map(c => c.kind === 'bounds'
                ? {kind:c.kind,bounds:c.bounds,bucket:c.bucket}
                : {kind:c.kind,points:c.points,bucket:c.bucket}),
              scale: d.nativeScale,
              size: d.nativeSize ?? d.nativeScale,
              heading: mesh.parent.userData.nativeHeading ?? 0,
              tilt: mesh.parent.userData.nativeTilt ?? 0,
              roll: mesh.parent.userData.nativeRoll ?? 0,
              position: [
                Math.round((origin.x + 8) * 256) & 65535,
                Math.round((-origin.z - 8) * 256) & 65535,
                Math.round(origin.y * 128),
              ],
              relative: s.view.relative(origin, (origin.y * 128) / 45),
              vertices: attribute('position'),
              shades: attribute('faceShade'),
              biases: attribute('painterBias'),
              submitted: Array.from(
                { length: mesh.geometry.getAttribute('position').count / 3 },
                (_, i) => s.view.painter.depth(mesh, i, 0) <= 1
              ),
            })
          })
          return { preset, bearing, projection: s.view.projection, center: s.view.center, models }
        },
        { preset, bearing }
      )
      assert.ok(frame.models.length > 10)
      for (const model of frame.models) {
        const rotation = modelMatrix(model.heading, model.tilt, model.roll)
        const points = []
        for (let i = 0; i < model.vertices.length; i += 3) {
          const raw = model.vertices
            .slice(i, i + 3)
            .map((n, axis) => Math.round(n * model.scale * 3 * (axis === 2 ? -1 : 1)))
          points.push(
            projectPoint(modelPoint(raw, model.size, rotation, model.relative), frame.projection)
          )
        }
        model.triangles = []
        for (let i = 0; i < points.length; i += 3) {
          const p = points.slice(i, i + 3),
            a = p[0]
          const visible = modelTriangleVisible(p, frame.projection.width, frame.projection.height)
          assert.equal(
            model.submitted[i / 3],
            visible,
            `Live painter submission: model ${model.id}, triangle ${i / 3}, preset ${preset}`
          )
          if (!visible) continue
          model.triangles.push({
            screen: p.flatMap(v => [v.screenX, v.screenY]),
            shade: modelShade(model.shades[i], a.z),
            bucket: polygonBucket(
              p.map(v => v.z),
              model.biases[i]
            ),
          })
        }
        delete model.vertices
        delete model.shades
        delete model.biases
        delete model.submitted
      }
      frames.push(frame)
      await page.screenshot({
        path: `/private/tmp/populous-models-${preset}-${Math.round((bearing * 2) / Math.PI)}.png`,
      })
    }
  }
  assert.deepEqual(errors, [])
  const path = process.argv[2] ?? '/private/tmp/populous-live-models.json'
  writeFileSync(path, JSON.stringify(frames))
  console.log(
    `Captured ${frames.length} playable views and ${frames.flatMap(f => f.models).length} live models: ${path}`
  )
} finally {
  await browser.close()
}
