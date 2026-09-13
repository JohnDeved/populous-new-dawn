import type { GameScene } from './scene.ts'
import * as THREE from 'three'
import {
  nativePosition,
  browserPosition,
  canOrder,
  placementError,
  buildingPlanPose,
  SPELLS,
  cast,
  placeBuilding,
  cancelInteraction,
  selectArea,
  selectUnit,
  effect,
  hudPeople,
  isShaman,
  selectFollowers,
  spellTargetError,
  type Building,
  type Point,
} from './model'
import { command } from './live-command.ts'
import { focusHudPerson } from './hud-selection.ts'
import { pointerBrackets } from './world-picking.ts'
import { commandMarkerPoint } from './command-context.ts'
import { dragCamera, cameraCommand, cameraEdgeButtons, mergeCameraInput } from './camera-input.ts'
import { beginGlobeDrag } from './globe.ts'
import { cameraBookmark } from './scene-camera-runtime.ts'
import {
  dragEndpoint,
  dragCommand,
  dragCorners,
  unwrapDragCorners,
  dragMoved,
} from './drag-selection.ts'
import { nativeAngle, positionDistance } from './native-math.ts'
import { spellCursor } from './spell-casting.ts'
import nativeHud from './original-hud.json'
import { buildingPlanCells, type BuildingShapePose } from './building-shapes.ts'
import { groundOverlay, groundOverlayTriangles } from './ground-overlay.ts'

const cameraKeys: Record<string, number> = {
  w: 1,
  arrowup: 1,
  s: 2,
  arrowdown: 2,
  a: 199,
  arrowleft: 5,
  d: 200,
  arrowright: 6,
  q: 201,
  e: 202,
  delete: 3,
  pagedown: 4,
  numpad8: 1,
  numpad2: 2,
  numpad4: 199,
  numpad6: 200,
  numpad7: 201,
  numpad9: 202,
}

export function pickUnit(scene: GameScene, event: { clientX: number; clientY: number }) {
  if (scene.overviewActive) return
  const id = scene.picking.pick(event)
  return scene.world.units.find(u => u.id === id && u.team === 'blue' && canOrder(u))
}

export function updatePlacement(scene: GameScene) {
  const w = scene.world,
    kind = w.mode as Building['kind'],
    p = scene.pointer
  scene.cursor.visible =
    !!p && !!kind && !SPELLS.some(s => s.id === w.mode) && !w.inputMask && w.status === 'playing'
  if (!p || !scene.cursor.visible) {
    scene.placementState = ''
    return
  }
  // ponytail: the browser placement validator supplies validity until the
  // native plan preview/cell-marking controller owns these transient flags.
  const invalid = !!placementError(w, kind, p)
  const pose = buildingPlanPose(w, kind, p)
  const key = [kind, pose.anchorX, pose.anchorY, pose.angle, invalid, w.landVersion].join(',')
  if (key === scene.placementState) return
  scene.placementState = key
  scene.cursor.geometry.dispose()
  const { geometry, cells, entrance } = scene.planGeometry(pose, invalid)
  scene.cursor.geometry = geometry
  scene.cursor.userData.cells = cells
  scene.cursor.userData.entrance = entrance
  scene.cursor.userData.invalid = invalid
}

