// Standalone episode only. No workflow activation or profile-receipt changes.
import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { bindGame, showAllMissions } from './browser-game.mjs'
import { waitRecoveryReadiness } from './tutorial-browser/profile-readiness.mjs'
import { recoverVisibleIntroduction } from './local-render/original-pause-checkpoint-recovery.mjs'
import { originalTornadoPairs, checkTornadoReadback } from './lib/tornado-pixel-oracle.mjs'
import { finishTornadoAcceptance } from './lib/tornado-browser-evidence.mjs'

const fixture = JSON.parse(
  readFileSync(new URL('../tests/fixtures/tornado-original.json', import.meta.url))
)
const expectedPngSHA256 = createHash('sha256')
  .update(readFileSync(new URL('../public/original/tornado.png', import.meta.url)))
  .digest('hex')
const widths = [160, 80, 53, 40, 31, 26, 22, 20, 17, 15, 14, 13, 12, 11, 10, 10]

export async function runTornadoAppearance(
  browser,
  { artifactDir, budgetMs = 90000, url = process.env.POPULOUS_URL ?? 'http://localhost:3000', signal, deadlineAt } = {}
) {
  assert.ok(budgetMs > 0 && budgetMs <= 90000)
  signal?.throwIfAborted()
  const dir = resolve(artifactDir ?? 'work/orchestration/tornado-appearance-browser'),
    started = performance.now(),
    inputDeadlineAt = Number.isFinite(deadlineAt) ? Math.min(deadlineAt, Date.now() + budgetMs) : null,
    inputAbort = new AbortController(),
    priorContexts = new Set(browser.contexts()),
    report = {
      head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
      status: 'RUNNING',
      browserVersion: browser.version(),
      stock:
        'Two fresh sessions, one actual F9 Unlock + refill grant and one genuine HUD cast each. Supplied testing stock, not campaign acquisition.',
      limits:
        'Land and reachable water targets only; actual observed palettes reported. No terrain/controller/particle injection. Save portability is a separate non-cheat unit gate.',
      budgetMs,
      episodes: [],
    }
  mkdirSync(dir, { recursive: true })
  const outerAborted = () => inputAbort.abort(signal.reason)
  signal?.addEventListener('abort', outerAborted, { once: true })
  let expired = false
  const deadline = setTimeout(() => {
    expired = true
    inputAbort.abort(new Error('Tornado aggregate 90-second budget exhausted'))
    for (const context of browser.contexts())
      if (!priorContexts.has(context)) void context.close().catch(() => {})
  }, budgetMs)
  const persist = () =>
    writeFileSync(
      resolve(dir, 'tornado-appearance.json'),
      JSON.stringify({ ...report, elapsedMs: performance.now() - started }, null, 2)
    )
  try {
    for (const kind of ['land', 'water']) {
      if (expired) throw new Error('Tornado aggregate 90-second budget exhausted')
      const episode = { kind, stages: [], observedPalettes: [], inputBudgets: [] }
      report.episodes.push(episode)
      persist()
      const { page, errors } = await openTornadoGame(browser, url)
      page.setDefaultTimeout(8000)
      // Only hosted Tornado opts in: one existing 8s public-action allowance,
      // clipped again by each 12s readiness remainder and both outer deadlines.
      const recoverIntroduction = phase => {
        if (inputDeadlineAt === null) return recoverVisibleIntroduction(page)
        const trace = { episode: kind, readinessPhase: phase }
        episode.inputBudgets.push(trace)
        return recoverVisibleIntroduction(page, {
          setupTimeout: 8000, deadlineAt: inputDeadlineAt, signal: inputAbort.signal, trace,
        })
      }
      try {
        episode.readiness = await waitRecoveryReadiness(page, {
          timeout: 12000,
          signal: inputAbort.signal,
          onBlocked: recoverIntroduction('initial'),
        })
        await page.getByRole('button', { name: 'Select shaman', exact: true }).click()
        await page.keyboard.press('F9')
        await page.getByRole('button', { name: 'Unlock + refill all spells', exact: true }).click()
        await page.getByRole('button', { name: 'Close · F9', exact: true }).click()
        episode.target = await page.evaluate(async kind => {
          const s = globalThis.testScene,
            w = s.world,
            { nativePosition, spellInRange, tornadoCell } = globalThis.__pndTornadoFixture,
            shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman'),
            candidates = []
          if (!w.selected.includes(shaman.id)) throw new Error('HUD did not select ready Shaman')
          // Read-only bounded nearby target search; no teleport, terrain or range changes.
          for (let dz = -24; dz <= 24; dz += 2)
            for (let dx = -24; dx <= 24; dx += 2) {
              const distance = Math.hypot(dx, dz),
                p = { x: shaman.x + dx, z: shaman.z + dz }
              if (distance < 4 || !spellInRange(w, shaman, 4, p)) continue
              const native = nativePosition(w, p),
                cell = tornadoCell(w.land, native)
              if (cell.water === (kind === 'water')) candidates.push({ ...p, distance, cell })
            }
          candidates.sort((a, b) => a.distance - b.distance)
          const target = candidates[0]
          if (!target) throw new Error(`No reachable ${kind} target; do not invent coverage`)
          w.speed = 0
          cancelAnimationFrame(s.frame)
          s.focus(target)
          s.animate(s.previous)
          cancelAnimationFrame(s.frame)
          const p = s.screen(target),
            r = s.container.getBoundingClientRect()
          globalThis.tornadoProbe = {
            oldWorld: w,
            oldScene: s,
            beforeCast: w.stats.cast,
            beforeShots: w.shots.tornado,
            visits: 0,
          }
          return {
            ...target,
            pointer: {
              x: r.left + ((p.x + 1) * r.width) / 2,
              y: r.top + ((1 - p.y) * r.height) / 2,
            },
          }
        }, kind)
        // focus() intentionally cancels spell mode. Select through the real HUD
        // only AFTER camera placement; never restore mode by assigning it.
        await page.getByRole('button', { name: /^Tornado, \d+ shots$/ }).click()
        episode.cast = { before: await readCastState(page, episode.target.pointer) }
        persist()
        assert.equal(
          episode.cast.before.mode,
          'tornado',
          'Tornado mode must survive until pointer input'
        )
        assert.equal(episode.cast.before.targetError, null, 'actual picked target must be castable')
        assert.ok(episode.cast.before.canvasHit, 'canvas must own the planned pointer target')
        await page.mouse.click(episode.target.pointer.x, episode.target.pointer.y)
        episode.cast.after = await readCastState(page, episode.target.pointer)
        persist()
        assert.equal(
          episode.cast.after.casts,
          episode.cast.before.casts + 1,
          'real pointer must submit exactly one cast'
        )
        assert.equal(
          episode.cast.after.shots,
          episode.cast.before.shots - 1,
          'real pointer must spend exactly one charge'
        )
        assert.ok(
          episode.cast.after.projectiles.some(p => p.spell === 'tornado'),
          'real pointer must allocate the Tornado projectile'
        )
        await page.evaluate(async () => {
          const s = globalThis.testScene,
            w = s.world,
            probe = globalThis.tornadoProbe,
            { advanceGame, rules } = globalThis.__pndTornadoFixture
          w.speed = 1
          w.pendingTime = 0
          s.gameClock.animationTime = 0
          probe.step = () => {
            const before = probe.effect?.tornado.particles.map(p => ({ ...p })),
              turn = w.turn
            w.paused = false
            try {
              advanceGame(w, s.gameClock, 1 / 12)
            } finally {
              w.paused = true
            }
            probe.visits++
            if (before?.length && w.turn === turn + 1) {
              for (const particle of probe.effect.tornado.particles) {
                const index = before.findIndex(p => p.ordinal === particle.ordinal),
                  next = before[index + 1],
                  cell = ((particle.y & 65535) >>> 9) * 128 + ((particle.x & 65535) >>> 9),
                  water = rules.terrainCategoryFlags[w.land.categories[cell] & 15] & 2,
                  cliff = w.land.cliffs[cell],
                  expected = next
                    ? next.palette
                    : water
                      ? 5
                      : cliff > 212
                        ? -1
                        : cliff > 200
                          ? 3
                          : cliff > 127
                            ? -2
                            : 4
                if (particle.palette !== expected)
                  throw new Error(
                    'Live palette propagation differs from native next-child/terrain rule'
                  )
              }
            }
          }
          for (let i = 0; i < 64 && !w.effects.some(f => f.tornado); i++) probe.step()
          const effect = w.effects.find(f => f.tornado)
          if (
            !effect ||
            w.stats.cast !== probe.beforeCast + 1 ||
            w.shots.tornado !== probe.beforeShots - 1
          )
            throw new Error('HUD cast/projectile did not produce exactly one charged Tornado')
          probe.effect = effect
          probe.birth = effect.tornado.particles.map(p => ({ ...p }))
          s.focus(effect)
          s.animate(s.previous)
          cancelAnimationFrame(s.frame)
          probe.group = s.fxMeshes.get(effect.id)
          probe.disposed = 0
          probe.materials = probe.group.children.map(anchor => anchor.children[0].material)
          for (const material of probe.materials)
            material.addEventListener('dispose', () => probe.disposed++)
        })
        await page.waitForFunction(() =>
          globalThis.tornadoProbe.group.children.every(
            a => a.children[0].material.map.image?.complete
          )
        )

        async function capture(stage) {
          const result = await page.evaluate(() => {
            const s = globalThis.testScene,
              p = globalThis.tornadoProbe,
              t = p.effect.tornado
            s.focus(p.effect)
            s.animate(s.previous)
            cancelAnimationFrame(s.frame)
            const samples = t.particles.map(particle => {
              const anchor = p.group.children.find(a => a.userData.ordinal === particle.ordinal),
                sprite = anchor?.children[0],
                position = sprite.getWorldPosition(sprite.position.clone()),
                native = s.view.relative(position, (position.y * 128) / 45),
                basis = s.view.uniforms.nativeBasis.value,
                depth =
                  (Math.imul(native.x, basis[6]) +
                    Math.imul(native.y, basis[7]) +
                    Math.imul(native.z, basis[8])) >>
                  14,
                range = s.view.painter.ranges.get(sprite),
                command = range && s.view.painter.commandsBySlot[range[0]]
              return {
                ...particle,
                visible: anchor.visible,
                width: sprite.scale.x,
                height: sprite.scale.y,
                uv: sprite.userData.atlasTransform.toArray(),
                source: sprite.userData.hfxFrame,
                opacity: sprite.material.opacity,
                depth,
                bucket: command?.bucket,
                center: sprite.center.toArray(),
                texture: sprite.material.map.image.src,
                minFilter: sprite.material.map.minFilter,
                magFilter: sprite.material.map.magFilter,
              }
            })
            return {
              phase: t.phase,
              remaining: t.remaining,
              visits: p.visits,
              birth: p.birth,
              view: { ...s.view.config },
              samples,
              disposed: p.disposed,
              id: p.effect.id,
            }
          })
          assert.ok(result.samples.length > 0, `${stage}: live column`)
          for (const p of result.samples) {
            const birth = result.birth.find(b => b.ordinal === p.ordinal)
            assert.equal(p.frame, birth.frame)
            assert.equal(p.scaleX, birth.scaleX)
            assert.equal(p.source, 1136 + p.frame)
            assert.equal(p.opacity, 1)
            assert.ok(p.visible)
            assert.match(p.texture, /\/original\/tornado\.png$/)
            assert.equal(p.minFilter, 1003)
            assert.equal(p.magFilter, 1003)
            assert.deepEqual(p.uv, [80 / 2048, 50 / 128, (p.frame * 128) / 2048, 1 - 50 / 128])
            const distance = (p.depth + 0x7000 - 128) | 0,
              bucket = distance < 64 ? 0 : Math.min(3584, distance >> 4)
            assert.equal(p.bucket, bucket, 'actual painter command uses own child depth')
            const scale = n => {
              if (!result.view.scaledSprites) return n
              let value = Math.trunc(
                Math.imul(Math.imul(result.view.scale, n), 16) / result.view.spriteScale
              )
              if (bucket + 1 >= 1792)
                value =
                  (value +
                    Math.trunc(
                      Math.imul(Math.trunc(Math.imul(value, 14) / 16), bucket + 1 - 1792) / -1792
                    )) |
                  0
              return Math.max(-256, Math.min(256, value >> 4))
            }
            assert.equal(p.width, scale(widths[p.ordinal]))
            assert.equal(p.height, scale(50))
            assert.deepEqual(p.center, [p.width ? Math.trunc(p.width / 2) / p.width : 0.5, 0])
            if (!episode.observedPalettes.includes(p.palette))
              episode.observedPalettes.push(p.palette)
          }
          episode.stages.push({ stage, ...result })
          // Normal composition, before any visibility/clear-color isolation.
          await page.screenshot({ path: resolve(dir, `tornado-${kind}-${stage}-normal.png`) })
          persist()
          return result
        }
        const spawn = await capture('spawn')
        const selected = spawn.samples[0],
          pairs = originalTornadoPairs(fixture, selected.frame, selected.palette)
        episode.graphics = await page.evaluate(async () => {
          const { tornadoGraphicsMetadata } = globalThis.__pndTornadoFixture
          return tornadoGraphicsMetadata(globalThis.testScene, globalThis.devicePixelRatio)
        })
        persist()
        // Diagnostic is implemented separately below; it never edits simulation state.
        const gpu = await isolateColumn(page)
        for (const [name, data] of Object.entries(gpu.pngs))
          writeFileSync(
            resolve(dir, `tornado-${kind}-diagnostic-${name}.png`),
            Buffer.from(data.split(',')[1], 'base64')
          )
        const loadedAtlasSHA256 = createHash('sha256')
          .update(Buffer.from(gpu.sourcePNG))
          .digest('hex')
        assert.equal(
          loadedAtlasSHA256,
          expectedPngSHA256,
          'browser texture URL must serve the source-bound atlas validated against original PSFB fixtures'
        )
        const oracle = checkTornadoReadback(gpu.histogram, pairs)
        episode.diagnostic = {
          ordinal: selected.ordinal,
          source: selected.source,
          palette: selected.palette,
          loadedAtlasSHA256,
          ...oracle,
          cleanup: gpu.cleanup,
        }
        persist()
        assert.ok(
          oracle.visible > 20 && oracle.fractional > 0 && oracle.transparent > 0,
          'GPU readback must include visible, fractional-alpha and transparent original pixels'
        )
        assert.equal(
          oracle.mismatches,
          0,
          `Native encoded palette/alpha mismatch (including sRGB defects): ${JSON.stringify(oracle.examples)}`
        )
        await page.evaluate(() => {
          const p = globalThis.tornadoProbe
          for (let i = 0; i < 60; i++) p.step()
        })
        await capture('active')
        if (kind === 'land') {
          await page.evaluate(() => {
            const p = globalThis.tornadoProbe
            for (let i = 0; i < 224 && p.effect.tornado.particles.length === 16; i++) p.step()
          })
          const tail = await capture('first-tail')
          assert.deepEqual(
            tail.samples.map(p => p.ordinal),
            Array.from({ length: 15 }, (_, i) => i + 1)
          )
          await page.evaluate(() => {
            const p = globalThis.tornadoProbe
            for (let i = 0; i < 16 && p.effect.tornado.particles.length > 1; i++) p.step()
          })
          const last = await capture('last-tail')
          assert.deepEqual(
            last.samples.map(p => p.ordinal),
            [15]
          )
          episode.exactDeletion = await page.evaluate(() => {
            const p = globalThis.tornadoProbe,
              s = globalThis.testScene
            p.step()
            s.animate(s.previous)
            cancelAnimationFrame(s.frame)
            const empty =
              p.effect.tornado.particles.length === 0 && p.group.children.every(a => !a.visible)
            for (let i = 0; i < 8 && s.world.effects.includes(p.effect); i++) p.step()
            s.animate(s.previous)
            cancelAnimationFrame(s.frame)
            return { empty, removed: !s.fxMeshes.has(p.effect.id), disposed: p.disposed }
          })
          assert.deepEqual(episode.exactDeletion, { empty: true, removed: true, disposed: 16 })
        }
        // Water restarts with an active column; land also proves natural terminal deletion.
        // Neither route bypasses the normal restart or scene ownership path.
        await page.getByRole('button', { name: 'Menu', exact: true }).click()
        await page.getByRole('button', { name: 'Restart Level', exact: true }).click()
        await page.getByRole('button', { name: 'Yes', exact: true }).click()
        await bindGame(page)
        await page.waitForFunction(
          () =>
            globalThis.testScene.world !== globalThis.tornadoProbe.oldWorld &&
            !document.querySelector('.loading-world')
        )
        episode.restartReadiness = await waitRecoveryReadiness(page, {
          timeout: 12000,
          signal: inputAbort.signal,
          onBlocked: recoverIntroduction('restart'),
        })
        episode.cleanup = await page.evaluate(() => ({
          differentScene: globalThis.testScene !== globalThis.tornadoProbe.oldScene,
          disposed: globalThis.tornadoProbe.disposed,
          oldSceneDisposed: globalThis.tornadoProbe.oldScene.disposed,
          remainingColumns: [...globalThis.testScene.fxMeshes.values()].filter(
            g => g.name === 'tornado'
          ).length,
        }))
        assert.ok(episode.cleanup.differentScene && episode.cleanup.oldSceneDisposed)
        assert.equal(episode.cleanup.disposed, 16)
        assert.equal(episode.cleanup.remainingColumns, 0)
        await page.screenshot({ path: resolve(dir, `tornado-${kind}-restart-normal.png`) })
        assert.deepEqual(errors, [])
      } catch (error) {
        episode.failure = String(error.stack ?? error)
        episode.failureState = await readCastState(page, episode.target?.pointer).catch(error => ({
          observationError: String(error),
        }))
        await page
          .screenshot({ path: resolve(dir, `tornado-${kind}-failure.png`), timeout: 3000 })
          .catch(() => {})
        persist()
        throw error
      } finally {
        await page.context().close()
      }
    }
    await finishTornadoAcceptance(report, {
      close: async () => {
        for (const context of browser.contexts())
          if (!priorContexts.has(context)) await context.close()
      },
      elapsed: () => performance.now() - started,
      expired: () => expired,
      budgetMs,
    })
  } catch (error) {
    report.status = 'FAIL'
    report.error = String(error.stack ?? error)
    throw error
  } finally {
    clearTimeout(deadline)
    signal?.removeEventListener('abort', outerAborted)
    if (!inputAbort.signal.aborted) inputAbort.abort(new Error('Tornado episode settled'))
    if (report.status !== 'PASS')
      for (const context of browser.contexts())
        if (!priorContexts.has(context)) await context.close().catch(() => {})
    persist()
  }
  return report
}

