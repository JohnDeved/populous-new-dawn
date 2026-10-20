import units from './original-units.json' with { type: 'json' }

interface FollowerDirection {
  frames: number[]
  flip: boolean
  source: number
}

// Original source starts are independent of class/tribe aliases. The selected
// animation object's descriptor and the apparent owner still select the layers.
const sources = new Map<number, FollowerDirection[]>(
  Object.entries(units.followerSources).map(([source, directions]) => [Number(source), directions])
)

export function followerNativeDirections(source: number) {
  return sources.get(source)
}

// 0046ec80 skips hidden objects before dispatch and source0x650 for sprites.
// Neither is a missing import that should fall back to a named idle animation.
export function nativeSpriteHidden(source: number | undefined, renderFlags: number) {
  return source === 0x650 || !!(renderFlags & 16)
}
