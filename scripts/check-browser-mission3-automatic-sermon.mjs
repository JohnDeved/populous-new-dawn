// Rendered acceptance for #243: an ordinarily acquired Mission 3 Preacher's
// automatic sermon (order model 32) is an immediate order distinct from its
// player-queued waypoints, retires, and the queued waypoint then completes.
//
// Public Mission 3 entry. Acquisition reuses acquireNaturalPreacher (ordinary
// model commands with diagnostic fixed turns, as in the CPU witness
// tests/mission3-preacher-queued.test.mjs). The escort and queued route are real
// mouse/keyboard input on the canvas and HUD. Save uses Game settings -> Save
// Game -> Save checkpoint with IndexedDB readback; a fresh page uses the main
// menu Load Game. Both continuations run on the actual requestAnimationFrame
// clock. No actors, positions, timers, listeners, phases or RNG are supplied.
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { bindGame, clearSelectionWithEscape, selectShamanByPortrait } from './browser-game.mjs'
import { waitForCheckpointReadback } from './checkpoint-readback.mjs'
import { parseOptions, runLocalBrowser } from './local-render/harness.mjs'

const escortPoint = { x: -20, z: -105 },
  stagedPoint = { x: -43, z: -107 },
  waypointPoint = { x: -25, z: -100 }
// Room for a full 840-turn sermon cutoff plus the walk to the waypoint.
const traceTurnLimit = 1100,
  continuationTimeout = 150000

// Hold the clock while the canvas is used: rendering a frame at the previous
// timestamp admits no elapsed game time.
const renderHeld = () => {
  const s = window.testSceneRef.current
  cancelAnimationFrame(s.frame)
  window.testStore.update()
  s.animate(s.previous)
  cancelAnimationFrame(s.frame)
}

// Rendered contribution of one unit mesh; a zero count means it is not drawn.
const meshPixels = id => {
  const s = window.testSceneRef.current,
    gl = s.renderer.getContext(),
    mesh = s.unitMeshes.get(id)
  if (!mesh) return { pixels: 0, contextLost: gl.isContextLost(), mesh: false }
  const read = () => {
    s.renderer.render(s.scene, s.camera)
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
    return pixels
  }
  const visible = mesh.visible,
    shown = read()
  mesh.visible = false
  const hidden = read()
  mesh.visible = visible
  s.renderer.render(s.scene, s.camera)
  let pixels = 0
  for (let i = 0; i < shown.length; i += 4)
    if (shown[i] !== hidden[i] || shown[i + 1] !== hidden[i + 1] || shown[i + 2] !== hidden[i + 2])
      pixels++
  const unit = s.world.units.find(u => u.id === id)
  return {
    pixels,
    contextLost: gl.isContextLost(),
    mesh: true,
    visible,
    unit: unit && { x: unit.x, z: unit.z, inside: unit.inside ?? null, hp: unit.hp },
    view: s.viewPoint,
  }
}

// Find a canvas pixel whose actual ray pick is open ground near the target:
// no person, model or world object may intercept the ordinary command click.
async function groundClick(page, target, { ctrl = false } = {}) {
  const hit = await page.evaluate(target => {
    const s = window.testSceneRef.current
    s.focus(target)
    cancelAnimationFrame(s.frame)
    s.animate(s.previous)
    cancelAnimationFrame(s.frame)
    const bounds = s.container.getBoundingClientRect()
    for (let radius = 0; radius <= 2; radius += 0.25)
      for (let direction = 0; direction < (radius ? 16 : 1); direction++) {
        const angle = (direction * Math.PI) / 8,
          candidate = {
            x: target.x + Math.cos(angle) * radius,
            z: target.z + Math.sin(angle) * radius,
          },
          projected = s.screen(candidate),
          event = {
            clientX: bounds.left + ((projected.x + 1) * bounds.width) / 2,
            clientY: bounds.top + ((1 - projected.y) * bounds.height) / 2,
          }
        if (document.elementFromPoint(event.clientX, event.clientY) !== s.renderer.domElement)
          continue
        if (
          s.pickUnit(event) ||
          s.picking.pickPerson(event) ||
          s.picking.pick(event) !== null ||
          s.pickWorldObject(event)
        )
          continue
        const picked = s.pick(event)
        if (picked && Math.hypot(picked.x - target.x, picked.z - target.z) < 1)
          return { x: event.clientX, y: event.clientY, point: { x: picked.x, z: picked.z } }
      }
    throw Error(`No open ground pixel near ${JSON.stringify(target)}`)
  }, target)
  if (ctrl) await page.keyboard.down('Control')
  try {
    await page.mouse.click(hit.x, hit.y)
  } finally {
    if (ctrl) await page.keyboard.up('Control')
  }
  return hit
}

