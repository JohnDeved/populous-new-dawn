// Mission12-specific, normal-input acceptance for #98. The later Spy combat
// lifecycle belongs to #97. This checker never grants a spell or changes actors.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync, renameSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { bindGame } from './browser-game.mjs'

const outputIndex = process.argv.indexOf('--output-dir')
assert.ok(outputIndex >= 0 && process.argv[outputIndex + 1], '--output-dir is required')
assert.ok(
  process.env.PND_QUEUE_JOB_ID && process.env.PND_QUEUE_DEADLINE,
  'Use the shared guarded queue'
)
assert.ok(process.env.POPULOUS_URL, 'The guardian must supply its owned server URL')
assert.equal(new URL(process.env.POPULOUS_URL).port, '4318')
const output = resolve(process.argv[outputIndex + 1])
mkdirSync(output, { recursive: false })
const report = {
  startedAt: new Date().toISOString(),
  jobId: process.env.PND_QUEUE_JOB_ID,
  sourceSHA: createHash('sha256')
    .update(readFileSync(fileURLToPath(import.meta.url)))
    .digest('hex'),
  mission: 12,
  issue: 98,
  status: 'RUNNING',
  stage: 'entry',
  stages: [],
  actions: [],
  progress: [],
  errors: [],
  limits: [
    'Fresh shipped Mission12; no preceding victory, actor/stock/mana/terrain/HP/outcome injection.',
    'Only camera focus, explicit RAF ownership and ordinary tick(world, 1/12) acceleration are supplied.',
    'Mission12 shore coordinates are geometric leads; actual terrain, spell validity and traversal must pass.',
    'No native rerun, recovery bypass or Mission7 equivalence. Spy combat/training acceptance remains #97.',
  ],
}
const save = () => {
  const target = join(output, 'evidence.json')
  writeFileSync(target + '.tmp', JSON.stringify(report, null, 2) + '\n')
  renameSync(target + '.tmp', target)
}
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const wrap = value => ((((value + 128) % 256) + 256) % 256) - 128
// Derived from Mission12's own land components, not the Mission7 crossing.
const shores = { from: { x: -12.5, z: -76.5 }, to: { x: -25.5, z: -67.5 } }
let browser, page, actorId, vaultId
const deadline = Math.min(Date.now() + 420000, Date.parse(process.env.PND_QUEUE_DEADLINE) - 25000)
const guard = setTimeout(
  () => {
    report.deadlineReached = true
    save()
    void browser?.close()
  },
  Math.max(1, deadline - Date.now())
)
process.once('SIGTERM', () => {
  report.terminated = true
  save()
  void browser?.close()
})

async function state() {
  return page.evaluate(() => {
    const w = window.testStore.getWorld()
    const person = u => ({
      id: u.id,
      team: u.team,
      kind: u.kind,
      x: u.x,
      z: u.z,
      hp: u.hp,
      inside: u.inside,
      work: u.work,
      target: u.target,
      path: u.path,
      native: u.native && {
        state: u.native.state,
        commandStatus: u.native.commandStatus,
        commandHead: u.native.commandHead,
        flags4: u.native.flags4,
        motionGroup: u.native.motionGroup,
        life: u.native.life,
      },
    })
    return {
      level: w.outcome.level,
      turn: w.turn,
      status: w.status,
      inputMask: w.inputMask,
      mode: w.mode,
      lastOrderTurn: w.lastOrderTurn,
      selected: [...w.selected],
      shots: { ...w.shots },
      manaObservation: {
        available: w.manaTribes[0].available,
        rate: w.manaTribes[0].previousRate,
        bridgeProgress: w.manaTribes[0].spellProgress[12],
        disabled: w.manaWorld.spells[0].disabled,
      },
      units: w.units.filter(u => u.hp > 0).map(person),
      shrines: w.shrines.map(v => ({
        id: v.id,
        kind: v.kind,
        reward: v.reward,
        uses: v.uses,
        x: v.x,
        z: v.z,
      })),
      projectiles: w.projectiles.map(p => ({ id: p.id, spell: p.spell, caster: p.caster })),
      bridgeEffects: w.effects
        .filter(f => f.bridge)
        .map(f => ({ id: f.id, start: f.bridge.start, target: f.bridge.target })),
      bridges: w.stats.bridges,
      landVersion: w.landVersion,
      unlockedSpyHut: w.unlockedSpyHut,
      completed: window.testStore.getCompletedMissions(),
    }
  })
}

