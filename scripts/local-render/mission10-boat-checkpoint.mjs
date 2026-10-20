import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { checkpointObservation } from './checkpoint-observer.mjs'
import { createMission1VaultInput } from './mission1-vault-input.mjs'
import { bindGame } from '../browser-game.mjs'
import { waitForCheckpointReadback } from '../checkpoint-readback.mjs'

const party = [63, 111, 112, 113, 114]
const boatId = 62
// Two separate harness processes with one task-owned profile. Public inputs and
// real RAF only; no CPU checkpoint import, world writes, tick calls or seeded win.
export default async function ({ page, openMission, output, receipt, observeCheckpoint, signal }) {
  assert.ok(receipt.profile, 'Use a dedicated --profile, same origin/source for both runs')
  const report = { method: 'Authored M10, trusted HUD/mouse input, real RAF, public Save and Load across browser termination',
    limits: 'Bounded boarding and same-shore unload; not sea traversal, mission completion, campaign unlock, native parity or hardware performance',
    source: receipt.source, phase: receipt.profile.mode, actions: [], observations: [] }
  const save = () => writeFileSync(resolve(output, 'boat-checkpoint.json'), JSON.stringify(report, null, 2) + '\n')
  const state = async label => {
    const row = await page.evaluate(({ label, party, boatId }) => {
      const s = window.testSceneRef.current, w = s.world, boat = w.vehicles.find(v => v.id === boatId)
      const gl = s.renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info')
      return { label, wallTime: Date.now(), turn: w.turn, time: w.time, level: w.outcome.level,
        renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), contextLost: gl.isContextLost(),
        counts: { units: w.units.length, vehicles: w.vehicles.length, buildings: w.buildings.length, secondary: w.secondaryEffects.slots.length },
        paused: w.paused, inputMask: w.inputMask, selected: [...w.selected], status: w.status,
        boat: boat && { id: boat.id, x: boat.x, y: boat.y, active: boat.active, passengers: [...boat.passengers] },
        party: party.map(id => { const u = w.units.find(u => u.id === id); return u && { id, kind: u.kind, hp: u.hp, x: u.x, z: u.z, vehicle: u.native?.vehicle, state: u.native?.state, flags2: u.native?.flags2, flags4: u.native?.flags4 } }),
        panels: [...document.querySelectorAll('.vehicle-panel')].map(e => ({ text: e.textContent, visible: !!e.getClientRects().length })) }
    }, { label, party, boatId })
    report.observations.push(row); save(); return row
  }
  const input = createMission1VaultInput({ page, signal, report, save, originalShamanId: 63 })
  const boatPoint = () => page.evaluate(async id => {
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
      await page.getByRole('button', { name: 'Select and focus shaman', exact: true }).click()
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
      await page.getByRole('button', { name: 'Game settings', exact: true }).click()
      const menu = page.locator('dialog.game-dialog'); await menu.waitFor({ state: 'visible' })
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
    await page.getByRole('dialog', { name: 'Main menu', exact: true }).getByRole('button', { name: 'Load Game', exact: true }).click()
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
    await page.keyboard.press('Escape')
    assert.deepEqual(await page.evaluate(() => window.testSceneRef.current.world.selected), [])
    const hit = await boatPoint()
    await input.action('ordinary Boat right-click inspection', () => page.mouse.click(hit.x, hit.y, { button: 'right' }))
    const unload = page.getByRole('button', { name: 'Unload all passengers', exact: true })
    await unload.waitFor({ state: 'visible', timeout: 10000 })
    assert.equal(await unload.isEnabled(), true)
    await unload.click()
    await page.waitForFunction(({ party, boatId }) => { const w=window.testSceneRef.current.world, v=w.vehicles.find(v=>v.id===boatId); return !v.passengers.some(Boolean) && party.every(id=>{const u=w.units.find(u=>u.id===id);return u&&u.hp>0&&u.native&&!u.native.vehicle&&!(u.native.flags2&0x80000)&&!(u.native.flags4&0x400)}) }, { party, boatId }, { timeout: 60000 })
    report.landed = await state('unloaded-alive'); await capture('unloaded-alive')
    report.loaded = loaded; report.saved = saved
    const stored = await observeCheckpoint('After genuine Load and unload')
    assert.equal(stored.checkpoint.checkpointSha256, saved.checkpointSha256)
    report.status = 'passed'; save(); return report
  } catch (error) { report.status='failed'; report.error=String(error); save(); throw error }
}