// Per-turn read-only observation chained after the scene's own afterTurn.
async function installTrace({ preacher, immediate, queue }) {
  const s = window.testSceneRef.current,
    w = s.world
  const { unitAnimationSource } = await import('/app/unit-animation-source.ts')
  const { currentPersonOrder } = await import('/app/person-orders.ts')
  const { observeCampaignConversions } = await import('/scripts/campaign-conversion-observer.mjs')
  const sample = () => {
    const unit = w.units.find(u => u.id === preacher),
      person = unit && unitAnimationSource(unit)
    return {
      turn: w.turn,
      alive: !!unit && unit.hp > 0,
      team: unit?.team ?? null,
      hp: unit?.hp ?? null,
      fight: !!unit?.fight,
      x: unit?.x ?? null,
      z: unit?.z ?? null,
      immediate: person?.immediateCommand ?? null,
      cursor: person?.commandCursor ?? null,
      commands: person?.commands.slice() ?? null,
      timer: person?.timer ?? null,
      order: (person && currentPersonOrder(w.buildingOrders, person)?.model) ?? null,
      immediateRefs: w.buildingOrders.records[immediate]?.references ?? null,
      waypointRefs: w.buildingOrders.records[queue[1]]?.references ?? null,
      listeners: w.units
        .filter(u => u.native?.state === 23 && u.native.workTarget === preacher)
        .map(u => u.id),
    }
  }
  let observation = observeCampaignConversions(w)
  const trace = (window.sermonTrace = {
    start: sample(),
    turns: [],
    retired: null,
    completed: null,
    events: [],
    error: null,
  })
  const original = s.gameClock.afterTurn
  window.restoreSermonTrace = () => {
    s.gameClock.afterTurn = original
  }
  s.gameClock.afterTurn = () => {
    original?.()
    // The comparison window ends at completion; later turns are not recorded.
    if (trace.completed) return
    try {
      observation = observeCampaignConversions(w, observation)
      trace.events = observation.events
      const row = sample()
      trace.turns.push(row)
      if (!trace.retired && row.immediate !== immediate) trace.retired = row
      if (trace.retired && !trace.completed && row.waypointRefs === 0) trace.completed = row
    } catch (error) {
      trace.error = error.stack ?? String(error)
    }
  }
  return trace.start
}

const waitForTrace = (page, key) =>
  page.waitForFunction(
    ({ key, limit }) => {
      const t = window.sermonTrace
      return !!(t?.[key] || t?.error || (t?.turns.length ?? 0) > limit)
    },
    { key, limit: traceTurnLimit },
    { timeout: continuationTimeout, polling: 50 }
  )

const readTrace = page =>
  page.evaluate(() => {
    const s = window.testSceneRef.current
    cancelAnimationFrame(s.frame)
    window.restoreSermonTrace()
    return window.sermonTrace
  })

const rendererName = () => {
  const gl = window.testSceneRef.current.renderer.getContext(),
    debug = gl.getExtension('WEBGL_debug_renderer_info')
  return debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)
}

