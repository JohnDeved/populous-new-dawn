import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  const result = await page.evaluate(async () => {
    const s = window.testScene,
      w = s.world,
      m = await import('/app/model.ts'),
      shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
    cancelAnimationFrame(s.frame)
    w.units = w.units.filter(u => u === shaman)
    w.buildings = []
    w.trees = []
    Object.assign(shaman, { x: 8, z: 30, path: [], casting: null })
    const hit = m.addBuilding(w, 'red', 'hut', { x: 14, z: 33 }, true),
      neighbor = m.addBuilding(w, 'red', 'hut', { x: 30, z: 33 }, true)
    const camera = {
      position: s.camera.position.toArray(),
      quaternion: s.camera.quaternion.toArray(),
      point: { ...s.viewPoint },
      bearing: s.cameraBearing,
    }
    w.manaWorld.gameFlags = 32
    w.shots.lightning = 1
    w.paused = false
    if (!m.cast(w, 'lightning', hit)) throw new Error('Lightning cast rejected')
    for (let i = 0; i < 400 && !hit.shake; i++) m.tick(w, 1 / 12)
    if (!hit.shake) throw new Error('Lightning wave never reached building')
    const origin = hit.shakeOrigin
    m.tick(w, 1 / 12)
    const retained = hit.shake === 1 && hit.shakeOrigin === origin
    w.paused = true
    const phases = []
    let gpuPixels = 0
    for (let phase = 1; phase <= 4; phase++) {
      if (phase === 2) {
        s.buildingMeshes.get(hit.id).removeFromParent()
        s.buildingMeshes.delete(hit.id)
      }
      s.animate(s.previous ?? performance.now())
      cancelAnimationFrame(s.frame)
      const group = s.buildingMeshes.get(hit.id),
        mesh = group.children[0],
        values = [...mesh.geometry.getAttribute('nativeWaveOffset').array]
      phases.push({
        phase: group.userData.nativeWave?.phase ?? 0,
        max: Math.max(...values.map(Math.abs)),
        shake: hit.shake ?? 0,
        neighbor: neighbor.shake ?? 0,
      })
      if (phase === 1) {
        const gl = s.renderer.getContext(),
          read = () => {
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
            return pixels
          },
          bent = read(),
          attribute = mesh.geometry.getAttribute('nativeWaveOffset')
        attribute.array.fill(0)
        attribute.needsUpdate = true
        const straight = read()
        attribute.array.set(values)
        attribute.needsUpdate = true
        for (let i = 0; i < bent.length; i += 4)
          if (
            bent[i] !== straight[i] ||
            bent[i + 1] !== straight[i + 1] ||
            bent[i + 2] !== straight[i + 2]
          )
            gpuPixels++
        s.animate(s.previous)
        cancelAnimationFrame(s.frame)
        phases.push({
          phase: group.userData.nativeWave?.phase ?? 0,
          max: Math.max(...values.map(Math.abs)),
          shake: hit.shake ?? 0,
          neighbor: neighbor.shake ?? 0,
        })
      }
      s.gameClock.animationFrame++
    }
    return {
      phases,
      retained,
      gpuPixels,
      camera,
      afterCamera: {
        position: s.camera.position.toArray(),
        quaternion: s.camera.quaternion.toArray(),
        point: { ...s.viewPoint },
        bearing: s.cameraBearing,
      },
    }
  })
  assert.deepEqual(
    result.phases.map(p => p.phase),
    [1, 1, 2, 3, 0]
  )
  assert.equal(result.retained, true)
  assert.ok(result.gpuPixels > 0)
  assert.ok(result.phases[0].max > result.phases[2].max)
  assert.ok(result.phases[2].max >= result.phases[3].max)
  assert.equal(result.phases[4].max, 0)
  assert.ok(result.phases.every(p => p.neighbor === 0))
  assert.deepEqual(result.afterCamera, result.camera)
  assert.deepEqual(errors, [])
  console.log(
    'PASS: live Lightning wave bends only the hit building for three refresh-independent 24 Hz phases; camera unchanged'
  )
} finally {
  await browser.close()
}