async function holdRaf(hold) {
  await page.evaluate(hold => {
    const s = window.testScene
    if (s.frame) cancelAnimationFrame(s.frame)
    s.frame = 0
    s.previous = null
    window.__vault12SetRafHold(hold)
    window.__vault12OwnsRaf = hold
    if (!hold) s.frame = requestAnimationFrame(s.animate)
  }, hold)
}

async function render() {
  await page.evaluate(() => {
    const s = window.testScene
    if (!window.__vault12OwnsRaf || s.frame) throw new Error('Checker must own RAF')
    const now = performance.now()
    s.previous = now
    s.animate(now)
    if (s.frame) cancelAnimationFrame(s.frame)
    s.frame = 0
    s.previous = null
  })
}

async function until(label, condition, limit, batch = 128) {
  let elapsed = 0
  while (elapsed < limit) {
    const result = await page.evaluate(
      async ({ condition, count, actorId }) => {
        const w = window.testStore.getWorld(),
          s = window.testScene,
          { tick } = await import('/app/model.ts')
        if (!window.__vault12OwnsRaf || s.frame)
          throw new Error('Ordinary ticks require exclusive RAF ownership')
        const ready = () => {
          const u = w.units.find(u => u.id === actorId && u.hp > 0)
          switch (condition.kind) {
            case 'opening':
              return !!(w.flyby.flags & 1)
            case 'stock':
              return w.shots[condition.spell] >= 1
            case 'recruited':
              return w.units.filter(u => u.team === 'blue' && u.hp > 0).length > condition.before
            case 'near':
              return !!u && Math.hypot(u.x - condition.point.x, u.z - condition.point.z) <= 1
            case 'bridge':
              return w.stats.bridges > condition.before && w.effects.some(f => f.bridge)
            case 'terrain':
              return (
                w.stats.bridges > condition.before &&
                !w.effects.some(f => f.bridge) &&
                !w.projectiles.some(p => p.id === condition.projectile)
              )
            case 'vault':
              return !!w.unlockedSpyHut
            default:
              throw new Error('Unknown condition')
          }
        }
        let ticks = 0
        while (!ready() && ticks < count && w.status === 'playing') {
          if (!w.units.some(u => u.id === actorId && u.hp > 0)) break
          tick(w, 1 / 12)
          ticks++
        }
        window.testStore.update()
        const now = performance.now()
        s.previous = now
        s.animate(now)
        if (s.frame) cancelAnimationFrame(s.frame)
        s.frame = 0
        s.previous = null
        const u = w.units.find(u => u.id === actorId && u.hp > 0)
        return {
          ready: ready(),
          ticks,
          turn: w.turn,
          status: w.status,
          actor: u && {
            id: u.id,
            x: u.x,
            z: u.z,
            hp: u.hp,
            work: u.work,
            path: u.path,
            state: u.native?.state,
            command: u.native?.commandStatus,
            life: u.native?.life,
            group: u.native?.motionGroup,
          },
          shots: { ...w.shots },
          manaObservation: {
            available: w.manaTribes[0].available,
            rate: w.manaTribes[0].previousRate,
            bridgeProgress: w.manaTribes[0].spellProgress[12],
            disabled: w.manaWorld.spells[0].disabled,
          },
          unlockedSpyHut: w.unlockedSpyHut,
        }
      },
      { condition, count: Math.min(batch, limit - elapsed), actorId }
    )
    elapsed += result.ticks
    report.progress.push({ label, elapsed, ...result })
    save()
    if (result.ready) return result
    assert.ok(result.actor, 'ACTOR_LOST: ' + label)
    assert.equal(result.status, 'playing', 'Mission ended before ' + label)
    if (!result.ticks) break
  }
  throw new Error('NORMAL_PREREQUISITE_TIMEOUT: ' + label + '; ' + elapsed + ' ordinary turns')
}

