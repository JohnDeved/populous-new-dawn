import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const swarmOnly = process.argv.includes('--mission3-swarm-only')
const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
const captureCameraEvidence = async () => {}
const wrapped = value => ((value + 128) % 256 + 256) % 256 - 128

async function state(page) {
  return page.evaluate(() => {
    const world = globalThis.testScene.world
    return {
      level: world.outcome.level,
      status: world.status,
      turn: world.turn,
      shots: { ...world.shots },
      stats: { ...world.stats },
      units: world.units
        .filter(unit => unit.hp > 0)
        .map(unit => ({
          id: unit.id,
          team: unit.team,
          kind: unit.kind,
          x: unit.x,
          z: unit.z,
          hp: unit.hp,
          inside: unit.inside,
        })),
      buildings: world.buildings
        .filter(building => building.hp > 0)
        .map(building => ({
          id: building.id,
          team: building.team,
          kind: building.kind,
          x: building.x,
          z: building.z,
          hp: building.hp,
          progress: building.progress,
        })),
      shrines: world.shrines.map(shrine => ({
        id: shrine.id,
        kind: shrine.kind,
        x: shrine.x,
        z: shrine.z,
        uses: shrine.uses,
        remaining: shrine.remaining,
      })),
      unlockedTemple: world.unlockedTemple,
    }
  })
}

async function waitForSelectableShaman(page, label) {
  await page.evaluate(async () => {
    const { campaignShamanReadiness } = await import('/scripts/campaign-start-readiness.mjs')
    globalThis.campaignObserveShaman = campaignShamanReadiness
  })
  // This installed Playwright polls synchronously; an async predicate would be
  // truthy before its promise resolved and could accept an unready actor.
  const sample = required => {
    const snapshot = globalThis.campaignObserveShaman(globalThis.testScene.world)
    return required && !snapshot.ready ? false : snapshot
  }
  const before = await page.evaluate(sample, false)
  // Keep the shipped RAF alive: Skip introduction releases camera input before
  // native command18 releases the Shaman's independent flags4/128 selection gate.
  const ready = await page.waitForFunction(sample, true)
  const after = await ready.jsonValue()
  await ready.dispose()
  assert.equal(after.ready, true, 'Startup Shaman is selectable before suspending RAF')
  const evidence = { label, before, after, method: 'real RAF; existing default wait timeout; observation only' }
  await page.evaluate(evidence => { (globalThis.campaignStartupReadiness ??= []).push(evidence) }, evidence)
  console.log(JSON.stringify({ startupReadiness: evidence }))
}

async function suspendOwnedFrame(page) {
  await page.evaluate(() => cancelAnimationFrame(globalThis.testScene.frame))
}

async function advance(page, turns) {
  return page.evaluate(async turns => {
    const scene = globalThis.testScene,
      world = scene.world
    cancelAnimationFrame(scene.frame)
    const { observeCampaignConversions } = await import('/scripts/campaign-conversion-observer.mjs')
    const observe = () => {
      globalThis.campaignConversionTracker = observeCampaignConversions(world, globalThis.campaignConversionTracker)
    }
    observe()
    const { tick } = await import('/app/model.ts')
    for (let turn = 0; turn < turns && world.status === 'playing'; turn++) {
      tick(world, 1 / 12)
      observe()
    }
    globalThis.testStore.update()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    return world.status
  }, turns)
}

async function advanceOutcome(page) {
  await page.evaluate(() => {
    const scene = globalThis.testScene
    cancelAnimationFrame(scene.frame)
    scene.animate(performance.now())
  })
  await page.waitForFunction(() => !globalThis.testScene.world.outcome.cameraPlaying)
  await page.evaluate(() => cancelAnimationFrame(globalThis.testScene.frame))
}

async function advanceUntil(page, condition, limit, label, required = true) {
  const result = await page.evaluate(
    async ({ condition, limit }) => {
      const scene = globalThis.testScene,
        world = scene.world
      cancelAnimationFrame(scene.frame)
      const { observeCampaignConversions } = await import('/scripts/campaign-conversion-observer.mjs')
      const observe = () => {
        globalThis.campaignConversionTracker = observeCampaignConversions(world, globalThis.campaignConversionTracker)
      }
      observe()
      const { tick } = await import('/app/model.ts'),
        ready = () => {
          if (condition.type === 'building')
            return world.buildings.some(
              building => building.id === condition.id && building.progress === 1
            )
          if (condition.type === 'unit-count')
            return (
              world.units.filter(
                unit =>
                  unit.team === condition.team &&
                  unit.kind === condition.kind &&
                  unit.hp > 0
              ).length >= condition.count
            )
          if (condition.type === 'shrine-uses')
            return world.shrines.some(
              shrine => shrine.id === condition.id && shrine.uses >= condition.uses
            )
          if (condition.type === 'shrine-empty')
            return world.shrines.some(
              shrine => shrine.id === condition.id && shrine.remaining === 0
            )
          if (condition.type === 'no-effect')
            return !world.effects.some(effect => effect.kind === condition.kind)
          if (condition.type === 'effect')
            return world.effects.some(effect => effect.kind === condition.kind)
          if (condition.type === 'unlocked-temple') return world.unlockedTemple
          if (condition.type === 'unit-dead')
            return !world.units.some(unit => unit.id === condition.id && unit.hp > 0)
          if (condition.type === 'unit-converted') {
            const unit = world.units.find(unit => unit.id === condition.id && unit.hp > 0)
            return !unit || unit.team !== condition.team
          }
          if (condition.type === 'unit-near') {
            const unit = world.units.find(
              unit =>
                unit.team === condition.team &&
                unit.kind === condition.kind &&
                unit.hp > 0
            )
            if (!unit) return false
            const wrapped = value => ((value + 128) % 256 + 256) % 256 - 128
            return (
              Math.hypot(wrapped(unit.x - condition.x), wrapped(unit.z - condition.z)) <=
              condition.distance
            )
          }
          if (condition.type === 'units-near') {
            const unit = world.units.find(
                unit =>
                  unit.team === condition.team &&
                  unit.kind === condition.kind &&
                  unit.hp > 0
              ),
              target = world.units.find(
                unit => unit.id === condition.target && unit.hp > 0 && unit.inside === null
              )
            if (!unit || !target) return false
            const wrapped = value => ((value + 128) % 256 + 256) % 256 - 128
            return (
              Math.hypot(wrapped(unit.x - target.x), wrapped(unit.z - target.z)) <
              condition.distance
            )
          }
          if (condition.type === 'message')
            return world.messages.slots.some(message => message?.stringId === condition.stringId)
          if (condition.type === 'status') return world.status === condition.status
          throw new Error(`Unknown condition ${condition.type}`)
        }
      for (let turn = 0; turn < limit && world.status === 'playing' && !ready(); turn++) {
        tick(world, 1 / 12)
        observe()
      }
      globalThis.testStore.update()
      scene.animate(scene.previous)
      cancelAnimationFrame(scene.frame)
      return {
        ready: ready(),
        turn: world.turn,
        status: world.status,
        selected: world.selected,
        shaman: world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
        messages: world.messages.slots.map(message => message?.stringId ?? null),
      }
    },
    { condition, limit }
  )
  if (required) assert.ok(result.ready, `${label} timed out: ${JSON.stringify(result)}`)
  return result
}

