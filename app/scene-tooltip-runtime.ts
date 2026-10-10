import type { GameScene } from './scene.ts'
import { buildingInsidePoint, buildingPose } from './building-shapes.ts'
import { browserPosition, effect, nativePosition } from './model.ts'
import { retainedBuildingPanel } from './building-panels.ts'
import { stepTooltip, tooltipPalette, worldTooltipObject, type TooltipObject } from './tooltips.ts'
import {
  acquireForcedTooltip as acquireForced,
  createTooltipController,
  createTooltipSession,
  finishOrdinaryTooltip,
  resetTooltipController,
  sampleTooltipFrontend,
  visitBlankCellTooltip,
  visitHudTooltip,
  visitObjectTooltip,
  type HudTooltip,
} from './tooltip-controller.ts'

export interface TooltipInputSample {
  pointer: { clientX: number; clientY: number } | null
  object: TooltipObject | null
  picked: number | null
  cell: number | null
  inspectionTarget: number | null
  route:
    | 'world'
    | 'hud'
    | 'outside'
    | 'unmapped-hud'
    | 'unmapped-object'
    | 'unmapped-cell'
    | 'unmapped-panel'
    | 'message'
  hud: HudTooltip | null
  message: number
}
export interface TooltipInspectionInput {
  kind: 'down' | 'up'
  pointerId: number
  target: number
  cell: number | null
}

export function getTooltipController(scene: GameScene) {
  return (scene.tooltipController ??= createTooltipController(
    scene.tooltip,
    (scene.tooltipSession ??= createTooltipSession())
  ))
}
const packedCell = (point: { x: number; y: number }) => ((point.x >> 8) & 254) | (point.y & 0xfe00)

function tooltipObject(scene: GameScene, id: number): TooltipObject | null {
  const object = worldTooltipObject(scene.world, id)
  if (object) {
    const { x, z, type, model, owner, tutorial, head } = object
    return { id, x, z, type, model, owner, tutorial, head }
  }
  const tree = scene.world.trees.find(
    candidate =>
      candidate.id === id && candidate.logs >= 1 && candidate.model >= 1 && candidate.model <= 6
  )
  return tree
    ? { id, x: tree.x, z: tree.z, type: 5, model: tree.model, owner: -1, tutorial: 0, head: null }
    : null
}

function hutCell(scene: GameScene, id: number) {
  const building = scene.world.buildings.find(candidate => candidate.id === id && candidate.hp > 0)
  return building ? packedCell(buildingInsidePoint(buildingPose(building))) : null
}

function blankCell(scene: GameScene, cell: number) {
  const index = (cell >> 9) * 128 + ((cell & 255) >> 1)
  return !(scene.world.land.flags[index] & (0x400 | 0x10000 | 0x4000000))
}
function inspectionTarget(scene: GameScene, picked: number | null, cell: number | null) {
  const building = scene.world.buildings.find(
    b =>
      b.id === picked &&
      retainedBuildingPanel(b, scene.world.manaWorld.playerTribe) &&
      b.team === 'blue' &&
      b.hp > 0
  )
  if (building) return building.id
  if (picked !== null || cell === null) return null
  const index = (cell >> 9) * 128 + ((cell & 255) >> 1),
    id = scene.world.land.buildingIds[index] & 1023
  return (
    scene.world.buildings.find(
      b =>
        b.id === id &&
        retainedBuildingPanel(b, scene.world.manaWorld.playerTribe) &&
        b.team === 'blue' &&
        b.hp > 0
    )?.id ?? null
  )
}

// The original HUD key is a live allocated control slot, not its action number.
// A mounted DOM control supplies the equivalent equality/lifetime relationship.
function hudOwner(scene: GameScene, element: Element) {
  scene.tooltipHudOwners ??= new WeakMap()
  let owner = scene.tooltipHudOwners.get(element)
  if (!owner) {
    scene.tooltipHudSerial = (scene.tooltipHudSerial ?? 0) + 1
    owner = `hud:${scene.tooltipHudSerial}`
    scene.tooltipHudOwners.set(element, owner)
  }
  return owner
}

