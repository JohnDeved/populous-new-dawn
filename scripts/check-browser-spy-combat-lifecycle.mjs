// Issue97 normal Spy lifecycle. PR108 acquisition helpers and stages are reused
// from their exact reviewed source; the original checker is not modified.
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
  issue: 97,
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
    'No native rerun, recovery bypass or Mission7 equivalence; Spy lifecycle proceeds only after ordinary PR108 acquisition.',
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
  // A valid shore can be hidden by higher foreground terrain at one bearing.
  // Rotate through normal owned-page keys; never force a pick through terrain.
  for (let view = 0; view < 8; view++) {
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
    report.actions.push({ kind: 'terrain-pick', lead, spell, view, ...result })
    save()
    if (result.found) return result.pick
    if (view === 7) break
    await page.mouse.move(820, 500)
    await page.keyboard.down('ArrowRight')
    let rotation
    try {
      rotation = await page.evaluate(() => {
        const s = window.testScene,
          w = window.testStore.getWorld()
        const before = { turn: w.turn, angle: s.cameraPosition.angle }
        // Existing navigation check exercises this same presentation-only hook.
        for (let step = 0; step < 10; step++) s.updateCameraMotion(1 / 24)
        return { before, after: { turn: w.turn, angle: s.cameraPosition.angle } }
      })
    } finally {
      await page.keyboard.up('ArrowRight')
    }
    report.actions.push({ kind: 'ordinary-camera-rotation', ...rotation })
    save()
    assert.equal(
      rotation.before.turn,
      rotation.after.turn,
      'Camera search must not advance simulation'
    )
    assert.notEqual(
      rotation.before.angle,
      rotation.after.angle,
      'Actual arrow input must rotate the view'
    )
  }
  throw new Error('No unoccluded supported shore pick at eight normal camera bearings')
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

