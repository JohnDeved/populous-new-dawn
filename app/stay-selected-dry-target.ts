import { restingCellCollision, type CollisionCell } from './person-collision.ts'

type DestinationContext = {
  model: number
  enabled: boolean
  person?: unknown
  building?: unknown
  shrine?: unknown
  tree?: unknown
  vehicle?: unknown
}

// Only the dry, object-free destination. Pointer provenance and ownership
// checks belong to the caller, and ordinary Move admission is unchanged.
export function isStaySelectedDryTarget(
  pointerId: number | undefined,
  context: DestinationContext,
  cell: Pick<CollisionCell, 'flags' | 'category'>,
  walkMask: ArrayLike<number>,
  nativePoint: { x: number; y: number }
) {
  return (
    pointerId === undefined &&
    context.model === 3 &&
    context.enabled === true &&
    context.person === undefined &&
    context.building === undefined &&
    context.shrine === undefined &&
    context.tree === undefined &&
    context.vehicle === undefined &&
    restingCellCollision(cell, walkMask, nativePoint, false) === 0
  )
}
