import art from './original-group-digits.json' with { type: 'json' }

// Group-number display above members (issue #1005). Native evidence:
// decomp/research/follower-groups.md. Timers 0089d168..0089d16d (groups 1-6)
// count native draw_main iterations, run here on the browser's 24 Hz
// presentation convention. -1 is Comma's 0xff hold, which never counts down.
// `last` is the previous step's clock reading and `time` the partial tick.
export type FollowerGroupDisplay = {
  timers: Int8Array
  held: number
  time: number
  last: number | null
}

const TICK = 1 / 24,
  SHOW = 6

export function createFollowerGroupDisplay(): FollowerGroupDisplay {
  return { timers: new Int8Array(6), held: 0, time: 0, last: null }
}

function show(d: FollowerGroupDisplay, slot: number) {
  if (d.timers[slot - 1] !== -1) d.timers[slot - 1] = SHOW
}

// 0047c350 tail: assignment and recall of slots 1-6 start a 6-iteration timer,
// unless Comma is holding it. Slot 0 (Shift+Backspace) has no display.
export function showFollowerGroup(d: FollowerGroupDisplay, slot: number) {
  if (slot >= 1 && slot <= 6) show(d, slot)
}

type DisplayKey = Pick<KeyboardEvent, 'code' | 'shiftKey' | 'ctrlKey' | 'altKey' | 'metaKey'>

// 004adbb0 (004ae0fc..004ae1c1) refreshes the timer of every held number-row
// key 1-6 each iteration, whatever the modifiers. Comma press 0xb7 (record
// 005d6250, no modifiers) holds all six at 0xff; release 0xb8 (005d625c, any
// modifiers) clears all six, including timers a group key started.
export function followerGroupDisplayKey(d: FollowerGroupDisplay, event: DisplayKey, down: boolean) {
  const digit = /^Digit([1-6])$/.exec(event.code)
  if (digit) {
    const bit = 1 << (Number(digit[1]) - 1)
    d.held = down ? d.held | bit : d.held & ~bit
  } else if (event.code === 'Comma') {
    if (!down) d.timers.fill(0)
    else if (!event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) d.timers.fill(-1)
  }
}

// Focus loss or a modal drops held keys without key-up events: release them.
export function releaseFollowerGroupDisplayKeys(d: FollowerGroupDisplay) {
  d.held = 0
  if (d.timers.includes(-1)) d.timers.fill(0)
}

// Per draw_main iteration: input service 004aa4e0 refreshes held digits, then
// 0041c120 decrements every positive timer. `now` is a monotonic clock in
// seconds; after 6 iterations nothing else changes, so long gaps are bounded.
export function stepFollowerGroupDisplay(d: FollowerGroupDisplay, now: number) {
  const dt = d.last === null ? 0 : Math.max(0, now - d.last)
  d.last = now
  d.time += dt
  const ticks = Math.floor((d.time + 1e-9) / TICK)
  if (!ticks) return
  d.time = Math.max(0, d.time - ticks * TICK)
  for (let tick = Math.min(ticks, SHOW + 1); tick > 0; tick--)
    for (let i = 0; i < 6; i++) {
      if (d.held & (1 << i)) show(d, i + 1)
      if (d.timers[i] > 0) d.timers[i]--
    }
}

export function followerGroupDisplayActive(d: FollowerGroupDisplay) {
  return d.timers.some(Boolean)
}

// Person renderer 00469515..004695ff: for the local player's people only, the
// numbers of member groups whose timer is nonzero, collected from 6 down to 1.
export function followerGroupDigits(groups: number, timers: ArrayLike<number>) {
  const digits: number[] = []
  for (let slot = 6; slot >= 1; slot--)
    if (timers[slot - 1] && groups & (1 << slot)) digits.push(slot)
  return digits
}

// 00469610..0046979f, relative to the person's screen origin. F00T8's 'A'
// (9x15) centres the column and spaces it: the first digit sits one 'A' height
// above the selection arrow height (frame height when selected, otherwise
// 24/32 of it) and each later digit is drawn trunc(15*24/32) = 11 px higher.
export function followerGroupDigitPlacement(index: number, selected: boolean, frameHeight: number) {
  const { w, h } = art.reference
  return {
    x: -Math.trunc(w / 2),
    y:
      -h -
      (selected ? frameHeight : Math.trunc((frameHeight * 24) / 32)) -
      index * Math.trunc((h * 24) / 32),
  }
}

export function followerGroupDigitArt(digit: number) {
  const rect = art.rects[String(digit) as keyof typeof art.rects]
  return {
    width: rect.w,
    height: rect.h,
    uv: [
      rect.w / art.width,
      rect.h / art.height,
      rect.x / art.width,
      1 - (rect.y + rect.h) / art.height,
    ] as const,
  }
}