async function entityPoint(page, collection, id) {
  return page.evaluate(
    ({ collection, id }) => {
      const scene = globalThis.testScene,
        world = scene.world,
        object = world[collection].find(candidate => candidate.id === id),
        bounds = scene.container.getBoundingClientRect()
      if (!object) throw new Error(`Missing ${collection} object ${id}`)
      scene.focus(object)
      scene.onChange()
      scene.renderer.render(scene.scene, scene.camera)
      const mesh =
          collection === 'units'
            ? scene.unitMeshes.get(id)
            : collection === 'buildings'
              ? scene.buildingMeshes.get(id)
              : scene.shrineMeshes.get(id)?.g,
        projected = scene.screen(mesh?.position ?? object),
        center = {
          x: bounds.left + ((projected.x + 1) * bounds.width) / 2,
          y: bounds.top + ((1 - projected.y) * bounds.height) / 2,
        },
        unit = collection === 'units'
      for (let dy = unit ? -24 : -140; dy <= (unit ? 24 : 60); dy += 4)
        for (let dx = unit ? -36 : -100; dx <= (unit ? 36 : 100); dx += 4) {
          const event = { clientX: center.x + dx, clientY: center.y + dy },
            person = scene.picking.pickPerson(event),
            picked = unit
              ? person
              : person !== null
                ? undefined
                : scene.pickWorldObject(event)?.id
          if (
            picked === id &&
            document.elementFromPoint(event.clientX, event.clientY) === scene.renderer.domElement
          )
            return { x: event.clientX, y: event.clientY }
        }
      // Original native models need a visible triangle, not merely an anchor or
      // fixed-size box. Retain the old search first, then sample this target's
      // current submitted geometry without changing runtime hit ownership.
      const modelDetails = [], candidates = []
      if (unit) {
        const hit = scene.picking.personBounds(id)
        if (hit) candidates.push({ x: hit.x + hit.width / 2, y: hit.y + hit.height / 2 })
      } else mesh?.traverse(child => {
        if (child.userData.nativeModel === undefined || !child.visible) return
        const commands = scene.picking.model(child, JSON.stringify(scene.view.projection)),
          faces = commands.filter(command => command.kind === 'model'),
          hit = commands.find(command => command.kind === 'bounds')?.bounds
        modelDetails.push({ model: child.userData.nativeModel, bounds: hit,
          faces: faces.length, submitted: !!scene.view.painter.source(child) })
        for (const { points } of faces)
          for (const weights of [[1, 1, 1], [2, 1, 1], [1, 2, 1], [1, 1, 2]]) {
            const total = weights.reduce((sum, weight) => sum + weight, 0)
            candidates.push({
              x: points.reduce((sum, point, i) => sum + point.x * weights[i], 0) / total,
              y: points.reduce((sum, point, i) => sum + point.y * weights[i], 0) / total,
            })
          }
      })
      const diagnostic = { collection, id, turn: world.turn, center,
        object: { x: object.x, z: object.z, model: object.model },
        mesh: mesh && { position: mesh.position.toArray(), visible: mesh.visible },
        camera: { position: scene.cameraPosition, viewPoint: scene.viewPoint, bearing: scene.cameraBearing },
        projection: scene.view.projection, models: modelDetails,
        legacyScan: { left: center.x - (unit ? 36 : 100), right: center.x + (unit ? 36 : 100),
          top: center.y - (unit ? 24 : 140), bottom: center.y + (unit ? 24 : 60), step: 4 } }
      const probe = () => candidates.map(candidate => {
        const event = { clientX: bounds.left + candidate.x, clientY: bounds.top + candidate.y },
          person = scene.picking.pickPerson(event),
          picked = unit ? person : person !== null ? undefined : scene.pickWorldObject(event)?.id,
          element = document.elementFromPoint(event.clientX, event.clientY),
          panel = element?.closest('.training-panel, .person-panel'),
          rect = panel?.getBoundingClientRect()
        return { event, person, picked, canvasOwnsPoint: element === scene.renderer.domElement,
          owner: element && { tag: element.tagName, className: element.className },
          panel: panel && { className: panel.className, label: panel.getAttribute('aria-label'),
            rect: rect && { x: rect.x, y: rect.y, width: rect.width, height: rect.height } } }
      })
      let samples = probe()
      diagnostic.nativeTargetHits = samples.filter(sample => sample.picked === id)
      diagnostic.rejectedPickIds = [...new Set(samples.map(sample => sample.picked ?? null))]
      let hit = samples.find(sample => sample.picked === id && sample.canvasOwnsPoint)
      if (!hit && samples.some(sample => sample.picked === id && !sample.canvasOwnsPoint && sample.panel)) {
        // A direct camera focus renders GPU geometry, but suspended RAF leaves
        // world-panel DOM at the old camera coordinates. The normal frame owner
        // refreshes presentation. Its canonical UI reservation list may change
        // later pool capacity, but simulation slots, clocks and orders may not.
        const reservations = () => [
          ...[...(scene.objectPanels?.panels.keys() ?? [])].map(id => `object-panel:${id}`),
          ...[...(scene.buildingPanels ?? [])].flatMap(([id, panel]) => panel.hidden ? [] : [`building-panel:${id}`]),
          ...(scene.cursor?.visible ? ['placement-preview'] : []),
        ]
        const serialize = value => JSON.stringify(value, (_key, item) => {
          if (item instanceof Map) return { mapEntries: [...item] }
          if (item instanceof Set) return { setEntries: [...item] }
          if (ArrayBuffer.isView(item)) return { arrayType: item.constructor.name,
            bytes: [...new Uint8Array(item.buffer, item.byteOffset, item.byteLength)] }
          if (item instanceof ArrayBuffer) return { arrayBuffer: [...new Uint8Array(item)] }
          if (typeof item === 'number' && (!Number.isFinite(item) || Object.is(item, -0)))
            return { numericValue: Object.is(item, -0) ? '-0' : String(item) }
          if (item === undefined) return { undefinedValue: true }
          return item
        })
        const before = structuredClone(world), ownersBefore = reservations()
        if (before.secondaryEffects && JSON.stringify(before.secondaryEffects.reservations) !== JSON.stringify(ownersBefore))
          throw new Error('Pre-refresh UI reservations do not match actual panel owners')
        scene.animate(scene.previous)
        cancelAnimationFrame(scene.frame)
        const ownersAfter = reservations(),
          reservationsValid = !world.secondaryEffects || JSON.stringify(world.secondaryEffects.reservations) === JSON.stringify(ownersAfter),
          afterComparable = world.secondaryEffects && before.secondaryEffects
            ? { ...world, secondaryEffects: { ...world.secondaryEffects, reservations: before.secondaryEffects.reservations } }
            : world,
          changedWorldKeys = [...new Set([...Object.keys(before), ...Object.keys(world)])].filter(key =>
            serialize(afterComparable[key]) !== serialize(before[key]))
        diagnostic.frameRefresh = { turnBefore: before.turn, turnAfter: world.turn,
          randomBefore: before.randomState, randomAfter: world.randomState,
          selectedBefore: before.selected, selectedAfter: [...world.selected], changedWorldKeys,
          reservations: { before: before.secondaryEffects?.reservations, after: world.secondaryEffects?.reservations,
            ownersBefore, ownersAfter, valid: reservationsValid,
            limit: 'Normal presentation-owned reservation changes affect later secondary-effect pool capacity.' } }
        if (!reservationsValid)
          throw new Error(`Refreshed UI reservations do not match actual panel owners: ${JSON.stringify(diagnostic)}`)
        if (changedWorldKeys.length)
          throw new Error(`Zero-dt presentation refresh changed world state: ${JSON.stringify(diagnostic)}`)
        samples = probe()
        diagnostic.afterRefreshNativeTargetHits = samples.filter(sample => sample.picked === id)
        hit = samples.find(sample => sample.picked === id && sample.canvasOwnsPoint)
      }
      if (hit) {
        const pickingDiagnostic = { ...diagnostic, hit: hit.event,
          source: unit ? 'actual person hit bounds' : 'actual target triangle geometry' }
        ;(globalThis.campaignPickDiagnostics ??= []).push(pickingDiagnostic)
        return { x: hit.event.clientX, y: hit.event.clientY, pickingDiagnostic }
      }
      ;(globalThis.campaignPickDiagnostics ??= []).push(diagnostic)
      throw new Error(`No rendered hit point for ${collection} object ${id}: ${JSON.stringify(diagnostic)}`)
    },
    { collection, id }
  )
}

