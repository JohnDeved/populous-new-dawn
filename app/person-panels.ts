import type { GameScene } from './scene.ts'
import { browserPosition, effect, maxHp, nativePosition, unitAnimationSource } from './model.ts'
import {
  personOrderFocus,
  personOrderIcons,
  personPanel,
  stepPersonPanel,
  type PersonPanelTime,
} from './person-panel.ts'
import { paintPanel } from './training-panel.ts'
import hud from './original-hud.json' with { type: 'json' }

export class PersonPanels {
  panels = new Map<
    number,
    PersonPanelTime & {
      element: HTMLDivElement
      canvas: HTMLCanvasElement
      offset: number
      key: string
    }
  >()
  inspected: number | null = null
  frame = 0
  constructor(readonly scene: GameScene) {}
  open(id: number, immediate = false) {
    const { scene } = this
    const u = scene.world.units.find(
      person => person.id === id && person.hp > 0 && person.team === 'blue'
    )
    if (!u) return
    let panel = this.panels.get(id)
    if (!panel) {
      for (const old of this.panels.values())
        if (old.phase < 2) {
          old.remaining = 0
          old.hold = 0
        }
      const canvas = document.createElement('canvas')
      canvas.setAttribute('aria-hidden', 'true')
      const element = document.createElement('div')
      element.className = 'person-panel'
      element.setAttribute('role', 'group')
      element.insertBefore(canvas, null)
      for (let i = 0; i < 8; i++) {
        const button = document.createElement('button')
        button.type = 'button'
        button.hidden = true
        button.addEventListener('contextmenu', event => {
          event.preventDefault()
          this.focusOrder(id, Number(button.dataset.order))
        })
        // Native pointer-left is inert; keyboard activation exposes the same action.
        button.addEventListener('click', event => {
          if (!event.detail) this.focusOrder(id, Number(button.dataset.order))
        })
        element.insertBefore(button, null)
      }
      for (const type of ['pointerdown', 'pointerup', 'pointermove'])
        element.addEventListener(type, event => event.stopPropagation())
      scene.container.insertBefore(element, null)
      panel = {
        element,
        canvas,
        offset: (scene.unitMeshes.get(id)?.userData.nativeFrameHeight ?? 0) * 8,
        phase: -1,
        remaining: 0,
        hold: 20,
        key: '',
      }
      this.panels.set(id, panel)
    }
    if (immediate) {
      panel.phase = 1
      panel.remaining = panel.hold
    }
    this.inspected = id
    this.frame = scene.gameClock.animationFrame
  }
  update(atlas: HTMLImageElement) {
    const { scene, panels } = this,
      { world } = scene
    const elapsed = scene.gameClock.animationFrame - this.frame
    this.frame = scene.gameClock.animationFrame
    if (!panels.size) return
    const hovered = scene.pointerScreen && scene.pickUnit(scene.pointerScreen)?.id
    if (!(scene.pointerButtons & 2) && hovered !== this.inspected) this.inspected = null
    for (const [id, panel] of panels) {
      const u = world.units.find(person => person.id === id && person.hp > 0)
      if (!u) {
        panel.element.remove()
        panels.delete(id)
        continue
      }
      let alive = true
      for (let i = 0; i < elapsed && alive; i++)
        alive = stepPersonPanel(
          panel,
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
      element.hidden = !!world.inputMask || scene.overviewActive || !scene.visible(u)
      if (element.hidden || !atlas.complete || !atlas.naturalWidth) continue
      const p = unitAnimationSource(u) ?? u.native ?? u.entry?.person ?? u.builder?.person
      const icons = p ? personOrderIcons(world.buildingOrders, p, world.objectCells.objects) : []
      const health = Math.round(u.hp * 20),
        maximum = Math.round(maxHp(u.kind) * 20)
      const key = JSON.stringify([health, maximum, icons])
      if (key !== panel.key) {
        const layout = personPanel(
          health,
          maximum,
          icons.map(i => i.sprite)
        )
        paintPanel(canvas, atlas, layout)
        // Use the actual main-sprite submissions for hit geometry; no second layout.
        const draws = layout.events.filter(e => e[0] === 'sprite' && e[4] === -1 && e[1] !== 52)
        const buttons = element.querySelectorAll('button')
        for (let i = 0; i < buttons.length; i++) {
          const button = buttons[i],
            icon = icons[i],
            draw = draws[i]
          button.hidden = !icon
          if (!icon || draw?.[0] !== 'sprite') continue
          const rect = (hud.rects as Record<number, { w: number; h: number }>)[icon.sprite]
          button.dataset.order = String(icon.id)
          button.setAttribute('aria-label', `Focus order ${i + 1} destination`)
          button.title = 'Right-click to view destination'
          button.style.left = `${draw[2]}px`
          button.style.top = `${draw[3]}px`
          button.style.width = `${rect.w}px`
          button.style.height = `${rect.h}px`
        }
        element.setAttribute(
          'aria-label',
          `${u.kind}: ${Math.max(0, health)} of ${maximum} health; ${icons.length} orders`
        )
        panel.key = key
      }
      const point =
        scene.unitScreen(id, panel.offset / 128) ??
        scene.screen(u, ((p?.h ?? nativePosition(world, u).h) + panel.offset) / 45)
      element.style.left = `${((point.x + 1) * scene.container.clientWidth) / 2}px`
      element.style.top = `${((1 - point.y) * scene.container.clientHeight) / 2}px`
    }
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
  }
}
