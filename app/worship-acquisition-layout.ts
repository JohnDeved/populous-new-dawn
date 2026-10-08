import type {
  WorshipAcquisitionGeometry,
  WorshipPoint,
  WorshipRect,
} from './worship-acquisition.ts'

export function interpolateWorshipPoint(
  current: WorshipPoint,
  previous: WorshipPoint | undefined,
  fraction: number
) {
  if (!previous) return { x: current.x, y: current.y }
  const alpha = Math.max(0, Math.min(1, fraction))
  return {
    x: previous.x + (current.x - previous.x) * alpha,
    y: previous.y + (current.y - previous.y) * alpha,
  }
}

export interface WorshipHudGeometry {
  shell?: WorshipRect
  viewport: WorshipRect
  targetRect: WorshipRect
  targetHud: WorshipPoint
  hudScale: number
}
const midpoint = (r: WorshipRect) => ({ x: r.x + r.width / 2, y: r.y + r.height / 2 })
export const worshipTargetPoint = (g: WorshipHudGeometry) => ({
  x: g.targetRect.x + Math.trunc(g.targetRect.width / g.hudScale / 2) * g.hudScale,
  y: g.targetRect.y + Math.trunc(g.targetRect.height / g.hudScale / 2) * g.hudScale,
})
export const worshipAnchorVisible = (p: WorshipPoint, r: WorshipRect) =>
  p.x > r.x && p.x < r.x + r.width && p.y > r.y && p.y < r.y + r.height
const mapViewport = (p: WorshipPoint, from: WorshipRect, to: WorshipRect) => ({
  x: to.x + ((p.x - from.x) * to.width) / from.width,
  y: to.y + ((p.y - from.y) * to.height) / from.height,
})

/** Resize changes only this draw mapping. Native integer geometry and arrival
 * remain in the immutable handoff reference space. */
export function worshipDrawPoint(
  p: WorshipPoint,
  reference: WorshipAcquisitionGeometry,
  current: WorshipHudGeometry,
  finalLeg = false
) {
  const mapped = mapViewport(p, reference.viewport, current.viewport)
  if (!finalLeg) return mapped
  const center = {
      x: reference.viewport.x + Math.trunc(reference.viewport.width / 2),
      y: reference.viewport.y + Math.trunc(reference.viewport.height / 2),
    },
    dx = reference.target.x - center.x,
    dy = reference.target.y - center.y,
    length = dx * dx + dy * dy,
    fraction = length
      ? Math.max(0, Math.min(1, ((p.x - center.x) * dx + (p.y - center.y) * dy) / length))
      : 1,
    previousTarget = mapViewport(reference.target, reference.viewport, current.viewport),
    target = worshipTargetPoint(current)
  return {
    x: mapped.x + fraction * (target.x - previousTarget.x),
    y: mapped.y + fraction * (target.y - previousTarget.y),
  }
}

export function worshipHandoffGeometry(
  current: WorshipHudGeometry,
  anchor?: { point: WorshipPoint; viewport: WorshipRect; valid: boolean }
): WorshipAcquisitionGeometry {
  const scale = current.hudScale,
    point =
      anchor?.valid && worshipAnchorVisible(anchor.point, anchor.viewport)
        ? mapViewport(anchor.point, anchor.viewport, current.viewport)
        : midpoint(current.viewport),
    logicalPoint = (p: WorshipPoint) => ({
      x: Math.trunc(p.x / scale),
      y: Math.trunc(p.y / scale),
    }),
    logicalRect = (r: WorshipRect) => ({
      ...logicalPoint(r),
      width: Math.trunc(r.width / scale),
      height: Math.trunc(r.height / scale),
    })
  return {
    ...(current.shell ? { shell: logicalRect(current.shell) } : {}),
    viewport: logicalRect(current.viewport),
    origin: logicalPoint(point),
    target: logicalPoint(worshipTargetPoint(current)),
    targetRect: logicalRect(current.targetRect),
    targetHud: { ...current.targetHud },
    hudScale: scale,
  }
}

/** Building faces use the source countdown's explicit flight fraction. The
 * spell body's distance heuristic cannot describe independent spinning faces. */
export function buildingDrawPoint(
  point: WorshipPoint,
  reference: WorshipAcquisitionGeometry,
  current: WorshipHudGeometry,
  flight: number
) {
  const mapped = mapViewport(point, reference.viewport, current.viewport),
    oldTarget = mapViewport(reference.target, reference.viewport, current.viewport),
    target = worshipTargetPoint(current)
  return {
    x: mapped.x + flight * (target.x - oldTarget.x),
    y: mapped.y + flight * (target.y - oldTarget.y),
  }
}
