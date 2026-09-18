// Canonical authored Mission10: Boat -> root71 worship -> linked72 -> checkpoint.
// Accepted100df23 production/assets remain untouched; stop on the first fault.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from '@playwright/test'
import { bindGame, openGame } from './browser-game.mjs'

assert.ok(process.env.PND_QUEUE_JOB_ID && process.env.PND_QUEUE_OUTPUT, 'Use the supervised queue')
assert.equal(process.argv.length, 2, 'Canonical acceptance has no static-only or bypass mode')
const output = join(process.env.PND_QUEUE_OUTPUT, 'static149')
mkdirSync(output, { recursive: false })
const report = {
  jobId: process.env.PND_QUEUE_JOB_ID,
  mission: 10,
  status: 'RUNNING',
  currentStage: 'open-Mission10',
  stages: [],
  actions: [],
  progress: [],
  invariance: [],
  errors: [],
  limits: [
    'Real mission, HUD selection, Boat/terrain/head pointer orders and checkpoint controls.',
    'Only camera focus, test-owned RAF and ordinary tick(world,1/12) acceleration are supplied.',
    'Read-only comparison clones never replace or inject live actors, terrain, work, RNG or rewards.',
    'Root-static evidence retained; no animation cadence or performance claim.',
    'First-fault stop; no static-only substitute for ordinary worship and linked-Totem acceptance.',
  ],
}
const save = () =>
  writeFileSync(join(output, 'evidence.json'), JSON.stringify(report, null, 2) + '\n')
const hash = value => createHash('sha256').update(value).digest('hex')
let browser,
  page,
  boatId,
  partyIds = []
const deadline = setTimeout(
  () => void browser?.close(),
  Math.max(1, Date.parse(process.env.PND_QUEUE_DEADLINE) - Date.now() - 20000)
)
process.once('SIGTERM', () => void browser?.close())

async function hold() {
  await page.evaluate(() => {
    if (!window.__static149Raf) {
      const request = window.requestAnimationFrame.bind(window)
      window.__static149Raf = { held: true }
      window.requestAnimationFrame = callback =>
        window.__static149Raf.held ? 0 : request(callback)
    }
    const scene = window.testScene
    cancelAnimationFrame(scene.frame)
    scene.frame = 0
    scene.previous = null
  })
}
async function render() {
  await page.evaluate(() => {
    const scene = window.testScene
    if (!window.__static149Raf.held || scene.frame) throw new Error('Checker does not own RAF')
    const now = performance.now()
    scene.previous = now
    scene.animate(now)
    cancelAnimationFrame(scene.frame)
    scene.frame = 0
    scene.previous = null
  })
}
async function installSnapshots() {
  await page.evaluate(() => {
    window.__totemDigest = async text =>
      Array.from(
        new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))
      )
        .map(value => value.toString(16).padStart(2, '0'))
        .join('')
    window.__totemSerialize = value =>
      JSON.stringify(value, (_key, item) => {
        if (item instanceof Map) return { type: 'Map', entries: [...item] }
        if (item instanceof Set) return { type: 'Set', entries: [...item] }
        if (ArrayBuffer.isView(item))
          return {
            type: item.constructor.name,
            bytes: Array.from(new Uint8Array(item.buffer, item.byteOffset, item.byteLength)),
          }
        if (item instanceof ArrayBuffer)
          return { type: 'ArrayBuffer', bytes: Array.from(new Uint8Array(item)) }
        if (typeof item === 'number' && !Number.isFinite(item))
          return { type: 'number', value: String(item) }
        return item === undefined ? { type: 'undefined' } : item
      })
  })
}
async function state() {
  return page.evaluate(
    async ({ boatId, partyIds }) => {
      const w = window.testScene.world,
        { currentPersonOrder } = await import('/app/person-orders.ts'),
        { vehicleReady } = await import('/app/vehicle-routing.ts'),
        boat =
          w.vehicles.find(v => v.id === boatId) ??
          w.vehicles.find(v => v.model === 1 && v.team === 'blue'),
        cell = boat && ((boat.y & 65535) >>> 9) * 128 + ((boat.x & 65535) >>> 9)
      return {
        turn: w.turn,
        level: w.outcome.level,
        status: w.status,
        inputMask: w.inputMask,
        paused: w.paused,
        selected: [...w.selected],
        message: w.message,
        lastOrderTurn: w.lastOrderTurn,
        randomState: w.randomState,
        cosmeticRandom: structuredClone(w.cosmeticRandom),
        root: structuredClone(w.shrines.find(s => s.id === 71)),
        linked: structuredClone(w.shrines.find(s => s.id === 72)),
        boat: boat && {
          ...structuredClone(boat),
          ready: vehicleReady(w.land, boat),
          cell,
          category: w.land.categories[cell],
          cellFlags: w.land.flags[cell],
        },
        units: w.units
          .filter(u => partyIds.includes(u.id) || w.selected.includes(u.id))
          .map(u => ({
            id: u.id,
            kind: u.kind,
            team: u.team,
            hp: u.hp,
            x: u.x,
            z: u.z,
            inside: u.inside,
            work: u.work,
            state: u.native?.state,
            command: u.native?.commandStatus,
            vehicle: u.native?.vehicle,
            order: u.native && structuredClone(currentPersonOrder(w.buildingOrders, u.native)),
            path: u.path,
          })),
        rewards: {
          shots: { ...w.shots },
          giftCounts: { ...w.giftCounts },
          gifts: structuredClone(w.gifts),
          earthquakes: w.effects.filter(e => e.earthquake).map(e => ({ id: e.id, x: e.x, z: e.z })),
        },
      }
    },
    { boatId, partyIds }
  )
}
async function stage(label, action) {
  report.currentStage = label
  save()
  const value = await action()
  report.actions.push({ label, passed: true, value })
  save()
  return value
}

