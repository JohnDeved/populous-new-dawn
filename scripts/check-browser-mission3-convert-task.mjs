// Tick-stepped natural Mission3 task/movement/conversion, not a realtime benchmark.
// No entity, outcome, mana or task-state injection. Camera focus is diagnostic only.
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const output = resolve(process.env.PND_CAPTURE_DIR ?? 'work/orchestration/mission3-convert-task/browser')
mkdirSync(output, { recursive: true })
const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
try {
  const { page, errors } = await openGame(browser, 3)
  const selected = await page.evaluate(async () => {
    const scene = window.testScene, w = scene.world
    cancelAnimationFrame(scene.frame)
    const { tick } = await import('/app/model.ts')
    let task
    for (let i = 0; i < 2000; i++) {
      task = w.ai.tasks.find(t => t.flags & 1 && t.type === 2 && t.phase === 6)
      if (task) break
      tick(w, 1 / 12)
    }
    const person = w.units.find(u => u.hp > 0 && u.team === 'yellow' && u.kind === 'shaman')
    if (!task || person?.native?.state !== 14) throw new Error('Natural type2 Shaman selection missing')
    window.convertTaskShamanId = person.id
    scene.focus(person)
    window.testStore.update()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    return { turn: w.turn, id: person.id, target: task.target, x: person.x, z: person.z,
      wild: w.units.filter(u => u.hp > 0 && u.team === 'wild').length,
      population: w.units.filter(u => u.hp > 0 && u.team === 'yellow').length,
      casts: w.spellCasts[2][17], stock: w.manaWorld.spells[2].stocks[17] }
  })
  assert.equal(selected.casts, 0)
  assert.equal(selected.stock, 1)
  await page.screenshot({ path: resolve(output, 'convert-shaman-selected.png') })
  const moving = await page.evaluate(async () => {
    const scene = window.testScene, w = scene.world
    const { tick } = await import('/app/model.ts')
    const { currentPersonOrder } = await import('/app/person-orders.ts')
    let task
    for (let i = 0; i < 1000; i++) {
      tick(w, 1 / 12)
      task = w.ai.tasks.find(t => t.flags & 1 && t.type === 2 && t.phase === 8)
      if (task) break
    }
    const person = w.units.find(u => u.id === window.convertTaskShamanId)
    if (!task || !person) throw new Error('Natural type2 movement missing')
    const order = currentPersonOrder(w.buildingOrders, person.native)
    scene.focus(person)
    window.testStore.update()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    const gl = scene.renderer.getContext(), group = scene.unitMeshes.get(person.id)
    if (gl.isContextLost() || !group) throw new Error('Missing active WebGL/Shaman mesh')
    const before = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4), after = new Uint8Array(before.length)
    scene.renderer.render(scene.scene, scene.camera)
    gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, before)
    const visible = group.visible
    group.visible = false
    scene.renderer.render(scene.scene, scene.camera)
    gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, after)
    group.visible = visible
    scene.renderer.render(scene.scene, scene.camera)
    let pixels = 0
    for (let i = 0; i < before.length; i += 4)
      if (before[i] !== after[i] || before[i + 1] !== after[i + 1] || before[i + 2] !== after[i + 2]) pixels++
    return { turn: w.turn, id: person.id, x: person.x, z: person.z, order: order?.model,
      target: task.target, casts: w.spellCasts[2][17], pixels, renderer: gl.getParameter(gl.RENDERER) }
  })
  assert.equal(moving.order, 3)
  assert.equal(moving.casts, 0)
  assert.ok(moving.x !== selected.x || moving.z !== selected.z)
  assert.ok(moving.pixels > 0, 'Natural moving Shaman contributes actual rendered pixels')
  await page.screenshot({ path: resolve(output, 'convert-shaman-moving.png') })
  const converted = await page.evaluate(async () => {
    const scene = window.testScene, w = scene.world
    const { tick } = await import('/app/model.ts')
    for (let i = 0; i < 12000; i++) {
      tick(w, 1 / 12)
      if (w.spellCasts[2][17] && !(w.ai.states & 4) && !w.effects.some(fx => fx.convertWild)) break
    }
    const person = w.units.find(u => u.id === window.convertTaskShamanId)
    scene.focus(person)
    window.testStore.update()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    if (scene.renderer.getContext().isContextLost()) throw new Error('WebGL context lost')
    return { turn: w.turn, casts: w.spellCasts[2][17], stock: w.manaWorld.spells[2].stocks[17],
      wild: w.units.filter(u => u.hp > 0 && u.team === 'wild').length,
      population: w.units.filter(u => u.hp > 0 && u.team === 'yellow').length,
      states: w.ai.states, status: w.status }
  })
  assert.equal(converted.casts, 1)
  assert.equal(converted.stock, 0)
  assert.ok(converted.wild < selected.wild)
  assert.ok(converted.population > selected.population && converted.population > 14)
  assert.equal(converted.states & 4, 0)
  assert.equal(converted.status, 'playing')
  await page.screenshot({ path: resolve(output, 'convert-population-cutoff.png') })
  assert.deepEqual(errors, [])
  writeFileSync(resolve(output, 'result.json'), JSON.stringify({ selected, moving, converted, errors }, null, 2) + '\n')
  console.log(JSON.stringify({ selected, moving, converted, output }, null, 2))
} finally {
  await browser.close()
}
