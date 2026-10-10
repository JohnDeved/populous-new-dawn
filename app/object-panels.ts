import { vehiclePanel, vehiclePanelGeometry, vehiclePanelInput } from './vehicle-panel.ts'
import {
  canUnloadVehicle,
  liveVehiclePassengers,
  selectVehiclePassenger,
  unloadLiveVehicle,
} from './vehicle-panel-runtime.ts'
import { originalVehicleMesh } from './vehicle-appearance.ts'
import { secondaryEffectCount } from './secondary-effects.ts'
import { getTooltipController } from './scene-tooltip-runtime.ts'
import { tooltipThreshold } from './tooltip-controller.ts'
import { syncSecondaryReservations } from './scene-secondary-effects.ts'
import { dismantlingCampPanel, retainedBuildingPanel } from './building-panels.ts'
import type { GameScene } from './scene.ts'
import {
  browserPosition,
  effect,
  maxHp,
  nativePosition,
  unitAnimationSource,
  type Building,
} from './model.ts'
import {
  personOrderFocus,
  personOrderIcons,
  personPanel,
  stepPersonPanel,
  type PersonPanelTime,
} from './person-panel.ts'
import { liveWorshippers, selectWorshippers } from './live-worship.ts'
import { worshipPanel } from './worship-panel.ts'
import { automaticWorshipPanelActive } from './worship-panel-activity.ts'
import { nativeUnitModel } from './unit-kinds.ts'
import models from './original-models.json' with { type: 'json' }
import { paintPanel } from './training-panel.ts'
import hud from './original-hud.json' with { type: 'json' }

