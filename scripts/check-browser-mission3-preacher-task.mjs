// Natural mission3 training/task/movement, with rendering and screenshot evidence.
// Simulation is advanced through normal tick; no entities/outcomes are injected.
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const output = resolve(
  process.env.PND_CAPTURE_DIR ?? 'work/orchestration/mission3-preacher-task/browser'
)
mkdirSync(output, { recursive: true })
const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
try {
  const { page, errors } = await openGame(browser, 3)
  const selected = await page.evaluate(async () => {
    const scene = window.testScene,
      w = scene.world
    cancelAnimationFrame(scene.frame)
    const { tick } = await import('/app/model.ts')
    let task
    for (let i = 0; i < 12000; i++) {
      task = w.ai.tasks.find(t => t.flags & 1 && t.type === 11 && t.phase === 5)
      if (task) break
      tick(w, 1 / 12)
    }
    if (!task) throw new Error('Natural marker3 task did not reach phase5')
    const person = w.units.find(u => u.id === task.entity)
    if (!person || person.kind !== 'preacher' || person.native?.state !== 14)
      throw new Error('Type11 has no selected natural Preacher')
    window.markerPreacherId = person.id
    window.markerPreacherTarget = task.target
    scene.focus(person)
    window.testStore.update()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    return {
      turn: w.turn,
      id: person.id,
      target: task.target,
      x: person.x,
      z: person.z,
      temple: w.buildings.some(b => b.team === 'yellow' && b.kind === 'temple' && b.progress === 1),
    }
  })
  assert.equal(selected.temple, true)
  await page.screenshot({ path: resolve(output, 'natural-preacher-selected.png') })
  const arrived = await page.evaluate(async () => {
    const scene = window.testScene,
      w = scene.world
    const { tick } = await import('/app/model.ts')
    const { currentPersonOrder } = await import('/app/person-orders.ts')
    const person = w.units.find(u => u.id === window.markerPreacherId)
    const target = window.markerPreacherTarget
    for (let i = 0; i < 1000; i++) {
      tick(w, 1 / 12)
      const p = person.native,
        order = p && currentPersonOrder(w.buildingOrders, p)
      if (
        order &&
        [17, 31, 32].includes(order.model) &&
        (((p.x >>> 8) & 254) | (p.y & 0xfe00)) === (target & 0xfefe)
      )
        break
    }
    const p = person.native,
      order = p && currentPersonOrder(w.buildingOrders, p)
    scene.focus(person)
    window.testStore.update()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    const gl = scene.renderer.getContext(),
      group = scene.unitMeshes.get(person.id)
    if (gl.isContextLost() || !group) throw new Error('Missing active WebGL/unit mesh')
    const before = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4),
      after = new Uint8Array(before.length)
    scene.renderer.render(scene.scene, scene.camera)
    gl.readPixels(
      0,
      0,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      before
    )
    const visible = group.visible
    group.visible = false
    scene.renderer.render(scene.scene, scene.camera)
    gl.readPixels(
      0,
      0,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      after
    )
    group.visible = visible
    scene.renderer.render(scene.scene, scene.camera)
    let pixels = 0
    for (let i = 0; i < before.length; i += 4)
      if (
        before[i] !== after[i] ||
        before[i + 1] !== after[i + 1] ||
        before[i + 2] !== after[i + 2]
      )
        pixels++
    return {
      turn: w.turn,
      id: person.id,
      model: order?.model,
      cell: p && ((p.x >>> 8) & 254) | (p.y & 0xfe00),
      target: target & 0xfefe,
      x: person.x,
      z: person.z,
      pixels,
      status: w.status,
      renderer: gl.getParameter(gl.RENDERER),
    }
  })
  assert.ok([17, 31, 32].includes(arrived.model))
  assert.equal(arrived.cell, arrived.target)
  assert.ok(arrived.x !== selected.x || arrived.z !== selected.z)
  assert.ok(arrived.pixels > 0, 'Natural Preacher contributes rendered pixels')
  assert.equal(arrived.status, 'playing')
  await page.screenshot({ path: resolve(output, 'natural-preacher-at-marker.png') })
  assert.deepEqual(errors, [])
  writeFileSync(
    resolve(output, 'result.json'),
    JSON.stringify({ selected, arrived, errors }, null, 2) + '\n'
  )
  console.log(JSON.stringify({ selected, arrived, output }, null, 2))
} finally {
  await browser.close()
}
