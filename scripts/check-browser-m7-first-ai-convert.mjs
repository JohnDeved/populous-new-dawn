#!/usr/bin/env node
// Ordinary M7 actors, resources and positions. Only time pacing and camera observation
// are controlled; commands use the shipped HUD/pointer and advanceGame owns all turns.
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseOptions, runLocalBrowser } from './local-render/harness.mjs'
import { bindGame, effectPixels } from './browser-game.mjs'

const options = parseOptions(process.argv.slice(2))
await runLocalBrowser(options, async ({ page, openMission, output, receipt }) => {
  await page.setViewportSize({ width: 1100, height: 760 })
  await openMission(7)
  await page.evaluate(async () => {
    const s = window.testScene
    cancelAnimationFrame(s.frame)
    s.world.paused = true
    const { advanceGame } = await import('/app/game-clock.ts')
    window.m7QA = {
      phases: [], events: [], conversions: [], firstTask: null,
      start: structuredClone(s.world.units.find(u => u.team === 'yellow' && u.kind === 'shaman')),
      step(count) {
        const scene = window.testScene, w = scene.world
        for (let n = 0; n < count; n++) {
          const wild = w.units.filter(u => u.team === 'wild').map(u => ({ id: u.id, x: u.x, z: u.z })),
            ids = new Set(w.units.map(u => u.id)),
            casts = w.spellCasts[2][17], mana = w.manaTribes[2].mana
          w.paused = false
          advanceGame(w, scene.gameClock, 1 / 12)
          w.paused = true
          const task = w.ai.tasks.find(t => t.flags & 1 && t.type === 2)
          if (task) {
            this.firstTask ??= task
            if (!this.phases.includes(task.phase)) this.phases.push(task.phase)
          }
          if (w.spellCasts[2][17] !== casts)
            this.events.push({ turn: w.turn, cast: w.spellCasts[2][17], manaBefore: mana,
              manaAfter: w.manaTribes[2].mana, stock: w.manaWorld.spells[2].stocks[17],
              used17: w.castingTribes[2].spells[17].used, remaining17: w.castingTribes[2].spells[17].remaining })
          for (const old of wild.filter(u => !w.units.some(v => v.id === u.id))) {
            const newborn = w.units.find(u => !ids.has(u.id) && u.team === 'yellow' &&
              u.kind === 'brave' && u.native?.flags4 & 0x40000 && u.x === old.x && u.z === old.z)
            if (newborn) this.conversions.push({ turn: w.turn, wild: old.id, brave: newborn.id })
          }
        }
      },
      render(point) {
        const scene = window.testScene
        if (point) scene.focus(point)
        scene.world.paused = false
        scene.animate(scene.previous)
        cancelAnimationFrame(scene.frame)
        scene.onChange()
      },
    }
  })
  const samples = [], save = (name, value) => writeFileSync(resolve(output, name), JSON.stringify(value, null, 2))
  const sample = async (name, focus = 'yellow') => {
    const state = await page.evaluate(focus => {
      const s = window.testScene, w = s.world,
        point = typeof focus === 'object' ? focus : w.units.find(u => u.team === focus && u.kind === 'shaman')
      window.m7QA.render(point)
      const gl = s.renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info')
      return { turn: w.turn, worldJSON: JSON.stringify(w),
        stock17: w.manaWorld.spells[2].stocks[17], casts17: w.spellCasts[2][17],
        renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
        sceneStoreSame: s.world === window.testStore.getWorld(),
        meshes: { units: s.unitMeshes.size, effects: s.fxMeshes.size },
        phases: window.m7QA.phases, events: window.m7QA.events, conversions: window.m7QA.conversions }
    }, focus)
    assert.equal(state.sceneStoreSame, true)
    assert.ok(state.meshes.units > 0)
    writeFileSync(resolve(output, `${name}-world.json`), state.worldJSON)
    delete state.worldJSON
    save(`${name}-observation.json`, state)
    await page.screenshot({ path: resolve(output, `${name}.png`) })
    samples.push({ name, turn: state.turn, renderer: state.renderer, meshes: state.meshes })
    return state
  }
  const opening = await sample('01-ordinary-opening')
  assert.ok(opening.turn < 100, 'initial public startup must precede the first AI task')
  assert.equal(opening.stock17, 0)
  assert.equal(opening.casts17, 0)
  let phase8 = false, cast = false, retired = false
  for (let n = 0; n < 2500; n++) {
    const state = await page.evaluate(() => {
      window.m7QA.step(1)
      const q = window.m7QA, w = window.testScene.world
      return { turn: w.turn, phase: q.firstTask?.phase, cast: w.spellCasts[2][17],
        retired: !!q.firstTask && !(q.firstTask.flags & 1), conversions: q.conversions.length }
    })
    if (state.phase === 8 && !phase8) { phase8 = true; await sample('02-natural-shaman-walk') }
    if (state.cast && !cast) {
      cast = true
      const shot = await sample('03-paid-convert-cast')
      assert.ok(shot.events[0].manaAfter < shot.events[0].manaBefore)
      assert.equal(shot.events[0].stock, 0)
      const ids = await page.evaluate(() => [...window.testScene.fxMeshes.keys()])
      receipt.convertEffectPixels = { status: 'not-observed', ids, changedPixels: 0 }
      if (ids.length) {
        const changedPixels = await effectPixels(page, ids)
        receipt.convertEffectPixels = { status: changedPixels > 0 ? 'observed' : 'not-observed', ids, changedPixels }
      }
    }
    if (state.retired && !retired) { retired = true; await sample('04-task-retired') }
    if (retired && state.conversions >= 3) break
  }
  const converted = await sample('05-three-natural-recruits')
  assert.equal(cast, true)
  assert.equal(retired, true)
  assert.deepEqual(converted.phases, [0, 2, 4, 5, 6, 7, 8, 3])
  assert.equal(converted.conversions.length, 3)
  assert.deepEqual(converted.conversions.map(c => c.wild), [95, 94, 96])
  const movement = await page.evaluate(() => {
    const q = window.m7QA, u = window.testScene.world.units.find(u => u.team === 'yellow' && u.kind === 'shaman')
    return { start: [q.start.x, q.start.z], end: [u.x, u.z] }
  })
  assert.notDeepEqual(movement.start, movement.end)
  // Earn player stock with the ordinary solo Blue Shaman; no resource injection.
  const charged = await page.evaluate(() => {
    const w = window.testScene.world
    for (let n = 0; n < 6000 && !w.shots.convertWild; n++) window.m7QA.step(1)
    window.m7QA.render({ x: -63, z: 19 })
    w.paused = false
    return { turn: w.turn, shots: w.shots.convertWild }
  })
  assert.ok(charged.shots > 0, 'ordinary player Convert must charge')
  const target = await page.evaluate(() => {
    const s = window.testScene, wild = s.world.units.filter(u => u.team === 'wild')
      .sort((a, b) => Math.hypot(a.x + 63, a.z - 19) - Math.hypot(b.x + 63, b.z - 19))[0]
    if (!wild) throw Error('No ordinary player-side Wildman')
    window.m7QA.render(wild)
    const p = s.screen(wild), r = s.container.getBoundingClientRect()
    return { id: wild.id, x: wild.x, z: wild.z,
      clientX: r.left + (p.x + 1) * r.width / 2, clientY: r.top + (1 - p.y) * r.height / 2 }
  })
  await page.getByRole('button', { name: `Convert Wild, ${charged.shots} shots`, exact: true }).click()
  await page.mouse.click(target.clientX, target.clientY)
  const player = await page.evaluate(() => {
    const w = window.testScene.world
    if (w.projectiles.at(-1)?.spell !== 'convertWild') throw Error('HUD/pointer did not cast player Convert')
    const ids = new Set(w.units.map(u => u.id))
    for (let n = 0; n < 160 && !w.units.some(u => !ids.has(u.id) && u.team === 'blue' && u.kind === 'brave'); n++)
      window.m7QA.step(1)
    const brave = w.units.find(u => !ids.has(u.id) && u.team === 'blue' && u.kind === 'brave')
    if (!brave) throw Error('Earned player Convert did not recruit a Brave')
    return { id: brave.id, x: brave.x, z: brave.z, turn: w.turn, shots: w.shots.convertWild }
  })
  await sample('07-player-earned-conversion', player)
  // Select the resulting ordinary follower through rendered picking.
  const click = await page.evaluate(id => {
    const s = window.testScene, u = s.world.units.find(u => u.id === id), p = s.screen(u), r = s.container.getBoundingClientRect()
    const x = r.left + (p.x + 1) * r.width / 2, y = r.top + (1 - p.y) * r.height / 2
    for (let dy = -30; dy <= 10; dy += 2) for (let dx = -15; dx <= 15; dx += 2) {
      const e = { clientX: x + dx, clientY: y + dy }
      if (s.pickUnit(e)?.id === id && document.elementFromPoint(e.clientX, e.clientY) === s.renderer.domElement)
        return { x: e.clientX, y: e.clientY }
    }
    throw Error('No exposed converted player Brave geometry')
  }, player.id)
  await page.evaluate(() => { window.testScene.world.paused = false })
  await page.mouse.click(click.x, click.y)
  assert.ok(await page.evaluate(id => window.testScene.world.selected.includes(id), player.id))
  await sample('08-player-recruit-selected', player)
  // Public store checkpoint API, same API invoked by Menu Save/Load. Persist the
  // complete serialized worlds, and compare before any replacement-scene animation.
  const checkpoint = await page.evaluate(async () => {
    const store = window.testStore
    const stored = await store.saveCheckpoint(), before = JSON.stringify(store.getWorld())
    if (!store.loadCheckpoint()) throw Error('Public checkpoint restore failed')
    return { stored, before, after: JSON.stringify(store.getWorld()) }
  })
  writeFileSync(resolve(output, 'checkpoint-before-world.json'), checkpoint.before)
  writeFileSync(resolve(output, 'checkpoint-after-world.json'), checkpoint.after)
  assert.equal(checkpoint.after, checkpoint.before)
  delete checkpoint.before
  delete checkpoint.after
  assert.equal(checkpoint.stored, true)
  await bindGame(page)
  await page.evaluate(() => { window.testScene = window.testSceneRef.current; cancelAnimationFrame(window.testScene.frame) })
  await sample('09-restored-player-recruit', player)

  assert.deepEqual(receipt.errors, [])
  const result = { samples, movement, ai: { phases: converted.phases, events: converted.events,
    conversions: converted.conversions }, checkpoint: { completeWorldEqual: true, durableWrite: checkpoint.stored },
    player: { charged, target, recruited: player, pointerSelection: true },
    limits: ['First AI Convert browser scope only; no sustained AI spell-cadence acceptance.', 'No full Mission 7 victory claim.',
      'Fixed-step shipped clock and camera focus used; no actors, resources, or positions injected.',
      'Software WebGL rendering is not hardware performance evidence.', 'Public checkpoint API exercised; not a browser restart persistence test.'] }
  save('summary.json', result)
  return result
})
