import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { CHECKPOINT_VERSION } from '../../app/checkpoint-format.ts'
import { bindGame, showAllMissions } from '../browser-game.mjs'
import { readCommittedCheckpoint } from '../local-render/checkpoint-observer.mjs'
import { m2StartupReady } from './m2-pointer-f8.mjs'
import { meleeCameraInput, meleeTargetPoint, readMeleeRouteState, assertMeleeRouteReady,
  shiftClickMeleeTarget } from './melee-attack.mjs'
import { installFollowerCorpseObserver, readFollowerCorpseHold } from './follower-corpse-observer.mjs'
import { validateFollowerCorpseObservation } from './follower-corpse-evidence.mjs'

export const followerCorpseLimitMs = 75000
const root = resolve(import.meta.dirname, '../..'), viewport = { width: 960, height: 720 }
const sha = bytes => createHash('sha256').update(bytes).digest('hex')

export function readCorpseMinimap(effectId = null) {
  const scene = window.testSceneRef.current, world = window.testStore.getWorld()
  const target = effectId === null ? world.units.find(u => u.id === 20) : world.effects.find(f => f.id === effectId)
  if (!target) throw Error('Authored target or retained corpse missing')
  const r = scene.mini.getBoundingClientRect()
  return { width: scene.mini.width, height: scene.mini.height,
    rect: { x: r.x, y: r.y, width: r.width, height: r.height },
    center: { x: Math.round((scene.viewPoint.x + 8) * 256), y: Math.round((-scene.viewPoint.z - 8) * 256) },
    heading: Math.round(scene.cameraBearing * 1024 / Math.PI),
    target: { x: Math.round((target.x + 8) * 256), y: Math.round((-target.z - 8) * 256) } }
}