export class ObjectPanels {
  panels = new Map<
    number,
    PersonPanelTime & {
      element: HTMLDivElement
      canvas: HTMLCanvasElement
      offset: number
      kind: 'person' | 'head' | 'vehicle'
      key: string
      automatic: boolean
    }
  >()
  inspected: number | null = null
  frame = 0
  automaticSamples = new Map<number, number>()
  // These records contain no DOM/World references and use only the composed
  // tooltip opportunity. Existing panels keep their animationFrame clock.
  buildingRecords = new Map<number, PersonPanelTime & { automatic: boolean }>()
  // 00509290's successful-allocation latch is distinct from record.automatic:
  // activity expiry clears the latch while the automatic record exits.
  automaticTrainingLatches = new Set<number>()
  buildingInspected: number | null = null
  buildingHeldPointer: number | null = null
  constructor(readonly scene: GameScene) {}
  private trainingIdentity(building: Building | undefined) {
    return !!(
      building &&
      building.progress >= 1 &&
      building.hp > 0 &&
      building.admission?.class === 2 &&
      ((building.kind === 'camp' && building.admission.model === 7) ||
        (building.kind === 'temple' && building.admission.model === 5))
    )
  }
  private trainingActive(building: Building | undefined) {
    return !!(
      this.trainingIdentity(building) &&
      building!.team === 'blue' &&
      building!.admission!.tribe === this.scene.world.manaWorld.playerTribe &&
      building!.admission!.activity & 0x80
    )
  }
  requestAutomaticTraining(id: number) {
    if (!this.scene.isCurrent() || this.scene.overviewStage) return 'automatic:rejected'
    if (this.automaticTrainingLatches.has(id)) return 'automatic:latched'
    const building = this.scene.world.buildings.find(b => b.id === id)
    if (!this.trainingActive(building)) return 'automatic:rejected'
    const result = this.inspectBuilding(id, 'automatic')
    if (result === 'automatic:created' || result === 'automatic:reused')
      this.automaticTrainingLatches.add(id)
    return result
  }
  inspectBuilding(id: number, source: 'hover' | 'explicit' | 'automatic', pointerId?: number) {
    const { scene } = this,
      building = scene.world.buildings.find(
        b =>
          b.id === id &&
          (retainedBuildingPanel(b, scene.world.manaWorld.playerTribe) ||
            (source === 'automatic' && this.trainingIdentity(b))) &&
          b.team === 'blue' &&
          b.hp > 0
      )
    if (!building || scene.overviewActive || document.querySelector('dialog[open]'))
      return `${source}:rejected`
    let record = this.buildingRecords.get(id)
    const created = !record
    if (!record) {
      // 00504060 retires eligible same-class records before testing capacity.
      // Active automatic buildings are excluded from that retirement predicate.
      if (!((building.admission?.activity ?? 0) & 128)) {
        for (const [oldId, old] of this.buildingRecords) {
          const oldBuilding = scene.world.buildings.find(b => b.id === oldId && b.hp > 0)
          if (old.phase < 2 && oldBuilding && !((oldBuilding.admission?.activity ?? 0) & 128)) {
            old.remaining = 0
            old.hold = 0
          }
        }
      }
      const owners = new Set([...this.panels.keys(), ...this.buildingRecords.keys()])
      for (const [otherId, panel] of scene.buildingPanels)
        if (
          !panel.hidden &&
          !scene.world.buildings.some(b => b.id === otherId && b.kind === 'hut' && b.progress >= 1)
        )
          owners.add(otherId)
      syncSecondaryReservations(scene)
      // A visible building already owns this browser capacity. Transferring it to a
      // retained record consumes no second slot; native physical allocation is
      // still outside this partial count adapter.
      const addedOwner = Number(!owners.has(id)),
        addedReservation = Number(
          !scene.world.secondaryEffects.reservations.includes(`building-panel:${id}`)
        )
      if (
        owners.size + addedOwner > 32 ||
        secondaryEffectCount(scene.world.secondaryEffects) + addedReservation > 160
      ) {
        if (source !== 'automatic') this.releaseBuildingInspection()
        return `${source}:rejected-capacity`
      }
      record = { phase: -1, remaining: 0, hold: 16, automatic: source === 'automatic' }
      this.buildingRecords.set(id, record)
      const owner = getTooltipController(scene)
      owner.dwell = tooltipThreshold(owner, 'inspection') + 1
      syncSecondaryReservations(scene)
    } else if (source === 'automatic') record.automatic = true
    if (source !== 'automatic') {
      this.buildingInspected = id
      if (source === 'explicit') this.buildingHeldPointer = pointerId ?? null
    }
    return `${source}:${created ? 'created' : 'reused'}`
  }
  releaseBuildingButton(pointerId: number) {
    if (this.buildingHeldPointer === pointerId) this.buildingHeldPointer = null
  }
  releaseBuildingInspection() {
    this.buildingInspected = null
    this.buildingHeldPointer = null
  }
  renewBuildingInspection(hovered: number | null) {
    const record =
      this.buildingInspected === null ? null : this.buildingRecords.get(this.buildingInspected)
    // The native consumer renews first, then drops selected ownership after
    // release when neither pick matches. Departure therefore keeps this renewal.
    if (record?.phase === 1) record.remaining = record.hold
    if (this.buildingHeldPointer === null && hovered !== this.buildingInspected)
      this.buildingInspected = null
  }
  stepBuildingInspections(allowCreate = true) {
    const { scene } = this
    if (allowCreate)
      for (const building of scene.world.buildings)
        if (
          building.kind === 'hut' &&
          building.team === 'blue' &&
          building.hp > 0 &&
          building.progress >= 1 &&
          (building.admission?.activity ?? 0) & 128
        )
          this.inspectBuilding(building.id, 'automatic')
    for (const [id, record] of this.buildingRecords) {
      let building = scene.world.buildings.find(
        b =>
          b.id === id &&
          (retainedBuildingPanel(b, scene.world.manaWorld.playerTribe) ||
            (record.automatic && this.trainingIdentity(b))) &&
          b.hp > 0
      )
      const training =
        record.automatic &&
        (building?.kind === 'camp' ||
          building?.kind === 'temple' ||
          this.automaticTrainingLatches.has(id))
      if (training && !this.trainingIdentity(building)) building = undefined
      const element = scene.buildingPanels.get(id),
        panelInteraction =
          !scene.world.inputMask &&
          !scene.overviewActive &&
          !document.querySelector('dialog[open]') &&
          element &&
          !element.hidden &&
          (element.matches(':hover') || element.contains(document.activeElement))
      // Preserve the browser's existing access to hovered/focused controls.
      // This UI hold is not a claim about native status-control ownership.
      if (building && panelInteraction && record.phase >= 1 && !training) continue
      const automaticHeld =
        record.automatic &&
        (training ? this.trainingActive(building) : !!((building?.admission?.activity ?? 0) & 128))
      if (record.automatic && record.phase === 1 && !automaticHeld) {
        record.remaining = 0
        if (training) this.automaticTrainingLatches.delete(id)
      }
      if (!building || !stepPersonPanel(record, automaticHeld)) {
        this.buildingRecords.delete(id)
        this.automaticTrainingLatches.delete(id)
        if (
          !building ||
          !(
            dismantlingCampPanel(building) ||
            (building.kind === 'temple' && (building.admission?.activity ?? 0) & 0x8000) ||
            ((building.kind === 'camp' || building.kind === 'temple') && panelInteraction)
          )
        ) {
          element?.remove()
          scene.buildingPanels.delete(id)
        }
        if (this.buildingInspected === id) this.releaseBuildingInspection()
        syncSecondaryReservations(scene)
      }
    }
  }
  open(id: number, immediate = false, automatic = false) {
    const { scene } = this
    const u = scene.world.units.find(
      person => person.id === id && person.hp > 0 && person.team === 'blue'
    )
    const head = scene.world.shrines.find(s => s.id === id),
      vehicle = scene.world.vehicles.find(v => v.id === id && v.active)
    if (!u && !head && !vehicle) return
    let panel = this.panels.get(id)
    const first = !this.panels.size
    if (!panel) {
      for (const old of this.panels.values())
        if (
          ((u && old.kind === 'person') || (vehicle && old.kind === 'vehicle')) &&
          old.phase < 2
        ) {
          old.remaining = 0
          old.hold = 0
        }
      const canvas = document.createElement('canvas')
      canvas.setAttribute('aria-hidden', 'true')
      const element = document.createElement('div')
      element.className = 'person-panel'
      if (head) element.classList.add('worship-panel')
      else if (vehicle) element.classList.add('vehicle-panel')
      element.setAttribute('role', 'group')
      element.insertBefore(canvas, null)
      for (
        let i = 0;
        i < (vehicle ? vehiclePanelGeometry(vehicle.model).capacity + 1 : (head?.required ?? 8));
        i++
      ) {
        const button = document.createElement('button')
        button.type = 'button'
        button.hidden = true
        button.addEventListener('contextmenu', event => {
          event.preventDefault()
          if (vehicle)
            this.vehicleAction(
              id,
              Number(button.dataset.person),
              button.dataset.unload === 'true',
              true,
              event.shiftKey
            )
          else if (head) this.focusWorshipper(id, Number(button.dataset.person))
          else this.focusOrder(id, Number(button.dataset.order))
        })
        // Person order icons use right-click; keyboard activation also exposes focus.
        button.addEventListener('click', event => {
          if (vehicle)
            this.vehicleAction(
              id,
              Number(button.dataset.person),
              button.dataset.unload === 'true',
              false,
              event.shiftKey
            )
          else if (head) {
            selectWorshippers(scene.world, head, Number(button.dataset.person), event.shiftKey)
            scene.onSound(0x6a)
            scene.onChange()
          } else if (!event.detail) this.focusOrder(id, Number(button.dataset.order))
        })
        element.insertBefore(button, null)
      }
      for (const type of ['pointerdown', 'pointerup', 'pointermove'])
        element.addEventListener(type, event => event.stopPropagation())
      scene.container.insertBefore(element, null)
      let kind: 'person' | 'head' | 'vehicle' = 'person'
      if (head) kind = 'head'
      else if (vehicle) kind = 'vehicle'
      let offset = (scene.unitMeshes.get(id)?.userData.nativeFrameHeight ?? 0) * 8
      if (vehicle) offset = models[originalVehicleMesh(vehicle.model)].panelHeight
      else if (head)
        offset = (models as Record<number, { panelHeight: number }>)[head.model].panelHeight
      panel = {
        element,
        canvas,
        kind,
        offset,
        phase: -1,
        remaining: 0,
        hold: 20,
        key: '',
        automatic,
      }
      this.panels.set(id, panel)
    } else if (automatic) panel.automatic = true
    syncSecondaryReservations(scene)
    if (immediate || vehicle) {
      panel.phase = 1
      panel.remaining = panel.hold
    }
    if (automatic) {
      if (first) this.frame = scene.gameClock.animationFrame
      return
    }
    this.inspected = id
    this.frame = scene.gameClock.animationFrame
  }
  update(atlas: HTMLImageElement) {
    const { scene, panels } = this,
      { world } = scene
    for (const head of world.shrines) {
      const sample = head.panelActivity
      if (!sample || this.automaticSamples.get(head.id) === sample.turn) continue
      this.automaticSamples.set(head.id, sample.turn)
      if (automaticWorshipPanelActive(head)) this.open(head.id, false, true)
    }
    const elapsed = scene.gameClock.animationFrame - this.frame
    this.frame = scene.gameClock.animationFrame
    if (!panels.size) return
    const hovered =
      scene.pointerScreen &&
      (scene.pickUnit(scene.pointerScreen)?.id ?? scene.pickWorldObject(scene.pointerScreen)?.id)
    if (!(scene.pointerButtons & 2) && hovered !== this.inspected) this.inspected = null
    for (const [id, panel] of panels) {
      const u = world.units.find(person => person.id === id && person.hp > 0)
      const head = world.shrines.find(s => s.id === id),
        vehicle = world.vehicles.find(v => v.id === id && v.active),
        target = u ?? head ?? (vehicle && browserPosition(vehicle))
      if (!target) {
        panel.element.remove()
        panels.delete(id)
        syncSecondaryReservations(scene)
        this.automaticSamples.delete(id)
        continue
      }
      const automaticHeld = !!head && panel.automatic && automaticWorshipPanelActive(head)
      if (panel.automatic && panel.phase === 1 && !automaticHeld) {
        panel.automatic = false
        panel.remaining = 0
      }
      let alive = true
      for (let i = 0; i < elapsed && alive; i++)
        alive = stepPersonPanel(
          panel,
          automaticHeld ||
            this.inspected === id ||
            panel.element.matches(':hover') ||
            panel.element.contains(document.activeElement)
        )
      if (!alive) {
        panel.element.remove()
        panels.delete(id)
        syncSecondaryReservations(scene)
        continue
      }
      const { canvas, element } = panel
      element.hidden = !!world.inputMask || scene.overviewActive || !scene.visible(target)
      if (element.hidden || !atlas.complete || !atlas.naturalWidth) continue
      const p = u && (unitAnimationSource(u) ?? u.native ?? u.entry?.person ?? u.builder?.person)
      const icons = p ? personOrderIcons(world.buildingOrders, p, world.objectCells.objects) : []
      const health = u ? Math.round(u.hp * 20) : 0,
        maximum = u ? Math.round(maxHp(u.kind) * 20) : 0
      const count = head ? Math.min(head.required, head.followers) : 0
      const vaultShaman =
        head?.kind === 'vault'
          ? world.units.find(u => u.team === 'blue' && u.kind === 'shaman' && !u.ghost && u.hp > 0)
          : undefined
      const passengers = vehicle ? liveVehiclePassengers(world, vehicle) : [],
        unload = !!vehicle && canUnloadVehicle(world, vehicle),
        hoveredButton = [...element.querySelectorAll('button')].findIndex(button =>
          button.matches(':hover')
        ),
        vehicleHover =
          vehicle && hoveredButton === vehiclePanelGeometry(vehicle.model).capacity
            ? -2
            : hoveredButton
      const people = head
        ? head.kind === 'vault'
          ? count
            ? [
                vaultShaman?.vault?.head === head.id
                  ? {
                      id: vaultShaman.id,
                      model: nativeUnitModel(vaultShaman.kind),
                      selectionFlags: world.selected.includes(vaultShaman.id) ? 128 : 0,
                    }
                  : null,
              ]
            : []
          : liveWorshippers(world, head, count)
        : passengers.map(({ person }) => ({
            id: person.id,
            model: person.model,
            selectionFlags: world.selected.includes(person.id) ? 128 : 0,
          }))
      const worship = head && {
        required: head.required,
        enabled: head.enabled,
        work: head.work,
        target: head.target,
        growth: head.growth,
        cooldown: head.cooldown,
        shamanOnly: head.kind === 'vault' || head.mode === 3,
        people: Array.from({ length: count }, (_, i) =>
          people[i]
            ? { model: people[i].model, selected: !!(people[i].selectionFlags & 128) }
            : null
        ),
      }
      const vaultStatus =
        head?.kind === 'vault'
          ? !people[0]
            ? 'waiting for shaman'
            : head.active
              ? 'shaman learning'
              : 'shaman leaving'
          : null
      const key = JSON.stringify([
        health,
        maximum,
        icons,
        worship,
        head?.followers,
        people.map(person => person?.id),
        vaultStatus,
        vehicle && [
          vehicle.model,
          unload,
          vehicleHover,
          element.matches(':has(button:active)'),
          passengers.map(({ person }) => person.tribe),
        ],
        people.map(person => person?.selectionFlags),
      ])
      if (key !== panel.key) {
        let layout: ReturnType<typeof personPanel>
        if (vehicle)
          layout = vehiclePanel(
            vehicle.model,
            passengers.map(({ person }) => ({
              model: person.model,
              selected: world.selected.includes(person.id),
              own: person.tribe === 0,
            })),
            unload,
            vehicleHover,
            element.matches(':has(button:active)')
          )
        else if (worship) layout = worshipPanel(worship)
        else
          layout = personPanel(
            health,
            maximum,
            icons.map(i => i.sprite)
          )
        paintPanel(canvas, atlas, layout)
        // Use the actual main-sprite submissions for hit geometry; no second layout.
        const draws = layout.events.filter(
          e => e[0] === 'sprite' && e[4] === -1 && e[1] !== 52 && e[1] !== 53
        )
        const buttons = element.querySelectorAll('button')
        for (let i = 0; i < buttons.length; i++) {
          const button = buttons[i]
          if (vehicle) {
            const g = vehiclePanelGeometry(vehicle.model),
              person = people[i],
              isUnload = i === g.capacity
            button.hidden = !isUnload && !person
            button.disabled = isUnload ? !unload : passengers[i]?.person.tribe !== 0
            button.dataset.unload = String(isUnload)
            button.dataset.person = String(person?.id ?? 0)
            button.setAttribute(
              'aria-label',
              isUnload
                ? 'Unload all passengers'
                : `Toggle passenger ${i + 1}; Shift selects the group`
            )
            button.title = isUnload
              ? 'Unload all passengers'
              : 'Click to select; Shift-click for all passengers; right-click to inspect'
            button.style.left = `${isUnload ? g.unload.x : g.left + 1 + i * 17}px`
            button.style.top = `${isUnload ? 0 : 1}px`
            button.style.width = `${isUnload ? g.unload.w + 1 : 17}px`
            button.style.height = `${isUnload ? g.rowHeight + 1 : 24}px`
            continue
          }
          const person = people[i],
            icon = head ? person && { id: person.id, sprite: 73 + person.model } : icons[i],
            draw = draws[i]
          if (!icon || head?.kind === 'vault' || draw?.[0] !== 'sprite') {
            button.hidden = true
            continue
          }
          button.hidden = false
          const rect = (hud.rects as Record<number, { w: number; h: number }>)[icon.sprite]
          button.dataset.order = String(icon.id)
          button.dataset.person = String(icon.id)
          button.setAttribute(
            'aria-label',
            head
              ? `Toggle worshipper ${i + 1}; Shift selects the group`
              : `Focus order ${i + 1} destination`
          )
          button.title = head
            ? 'Click to select; Shift-click for all worshippers; right-click to focus'
            : 'Right-click to view destination'
          button.style.left = `${draw[2]}px`
          button.style.top = `${draw[3]}px`
          button.style.width = `${rect.w}px`
          button.style.height = `${rect.h}px`
        }
        let label: string
        if (vehicle)
          label = `${vehicle.model < 3 ? 'Boat' : 'Balloon'}: ${vehicle.passengerCount} passengers`
        else if (head)
          label =
            head.kind === 'vault'
              ? `${head.name}: ${vaultStatus}; ${Math.round(head.progress * 100)}% complete`
              : `${head.name}: ${head.followers} worshippers; ${Math.round(head.progress * 100)}% complete`
        else
          label = `${u!.kind}: ${Math.max(0, health)} of ${maximum} health; ${icons.length} orders`
        element.setAttribute('aria-label', label)
        panel.key = key
      }
      const point =
        (u && scene.unitScreen(id, panel.offset / 128)) ??
        scene.screen(
          target,
          ((p?.h ?? vehicle?.h ?? nativePosition(world, target).h) + panel.offset) / 45
        )
      if (head || vehicle) {
        const containerRect = scene.container.getBoundingClientRect(),
          rendererRect = scene.renderer.domElement.getBoundingClientRect(),
          scale = Number.parseFloat(getComputedStyle(element).getPropertyValue('--hud-scale')) || 1,
          rendererLeft = rendererRect.left - containerRect.left,
          rendererTop = rendererRect.top - containerRect.top,
          anchorX = rendererLeft + ((point.x + 1) * rendererRect.width) / 2,
          anchorY = rendererTop + ((1 - point.y) * rendererRect.height) / 2,
          halfPanelWidth = (canvas.width * scale) / 2,
          panelHeight = canvas.height * scale
        element.style.left = `${Math.max(
          rendererLeft + halfPanelWidth,
          Math.min(rendererLeft + rendererRect.width - halfPanelWidth, anchorX)
        )}px`
        element.style.top = `${Math.max(
          rendererTop + panelHeight,
          Math.min(rendererTop + rendererRect.height, anchorY)
        )}px`
      } else {
        element.style.left = `${((point.x + 1) * scene.container.clientWidth) / 2}px`
        element.style.top = `${((1 - point.y) * scene.container.clientHeight) / 2}px`
      }
    }
  }
  vehicleAction(id: number, personId: number, unload: boolean, right: boolean, all: boolean) {
    const { scene } = this,
      { world } = scene
    if (world.inputMask || scene.overviewActive) return
    const vehicle = world.vehicles.find(v => v.id === id && v.active)
    if (!vehicle) return
    const passenger = liveVehiclePassengers(world, vehicle).find(
        ({ person }) => person.id === personId && person.tribe === 0
      ),
      action = vehiclePanelInput(
        passenger?.person,
        unload,
        right,
        unload && canUnloadVehicle(world, vehicle)
      )
    if (action === 'focus') {
      this.open(personId, true)
      return
    }
    if (action === 'select') selectVehiclePassenger(world, vehicle, personId, all)
    else if (action === 'unload') {
      if (!unloadLiveVehicle(world, vehicle)) return
    } else return
    scene.onSound(0x6a)
    scene.onChange()
  }
  focusWorshipper(headId: number, personId: number) {
    const { scene } = this,
      { world } = scene
    if (world.inputMask || scene.overviewActive) return
    const head = world.shrines.find(s => s.id === headId)
    const person = head && liveWorshippers(world, head).find(p => p.id === personId)
    if (!person) return
    scene.focus(browserPosition(person), { animate: true })
    scene.onSound(0x6a)
    this.open(personId, true)
  }
  focusOrder(person: number, id: number) {
    const { scene } = this,
      { world } = scene
    if (world.inputMask || scene.overviewActive) return
    const unit = world.units.find(u => u.id === person && u.hp > 0 && u.team === 'blue')
    if (!unit) return
    const p = unitAnimationSource(unit) ?? unit.native ?? unit.entry?.person ?? unit.builder?.person
    if (
      !p ||
      !personOrderIcons(world.buildingOrders, p, world.objectCells.objects).some(i => i.id === id)
    )
      return
    const order = world.buildingOrders.records[id]
    const candidates = [
      [1, world.units.find(u => u.id === order.a && u.hp > 0)],
      [2, world.buildings.find(b => b.id === order.a && b.hp > 0)],
      [5, world.trees.find(t => t.id === order.a && t.logs > 0)],
      [10, world.shrines.find(s => s.id === order.a)],
    ] as const
    const [objectClass, target] = candidates.find(([, object]) => object) ?? [0, undefined]
    const point = personOrderFocus(
      order,
      target && {
        ...nativePosition(world, target),
        id: target.id,
        class: objectClass,
        flags2: 0,
      }
    )
    if (!point) return
    scene.focus(browserPosition(point), { animate: true })
    scene.onSound(0x6a)
    if (point.target) this.open(point.target, true)
    else {
      effect(world, 'orderMarker', browserPosition(point))
      scene.onSound(0x6a)
    }
  }
  dispose() {
    for (const panel of this.panels.values()) panel.element.remove()
    this.panels.clear()
    this.buildingRecords.clear()
    this.automaticTrainingLatches.clear()
    this.releaseBuildingInspection()
    syncSecondaryReservations(this.scene)
    this.automaticSamples.clear()
  }
}
