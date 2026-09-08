import rules from './original-rules.json' with { type: 'json' }

type TerritoryBuilding = { x: number; y: number; tribe: number }
export type Territory = {
  categories: Uint8Array
  regions: Uint8Array
  searchMarks: Uint8Array
  searchTag: number
}

// 0x4f6cc0: upper ph_2 bits, on ground-category cells only. Positions are native
// 16-bit coordinates. Unsupported radii use the original eleven-row table.
export function markBuildingTerritory(
  land: Territory,
  b: TerritoryBuilding,
  radius: number,
  remove = false
) {
  const widths = rules.territoryWidths[radius === 5 ? 0 : radius === 7 ? 1 : radius === 9 ? 2 : 3]
  const extent = widths.length - 1,
    bit = (1 << (b.tribe + 4)) & 255
  for (let row = 0; row <= extent * 2; row++) {
    // Native lower half repeats the widest row and omits table entry zero.
    const width = widths[row <= extent ? row : extent * 2 + 1 - row]
    const y = ((b.y >>> 9) + row - extent) & 127
    for (let dx = -width; dx <= width; dx++) {
      const index = y * 128 + (((b.x >>> 9) + dx) & 127)
      if (rules.terrainCategoryFlags[land.categories[index] & 15] & 1)
        land.regions[index] = remove ? land.regions[index] & ~bit : land.regions[index] | bit
    }
  }
}

// 0x4f6c20: stagger each tribe's refresh over 128 turns. The shared search
// marker wraps around reserved tags 0/255; clearing it does not clear territory.
export function refreshBuildingTerritory(
  land: Territory,
  turn: number,
  tribe: { id: number; playerType: number; defenceRadius: number; buildings: TerritoryBuilding[] }
) {
  if ((tribe.id * 8 + turn + 17) & 127) return
  if (land.searchTag === 254) land.searchTag = 255
  land.searchTag = (land.searchTag + 1) & 255
  if (!land.searchTag) {
    land.searchMarks.fill(0)
    land.searchTag = 1
  }
  for (const b of tribe.buildings)
    markBuildingTerritory(land, b, tribe.playerType === 1 ? tribe.defenceRadius : 11)
}
