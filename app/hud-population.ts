import { hudGlyph } from './hud-font.ts'
import hud from './original-hud.json' with { type: 'json' }
import type { Unit } from './world-types.ts'

// 0x5cb255..0x5cb35d: native class order and HFX pairs. Model 6 is the
// Firewarrior; model 4 is the Preacher (not their previously swapped labels).
const followerClasses = [
  { kind: 'brave', label: 'Braves', sprite: 666 },
  { kind: 'warrior', label: 'Warriors', sprite: 668 },
  { kind: 'firewarrior', label: 'Firewarriors', sprite: 670 },
  { kind: 'preacher', label: 'Preachers', sprite: 672 },
  { kind: 'spy', label: 'Spies', sprite: 674 },
] as const

// 0x4a1170/0x4a0510: empty classes retain a disabled frame, without icon/count
// art. Training knowledge is independent; housed followers still count.
export function followerClassControls(
  units: readonly Pick<Unit, 'team' | 'kind' | 'hp' | 'ghost'>[]
) {
  return followerClasses.map(control => {
    const count = units.filter(
      unit => unit.team === 'blue' && unit.hp > 0 && !unit.ghost && unit.kind === control.kind
    ).length
    return { ...control, count, enabled: count > 0 }
  })
}

// 0x4a0510/0x4a0800, English 640×480 HUD. The alternate font accompanies
// the native alternate count table; its control ownership remains separate.
export function followerNumber(count: number, total = false, alternate = false) {
  const text = count || total ? String(count).padStart(count < 100 ? 2 : 3, '0') : ''
  const font = ((count < 100 ? 4 : 6) + Number(alternate)) as 4 | 5 | 6 | 7
  const ids = Array.from(text, c => hudGlyph(c.charCodeAt(0), font))
  const rects = hud.rects as Record<string, { w: number }>
  const width = ids.reduce((sum, id) => sum + rects[id].w, 0)
  return { ids, x: Math.trunc((15 - width) / 2), y: 26 }
}

// 0x4a0800: 3×18 interior, with a minimum one-pixel fill while below capacity.
export function populationMeter(population: number, capacity: number, frame: number) {
  if (population >= capacity) return { pixels: 18, color: (frame & 0x124) === 0x124 ? 228 : 139 }
  return { pixels: Math.max(1, Math.trunc((18 * population) / capacity)), color: 228 }
}

export function followerIcon(sprite: number) {
  const r = (hud.rects as Record<number, { w: number; h: number }>)[sprite]
  return { x: 7 - Math.trunc(r.w / 2), y: 18 - Math.trunc((r.h + 8) / 2) }
}
