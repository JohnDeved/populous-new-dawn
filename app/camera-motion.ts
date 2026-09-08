import rules from './original-rules.json' with { type: 'json' }
import { positionDistance, nativeAngle } from './native-math.ts'

const short = (n: number) => (n << 16) >> 16
const up = rules.cameraRampUp.map(n => short(Math.trunc((n * 4096) / 100)))
const down = rules.cameraRampDown.map(n => short(Math.trunc((n * 4096) / 100)))
const scaled = (a: number, b: number) => Math.trunc(Math.imul(a, b) / 4096)
const sum = (ramp: number[], speed: number) => ramp.reduce((n, r) => n + scaled(r, speed), 0)
const angleDistance = (a: number, b: number) => {
  const d = Math.abs(short(a) - short(b))
  return short(d > 1024 ? 2048 - d : d)
}
const angleDirection = (a: number, b: number) => {
  let d = short(a) - short(b)
  if (Math.abs(d) > 1024) d += d < 0 ? 2048 : -2048
  return Math.sign(d)
}

export type CameraPosition = { x: number; y: number; angle: number }
export type CameraMotion = {
  active: number
  target: CameraPosition
  source: CameraPosition
  moveUp: number
  moveDown: number
  turnUp: number
  turnDown: number
  moveSpeed: number
  turnSpeed: number
  moveIndex: number
  turnIndex: number
  moveCount: number
  turnCount: number
  phase: number
  frame: number
  moves: number[][]
  turns: number[][]
}
export const createCameraMotion = (): CameraMotion => ({
  active: 0,
  target: { x: 0, y: 0, angle: 0 },
  source: { x: 0, y: 0, angle: 0 },
  moveUp: 0,
  moveDown: 0,
  turnUp: 0,
  turnDown: 0,
  moveSpeed: 0,
  turnSpeed: 0,
  moveIndex: 0,
  turnIndex: 0,
  moveCount: 0,
  turnCount: 0,
  phase: 0,
  frame: 0,
  moves: Array.from({ length: 11 }, () => [0, 0]),
  turns: Array.from({ length: 11 }, () => [0, 0]),
})

export type ResultCamera = {
  active: number
  phase: number
  counter: number
  target: CameraPosition
  saved: CameraPosition
}
export const createResultCamera = (): ResultCamera => ({
  active: 0,
  phase: 0,
  counter: 0,
  target: { x: 0, y: 0, angle: 0 },
  saved: { x: 0, y: 0, angle: 0 },
})

// 0x41b610 captures the current view once; overlapping requests are ignored.
export function beginResultCamera(
  s: ResultCamera,
  gameFlags: number,
  openedFiles: number,
  camera: CameraPosition,
  target: { x: number; y: number }
) {
  if (gameFlags & 2 || s.active || openedFiles & 16) return
  s.saved = { x: camera.x & 65535, y: camera.y & 65535, angle: short(camera.angle) }
  s.target = { x: target.x & 65535, y: target.y & 65535, angle: -1 }
  s.active = 1
  s.phase = 0
  s.counter = 1
}

// 0x41b6d0, before camera movement in draw_main. Input/flyby cleanup and
// sound allocation are world consumers; sky-counter work also runs when idle.
export function stepResultCamera(
  s: ResultCamera,
  motion: CameraMotion,
  camera: CameraPosition,
  w: { skyCounter: number; newTurn: boolean },
  effects: {
    lock: () => void
    unlock: () => void
    clearInteraction: () => void
    sound: () => void
  }
) {
  if (s.active)
    switch (s.phase) {
      case 0:
      case 2:
        if (s.counter) {
          s.counter = 0
          if (s.phase === 0) effects.lock()
          const target = s.phase === 0 ? s.target : s.saved
          if (
            !motion.active ||
            motion.target.x !== target.x ||
            motion.target.y !== target.y ||
            motion.target.angle !== target.angle
          )
            planCameraMotion(motion, camera, target)
          effects.clearInteraction()
        }
        if (!motion.active) s.phase = 3
        break
      case 1:
        if (!s.counter) {
          s.counter = 1
          s.phase = 2
        } else if (w.newTurn) s.counter = (s.counter - 1) & 255
        break
      case 3:
        effects.unlock()
        s.active = 0
        break
    }
  if (w.skyCounter) {
    w.skyCounter = (w.skyCounter - 1) & 255
    if (!(w.skyCounter & 15)) effects.sound()
  }
}

