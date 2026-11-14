import { browserPosition } from './world-coordinates.ts'
import { isShaman } from './world-rules.ts'
import { tribeForTeam, type Point, type World } from './world-types.ts'

// Native default key records (table 0x5d5de8, loaded by 004f1820): DIK 0x34
// (period) issues process_cmd action 0x5d, and character 'h' issues 0x96. Both
// records are press-only with an exact empty modifier mask and no predicate. See
// decomp/research/quick-camera-shortcuts.md.
export const SHAMAN_CAMERA_ACTION = 0x5d
export const REINCARNATION_CAMERA_ACTION = 0x96

export type QuickCameraAction = typeof SHAMAN_CAMERA_ACTION | typeof REINCARNATION_CAMERA_ACTION

export function quickCameraAction(event: {
  key: string
  code: string
  repeat: boolean
  shiftKey?: boolean
  ctrlKey?: boolean
  altKey?: boolean
  metaKey?: boolean
}): QuickCameraAction | null {
  if (event.repeat || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return null
  if (event.code === 'Period') return SHAMAN_CAMERA_ACTION
  if (event.key.toLowerCase() === 'h') return REINCARNATION_CAMERA_ACTION
  return null
}

// Camera-only targets. Action 0x5d does nothing without a current-tribe Shaman,
// and action 0x96 reads the tribe's reincarnation-site cell centre (+0x911);
// neither changes selection or issues a tribe command.
export function quickCameraTarget(w: World, action: QuickCameraAction): Point | null {
  if (action === SHAMAN_CAMERA_ACTION) {
    const shaman = w.units.find(u => u.team === 'blue' && isShaman(u) && u.hp > 0)
    return shaman ? { x: shaman.x, z: shaman.z } : null
  }
  const site = w.reincarnationSites?.[tribeForTeam('blue')]
  return site ? browserPosition(site) : null
}
