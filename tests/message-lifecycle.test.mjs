import test from 'node:test'
import assert from 'node:assert/strict'
import { createMessages, addMessage, stepMessages, removeMessage } from '../app/messages.ts'

test('message expiration occurs before motion, rebound and pending popup consumption', () => {
  const state = createMessages()
  const slot = addMessage(state, 615, () => 0), message = state.slots[slot]
  Object.assign(message, { lifetime: 1, position: 0x10000, speed: 0x2000 })
  message.flags |= 0x20000
  const before = { ...message }, serial = state.nextSerial
  let rebounds = 0
  stepMessages(state, () => rebounds++)
  assert.equal(state.slots[slot], null)
  assert.deepEqual(message, { ...before, lifetime: 0 }, 'expired record does not move or consume its pending flag')
  assert.equal(rebounds, 0)
  assert.equal(state.nextSerial, serial)
  const persistentSlot = addMessage(state, 616, () => 0), persistent = state.slots[persistentSlot]
  assert.equal(persistent.lifetime, 0)
  stepMessages(state)
  assert.equal(state.slots[persistentSlot], persistent, 'zero lifetime is persistent, not expired')
})

test('full zero-age notifications reject insertion before drawing RNG or mutating state', () => {
  const state = createMessages()
  for (let i = 0; i < 32; i++) addMessage(state, 615 + i, () => 0)
  const before = structuredClone(state)
  let randomCalls = 0
  assert.throws(() => addMessage(state, 700, () => { randomCalls++; return 0 }), /No aged notification can be replaced/)
  assert.deepEqual(state, before)
  assert.equal(randomCalls, 0)
})

test('full slots replace the first oldest aged notification, not a type-one popup', () => {
  const state = createMessages()
  addMessage(state, 615, () => 0, 480, 1)
  for (let i = 1; i < 32; i++) addMessage(state, 615 + i, () => 0)
  state.slots.forEach(message => { message.age = 1 })
  state.slots[0].age = 100
  state.slots[3].age = state.slots[7].age = 10
  const before = state.slots.slice()
  let randomCalls = 0
  const slot = addMessage(state, 700, () => { randomCalls++; return 0 })
  assert.equal(slot, 3)
  assert.equal(state.slots[slot].serial, 32)
  assert.equal(state.slots[slot].stringId, 700)
  assert.equal(randomCalls, 1)
  for (let i = 0; i < 32; i++) if (i !== slot) assert.equal(state.slots[i], before[i])
})

test('new type-one popup removes only the previous popup and preserves notification identity', () => {
  const state = createMessages()
  const old = addMessage(state, 615, () => 0, 480, 1)
  const notificationSlot = addMessage(state, 616, () => 0), notification = state.slots[notificationSlot]
  const next = addMessage(state, 617, () => 0, 480, 1)
  assert.equal(state.slots[old], null)
  assert.equal(next, 2)
  assert.equal(state.slots[next].stringId, 617)
  assert.equal(state.slots[notificationSlot], notification)
  assert.equal(state.slots.filter(Boolean).length, 2)
  assert.equal(state.nextSerial, 3)
})

test('dismissed slots are reused without changing other messages and serials retain16-bit wrap', () => {
  const state = createMessages()
  state.nextSerial = 65535
  const dismissed = addMessage(state, 615, () => 0)
  assert.equal(state.slots[dismissed].serial, 65535)
  const keptSlot = addMessage(state, 616, () => 0), kept = state.slots[keptSlot]
  assert.equal(kept.serial, 0)
  removeMessage(state, dismissed)
  const next = addMessage(state, 617, () => 0)
  assert.equal(next, dismissed)
  assert.equal(state.slots[next].serial, 1)
  assert.equal(state.slots[keptSlot], kept)
  assert.equal(state.nextSerial, 2)
})
