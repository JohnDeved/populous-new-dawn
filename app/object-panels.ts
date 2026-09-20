import type { GameScene } from './scene.ts'
import { browserPosition, effect, maxHp, nativePosition, unitAnimationSource } from './model.ts'
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
      kind: 'person' | 'head'
      key: string
      automatic: boolean
    }
  >()
  inspected: number | null = null
  frame = 0
  automaticSamples = new Map<number, number>()
  constructor(readonly scene: GameScene) {}
  open(id: number, immediate = false, automatic = false) {
    const { scene } = this
    const u = scene.world.units.find(
      person => person.id === id && person.hp > 0 && person.team === 'blue'
    )
    const head = scene.world.shrines.find(s => s.id === id)
    if (!u && !head) return
    let panel = this.panels.get(id)
    const first = !this.panels.size
    if (!panel) {
      for (const old of this.panels.values())
        if (u && old.kind === 'person' && old.phase < 2) {
          old.remaining = 0
          old.hold = 0
        }
      const canvas = document.createElement('canvas')
      canvas.setAttribute('aria-hidden', 'true')
      const element = document.createElement('div')
      element.className = 'person-panel'
      element.setAttribute('role', 'group')
      element.insertBefore(canvas, null)
      for (let i = 0; i < (head?.required ?? 8); i++) {
        const button = document.createElement('button')
        button.type = 'button'
        button.hidden = true
        button.addEventListener('contextmenu', event => {
          event.preventDefault()
          if (head) this.focusWorshipper(id, Number(button.dataset.person))
          else this.focusOrder(id, Number(button.dataset.order))
        })
        // Person order icons use right-click; keyboard activation also exposes focus.
        button.addEventListener('click', event => {
          if (head) {
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
      panel = {
        element,
        canvas,
        kind: head ? 'head' : 'person',
        offset: head
          ? (models as Record<number, { panelHeight: number }>)[head.model].panelHeight
          : (scene.unitMeshes.get(id)?.userData.nativeFrameHeight ?? 0) * 8,
        phase: -1,
        remaining: 0,
        hold: 20,
        key: '',
        automatic,
      }
      this.panels.set(id, panel)
    } else if (automatic) panel.automatic = true
    if (immediate) {
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
      const head = world.shrines.find(s => s.id === id)
      if (!u && !head) {
        panel.element.remove()
        panels.delete(id)
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
        continue
      }
      const { canvas, element } = panel
      element.hidden = !!world.inputMask || scene.overviewActive || !scene.visible((u ?? head)!)
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
        : []
      const worship = head && {
        required: head.required,
        enabled: head.enabled,
        work: head.work,
        target: head.target,
        growth: head.growth,
        cooldown: head.cooldown,
        shamanOnly: head.kind === 'vault',
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
      ])
      if (key !== panel.key) {
        const layout = worship
          ? worshipPanel(worship)
          : personPanel(
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
          const button = buttons[i],
            person = people[i],
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
        element.setAttribute(
          'aria-label',
          head
            ? head.kind === 'vault'
              ? `${head.name}: ${vaultStatus}; ${Math.round(head.progress * 100)}% complete`
              : `${head.name}: ${head.followers} worshippers; ${Math.round(head.progress * 100)}% complete`
            : `${u!.kind}: ${Math.max(0, health)} of ${maximum} health; ${icons.length} orders`
        )
        panel.key = key
      }
      const point =
        (u && scene.unitScreen(id, panel.offset / 128)) ??
        scene.screen(
          (u ?? head)!,
          ((p?.h ?? nativePosition(world, (u ?? head)!).h) + panel.offset) / 45
        )
      element.style.left = `${((point.x + 1) * scene.container.clientWidth) / 2}px`
      element.style.top = `${((1 - point.y) * scene.container.clientHeight) / 2}px`
    }
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
    this.automaticSamples.clear()
  }
}
