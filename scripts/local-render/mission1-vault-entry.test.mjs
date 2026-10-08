import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { currentPersonOrder } from '../../app/person-orders.ts'
import * as driverInput from './mission1-vault-input.mjs'

// Use the actual source producer body; erase only its three parameter types.
const source = readFileSync(new URL('../../app/live-movement.ts', import.meta.url), 'utf8')
const start = source.indexOf('export function adoptLiveOrders('), end = source.indexOf('\n// Player clicks append', start)
const adopt = Function('currentPersonOrder', source.slice(start, end).replace('export function adoptLiveOrders(w: World, u: Unit, p: LivePerson)', 'function adoptLiveOrders(w, u, p)') + '\nreturn adoptLiveOrders')(currentPersonOrder)
function queued() {
  const order = { model: 33, flags: 0, references: 1, object: 0, a: 2, b: 0 }
  const p = { id: 30, commands: [14], commandCursor: 0, immediateCommand: 0, workTarget: 0,
    commandPhase: 0, flags2: 0x40000000, timer: 0 }
  const w = { buildingOrders: { records: [] } }; w.buildingOrders.records[14] = order
  const u = { id: 30, kind: 'shaman', hp: 100 }; adopt(w, u, p)
  return { id: u.id, kind: u.kind, hp: u.hp, work: u.work, vaultTask: { ...u.vault }, orderId: 14, order,
    orderOwner: { native: u.native === p, registered: true, phase: p.commandPhase, workTarget: p.workTarget, flags2: p.flags2, timer: p.timer } }
}
function accepts(u) {
  if (driverInput.isQueuedMission1VaultEntry) return driverInput.isQueuedMission1VaultEntry(u, 2)
  // Exact baseline command33 recipient expression, retained for semantic red.
  const text = readFileSync(new URL('./mission1-vault-input.mjs', import.meta.url), 'utf8')
  const expression = text.match(/command === 33 \? (unit\.work[^\n]+?) :\n/)[1]
  return Function('unit', 'hit', `return (${expression})`)(u, { id: 2 })
}

test('actual adoptLiveOrders command33 phase0 is a valid queued entry before later task visits', () => {
  const u = queued()
  assert.deepEqual(u.vaultTask, { head: 2, phase: 0, entering: true, remaining: 0 })
  assert.equal(accepts(u), true)
  const vault = readFileSync(new URL('../../app/vault.ts', import.meta.url), 'utf8')
  const a = vault.indexOf('export function stepVaultTask('), b = vault.indexOf('\nexport function processVaultTask', a)
  const step = Function(vault.slice(a, b).replace('export function stepVaultTask(task: VaultTask, input: VaultInput)', 'function stepVaultTask(task, input)')
    .replace('const actions: VaultAction[]', 'const actions').replace('(phase: number)', '(phase)') + '\nreturn stepVaultTask')()
  step(u.vaultTask, { target: 2, targetValid: true, arrived: false, ready: false, triggerExists: true, adjacent: false, open: false })
  assert.equal(u.vaultTask.phase, 1)
})

test('initial entry rejects wrong, cancelled, orderless, progressed and native-owner mismatches', () => {
  for (const change of [u => { u.order.model = 27 }, u => { u.order.flags = 1 }, u => { u.order.a = 3 },
    u => { u.order.b = 1 }, u => { u.order.references = 0 }, u => { u.order.references = 2 }, u => { delete u.order }, u => { u.orderId = 0 },
    u => { u.work = 3 }, u => { u.vaultTask.head = 3 }, u => { u.vaultTask.phase = 1 }, u => { u.vaultTask.entering = false },
    u => { u.vaultTask.remaining = 2 }, u => { u.orderOwner.native = false }, u => { u.orderOwner.registered = false },
    u => { u.orderOwner.phase = 1 }, u => { u.orderOwner.workTarget = 3 }, u => { u.kind = 'brave' }, u => { u.orderOwner.flags2 = 0 }, u => { u.orderOwner.timer = 2 }, u => { u.hp = 0 }]) {
    const u = queued(); change(u); assert.equal(accepts(u), false)
  }
})
