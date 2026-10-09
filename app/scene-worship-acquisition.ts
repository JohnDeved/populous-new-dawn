import { templeArt, templeSpriteMaterial } from './temple-art.ts'
import { BuildingAcquisitionTriangleSurface } from './building-acquisition-drawer.ts'
import { collectBuildingAcquisitionTriangles } from './building-acquisition-triangles.ts'
import type { GameScene } from './scene.ts'
import {
  worshipDrawPoint,
  buildingDrawPoint,
  interpolateBuildingSubmissions,
  worshipHandoffGeometry,
  worshipTargetPoint,
  worshipAnchorVisible,
  interpolateWorshipPoint,
  type WorshipHudGeometry,
} from './worship-acquisition-layout.ts'
import {
  getWorshipAcquisitionDrawCommands,
  type WorshipAcquisitionDrawCommand,
  type WorshipAcquisitionGeometry,
  type WorshipPoint,
  type WorshipRect,
  type WorshipTargetModel,
} from './worship-acquisition.ts'
import {
  startPendingWorshipAcquisitions,
  visitWorshipAcquisition,
} from './worship-acquisition-runtime.ts'
import { texture } from './scene-assets.ts'
import hud from './original-hud.json'
import effects from './original-effects.json'
import bodyArt from './original-worship-acquisition.json'

export interface WorshipHudBridge {
  select: (model: WorshipTargetModel) => WorshipHudGeometry | null
  measure: (
    model: WorshipTargetModel,
    fallback: WorshipAcquisitionGeometry
  ) => WorshipHudGeometry | null
}

export class WorshipAcquisitionPresentation {
  readonly diagnostics: { gift: number; model: number; turn: number; reason: string }[] = []
  private anchors = new Map<
    number,
    { point: WorshipPoint; viewport: WorshipRect; valid: boolean }
  >()
  private sprites = new Map<string, HTMLCanvasElement>()
  private previousCommands: readonly WorshipAcquisitionDrawCommand[] = []
  private previousParticles = new Map<
    string,
    Extract<WorshipAcquisitionDrawCommand, { kind: 'sprite' }>
  >()
  private buildingSurface?: BuildingAcquisitionTriangleSurface
  private previousBuilding: Extract<WorshipAcquisitionDrawCommand, { kind: 'building' }> | undefined
  private previousBody: Extract<WorshipAcquisitionDrawCommand, { kind: 'body' }> | undefined
  private canvas = document.createElement('canvas')
  private scene: GameScene
  private bridge?: WorshipHudBridge

  constructor(scene: GameScene, bridge?: WorshipHudBridge) {
    this.scene = scene
    this.bridge = bridge
    this.canvas.className = 'worship-acquisition-overlay'
    this.canvas.setAttribute('aria-hidden', 'true')
    this.canvas.hidden = true
    scene.container.parentElement!.appendChild(this.canvas)
  }

  private failed(gift: number, model: number, reason: string) {
    if (this.diagnostics.some(entry => entry.gift === gift && entry.reason === reason)) return
    this.diagnostics.push({ gift, model, turn: this.scene.world.turn, reason })
    this.canvas.dataset.worshipFaults = String(this.diagnostics.length)
  }

  handoffs() {
    startPendingWorshipAcquisitions(this.scene.world, {
      cue: cue => this.scene.onSound(cue),
      geometry: gift => {
        const current = this.bridge?.select(
          (gift.buildingAcquisition ?? gift.ordinaryWorship)!.model
        )
        return current ? worshipHandoffGeometry(current, this.anchors.get(gift.id)) : null
      },
      failed: gift =>
        this.failed(
          gift.id,
          (gift.buildingAcquisition ?? gift.ordinaryWorship)!.model,
          'handoff geometry'
        ),
    })
  }

  visit() {
    visitWorshipAcquisition(this.scene.world, model => {
      try {
        if (this.bridge?.select(model)) return
      } catch {
        // The gift clamp still belongs to this visit when its HUD is detached.
      }
      this.failed(
        (model === 7 || model === 5
          ? this.scene.world.worshipAcquisition.controllers.building
          : this.scene.world.worshipAcquisition.controllers.spell
        )?.giftId ?? -1,
        model,
        'arrival geometry'
      )
    })
  }

