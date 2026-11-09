export type CreditsInputEvent =
  | { device: 'keyboard'; code: string; down: boolean }
  | { device: 'mouse'; code: 0 | 1 | 2; down: boolean }

export interface CreditsInputState {
  pressed: Set<string>
  released: Set<string>
  code: string | null
  repeatedCode: string | null
  countdown: number
}

/** A fresh browser session, not a reconstruction of native Home's input queue. */
export function freshCreditsInput(): CreditsInputState {
  return { pressed: new Set(), released: new Set(), code: null, repeatedCode: null, countdown: 0 }
}

/** Only the directly proved entry/exit latch resets; repeat and code survive. */
export function resetCreditsEntryLatches(input: CreditsInputState) {
  for (const code of ['Escape', 'mouse0', 'mouse1', 'mouse2']) {
    input.pressed.delete(code)
    input.released.delete(code)
  }
}

/** One ordinary input-pump invocation, before the successful Credits frame. */
export function pumpCreditsInput(input: CreditsInputState, events: readonly CreditsInputEvent[]) {
  let seenDown = false
  for (const event of events) {
    const code = event.device === 'mouse' ? `mouse${event.code}` : event.code
    if (event.device === 'keyboard') input.code = null
    if (event.down) {
      input.pressed.add(code)
      input.released.delete(code)
    } else input.released.add(code)
    if (event.device === 'keyboard' && event.down && !seenDown) {
      input.code = code
      input.repeatedCode = code
      input.countdown = 5
      seenDown = true
    }
  }
  if (!seenDown && input.countdown > 0) {
    input.countdown -= 1
    if (
      input.countdown === 0 &&
      input.repeatedCode !== null &&
      input.pressed.has(input.repeatedCode) &&
      !input.released.has(input.repeatedCode)
    ) {
      input.countdown = 1
      input.code = input.repeatedCode
    }
  }
  const interval = input.code === 'Space' ? 4 : 16
  const exit =
    input.code === 'Escape' ||
    ['mouse0', 'mouse1', 'mouse2'].some(
      code => input.pressed.has(code) && !input.released.has(code)
    )
  input.code = null
  return { interval, exit }
}

/** Native strict now > deadline and 16/4 increments, in caller-supplied units. */
export function advanceCreditsClock(
  now: number,
  deadline: number,
  origin: number,
  interval: number
) {
  if (
    ![now, deadline, origin, interval].every(Number.isSafeInteger) ||
    now < 0 ||
    deadline < 0 ||
    ![4, 16].includes(interval)
  )
    throw new RangeError('Invalid Credits clock')
  const steps = now > deadline ? Math.ceil((now - deadline) / interval) : 0
  const nextOrigin = origin - steps
  const nextDeadline = deadline + steps * interval
  if (!Number.isSafeInteger(nextDeadline) || nextOrigin < -2147483648 || nextOrigin > 2147483647) {
    throw new RangeError('Credits clock range exceeded')
  }
  return { origin: nextOrigin, deadline: nextDeadline }
}

interface PlaybackPorts {
  now: () => number
  schedule: (callback: () => void) => number
  cancel: (id: number) => void
  render: (origin: number) => number
  onReturn: () => void
  onFailure: () => void
}

/**
 * Explicit browser adapter: one input batch per RAF, no OS key repeat, fresh
 * entry state, performance.now milliseconds, pause/rebase on hidden or blurred
 * windows. The original timer's units are not established here. None of those device
 * delivery choices claim native queue, display cadence or focus parity.
 */
export function startCreditsPlayback(ports: PlaybackPorts) {
  let active = true
  let ready = false
  let paused = false
  let handle: number | null = null
  let generation = 0
  let origin = 0
  let deadline = ports.now()
  let input = freshCreditsInput()
  let events: CreditsInputEvent[] = []

  function cancel() {
    generation += 1
    if (handle !== null) ports.cancel(handle)
    handle = null
  }
  function schedule() {
    const expected = ++generation
    handle = ports.schedule(() => {
      if (expected === generation) tick()
    })
  }
  function stop() {
    active = false
    events = []
    input = freshCreditsInput()
    cancel()
  }
  function back() {
    if (!active) return
    stop()
    ports.onReturn()
  }
  function fail() {
    if (!active) return
    stop()
    ports.onFailure()
  }
  function tick() {
    handle = null
    if (!active || paused) return
    try {
      const consumed = pumpCreditsInput(input, events)
      events = []
      if (consumed.exit) {
        back()
        return
      }
      if (ready) {
        const { deadline: nextDeadline, origin: nextOrigin } = advanceCreditsClock(
          ports.now(),
          deadline,
          origin,
          consumed.interval
        )
        deadline = nextDeadline
        origin = ports.render(nextOrigin)
      } else deadline = ports.now()
      if (active) schedule()
    } catch {
      fail()
    }
  }
  schedule()
  return {
    enqueue(event: CreditsInputEvent) {
      if (!active || paused) return
      if (events.length === 256) {
        fail()
        return
      }
      events.push(event)
    },
    setReady(value: boolean) {
      if (!active) return
      ready = value
      deadline = ports.now()
    },
    setPaused(value: boolean) {
      if (!active || paused === value) return
      paused = value
      input = freshCreditsInput()
      events = []
      deadline = ports.now()
      cancel()
      if (!paused) schedule()
    },
    back,
    dispose: stop,
  }
}