async function groundPoint(page, point, buildingKind, maxRadius = 12) {
  return page.evaluate(async ({ point, buildingKind, maxRadius }) => {
    const scene = globalThis.testScene,
      bounds = scene.container.getBoundingClientRect(),
      placementError = buildingKind
        ? (await import('/app/model.ts')).placementError
        : undefined
    scene.focus(point)
    scene.onChange()
    scene.renderer.render(scene.scene, scene.camera)
    for (let radius = 0; radius <= maxRadius; radius += 2)
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
        const candidate = {
            x: point.x + Math.cos(angle) * radius,
            z: point.z + Math.sin(angle) * radius,
          },
          projected = scene.screen(candidate),
          event = {
            clientX: bounds.left + ((projected.x + 1) * bounds.width) / 2,
            clientY: bounds.top + ((1 - projected.y) * bounds.height) / 2,
          },
          picked = scene.pick(event)
        if (
          document.elementFromPoint(event.clientX, event.clientY) === scene.renderer.domElement &&
          scene.picking.pick(event) === null &&
          picked &&
          (!placementError || !placementError(scene.world, buildingKind, picked)) &&
          Math.hypot(picked.x - candidate.x, picked.z - candidate.z) < 2
        )
          return {
            x: event.clientX,
            y: event.clientY,
            point: { x: picked.x, z: picked.z },
          }
      }
    throw new Error(`No rendered ground point near ${point.x},${point.z}`)
  }, { point, buildingKind, maxRadius })
}

