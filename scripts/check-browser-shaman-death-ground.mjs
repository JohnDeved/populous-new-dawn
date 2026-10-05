// Controlled-clock rendered acceptance, not a real-clock ordinary journey.
// Mission/H selection, worship, movement, attack and all three Land Bridge casts
// use public UI clicks. RAF is held; ordinary fixed turns are supplied explicitly.
// Manual tick bypasses advanceGame's presentation cadence and scene turn observers.
// No HP, stock, mana, actor, AI, terrain, death effect or outcome is injected.
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { bindGame, effectPixels, readShamanReadiness } from './browser-game.mjs'
import { waitForHudTexture } from './hud-texture-readiness.mjs'

export default async function checkShamanDeathGround({ page, url, root, output, signal }) {
  const baseline = process.env.PND_SHAMAN_GROUND_BASELINE === '1'
  const report = {
    source: execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    baseline,
    clock: 'Held requestAnimationFrame and explicit ordinary tick(world, 1/12); camera preparation consumes no simulation turns.',
    limits: 'Controlled-clock rendered integration through public UI commands. Manual tick bypasses advanceGame presentation cadence and scene turn observers. This is not a real-clock ordinary journey, native raster comparison or hardware performance result.',
    actions: [],
  }
  const errors = []
  page.on('pageerror', error => errors.push(error.stack ?? error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.setDefaultTimeout(45000)
  await page.addInitScript(() => { window.requestAnimationFrame = () => 0 })
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Mission 1', exact: true }).click()
  await bindGame(page)
  const skip = page.getByRole('button', { name: /Skip introduction/i })
  for (let batch = 0; batch < 80; batch++) {
    signal.throwIfAborted()
    await page.evaluate(() => {
      const scene = window.testSceneRef.current
      for (let frame = 0; frame < 24; frame++) scene.animate(scene.previous + 1000 / 24)
    })
    await page.waitForTimeout(25)
    if (await skip.isVisible()) await skip.click()
    const ready = await readShamanReadiness(page)
    if (ready.ready) { report.startup = ready; break }
  }
  assert.equal(report.startup?.ready, true, 'Authored opening must release the Shaman')
  await waitForHudTexture(page)
  await page.evaluate(() => { window.testScene.world.speed = 0 })
  await page.locator('.world-viewport canvas.battlefield').focus()
  await page.keyboard.press('h')
  report.shaman = await page.evaluate(() => {
    const w = window.testScene.world
    const u = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
    if (!u || !w.selected.includes(u.id)) throw Error('H did not select the authored Blue Shaman')
    return { id: u.id, hp: u.hp, turn: w.turn }
  })

  // Find an actual rendered hit. For spell targets, preserve beginCast's native
  // target cell; continuous mouse pixels need not reproduce a Node point exactly.
  async function clickTarget(kind, target) {
    signal.throwIfAborted()
    const hit = await page.evaluate(async ({ kind, target }) => {
      const s = window.testScene, w = s.world
      const p = kind === 'head' ? w.shrines.find(h => h.id === target)
        : kind === 'person' ? w.units.find(u => u.id === target) : target
      if (!p) throw Error(`Missing ${kind} target ${target}`)
      s.focus(p)
      for (let i = 0; i < 120; i++) s.updateCameraMotion(1 / 24)
      s.animate(s.previous)
      const bounds = s.renderer.domElement.getBoundingClientRect(), screen = s.screen(p)
      const center = { x: bounds.left + (screen.x + 1) * bounds.width / 2,
        y: bounds.top + (1 - screen.y) * bounds.height / 2 }
      const snap = point => ({ x: Math.floor(point.x / 2) * 2 + 1,
        z: -Math.floor(-point.z / 2) * 2 - 1 })
      const wanted = snap(p), candidates = []
      for (let dy = -140; dy <= 60; dy += 2)
        for (let dx = -90; dx <= 90; dx += 2) candidates.push({ dx, dy })
      candidates.sort((a, b) => a.dx * a.dx + a.dy * a.dy - b.dx * b.dx - b.dy * b.dy)
      for (const { dx, dy } of candidates) {
        const event = { clientX: center.x + dx, clientY: center.y + dy }
        if (document.elementFromPoint(event.clientX, event.clientY) !== s.renderer.domElement) continue
        if (kind === 'person') {
          if (s.picking.pickPerson(event) === target) return { x: event.clientX, y: event.clientY, target }
        } else if (kind === 'head') {
          if (s.picking.pickPerson(event) == null && s.pickWorldObject(event)?.id === target)
            return { x: event.clientX, y: event.clientY, target }
        } else {
          if (kind === 'ground' && (s.picking.pickPerson(event) != null || s.pickWorldObject(event))) continue
          const point = s.pick(event)
          if (!point) continue
          const picked = snap(point)
          if (kind === 'spell' ? picked.x === wanted.x && picked.z === wanted.z
            : Math.hypot(point.x - p.x, point.z - p.z) <= 0.35)
            return { x: event.clientX, y: event.clientY, point, snapped: picked, turn: w.turn }
        }
      }
      throw Error(`No unobstructed rendered ${kind} hit for ${JSON.stringify(p)}`)
    }, { kind, target })
    const before = kind === 'spell' ? undefined : await page.evaluate(() => {
      const w = window.testScene.world
      return { turn: w.turn, nextId: w.nextId }
    })
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
    return page.evaluate(async ({ goal, bound, detail }) => {
      const s = window.testScene, w = s.world
      const { tick } = await import('/app/model.ts')
      const shaman = () => w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
      const body = () => w.effects.find(f => f.reincarnation?.team === 'blue')
      const ready = () => goal === 'stock' ? w.shots.bridge >= 4
        : goal === 'position' ? shaman() && Math.hypot(shaman().x - detail.x, shaman().z - detail.z) <= detail.tolerance
        : goal === 'injured' ? shaman() && shaman().hp <= 45
        : goal === 'controller' ? w.effects.some(f => f.bridge)
        : goal === 'death' ? !!body()
        : goal === 'phase1' ? body()?.reincarnation.phase === 1 : false
      let turns = 0
      while (turns < bound && !ready()) {
        if (w.status !== 'playing') throw Error(`Outcome changed during ${goal}`)
        tick(w, 1 / 12)
        turns++
      }
      if (!['turns', 'position'].includes(goal) && !ready()) throw Error(`Did not reach ${goal} in ${bound} turns`)
      s.onChange()
      s.animate(s.previous)
      const u = shaman(), f = body()
      return { goal, turns, turn: w.turn, status: w.status, stock: w.shots.bridge,
        shaman: u && { id: u.id, x: u.x, z: u.z, hp: u.hp, fighting: !!u.fight },
        body: f && { id: f.id, x: f.x, z: f.z, phase: f.reincarnation.phase },
        bridges: w.effects.filter(f => f.bridge).map(f => ({ id: f.id, turn: f.bridge.turn })) }
    }, { goal, bound, detail })
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

  try {
    await clickTarget('head', 29)
    report.acquired = await advance('stock', 2200)
    assert.equal(report.acquired.stock, 4)
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
      return page.evaluate(async () => {
        const s = window.testScene, w = s.world
        const { nativePosition } = await import('/app/world-terrain-runtime.ts')
        const f = w.effects.find(f => f.reincarnation?.team === 'blue')
        if (!f) throw Error('Missing ordinary Shaman body')
        s.focus(f)
        for (let i = 0; i < 120; i++) s.updateCameraMotion(1 / 24)
        s.animate(s.previous)
        const g = s.fxMeshes.get(f.id)
        return { turn: w.turn, id: f.id, x: f.x, z: f.z, phase: f.reincarnation.phase,
          ground: nativePosition(w, f).h, stored: f.reincarnation.ground,
          height: Math.round(f.height * 45), meshY: g.position.y, visible: g.visible,
          source: g.userData.directions[0].source, remaining: Math.round(w.respawns[0] * 12),
          randomState: w.randomState, cosmeticRandom: w.cosmeticRandom,
          braves: w.units.filter(u => u.team === 'blue' && u.kind === 'brave').length,
          status: w.status, bridge: w.effects.filter(f => f.bridge).map(f => ({ id: f.id, turn: f.bridge.turn })) }
      })
    }
    report.before = await snapshot()
    await page.screenshot({ path: `${output}/ground-before.png` })
    report.samples = await page.evaluate(async () => {
      const w = window.testScene.world, { tick } = await import('/app/model.ts')
      const { nativePosition } = await import('/app/world-terrain-runtime.ts')
      const rows = []
      for (let i = 0; i < 64; i++) {
        tick(w, 1 / 12)
        const f = w.effects.find(f => f.reincarnation?.team === 'blue')
        if (f?.reincarnation.phase !== 1) throw Error('Grounded spirit ended before terrain observation')
        rows.push({ turn: w.turn, ground: nativePosition(w, f).h,
          stored: f.reincarnation.ground, height: Math.round(f.height * 45) })
      }
      return rows
    })
    report.after = await snapshot()
    const heights = new Set([report.before.ground, ...report.samples.map(row => row.ground)])
    assert.ok(heights.size > 1, 'Actual death-point terrain must change during phase1')
    assert.equal(report.after.source, 352)
    assert.equal(report.after.visible, true)
    assert.equal(report.after.status, 'playing')
    assert.ok(report.after.braves > 0)
    assert.equal(report.after.id, report.before.id)
    assert.deepEqual([report.after.x, report.after.z], [report.before.x, report.before.z])
    if (baseline) {
      assert.ok(report.samples.some(row => row.height !== row.ground), 'Before source must exhibit the cached-height discrepancy')
    } else {
      assert.ok(report.samples.every(row => row.height === row.ground && row.stored === row.ground))
      assert.equal(report.after.meshY, report.after.ground / 128)
    }
    report.pixels = await effectPixels(page, [report.after.id])
    if (!baseline) assert.ok(report.pixels > 0, 'Grounded spirit must contribute actual framebuffer pixels')
    await page.evaluate(() => window.testScene.animate(window.testScene.previous))
    await page.screenshot({ path: `${output}/ground-after.png` })
    report.errors = errors
    assert.deepEqual(errors, [])
    writeFileSync(`${output}/shaman-ground.json`, JSON.stringify(report, null, 2) + '\n')
    return report
  } catch (error) {
    report.failure = error.stack ?? String(error)
    report.errors = errors
    writeFileSync(`${output}/shaman-ground-failed.json`, JSON.stringify(report, null, 2) + '\n')
    throw error
  }
}