// Compare the complete live world before/after the actual shrine-frame consumer.
// No gameplay keys, work fields, RNG or reward fields are omitted from this proof.
async function presentationInvariant(label) {
  const result = await page.evaluate(async () => {
    const scene = window.testScene,
      w = scene.world,
      serialize = window.__totemSerialize,
      { updateShrinesFrame } = await import('/app/scene-entities.ts'),
      { stoneHead149Model } = await import('/app/stone-head-149.ts'),
      before = serialize(w),
      beforeClock = serialize(scene.gameClock),
      geometry = [...scene.shrineMeshes].map(([id, entry]) => [
        id,
        entry.g.children[0].geometry.uuid,
        entry.g.children[0].geometry.getAttribute('position').version,
      ])
    for (let frame = 0; frame < 8; frame++) {
      for (const shrine of w.shrines) stoneHead149Model(shrine, 10)
      updateShrinesFrame(scene)
      scene.renderer.render(scene.scene, scene.camera)
    }
    const afterGeometry = [...scene.shrineMeshes].map(([id, entry]) => [
      id,
      entry.g.children[0].geometry.uuid,
      entry.g.children[0].geometry.getAttribute('position').version,
    ])
    return {
      beforeSha256: await window.__totemDigest(before),
      afterSha256: await window.__totemDigest(serialize(w)),
      clockUnchanged: beforeClock === serialize(scene.gameClock),
      geometryUnchanged: serialize(geometry) === serialize(afterGeometry),
      turn: w.turn,
      randomState: w.randomState,
    }
  })
  const evidence = {
    label,
    turn: result.turn,
    randomState: result.randomState,
    beforeSha256: result.beforeSha256,
    afterSha256: result.afterSha256,
    clockUnchanged: result.clockUnchanged,
    geometryUnchanged: result.geometryUnchanged,
  }
  report.invariance.push(evidence)
  save()
  assert.equal(
    evidence.afterSha256,
    evidence.beforeSha256,
    'Presentation changed live gameplay/work/RNG/reward state'
  )
  assert.equal(evidence.clockUnchanged, true)
  assert.equal(evidence.geometryUnchanged, true)
  return evidence
}

