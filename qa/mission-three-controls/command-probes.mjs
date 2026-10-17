// Verification-only context resolution. These source-owned synchronizers can
// mutate their input, so they receive only a detached clone, never the live World.
import { liveCommandContext } from '../../app/live-command.ts'
import { syncNativeTerrain, syncLandscapeObjects } from '../../app/world-terrain-runtime.ts'

export function createMoveContextProbe(world) {
  const probe = structuredClone(world)
  syncNativeTerrain(probe)
  syncLandscapeObjects(probe)
  return point => {
    const context = liveCommandContext(probe, point)
    return { model: context?.model ?? null, enabled: context?.enabled === true,
      buildingId: context?.building?.id ?? null, personId: context?.person?.id ?? null,
      shrineId: context?.shrine?.id ?? null, treeId: context?.tree?.id ?? null,
      vehicleId: context?.vehicle?.id ?? null }
  }
}

export const isOrdinaryMoveContext = context => context?.model === 3 && context.enabled === true