export default async function followerCorpse({ browser, url, output, expectedRevision }) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 }), page = await context.newPage()
  page.setDefaultTimeout(10000)
  const report = { schema: 'populous-new-dawn/ordinary-follower-corpse', schemaVersion: 1,
    status: 'running', expectedRevision, capMs: followerCorpseLimitMs, actions: [], errors: [],
    actorId: null, effectId: null, death: null, segments: [], error: null,
    method: 'Fresh authored M2 through public startup. Existing public bird’s-eye/minimap target route, Escape, one plain Select brave, Resume, actual rendered hover and Shift+left attack on eligible Green Shaman20. Natural combat/death and same-frame corpse observation; public pause, committed current Save checkpoint, actual Load checkpoint, public camera reframing and Resume.',
    limits: ['Direct mission access, not campaign unlock. No native/synthetic scene, health, source, phase, clock, victim or target assignment.',
      'Independent original VSTART/VFRA fixture validates displayed native source and heading; packed frame identity comes from imported atlas metadata independently audited outside this browser check.',
      'Canvas copies and read-only observations perturb rendering; no performance or hardware smoothness claim. Crops require visual review and are not pixel-perfect composition evidence.',
      'The saved in-session current checkpoint is actually loaded and rendered. This is not a fresh browser/process persistence test.'],
    source: Object.fromEntries(['scripts/tutorial-browser/follower-corpse.mjs',
      'scripts/tutorial-browser/follower-corpse-observer.mjs', 'scripts/tutorial-browser/follower-corpse-evidence.mjs',
      'tests/fixtures/follower-corpse-native.json', 'app/original-units.json', 'app/follower-corpse-animation.ts',
      'app/scene-effects.ts', 'app/world-turn.ts', 'app/game-store.ts', 'app/checkpoint-format.ts']
      .map(path => [path, sha(readFileSync(resolve(root, path)))])) }
  const save = () => writeFileSync(resolve(output, 'follower-corpse.json'), JSON.stringify(report, null, 2) + '\n')
  const action = async (name, perform) => {
    report.actions.push({ name, startedAt: new Date().toISOString() }); save()
    await perform(); report.actions.at(-1).finishedAt = new Date().toISOString(); save()
  }
  const button = name => action(name, () => page.getByRole('button', { name, exact: true }).click())
  const settle = () => page.waitForFunction(() => {
    const s = window.testSceneRef.current
    return !s.cameraMotion.active && !s.resultCamera.active && !s.viewTransition
  })
  const focus = async effectId => {
    const geometry = await page.evaluate(readCorpseMinimap, effectId), input = meleeCameraInput(geometry)
    report.actions.push({ name: 'Public minimap target framing with fixed (0,+12) backing-pixel offset', geometry, input }); save()
    assert.equal(await page.evaluate(p => document.elementFromPoint(p.x, p.y) === window.testSceneRef.current.mini, input), true)
    await page.mouse.click(input.x, input.y); await settle()
  }
  const errors = error => { if (report.errors.length < 20) report.errors.push(String(error).slice(0, 2000)) }
  page.on('pageerror', errors)
  page.on('console', message => { if (message.type() === 'error') errors(message.text()) })
  page.on('crash', () => errors('Page crashed'))
  const timer = setTimeout(() => { report.timedOut = true; void context.close().catch(() => {}) }, followerCorpseLimitMs)
  let failure
  const retain = async () => {
    if (page.isClosed()) return
    const segment = await page.evaluate(() => window.__pndCorpseObservation?.retain() ?? null)
    if (!segment || report.segments.some(s => s.segment === segment.segment)) return
    if (segment.death) { report.death = segment.death; report.effectId = segment.effectId }
    report.segments.push(segment)
    for (const crop of segment.crops) {
      if (crop.error) continue
      assert.match(crop.filename, /^follower-corpse-(original|loaded)-[0-3]\.png$/)
      assert.match(crop.png, /^data:image\/png;base64,/)
      const bytes = Buffer.from(crop.png.split(',')[1], 'base64')
      writeFileSync(resolve(output, crop.filename), bytes, { flag: 'wx' }); crop.sha256 = sha(bytes); delete crop.png
    }
    save()
  }
  save()
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await action('New Game / No / Browser controls / All missions', () => showAllMissions(page))
    await button('Mission 2'); await bindGame(page)
    const startup = await page.waitForFunction(m2StartupReady)
    report.startup = await startup.jsonValue(); await startup.dispose()
    assert.equal(report.startup.level, 2)
    if (report.startup.action === 'skip')
      await action('Skip introduction', () => page.getByRole('button', { name: /^Skip introduction/ }).click())
    await page.waitForFunction(() => {
      const w = window.testStore.getWorld(); return !w.inputMask && !w.paused && w.turn > w.lastOrderTurn
    })
    await button('Pause game'); await button('Select and focus shaman'); await settle()
    assert.equal(await page.evaluate(() => window.testSceneRef.current.viewPreset), 0)
    await action('One public - zoom-out', () => page.keyboard.press('-')); await settle()
    assertMeleeRouteReady(await page.evaluate(readMeleeRouteState))
    await focus(null)
    assertMeleeRouteReady(await page.evaluate(readMeleeRouteState))
    await action('Public Escape clears the startup Shaman selection', () => page.keyboard.press('Escape'))
    assert.deepEqual(await page.evaluate(() => window.testStore.getWorld().selected), [])
    await button('Select brave')
    report.selection = await page.evaluate(() => {
      const w = window.testStore.getWorld(), s = window.testSceneRef.current
      return { turn: w.turn, selected: [...w.selected], paused: w.paused, camera: { ...s.cameraPosition },
        people: w.units.filter(u => w.selected.includes(u.id)).map(u => ({ id: u.id, team: u.team, kind: u.kind, hp: u.hp, target: u.target, fight: u.fight })) }
    })
    assert.equal(report.selection.paused, true)
    assert.equal(report.selection.people.length, 1)
    const actor = report.selection.people[0]
    assert.equal(actor.team, 'blue'); assert.equal(actor.kind, 'brave'); assert.ok(actor.hp > 0)
    assert.equal(actor.fight, null); assert.equal(actor.target, null); report.actorId = actor.id; save()
    await page.evaluate(installFollowerCorpseObserver, { actorId: report.actorId })
    await button('Resume game')
    const route = report.targetEligibility = await page.evaluate(readMeleeRouteState)
    assert.equal(route.paused, false); assert.equal(route.speed, 1); assert.equal(route.target.id, 20)
    assert.equal(route.target.inside, null); assert.equal(route.target.visible, true); assert.equal(route.target.pickable, true)
    const bounds = await page.evaluate(() => {
      const s = window.testSceneRef.current, r = s.renderer.domElement.getBoundingClientRect(), b = s.picking.personBounds(20, r)
      return b && { x: r.left + b.x, y: r.top + b.y, width: b.width, height: b.height }
    })
    assert.ok(bounds); report.targetHoverAttempts = []
    const point = await meleeTargetPoint(page, bounds, report.targetHoverAttempts, save)
    report.beforeAttack = await page.evaluate(() => ({ turn: window.testStore.getWorld().turn, stamp: window.testSceneRef.current.renderer.info.render.frame }))
    await action('Public Shift+left attack click on eligible Green Shaman20', () => shiftClickMeleeTarget(page, point))
    report.order = await page.evaluate(actorId => {
      const w = window.testStore.getWorld(), u = w.units.find(u => u.id === actorId)
      return { turn: w.turn, lastOrderTurn: w.lastOrderTurn, selected: [...w.selected], paused: w.paused,
        actorId, target: u?.target, path: structuredClone(u?.path), nativeCommands: u?.native && [...u.native.commands] }
    }, report.actorId)
    assert.deepEqual(report.order.selected, [report.actorId]); assert.equal(report.order.target, 20); assert.equal(report.order.paused, false)
    assert.ok(report.order.lastOrderTurn >= report.beforeAttack.turn && report.order.lastOrderTurn <= report.order.turn,
      'The actual public attack must issue an order on this observed logical timeline'); save()
    await page.waitForFunction(() => {
      const r = window.__pndCorpseObservation.result
      return r.error || r.samples.some(s => s.phase === 1 && !s.paused && s.cropFile)
    }, null, { timeout: followerCorpseLimitMs })
    assert.equal(await page.evaluate(() => window.__pndCorpseObservation.result.error), null)
    report.effectId = await page.evaluate(() => window.__pndCorpseObservation.result.effectId)
    await button('Pause game')
    report.checkpoint = { holdBefore: await page.evaluate(readFollowerCorpseHold, report.effectId) }
    assert.equal(report.checkpoint.holdBefore.paused, true)
    assert.equal(report.checkpoint.holdBefore.effect.corpse.phase, 1)
    await page.waitForTimeout(150)
    report.checkpoint.holdAfter = await page.evaluate(readFollowerCorpseHold, report.effectId)
    assert.deepEqual(report.checkpoint.holdAfter, report.checkpoint.holdBefore)
    await button('Game settings'); await button('Save Game'); await button('Save checkpoint')
    const menu = page.getByRole('dialog', { name: 'Game menu', exact: true })
    await menu.getByRole('status').filter({ hasText: 'Checkpoint saved in this browser.' }).waitFor()
    report.checkpoint.committed = await readCommittedCheckpoint(page)
    assert.equal(report.checkpoint.committed.version, CHECKPOINT_VERSION)
    report.checkpoint.saved = await page.evaluate(readFollowerCorpseHold, report.effectId)
    assert.equal(report.checkpoint.committed.turn, report.checkpoint.saved.turn)
    await retain()
    await page.evaluate(effectId => {
      const store = window.testStore, original = store.getWorld()
      const unsubscribe = store.subscribe(() => {
        const world = store.getWorld()
        if (world === original) return
        window.__pndCorpseLoaded = { worldReplaced: true, turn: world.turn, paused: world.paused,
          effect: structuredClone(world.effects.find(f => f.id === effectId)) }
        unsubscribe()
      })
    }, report.effectId)
    await button('Back'); await button('Load Game'); await button('Load checkpoint')
    await page.waitForFunction(() => !!window.__pndCorpseLoaded)
    report.checkpoint.loaded = await page.evaluate(() => window.__pndCorpseLoaded); save()
    assert.deepEqual(report.checkpoint.loaded.effect, report.checkpoint.saved.effect)
    assert.equal(report.checkpoint.loaded.turn, report.checkpoint.saved.turn)
    assert.equal(report.checkpoint.loaded.paused, true)
    await menu.waitFor({ state: 'hidden' }); await bindGame(page); await settle()
    assert.equal(await page.evaluate(() => window.testSceneRef.current.viewPreset), 0)
    await action('One public - zoom-out after actual Load checkpoint', () => page.keyboard.press('-')); await settle()
    await focus(report.effectId)
    await page.evaluate(installFollowerCorpseObserver, { actorId: report.actorId, effectId: report.effectId, segment: 'loaded' })
    await button('Resume game')
    await page.waitForFunction(() => {
      const r = window.__pndCorpseObservation.result; return r.error || r.done
    }, null, { timeout: followerCorpseLimitMs })
    await retain()
    report.acceptance = validateFollowerCorpseObservation(report)
    await button('Pause game')
    await page.screenshot({ path: resolve(output, 'follower-corpse-context.png') })
  } catch (error) {
    failure = error; report.failure = { message: String(error), stack: error.stack }; save()
    if (!page.isClosed()) try { await page.screenshot({ path: resolve(output, 'follower-corpse-failure.png'), timeout: 2000 }) }
    catch (error) { report.failureScreenshotError = String(error) }
  } finally {
    clearTimeout(timer)
    try { await retain() } catch (error) { report.errors.push(`Corpse retention: ${error}`) }
    try { await context.close(); report.contextClosed = true } catch (error) { report.errors.push(`Corpse cleanup: ${error}`) }
    report.status = failure || report.errors.length || report.timedOut ? 'failed' : 'passed'; save()
  }
  assert.equal(report.status, 'passed', 'Follower corpse browser case failed; see follower-corpse.json')
  return report
}