export function publishTooltipInput(scene: GameScene, geometryChanged = true) {
  const pointer = scene.navigationPointer
      ? { clientX: scene.navigationPointer.x, clientY: scene.navigationPointer.y }
      : scene.pointerScreen,
    hit = pointer && document.elementFromPoint?.(pointer.clientX, pointer.clientY),
    hud = hit?.closest('[data-tooltip-hud]'),
    panel = hit?.closest('.training-panel,.person-panel'),
    message = hit?.closest<HTMLElement>('[data-message-serial]'),
    sample: TooltipInputSample = {
      pointer,
      object: null,
      picked: null,
      cell: null,
      inspectionTarget: null,
      route: 'outside',
      hud: null,
      message: 0,
    }
  if (hud?.getAttribute('data-tooltip-hud') === 'blast') {
    const player = scene.world.manaWorld.playerTribe,
      owner = scene.world.manaTribes[player]?.spellOwner ?? player,
      available =
        !!(scene.world.manaWorld.spells[owner]?.available & (1 << 2)) ||
        !!(scene.world.shots.blast & 15)
    sample.route = 'hud'
    sample.hud = {
      owner: hudOwner(scene, hud),
      text: available ? ((tooltipPalette.strings as Record<number, string>)[814] ?? '') : '',
      repeatable: true,
      enabled: true,
    }
  } else if (message) {
    sample.route = 'message'
    sample.message =
      scene.world.messages.slots.findIndex(
        entry => entry?.serial === Number(message.dataset.messageSerial)
      ) + 1
  } else if (panel) sample.route = 'unmapped-panel'
  else if (hit?.closest('aside')) sample.route = 'unmapped-hud'
  else if (scene.pointerScreen) {
    sample.route = 'world'
    const previous = scene.tooltipInput,
      reuse =
        !geometryChanged &&
        previous &&
        ['world', 'unmapped-cell', 'unmapped-object'].includes(previous.route),
      id = reuse ? previous.picked : scene.picking.pick(scene.pointerScreen)
    sample.picked = id
    sample.object = id === null ? null : tooltipObject(scene, id)
    if (reuse) sample.cell = previous.cell
    else if (id !== null) sample.cell = hutCell(scene, id)
    if (id !== null && !sample.object) sample.route = 'unmapped-object'
    if (!reuse && sample.cell === null) {
      const ground = scene.pick(scene.pointerScreen)
      if (ground) sample.cell = packedCell(nativePosition(scene.world, ground))
    }
    sample.inspectionTarget = inspectionTarget(scene, id, sample.cell)
    if (!sample.object && sample.cell !== null && !blankCell(scene, sample.cell))
      sample.route = 'unmapped-cell'
  }
  scene.tooltipInput = sample
}

export function cancelTooltipInspection(scene: GameScene) {
  if (scene.tooltipInspectionInputs) scene.tooltipInspectionInputs.length = 0
  scene.objectPanels?.releaseBuildingInspection?.()
}

function explicitAdmission(scene: GameScene) {
  return (
    scene.world.status === 'playing' &&
    !scene.world.paused &&
    !scene.world.inputMask &&
    !scene.world.mode &&
    !scene.world.selected.length &&
    !scene.overviewActive &&
    !scene.overviewStage &&
    !document.hidden &&
    !document.querySelector('dialog[open]')
  )
}

export function queueBuildingInspection(
  scene: GameScene,
  event: PointerEvent,
  kind: 'down' | 'up',
  target = 0
) {
  if (event.button !== 2) return
  scene.tooltipInspectionInputs ??= []
  const inputs = scene.tooltipInspectionInputs
  if (kind === 'up') {
    inputs.push({ kind: 'up', pointerId: event.pointerId, target, cell: null })
    return
  }
  if (
    !explicitAdmission(scene) ||
    event.shiftKey ||
    event.ctrlKey ||
    event.altKey ||
    event.metaKey
  ) {
    cancelTooltipInspection(scene)
    return
  }
  if (event.currentTarget !== scene.renderer.domElement) return
  if (!target && scene.picking.pick(event) !== null) return
  const cell =
      hutCell(scene, target) ??
      (() => {
        const ground = scene.pick(event)
        return ground ? packedCell(nativePosition(scene.world, ground)) : null
      })(),
    id = inspectionTarget(scene, target || null, cell)
  if (id !== null) inputs.push({ kind: 'down', pointerId: event.pointerId, target: id, cell })
}

export function acquireForcedTooltip(
  scene: GameScene,
  object: TooltipObject | null,
  duration: number
) {
  acquireForced(getTooltipController(scene), scene.tooltip, object, duration)
}

