import hud from './original-hud.json' with { type: 'json' }
import { paintPanel, panelControl, panelFrame, type PanelDraw } from './training-panel.ts'

export const BOAT_HOUSE_CAPACITY = 4
export const BOAT_HOUSE_WORK_PER_BLOCK = 100
export const BOAT_HOUSE_WORK_BLOCKS = 6
export const BOAT_HOUSE_WORK_THRESHOLD = BOAT_HOUSE_WORK_PER_BLOCK * BOAT_HOUSE_WORK_BLOCKS

export interface BoatHousePanelState {
  occupants: { model: number; selected: boolean }[]
  progress: number
  dismantling: boolean
  turn: number
  controlHover?: boolean
  controlPressed?: boolean
}

const rects = hud.rects as Record<string, { x: number; y: number; w: number; h: number }>

function geometry() {
  const person = rects[75],
    work = rects[40],
    button = rects[46],
    tail = rects[52],
    occupantWidth = (person.w + 1) * BOAT_HOUSE_CAPACITY + 4,
    workWidth = (work.w + 1) * BOAT_HOUSE_WORK_BLOCKS + 4,
    rowWidth = Math.max(occupantWidth, workWidth),
    controlWidth = button.w + 4,
    contentWidth = rowWidth + controlWidth,
    width = (contentWidth + 7) & ~7,
    x = Math.trunc((width - contentWidth) / 2),
    occupantHeight = person.h + 5,
    workHeight = work.h + 5
  return {
    person,
    work,
    tail,
    occupantWidth,
    workWidth,
    rowWidth,
    controlWidth,
    contentWidth,
    width,
    x,
    occupantHeight,
    workHeight,
  }
}

export function boatHousePanelControls() {
  const { person, occupantWidth, rowWidth, x } = geometry(),
    start = x + Math.trunc((rowWidth - occupantWidth) / 2) + 1
  return {
    people: Array.from({ length: BOAT_HOUSE_CAPACITY }, (_, i) => ({
      x: start + i * (person.w + 1),
      y: 1,
    })),
    control: { x: x + rowWidth, y: 0 },
  }
}

export function boatHouseWorkBlocks(progress: number) {
  return Math.max(
    0,
    Math.min(BOAT_HOUSE_WORK_BLOCKS, Math.trunc(progress / BOAT_HOUSE_WORK_PER_BLOCK))
  )
}

// 0x504bc0 kind-6 workshop branch: owner occupants/control, discrete vehicle-work row and tail.
export function boatHousePanel(s: BoatHousePanelState) {
  const {
      person,
      work,
      tail,
      occupantWidth,
      workWidth,
      rowWidth,
      controlWidth,
      contentWidth,
      width,
      x,
      occupantHeight,
      workHeight,
    } = geometry(),
    events: PanelDraw[] = [],
    peopleStart = x + Math.trunc((rowWidth - occupantWidth) / 2) + 1,
    workY = occupantHeight,
    workStart = x + Math.trunc((rowWidth - workWidth) / 2) + 2,
    filled = boatHouseWorkBlocks(s.progress)

  panelFrame(events, x, 0, rowWidth, occupantHeight)
  for (let i = 0; i < BOAT_HOUSE_CAPACITY; i++) {
    const occupant = s.occupants[i],
      left = peopleStart + i * (person.w + 1)
    if (!occupant) events.push(['sprite', 75, left, 1, 172, true])
    else {
      const sprite = 73 + occupant.model
      events.push(
        ['sprite', sprite, left + 1, 2, 172, false],
        ['sprite', sprite, left, 1, -1, false]
      )
      if (occupant.selected)
        events.push(['sprite', 53, left + Math.trunc((person.w - rects[53].w) / 2), 0, -1, false])
    }
  }

  panelFrame(events, x + rowWidth, 0, controlWidth, occupantHeight)
  panelControl(events, x + rowWidth + 3, 3, s)

  panelFrame(events, x, workY, contentWidth, workHeight)
  for (let i = 0; i < BOAT_HOUSE_WORK_BLOCKS; i++) {
    const left = workStart + i * (work.w + 1),
      top = workY + 2
    if (i < filled)
      events.push(
        ['sprite', 40, left + 1, top + 1, 172, false],
        ['sprite', 40, left, top, -1, false]
      )
    else events.push(['sprite', 40, left, top, 172, true])
  }

  events.push([
    'sprite',
    52,
    x + Math.trunc((contentWidth - tail.w) / 2),
    occupantHeight + workHeight,
    -1,
    false,
  ])
  return { width, height: occupantHeight + workHeight + tail.h, events }
}

export function drawBoatHousePanel(
  canvas: HTMLCanvasElement,
  atlas: HTMLImageElement,
  state: BoatHousePanelState
) {
  if (!atlas?.complete || !atlas.naturalWidth) return
  const key = JSON.stringify({ ...state, turn: state.dismantling ? state.turn & 2 : 0 })
  if (canvas.dataset.layout === key) return
  paintPanel(canvas, atlas, boatHousePanel(state))
  canvas.dataset.layout = key
}