// 0x417d80. Preserve its final ramp sums, including the overshoot retained
// when synchronizing translation/rotation cruise lengths.
export function planCameraMotion(s: CameraMotion, camera: CameraPosition, target: CameraPosition) {
  s.active = 0
  s.source = { x: camera.x & 65535, y: camera.y & 65535, angle: short(camera.angle) }
  s.target = {
    x: target.x & 65535,
    y: target.y & 65535,
    angle: short(target.angle) < 0 ? short(camera.angle) : short(target.angle),
  }
  const distance = positionDistance(s.source, s.target),
    angle = angleDistance(s.target.angle, camera.angle),
    direction = angleDirection(s.target.angle, camera.angle)
  const plan = (distance: number, speed: number, step: number) => {
    let start = sum(up, speed),
      end = sum(down, speed)
    if (distance < start + end && speed)
      do {
        start = sum(up, speed)
        end = sum(down, speed)
      } while (distance <= start + end && (speed -= step) > 0)
    return {
      distance,
      speed,
      step,
      start,
      end,
      cruise: speed ? Math.trunc((distance - start - end) / speed) : 0,
    }
  }
  const move = plan(
      distance,
      distance <= 2048 ? 256 : distance <= 6144 ? 768 : distance <= 14336 ? 1536 : 2048,
      16
    ),
    turn = plan(angle, 91, 4)
  const duration = Math.max(move.cruise, turn.cruise)
  for (const axis of [move, turn])
    if (axis.cruise && duration !== axis.cruise) {
      for (; ; axis.speed += axis.step) {
        axis.start = sum(up, axis.speed)
        axis.end = sum(down, axis.speed)
        if (axis.distance < axis.start + axis.end + duration * axis.speed) break
      }
      axis.speed = Math.max(0, axis.speed - axis.step)
    }
  Object.assign(s, {
    active: 1,
    moveSpeed: short(move.speed),
    turnSpeed: short(turn.speed * direction),
    moveUp: short(move.start),
    moveDown: short(move.end),
    turnUp: short(turn.start * direction),
    turnDown: short(turn.end * direction),
    phase: 0,
    frame: 0,
    moveIndex: 0,
    turnIndex: 0,
  })
}

// 0x418270. Position/angle writes use native 16-bit storage. The consumer
// handles globe/water invalidation; rotation sets the original render flag.
export function stepCameraMotion(
  s: CameraMotion,
  camera: CameraPosition,
  drawMode: number,
  effects: { rotate: () => void; globe: () => void }
) {
  if (!s.active) return
  let finished = drawMode === 2,
    move = 0,
    turn = 0
  if (!finished) {
    let distance = positionDistance(camera, s.target)
    if (distance < 4) distance = 0
    const angle = angleDistance(s.target.angle, camera.angle),
      direction = angleDirection(s.target.angle, camera.angle)
    const heading = nativeAngle(short(s.target.x - camera.x), -short(s.target.y - camera.y))
    if (s.phase === 0) {
      move = scaled(s.moveSpeed, up[s.frame])
      turn = scaled(s.turnSpeed, up[s.frame])
      s.frame = (s.frame + 1) & 255
      if (s.frame > 3) {
        s.frame = 0
        s.phase = 1
      }
    } else if (s.phase === 1) {
      if (s.frame === 0) {
        const schedule = (
          distance: number,
          speed: number,
          remaining: number,
          min: number,
          sign: number
        ) =>
          down.map(r => {
            if (!speed) return [0, 0]
            const step = Math.max(min, scaled(r, Math.abs(speed)))
            let count = 0
            while (distance > 0 && step <= distance - remaining) {
              count = short(count + 1)
              distance -= step
            }
            remaining -= step
            return [short(step * sign), count]
          })
        s.moves = schedule(distance, s.moveSpeed, s.moveDown, 4, 1)
        s.turns = schedule(angle, s.turnSpeed, Math.abs(s.turnDown), 2, direction)
        s.moveIndex = s.turnIndex = s.moveCount = s.turnCount = 0
      }
      s.frame = (s.frame + 1) & 255
      while (!s.moves[s.moveIndex][1] && s.moveIndex < 10) s.moveIndex++
      s.moveCount = (s.moveCount + 1) & 255
      move = s.moves[s.moveIndex][0]
      if (s.moves[s.moveIndex][1] <= s.moveCount) {
        s.moveCount = 0
        if (s.moveIndex < 10) s.moveIndex++
      }
      while (!s.turns[s.turnIndex][1] && s.turnIndex < 10) s.turnIndex++
      s.turnCount = (s.turnCount + 1) & 255
      turn = s.turns[s.turnIndex][0]
      if (s.turns[s.turnIndex][1] <= s.turnCount) {
        s.turnCount = 0
        if (s.turnIndex < 10) s.turnIndex++
      }
    }
    let nearMove = false,
      nearTurn = false
    if (distance < move) {
      move = distance
      nearMove = distance < 5
    }
    if (angle < Math.abs(turn)) {
      turn = direction * angle
      nearTurn = Math.abs(turn) < 3
    }
    finished = (!move && !turn) || (nearMove && nearTurn)
    if (!finished) {
      if (move) {
        camera.x = (camera.x + (Math.imul(rules.sine[heading], short(move)) >> 16)) & 65535
        camera.y =
          (camera.y + (Math.imul(rules.sine[(heading + 512) & 2047], short(move)) >> 16)) & 65535
      }
      if (turn) {
        effects.rotate()
        camera.angle = (camera.angle + short(turn)) & 2047
      }
    }
  }
  if (finished) {
    s.active = 0
    if (!s.turnUp && !s.turnDown) s.target.angle = camera.angle
    camera.x = s.target.x
    camera.y = s.target.y
    if (s.target.angle >= 0) camera.angle = s.target.angle
    effects.globe()
  }
}