function assertContinuation(trace, ids, label) {
  assert.equal(trace.error, null, `${label}: observer error`)
  assert.ok(
    trace.retired,
    `${label}: automatic sermon did not retire within ${traceTurnLimit} turns`
  )
  assert.ok(
    trace.completed,
    `${label}: queued waypoint did not complete within ${traceTurnLimit} turns`
  )
  const before = trace.turns.filter(row => row.turn < trace.retired.turn)
  for (const row of [trace.start, ...before]) {
    assert.equal(
      row.immediate,
      ids.immediate,
      `${label}: immediate changed before retirement at ${row.turn}`
    )
    assert.equal(
      row.order,
      32,
      `${label}: current order is not the automatic sermon at ${row.turn}`
    )
    assert.deepEqual(row.commands, ids.queue, `${label}: queued orders changed during the sermon`)
    assert.equal(row.cursor, ids.cursor, `${label}: queue cursor changed during the sermon`)
    assert.ok(
      row.alive && row.team === 'blue' && !row.fight,
      `${label}: Preacher stopped preaching`
    )
  }
  const retired = trace.retired
  assert.equal(retired.immediate, 0, `${label}: retirement left an immediate order`)
  assert.equal(retired.immediateRefs, 0, `${label}: retired sermon record still referenced`)
  assert.deepEqual(retired.listeners, [], `${label}: listener remained after retirement`)
  assert.deepEqual(retired.commands, ids.queue, `${label}: retirement changed queue ownership`)
  assert.equal(retired.cursor, 1, `${label}: retirement did not advance to the retained waypoint`)
  assert.equal(retired.order, 3, `${label}: retained waypoint is not the current movement order`)
  // Classify retirement: conversion of a listener, or no listener before the
  // 840-turn cutoff. A cutoff retirement is outside this acceptance.
  assert.ok(
    retired.timer < 840,
    `${label}: sermon reached the 840-turn cutoff (timer ${retired.timer})`
  )
  const converted = trace.events.filter(
    event =>
      event.turnAfter <= retired.turn &&
      event.victims.some(victim => victim.state === 23 && victim.workTarget === ids.preacher)
  )
  const mode = converted.length ? 'conversion' : 'no-listener'
  if (mode === 'no-listener')
    assert.deepEqual(
      trace.turns.find(row => row.turn === retired.turn - 1)?.listeners ?? [],
      [],
      `${label}: unconverted listener at retirement`
    )
  const completed = trace.completed
  assert.equal(completed.commands[1], 0, `${label}: waypoint slot not released`)
  assert.equal(completed.commands[0], ids.queue[0], `${label}: Ctrl-staged slot lost its ownership`)
  assert.ok(
    Math.hypot(completed.x - ids.waypoint.x, completed.z - ids.waypoint.z) < 3,
    `${label}: Preacher did not reach the clicked waypoint area`
  )
  assert.ok(
    Math.hypot(completed.x - retired.x, completed.z - retired.z) > 10,
    `${label}: Preacher did not move after retirement`
  )
  return mode
}

