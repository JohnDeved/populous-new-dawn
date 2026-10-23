import { clearPortraitSelection } from '../browser-portrait-input.mjs'
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { readMission10Observation } from '../tutorial-browser/mission10-input.mjs'
import { mission10SelectionQuery, mission10ExpectedSelection, mission10SelectionPreserved, mission10EscapePreserved } from './mission10-selection.mjs'
import { checkpointObservation } from './checkpoint-observer.mjs'
import { createMission1VaultInput } from './mission1-vault-input.mjs'
import { bindGame } from '../browser-game.mjs'
import { waitForCheckpointReadback } from '../checkpoint-readback.mjs'

// Failure evidence uses only time left in the original episode. It never delays
// abort/cleanup, retries a screenshot, or replaces the scenario's primary error.
export async function retainMission10FailureScreenshot({ page, output, signal, deadlineAt }) {
  const unavailable = () => signal.aborted || !Number.isFinite(deadlineAt) || Date.now() >= deadlineAt
  const remaining = deadlineAt - Date.now()
  if (signal.aborted || !Number.isFinite(deadlineAt) || remaining <= 0)
    return { status: 'not-attempted', reason: 'No remaining episode budget' }
  const timeout = Math.min(1000, remaining)
  let timer, onAbort
  try {
    const result = await Promise.race([
      page.screenshot({ path: resolve(output, 'failure.png'), timeout })
        .then(() => ({ status: 'captured', file: 'failure.png' })),
      new Promise(resolve => { timer = setTimeout(() => resolve({ status: 'failed', reason: 'Screenshot budget expired' }), timeout) }),
      new Promise(resolve => {
        onAbort = () => resolve({ status: 'failed', reason: 'Episode aborted' })
        signal.addEventListener('abort', onAbort, { once: true })
        if (signal.aborted) onAbort()
      }),
    ])
    return result.status === 'captured' && unavailable()
      ? { status: 'failed', reason: 'Screenshot completed after the episode deadline' } : result
  } catch (error) { return { status: 'failed', error: String(error) } }
  finally { clearTimeout(timer); if (onAbort) signal.removeEventListener('abort', onAbort) }
}

const party = [63, 111, 112, 113, 114]
const boatId = 62

