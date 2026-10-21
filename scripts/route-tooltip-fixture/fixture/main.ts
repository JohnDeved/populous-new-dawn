import '../../../app/globals.css'
import { drawRouteTooltip, routeTooltipAnchor } from '../../../app/route-tooltip.ts'
import { createTooltip, showRouteTooltip, stepTooltip } from '../../../app/tooltips.ts'
import { ROUTE_FAILURE_TEXT } from '../../../app/world-rules.ts'

const style = document.createElement('style')
style.textContent =
  'html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#163030;--side:160px}'
document.head.appendChild(style)
const before = new URLSearchParams(location.search).has('before')
if (before) {
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = '/before.css'
  document.head.appendChild(link)
  const card = document.createElement('div')
  card.className = 'world-message route-notice'
  card.setAttribute('role', 'status')
  const star = document.createElement('span')
  star.textContent = '✧'
  card.appendChild(star)
  card.appendChild(document.createTextNode(ROUTE_FAILURE_TEXT))
  document.body.appendChild(card)
} else {
  const atlas = new Image(),
    border = new Image()
  atlas.src = '/original/hud.png'
  border.src = '/original/tooltip-border.png'
  await Promise.all([atlas.decode(), border.decode()])
  const element = document.createElement('div'),
    canvas = document.createElement('canvas')
  element.className = 'native-tooltip native-route-tooltip'
  element.setAttribute('role', 'tooltip')
  element.setAttribute('aria-label', ROUTE_FAILURE_TEXT)
  element.appendChild(canvas)
  document.body.appendChild(element)
  const land = { heights: new Int16Array(16384), flags: new Uint32Array(16384) },
    state = createTooltip()
  let mode = 'center',
    cell: number | undefined = 0
  showRouteTooltip(state, 0, 24)
  stepTooltip(state, false, 24)
  function render() {
    const screen = { width: innerWidth, height: innerHeight },
      layout = drawRouteTooltip(canvas, atlas, border, screen)!
    const projection = {
      matrix: [16384, 0, 0, 0, 16384, 0, 0, 0, 16384],
      curvature: 0,
      depth: 4096,
      perspective: 12,
      scale: 4096,
      width: innerWidth - 160,
      height: innerHeight,
      centerX: (innerWidth - 160) / 2,
      centerY: innerHeight / 2,
      fractionX: 4,
      fractionY: 4,
      pixelScaleX: 1 / 16,
      pixelScaleY: 1 / 16,
    }
    const viewport = { left: 160, top: 0 }
    if (mode === 'edge') {
      projection.centerX = projection.width - 6
      projection.centerY = innerHeight - 2
    }
    if (mode === 'clip') {
      projection.centerX = projection.width + 1
    }
    if (mode === 'left') {
      projection.centerX = 0
      projection.centerY = 0
      viewport.left = -10
      viewport.top = -10
    }
    const anchor = routeTooltipAnchor(
      cell,
      land,
      { center: { x: 256, y: 256 }, angle: 0, projection },
      viewport,
      screen,
      layout
    )
    element.hidden = !state.draw || !anchor
    if (anchor) {
      element.style.left = `${anchor.x - 4}px`
      element.style.top = `${anchor.y - 4}px`
    }
    element.dataset.layout = JSON.stringify({
      width: layout.width,
      height: layout.height,
      anchor,
      remaining: state.remaining,
    })
  }
  Object.assign(window, {
    routeFixture: {
      setMode(value: string) {
        mode = value
        render()
      },
      setCell(value: number | undefined) {
        cell = value
        render()
      },
      tick(count: number) {
        for (let i = 0; i < count; i++) {
          state.draw = 0
          stepTooltip(state, false, 24)
        }
        render()
      },
      reset() {
        showRouteTooltip(state, 0, 24)
        stepTooltip(state, false, 24)
        render()
      },
    },
  })
  addEventListener('resize', render)
  render()
}
