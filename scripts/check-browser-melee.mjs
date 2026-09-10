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
    w.terrain.fill(3); w.terrainVersion++
    const groups = []
    for (let i = 0; i < 6; i++) {
      const kind = ['brave', 'warrior', 'shaman'][i % 3], x = (i % 3) * 4 - 4, z = 30 + Math.floor(i / 3) * 4
      const members = [m.addUnit(w, 'red', 'warrior', { x, z }), m.addUnit(w, 'blue', kind, { x, z }), m.addUnit(w, 'blue', 'brave', { x, z })]
      const b = { id: w.nextId++, x, z, angle: 512, members: members.map(u => u.id) }
      w.fights.push(b)
      for (let j = 0; j < 3; j++) {
        const u = members[j]
        Object.assign(u, m.fightPosition(b, j))
        u.fight = { group: b.id, opponent: members[j ? 0 : 1].id, action: j === 1 ? 'ready' : 'strike', started: w.turn, remaining: 100 }
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
  // Expiring an attack changes the controller state before the next visit
  // changes its pose. The displayed strike must hold, not restart at frame zero.
  const held = await page.evaluate(async () => {
    const s = window.testScene, w = s.world, m = await import('/app/model.ts')
    const u = window.meleeCheck.groups[3][1]
    u.fight.remaining = 1
    u.fight.started = w.turn - 6
    w.speed = 1; m.tick(w, 1 / 12); w.speed = 0
    cancelAnimationFrame(s.frame); s.animate(s.previous)
    const g = s.unitMeshes.get(u.id)
    return { action: u.fight.action, pose: g.userData.state, frame: g.userData.frame }
  })
  assert.equal(held.action, 'approach')
  assert.equal(held.pose, 'strike')
  assert.ok(sprites.animations['blue-brave'].strike.some(d => d.frames.at(-1) === held.frame))
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
      cpu: { p50: q(f.map(v => v.cpu), .5), p95: q(f.map(v => v.cpu), .95), p99: q(f.map(v => v.cpu), .99), max: Math.max(...f.map(v => v.cpu)) },
      gaps: { p50: q(gaps, .5), p95: q(gaps, .95), max: Math.max(...gaps) }, maxDrawCalls: Math.max(...f.map(v => v.calls)) }
  })
  await page.evaluate(async () => {
    const s = window.testScene, w = s.world, m = await import('/app/model.ts'), h = window.meleeCheck
    w.speed = 0; w.units = []; w.buildings = []; w.fights = []
    w.terrain = w.terrain.map((_, i) => Math.max(3, 12 - Math.max(0, i % 97 - 48) * 2))
    w.terrainVersion++
    const a = m.addUnit(w, 'blue', 'warrior', { x: 0, z: 32 }), b = m.addUnit(w, 'red', 'brave', { x: 180 / 256, z: 32 })
    const fight = { id: w.nextId++, x: 0, z: 32, angle: 512, members: [a.id, b.id] }
    w.fights = [fight]
    a.fight = { group: fight.id, opponent: b.id, action: 'strike', started: w.turn, remaining: 100 }
    b.fight = { group: fight.id, opponent: a.id, action: 'push', started: w.turn }
    b.heading = Math.PI * 1.5; w.randomState = 1
    h.recoil = b; h.recoilTrace = []
    const after = s.gameClock.afterTurn
    s.gameClock.afterTurn = () => {
      after()
      h.recoilTrace.push({ action: b.fight?.action, remaining: b.fight?.remaining, x: b.x, z: b.z, h: b.flight?.h, airborne: !!(b.flight?.flags2 & 0x80000), hp: b.hp })
      if (b.fight?.action === 'approach' && !b.flight) {
        h.recovered = true; w.speed = 0; s.gameClock.afterTurn = after
      }
    }
    s.focus({ x: 2, z: 32 }); s.onChange(); w.speed = 1
  })
  await page.waitForFunction(() => window.meleeCheck.recoil.fight.remaining === 0 && (window.meleeCheck.recoil.flight?.flags2 & 0x80000))
  await page.screenshot({ path: '/private/tmp/populous-melee-slope.png' })
  await page.waitForFunction(() => window.meleeCheck.recovered)
  const recoil = await page.evaluate(() => window.meleeCheck.recoilTrace)
  assert.ok(recoil.length > 3)
  assert.ok(recoil.some(t => t.remaining === 0 && t.airborne))
  assert.equal(recoil.at(-1).action, 'approach')
  assert.equal(recoil.at(-1).airborne, false)
  assert.ok(recoil.at(-1).x > recoil[0].x)
  await page.evaluate(async () => {
    const s = window.testScene, w = s.world, m = await import('/app/model.ts'), h = window.meleeCheck
    w.speed = 0; w.units = []; w.buildings = []; w.fights = []; w.turn = 10
    w.terrain.fill(3); w.terrainVersion++
    h.approaches = []; h.approachTrace = []
    for (let i = 0; i < 6; i++) {
      const x = (i%3)*4-4, z = 30+Math.floor(i/3)*4
      const a = m.addUnit(w,'red','warrior',{x,z}), b = m.addUnit(w,'blue',['brave','warrior','shaman'][i%3],{x:x+2.5,z:z+1})
      if(i>=3)b.cargo=1
      const f = {id:w.nextId++,x,z,angle:512,members:[a.id,b.id]};w.fights.push(f)
      a.fight={group:f.id,opponent:b.id,action:'strike',remaining:100,started:0}
      b.fight={group:f.id,opponent:a.id,action:'approach',started:0}
      h.approaches.push(b)
    }
    const after = s.gameClock.afterTurn
    s.gameClock.afterTurn = () => {
      after()
      h.approachTrace.push(h.approaches.map(u=>({id:u.id,action:u.fight?.action,x:u.x,z:u.z,speed:u.fight?.motion?.speed,object:u.fight?.motion?.object})))
      if(h.approaches.every(u=>u.fight?.action==='ready')){w.speed=0;h.approachDone=true;s.gameClock.afterTurn=after}
    }
    s.focus({x:0,z:32});s.onChange();w.speed=1
  })
  await page.waitForFunction(() => window.meleeCheck.approaches.every(u => u.fight?.motion && window.testScene.unitMeshes.get(u.id)?.userData.state === 'walk'))
  const approachSprites = await page.evaluate(() => window.meleeCheck.approaches.map(u=>({kind:u.kind,cargo:u.cargo,frame:window.testScene.unitMeshes.get(u.id).userData.frame,object:u.fight.motion.object})))
  for(const p of approachSprites) assert.ok(Object.values(sprites.animations[`blue-${p.kind}`]).some(d=>d[0].source===p.object&&d.some(dir=>dir.frames.includes(p.frame))))
  await page.screenshot({path:'/private/tmp/populous-melee-approach.png'})
  await page.waitForFunction(() => window.meleeCheck.approachDone)
  const approach = await page.evaluate(() => ({sprites:window.meleeCheck.approaches.map(u=>({kind:u.kind,cargo:u.cargo,action:u.fight.action,speed:u.fight.motion.speed})),trace:window.meleeCheck.approachTrace}))
  assert.ok(approach.trace.length > 2 && approach.trace.length < 20)
  assert.ok(approach.sprites.every(p=>p.action==='ready'&&p.speed===0))
  const placement = await page.evaluate(async () => {
    const s = window.testScene, w = s.world, m = await import('/app/model.ts')
    w.speed = 0; w.units = []; w.buildings = []; w.fights = []
    w.terrain.fill(3); w.terrainVersion++
    const a = m.addUnit(w, 'blue', 'warrior', { x: 0, z: 32 }), b = m.addUnit(w, 'red', 'brave', { x: 180 / 256, z: 32 })
    const fight = { id: w.nextId++, x: 0, z: 32, angle: 512, members: [a.id, b.id] }
    w.fights = [fight]
    for (const u of [a,b]) u.fight = { group: fight.id, opponent: u === a ? b.id : a.id, action: 'strike', started: 0, remaining: 100 }
    const step = () => { w.speed = 1; m.tick(w, 1/12); w.speed = 0 }
    step()
    const cell = p => ((p.y & 65535) >> 9) * 128 + ((p.x & 65535) >> 9)
    const before = { x: fight.x, z: fight.z }, origin = cell(m.nativePosition(w,fight))
    w.land.flags[origin] |= 4; w.turn = 30; step()
    const between = { x: fight.x, z: fight.z }
    step()
    const after = { x: fight.x, z: fight.z }, destination = cell(m.nativePosition(w,fight))
    w.land.flags.fill(4); w.turn = 63; step()
    cancelAnimationFrame(s.frame); s.animate(s.previous)
    return { before, between, after, retained: { x: fight.x, z: fight.z }, origin, destination,
      members: w.units.map(u => ({ group: u.fight?.group, sprite: s.unitMeshes.get(u.id)?.userData.state })), group: fight.id }
  })
  assert.deepEqual(placement.between, placement.before)
  assert.notEqual(placement.destination, placement.origin)
  assert.deepEqual(placement.retained, placement.after)
  assert.ok(placement.members.every(u => u.group === placement.group && u.sprite === 'strike'))
  const engagement = await page.evaluate(async () => {
    const s = window.testScene, w = s.world, m = await import('/app/model.ts')
    w.speed = 0; w.units = []; w.buildings = []; w.fights = []; w.pendingTime = 0
    w.terrain.fill(3); w.terrainVersion++
    const u = m.addUnit(w, 'blue', 'warrior', { x: 1.9, z: 31 })
    const enemy = m.addUnit(w, 'red', 'shaman', { x: 2.1, z: 31 })
    const step = () => { w.speed = 1; m.tick(w, 1 / 12); w.speed = 0 }
    w.selected = [u.id]; m.command(w, { x: -12, z: 31 }); w.turn = 3; step()
    cancelAnimationFrame(s.frame); s.animate(s.previous)
    const moving = { x: u.x, fight: u.fight, path: u.path.length, pose: s.unitMeshes.get(u.id)?.userData.state, frame: s.unitMeshes.get(u.id)?.userData.frame }
    m.command(w, enemy); step()
    return { moving, explicit: { group: u.fight?.group, opponentGroup: enemy.fight?.group, turn: w.turn } }
  })
  assert.ok(engagement.moving.x < 1.9 && engagement.moving.path > 0)
  assert.equal(engagement.moving.fight, null)
  assert.equal(engagement.moving.pose, 'walk')
  assert.ok(sprites.animations['blue-warrior'].walk.some(d => d.frames.includes(engagement.moving.frame)))
  assert.ok(engagement.explicit.group)
  assert.equal(engagement.explicit.group, engagement.explicit.opponentGroup)
  assert.equal(engagement.explicit.turn, 5, 'explicit attacks do not wait for periodic detection')
  assert.deepEqual(errors, [])
  assert.ok(performance.frames > 20)
  writeFileSync('/private/tmp/populous-melee-browser.json', JSON.stringify({ headed, recoil, approach, approachSprites, placement, engagement, workload: 'Six staged three-person fights on flat terrain; only frames with active fights recorded. Browser callback cadence is not physical display FPS. No paired speedup or whole-game claim.', states, performance }, null, 2) + '\n')
  console.log('PASS: all three live classes render opportunistic special/strike attacks, busy defenders retain their animation, native slope recoil outlives its animation timer and settles, live battle frames have no browser errors', performance)
} finally { await browser.close() }
