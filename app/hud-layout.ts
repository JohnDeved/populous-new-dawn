// Reference-space anchors only. Artwork dimensions remain source-owned.
// Constructors normalize parent and child separately before the renderer converts.
const normalized = (value: number, extent: number) => Math.trunc((value * 65536) / extent)
const referenceX = (value: number) => Math.floor((640 * value) / 65536)
const referenceY = (value: number) => Math.floor((480 * value + 240) / 65536)

export const commandDockTop = referenceY(normalized(204, 480))

export function followerTaskPosition(column: number, localY: number) {
  return {
    left: referenceX(normalized(column * 16, 640)),
    top: referenceY(normalized(204, 480) + normalized(localY, 480)) - commandDockTop,
  }
}

/** The compact browser roster is not the native fixed-slot layout. Keep every
 * diagnostic/restored spell reachable until that separate semantic work lands. */
export function hudContentHeight(spellCount: number) {
  const spellBottom = commandDockTop + 9 + Math.ceil(spellCount / 3) * 44 - 1
  return Math.max(480, spellBottom + 3) // Existing outside keyboard focus clearance.
}

export function hudScale(width: number, height: number, preference: string, spellCount = 0) {
  const fit = Math.min(width / 640, height / 480)
  const preferred =
    preference === 'auto' ? Math.min(2.5, Math.max(1, Math.floor(fit * 2) / 2)) : Number(preference)
  return Math.min(preferred, fit, height / hudContentHeight(spellCount))
}