async function rotateCameraWithPointer(page, id, attempt) {
  const setup = await page.evaluate(() => {
    const scene = globalThis.testScene, world = scene.world,
      canvas = scene.renderer.domElement, rect = canvas.getBoundingClientRect()
    for (const fraction of [0.75, 0.6, 0.45]) {
      const start = { x: rect.left + 20, y: rect.top + rect.height * fraction },
        end = { x: start.x + 512, y: start.y }
      if (end.x >= rect.right || document.elementFromPoint(start.x, start.y) !== canvas || document.elementFromPoint(end.x, end.y) !== canvas) continue
      return { start, end, level: world.outcome.level,
        before: { turn: world.turn, time: world.time, random: world.randomState, selected: [...world.selected],
          mode: world.mode, angle: scene.cameraPosition.angle, viewPoint: { ...scene.viewPoint } } }
    }
    throw new Error('No canvas-owned right-drag corridor for occluded shrine')
  })
  assert.ok(setup.before.selected.length, 'Camera drag must not become an unselected-object context click')
  const label = `mission-${setup.level}-shrine-${id}-rotation-${attempt}`
  await captureCameraEvidence(`${label}-before`)
  await page.mouse.move(setup.start.x, setup.start.y)
  await page.mouse.down({ button: 'right' })
  try { await page.mouse.move(setup.end.x, setup.end.y, { steps: 8 }) }
  finally { await page.mouse.up({ button: 'right' }) }
  const after = await page.evaluate(() => {
    const scene = globalThis.testScene, world = scene.world
    scene.renderer.render(scene.scene, scene.camera)
    return { turn: world.turn, time: world.time, random: world.randomState, selected: [...world.selected],
      mode: world.mode, angle: scene.cameraPosition.angle, viewPoint: { ...scene.viewPoint } }
  })
  assert.equal(after.angle, (setup.before.angle + 512) & 2047, 'Real right-drag rotates one quarter-turn')
  for (const field of ['turn', 'time', 'random', 'selected', 'mode', 'viewPoint'])
    assert.deepEqual(after[field], setup.before[field], `Camera-only pointer drag preserves ${field}`)
  const evidence = { id, attempt, ...setup, after, method: 'ordinary right-button drag; RAF remains suspended' }
  await page.evaluate(evidence => { (globalThis.campaignCameraAdjustments ??= []).push(evidence) }, evidence)
  console.log(JSON.stringify({ cameraAdjustment: evidence }))
  await captureCameraEvidence(`${label}-after`)
}

async function clickEntity(page, collection, id) {
  let point
  for (let attempt = 0; attempt < 4; attempt++) {
    try { point = await entityPoint(page, collection, id); break }
    catch (error) {
      const diagnostic = await page.evaluate(() => globalThis.campaignPickDiagnostics?.at(-1))
      if (collection !== 'shrines' || attempt === 3 || diagnostic?.id !== id ||
          diagnostic.collection !== collection || !diagnostic.nativeTargetHits || diagnostic.nativeTargetHits.length)
        throw error
      await rotateCameraWithPointer(page, id, attempt + 1)
    }
  }
  assert.ok(point, 'A shrine click requires an actually picked, canvas-owned target')
  if (point.pickingDiagnostic) console.log(JSON.stringify({ pickingDiagnostic: point.pickingDiagnostic }))
  await page.mouse.click(point.x, point.y)
}

async function dismissFlyby(page) {
  if (await page.evaluate(() => !!(globalThis.testScene.world.inputMask & 64))) {
    await page.evaluate(() => {
      const scene = globalThis.testScene,
        now = performance.now()
      cancelAnimationFrame(scene.frame)
      scene.previous = now
      scene.animate(now)
    })
    await page.keyboard.press('Escape')
    await page.waitForFunction(() => !(globalThis.testScene.world.inputMask & 64))
    await suspendOwnedFrame(page)
  }
}

async function selectClass(page, kind, modifier = 'Shift') {
  await dismissFlyby(page)
  if (kind === 'shaman') await page.getByLabel('followers', { exact: true }).click()
  const button = page.getByLabel(kind === 'shaman' ? 'Select and focus shaman' : `Select ${kind}`, { exact: true })
  if (kind === 'shaman') await button.click()
  else await button.click({ modifiers: [modifier] })
  return page.evaluate(kind => {
    const world = globalThis.testScene.world
    return world.selected.some(id =>
      world.units.some(unit => unit.id === id && unit.kind === kind && unit.hp > 0)
    )
  }, kind)
}

async function validBuildPoint(page, kind, preferred) {
  return page.evaluate(
    async ({ kind, preferred }) => {
      const world = globalThis.testScene.world,
        { placementError } = await import('/app/model.ts')
      for (let radius = 0; radius <= 24; radius += 2)
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
          const point = {
            x: preferred.x + Math.cos(angle) * radius,
            z: preferred.z + Math.sin(angle) * radius,
          }
          if (!placementError(world, kind, point)) return point
        }
      throw new Error(`No valid ${kind} placement near ${preferred.x},${preferred.z}`)
    },
    { kind, preferred }
  )
}

async function build(page, kind, label, point) {
  const before = new Set((await state(page)).buildings.map(building => building.id)),
    target = await groundPoint(page, await validBuildPoint(page, kind, point), kind)
  await selectClass(page, 'brave')
  await page.getByLabel('buildings B', { exact: true }).click()
  await page.getByRole('button', { name: label, exact: true }).click()
  await page.mouse.click(target.x, target.y)
  const building = (await state(page)).buildings.find(candidate => !before.has(candidate.id))
  if (!building) {
    const detail = await page.evaluate(() => ({
      inputMask: globalThis.testScene.world.inputMask,
      message: globalThis.testScene.world.message,
      mode: globalThis.testScene.world.mode,
      selected: globalThis.testScene.world.selected,
    }))
    assert.fail(`${kind} was not placed through the rendered building controls: ${JSON.stringify(detail)}`)
  }
  await advanceUntil(page, { type: 'building', id: building.id }, 20_000, `${kind} completion`)
  return building
}

