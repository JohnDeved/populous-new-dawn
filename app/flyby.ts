// Reviewed flyby reconstruction: 0x449240, 0x449320, 0x449670–0x44a1e0.
// Positions are signed 16-bit native coordinates, angles 0..2047, zoom ±16384.
export type FlybyCamera = { x: number; y: number; angle: number; zoom: number }
export type FlybyEvent = {
  kind: number
  flags: number
  value: number
  start: number
  duration: number
}
export type FlybyAxis = {
  acceleration: number
  braking: number
  cruise: number
  velocity: number
  initial: number
  accelerateUntil: number
  brakeFrom: number
}
const short = (n: number) => (n << 16) >> 16
const f32 = Math.fround
export const createFlybyAxis = (): FlybyAxis => ({
  acceleration: 0,
  braking: 0,
  cruise: 0,
  velocity: 0,
  initial: 0,
  accelerateUntil: 0,
  brakeFrom: 0,
})

// Preserve the x87 stores to float32; rounding every arithmetic operation differs.
export function planFlybyAxis(axis: FlybyAxis, distance: number, duration: number) {
  distance |= 0
  duration |= 0
  if (duration === 0 || (distance === -2147483648 && duration === -1))
    throw new RangeError('Native flyby division fault')
  let ramp = f32(Math.max(1, duration / 4))
  let acceleration = f32(Math.trunc(distance / duration) / ramp)
  if (acceleration === 0) acceleration = 1
  const stopping = f32((axis.velocity * axis.velocity) / (acceleration * 2))
  let start: number, cruise: number, braking: number
  if ((distance < 0 && stopping < distance) || (distance > 0 && distance < stopping)) {
    start = acceleration = cruise = 0
    axis.velocity = f32(distance / duration)
    braking = f32(axis.velocity / duration) || 1
    ramp = duration
  } else {
    const extendedStart = -axis.velocity / acceleration + ramp
    start = f32(extendedStart)
    const extendedCruise = (distance + stopping) / (duration - extendedStart - ramp + ramp)
    cruise = f32(extendedCruise)
    acceleration = f32((extendedCruise - axis.velocity) / start)
    braking = f32(cruise / ramp)
  }
  Object.assign(axis, {
    acceleration,
    braking,
    cruise,
    initial: axis.velocity,
    accelerateUntil: start,
    brakeFrom: f32(duration - ramp),
  })
}

export function stepFlybyAxis(axis: FlybyAxis, position: number, frame: number, duration: number) {
  frame = short(frame)
  duration = short(duration)
  if (axis.accelerateUntil !== 0 || axis.cruise !== 0) {
    axis.velocity = f32(
      frame < axis.accelerateUntil
        ? axis.acceleration * frame + axis.initial
        : frame < axis.brakeFrom
          ? axis.cruise
          : (duration - frame) * axis.braking
    )
    axis.velocity = f32(axis.velocity + 0.5)
  }
  return short(Math.trunc(short(position) + axis.velocity))
}

// 0x449670 centers on the even map cell and takes the wrapped shortest route.
export function flybyPositionDelta(coordinate: number, target: number) {
  const delta = short(((target & 254) + 1) * 256) - short(coordinate)
  const magnitude = Math.abs(delta)
  return magnitude & 32768 ? (delta > 0 ? magnitude - 65536 : 65536 - magnitude) : delta
}

export type Flyby = {
  events: FlybyEvent[]
  flags: number
  cursor: number
  warmup: number
  frameRate: number
  averageRate: number
  frame: number
  end: FlybyCamera | null
  tracks: { frame: number; duration: number; active: boolean }[]
  axes: { x: FlybyAxis; y: FlybyAxis; angle: FlybyAxis; zoom: FlybyAxis }
}
export const createFlyby = (): Flyby => ({
  events: [],
  flags: 16,
  cursor: 0,
  warmup: 0,
  frameRate: 0,
  averageRate: 0,
  frame: 0,
  end: null,
  tracks: Array.from({ length: 7 }, () => ({ frame: 0, duration: 0, active: false })),
  axes: {
    x: createFlybyAxis(),
    y: createFlybyAxis(),
    angle: createFlybyAxis(),
    zoom: createFlybyAxis(),
  },
})

export function addFlybyEvent(state: Flyby, event: FlybyEvent) {
  if (state.flags & 1 || state.events.length >= 32) return
  const e = {
    kind: event.kind & 255,
    flags: event.flags & 255,
    value: event.value & 65535,
    start: short(event.start),
    duration: short(event.duration),
  }
  const index = state.events.findIndex(other => e.start < other.start)
  state.events.splice(index < 0 ? state.events.length : index, 0, e)
}

// Arguments here are resolved script values; ON/OFF remains a literal VM token.
export function flybyCommand(state: Flyby, opcode: number, args: number[]) {
  const [a, b, c, d, e] = args
  const packed = (a & 255) | ((b & 255) << 8)
  if (opcode === 1205) Object.assign(state, createFlyby(), { averageRate: state.averageRate })
  else if (opcode === 1206) {
    state.cursor = 0
    state.warmup = 6
    state.flags = (state.flags & 63) | 1
  } else if (opcode === 1207) state.flags &= ~1
  else if (opcode === 1208) state.flags = a ? state.flags | 16 : state.flags & ~16
  else if (opcode === 1214) {
    state.flags |= 4
    state.end = { x: a & 255, y: b & 255, angle: short(c), zoom: short(d) }
  } else if (opcode === 1209 || opcode === 1212)
    addFlybyEvent(state, {
      kind: opcode === 1209 ? 1 : 4,
      flags: 0,
      value: packed,
      start: c,
      duration: d,
    })
  else if (opcode === 1210 || opcode === 1211)
    addFlybyEvent(state, {
      kind: opcode === 1210 ? 2 : 3,
      flags: 0,
      value: opcode === 1210 ? a : Math.trunc((short(a) << 8) / -100),
      start: b,
      duration: c,
    })
  else if (opcode === 1213)
    addFlybyEvent(state, {
      kind: 5,
      flags: c === 0 ? 1 : c === 1 ? 2 : c,
      value: packed,
      start: d,
      duration: e,
    })
  else if (opcode === 1215)
    addFlybyEvent(state, { kind: 6, flags: 0, value: a, start: b, duration: 1 })
  else throw new Error(`Unbound flyby command ${opcode}`)
}

