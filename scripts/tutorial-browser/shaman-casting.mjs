import { commandCategory } from '../browser-command-categories.mjs'
import { setWorldPaused } from '../browser-world-input.mjs'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { installShamanCastingObserver } from './shaman-casting-observer.mjs'
import { castingArtworkReference, validateShamanCastingEvidence } from './shaman-casting-evidence.mjs'

// This helper owns no context, world, timer or browser. The existing F9 episode
// supplies its unchanged 55s bound and public Mission 1 Scene.
export async function beginOrdinaryCastingWitness(page) {
  const button = name => page.getByRole('button', { name, exact: true })
  assert.equal(await page.evaluate(() => window.testStore.hasUsedCheats()), false)
  // Let the ordinary clock finish reincarnation. finishStart enters idle
  // approach (17), which settles into resting state 19. State 10 here still
  // owns opening command18; it is not the authored idle caster.
  await setWorldPaused(page, false, { timeout: 2500 })
  await page.waitForFunction(() => {
    const w = window.testStore.getWorld(), u = w.units.find(u => u.team === 'blue' && u.kind === 'shaman'),
      p = u?.native, order = p && w.buildingOrders.records[p.immediateCommand || p.commands[p.commandCursor]]
    return w.status === 'playing' && !w.paused && !w.inputMask && w.shots.blast > 0 &&
      !w.castingTribes[0].cooldown && u?.hp > 0 && !u.flight && !u.lift && p?.state === 19 &&
      !p.vehicle && !(p.flags2 & 0x100000) && !(p.flags4 & 128) && order?.model !== 18
  })
  await setWorldPaused(page, true, { timeout: 2500 })
  await button('Select shaman').click()
  await button('Select shaman').click({ button: 'right' })
  await page.waitForFunction(() => {
    const s = window.testSceneRef.current, u = s.world.units.find(u => u.team === 'blue' && u.kind === 'shaman')
    return s.world.selected.includes(u.id) && !s.cameraMotion.active && !s.viewTransition && !s.resultCamera.active
  })
  await page.evaluate(installShamanCastingObserver)
  const before = await page.evaluate(() => window.shamanCastingObserver.arm('ordinary'))
  assert.ok(before.stock > 0); assert.equal(before.cheatsUsed, false)
  await commandCategory(page, 'spells').click()
  await page.getByRole('button', { name: /^Blast, [1-9][0-9]* shots$/ }).click()
  assert.equal(await page.evaluate(() => window.testStore.getWorld().mode), 'blast')
  await setWorldPaused(page, false, { timeout: 2500 })
  const target = await page.evaluate(() => {
    const s = window.testSceneRef.current, u = s.world.units.find(u => u.team === 'blue' && u.kind === 'shaman'),
      point = { x: u.x + 5, z: u.z + 5 }, projected = s.screen(point, Math.max(0, s.y(point))),
      r = s.renderer.domElement.getBoundingClientRect()
    return { x: r.left + (projected.x + 1) * r.width / 2, y: r.top + (1 - projected.y) * r.height / 2 }
  })
  await page.mouse.move(target.x, target.y)
  await page.waitForFunction(point => {
    const s = window.testSceneRef.current
    return s.pointerScreen?.clientX === point.x && s.pointerScreen?.clientY === point.y &&
      s.pointer && document.elementFromPoint(point.x, point.y) === s.renderer.domElement
  }, target)
  await page.mouse.click(target.x, target.y)
  await waitForCastingWitness(page, 'ordinary')
  await setWorldPaused(page, true, { timeout: 2500 })
  return { target, before }
}

export async function waitForCastingWitness(page, label) {
  await page.waitForFunction(label => {
    const state = window.shamanCastingObserver.status()
    if (state.errors.length) throw Error(state.errors.join('; '))
    return state.casts.some(cast => cast.label === label && cast.done)
  }, label)
}

// Called before the existing context is disposed, including on failure. Raw
// observations/copies are retained even if validation rejects the run.
export async function retainCastingWitness(page, output, { validate = true } = {}) {
  const observation = await page.evaluate(() => window.shamanCastingObserver?.finish() ?? null)
  if (!observation) return null
  const root = resolve(import.meta.dirname, '../..'), sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
  const report = { status: 'failed', observation, native: castingArtworkReference.provenance,
    source: Object.fromEntries(['app/person-casting.ts', 'app/live-people.ts', 'app/live-command.ts',
      'app/spell-casting.ts', 'app/world-turn.ts', 'app/scene-entities.ts', 'app/unit-animation-source.ts',
      'app/game-clock.ts', 'app/original-units.json', 'tests/fixtures/shaman-casting-native.json',
      'scripts/tutorial-browser/shaman-casting.mjs', 'scripts/browser-world-input.mjs', 'scripts/browser-command-categories.mjs', 'scripts/tutorial-browser/shaman-casting-observer.mjs',
      'scripts/tutorial-browser/shaman-casting-evidence.mjs']
      .map(file => [file, sha256(readFileSync(resolve(root, file)))])) }
  try {
    for (const cast of observation.casts) for (const crop of cast.crops) {
      if (!crop.png) continue
      assert.match(crop.file, /^shaman-casting-(ordinary|subsequent)-[01]\.png$/)
      assert.match(crop.png, /^data:image\/png;base64,/)
      const bytes = Buffer.from(crop.png.split(',')[1], 'base64')
      writeFileSync(resolve(output, crop.file), bytes, { flag: 'wx' })
      crop.sha256 = sha256(bytes); delete crop.png
    }
    if (validate) {
      report.acceptance = validateShamanCastingEvidence(observation)
      report.status = 'passed'
    } else report.status = 'incomplete'
  } catch (error) {
    report.failure = String(error)
    throw error
  } finally {
    writeFileSync(resolve(output, 'shaman-casting.json'), JSON.stringify(report, null, 2) + '\n')
  }
  return report
}
