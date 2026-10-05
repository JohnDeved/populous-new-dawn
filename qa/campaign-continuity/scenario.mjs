// Source-reviewed ordinary campaign scenario. The maintained harness owns leases,
// browser/server cleanup and source/runtime receipts. No model or storage writes.
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { bindGame } from '../../scripts/browser-game.mjs'
import { waitForCheckpointReadback } from '../../scripts/checkpoint-readback.mjs'
import { checkpointObservation } from '../../scripts/local-render/checkpoint-observer.mjs'
import { readQueuedPreservingStop, pollWithPreservation } from './queued-stop.mjs'
import { objectiveProgress, checkCondition, IncompleteRun, MissionDefeat, authoredVictimIdentity,
  acceptedOrderEvidence, waitDiagnosticStop, requireNotDefeated, requiredActorStop, selectSermonAnchor,
  inOrdinaryPreachingCells, requireDeclaredPreacherOrder, requireFirstOwnedListener, waitDisposition,
  requireCancelledSermon } from './observation.mjs'
import { validateRunPolicy, campaignActive, requireCampaignBudget, requireLoadedCheckpoint,
  requireContinueBoundary, requireCampaignProfile, readCampaignStorage,
  installReplacementObservation, replacementIdentity, validateSegmentPredecessor } from './boundaries.mjs'
import { missionRoutes, milestoneConditions, validateMissionMilestones } from './routes.mjs'

// The harness imports its scenario before starting a server/browser or claiming a profile.
const policy = validateRunPolicy(JSON.parse(readFileSync(new URL('./run-policy.json', import.meta.url))))
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const normalKinds = new Set(['shaman', 'brave', 'preacher', 'warrior'])
const buildLabels = { temple: 'Temple, 8 wood', hut: 'Hut, 3 wood', camp: 'Warrior Training Hut, 8 wood' }
const spellLabels = { blast: 'Blast', swarm: 'Swarm', bridge: 'Land Bridge', lightning: 'Lightning', tornado: 'Tornado' }
class CampaignBoundaryClosed extends Error {}
class SermonCaptured extends Error { constructor(context) { super('First owned listener saved; remaining batch deferred'); this.context = context } }

