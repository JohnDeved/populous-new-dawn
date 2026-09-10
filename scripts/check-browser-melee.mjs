import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'
import sprites from '../app/original-units.json' with { type: 'json' }

const headed = process.argv.includes('--headed'), browser = await chromium.launch({ headless: !headed })
try {
  const { page, errors } = await openGame(browser)
  await page.evaluate(async () => {
    const s = window.testScene, w = s.world, m = await import('/app/model.ts')
    w.speed = 0
    w.units = []; w.buildings = []; w.fights = []
    w.terrain.fill(3); w.terrainVersion++; w.landVersion++
    const groups = []
    for (let i = 0; i < 6; i++) {
      const kind = ['brave', 'warrior', 'shaman'][i % 3], x = (i % 3) * 4 - 4, z = 30 + Math.floor(i / 3) * 4
      const members = [m.addUnit(w, 'red', 'warrior', { x, z }), m.addUnit(w, 'blue', kind, { x, z }), m.addUnit(w, 'blue', 'brave', { x, z })]
      const b = { id: w.nextId++, x, z, angle: 512, members: members.map(u => u.id) }
      w.fights.push(b)
      for (let j = 0; j < 3; j++) {
        const u = members[j]
        Object.assign(u, m.fightPosition(b, j))
        u.fight = { group: b.id, opponent: members[j ? 0 : 1].id, action: j === 1 ? 'ready' : 'strike', started: w.turn, until: w.turn + 100 }
      }
      groups.push(members)
    }
    // Isolate each decision so both newly reachable actions render for all classes.
    const fights = w.fights
    for (let i = 0; i < fights.length; i++) {
      let seed = 0
      while ((m.random({ randomState: seed }) & 15) !== Math.floor(i / 3)) seed++
      w.randomState = seed
      w.fights = [fights[i]]
      w.speed = 1; m.tick(w, 1 / 12); w.speed = 0
    }
    w.fights = fights
    s.focus({ x: 0, z: 32 }); s.startGroundView(3)
    for (let i = 0; i < 18; i++) s.updateCameraMotion(1 / 24)
    s.onChange()
    window.meleeCheck = { groups, frames: [] }
  })
  await page.waitForFunction(() => window.meleeCheck.groups.every(g => g.every(u => window.testScene.unitMeshes.has(u.id))))
  const states = await page.evaluate(() => window.meleeCheck.groups.map(group => group.map(u => {
    const g = window.testScene.unitMeshes.get(u.id)
    return { kind: u.kind, team: u.team, state: g.userData.state, frame: g.userData.frame, hp: u.hp, action: u.fight.action }
  })))
  for (let i = 0; i < states.length; i++) {
    const [defender, attacker] = states[i], action = i < 3 ? 'special' : 'strike'
    assert.equal(attacker.action, action); assert.equal(attacker.state, action)
    assert.equal(defender.action, 'strike'); assert.equal(defender.state, 'strike')
    assert.ok(defender.hp < 90)
    assert.ok(sprites.animations[`blue-${attacker.kind}`][action].some(d => d.frames.includes(attacker.frame)))
  }
  await page.screenshot({ path: '/private/tmp/populous-melee.png' })
  await page.evaluate(() => {
    const s = window.testScene, h = window.meleeCheck, animate = s.animate
    h.start = performance.now()
    s.animate = now => {
      const start = performance.now()
      animate(now)
      if (s.world.fights.length) h.frames.push({ time: now, cpu: performance.now() - start, calls: s.renderer.info.render.calls, fights: s.world.fights.length })
      if (performance.now() - h.start >= 6000) { h.done = true; s.world.speed = 0; s.animate = animate }
    }
    s.world.speed = 1
  })
  await page.waitForFunction(() => window.meleeCheck.done)
  const performance = await page.evaluate(() => {
    const s = window.testScene, f = window.meleeCheck.frames, gl = s.renderer.getContext(), info = gl.getExtension('WEBGL_debug_renderer_info')
    const gaps = f.slice(1).map((v, i) => v.time - f[i].time), q = (a, p) => a.sort((a,b) => a-b)[Math.floor((a.length-1)*p)]
    return { userAgent: navigator.userAgent, renderer: gl.getParameter(info.UNMASKED_RENDERER_WEBGL), viewport: [1440,1000], dpr: devicePixelRatio, frames: f.length,
      cpu: { p50: q(f.map(v => v.cpu), .5), p95: q(f.map(v => v.cpu), .95) },
      gaps: { p50: q(gaps, .5), p95: q(gaps, .95), max: Math.max(...gaps) }, maxDrawCalls: Math.max(...f.map(v => v.calls)) }
  })
  assert.deepEqual(errors, [])
  assert.ok(performance.frames > 20)
  writeFileSync('/private/tmp/populous-melee-browser.json', JSON.stringify({ headed, workload: 'Six staged three-person fights on flat terrain; only frames with active fights recorded. Browser callback cadence is not physical display FPS. No paired speedup or whole-game claim.', states, performance }, null, 2) + '\n')
  console.log('PASS: all three live classes render opportunistic special/strike attacks, busy defenders retain their animation, live battle frames have no browser errors', performance)
} finally { await browser.close() }
