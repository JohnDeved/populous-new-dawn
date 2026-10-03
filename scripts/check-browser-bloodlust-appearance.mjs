// PREPARED ONLY: do not execute until the runtime repair is implemented.
// PND_BLOODLUST_IMPLEMENTATION_HEAD must name the implemented, tested local HEAD.
// The opt-in red scene suite must pass before Playwright is even imported.
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  prerequisiteHead,
  observeBloodlust,
  assertOriginalOverlay,
  criticalState,
} from './lib/bloodlust-acceptance.mjs'
import { openGame, bindGame } from './browser-game.mjs'
import artwork from '../app/original-bloodlust.json' with { type: 'json' }

const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
assert.match(
  process.env.PND_BLOODLUST_IMPLEMENTATION_HEAD ?? '',
  /^[0-9a-f]{40}$/,
  'Browser execution requires the explicit later implementation head'
)
assert.equal(head, process.env.PND_BLOODLUST_IMPLEMENTATION_HEAD)
assert.notEqual(head, prerequisiteHead)
assert.notEqual(
  execFileSync('git', ['diff', prerequisiteHead, head, '--', 'app/scene-entities.ts'], {
    encoding: 'utf8',
  }),
  '',
  'No Bloodlust caller implementation: do not run this acceptance'
)
assert.equal(
  execFileSync('git', ['diff', 'HEAD', '--'], { encoding: 'utf8' }),
  '',
  'Require committed, clean tested code'
)
const dir = resolve(
  process.env.POPULOUS_ARTIFACT_DIR ?? 'work/orchestration/bloodlust-appearance-browser'
)
mkdirSync(dir, { recursive: true })
const gate = spawnSync(process.execPath, ['--test', 'tests/bloodlust-runtime.pending.mjs'], {
  encoding: 'utf8',
  timeout: 120000,
})
writeFileSync(resolve(dir, 'focused-gate.log'), (gate.stdout ?? '') + (gate.stderr ?? ''))
assert.equal(gate.status, 0, 'Focused runtime checks must pass before opening a browser')
const { chromium } = await import('@playwright/test')
const browser = await chromium.launch({ headless: true })
const report = {
  head,
  status: 'RUNNING',
  stages: [],
  limits:
    'Paced normal UI route; no reward/work/position/status injection. Checkpoint uses the shipped store API. Pixel removal is restored immediately.',
}
let page
const saveStage = (name, data) => {
  report.stages.push({ name, data })
  console.log(name, JSON.stringify(data))
}
try {
  const opened = await openGame(browser, 16)
  page = opened.page
  page.setDefaultTimeout(45000)
  await page.evaluate(() => {
    const s = globalThis.testScene
    cancelAnimationFrame(s.frame)
    s.world.speed = 0
  })
  const authored = await page.evaluate(() => {
    const w = globalThis.testScene.world
    const head = w.shrines.find(s => s.reward === 'bloodlust' && s.x < 0)
    const people = w.units.filter(u => u.team === 'blue' && u.kind === 'brave')
    if (!head || people.length !== 6 || w.shots.bloodlust !== 0)
      throw new Error('Unexpected authored Mission16 start')
    globalThis.bloodlustHeadId = head.id
    globalThis.bloodlustPeople = people.map(u => u.id)
    return {
      head: { id: head.id, x: head.x, z: head.z, target: head.target },
      ids: globalThis.bloodlustPeople,
    }
  })
  saveStage('authored start', authored)

  // Only camera positioning is test-controlled. The actual targets are picked
  // on the rendered canvas and pointer-up owns command/cast submission.
  async function pointerFor(kind) {
    return page.evaluate(kind => {
      const s = globalThis.testScene,
        w = s.world
      const target =
        kind === 'head'
          ? w.shrines.find(h => h.id === globalThis.bloodlustHeadId)
          : kind === 'walk'
            ? { x: -26, z: -13 }
            : w.units.find(u => u.id === globalThis.bloodlustPeople[0])
      s.focus(target)
      for (let i = 0; i < 120; i++) s.updateCameraMotion(1 / 24)
      s.animate(s.previous)
      cancelAnimationFrame(s.frame)
      const screen = s.screen(target),
        bounds = s.renderer.domElement.getBoundingClientRect()
      const x = bounds.left + ((screen.x + 1) * bounds.width) / 2
      const y = bounds.top + ((1 - screen.y) * bounds.height) / 2
      for (let dy = -60; dy <= 12; dy += 3)
        for (let dx = -24; dx <= 24; dx += 3) {
          const event = { clientX: x + dx, clientY: y + dy }
          if (kind === 'head') {
            if (!s.pickUnit(event) && s.pickWorldObject(event)?.id === target.id) return event
          } else {
            const ground = s.pick(event)
            if (
              ground &&
              Math.hypot(ground.x - target.x, ground.z - target.z) < 0.7 &&
              (kind === 'cast' || (!s.pickUnit(event) && !s.pickWorldObject(event)))
            )
              return event
          }
        }
      throw new Error(
        `No normal canvas target for ${kind}; do not inject a command or reposition actors`
      )
    }, kind)
  }
  async function clickTarget(kind) {
    const point = await pointerFor(kind)
    await page.mouse.click(point.clientX, point.clientY)
  }
  async function advanceUntil(stage, limit) {
    return page.evaluate(
      async ({ stage, limit }) => {
        const s = globalThis.testScene,
          w = s.world
        const { advanceGame } = await import('/app/game-clock.ts')
        const reached = () =>
          stage === 'reward'
            ? w.shots.bloodlust === 1
            : stage === 'walk'
              ? w.units.some(
                  u =>
                    u.team === 'blue' && u.kind === 'shaman' && Math.hypot(u.x + 26, u.z + 13) < 1.5
                )
              : w.units.filter(u => u.bloodlust).length === 6
        cancelAnimationFrame(s.frame)
        w.speed = 1
        let steps = 0
        for (; steps < limit && !reached() && w.status === 'playing'; steps++)
          advanceGame(w, s.gameClock, 1 / 12)
        w.speed = 0
        s.animate(s.previous)
        cancelAnimationFrame(s.frame)
        s.onChange()
        if (!reached()) throw new Error(`Normal ${stage} path not reached in ${limit} turns`)
        return {
          steps,
          turn: w.turn,
          shots: w.shots.bloodlust,
          gifts: w.giftCounts.bloodlust,
          uses: w.shrines.find(h => h.id === globalThis.bloodlustHeadId).uses,
          affected: w.units
            .filter(u => u.bloodlust)
            .map(u => [u.id, u.bloodlust, u.native?.flags3]),
        }
      },
      { stage, limit }
    )
  }

  await page.locator('.world-viewport canvas.battlefield').focus()
  await page.keyboard.press('Escape')
  await page
    .getByRole('button', { name: 'Select brave', exact: true })
    .click({ modifiers: ['Shift'] })
  assert.deepEqual(
    await page.evaluate(() => [...globalThis.testScene.world.selected].toSorted((a, b) => a - b)),
    authored.ids
  )
  await clickTarget('head')
  assert.equal(
    await page.evaluate(() =>
      globalThis.testScene.world.selected.every(
        id => globalThis.testScene.world.units.find(u => u.id === id)?.native?.commandStatus === 27
      )
    ),
    true
  )
  const reward = await advanceUntil('reward', 4500)
  assert.equal(reward.uses, 1)
  assert.equal(reward.gifts, 1)
  saveStage('normal six-Brave walk/worship reward', reward)
  await page.locator('.world-viewport canvas.battlefield').focus()
  await page.keyboard.press('h')
  await clickTarget('walk')
  saveStage('normal Shaman walk', await advanceUntil('walk', 2200))
  await page.getByRole('button', { name: 'Bloodlust, 1 shots', exact: true }).click()
  assert.equal(await page.evaluate(() => globalThis.testScene.world.mode), 'bloodlust')
  await clickTarget('cast')
  const affected = await advanceUntil('affected', 180)
  assert.equal(affected.shots, 0)
  assert.deepEqual(
    affected.affected.map(row => row[0]).toSorted((a, b) => a - b),
    authored.ids
  )
  assert.ok(affected.affected.every(row => row[1] > 0 && row[2] & 0x80000))
  saveStage('normal HUD/canvas cast', affected)

  const assetHash = await page.evaluate(async () => {
    const response = await fetch('/original/bloodlust.png')
    if (!response.ok) throw new Error('Missing isolated Bloodlust texture')
    const bytes = await response.arrayBuffer()
    return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  })
  assert.equal(assetHash, artwork.pngSHA256)
  assert.equal(
    createHash('sha256')
      .update(readFileSync(new URL('../public/original/bloodlust.png', import.meta.url)))
      .digest('hex'),
    assetHash
  )
  await page.waitForFunction(() => {
    const g = globalThis.testScene.unitMeshes
      .get(globalThis.bloodlustPeople[0])
      ?.getObjectByName('bloodlust-aura')
    return g?.isSprite && g.material.map?.image?.complete && g.material.map.image.naturalWidth > 0
  })
  const beforeFrames = await page.evaluate(criticalState)
  const samples = []
  for (let i = 0; i < 21; i++) {
    if (i)
      await page.evaluate(() => {
        const s = globalThis.testScene
        s.animate(s.previous + 1000 / 24)
        cancelAnimationFrame(s.frame)
      })
    const sample = await page.evaluate(observeBloodlust, authored.ids[0])
    samples.push(sample)
    assertOriginalOverlay(sample)
  }
  assert.equal(new Set(samples.map(s => JSON.stringify(s.uv))).size, 10)
  assert.deepEqual(
    await page.evaluate(criticalState),
    beforeFrames,
    'presentation cannot spend mana/stock or either RNG'
  )
  saveStage('21 actual presentation samples', samples)
  await page.screenshot({ path: resolve(dir, 'original-bloodlust.png') })

  const pixels = await page.evaluate(() => {
    const s = globalThis.testScene,
      renderer = s.renderer,
      gl = renderer.getContext()
    const sprites = globalThis.bloodlustPeople.map(id =>
      s.unitMeshes.get(id).getObjectByName('bloodlust-aura')
    )
    const visibility = sprites.map(sprite => sprite.visible)
    const length = gl.drawingBufferWidth * gl.drawingBufferHeight * 4
    const a = new Uint8Array(length),
      b = new Uint8Array(length)
    const draw = out => {
      s.view.prepare(s.scene)
      renderer.render(s.scene, s.camera)
      gl.readPixels(
        0,
        0,
        gl.drawingBufferWidth,
        gl.drawingBufferHeight,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        out
      )
    }
    try {
      draw(a)
      sprites.forEach(sprite => {
        sprite.visible = false
      })
      draw(b)
      let changed = 0
      for (let i = 0; i < length; i += 4)
        if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) changed++
      return changed
    } finally {
      sprites.forEach((sprite, i) => {
        sprite.visible = visibility[i]
      })
      draw(a)
    }
  })
  assert.ok(pixels > 0, 'original overlays must contribute nonzero framebuffer pixels')
  saveStage('original atlas contribution', { pixels, assetHash })

  // The pause/store operations are the shipped APIs. Loading creates a new
  // GameScene/clock; expected frame derives from that actual clock, not a new
  // persistence field or a forced continuation of the old global phase.
  await page.evaluate(() => {
    globalThis.testScene.world.paused = true
  })
  const beforeCheckpoint = await page.evaluate(criticalState)
  const pausedFrame = await page.evaluate(observeBloodlust, authored.ids[0])
  await page.evaluate(() => {
    const s = globalThis.testScene
    for (let i = 0; i < 30; i++) {
      s.animate(s.previous + 1000 / 60)
      cancelAnimationFrame(s.frame)
    }
  })
  assert.deepEqual(await page.evaluate(observeBloodlust, authored.ids[0]), pausedFrame)
  assert.deepEqual(await page.evaluate(criticalState), beforeCheckpoint)
  await page.evaluate(async () => {
    const s = globalThis.testScene
    await globalThis.testStore.saveCheckpoint()
    if (!globalThis.testStore.loadCheckpoint()) throw new Error('Checkpoint load failed')
    cancelAnimationFrame(s.frame)
  })
  await bindGame(page)
  await page.evaluate(() => {
    const s = globalThis.testScene
    cancelAnimationFrame(s.frame)
    s.animate(s.previous)
    cancelAnimationFrame(s.frame)
  })
  assert.deepEqual(await page.evaluate(criticalState), beforeCheckpoint)
  const restored = await page.evaluate(observeBloodlust, authored.ids[0])
  assertOriginalOverlay(restored)
  saveStage('paused checkpoint preserves critical world state', restored)

  // Compare every chronological step against an unrendered clone. It is wrong
  // to demand constant mana/RNG while the simulation legitimately progresses;
  // instead require exact paired values and no extra visual consumption.
  await page.evaluate(() => {
    const s = globalThis.testScene
    s.world.paused = false
    globalThis.bloodlustControl = structuredClone(s.world)
    globalThis.bloodlustControlClock = {
      animationTime: s.gameClock.animationTime,
      animationFrame: s.gameClock.animationFrame,
    }
  })
  const lifecycle = await page.evaluate(async () => {
    const s = globalThis.testScene,
      w = s.world,
      control = globalThis.bloodlustControl,
      cc = globalThis.bloodlustControlClock
    const { advanceGame } = await import('/app/game-clock.ts')
    const { updateUnitsFrame } = await import('/app/scene-entities.ts')
    const observations = []
    const step = dt => {
      advanceGame(w, s.gameClock, dt)
      advanceGame(control, cc, dt)
      const before = JSON.stringify(w)
      updateUnitsFrame(s)
      if (JSON.stringify(w) !== before || JSON.stringify(w) !== JSON.stringify(control))
        throw new Error('Render path changed world/mana/stock/RNG/checkpoint-owned state')
    }
    for (const speed of [0, 0.25, 1, 4])
      for (const schedule of [[1 / 30], [1 / 60], [1 / 120], [1 / 144], [0.007, 0.08, 0.013]]) {
        w.speed = speed
        control.speed = speed
        let remaining = 0.25
        for (let i = 0; remaining > 1e-10; i++) {
          const dt = Math.min(remaining, schedule[i % schedule.length])
          step(dt)
          remaining -= dt
        }
      }
    w.speed = 1
    control.speed = 1
    const start = w.turn
    while (
      w.units.some(u => globalThis.bloodlustPeople.includes(u.id) && u.bloodlust) &&
      w.turn - start < 1500
    ) {
      step(1 / 12)
      const unit = w.units.find(u => u.id === globalThis.bloodlustPeople[0])
      if (!unit)
        throw new Error('Natural acceptance follower died; do not inject replacement/health')
      const sprite = s.unitMeshes.get(unit.id)?.getObjectByName('bloodlust-aura')
      observations.push({
        remaining: unit.bloodlust ?? 0,
        counter: unit.native?.counter ?? w.turn,
        visible: !!sprite?.visible,
        frame: s.gameClock.animationFrame,
      })
    }
    if (w.units.some(u => globalThis.bloodlustPeople.includes(u.id) && u.bloodlust))
      throw new Error('Natural Bloodlust lifetime did not expire')
    if (JSON.stringify(w) !== JSON.stringify(control))
      throw new Error('Final paired state mismatch')
    return {
      turns: w.turn - start,
      observations,
      stock: w.shots.bloodlust,
      gifts: w.giftCounts.bloodlust,
      statuses: globalThis.bloodlustPeople.map(id => {
        const u = w.units.find(u => u.id === id)
        return [id, u?.bloodlust ?? 0, u?.native?.flags3 ?? 0]
      }),
    }
  })
  assert.ok(lifecycle.observations.some(o => o.remaining > 0 && o.remaining < 128 && !o.visible))
  assert.ok(lifecycle.observations.some(o => o.remaining > 0 && o.remaining < 128 && o.visible))
  for (const o of lifecycle.observations)
    assert.equal(o.visible, o.remaining > 0 && (o.remaining >= 128 || !(o.counter & 2)))
  assert.equal(lifecycle.stock, 0)
  assert.equal(lifecycle.gifts, 1)
  assert.ok(lifecycle.statuses.every(([, timer, flags]) => timer === 0 && !(flags & 0x80000)))
  assert.deepEqual(opened.errors, [])
  saveStage('schedule-invariant paired world and natural status expiry', lifecycle)
  report.status = 'PASS'
} catch (error) {
  report.status = 'FAIL'
  report.error = error.stack ?? String(error)
  if (page) await page.screenshot({ path: resolve(dir, 'failure.png') }).catch(() => {})
  throw error
} finally {
  writeFileSync(resolve(dir, 'report.json'), JSON.stringify(report, null, 2))
  await browser.close()
}