export default async function campaignContinuity({ page, output, root, signal, receipt, url, observeCheckpoint }) {
  assert.equal(resolve(root), resolve(fileURLToPath(new URL('../../', import.meta.url))))
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD:app'], { cwd: root, encoding: 'utf8' }).trim(), policy.applicationTree)
  assert.ok(receipt.profile && observeCheckpoint, 'Use the maintained game-only owned profile')
  page.setDefaultTimeout(5000)
  const startWall = Date.now(), inputs = [], failures = [], milestones = [], epochs = [], controlStops = [], transitions = [], checkpointProofs = [], acceptedCasts = []
  const priorBrowserErrors = [], missionWallMs = { 1: 0, 2: 0, 3: 0 }
  let missionWallStarted = Date.now()
  const ids = Object.create(null), commandsPath = resolve(output, 'commands')
  let latestState = null
  let level = 1, inheritedWallMs = 0, training = null, victimSelection = null, sermonPlan = null
  let protectedLatest = receipt.profile.checkpointAtStart ? { checkpoint: structuredClone(receipt.profile.checkpointAtStart) } : null
  let preserveStopRequested = false, deferredPreservingStop = false, inBatch = false, terminalHandling = false, preserveVerificationFailed = false
  const levelData = JSON.parse(readFileSync(resolve(root, 'app/level-three.ts'), 'utf8').split('export default ')[1].trim().replace(/;$/, ''))
  const authoredVictim = authoredVictimIdentity(levelData.objects)
  mkdirSync(commandsPath, { recursive: true })
  for (const name of ['scenario.mjs', 'boundaries.mjs', 'routes.mjs', 'run-policy.json', 'observation.mjs', 'erosion-observer.mjs', 'queued-stop.mjs', 'command-probes.mjs']) {
    const bytes = readFileSync(new URL(name, import.meta.url))
    writeFileSync(resolve(output, name), bytes, { flag: 'wx' }); inputs.push({ name, sha256: sha256(bytes) })
  }
  const log = entry => appendFileSync(resolve(output, 'actions.jsonl'), JSON.stringify({ at: new Date().toISOString(), level, wallMs: Date.now() - startWall, ...entry }) + '\n')
  const stateRecord = () => ({ currentEpoch: latestState?.observation && !epochs.some(epoch => epoch.name === latestState.observation.name) ? latestState.observation : null, kind: 'fresh-current-campaign', level, inputs, ids, epochs, milestones, failures, controlStops,
    transitions, checkpointProofs, acceptedCasts, protectedLatest, savedSermon, training, victimSelection, sermonPlan,
    source: receipt.source, profileId: receipt.profile.id, runId: receipt.profile.runId, policy,
    ownedWallMs: inheritedWallMs + Date.now() - startWall, missionWallMs: { ...missionWallMs, [level]: missionWallMs[level] + Date.now() - missionWallStarted },
    browserErrors: [...priorBrowserErrors, ...receipt.errors], preserveStopRequested, preserveVerificationFailed })
  const saveProgress = (status = 'in-progress') => writeFileSync(resolve(output, 'journey.json'), JSON.stringify({ status, ...stateRecord() }, null, 2) + '\n')

  const button = async (name, options = {}) => {
    log({ action: 'button', name, options })
    const control = page.getByRole('button', { name, exact: true })
    if (!terminalHandling && !preserveStopRequested) await pollUI(async () => await control.isVisible() && await control.isEnabled(), 45_000, name)
    await control.click({ timeout: 5000, ...options })
  }
  const safeLabel = value => {
    assert.match(value, /^[a-z0-9][a-z0-9-]{0,70}$/)
    return value
  }
  const read = async () => {
    await consumeQueuedStop()
    const result = await page.evaluate(async () => {
      const s = window.testSceneRef?.current, store = window.testStore
      if (!s || store.getWorld() !== s.world) throw Error('Current scene/store mismatch')
      if (window.campaignObservation?.scene !== s || window.campaignObservation.world !== s.world)
        throw Error('Diagnostic epoch does not belong to the current scene/world')
      const { currentPersonOrder } = await import('/app/person-orders.ts')
      const { liveBuildingAttackTarget } = await import('/app/live-building-combat.ts')
      const { observeBuilding } = await import('/qa/campaign-continuity/observation.mjs')
      const { campaignShamanReadiness } = await import('/scripts/campaign-start-readiness.mjs')
      const { default: rules } = await import('/app/original-rules.json')
      const w = s.world, gl = s.renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info')
      const person = u => u.builder?.person ?? u.flight ?? u.fight?.motion ?? u.native ?? u.entry?.person
      const copy = o => o === undefined ? null : JSON.parse(JSON.stringify(o))
      const acquisition = w.worshipAcquisition
      if (!Object.values(acquisition.clock).every(Number.isFinite)) throw Error('Nonfinite worship presentation clock')
      const phase = controller => controller ? Object.fromEntries(['active', 'step', 'visits', 'model', 'giftId', 'frame', 'remaining'].filter(key => key in controller).map(key => {
        const value = controller[key]
        if (typeof value === 'number' && !Number.isFinite(value)) throw Error('Nonfinite worship presentation observation')
        return [key, value]
      })) : null
      return {
        level: w.outcome.level, turn: w.turn, time: w.time, paused: w.paused, speed: w.speed,
        status: w.status, inputMask: w.inputMask, lastOrderTurn: w.lastOrderTurn, pointerAck: copy(s.pointerAck), selected: [...w.selected], mode: w.mode,
        stats: copy(w.stats), shots: copy(w.shots), unlockedTemple: w.unlockedTemple, unlockedCamp: w.unlockedCamp,
        worshipPresentation: { clock: copy(acquisition.clock), requests: [...acquisition.requests], spell: phase(acquisition.controllers.spell), companion: phase(acquisition.controllers.companion), pulse: phase(acquisition.controllers.pulse) },
        completedMissions: store.getCompletedMissions(), readiness: campaignShamanReadiness(w),
        camera: { point: copy(s.viewPoint), position: copy(s.cameraPosition), bearing: s.cameraBearing,
          motion: copy(s.cameraMotion), overview: s.overviewStage },
        animationFrame: s.gameClock.animationFrame, frame: s.frame,
        units: w.units.filter(u => u.hp > 0).map(u => {
          const p = person(u), n = u.native
          return { id: u.id, team: u.team, kind: u.kind, x: u.x, z: u.z, hp: u.hp,
            personOwner: p && (p === u.builder?.person ? 'builder' : p === u.flight ? 'flight' :
              p === u.fight?.motion ? 'fight' : p === n ? 'native' : 'entry'),
            fight: p && p === u.fight?.motion ? { group: u.fight.group,
              groupExists: w.fights.some(f => f.id === u.fight.group), opponent: u.fight.opponent,
              personId: p.id, state: p.state, flags2: p.flags2 } : null,
            conversionNative: n && { model: n.model, tribe: n.tribe, life: n.life, state: n.state, vehicle: n.vehicle,
              workTarget: n.workTarget, flags2: n.flags2, flags4: n.flags4 },
            preachingEligible: !!n && u.kind === 'brave' && n.model === 2 && n.tribe === 2 && n.life > 0 &&
              u.inside === null && !u.flight && !(w.outcome.alliances[0] & (1 << n.tribe)) &&
              !!(rules.personModels[n.model].flags & 32) && !(rules.personStateFlags[n.state] & 32) &&
              !(n.flags2 & 0x102004) && !(n.flags4 & 8) && !n.vehicle,
            inside: u.inside, work: u.work, target: copy(u.target), cargo: u.cargo,
            harvest: copy(u.harvest), delivery: copy(u.delivery), tree: u.tree, builder: u.builder &&
              { task: u.builder.task, phase: u.builder.phase, busy: u.builder.busy },
            route: p && { motionIndex: p.motionIndex, destinationX: p.destinationX, destinationY: p.destinationY,
              goalX: p.goalX, goalY: p.goalY }, nativeState: p?.state,
            owner: p?.workTarget, timer: p?.timer, flags2: p?.flags2, flags3: p?.flags3,
            flags4: p?.flags4, order: p && copy(currentPersonOrder(w.buildingOrders, p)),
            attackBuildingId: p ? liveBuildingAttackTarget(w, p)?.id ?? null : null }
        }),
        buildings: w.buildings.filter(b => b.hp > 0).map(observeBuilding),
        shrines: w.shrines.map(h => ({ id: h.id, kind: h.kind, x: h.x, z: h.z, active: h.active,
          uses: h.uses, work: h.work, progress: h.progress, followers: h.followers, remaining: h.remaining })),
        effects: w.effects.map(e => ({ id: e.id, kind: e.kind, x: e.x, z: e.z, age: e.age })),
        observation: copy(window.campaignObservation?.epoch),
        renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
        contextLost: gl.isContextLost(), body: document.body.innerText,
      }
    })
    latestState = result
    return result
  }
  const health = state => {
    assert.equal(state.level, level, 'Current campaign mission'); assert.equal(state.speed, 1)
    assert.equal(state.contextLost, false); assert.deepEqual(state.observation?.errors ?? [], [])
    assert.deepEqual(state.observation?.speedViolations ?? [], []); requireNotDefeated(state.status)
    requireCampaignBudget(epochs, state.observation, level, policy.limits, milestones.find(m => m.level === 3 && m.name === 'conversion')?.missionActiveSeconds ?? null)
    if (Date.now() - startWall >= policy.limits.segmentWallMs) throw new IncompleteRun('segment-wall-envelope', 'Segment wall ceiling reached')
    if (missionWallMs[level] + Date.now() - missionWallStarted >= policy.limits.missionWallMs[level]) throw new IncompleteRun('mission-wall-envelope', 'Mission wall ceiling reached')
  }
  const currentActive = state => campaignActive(epochs, state.observation)
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
      const { createEpoch, attachObserver } = await import('/qa/campaign-continuity/observation.mjs')
      const scene = window.testSceneRef.current, epoch = createEpoch(name, baselineGameTime)
      epoch.level = scene.world.outcome.level
      if (window.campaignObservation?.scene === scene) throw Error('Duplicate observer on one scene')
      const detach = attachObserver(scene.gameClock, scene.world, epoch)
      window.campaignObservation = { epoch, detach, scene, world: scene.world }
    }, { name, baselineGameTime })
  }
  const endEpoch = async () => {
    const epoch = await page.evaluate(() => {
      const observer = window.campaignObservation
      if (!observer) throw Error('Missing observer at epoch boundary')
      if (observer.closed) throw Error('Observation epoch already closed')
      observer.detach(); observer.closed = true
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
      await pollUI(() => page.evaluate(() => !window.testSceneRef.current.world.inputMask), 60_000, 'introduction input release')
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
    const settle = () => pollUI(() => page.evaluate(() => {
      const s = window.testSceneRef.current
      return !s.world.inputMask && !s.cameraMotion.active && !s.resultCamera.active && !s.viewTransition
    }), 30_000, 'camera settlement')
    await settle()
    const input = await page.evaluate(async p => {
      const s = window.testSceneRef.current, { minimapPick } = await import('/app/minimap.ts')
      const { minimapInput } = await import('/qa/campaign-continuity/observation.mjs')
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
  const selectUnits = async values => {
    assert.ok(Array.isArray(values) && values.length > 0 && values.length <= 20)
    const selectedIds = values.map(resolveId)
    assert.equal(new Set(selectedIds).size, selectedIds.length)
    await clear()
    for (const id of selectedIds) {
      const unit = (await read()).units.find(unit => unit.id === id)
      assert.ok(unit?.team === 'blue' && normalKinds.has(unit.kind), 'Select observed live Blue followers only')
      const hit = await targetEntity('units', id)
      await page.keyboard.down('Control')
      try { await page.mouse.click(hit.x, hit.y) } finally { await page.keyboard.up('Control') }
      assert.ok((await read()).selected.includes(id), 'Ordinary visible person selection accepted')
    }
    const observed = await read()
    assert.deepEqual([...observed.selected].sort((a, b) => a - b), [...selectedIds].sort((a, b) => a - b))
    log({ action: 'exact-followers-selected', ids: selectedIds, turn: observed.turn })
    return selectedIds
  }
  const requireOrderable = state => {
    health(state); assert.equal(state.paused, false); assert.equal(state.inputMask, 0)
    assert.equal(state.mode, null); assert.ok(state.selected.length, 'Ordinary order needs selected followers')
  }
  const clickOrder = async hit => {
    let before = await read(); requireOrderable(before)
    requireDeclaredPreacherOrder(before, !!sermonPlan)
    await capturePendingSermon(before, { beforeWorldClick: hit })
    // Separate this dispatch from a previous command on the same turn without
    // advancing the simulation ourselves. This makes lastOrderTurn a fresh witness.
    if (before.turn <= before.lastOrderTurn) {
      await pollUI(() => page.evaluate(() => {
        const w = window.testSceneRef.current.world
        return w.turn > w.lastOrderTurn
      }), 5000, 'fresh order dispatch turn')
      before = await read(); requireOrderable(before)
      await capturePendingSermon(before, { beforeWorldClick: hit })
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
      orders: after.units.filter(u => before.selected.includes(u.id)).map(u => ({ id: u.id, order: u.order, work: u.work,
        attackBuildingId: u.attackBuildingId })) })
    return after
  }
  const groundHit = async (point, kind = null, spell = null, radius = 0) => {
    const result = await page.evaluate(async ({ point, kind, spell, radius }) => {
      const s = window.testSceneRef.current, r = s.container.getBoundingClientRect()
      const [{ placementError, spellTargetError }, { createMoveContextProbe, isOrdinaryMoveContext }] = await Promise.all([
        import('/app/model.ts'), import('/qa/campaign-continuity/command-probes.mjs'),
      ])
      const probe = kind || spell ? structuredClone(s.world) : null
      const inspectMove = !kind && !spell ? createMoveContextProbe(s.world) : null
      const contextProbes = [], sampled = { turn: s.world.turn, selected: [...s.world.selected] }
      const wrap = v => ((v + 128) % 256 + 256) % 256 - 128
      for (let distance = 0; distance <= radius; distance++) for (let a = 0; a < Math.PI * 2; a += Math.PI / 12) {
        const p = { x: point.x + Math.cos(a) * distance, z: point.z + Math.sin(a) * distance }
        const q = s.screen(p), e = { clientX: r.x + (q.x + 1) * r.width / 2, clientY: r.y + (1 - q.y) * r.height / 2 }
        if (document.elementFromPoint(e.clientX, e.clientY) !== s.renderer.domElement) continue
        const picked = s.pick(e)
        if (!picked || (!spell && s.picking.pick(e) !== null) || Math.hypot(wrap(picked.x - p.x), wrap(picked.z - p.z)) >= 1.5) continue
        if (kind && placementError(probe, kind, picked)) continue
        if (spell && spellTargetError(probe, spell, picked)) continue
        let nativeContext = null
        if (inspectMove) {
          nativeContext = inspectMove(picked)
          contextProbes.push({ point: { x: picked.x, z: picked.z }, nativeContext })
          if (!isOrdinaryMoveContext(nativeContext)) continue
        }
        return { ...sampled, contextProbes, hit: { x: e.clientX, y: e.clientY,
          point: { x: picked.x, z: picked.z }, ...(nativeContext ? { nativeContext } : {}) } }
      }
      return { ...sampled, contextProbes, hit: null }
    }, { point, kind, spell, radius })
    if (!kind && !spell) log({ action: 'movement-native-context-probe', requested: point, radius, ...result })
    return result.hit
  }
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
    assert.ok(after.shots[spell] < before.shots[spell], 'Actual acquired shot expenditure')
    acceptedCasts.push({ level, spell, turn: after.turn, before: before.shots[spell], after: after.shots[spell], statsBefore: before.stats.cast, statsAfter: after.stats.cast })
    log({ action: 'cast-accepted', spell, before: before.shots, after: after.shots, turn: after.turn })
    await page.keyboard.press('Escape')
  }
  const waitFor = async (condition, scope = 'combat', watchIds = []) => {
    await consumeQueuedStop()
    const started = await read(); requireOrderableForWait(started)
    const startActive = currentActive(started)
    let progress = progressFor(started, condition, scope, watchIds), changedAt = startActive, sampledAt = startActive
    let lastTurn = started.turn, lastAnimation = started.animationFrame
    let clockAdvancedAt = Date.now(), animationAdvancedAt = Date.now()
    for (;;) {
      await consumeQueuedStop()
      signal.throwIfAborted()
      const s = await read(); health(s)
      assert.equal(s.paused, false, 'A paused game cannot satisfy an active wait')
      if (s.turn !== lastTurn) { lastTurn = s.turn; clockAdvancedAt = Date.now() }
      if (s.animationFrame !== lastAnimation) { lastAnimation = s.animationFrame; animationAdvancedAt = Date.now() }
      const disposition = !savedSermon && s.observation?.sermon?.firstOwned ? 'capture-sermon' : conditionMet(s, condition) ? 'complete' : 'wait'
      if (disposition === 'capture-sermon') await capturePendingSermon(s, { interruptedWait: condition })
      if (disposition === 'complete') { log({ action: 'condition-complete', condition, turn: s.turn }); return s }
      if (s.inputMask) { await skipFlyby(); continue }
      const actorStop = requiredActorStop(s, condition)
      if (actorStop) {
        log({ action: 'required-actor-unavailable', condition, code: actorStop.code, turn: s.turn,
          units: s.units.filter(u => [condition.id, condition.preacherId].includes(u.id)), stats: s.stats })
        throw actorStop
      }
      const active = currentActive(s)
      const budget = policy.limits.campaignActiveSeconds
      const next = progressFor(s, condition, scope, watchIds)
      if (next !== progress) { progress = next; changedAt = active }
      const stop = waitDiagnosticStop({ now: Date.now(), clockAdvancedAt, animationAdvancedAt,
        wallElapsed: inheritedWallMs + Date.now() - startWall, wallLimit: policy.limits.wallMs, active, budget, changedAt, scope })
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
  const consumeQueuedStop = async ({ defer = false, includeOrdinary = false } = {}) => {
    if (preserveStopRequested || terminalHandling) return
    const ordinal = inBatch ? index + 1 : Math.max(1, index)
    const runId = receipt.profile?.runId ?? receipt.startedAt
    let pending
    try {
      pending = readQueuedPreservingStop(commandsPath, ordinal, runId, { includeOrdinary })
      if (includeOrdinary) assert.ok(pending, 'Queued command disappeared before authenticated consumption')
    } catch (error) {
      // Unsafe/unreadable input is terminal even inside a running batch. Do not
      // let generic command-error handling continue or issue a fallback Save.
      preserveStopRequested = true
      log({ action: 'queued-preserving-stop-validation-failed', ordinal, runId,
        path: resolve(commandsPath, `${String(ordinal).padStart(4, '0')}.json`),
        readableInputRecorded: false, error: String(error) })
      saveProgress()
      throw error
    }
    if (!pending || !pending.preserving) return pending
    // Preservation intent is terminal even for an invalid mixed/run-mismatched
    // request. Ordinary queued commands are never consumed here.
    preserveStopRequested = true
    const interruptedIndex = index
    index = ordinal
    writeFileSync(resolve(output, `consumed-${String(ordinal).padStart(4, '0')}.json`), pending.bytes, { flag: 'wx' })
    inputs.push({ name: `commands/${String(ordinal).padStart(4, '0')}.json`, sha256: pending.sha256 })
    log({ action: 'queued-preserving-stop-consumed', interruptedIndex, ordinal, runId: pending.runId,
      path: pending.path, inputSha256: pending.sha256, deferredForCommittedReadback: defer, valid: pending.valid })
    saveProgress()
    const confirmed = readQueuedPreservingStop(commandsPath, ordinal, receipt.profile?.runId ?? receipt.startedAt)
    assert.equal(confirmed?.sha256, pending.sha256, 'Queued preserving request remains unchanged')
    assert.equal(pending.valid, true, pending.reason)
    if (defer) { deferredPreservingStop = true; return }
    await stopPreserveLatest()
  }
  const pollUI = (check, timeout, label) => pollWithPreservation(check,
    { checkStop: () => consumeQueuedStop(), timeout, label })
  const bindGameWithPreservation = () => bindGame({
    waitForSelector: selector => pollUI(() => page.locator(selector).first().isVisible(), 45_000, 'game canvas'),
    waitForFunction: (predicate, arg, options = {}) => pollUI(() => page.evaluate(predicate, arg), options.timeout ?? 45_000, 'game diagnostic binding'),
  })
  const requireOrderableForWait = state => { health(state); assert.equal(state.paused, false) }
  const mark = async name => {
    safeLabel(name); const s = await snapshot(`m${level}-milestone-${name}`); health(s)
    assert.ok(!milestones.some(m => m.level === level && m.name === name), 'Milestone already recorded')
    milestones.push({ name, level, turn: s.turn, time: s.time, epoch: s.observation.name,
      activeSeconds: currentActive(s), missionActiveSeconds: campaignActive(epochs, s.observation, level), at: new Date().toISOString() }); saveProgress()
    return s
  }
  const readStorage = key => page.evaluate(readCampaignStorage, key)
  let savedSermon = null
  const saveCheckpoint = async (label, sermon = false) => {
    assert.ok(!savedSermon || milestones.some(m => m.level === 3 && m.name === 'conversion'), 'Do not overwrite the protected sermon')
    await pause(); const saved = await snapshot(label)
    if (sermon) {
      const victim = saved.units.find(u => u.id === ids.victim)
      assert.equal(victim?.nativeState, 23); assert.equal(victim?.owner, ids.preacher)
    }
    await button('Game settings'); await button('Save checkpoint')
    const matches = value => value?.world?.outcome.level === level && value.world.turn === saved.turn &&
      (!sermon || value.world.units.some(u => u.id === ids.victim && u.native?.state === 23 && u.native.workTarget === ids.preacher))
    assert.equal(await waitForCheckpointReadback(async () => {
      await consumeQueuedStop({ defer: true })
      return matches(await readStorage('latest'))
    }), true)
    const committed = await readStorage('latest')
    assert.ok(matches(committed))
    if (receipt.profile && typeof observeCheckpoint === 'function') {
      const observed = await observeCheckpoint(`m${level}-${label}`)
      assert.equal(observed.checkpoint?.level, level); assert.equal(observed.checkpoint.turn, saved.turn)
      assert.equal(observed.checkpoint.time, saved.time)
      protectedLatest = observed
    }
    checkpointProofs.push({ level, saved: structuredClone(protectedLatest), loaded: false })
    log({ action: 'checkpoint-persisted', label, turn: saved.turn, sermon })
    if (deferredPreservingStop) await stopPreserveLatest()
    await consumeQueuedStop()
    await page.getByRole('button', { name: /^Continue Game/ }).click()
    await pause()
    if (sermon) savedSermon = { turn: saved.turn, time: saved.time, victimId: ids.victim,
      preacherId: ids.preacher, blueIds: saved.units.filter(u => u.team === 'blue').map(u => u.id) }
    return saved
  }
  const returnShamanHome = async () => {
    await select('shaman')
    ids.shaman = (await read()).selected[0]
    await move({ x: 35, z: 81 }, 2)
    await waitFor({ type: 'units-near', id: ids.shaman, point: { x: 35, z: 81 }, distance: 4 }, 'movement', [ids.shaman])
    await mark('shaman-home')
  }
  const prepareTemple = async () => {
    assert.ok(!milestones.some(m => m.level === 3 && m.name === 'vault'), 'Acquisition starts once in this fresh journey')
    await resume(); await skipFlyby()
    await waitFor({ type: 'shaman-ready' }, 'movement')
    await select('shaman')
    const shaman = (await read()).selected[0]
    ids.shaman = shaman
    await clickOrder(await targetEntity('shrines', 'vault'))
    await waitFor({ type: 'temple-unlocked' }, 'worship', [ids.vault, shaman])
    await mark('vault')
    await returnShamanHome()
    const builders = await select('brave', 'five')
    await build('temple', { x: 24, z: 70 }, 'temple')
    await waitFor({ type: 'building-complete', id: ids.temple }, 'construction', [ids.temple, ...builders])
    await mark('temple')
  }
  const startPreacherTraining = async () => {
    assert.ok(milestones.some(m => m.level === 3 && m.name === 'temple') && !training)
    const before = await read(), oldPreachers = before.units.filter(u => u.team === 'blue' && u.kind === 'preacher').map(u => u.id)
    const selected = await select('brave')
    ids.trainee = selected[0]
    const retained = before.units.filter(u => u.team === 'blue' && u.kind === 'brave' && u.id !== ids.trainee).map(u => u.id)
    assert.ok(retained.length)
    await clickOrder(await targetEntity('buildings', 'temple'))
    training = { oldPreachers, retained, trainee: ids.trainee }
    log({ action: 'preacher-training-started', training }); saveProgress()
  }
  const finishPreacherTraining = async () => {
    assert.ok(training && !ids.preacher)
    const { oldPreachers, retained } = training
    const after = await waitFor({ type: 'trained-kind', kind: 'preacher', existingIds: oldPreachers }, 'training', [ids.temple, ids.trainee])
    const trained = after.units.filter(u => u.team === 'blue' && u.kind === 'preacher' && !oldPreachers.includes(u.id))
    assert.equal(trained.length, 1); assert.ok(!after.units.some(u => u.id === ids.trainee))
    assert.ok(after.units.some(u => retained.includes(u.id) && u.team === 'blue' && u.kind === 'brave'))
    await page.getByRole('button', { name: 'Select brave', exact: true }).isEnabled().then(enabled => assert.equal(enabled, true))
    ids.preacher = trained[0].id; await mark('preacher')
  }
  const declareSermon = async () => {
    assert.ok(ids.preacher && !victimSelection && !savedSermon, 'Declare the protected sermon once before locking an observed listener')
    const state = await read(); health(state)
    assert.ok(milestones.some(m => m.level === 3 && m.name === 'shaman-home'), 'Retain the observed opening home arrival')
    const shaman = state.units.find(u => u.id === ids.shaman)
    assert.ok(shaman && shaman.team === 'blue' && shaman.kind === 'shaman' && shaman.hp > 0,
      'The actual Shaman remains alive before the protected approach')
    log({ action: 'sermon-shaman-position', turn: state.turn, shaman,
      tactic: Math.hypot(shaman.x - 35, shaman.z - 81) <= 4 ? 'home' : 'prospective covering position' })
    assert.ok(!sermonPlan, 'The prospective candidate declaration is made once')
    const declaration = await page.evaluate(async preacherId => {
      const { armSermonObservation } = await import('/qa/campaign-continuity/observation.mjs')
      const observer = window.campaignObservation, scene = window.testSceneRef.current
      if (observer.scene !== scene || observer.world !== scene.world) throw Error('Sermon epoch identity mismatch')
      return armSermonObservation(observer.epoch, scene.world, preacherId)
    }, ids.preacher)
    sermonPlan = { epoch: state.observation.name, declaration,
      preacherBeforeDeparture: state.units.find(u => u.id === ids.preacher) }
    log({ action: 'sermon-candidates-declared', epoch: state.observation.name, plan: sermonPlan })
    saveProgress()
  }
  const captureSermon = async () => {
    assert.ok(sermonPlan && !victimSelection && !savedSermon, 'Capture the declared first listener once')
    const before = await read(); health(before)
    const first = requireFirstOwnedListener(before, ids.preacher, sermonPlan.declaration, sermonPlan.epoch)
    await pause()
    const listening = await read(); health(listening)
    victimSelection = requireFirstOwnedListener(listening, ids.preacher, sermonPlan.declaration, sermonPlan.epoch)
    assert.deepEqual(victimSelection, first, 'Ordinary Pause retains the exact first listener')
    ids.victim = victimSelection.victim.id
    log({ action: 'sermon-victim-locked-at-onset', epoch: listening.observation.name,
      observedAtTurn: listening.turn, selection: victimSelection })
    saveProgress()
    await mark('listener'); const saved = await saveCheckpoint('sermon-saved', true)
    milestones.push({ level, name: 'sermon-saved', ...savedSermon }); saveProgress()
  }

  const capturePendingSermon = async (state, context = {}) => {
    if (!sermonPlan || savedSermon || !state.observation.sermon?.firstOwned) return
    await captureSermon()
    throw new SermonCaptured(context)
  }
  const approachSermon = async () => {
    if (!sermonPlan) await declareSermon()
    const state = await read(); health(state)
    await capturePendingSermon(state)
    assert.ok(!sermonPlan.anchorChoice, 'The wrapper chooses one prospective movement anchor')
    let anchorChoice
    try { anchorChoice = selectSermonAnchor(state, ids.authoredVictim) }
    catch (error) {
      log({ action: 'sermon-anchor-rejected', turn: state.turn, search: error?.search ?? null })
      throw error
    }
    sermonPlan.anchorChoice = anchorChoice
    log({ action: 'sermon-anchor-selected', epoch: state.observation.name, anchorChoice }); saveProgress()
    const chosen = await select('preacher'); assert.deepEqual(chosen, [ids.preacher])
    const anchor = anchorChoice.anchor
    await map(anchor)
    let hit
    for (const [dx, dz] of [[2, -2], [2, 0], [0, -2], [-2, -2], [-2, 0], [0, 2], [2, 2], [-2, 2]]) {
      const point = { x: anchor.x + dx, z: anchor.z + dz }
      const candidate = await groundHit(point)
      log({ action: 'sermon-approach-probe', anchor: anchor.id, point, candidate })
      if (candidate && inOrdinaryPreachingCells(candidate.point, anchor)) { hit = candidate; break }
    }
    assert.ok(hit, 'Visible clear ground in the prospectively recorded approach area')
    log({ action: 'sermon-approach-area', anchor, hit })
    await clickOrder(hit)
    await waitFor({ type: 'first-owned-sermon', preacherId: ids.preacher }, 'sermon', [ids.preacher])
  }
  const acquire = async () => {
    await prepareTemple(); await startPreacherTraining(); await finishPreacherTraining(); await approachSermon()
  }
  const cancelSermon = async () => {
    assert.ok(savedSermon)
    // Ordinary paused selection/camera preparation preserves the short saved
    // listener timer. Resume normally immediately before the accepted move.
    await pause(); const selected = await select('preacher')
    assert.deepEqual(selected, [ids.preacher])
    const before = await read(), preacher = before.units.find(u => u.id === ids.preacher)
    const lockedVictim = before.units.find(u => u.id === ids.victim)
    assert.ok(preacher && lockedVictim?.nativeState === 23 && lockedVictim.owner === ids.preacher)
    await map(preacher)
    let hit
    for (const [dx, dz] of [[6, -3], [6, 3], [-6, -3], [-6, 3], [0, -6], [0, 6], [6, 0], [-6, 0]]) {
      const point = { x: preacher.x + dx, z: preacher.z + dz }
      const candidate = await groundHit(point)
      log({ action: 'sermon-cancel-ground-probe', victim: ids.victim, point, candidate })
      if (candidate && !inOrdinaryPreachingCells(candidate.point, lockedVictim)) { hit = candidate; break }
    }
    assert.ok(hit, 'Visible clear cancellation ground outside the locked victim preaching cells')
    await resume(); await clickOrder(hit)
    await pause()
    const s = await read(); health(s)
    const cancellation = requireCancelledSermon(before, s, ids.victim, ids.preacher)
    log({ action: 'sermon-cancellation-observed', cancellation })
    await mark('sermon-cancelled')
  }
  const completeConversion = async () => {
    assert.ok(milestones.some(m => m.level === 3 && m.name === 'sermon-reloaded'), 'Require the observed reload milestone')
    assert.match((await read()).observation.name, /^reload-/, 'Conversion belongs to the resumed epoch')
    await resume()
    await waitFor({ type: 'conversion', id: ids.victim, preacherId: ids.preacher }, 'sermon', [ids.victim, ids.preacher])
    const event = await page.evaluate(async ({ victim, preacher }) => {
      const { requireConversion } = await import('/qa/campaign-continuity/observation.mjs')
      return requireConversion(window.campaignObservation.epoch, victim, preacher)
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
    assert.ok(milestones.some(m => m.level === 3 && m.name === 'conversion'), 'Finish the protected conversion witness first')
    await resume(); await select('preacher', 'one')
    const preachers = (await read()).selected
    const declaration = await page.evaluate(async shrineId => {
      const { armErosionObservation } = await import('/qa/campaign-continuity/erosion-observer.mjs')
      return armErosionObservation(window.campaignObservation.epoch, window.testSceneRef.current.world, shrineId)
    }, ids.erosion)
    log({ action: 'erosion-observation-armed', declaration })
    await clickOrder(await targetEntity('shrines', 'erosion'))
    await waitFor({ type: 'shrine-used', id: ids.erosion }, 'worship', [ids.erosion, ...preachers])
    await waitFor({ type: 'erosion-onset', id: ids.erosion }, 'erosion', [ids.erosion])
    const evidence = retired => page.evaluate(async ({ shrineId, retired }) => {
      const { requireErosionEvidence } = await import('/qa/campaign-continuity/erosion-observer.mjs')
      return requireErosionEvidence(window.campaignObservation.epoch, shrineId, retired)
    }, { shrineId: ids.erosion, retired })
    log({ action: 'erosion-onset-observed', evidence: await evidence(false), scope: 'Prospective per-turn witness; host screenshot may follow retirement' })
    await mark('erosion-start')
    await waitFor({ type: 'erosion-retired', id: ids.erosion }, 'erosion', [ids.erosion])
    log({ action: 'erosion-retirement-observed', evidence: await evidence(true) })
    await mark('erosion')
  }
  const conditionMet = (state, condition) => {
    switch (condition.type) {
      case 'stock-at-least': return state.shots[condition.spell] >= condition.count
      case 'stat-at-least': return state.stats[condition.stat] >= condition.count
      case 'camp-unlocked': return state.unlockedCamp === true
      case 'completed-blue-building': return state.buildings.some(b => b.team === 'blue' && b.kind === condition.kind && b.progress === 1)
      case 'trained-count': return state.stats.trained >= condition.count && state.units.filter(u => u.team === 'blue' && u.kind === condition.kind).length >= condition.count
      case 'shrine-kind-used': return state.shrines.some(h => h.kind === condition.kind && h.uses >= condition.uses)
      case 'accepted-bridge-casts': return acceptedCasts.filter(c => c.level === level && c.spell === 'bridge').length >= condition.count
      default: return checkCondition(state, condition)
    }
  }
  const progressFor = (state, condition, scope, watchIds) => {
    if (['stock-at-least', 'stat-at-least', 'camp-unlocked', 'completed-blue-building', 'trained-count', 'shrine-kind-used', 'accepted-bridge-casts'].includes(condition.type))
      return JSON.stringify([conditionMet(state, condition), condition.type === 'stock-at-least' ? state.shots[condition.spell] :
        condition.type === 'stat-at-least' ? state.stats[condition.stat] : null,
      null])
    const objectiveIds = [condition.id, condition.preacherId, ...(condition.ids ?? [])].filter(Number.isInteger)
    if (condition.type === 'trained-kind') {
      assert.ok(Array.isArray(condition.existingIds), 'Training wait requires the actual pre-order kind IDs')
      const buildingKind = condition.kind === 'warrior' ? 'camp' : condition.kind === 'preacher' ? 'temple' : null
      const buildings = state.buildings.filter(building => watchIds.includes(building.id) && building.team === 'blue' && building.kind === buildingKind)
      assert.equal(buildings.length, 1, 'Training progress names one actual training building')
      objectiveIds.push(buildings[0].id)
      objectiveIds.push(...state.units.filter(unit => unit.work === buildings[0].id || unit.inside === buildings[0].id || unit.order?.a === buildings[0].id).map(unit => unit.id))
    }
    if (condition.type === 'temple-unlocked') {
      objectiveIds.push(...state.shrines.filter(shrine => shrine.kind === 'vault').map(shrine => shrine.id))
      objectiveIds.push(...state.units.filter(unit => objectiveIds.includes(unit.work)).map(unit => unit.id))
    }
    assert.ok(objectiveIds.length || ['won', 'shaman-ready', 'erosion-onset', 'erosion-retired'].includes(condition.type), 'Wait must name its objective; unrelated combat cannot renew it')
    return objectiveProgress(state, condition, scope, objectiveIds)
  }
  const pauseForPreservation = async () => {
    const control = page.getByRole('button', { name: 'Pause game', exact: true })
    const visible = await control.isVisible()
    if (visible) await button('Pause game', { timeout: 5000 })
    log({ action: 'preservation-pause-control', visible, clicked: visible })
  }
  const stopPreserveLatest = async () => {
    preserveStopRequested = true
    await pauseForPreservation()
    const observed = await observeCheckpoint('campaign stop preserve latest')
    assert.deepEqual(observed.checkpoint, protectedLatest?.checkpoint ?? null, 'Preserve exactly the latest actual UI save, or initial empty slot')
    log({ action: 'stop-preserve-latest', observed })
    throw new IncompleteRun('preserve-latest', 'Requested bounded stop with committed latest preserved')
  }
  const assertCompleted = async completed => {
    let profile
    assert.equal(await waitForCheckpointReadback(async () => {
      await consumeQueuedStop(); profile = await readStorage('profile')
      return JSON.stringify(profile?.completed ?? []) === JSON.stringify(completed)
    }), true, 'Await committed campaign completion prefix')
    requireCampaignProfile(profile, completed)
    log({ action: 'campaign-profile-readback', profile, sha256: sha256(JSON.stringify(profile)) })
  }
  const initializeMission = async () => {
    const initial = await read(); health(initial)
    for (const key of Object.keys(ids)) delete ids[key]
    for (const shrine of initial.shrines) if (initial.shrines.filter(other => other.kind === shrine.kind).length === 1) ids[shrine.kind] = shrine.id
    if (level === 3) {
      const victim = initial.units.find(unit => unit.id === authoredVictim.id)
      assert.equal(victim?.team, 'yellow'); assert.equal(victim?.kind, 'brave')
      ids.authoredVictim = victim.id; ids.erosion = ids.erosionEffect
      assert.ok(ids.vault && ids.erosion)
      log({ action: 'authored-victim-identity', authored: authoredVictim, observed: victim })
    }
    await skipFlyby(); await waitFor({ type: 'shaman-ready' }, 'movement')
    await pause(); await snapshot(`m${level}-opening`); saveProgress()
  }
  const reloadCheckpoint = async ({ sermon = false, segment = false } = {}) => {
    assert.ok(protectedLatest?.checkpoint, 'Require the actual previously committed UI Save')
    const saved = structuredClone(protectedLatest.checkpoint)
    assert.equal(saved.level, level)
    if (!segment) { await pause(); await endEpoch(); await page.reload({ waitUntil: 'domcontentloaded' }) }
    await pollUI(() => page.getByRole('button', { name: 'Load Game', exact: true }).isVisible(), 45_000, 'saved-game control')
    assert.deepEqual((await observeCheckpoint('campaign before ordinary Load')).checkpoint, saved)
    await page.evaluate(installReplacementObservation)
    await button('Load Game')
    // The visible Pause control is the ordinary auto-resume witness. Do this
    // before imports, diagnostic binding and full replacement digest calculation.
    await button('Pause game')
    log({ action: 'load-paused-before-diagnostics', autoResumeWitness: 'Visible Pause game control accepted ordinary UI input' })
    await bindGameWithPreservation()
    const boundary = await page.evaluate(checkpointObservation, { observationName: 'campaignLoadBoundary' })
    const identity = await page.evaluate(replacementIdentity)
    assert.equal(identity.newWorld, true); assert.equal(identity.currentCorrespondence, true); assert.equal(identity.error, null)
    const stored = (await observeCheckpoint('campaign after ordinary Load')).checkpoint
    requireLoadedCheckpoint(saved, boundary, stored)
    await bindObservation(`reload-${level}-${epochs.length}`, saved.time)
    const loaded = await read(); health(loaded); assert.equal(loaded.paused, true)
    await assertCompleted(Array.from({ length: level - 1 }, (_, index) => index + 1))
    if (sermon) {
      const victim = loaded.units.find(u => u.id === savedSermon.victimId)
      assert.equal(victim?.nativeState, 23); assert.equal(victim?.owner, savedSermon.preacherId)
      for (const id of savedSermon.blueIds) assert.ok(loaded.units.some(u => u.id === id && u.team === 'blue'))
    }
    checkpointProofs.push({ level, saved, boundary, stored, identity, pausedTurn: loaded.turn, livePresentation: loaded.worshipPresentation, loaded: true, segment })
    log({ action: 'checkpoint-loaded', level, saved, boundary, stored, identity, pausedTurn: loaded.turn,
      livePresentation: loaded.worshipPresentation, presentationScope: 'Later live worship presentation may advance while simulation is paused; saved digest compared at actual storage boundaries.' })
    if (!segment) await mark(sermon ? 'sermon-reloaded' : 'checkpoint-reloaded')
  }
  const reloadSermon = async () => {
    assert.ok(savedSermon && milestones.some(m => m.level === 3 && m.name === 'sermon-cancelled'))
    await reloadCheckpoint({ sermon: true })
  }
  const proveVictory = async () => {
    const state = await read(); health(state); assert.equal(state.status, 'won')
    await pollUI(() => page.evaluate(() => !window.testSceneRef.current.world.outcome.cameraPlaying), 60_000, 'victory camera')
    await pollUI(() => page.getByRole('button', { name: `Continue to Mission ${level + 1}`, exact: true }).isVisible(), 60_000, 'campaign Continue control')
    await assertCompleted(Array.from({ length: level }, (_, index) => index + 1))
    await pause(); await mark('victory')
  }
  const continueMission = async suspend => {
    assert.ok(level < 3, 'Do not start Mission 4')
    validateMissionMilestones(level, milestones)
    assert.ok(checkpointProofs.some(proof => proof.level === level && proof.loaded && !proof.segment), 'Each mission must earn its own real Save/Load')
    assert.equal((await read()).status, 'won')
    await assertCompleted(Array.from({ length: level }, (_, index) => index + 1))
    await pause(); await endEpoch()
    await page.evaluate(installReplacementObservation)
    const from = level
    await button(`Continue to Mission ${from + 1}`)
    await bindGameWithPreservation()
    const boundary = await page.evaluate(replacementIdentity)
    requireContinueBoundary(boundary, from + 1)
    missionWallMs[from] += Date.now() - missionWallStarted
    missionWallStarted = Date.now(); level++
    transitions.push({ from, to: level, boundary, at: new Date().toISOString() })
    training = null; victimSelection = null; sermonPlan = null; savedSermon = null
    await bindObservation(`continue-${level}-${epochs.length}`, 0)
    log({ action: 'ordinary-continue-observed', from, to: level, boundary })
    await initializeMission()
    if (suspend) {
      await saveCheckpoint(`m${level}-continued-segment`)
      await endEpoch()
      const result = { finished: true, ...stateRecord(), phase: 'continued-and-saved' }
      const path = resolve(output, 'segment-boundary.json'), bytes = JSON.stringify(result, null, 2) + '\n'
      writeFileSync(path, bytes, { flag: 'wx' })
      receipt.campaignBoundary = { path, sha256: sha256(bytes) }
      if (failures.length || controlStops.length || result.browserErrors.length) throw new CampaignBoundaryClosed('Verified mission boundary; retained failures prevent a clean harness pass')
      return result
    }
  }
  const markRoute = async name => {
    const state = await read(); health(state)
    for (const condition of milestoneConditions(level, name)) assert.equal(conditionMet(state, condition), true, `Mission ${level} ${name}: ${condition.type}`)
    await mark(name)
  }
  const dispatch = async command => {
    assert.ok(command && typeof command === 'object' && typeof command.action === 'string')
    log({ action: 'requested-command', command })
    if (['acquire', 'prepare-temple', 'start-preacher-training', 'finish-preacher-training', 'declare-sermon', 'capture-sermon', 'return-shaman-home', 'approach-sermon', 'cancel-sermon', 'reload-sermon', 'complete-conversion', 'erosion'].includes(command.action)) assert.equal(level, 3)
    switch (command.action) {
      case 'acquire': return acquire()
      case 'prepare-temple': return prepareTemple()
      case 'start-preacher-training': return startPreacherTraining()
      case 'finish-preacher-training': return finishPreacherTraining()
      case 'declare-sermon': return declareSermon()
      case 'capture-sermon': await captureSermon(); throw new SermonCaptured({ explicitCommand: command })
      case 'return-shaman-home': return returnShamanHome()
      case 'approach-sermon': return approachSermon()
      case 'cancel-sermon': return cancelSermon()
      case 'reload-sermon': return reloadSermon()
      case 'complete-conversion': return completeConversion()
      case 'erosion': return erosion()
      case 'pause': return pause()
      case 'resume': return resume()
      case 'clear': return clear()
      case 'select': return select(command.kind, command.count)
      case 'select-units': return selectUnits(command.ids)
      case 'map': return map(command.point)
      case 'rotate': return rotate()
      case 'move': return move(command.point)
      case 'order-entity': return clickOrder(await targetEntity(command.collection, command.id))
      case 'build': return build(command.kind, command.point, command.alias)
      case 'cast': return cast(command.spell, command.target)
      case 'snapshot': return snapshot(safeLabel(command.name))
      case 'mark': return markRoute(command.name)
      case 'wait': {
        const condition = { ...command.condition }
        if (condition.id !== undefined) condition.id = resolveId(condition.id)
        if (condition.preacherId !== undefined) condition.preacherId = resolveId(condition.preacherId)
        return waitFor(condition, command.scope, (command.watchIds ?? []).map(resolveId))
      }
      case 'checkpoint': return saveCheckpoint(`m${level}-${safeLabel(command.name)}`)
      case 'reload-checkpoint': assert.ok(level < 3, 'M3 uses protected sermon Load'); return reloadCheckpoint()
      case 'prove-victory': return proveVictory()
      case 'continue': return continueMission(command.suspend !== false)
      case 'finish': {
        assert.equal(level, 3)
        for (const mission of [1, 2, 3]) validateMissionMilestones(mission, milestones)
        assert.equal(transitions.length, 2); assert.deepEqual(failures, []); assert.deepEqual(controlStops, []); assert.deepEqual([...priorBrowserErrors, ...receipt.errors], [])
        const final = await snapshot('campaign-final'); health(final); assert.equal(final.status, 'won')
        await assertCompleted([1, 2, 3]); await endEpoch()
        return { finished: true, ...stateRecord(), phase: 'campaign-victory', final,
          limits: 'Observed ordinary browser campaign only; no full original parity, native pixel equivalence or hardware-performance claim.' }
      }
      default: throw Error(`Unsupported input action ${command.action}`)
    }
  }
  let index = 0
  try {
    if (receipt.profile.mode === 'created') {
      assert.equal(receipt.profile.checkpointAtStart, null)
      requireCampaignProfile(await readStorage('profile'), [])
      await button('Select Mission 1'); await button('Start Mission 1')
      await bindGameWithPreservation(); await bindObservation('entry-1', 0); await initializeMission()
    } else {
      const previous = receipt.profile.previousRun, bytes = readFileSync(previous.receiptPath)
      assert.equal(sha256(bytes), previous.receiptSha256)
      const terminal = JSON.parse(bytes), boundaryPath = resolve(dirname(previous.receiptPath), 'segment-boundary.json')
      assert.equal(terminal.campaignBoundary?.path, boundaryPath)
      const boundaryBytes = readFileSync(boundaryPath)
      assert.equal(sha256(boundaryBytes), terminal.campaignBoundary.sha256)
      const prior = validateSegmentPredecessor(previous, terminal, JSON.parse(boundaryBytes), receipt.profile, receipt.source)
      assert.deepEqual(prior.policy, policy)
      level = prior.level; inheritedWallMs = prior.ownedWallMs
      Object.assign(missionWallMs, prior.missionWallMs); missionWallStarted = Date.now()
      failures.push(...prior.failures); controlStops.push(...prior.controlStops); priorBrowserErrors.push(...prior.browserErrors)
      for (const [target, values] of [[epochs, prior.epochs], [milestones, prior.milestones], [transitions, prior.transitions], [checkpointProofs, prior.checkpointProofs], [acceptedCasts, prior.acceptedCasts]]) target.push(...values)
      Object.assign(ids, prior.ids)
      inputs.push({ name: previous.receiptPath, sha256: previous.receiptSha256 })
      protectedLatest = prior.protectedLatest
      await reloadCheckpoint({ segment: true })
      log({ action: 'clean-segment-loaded', previousRunId: previous.runId, inheritedActiveSeconds: campaignActive(prior.epochs), inheritedWallMs })
      await snapshot(`m${level}-segment-opening`)
    }
    log({ action: 'awaiting-input', directory: commandsPath, next: '0001.json', paused: true, route: missionRoutes[level] })
    for (index = 1; index <= 500; index++) {
      const path = resolve(commandsPath, `${String(index).padStart(4, '0')}.json`)
      while (!existsSync(path)) {
        await consumeQueuedStop(); signal.throwIfAborted()
        health(await read())
        if (inheritedWallMs + Date.now() - startWall >= policy.limits.wallMs) throw new IncompleteRun('wall-envelope', 'Campaign owned wall ceiling reached')
        await sleep(1000)
      }
      const pending = await consumeQueuedStop({ includeOrdinary: true })
      const bytes = pending.bytes, hash = pending.sha256
      writeFileSync(resolve(output, `consumed-${String(index).padStart(4, '0')}.json`), bytes, { flag: 'wx' })
      inputs.push({ name: `commands/${String(index).padStart(4, '0')}.json`, sha256: hash }); saveProgress()
      inBatch = true
      const commands = JSON.parse(bytes)
      try {
        assert.ok(Array.isArray(commands) && commands.length > 0 && commands.length <= 32)
        for (const command of commands) {
          await consumeQueuedStop(); signal.throwIfAborted()
          health(await read())
          if (inheritedWallMs + Date.now() - startWall >= policy.limits.wallMs) throw new IncompleteRun('wall-envelope', 'Campaign owned wall ceiling reached')
          if (command.action !== 'capture-sermon') await capturePendingSermon(await read(), { beforeCommand: command })
          const result = await dispatch(command)
          assert.equal(sha256(readFileSync(path)), hash, 'Consumed input remains immutable')
          if (result?.finished) { writeFileSync(resolve(output, 'journey.json'), JSON.stringify({ status: 'passed', ...result }, null, 2) + '\n'); return result }
        }
        await pause(); const boundary = await snapshot(`batch-${String(index).padStart(4, '0')}`)
        health(boundary); await capturePendingSermon(boundary)
      } catch (error) {
        if (preserveStopRequested) throw error
        if (error instanceof SermonCaptured) {
          assert.equal(sha256(readFileSync(path)), hash)
          log({ action: 'batch-deferred-for-first-listener', index, inputSha256: hash, context: error.context }); saveProgress()
        } else {
          if (error instanceof CampaignBoundaryClosed || error instanceof IncompleteRun || error instanceof MissionDefeat) throw error
          failures.push({ level, index, inputSha256: hash, error: String(error?.stack ?? error), at: new Date().toISOString() })
          saveProgress(); await pause().catch(() => {})
          const state = await snapshot(`batch-${String(index).padStart(4, '0')}-failed`).catch(() => null)
          requireNotDefeated(state?.status)
          if (commands.some(command => ['finish', 'continue'].includes(command.action))) throw error
        }
      }
      inBatch = false
      log({ action: 'awaiting-input', next: `${String(index + 1).padStart(4, '0')}.json`, paused: true })
    }
    throw new IncompleteRun('command-limit', 'Finite command envelope exhausted')
  } catch (error) {
    terminalHandling = true
    const failure = { level, index, at: new Date().toISOString(), error: String(error?.stack ?? error), code: error?.code }
    if (error instanceof CampaignBoundaryClosed) { /* Real completed boundary retains its original failed prefix. */ }
    else if (error instanceof IncompleteRun) controlStops.push(failure)
    else if (!failures.length || failures.at(-1).error !== failure.error) failures.push(failure)
    if (!signal.aborted) {
      await pauseForPreservation().catch(() => {})
      await snapshot('terminal').catch(() => {})
      const observed = await observeCheckpoint('campaign terminal latest').catch(() => null)
      const matches = !!observed && JSON.stringify(observed.checkpoint) === JSON.stringify(protectedLatest?.checkpoint ?? null)
      preserveVerificationFailed = !matches
      log({ action: 'terminal-latest-preserved', expected: protectedLatest?.checkpoint ?? null, actual: observed?.checkpoint ?? null, matches })
    }
    saveProgress('failed')
    throw error
  } finally {
    await page.evaluate(() => { window.campaignObservation?.detach(); window.campaignReplacement?.dispose() }).catch(() => {})
  }
}
