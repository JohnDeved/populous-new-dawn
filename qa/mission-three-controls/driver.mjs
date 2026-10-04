// Run only after coordinator release, using the maintained local-render harness.
// Actual game changes are mouse/keyboard actions. The isolated command-file
// protocol permits tactical decisions without eval, model commands or clock edits.
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { bindGame, showAllMissions } from '../../scripts/browser-game.mjs'
import { waitForCheckpointReadback } from '../../scripts/checkpoint-readback.mjs'
import { checkCondition, progressKey, IncompleteRun, MissionDefeat, authoredVictimIdentity, acceptedOrderEvidence, waitDiagnosticStop, requireNotDefeated } from './observation.mjs'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const normalKinds = new Set(['shaman', 'brave', 'preacher', 'warrior'])
const buildLabels = { temple: 'Temple, 8 wood', hut: 'Hut, 3 wood', camp: 'Warrior Training Hut, 8 wood' }
const spellLabels = { blast: 'Blast', swarm: 'Swarm' }

export default async function missionThreeControls({ page, output, root, signal, receipt }) {
  assert.equal(resolve(root), resolve(fileURLToPath(new URL('../../', import.meta.url))),
    'Browser source and archived scenario/observer must share the same worktree')
  const manifest = JSON.parse(readFileSync(resolve(root, 'qa/mission-three-controls/source-manifest.json'), 'utf8'))
  for (const source of manifest.files) assert.equal(sha256(readFileSync(resolve(root, source.path))), source.sha256,
    `Preflight source drift requires review: ${source.path}`)
  const level = JSON.parse(readFileSync(resolve(root, 'app/level-three.ts'), 'utf8').split('export default ')[1].trim().replace(/;$/, ''))
  const authoredVictim = authoredVictimIdentity(level.objects)
  const startWall = Date.now(), wallLimit = 90 * 60_000, inputs = [], failures = [], milestones = []
  const epochs = [], controlStops = [], ids = Object.create(null), commandsPath = resolve(output, 'commands')
  mkdirSync(commandsPath, { recursive: true })
  for (const name of ['driver.mjs', 'observation.mjs']) {
    const bytes = readFileSync(new URL(name, import.meta.url))
    writeFileSync(resolve(output, name), bytes)
    inputs.push({ name, sha256: sha256(bytes) })
  }
  writeFileSync(resolve(output, 'scenario-inputs.json'), JSON.stringify(inputs, null, 2) + '\n')
  const log = entry => appendFileSync(resolve(output, 'actions.jsonl'),
    JSON.stringify({ at: new Date().toISOString(), wallMs: Date.now() - startWall, ...entry }) + '\n')
  const saveProgress = (status = 'in-progress') => writeFileSync(resolve(output, 'journey.json'), JSON.stringify({
    status, inputs, ids, epochs, milestones, failures, controlStops,
    limits: 'Ordinary UI inputs and normal RAF only; independent Mission 3, software/headless renderer.'
  }, null, 2) + '\n')
  const button = async (name, options = {}) => {
    log({ action: 'button', name, options })
    await page.getByRole('button', { name, exact: true }).click(options)
  }
  const safeLabel = value => {
    assert.match(value, /^[a-z0-9][a-z0-9-]{0,70}$/)
    return value
  }
  const read = () => page.evaluate(async () => {
    const s = window.testSceneRef?.current, store = window.testStore
    if (!s || store.getWorld() !== s.world) throw Error('Current scene/store mismatch')
    if (window.m3Observation?.scene !== s || window.m3Observation.world !== s.world)
      throw Error('Diagnostic epoch does not belong to the current scene/world')
    const { currentPersonOrder } = await import('/app/person-orders.ts')
    const { observeBuilding } = await import('/qa/mission-three-controls/observation.mjs')
    const { campaignShamanReadiness } = await import('/scripts/campaign-start-readiness.mjs')
    const w = s.world, gl = s.renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info')
    const person = u => u.builder?.person ?? u.flight ?? u.fight?.motion ?? u.native ?? u.entry?.person
    const copy = o => o === undefined ? null : JSON.parse(JSON.stringify(o))
    return {
      level: w.outcome.level, turn: w.turn, time: w.time, paused: w.paused, speed: w.speed,
      status: w.status, inputMask: w.inputMask, lastOrderTurn: w.lastOrderTurn, pointerAck: copy(s.pointerAck), selected: [...w.selected], mode: w.mode,
      stats: copy(w.stats), shots: copy(w.shots), unlockedTemple: w.unlockedTemple,
      completedMissions: store.getCompletedMissions(), readiness: campaignShamanReadiness(w),
      camera: { point: copy(s.viewPoint), position: copy(s.cameraPosition), bearing: s.cameraBearing,
        motion: copy(s.cameraMotion), overview: s.overviewStage },
      animationFrame: s.gameClock.animationFrame, frame: s.frame,
      units: w.units.filter(u => u.hp > 0).map(u => {
        const p = person(u)
        return { id: u.id, team: u.team, kind: u.kind, x: u.x, z: u.z, hp: u.hp,
          inside: u.inside, work: u.work, target: copy(u.target), cargo: u.cargo,
          harvest: copy(u.harvest), delivery: copy(u.delivery), tree: u.tree, builder: u.builder &&
            { task: u.builder.task, phase: u.builder.phase, busy: u.builder.busy },
          route: p && { motionIndex: p.motionIndex, destinationX: p.destinationX, destinationY: p.destinationY,
            goalX: p.goalX, goalY: p.goalY }, nativeState: p?.state,
          owner: p?.workTarget, timer: p?.timer, flags2: p?.flags2, flags3: p?.flags3,
          flags4: p?.flags4, order: p && copy(currentPersonOrder(w.buildingOrders, p)) }
      }),
      buildings: w.buildings.filter(b => b.hp > 0).map(observeBuilding),
      shrines: w.shrines.map(h => ({ id: h.id, kind: h.kind, x: h.x, z: h.z, active: h.active,
        uses: h.uses, work: h.work, progress: h.progress, followers: h.followers, remaining: h.remaining })),
      effects: w.effects.map(e => ({ id: e.id, kind: e.kind, x: e.x, z: e.z, age: e.age })),
      observation: copy(window.m3Observation?.epoch),
      renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      contextLost: gl.isContextLost(), body: document.body.innerText,
    }
  })
  const health = snapshot => {
    assert.equal(snapshot.level, 3, 'Remain in Mission 3')
    assert.equal(snapshot.speed, 1, 'Normal game speed only')
    assert.equal(snapshot.contextLost, false, 'Live WebGL context')
    assert.deepEqual(snapshot.observation?.errors ?? [], [], 'No diagnostic errors')
    assert.deepEqual(snapshot.observation?.speedViolations ?? [], [], 'No speed changes')
    requireNotDefeated(snapshot.status)
  }
  const currentActive = snapshot => epochs.reduce((sum, epoch) => sum + epoch.activeSeconds, 0) +
    (snapshot.observation?.activeSeconds ?? 0)
  const snapshot = async name => {
    safeLabel(name)
    const state = await read()
    writeFileSync(resolve(output, `${name}.json`), JSON.stringify(state, null, 2) + '\n')
    await page.screenshot({ path: resolve(output, `${name}.png`) })
    log({ action: 'snapshot', name, turn: state.turn, status: state.status,
      paused: state.paused, activeSeconds: currentActive(state) })
    return state
  }
  const pause = async () => { if (!(await read()).paused) await button('Pause game') }
  const resume = async () => { if ((await read()).paused) await button('Resume game') }
  const bindObservation = async (name, baselineGameTime) => {
    await page.evaluate(async ({ name, baselineGameTime }) => {
      const { createEpoch, attachObserver } = await import('/qa/mission-three-controls/observation.mjs')
      const scene = window.testSceneRef.current, epoch = createEpoch(name, baselineGameTime)
      if (window.m3Observation?.scene === scene) throw Error('Duplicate observer on one scene')
      const detach = attachObserver(scene.gameClock, scene.world, epoch)
      window.m3Observation = { epoch, detach, scene, world: scene.world }
    }, { name, baselineGameTime })
  }
  const endEpoch = async () => {
    const epoch = await page.evaluate(() => {
      const observer = window.m3Observation
      if (!observer) throw Error('Missing observer at epoch boundary')
      observer.detach()
      return JSON.parse(JSON.stringify(observer.epoch))
    })
    assert.deepEqual(epoch.errors, [])
    epochs.push(epoch); saveProgress()
  }
  const skipFlyby = async () => {
    const before = await read()
    if (before.inputMask) {
      const skip = page.getByRole('button', { name: /^Skip introduction/ })
      if (await skip.isVisible()) { log({ action: 'skip-introduction', turn: before.turn }); await skip.click() }
      await page.waitForFunction(() => !window.testSceneRef.current.world.inputMask, null, { timeout: 60_000 })
    }
  }
  const clear = async () => {
    await skipFlyby()
    for (let i = 0; i < 3; i++) {
      const s = await read()
      if (!s.mode && !s.selected.length) return
      log({ action: 'key', key: 'Escape' }); await page.keyboard.press('Escape')
    }
    assert.fail('Escape did not clear targeting/selection')
  }
  const select = async (kind, count = 'one') => {
    assert.ok(normalKinds.has(kind)); assert.ok(['one', 'five', 'all'].includes(count))
    await clear()
    if (kind === 'shaman') {
      assert.equal((await read()).readiness.ready, true, 'Shaman is genuinely selectable')
      await button('Select and focus shaman')
    } else await button(`Select ${kind}`, count === 'one' ? {} : { modifiers: [count === 'five' ? 'Control' : 'Shift'] })
    const s = await read(), selected = s.units.filter(u => s.selected.includes(u.id))
    assert.ok(selected.length && selected.every(u => u.team === 'blue' && u.kind === kind))
    if (count === 'one' || kind === 'shaman') assert.equal(selected.length, 1)
    if (count === 'five') assert.equal(selected.length, 5)
    log({ action: 'selection-accepted', kind, count, ids: s.selected, turn: s.turn })
    return s.selected
  }
  const map = async point => {
    assert.ok(Number.isFinite(point.x) && Number.isFinite(point.z))
    assert.equal((await read()).mode, null, 'Camera preparation must precede mode selection')
    const settle = () => page.waitForFunction(() => {
      const s = window.testSceneRef.current
      return !s.world.inputMask && !s.cameraMotion.active && !s.resultCamera.active && !s.viewTransition
    }, null, { timeout: 30_000 })
    await settle()
    const input = await page.evaluate(async p => {
      const s = window.testSceneRef.current, { minimapPick } = await import('/app/minimap.ts')
      const { minimapInput } = await import('/qa/mission-three-controls/observation.mjs')
      const r = s.mini.getBoundingClientRect(), width = s.mini.width, height = s.mini.height
      const center = { x: Math.round((s.viewPoint.x + 8) * 256), y: Math.round((-s.viewPoint.z - 8) * 256) }
      const target = { x: Math.round((p.x + 8) * 256), y: Math.round((-p.z - 8) * 256) }
      const heading = Math.round(s.cameraBearing * 1024 / Math.PI)
      const best = minimapInput({ width, height, rect: r, center, heading, target, maxDistance: 8 * 256 },
        minimapPick, p => document.elementFromPoint(p.x, p.y) === s.mini)
      return best && { ...best, cameraBefore: { point: { ...s.viewPoint }, position: { ...s.cameraPosition },
        bearing: s.cameraBearing, motionActive: s.cameraMotion.active } }
    }, point)
    assert.ok(input, 'Minimap has a visible owned pixel mapping within8 world units of the requested camera point')
    assert.equal(await page.evaluate(p => document.elementFromPoint(p.x, p.y) === window.testSceneRef.current.mini, input), true)
    log({ action: 'minimap-click', target: point, input })
    await page.mouse.click(input.x, input.y); await page.mouse.move(400, 780)
    await settle()
    const cameraAfter = (await read()).camera, short = n => n << 16 >> 16
    log({ action: 'minimap-camera-observed', requested: point, input, cameraAfter })
    assert.ok(Math.hypot(short(cameraAfter.position.x - input.native.x),
      short(cameraAfter.position.y - input.native.y)) <= 1, 'Ordinary camera reached the actually clicked minimap destination')
  }
  const rotate = async () => {
    const corridor = await page.evaluate(() => {
      const s = window.testSceneRef.current
      for (const y of [750, 650, 550]) if ([280, 792].every(x => document.elementFromPoint(x, y) === s.renderer.domElement))
        return { x: 280, y, end: 792 }
      return null
    })
    assert.ok(corridor, 'Visible canvas corridor for camera rotation')
    log({ action: 'camera-right-drag', ...corridor })
    await page.mouse.move(corridor.x, corridor.y); await page.mouse.down({ button: 'right' })
    try { await page.mouse.move(corridor.end, corridor.y, { steps: 12 }) }
    finally { await page.mouse.up({ button: 'right' }) }
    await page.mouse.move(400, 780); await page.waitForTimeout(600)
  }
  const entityHit = (collection, id) => page.evaluate(({ collection, id }) => {
    const s = window.testSceneRef.current, o = s.world[collection].find(o => o.id === id)
    if (!o) return null
    const r = s.container.getBoundingClientRect(), candidates = []
    const mesh = collection === 'units' ? s.unitMeshes.get(id) : collection === 'buildings' ? s.buildingMeshes.get(id) : s.shrineMeshes.get(id)?.g
    const q = s.screen(mesh?.position ?? o), center = { x: r.x + (q.x + 1) * r.width / 2, y: r.y + (1 - q.y) * r.height / 2 }
    for (let dy = collection === 'units' ? -32 : -150; dy <= 64; dy += 4)
      for (let dx = -100; dx <= 100; dx += 4) candidates.push({ x: center.x + dx, y: center.y + dy })
    if (collection === 'units') {
      const b = s.picking.personBounds(id)
      if (b) candidates.push({ x: r.x + b.x + b.width / 2, y: r.y + b.y + b.height / 2 })
    } else mesh?.traverse(child => {
      if (child.userData.nativeModel === undefined || !child.visible) return
      for (const { points } of s.picking.model(child, JSON.stringify(s.view.projection)).filter(c => c.kind === 'model'))
        for (const weights of [[1, 1, 1], [2, 1, 1], [1, 2, 1], [1, 1, 2]]) {
          const total = weights.reduce((a, b) => a + b, 0)
          candidates.push({ x: r.x + points.reduce((sum, p, i) => sum + p.x * weights[i], 0) / total,
            y: r.y + points.reduce((sum, p, i) => sum + p.y * weights[i], 0) / total })
        }
    })
    for (const p of candidates) {
      if (document.elementFromPoint(p.x, p.y) !== s.renderer.domElement) continue
      const e = { clientX: p.x, clientY: p.y }, person = s.picking.pickPerson(e)
      const hit = collection === 'units' ? person : person !== null ? person : s.pickWorldObject(e)?.id
      if (hit === id) return { ...p, id, collection, turn: s.world.turn }
    }
    return null
  }, { collection, id })
  const resolveId = value => {
    const id = typeof value === 'number' ? value : ids[value]
    assert.ok(Number.isInteger(id) && id > 0, `Known target identity ${value}`)
    return id
  }
  const targetEntity = async (collection, value) => {
    assert.ok(['units', 'buildings', 'shrines'].includes(collection))
    const id = resolveId(value), target = (await read())[collection].find(o => o.id === id)
    assert.ok(target, `Existing ${collection} ${id}`)
    await map(target)
    let hit
    for (let attempt = 0; attempt < 4; attempt++) {
      hit = await entityHit(collection, id)
      log({ action: 'entity-hit-probe', collection, id, attempt, hit })
      if (hit) return hit
      if (attempt < 3) await rotate()
    }
    assert.fail(`No visible canvas-owned hit for ${collection} ${id}`)
  }
  const requireOrderable = state => {
    health(state); assert.equal(state.paused, false); assert.equal(state.inputMask, 0)
    assert.equal(state.mode, null); assert.ok(state.selected.length, 'Ordinary order needs selected followers')
  }
  const clickOrder = async hit => {
    let before = await read(); requireOrderable(before)
    // Separate this dispatch from a previous command on the same turn without
    // advancing the simulation ourselves. This makes lastOrderTurn a fresh witness.
    if (before.turn <= before.lastOrderTurn) {
      await page.waitForFunction(() => {
        const w = window.testSceneRef.current.world
        return w.turn > w.lastOrderTurn
      }, null, { timeout: 5000 })
      before = await read(); requireOrderable(before)
    }
    log({ action: 'world-order-click', hit, selected: before.selected })
    await page.mouse.click(hit.x, hit.y); await page.mouse.move(400, 780)
    const after = await read()
    const commandState = state => ({ turn: state.turn, lastOrderTurn: state.lastOrderTurn,
      pointerAck: state.pointerAck, selected: state.selected, effects: state.effects,
      units: state.units.filter(u => before.selected.includes(u.id)),
      epoch: state.observation.name, orderMarkerCursor: state.observation.orderMarkerCursor,
      orderMarkers: state.observation.orderMarkers.filter(e => e.cursor > before.observation.orderMarkerCursor) })
    log({ action: 'world-order-observation', hit, before: commandState(before), after: commandState(after) })
    const acceptance = acceptedOrderEvidence(before, after, hit)
    log({ action: 'world-order-input-observed', hit, acceptance, selected: before.selected,
      orders: after.units.filter(u => before.selected.includes(u.id)).map(u => ({ id: u.id, order: u.order, work: u.work })) })
    return after
  }
  const groundHit = (point, kind = null, spell = null, radius = 0) => page.evaluate(async ({ point, kind, spell, radius }) => {
    const s = window.testSceneRef.current, r = s.container.getBoundingClientRect()
    const { placementError, spellTargetError } = await import('/app/model.ts')
    const probe = structuredClone(s.world), wrap = v => ((v + 128) % 256 + 256) % 256 - 128
    for (let distance = 0; distance <= radius; distance++) for (let a = 0; a < Math.PI * 2; a += Math.PI / 12) {
      const p = { x: point.x + Math.cos(a) * distance, z: point.z + Math.sin(a) * distance }
      const q = s.screen(p), e = { clientX: r.x + (q.x + 1) * r.width / 2, clientY: r.y + (1 - q.y) * r.height / 2 }
      if (document.elementFromPoint(e.clientX, e.clientY) !== s.renderer.domElement) continue
      const picked = s.pick(e)
      if (!picked || (!spell && s.picking.pick(e) !== null) || Math.hypot(wrap(picked.x - p.x), wrap(picked.z - p.z)) >= 1.5) continue
      if (kind && placementError(probe, kind, picked)) continue
      if (spell && spellTargetError(probe, spell, picked)) continue
      return { x: e.clientX, y: e.clientY, point: { x: picked.x, z: picked.z } }
    }
    return null
  }, { point, kind, spell, radius })
  const move = async (point, searchRadius = 0) => {
    assert.ok(searchRadius === 0 || searchRadius === 2, 'Only the home-return caller permits a radius2 search')
    await map(point)
    const hit = await groundHit(point, null, null, searchRadius)
    log({ action: 'movement-ground-probe', requested: point, searchRadius, hit })
    assert.ok(hit, 'Visible ground with no competing object')
    const wrap = v => ((v + 128) % 256 + 256) % 256 - 128
    assert.ok(Math.hypot(wrap(hit.point.x - point.x), wrap(hit.point.z - point.z)) < searchRadius + 1.5)
    return clickOrder(hit)
  }
  const build = async (kind, point, alias) => {
    assert.ok(buildLabels[kind]); safeLabel(alias)
    assert.ok(!Object.hasOwn(ids, alias), 'A new building alias cannot replace an observed identity')
    await map(point)
    const hit = await groundHit(point, kind, null, 12)
    assert.ok(hit, `Legal visible ${kind} ground`)
    const before = await read(); requireOrderable(before)
    assert.ok(before.selected.every(id => before.units.some(u => u.id === id && u.kind === 'brave')))
    await button('buildings B'); await button(buildLabels[kind])
    assert.equal((await read()).mode, kind, 'Building mode selected after camera preparation')
    log({ action: 'place-plan-click', kind, hit, selected: before.selected })
    await page.mouse.click(hit.x, hit.y); await page.mouse.move(400, 780)
    const after = await read(), created = after.buildings.filter(b => b.team === 'blue' && b.kind === kind && !before.buildings.some(old => old.id === b.id))
    assert.equal(created.length, 1, 'Exactly one new requested Blue plan')
    assert.ok(after.units.some(u => before.selected.includes(u.id) &&
      (u.work === created[0].id || u.order?.model === 6 && u.order.a === created[0].id)),
    'Requested selected Braves received the construction order')
    ids[alias] = created[0].id
    log({ action: 'plan-accepted', alias, building: created[0] }); saveProgress()
  }
  const cast = async (spell, target) => {
    assert.ok(spellLabels[spell]); await clear()
    const point = typeof target === 'object' ? target : (await read()).units.find(u => u.id === resolveId(target))
    assert.ok(point); await map(point)
    const hit = await groundHit(point, null, spell, 0)
    assert.ok(hit, 'Eligible visible spell terrain, validated on a detached World')
    const before = await read(); health(before)
    assert.equal(before.paused, false); assert.equal(before.inputMask, 0); assert.ok(before.shots[spell] > 0)
    await button('spells 1–3')
    await page.getByRole('button', { name: new RegExp(`^${spellLabels[spell]}, \\d+ shots$`) }).click()
    assert.equal((await read()).mode, spell)
    log({ action: 'cast-click', spell, hit })
    await page.mouse.click(hit.x, hit.y); await page.mouse.move(400, 780)
    const after = await read()
    assert.ok(after.stats.cast > before.stats.cast, 'Ordinary spell cast accepted')
    log({ action: 'cast-accepted', spell, before: before.shots, after: after.shots, turn: after.turn })
    await page.keyboard.press('Escape')
  }
  const waitFor = async (condition, scope = 'combat', watchIds = []) => {
    const started = await read(); requireOrderableForWait(started)
    const startActive = currentActive(started)
    let progress = progressKey(started, scope, watchIds), changedAt = startActive, sampledAt = startActive
    let lastTurn = started.turn, lastAnimation = started.animationFrame
    let clockAdvancedAt = Date.now(), animationAdvancedAt = Date.now()
    for (;;) {
      signal.throwIfAborted()
      const s = await read(); health(s)
      assert.equal(s.paused, false, 'A paused game cannot satisfy an active wait')
      if (s.turn !== lastTurn) { lastTurn = s.turn; clockAdvancedAt = Date.now() }
      if (s.animationFrame !== lastAnimation) { lastAnimation = s.animationFrame; animationAdvancedAt = Date.now() }
      if (s.inputMask) { await skipFlyby(); continue }
      if (checkCondition(s, condition)) { log({ action: 'condition-complete', condition, turn: s.turn }); return s }
      const active = currentActive(s), conversion = milestones.find(m => m.name === 'conversion')
      const budget = conversion ? conversion.activeSeconds + 1800 : 600
      const next = progressKey(s, scope, watchIds)
      if (next !== progress) { progress = next; changedAt = active }
      const stop = waitDiagnosticStop({ now: Date.now(), clockAdvancedAt, animationAdvancedAt,
        wallElapsed: Date.now() - startWall, wallLimit, active, budget, changedAt, scope })
      if (stop) {
        log({ action: 'diagnostic-stop', code: stop.code, activeSeconds: active, budget, condition, progress })
        throw stop
      }
      if (active - sampledAt >= 30) {
        log({ action: 'progress-observation', condition, scope, turn: s.turn, activeSeconds: active,
          unchangedActiveSeconds: active - changedAt, progress })
        sampledAt = active
      }
      await sleep(1000)
    }
  }
  const requireOrderableForWait = state => { health(state); assert.equal(state.paused, false) }
  const mark = async name => {
    safeLabel(name); const s = await snapshot(`milestone-${name}`)
    milestones.push({ name, turn: s.turn, time: s.time, epoch: s.observation.name,
      activeSeconds: currentActive(s), at: new Date().toISOString() }); saveProgress()
    return s
  }
  const readStorage = key => page.evaluate(async key => {
    const request = indexedDB.open('populous-new-dawn', 1)
    const db = await new Promise((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error) })
    try {
      const transaction = db.transaction('checkpoints', 'readonly'), request = transaction.objectStore('checkpoints').get(key)
      return await new Promise((resolve, reject) => {
        transaction.oncomplete = () => {
          const saved = request.result
          resolve(key === 'latest' && saved?.world ? { version: saved.version, world: {
            turn: saved.world.turn, time: saved.world.time, outcome: saved.world.outcome,
            units: saved.world.units.map(u => ({ id: u.id, team: u.team, kind: u.kind,
              native: u.native && { state: u.native.state, workTarget: u.native.workTarget } }))
          } } : saved ?? null)
        }
        transaction.onerror = () => reject(transaction.error); transaction.onabort = () => reject(transaction.error)
      })
    } finally { db.close() }
  }, key)
  let savedSermon = null
  const saveCheckpoint = async (label, sermon = false) => {
    await pause(); const saved = await snapshot(label)
    if (sermon) {
      const victim = saved.units.find(u => u.id === ids.victim)
      assert.equal(victim?.nativeState, 23); assert.equal(victim?.owner, ids.preacher)
    }
    await button('Game settings'); await button('Save checkpoint')
    const matches = value => value?.world?.outcome.level === 3 && value.world.turn === saved.turn &&
      (!sermon || value.world.units.some(u => u.id === ids.victim && u.native?.state === 23 && u.native.workTarget === ids.preacher))
    assert.equal(await waitForCheckpointReadback(async () => matches(await readStorage('latest'))), true)
    const committed = await readStorage('latest')
    assert.ok(matches(committed))
    log({ action: 'checkpoint-persisted', label, turn: saved.turn, sermon })
    await page.getByRole('button', { name: /^Continue Game/ }).click()
    await pause()
    if (sermon) savedSermon = { turn: saved.turn, time: saved.time, victimId: ids.victim,
      preacherId: ids.preacher, blueIds: saved.units.filter(u => u.team === 'blue').map(u => u.id) }
    return saved
  }
  const reloadSermon = async () => {
    assert.ok(savedSermon, 'Require an observed committed sermon save')
    assert.ok(milestones.some(m => m.name === 'sermon-cancelled'), 'Record cancellation before reload')
    await pause(); await endEpoch()
    await page.reload({ waitUntil: 'domcontentloaded' }); await button('Load Game'); await bindGame(page)
    await bindObservation(`reload-${epochs.length}`, savedSermon.time)
    const loaded = await read(), victim = loaded.units.find(u => u.id === savedSermon.victimId)
    assert.equal(loaded.paused, false, 'Load auto-resumes through shipped beginLoad')
    assert.ok(loaded.turn >= savedSermon.turn)
    assert.equal(victim?.nativeState, 23, 'Sermon must remain observable after auto-resumed load')
    assert.equal(victim?.owner, savedSermon.preacherId)
    for (const id of savedSermon.blueIds) assert.ok(loaded.units.some(u => u.id === id && u.team === 'blue'), `Retained Blue identity ${id}`)
    log({ action: 'loaded-sermon-first-epoch', saved: savedSermon, loadedTurn: loaded.turn,
      loadedTime: loaded.time, epoch: loaded.observation.name })
    await mark('sermon-reloaded')
  }
  const proveVictory = async () => {
    const s = await read(); health(s); assert.equal(s.status, 'won')
    await page.waitForFunction(() => !window.testSceneRef.current.world.outcome.cameraPlaying, null, { timeout: 60_000 })
    await page.getByRole('button', { name: /^Continue to Mission 4/ }).waitFor()
    assert.ok((await read()).completedMissions.includes(3))
    assert.equal(await waitForCheckpointReadback(async () => {
      const profile = await readStorage('profile')
      return profile?.version === 1 && profile.completed.includes(3)
    }), true, 'Await actual profile disk write')
    log({ action: 'victory-persisted', profile: await readStorage('profile') })
    await mark('victory')
  }
  const acquire = async () => {
    assert.ok(!milestones.some(m => m.name === 'vault'), 'Acquisition starts once in this fresh journey')
    await resume(); await skipFlyby()
    await waitFor({ type: 'shaman-ready' }, 'movement')
    await select('shaman')
    const shaman = (await read()).selected[0]
    await clickOrder(await targetEntity('shrines', 'vault'))
    await waitFor({ type: 'temple-unlocked' }, 'worship', [ids.vault, shaman])
    await mark('vault')
    await select('shaman'); await move({ x: 35, z: 81 }, 2)
    await waitFor({ type: 'units-near', id: shaman, point: { x: 35, z: 81 }, distance: 4 }, 'movement', [shaman])
    await mark('shaman-home')
    const builders = await select('brave', 'five')
    await build('temple', { x: 24, z: 70 }, 'temple')
    await waitFor({ type: 'building-complete', id: ids.temple }, 'construction', [ids.temple, ...builders])
    await mark('temple')
    const before = await read(), oldPreachers = before.units.filter(u => u.team === 'blue' && u.kind === 'preacher').map(u => u.id)
    const selected = await select('brave')
    ids.trainee = selected[0]
    const retained = before.units.filter(u => u.team === 'blue' && u.kind === 'brave' && u.id !== ids.trainee).map(u => u.id)
    assert.ok(retained.length)
    await clickOrder(await targetEntity('buildings', 'temple'))
    const after = await waitFor({ type: 'trained-kind', kind: 'preacher', existingIds: oldPreachers }, 'training', [ids.temple, ids.trainee])
    const trained = after.units.filter(u => u.team === 'blue' && u.kind === 'preacher' && !oldPreachers.includes(u.id))
    assert.equal(trained.length, 1); assert.ok(!after.units.some(u => u.id === ids.trainee))
    assert.ok(after.units.some(u => retained.includes(u.id) && u.team === 'blue' && u.kind === 'brave'))
    await page.getByRole('button', { name: 'Select brave', exact: true }).isEnabled().then(enabled => assert.equal(enabled, true))
    ids.preacher = trained[0].id; await mark('preacher')
    const home = (await read()).units.find(u => u.id === shaman)
    assert.ok(home && Math.hypot(home.x - 35, home.z - 81) <= 4, 'Shaman remains home before the Preacher intrusion')
    const chosen = await select('preacher'); assert.deepEqual(chosen, [ids.preacher])
    await move({ x: -39, z: -110 })
    await waitFor({ type: 'listener', id: ids.victim, preacherId: ids.preacher }, 'sermon', [ids.victim, ids.preacher])
    await mark('listener'); await saveCheckpoint('sermon-saved', true)
    milestones.push({ name: 'sermon-saved', ...savedSermon }); saveProgress()
  }
  const cancelSermon = async () => {
    assert.ok(savedSermon)
    await resume(); const selected = await select('preacher')
    assert.deepEqual(selected, [ids.preacher])
    await move({ x: -33, z: -113 })
    const s = await read(), victim = s.units.find(u => u.id === ids.victim)
    assert.equal(victim?.team, 'yellow'); assert.notEqual(victim.nativeState, 23)
    assert.equal(victim.owner, 0); assert.equal(victim.flags4 & 128, 0); assert.equal(victim.flags2 & 0x200000, 0)
    await mark('sermon-cancelled')
  }
  const completeConversion = async () => {
    assert.ok(milestones.some(m => m.name === 'sermon-reloaded'), 'Require the observed reload milestone')
    assert.match((await read()).observation.name, /^reload-/, 'Conversion belongs to the resumed epoch')
    await resume()
    await waitFor({ type: 'conversion', id: ids.victim, preacherId: ids.preacher }, 'sermon', [ids.victim, ids.preacher])
    const event = await page.evaluate(async ({ victim, preacher }) => {
      const { requireConversion } = await import('/qa/mission-three-controls/observation.mjs')
      return requireConversion(window.m3Observation.epoch, victim, preacher)
    }, ids)
    const s = await read(), replacement = s.units.find(u => u.id === event.replacements[0].id)
    assert.ok(!s.units.some(u => u.id === ids.victim)); assert.equal(replacement?.team, 'blue')
    assert.equal(replacement.kind, 'brave'); assert.equal(replacement.flags3 & 0x1000000, 0x1000000)
    assert.equal(replacement.flags4 & 0x40000, 0x40000)
    ids.replacement = replacement.id
    log({ action: 'exact-conversion-proved', event, epoch: s.observation.name })
    // Actual camera input makes the converted area visible for the screenshot.
    await clear(); await map(replacement); await mark('conversion')
  }
  const erosion = async () => {
    assert.ok(milestones.some(m => m.name === 'conversion'), 'Finish the protected conversion witness first')
    await resume(); await select('preacher', 'one')
    const preachers = (await read()).selected
    await clickOrder(await targetEntity('shrines', 'erosion'))
    await waitFor({ type: 'shrine-used', id: ids.erosion }, 'worship', [ids.erosion, ...preachers])
    await waitFor({ type: 'effect-present', kind: 'erosion' }, 'combat')
    await mark('erosion-start')
    await waitFor({ type: 'effect-finished', kind: 'erosion' }, 'combat')
    await mark('erosion')
  }
  const dispatch = async command => {
    assert.ok(command && typeof command === 'object' && typeof command.action === 'string')
    log({ action: 'requested-command', command })
    switch (command.action) {
      case 'acquire': return acquire()
      case 'cancel-sermon': return cancelSermon()
      case 'reload-sermon': return reloadSermon()
      case 'complete-conversion': return completeConversion()
      case 'erosion': return erosion()
      case 'pause': return pause()
      case 'resume': return resume()
      case 'clear': return clear()
      case 'select': return select(command.kind, command.count)
      case 'map': return map(command.point)
      case 'rotate': return rotate()
      case 'move': return move(command.point)
      case 'order-entity': return clickOrder(await targetEntity(command.collection, command.id))
      case 'build': return build(command.kind, command.point, command.alias)
      case 'cast': return cast(command.spell, command.target)
      case 'snapshot': return snapshot(safeLabel(command.name))
      case 'wait': {
        const condition = { ...command.condition }
        if (condition.id !== undefined) condition.id = resolveId(condition.id)
        if (condition.preacherId !== undefined) condition.preacherId = resolveId(condition.preacherId)
        return waitFor(condition, command.scope, (command.watchIds ?? []).map(resolveId))
      }
      case 'checkpoint': return saveCheckpoint(`checkpoint-${safeLabel(command.name)}`)
      case 'prove-victory': return proveVictory()
      case 'finish': {
        for (const name of ['vault', 'shaman-home', 'temple', 'preacher', 'listener', 'sermon-saved', 'sermon-cancelled', 'sermon-reloaded', 'conversion', 'erosion', 'victory'])
          assert.ok(milestones.some(m => m.name === name), `Missing required milestone ${name}`)
        assert.equal(failures.length, 0, 'Retained command failures prevent a clean pass')
        assert.deepEqual(receipt.errors, [], 'No browser errors')
        const final = await snapshot('final'); health(final); assert.equal(final.status, 'won')
        await endEpoch()
        return { finished: true, inputs, ids, milestones, epochs, failures, final,
          limits: 'Fresh independent Mission 3, ordinary mouse/keyboard controls, normal RAF with UI pauses and a labelled checkpoint reload. No Mission 2 continuation, whole native-game parity, native pixel equivalence or hardware-performance claim.' }
      }
      default: throw Error(`Unsupported input action ${command.action}`)
    }
  }
  let index = 0
  try {
    await showAllMissions(page)
    await button('Mission 3'); await bindGame(page)
    await bindObservation('entry', 0)
    const initial = await read()
    assert.ok(!initial.completedMissions.includes(3), 'Fresh owned profile starts without M3 completion')
    const profile = await readStorage('profile')
    assert.ok(!profile?.completed?.includes(3), 'Persistent profile starts without M3 completion')
    const victim = initial.units.find(u => u.id === authoredVictim.id)
    assert.equal(victim?.team, 'yellow'); assert.equal(victim.kind, 'brave')
    ids.victim = victim.id
    log({ action: 'authored-victim-identity', authored: authoredVictim,
      observed: { id: victim.id, team: victim.team, kind: victim.kind, x: victim.x, z: victim.z, turn: initial.turn } })
    ids.vault = initial.shrines.find(h => h.kind === 'vault')?.id
    ids.erosion = initial.shrines.find(h => h.kind === 'erosionEffect')?.id
    assert.ok(ids.vault && ids.erosion); saveProgress()
    await skipFlyby(); await waitFor({ type: 'shaman-ready' }, 'movement')
    await pause(); await snapshot('opening')
    requireNotDefeated((await read()).status)
    log({ action: 'awaiting-input', directory: commandsPath, next: '0001.json', paused: true })
    for (index = 1; index <= 500; index++) {
      const path = resolve(commandsPath, `${String(index).padStart(4, '0')}.json`)
      while (!existsSync(path)) {
        signal.throwIfAborted()
        requireNotDefeated(await page.evaluate(() => window.testSceneRef.current.world.status))
        if (Date.now() - startWall >= wallLimit) throw new IncompleteRun('wall-envelope', 'Outer wall resource envelope reached awaiting commands')
        await sleep(1000)
      }
      const bytes = readFileSync(path), hash = sha256(bytes)
      writeFileSync(resolve(output, `consumed-${String(index).padStart(4, '0')}.json`), bytes)
      inputs.push({ name: `commands/${String(index).padStart(4, '0')}.json`, sha256: hash }); saveProgress()
      try {
        const commands = JSON.parse(bytes)
        assert.ok(Array.isArray(commands) && commands.length > 0 && commands.length <= 32)
        for (const command of commands) {
          signal.throwIfAborted()
          if (Date.now() - startWall >= wallLimit) throw new IncompleteRun('wall-envelope', 'Outer resource limit reached')
          const result = await dispatch(command)
          assert.equal(sha256(readFileSync(path)), hash, 'Consumed input bytes did not change')
          if (result?.finished) {
            writeFileSync(resolve(output, 'journey.json'), JSON.stringify({ status: 'passed', ...result }, null, 2) + '\n')
            return result
          }
        }
        await pause()
        const boundary = await snapshot(`batch-${String(index).padStart(4, '0')}`)
        requireNotDefeated(boundary.status)
      } catch (error) {
        if (error instanceof IncompleteRun || error instanceof MissionDefeat) throw error
        failures.push({ index, inputSha256: hash, at: new Date().toISOString(), error: String(error?.stack ?? error) })
        saveProgress(); await pause().catch(() => {})
        const diagnostic = await snapshot(`batch-${String(index).padStart(4, '0')}-failed`).catch(() => null)
        requireNotDefeated(diagnostic?.status)
        log({ action: 'command-failed', index, error: String(error), retained: true })
        let finishing = false
        try { const parsed = JSON.parse(bytes); finishing = Array.isArray(parsed) && parsed.some(command => command.action === 'finish') } catch {}
        if (finishing) throw error
      }
      requireNotDefeated(await page.evaluate(() => window.testSceneRef.current.world.status))
      log({ action: 'awaiting-input', next: `${String(index + 1).padStart(4, '0')}.json`, paused: true })
    }
    throw new IncompleteRun('command-limit', 'Command count limit reached without completed acceptance')
  } catch (error) {
    const incomplete = error instanceof IncompleteRun
    const record = { index, at: new Date().toISOString(), outer: true, code: error?.code,
      error: String(error?.stack ?? error) }
    if (incomplete) controlStops.push(record)
    else failures.push(record)
    if (!signal.aborted) await saveCheckpoint('incomplete-checkpoint').catch(checkpointError =>
      log({ action: 'incomplete-checkpoint-failed', error: String(checkpointError) }))
    const terminalStatus = failures.length ? 'failed' : incomplete ? 'incomplete' : 'failed'
    saveProgress(terminalStatus)
    log({ action: 'terminal-result', status: terminalStatus, ...record,
      harnessResult: 'Thrown error preserves the authoritative harness failed receipt; no successful result is returned.' })
    throw error
  } finally {
    // No RAF cancellation or application cleanup here; the maintained harness
    // owns its browser/server. Restore only this task's diagnostic callback.
    await page.evaluate(() => window.m3Observation?.detach()).catch(() => {})
  }
}