async function stage(name, action) {
  report.stage = name
  save()
  const value = await action()
  await render()
  report.stages.push({ name, value, world: await state() })
  await page.screenshot({ path: join(output, report.stages.length + '-' + name + '.png') })
  save()
  return value
}

async function objectPoint(collection, id) {
  await render()
  return page.evaluate(
    ({ collection, id }) => {
      const s = window.testScene,
        w = window.testStore.getWorld(),
        u = w[collection].find(o => o.id === id)
      if (!u) throw new Error('Missing original object ' + id)
      s.focus(u)
      s.onChange()
      s.renderer.render(s.scene, s.camera)
      const person = collection === 'units',
        mesh = person ? s.unitMeshes.get(id) : s.shrineMeshes.get(id)?.g
      const p = s.screen(mesh?.position ?? u),
        b = s.container.getBoundingClientRect()
      const x = b.left + ((p.x + 1) * b.width) / 2,
        y = b.top + ((1 - p.y) * b.height) / 2
      for (let dy = person ? -24 : -140; dy <= (person ? 24 : 60); dy += 4)
        for (let dx = person ? -36 : -100; dx <= (person ? 36 : 100); dx += 4) {
          const e = { clientX: x + dx, clientY: y + dy },
            unit = s.picking.pickPerson(e)
          const hit = person ? unit : unit !== null ? undefined : s.pickWorldObject(e)?.id
          if (
            hit === id &&
            document.elementFromPoint(e.clientX, e.clientY) === s.renderer.domElement
          )
            return { x: e.clientX, y: e.clientY }
        }
      throw new Error('No rendered hit for original object ' + id)
    },
    { collection, id }
  )
}

async function selectActor() {
  for (let i = 0; i < 2 && (await state()).selected.length; i++) await page.keyboard.press('Escape')
  const point = await objectPoint('units', actorId)
  await page.mouse.click(point.x, point.y)
  assert.deepEqual((await state()).selected, [actorId], 'Actual rendered Shaman selection')
}

async function topology() {
  return page.evaluate(
    async ({ actorId, vaultId }) => {
      const w = window.testStore.getWorld(),
        { nativePosition } = await import('/app/model.ts')
      const rules = (await import('/app/original-rules.json')).default
      const actor = w.units.find(u => u.id === actorId),
        vault = w.shrines.find(v => v.id === vaultId)
      if (!actor || !vault) throw new Error('Original actor/Vault missing')
      const index = p => ((p.y & 65535) >>> 8) * 256 + ((p.x & 65535) >>> 8)
      const start = index(nativePosition(w, vault)),
        seen = new Uint8Array(65536),
        queue = [start]
      seen[start] = 1
      for (let h = 0; h < queue.length; h++) {
        const cell = queue[h],
          x = cell & 255,
          y = cell >>> 8
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue
            const nx = (x + dx + 256) & 255,
              ny = (y + dy + 256) & 255,
              next = ny * 256 + nx
            const coarse = (ny >>> 1) * 128 + (nx >>> 1)
            if (!seen[next] && rules.terrainCategoryFlags[w.land.categories[coarse] & 15] & 1) {
              seen[next] = 1
              queue.push(next)
            }
          }
      }
      const native = nativePosition(w, actor),
        quarter = index(native)
      return {
        turn: w.turn,
        farIsland: Array.from(seen),
        heights: Array.from(w.land.heights),
        connected: !!seen[quarter],
        actor: { id: actor.id, x: actor.x, z: actor.z, hp: actor.hp, quarter },
        landVersion: w.landVersion,
        bridges: w.stats.bridges,
      }
    },
    { actorId, vaultId }
  )
}

