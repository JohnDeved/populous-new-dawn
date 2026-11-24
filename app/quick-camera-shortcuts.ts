import { browserPosition } from './world-coordinates.ts'
import { isShaman } from './world-rules.ts'
import { tribeForTeam, type Point, type World } from './world-types.ts'

// Native default key records (table 0x5d5de8, loaded by 004f1820): DIK 0x34
// (period) issues process_cmd action 0x5d, and character 'h' issues 0x96. Both
// records are press-only with an exact empty modifier mask and no predicate.
// H's gate flag 1 exempts it from the matcher's conditional player-mask
// rejection. Its separate stage-2 pause gate is applied below; Page gates
// still own modal/current-world admission. See decomp/research/quick-camera-shortcuts.md.
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

// Native default records 005d5f68 (Enter → action 0x15) and 005d5f74/005d5f80
// (Shift+Enter / Ctrl+Enter → 0xc5) are press-only with exact modifier masks, so
// Shift+Ctrl, Alt and repeats match nothing. 0x15 runs the animated World View
// transition (00418890); 0xc5 enters or leaves at once (0041d4b0). Keypad Enter
// remains the browser's alias for Enter. See decomp/research/instant-overview.md.
export function overviewShortcut(event: {
  key: string
  repeat: boolean
  shiftKey?: boolean
  ctrlKey?: boolean
  altKey?: boolean
  metaKey?: boolean
}): { instant: boolean } | null {
  if (event.key !== 'Enter' || event.repeat || event.altKey || event.metaKey) return null
  if (event.shiftKey && event.ctrlKey) return null
  return { instant: !!(event.shiftKey || event.ctrlKey) }
}

// Camera-only targets. Action 0x5d does nothing without a current-tribe Shaman,
// and action 0x96 reads the tribe's reincarnation-site cell centre (+0x911);
// neither changes selection or issues a tribe command.
export function quickCameraTarget(w: World, action: QuickCameraAction): Point | null {
  if (action === SHAMAN_CAMERA_ACTION) {
    const shaman = w.units.find(u => u.team === 'blue' && isShaman(u) && u.hp > 0)
    return shaman ? { x: shaman.x, z: shaman.z } : null
  }
  // Native action 0x96 is stage 2 and exits while land_flags_1 & 2 is set.
  // The browser public Pause control uses w.paused; retained native state can
  // independently carry the land bit. Period is stage 1 and remains eligible.
  if (w.paused || w.land.landFlags & 2) return null
  const site = w.reincarnationSites?.[tribeForTeam('blue')]
  return site ? browserPosition(site) : null
}
