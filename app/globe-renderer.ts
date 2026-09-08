import * as THREE from 'three'
import {
  globePalette,
  globeMesh,
  globePoint,
  globeShade,
  globeStars,
  globeVisible,
  moveGlobeStars,
  type GlobeView,
} from './globe.ts'
import { terrainAtlas, type TerrainTextures } from './terrain-texture.ts'
import { buildingModel, nativePosition, type World } from './model.ts'
import hud from './original-hud.json'

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
  offsets = new Int32Array(32)
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
    this.add(this.stars, this.land, this.markers)
    this.children.forEach((object, i) => {
      object.userData.nativeIgnore = true
      object.frustumCulled = false
      object.renderOrder = 10000 + i
    })
    this.visible = false
  }
  update(view: GlobeView, world: World, textures: TerrainTextures) {
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
      Object.keys(view).some(k => view[k as keyof GlobeView] !== previous[k as keyof GlobeView])
    ) {
      if (previous)
        moveGlobeStars(
          this.offsets,
          ((view.x - previous.x) << 16) >> 16,
          ((view.y - previous.y) << 16) >> 16
        )
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
      if (u.inside !== null || u.hp <= 0) continue
      const p = locate(u)
      if (!p) continue
      const fill = color(
          { blue: globePalette.tribes[0], red: globePalette.tribes[1], wild: globePalette.wild }[
            u.team
          ]
        ),
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
      const icon = (p: { x: number; z: number }, id: number) => {
        const q = locate(p),
          r = (hud.rects as Record<string, { x: number; y: number; w: number; h: number }>)[id]
        if (!q || !r) return
        let width = r.w,
          height = r.h
        const radius = Math.trunc((view.height * 4) / 10) ** 2,
          distance =
            ((view.width >> 1) - q.x + (width >> 1)) ** 2 +
            ((view.height >> 1) - q.y + (height >> 1)) ** 2
        if (distance > radius >> 1) {
          const scale =
            Math.trunc(((radius - Math.min(radius, distance)) * 32768) / (radius >> 1)) + 32768
          width = Math.max(1, Math.min(width, (width * scale) >> 16))
          height = Math.max(1, Math.min(height, (height * scale) >> 16))
        }
        ctx.drawImage(
          this.icons,
          r.x,
          r.y,
          r.w,
          r.h,
          q.x - (width >> 1),
          q.y - (height >> 1),
          width,
          height
        )
      }
      for (const b of world.buildings) {
        if (b.progress < 1 || b.hp <= 0) continue
        const model = buildingModel(b),
          count =
            b.team === 'blue' ? world.units.filter(u => u.inside === b.id && u.hp > 0).length : 0
        icon(
          b,
          model <= 3
            ? [0, 0x86, 0x8a, 0x8f][model] + count
            : (({ 4: 0x78, 5: 0xa6, 6: 0xa7, 7: 0xa4, 8: 0xa5 } as Record<number, number>)[model] ??
                0x434)
        )
      }
      for (const shrine of world.shrines) icon(shrine, shrine.kind === 'vault' ? 0x7a : 0x7b)
    }
    this.markers.material.map!.needsUpdate = true
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
