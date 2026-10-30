/** Browser checkpoint adaptation, not the original save-slot or Help controller.
 * Keep original 24px moving caps and a 1px tiled body at their native size. */
export const CHECKPOINT_COPY_WIDTH = 368
export const checkpointScrollAssets = [451, 452, 453, 454, 455].map((id, index) => ({
  url: `/original/help/hfx-${id}.png`,
  width: 24,
  height: [10, 12, 10, 12, 1][index],
}))

export function checkpointScrollGeometry(visible: number, content: number, position: number) {
  const maximum = Math.max(0, content - visible)
  // A 12px minimum drag body keeps both 10/12px caps and a usable body visible.
  const thumb = maximum ? Math.min(visible, Math.max(34, Math.floor(visible ** 2 / content))) : 0
  const travel = visible - thumb
  const offset = maximum
    ? Math.round((Math.max(0, Math.min(maximum, position)) * travel) / maximum)
    : 0
  return { maximum, thumb, travel, offset }
}

export function checkpointDragPosition(
  position: number,
  screenDelta: number,
  screenHeight: number,
  visible: number,
  content: number
) {
  const { maximum, travel } = checkpointScrollGeometry(visible, content, position)
  if (screenHeight <= 0 || travel <= 0) return position
  return Math.max(
    0,
    Math.min(maximum, position + (((screenDelta * visible) / screenHeight) * maximum) / travel)
  )
}
