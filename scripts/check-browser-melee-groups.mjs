import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'
import sprites from '../app/original-units.json' with { type: 'json' }

const headed = process.argv.includes('--headed')
const browser = await chromium.launch({ headless: !headed })
try {
  const { page, errors } = await openGame(browser)
  await page.evaluate(async () => {
    const s = window.testScene, w = s.world, m = await import('/app/model.ts')
    const { advanceGame } = await import('/app/game-clock.ts')
    w.speed = 0; w.units = []; w.buildings = []; w.shrines = []; w.fights = []; w.pendingTime = 0
    w.terrain.fill(3); w.terrainVersion++; w.manaWorld.gameFlags |= 64
    const pairs = []
    for (let row = 0; row < 2; row++) for (let col = 0; col < 4; col++) {
      const x = col * 7 - 10, z = row * 8 + 16
      const red = m.addUnit(w, 'red', 'warrior', { x, z })
      const blue = m.addUnit(w, 'blue', 'brave', { x: x + 1, z })
      w.selected = [blue.id]; m.command(w, red)
      pairs.push({ red, blue })
    }
    w.speed = 1; advanceGame(w, { animationTime: 0, animationFrame: 0 }, 1 / 12); w.speed = 0
    s.focus({ x: 0, z: 24 }); s.startGroundView(3)
    for (let i = 0; i < 18; i++) s.updateCameraMotion(1 / 24)
    window.groupCheck = { pairs, frames: [], stages: [], baseTurn: w.turn }
    s.onChange()
  })
  await page.waitForFunction(() => window.testScene.unitMeshes.size === 16)
  await page.evaluate(async () => {
    const s = window.testScene, w = s.world, m = await import('/app/model.ts'), h = window.groupCheck
    const afterTurn = s.gameClock.afterTurn, animate = s.animate
    const stage = () => ({ turn: w.turn, groups: w.fights.map(b => ({ id: b.id, members: [...b.members], slots: b.slots && [...b.slots] })), people: w.units.map(u => ({ id: u.id, team: u.team, group: u.fight?.group, kind: u.kind })) })
    s.gameClock.afterTurn = () => {
      afterTurn()
      const turn = w.turn - h.baseTurn
      if ([2, 4, 6, 8].includes(turn)) {
        h.stages.push(stage())
        for (const pair of h.pairs) {
          const target = turn === 8 ? pair.replacement : pair.red
          const u = m.addUnit(w, turn === 8 ? 'red' : 'blue', turn < 6 ? 'brave' : 'warrior', { x: target.x + .5, z: target.z })
          if (turn === 6) pair.replacement = u
          if (turn === 8) pair.reinforcement = u
          w.selected = [u.id]; m.command(w, target)
        }
        w.selected = []
      }
      if (turn === 10) {
        h.stages.push(stage())
        h.pairs = h.pairs.map(p => ({ original: p.blue.id, replacement: p.replacement.id, reinforcement: p.reinforcement.id }))
        s.gameClock.afterTurn = afterTurn
      }
    }
    h.start = performance.now()
    s.animate = now => {
      const start = performance.now(); animate(now)
      h.frames.push({ cpu: performance.now() - start, turn: w.turn, groups: w.fights.length, calls: s.renderer.info.render.calls })
      if (performance.now() - h.start >= 6000) { h.done = true; w.speed = 0; s.animate = animate; s.gameClock.afterTurn = afterTurn }
    }
    w.speed = 1
  })
  await page.waitForFunction(() => window.groupCheck.done)
  const report = await page.evaluate(() => {
    const s = window.testScene, h = window.groupCheck, gl = s.renderer.getContext(), info = gl.getExtension('WEBGL_debug_renderer_info')
    const values = h.frames.map(f => f.cpu).sort((a,b) => a-b), q = p => values[Math.floor((values.length-1)*p)]
    return { pairs: h.pairs, stages: h.stages, poses: s.world.units.filter(u => u.fight).map(u => {
      const g = s.unitMeshes.get(u.id)
      return { id: u.id, team: u.team, kind: u.kind, visible: g?.visible, frame: g?.userData.frame }
    }), performance: { userAgent: navigator.userAgent, renderer: gl.getParameter(info.UNMASKED_RENDERER_WEBGL), viewport: [innerWidth,innerHeight], dpr: devicePixelRatio, count: values.length, cpu: { p50:q(.5),p95:q(.95),p99:q(.99),max:q(1) }, maxDrawCalls: Math.max(...h.frames.map(f=>f.calls)), maxGroups:Math.max(...h.frames.map(f=>f.groups)), worstFrames:[...h.frames].sort((a,b)=>b.cpu-a.cpu).slice(0,8) } }
  })
  assert.equal(report.stages.length, 5)
  const beforeSplit = report.stages[3], split = report.stages[4]
  assert.equal(beforeSplit.groups.length, 8)
  assert.equal(split.groups.length, 16)
  for (const pair of report.pairs) {
    assert.equal(beforeSplit.people.find(p => p.id === pair.original).group, undefined, 'warrior displaced the first weaker ally')
    const r = split.people.find(p => p.id === pair.replacement), opponent = split.people.find(p => p.id === pair.reinforcement)
    assert.ok(r.group); assert.ok(opponent.group)
    const group = split.groups.find(b => b.id === opponent.group)
    assert.equal(group.members.length, 2)
    assert.equal(new Set(group.members.map(id => split.people.find(p=>p.id===id).team)).size, 2)
  }
  assert.ok(report.poses.filter(p => p.visible).length > 12)
  for (const pose of report.poses.filter(p => p.visible)) {
    assert.ok(Object.values(sprites.animations[`${pose.team}-${pose.kind}`]).some(directions => directions.some(d => d.frames.includes(pose.frame))), 'fighter retains an original pose')
  }
  assert.deepEqual(errors, [])
  await page.screenshot({ path: '/private/tmp/populous-melee-groups.png' })
  const cleanup = await page.evaluate(async () => {
    const s = window.testScene, w = s.world, m = await import('/app/model.ts')
    w.speed = 0; w.units = []; w.buildings = []; w.shrines = []; w.fights = []; w.pendingTime = 0
    w.stats.battlesWon.fill(0)
    const red = m.addUnit(w, 'red', 'warrior', { x: 0, z: 32 })
    const blue = m.addUnit(w, 'blue', 'warrior', { x: 1, z: 32 })
    const step = () => { w.speed = 1; m.tick(w, 1 / 12); w.speed = 0 }
    w.selected = [blue.id]; m.command(w, red); step()
    if (w.fights.length !== 1) throw new Error('The real attack command must create a fight')
    const person = blue.fight.motion
    red.hp = 0; step(); w.selected = []
    s.focus({ x: 0, z: 32 }); s.onChange()
    return { id: blue.id, groups: w.fights.length, fight: blue.fight, state: person.state,
      previousState: person.previousState, workFlags: person.workFlags, wins: [...w.stats.battlesWon] }
  })
  assert.equal(cleanup.groups, 0); assert.equal(cleanup.fight, null)
  assert.equal(cleanup.state, 10); assert.equal(cleanup.previousState, 25); assert.equal(cleanup.workFlags, 0)
  assert.deepEqual(cleanup.wins, [1, 0, 0, 0])
  await page.waitForFunction(id => {
    const s = window.testScene, g = s.unitMeshes.get(id)
    return s.unitMeshes.size === 1 && g?.visible && g.userData.state === 'idle'
  }, cleanup.id)
  const pose = () => page.evaluate(id => {
    const g = window.testScene.unitMeshes.get(id)
    return { state: g.userData.state, frame: g.userData.frame, visible: g.visible }
  }, cleanup.id)
  cleanup.idle = await pose()
  await page.evaluate(async id => {
    const w = window.testScene.world, m = await import('/app/model.ts'), u = w.units.find(u => u.id === id)
    w.selected = [id]; m.command(w, { x: u.x + 4, z: u.z + 4 })
    w.speed = 1; m.tick(w, 1 / 12); w.speed = 0
  }, cleanup.id)
  await page.waitForFunction(id => window.testScene.unitMeshes.get(id)?.userData.state === 'walk', cleanup.id)
  cleanup.walk = await pose()
  for (const p of [cleanup.idle, cleanup.walk])
    assert.ok(sprites.animations['blue-warrior'][p.state].some(d => d.frames.includes(p.frame)))
  assert.deepEqual(errors, [])
  await page.screenshot({ path: '/private/tmp/populous-fight-cleanup.png' })
  const result = { headed, ...report, cleanup, workload: 'Eight live fights gain reinforcements, replace weaker members and split over six seconds. Includes admission and split frames, after terrain/base-sprite setup. Bounded unpaired CPU sample, not physical display FPS or whole-game performance.' }
  writeFileSync('/private/tmp/populous-melee-groups-browser.json', JSON.stringify(result,null,2)+'\n')
  console.log('PASS: live reinforcements, stronger-member replacement, 16 split fights, death cleanup, recovery and original idle/walk poses; no browser errors', report.performance)
} finally { await browser.close() }