async function readCastState(page, pointer) {
  return page.evaluate(pointer => {
    const s = globalThis.testScene,
      w = s.world,
      shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman'),
      event = pointer && { clientX: pointer.x, clientY: pointer.y },
      picked = event && s.pick(event),
      hit = pointer && document.elementFromPoint(pointer.x, pointer.y),
      targetError = picked
        ? globalThis.__pndTornadoFixture.spellTargetError(w, 'tornado', picked)
        : { message: 'No picked world target' }
    return {
      turn: w.turn,
      mode: w.mode,
      paused: w.paused,
      speed: w.speed,
      status: w.status,
      inputMask: w.inputMask,
      modalSuspended: s.modalSuspended,
      overviewStage: s.overviewStage,
      selected: [...w.selected],
      casts: w.stats.cast,
      shots: w.shots.tornado,
      pointer: pointer ?? null,
      picked: picked ?? null,
      targetError: targetError ?? null,
      canvasHit: hit === s.renderer.domElement,
      hit: hit ? { tag: hit.tagName, class: hit.className, role: hit.getAttribute('role') } : null,
      shaman: shaman && {
        id: shaman.id,
        x: shaman.x,
        z: shaman.z,
        hp: shaman.hp,
        casting: shaman.casting,
        nativeState: shaman.native?.state,
        flags2: shaman.native?.flags2,
        flags4: shaman.native?.flags4,
      },
      cooldown: w.castingTribes[0].cooldown,
      projectiles: w.projectiles.map(p => ({
        id: p.id,
        spell: p.spell,
        phase: p.phase,
        remaining: p.remaining,
        target: p.target,
      })),
      tornadoes: w.effects
        .filter(f => f.tornado)
        .map(f => ({ id: f.id, phase: f.tornado.phase, remaining: f.tornado.remaining })),
    }
  }, pointer ?? null)
}

