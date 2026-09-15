import { nativePosition, unitInvisibleToPlayer, type World } from './model.ts'
import {
  minimapTerrain,
  minimapRGBA,
  minimapScroll,
  minimapTransform,
  minimapMarkers,
} from './minimap.ts'
import { terrainBrightness, type TerrainTextures } from './terrain-texture.ts'
import hud from './original-hud.json'
import { nativeUnitModel } from './unit-kinds.ts'
import { tribeForTeam } from './world-types.ts'

export class MinimapRenderer {
  terrain = document.createElement('canvas')
  source = document.createElement('canvas')
  art = new Image()
  tinted = new Map<string, HTMLCanvasElement>()
  revision: unknown
  fog = false

  constructor() {
    this.art.src = '/original/hud.png'
    this.terrain.width = 0
    this.source.width = 0
  }

  draw(
    canvas: HTMLCanvasElement,
    world: World,
    textures: TerrainTextures,
    center: { x: number; y: number },
    heading: number,
    revision: unknown
  ) {
    const bounds = canvas.getBoundingClientRect(),
      width = Math.max(1, Math.trunc(bounds.width)),
      height = Math.max(1, Math.trunc(bounds.height)),
      fog = !!(world.manaWorld.levelFlags & 4)
    if (this.terrain.width !== width || this.terrain.height !== height) {
      for (const target of [canvas, this.terrain, this.source]) {
        target.width = width
        target.height = height
      }
      this.revision = undefined
    }
    if (this.revision !== revision || this.fog !== fog) {
      const brightness = Uint8Array.from(world.land.heights, (_, i) =>
          terrainBrightness(world.land, i, [147, 147, 147])
        ),
        indexed = minimapTerrain(world.land, brightness, textures, width, height, fog),
        pixels = minimapRGBA(indexed, textures.palette)
      this.terrain.getContext('2d')!.putImageData(new ImageData(pixels, width, height), 0, 0)
      this.revision = revision
      this.fog = fog
    }
    const source = this.source.getContext('2d')!,
      ctx = canvas.getContext('2d')!,
      scroll = minimapScroll(width, height, center)
    source.clearRect(0, 0, width, height)
    for (const x of [-scroll.x, width - scroll.x])
      for (const y of [-scroll.y, height - scroll.y]) source.drawImage(this.terrain, x, y)

    // ponytail: arrays supply mixed-object order/visibility until the original
    // allocation list and minimap ownership flags are connected to the world.
    const objects = [
      ...world.units.map(u => ({
        ...nativePosition(world, u),
        category: 1,
        model: u.team === 'wild' ? 1 : nativeUnitModel(u.kind),
        tribe: tribeForTeam(u.team),
        hidden:
          !!u.inside ||
          !!(((u.flight ?? u.native)?.flags4 ?? 0) & 0x40000000) ||
          unitInvisibleToPlayer(world, u),
        visible: true,
      })),
      ...world.buildings.map(b => ({
        ...nativePosition(world, b),
        category: 2,
        model: 0,
        tribe: tribeForTeam(b.team),
        hidden: false,
        visible: true,
      })),
      ...world.shrines.map(s => ({
        ...nativePosition(world, s),
        category: 6,
        model: s.model,
        tribe: -1,
        hidden: false,
        visible: true,
      })),
    ].filter(
      p =>
        !(world.manaWorld.levelFlags & 4) ||
        !!(world.land.flags[((p.y >> 9) & 127) * 128 + ((p.x >> 9) & 127)] & 8)
    )
    for (const mark of minimapMarkers(objects, width, height, center, 0, world.turn)) {
      if (mark.sprite === undefined) {
        source.fillStyle = hud.colors[mark.color]
        source.fillRect(mark.x, mark.y, mark.size!, mark.size!)
      } else if (this.art.complete && this.art.naturalWidth) {
        const r = (hud.rects as Record<string, { x: number; y: number; w: number; h: number }>)[
          mark.sprite
        ]
        if (mark.color < 0)
          source.drawImage(
            this.art,
            r.x,
            r.y,
            r.w,
            r.h,
            mark.x - (r.w >> 1),
            mark.y - (r.h >> 1),
            r.w,
            r.h
          )
        else {
          const key = `${mark.sprite}:${mark.color}`
          let image = this.tinted.get(key)
          if (!image) {
            image = document.createElement('canvas')
            image.width = r.w
            image.height = r.h
            const paint = image.getContext('2d')!
            paint.drawImage(this.art, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h)
            paint.globalCompositeOperation = 'source-in'
            paint.fillStyle = hud.colors[mark.color]
            paint.fillRect(0, 0, r.w, r.h)
            this.tinted.set(key, image)
          }
          source.drawImage(image, mark.x, mark.y)
        }
      }
    }
    ctx.clearRect(0, 0, width, height)
    ctx.setTransform(new DOMMatrix(minimapTransform(width, height, heading)).inverse())
    ctx.drawImage(this.source, 0, 0)
    ctx.resetTransform()
  }
}