export function planGeometry(
  scene: GameScene,
  pose: BuildingShapePose,
  invalid = false,
  placed = false
) {
  const { cells, entrance } = buildingPlanCells(pose)
  const w = scene.world,
    flags = new Uint32Array(w.land.flags)
  // These are presentation marks, not persistent terrain ownership flags.
  for (let i = 0; i < flags.length; i++) flags[i] &= ~0x1980
  for (const i of cells) flags[i] |= placed ? 0x410 : invalid ? 0x190 : 0x90
  if (!placed && entrance !== null) {
    flags[entrance] |= 0x800
    if (!cells.includes(entrance)) cells.push(entrance)
  }
  const positions: number[] = [],
    uv: number[] = [],
    colors: number[] = []
  for (const i of cells) {
    const overlay = groundOverlay(flags, i, placed ? 0x400 : flags[i] & 0x180, pose.angle / 512),
      tint = new THREE.Color(overlay.color & 0xffffff)
    const x = (i & 127) * 512,
      y = (i >> 7) * 512,
      origin = browserPosition({ x, y })
    for (const triangle of groundOverlayTriangles(flags[i] & 1, overlay.rotation))
      for (let v = 0; v < 3; v++) {
        const dx = triangle.positions[v * 2],
          dy = triangle.positions[v * 2 + 1],
          j = ((((i >> 7) + dy) & 127) << 7) | (((i & 127) + dx) & 127)
        positions.push(origin.x + dx * 2, w.land.heights[j] / 128, origin.z - dy * 2)
        uv.push(
          ((overlay.tile % 8) * 32 + 0.5 + triangle.uv[v * 2] * 31) / 256,
          1 - (Math.floor(overlay.tile / 8) * 32 + 0.5 + triangle.uv[v * 2 + 1] * 31) / 1024
        )
        colors.push(tint.r, tint.g, tint.b)
      }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  return { geometry, cells, entrance }
}

export function pick(scene: GameScene, event: { clientX: number; clientY: number }) {
  const rect = scene.renderer.domElement.getBoundingClientRect()
  scene.mouse.set(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    1 - ((event.clientY - rect.top) / rect.height) * 2
  )
  return scene.view.pick(scene.mouse, [scene.terrain], scene.camera)?.point ?? null
}

export function pickWorldObject(scene: GameScene, event: { clientX: number; clientY: number }) {
  const rect = scene.renderer.domElement.getBoundingClientRect()
  if (scene.overviewActive) {
    return (
      [...scene.world.buildings, ...scene.world.shrines].find(object => {
        const p = scene.screen(object)
        return (
          scene.visible(object) &&
          Math.hypot(
            ((p.x + 1) * rect.width) / 2 + rect.left - event.clientX,
            ((1 - p.y) * rect.height) / 2 + rect.top - event.clientY
          ) < 10
        )
      }) ?? null
    )
  }
  const id = scene.picking.pick(event)
  return (
    scene.world.buildings.find(b => b.id === id) ??
    scene.world.shrines.find(s => s.id === id) ??
    null
  )
}

export function pointerDown(scene: GameScene, event: PointerEvent) {
  scene.pointerButtons = event.buttons
  if (
    event.button === 2 &&
    !(event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) &&
    !scene.world.selected.length &&
    !scene.world.mode &&
    !scene.world.inputMask &&
    !scene.overviewActive
  ) {
    const object = scene.pickUnit(event) ?? scene.pickWorldObject(event)
    if (object) scene.objectPanels.open(object.id)
  }
  const unit =
    event.button === 0 &&
    !scene.world.mode &&
    !scene.world.inputMask &&
    !scene.overviewActive &&
    !(scene.world.selected.length && (event.shiftKey || (event.altKey && event.ctrlKey)))
      ? scene.pickUnit(event)?.id
      : undefined
  scene.down = {
    x: event.clientX,
    y: event.clientY,
    button: event.button,
    unit,
    extend: event.ctrlKey,
  }
  scene.drag = null
  scene.dragActive.value = false
  if (event.button === 0 && !scene.world.mode && !scene.world.inputMask && !scene.overviewActive) {
    const origin = scene.world.units.find(u => u.id === unit) ?? scene.pick(event)
    if (origin) {
      const start = nativePosition(scene.world, origin)
      scene.drag = { start, end: start, active: unit === undefined && !scene.world.selected.length }
    }
  }
  if (unit !== undefined) {
    scene.acknowledgePointer(unit)
    scene.onSound(0x6a)
  }
  scene.dragLast = { x: event.clientX, y: event.clientY }
  if (
    scene.overviewActive &&
    !scene.world.inputMask &&
    (event.buttons === 2 || event.buttons === 4)
  ) {
    const rect = scene.renderer.domElement.getBoundingClientRect()
    scene.globePointer = {
      x: Math.trunc(event.clientX - rect.left),
      y: Math.trunc(event.clientY - rect.top),
    }
    beginGlobeDrag(scene.globeMotion, scene.view.globe, scene.globePointer)
  }
  scene.renderer.domElement.setPointerCapture(event.pointerId)
}

export function pointerMove(scene: GameScene, event: PointerEvent) {
  scene.pointerButtons = event.buttons
  scene.pointerScreen = { clientX: event.clientX, clientY: event.clientY }
  if (!scene.world.inputMask && (event.buttons === 2 || event.buttons === 4)) {
    const dx = event.clientX - scene.dragLast.x,
      dy = event.clientY - scene.dragLast.y
    scene.cameraMotion.active = 0
    scene.captureCamera()
    if (event.buttons === 4) {
      scene.world.mode = null
      scene.tooltip.draw = 0
    }
    if (scene.overviewActive) {
      const rect = scene.renderer.domElement.getBoundingClientRect()
      scene.globePointer = {
        x: Math.trunc(event.clientX - rect.left),
        y: Math.trunc(event.clientY - rect.top),
      }
    } else dragCamera(scene.cameraPosition, scene.cameraVelocity, event.buttons === 2, dx, dy)
    scene.viewPoint = browserPosition(scene.cameraPosition)
    scene.cameraBearing = (scene.cameraPosition.angle * Math.PI) / 1024
    scene.dragLast = { x: event.clientX, y: event.clientY }
    scene.updateView()
  }
}

export function updateDrag(scene: GameScene, event: { clientX: number; clientY: number }) {
  const drag = scene.drag
  if (!drag || scene.world.mode || scene.world.inputMask || scene.overviewActive) {
    scene.dragActive.value = false
    return
  }
  const picked = scene.pick(event),
    end = picked && nativePosition(scene.world, picked)
  if (!drag.active) {
    if (scene.down.unit !== undefined) drag.active = scene.pickUnit(event)?.id !== scene.down.unit
    else if (end) drag.active = dragMoved(drag.start, end)
  }
  if (end) drag.end = dragEndpoint(drag.start, end, scene.view.angle)
  scene.dragActive.value = drag.active && positionDistance(drag.start, drag.end) > 0
  scene.selectionOverlay.visible = scene.dragActive.value
  if (!scene.dragActive.value) return
  const angle = nativeAngle(
    ((drag.end.x - drag.start.x) << 16) >> 16,
    -(((drag.end.y - drag.start.y) << 16) >> 16)
  )
  const corners = unwrapDragCorners(
    dragCorners(drag.start, scene.view.angle, angle, positionDistance(drag.start, drag.end))
  )
  scene.selectionOverlay.update(
    corners,
    scene.view.angle,
    ((angle - scene.view.angle) & 2047) >> 9,
    scene.world.land,
    scene.view
  )
}

export function pointerUp(scene: GameScene, event: PointerEvent) {
  scene.pointerButtons = event.buttons
  if (!(event.buttons & 6)) scene.globeMotion.dragging = false
  if (scene.world.inputMask || scene.overviewStage) return
  if (event.button === 0) scene.updateDrag(event)
  const drag = scene.drag
  scene.drag = null
  scene.dragActive.value = false
  if (event.button === 0 && drag?.active && !scene.world.mode) {
    selectArea(
      scene.world,
      drag.start,
      dragCommand(drag.start, drag.end, scene.view.angle),
      scene.down.extend
    )
    scene.onChange()
    return
  }
  const moved = Math.hypot(event.clientX - scene.down.x, event.clientY - scene.down.y)
  if (moved > 7 && event.button !== 0) return
  if (event.button === 2) {
    cancelInteraction(scene.world)
    scene.onChange()
    return
  }
  if (event.button !== 0) return
  const clickedUnit = !scene.world.mode
    ? scene.world.units.find(u => u.id === scene.down.unit)
    : undefined
  const pickedId = !scene.world.mode && scene.picking.pick(event)
  const picked =
    scene.world.units.find(u => u.id === pickedId) ??
    scene.world.buildings.find(b => b.id === pickedId) ??
    scene.world.shrines.find(h => h.id === pickedId) ??
    scene.world.trees.find(t => t.id === pickedId)
  const p = picked ?? scene.pick(event) ?? clickedUnit
  if (!p) return
  if (scene.world.mode) {
    const mode = scene.world.mode
    const ok = SPELLS.some(s => s.id === mode)
      ? cast(scene.world, mode as Parameters<typeof cast>[1], p)
      : placeBuilding(scene.world, mode as Parameters<typeof placeBuilding>[1], p)
    if (!ok) scene.onSound(0x25)
    else if (!SPELLS.some(s => s.id === mode)) scene.onSound(0x24)
  } else {
    if (clickedUnit) {
      selectUnit(scene.world, clickedUnit.id, scene.down.extend)
    } else if (scene.world.selected.length) {
      const selected = scene.world.selected.slice()
      if (command(scene.world, p, event)) {
        const marker = commandMarkerPoint(nativePosition(scene.world, p), picked?.id ?? 0)
        if (marker) effect(scene.world, 'orderMarker', browserPosition(marker))
        scene.acknowledgePointer(picked?.id ?? 0)
        scene.onSound(0x6a)
        scene.orderSound(selected)
      }
    }
  }
  scene.onChange()
}

export function keyDown(scene: GameScene, event: KeyboardEvent) {
  const key = (
    event.code === 'Quote' || event.code.startsWith('Numpad') ? event.code : event.key
  ).toLowerCase()
  const zoomIn = key === '=' || key === '+',
    zoomOut = key === '-',
    modifier = key === 'control' || key === 'shift',
    bookmark = ['z', 'x', 'c', 'v'].indexOf(key)
  if (
    scene.world.inputMask ||
    (!cameraKeys[key] && !zoomIn && !zoomOut && !modifier && key !== 'quote' && bookmark < 0) ||
    (event.target as HTMLElement).closest('input,textarea,select,dialog,a,[contenteditable]') ||
    (event.ctrlKey && key.length === 1) ||
    event.metaKey ||
    event.altKey ||
    (key === 'quote' && (event.ctrlKey || event.shiftKey))
  )
    return
  if (event.ctrlKey) scene.keys.add('control')
  if (event.shiftKey) scene.keys.add('shift')
  if (bookmark >= 0) {
    cameraBookmark(scene, bookmark, event.shiftKey)
    event.preventDefault()
    return
  }
  if (zoomIn || zoomOut) {
    if (!event.shiftKey) {
      scene.zoom(zoomIn)
      event.preventDefault()
    }
    return
  }
  scene.keys.add(key)
  if (!modifier) event.preventDefault()
}

export function navigationButtons(scene: GameScene) {
  if (scene.world.inputMask || scene.overviewStage || document.querySelector('dialog[open]'))
    return 0
  let buttons = 0
  for (const key of scene.keys)
    buttons = mergeCameraInput(
      buttons,
      cameraCommand(cameraKeys[key] ?? 0, {
        control: scene.keys.has('control'),
        fast: scene.keys.has('shift'),
        overview: scene.overviewActive,
      })
    )
  const pointer = scene.navigationPointer
  if (pointer && !(pointer.buttons & 6))
    buttons = mergeCameraInput(
      buttons,
      cameraEdgeButtons(
        pointer.x,
        pointer.y,
        document.documentElement.clientWidth,
        document.documentElement.clientHeight
      )
    )
  return buttons
}

export function chooseFollowers(
  scene: GameScene,
  model: number,
  modifiers: { shiftKey: boolean; ctrlKey: boolean },
  focus = false
) {
  const w = scene.world
  if (w.inputMask || scene.overviewStage) return
  if (!focus && (scene.overviewActive || w.manaWorld.gameFlags & 32)) return
  if (model === 7 && w.units.some(u => u.team === 'blue' && isShaman(u) && u.hp > 0))
    w.castingTribes[0].flags |= focus ? 0x1000 : 0x800
  if (focus) {
    const people = hudPeople(w)
    const id = focusHudPerson(
      people,
      model,
      scene.cameraPosition,
      scene.hudFocus[model],
      modifiers.shiftKey,
      !!(w.castingTribes[0].flags & 128)
    )
    scene.hudFocus[model] = id
    const person = people.find(p => p.id === id)
    if (person) {
      scene.focus(browserPosition(person), { animate: true })
      scene.objectPanels.open(id)
    }
  } else {
    let mode: 'all' | 'five' | 'single' = 'single'
    if (modifiers.shiftKey) mode = 'all'
    else if (modifiers.ctrlKey && model !== 7) mode = 'five'
    selectFollowers(w, model, scene.cameraPosition, mode)
  }
  scene.onChange()
}

export function acknowledgePointer(scene: GameScene, target: number) {
  // 0x4b0080 expires after five frontend visits. Use elapsed presentation
  // time at the existing 24 Hz reference cadence, never rendered-frame count.
  scene.pointerAck = { target, until: performance.now() + 5000 / 24 }
}

export function drawPointer(scene: GameScene, now: number) {
  const bounds =
    !scene.overviewActive &&
    !scene.world.inputMask &&
    !scene.world.mode &&
    scene.hoveredObject !== null
      ? scene.picking.personBounds(scene.hoveredObject)
      : null
  scene.pointerOutline.style.display = bounds ? '' : 'none'
  if (!bounds) return
  const acknowledged =
    now < scene.pointerAck.until && scene.pointerAck.target === scene.hoveredObject
  const signature = [
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height,
    scene.gameClock.animationFrame % 12,
    acknowledged,
  ].join(',')
  if (signature === scene.pointerSignature) return
  scene.pointerSignature = signature
  const { opacity, lines } = pointerBrackets(bounds, scene.gameClock.animationFrame, acknowledged)
  scene.pointerPath.setAttribute('stroke-opacity', String(opacity))
  scene.pointerPath.setAttribute(
    'd',
    lines.map(([x, y, u, v]) => `M${x + 0.5},${y + 0.5}L${u + 0.5},${v + 0.5}`).join('')
  )
}

export function updatePointerFrame(scene: GameScene, now: number) {
  // Original geometry advances per draw; its animation clock is still a
  // browser 12 Hz presentation clock until native timer ownership is ported.
  scene.updateSpellHalo(Math.floor((now * 12) / 1000))
  // Picking projects the entire terrain; repeat when the pointer/view changes.
  const pointerState = [
    scene.world.mode,
    scene.world.inputMask,
    scene.world.turn,
    scene.pointerButtons,
    scene.pointerScreen?.clientX,
    scene.pointerScreen?.clientY,
    scene.world.landVersion,
    scene.viewPoint.x,
    scene.viewPoint.z,
    scene.cameraBearing,
    scene.viewZoom,
    scene.viewPreset,
    scene.viewTransition?.remaining,
    scene.overviewActive,
    ...scene.camera.position.toArray(),
    scene.container.clientWidth,
    scene.container.clientHeight,
  ].join(',')
  if (pointerState !== scene.pointerState) {
    if (scene.pointerButtons === 1 && scene.pointerScreen) scene.updateDrag(scene.pointerScreen)
    scene.pointer = scene.pointerScreen && scene.world.mode ? scene.pick(scene.pointerScreen) : null
    scene.hoveredObject =
      scene.pointerScreen && !scene.pointerButtons && !scene.world.mode && !scene.world.inputMask
        ? scene.overviewActive
          ? (scene.pickWorldObject(scene.pointerScreen)?.id ?? null)
          : scene.picking.pick(scene.pointerScreen)
        : null
    scene.pointerState = pointerState
  }
  scene.selectionOverlay.visible = scene.dragActive.value
}

export function updateSpellPointerFrame(
  scene: GameScene,
  spec: (typeof SPELLS)[number] | undefined
) {
  scene.spellPointer.hidden =
    !spec || !scene.pointerScreen || !!scene.world.inputMask || scene.world.status !== 'playing'
  if (spec && scene.pointerScreen && !scene.spellPointer.hidden) {
    const rect = scene.container.getBoundingClientRect()
    scene.spellPointer.style.left = `${scene.pointerScreen.clientX - rect.left}px`
    scene.spellPointer.style.top = `${scene.pointerScreen.clientY - rect.top}px`
    // Native outer-turn ownership and full player records remain adapters.
    const draws = spellCursor(
      spec.model,
      scene.world.turn,
      scene.pointer ? (spellTargetError(scene.world, spec.id, scene.pointer)?.code ?? 1) : -1,
      scene.world.shots[spec.id] > 0 ? 3 : 0,
      !!scene.pointer,
      scene.world.manaWorld.gameFlags
    )
    ;[...scene.spellPointer.children].forEach((child, i) => {
      const sprite = child as HTMLElement,
        d = draws[i]
      sprite.hidden = !d
      if (d) {
        const r = (
          nativeHud.rects as Record<string, { x: number; y: number; w: number; h: number }>
        )[d.id]
        sprite.dataset.sprite = String(d.id)
        Object.assign(sprite.style, {
          left: `${d.x}px`,
          top: `${d.y}px`,
          width: `${r.w}px`,
          height: `${r.h}px`,
          backgroundPosition: `-${r.x}px -${r.y}px`,
        })
      }
    })
  }
}
