import type { NativePoint, World } from './world-types.ts'
import { short } from './native-math.ts'
import { nativePosition } from './world-terrain-runtime.ts'
import { unitAnimationSource } from './selection-runtime.ts'

// 0x4fefe0 selects the ordinary spell-release path; the bit-set path is separate.
export const blastPersonTargeting = (mode: string | null, gameFlags: number) =>
  mode === 'blast' && !(gameFlags & 32)

// Follow the captured person only. Allegiance, range and hover are not lifetime gates.
export function blastPersonPosition(w: World, id: number): NativePoint | null {
  const unit = w.units.find(person => person.id === id)
  if (!unit || unit.hp <= 0) return null
  const owner =
    unit.flight ?? unit.fight?.motion ?? unit.native ?? unit.entry?.person ?? unit.builder?.person
  if (owner && (owner.class !== 1 || owner.flags2 & 1)) return null
  const source =
    unit.flight ??
    unit.fight?.motion ??
    unitAnimationSource(unit) ??
    (owner?.vehicle ? owner : null)
  return source
    ? { x: short(source.x), y: short(source.y), h: short(source.h) }
    : nativePosition(w, unit)
}
