import type { GameScene } from './scene.ts'

// Native object panels own class-10/model-3 secondary records. Current person
// panels have their own live lifetime; building panels retain the existing
// visibility adapter until that lifetime is ported. Count actual active owners,
// never a fixed reserve. A visible browser placement preview owns one reservation;
// its native transient lifecycle remains the current preview adapter. These
// transient UI reservations are rebuilt on load.
export function syncSecondaryReservations(scene: GameScene) {
  if (!scene.world.secondaryEffects) return
  scene.world.secondaryEffects.reservations = [
    ...[...(scene.objectPanels?.panels.keys() ?? [])].map(id => `object-panel:${id}`),
    ...[...(scene.buildingPanels ?? [])].flatMap(([id, panel]) =>
      panel.hidden ? [] : [`building-panel:${id}`]
    ),
    ...(scene.cursor?.visible ? ['placement-preview'] : []),
  ]
}
