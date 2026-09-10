import constants from './original-constants.json' with { type: 'json' }
import { terrainPointHeight, type NativeTerrain } from './native-terrain.ts'

interface Position {
  x: number
  y: number
}
type Ground = Pick<NativeTerrain, 'heights' | 'flags'>
export interface LandBridge {
  start: Position
  target: Position
  turn: number
  alongY: boolean
  startCell: number
  endCell: number
  direction: number
  crossStep: number
  heightStep: number
  raiseWater: boolean
}
const cell = (p: Position) => ((p.x >> 8) & 254) | (p.y & 0xfe00)
function wrapDifference(n: number, period: number) {
  if (n > period / 2) return n - period
  return n < -period / 2 ? n + period : n
}

export function createLandBridge(start: Position, target: Position): LandBridge {
  return {
    start: { x: start.x & 65535, y: start.y & 65535 },
    target: { x: target.x & 65535, y: target.y & 65535 },
    turn: 0,
    alongY: false,
    startCell: 0,
    endCell: 0,
    direction: 0,
    crossStep: 0,
    heightStep: 0,
    raiseWater: true,
  }
}

// 0x50ee00 / 0x50f010 / 0x50ecc0. Four vertices per cross-section, in native
// order, including both endpoints. Sample the starting height anew each turn.
export function stepLandBridge(
  land: Ground,
  bridge: LandBridge,
  trail: (p: Position & { h: number }) => void,
  changed: (cell: number) => void
) {
  bridge.turn++
  if (bridge.turn === 1) {
    bridge.startCell = cell(bridge.start)
    bridge.endCell = cell(bridge.target)
    const dx = wrapDifference((bridge.endCell & 255) - (bridge.startCell & 255), 256),
      dy = wrapDifference((bridge.endCell >> 8) - (bridge.startCell >> 8), 256)
    bridge.alongY = Math.abs(dy) >= Math.abs(dx)
    const axis = bridge.alongY ? 'x' : 'y',
      major = bridge.alongY ? dy : dx,
      steps = Math.abs(major / 2),
      cross = wrapDifference(bridge.target[axis] - bridge.start[axis], 65536),
      rise = terrainPointHeight(land, bridge.target) - terrainPointHeight(land, bridge.start)
    bridge.direction = Math.sign(major) * 2
    bridge.crossStep = steps ? Math.trunc(cross / steps) | 0 : cross
    bridge.heightStep = steps ? Math.trunc(rise / steps) | 0 : rise
    bridge.raiseWater = true
    return true
  }
  let x = bridge.startCell & 255,
    y = bridge.startCell >> 8
  let cross = (bridge.alongY ? x : y) << 8
  let targetHeight = terrainPointHeight(land, { x: x << 8, y: y << 8 })
  const row = () => {
    for (const offset of [0, 2, 4, -2]) {
      const cx = (x + (bridge.alongY ? offset : 0)) & 255,
        cy = (y + (bridge.alongY ? 0 : offset)) & 255,
        point = { x: cx << 8, y: cy << 8 },
        index = (cy >> 1) * 128 + (cx >> 1)
      trail({ ...point, h: terrainPointHeight(land, point) })
      const current = land.heights[index],
        difference = Math.max(
          -constants.LAND_BRIDGE_MAX_CHANGE,
          Math.min(constants.LAND_BRIDGE_MAX_CHANGE, Math.max(90, targetHeight) - current)
        )
      if (difference && (bridge.raiseWater || current > 1)) {
        land.heights[index] = Math.max(
          0,
          Math.min(
            1024,
            current + Math.trunc(difference / (constants.LAND_BRIDGE_DURATION - bridge.turn))
          )
        )
        changed(cx | (cy << 8))
      }
    }
  }
  do {
    row()
    targetHeight += bridge.heightStep
    cross = (cross + bridge.crossStep) & 65535
    if (bridge.alongY) {
      x = (cross >> 8) & 254
      y = (y + bridge.direction) & 255
    } else {
      x = (x + bridge.direction) & 255
      y = (cross >> 8) & 254
    }
  } while (bridge.alongY ? y !== bridge.endCell >> 8 : x !== (bridge.endCell & 255))
  row()
  return bridge.turn !== constants.LAND_BRIDGE_DURATION - 1
}
