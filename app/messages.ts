import native from './original-messages.json' with {type: 'json'};

export type CampaignMessage = {
  age: number; serial: number; stringId: number; flags: number;
  height: number; speed: number; lifetime: number;
};
export type MessageState = {slots: (CampaignMessage | null)[]; nextSerial: number};
export const createMessages = (): MessageState => ({slots: Array(32).fill(null), nextSerial: 0});
export const messageText = (stringId: number) => Object.values(native.messages).find(m => m.stringId === stringId)?.text ?? '';
export function messageStringId(number: number) {
  const message = (native.messages as Record<number, {stringId: number}>)[number];
  if (!message) throw new RangeError(`Unimported campaign message ${number}`);
  return message.stringId;
}

// 0x430bd0 / 0x430e40, type 3. Other notification classes have different caps
// and deletion-history rules and must not enter this allocator yet.
export function addMessage(state: MessageState, stringId: number, drawRandom: () => number, screenHeight = 480) {
  let slot = state.slots.indexOf(null);
  if (slot < 0) {
    let oldest = 0;
    for (let i = 0; i < state.slots.length; i++) {
      const message = state.slots[i]!;
      if ((message.flags & 1) && message.age > oldest) { oldest = message.age; slot = i; }
    }
    // Native selection is uninitialized if every occupied slot has age zero.
    if (slot < 0) throw new Error('No aged notification can be replaced');
  }
  const speed = Math.trunc((native.defaults.speed << 16) / 480);
  let height = Math.trunc((native.defaults.height << 16) / 480);
  if (Math.trunc(((Math.imul(screenHeight,height) + Math.trunc(screenHeight/2)) | 0) / 65536) & 1) height += 0x88;
  const message: CampaignMessage = {
    age: 0, serial: state.nextSerial, stringId: stringId & 65535,
    flags: native.defaults.flags | 0x10, lifetime: native.defaults.lifetime,
    height,
    speed: speed + drawRandom() % Math.trunc(speed / 2),
  };
  state.nextSerial = (state.nextSerial + 1) & 65535;
  state.slots[slot] = message;
  return slot;
}
// 0x430fe0: type-3 messages have no deletion-history entry.
export function removeMessage(state: MessageState, slot: number) { state.slots[slot] = null; }
