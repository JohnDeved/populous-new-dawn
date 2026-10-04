import assert from 'node:assert/strict'
import { writeFileSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'

// Controlled eight-Brave fixture, ordinary pointer command, deterministic fixed
// turns and fractional rendered frames. This is not an unmodified campaign run.
export default async function ({ page, openMission, output, signal }) {
  const expectedContinuous = process.env.PND_EXPECT_TRAINING_INTERPOLATION !== '0'
  await openMission(1)
  signal.throwIfAborted()
  await page.evaluate(async () => {
    const s = window.testScene, w = s.world,
      m = await import('/app/model.ts'),
      { advanceGame } = await import('/app/game-clock.ts')
    cancelAnimationFrame(s.frame)
    // Finish the actual opening before introducing an isolated mechanics fixture.
    w.speed = 1
    for (let i = 0; i < 160; i++) advanceGame(w, s.gameClock, 1 / 12)
    w.speed = 0
    w.manaWorld.gameFlags = 32
    w.terrain.fill(3)
    w.terrainVersion++
    const b = m.addBuilding(w, 'blue', 'camp', { x: -2, z: 32 }, true, { angle: Math.PI }),
      people = Array.from({ length: 8 }, (_, i) => m.addUnit(w, 'blue', 'brave', { x: 7 + i * .4, z: 33 }))
    w.selected = people.map(u => u.id)
    window.trainingEntry = { b, people, advanceGame }
    s.focus(b)
    s.startGroundView(2)
    for (let i = 0; i < 24; i++) s.updateCameraMotion(1 / 24)
    s.animate(s.previous)
    cancelAnimationFrame(s.frame)
  })
  const target = await page.evaluate(() => {
    const s = window.testScene, p = s.screen(window.trainingEntry.b), r = s.container.getBoundingClientRect()
    return { x: r.left + (p.x + 1) * r.width / 2, y: r.top + (1 - p.y) * r.height / 2 }
  })
  await page.mouse.click(target.x, target.y)
  await page.mouse.move(1400, 50)
  const admission = await page.evaluate(async () => {
    const s = window.testScene, w = s.world, h = window.trainingEntry,
      { unitPosition } = await import('/app/unit-motion.ts')
    if (!h.people.every(u => u.work === h.b.id)) throw Error('Pointer did not command the training fixture')
    w.speed = 1
    let found
    for (let i = 0; i < 240 && !found; i++) {
      const before = h.people.map(u => ({ id: u.id, inside: u.inside, position: unitPosition(w, u) }))
      h.advanceGame(w, s.gameClock, 1 / 12)
      const prior = before.find(p => p.inside === null && h.people.find(u => u.id === p.id).inside === h.b.id)
      if (prior) {
        const u = h.people.find(u => u.id === prior.id)
        found = { id: u.id, turn: w.turn, from: prior.position, to: unitPosition(w, u), renderFlags: u.entry.person.renderFlags, inside: h.b.admission.inside }
        h.person = u
      }
    }
    w.speed = 0
    if (!found) throw Error('No admission reached')
    h.admission = found
    return found
  })
  assert.equal(admission.renderFlags & 16, 0)
  const samples = []
  for (const fraction of [0, .5, 1]) {
    signal.throwIfAborted()
    const sample = await page.evaluate(fraction => {
      const s = window.testScene, h = window.trainingEntry
      s.world.pendingTime = fraction / 12
      s.animate(s.previous)
      cancelAnimationFrame(s.frame)
      const group = s.unitMeshes.get(h.person.id)
      return { fraction, position: group.position.toArray(), visible: group.visible, frame: group.userData.frame }
    }, fraction)
    samples.push(sample)
    await page.screenshot({ path: resolve(output, `training-entry-${fraction}.png`) })
    // Isolate the actual resident sprite from roof coverage and other followers.
    // No simulation/camera/animation changes are introduced by this diagnostic.
    await page.evaluate(() => {
      const s = window.testScene, group = s.unitMeshes.get(window.trainingEntry.person.id), ancestors = new Set()
      for (let p = group; p; p = p.parent) ancestors.add(p)
      const hidden = []
      s.scene.traverse(object => {
        if (!ancestors.has(object) && !group.getObjectById(object.id) && object.visible) {
          hidden.push(object); object.visible = false
        }
      })
      window.trainingEntry.hidden = hidden
      s.renderer.render(s.scene, s.camera)
    })
    await page.screenshot({ path: resolve(output, `training-entry-isolated-${fraction}.png`) })
    await page.evaluate(() => {
      const s = window.testScene
      for (const object of window.trainingEntry.hidden) object.visible = true
      s.renderer.render(s.scene, s.camera)
    })
  }
  const delta = Math.hypot(admission.to.x - admission.from.x, admission.to.z - admission.from.z)
  assert.ok(delta > .1, 'The admission step must have a visible motion distance')
  for (const sample of samples) {
    assert.equal(sample.visible, true)
    const fraction = expectedContinuous ? sample.fraction : 1
    const expected = ['x', 'y', 'z'].map(key => admission.from[key] + (admission.to[key] - admission.from[key]) * fraction)
    expected.forEach((value, i) => assert.ok(Math.abs(value - sample.position[i]) < 1e-8))
  }
  const report = { expectedContinuous, admission, samples, delta,
    scenarioSha256: createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex'),
    method: 'Manipulated flat-land eight-Brave/completed-hut fixture after ordinary startup; real pointer group command; deterministic fixed turns and fractional rendered samples.',
    limits: 'Actual software-WebGL browser pixels; isolated images deliberately remove hut/other-object coverage. Not matched original pixels, full campaign acceptance or hardware performance.' }
  writeFileSync(resolve(output, 'training-entry.json'), JSON.stringify(report, null, 2) + '\n')
  return report
}