async function continuity() {
  const serialized = await page.evaluate(() => {
    const w = window.testScene.world
    // Menu pause and renderer lighting are not saved-game progress. Preserve every
    // actor/order, head/work, reward, RNG and campaign field relevant to this route.
    const keys = [
      'turn',
      'time',
      'pendingTime',
      'randomState',
      'cosmeticRandom',
      'nextId',
      'effectCounter',
      'selected',
      'units',
      'vehicles',
      'buildings',
      'shrines',
      'gifts',
      'giftCounts',
      'shots',
      'effects',
      'projectiles',
      'manaWorld',
      'manaTribes',
      'castingTribes',
      'spellCasts',
      'killCredits',
      'campaignTimer',
      'ai',
      'campaignAIs',
      'buildingOrders',
      'motionRoutes',
      'objectCells',
      'indexedSearch',
      'stats',
      'respawns',
      'respawnPoints',
    ]
    return window.__totemSerialize(Object.fromEntries(keys.map(key => [key, w[key]])))
  })
  return hash(serialized)
}
async function checkpoint(name, heading, label) {
  await render()
  const before = await continuity(),
    beforeState = await state()
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await page.getByRole('button', { name: 'Save checkpoint', exact: true }).click()
  await page.waitForFunction(() => window.testStore.hasCheckpoint())
  await page.getByRole('button', { name: 'Load checkpoint', exact: true }).click()
  await bindGame(page)
  await hold()
  const resume = page.getByRole('button', { name: 'Continue Game', exact: false })
  if (await resume.isVisible()) await resume.click()
  await render()
  const after = await continuity(),
    afterState = await state()
  report.actions.push({
    label,
    beforeSha256: before,
    afterSha256: after,
    before: beforeState,
    after: afterState,
  })
  save()
  assert.equal(
    after,
    before,
    'Checkpoint changed actors/orders, work, RNG, rewards or campaign progress'
  )
  await inspect(name, heading, label + '-restored')
  await presentationInvariant(label + '-presentation')
}

