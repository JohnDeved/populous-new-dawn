import test from 'node:test'
import assert from 'node:assert/strict'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

test('0043c7a0 authored Vault prayer keeps the command and re-enters approach on lost arrival', async () => {
  await loadSceneFixture()
  const { command, createWorld, select, tick } = await import('../app/model.ts')
  const { currentPersonOrder } = await import('../app/person-orders.ts')
  const { finishLevelStart } = await import('./level-start-fixture.mjs')
  const w = finishLevelStart(createWorld(3))
  const shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
  const vault = w.shrines.find(s => s.kind === 'vault' && s.reward === 'temple')
  assert.ok(shaman && vault)
  select(w, 'shaman')
  assert.equal(command(w, vault), true)
  const p = shaman.native
  const order = () => currentPersonOrder(w.buildingOrders, p)
  const cell = n => ((n.y & 0xffff) >>> 9) * 128 + ((n.x & 0xffff) >>> 9)
  let livePrayer = false
  for (let i = 0; i < 4000 && !livePrayer; i++) {
    const phase = p.commandPhase, work = vault.work
    tick(w, 1 / 12)
    livePrayer = phase === 2 && p.commandPhase === 2 && vault.work > work
  }
  assert.ok(livePrayer, 'authored task must already be praying on ordinary ticks')
  assert.equal(w.objectCells.objects.get(shaman.id), p)
  assert.equal(order()?.model, 33)
  assert.equal(order()?.a, vault.id)
  assert.deepEqual([p.goalX, p.goalY], [58112, 30976])
  const originalCell = cell(p)
  // Supply position only, keeping the actual live cell, actor, goal and phase.
  p.x = p.goalX + 11
  assert.equal(cell(p), originalCell)
  tick(w, 1 / 12)
  assert.equal(p.commandPhase, 2, 'inclusive native arrival boundary')
  p.x = p.goalX + 12
  assert.equal(cell(p), originalCell)
  tick(w, 1 / 12)
  assert.equal(p.commandPhase, 1, 'position one unit beyond arrival resumes approach')
  assert.ok(p.flags2 & 0x40000000, 'first-entry bit for reapproach')
  assert.equal(w.objectCells.objects.get(shaman.id), p)
  assert.equal(order()?.model, 33)
  assert.equal(order()?.a, vault.id)
})