export function updateTooltipController(scene: GameScene, now: number) {
  const owner = getTooltipController(scene),
    state = scene.tooltip,
    sample = scene.tooltipInput,
    picked = sample?.picked,
    object = picked === null || picked === undefined ? null : tooltipObject(scene, picked),
    currentInspection = sample ? inspectionTarget(scene, sample.picked, sample.cell) : null,
    modal = !!document.querySelector('dialog[open]'),
    blocked = modal || !!scene.world.inputMask || scene.overviewActive || !!scene.overviewStage,
    ordinary =
      !blocked &&
      !scene.world.mode &&
      !scene.world.selected.length &&
      scene.world.status === 'playing',
    entryRemaining = state.remaining,
    inspection: string[] = []
  if (
    !blocked &&
    sample &&
    (sample.route.startsWith('unmapped-') || sample.route === 'message') &&
    !owner.unsupportedHistory.includes(sample.route)
  )
    owner.unsupportedHistory.push(sample.route)
  state.draw = 0
  sampleTooltipFrontend(owner, now)
  if (!blocked) {
    owner.owners.message = sample?.message ?? 0
    visitHudTooltip(owner, state, sample?.hud ?? null)
  }
  const handled = stepTooltip(state, !!worldTooltipObject(scene.world, state.target), 24)
  let route: string = sample?.route ?? 'outside'
  if (blocked) route = 'blocked'
  if (handled) route = 'forced'
  let firstDisplay: number | null = null
  if (handled && !state.remaining) resetTooltipController(owner, state)
  if (!handled && ordinary && !sample?.hud) {
    const worldRoute =
      sample && ['world', 'unmapped-cell', 'unmapped-object'].includes(sample.route)
    if (worldRoute && object) {
      route = 'object'
      if (visitObjectTooltip(owner, state, object)) {
        firstDisplay = object.id
        inspection.push(scene.objectPanels.inspectBuilding(object.id, 'hover'))
      }
    } else if (worldRoute && sample.cell !== null && blankCell(scene, sample.cell)) {
      route = 'cell'
      visitBlankCellTooltip(owner, state, sample.cell)
    } else if (worldRoute && sample.cell !== null) {
      route = 'unmapped-cell'
      if (!owner.unsupportedHistory.includes(route)) owner.unsupportedHistory.push(route)
    } else if (sample?.route === 'world' && sample.picked === null) route = 'no-handler'
    if (route === 'object' || route === 'cell' || route === 'outside' || route === 'no-handler')
      finishOrdinaryTooltip(owner, state)
  } else if (!handled && !blocked && sample?.hud) finishOrdinaryTooltip(owner, state)

  if (!explicitAdmission(scene)) cancelTooltipInspection(scene)
  const pending = scene.tooltipInspectionInputs?.splice(0) ?? []
  for (const event of pending) {
    if (event.kind === 'up') {
      scene.objectPanels.releaseBuildingButton(event.pointerId)
      inspection.push('release')
    } else if (
      explicitAdmission(scene) &&
      sample &&
      ['world', 'unmapped-cell', 'unmapped-object'].includes(sample.route) &&
      currentInspection === event.target &&
      sample.cell === event.cell
    ) {
      inspection.push(scene.objectPanels.inspectBuilding(event.target, 'explicit', event.pointerId))
      const building = scene.world.buildings.find(candidate => candidate.id === event.target)!
      // 0047ae00 -> 004afff0 keeps feedback after the allocation attempt, even
      // on capacity failure. Keep the existing browser coordinate/marker adapter;
      // native packed-plan placement and physical allocation are separate limits.
      effect(
        scene.world,
        'orderMarker',
        browserPosition(buildingInsidePoint(buildingPose(building)))
      )
      scene.onSound(0x6a)
    } else inspection.push('cancel-stale')
  }
  if (!blocked) scene.objectPanels.renewBuildingInspection(object?.id ?? null)
  scene.objectPanels.stepBuildingInspections(
    !modal && !scene.overviewActive && !scene.overviewStage
  )
  owner.output = {
    ...state,
    pointer: sample?.pointer ? { ...sample.pointer } : null,
    kind: handled ? 'forced' : owner.category,
    // Browser HUD descriptions keep their existing presentation; the native HUD
    // text still participates in the shared history and forced composition.
    draw: modal || (!handled && owner.category === 'hud') ? 0 : state.draw,
  }
  owner.lastVisit = {
    ordinal: owner.session.visits,
    now,
    route,
    forced: { entryRemaining, handled, remaining: state.remaining },
    firstDisplay,
    inspection,
  }
}

// Normal world painting clears status ownership. An actual unsupported panel
// handoff remains visible in the input route; it is not asserted to be no-handler.
export function publishTooltipStatus(scene: GameScene) {
  if (scene.tooltipController && !scene.overviewActive) scene.tooltipController.owners.status = 0
}