async function train(page, building, turns = 2500, preserveBraves = false) {
  const snapshot = await state(page),
    braves = snapshot.units.filter(unit => unit.team === 'blue' && unit.kind === 'brave')
  if (!snapshot.buildings.some(candidate => candidate.id === building.id) || !braves.length)
    return false
  let selected = []
  const choose = async () => {
    if (preserveBraves) {
      // Original HUD multiple selection is additive. Cancel targeting first,
      // then clear the previous builders through the shipped Escape control.
      for (let cancel = 0; cancel < 2; cancel++) {
        const pending = await page.evaluate(() => !!globalThis.testScene.world.mode || !!globalThis.testScene.world.selected.length)
        if (!pending) break
        await page.keyboard.press('Escape')
      }
      const cleared = await page.evaluate(() => ({ mode: globalThis.testScene.world.mode, selected: [...globalThis.testScene.world.selected] }))
      assert.deepEqual(cleared, { mode: null, selected: [] }, 'Ctrl-five starts from an empty ordinary selection')
    }
    await selectClass(page, 'brave', preserveBraves ? 'Control' : 'Shift')
    selected = await page.evaluate(() => [...globalThis.testScene.world.selected])
    if (preserveBraves) {
      assert.equal(selected.length, 5, 'Ctrl-five selects exactly five Temple trainees')
      assert.ok(selected.every(id => braves.some(unit => unit.id === id)), 'Temple trainees are actual Braves')
      assert.ok(braves.some(unit => !selected.includes(unit.id)), 'Retain a Brave outside the training group')
    }
  }
  await choose()
  try {
    await clickEntity(page, 'buildings', building.id)
  } catch {
    await moveSelected(page, building, 600, 48)
    await choose()
    await clickEntity(page, 'buildings', building.id)
  }
  await advance(page, turns)
  if (preserveBraves) {
    const after = await state(page), retainedBefore = braves.filter(unit => !selected.includes(unit.id)).map(unit => unit.id),
      retainedAfter = after.units.filter(unit => unit.team === 'blue' && unit.kind === 'brave' && retainedBefore.includes(unit.id)).map(unit => unit.id)
    assert.ok(retainedAfter.length, 'An original untrained Brave survives for ordinary construction')
    assert.ok(await page.getByLabel('Select brave', { exact: true }).isEnabled(), 'Retained Brave is reachable from the HUD')
    const evidence = { building: building.id, turnBefore: snapshot.turn, turnAfter: after.turn,
      selected, retainedBefore, retainedAfter, modifier: 'Control', turns }
    await page.evaluate(evidence => { (globalThis.campaignTrainingOwnership ??= []).push(evidence) }, evidence)
    console.log(JSON.stringify({ trainingOwnership: evidence }))
  }
  return true
}

async function worship(page, kind, follower) {
  const snapshot = await state(page),
    shrine = snapshot.shrines.find(candidate => candidate.kind === kind)
  assert.ok(shrine, `Missing ${kind} shrine`)
  await selectClass(page, follower)
  await clickEntity(page, 'shrines', shrine.id)
  const result = await page.evaluate(
    ({ shrineId, follower }) =>
      ({
        accepted: globalThis.testScene.world.units.some(
          unit => unit.team === 'blue' && unit.kind === follower && unit.work === shrineId
        ),
        inputMask: globalThis.testScene.world.inputMask,
        selected: globalThis.testScene.world.selected,
        message: globalThis.testScene.world.message,
      }),
    { shrineId: shrine.id, follower }
  )
  assert.ok(result.accepted, `${follower} worship order for ${kind} was not accepted: ${JSON.stringify(result)}`)
  return shrine
}

async function moveSelected(page, point, turns, maxRadius) {
  const before = await page.evaluate(() => ({
      turn: globalThis.testScene.world.turn,
      lastOrderTurn: globalThis.testScene.world.lastOrderTurn,
    })),
    target = await groundPoint(page, point, undefined, maxRadius)
  await page.mouse.click(target.x, target.y)
  const result = await page.evaluate(() => ({
    lastOrderTurn: globalThis.testScene.world.lastOrderTurn,
    inputMask: globalThis.testScene.world.inputMask,
    mode: globalThis.testScene.world.mode,
    selected: globalThis.testScene.world.selected,
    message: globalThis.testScene.world.message,
  }))
  assert.ok(
    result.lastOrderTurn > before.lastOrderTurn && result.lastOrderTurn >= before.turn,
    `movement click was not accepted: ${JSON.stringify({ before, result })}`
  )
  if (turns) await advance(page, turns)
}

async function reachableApproach(page, target, radius = 12, choice = 0) {
  return page.evaluate(
    async ({ target, radius, choice }) => {
      const world = globalThis.testScene.world,
        { findPath, supportsFollower } = await import('/app/model.ts'),
        shaman = world.units.find(
          unit => unit.team === 'blue' && unit.kind === 'shaman' && unit.hp > 0
        ),
        wrapped = value => ((value + 128) % 256 + 256) % 256 - 128
      if (!shaman) throw new Error('Missing shaman for approach')
      const probe = structuredClone(world),
        probeShaman = probe.units.find(unit => unit.id === shaman?.id),
        candidates = []
      if (!probeShaman) throw new Error('Missing shaman for approach')
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
        const candidate = {
          x: wrapped(target.x + Math.cos(angle) * radius),
          z: wrapped(target.z + Math.sin(angle) * radius),
        }
        if (!supportsFollower(world, candidate)) continue
        const path = findPath(probe, probeShaman, candidate)
        if (path.length) candidates.push({ ...candidate, path: path.length })
      }
      candidates.sort((a, b) => a.path - b.path)
      if (!candidates.length) throw new Error(`No reachable approach to ${target.x},${target.z}`)
      const { x, z } = candidates[choice % candidates.length]
      return { x, z }
    },
    { target, radius, choice }
  )
}

async function spellPoint(page, spell, collection, id) {
  return page.evaluate(
    async ({ spell, collection, id }) => {
      const scene = globalThis.testScene,
        world = scene.world,
        object = world[collection].find(candidate => candidate.id === id)
      if (!object) throw new Error(`Missing ${collection} spell target ${id}`)
      scene.focus(object)
      scene.onChange()
      scene.renderer.render(scene.scene, scene.camera)
      const projected = scene.screen(object),
        bounds = scene.container.getBoundingClientRect(),
        event = {
          clientX: bounds.left + ((projected.x + 1) * bounds.width) / 2,
          clientY: bounds.top + ((1 - projected.y) * bounds.height) / 2,
        },
        picked = scene.pick(event)
      if (document.elementFromPoint(event.clientX, event.clientY) !== scene.renderer.domElement)
        throw new Error(`No rendered ground point for ${collection} spell target ${id}`)
      if (!picked) throw new Error(`No terrain pick for ${collection} spell target ${id}`)
      const wrapped = value => ((value + 128) % 256 + 256) % 256 - 128,
        distance = Math.hypot(wrapped(picked.x - object.x), wrapped(picked.z - object.z))
      if (distance >= 2)
        throw new Error(
          `Terrain pick for ${collection} spell target ${id} moved ${distance.toFixed(3)} map units`
        )
      const { spellTargetError } = await import('/app/model.ts')
      return {
        x: event.clientX,
        y: event.clientY,
        point: { x: picked.x, z: picked.z },
        error: spellTargetError(world, spell, picked),
      }
    },
    { spell, collection, id }
  )
}

