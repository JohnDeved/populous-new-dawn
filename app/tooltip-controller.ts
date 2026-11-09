import {
  clearTooltip,
  showObjectTooltip,
  tooltipName,
  tooltipPalette,
  type TooltipObject,
  type TooltipState,
} from './tooltips.ts'

type Category = 'none' | 'object' | 'cell' | 'hud'
export interface TooltipSession {
  visits: number
  sampleAt: number | null
  sampleCount: number
  sample: number
  threshold: number
  initializedBy: Category | 'inspection' | null
}
export const createTooltipSession = (): TooltipSession => ({
  visits: 0,
  sampleAt: null,
  sampleCount: 0,
  sample: 0,
  threshold: 0,
  initializedBy: null,
})
export interface TooltipOutput extends TooltipState {
  pointer: { clientX: number; clientY: number } | null
  kind: Category | 'forced'
}
export interface TooltipController {
  session: TooltipSession
  category: Category
  key: number | string | null
  dwell: number
  owners: { hud: string | null; object: number; cell: number; status: number; message: number }
  output: TooltipOutput
  unsupportedHistory: string[]
  lastVisit: {
    ordinal: number
    now: number
    route: string
    forced: { entryRemaining: number; handled: boolean; remaining: number }
    firstDisplay: number | null
    inspection: string[]
  } | null
}
export function createTooltipController(
  state: TooltipState,
  session: TooltipSession
): TooltipController {
  return {
    session,
    category: 'none',
    key: null,
    dwell: 0,
    owners: { hud: null, object: 0, cell: 0, status: 0, message: 0 },
    output: { ...state, pointer: null, kind: 'none' },
    unsupportedHistory: [],
    lastVisit: null,
  }
}

export function sampleTooltipFrontend(controller: TooltipController, now: number) {
  const { session } = controller
  if (session.sampleAt === null) session.sampleAt = now
  if (now - session.sampleAt >= 1000) {
    session.sample = Math.max(0, session.visits - session.sampleCount)
    session.sampleCount = session.visits
    session.sampleAt = now
  }
  session.visits++
}

export function tooltipThreshold(
  controller: TooltipController,
  owner: TooltipSession['initializedBy']
) {
  const { session } = controller
  if (!session.threshold) {
    session.threshold = Math.max(session.sample, 12)
    session.initializedBy = owner
  }
  return session.threshold
}

export function resetTooltipController(controller: TooltipController, state: TooltipState) {
  clearTooltip(state)
  controller.category = 'none'
  controller.key = null
  controller.dwell = 0
}

export function acquireForcedTooltip(
  controller: TooltipController,
  state: TooltipState,
  object: TooltipObject | null,
  duration: number
) {
  resetTooltipController(controller, state)
  showObjectTooltip(state, object, duration)
}

export function objectTooltipText(object: TooltipObject) {
  const name = tooltipName(object)
  if (!name.stringId) return ''
  let text = (tooltipPalette.strings as Record<number, string>)[name.stringId]
  if (name.tribe && object.owner !== -1)
    text = text.replace('%s', ['Blue', 'Dakini', 'Chumara', 'Matak'][object.owner])
  return text
}

export function visitObjectTooltip(
  controller: TooltipController,
  state: TooltipState,
  object: TooltipObject | null
) {
  controller.owners.object = object?.id ?? 0
  if (!object) return false
  if (controller.category !== 'object' || controller.key !== object.id) {
    controller.category = 'object'
    controller.key = object.id
    state.text = objectTooltipText(object)
    state.fixed = 0
    if (state.text) controller.dwell = 0
    return false
  }
  const threshold = tooltipThreshold(controller, 'object')
  if (controller.dwell < threshold) {
    controller.dwell++
    return false
  }
  if (!state.text) return false
  state.draw = 1
  if (controller.dwell !== threshold) return false
  controller.dwell++
  return true
}

export function visitBlankCellTooltip(
  controller: TooltipController,
  state: TooltipState,
  cell: number
) {
  controller.owners.cell = cell
  if (controller.category !== 'cell' || controller.key !== cell) {
    controller.category = 'cell'
    controller.key = cell
    state.text = ''
    state.fixed = 0
    state.flags &= ~1
    return
  }
  if (controller.dwell <= tooltipThreshold(controller, 'cell')) controller.dwell++
}

export interface HudTooltip {
  owner: string
  text: string
  repeatable: boolean
  enabled: boolean
}
export function visitHudTooltip(
  controller: TooltipController,
  state: TooltipState,
  hud: HudTooltip | null
) {
  controller.owners.hud = hud?.owner ?? null
  if (!hud) return
  if (controller.category !== 'hud' || controller.key !== hud.owner || !hud.repeatable) {
    controller.category = 'hud'
    controller.key = hud.owner
    controller.dwell = 0
    return
  }
  if (controller.dwell <= tooltipThreshold(controller, 'hud')) {
    controller.dwell++
    return
  }
  if (hud.enabled && hud.text) {
    state.text = hud.text
    state.draw = 1
  }
}

export function finishOrdinaryTooltip(controller: TooltipController, state: TooltipState) {
  if (!state.draw) {
    state.scroll = 0
    state.hold = controller.session.sample * 2
  }
  if (!Object.values(controller.owners).some(Boolean)) resetTooltipController(controller, state)
}