// Executed only after this scenario has observed genuine boarding/restoration or
// completed public unload. The helper never creates people or edits live World.
export async function checkMission10FollowerStrip({ page, input, state, phase, occupied }) {
  const entering = await state(`${phase}-before-strip`)
  if (!entering.paused) await input.pause()
  const before = await state(`${phase}-strip-paused`)
  assert.equal(before.paused, true)
  assert.ok(before.party.every(person => person && person.hp > 0))
  assert.ok(before.party.every(person => occupied ? person.vehicle === boatId : !person.vehicle))
  const result = { phase, occupied, occupants: before.party.map(({ id, hp, vehicle }) => ({ id, hp, vehicle })), checks: [] }
  let previous = before
  for (const name of ['Select warrior', 'Select follower']) {
    for (const modifiers of [[], ['Control'], ['Shift']]) {
      const label = `${phase}: ${name} ${modifiers[0] ?? 'single'}`
      await input.action(`${label} Escape-clear`, () => page.keyboard.press('Escape'))
      const cleared = await state(`${label} cleared`)
      assert.deepEqual(cleared.selected, [], 'Escape must clear the existing crew first')
      const query = mission10SelectionQuery(cleared.selectionState)
      if (!result.query) result.query = query
      else assert.deepEqual(query, result.query, 'Paused pre-action selection query changed')
      mission10EscapePreserved(previous.selectionState, cleared.selectionState)
      for (const key of ['turn', 'orders', 'randomState', 'boat', 'party'])
        assert.deepEqual(cleared[key], before[key], `Escape preserves ${key}`)
      const expected = mission10ExpectedSelection(query, name, modifiers[0] ?? 'single')
      await input.action(label, () => page.getByRole('button', { name, exact: true }).click({ modifiers }))
      const after = await state(`${label} selected`)
      const selected = [...after.selected].sort((a, b) => a - b)
      assert.deepEqual(selected, expected.selected, 'Exact original-contract class/Total selection differs')
      if (occupied) assert.ok(party.every(id => selected.includes(id)), 'Class/Total must acquire all five occupants, including Shaman')
      mission10SelectionPreserved(cleared.selectionState, after.selectionState)
      assert.equal(after.paused, true)
      assert.equal(after.turn, before.turn)
      assert.deepEqual(after.orders, before.orders, 'HUD selection preserves commands')
      assert.deepEqual(after.randomState, before.randomState, 'HUD selection preserves RNG')
      assert.deepEqual(after.boat, before.boat, 'HUD selection preserves craft and passenger slots')
      assert.deepEqual(after.party, before.party, 'HUD selection preserves live passenger activity')
      previous = after
      result.checks.push({ name, modifier: modifiers[0] ?? 'single', cleared: cleared.selected, selected, primary: expected.primary, preserved: true })
    }
  }
  if (!entering.paused) await input.resume()
  return result
}
// Two separate browser processes with one task-owned profile. Public inputs and
// real RAF only; no CPU checkpoint import, world writes, tick calls or seeded win.
export default async function ({ page, openMission, output, receipt, observeCheckpoint, signal, createInput = createMission1VaultInput, findBoatPoint = null, deadlineAt = null }) {
  assert.ok(receipt.profile, 'Use a dedicated --profile, same origin/source for both runs')
  const report = { method: 'Authored M10, trusted HUD/mouse input, real RAF, public Save and Load across browser termination',
    limits: 'Fresh acquisition declares M10 availability only, not earned prior campaign history; reused profiles are never reseeded. Bounded boarding and same-shore unload; not sea traversal, mission completion, campaign unlock, native parity or hardware performance',
    source: receipt.source, phase: receipt.profile.mode, actions: [], observations: [], selection: [] }
  const save = () => writeFileSync(resolve(output, 'boat-checkpoint.json'), JSON.stringify(report, null, 2) + '\n')
  const state = async label => {
    const row = await readMission10Observation(page, { label, party, boatId })
    report.observations.push(row); save(); return row
  }
  const input = createInput({ page, signal, report, save, originalShamanId: 63, deadlineAt })
  const boatPoint = () => findBoatPoint ? findBoatPoint(page, boatId) : page.evaluate(async id => {
    const s = window.testSceneRef.current, v = s.world.vehicles.find(v => v.id === id)
    const { browserPosition } = await import('/app/world-coordinates.ts')
    const target = browserPosition(v), p = s.screen(target), r = s.renderer.domElement.getBoundingClientRect()
    const center = { x: r.left + (p.x + 1) * r.width / 2, y: r.top + (1 - p.y) * r.height / 2 }
    for (let radius = 0; radius <= 40; radius += 4) for (let i = 0; i < 16; i++) {
      const x = center.x + radius * Math.cos(i * Math.PI / 8), y = center.y + radius * Math.sin(i * Math.PI / 8)
      if (document.elementFromPoint(x, y) !== s.renderer.domElement) continue
      const event = { clientX: x, clientY: y }
      if (!s.pickUnit(event) && s.pickWorldObject(event)?.id === id) return { x, y, target }
    }
    throw Error('No exposed authored Boat interior')
  }, boatId)
  const capture = name => page.screenshot({ path: resolve(output, name + '.png') })
  try {
    if (receipt.profile.mode === 'created') {
      assert.equal(receipt.profile.checkpointAtStart, null)
      // Declared M10 availability only; prior campaign progression was not earned.
      await openMission(10, { campaignFixture: true })
      await page.waitForFunction(() => !window.testSceneRef.current.world.inputMask)
      await state('authored-start')
      await input.view({ x: 27, z: -27 })
      await clearPortraitSelection(page, { signal, timeout: deadlineAt === null ? 2500 : Math.min(2500, deadlineAt - Date.now()) })
      await page.getByRole('button', { name: 'Select shaman', exact: true }).click()
      await page.getByRole('button', { name: 'Select warrior', exact: true }).click({ modifiers: ['Shift'] })
      const selected = await state('HUD-selected')
      assert.deepEqual([...selected.selected].sort((a,b)=>a-b), party)
      await input.view({ x: 27, z: -27 })
      const ground = await input.fixedGround({ x: 27, z: -27 })
      report.actions.push({ label: 'rally-ground', ground }); save()
      assert.equal(ground.rejection, null)
      await input.action('ordinary rally click', () => page.mouse.click(ground.x, ground.y))
      await page.waitForFunction(ids => ids.every(id => { const u = window.testSceneRef.current.world.units.find(u => u.id === id); return u && u.hp > 0 && Math.hypot(u.x - 27, u.z + 27) < 4 }), party, { timeout: 60000 })
      const rallied = await state('rallied')
      assert.deepEqual([...rallied.selected].sort((a,b)=>a-b), party)
      const hit = await boatPoint()
      report.actions.push({ label: 'boat-target', hit }); save()
      await input.action('ordinary Boat boarding click', () => page.mouse.click(hit.x, hit.y))
      await page.waitForFunction(({ party, boatId }) => { const w = window.testSceneRef.current.world, v = w.vehicles.find(v => v.id === boatId); return party.every(id => v.passengers.includes(id) && w.units.find(u => u.id === id)?.native?.vehicle === boatId) }, { party, boatId }, { timeout: 60000 })
      await state('boarded'); await capture('boarded')
      report.selection.push(await checkMission10FollowerStrip({ page, input, state, phase: 'boarded', occupied: true })); save()
      await capture('boarded-class-selected')
      await page.getByRole('button', { name: 'Menu', exact: true }).click()
      const menu = page.locator('dialog[data-original-pause-menu]'); await menu.waitFor({ state: 'visible' })
      await menu.getByRole('button', { name: 'Save Game', exact: true }).click()
      const before = await state('save-menu')
      assert.equal(before.paused, true)
      await capture('before-public-save')
      report.actions.push({ label: 'public Save single click', phase: 'before', at: new Date().toISOString(), timeoutMs: 150000 }); save()
      await menu.getByRole('button', { name: 'Save checkpoint', exact: true }).click({ timeout: 150000 })
      report.actions.push({ label: 'public Save single click', phase: 'after', at: new Date().toISOString() }); save()
      let observed
      assert.equal(await waitForCheckpointReadback(async () => { signal.throwIfAborted(); observed = await observeCheckpoint('Occupied Boat public Save'); return observed.checkpoint?.level === 10 && observed.checkpoint.turn === before.turn }), true)
      report.saved = observed; report.status = 'passed'; await capture('saved-occupied-boat'); save()
      return report
    }
    const saved = receipt.profile.checkpointAtStart
    assert.equal(saved?.level, 10)
    assert.ok(receipt.profile.previousRun.cleanupVerified)
    await page.evaluate(() => {
      const main = document.querySelector('main'); let fiber = main[Object.keys(main).find(k => k.startsWith('__reactFiber'))], store
      for (; fiber && !store; fiber = fiber.return) for (let h = fiber.memoizedState; h; h = h.next) if (h.memoizedState?.getWorld && h.memoizedState?.subscribe) { store = h.memoizedState; break }
      if (!store) throw Error('Store unavailable before public Load')
      const before = store.getWorld(); window.boatLoadBoundary = null; window.boatLoadError = null
      const unsubscribe = store.subscribe(() => { const world = store.getWorld(); if (world === before) return
        try { window.boatLoadBoundary = { version: 3, world: structuredClone(world) } } catch (e) { window.boatLoadError = String(e) } finally { unsubscribe() }
      })
    })
    report.actions.push({ label: 'public Load Game', phase: 'before', at: new Date().toISOString() }); save()
    await page.getByRole('dialog', { name: 'Main menu', exact: true }).getByRole('button', { name: 'Load Game', exact: true }).click()
    report.actions.push({ label: 'public Load Game', phase: 'after', at: new Date().toISOString() }); save()
    assert.equal(await page.evaluate(() => window.boatLoadError), null)
    const loaded = await page.evaluate(checkpointObservation, { observationName: 'boatLoadBoundary' })
    for (const key of ['level','turn','time','actorsSha256','terrainSha256','stockSha256']) assert.deepEqual(loaded[key], saved[key], `Load boundary ${key}`)
    report.loaded = loaded; report.saved = saved; save()
    await bindGame(page)
    const restored = await state('loaded-occupied-boat')
    assert.equal(restored.paused, false)
    assert.ok(party.every(id => restored.boat.passengers.includes(id) && restored.party.find(p => p.id === id)?.vehicle === boatId))
    await page.waitForFunction(turn => window.testSceneRef.current.world.turn > turn, saved.turn)
    await input.view({ x: 27, z: -27 })
    await capture('restored-occupied-boat')
    report.selection.push(await checkMission10FollowerStrip({ page, input, state, phase: 'loaded', occupied: true })); save()
    await capture('loaded-class-selected')
    await page.keyboard.press('Escape')
    assert.deepEqual(await page.evaluate(() => window.testSceneRef.current.world.selected), [])
    const hit = await boatPoint()
    await input.action('ordinary Boat right-click inspection', () => page.mouse.click(hit.x, hit.y, { button: 'right' }))
    const unload = page.getByRole('button', { name: 'Unload all passengers', exact: true })
    await unload.waitFor({ state: 'visible', timeout: 10000 })
    assert.equal(await unload.isEnabled(), true)
    await input.action('public Unload all passengers', () => unload.click())
    await page.waitForFunction(({ party, boatId }) => { const w=window.testSceneRef.current.world, v=w.vehicles.find(v=>v.id===boatId); return !v.passengers.some(Boolean) && party.every(id=>{const u=w.units.find(u=>u.id===id);return u&&u.hp>0&&u.native&&!u.native.vehicle&&!(u.native.flags2&0x80000)&&!(u.native.flags4&0x400)}) }, { party, boatId }, { timeout: 60000 })
    report.landed = await state('unloaded-alive'); await capture('unloaded-alive')
    report.selection.push(await checkMission10FollowerStrip({ page, input, state, phase: 'unloaded', occupied: false })); save()
    await capture('unloaded-class-selected')
    report.loaded = loaded; report.saved = saved
    const stored = await observeCheckpoint('After genuine Load and unload')
    assert.equal(stored.checkpoint.checkpointSha256, saved.checkpointSha256)
    report.status = 'passed'; save(); return report
  } catch (error) {
    report.status='failed'; report.error=String(error); save()
    report.failureScreenshot = await retainMission10FailureScreenshot({ page, output, signal, deadlineAt })
    save(); throw error
  }
}