async function castAt(page, spell, collection, id, required = true) {
  const shot = spell.toLowerCase(),
    target = await spellPoint(page, shot, collection, id),
    before = (await state(page)).shots[shot]
  if (target.error) {
    if (required)
      assert.fail(`${spell} target was rejected before input: ${JSON.stringify(target)}`)
    return false
  }
  await page.getByLabel(/spells/).click()
  await page.getByRole('button', { name: new RegExp(`^${spell}, `) }).click()
  await page.mouse.click(target.x, target.y)
  await advance(page, 1)
  const after = (await state(page)).shots[shot],
    accepted = after === before - 1
  if (required)
    assert.ok(accepted, `${spell} cast was accepted: ${JSON.stringify({ target, before, after })}`)
  return accepted
}

function nearest(units, point, priority = () => 0) {
  return units.toSorted(
    (a, b) =>
      priority(a) - priority(b) ||
      Math.hypot(wrapped(a.x - point.x), wrapped(a.z - point.z)) -
        Math.hypot(wrapped(b.x - point.x), wrapped(b.z - point.z))
  )[0]
}

async function missionTwo(page) {
  const camp = await build(page, 'camp', 'Warrior Training Hut, 8 wood', {
    x: -99,
    z: -105,
  })
  await build(page, 'hut', 'Hut, 3 wood', { x: -96, z: -124 })
  await build(page, 'hut', 'Hut, 3 wood', { x: -92, z: -116 })
  await train(page, camp, 5000)

  const bridge = await worship(page, 'bridgeEffect', 'shaman')
  await advanceUntil(page, { type: 'shrine-uses', id: bridge.id, uses: 1 }, 10_000, 'Mission 2 bridge')
  await advanceUntil(page, { type: 'effect', kind: 'bridge' }, 2000, 'Mission 2 bridge start')
  await advanceUntil(page, { type: 'no-effect', kind: 'bridge' }, 5000, 'Mission 2 bridge effect')
  await advance(page, 240)
  const tornado = await worship(page, 'tornado', 'shaman')
  await advanceUntil(page, { type: 'message', stringId: 644 }, 10_000, 'shaman enters Tornado shrine')
  await worship(page, 'tornado', 'brave')
  await advanceUntil(page, { type: 'message', stringId: 642 }, 10_000, 'followers enter Tornado shrine')
  await advanceUntil(page, { type: 'shrine-empty', id: tornado.id }, 20_000, 'Mission 2 Tornado worship')

  for (let group = 0; group < 8; group++) {
    await train(page, camp)
    const warriors = (await state(page)).units.filter(
      unit => unit.team === 'blue' && unit.kind === 'warrior'
    ).length
    if (warriors >= 24) break
  }

  for (const target of [
    { x: 55, z: 107 },
    { x: 72, z: 104 },
    { x: 100, z: 118 },
  ]) {
    let cast = false,
      rejection
    for (let attempt = 0; attempt < 5 && !cast; attempt++) {
      const reincarnated = await advanceUntil(
        page,
        { type: 'unit-count', team: 'blue', kind: 'shaman', count: 1 },
        5000,
        'Mission 2 shaman reincarnation',
        false
      )
      if (!reincarnated.ready) continue
      const spellTarget = await groundPoint(page, target),
        approach = await reachableApproach(page, spellTarget.point, 8, attempt)
      if (!(await selectClass(page, 'shaman'))) continue
      await moveSelected(page, approach)
      const inRange = await advanceUntil(
        page,
        { type: 'unit-near', team: 'blue', kind: 'shaman', ...approach, distance: 2 },
        3000,
        'shaman Tornado range',
        false
      )
      if (!inRange.ready) {
        rejection = await page.evaluate(
          ({ spellTarget, approach }) => {
            const world = globalThis.testScene.world,
              shaman = world.units.find(
                unit => unit.team === 'blue' && unit.kind === 'shaman' && unit.hp > 0
              )
            return {
              phase: 'approach',
              spellTarget,
              approach,
              selected: world.selected,
              status: world.status,
              shaman: shaman && {
                id: shaman.id,
                x: shaman.x,
                z: shaman.z,
                hp: shaman.hp,
                state: shaman.state,
                flags2: shaman.flags2,
                flags4: shaman.flags4,
                inside: shaman.inside,
              },
            }
          },
          { spellTarget: spellTarget.point, approach }
        )
        if (
          attempt === 0 &&
          (await state(page)).units.some(
            unit => unit.team === 'blue' && unit.kind === 'warrior' && unit.inside === null
          )
        ) {
          await selectClass(page, 'warrior')
          await moveSelected(page, approach)
          await advance(page, 600)
        }
        continue
      }
      const before = (await state(page)).shots.tornado,
        point = await groundPoint(page, spellTarget.point)
      await page.getByLabel(/spells/).click()
      await page.getByRole('button', { name: /^Tornado, / }).click()
      await page.mouse.click(point.x, point.y)
      await advance(page, 1)
      cast = (await state(page)).shots.tornado === before - 1
      if (!cast) {
        rejection = await page.evaluate(
          ({ spellTarget, approach }) => {
            const world = globalThis.testScene.world,
              shaman = world.units.find(
                unit => unit.team === 'blue' && unit.kind === 'shaman' && unit.hp > 0
              )
            return {
              spellTarget,
              approach,
              shots: world.shots.tornado,
              stock: world.manaWorld.spells[0].stocks[4],
              selected: world.selected,
              mode: world.mode,
              inputMask: world.inputMask,
              casting: world.castingTribes[0],
              shaman: shaman && {
                id: shaman.id,
                x: shaman.x,
                z: shaman.z,
                state: shaman.state,
                flags2: shaman.flags2,
                flags4: shaman.flags4,
                inside: shaman.inside,
              },
            }
          },
          { spellTarget: spellTarget.point, approach }
        )
        await page.keyboard.press('Escape')
      }
    }
    assert.ok(
      cast,
      `Tornado cast at ${target.x},${target.z} was accepted: ${JSON.stringify(rejection)}`
    )
    await advance(page, 800)
  }

  const stalled = new Set()
  for (let round = 0; round < 140; round++) {
    const snapshot = await state(page)
    if (snapshot.status !== 'playing') break
    if (!snapshot.units.some(unit => unit.team === 'blue' && unit.kind === 'warrior')) {
      await train(page, camp)
      await advance(page, 1200)
      continue
    }
    let candidates = [
      ...snapshot.units
        .filter(unit => unit.team === 'green' && unit.inside === null)
        .map(object => ({ ...object, object, collection: 'units' })),
      ...snapshot.buildings
        .filter(building => building.team === 'green' && building.progress === 1)
        .map(object => ({ ...object, object, collection: 'buildings' })),
    ].filter(candidate => !stalled.has(`${candidate.collection}-${candidate.object.id}`))
    if (!candidates.length) {
      stalled.clear()
      candidates = [
        ...snapshot.units
          .filter(unit => unit.team === 'green' && unit.inside === null)
          .map(object => ({ ...object, object, collection: 'units' })),
        ...snapshot.buildings
          .filter(building => building.team === 'green' && building.progress === 1)
          .map(object => ({ ...object, object, collection: 'buildings' })),
      ]
    }
    const candidate = nearest(candidates, { x: -99, z: -105 }, candidate =>
      candidate.object.kind === 'shaman' ? 1 : 0
    )
    if (!candidate) {
      await advance(page, 300)
      continue
    }
    const { object: target, collection } = candidate
    await selectClass(page, 'warrior')
    try {
      await clickEntity(page, collection, target.id)
    } catch {
      await moveSelected(page, { x: target.x, z: target.z })
    }
    await advance(page, 600)
    const next = await state(page)
    if (next[collection].some(object => object.id === target.id))
      stalled.add(`${collection}-${target.id}`)
  }
  await advanceUntil(page, { type: 'status', status: 'won' }, 5000, 'natural Mission 2 victory')
}

