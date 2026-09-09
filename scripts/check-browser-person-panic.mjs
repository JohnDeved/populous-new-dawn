// Live Lightning -> burning-hut ejection, original panic poses and personal sparks.
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { openGame, effectPixels } from './browser-game.mjs'

const headed = process.argv.includes('--headed')
const browser = await chromium.launch({ headless: !headed })
try {
  const { page, errors } = await openGame(browser)
  await page.getByRole('button', { name: 'Enable sound', exact: true }).click()
  await page.evaluate(async () => {
    const s = window.testScene,
      w = s.world
    const model = await import('/app/model.ts')
    const b = w.buildings.find(b => b.team === 'blue' && b.kind === 'hut')
    const people = w.units.filter(u => u.team === 'blue' && u.kind === 'brave').slice(0, 6)
    for (const u of people) Object.assign(u, { x: b.x, z: b.z, inside: b.id, work: b.id, path: [] })
    window.panicBuilding = b
    window.panicPeople = people
    window.panicModel = model
    w.manaWorld.gameFlags = 32
    w.shots.lightning = 1
    w.speed = 0.5
    model.select(w, 'shaman')
    s.focus(b)
    s.onChange()
    const play = s.onSound
    window.panicAudio = { requests: 0, starts: 0, completed: 0, audible: 0, maxActive: 0 }
    let panicCue = false
    const start = AudioBufferSourceNode.prototype.start
    AudioBufferSourceNode.prototype.start = function (...args) {
      if (panicCue) {
        const a = window.panicAudio
        a.starts++
        if (this.buffer?.getChannelData(0).some(n => Math.abs(n) > 0.001)) a.audible++
        a.maxActive = Math.max(a.maxActive, a.starts - a.completed)
      }
      return start.apply(this, args)
    }
    s.onSound = (cue, attenuation, pan, finished) => {
      panicCue = cue === 0x51
      if (panicCue) window.panicAudio.requests++
      try {
        return play(
          cue,
          attenuation,
          pan,
          cue === 0x51
            ? () => {
                window.panicAudio.completed++
                finished?.()
              }
            : finished
        )
      } finally {
        panicCue = false
      }
    }
  })
  await page.keyboard.press('3')
  const target = await page.evaluate(() => {
    const s = window.testScene,
      p = s.screen(window.panicBuilding),
      r = s.container.getBoundingClientRect()
    return { x: r.left + ((p.x + 1) * r.width) / 2, y: r.top + ((1 - p.y) * r.height) / 2 }
  })
  await page.mouse.click(target.x, target.y)
  await page.waitForFunction(() => {
    if (!window.panicPeople.every(u => u.native?.state === 26 && u.native.timer < 56)) return false
    window.testScene.world.speed = 0
    return true
  })
  await page.waitForFunction(() =>
    window.testScene.world.effects
      .filter(f => f.animation?.displacement)
      .every(f => window.testScene.fxMeshes.has(f.id))
  )
  const initial = await page.evaluate(async () => {
    const s = window.testScene,
      w = s.world
    const rules = (await import('/app/original-rules.json')).default
    const poses = window.panicPeople.map(u => {
      const p = u.native,
        g = s.unitMeshes.get(u.id)
      return {
        id: u.id,
        state: p.state,
        timer: p.timer,
        speed: p.speed,
        object: p.object,
        expected: rules.animationObjects[rules.personAnimationObjects[25 * 9 + p.model]][0],
        visible: g.visible,
        layers: g.userData.layers.length,
        frame: g.userData.frame,
      }
    })
    return {
      poses,
      particles: w.effects
        .filter(f => f.animation?.displacement)
        .map(f => ({ id: f.id, sequence: f.sprite.sequence })),
      audio: { ...window.panicAudio },
    }
  })
  for (const p of initial.poses) {
    assert.equal(p.state, 26)
    assert.equal(p.object, p.expected)
    assert.equal(p.speed, 110)
    assert.ok(p.visible && p.layers > 0)
  }
  await page.screenshot({ path: '/private/tmp/populous-panic-visible-debug.png' })
  const pixels = {}
  for (const sequence of ['blastTrail', 'blastShot']) {
    const ids = initial.particles.filter(p => p.sequence === sequence).map(p => p.id)
    assert.ok(ids.length)
    pixels[sequence] = await effectPixels(page, ids)
    assert.ok(pixels[sequence] > 0, sequence)
  }
  const motion = await page.evaluate(() => {
    const s = window.testScene,
      f = s.world.effects.find(
        f => f.animation?.displacement && (f.animation.displacement.x || f.animation.displacement.y)
      )
    const g = s.fxMeshes.get(f.id),
      positions = []
    const pending = s.world.pendingTime
    for (const fraction of [0.25, 0.75]) {
      s.world.pendingTime = fraction / 12
      s.animateFx(g, f)
      positions.push(g.position.toArray())
    }
    s.world.pendingTime = pending
    return positions
  })
  assert.notDeepEqual(...motion, 'personal particles interpolate between rendered frames')
  await page.screenshot({ path: '/private/tmp/populous-native-person-panic.png' })
  // Profile the actual moving, emitting six-person scene, not headless FPS.
  await page.evaluate(() => {
    const s = window.testScene,
      animate = s.animate
    window.panicFrames = []
    s.animate = now => {
      const start = performance.now()
      animate(now)
      window.panicFrames.push({
        time: now,
        cpu: performance.now() - start,
        calls: s.renderer.info.render.calls,
        particles: s.world.effects.filter(f => f.animation?.displacement).length,
      })
    }
    s.world.speed = 1
  })
  await page.waitForTimeout(4200)
  const performanceReport = await page.evaluate(() => {
    const s = window.testScene,
      gl = s.renderer.getContext(),
      info = gl.getExtension('WEBGL_debug_renderer_info')
    const frames = window.panicFrames
    const q = (a, n) => a.sort((a, b) => a - b)[Math.floor((a.length - 1) * n)]
    const gaps = frames.slice(1).map((f, i) => f.time - frames[i].time)
    return {
      userAgent: navigator.userAgent,
      renderer: gl.getParameter(info.UNMASKED_RENDERER_WEBGL),
      viewport: [innerWidth, innerHeight],
      dpr: devicePixelRatio,
      frames: frames.length,
      cpu: {
        p50: q(
          frames.map(f => f.cpu),
          0.5
        ),
        p95: q(
          frames.map(f => f.cpu),
          0.95
        ),
      },
      gaps: { p50: q(gaps, 0.5), p95: q(gaps, 0.95), max: Math.max(...gaps) },
      maxParticles: Math.max(...frames.map(f => f.particles)),
      maxDrawCalls: Math.max(...frames.map(f => f.calls)),
      audio: { ...window.panicAudio },
    }
  })
  await page.waitForFunction(() => window.panicPeople.every(u => u.native?.state !== 26))
  const end = await page.evaluate(() => {
    window.testScene.world.speed = 0
    return {
      remaining: window.panicPeople.map(u => u.burnTrail),
      particles: window.testScene.world.effects.filter(f => f.animation?.displacement).length,
      alive: window.panicPeople.filter(u => u.hp > 0).length,
    }
  })
  assert.equal(end.particles, 0)
  assert.ok(end.remaining.every(n => n === 0))
  const a = performanceReport.audio
  assert.ok(initial.audio.starts > 0 && a.starts > initial.audio.starts)
  assert.equal(a.starts, a.requests, 'every panic cue starts a decoded sample')
  assert.equal(a.audible, a.starts, 'panic samples contain audible PCM')
  assert.ok(a.completed > 0 && a.completed < a.starts, 'voices complete and restart')
  assert.ok(a.maxActive <= 6, 'each person owns at most one panic voice')
  assert.deepEqual(errors, [])
  writeFileSync(
    '/private/tmp/populous-person-panic-browser.json',
    JSON.stringify(
      { headed, initial, pixels, motion, performance: performanceReport, end },
      null,
      2
    ) + '\n'
  )
  console.log(
    'PASS: live Lightning input, panic poses, both particle types, interpolation, voice completion and expiry',
    { pixels, performance: performanceReport, end }
  )
} finally {
  await browser.close()
}