function beginEvent(state: Flyby, camera: FlybyCamera, event: FlybyEvent) {
  const { kind, value, duration } = event
  if (kind < 1 || kind > 6) throw new RangeError('Invalid native flyby track')
  Object.assign(state.tracks[kind], { frame: 0, duration, active: true })
  if (kind === 1) {
    planFlybyAxis(state.axes.x, flybyPositionDelta(camera.x, value & 255), duration)
    planFlybyAxis(state.axes.y, flybyPositionDelta(camera.y, value >> 8), duration)
  } else if (kind === 2) {
    state.tracks[4].active = false
    state.axes.angle.velocity = 0 // Native copies the interest-point track's velocity (zero in mission one).
    const difference = short(value) - short(camera.angle)
    let magnitude = Math.abs(difference)
    let direction = Math.sign(difference)
    if (magnitude > 1024) {
      magnitude = 2048 - magnitude
      direction = -direction
    }
    const forced = (event.flags << 24) >> 24
    if (forced && Math.sign(forced) !== direction && direction) {
      direction = -direction
      magnitude = (2048 - magnitude) & 2047
    }
    planFlybyAxis(state.axes.angle, direction * magnitude, duration)
  } else if (kind === 3) {
    event.value = short(value << 6) & 65535 // Native mutates the queued zoom record.
    planFlybyAxis(state.axes.zoom, short(event.value) - short(camera.zoom), duration)
  } else if (kind === 4) {
    throw new Error('Native flyby interest-point tracking has not been ported')
  }
}

// One call per native draw_main (0x4a4960), independent of simulation turns.
// Returns tooltip/message events for the presentation host, without running UI code.
export function stepFlyby(
  state: Flyby,
  camera: FlybyCamera,
  measuredFrameRate: number,
  paused = false
) {
  const emitted: FlybyEvent[] = []
  if (!(state.flags & 1) || paused) return emitted
  if (state.warmup) {
    state.averageRate = Math.trunc(((state.averageRate + (measuredFrameRate | 0)) | 0) / 2)
    if (--state.warmup === 0) {
      state.frameRate = Math.max(8, Math.min(24, (state.averageRate << 24) >> 24))
      state.frame = 0
      for (const event of state.events) {
        event.start = short(Math.trunc((state.frameRate * event.start) / 10))
        event.duration = short(Math.trunc((state.frameRate * event.duration) / 10))
      }
      camera.zoom = short(camera.zoom << 6)
    }
    return emitted
  }
  while (
    !(state.flags & 8) &&
    state.cursor < state.events.length &&
    state.events[state.cursor].start <= short(state.frame)
  ) {
    const event = state.events[state.cursor++]
    beginEvent(state, camera, event)
    if (event.kind >= 5) emitted.push({ ...event })
  }
  if (state.cursor === state.events.length) state.flags |= 0x48
  for (let kind = 1; kind <= 6; kind++) {
    const track = state.tracks[kind]
    if (!track.active) continue
    const step = (axis: FlybyAxis, position: number) =>
      stepFlybyAxis(axis, position, track.frame, track.duration)
    if (kind === 1) {
      camera.x = step(state.axes.x, camera.x)
      camera.y = step(state.axes.y, camera.y)
    }
    if (kind === 2) camera.angle = step(state.axes.angle, camera.angle) & 2047
    if (kind === 3)
      camera.zoom = Math.max(-16384, Math.min(16384, step(state.axes.zoom, camera.zoom)))
    if (kind >= 5 || track.frame >= track.duration) track.active = false
    track.frame = short(track.frame + 1)
  }
  state.frame = short(state.frame + 1)
  if (state.flags & 8 && state.tracks.every(t => !t.active)) {
    state.flags &= ~1
    camera.zoom = 0
  }
  // The native near-target flag also releases the input mask early; that host-side
  // distance check is deliberately left to the eventual native camera integration.
  return emitted
}

// 0x449080: interruption blends to the script's end target after warmup.
export function interruptFlyby(state: Flyby, camera: FlybyCamera) {
  if ((state.flags & 17) !== 17) return
  if (state.warmup) {
    state.flags &= ~1
    camera.zoom = 0
    return
  }
  if (state.flags & 64) return
  state.axes.x.velocity = state.axes.y.velocity = state.axes.zoom.velocity = 0
  for (const track of state.tracks) track.active = false
  const duration = state.frameRate * (state.frameRate < 11 ? 3 : 2)
  const end = state.end ?? { x: 0, y: 0, angle: 0, zoom: 0 }
  for (const [kind, value] of [
    [1, end.x | (end.y << 8)],
    [2, end.angle],
    [3, end.zoom],
  ]) {
    beginEvent(state, camera, { kind, value, start: 0, duration, flags: 0 })
  }
  state.flags |= 0x48
}