// Only ordinary ticks advance the live world. Each batch is compared with a
// read-only clone receiving the same ticks without the model149 selector calls.
async function until(kind, limit, label) {
  let total = 0
  while (total < limit) {
    const result = await page.evaluate(
      async ({ kind, count, boatId, partyIds }) => {
        const w = window.testScene.world,
          { tick } = await import('/app/model.ts'),
          { stoneHead149Model } = await import('/app/stone-head-149.ts'),
          serialize = window.__totemSerialize,
          control = structuredClone(w),
          root = w.shrines.find(s => s.id === 71),
          boat = w.vehicles.find(v => v.id === boatId)
        if (!window.__static149Raf.held || window.testScene.frame || w.paused)
          throw new Error('Normal ticks require unpaused owned RAF')
        const people = () =>
          partyIds.map(id => w.units.find(u => u.id === id && u.hp > 0 && u.team === 'blue'))
        const inIsland = u => {
          const x = Math.round((u.x + 8) * 256) & 65535,
            y = Math.round((-u.z - 8) * 256) & 65535
          return !!window.__totemRootIsland?.[(y >>> 9) * 128 + (x >>> 9)]
        }
        const ready = () => {
          if (kind === 'boarded')
            return people().every(
              u => u && u.native?.vehicle === boatId && boat.passengers.includes(u.id)
            )
          if (kind === 'landed')
            return (
              people().every(u => u && !u.native?.vehicle && inIsland(u)) &&
              boat.passengers.length === 0
            )
          if (kind === 'working') return root.work > 0 && root.followers >= 2 && root.uses === 0
          if (kind === 'reward') return root.uses === 1 && w.shrines.some(s => s.id === 72)
          throw new Error('Unknown normal-route condition')
        }
        let ticks = 0
        while (!ready() && ticks < count && w.status === 'playing' && people().every(Boolean)) {
          tick(control, 1 / 12)
          for (const shrine of w.shrines) stoneHead149Model(shrine, 10)
          tick(w, 1 / 12)
          ticks++
        }
        const live = serialize(w),
          expected = serialize(control)
        return {
          ready: ready(),
          ticks,
          equivalent: live === expected,
          liveSha256: await window.__totemDigest(live),
          controlSha256: await window.__totemDigest(expected),
          changedFields:
            live === expected
              ? []
              : Object.keys(w).filter(key => serialize(w[key]) !== serialize(control[key])),
          alive: people().every(Boolean),
          turn: w.turn,
          status: w.status,
          work: root.work,
          followers: root.followers,
          uses: root.uses,
          forced: root.forced,
          randomState: w.randomState,
        }
      },
      { kind, count: Math.min(32, limit - total), boatId, partyIds }
    )
    total += result.ticks
    report.progress.push({ label, total, ...result })
    save()
    assert.equal(
      result.equivalent,
      true,
      'Normal simulation diverged with presentation lookup: ' + result.changedFields
    )
    assert.equal(result.forced, false)
    assert.equal(result.status, 'playing', 'Mission ended during ' + label)
    assert.equal(result.alive, true, 'An authored route follower was lost during ' + label)
    await page.evaluate(() => window.testStore.update())
    await render()
    if (result.ready) return state()
    if (!result.ticks) break
  }
  throw new Error('NORMAL_ROUTE_TIMEOUT: ' + label + ' after ' + total + ' turns')
}

async function pointerEvidence(point) {
  return page.evaluate(async point => {
    const scene = window.testScene,
      e = { clientX: point.x, clientY: point.y },
      object = scene.pickWorldObject(e),
      person = scene.pickUnit(e),
      { liveCommandContext } = await import('/app/live-command.ts'),
      context = object && liveCommandContext(scene.world, object)
    return {
      canvas: document.elementFromPoint(point.x, point.y) === scene.renderer.domElement,
      person: person?.id ?? null,
      object: object?.id ?? null,
      context: context && {
        enabled: context.enabled,
        model: context.model,
        vehicle: context.vehicle?.id,
        shrine: context.shrine?.id,
      },
    }
  }, point)
}