async function swarmDiagnostic(page) {
  return page.evaluate(async () => {
    const { missionThreeSwarmDiagnostic } = await import('/scripts/campaign-swarm-target.mjs')
    return missionThreeSwarmDiagnostic(globalThis.testScene.world)
  })
}

async function missionThreeSwarm(page) {
  await worship(page, 'vault', 'shaman')
  await advanceUntil(page, { type: 'unlocked-temple' }, 10_000, 'Mission 3 Temple knowledge')
  const before = await swarmDiagnostic(page)
  assert.ok(before.target, `No eligible Mission 3 Swarm target: ${JSON.stringify(before)}`)
  try {
    // spellPoint/castAt also validate the actual terrain pick, then use the spell
    // button and mouse click. Eligibility must never spend a shot speculatively.
    await castAt(page, 'Swarm', 'units', before.target.id)
  } catch (error) {
    assert.fail(`${error.message}: ${JSON.stringify({ before, after: await swarmDiagnostic(page) })}`)
  }
  console.log(`Mission 3 Swarm input: ${JSON.stringify({ before, after: await swarmDiagnostic(page) })}`)
}

async function missionThree(page) {
  await missionThreeSwarm(page)
  let snapshot

  const temple = await build(page, 'temple', 'Temple, 8 wood', { x: 24, z: 70 })
  await advanceUntil(
    page,
    { type: 'unit-count', team: 'blue', kind: 'brave', count: 3 },
    10_000,
    'Mission 3 Braves'
  )
  await train(page, temple, 5000, true)
  await advanceUntil(
    page,
    { type: 'unit-count', team: 'blue', kind: 'preacher', count: 3 },
    15_000,
    'Mission 3 Preachers'
  )

  snapshot = await state(page)
  let enemyPreacher = snapshot.units.find(
    unit => unit.team === 'yellow' && unit.kind === 'preacher' && unit.inside === null
  )
  for (let attempt = 0; attempt < 16 && enemyPreacher; attempt++) {
    const reincarnated = await advanceUntil(
      page,
      { type: 'unit-count', team: 'blue', kind: 'shaman', count: 1 },
      5000,
      'Mission 3 shaman reincarnation',
      false
    )
    if (!reincarnated.ready) continue
    enemyPreacher = (await state(page)).units.find(
      unit => unit.team === 'yellow' && unit.kind === 'preacher' && unit.inside === null
    )
    if (!enemyPreacher) break
    if (!(await selectClass(page, 'shaman'))) continue
    await moveSelected(page, { x: enemyPreacher.x + 4, z: enemyPreacher.z })
    const inRange = await advanceUntil(
      page,
      {
        type: 'units-near',
        team: 'blue',
        kind: 'shaman',
        target: enemyPreacher.id,
        distance: 7,
      },
      3000,
      'shaman Blast range',
      false
    )
    snapshot = await state(page)
    enemyPreacher = snapshot.units.find(
      unit => unit.team === 'yellow' && unit.kind === 'preacher' && unit.inside === null
    )
    if (!enemyPreacher) {
      await advance(page, 300)
      enemyPreacher = (await state(page)).units.find(
        unit => unit.team === 'yellow' && unit.kind === 'preacher' && unit.inside === null
      )
      if (!enemyPreacher) continue
    }
    if (!inRange.ready) continue
    if (!(await castAt(page, 'Blast', 'units', enemyPreacher.id, false))) {
      await page.keyboard.press('Escape')
      await advance(page, 24)
      continue
    }
    await advance(page, 180)
    enemyPreacher = (await state(page)).units.find(
      unit => unit.team === 'yellow' && unit.kind === 'preacher'
    )
  }
  assert.equal(enemyPreacher, undefined, 'ordinary Blast casts remove the Chumara Preacher')

  const erosion = await worship(page, 'erosionEffect', 'preacher')
  await advanceUntil(page, { type: 'shrine-uses', id: erosion.id, uses: 1 }, 10_000, 'Mission 3 Erosion')
  await advanceUntil(page, { type: 'effect', kind: 'erosion' }, 2000, 'Mission 3 Erosion start')
  await advanceUntil(page, { type: 'no-effect', kind: 'erosion' }, 10_000, 'Mission 3 Erosion effect')
  await selectClass(page, 'preacher')
  await moveSelected(page, { x: -19, z: 117 }, 3000)

  await build(page, 'hut', 'Hut, 3 wood', { x: 40, z: 72 })
  await build(page, 'hut', 'Hut, 3 wood', { x: 20, z: 100 })
  snapshot = await state(page)
  const returningPreacher = snapshot.units.find(
    unit => unit.team === 'yellow' && unit.kind === 'preacher' && unit.inside === null
  )
  if (returningPreacher) {
    await selectClass(page, 'preacher')
    await moveSelected(page, { x: returningPreacher.x + 1, z: returningPreacher.z })
    await advanceUntil(
      page,
      { type: 'unit-converted', id: returningPreacher.id, team: 'yellow' },
      3000,
      'counter-preaching foothold',
      false
    )
  }
  let camp = await build(page, 'camp', 'Warrior Training Hut, 8 wood', { x: 45, z: 90 })
  const stalledBuildings = new Set()
  for (let wave = 0; wave < 10; wave++) {
    if (!(await state(page)).buildings.some(building => building.id === camp.id))
      camp = await build(page, 'camp', 'Warrior Training Hut, 8 wood', { x: 45, z: 90 })
    for (let group = 0; group < 4; group++) {
      if (
        (await state(page)).units.filter(
          unit => unit.team === 'blue' && unit.kind === 'warrior'
        ).length >= 9
      )
        break
      await train(page, camp)
    }
    snapshot = await state(page)
    if (snapshot.status !== 'playing') break
    if (wave > 0) {
      const hut = nearest(
        snapshot.buildings.filter(
          building =>
            building.team === 'yellow' &&
            building.kind === 'hut' &&
            building.progress === 1 &&
            !stalledBuildings.has(building.id)
        ),
        { x: -19, z: 117 }
      )
      if (hut) {
        await selectClass(page, 'warrior')
        try {
          await clickEntity(page, 'buildings', hut.id)
        } catch {
          stalledBuildings.add(hut.id)
        }
        await advance(page, 2400)
        if ((await state(page)).buildings.some(building => building.id === hut.id))
          stalledBuildings.add(hut.id)
      }
    }
    const stalled = new Set()
    for (let round = 0; round < 80; round++) {
      snapshot = await state(page)
      if (snapshot.status !== 'playing') break
      const warriors = snapshot.units.filter(
        unit => unit.team === 'blue' && unit.kind === 'warrior' && unit.inside === null
      )
      if (!warriors.length) break
      let candidates = snapshot.units.filter(
        unit => unit.team === 'yellow' && unit.inside === null && !stalled.has(unit.id)
      )
      if (!candidates.length) {
        stalled.clear()
        candidates = snapshot.units.filter(
          unit => unit.team === 'yellow' && unit.inside === null
        )
      }
      const target = nearest(candidates, { x: -19, z: 117 }, unit =>
        unit.kind === 'preacher' ? -2 : unit.kind === 'shaman' ? 1 : 0
      )
      if (!target) {
        await advance(page, 300)
        continue
      }
      await selectClass(page, 'warrior')
      try {
        await clickEntity(page, 'units', target.id)
      } catch {
        await moveSelected(page, { x: target.x, z: target.z })
      }
      await advance(page, target.kind === 'preacher' ? 2400 : 600)
      if ((await state(page)).units.some(unit => unit.id === target.id)) stalled.add(target.id)
    }
  }
  await advanceUntil(page, { type: 'status', status: 'won' }, 5000, 'natural Mission 3 victory')
}