  rememberBodies() {
    const scene = this.scene,
      shell = scene.container.parentElement!.getBoundingClientRect(),
      bounds = scene.container.getBoundingClientRect(),
      viewport = {
        x: bounds.x - shell.x,
        y: bounds.y - shell.y,
        width: bounds.width,
        height: bounds.height,
      },
      active = new Set(scene.world.gifts.map(gift => gift.id))
    for (const id of this.anchors.keys()) if (!active.has(id)) this.anchors.delete(id)
    for (const gift of scene.world.gifts) {
      if (!(gift.ordinaryWorship || gift.buildingAcquisition) || !gift.phase) continue
      const group = scene.fxMeshes.get(gift.id)
      if (!group) {
        this.anchors.delete(gift.id)
        continue
      }
      const clip = scene.view.screen(group.position, scene.camera),
        point = {
          x: viewport.x + ((clip.x + 1) * viewport.width) / 2,
          y: viewport.y + ((1 - clip.y) * viewport.height) / 2,
        },
        projected = scene.view.project(group.position, (group.position.y * 128) / 45)
      let visible =
        group.visible && group.userData.layers.some((layer: { visible: boolean }) => layer.visible)
      for (let parent = group.parent; parent; parent = parent.parent) visible &&= parent.visible
      const valid =
        visible &&
        Number.isFinite(point.x) &&
        Number.isFinite(point.y) &&
        (scene.overviewActive ? clip.z !== 2 : !(projected.flags & 0x1e)) &&
        worshipAnchorVisible(point, viewport)
      this.anchors.set(gift.id, { point, viewport: { ...viewport }, valid })
    }
  }

  private sprite(command: Extract<WorshipAcquisitionDrawCommand, { kind: 'sprite' }>) {
    const material = templeSpriteMaterial(
        command.frame,
        command.palette,
        this.scene.templeResourceSnapshot
      ),
      rgb = material?.rgb ?? command.rgb,
      atlasName = material?.atlas ?? 'effects',
      key = `${atlasName}:${command.frame}:${rgb}`,
      cached = this.sprites.get(key)
    if (cached) return cached
    const frame =
        material?.crop ??
        Object.values(effects.animations)
          .flat()
          .find(frame => frame.source === command.frame),
      atlas = texture(atlasName).image as HTMLImageElement | undefined
    if (!frame || !atlas?.complete || !atlas.naturalWidth) return null
    const canvas = document.createElement('canvas')
    canvas.width = frame.w
    canvas.height = frame.h
    const context = canvas.getContext('2d')!
    context.drawImage(
      atlas,
      'x' in frame ? frame.x : (frame.index % 8) * 256,
      'y' in frame ? frame.y : Math.floor(frame.index / 8) * 256,
      frame.w,
      frame.h,
      0,
      0,
      frame.w,
      frame.h
    )
    if (rgb !== 0xffffff) {
      const image = context.getImageData(0, 0, frame.w, frame.h),
        color = [rgb >>> 16, (rgb >>> 8) & 255, rgb & 255]
      for (let i = 0; i < image.data.length; i += 4)
        for (let channel = 0; channel < 3; channel++)
          image.data[i + channel] = Math.round((image.data[i + channel] * color[channel]) / 255)
      context.putImageData(image, 0, 0)
    }
    this.sprites.set(key, canvas)
    return canvas
  }