async function boatPoint() {
  await page.evaluate(async boatId => {
    const scene = window.testScene,
      boat = scene.world.vehicles.find(v => v.id === boatId),
      { browserPosition } = await import('/app/model.ts')
    scene.focus(browserPosition(boat))
  }, boatId)
  await render()
  return page.evaluate(boatId => {
    const scene = window.testScene,
      mesh = scene.vehicleMeshes.get(boatId),
      rect = scene.container.getBoundingClientRect()
    if (!mesh?.visible) throw new Error('Authored Boat is not rendered')
    const projected = scene.view.screen(mesh.position, scene.camera),
      x = rect.left + ((projected.x + 1) * rect.width) / 2,
      y = rect.top + ((1 - projected.y) * rect.height) / 2
    for (let dy = -100; dy <= 40; dy += 2)
      for (let dx = -50; dx <= 50; dx += 2) {
        const event = { clientX: x + dx, clientY: y + dy }
        if (
          document.elementFromPoint(event.clientX, event.clientY) === scene.renderer.domElement &&
          !scene.pickUnit(event) &&
          scene.pickWorldObject(event)?.id === boatId
        )
          return { x: event.clientX, y: event.clientY }
      }
    throw new Error('No unoccluded authored Boat pointer hit')
  }, boatId)
}
async function landingPoint() {
  const candidates = await page.evaluate(async boatId => {
    const w = window.testScene.world,
      root = w.shrines.find(s => s.id === 71),
      boat = w.vehicles.find(v => v.id === boatId),
      { nativePosition, browserPosition } = await import('/app/model.ts'),
      { vehicleCanDisembark } = await import('/app/vehicle-routing.ts'),
      { liveVehicleCellObjects } = await import('/app/live-vehicles.ts'),
      rules = (await import('/app/original-rules.json')).default,
      n = nativePosition(w, root),
      start = ((n.y & 65535) >>> 9) * 128 + ((n.x & 65535) >>> 9),
      seen = new Uint8Array(16384),
      queue = [start]
    seen[start] = 1
    for (let i = 0; i < queue.length; i++) {
      const cell = queue[i],
        x = cell & 127,
        y = cell >>> 7
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const next = ((y + dy + 128) & 127) * 128 + ((x + dx + 128) & 127)
        if (!seen[next] && rules.terrainCategoryFlags[w.land.categories[next] & 15] & 1) {
          seen[next] = 1
          queue.push(next)
        }
      }
    }
    window.__totemRootIsland = seen
    const land = {
        flags: w.land.flags,
        categories: w.land.categories,
        cellObjects: cell => liveVehicleCellObjects(w, cell),
      },
      wrap = value => ((((value + 128) % 256) + 256) % 256) - 128,
      result = []
    for (const cell of queue) {
      const point = { x: (cell % 128) * 512 + 256, y: (cell >>> 7) * 512 + 256 }
      if (!vehicleCanDisembark(land, boat, point)) continue
      const target = browserPosition(point)
      result.push({
        target,
        cell,
        distance: Math.hypot(wrap(target.x - root.x), wrap(target.z - root.z)),
      })
    }
    return result.sort((a, b) => a.distance - b.distance).slice(0, 24)
  }, boatId)
  report.actions.push({ label: 'source-derived-root-island-landings', candidates })
  save()
  assert.ok(candidates.length, 'No legal Boat landing on the root Totem island')
  for (const candidate of candidates) {
    await page.evaluate(target => window.testScene.focus(target), candidate.target)
    await render()
    const point = await page.evaluate(
      async ({ candidate, boatId }) => {
        const scene = window.testScene,
          w = scene.world,
          boat = w.vehicles.find(v => v.id === boatId),
          { nativePosition, supportsFollower } = await import('/app/model.ts'),
          { vehicleCanDisembark } = await import('/app/vehicle-routing.ts'),
          { liveVehicleCellObjects } = await import('/app/live-vehicles.ts'),
          land = {
            flags: w.land.flags,
            categories: w.land.categories,
            cellObjects: cell => liveVehicleCellObjects(w, cell),
          },
          rect = scene.container.getBoundingClientRect()
        for (const radius of [0, 0.25, 0.5, 0.75])
          for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
            const target = {
                x: candidate.target.x + Math.cos(angle) * radius,
                z: candidate.target.z + Math.sin(angle) * radius,
              },
              projected = scene.screen(target),
              event = {
                clientX: rect.left + ((projected.x + 1) * rect.width) / 2,
                clientY: rect.top + ((1 - projected.y) * rect.height) / 2,
              }
            if (
              document.elementFromPoint(event.clientX, event.clientY) !==
                scene.renderer.domElement ||
              scene.pickUnit(event) ||
              scene.pickWorldObject(event)
            )
              continue
            const picked = scene.pick(event)
            if (!picked || Math.hypot(picked.x - target.x, picked.z - target.z) > 1) continue
            const n = nativePosition(w, picked),
              cell = ((n.y & 65535) >>> 9) * 128 + ((n.x & 65535) >>> 9)
            if (
              window.__totemRootIsland[cell] &&
              supportsFollower(w, picked) &&
              vehicleCanDisembark(land, boat, n)
            )
              return {
                x: event.clientX,
                y: event.clientY,
                point: { x: picked.x, z: picked.z },
                native: n,
                cell,
              }
          }
        return null
      },
      { candidate, boatId }
    )
    if (point) return point
  }
  throw new Error('No unoccluded legal landing pointer hit on the root island')
}

