// Unwired native-domain model. See decomp/research/native-campaign-progression/README.md.
// Native missions 24/25 here do not make them supported browser missions.
export const nativeCampaignMissions = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
] as const

export type NativeCampaignMission = (typeof nativeCampaignMissions)[number]

export type NativeCampaignEntry =
  | { kind: 'return'; playIntro?: boolean }
  | { kind: 'victory'; mission: NativeCampaignMission }

export interface NativeCampaignTransition {
  /** One byte per mission, indexed by mission minus one; unrelated bits survive. */
  flags: readonly number[]
  /** An anchor write, not the currently selected world. Null means preserve the existing anchor. */
  recommendation: NativeCampaignMission | null
  resultState: 10 | 12
  /** Requested before progression/state transition; this model executes no effects. */
  movie: 'intro' | 'outro' | null
}

const completedBit = 1
const availableBit = 4

function validateFlags(flags: readonly number[]) {
  if (
    !Array.isArray(flags) ||
    flags.length !== nativeCampaignMissions.length ||
    !nativeCampaignMissions.every(mission => {
      const value = flags[mission - 1]
      return Number.isInteger(value) && value >= 0 && value <= 255
    })
  ) {
    throw new RangeError('Native campaign flags must contain exactly 25 bytes')
  }
}

function validateMission(mission: number): asserts mission is NativeCampaignMission {
  if (!Number.isInteger(mission) || mission < 1 || mission > 25) {
    throw new RangeError('Native campaign mission must be an integer from 1 through 25')
  }
}

function completed(flags: readonly number[], mission: NativeCampaignMission) {
  return (flags[mission - 1] & completedBit) !== 0
}

function makeAvailable(flags: number[], mission: NativeCampaignMission) {
  flags[mission - 1] |= availableBit
}

function firstIncomplete(flags: readonly number[], start: number, end: number) {
  return nativeCampaignMissions.find(
    mission => mission >= start && mission <= end && !completed(flags, mission)
  )
}

function openFirstIncompleteFork(flags: number[]) {
  for (const mission of [16, 17, 18, 19] as const) {
    makeAvailable(flags, mission)
    if (!completed(flags, mission)) return mission
  }
}

function pairCompleted(flags: readonly number[], mission: 20 | 21) {
  return mission === 20
    ? completed(flags, 16) && completed(flags, 17)
    : completed(flags, 18) && completed(flags, 19)
}

function recommendAfterVictory(flags: number[], mission: NativeCampaignMission) {
  if (mission <= 15) {
    const next = firstIncomplete(flags, mission + 1, 16)
    if (next !== undefined) {
      makeAvailable(flags, next)
      if (next === 16) {
        for (const fork of [16, 17, 18, 19] as const) makeAvailable(flags, fork)
      }
      return next
    }
    mission = 16
  }

  if (mission <= 19) {
    const next = openFirstIncompleteFork(flags)
    if (next !== undefined) return next
    mission = 20
  }

  if (mission <= 21) {
    const next = firstIncomplete(flags, 20, 21)
    if (next === 20 || next === 21) {
      if (pairCompleted(flags, next)) return next
      // A missing prerequisite guarantees at least one incomplete fork mission.
      const prerequisite = openFirstIncompleteFork(flags)
      if (prerequisite !== undefined) return prerequisite
      throw new Error('Missing campaign prerequisite was not found')
    }
    mission = 22
  }

  const next = firstIncomplete(flags, mission, 25) ?? 25
  makeAvailable(flags, next)
  return next
}

export function createNativeCampaignFlags(): readonly number[] {
  return nativeCampaignMissions.map(mission => (mission === 1 ? availableBit : 0))
}

export function nativeCampaignMissionStatus(
  flags: readonly number[],
  mission: NativeCampaignMission
) {
  validateFlags(flags)
  validateMission(mission)
  return {
    completed: completed(flags, mission),
    available: (flags[mission - 1] & availableBit) !== 0,
    selectable: (flags[mission - 1] & (completedBit | availableBit)) !== 0,
  }
}

/**
 * The caller supplies the native snapshot AFTER any completion write. This does
 * not award completion, validate victory eligibility, migrate profiles, launch a
 * world, or change the selected world. Its input guards are browser safety policy.
 */
export function transitionNativeCampaign(
  previousFlags: readonly number[],
  entry: NativeCampaignEntry
): NativeCampaignTransition {
  validateFlags(previousFlags)
  if (entry.kind !== 'return' && entry.kind !== 'victory') {
    throw new RangeError('Unknown native campaign entry')
  }
  if (entry.kind === 'victory') validateMission(entry.mission)
  else if (entry.playIntro !== undefined && typeof entry.playIntro !== 'boolean') {
    throw new TypeError('Native campaign intro request must be a boolean')
  }
  const flags = [...previousFlags]

  if (entry.kind === 'victory' && entry.mission === 25) {
    return { flags, recommendation: null, resultState: 12, movie: null }
  }

  let recommendation: NativeCampaignMission
  let movie: NativeCampaignTransition['movie'] = null
  if (entry.kind === 'victory') {
    if (entry.mission === 24) movie = 'outro'
    recommendation = recommendAfterVictory(flags, entry.mission)
  } else {
    if (entry.playIntro) movie = 'intro'
    recommendation = firstIncomplete(flags, 1, 25) ?? 25
    makeAvailable(flags, recommendation)
  }

  if (pairCompleted(flags, 20)) makeAvailable(flags, 20)
  if (pairCompleted(flags, 21)) makeAvailable(flags, 21)
  return { flags, recommendation, resultState: 10, movie }
}
