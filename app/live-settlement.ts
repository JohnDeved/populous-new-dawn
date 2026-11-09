import type { World } from './world-types.ts'
import type { CollisionWorld, CollisionObject } from './person-collision.ts'
import type { SettlingPerson } from './person-physics.ts'

// Scheduler-only plain records. Keep this lookup private and unmodified; the
// proved no-use branch of settlePerson is its only production consumer.
// This is an internal calling convention, not a capability or runtime freeze.
const unusedObjects: ReadonlyMap<number, CollisionObject> = new Map()

export function ownedSettlementObjects(
  w: Pick<World, 'landVersion' | 'terrainVersion'>,
  p: Pick<SettlingPerson, 'flags3' | 'flags4' | 'target'>,
  collision: CollisionWorld
) {
  // Run at the old argument-evaluation point, not before bounce/landing effects.
  // Dirty terrain keeps the original getter, including its existing cache:
  // nativePosition can synchronize terrain and notify physical owners.
  return w.landVersion === w.terrainVersion &&
    (!(p.flags3 & 0x10000) || !p.target || !!(p.flags4 & 0x2000))
    ? unusedObjects
    : collision.objects
}
