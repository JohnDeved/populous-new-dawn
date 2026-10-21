import { routeNoticeCell } from './route-notice.ts'
import { movePosition } from './native-math.ts'
import { terrainPointHeight, type NativeTerrain } from './native-terrain.ts'
import { projectPoint, relativeCoordinate, type Projection } from './projection.ts'
import { paintTooltipText, tooltipLayout } from './tooltip-layout.ts'
import { ROUTE_FAILURE_TEXT } from './world-rules.ts'

// Mode 9 uses the last command's packed destination, not the failing unit.
export function routeTooltipAnchor(
  cell: number | undefined,
  land: Pick<NativeTerrain, 'heights' | 'flags'>,
  view: { center: { x: number; y: number }; angle: number; projection: Projection },
  viewport: { left: number; top: number },
  screen: { width: number; height: number },
  text: { width: number; height: number }
) {
  // Older current-format saves have no captured destination. Do not manufacture
  // an anchor from the current cursor, camera, or a follower reporting failure.
  cell = routeNoticeCell(cell)
  if (cell === undefined) return null
  const point = {
    x: (((cell & 254) + 1) << 8) & 65535,
    y: ((((cell >>> 8) & 254) + 1) << 8) & 65535,
  }
  movePosition(point, (view.angle + 512) & 2047, 128)
  const projected = projectPoint(
    {
      x: relativeCoordinate(point.x, view.center.x),
      y: terrainPointHeight(land, point),
      z: relativeCoordinate(point.y, view.center.y),
    },
    view.projection
  )
  if (projected.flags & 30) return null
  let x = Math.max(0, Math.min(screen.width, Math.trunc(projected.screenX + viewport.left))),
    y = Math.max(0, Math.min(screen.height, Math.trunc(projected.screenY + viewport.top)))
  if (x + text.width >= screen.width) x = screen.width - text.width
  if (y + text.height >= screen.height) y = screen.height - text.height
  return { x, y }
}

export function drawRouteTooltip(
  canvas: HTMLCanvasElement,
  atlas: HTMLImageElement,
  border: HTMLImageElement,
  screen: { width: number; height: number }
) {
  if (!atlas?.complete || !atlas.naturalWidth || !border?.complete || !border.naturalWidth)
    return null
  const key = JSON.stringify(['route', screen.width, screen.height])
  if (canvas.dataset.layout === key) return { width: canvas.width - 7, height: canvas.height - 7 }
  const layout = tooltipLayout(ROUTE_FAILURE_TEXT, screen.width, screen.height)
  // The native frame's right/bottom endpoints are text extent +3, not +4.
  // Paint frame before text: the last glyph column can overlap its inner edge.
  const width = layout.width + 7,
    height = layout.height + 7
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')!
  context.imageSmoothingEnabled = false
  context.fillStyle = '#ff2500'
  context.fillRect(0, 0, width, height)
  const tile = (sx: number, sy: number, x: number, y: number, w = 4, h = 4) =>
    context.drawImage(border, sx, sy, w, h, x, y, w, h)
  for (let x = 4; x < width - 4; x += 4) {
    const w = Math.min(4, width - 4 - x)
    tile(4, 0, x, 0, w)
    tile(4, 8, x, height - 4, w)
  }
  for (let y = 4; y < height - 4; y += 4) {
    const h = Math.min(4, height - 4 - y)
    tile(0, 4, 0, y, 4, h)
    tile(8, 4, width - 4, y, 4, h)
  }
  tile(0, 0, 0, 0)
  tile(8, 0, width - 4, 0)
  tile(0, 8, 0, height - 4)
  tile(8, 8, width - 4, height - 4)
  paintTooltipText(context, atlas, layout, 4, 4)
  canvas.dataset.layout = key
  return layout
}
