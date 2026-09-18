// Authored Mission 2 -> H selection -> normal attack command -> combat death.
// Only pacing/camera controls and read-only inspection are test-driven: no HP,
// position, entity, effect, timer, RNG, AI or outcome injection.
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from '@playwright/test'
import { openGame, bindGame } from './browser-game.mjs'

const dir = resolve(process.env.POPULOUS_ARTIFACT_DIR ?? 'work/orchestration/worker5-30-cadence-impl/browser')
mkdirSync(dir, { recursive: true })
const report = { mission: 2, adapter: 'H selection; normal command/tick on authored warrior 13; deterministic RAF pacing', stages: [] }
const browser = await chromium.launch({ headless: true })
let page
try {
  const opened = await openGame(browser, 2)
  page = opened.page
  page.setDefaultTimeout(45000)
  await page.evaluate(() => {
    const s = window.testScene
    cancelAnimationFrame(s.frame)
    s.world.speed = 0
  })
  await page.locator('.world-viewport canvas.battlefield').focus()
  await page.keyboard.press('h')
  report.death = await page.evaluate(async () => {
    const s = window.testScene, w = s.world
    cancelAnimationFrame(s.frame)
    const { command, tick } = await import('/app/model.ts')
    const shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
    if (!w.selected.includes(shaman.id)) throw Error('H did not select the authored Shaman')
    const target = w.units.find(u => u.id === 13)
    if (target?.kind !== 'warrior' || target.team === 'blue') throw Error('Missing authored Matak warrior 13')
    const before = { id: shaman.id, x: shaman.x, z: shaman.z, hp: shaman.hp, turn: w.turn }
    w.speed = 1
    if (!command(w, target)) throw Error('Normal attack command was rejected')
    let fights = 0, injured = false, f
    for (let i = 0; i < 2000 && w.status === 'playing'; i++) {
      tick(w, 1 / 12)
      fights += Number(!!shaman.fight || shaman.fighting)
      injured ||= shaman.hp < before.hp && shaman.hp > 0
      f = w.effects.find(effect => effect.reincarnation?.team === 'blue')
      if (f) break
    }
    if (!f || !injured || !fights) throw Error(`Combat did not reach death: turn=${w.turn}, hp=${shaman.hp}, fights=${fights}`)
    if (w.units.includes(shaman)) throw Error('Dead Shaman still in the unit roster')
    if (w.effects.filter(effect => effect.reincarnation?.team === 'blue').length !== 1) throw Error('Duplicate death presentation')
    w.speed = 0
    window.deathFxId = f.id
    window.deadShamanId = shaman.id
    window.deathAnchor = { x: f.x, z: f.z, heading: f.unit.heading }
    s.focus(f)
    for (let i = 0; i < 120; i++) s.updateCameraMotion(1 / 24)
    s.animate(s.previous)
    cancelAnimationFrame(s.frame)
    return { before, turn: w.turn, hp: shaman.hp, fights, injured, anchor: window.deathAnchor,
      effect: { id: f.id, phase: f.reincarnation.phase, ground: f.reincarnation.ground },
      status: w.status, nextId: w.nextId, rng: w.randomState }
  })
  assert.equal(report.death.hp, 0)
  assert.equal(report.death.effect.phase, 0, 'ordinary land death starts with the body')
  report.stages.push('Normal authored combat death, one model-12 effect at the death anchor')
  await page.screenshot({ path: `${dir}/death-body.png` })

  // Real GameScene.animate -> advanceGame -> existing effect-animation visit.
  // World speed0 holds the simulation phase; it does not stop presentation.
  const presentation = () => page.evaluate(() => {
    const s = window.testScene, w = s.world
    cancelAnimationFrame(s.frame)
    const f = w.effects.find(f => f.id === window.deathFxId)
    const before = s.gameClock.animationFrame
    s.animate(s.previous + 1000 / 24)
    cancelAnimationFrame(s.frame)
    const g = s.fxMeshes.get(f.id), shown = f.reincarnation.displayedFrame
    return { shown, next: f.animation.f2, frame: g.userData.frame, phase: f.reincarnation.phase,
      candidates: g.userData.directions.map(d => d.frames[shown]),
      visits: s.gameClock.animationFrame - before, turn: w.turn, rng: w.randomState,
      respawns: [...w.respawns], visible: g.visible }
  })
  const assertVisit = (state, shown, next) => {
    assert.equal(state.visits, 1)
    assert.equal(state.shown, shown)
    assert.equal(state.next, next)
    assert.ok(state.candidates.includes(state.frame), 'renderer must use the retained frame')
  }
  report.bodyFirst = await presentation()
  report.bodySecond = await presentation()
  assertVisit(report.bodyFirst, 0, 1)
  assertVisit(report.bodySecond, 1, 2)
  assert.notEqual(report.bodyFirst.frame, report.bodySecond.frame)
  assert.equal(report.bodyFirst.turn, report.bodySecond.turn)
  assert.equal(report.bodyFirst.rng, report.bodySecond.rng)
  assert.deepEqual(report.bodyFirst.respawns, report.bodySecond.respawns)
  await page.screenshot({ path: `${dir}/body-second-visit.png` })

  // Save while paused so newly constructed scene RAFs cannot advance a body
  // frame between load and inspection; no new clock/checkpoint implementation.
  await page.evaluate(async () => {
    window.testScene.world.paused = true
    await window.testStore.saveCheckpoint()
    if (!window.testStore.loadCheckpoint()) throw Error('Body checkpoint load failed')
  })
  await bindGame(page)
  report.bodyRestored = await page.evaluate(() => {
    const s = window.testScene, w = s.world
    cancelAnimationFrame(s.frame)
    const f = w.effects.find(f => f.id === window.deathFxId)
    s.focus(f)
    for (let i = 0; i < 120; i++) s.updateCameraMotion(1 / 24)
    s.animate(s.previous)
    cancelAnimationFrame(s.frame)
    w.paused = false
    return { shown: f.reincarnation.displayedFrame, next: f.animation.f2, rng: w.randomState,
      turn: w.turn, respawns: [...w.respawns] }
  })
  assert.deepEqual(report.bodyRestored, { shown: 1, next: 2, rng: report.bodySecond.rng,
    turn: report.bodySecond.turn, respawns: report.bodySecond.respawns })
  report.bodyAfterLoad = await presentation()
  assertVisit(report.bodyAfterLoad, 2, 3)
  report.stages.push('Actual body visits display0/1; checkpoint retains1 with next2 and resumes at2')

  const advanceTo = phase => page.evaluate(async phase => {
    const s = window.testScene, w = s.world, { tick } = await import('/app/model.ts')
    cancelAnimationFrame(s.frame)
    w.speed = 1
    let f
    for (let i = 0; i < 500; i++) {
      f = w.effects.find(effect => effect.id === window.deathFxId)
      if (!f || f.reincarnation.phase >= phase) break
      tick(w, 1 / 12)
    }
    w.speed = 0
    if (f?.reincarnation.phase !== phase) throw Error(`Did not reach phase ${phase}`)
    s.animate(s.previous)
    cancelAnimationFrame(s.frame)
    const g = s.fxMeshes.get(f.id)
    return { phase: f.reincarnation.phase, visible: g.visible, frame: g.userData.frame,
      source: g.userData.directions[0].source, candidates: g.userData.directions.map(d => d.frames[9]),
      layerOwner: g.userData.layerOwner, drawFlags: g.userData.drawFlags,
      anchor: { x: f.x, z: f.z, heading: f.unit.heading }, height: f.height, ground: f.reincarnation.ground,
      turn: w.turn, rng: w.randomState, status: w.status }
  }, phase)
  report.transitionEntry = await advanceTo(2)
  report.transitionFirst = await presentation()
  report.transitionSecond = await presentation()
  assertVisit(report.transitionFirst, 0, 1)
  assertVisit(report.transitionSecond, 1, 2)
  assert.notEqual(report.transitionFirst.frame, report.transitionSecond.frame)
  assert.equal(report.transitionFirst.phase, 2)
  assert.equal(report.transitionFirst.turn, report.transitionSecond.turn)
  assert.equal(report.transitionFirst.rng, report.transitionSecond.rng)
  assert.deepEqual(report.transitionFirst.respawns, report.transitionSecond.respawns)
  await page.screenshot({ path: `${dir}/transition-second-visit.png` })
  report.stages.push('Processed transition entry resets; actual visits display0/1 before increment')
  report.rise = await advanceTo(3)
  assert.equal(report.rise.visible, true)
  assert.equal(report.rise.source, 360)
  assert.ok(report.rise.candidates.includes(report.rise.frame), 'live renderer must draw final frame, not frame zero')
  assert.equal(report.rise.layerOwner, 0)
  assert.equal(report.rise.drawFlags, 6)
  assert.deepEqual(report.rise.anchor, report.death.anchor)
  assert.equal(Math.round(report.rise.height * 45) - report.rise.ground, 40)

  report.pixels = await page.evaluate(() => {
    const s = window.testScene, g = s.fxMeshes.get(window.deathFxId), renderer = s.renderer
    const gl = renderer.getContext(), size = gl.drawingBufferWidth * gl.drawingBufferHeight * 4
    const visible = g.visible, a = new Uint8Array(size), b = new Uint8Array(size)
    const draw = output => {
      s.view.prepare(s.scene)
      renderer.render(s.scene, s.camera)
      gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, output)
    }
    try {
      draw(a)
      g.visible = false
      draw(b)
      let changed = 0
      for (let i = 0; i < size; i += 4)
        if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) changed++
      return changed
    } finally {
      g.visible = visible
      s.view.prepare(s.scene)
      renderer.render(s.scene, s.camera)
    }
  })
  assert.ok(report.pixels > 0, 'the real spirit must contribute visible framebuffer pixels')
  await page.screenshot({ path: `${dir}/death-rise.png` })
  report.stages.push('Source 360 final frame visible with original owner/heading and rising anchor')

  report.wait = await advanceTo(4)
  assert.equal(report.wait.turn - report.rise.turn, 32)
  assert.equal(report.wait.visible, false)
  assert.equal(Math.round(report.wait.height * 45) - report.wait.ground, 1280)
  assert.deepEqual(report.wait.anchor, report.death.anchor)
  report.paused = await page.evaluate(() => {
    const s = window.testScene, w = s.world
    const state = () => JSON.stringify({ turn: w.turn, rng: w.randomState, outcome: w.outcome,
      respawns: w.respawns, effect: w.effects.find(f => f.id === window.deathFxId) })
    const before = state()
    for (let i = 0; i < 60; i++) { s.animate(s.previous); cancelAnimationFrame(s.frame) }
    return { unchanged: before === state(), visible: s.fxMeshes.get(window.deathFxId).visible }
  })
  assert.deepEqual(report.paused, { unchanged: true, visible: false })
  await page.evaluate(async () => {
    await window.testStore.saveCheckpoint()
    if (!window.testStore.loadCheckpoint()) throw Error('Checkpoint load failed')
  })
  await bindGame(page)
  report.checkpoint = await advanceTo(4)
  assert.equal(report.checkpoint.visible, false, 'checkpoint reconstruction must not reveal the waiting spirit')
  assert.deepEqual(report.checkpoint.anchor, report.wait.anchor)
  assert.equal(report.checkpoint.turn, report.wait.turn)
  assert.equal(report.checkpoint.rng, report.wait.rng)
  await page.screenshot({ path: `${dir}/death-hidden-checkpoint.png` })
  report.stages.push('Hidden after 32 rise visits; paused rendering and checkpoint keep it hidden without simulation mutation')

  report.cleanup = await page.evaluate(async () => {
    const s = window.testScene, w = s.world, { tick } = await import('/app/model.ts')
    cancelAnimationFrame(s.frame)
    w.speed = 1
    let waited = 0
    while (waited < 310 && w.effects.some(f => f.id === window.deathFxId)) {
      tick(w, 1 / 12)
      waited++
    }
    w.speed = 0
    s.animate(s.previous)
    cancelAnimationFrame(s.frame)
    const shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
    return { waited, effectGone: !w.effects.some(f => f.id === window.deathFxId),
      meshGone: !s.fxMeshes.has(window.deathFxId), respawnId: shaman?.id,
      oldId: window.deadShamanId, status: w.status }
  })
  // The captured first hidden visit has already consumed one of 300 wait visits.
  assert.equal(report.cleanup.waited, 300)
  assert.equal(report.cleanup.effectGone, true)
  assert.equal(report.cleanup.meshGone, true)
  assert.ok(report.cleanup.respawnId && report.cleanup.respawnId !== report.cleanup.oldId)
  assert.equal(report.cleanup.status, 'playing')
  assert.deepEqual(opened.errors, [])
  report.stages.push('Remaining 299 wait visits plus spawn visit remove effect/mesh and restore Shaman without ending the game')
  report.status = 'PASS'
  console.log(JSON.stringify(report, null, 2))
} catch (error) {
  report.status = 'FAIL'
  report.error = error.stack ?? String(error)
  if (page) await page.screenshot({ path: `${dir}/failure.png` }).catch(() => {})
  throw error
} finally {
  writeFileSync(`${dir}/report.json`, JSON.stringify(report, null, 2))
  await browser.close()
}
