import type { GameScene } from './scene.ts'
import { trainingPanelRequestOwner } from './training-panel-requests.ts'

// Native object panels own class-10/model-3 secondary records. Current person
// panels and retained building records have their own live lifetime; other buildings retain the existing
// visibility adapter until that lifetime is ported. Count actual active owners,
// never a fixed reserve. A visible browser placement preview owns one reservation;
// its native transient lifecycle remains the current preview adapter. These
// transient UI reservations are rebuilt on load.
export function syncSecondaryReservations(scene: GameScene) {
  if (!scene.world.secondaryEffects) return
  const current = trainingPanelRequestOwner(scene.world)
  // A replaced Scene may finish disposal after its successor has bound this
  // same World. Its empty maps must not erase the successor's reservations.
  if (current && current !== scene.objectPanels) return
  const buildingOwners = new Set(scene.objectPanels?.buildingRecords?.keys() ?? [])
  for (const [id, panel] of scene.buildingPanels ?? [])
    if (
      !panel.hidden &&
      !scene.world.buildings.some(b => b.id === id && b.kind === 'hut' && b.progress >= 1)
    )
      buildingOwners.add(id)
  // Capture the assignment target before reading panel/cursor owners, just as
  // the original assignment did. Publish a fresh array only after all reads;
  // observers and reentrant calls must not see or overwrite a partial result.
  const effects = scene.world.secondaryEffects,
    reservations: string[] = []
  for (const id of scene.objectPanels?.panels.keys() ?? []) reservations.push(`object-panel:${id}`)
  for (const id of buildingOwners) reservations.push(`building-panel:${id}`)
  if (scene.cursor?.visible) reservations.push('placement-preview')
  effects.reservations = reservations
}
