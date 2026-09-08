import rules from './original-rules.json' with { type: 'json' }

interface MaturingHut {
  counter: number
  level: number
  upgrade: number
  woodUnavailable?: boolean
}

// 0x4050c0's decision phase. Wood lookup and order/allocation consumers are
// owned by the world; thresholds and cadence use the original building counter.
export function stepHutUpgrade(b: MaturingHut, occupants: number, missingWood: () => number) {
  if (b.counter & 15 || b.level >= 3) return null
  occupants = (occupants << 24) >> 24
  if (!occupants) {
    b.woodUnavailable = false
    return null
  }
  b.upgrade = ((b.upgrade + occupants * 8) << 16) >> 16
  const cost = rules.hutUpgradeWork[b.level - 1]
  if (b.upgrade >= cost) {
    b.upgrade = cost
    if (!missingWood()) return 'upgrade'
  }
  if (b.counter & 127) return null
  b.woodUnavailable = false
  return b.upgrade >= Math.trunc((cost * 12) / 16) && missingWood() ? 'fetch' : null
}

// 0x4a77d0 sums eligible scenery wood in the entrance cell, including trees.
export function looseWoodInCell(
  point: { x: number; y: number },
  scenery: Iterable<{ x: number; y: number; model: number; wood: number }>
) {
  let wood = 0
  for (const item of scenery)
    if (
      rules.sceneryResourceFlags[item.model] & 4 &&
      ((item.x ^ point.x) & 0xfe00) === 0 &&
      ((item.y ^ point.y) & 0xfe00) === 0
    )
      wood = (wood + ((item.wood << 16) >> 16)) | 0
  return wood
}