// Focused extension: no shared simulation, panel, training or save owner is edited.
// Real school/actor state is recorded before and after actual controls and ticks.
async function lifecycleState(personId, schoolId) {
  return page.evaluate(
    async ({ personId, schoolId }) => {
      const w = window.testStore.getWorld(),
        { currentPersonOrder } = await import('/app/person-orders.ts')
      const scalar = o =>
        o &&
        Object.fromEntries(
          Object.entries(o).filter(
            entry => entry[1] === null || ['number', 'boolean', 'string'].includes(typeof entry[1])
          )
        )
      const u = w.units.find(u => u.id === personId),
        b = w.buildings.find(b => b.id === schoolId)
      const p = u?.native,
        order = p ? currentPersonOrder(w.buildingOrders, p) : undefined
      return {
        turn: w.turn,
        status: w.status,
        selected: [...w.selected],
        lastOrderTurn: w.lastOrderTurn,
        mode: w.mode,
        unit: u && {
          ...scalar(u),
          native: scalar(p),
          path: structuredClone(u.path),
          order: scalar(order),
          fight: u.fight && { ...scalar(u.fight), motion: scalar(u.fight.motion) },
        },
        school: b && {
          ...scalar(b),
          damage: scalar(b.damageState),
          training: structuredClone(b.training),
        },
        mana: {
          available: w.manaTribes[0].available,
          rate: w.manaTribes[0].previousRate,
          disabled: w.manaWorld.spells[0].disabled,
        },
        livingBlue: w.units
          .filter(u => u.team === 'blue' && u.hp > 0)
          .map(u => ({
            id: u.id,
            kind: u.kind,
            x: u.x,
            z: u.z,
            hp: u.hp,
            inside: u.inside,
            work: u.work,
          })),
        selectedSprite: u && {
          owner: window.testScene.unitMeshes.get(u.id)?.userData.owner,
          visible: window.testScene.unitMeshes.get(u.id)?.visible,
        },
      }
    },
    { personId, schoolId }
  )
}
async function lifecycleUntil(label, condition, limit, personId, schoolId, batch = 64) {
  let elapsed = 0
  while (elapsed < limit) {
    const stepped = await page.evaluate(
      async ({ condition, count, personId, schoolId }) => {
        const w = window.testStore.getWorld(),
          s = window.testScene,
          { tick } = await import('/app/model.ts')
        if (!window.__vault12OwnsRaf || s.frame)
          throw Error('Lifecycle time requires the same exclusive RAF owner')
        const ready = () => {
          const u = w.units.find(u => u.id === personId && u.hp > 0),
            b = w.buildings.find(b => b.id === schoolId)
          switch (condition.kind) {
            case 'built':
              return !!b && b.progress >= 1
            case 'departed':
              return !w.units.some(u => u.work === schoolId)
            case 'trained':
              return (
                !!u && u.kind === 'spy' && u.inside === null && !u.path.length && u.work === null
              )
            case 'disguised':
              return !!u?.native && u.native.disguise === condition.tribe << 6
            case 'near':
              return !!u && Math.hypot(u.x - condition.point.x, u.z - condition.point.z) <= 1.5
            case 'turns':
              return false
            default:
              throw Error('Unclassified lifecycle condition')
          }
        }
        let ticks = 0
        while (ticks < count && !ready() && w.status === 'playing') {
          if (!w.units.some(u => u.id === personId && u.hp > 0)) break
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
        return { ticks, ready: ready() }
      },
      { condition, count: Math.min(batch, limit - elapsed), personId, schoolId }
    )
    elapsed += stepped.ticks
    const current = await lifecycleState(personId, schoolId)
    report.progress.push({ label, elapsed, ...current })
    save()
    if (stepped.ready || (condition.kind === 'turns' && elapsed >= limit)) return current
    assert.equal(current.status, 'playing', label + ' ended mission')
    assert.ok(current.unit && current.unit.hp > 0, 'NORMAL_LIFECYCLE_ACTOR_LOST: ' + label)
    if (!stepped.ticks) break
  }
  throw Error(
    'NORMAL_LIFECYCLE_FIRST_FAULT: ' +
      label +
      ' after ' +
      elapsed +
      ' ordinary turns; inspect actual command/queue/school/mana state'
  )
}
async function observeTrainingReplacement(sourceId, schoolId) {
  const observation = await page.evaluate(
    async ({ sourceId, schoolId }) => {
      const w = window.testStore.getWorld(),
        s = window.testScene,
        { tick } = await import('/app/model.ts')
      if (!window.__vault12OwnsRaf || s.frame)
        throw Error('Training observation requires exclusive RAF ownership')
      const existing = new Set(w.units.map(u => u.id)),
        samples = []
      let replacement = null,
        missing = null
      const start = w.turn,
        scalar = o =>
          o &&
          Object.fromEntries(
            Object.entries(o).filter(
              e => e[1] === null || ['number', 'string', 'boolean'].includes(typeof e[1])
            )
          )
      for (let n = 0; n < 20000; n++) {
        const trainee = w.units.find(u => u.id === sourceId),
          school = w.buildings.find(b => b.id === schoolId)
        if (!trainee || trainee.hp <= 0) {
          missing = { turn: w.turn, sourceId }
          break
        }
        const before = {
          turn: w.turn,
          source: scalar(trainee),
          admission: school?.admission && {
            ...scalar(school.admission),
            occupants: [...school.admission.occupants],
          },
          timer: school?.timer,
        }
        tick(w, 1 / 12)
        const old = w.units.find(u => u.id === sourceId),
          after = w.buildings.find(b => b.id === schoolId)
        const spawned = w.units.filter(
          u => u.team === 'blue' && u.kind === 'spy' && u.hp > 0 && !existing.has(u.id)
        )
        if (!(n % 64))
          samples.push({
            turn: w.turn,
            source: scalar(old),
            school: after && { timer: after.timer, admission: scalar(after.admission) },
            newSpies: spawned.map(u => scalar(u)),
          })
        if (!old && spawned.length) {
          replacement = {
            before,
            after: {
              turn: w.turn,
              school: after && {
                ...scalar(after),
                admission: after.admission && {
                  ...scalar(after.admission),
                  occupants: [...after.admission.occupants],
                },
              },
              spies: spawned.map(u => ({
                ...scalar(u),
                native: scalar(u.native),
                path: structuredClone(u.path),
              })),
            },
          }
          break
        }
        if (!old || old.hp <= 0) {
          missing = { turn: w.turn, sourceId }
          break
        }
        if (w.status !== 'playing') break
      }
      window.testStore.update()
      const now = performance.now()
      s.previous = now
      s.animate(now)
      if (s.frame) cancelAnimationFrame(s.frame)
      s.frame = 0
      s.previous = null
      return {
        start,
        end: w.turn,
        replacement,
        missing,
        samples,
        identityRule:
          'Existing training-conversion.ts allocates replacement people and removes source occupants; object identity is not stable.',
      }
    },
    { sourceId, schoolId }
  )
  report.trainingReplacement = observation
  save()
  assert.ok(
    observation.replacement,
    'NORMAL_TRAINING_FIRST_FAULT: no witnessed original occupant to allocated Spy replacement'
  )
  const { before, after } = observation.replacement
  assert.equal(before.source.id, sourceId)
  assert.equal(before.source.kind, 'brave')
  assert.equal(before.source.inside, schoolId)
  assert.ok(before.admission.occupants.includes(sourceId))
  assert.equal(after.school.admission.lastActivity, after.turn)
  assert.equal(after.school.admission.trainingCost, 0)
  assert.equal(after.spies.length, 1, 'This one-occupant training must yield one new Spy')
  const spy = after.spies[0]
  assert.notEqual(spy.id, sourceId)
  assert.equal(spy.native.model, 5)
  assert.equal(spy.team, 'blue')
  assert.ok(
    Math.hypot(spy.x - after.school.x, spy.z - after.school.z) < 2,
    'New Spy must originate at the actual training building'
  )
  return spy.id
}

async function entityHit(collection, id) {
  for (let view = 0; view < 8; view++) {
    await render()
    const hit = await page.evaluate(
      ({ collection, id }) => {
        const s = window.testScene,
          w = window.testStore.getWorld(),
          u = w[collection].find(u => u.id === id)
        if (!u) return { missing: true }
        s.focus(u)
        s.onChange()
        s.renderer.render(s.scene, s.camera)
        const person = collection === 'units',
          mesh = person ? s.unitMeshes.get(id) : null,
          projected = s.screen(mesh?.position ?? u),
          bounds = s.container.getBoundingClientRect()
        const x = bounds.left + ((projected.x + 1) * bounds.width) / 2,
          y = bounds.top + ((1 - projected.y) * bounds.height) / 2
        for (let dy = person ? -30 : -100; dy <= 35; dy += 3)
          for (let dx = person ? -32 : -65; dx <= 65; dx += 3) {
            const e = { clientX: x + dx, clientY: y + dy },
              p = s.picking.pickPerson(e),
              chosen = person ? p : p === null ? s.pickWorldObject(e)?.id : null
            if (
              chosen === id &&
              document.elementFromPoint(e.clientX, e.clientY) === s.renderer.domElement
            )
              return { point: { x: e.clientX, y: e.clientY }, world: { x: u.x, z: u.z } }
          }
        return { noVisibleHit: true, id, inside: u.inside, kind: u.kind }
      },
      { collection, id }
    )
    if (hit.point) return hit.point
    assert.ok(!hit.missing, 'Original actor/building disappeared before input')
    if (view === 7) throw Error('ACTUAL_RENDERED_ENTITY_NOT_EXPOSED: ' + JSON.stringify(hit))
    await page.keyboard.down('ArrowRight')
    try {
      await page.evaluate(() => {
        for (let i = 0; i < 10; i++) window.testScene.updateCameraMotion(1 / 24)
      })
    } finally {
      await page.keyboard.up('ArrowRight')
    }
  }
}
async function selectPerson(id) {
  for (let i = 0; i < 2 && (await state()).selected.length; i++) await page.keyboard.press('Escape')
  const point = await entityHit('units', id)
  await page.mouse.click(point.x, point.y)
  assert.deepEqual((await state()).selected, [id], 'Rendered single actor selection')
}
async function actualOrder(personId, collection, targetId, schoolId, label) {
  await selectPerson(personId)
  const point = await entityHit(collection, targetId),
    before = await lifecycleState(personId, schoolId)
  await page.mouse.click(point.x, point.y)
  const after = await lifecycleState(personId, schoolId)
  const changed =
    after.lastOrderTurn > before.lastOrderTurn ||
    JSON.stringify(after.unit?.order) !== JSON.stringify(before.unit?.order) ||
    after.unit?.work !== before.unit?.work ||
    after.unit?.target !== before.unit?.target
  report.actions.push({
    kind: 'normal-lifecycle-order',
    label,
    personId,
    targetId,
    collection,
    point,
    before,
    after,
    changed,
  })
  save()
  assert.equal(after.turn, before.turn)
  assert.ok(changed, 'Normal rendered order did not change actual command state: ' + label)
  return after
}
async function schoolSite(personId) {
  const plans = await page.evaluate(async id => {
    const w = window.testStore.getWorld(),
      u = w.units.find(u => u.id === id),
      { placementError, buildingPlanPose, browserPosition } = await import('/app/model.ts')
    if (!u) throw Error('Naturally converted builder missing')
    const sites = [],
      seen = new Set()
    for (let dz = -16; dz <= 16; dz += 1)
      for (let dx = -16; dx <= 16; dx += 1) {
        const raw = { x: u.x + dx, z: u.z + dz }
        if (placementError(w, 'spyHut', raw)) continue
        const plan = buildingPlanPose(w, 'spyHut', raw),
          point = browserPosition({ x: plan.anchorX, y: plan.anchorY }),
          key = point.x + ',' + point.z
        if (seen.has(key)) continue
        seen.add(key)
        const trees = w.trees.filter(t => t.wood > 0 || t.amount > 0 || t.hp > 0)
        const materialDistance = Math.min(
          ...(trees.length ? trees : w.trees).map(t => Math.hypot(t.x - point.x, t.z - point.z))
        )
        sites.push({
          point,
          score: Math.hypot(u.x - point.x, u.z - point.z) + materialDistance * 0.5,
          materialDistance,
        })
      }
    return sites.sort((a, b) => a.score - b.score).slice(0, 24)
  }, personId)
  assert.ok(plans.length, 'No normal nearby Spy-school plan is legal')
  for (const plan of plans) {
    const hit = await page.evaluate(async plan => {
      const s = window.testScene,
        w = window.testStore.getWorld(),
        { placementError } = await import('/app/model.ts')
      s.focus(plan.point)
      s.onChange()
      s.renderer.render(s.scene, s.camera)
      const b = s.container.getBoundingClientRect(),
        v = s.screen(plan.point),
        x = b.left + ((v.x + 1) * b.width) / 2,
        y = b.top + ((1 - v.y) * b.height) / 2
      for (let dy = -12; dy <= 12; dy += 3)
        for (let dx = -12; dx <= 12; dx += 3) {
          const e = { clientX: x + dx, clientY: y + dy },
            picked = s.pick(e)
          if (
            picked &&
            document.elementFromPoint(e.clientX, e.clientY) === s.renderer.domElement &&
            Math.hypot(picked.x - plan.point.x, picked.z - plan.point.z) < 2 &&
            !placementError(w, 'spyHut', picked)
          )
            return { x: e.clientX, y: e.clientY, point: { x: picked.x, z: picked.z }, plan }
        }
      return null
    }, plan)
    if (hit) return hit
  }
  throw Error('No actual terrain pick exposes a legal school plan; do not force one')
}
async function redirectManaToTraining() {
  const before = await page.evaluate(async () => {
    const w = window.testStore.getWorld(),
      { SPELLS } = await import('/app/model.ts')
    return {
      turn: w.turn,
      disabled: w.manaWorld.spells[0].disabled,
      active: SPELLS.filter(
        s =>
          w.manaWorld.spells[0].available & (1 << s.model) &&
          !(w.manaWorld.spells[0].disabled & (1 << (s.model - 1)))
      ).map(s => ({ name: s.name, model: s.model })),
    }
  })
  await page.getByRole('button', { name: /^spells/ }).click()
  for (const spell of before.active) {
    const prior = await page.evaluate(
      () => window.testStore.getWorld().manaWorld.spells[0].disabled
    )
    await page
      .getByRole('button', { name: new RegExp('^' + spell.name + ', ') })
      .click({ button: 'right' })
    const after = await page.evaluate(() => ({
      turn: window.testStore.getWorld().turn,
      disabled: window.testStore.getWorld().manaWorld.spells[0].disabled,
    }))
    assert.equal(after.turn, before.turn)
    assert.equal(after.disabled, prior ^ (1 << (spell.model - 1)))
    report.actions.push({
      kind: 'ordinary-training-mana-priority',
      spell: spell.name,
      prior,
      after,
    })
    save()
  }
}
async function clearGroundOrder(personId, schoolId, lead, label) {
  await selectPerson(personId)
  const pick = await page.evaluate(async lead => {
    const s = window.testScene,
      w = window.testStore.getWorld(),
      { supportsFollower } = await import('/app/model.ts')
    s.focus(lead)
    s.onChange()
    s.renderer.render(s.scene, s.camera)
    const b = s.container.getBoundingClientRect()
    for (const radius of [0, 0.5, 1, 1.5, 2])
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
        const p = { x: lead.x + radius * Math.cos(angle), z: lead.z + radius * Math.sin(angle) },
          v = s.screen(p),
          e = {
            clientX: b.left + ((v.x + 1) * b.width) / 2,
            clientY: b.top + ((1 - v.y) * b.height) / 2,
          },
          actual = s.pick(e)
        if (
          actual &&
          s.picking.pick(e) === null &&
          document.elementFromPoint(e.clientX, e.clientY) === s.renderer.domElement &&
          supportsFollower(w, actual) &&
          Math.hypot(actual.x - lead.x, actual.z - lead.z) < 3
        )
          return { x: e.clientX, y: e.clientY, point: { x: actual.x, z: actual.z } }
      }
    return null
  }, lead)
  assert.ok(pick, 'No legal rendered ground for ' + label)
  const before = await lifecycleState(personId, schoolId)
  assert.equal(before.mode, null)
  await page.mouse.click(pick.x, pick.y)
  const after = await lifecycleState(personId, schoolId)
  const changed =
    after.lastOrderTurn > before.lastOrderTurn ||
    JSON.stringify(after.unit.order) !== JSON.stringify(before.unit.order) ||
    JSON.stringify(after.unit.path) !== JSON.stringify(before.unit.path)
  report.actions.push({
    kind: 'normal-reassignment',
    label,
    point: pick.point,
    before,
    after,
    changed,
  })
  save()
  assert.equal(before.turn, after.turn)
  assert.ok(changed, 'Actual ground command must replace its predecessor')
  return pick.point
}
async function chooseEncounter(spyId) {
  return page.evaluate(async id => {
    const w = window.testStore.getWorld(),
      u = w.units.find(u => u.id === id),
      { nativePosition } = await import('/app/model.ts'),
      rules = (await import('/app/original-rules.json')).default
    const cell = p => {
        const n = nativePosition(w, p)
        return ((n.y & 65535) >>> 8) * 256 + ((n.x & 65535) >>> 8)
      },
      seen = new Uint8Array(65536),
      queue = [cell(u)]
    seen[queue[0]] = 1
    for (let i = 0; i < queue.length; i++) {
      const c = queue[i],
        x = c & 255,
        y = c >>> 8
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue
          const nx = (x + dx + 256) & 255,
            ny = (y + dy + 256) & 255,
            n = ny * 256 + nx,
            l = (ny >>> 1) * 128 + (nx >>> 1)
          if (!seen[n] && rules.terrainCategoryFlags[w.land.categories[l] & 15] & 1) {
            seen[n] = 1
            queue.push(n)
          }
        }
    }
    const delta = n => Math.min(Math.abs(n), 256 - Math.abs(n))
    const candidates = w.units
      .filter(
        v => v.hp > 0 && !['blue', 'wild'].includes(v.team) && v.inside === null && seen[cell(v)]
      )
      .map(v => ({
        id: v.id,
        team: v.team,
        kind: v.kind,
        x: v.x,
        z: v.z,
        distance: Math.hypot(delta(v.x - u.x), delta(v.z - u.z)),
      }))
      .sort((a, b) => a.distance - b.distance)
    const enemy = candidates.find(e => e.kind === 'brave') ?? candidates[0]
    if (!enemy)
      return {
        missing: true,
        componentCells: queue.length,
        livingEnemyCount: w.units.filter(v => !['blue', 'wild'].includes(v.team) && v.hp > 0)
          .length,
      }
    const targetTribe = { red: 1, yellow: 2, green: 3 }[enemy.team],
      disguiseTribe = [1, 2, 3].find(t => t !== targetTribe)
    return {
      enemy,
      disguiseTribe,
      disguiseName: ['', 'Dakini', 'Chumara', 'Matak'][disguiseTribe],
      componentCells: queue.length,
      actualRouteNotYetProved: true,
    }
  }, spyId)
}
async function ordinaryEncounter(spyId, schoolId, targetId) {
  await actualOrder(spyId, 'units', targetId, schoolId, 'ordinary hostile encounter')
  const result = await page.evaluate(
    async ({ spyId, schoolId, targetId }) => {
      const w = window.testStore.getWorld(),
        { tick } = await import('/app/model.ts')
      const samples = []
      let reveal = null,
        firstDamage = null,
        outcome = null
      for (let n = 0; n < 5000; n++) {
        const before = w.units.find(u => u.id === spyId),
          priorHP = before?.hp,
          priorDisguise = before?.native?.disguise ?? before?.fight?.motion?.disguise
        tick(w, 1 / 12)
        const spy = w.units.find(u => u.id === spyId),
          enemy = w.units.find(u => u.id === targetId),
          native = spy?.fight?.motion ?? spy?.native
        if (spy && (spy.fight || [25, 29].includes(native?.state)) && !reveal) {
          reveal = {
            turn: w.turn,
            priorHP,
            hp: spy.hp,
            priorDisguise,
            disguise: native?.disguise,
            state: native?.state,
            action: spy.fight?.action,
            opponent: spy.fight?.opponent,
          }
        }
        if (spy && priorHP !== undefined && spy.hp < priorHP && !firstDamage)
          firstDamage = {
            turn: w.turn,
            priorHP,
            hp: spy.hp,
            disguise: native?.disguise,
            state: native?.state,
          }
        if (!(n % 64))
          samples.push({
            turn: w.turn,
            spy: spy && {
              x: spy.x,
              z: spy.z,
              hp: spy.hp,
              state: native?.state,
              disguise: native?.disguise,
              command: spy.native?.commandStatus,
              fight: spy.fight && { action: spy.fight.action, opponent: spy.fight.opponent },
            },
            target: enemy && { hp: enemy.hp, x: enemy.x, z: enemy.z },
          })
        if (!spy || spy.hp <= 0 || !enemy || enemy.hp <= 0) {
          outcome = {
            turn: w.turn,
            spyAlive: !!spy && spy.hp > 0,
            enemyAlive: !!enemy && enemy.hp > 0,
          }
          break
        }
        if (w.status !== 'playing') break
      }
      if (outcome) for (let i = 0; i < 128; i++) tick(w, 1 / 12)
      const spy = w.units.find(u => u.id === spyId),
        enemy = w.units.find(u => u.id === targetId)
      return {
        reveal,
        firstDamage,
        outcome,
        samples,
        cleanup: {
          turn: w.turn,
          spyAlive: !!spy && spy.hp > 0,
          enemyAlive: !!enemy && enemy.hp > 0,
          selected: w.selected.includes(spyId),
          remainingFight: spy?.fight && { action: spy.fight.action, opponent: spy.fight.opponent },
        },
        schoolId,
      }
    },
    { spyId, schoolId, targetId }
  )
  report.combat = result
  save()
  assert.ok(
    result.reveal,
    'NORMAL_COMBAT_FIRST_FAULT: no ordinary encounter/reveal reached; inspect route/target samples'
  )
  assert.equal(result.reveal.disguise, 0, 'Original ordinary encounter must reveal the Spy')
  assert.equal(
    result.reveal.hp,
    result.reveal.priorHP,
    'Reveal observed before first encounter damage tick'
  )
  if (result.firstDamage) assert.equal(result.firstDamage.disguise, 0)
  assert.ok(result.outcome, 'Combat death/cleanup not reached within bounded normal encounter')
  if (!result.cleanup.spyAlive)
    assert.equal(result.cleanup.selected, false, 'Dead Spy must leave selection normally')
  if (result.cleanup.spyAlive && !result.cleanup.enemyAlive)
    assert.notEqual(
      result.cleanup.remainingFight?.opponent,
      targetId,
      'Dead opponent must not remain as an active fight target'
    )
  return result
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

  report.prerequisite = {
    PR: 108,
    head: 'ae982c6ce0f32229eb87a3fe7467c77c6bea92ca',
    sourceSHA: '16a07eccaa547d71a283b7690f9545a9fed2971a602cbac92725576807333620',
    routeReused: true,
    sourceModified: false,
  }
  report.limits.push(
    'Legacy Mission11 position assistance, forced school.timer and configured discovery chance are not reused. Real materials, training mana, movement and actual enemies are required.'
  )
  const brave = await page.evaluate(
    () =>
      window.testStore
        .getWorld()
        .units.find(u => u.team === 'blue' && u.kind === 'brave' && u.hp > 0 && u.inside === null)
        ?.id
  )
  assert.ok(brave, 'A living naturally converted Brave must precede construction')
  let school
  await stage('ordinary-Spy-school-construction', async () => {
    await selectPerson(brave)
    await page.getByRole('button', { name: 'buildings B', exact: true }).click()
    const site = await schoolSite(brave),
      before = await lifecycleState(brave)
    await page.getByRole('button', { name: /Spy Training Hut/ }).click()
    await page.mouse.move(site.x, site.y)
    await page.evaluate(() => window.testScene.updatePointerFrame(performance.now()))
    const validity = await page.evaluate(async point => {
      const s = window.testScene,
        w = window.testStore.getWorld(),
        { placementError } = await import('/app/model.ts'),
        p = s.pick({ clientX: point.x, clientY: point.y })
      return {
        mode: w.mode,
        error: p ? placementError(w, 'spyHut', p) : 'no terrain',
        picked: p && { x: p.x, z: p.z },
        canvas: document.elementFromPoint(point.x, point.y) === s.renderer.domElement,
        turn: w.turn,
      }
    }, site)
    report.actions.push({ kind: 'school-plan-validation', site, validity })
    save()
    assert.equal(validity.mode, 'spyHut')
    assert.equal(validity.error, null)
    assert.ok(validity.canvas)
    await page.mouse.click(site.x, site.y)
    school = await page.evaluate(
      () =>
        window.testStore.getWorld().buildings.find(b => b.team === 'blue' && b.kind === 'spyHut')
          ?.id
    )
    assert.ok(school, 'Actual plan click must create the school')
    const planned = await lifecycleState(brave, school)
    assert.equal(planned.turn, before.turn)
    assert.equal(planned.school.progress, 0)
    report.actions.push({ kind: 'rendered-school-plan', before, planned })
    save()
    await lifecycleUntil(
      'actual timber delivery and Spy school construction',
      { kind: 'built' },
      20000,
      brave,
      school
    )
    await lifecycleUntil('normal builder departure', { kind: 'departed' }, 2000, brave, school)
    return lifecycleState(brave, school)
  })
  let spyId
  await stage('ordinary-Spy-training', async () => {
    await redirectManaToTraining()
    const order = await actualOrder(
      brave,
      'buildings',
      school,
      school,
      'train actual converted Brave'
    )
    assert.ok(
      order.unit.order?.model === 8 || order.unit.work === school,
      'Actual training command8/building assignment'
    )
    spyId = await observeTrainingReplacement(brave, school)
    await lifecycleUntil(
      'normal new Spy exit movement finishes',
      { kind: 'trained' },
      2000,
      spyId,
      school,
      16
    )
    const trained = await lifecycleState(spyId, school)
    assert.equal(trained.unit.kind, 'spy')
    assert.equal(trained.unit.team, 'blue')
    assert.equal(trained.unit.id, spyId)
    assert.notEqual(spyId, brave)
    assert.equal(trained.unit.inside, null)
    const hit = await entityHit('units', spyId)
    return {
      sourceBrave: brave,
      allocatedSpy: spyId,
      trained,
      renderedHit: hit,
      schoolTimerForced: false,
    }
  })
  const encounter = await chooseEncounter(spyId)
  report.encounterPlan = encounter
  save()
  assert.ok(
    !encounter.missing,
    'No outdoor hostile in Spy current connected land; further legitimate transport prerequisite, not fabricated opponent'
  )
  await stage('real-Spy-disguise', async () => {
    await selectPerson(spyId)
    await page.getByRole('button', { name: 'followers V', exact: true }).click()
    const before = await lifecycleState(spyId, school)
    await page
      .getByRole('button', {
        name: 'Disguise selected spies as ' + encounter.disguiseName,
        exact: true,
      })
      .click()
    const after = await lifecycleState(spyId, school)
    report.actions.push({
      kind: 'real-disguise-command',
      tribe: encounter.disguiseTribe,
      before,
      after,
    })
    save()
    assert.equal(before.turn, after.turn)
    assert.equal(after.unit.order?.model, 16)
    await lifecycleUntil(
      'native command16 disguise countdown',
      { kind: 'disguised', tribe: encounter.disguiseTribe },
      256,
      spyId,
      school,
      1
    )
    await render()
    const disguised = await lifecycleState(spyId, school)
    assert.equal(disguised.unit.native.disguise, encounter.disguiseTribe << 6)
    assert.equal(disguised.selectedSprite.owner, encounter.disguiseTribe)
    return disguised
  })
  await stage('ordinary-cancel-and-reassignment', async () => {
    const before = await lifecycleState(spyId, school),
      start = { x: before.unit.x, z: before.unit.z }
    const first = await clearGroundOrder(
      spyId,
      school,
      { x: start.x + 6, z: start.z },
      'first normal move'
    )
    await lifecycleUntil(
      'ordinary movement before reassignment',
      { kind: 'turns' },
      4,
      spyId,
      school,
      1
    )
    const beforeEscape = await lifecycleState(spyId, school)
    await page.keyboard.press('Escape')
    const deselected = await lifecycleState(spyId, school)
    assert.equal(deselected.selected.includes(spyId), false)
    assert.equal(deselected.turn, beforeEscape.turn)
    assert.deepEqual(
      deselected.unit.order,
      beforeEscape.unit.order,
      'Escape deselects; must not invent order cancellation'
    )
    const replacement = await clearGroundOrder(
      spyId,
      school,
      { x: start.x, z: start.z + 4 },
      'replace active movement using real ground order'
    )
    assert.ok(Math.hypot(first.x - replacement.x, first.z - replacement.z) > 1)
    const arrived = await lifecycleUntil(
      'replacement move reaches real terrain',
      { kind: 'near', point: replacement },
      1500,
      spyId,
      school,
      16
    )
    assert.equal(arrived.unit.native.disguise, encounter.disguiseTribe << 6)
    return {
      first,
      replacement,
      actualEscapeSemantics: 'deselect-with-order-retained',
      replacementReached: true,
      state: arrived,
    }
  })
  await stage('ordinary-combat-reveal-and-cleanup', () =>
    ordinaryEncounter(spyId, school, encounter.enemy.id)
  )
  assert.deepEqual(report.errors, [])
  assert.equal(report.deadlineReached, undefined)
  report.status = 'PASS_MISSION12_NORMAL_SPY_COMBAT_LIFECYCLE'
} catch (error) {
  report.status = 'FIRST_FAULT_MISSION12_SPY_LIFECYCLE'
  report.error = error.stack ?? String(error)
  process.exitCode = 1
  if (page && !page.isClosed()) {
    try {
      report.firstFault = await state()
      report.lifecycleFault = await page.evaluate(() => {
        const w = window.testStore.getWorld()
        return {
          turn: w.turn,
          school: w.buildings.filter(b => b.team === 'blue' && b.kind === 'spyHut'),
          blue: w.units.filter(u => u.team === 'blue'),
          selected: w.selected,
          mana: w.manaTribes[0],
        }
      })
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
