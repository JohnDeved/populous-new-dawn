import native from './original-messages.json' with { type: 'json' }
import { browserPosition } from './world-coordinates.ts'

export type CampaignMessage = {
  age: number
  position: number
  serial: number
  stringId: number
  flags: number
  height: number
  speed: number
  lifetime: number
  view?: { cell: number; payload: number }
}
export type MessageState = { slots: (CampaignMessage | null)[]; nextSerial: number }
export const createMessages = (): MessageState => ({ slots: Array(32).fill(null), nextSerial: 0 })
export const messageText = (stringId: number) =>
  Object.values(native.messages).find(m => m.stringId === stringId)?.text ?? ''
export const messageIcon = (message: CampaignMessage) =>
  message.flags & 1 ? '/original/message.png' : '/original/message-type1.png'
export const messageViewPoint = (message: CampaignMessage) =>
  message.view
    ? browserPosition({
        x: (((message.view.cell & 254) + 1) << 8) & 65535,
        y: (((message.view.cell >> 8) & 254) + 1) << 8,
      })
    : null
export function messageStringId(number: number) {
  const message = (native.messages as Record<number, { stringId: number }>)[number]
  if (!message) throw new RangeError(`Unimported campaign message ${number}`)
  return message.stringId
}

// 0x430bd0 / 0x430e40, imported type-3 and Mission 2 type-1 profiles.
export function addMessage(
  state: MessageState,
  stringId: number,
  drawRandom: () => number,
  screenHeight = 480,
  type: 1 | 3 = 3
) {
  let slot = state.slots.indexOf(null)
  if (slot < 0) {
    let oldest = 0
    for (let i = 0; i < state.slots.length; i++) {
      const message = state.slots[i]!
      if (message.flags & 1 && message.age > oldest) {
        oldest = message.age
        slot = i
      }
    }
    // Native selection is uninitialized if every occupied slot has age zero.
    if (slot < 0) throw new Error('No aged notification can be replaced')
  }
  if (type === 1) {
    const prior = state.slots.findIndex(message => message && !(message.flags & 1))
    if (prior >= 0) state.slots[prior] = null
  }
  const defaults = type === 1 ? native.type1 : native.defaults,
    speed = Math.trunc((defaults.speed << 16) / 480)
  let height = Math.trunc((defaults.height << 16) / 480)
  if (
    Math.trunc(((Math.imul(screenHeight, height) + Math.trunc(screenHeight / 2)) | 0) / 65536) & 1
  )
    height += 0x88
  const message: CampaignMessage = {
    age: 0,
    position: 0,
    serial: state.nextSerial,
    stringId: stringId & 65535,
    flags: defaults.flags | 0x10,
    lifetime: defaults.lifetime,
    height,
    speed: speed + (drawRandom() % Math.trunc(speed / 2)),
  }
  state.nextSerial = (state.nextSerial + 1) & 65535
  state.slots[slot] = message
  return slot
}

// 0x431a80 / 0x431c40, type 3. The native list is oldest-first, with slot
// order breaking equal-age ties; each presentation visit accelerates downward.
export function stepMessages(state: MessageState, rebound = () => {}) {
  for (let slot = 0; slot < state.slots.length; slot++) {
    const message = state.slots[slot]
    if (message && message.lifetime > 0 && --message.lifetime === 0) state.slots[slot] = null
  }
  const messages = state.slots
    .map((message, slot) => ({ message, slot }))
    .filter((entry): entry is { message: CampaignMessage; slot: number } => !!entry.message)
    .sort((a, b) => b.message.age - a.message.age || a.slot - b.slot)
    .map(entry => entry.message)
  const damp = (speed: number) => Math.trunc(Math.imul(speed, 100) / 256)
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i]
    message.position = (message.position + message.speed) | 0
    message.flags &= ~0x40000
    if (message.speed > 0) {
      const target = (i ? messages[i - 1].position : 0x10000) - message.height
      if (message.position >= target) {
        message.flags |= 0x80000
        message.position = target
        if (message.speed > 0x555) {
          let gap = i - 1
          while (gap >= 0) {
            const boundary = gap ? messages[gap - 1].position : 0x10000
            if (boundary - messages[gap].height > messages[gap].position) break
            gap--
          }
          if (gap >= 0) {
            messages[gap].speed = damp(message.speed)
            message.speed = 0
          } else {
            message.speed = -damp(message.speed)
            rebound()
          }
        } else {
          message.speed = 0
          message.flags |= 0x40000
        }
      }
    } else if (message.speed < 0 && i + 1 < messages.length) {
      const target = messages[i + 1].position + messages[i + 1].height
      if (message.position <= target) {
        message.flags |= 0x80000
        message.position = target
        if (message.speed < -0x555) {
          let gap = i + 1
          while (
            gap + 1 < messages.length &&
            messages[gap + 1].position + messages[gap + 1].height >= messages[gap].position
          )
            gap++
          messages[gap].speed = damp(message.speed)
          message.speed = 0
        } else {
          message.speed = 0
          message.flags |= 0x40000
        }
      }
    }
    message.speed = (message.speed + 0x555) | 0
  }
  // 0x4314c0: after motion, consume at most the first oldest pending popup
  // that has reached a collision/settled state. Bit 2 is the transient draw signal
  // set after the popup consumer; the native message renderer clears it on draw.
  for (const message of messages) {
    if (!(message.flags & 0x20000) || !(message.flags & 0xc0000)) continue
    message.flags &= ~0x20000
    if (message.flags & 0x10) message.flags |= 2
    break
  }
}

export const messageTop = (message: CampaignMessage) =>
  Math.trunc((Math.imul(message.position, 480) + 0x8000) / 0x10000)
export const messageHeight = (message: CampaignMessage) =>
  Math.trunc((Math.imul(message.height, 480) + 0x8000) / 0x10000)
// 0x430fe0: type-3 messages have no deletion-history entry.
export function removeMessage(state: MessageState, slot: number) {
  state.slots[slot] = null
}