  draw() {
    const world = this.scene.world,
      state = world.worshipAcquisition,
      commands = getWorshipAcquisitionDrawCommands(state.controllers),
      interval = state.clock.nextVisit - state.clock.lastVisit,
      fraction =
        world.paused || world.land.landFlags & 2 || !interval
          ? 1
          : Math.max(0, Math.min(1, (state.clock.elapsed - state.clock.lastVisit) / interval))
    this.canvas.hidden = commands.length === 0
    if (!commands.length) return
    if (this.previousCommands !== state.previousDrawCommands) {
      this.previousCommands = state.previousDrawCommands
      this.previousParticles.clear()
      this.previousBody = undefined
      this.previousBuilding = undefined
      for (const command of this.previousCommands) {
        if (command.kind === 'body') this.previousBody = command
        else if (command.kind === 'building') this.previousBuilding = command
        else if (command.kind === 'sprite' && command.particle !== undefined)
          this.previousParticles.set(
            `${command.family}:${command.giftId}:${command.particle}`,
            command
          )
      }
    }
    const shell = this.scene.container.parentElement!,
      width = shell.clientWidth,
      height = shell.clientHeight,
      ratio = devicePixelRatio || 1
    if (
      this.canvas.width !== Math.round(width * ratio) ||
      this.canvas.height !== Math.round(height * ratio)
    ) {
      this.canvas.width = Math.round(width * ratio)
      this.canvas.height = Math.round(height * ratio)
    }
    const context = this.canvas.getContext('2d')!
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    context.clearRect(0, 0, width, height)
    context.imageSmoothingEnabled = false
    const layouts = new Map<WorshipAcquisitionGeometry, WorshipHudGeometry | null>()
    for (const command of commands) {
      if (!layouts.has(command.geometry))
        layouts.set(command.geometry, this.bridge?.measure(command.model, command.geometry) ?? null)
      const current = layouts.get(command.geometry)
      if (!current) continue
      if (command.kind === 'sprite') {
        const sprite = this.sprite(command)
        if (!sprite) continue
        let point: WorshipPoint
        if (command.owner === 'pulse') {
          const target = worshipTargetPoint(current)
          point = {
            x: target.x + (command.x - command.geometry.target.x) * current.hudScale,
            y: target.y + (command.y - command.geometry.target.y) * current.hudScale,
          }
        } else {
          const previous =
              command.particle === undefined
                ? undefined
                : this.previousParticles.get(
                    `${command.family}:${command.giftId}:${command.particle}`
                  ),
            interpolated = interpolateWorshipPoint(
              command,
              previous?.geometry === command.geometry ? previous : undefined,
              fraction
            )
          point = worshipDrawPoint(
            { x: interpolated.x + command.width / 2, y: interpolated.y + command.height / 2 },
            command.geometry,
            current
          )
          point.x -= (command.width * current.hudScale) / 2
          point.y -= (command.height * current.hudScale) / 2
        }
        context.globalAlpha = command.palette === 'ghost' ? 85 / 255 : 1
        context.drawImage(
          sprite,
          point.x,
          point.y,
          command.width * current.hudScale,
          command.height * current.hudScale
        )
        context.globalAlpha = 1
      } else if (command.kind === 'building') {
        const model = command.geometryModel ?? (command.model === 5 ? 95 : 103),
          resource = this.scene.templeResourceSnapshot
        if (model === 95 && !resource) throw new Error('Temple screen resource is unavailable')
        const atlas = texture(model === 95 ? templeArt.modelAtlas : 'atlas'),
          image = atlas.image as HTMLImageElement | undefined
        if (!image?.complete || !image.naturalWidth) continue
        const reference = command.geometry,
          anchor = interpolateWorshipPoint(
            command.anchor,
            this.previousBuilding?.giftId === command.giftId &&
              this.previousBuilding.geometry === command.geometry
              ? this.previousBuilding.anchor
              : undefined,
            fraction
          ),
          submissions = interpolateBuildingSubmissions(
            command,
            this.previousBuilding,
            fraction
          ).map(({ face, transformed, projected, flight }) => ({
            face,
            transformed,
            flight,
            projected: projected.map(([x, y]) => {
              const point = buildingDrawPoint({ x, y }, reference, current, flight, anchor)
              return [point.x, point.y]
            }),
          })),
          // Apply source outcodes after display mapping. A resized shell must
          // not retain the old window's visibility cuts or stretch the model.
          triangles = collectBuildingAcquisitionTriangles(
            { whole: command.whole, submissions },
            { width, height, model, templeTile: resource?.tile }
          )
        this.buildingSurface ??= new BuildingAcquisitionTriangleSurface(atlas)
        this.buildingSurface.setAtlas(atlas)
        context.drawImage(
          this.buildingSurface.draw(triangles, width, height, ratio),
          0,
          0,
          width,
          height
        )
      } else if (command.kind === 'body') {
        const atlas = texture('hud').image as HTMLImageElement | undefined,
          rect = (hud.rects as Record<string, { x: number; y: number; w: number; h: number }>)[
            command.frame
          ],
          art = bodyArt.bodyFrames[String(command.model) as keyof typeof bodyArt.bodyFrames]
        if (!atlas?.complete || !atlas.naturalWidth || !rect || !art) continue
        const previous =
            this.previousBody?.family === command.family &&
            this.previousBody?.giftId === command.giftId &&
            this.previousBody?.geometry === command.geometry &&
            !!this.previousBody.radians === !!command.radians
              ? this.previousBody
              : undefined,
          interpolated = interpolateWorshipPoint(command, previous, fraction),
          point = worshipDrawPoint(interpolated, command.geometry, current, command.finalLeg),
          scale =
            (previous
              ? previous.scale + (command.scale - previous.scale) * fraction
              : command.scale) * current.hudScale,
          angleDelta = previous
            ? Math.atan2(
                Math.sin(command.radians - previous.radians),
                Math.cos(command.radians - previous.radians)
              )
            : 0,
          angle = previous ? previous.radians + angleDelta * fraction : command.radians,
          crop = art.crop,
          width = crop.width * scale,
          height = crop.height * scale
        context.save()
        context.translate(point.x + crop.x * scale, point.y + crop.y * scale)
        context.rotate(-angle)
        context.drawImage(
          atlas,
          rect.x + crop.x,
          rect.y + crop.y,
          crop.width,
          crop.height,
          command.radians ? -width / 2 : 0,
          command.radians ? -height / 2 : 0,
          width,
          height
        )
        context.restore()
      }
    }
  }

  dispose() {
    this.buildingSurface?.dispose()
    this.buildingSurface = undefined
    this.canvas.remove()
    this.sprites.clear()
    this.anchors.clear()
    this.previousParticles.clear()
  }
}