async function shorePoint(lead, farIsland, spell = null) {
  await render()
  const result = await page.evaluate(
    async ({ lead, farIsland, spell }) => {
      const s = window.testScene,
        w = window.testStore.getWorld()
      const { supportsFollower, nativePosition, spellTargetError } = await import('/app/model.ts')
      s.focus(lead)
      s.onChange()
      s.renderer.render(s.scene, s.camera)
      const b = s.container.getBoundingClientRect(),
        samples = []
      for (const radius of [0, 0.25, 0.5, 0.75, 1, 1.5])
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
          const target = {
            x: lead.x + Math.cos(angle) * radius,
            z: lead.z + Math.sin(angle) * radius,
          }
          const v = s.screen(target),
            e = {
              clientX: b.left + ((v.x + 1) * b.width) / 2,
              clientY: b.top + ((1 - v.y) * b.height) / 2,
            }
          if (
            document.elementFromPoint(e.clientX, e.clientY) !== s.renderer.domElement ||
            s.picking.pick(e) !== null
          )
            continue
          const picked = s.pick(e)
          if (!picked) continue
          const n = nativePosition(w, picked),
            quarter = ((n.y & 65535) >>> 8) * 256 + ((n.x & 65535) >>> 8)
          const error = spell ? spellTargetError(w, spell, picked) : null
          const item = {
            x: e.clientX,
            y: e.clientY,
            point: { x: picked.x, z: picked.z },
            native: n,
            supported: supportsFollower(w, picked),
            componentAllowed: !!farIsland[quarter],
            error,
          }
          if (samples.length < 10) samples.push(item)
          if (
            item.supported &&
            item.componentAllowed &&
            !error &&
            Math.hypot(picked.x - lead.x, picked.z - lead.z) < 2
          )
            return { found: true, pick: item, samples }
        }
      return { found: false, samples }
    },
    { lead, farIsland, spell }
  )
  report.actions.push({ kind: 'terrain-pick', lead, spell, ...result })
  save()
  assert.ok(result.found, 'No supported live shore pick/cast eligibility near Mission12 lead')
  return result.pick
}

async function move(pick, label) {
  const before = await state(),
    actor = before.units.find(u => u.id === actorId)
  assert.deepEqual(before.selected, [actorId])
  assert.equal(before.mode, null)
  const valid = await page.evaluate(pick => {
    const s = window.testScene,
      e = { clientX: pick.x, clientY: pick.y },
      p = s.pick(e)
    return (
      document.elementFromPoint(pick.x, pick.y) === s.renderer.domElement &&
      s.picking.pick(e) === null &&
      p &&
      Math.hypot(p.x - pick.point.x, p.z - pick.point.z) < 0.05
    )
  }, pick)
  assert.ok(valid, 'Rendered shore changed before normal move')
  await page.mouse.click(pick.x, pick.y)
  const after = await state(),
    current = after.units.find(u => u.id === actorId)
  const dispatched =
    after.lastOrderTurn > before.lastOrderTurn ||
    JSON.stringify(current.path) !== JSON.stringify(actor.path) ||
    current.native?.commandHead !== actor.native?.commandHead
  report.actions.push({
    kind: 'move',
    label,
    pick,
    beforeTurn: before.turn,
    afterTurn: after.turn,
    dispatched,
    actorBefore: actor,
    actorAfter: current,
  })
  save()
  assert.equal(before.turn, after.turn)
  assert.ok(dispatched, 'Move must dispatch before acceleration')
  return until(label, { kind: 'near', point: pick.point }, 6000, 16)
}

