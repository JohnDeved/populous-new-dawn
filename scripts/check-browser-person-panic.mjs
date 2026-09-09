// Live Lightning -> burning-hut ejection, original panic poses and personal sparks.
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { openGame, effectPixels } from './browser-game.mjs'

const headed = process.argv.includes('--headed')
const nearby = process.argv.includes('--nearby')
const profile = process.argv.includes('--profile')
const browser = await chromium.launch({ headless: !headed })
try {
  const { page, errors } = await openGame(browser)
  await page.getByRole('button', { name: 'Enable sound', exact: true }).click()
  await page.evaluate(async nearby => {
    const s = window.testScene,
      w = s.world
    const model = await import('/app/model.ts')
    const b = w.buildings.find(b => b.team === 'blue' && b.kind === 'hut')
    let people = w.units.filter(u => u.team === 'blue' && u.kind === 'brave').slice(0, 6)
    let position = b
    if (nearby) {
      const { buildingFirePoints } = await import('/app/building-shapes.ts')
      position = model.browserPosition(buildingFirePoints(model.buildingPose(b))[2])
      // Fresh followers have no retained builder/harvest tasks from the running opening.
      people = Array.from({ length: 6 }, () => model.addUnit(w, 'blue', 'brave', position))
    }
    for (const u of people)
      Object.assign(u, {
        x: position.x,
        z: position.z,
        inside: nearby ? null : b.id,
        work: nearby ? null : b.id,
        path: [],
        guard: false,
      })
    window.panicBuilding = b
    window.panicPeople = people
    window.panicModel = model
    window.evacuationSteps = []
    if (!nearby) {
      const afterTurn = s.gameClock.afterTurn,
        pending = new Set(people),
        start = { x: position.x, z: position.z }
      s.gameClock.afterTurn = () => {
        afterTurn()
        for (const u of pending) {
          if (u.inside !== null) continue
          window.evacuationSteps.push({ id: u.id, distance: Math.hypot(u.x - start.x, u.z - start.z) })
          pending.delete(u)
        }
      }
    }
    w.manaWorld.gameFlags = 32
    w.shots.lightning = 1
    w.speed = 0
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
  }, nearby)
  await page.waitForTimeout(100)
  await page.keyboard.press('3')
  const target = await page.evaluate(async () => {
    const s = window.testScene,
      b = window.panicBuilding,
      r = s.container.getBoundingClientRect()
    const { buildingFootprintCells } = await import('/app/building-shapes.ts')
    const m = window.panicModel
    const points = [
      b,
      ...buildingFootprintCells(m.buildingPose(b)).map(i =>
        m.browserPosition({ x: (i % 128) * 512 + 256, y: Math.floor(i / 128) * 512 + 256 })
      ),
    ]
    for (const point of points) {
      const p = s.screen(point),
        x = r.left + ((p.x + 1) * r.width) / 2,
        y = r.top + ((1 - p.y) * r.height) / 2
      const picked = s.pick({ clientX: x, clientY: y })
      if (!picked) continue
      const native = m.nativePosition(s.world, picked),
        cell = ((native.y & 65535) >> 9) * 128 + ((native.x & 65535) >> 9)
      if ((s.world.land.buildingIds[cell] & 1023) === b.id) return { x, y }
    }
    throw new Error('No pickable burning-hut footprint')
  })
  await page.mouse.click(target.x, target.y)
  await page.evaluate(() => {
    window.testScene.world.speed = 0.5
  })
  await page
    .waitForFunction(() => {
      if (!window.panicPeople.every(u => u.native?.state === 26 && u.native.timer < 56))
        return false
      window.testScene.world.speed = 0
      return true
    })
    .catch(async error => {
      console.log(
        'Panic timeout',
        errors,
        await page.evaluate(() => ({
          people: window.panicPeople.map(u => ({
            hp: u.hp,
            x: u.x,
            z: u.z,
            inside: u.inside,
            state: u.native?.state,
            timer: u.native?.timer,
          })),
          burn: window.panicBuilding.burn,
          turn: window.testScene.world.turn,
          projectiles: window.testScene.world.projectiles.length,
        }))
      )
      throw error
    })
  await page.waitForFunction(() =>
    window.testScene.world.effects
      .filter(f => f.animation?.displacement)
      .every(f => window.testScene.fxMeshes.has(f.id))
  )
  if (nearby)
    await page.evaluate(() => {
      const s = window.testScene
      s.cameraBearing = Math.PI
      s.captureCamera()
      s.updateView()
      cancelAnimationFrame(s.frame)
      s.animate(s.previous)
    })
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
      evacuation: window.evacuationSteps,
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
  if (!nearby) {
    assert.equal(initial.evacuation.length, 6)
    assert.ok(initial.evacuation.every(p => p.distance < 1.5), 'first visible panic step must not teleport to a door')
  }
  await page.screenshot({ path: '/private/tmp/populous-panic-visible-debug.png' })
  const pixels = {}
  for (const sequence of ['blastTrail', 'blastShot']) {
    const ids = initial.particles.filter(p => p.sequence === sequence).map(p => p.id)
    assert.ok(ids.length)
    pixels[sequence] = await effectPixels(page, ids)
    assert.ok(pixels[sequence] > 0, sequence)
  }
  let atlasComparison
  if (process.argv.includes('--compare-atlas')) {
    atlasComparison = await page.evaluate(() => {
      const s = window.testScene,
        renderer = s.renderer,
        gl = renderer.getContext()
      const read = () => {
        renderer.render(s.scene, s.camera)
        const pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
        gl.readPixels(
          0,
          0,
          gl.drawingBufferWidth,
          gl.drawingBufferHeight,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          pixels
        )
        return pixels
      }
      const before = read(),
        sprites = []
      s.scene.traverse(sprite => {
        if (!sprite.isSprite || !sprite.userData.atlasTransform) return
        const map = sprite.material.map,
          uv = sprite.userData.atlasTransform
        const original = sprite.material,
          state = s.view.materials.get(original)
        sprites.push({ sprite, original, uv })
        sprite.material = original.clone()
        sprite.material.onBeforeCompile = state.compile
        sprite.material.customProgramCacheKey = () => state.programKey
        sprite.material.userData = {}
        sprite.material.map = map.clone()
        sprite.material.map.repeat.set(uv.x, uv.y)
        sprite.material.map.offset.set(uv.z, uv.w)
        delete sprite.userData.atlasTransform
      })
      s.view.prepare(s.scene)
      const legacy = read()
      for (const { sprite, original, uv } of sprites) {
        sprite.material.map.dispose()
        sprite.material.dispose()
        sprite.material = original
        sprite.userData.atlasTransform = uv
      }
      s.view.prepare(s.scene)
      const restored = read()
      let differences = 0,
        restoredDifferences = 0
      for (let i = 0; i < before.length; i++) {
        differences += before[i] !== legacy[i]
        restoredDifferences += before[i] !== restored[i]
      }
      return { sprites: sprites.length, differences, restoredDifferences }
    })
    assert.ok(atlasComparison.sprites > 10)
    assert.equal(
      atlasComparison.differences,
      0,
      'shared atlas and original texture transforms render identical pixels'
    )
    assert.equal(atlasComparison.restoredDifferences, 0)
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
  await page.screenshot({
    path: `/private/tmp/populous-native-person-panic${nearby ? '-nearby' : ''}.png`,
  })
  // Profile the actual moving, emitting six-person scene, not headless FPS.
  const cdp = profile ? await page.context().newCDPSession(page) : null
  if (cdp) {
    await cdp.send('Profiler.enable')
    await cdp.send('Profiler.start')
  }
  await page.evaluate(() => {
    const s = window.testScene,
      animate = s.animate
    window.panicFrames = []
    window.panicUploads = []
    const gl = s.renderer.getContext(),
      upload = gl.texSubImage2D
    gl.texSubImage2D = function (...args) {
      const started = performance.now()
      const result = upload.apply(this, args)
      const data = args.at(-1)
      window.panicUploads.push({
        ms: performance.now() - started,
        width: args.length >= 9 ? args[4] : data.width,
        height: args.length >= 9 ? args[5] : data.height,
        bytes: data.byteLength,
      })
      return result
    }
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
  if (cdp)
    writeFileSync(
      '/private/tmp/populous-panic.cpuprofile',
      JSON.stringify((await cdp.send('Profiler.stop')).profile)
    )
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
      uploads: window.panicUploads,
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
  assert.equal(
    performanceReport.uploads.filter(u => u.width === 2048 && [4608, 5824].includes(u.height))
      .length,
    0,
    'new particles and sprite layers reuse uploaded atlas images'
  )
  assert.ok(end.remaining.every(n => n === 0))
  const a = performanceReport.audio
  assert.ok(initial.audio.starts > 0 && a.starts > initial.audio.starts)
  assert.equal(a.starts, a.requests, 'every panic cue starts a decoded sample')
  assert.equal(a.audible, a.starts, 'panic samples contain audible PCM')
  assert.ok(a.completed > 0 && a.completed < a.starts, 'voices complete and restart')
  assert.ok(a.maxActive <= 6, 'each person owns at most one panic voice')
  assert.deepEqual(errors, [])
  writeFileSync(
    `/private/tmp/populous-person-panic${nearby ? '-nearby' : ''}-browser.json`,
    JSON.stringify(
      {
        headed,
        nearby,
        atlasComparison,
        initial,
        pixels,
        motion,
        performance: performanceReport,
        end,
      },
      null,
      2
    ) + '\n'
  )
  console.log(
    'PASS: live Lightning input, panic poses, both particle types, interpolation, voice completion and expiry',
    {
      pixels,
      atlasComparison,
      performance: { ...performanceReport, uploads: performanceReport.uploads.length },
      end,
    }
  )
} finally {
  await browser.close()
}
