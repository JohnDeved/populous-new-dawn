import * as THREE from 'three'
import {
  globePalette,
  globeCircle,
  globeEffectFrame,
  globeFootprint,
  globeBuildingIcon,
  globeIconRect,
  globeMesh,
  globePoint,
  globeShade,
  globeStars,
  globeVisible,
  moveGlobeStars,
  type GlobeView,
} from './globe.ts'
import { terrainAtlas, type TerrainTextures } from './terrain-texture.ts'
import { buildingModel, nativePosition, unitInvisibleToPlayer, type World } from './model.ts'
import { tribeForTeam } from './world-types.ts'
import hud from './original-hud.json'
import effects from './original-effects.json'
import { lineQuad } from './lightning.ts'

// The world view has its own flat terrain and markers; ordinary models, waves
// and people sprites belong to the ground renderer.
export class GlobeRenderer extends THREE.Group {
  map = new THREE.DataTexture(new Uint8Array(1024 * 1024 * 4), 1024, 1024)
  land = new THREE.Mesh(
    new THREE.BufferGeometry(),
    new THREE.ShaderMaterial({
      uniforms: { map: { value: this.map } },
      vertexShader: `attribute float shade, shine; varying vec2 tex; varying float light, spec;
      void main(){tex=uv;light=shade;spec=shine;gl_Position=vec4(position,1.);}`,
      fragmentShader: `uniform sampler2D map;varying vec2 tex;varying float light,spec;
      void main(){gl_FragColor=vec4(clamp(texture2D(map,tex).rgb*light+spec,0.,1.),1.);}`,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
    })
  )
  stars = new THREE.Points(
    new THREE.BufferGeometry(),
    new THREE.ShaderMaterial({
      uniforms: { pixelRatio: { value: 1 } },
      vertexShader:
        'uniform float pixelRatio;attribute vec3 color;varying vec3 rgb;void main(){rgb=color;gl_PointSize=pixelRatio;gl_Position=vec4(position,1.);}',
      fragmentShader: 'varying vec3 rgb;void main(){gl_FragColor=vec4(rgb,1.);}',
      depthTest: false,
      depthWrite: false,
    })
  )
  canvas = document.createElement('canvas')
  markers = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(this.canvas),
      transparent: true,
      depthTest: false,
      depthWrite: false,
      fog: false,
    })
  )
  icons = new Image()
  effects = new Image()
  tintedEffects = new Map<string, HTMLCanvasElement>()
  phase = 0
  spellRange: { x: number; y: number; radius: number; tribe: number } | null = null
  offsets = new Int32Array(32)
  buildingIcons = new Set<number>()
  starPosition: { x: number; y: number } | null = null
  starsDirty = false
  view: GlobeView | null = null
  atlas: ReturnType<typeof terrainAtlas> | undefined
  version = -1
  shadows = new Uint8Array(16384)
  constructor() {
    super()
    this.map.colorSpace = THREE.NoColorSpace
    this.map.minFilter = THREE.LinearFilter
    this.map.magFilter = THREE.LinearFilter
    this.map.generateMipmaps = false
    this.map.wrapS = THREE.RepeatWrapping
    this.map.wrapT = THREE.RepeatWrapping
    this.markers.material.map!.colorSpace = THREE.SRGBColorSpace
    this.markers.material.map!.minFilter = THREE.NearestFilter
    this.markers.material.map!.magFilter = THREE.NearestFilter
    this.markers.material.map!.generateMipmaps = false
    this.markers.material.onBeforeCompile = shader => {
      shader.vertexShader = shader.vertexShader.replace(
        '#include <project_vertex>',
        'gl_Position=vec4(position.xy,0.,1.);'
      )
    }
    this.icons.src = '/original/hud.png'
    this.effects.src = '/original/effects.png'
    this.add(this.stars, this.land, this.markers)
    this.children.forEach((object, i) => {
      object.userData.nativeIgnore = true
      object.frustumCulled = false
      object.renderOrder = 10000 + i
    })
    this.visible = false
  }
  // Drag parallax uses clamped velocity, even when the map moves farther.
  moveStars(position: { x: number; y: number }, delta?: { x: number; y: number }) {
    const previous = this.starPosition ?? position,
      dx = delta?.x ?? ((position.x - previous.x) << 16) >> 16,
      dy = delta?.y ?? ((position.y - previous.y) << 16) >> 16
    if (dx || dy) {
      moveGlobeStars(this.offsets, dx, dy)
      this.starsDirty = true
    }
    this.starPosition = { x: position.x, y: position.y }
  }
  update(view: GlobeView, world: World, textures: TerrainTextures) {
    this.moveStars(view)
    if (
      this.version !== world.landVersion ||
      !world.land.shadows.every((v, i) => v === this.shadows[i])
    ) {
      this.atlas = terrainAtlas(world.land, textures, this.atlas, 8)
      if (this.atlas.updated) {
        this.map.image.data = this.atlas.pixels
        this.map.needsUpdate = true
      }
      this.version = world.landVersion
      this.shadows.set(world.land.shadows)
    }
    const previous = this.view
    if (
      !previous ||
      this.starsDirty ||
      Object.keys(view).some(k => view[k as keyof GlobeView] !== previous[k as keyof GlobeView])
    ) {
      this.starsDirty = false
      this.view = { ...view }
      const positions: number[] = [],
        uv: number[] = [],
        shade: number[] = [],
        shine: number[] = []
      for (const triangle of globeMesh(view)) {
        const maxX = Math.max(...triangle.points.map(p => p.x)),
          maxY = Math.max(...triangle.points.map(p => p.y))
        for (const p of triangle.points) {
          const q = globePoint(view, p.x << 9, p.y << 9),
            light = globeShade(view, q)
          positions.push((q.x * 2) / view.width - 1, 1 - (q.y * 2) / view.height, 0)
          // Original per-triangle maximum-edge inset, repacked into the shared
          // atlas. Native texture-cache rectangles/filter seams remain open.
          const u = (((p.x << 19) - (p.x === maxX ? 1 : 0)) >> 16) & 31,
            v = (((p.y << 19) - (p.y === maxY ? 1 : 0)) >> 16) & 31
          uv.push(
            (((triangle.tile.x - 68) & 127) * 8 + u + 0.5) / 1024,
            (((59 - triangle.tile.y) & 127) * 8 + 7 - v + 0.5) / 1024
          )
          shade.push(light.diffuse / 255)
          shine.push(light.specular / 255)
        }
      }
      this.land.geometry.dispose()
      this.land.geometry = new THREE.BufferGeometry()
      for (const [name, data, size] of [
        ['position', positions, 3],
        ['uv', uv, 2],
        ['shade', shade, 1],
        ['shine', shine, 1],
      ] as const)
        this.land.geometry.setAttribute(name, new THREE.Float32BufferAttribute(data, size))
      const stars = globeStars(view, this.offsets)
      this.stars.geometry.dispose()
      this.stars.geometry = new THREE.BufferGeometry()
      this.stars.geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(
          stars.flatMap(p => [
            ((p.x + 0.5) * 2) / view.width - 1,
            1 - ((p.y + 0.5) * 2) / view.height,
            0,
          ]),
          3
        )
      )
      this.stars.geometry.setAttribute(
        'color',
        new THREE.Float32BufferAttribute(
          stars.flatMap(p => [
            ((p.color >>> 16) & 255) / 255,
            ((p.color >>> 8) & 255) / 255,
            (p.color & 255) / 255,
          ]),
          3
        )
      )
    }
    this.drawMarkers(view, world, textures)
  }
  drawMarkers(view: GlobeView, world: World, textures: TerrainTextures) {
    if (this.canvas.width !== view.width || this.canvas.height !== view.height) {
      this.canvas.width = view.width
      this.canvas.height = view.height
    }
    const ctx = this.canvas.getContext('2d')!
    ctx.clearRect(0, 0, view.width, view.height)
    ctx.imageSmoothingEnabled = false
    const color = (index: number) =>
      `rgb(${textures.palette.slice(index * 4, index * 4 + 3).join(',')})`
    const locate = (p: { x: number; z: number }) => {
      const n = nativePosition(world, p)
      return globeVisible(view, n.x, n.y) ? globePoint(view, n.x, n.y) : null
    }
    const polygon = (points: number[], fill: string, outline = true) => {
      ctx.beginPath()
      ctx.moveTo(points[0], points[1])
      for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i], points[i + 1])
      ctx.closePath()
      ctx.fillStyle = fill
      ctx.fill()
      if (outline) {
        ctx.strokeStyle = color(globePalette.outline)
        ctx.lineWidth = 1
        ctx.stroke()
      }
    }
    if (this.spellRange) {
      for (const line of globeCircle(view, this.spellRange, this.spellRange.radius, this.phase)) {
        ctx.globalAlpha = line.alpha / 255
        polygon(lineQuad(line), color(globePalette.tribes[this.spellRange.tribe]), false)
      }
      ctx.globalAlpha = 1
    }
    this.buildingIcons.clear()
    const buildings = new Map(
      world.buildings.map(b => [b.id, { id: b.id, tribe: tribeForTeam(b.team) }])
    )
    for (let cell = 0; cell < world.land.flags.length; cell++) {
      const flags = world.land.flags[cell]
      if (!(flags & 0x680)) continue
      const footprint = globeFootprint(
        view,
        cell,
        flags,
        buildings.get(world.land.buildingIds[cell] & 1023),
        {
          player: world.manaWorld.playerTribe,
          turn: world.turn,
          fog: !!(world.manaWorld.levelFlags & 4),
          // ponytail: native cell concealment byte has no live owner yet.
          concealed: 0,
        }
      )
      if (!footprint) continue
      if (footprint.buildingId !== null) this.buildingIcons.add(footprint.buildingId)
      if (!footprint.quad) continue
      ctx.globalAlpha = footprint.translucent ? ((footprint.color & 15) * 16) / 255 : 1
      polygon(
        footprint.quad.flatMap(p => [p.x, p.y]),
        color(footprint.translucent ? hud.alphaColors[footprint.color >> 4] : footprint.color),
        false
      )
    }
    ctx.globalAlpha = 1
    // 0x41e5b0/0x41f680 shapes, with browser canvas rasterization. Complete
    // native queue order, selection flags and palette scheduling remain open.
    for (const tree of world.trees) {
      const p = tree.logs > 0 && locate(tree)
      if (p) {
        polygon(
          [p.x - 4, p.y + 3, p.x - 1, p.y - 4, p.x + 3, p.y + 3],
          color(globePalette.outline),
          false
        )
        polygon([p.x - 3, p.y + 2, p.x, p.y - 3, p.x + 2, p.y + 2], color(globePalette.tree), false)
      }
    }
    for (const u of world.units) {
      if (u.inside !== null || u.hp <= 0 || unitInvisibleToPlayer(world, u)) continue
      const p = locate(u)
      if (!p) continue
      const tribe = tribeForTeam(u.team),
        fill = color(tribe < 0 ? globePalette.wild : globePalette.tribes[tribe]),
        { x, y } = p
      if (u.kind === 'shaman' && u.team === 'blue')
        polygon([x - 4, y + 4, x, y - 4, x + 4, y + 4], fill)
      else if (u.kind === 'warrior') polygon([x - 3, y, x, y - 3, x + 3, y, x, y + 3], fill)
      else {
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fillStyle = fill
        ctx.fill()
        ctx.strokeStyle = color(globePalette.outline)
        ctx.stroke()
      }
    }
    if (this.icons.complete && this.icons.naturalWidth) {
      const icon = (q: { x: number; y: number } | null, id: number) => {
        const r = (hud.rects as Record<string, { x: number; y: number; w: number; h: number }>)[id]
        if (!q || !r) return
        const rect = globeIconRect(view, q, r.w, r.h)
        ctx.drawImage(this.icons, r.x, r.y, r.w, r.h, rect.x, rect.y, rect.width, rect.height)
      }
      for (const b of world.buildings) {
        if (b.progress < 1 || b.hp <= 0 || !this.buildingIcons.has(b.id)) continue
        const position = nativePosition(world, b),
          cell = ((position.y & 65535) >> 9) * 128 + ((position.x & 65535) >> 9)
        if (world.manaWorld.levelFlags & 4 && !(world.land.flags[cell] & 8)) continue
        const occupants = world.units.filter(u => u.inside === b.id && u.hp > 0),
          id = globeBuildingIcon(
            buildingModel(b),
            occupants.length,
            b.team === 'blue',
            occupants.map(u => ({ brave: 2, warrior: 3, preacher: 4, shaman: 5 })[u.kind])
          )
        icon(globePoint(view, position.x, position.y), id)
      }
      for (const shrine of world.shrines)
        icon(locate(shrine), shrine.kind === 'vault' ? 0x7a : 0x7b)
    }
    this.drawEffects(ctx, view, world, textures)
    this.markers.material.map!.needsUpdate = true
  }
  drawEffects(
    ctx: CanvasRenderingContext2D,
    view: GlobeView,
    world: World,
    textures: TerrainTextures
  ) {
    if (!this.effects.complete || !this.effects.naturalWidth) return
    for (const f of world.effects) {
      const sequence = f.sprite?.sequence
      if (
        sequence !== 'blastTrail' &&
        sequence !== 'spellTrail' &&
        !(sequence === 'blastShot' && f.sprite!.frame >= 4)
      )
        continue
      const animation = f.animation ?? {
          object: 1120 + f.sprite!.frame,
          draw: 29,
          f1: 0,
          palette: 15,
          renderFlags: 2,
        },
        position = nativePosition(world, f),
        cellX = position.x & 0xfe00,
        cellY = position.y & 0xfe00,
        cell = (cellY >> 9) * 128 + (cellX >> 9),
        tribe = tribeForTeam(f.team ?? 'wild')
      if (
        animation.renderFlags & 16 ||
        ('flags4' in animation && Number(animation.flags4) & 0x20000) ||
        !globeVisible(view, cellX, cellY)
      )
        continue
      // Native unseen-cell gating exempts owned effects. The live concealment
      // byte and complete mixed-class allocation/queue order remain open.
      if (
        world.manaWorld.levelFlags & 4 &&
        !(world.land.flags[cell] & 8) &&
        tribe !== world.manaWorld.playerTribe
      )
        continue
      const frame = globeEffectFrame(animation)
      if (!frame) continue
      // Original descriptors use only 240 (untinted), 0, 7 and 15. Other
      // out-of-file AL pointers need native runtime palette ownership first.
      if (frame.palette !== null && (frame.palette < 0 || frame.palette >= hud.spriteColors.length))
        continue
      const frames = (
          effects.animations as Record<
            string,
            { index: number; w: number; h: number; source: number }[]
          >
        )[sequence],
        art = frames.find(r => r.source === frame.id)
      if (!art) continue
      const q = globePoint(view, position.x, position.y),
        x = q.x - (art.w >> 1),
        y = q.y - art.h,
        sx = (art.index % 8) * 256,
        sy = Math.floor(art.index / 8) * 256
      if (frame.palette === null)
        ctx.drawImage(this.effects, sx, sy, art.w, art.h, x, y, art.w, art.h)
      else {
        const key = `${art.index}-${frame.palette}`
        let tinted = this.tintedEffects.get(key)
        if (!tinted) {
          tinted = document.createElement('canvas')
          tinted.width = art.w
          tinted.height = art.h
          const paint = tinted.getContext('2d')!
          paint.drawImage(this.effects, sx, sy, art.w, art.h, 0, 0, art.w, art.h)
          const pixels = paint.getImageData(0, 0, art.w, art.h),
            index = hud.spriteColors[frame.palette]
          for (let i = 0; i < pixels.data.length; i += 4)
            for (let channel = 0; channel < 3; channel++)
              pixels.data[i + channel] *= textures.palette[index * 4 + channel] / 255
          paint.putImageData(pixels, 0, 0)
          this.tintedEffects.set(key, tinted)
        }
        ctx.drawImage(tinted, x, y)
      }
    }
  }

  dispose() {
    this.map.dispose()
    this.markers.material.map!.dispose()
    for (const object of [this.land, this.stars, this.markers]) {
      object.geometry.dispose()
      object.material.dispose()
    }
  }
}
