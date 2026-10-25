// Public Mission 3 entry and real checkpoint controls. Acquisition uses ordinary
// model commands with diagnostic fixed turns; only the final saved sermon runs
// on the actual requestAnimationFrame elapsed-time clock.
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { bindGame } from './browser-game.mjs'
import { waitForCheckpointReadback } from './checkpoint-readback.mjs'
import { parseOptions, runLocalBrowser } from './local-render/harness.mjs'

const options = parseOptions(process.argv.slice(2))
const receipt = await runLocalBrowser(options, async ({ page, openMission, output, receipt }) => {
  await openMission(3)
  const acquired = await page.evaluate(async () => {
    const scene = window.testScene
    cancelAnimationFrame(scene.frame)
    const { naturalPreacherJourney } = await import('/scripts/mission3-natural-preacher-scenario.mjs')
    const journey = naturalPreacherJourney(scene.world)
    window.preachingIds = { preacher: journey.preacher.id, victim: journey.victim.id }
    scene.focus(journey.preacher)
    window.testStore.update()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    const gl = scene.renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info')
    return { milestones: journey.milestones, ids: window.preachingIds, traineeId: journey.traineeId,
      templeId: journey.templeId, timer: journey.victim.native.timer, speed: scene.world.speed,
      renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      contextLost: gl.isContextLost() }
  })
  assert.equal(acquired.contextLost, false)
  assert.equal(acquired.speed, 1)
  await page.screenshot({ path: resolve(output, 'natural-blue-sermon.png') })
  await page.getByRole('button', { name: 'Game settings', exact: true }).click()
  await page.getByRole('button', { name: 'Save checkpoint', exact: true }).click()
  // Read back the persisted state: an in-session save alone does not prove a
  // fresh-page checkpoint. No storage writes outside the shipped save control.
  const persisted = await waitForCheckpointReadback(() => page.evaluate(async ids => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('populous-new-dawn', 1)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    try {
      const saved = await new Promise((resolve, reject) => {
        const request = db.transaction('checkpoints', 'readonly').objectStore('checkpoints').get('latest')
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
      const victim = saved?.world?.units.find(unit => unit.id === ids.victim)
      return victim?.native?.state === 23 && victim.native.workTarget === ids.preacher
    } finally { db.close() }
  }, acquired.ids))
  assert.equal(persisted, true, 'Saved checkpoint never persisted its state23/owner')
  await page.getByRole('button', { name: 'Continue Game', exact: false }).click()
  await page.waitForFunction(() => !window.testStore.getWorld().paused)
  const cancelled = await page.evaluate(async () => {
    const scene = window.testScene
    cancelAnimationFrame(scene.frame)
    const { command, setSelection } = await import('/app/model.ts')
    const { currentPersonOrder } = await import('/app/person-orders.ts')
    const w = scene.world, ids = window.preachingIds
    setSelection(w, [ids.preacher])
    if (!command(w, { x: -33, z: -113 })) throw Error('Cancellation movement rejected')
    const victim = w.units.find(unit => unit.id === ids.victim), preacher = w.units.find(unit => unit.id === ids.preacher)
    window.testStore.update()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    return { turn: w.turn, victimId: victim.id, team: victim.team, state: victim.native.state,
      owner: victim.native.workTarget, listenerFlag: victim.native.flags4 & 128,
      sermonFlag: victim.native.flags2 & 0x200000, preacherOrder: currentPersonOrder(w.buildingOrders, preacher.native)?.model }
  })
  assert.equal(cancelled.team, 'yellow')
  assert.notEqual(cancelled.state, 23)
  assert.equal(cancelled.owner, 0)
  assert.equal(cancelled.listenerFlag, 0)
  assert.equal(cancelled.sermonFlag, 0)
  assert.equal(cancelled.preacherOrder, 3)
  await page.screenshot({ path: resolve(output, 'sermon-cancelled.png') })

  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Load Game', exact: true }).click()
  await bindGame(page)
  const resumed = await page.evaluate(async ids => {
    const scene = window.testScene
    cancelAnimationFrame(scene.frame)
    const { observeCampaignConversions } = await import('/scripts/campaign-conversion-observer.mjs')
    const w = scene.world, victim = w.units.find(unit => unit.id === ids.victim), preacher = w.units.find(unit => unit.id === ids.preacher)
    if (victim?.native?.state !== 23 || victim.native.workTarget !== ids.preacher || preacher?.kind !== 'preacher')
      throw Error('Fresh-page checkpoint lost the real sermon')
    if (w.speed !== 1 || w.paused) throw Error('Real-clock witness requires unpaused normal speed')
    scene.focus(preacher)
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    window.sermonObservation = observeCampaignConversions(w)
    const original = scene.gameClock.afterTurn
    window.restoreSermonObserver = () => { scene.gameClock.afterTurn = original }
    window.sermonStarted = performance.now()
    scene.gameClock.afterTurn = () => {
      original()
      window.sermonObservation = observeCampaignConversions(w, window.sermonObservation)
      if (!window.sermonFirstEvent && window.sermonObservation.events.length)
        window.sermonFirstEvent = { elapsedMs: performance.now() - window.sermonStarted, turn: w.turn }
    }
    const start = { turn: w.turn, timer: victim.native.timer, owner: victim.native.workTarget,
      state: victim.native.state, paused: w.paused, speed: w.speed, animationFrame: scene.gameClock.animationFrame }
    // End diagnostic suspension without admitting its wall-time as game catchup.
    scene.previous = performance.now()
    scene.animate(scene.previous)
    return start
  }, acquired.ids)
  assert.ok(resumed.timer > 0 && resumed.timer <= acquired.timer)
  await page.waitForFunction(() => !!window.sermonFirstEvent, null, { timeout: 90000, polling: 50 })
  const converted = await page.evaluate(ids => {
    const scene = window.testScene
    cancelAnimationFrame(scene.frame)
    window.restoreSermonObserver()
    const event = window.sermonObservation.events.find(event => event.victims.some(victim => victim.id === ids.victim))
    if (!event) throw Error('No authored-victim replacement event')
    const w = scene.world, replacement = w.units.find(unit => unit.id === event.replacements[0].id)
    if (!replacement) throw Error('Converted replacement disappeared')
    scene.focus(replacement)
    window.testStore.update()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    const gl = scene.renderer.getContext(), mesh = scene.unitMeshes.get(replacement.id)
    if (!mesh || gl.isContextLost()) throw Error('Converted Brave is not renderable')
    const visible = mesh.visible, pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4), hidden = new Uint8Array(pixels.length)
    scene.renderer.render(scene.scene, scene.camera)
    gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
    mesh.visible = false
    scene.renderer.render(scene.scene, scene.camera)
    gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, hidden)
    mesh.visible = visible
    scene.renderer.render(scene.scene, scene.camera)
    let changedPixels = 0
    for (let i = 0; i < pixels.length; i += 4)
      if (pixels[i] !== hidden[i] || pixels[i + 1] !== hidden[i + 1] || pixels[i + 2] !== hidden[i + 2]) changedPixels++
    return { event, firstEvent: window.sermonFirstEvent, turn: w.turn, status: w.status,
      oldVictimPresent: w.units.some(unit => unit.id === ids.victim), changedPixels,
      replacement: { id: replacement.id, kind: replacement.kind, team: replacement.team,
        flags3: replacement.native?.flags3, flags4: replacement.native?.flags4 },
      animationFrame: scene.gameClock.animationFrame }
  }, acquired.ids)
  assert.equal(converted.oldVictimPresent, false)
  assert.equal(converted.event.victims.length, 1)
  assert.equal(converted.event.replacements.length, 1)
  assert.equal(converted.replacement.team, 'blue')
  assert.equal(converted.replacement.kind, 'brave')
  assert.ok(converted.replacement.flags3 & 0x1000000)
  assert.ok(converted.replacement.flags4 & 0x40000)
  assert.ok(converted.changedPixels > 0)
  assert.ok(converted.animationFrame > resumed.animationFrame)
  assert.ok(converted.firstEvent.elapsedMs > 5000, 'Conversion must advance on the actual elapsed clock')
  assert.equal(converted.status, 'playing')
  await page.screenshot({ path: resolve(output, 'converted-blue-brave.png') })
  assert.deepEqual(receipt.errors, [])
  const result = { acquired, cancelled, resumed, converted,
    limits: 'Fresh public Mission 3. Vault/Temple/training/approach use ordinary model commands with diagnostic fixed turns. Save checkpoint and fresh-page Load Game use shipped controls; only the resumed conversion uses actual normal-speed requestAnimationFrame elapsed time. Software/headless WebGL, no native full-game parity or hardware/FPS claim. No runtime or parity changes.' }
  writeFileSync(resolve(output, 'natural-preacher.json'), JSON.stringify(result, null, 2) + '\n')
  return result
})
console.log(JSON.stringify({ status: receipt.status, commit: receipt.source.commit, result: receipt.result }, null, 2))