async function openTornadoGame(browser, url) {
  const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      deviceScaleFactor: 1,
    }),
    page = await context.newPage(),
    errors = [],
    target = new URL(url)
  target.searchParams.set('tornado-appearance', '1')
  page.on('pageerror', error => errors.push(String(error.stack ?? error)))
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('crash', () => errors.push('Page crashed'))
  await page.goto(target.href, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => !!globalThis.__pndTornadoFixture)
  await showAllMissions(page)
  await page.getByRole('button', { name: 'Mission 1', exact: true }).focus()
  await page.keyboard.press('Enter')
  await bindGame(page)
  return { page, errors }
}

async function isolateColumn(page) {
  return page.evaluate(async () => {
    const s = globalThis.testScene,
      r = s.renderer,
      gl = r.getContext(),
      probe = globalThis.tornadoProbe,
      selected = probe.group.children.find(a => a.visible).children[0],
      states = [],
      clearColor = r.getClearColor(selected.material.color.clone()),
      clearAlpha = r.getClearAlpha(),
      viewport = r.getViewport(selected.userData.atlasTransform.clone()),
      scissor = r.getScissor(selected.userData.atlasTransform.clone()),
      scissorTest = r.getScissorTest(),
      target = r.getRenderTarget(),
      face = r.getActiveCubeFace(),
      mip = r.getActiveMipmapLevel(),
      autoClear = r.autoClear,
      autoColor = r.autoClearColor,
      autoDepth = r.autoClearDepth,
      autoStencil = r.autoClearStencil,
      background = s.scene.background,
      pngs = {},
      buffers = [],
      fingerprint = () =>
        JSON.stringify({
          tornado: probe.effect.tornado,
          rng: s.world.randomState,
          turn: s.world.turn,
          presentation: s.world.secondaryEffects.animationFrame,
        }),
      before = fingerprint()
    // Fetch encoded PNG bytes, not Canvas2D getImageData: the latter introduces
    // premultiplied-alpha round-trip changes to low-alpha original RGB bytes.
    const response = await fetch(selected.material.map.image.src)
    if (!response.ok) throw new Error('Loaded Tornado atlas readback failed')
    const sourcePNG = [...new Uint8Array(await response.arrayBuffer())]
    let cleanup = false
    try {
      s.scene.traverse(object => {
        if (object.isMesh || object.isSprite || object.isPoints || object.isLine) {
          states.push([object, object.visible])
          object.visible = object === selected
        }
      })
      s.scene.background = null
      r.setRenderTarget(null)
      r.setScissorTest(false)
      r.autoClear = true
      r.autoClearColor = true
      r.autoClearDepth = true
      r.autoClearStencil = true
      for (const [name, color] of [
        ['black', 0],
        ['white', 0xffffff],
      ]) {
        r.setClearColor(color, 1)
        s.view.painter.render(r, s.scene, s.camera)
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
        buffers.push(pixels)
        pngs[name] = r.domElement.toDataURL('image/png')
      }
    } finally {
      for (const [object, visible] of states) object.visible = visible
      s.scene.background = background
      r.setRenderTarget(target, face, mip)
      r.setViewport(viewport)
      r.setScissor(scissor)
      r.setScissorTest(scissorTest)
      r.setClearColor(clearColor, clearAlpha)
      r.autoClear = autoClear
      r.autoClearColor = autoColor
      r.autoClearDepth = autoDepth
      r.autoClearStencil = autoStencil
      s.view.painter.render(r, s.scene, s.camera)
      cleanup =
        states.every(([object, visible]) => object.visible === visible) &&
        r.getRenderTarget() === target &&
        r.getActiveCubeFace() === face &&
        r.getActiveMipmapLevel() === mip &&
        r.getScissorTest() === scissorTest &&
        r.getViewport(viewport.clone()).equals(viewport) &&
        r.getScissor(scissor.clone()).equals(scissor) &&
        r.getClearColor(clearColor.clone()).equals(clearColor) &&
        r.getClearAlpha() === clearAlpha &&
        s.scene.background === background &&
        r.autoClear === autoClear &&
        r.autoClearColor === autoColor &&
        r.autoClearDepth === autoDepth &&
        r.autoClearStencil === autoStencil &&
        fingerprint() === before
    }
    if (!cleanup) throw new Error('Diagnostic renderer/visibility restoration failed')
    const histogram = {}
    for (let i = 0; i < buffers[0].length; i += 4) {
      const key = [
        buffers[0][i],
        buffers[0][i + 1],
        buffers[0][i + 2],
        buffers[1][i],
        buffers[1][i + 1],
        buffers[1][i + 2],
      ].join(',')
      histogram[key] = (histogram[key] ?? 0) + 1
    }
    return { histogram, pngs, sourcePNG, cleanup }
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  assert.equal(
    execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }),
    '',
    'Commit and review checker before browser execution'
  )
  const { chromium } = await import('@playwright/test'),
    browser = await chromium.launch({ headless: true })
  try {
    console.log(JSON.stringify(await runTornadoAppearance(browser)))
  } finally {
    await browser.close()
  }
}
