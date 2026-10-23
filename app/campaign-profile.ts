import { missionNumbers } from './mission-data.ts'
import {
  createNativeCampaignFlags,
  nativeCampaignMissions,
  transitionNativeCampaign,
  type NativeCampaignEntry,
  type NativeCampaignMission,
} from './native-campaign-progression.ts'

export interface CampaignProgress {
  flags: readonly number[]
  history: 'native-model' | 'legacy-completed-only'
}
export type CampaignEvent =
  | { kind: 'completion'; mission: NativeCampaignMission }
  | NativeCampaignEntry

export const supportedCampaignMission = (mission: number) =>
  missionNumbers.some(number => number === mission)

const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

function nativeExtension(value: unknown): value is CampaignProgress & { version: 1 } {
  return (
    record(value) &&
    value.version === 1 &&
    (value.history === 'native-model' || value.history === 'legacy-completed-only') &&
    Array.isArray(value.flags) &&
    value.flags.length === 25 &&
    [...value.flags].every(byte => Number.isInteger(byte) && byte >= 0 && byte <= 255)
  )
}

export const campaignCompleted = (progress: CampaignProgress) =>
  missionNumbers.filter(mission => progress.flags[mission - 1] & 1)
export const campaignSelectable = (progress: CampaignProgress) =>
  nativeCampaignMissions.filter(mission => progress.flags[mission - 1] & 5)

/** Read-only preservation policy, not reconstruction of lost native play history. */
export function readCampaignProfile(value: unknown) {
  const ledger = record(value) && value.version === 1 ? value.completed : undefined
  const base = Array.isArray(ledger)
  const completed = base
    ? ledger.filter(
        (mission: unknown): mission is number =>
          Number.isInteger(mission) && supportedCampaignMission(mission as number)
      )
    : []
  const extension = record(value) ? value.nativeCampaign : undefined
  const extensionPresent = record(value) && Object.hasOwn(value, 'nativeCampaign')
  const valid =
    value === undefined ||
    !!(
      base &&
      [...(ledger as unknown[])].every(
        mission => Number.isInteger(mission) && supportedCampaignMission(mission as number)
      ) &&
      (!extensionPresent || nativeExtension(extension))
    )
  const native = nativeExtension(extension)
  let flags = native ? [...extension.flags] : [...createNativeCampaignFlags()]
  let legacy = value !== undefined && !native
  for (const mission of completed) {
    if (!(flags[mission - 1] & 1)) legacy = true
    flags[mission - 1] |= 1
  }
  if (legacy) flags = [...transitionNativeCampaign(flags, { kind: 'return' }).flags]
  const progress: CampaignProgress = {
    flags,
    history: legacy ? 'legacy-completed-only' : native ? extension.history : 'native-model',
  }
  return { valid, progress }
}

export function joinCampaignProgress(a: CampaignProgress, b: CampaignProgress): CampaignProgress {
  return {
    flags: a.flags.map((byte, index) => byte | b.flags[index]),
    history:
      a.history === 'legacy-completed-only' || b.history === 'legacy-completed-only'
        ? 'legacy-completed-only'
        : 'native-model',
  }
}

export function applyCampaignEvent(progress: CampaignProgress, event: CampaignEvent) {
  if (event.kind === 'completion') {
    const flags = [...progress.flags]
    flags[event.mission - 1] |= 1
    return { progress: { ...progress, flags }, recommendation: null }
  }
  const next = transitionNativeCampaign(progress.flags, event)
  return { progress: { ...progress, flags: next.flags }, recommendation: next.recommendation }
}

/** Call only after reading the latest record in the same readwrite transaction. */
export function mergeCampaignProfile(
  saved: unknown,
  local: CampaignProgress,
  events: readonly CampaignEvent[]
) {
  const decoded = readCampaignProfile(saved)
  if (!decoded.valid) return null
  let progress = joinCampaignProgress(decoded.progress, local)
  let recommendation: NativeCampaignMission | null = null
  for (const event of events) {
    const next = applyCampaignEvent(progress, event)
    progress = next.progress
    recommendation = next.recommendation ?? recommendation
  }
  return {
    progress,
    recommendation,
    profile: {
      ...(record(saved) ? saved : {}),
      version: 1,
      completed: campaignCompleted(progress),
      nativeCampaign: { version: 1, ...progress },
    },
  }
}
