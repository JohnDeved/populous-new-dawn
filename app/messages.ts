import native from './original-messages.json' with { type: 'json' }

export type CampaignMessage = {
  age: number
  position: number
  serial: number
  stringId: number
  flags: number
  height: number
  speed: number
  lifetime: number
}
export type MessageState = { slots: (CampaignMessage | null)[]; nextSerial: number }
export const createMessages = (): MessageState => ({ slots: Array(32).fill(null), nextSerial: 0 })
export const messageText = (stringId: number) =>
  Object.values(native.messages).find(m => m.stringId === stringId)?.text ?? ''
export function messageStringId(number: number) {
  const message = (native.messages as Record<number, { stringId: number }>)[number]
  if (!message) throw new RangeError(`Unimported campaign message ${number}`)
  return message.stringId
}

// 0x430bd0 / 0x430e40, type 3. Other notification classes have different caps
// and deletion-history rules and must not enter this allocator yet.
export function addMessage(
  state: MessageState,
  stringId: number,
  drawRandom: () => number,
  screenHeight = 480
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
  const speed = Math.trunc((native.defaults.speed << 16) / 480)
  let height = Math.trunc((native.defaults.height << 16) / 480)
  if (
    Math.trunc(((Math.imul(screenHeight, height) + Math.trunc(screenHeight / 2)) | 0) / 65536) & 1
  )
    height += 0x88
  const message: CampaignMessage = {
    age: 0,
    position: 0,
    serial: state.nextSerial,
    stringId: stringId & 65535,
    flags: native.defaults.flags | 0x10,
    lifetime: native.defaults.lifetime,
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
}

export const messageTop = (message: CampaignMessage) =>
  Math.trunc((Math.imul(message.position, 480) + 0x8000) / 0x10000)
export const messageHeight = (message: CampaignMessage) =>
  Math.trunc((Math.imul(message.height, 480) + 0x8000) / 0x10000)
// 0x430fe0: type-3 messages have no deletion-history entry.
export function removeMessage(state: MessageState, slot: number) {
  state.slots[slot] = null
}