const options = parseOptions(process.argv.slice(2))
const receipt = await runLocalBrowser(options, async ({ page, openMission, output, receipt }) => {
  const shots = []
  // Full viewport plus, when a unit is named, a crop around its projected mesh.
  const shot = async (name, caption, unit = null) => {
    const state = await page.evaluate(id => {
      const s = window.testSceneRef.current,
        unit = id === null ? null : s.world.units.find(u => u.id === id)
      if (!unit) return { turn: s.world.turn, at: null }
      const bounds = s.container.getBoundingClientRect(),
        projected = s.screen(unit)
      return {
        turn: s.world.turn,
        at: {
          x: bounds.left + ((projected.x + 1) * bounds.width) / 2,
          y: bounds.top + ((1 - projected.y) * bounds.height) / 2,
          inside: Math.abs(projected.x) <= 1 && Math.abs(projected.y) <= 1,
        },
      }
    }, unit)
    const view = page.viewportSize()
    await page.screenshot({ path: resolve(output, name) })
    const entry = { file: name, turn: state.turn, caption, viewport: view }
    // No crop when the unit projects outside the canvas.
    if (state.at?.inside) {
      const width = 400,
        height = 280,
        clip = {
          x: Math.round(Math.min(Math.max(state.at.x - width / 2, 0), view.width - width)),
          y: Math.round(Math.min(Math.max(state.at.y - height / 2 - 30, 0), view.height - height)),
          width,
          height,
        }
      entry.zoom = name.replace(/\.png$/, '-zoom.png')
      entry.clip = clip
      await page.screenshot({ path: resolve(output, entry.zoom), clip })
    }
    shots.push(entry)
  }
  await openMission(3)

  // 1. Ordinary acquisition, then the CPU witness's 16-turn ordinary wait.
  const acquired = await page.evaluate(async () => {
    const s = window.testSceneRef.current
    cancelAnimationFrame(s.frame)
    const { acquireNaturalPreacher } =
      await import('/scripts/mission3-natural-preacher-scenario.mjs')
    const journey = acquireNaturalPreacher(s.world)
    for (let turn = 0; turn < 16; turn++) journey.step()
    window.sermonJourney = journey
    s.focus(journey.preacher)
    return {
      preacher: journey.preacher.id,
      shaman: journey.shaman.id,
      victim: journey.victim.id,
      milestones: journey.milestones,
      turn: s.world.turn,
      speed: s.world.speed,
      paused: s.world.paused,
    }
  })
  await page.evaluate(renderHeld)
  assert.equal(acquired.speed, 1)
  assert.equal(acquired.paused, false)
  const acquiredPixels = await page.evaluate(meshPixels, acquired.preacher)
  assert.equal(acquiredPixels.contextLost, false)
  // Recorded only: the new Preacher may still stand behind its Temple here.
  await shot('01-acquired-preacher.png', 'Ordinarily trained Blue Preacher after the 16-turn wait')

  // 2. Escort and queued route through real canvas and HUD input.
  const orderOf = id =>
    page.evaluate(async id => {
      const w = window.testStore.getWorld()
      const { unitAnimationSource } = await import('/app/unit-animation-source.ts')
      const { currentPersonOrder } = await import('/app/person-orders.ts')
      const unit = w.units.find(u => u.id === id),
        person = unitAnimationSource(unit)
      const order = currentPersonOrder(w.buildingOrders, person)
      return {
        turn: w.turn,
        selected: [...w.selected],
        commands: person.commands.slice(),
        cursor: person.commandCursor,
        immediate: person.immediateCommand,
        model: order?.model ?? null,
        records: person.commands
          .filter(Boolean)
          .map(id => ({ id, record: structuredClone(w.buildingOrders.records[id]) })),
      }
    }, id)
  await selectShamanByPortrait(page)
  const shamanBefore = await orderOf(acquired.shaman)
  const escort = await groundClick(page, escortPoint)
  const shamanAfter = await orderOf(acquired.shaman)
  assert.equal(shamanAfter.model, 3, 'Shaman escort click was not an ordinary movement order')
  assert.notDeepEqual(
    shamanAfter.commands,
    shamanBefore.commands,
    'Shaman escort click issued no order'
  )
  await clearSelectionWithEscape(page)
  await page.getByRole('button', { name: 'Select preacher', exact: true }).click()
  assert.deepEqual(
    (await orderOf(acquired.preacher)).selected,
    [acquired.preacher],
    'HUD did not select the Preacher alone'
  )
  const staged = await groundClick(page, stagedPoint, { ctrl: true })
  const waypoint = await groundClick(page, waypointPoint)
  await page.mouse.move(720, 500)
  const queued = await orderOf(acquired.preacher)
  assert.equal(queued.turn, acquired.turn, 'The held clock advanced during input')
  assert.equal(queued.records.length, 2, 'Ctrl+click and click did not queue two orders')
  assert.ok(
    queued.records.every(({ record }) => record.model === 3),
    'Queued orders are not movement'
  )
  assert.equal(queued.model, 3)
  assert.equal(queued.immediate, 0)
  await page.evaluate(renderHeld)
  await shot(
    '02-queued-route.png',
    'Escort and queued Preacher route issued by real Ctrl+click and click',
    acquired.preacher
  )

  // 3. Ordinary fixed turns until the automatic sermon is admitted.
  const automatic = await page.evaluate(async queued => {
    const { unitAnimationSource } = await import('/app/unit-animation-source.ts')
    const { currentPersonOrder } = await import('/app/person-orders.ts')
    const journey = window.sermonJourney,
      w = journey.world,
      person = unitAnimationSource(journey.preacher)
    journey.until(
      'automatic32',
      () => currentPersonOrder(w.buildingOrders, person)?.model === 32,
      1000
    )
    window.testSceneRef.current.focus(journey.preacher)
    const immediate = person.immediateCommand
    return {
      turn: w.turn,
      immediate,
      record: structuredClone(w.buildingOrders.records[immediate]),
      commands: person.commands.slice(),
      cursor: person.commandCursor,
      timer: person.timer,
      queuedUnchanged: queued.records.every(
        ({ id, record }) => JSON.stringify(w.buildingOrders.records[id]) === JSON.stringify(record)
      ),
      listeners: w.units
        .filter(u => u.native?.state === 23 && u.native.workTarget === journey.preacher.id)
        .map(u => u.id),
      randomState: w.randomState,
      fight: !!journey.preacher.fight,
      team: journey.preacher.team,
    }
  }, queued)
  assert.ok(automatic.immediate > 0)
  assert.equal(automatic.record.model, 32)
  assert.ok(
    !queued.commands.includes(automatic.immediate),
    'Automatic sermon reused a queued order id'
  )
  assert.deepEqual(automatic.commands, queued.commands, 'Automatic sermon changed queued slots')
  assert.equal(automatic.cursor, queued.cursor, 'Automatic sermon moved the queue cursor')
  assert.equal(automatic.queuedUnchanged, true, 'Automatic sermon changed a queued record')
  assert.equal(automatic.team, 'blue')
  assert.equal(automatic.fight, false)
  await page.evaluate(renderHeld)
  const sermonPixels = await page.evaluate(meshPixels, acquired.preacher)
  assert.equal(sermonPixels.contextLost, false)
  assert.ok(
    sermonPixels.pixels > 0,
    `Preaching Preacher is not drawn: ${JSON.stringify(sermonPixels)}`
  )
  await shot(
    '03-automatic-sermon-32.png',
    'Automatic sermon admitted as immediate order model 32',
    acquired.preacher
  )
  const ids = {
    preacher: acquired.preacher,
    immediate: automatic.immediate,
    queue: queued.commands,
    cursor: queued.cursor,
    waypoint: waypoint.point,
  }

  // 4. Shipped Save Game -> Save checkpoint with committed IndexedDB readback.
  await page.getByRole('button', { name: 'Game settings', exact: true }).click()
  const gameMenu = page.getByRole('dialog', { name: 'Game menu', exact: true })
  await gameMenu.getByRole('button', { name: 'Save Game', exact: true }).click()
  await gameMenu.getByRole('button', { name: 'Save checkpoint', exact: true }).click()
  let saved = null
  const persisted = await waitForCheckpointReadback(async () => {
    saved = await page.evaluate(async ids => {
      const { unitAnimationSource } = await import('/app/unit-animation-source.ts')
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open('populous-new-dawn', 1)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
      try {
        const record = await new Promise((resolve, reject) => {
          const request = db
            .transaction('checkpoints', 'readonly')
            .objectStore('checkpoints')
            .get('latest')
          request.onsuccess = () => resolve(request.result)
          request.onerror = () => reject(request.error)
        })
        const w = record?.world,
          unit = w?.units.find(u => u.id === ids.preacher),
          person = unit && unitAnimationSource(unit)
        if (!person) return null
        return {
          turn: w.turn,
          randomState: w.randomState,
          immediate: person.immediateCommand,
          model: w.buildingOrders.records[person.immediateCommand]?.model,
          commands: person.commands.slice(),
          cursor: person.commandCursor,
          timer: person.timer,
        }
      } finally {
        db.close()
      }
    }, ids)
    return saved?.immediate === ids.immediate && saved.turn === automatic.turn
  })
  assert.equal(
    persisted,
    true,
    `Saved checkpoint never persisted the automatic sermon: ${JSON.stringify(saved)}`
  )
  assert.equal(saved.model, 32)
  assert.deepEqual(saved.commands, ids.queue)
  assert.equal(saved.cursor, ids.cursor)
  assert.equal(saved.randomState, automatic.randomState)
  await shot('04-save-game-checkpoint.png', 'Game settings > Save Game > Save checkpoint committed')

  // 5. Same-page continuation on the actual clock is the expected result.
  const originalStart = await page.evaluate(installTrace, ids)
  assert.equal(originalStart.turn, automatic.turn, 'Turns elapsed between save and continuation')
  await gameMenu.getByRole('button', { name: 'Back', exact: true }).click()
  await gameMenu.getByRole('button', { name: 'Continue Game', exact: true }).click()
  await page.waitForFunction(
    () => !window.testStore.getWorld().paused && !document.querySelector('dialog[open]')
  )
  await page.evaluate(() => {
    const s = window.testSceneRef.current
    // End diagnostic suspension without admitting its wall-time as game catchup.
    s.previous = performance.now()
    s.animate(s.previous)
  })
  await waitForTrace(page, 'completed')
  const expected = await readTrace(page)
  const expectedMode = assertContinuation(expected, ids, 'same-page')
  // The listener must be the authored Yellow Brave at (-43,-107), not any unit.
  assert.ok(
    [expected.start, ...expected.turns].some(row => row.listeners.includes(acquired.victim)),
    'The authored Yellow Brave never listened during the automatic sermon'
  )

  // 6. Fresh page: main menu Load Game; observe the replacement boundary.
  await page.reload({ waitUntil: 'domcontentloaded' })
  const mainMenu = page.getByRole('dialog', { name: 'Main menu', exact: true })
  await mainMenu.getByRole('button', { name: 'Load Game', exact: true }).waitFor()
  await page.evaluate(async ids => {
    const { unitAnimationSource } = await import('/app/unit-animation-source.ts')
    const main = document.querySelector('main')
    let fiber = main[Object.keys(main).find(key => key.startsWith('__reactFiber'))],
      store
    for (; fiber && !store; fiber = fiber.return)
      for (let hook = fiber.memoizedState; hook; hook = hook.next)
        if (hook.memoizedState?.getWorld && hook.memoizedState?.subscribe) {
          store = hook.memoizedState
          break
        }
    if (!store) throw Error('Store unavailable before public Load')
    const before = store.getWorld()
    window.sermonBoundary = null
    const unsubscribe = store.subscribe(() => {
      const w = store.getWorld()
      if (w === before) return
      unsubscribe()
      const unit = w.units.find(u => u.id === ids.preacher),
        person = unit && unitAnimationSource(unit)
      window.sermonBoundary = {
        turn: w.turn,
        randomState: w.randomState,
        paused: w.paused,
        speed: w.speed,
        immediate: person?.immediateCommand ?? null,
        model: w.buildingOrders.records[person?.immediateCommand]?.model ?? null,
        commands: person?.commands.slice() ?? null,
        cursor: person?.commandCursor ?? null,
        timer: person?.timer ?? null,
        listeners: w.units
          .filter(u => u.native?.state === 23 && u.native.workTarget === ids.preacher)
          .map(u => u.id),
      }
    })
  }, ids)
  await mainMenu.getByRole('button', { name: 'Load Game', exact: true }).click()
  const boundary = await page.evaluate(() => window.sermonBoundary)
  assert.ok(boundary, 'Load Game did not replace the world')
  assert.equal(boundary.turn, automatic.turn)
  assert.equal(boundary.randomState, automatic.randomState)
  assert.equal(boundary.immediate, ids.immediate)
  assert.equal(boundary.model, 32)
  assert.deepEqual(boundary.commands, ids.queue)
  assert.equal(boundary.cursor, ids.cursor)
  assert.equal(boundary.timer, expected.start.timer)
  assert.deepEqual(boundary.listeners, expected.start.listeners)
  await bindGame(page)
  const loadedStart = await page.evaluate(installTrace, ids)
  assert.ok(
    loadedStart.turn < expected.retired.turn,
    'Fresh page bound only after the sermon retired'
  )
  await page.evaluate(id => {
    const s = window.testSceneRef.current
    s.focus(s.world.units.find(u => u.id === id))
  }, ids.preacher)
  await shot(
    '05-fresh-page-loaded.png',
    'Fresh page after main menu Load Game; automatic sermon continues',
    ids.preacher
  )
  await waitForTrace(page, 'retired')
  await page.evaluate(id => {
    const s = window.testSceneRef.current
    s.focus(s.world.units.find(u => u.id === id))
  }, ids.preacher)
  await shot(
    '06-sermon-retired.png',
    'Automatic sermon retired; retained queued waypoint resumes',
    ids.preacher
  )
  await waitForTrace(page, 'completed')
  const loaded = await readTrace(page)
  assert.equal(assertContinuation(loaded, ids, 'fresh-page'), expectedMode)
  // The fresh-page continuation reproduces the same-page result turn for turn.
  const byTurn = new Map(expected.turns.map(row => [row.turn, row]))
  const overlap = loaded.turns.filter(row => byTurn.has(row.turn))
  assert.ok(overlap.length >= loaded.turns.length - 1 && overlap.length > 0)
  for (const row of overlap)
    assert.deepEqual(
      row,
      byTurn.get(row.turn),
      `Fresh-page continuation diverged at turn ${row.turn}`
    )
  assert.deepEqual(loaded.retired, expected.retired)
  assert.deepEqual(loaded.completed, expected.completed)
  assert.deepEqual(
    loaded.events.filter(e => e.turnAfter > loadedStart.turn),
    expected.events.filter(e => e.turnAfter > loadedStart.turn)
  )
  await page.evaluate(id => {
    const s = window.testSceneRef.current
    s.focus(s.world.units.find(u => u.id === id))
  }, ids.preacher)
  await page.evaluate(renderHeld)
  const finalPixels = await page.evaluate(meshPixels, acquired.preacher)
  assert.equal(finalPixels.contextLost, false)
  assert.ok(
    finalPixels.pixels > 0,
    `Preacher at the completed waypoint is not drawn: ${JSON.stringify(finalPixels)}`
  )
  await shot(
    '07-waypoint-completed.png',
    'Retained queued waypoint completed after the sermon',
    ids.preacher
  )
  const renderer = await page.evaluate(rendererName)
  assert.equal(await page.evaluate(() => window.testStore.getWorld().status), 'playing')
  assert.deepEqual(receipt.errors, [])

  const summarize = trace => ({
    start: trace.start,
    retired: trace.retired,
    completed: trace.completed,
    listenerTurns: trace.turns.filter(row => row.listeners.length).map(row => row.turn),
    listeners: [...new Set(trace.turns.flatMap(row => row.listeners))],
    conversions: trace.events,
    observedTurns: trace.turns.length,
  })
  const result = {
    acquired,
    retirementMode: expectedMode,
    escort: escort.point,
    staged: staged.point,
    waypoint: waypoint.point,
    queued: {
      turn: queued.turn,
      commands: queued.commands,
      cursor: queued.cursor,
      records: queued.records,
    },
    automatic,
    saved,
    boundary,
    loadedStartTurn: loadedStart.turn,
    overlapTurns: overlap.length,
    expected: summarize(expected),
    loaded: summarize(loaded),
    pixels: { acquired: acquiredPixels, sermon: sermonPixels, final: finalPixels },
    renderer,
    screenshots: shots,
    limits:
      'Fresh public Mission 3. Vault/Temple/training use acquireNaturalPreacher ordinary model commands with diagnostic fixed turns; the escort and queued route are real canvas/HUD input; the wait for order 32 uses fixed turns; both continuations use the actual normal-speed requestAnimationFrame clock. Camera focus is a diagnostic view change. Software/headless WebGL; no native full-game parity, ordinary 840-turn cutoff, or hardware/FPS claim. No runtime or parity changes.',
  }
  writeFileSync(resolve(output, 'automatic-sermon.json'), JSON.stringify(result, null, 2) + '\n')
  return result
})
console.log(
  JSON.stringify(
    {
      status: receipt.status,
      commit: receipt.source.commit,
      result: receipt.result && {
        automatic: receipt.result.automatic,
        expected: receipt.result.expected?.retired,
        completed: receipt.result.expected?.completed,
        screenshots: receipt.result.screenshots,
      },
    },
    null,
    2
  )
)