async function inspect(name, heading, label) {
  await page.evaluate(name => {
    const scene = window.testScene,
      head = scene.world.shrines.find(head => head.name === name)
    if (!head) throw new Error('Missing authored head: ' + name)
    scene.focus(head)
  }, name)
  await render()
  const evidence = await page.evaluate(async name => {
    const scene = window.testScene,
      head = scene.world.shrines.find(head => head.name === name),
      root = scene.shrineMeshes.get(head.id).g,
      mesh = root.children[0],
      { nativeModels } = await import('/app/scene-assets.ts'),
      { modelStage, modelDepthBias, modelTextureModes } = await import('/app/model-faces.ts'),
      stage = modelStage(nativeModels[149], 4),
      attr = key => Array.from(mesh.geometry.getAttribute(key).array),
      exact = (actual, expected) =>
        JSON.stringify(actual) === JSON.stringify(Array.from(new Float32Array(expected))),
      renderer = scene.renderer,
      gl = renderer.getContext(),
      ext = gl.getExtension('WEBGL_debug_renderer_info'),
      length = gl.drawingBufferWidth * gl.drawingBufferHeight * 4,
      before = new Uint8Array(length),
      after = new Uint8Array(length)
    renderer.render(scene.scene, scene.camera)
    gl.readPixels(
      0,
      0,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      before
    )
    const visible = root.visible
    root.visible = false
    renderer.render(scene.scene, scene.camera)
    gl.readPixels(
      0,
      0,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      after
    )
    root.visible = visible
    renderer.render(scene.scene, scene.camera)
    let pixels = 0
    for (let i = 0; i < length; i += 4)
      if (
        before[i] !== after[i] ||
        before[i + 1] !== after[i + 1] ||
        before[i + 2] !== after[i + 2]
      )
        pixels++
    const rect = scene.container.getBoundingClientRect()
    let pick = null
    for (const polygon of scene.picking.model(mesh, 'static149-' + head.id)) {
      if (polygon.kind !== 'model') continue
      const clientX = rect.left + polygon.points.reduce((sum, point) => sum + point.x, 0) / 3,
        clientY = rect.top + polygon.points.reduce((sum, point) => sum + point.y, 0) / 3
      if (document.elementFromPoint(clientX, clientY) !== renderer.domElement) continue
      if (scene.picking.pick({ clientX, clientY }) === head.id) {
        pick = { x: clientX, y: clientY }
        break
      }
    }
    return {
      name,
      id: head.id,
      controllerModel: head.model,
      nativeModel: mesh.userData.nativeModel,
      heading: root.userData.nativeHeading,
      rotationY: root.rotation.y,
      visible,
      pixels,
      pick,
      scale: mesh.userData.nativeScale,
      vertices: mesh.geometry.getAttribute('position').count,
      geometry: mesh.geometry.uuid,
      positionVersion: mesh.geometry.getAttribute('position').version,
      exactPositions: exact(attr('position'), stage.p),
      exactUV: exact(attr('uv'), stage.uv),
      exactBias: exact(attr('painterBias'), modelDepthBias(nativeModels[149], 4)),
      exactModes: exact(attr('textureMode'), modelTextureModes(nativeModels[149], 4)),
      atlas: {
        width: mesh.material.map.image.width,
        height: mesh.material.map.image.height,
        src: mesh.material.map.image.src,
      },
      state: structuredClone(head),
      turn: scene.world.turn,
      renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
    }
  }, name)
  report.stages.push({ label, ...evidence })
  save()
  assert.equal(evidence.nativeModel, 149)
  assert.equal(evidence.controllerModel, 45)
  assert.equal(evidence.heading, heading)
  assert.ok(Math.abs(evidence.rotationY + (heading * Math.PI) / 1024) < 1e-9)
  assert.equal(evidence.scale, 160)
  assert.equal(evidence.vertices, 258)
  for (const key of ['exactPositions', 'exactUV', 'exactBias', 'exactModes', 'visible'])
    assert.equal(evidence[key], true, key)
  assert.deepEqual([evidence.atlas.width, evidence.atlas.height], [256, 1024])
  assert.ok(evidence.atlas.src.endsWith('/original/atlas.png'))
  assert.ok(evidence.pixels > 20, 'Static149 must produce real GPU pixels')
  assert.ok(evidence.pick, 'Authored model149 must expose a real canvas hit')
  await page.mouse.move(evidence.pick.x, evidence.pick.y)
  await render()
  assert.equal(await page.evaluate(() => window.testScene.hoveredObject), evidence.id)
  await page.screenshot({
    path: join(output, label + '.png'),
  })
  save()
  return evidence
}