try {
  const { page, errors } = await openGame(browser, swarmOnly ? 3 : 2)
  page.setDefaultTimeout(20_000)
  await waitForSelectableShaman(page, swarmOnly ? 'Mission 3 direct entry' : 'Mission 2 direct entry')
  await suspendOwnedFrame(page)
  if (swarmOnly) {
    await missionThreeSwarm(page)
    assert.deepEqual(errors, [])
    console.log('PASS: focused Mission 3 Vault and Swarm rendered input (not full campaign acceptance)')
  } else {
    await missionTwo(page)
    await advanceOutcome(page)
    assert.equal(
      await page.evaluate(() => globalThis.testStore.getCompletedMissions().includes(2)),
      true,
      'Mission 2 victory is recorded in the campaign profile'
    )
    await page.getByRole('button', { name: 'Continue to Mission 3', exact: false }).click()
    await page.waitForFunction(() => globalThis.testStore.getWorld().outcome.level === 3)
    await page.waitForFunction(
      () => globalThis.testSceneRef.current?.world === globalThis.testStore.getWorld()
    )
    await page.evaluate(() => {
      globalThis.testScene = globalThis.testSceneRef.current
    })
    await page.waitForFunction(() => globalThis.testScene.world.flyby.flags & 1)
    await page.keyboard.press('Escape')
    await page.waitForFunction(() => !globalThis.testScene.world.inputMask)
    await waitForSelectableShaman(page, 'Mission 3 after Continue')
    await suspendOwnedFrame(page)
    await missionThree(page)
    await advanceOutcome(page)
    assert.equal(
      await page.evaluate(() => globalThis.testStore.getCompletedMissions().includes(3)),
      true,
      'Mission 3 victory is recorded in the campaign profile'
    )
    await page.getByRole('button', { name: 'Continue to Mission 4', exact: false }).waitFor()
    const conversions = await page.evaluate(() => globalThis.campaignConversionTracker?.events ?? [])
    console.log(JSON.stringify({ mission3ConversionObservation: { observed: conversions.length > 0, events: conversions,
      limit: 'Separate observation; no death/disappearance or victory-only inference of conversion.' } }))
    assert.deepEqual(errors, [])
    console.log('PASS: rendered player actions win Mission 2, continue, and naturally win Mission 3')
  }
} finally {
  await browser.close()
}
