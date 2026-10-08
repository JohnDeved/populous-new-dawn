import art from './original-temple-acquisition.json' with { type: 'json' }
import fire from './original-fire.json' with { type: 'json' }
import type { SharedAniblSnapshot } from './shared-anibl.ts'
import type { Building } from './world-types.ts'

export { art as templeArt }

/** Immutable source UVs remain in tile92; this discrete resource selection is
 * supplied by the shared presentation owner, never inferred from effect age. */
export function templeTileOffset(tile: number | undefined): [number, number] {
  if (tile === undefined || !fire.frames.includes(tile))
    throw new Error('Temple requires a qualified shared tile')
  return [((tile & 7) - (fire.tile & 7)) / 8, -((tile >> 3) - (fire.tile >> 3)) / 32]
}

export function templeWorldMaterial(
  mission: number,
  building: Pick<Building, 'kind' | 'team'>,
  object: number,
  stage: number,
  resource: SharedAniblSnapshot | null
) {
  if (mission !== 3 || building.kind !== 'temple' || building.team !== 'blue' || object !== 95 || stage !== 4)
    return null
  if (!resource) throw new Error('Temple material resource is unavailable')
  return { atlas: art.modelAtlas, offset: templeTileOffset(resource.tile), epoch: resource.epoch }
}

/** M3 companion and pulse share the active PAL/AL bank. Ghost trails retain
 * their proven-equal ordinary pixels and independent85/255 draw opacity. */
export function templeSpriteMaterial(
  frame: number,
  palette: number | 'ghost',
  resource: SharedAniblSnapshot | null
) {
  if (!resource) return null
  const crop = art.frames.find(candidate => candidate.source === frame)
  if (palette === 'ghost') return null
  const tint = art.tints.find(candidate => candidate.selector === palette)
  if (!crop || !tint) throw new Error('Unsupported Temple companion material')
  return {
    atlas: art.sparkleAtlas,
    crop,
    rgb: (tint.rgb[0] << 16) | (tint.rgb[1] << 8) | tint.rgb[2],
  }
}
