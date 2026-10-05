// Controlled elapsed full Scene.animate acceptance, not a real-clock journey.
// Public controls own worship, movement, combat and all three Bridge casts.
// The registered check retains its route but never calls tick directly or zeros
// World speed. Historical PR212 tick-only receipts keep their original driver hash.
import assert from 'node:assert/strict'
import { writeFileSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { bindGame, effectPixels, readShamanReadiness } from './browser-game.mjs'
import { waitForHudTexture } from './hud-texture-readiness.mjs'
import { installCombinedGroundWitness } from './shaman-worship-ground-observer.mjs'

function assertBridgeWitness(evidence) {
  assert.deepEqual(evidence.errors, [])
  const { targetGiftId, handoff, body, arrival, payout, retirement } = evidence
  assert.ok(handoff && body && arrival && payout && retirement, 'Complete original-clock Bridge witness required')
  assert.equal(handoff.before.gift.id, targetGiftId)
  assert.ok(handoff.before.requests.includes(targetGiftId)); assert.deepEqual(handoff.after.requests, [])
  assert.equal(handoff.after.spell.giftId, targetGiftId); assert.equal(handoff.after.spell.model, 12)
  assert.equal(handoff.after.spell.active, true)
  assert.equal(body.state.spell.giftId, targetGiftId); assert.equal(body.state.spell.model, 12)
  assert.ok(body.state.spell.visits > 0 && evidence.visits > 0)
  assert.ok(body.state.clock.elapsed > handoff.after.clock.elapsed)
  assert.equal(body.hidden, false); assert.ok(body.nontransparent > 0)
  assert.ok(arrival.before.gift.remaining > 1); assert.equal(arrival.after.gift.remaining, 1)
  assert.equal(arrival.after.count, arrival.before.count, 'UI arrival cannot pay a gift')
  assert.equal(payout.before.gift.id, targetGiftId); assert.equal(payout.before.gift.remaining, 1)
  assert.equal(payout.after.turn, arrival.after.turn + 1, 'Next ordinary object turn owns payout')
  assert.equal(payout.after.count, payout.before.count + 1); assert.equal(payout.after.stock, payout.before.stock + 1)
  assert.equal(retirement.gift, undefined); assert.equal(retirement.spell.active, false)
  assert.equal(evidence.cueCount, 1)
}

export default async function checkShamanDeathGround({ page, url, root, output, signal, receipt }) {
  const baseline = process.env.PND_SHAMAN_GROUND_BASELINE === '1'
  const sha = path => createHash('sha256').update(readFileSync(path)).digest('hex')
  const report = { status: 'running', source: execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    sourceReceipt: receipt?.source, baseline, driverSha256: sha(new URL(import.meta.url)),
    frameHelperSha256: sha(new URL('./controlled-scene-frames.mjs', import.meta.url)),
    witnessHelperSha256: sha(new URL('./shaman-worship-ground-observer.mjs', import.meta.url)),
    clock: 'Held RAF; original complete Scene.animate receives monotonic 1000/24ms frames at observed normal speed1. No direct tick, advanceGame, UI visit or deadline writes.',
    bounds: { frameMilliseconds: 1000 / 24, batchFrames: 8, maximumFrames: 10000, browserWallMilliseconds: 420000 },
    limits: 'Controlled-elapsed integration through public gameplay controls with explicit camera-only assistance. Not a real-clock journey, native raster oracle or hardware performance claim. Pixel attribution is an isolated post-frame render diagnostic.',
    baselineScope: baseline ? 'Combined presentation source without the phase1 ground fix; old PR212 baseline receipts are not relabeled' : 'Combined production source with phase1 ground fix',
    actions: [], picking: [] }
  const errors = [], save = failed => writeFileSync(resolve(output, failed ? 'shaman-ground-failed.json' : 'shaman-ground.json'), JSON.stringify(report, null, 2) + '\n')
  page.on('pageerror', error => errors.push(error.stack ?? error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.setDefaultTimeout(45000)
  // bindGame/readiness must poll actual loader/React state with timers while
  // this check deliberately holds page RAF; do not patch the shared helper.
  const pollingPage = {
    waitForSelector: (...args) => page.waitForSelector(...args),
    waitForFunction: (predicate, argument, options = {}) => page.waitForFunction(predicate, argument, { ...options, polling: 10 }),
    evaluate: (...args) => page.evaluate(...args),
  }
  const abort = () => { void page.evaluate(() => { window.combinedAbort = true }).catch(() => {}) }
  signal.addEventListener('abort', abort, { once: true })
  let armed = false
  try {
    signal.throwIfAborted()
    await page.addInitScript(() => {
      window.combinedOriginalRAF = window.requestAnimationFrame
      window.combinedHeldRAF = () => 0
      window.requestAnimationFrame = window.combinedHeldRAF
    })
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: 'Select Mission 1', exact: true }).click()
    await page.getByRole('button', { name: 'Start Mission 1', exact: true }).click()
    await bindGame(pollingPage)
    await page.waitForFunction(() => window.testSceneRef.current.started &&
      window.testSceneRef.current.world === window.testStore.getWorld(), null, { polling: 10 })
    await waitForHudTexture(page)
    report.assets = await page.evaluate(async () => {
      const scene = window.testSceneRef.current, { texture } = await import('/app/scene-assets.ts')
      await scene.ready
      const result = []
      for (const key of ['hud', 'effects']) {
        const image = texture(key).image
        if (!(image instanceof HTMLImageElement)) throw Error(`Missing original ${key} image`)
        await image.decode()
        if (!image.complete || !image.naturalWidth) throw Error(`Undecoded original ${key} image`)
        result.push({ key, width: image.naturalWidth, height: image.naturalHeight, source: image.currentSrc })
      }
      return result
    })
    await page.evaluate(async () => {
      const { runSceneFrames } = await import('/scripts/controlled-scene-frames.mjs'),
        { campaignShamanReadiness } = await import('/scripts/campaign-start-readiness.mjs'),
        scene = window.testSceneRef.current, world = scene.world, deadline = performance.now() + 420000
      window.combinedFrames = { total: 0, reports: [] }
      window.runCombinedFrames = async (goal, bound, detail = {}) => {
        const w = world, startTurn = w.turn, rows = []
        let sampledTurn = startTurn
        const shaman = () => w.units.find(u => u.team === 'blue' && u.kind === 'shaman'),
          body = () => w.effects.find(f => f.reincarnation?.team === 'blue')
        const ready = () => goal === 'startup' ? campaignShamanReadiness(w).ready === true
          : goal === 'stock' ? w.shots.bridge >= 4
          : goal === 'position' ? !!shaman() && Math.hypot(shaman().x - detail.x, shaman().z - detail.z) <= detail.tolerance
          : goal === 'injured' ? !!shaman() && shaman().hp <= 45
          : goal === 'controller' ? w.effects.some(f => f.bridge)
          : goal === 'death' ? !!body()
          : goal === 'phase1' ? body()?.reincarnation.phase === 1
          : goal === 'ground-samples' ? rows.length === bound
          : goal === 'turns' ? w.turn - startTurn >= bound : false
        const budget = { goal, bound, startTurn, result: null }
        window.combinedFrames.reports.push(budget)
        window.combinedDriving = true
        window.captureCombinedGroundSteps = goal === 'ground-samples'
        try {
          budget.result = await runSceneFrames({ scene, currentScene: () => window.testSceneRef.current,
            currentWorld: () => window.testStore.getWorld(), until: ready, frameMs: 1000 / 24,
            maxFrames: Math.min(2 * bound + 8, 10000 - window.combinedFrames.total), maxTurns: bound,
            batchFrames: 8, allowPaused: goal === 'startup', requireGoal: !['startup', 'position'].includes(goal),
            deadline, aborted: () => !!window.combinedAbort,
            validate: () => {
              if (!scene.started || scene.disposed || !scene.renderer.domElement.isConnected || document.hidden)
                throw Error('Controlled full-frame caller is not current, started and visible')
              if (w.status !== 'playing') throw Error(`Outcome changed during ${goal}`)
            },
            onFrame: () => {
              window.combinedFrames.total++
              window.observeCombinedGroundFrame?.()
              if (goal === 'ground-samples' && w.turn !== sampledTurn) {
                if (w.turn !== sampledTurn + 1) throw Error('Ground observation skipped an object turn')
                const row = window.readCombinedGround()
                if (!row || row.phase !== 1) throw Error('Grounded spirit ended before terrain observation')
                rows.push(row); sampledTurn = w.turn
              }
            } })
        } catch (error) { budget.failure = String(error.stack ?? error); throw error }
        finally { window.combinedDriving = false; window.captureCombinedGroundSteps = false }
        const u = shaman(), f = body()
        return { goal, ...budget.result, turn: w.turn, status: w.status, stock: w.shots.bridge,
          shaman: u && { id: u.id, x: u.x, z: u.z, hp: u.hp, fighting: !!u.fight },
          body: f && { id: f.id, x: f.x, z: f.z, phase: f.reincarnation.phase },
          bridges: w.effects.filter(f => f.bridge).map(f => ({ id: f.id, turn: f.bridge.turn })), rows }
      }
    })
    const skip = page.getByRole('button', { name: /Skip introduction/i }), resume = page.getByRole('button', { name: 'Resume game', exact: true })
    for (let batch = 0; batch < 80; batch++) {
      signal.throwIfAborted()
      if (await skip.isVisible() && await skip.isEnabled()) await skip.click()
      if (await resume.isVisible() && await resume.isEnabled()) await resume.click()
      const ready = await readShamanReadiness(pollingPage)
      if (ready.ready) { report.startup = ready; break }
      await page.evaluate(() => window.runCombinedFrames('startup', 12))
    }
    assert.equal(report.startup?.ready, true, 'Authored opening must release the Shaman')
    assert.deepEqual(await page.evaluate(() => ({ speed: window.testScene.world.speed, paused: window.testScene.world.paused })), { speed: 1, paused: false })
    await page.evaluate(installCombinedGroundWitness); armed = true
    await page.locator('.world-viewport canvas.battlefield').focus()
    await page.keyboard.press('h')
    report.shaman = await page.evaluate(() => {
      const w = window.testScene.world, u = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
      if (!u || !w.selected.includes(u.id)) throw Error('H did not select the authored Blue Shaman')
      return { id: u.id, hp: u.hp, turn: w.turn }
    })
  // Find an actual rendered hit. For spell targets, preserve beginCast's native
  // target cell; continuous mouse pixels need not reproduce a Node point exactly.
  async function clickTarget(kind, target) {
    signal.throwIfAborted()
    const probe = async () => page.evaluate(async ({ kind, target }) => {
      const s = window.testScene, w = s.world
      const p = kind === 'head' ? w.shrines.find(h => h.id === target)
        : kind === 'person' ? w.units.find(u => u.id === target) : target
      if (!p) throw Error(`Missing ${kind} target ${target}`)
      if (kind !== 'spell') {
        s.focus(p)
        for (let i = 0; i < 120; i++) s.updateCameraMotion(1 / 24)
        s.animate(s.previous)
      }
      const bounds = s.renderer.domElement.getBoundingClientRect(), screen = s.screen(p)
      const center = { x: bounds.left + (screen.x + 1) * bounds.width / 2,
        y: bounds.top + (1 - screen.y) * bounds.height / 2 }
      const snap = point => ({ x: Math.floor(point.x / 2) * 2 + 1,
        z: -Math.floor(-point.z / 2) * 2 - 1 })
      const wanted = snap(p), candidates = [], diagnostics = { kind, target, turn: w.turn,
        center, camera: { ...s.cameraPosition }, tried: 0, outside: 0, person: 0, object: 0,
        noTerrain: 0, distance: 0, nearest: null, nearestUnobstructed: null }
      for (let dy = -140; dy <= 60; dy += 2)
        for (let dx = -90; dx <= 90; dx += 2) candidates.push({ dx, dy })
      candidates.sort((a, b) => a.dx * a.dx + a.dy * a.dy - b.dx * b.dx - b.dy * b.dy)
      for (const { dx, dy } of candidates) {
        const event = { clientX: center.x + dx, clientY: center.y + dy }
        diagnostics.tried++
        if (document.elementFromPoint(event.clientX, event.clientY) !== s.renderer.domElement) { diagnostics.outside++; continue }
        if (kind === 'person') {
          if (s.picking.pickPerson(event) === target) return { hit: { x: event.clientX, y: event.clientY, target }, diagnostics }
        } else if (kind === 'head') {
          if (s.picking.pickPerson(event) == null && s.pickWorldObject(event)?.id === target)
            return { hit: { x: event.clientX, y: event.clientY, target }, diagnostics }
        } else {
          const point = s.pick(event)
          if (!point) { diagnostics.noTerrain++; continue }
          const person = kind === 'ground' ? s.picking.pickPerson(event) : null,
            object = kind === 'ground' ? s.pickWorldObject(event)?.id ?? null : null,
            distance = Math.hypot(point.x - p.x, point.z - p.z),
            candidate = { x: event.clientX, y: event.clientY, point, distance, person, object }
          if (!diagnostics.nearest || distance < diagnostics.nearest.distance) diagnostics.nearest = candidate
          if (person != null) { diagnostics.person++; continue }
          if (object != null) { diagnostics.object++; continue }
          if (!diagnostics.nearestUnobstructed || distance < diagnostics.nearestUnobstructed.distance)
            diagnostics.nearestUnobstructed = candidate
          const picked = snap(point)
          if (kind === 'spell' ? picked.x === wanted.x && picked.z === wanted.z
            : distance <= 0.35)
            return { hit: { x: event.clientX, y: event.clientY, point, snapped: picked, turn: w.turn }, diagnostics }
          diagnostics.distance++
        }
      }
      return { hit: null, diagnostics }
    }, { kind, target })
    let attempt = await probe()
    report.picking.push(attempt.diagnostics)
    if (!attempt.hit && kind === 'ground') {
      // One public camera rotation may expose this same ground target. It does
      // not relax normal movement ownership or consume any simulation time.
      await page.locator('.world-viewport canvas.battlefield').focus()
      const center = await page.locator('.world-viewport canvas.battlefield').boundingBox()
      assert.ok(center)
      await page.mouse.move(Math.round(center.x + center.width / 2), Math.round(center.y + center.height / 2))
      await page.keyboard.down('ArrowLeft')
      let rotation
      try {
        rotation = await page.evaluate(() => {
          const s = window.testScene, w = s.world,
            state = () => ({ turn: w.turn, stock: w.shots.bridge, speed: w.speed, paused: w.paused,
              previous: s.previous, clock: structuredClone(w.worshipAcquisition.clock) }), before = state(),
            angle = s.cameraPosition.angle
          if (!s.keys.has('arrowleft') || !(s.navigationButtons() & 16)) throw Error('Public camera rotation key was not owned')
          for (let frame = 0; frame < 20; frame++) s.updateCameraMotion(1 / 24)
          s.animate(s.previous)
          return { before, after: state(), beforeAngle: angle, afterAngle: s.cameraPosition.angle,
            cameraOnlySteps: 20, publicKey: 'ArrowLeft' }
        })
      } finally { await page.keyboard.up('ArrowLeft') }
      report.picking.push({ rotation })
      assert.deepEqual(rotation.after, rotation.before, 'Camera preparation must preserve the full acquisition clock and object time')
      assert.notEqual(rotation.afterAngle, rotation.beforeAngle)
      assert.equal(await page.evaluate(() => window.testScene.keys.has('arrowleft')), false)
      attempt = await probe(); report.picking.push(attempt.diagnostics)
    }
    const hit = attempt.hit
    assert.ok(hit, `No unobstructed rendered ${kind} hit for ${JSON.stringify(target)}; bounded picking diagnostics retained`)
    const before = kind === 'spell' ? undefined : await page.evaluate(() => {
      const w = window.testScene.world
      return { turn: w.turn, nextId: w.nextId }
    })
    if (kind === 'spell')
      assert.equal(await page.evaluate(() => window.testScene.world.mode), 'bridge',
        'Public Land Bridge selection must remain active before the ground click')
    await page.mouse.click(hit.x, hit.y)
    let acceptance
    if (before) {
      acceptance = await page.evaluate(async ({ kind, target, before }) => {
        const w = window.testScene.world
        const { currentPersonOrder } = await import('/app/person-orders.ts')
        const u = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
        const p = u?.native ?? u?.fight?.motion ?? u?.entry?.person ?? u?.builder?.person
        const order = p && currentPersonOrder(w.buildingOrders, p)
        const markers = w.effects.filter(f => f.kind === 'orderMarker' && f.id >= before.nextId)
        const observed = { turn: w.turn, lastOrderTurn: w.lastOrderTurn, work: u?.work,
          target: u?.target, selected: !!u && w.selected.includes(u.id),
          order: order && { model: order.model, a: order.a, b: order.b, references: order.references },
          markerIds: markers.map(f => f.id) }
        if (!u || !observed.selected || w.turn !== before.turn || w.lastOrderTurn !== before.turn)
          throw Error(`UI command was not acknowledged: ${JSON.stringify(observed)}`)
        if (kind === 'head' && (u.work !== target || order?.model !== 27 || order.a !== target))
          throw Error(`Worship click did not issue its head order: ${JSON.stringify(observed)}`)
        if (kind === 'ground' && (order?.model !== 3 || !order.references || !markers.length))
          throw Error(`Ground click did not issue a movement order/marker: ${JSON.stringify(observed)}`)
        if (kind === 'person' && u.target !== target)
          throw Error(`Attack click did not set the intended target: ${JSON.stringify(observed)}`)
        return observed
      }, { kind, target, before })
    }
    report.actions.push({ kind, target, hit, acceptance })
    return hit
  }

  async function advance(goal, bound, detail = {}) {
    signal.throwIfAborted()
    const result = await page.evaluate(({ goal, bound, detail }) => window.runCombinedFrames(goal, bound, detail), { goal, bound, detail })
    report.progress = result
    save(false)
    return result
  }

  async function bridge(point) {
    signal.throwIfAborted()
    const before = await page.evaluate(async point => {
      const w = window.testScene.world
      const { spellTargetError } = await import('/app/live-command.ts')
      const error = spellTargetError(w, 'bridge', point)
      if (error) throw Error(`Land Bridge is not ready: ${JSON.stringify(error)}`)
      return { stock: w.shots.bridge, turn: w.turn, nextId: w.nextId,
        hp: w.units.find(u => u.team === 'blue' && u.kind === 'shaman')?.hp }
    }, point)
    // Camera focus cancels the current mode, so finish it before public selection.
    await page.evaluate(point => {
      const s = window.testScene
      s.focus(point)
      for (let i = 0; i < 120; i++) s.updateCameraMotion(1 / 24)
      s.animate(s.previous)
    }, point)
    await page.getByRole('button', { name: /^Land Bridge, \d+ shots$/ }).click()
    await clickTarget('spell', point)
    const cast = await page.evaluate(() => {
      const w = window.testScene.world, p = w.projectiles.at(-1)
      return { stock: w.shots.bridge, turn: w.turn, projectile: p && {
        id: p.id, spell: p.spell, target: p.target, caster: p.caster, phase: p.phase } }
    })
    assert.equal(cast.stock, before.stock - 1, 'HUD/canvas cast must spend actual stock')
    assert.equal(cast.projectile?.spell, 'bridge')
    assert.equal(cast.projectile.caster, report.shaman.id)
    assert.equal(cast.projectile.phase, 'windup')
    assert.equal(cast.turn, before.turn, 'Control preparation must not advance the held simulation')
    report.actions.push({ cast: { before, after: cast } })
    return cast
  }

    await clickTarget('head', 29)
    report.acquired = await advance('stock', 2200)
    assert.equal(report.acquired.stock, 4)
    report.bridgeWitness = await page.evaluate(() => window.combinedBridgeEvidence)
    assertBridgeWitness(report.bridgeWitness)
    await clickTarget('ground', { x: 0, z: 20 })
    report.shore = await advance('position', 300, { x: 0, z: 20, tolerance: 1 })
    await bridge({ x: 0, z: 4 })
    assert.equal((await advance('turns', 100)).bridges.length, 0, 'First crossing must finish')
    await clickTarget('ground', { x: 1, z: -3 })
    await advance('position', 500, { x: 1, z: -3, tolerance: 1 })
    await clickTarget('ground', { x: 1, z: -7 })
    await advance('position', 150, { x: 1, z: -7, tolerance: 0.7 })
    // Native coastal movement may stop just short of the requested point. The
    // production dry-target/range/cast predicates decide readiness at this shore.
    await bridge({ x: 1, z: -21 })
    assert.equal((await advance('turns', 100)).bridges.length, 0, 'Second crossing must finish')
    await clickTarget('person', 33)
    report.injured = await advance('injured', 600)
    assert.ok(report.injured.shaman?.hp > 20 && report.injured.shaman.hp <= 45)
    assert.ok(report.injured.shaman.fighting, 'Ordinary combat must cause the injury')
    report.deathCast = await bridge({ x: 1, z: -29 })
    report.controller = await advance('controller', 60)
    assert.ok(report.controller.shaman?.hp > 0, 'Caster must survive until real Bridge creation')
    assert.ok(report.controller.bridges.some(f => f.id > report.deathCast.projectile.id))
    await clickTarget('person', 33)
    report.death = await advance('death', 120)
    assert.equal(report.death.shaman, undefined)
    assert.equal(report.death.body.phase, 0)
    await advance('phase1', 8)

    async function snapshot() {
      signal.throwIfAborted()
      return page.evaluate(() => {
        const s = window.testScene, f = s.world.effects.find(f => f.reincarnation?.team === 'blue')
        if (!f) throw Error('Missing ordinary Shaman body')
        s.focus(f)
        for (let i = 0; i < 120; i++) s.updateCameraMotion(1 / 24)
        s.animate(s.previous) // Explicit zero-elapsed camera render; no gameplay progress.
        return window.readCombinedGround()
      })
    }
    report.before = await snapshot()
    await page.screenshot({ path: resolve(output, 'ground-before.png') })
    report.samples = (await advance('ground-samples', 64)).rows
    report.nativeGroundSteps = await page.evaluate(() => window.combinedBridgeEvidence.groundSteps)
    assert.equal(report.nativeGroundSteps.length, 64)
    for (let i = 0; i < 64; i++) {
      const step = report.nativeGroundSteps[i], frame = report.samples[i]
      assert.equal(step.stage, 'after-original-World-turn-before-frame-render')
      assert.equal(Object.hasOwn(step, 'meshY'), false, 'Native step observation makes no pre-render mesh claim')
      for (const key of ['turn', 'id', 'x', 'z', 'phase', 'ground', 'stored', 'height']) assert.equal(frame[key], step[key])
    }
    report.after = await snapshot()
    assert.equal(report.samples.length, 64)
    const heights = new Set([report.before.ground, ...report.samples.map(row => row.ground)])
    assert.ok(heights.size > 1, 'Actual death-point terrain must change during phase1')
    for (const row of [report.before, ...report.samples, report.after]) {
      assert.equal(row.id, report.before.id); assert.deepEqual([row.x, row.z], [report.before.x, report.before.z])
      assert.equal(row.phase, 1); assert.equal(row.source, 352); assert.equal(row.visible, true)
      assert.equal(row.status, 'playing'); assert.ok(row.braves > 0)
      if (!baseline) {
        assert.equal(row.height, row.ground); assert.equal(row.stored, row.ground)
        assert.equal(row.meshY, row.ground / 128)
      }
    }
    if (baseline) assert.ok(report.samples.some(row => row.height !== row.ground), 'Combined negative control must show cached-height discrepancy')
    // Existing isolated contribution diagnostic: hide/render/read/restore the
    // same already-proved mesh. It is not an elapsed frame or a state producer.
    report.pixels = await effectPixels(page, [report.after.id])
    report.pixelMethod = 'Post-frame renderer-only attribution; ordinary complete zero-elapsed Scene frame restores final output afterward'
    if (!baseline) assert.ok(report.pixels > 0, 'Grounded spirit must contribute actual framebuffer pixels')
    await page.evaluate(() => window.testScene.animate(window.testScene.previous))
    await page.screenshot({ path: resolve(output, 'ground-after.png') })
    report.status = 'passed'
  } catch (error) {
    report.status = 'failed'; report.failure = error.stack ?? String(error)
  } finally {
    signal.removeEventListener('abort', abort)
    if (!page.isClosed()) {
      try {
        if (armed) await page.evaluate(() => window.restoreCombinedGroundWitness?.())
        const final = await page.evaluate(() => {
          const result = { bridge: window.combinedBridgeEvidence, frames: window.combinedFrames }
          if (window.requestAnimationFrame !== window.combinedHeldRAF) throw Error('Held RAF ownership changed')
          window.requestAnimationFrame = window.combinedOriginalRAF
          result.rafRestored = true
          return result
        })
        report.bridgeWitness = final.bridge; report.frames = final.frames; report.rafRestored = final.rafRestored
        if (report.bridgeWitness?.body?.png) {
          const bytes = Buffer.from(report.bridgeWitness.body.png.split(',')[1], 'base64')
          assert.ok(bytes.length <= 8_000_000)
          writeFileSync(resolve(output, 'combined-bridge-body.png'), bytes)
          delete report.bridgeWitness.body.png; report.bridgeWitness.body.artifact = 'combined-bridge-body.png'
        }
      } catch (error) { report.cleanupFailure = String(error); report.status = 'failed' }
    }
    if (page.isClosed()) { report.cleanupFailure ??= 'Page closed before observer/RAF restoration'; report.status = 'failed' }
    report.errors = errors
    try {
      assert.deepEqual(errors, [])
      if (report.status === 'passed') {
        assert.equal(report.bridgeWitness.restored, true); assert.deepEqual(report.bridgeWitness.errors, [])
        assert.deepEqual(report.bridgeWitness.diagnostics, [])
        assert.equal(report.rafRestored, true)
      }
    } catch (error) { report.status = 'failed'; report.failure ??= String(error.stack ?? error) }
    save(report.status !== 'passed')
  }
  assert.equal(report.status, 'passed', report.failure ?? report.cleanupFailure ?? JSON.stringify(errors))
  return report
}
