import assert from 'node:assert/strict'
import { collapseObservedCampaignMessages } from '../public-keyboard-owner.mjs'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { readMission10Observation } from '../tutorial-browser/mission10-input.mjs'
import { mission10SelectionQuery, mission10ExpectedSelection, mission10SelectionPreserved, mission10EscapePreserved } from './mission10-selection.mjs'
import { checkpointObservation } from './checkpoint-observer.mjs'
import { createMission1VaultInput } from './mission1-vault-input.mjs'
import { bindGame } from '../browser-game.mjs'
import { waitForCheckpointReadback } from '../checkpoint-readback.mjs'

const party = [63, 111, 112, 113, 114]
const boatId = 62

// Escape cancels a selection, but the shipped Page intentionally opens its menu
// from neutral input. Exercise that owner, then return to the same paused World.
export async function clearMission10Selection(page, previous, deadlineAt = null) {
  const neutral = previous.selected.length === 0 && previous.selectionState.mode === null
  const limit = Math.min(Date.now() + 15000, deadlineAt ?? Infinity)
  const remaining = () => {
    const left = limit - Date.now()
    assert.ok(left > 0, 'Mission 10 Escape owner deadline exceeded')
    return left
  }
  remaining()
  const world = await page.evaluateHandle(() => window.testStore.getWorld())
  const handles = [world]
  let failed = false, failure
  const fail = error => { if (!failed) { failed = true; failure = error } }
  const assertOwner = async () => assert.equal(await world.evaluate(owner =>
    window.testStore.getWorld() === owner && window.testSceneRef.current.world === owner &&
    owner.paused && owner.status === 'playing'), true,
  'Escape must retain the exact paused Mission 10 World')
  try {
    await assertOwner()
    const prior = await world.evaluate(owner => ({ selected: [...owner.selected], mode: owner.mode }))
    assert.deepEqual(prior, { selected: previous.selected, mode: previous.selectionState.mode },
      'Escape must act on the immediately observed selection and mode')
    const menu = page.getByRole('dialog', { name: 'Game menu', exact: true })
    assert.equal(await menu.isVisible(), false, 'No menu may already own the clearing input')
    remaining()
    await page.keyboard.press('Escape')
    await assertOwner()
    if (neutral) {
      await menu.waitFor({ state: 'visible', timeout: remaining() })
      const owner = await menu.elementHandle({ timeout: remaining() })
      assert.ok(owner, 'Neutral Escape must expose its exact menu owner')
      handles.push(owner)
      assert.equal(await owner.evaluate(element => element.isConnected && element.open &&
        element.getAttribute('data-panel') === 'root' &&
        document.querySelector('dialog[data-original-pause-menu]') === element), true,
      'Neutral Escape must open the actual root Game menu')
      const resume = await owner.$('button[aria-label="Continue Game"]')
      assert.ok(resume, 'Exact root menu must retain its Continue Game control')
      handles.push(resume)
      await assertOwner()
      await resume.click({ timeout: remaining() })
      await menu.waitFor({ state: 'hidden', timeout: remaining() })
      assert.equal(await owner.evaluate(element => !element.open && !element.isConnected), true,
        'Continue Game must close and release the exact menu owner')
    } else {
      assert.equal(await menu.isVisible(), false, 'Selection Escape must not open a Game menu')
    }
    await assertOwner()
    assert.equal(await menu.isVisible(), false, 'Follower controls require the menu owner to be released')
  } catch (error) { fail(error) }
  finally {
    for (const handle of handles.reverse()) {
      try { await handle.dispose() } catch (error) { fail(error) }
    }
  }
  if (failed) throw failure
}

// Executed only after this scenario has observed genuine boarding/restoration or
// completed public unload. The helper never creates people or edits live World.
export async function checkMission10FollowerStrip({ page, input, state, phase, occupied, deadlineAt = null, observeKeyboard = () => {} }) {
  const entering = await state(`${phase}-before-strip`)
  if (!entering.paused) await input.pause()
  await input.action(`${phase} public keyboard-owner setup`, () => collapseObservedCampaignMessages(page, {
    remainingMs: () => deadlineAt === null ? 25000 : deadlineAt - Date.now(),
    observe: observation => observeKeyboard({ stripPhase: phase, ...observation }),
  }))
  const before = await state(`${phase}-strip-paused`)
  assert.equal(before.paused, true)
  assert.ok(before.party.every(person => person && person.hp > 0))
  assert.ok(before.party.every(person => occupied ? person.vehicle === boatId : !person.vehicle))
  const result = { phase, occupied, occupants: before.party.map(({ id, hp, vehicle }) => ({ id, hp, vehicle })), checks: [] }
  let previous = before
  for (const name of ['Select warrior', 'Select follower']) {
    for (const modifiers of [[], ['Control'], ['Shift']]) {
      const label = `${phase}: ${name} ${modifiers[0] ?? 'single'}`
      await input.action(`${label} Escape-clear`, () => clearMission10Selection(page, previous, deadlineAt))
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
    limits: 'Bounded boarding and same-shore unload; not sea traversal, mission completion, campaign unlock, native parity or hardware performance',
    source: receipt.source, phase: receipt.profile.mode, actions: [], observations: [], selection: [] }
  const save = () => writeFileSync(resolve(output, 'boat-checkpoint.json'), JSON.stringify(report, null, 2) + '\n')
  const state = async label => {
    const row = await readMission10Observation(page, { label, party, boatId })
    report.observations.push(row); save(); return row
  }
  const observeKeyboard = observation => {
    (report.keyboardOwnership ??= []).push(observation); save()
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
      await openMission(10)
      await page.waitForFunction(() => !window.testSceneRef.current.world.inputMask)
      await state('authored-start')
      await input.view({ x: 27, z: -27 })
      await page.keyboard.press('Escape')
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
      report.selection.push(await checkMission10FollowerStrip({ page, input, state, phase: 'boarded', occupied: true, deadlineAt, observeKeyboard })); save()
      await capture('boarded-class-selected')
      await page.getByRole('button', { name: 'Game settings', exact: true }).click()
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
    report.selection.push(await checkMission10FollowerStrip({ page, input, state, phase: 'loaded', occupied: true, deadlineAt, observeKeyboard })); save()
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
    report.selection.push(await checkMission10FollowerStrip({ page, input, state, phase: 'unloaded', occupied: false, deadlineAt, observeKeyboard })); save()
    await capture('unloaded-class-selected')
    report.loaded = loaded; report.saved = saved
    const stored = await observeCheckpoint('After genuine Load and unload')
    assert.equal(stored.checkpoint.checkpointSha256, saved.checkpointSha256)
    report.status = 'passed'; save(); return report
  } catch (error) { report.status='failed'; report.error=String(error); save(); throw error }
}