async function cast(spell, label, point) {
  // All camera operations precede spell selection: focus clears an armed mode.
  await page.getByRole('button', { name: /^spells/ }).click()
  await page.getByRole('button', { name: new RegExp('^' + label + ', ') }).click()
  await page.mouse.move(point.x, point.y)
  await page.evaluate(() => window.testScene.updatePointerFrame(performance.now()))
  await render()
  const validation = await page.evaluate(
    async ({ point, spell }) => {
      const s = window.testScene,
        w = window.testStore.getWorld(),
        { spellTargetError } = await import('/app/model.ts')
      const picked = s.pick({ clientX: point.x, clientY: point.y })
      return {
        turn: w.turn,
        mode: w.mode,
        canvas: document.elementFromPoint(point.x, point.y) === s.renderer.domElement,
        picked: picked && { x: picked.x, z: picked.z },
        error: picked ? spellTargetError(w, spell, picked) : 'No terrain hit',
      }
    },
    { point, spell }
  )
  report.actions.push({ kind: 'live-spell-validation', spell, ...validation })
  save()
  assert.ok(validation.canvas)
  assert.equal(validation.error, null)
  assert.equal(validation.mode, spell)
  const before = await state()
  await page.mouse.click(point.x, point.y)
  const after = await state(),
    ids = new Set(before.projectiles.map(p => p.id))
  const created = after.projectiles.filter(p => p.spell === spell && !ids.has(p.id))
  const dispatched = after.shots[spell] === before.shots[spell] - 1 && created.length === 1
  report.actions.push({
    kind: 'cast',
    spell,
    beforeTurn: before.turn,
    afterTurn: after.turn,
    beforeShots: before.shots[spell],
    afterShots: after.shots[spell],
    created,
    dispatched,
  })
  save()
  assert.equal(after.turn, before.turn)
  assert.ok(dispatched, 'Real cast must spend stock/create a projectile before ticks')
  return created[0].id
}

