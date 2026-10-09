import type { GameScene } from './scene.ts'

// Native object panels own class-10/model-3 secondary records. Current person
// panels and Hut records have their own live lifetime; other buildings retain the existing
// visibility adapter until that lifetime is ported. Count actual active owners,
// never a fixed reserve. A visible browser placement preview owns one reservation;
// its native transient lifecycle remains the current preview adapter. These
// transient UI reservations are rebuilt on load.
export function syncSecondaryReservations(scene: GameScene) {
  if (!scene.world.secondaryEffects) return
  scene.world.secondaryEffects.reservations = [
    ...[...(scene.objectPanels?.panels.keys() ?? [])].map(id => `object-panel:${id}`),
    ...[...(scene.objectPanels?.hutRecords?.keys() ?? [])].map(id => `building-panel:${id}`),
    ...[...(scene.buildingPanels ?? [])].flatMap(([id, panel]) =>
      panel.hidden ||
      scene.world.buildings.some(b => b.id === id && b.kind === 'hut' && b.progress >= 1)
        ? []
        : [`building-panel:${id}`]
    ),
    ...(scene.cursor?.visible ? ['placement-preview'] : []),
  ]
}
