import {
  buildingInsidePoint,
  buildingOutsidePoint,
  buildingSocketPoint,
} from './building-shapes.ts'
import { movePosition } from './native-math.ts'
import type { Shrine, World } from './world-types.ts'

type VaultPose = Pick<Shrine, 'x' | 'z' | 'model' | 'angle'>

// Vault trigger positions retain the same coarse anchor as their authored building.
// Frames 152..155 share the original rotated shape records, including their sockets.
export function vaultShapePose(vault: VaultPose) {
  return {
    object: vault.model,
    angle: Math.round((vault.angle * 1024) / Math.PI) & 2047,
    anchorX: Math.round((vault.x + 8) * 256) & 0xfe00,
    anchorY: Math.round((-vault.z - 8) * 256) & 0xfe00,
  }
}

// The model-18 building descriptor attaches prayer panels to socket 0.
// Reward knowledge has its own socket 1; neither uses the scenery panel height.
export function vaultPrayerPoint(vault: VaultPose) {
  return buildingSocketPoint(vaultShapePose(vault), 0)
}

export function vaultPoints(vault: VaultPose) {
  const pose = vaultShapePose(vault),
    outside = buildingOutsidePoint(pose),
    leave = { ...outside }
  movePosition(leave, (pose.angle + 1024) & 2047, 1024)
  return { outside, inside: buildingInsidePoint(pose), leave }
}

// 0040a3f0 reads the current cell's building owner, not distance to a doorway.
// The shared mask is authoritative, including registered non-Vault precedence.
export function vaultAtPersonCell(w: World, point: { x: number; y: number }) {
  const cell = ((point.y & 65535) >>> 9) * 128 + ((point.x & 65535) >>> 9)
  if (!(w.land.flags[cell] & 512)) return undefined
  const id = w.land.buildingIds[cell] & 1023
  if (w.buildings.some(building => building.id === id)) return undefined
  return w.shrines.find(shrine => shrine.id === id && shrine.kind === 'vault' && shrine.model)
}
