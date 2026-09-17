import units from './original-units.json' with { type: 'json' }
import type { Team, TribeTeam } from './world-types.ts'

export type ShamanDirection = { frames: number[]; flip: boolean; source: number }
const sources: Partial<Record<number, ShamanDirection[]>> = units.shamanSources
const appearances = {
  blue: { signature: 'blue-shaman', sourceOffset: 0 },
  red: { signature: 'red-shaman', sourceOffset: 8 },
  yellow: { signature: 'yellow-shaman', sourceOffset: 16 },
  green: { signature: 'green-shaman', sourceOffset: 24 },
} as const

// 004673b0 / 00450e60: distinct original artwork rather than follower recoloring.
export function shamanAppearance(team: Team) {
  if (team === 'wild') throw new RangeError('A Shaman requires an original player tribe')
  return appearances[team]
}

export function shamanNativeDirections(team: Team, originalBase: number) {
  return sources[originalBase + shamanAppearance(team).sourceOffset]
}

function requiredSource(source: number) {
  const directions = sources[source]
  if (!directions) throw new RangeError(`Missing original Shaman source ${source}`)
  return directions
}

const reincarnation = Object.fromEntries(
  Object.entries(appearances).map(([team, appearance], tribe) => [
    team,
    [
      { source: 680 + appearance.sourceOffset, directions: requiredSource(680 + appearance.sourceOffset), layerOwner: -1 },
      { source: 352, directions: requiredSource(352), layerOwner: tribe },
      { source: 360, directions: requiredSource(360), layerOwner: tribe },
    ],
  ])
) as Record<TribeTeam, { source: number; directions: ShamanDirection[]; layerOwner: number }[]>

// 005029d0 selects 680/352/360. Only the initial body adds tribe*8 and draws
// without tribe-layer filtering. Shared spirits retain the owner. Both use
// Shaman scaling. These source IDs are not packed atlas frame indices.
export function shamanReincarnationPose(team: Team, phase: number) {
  shamanAppearance(team)
  return reincarnation[team as TribeTeam][phase === 0 ? 0 : phase === 1 ? 1 : 2]
}