try {
  browser = await chromium.launch({ headless: true })
  const opened = await openGame(browser, 10)
  page = opened.page
  report.errors = opened.errors
  page.setDefaultTimeout(20000)
  await hold()
  await installSnapshots()
  const initial = await state()
  boatId = initial.boat?.id
  assert.equal(initial.level, 10)
  assert.equal(initial.root?.id, 71)
  assert.equal(initial.root.linkedShrine?.id, 72)
  assert.equal(initial.linked, undefined)
  assert.equal(initial.root.uses, 0)
  assert.ok(boatId && initial.boat.active)
  await stage('root-static', async () => {
    const root = await inspect('Totem Pole', 0, 'root-static')
    await presentationInvariant('root-static')
    return { id: root.id, pixels: root.pixels, heading: root.heading }
  })
  await stage('normal-authored-party-selection', async () => {
    // Mission10 authors four Blue model3 warriors; all fit the original Boat.
    await page
      .getByRole('button', { name: 'Select warrior', exact: true })
      .click({ modifiers: ['Control'] })
    partyIds = await page.evaluate(() => [...window.testScene.world.selected])
    const selected = await state()
    assert.ok(
      partyIds.length >= 2 && partyIds.length <= 5,
      'Select at least two authored followers within Boat capacity'
    )
    assert.ok(selected.units.every(u => u.team === 'blue' && u.kind === 'warrior' && u.hp > 0))
    return selected
  })
  await stage('normal-Boat-boarding-dispatch', async () => {
    const point = await boatPoint(),
      before = await state(),
      pointer = await pointerEvidence(point)
    report.actions.push({ label: 'Boat-pointer-before-dispatch', pointer })
    save()
    assert.equal(pointer.object, boatId)
    assert.equal(pointer.person, null)
    assert.equal(pointer.canvas, true)
    await page.mouse.click(point.x, point.y)
    const after = await state()
    report.actions.push({ label: 'actual-Boat-click', point, before, after })
    save()
    assert.equal(after.turn, before.turn)
    assert.ok(
      after.units.filter(u => u.order?.model === 22 && u.order.a === boatId).length >= 2,
      'NORMAL_BOARDING_DISPATCH_REJECTED: ' + after.message
    )
    return until('boarded', 2048, 'authored followers board the provided Boat')
  })
  await stage('normal-Boat-crossing-and-landing', async () => {
    const point = await landingPoint(),
      before = await state()
    assert.ok(partyIds.every(id => before.boat.passengers.includes(id)))
    await page.mouse.click(point.x, point.y)
    const after = await state(),
      driver = after.units.find(u => u.id === before.boat.passengers[0])
    report.actions.push({ label: 'actual-Boat-landing-click', point, before, after })
    save()
    assert.equal(after.turn, before.turn)
    assert.equal(driver?.order?.model, 3, 'NORMAL_FERRY_DISPATCH_REJECTED: ' + after.message)
    assert.equal(driver.command, 3)
    return until('landed', 4096, 'ordinary crossing and disembark on root island')
  })
  await stage('normal-root71-worship-dispatch', async () => {
    const root = await inspect('Totem Pole', 0, 'root-before-worship'),
      before = await state()
    assert.ok(partyIds.every(id => before.selected.includes(id)))
    await page.mouse.click(root.pick.x, root.pick.y)
    const after = await state()
    report.actions.push({ label: 'actual-root71-click', point: root.pick, before, after })
    save()
    assert.equal(after.turn, before.turn)
    assert.ok(
      after.units.filter(u => u.work === 71 || u.order?.model === 27).length >= 2,
      'NORMAL_ROOT_DISPATCH_REJECTED: ' + after.message
    )
    const working = await until('working', 2048, 'ordinary approach and at least two worshippers')
    assert.ok(working.root.work > 0 && working.root.uses === 0 && working.root.followers >= 2)
    await presentationInvariant('mid-worship')
    return working
  })
  await stage('mid-worship-checkpoint-continuity', () =>
    checkpoint('Totem Pole', 0, 'mid-worship-checkpoint')
  )
  await stage('normal-root-reward-and-linked-reveal', async () => {
    const before = await state(),
      result = await until('reward', 2048, 'unforced root71 worship completion')
    assert.equal(result.root.uses, 1)
    assert.equal(result.root.remaining, 0)
    assert.equal(result.root.work, 0)
    assert.equal(result.root.active, false)
    assert.equal(result.root.forced, false)
    assert.equal(result.root.linkedShrine, undefined)
    assert.equal(result.linked.id, 72)
    assert.equal(result.linked.work, 0)
    assert.equal(result.linked.uses, 0)
    const created = result.rewards.earthquakes.filter(
      e => !before.rewards.earthquakes.some(prior => prior.id === e.id)
    )
    assert.deepEqual(
      created.map(({ x, z }) => ({ x, z })),
      before.root.earthquakeTargets
    )
    const retired = await page.evaluate(() => {
      const s = window.testScene,
        root = s.world.shrines.find(h => h.id === 71),
        group = s.shrineMeshes.get(71).g,
        rect = s.container.getBoundingClientRect(),
        v = s.screen(root),
        e = {
          clientX: rect.left + ((v.x + 1) * rect.width) / 2,
          clientY: rect.top + ((1 - v.y) * rect.height) / 2,
        }
      return { visible: group.visible, picked: s.pickWorldObject(e)?.id ?? null }
    })
    assert.equal(retired.visible, false)
    assert.notEqual(retired.picked, 71)
    const linked = await inspect('Erosion Totem Pole', 1024, 'linked-post-reward')
    assert.equal(linked.id, 72)
    await presentationInvariant('post-reward-linked')
    return { root: result.root, linked: result.linked, earthquakes: created, retired }
  })
  await stage('post-reward-checkpoint-continuity', () =>
    checkpoint('Erosion Totem Pole', 1024, 'post-reward-checkpoint')
  )
  assert.deepEqual(report.errors, [])
  report.status = 'PASS_STATIC_149_AUTHORED_MISSION10'
} catch (error) {
  report.status = 'BLOCKED_STATIC_149_AUTHORED_MISSION10'
  report.firstFault = { stage: report.currentStage, error: error.stack ?? String(error) }
  if (page && !page.isClosed()) {
    report.firstFault.state = await state().catch(fault => ({ diagnosticError: fault.message }))
    await page.screenshot({ path: join(output, 'first-fault.png') }).catch(() => {})
  }
  process.exitCode = 1
} finally {
  clearTimeout(deadline)
  await browser?.close()
  report.browserClosed = true
  save()
  console.log(
    JSON.stringify(
      {
        status: report.status,
        firstFault: report.firstFault,
        stages: report.stages.length,
        output,
      },
      null,
      2
    )
  )
}