try {
  browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  })
  await context.addInitScript(() => {
    const request = window.requestAnimationFrame.bind(window)
    let held = true
    window.requestAnimationFrame = callback => (held ? 0 : request(callback))
    window.__vault12SetRafHold = hold => {
      held = hold
    }
  })
  page = await context.newPage()
  page.setDefaultTimeout(15000)
  page.on('pageerror', error => report.errors.push(error.stack ?? error.message))
  await page.goto(process.env.POPULOUS_URL, { waitUntil: 'networkidle', timeout: 60000 })
  await page.getByRole('button', { name: 'Mission 12', exact: true }).focus()
  await page.keyboard.press('Enter')
  await bindGame(page)
  await page.waitForFunction(
    () =>
      window.testStore.getWorld().outcome.level === 12 &&
      window.testSceneRef.current?.world === window.testStore.getWorld()
  )
  await page.evaluate(() => {
    window.testScene = window.testSceneRef.current
  })
  await holdRaf(true)
  await render()
  const initial = await state()
  actorId = initial.units.find(u => u.team === 'blue' && u.kind === 'shaman')?.id
  vaultId = initial.shrines.find(v => v.kind === 'vault' && v.reward === 'spyHut')?.id
  assert.equal(actorId, 209)
  assert.equal(vaultId, 230)
  await stage('fresh-Mission12-entry', async () => {
    assert.equal(initial.level, 12)
    assert.equal(initial.status, 'playing')
    assert.deepEqual(initial.completed, [])
    assert.equal(initial.unlockedSpyHut, false)
    return { actorId, vaultId, initialBridgeStock: initial.shots.bridge, injectedState: false }
  })
  await stage('normal-opening', async () => {
    await until('authored opening', { kind: 'opening' }, 64)
    await holdRaf(false)
    const skip = page.getByRole('button', { name: /Skip introduction/ })
    await skip.waitFor()
    await skip.click()
    await page.waitForFunction(
      () =>
        !(window.testStore.getWorld().inputMask & 64) &&
        window.testSceneRef.current?.world === window.testStore.getWorld()
    )
    await holdRaf(true)
    await render()
    assert.equal((await state()).inputMask, 0)
    return { skippedThroughShippedControl: true }
  })
  await stage('ordinary-recruitment', async () => {
    await until('Convert Wild charge', { kind: 'stock', spell: 'convertWild' }, 6000)
    const w = await state(),
      actor = w.units.find(u => u.id === actorId)
    const target = w.units
      .filter(u => u.team === 'wild' && u.inside === null)
      .sort(
        (a, b) =>
          Math.hypot(wrap(a.x - actor.x), wrap(a.z - actor.z)) -
          Math.hypot(wrap(b.x - actor.x), wrap(b.z - actor.z))
      )[0]
    assert.ok(target, 'Authored wild follower required')
    await selectActor()
    const point = await objectPoint('units', target.id)
    const before = w.units.filter(u => u.team === 'blue').length
    await cast('convertWild', 'Convert Wild', point)
    await until('real converted follower', { kind: 'recruited', before }, 1000)
    return {
      originalWildId: target.id,
      blueCount: (await state()).units.filter(u => u.team === 'blue').length,
    }
  })
  const landBefore = await topology()
  assert.equal(landBefore.connected, false, 'Mission12 must independently require this crossing')
  await stage('authored-Land-Bridge-charge', async () => {
    const chargingState = () =>
      page.evaluate(async () => {
        const w = window.testStore.getWorld(),
          { SPELLS } = await import('/app/model.ts')
        const { chargingSpells } = await import('/app/mana.ts')
        const stock = w.manaWorld.spells[0],
          mana = w.manaTribes[0]
        return {
          turn: w.turn,
          available: stock.available,
          disabled: stock.disabled,
          allocation: chargingSpells(w.manaWorld, 0),
          rate: mana.previousRate,
          bridgeProgress: mana.spellProgress[12],
          bridgeStock: w.shots.bridge,
          spells: SPELLS.filter(s => stock.available & (1 << s.model)).map(s => ({
            id: s.id,
            name: s.name,
            model: s.model,
            paused: !!(stock.disabled & (1 << (s.model - 1))),
          })),
        }
      })
    const initialCharging = await chargingState()
    report.chargingBeforePriority = initialCharging
    save()
    const bridge = initialCharging.spells.find(s => s.id === 'bridge')
    assert.ok(bridge, 'Land Bridge must be authored, not granted')
    assert.equal(bridge.paused, false)
    // Original HUD charging control: redirect ordinary incoming mana instead of
    // assuming a small idle tribe can fill every expensive spell in this bound.
    await page.getByRole('button', { name: /^spells/ }).click()
    for (const other of initialCharging.spells.filter(s => s.id !== 'bridge' && !s.paused)) {
      const before = await chargingState()
      await page
        .getByRole('button', { name: new RegExp('^' + other.name + ', ') })
        .click({ button: 'right' })
      const after = await chargingState(),
        bit = 1 << (other.model - 1)
      report.actions.push({
        kind: 'ordinary-charge-priority',
        spell: other.id,
        beforeTurn: before.turn,
        afterTurn: after.turn,
        beforeDisabled: before.disabled,
        afterDisabled: after.disabled,
        bit,
      })
      save()
      assert.equal(before.turn, after.turn)
      assert.equal(
        after.disabled,
        before.disabled ^ bit,
        'Rendered context menu must toggle only its original charging bit'
      )
    }
    const prioritized = await chargingState()
    report.chargingAfterPriority = prioritized
    save()
    assert.equal(prioritized.allocation.active, 1)
    assert.equal(prioritized.allocation.highest, 12)
    await until('ordinary Land Bridge charge', { kind: 'stock', spell: 'bridge' }, 30000)
    return { before: initialCharging, prioritized, after: await chargingState() }
  })
  await stage('rendered-source-shore-approach', async () => {
    await selectActor()
    // A source-shore lead must remain outside the disconnected target component.
    const allowed = landBefore.farIsland.map(bit => (bit ? 0 : 1))
    const pick = await shorePoint(shores.from, allowed)
    return move(pick, 'normal source shore approach')
  })
  let target
  await stage('real-Land-Bridge-cast', async () => {
    await selectActor()
    target = await shorePoint(shores.to, landBefore.farIsland, 'bridge')
    const before = await topology(),
      projectile = await cast('bridge', 'Land Bridge', target)
    await until('bridge effect', { kind: 'bridge', before: before.bridges }, 256, 1)
    report.activeBridge = (await state()).bridgeEffects
    save()
    await until(
      'normal bridge terrain completion',
      { kind: 'terrain', before: before.bridges, projectile },
      512,
      16
    )
    const after = await topology(),
      changed = after.heights.flatMap((h, i) =>
        h === before.heights[i] ? [] : [[i, before.heights[i], h]]
      )
    report.terrain = {
      beforeHash: hash(before.heights),
      afterHash: hash(after.heights),
      changed,
      landVersionBefore: before.landVersion,
      landVersionAfter: after.landVersion,
      connectedAfter: after.connected,
    }
    save()
    assert.ok(changed.length > 0)
    assert.ok(after.landVersion > before.landVersion)
    assert.ok(after.connected)
    return { projectile, changedVertices: changed.length, actualTarget: target }
  })
  await stage('real-far-island-traversal', async () => {
    await selectActor()
    const far = await shorePoint(target.point, landBefore.farIsland)
    const traversed = await move(far, 'cross completed bridge normally'),
      after = await topology()
    assert.equal(
      landBefore.farIsland[after.actor.quarter],
      1,
      'Actor must reach original far island'
    )
    return { actor: after.actor, turn: traversed.turn, originalFarIsland: true }
  })
  await stage('ordinary-Spy-Vault-acquisition', async () => {
    await selectActor()
    const point = await objectPoint('shrines', vaultId),
      before = await state()
    await page.mouse.click(point.x, point.y)
    const after = await state(),
      actor = after.units.find(u => u.id === actorId)
    const dispatched = actor?.work === vaultId || after.lastOrderTurn > before.lastOrderTurn
    report.actions.push({
      kind: 'vault-order',
      id: vaultId,
      beforeTurn: before.turn,
      afterTurn: after.turn,
      actor,
      dispatched,
    })
    save()
    assert.equal(after.turn, before.turn)
    assert.ok(dispatched)
    await until('normal Vault approach and reward', { kind: 'vault' }, 10000)
    const end = await state()
    assert.equal(end.shrines.find(v => v.id === vaultId).uses, 1)
    assert.ok(end.unlockedSpyHut)
    assert.ok(end.units.some(u => u.id === actorId))
    return { vaultId, uses: 1, unlockedSpyHut: true, actorAlive: true, turn: end.turn }
  })
  assert.deepEqual(report.errors, [])
  assert.equal(report.deadlineReached, undefined)
  report.status = 'PASS_MISSION12_NORMAL_BRIDGE_AND_SPY_VAULT'
} catch (error) {
  report.status = 'FIRST_FAULT_MISSION12_VAULT_BRIDGE'
  report.error = error.stack ?? String(error)
  process.exitCode = 1
  if (page && !page.isClosed()) {
    try {
      report.firstFault = await state()
      await page.screenshot({ path: join(output, 'first-fault.png') })
    } catch (captureError) {
      report.captureError = String(captureError)
    }
  }
} finally {
  clearTimeout(guard)
  if (browser) await browser.close()
  report.browserClosed = true
  report.finishedAt = new Date().toISOString()
  save()
  console.log(
    JSON.stringify(
      {
        status: report.status,
        stage: report.stage,
        error: report.error,
        passedStages: report.stages.map(s => s.name),
        output,
        browserClosed: true,
      },
      null,
      2
    )
  )
}
