import type { GameScene } from './scene.ts'
import { maxHp, nativePosition, unitAnimationSource } from './model.ts'
import {
  personOrderIcons,
  personPanel,
  stepPersonPanel,
  type PersonPanelTime,
} from './person-panel.ts'
import { paintPanel } from './training-panel.ts'

export class PersonPanels {
  panels = new Map<
    number,
    PersonPanelTime & { canvas: HTMLCanvasElement; offset: number; key: string }
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
      canvas.className = 'person-panel'
      canvas.setAttribute('role', 'img')
      scene.container.insertBefore(canvas, null)
      panel = {
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
        panel.canvas.remove()
        panels.delete(id)
        continue
      }
      let alive = true
      for (let i = 0; i < elapsed && alive; i++)
        alive = stepPersonPanel(panel, this.inspected === id)
      if (!alive) {
        panel.canvas.remove()
        panels.delete(id)
        continue
      }
      const { canvas } = panel
      canvas.hidden = !!world.inputMask || scene.overviewActive || !scene.visible(u)
      if (canvas.hidden || !atlas.complete || !atlas.naturalWidth) continue
      const p = unitAnimationSource(u) ?? u.native ?? u.entry?.person ?? u.builder?.person
      const icons = p ? personOrderIcons(world.buildingOrders, p, world.objectCells.objects) : []
      const health = Math.round(u.hp * 20),
        maximum = Math.round(maxHp(u.kind) * 20)
      const key = JSON.stringify([health, maximum, icons])
      if (key !== panel.key) {
        paintPanel(
          canvas,
          atlas,
          personPanel(
            health,
            maximum,
            icons.map(i => i.sprite)
          )
        )
        canvas.setAttribute(
          'aria-label',
          `${u.kind}: ${Math.max(0, health)} of ${maximum} health; ${icons.length} orders`
        )
        panel.key = key
      }
      const point =
        scene.unitScreen(id, panel.offset / 128) ??
        scene.screen(u, ((p?.h ?? nativePosition(world, u).h) + panel.offset) / 45)
      canvas.style.left = `${((point.x + 1) * scene.container.clientWidth) / 2}px`
      canvas.style.top = `${((1 - point.y) * scene.container.clientHeight) / 2}px`
    }
  }
  dispose() {
    for (const panel of this.panels.values()) panel.canvas.remove()
    this.panels.clear()
  }
}
