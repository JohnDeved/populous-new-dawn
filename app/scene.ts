import { animateLiveObjects } from './live-people.ts'
import { reincarnationStones } from './reincarnation.ts'
import { soundAttenuation } from './audio'
import { stepFlyby, interruptFlyby, type FlybyCamera } from './flyby.ts'
import {
  createCameraMotion,
  createResultCamera,
  beginResultCamera,
  stepResultCamera,
  stepCameraMotion,
} from './camera-motion.ts'
import { defeatSky, createSkyMotion, updateSkyArray, skyCloudLayer } from './sky.ts'
import { readTerrainTextures, terrainAtlas, type TerrainTextures } from './terrain-texture.ts'
import { waterTexture, waterPoint, waterCell } from './water.ts'
import skyPalette from './original-sky.json'
import {
  createTooltip,
  showObjectTooltip,
  stepTooltip,
  forcedTooltipObject,
  worldTooltipObject,
  tooltipPalette,
} from './tooltips.ts'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import {
  buildingObject,
  buildingStage,
  nativePosition,
  browserPosition,
  sound,
  GRID,
  SIZE,
  HOME,
  ENEMY,
  PLANET_RADIUS,
  placementError,
  height,
  walkable,
  distance,
  maxHp,
  buildingHp,
  cast,
  command,
  placeBuilding,
  spellRange,
  spellTargetError,
  SPELLS,
  tick,
  type World,
  type Point,
  type Unit,
  type Building,
  type Effect,
  unitAnimation,
} from './model'

import nativeModelData from './original-models.json'
import { modelStage, type NativeModel } from './model-faces.ts'
const nativeModels: Record<number, NativeModel> = nativeModelData
import { morphCoordinate } from './morph.ts'
import { spriteDirection, spriteCoordinate, selectionArrow } from './projection.ts'
import { RenderView } from './render-view.ts'
import nativeUnits from './original-units.json'
import nativeEffects from './original-effects.json'
import nativeHud from './original-hud.json'
import { spellCursor } from './spell-casting.ts'
import { spellHalo, haloBucket } from './spell-halo.ts'
import { buildingFootprintCells } from './building-shapes.ts'
import { groundOverlay, groundOverlayTriangles } from './ground-overlay.ts'
import { lightningLines, lightningQuad, lightningTexture, type Lightning } from './lightning.ts'
import rules from './original-rules.json'

const teamColor = { blue: 0x303fc1, red: 0xb92720, wild: 0x9f9170 }
const material = (color: number, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 1, ...extra })
const textures = new Map<string, THREE.Texture>()
function texture(kind: string) {
  if (textures.has(kind)) return textures.get(kind)!
  const t =
    kind === 'lightning-bolt'
      ? new THREE.DataTexture(lightningTexture(), 32, 32)
      : new THREE.TextureLoader().load(`/original/${kind}.png`)
  if (kind === 'lightning-bolt') {
    t.needsUpdate = true
    t.magFilter = t.minFilter = THREE.LinearFilter
    t.generateMipmaps = false
  }
  t.colorSpace =
    kind.endsWith('detail') || kind === 'lightning-bolt' ? THREE.NoColorSpace : THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.anisotropy = 8
  if (kind === 'units' || kind === 'effects' || kind === 'selection') {
    t.magFilter = t.minFilter = THREE.NearestFilter
    t.generateMipmaps = false
  }
  textures.set(kind, t)
  return t
}
function effectFrame(sprite: THREE.Sprite, frame: { index: number; w: number; h: number }) {
  const map = sprite.material.map!
  map.repeat.set(frame.w / nativeEffects.width, frame.h / nativeEffects.height)
  map.offset.set(
    ((frame.index % 8) * 256) / nativeEffects.width,
    1 - (Math.floor(frame.index / 8) * 256 + frame.h) / nativeEffects.height
  )
  sprite.scale.set(frame.w, frame.h, 1)
}
function nativeModel(id: number, scale = 2, stage = 4) {
  const data = nativeModels[id]
  const geo = geometry(`original-${id}-${stage}`, () => {
    const { p, uv } = modelStage(data, stage),
      g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    g.computeVertexNormals()
    return g
  })
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({ map: texture('atlas'), side: THREE.DoubleSide, alphaTest: 0.5 })
  )
  mesh.scale.setScalar(scale)
  mesh.userData.nativeModel = id
  mesh.userData.stage = stage
  mesh.userData.nativeScale = data.scale
  return mesh
}
const meshes = new Map<string, THREE.BufferGeometry>()
function geometry(key: string, create: () => THREE.BufferGeometry) {
  if (!meshes.has(key)) meshes.set(key, create())
  return meshes.get(key)!
}
const box = (x: number, y: number, z: number) =>
  geometry(`b${x},${y},${z}`, () => new THREE.BoxGeometry(x, y, z))
function part(
  group: THREE.Group,
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  x = 0,
  y = 0,
  z = 0
) {
  const m = new THREE.Mesh(geo, mat)
  m.position.set(x, y, z)
  m.castShadow = true
  m.receiveShadow = true
  group.add(m)
  return m
}
function ring(radius: number, color: number, width = 0.075) {
  const g = new THREE.RingGeometry(radius - width, radius, 64)
  g.rotateX(-Math.PI / 2)
  return new THREE.Mesh(
    g,
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  )
}
function makeUnit(u: Unit) {
  const g = new THREE.Group(),
    map = texture('units').clone()
  map.repeat.set(nativeUnits.cell / nativeUnits.width, nativeUnits.cell / nativeUnits.height)
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map, alphaTest: 0.5, depthWrite: true, toneMapped: false })
  )
  // Frame-specific offsets keep native feet, headdresses and death poses anchored.
  g.add(sprite)
  const shadow = ring(0.36, 0x171b12, 0.35)
  shadow.position.y = 0.015
  ;(shadow.material as THREE.MeshBasicMaterial).opacity = 0.32
  g.add(shadow)
  const selection = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture('selection').clone(),
      alphaTest: 0.5,
      depthWrite: false,
      toneMapped: false,
    })
  )
  selection.visible = false
  g.add(selection)
  const health = new THREE.Group()
  part(health, box(0.8, 0.055, 0.02), material(0x20251a), 0, 2.1)
  const healthFill = part(health, box(0.78, 0.04, 0.025), material(teamColor[u.team]), 0, 2.1, 0.01)
  g.add(health)
  g.userData = {
    unit: u.id,
    owner: u.team === 'blue' ? 0 : u.team === 'red' ? 1 : -1,
    signature: `${u.team}-${u.kind}`,
    sprite,
    selection,
    health,
    healthFill,
    heading: 0,
    frame: -1,
  }
  return g
}
function makeBuilding(b: Building, stage: number) {
  const g = new THREE.Group(),
    id = buildingObject(b)
  const model = nativeModel(id, b.kind === 'temple' ? 1.65 : 2, stage)
  g.add(model)
  const health = new THREE.Group(),
    top = b.kind === 'tower' ? 6 : 4.8
  part(health, box(2.5, 0.09, 0.05), material(0x201d16), 0, top)
  const healthFill = part(health, box(2.5, 0.09, 0.06), material(teamColor[b.team]), 0, top, 0.01)
  g.add(health)
  g.userData = { building: b.id, signature: `${b.level}-${stage}`, health, healthFill }
  return g
}

export class GameScene {
  world: World
  view = new RenderView()
  skyDome: THREE.Mesh | null = null
  skyMotion = createSkyMotion()
  skyGrid = new Int32Array(26 * 96 * 2)
  skyLoaded = false
  skyClouds: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>[] = []
  skyFlash = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms: { rgba: { value: new THREE.Vector4() } },
      vertexShader: 'void main(){gl_Position=vec4(position.xy,1.,1.);}',
      fragmentShader: 'uniform vec4 rgba; void main(){gl_FragColor=rgba;}',
      transparent: true,
      depthWrite: false,
      depthTest: true,
      toneMapped: false,
    })
  )
  overviewActive = false
  viewZoom = 0
  dragLast = { x: 0, y: 0 }
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(38, 1, 0.2, 1000)
  renderer: THREE.WebGLRenderer
  controls: OrbitControls
  terrain: THREE.InstancedMesh
  waves: Uint8Array | null = null
  waterMap = new THREE.DataTexture(new Uint8Array(256 * 256 * 4), 256, 256)
  waterState = ''
  waterScroll = { value: 0 }
  terrainMap = new THREE.DataTexture(new Uint8Array(4096 * 4096 * 4), 4096, 4096)
  terrainTextures: TerrainTextures | null = null
  terrainAtlasState: ReturnType<typeof terrainAtlas> | undefined
  terrainLoad = new AbortController()
  terrainMapVersion: number | null = null
  terrainShadows = new Uint8Array(16384)
  unitMeshes = new Map<number, THREE.Group>()
  buildingMeshes = new Map<number, THREE.Group>()
  hoveredObject: number | null = null
  fxMeshes = new Map<number, THREE.Group>()
  objects = new THREE.Group()
  decorations = new THREE.Group()
  shrineMeshes = new Map<number, { g: THREE.Group }>()
  cursor = new THREE.Mesh(
    new THREE.BufferGeometry(),
    new THREE.MeshBasicMaterial({
      map: texture('atlas'),
      vertexColors: true,
      transparent: true,
      alphaTest: 0.01,
      depthWrite: false,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  )
  placementState = ''
  range = new THREE.Group()
  halo = { angle: 0 }
  hoveredSpell = 0
  mouse = new THREE.Vector2()
  pointer: Point | null = null
  pointerScreen: { clientX: number; clientY: number } | null = null
  pointerState = ''
  spellPointer = document.createElement('div')
  viewPoint: Point = HOME
  flybyCamera: FlybyCamera = { x: 17 * 256, y: -41 * 256, angle: 0, zoom: 0 }
  cameraBearing = 0
  flybyTime = 0
  wasFlying = false
  resultCamera = createResultCamera()
  resultMotion = createCameraMotion()
  resultView = { x: 0, y: 0, angle: 0 }
  resultRequest = 0
  resultTime = 0
  resultTurn = 0
  tooltip = createTooltip()
  tooltipElement = document.createElement('div')
  down = { x: 0, y: 0, button: 0 }
  dragBox: HTMLDivElement
  keys = new Set<string>()
  resize: ResizeObserver
  frame = 0
  previous = 0
  uiTimer = 0
  personAnimationTime = 0
  terrainVersion = -1
  treeSignature = ''
  onChange: () => void
  onSound: (cue: number, attenuation?: number, pan?: number) => void
  soundSerial = 0
  disposeListeners: (() => void)[] = []
  container: HTMLElement
  mini: HTMLCanvasElement
  minimapBackground = document.createElement('canvas')

  constructor(
    container: HTMLElement,
    minimap: HTMLCanvasElement,
    world: World,
    onChange: () => void,
    onSound: (cue: number, attenuation?: number, pan?: number) => void
  ) {
    this.container = container
    this.mini = minimap
    this.world = world
    this.onChange = onChange
    this.onSound = onSound
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8))
    this.renderer.shadowMap.enabled = false
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    this.renderer.toneMapping = THREE.NoToneMapping
    this.renderer.toneMappingExposure = 1
    this.renderer.setClearColor(0x172c36, 0)
    this.renderer.domElement.setAttribute(
      'aria-label',
      'Island battlefield. Click to select, right-click to move, drag to select a group.'
    )
    this.renderer.domElement.tabIndex = 0
    container.appendChild(this.renderer.domElement)
    this.tooltipElement.className = 'native-tooltip'
    this.tooltipElement.setAttribute('role', 'tooltip')
    this.tooltipElement.style.backgroundColor = `rgb(${tooltipPalette.background.join(',')})`
    this.tooltipElement.style.color = `rgb(${tooltipPalette.foreground.join(',')})`
    this.tooltipElement.hidden = true
    container.appendChild(this.tooltipElement)
    this.spellPointer.className = 'spell-pointer'
    this.spellPointer.setAttribute('aria-hidden', 'true')
    for (let i = 0; i < 3; i++) {
      const sprite = document.createElement('i')
      sprite.className = 'hud-sprite'
      this.spellPointer.appendChild(sprite)
    }
    this.spellPointer.hidden = true
    container.appendChild(this.spellPointer)
    this.scene.fog = new THREE.FogExp2(0x9aadb5, 0.001)
    this.scene.add(new THREE.HemisphereLight(0xc6d6e3, 0x777258, 2.0))
    const sun = new THREE.DirectionalLight(0xfff2d5, 2.6)
    sun.position.set(-35, 90, 65)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.camera.left = -62
    sun.shadow.camera.right = 62
    sun.shadow.camera.top = 62
    sun.shadow.camera.bottom = -62
    sun.shadow.normalBias = 0.16
    sun.shadow.bias = -0.0001
    this.scene.add(sun)
    this.makeSky()
    this.camera.up.set(0, 0, -1)
    this.camera.position.set(30, 155, 0)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.target.set(0, -PLANET_RADIUS, 0)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.09
    this.controls.minDistance = PLANET_RADIUS + 14
    this.controls.maxDistance = PLANET_RADIUS + 190
    this.controls.enablePan = false
    this.controls.minPolarAngle = 0.03
    this.controls.maxPolarAngle = Math.PI - 0.03
    this.controls.mouseButtons = {
      LEFT: null as unknown as THREE.MOUSE,
      MIDDLE: THREE.MOUSE.ROTATE,
      RIGHT: THREE.MOUSE.ROTATE,
    }
    this.controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }
    this.controls.update()
    this.terrainMap.colorSpace = THREE.SRGBColorSpace
    this.terrainMap.magFilter = this.terrainMap.minFilter = THREE.LinearFilter
    this.waterMap.colorSpace = THREE.SRGBColorSpace
    this.waterMap.wrapS = this.waterMap.wrapT = THREE.RepeatWrapping
    this.waterMap.magFilter = this.waterMap.minFilter = THREE.LinearFilter
    void Promise.all(
      ['landscape.bin', 'waves.bin'].map(name =>
        fetch(`/original/${name}`, { signal: this.terrainLoad.signal }).then(response => {
          if (!response.ok) throw new Error(`Terrain texture load failed: ${response.status}`)
          return response.arrayBuffer()
        })
      )
    )
      .then(([buffer, waves]) => {
        if (!this.terrainLoad.signal.aborted) {
          if (waves.byteLength !== 65536) throw new Error('Invalid original wave table')
          this.terrainTextures = readTerrainTextures(buffer)
          this.waves = new Uint8Array(waves)
          const indexed = waterTexture(this.terrainTextures, 0),
            pixels = this.waterMap.image.data as Uint8Array,
            palette = this.terrainTextures.palette
          indexed.forEach((c, i) =>
            pixels.set([palette[c * 4], palette[c * 4 + 1], palette[c * 4 + 2], 255], i * 4)
          )
          this.waterMap.needsUpdate = true
          this.updateTerrainTexture()
          this.waterState = ''
        }
      })
      .catch(error => {
        if (!this.terrainLoad.signal.aborted) console.error(error)
      })
    this.terrain = new THREE.InstancedMesh(
      new THREE.BufferGeometry(),
      new THREE.ShaderMaterial({
        uniforms: {
          map: { value: this.terrainMap },
          waterMap: { value: this.waterMap },
          scroll: this.waterScroll,
        },
        vertexShader: `attribute float surface;attribute float light;varying vec2 land;varying vec2 waterUV;varying float sea;varying float shade;
        void main(){land=(uv+128.)/256.;waterUV=vec2(uv.x+8.,-uv.y-8.)/16.;sea=surface;shade=light;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader: `uniform sampler2D map;uniform sampler2D waterMap;uniform float scroll;varying vec2 land;varying vec2 waterUV;varying float sea;varying float shade;
      void main(){gl_FragColor=sea>.5?texture2D(waterMap,waterUV+scroll):texture2D(map,land);
      #include <colorspace_fragment>
      if(sea>.5)gl_FragColor.rgb*=shade;
      }`,
      }),
      9
    )
    const tiles = [
      [0, 0],
      ...[-256, 0, 256].flatMap(x =>
        [-256, 0, 256].filter(z => x !== 0 || z !== 0).map(z => [x, z])
      ),
    ]
    tiles.forEach(([x, z], i) =>
      this.terrain.setMatrixAt(i, new THREE.Matrix4().makeTranslation(x, 0, z))
    )
    this.terrain.userData.nativeRelative = true
    this.terrain.receiveShadow = true
    this.terrain.castShadow = true
    this.scene.add(this.terrain)
    this.scene.add(this.objects, this.decorations, this.cursor, this.range)
    this.cursor.visible = false
    this.range.visible = false
    this.rebuildTerrain()
    this.makeDecorations()
    this.makeShrines()
    this.focus({ x: 2, z: 30 })
    this.drawMinimap()
    this.dragBox = document.createElement('div')
    this.dragBox.className = 'selection-box'
    container.appendChild(this.dragBox)
    this.resize = new ResizeObserver(() => this.setSize())
    this.resize.observe(container)
    this.setSize()
    this.listen(this.renderer.domElement, 'pointerdown', this.pointerDown)
    this.listen(this.renderer.domElement, 'pointermove', this.pointerMove)
    this.listen(this.renderer.domElement, 'pointerleave', () => {
      this.hoveredObject = null
      this.pointerScreen = null
      this.pointer = null
      this.pointerState = ''
    })
    this.listen(this.renderer.domElement, 'pointerup', this.pointerUp)
    this.listen(this.renderer.domElement, 'contextmenu', e => e.preventDefault())
    this.listen(this.renderer.domElement, 'wheel', e => {
      if (!this.overviewActive && !this.world.inputMask) {
        e.preventDefault()
        this.zoom(Math.exp((e as WheelEvent).deltaY * 0.001))
      }
    })
    this.listen(window, 'keydown', this.keyDown)
    this.listen(window, 'keyup', e => this.keys.delete((e as KeyboardEvent).key.toLowerCase()))
    this.listen(window, 'blur', () => {
      this.keys.clear()
      this.world.paused = true
      this.onChange()
    })
    this.listen(minimap, 'pointerdown', e => {
      if (this.world.inputMask) return
      const p = e as PointerEvent,
        rect = minimap.getBoundingClientRect()
      this.focus({
        x: ((p.clientX - rect.left) / rect.width) * SIZE - 48,
        z: ((p.clientY - rect.top) / rect.height) * SIZE - 48,
      })
    })
    this.frame = requestAnimationFrame(this.animate)
  }
  makeSky() {
    // Native sky commands precede land and receive a farther depth (0x47c7e0).
    // Draw before other transparent objects, with opaque land still occluding it.
    this.skyFlash.renderOrder = -10000
    this.skyFlash.frustumCulled = false
    this.skyFlash.userData.nativeIgnore = true
    this.skyFlash.visible = false
    this.scene.add(this.skyFlash)
    const loader = new THREE.TextureLoader()
    const sky = loader.load('/original/sky.png')
    sky.colorSpace = THREE.SRGBColorSpace
    this.scene.background = sky
    for (const [i, name] of ['clouds', 'clouds-high'].entries()) {
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(31 * 3), 3))
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(31 * 2), 2))
      geo.setAttribute('fade', new THREE.Float32BufferAttribute(new Float32Array(31), 1))
      const mesh = new THREE.Mesh(
        geo,
        new THREE.ShaderMaterial({
          uniforms: { map: { value: texture(name) } },
          vertexShader:
            'attribute float fade; varying vec2 cloudUV; varying float cloudAlpha; void main(){cloudUV=vec2(uv.x,1.-uv.y);cloudAlpha=fade;gl_Position=vec4(position.xy,1.,1.);}',
          fragmentShader: `uniform sampler2D map; varying vec2 cloudUV; varying float cloudAlpha;
          void main(){gl_FragColor=texture2D(map,cloudUV);gl_FragColor.a*=cloudAlpha;
          #include <colorspace_fragment>
          }`,
          transparent: true,
          depthWrite: false,
          depthTest: true,
          toneMapped: false,
          side: THREE.DoubleSide,
        })
      )
      mesh.renderOrder = -10002 + i
      mesh.frustumCulled = false
      mesh.userData.nativeIgnore = true
      this.skyClouds.push(mesh)
      this.scene.add(mesh)
    }
    const clouds = loader.load('/original/clouds.png')
    clouds.colorSpace = THREE.SRGBColorSpace
    clouds.wrapS = clouds.wrapT = THREE.RepeatWrapping
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(350, 48, 24),
      new THREE.MeshBasicMaterial({
        map: clouds,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        fog: false,
        opacity: 0.72,
      })
    )
    clouds.repeat.set(4, 2)
    this.skyDome = dome
    dome.userData.nativeIgnore = true
    dome.position.y = -PLANET_RADIUS
    this.scene.add(dome)
  }
  updateSky(ticks: number) {
    const camera = {
      ...this.view.center,
      angle: Math.round((this.cameraBearing * 1024) / Math.PI) & 2047,
    }
    // 0x524a30 initializes the lens with one extra update on its first draw.
    if (!this.skyLoaded) {
      updateSkyArray(this.skyMotion, camera, ticks, this.skyGrid)
      this.skyLoaded = true
    }
    updateSkyArray(this.skyMotion, camera, ticks, this.skyGrid)
    const width = this.container.clientWidth,
      height = this.container.clientHeight
    if (!width || !height) return
    for (const [i, mesh] of this.skyClouds.entries()) {
      mesh.visible = !this.overviewActive
      if (!mesh.visible) continue
      // ponytail: the browser battlefield is the render surface. Its HUD is
      // outside that surface, so include the original optional left strip.
      // Restore native offsets when the original UI layout is integrated.
      const layer = skyCloudLayer(
        this.skyGrid,
        width,
        height,
        height,
        i ? 192 : 256,
        true,
        true,
        true,
        true
      )
      const { position, uv, fade } = mesh.geometry.attributes
      layer.vertices.forEach((v, j) => {
        position.setXYZ(j, (v.x * 2) / width - 1, 1 - (v.y * 2) / height, 1)
        uv.setXY(j, v.u, v.v)
        fade.setX(j, (v.color >>> 24) / 255)
      })
      position.needsUpdate = uv.needsUpdate = fade.needsUpdate = true
      const count = layer.triangles.length * 3
      if (mesh.geometry.index?.count !== count) mesh.geometry.setIndex(layer.triangles.flat())
    }
  }
  listen(target: EventTarget, name: string, handler: EventListener) {
    target.addEventListener(name, handler)
    this.disposeListeners.push(() => target.removeEventListener(name, handler))
  }
  setSize() {
    const { width, height } = this.container.getBoundingClientRect()
    this.renderer.setSize(width, height)
    this.camera.aspect = width / Math.max(1, height)
    this.camera.updateProjectionMatrix()
    this.updateView()
  }
  y(p: Point) {
    return height(this.world.terrain, p.x, p.z)
  }
  locate(g: THREE.Object3D, p: Point, h = this.y(p)) {
    g.position.set(p.x, Math.round(h * 45) / 128, p.z)
    g.quaternion.identity()
    g.userData.nativeHeading = 0
  }
  orientModel(g: THREE.Group, angle: number) {
    g.rotation.y = -angle
    g.userData.nativeHeading = Math.round((angle * 1024) / Math.PI) & 2047
  }
  updateView() {
    this.view.update(
      this.container.clientWidth,
      this.container.clientHeight,
      this.viewPoint,
      this.cameraBearing,
      this.viewZoom,
      this.overviewActive,
      document.documentElement.clientWidth
    )
  }
  screen(p: Point, h = this.y(p)) {
    return this.view.screen(new THREE.Vector3(p.x, (h * 45) / 128, p.z), this.camera)
  }
  visible(p: Point, h = this.y(p)) {
    const q = this.screen(p, h)
    if (q.z < -1 || q.z > 1) return false
    if (!this.overviewActive) return this.view.visible(p)
    const a = (p.x * Math.PI) / 128,
      b = (p.z * Math.PI) / 256,
      n = new THREE.Vector3(Math.sin(a) * Math.cos(b), Math.cos(a) * Math.cos(b), Math.sin(b))
    return n.dot(this.camera.position.clone().add(new THREE.Vector3(0, 70, 0))) > 70 + h
  }
  updatePlacement() {
    const w = this.world,
      kind = w.mode as Building['kind'],
      p = this.pointer
    this.cursor.visible =
      !!p && !!kind && !SPELLS.some(s => s.id === w.mode) && !w.inputMask && w.status === 'playing'
    if (!p || !this.cursor.visible) {
      this.placementState = ''
      return
    }
    // ponytail: the browser placement validator supplies validity until the
    // native plan preview/cell-marking controller owns these transient flags.
    const invalid = !!placementError(w, kind, p),
      native = nativePosition(w, p)
    const pose = {
      object: buildingObject({ kind, team: 'blue', level: 1 }),
      angle: 0,
      anchorX: native.x & 0xfe00,
      anchorY: native.y & 0xfe00,
    }
    const key = [kind, pose.anchorX, pose.anchorY, invalid, w.landVersion].join(',')
    if (key === this.placementState) return
    this.placementState = key
    const cells = buildingFootprintCells(pose),
      flags = new Uint32Array(w.land.flags),
      mask = invalid ? 0x180 : 0x80
    // These are presentation marks, not persistent terrain ownership flags.
    for (let i = 0; i < flags.length; i++) flags[i] &= ~0x1980
    for (const i of cells) flags[i] |= mask
    const positions: number[] = [],
      uv: number[] = [],
      colors: number[] = []
    for (const i of cells) {
      const overlay = groundOverlay(flags, i, mask),
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
    this.cursor.geometry.dispose()
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    this.cursor.geometry = geo
    this.cursor.userData.cells = cells
    this.cursor.userData.invalid = invalid
  }

  rebuildTerrain() {
    const w = this.world,
      positions: number[] = [],
      uv: number[] = [],
      surfaces: number[] = [],
      lights: number[] = []
    const add = (x: number, z: number, sea: number) => {
      const i = this.landIndex(x, z)
      positions.push(x, w.land.heights[i] / 128, z)
      uv.push(x, z)
      surfaces.push(sea)
      lights.push(1)
    }
    for (let z = -128; z < 128; z += 2)
      for (let x = -128; x < 128; x += 2) {
        const i = this.landIndex(x, z + 2),
          sea = Number(waterCell(w.land, i))
        if (!(w.land.flags[i] & 1)) {
          add(x, z, sea)
          add(x, z + 2, sea)
          add(x + 2, z, sea)
          add(x + 2, z, sea)
          add(x, z + 2, sea)
          add(x + 2, z + 2, sea)
        } else {
          add(x, z, sea)
          add(x + 2, z + 2, sea)
          add(x + 2, z, sea)
          add(x, z, sea)
          add(x, z + 2, sea)
          add(x + 2, z + 2, sea)
        }
      }
    this.terrain.geometry.dispose()
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    geo.setAttribute('surface', new THREE.Float32BufferAttribute(surfaces, 1))
    geo.setAttribute('light', new THREE.Float32BufferAttribute(lights, 1))
    this.terrain.geometry = mergeVertices(geo)
    geo.dispose()
    this.terrainVersion = w.landVersion
    this.waterState = ''
    for (const d of this.decorations.children) {
      const p = d.userData.point as Point | undefined
      if (p) {
        this.locate(d, p)
        d.visible = walkable(w.terrain, p)
      }
    }
    const bg = this.minimapBackground
    bg.width = GRID
    bg.height = GRID
    const ctx = bg.getContext('2d')!
    const data = ctx.createImageData(GRID, GRID)
    for (let i = 0; i < w.terrain.length; i++) {
      const h = w.terrain[i]
      const c =
        h < 0.4
          ? [25, 55, 63]
          : h < 1.2
            ? [153, 146, 106]
            : h > 7
              ? [114, 121, 113]
              : [71 + h * 4, 93 + h * 3, 61 + h * 2]
      data.data.set([...c, 255], i * 4)
    }
    ctx.putImageData(data, 0, 0)
  }
  updateTerrainTexture() {
    if (!this.terrainTextures) return
    const w = this.world
    if (
      this.terrainMapVersion === w.landVersion &&
      w.land.shadows.every((v, i) => v === this.terrainShadows[i])
    )
      return
    this.terrainAtlasState = terrainAtlas(w.land, this.terrainTextures, this.terrainAtlasState)
    if (this.terrainAtlasState.updated) {
      this.terrainMap.image = { data: this.terrainAtlasState.pixels, width: 4096, height: 4096 }
      this.terrainMap.needsUpdate = true
    }
    this.terrainMapVersion = w.landVersion
    this.terrainShadows.set(w.land.shadows)
  }
  landIndex(x: number, z: number) {
    return ((Math.round((-z - 8) / 2) & 127) << 7) | (Math.round((x + 8) / 2) & 127)
  }
  updateWater() {
    if (!this.waves) return
    const w = this.world,
      key = `${w.turn}:${w.landVersion}:${this.terrain.geometry.id}`
    if (key === this.waterState) return
    this.waterState = key
    // ponytail: simulation turns feed both clocks until the native outer
    // command loop is live; the original texture uses its separate outer turn.
    this.waterScroll.value = (w.turn & 255) / 256
    const pos = this.terrain.geometry.getAttribute('position'),
      light = this.terrain.geometry.getAttribute('light')
    for (let j = 0; j < pos.count; j++) {
      const i = this.landIndex(pos.getX(j), pos.getZ(j)),
        p = waterPoint(w.land, i, w.turn, this.waves)
      pos.setY(j, p.height / 128)
      light.setX(j, p.color < 32 ? (p.color * 8) / 255 : 1)
    }
    pos.needsUpdate = light.needsUpdate = true
  }
  makeDecorations() {
    for (const tree of this.world.trees) {
      if (tree.logs < 1) continue
      if (tree.model === 11) {
        const f: Effect = {
          ...tree,
          kind: 'trail',
          sprite: { sequence: 'log', frame: 0 },
          age: 0,
          duration: 1,
        }
        const g = this.makeFx(f)
        this.animateFx(g, f)
        g.userData.point = tree
        this.decorations.add(g)
        continue
      }
      if (this.world.buildings.some(b => distance(b, tree) < 3.7)) continue
      const g = new THREE.Group()
      g.add(nativeModel([13, 14, 15, 16, 17, 18][Math.max(0, tree.model - 1)]))
      this.locate(g, tree)
      g.userData.point = tree
      this.decorations.add(g)
    }
    for (const center of [HOME, ENEMY]) {
      const stones = reincarnationStones(this.world.land, nativePosition(this.world, center))
      for (const stone of stones) {
        const group = new THREE.Group()
        group.name = 'reincarnation-stone'
        group.add(nativeModel(30))
        this.locate(group, browserPosition(stone), stone.h / 45)
        this.orientModel(group, (stone.heading * Math.PI) / 1024)
        this.decorations.add(group)
      }
    }
  }
  makeShrines() {
    for (const shrine of this.world.shrines) {
      const g = new THREE.Group()
      g.add(nativeModel(shrine.model))
      this.locate(g, shrine)
      this.orientModel(g, shrine.angle)
      this.objects.add(g)
      g.userData.shrine = shrine.id
      this.shrineMeshes.set(shrine.id, { g })
    }
  }
  pick(event: { clientX: number; clientY: number }): Point | null {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      1 - ((event.clientY - rect.top) / rect.height) * 2
    )
    return this.view.pick(this.mouse, [this.terrain], this.camera)?.point ?? null
  }
  pickWorldObject(event: PointerEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      1 - ((event.clientY - rect.top) / rect.height) * 2
    )
    const hit = this.view.pick(
      this.mouse,
      [...this.buildingMeshes.values(), ...[...this.shrineMeshes.values()].map(s => s.g)],
      this.camera
    )
    let object = hit?.object
    while (
      object?.parent &&
      object.userData.building === undefined &&
      object.userData.shrine === undefined
    )
      object = object.parent
    const id = object?.userData.building ?? object?.userData.shrine
    return (
      this.world.buildings.find(b => b.id === id) ??
      this.world.shrines.find(s => s.id === id) ??
      null
    )
  }
  pointerDown = ((event: PointerEvent) => {
    this.down = { x: event.clientX, y: event.clientY, button: event.button }
    this.dragLast = { x: event.clientX, y: event.clientY }
    this.renderer.domElement.setPointerCapture(event.pointerId)
  }) as EventListener
  pointerMove = ((event: PointerEvent) => {
    this.pointerScreen = { clientX: event.clientX, clientY: event.clientY }
    if (
      !this.world.inputMask &&
      !this.overviewActive &&
      (event.buttons === 2 || event.buttons === 4)
    ) {
      const dx = event.clientX - this.dragLast.x,
        dy = event.clientY - this.dragLast.y
      if (event.buttons === 2) {
        this.cameraBearing += dx * 0.008
        this.pan(0, dy * 0.06)
      } else this.pan(-dx * 0.06, -dy * 0.06)
      this.dragLast = { x: event.clientX, y: event.clientY }
      this.updateView()
    }
    this.hoveredObject =
      !event.buttons && !this.world.mode && !this.world.inputMask
        ? (this.pickWorldObject(event)?.id ?? null)
        : null
    if (event.buttons === 1 && event.pointerType !== 'touch' && !this.world.mode) {
      const rect = this.container.getBoundingClientRect()
      Object.assign(this.dragBox.style, {
        display: 'block',
        left: `${Math.min(this.down.x, event.clientX) - rect.left}px`,
        top: `${Math.min(this.down.y, event.clientY) - rect.top}px`,
        width: `${Math.abs(event.clientX - this.down.x)}px`,
        height: `${Math.abs(event.clientY - this.down.y)}px`,
      })
    }
  }) as EventListener
  pointerUp = ((event: PointerEvent) => {
    if (this.world.inputMask) return
    this.dragBox.style.display = 'none'
    const moved = Math.hypot(event.clientX - this.down.x, event.clientY - this.down.y)
    if (moved > 7) {
      if (event.button === 0 && event.pointerType !== 'touch' && !this.world.mode) {
        const rect = this.renderer.domElement.getBoundingClientRect()
        const ids = this.world.units
          .filter(u => {
            if (u.team !== 'blue') return false
            const p = this.screen(u, this.y(u) + 1)
            const x = ((p.x + 1) / 2) * rect.width + rect.left,
              y = ((-p.y + 1) / 2) * rect.height + rect.top
            return (
              x >= Math.min(this.down.x, event.clientX) &&
              x <= Math.max(this.down.x, event.clientX) &&
              y >= Math.min(this.down.y, event.clientY) &&
              y <= Math.max(this.down.y, event.clientY)
            )
          })
          .map(u => u.id)
        this.world.selected = event.shiftKey ? [...new Set([...this.world.selected, ...ids])] : ids
        this.onChange()
      }
      return
    }
    let p = this.pick(event)
    if (!p) return
    if (!this.world.mode) {
      const object = this.pickWorldObject(event)
      if (object) p = { x: object.x, z: object.z }
    }
    if (event.button === 2) {
      this.world.mode = null
      command(this.world, p)
      this.orderSound()
    } else if (this.world.mode) {
      const mode = this.world.mode
      const ok = SPELLS.some(s => s.id === mode)
        ? cast(this.world, mode as Parameters<typeof cast>[1], p)
        : placeBuilding(this.world, mode as Parameters<typeof placeBuilding>[1], p)
      if (!ok) this.onSound(0x25)
      else if (!SPELLS.some(s => s.id === mode)) this.onSound(0x24)
    } else {
      // Sprite dimensions are screen pixels in the native renderer.
      const rect = this.renderer.domElement.getBoundingClientRect(),
        x = event.clientX - rect.left,
        y = event.clientY - rect.top
      const picked =
        this.world.units
          .filter(u => u.team === 'blue' && u.inside === null && this.visible(u))
          .find(u => {
            const body = this.unitMeshes.get(u.id)?.userData.sprite as THREE.Sprite | undefined
            if (!body) return false
            const q = this.screen(u),
              px = ((q.x + 1) * rect.width) / 2,
              py = ((1 - q.y) * rect.height) / 2
            return (
              x >= px - body.center.x * body.scale.x &&
              x <= px + (1 - body.center.x) * body.scale.x &&
              y >= py - (1 - body.center.y) * body.scale.y &&
              y <= py + body.center.y * body.scale.y
            )
          }) ??
        this.world.units
          .filter(u => u.team === 'blue' && u.inside === null && distance(u, p) < 2.1)
          .sort((a, b) => distance(a, p) - distance(b, p))[0]
      if (picked) {
        this.world.selected = event.shiftKey
          ? this.world.selected.includes(picked.id)
            ? this.world.selected.filter(id => id !== picked.id)
            : [...this.world.selected, picked.id]
          : [picked.id]
        this.onSound(picked.kind === 'shaman' ? 0x18 : picked.kind === 'warrior' ? 0x43 : 0x58)
      } else if (this.world.selected.length) {
        command(this.world, p)
        this.orderSound()
      }
    }
    this.onChange()
  }) as EventListener
  keyDown = ((event: KeyboardEvent) => {
    if (this.world.inputMask) return
    if (
      (event.target as HTMLElement).closest('button,input,dialog,a') ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    )
      return
    this.keys.add(event.key.toLowerCase())
    if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key))
      event.preventDefault()
  }) as EventListener
  orientCamera() {
    if (this.overviewActive) {
      this.camera.lookAt(this.controls.target)
      this.camera.updateMatrixWorld()
    }
    this.updateView()
  }
  pan(x: number, z: number) {
    const a = this.cameraBearing
    this.viewPoint = {
      x: this.viewPoint.x + x * Math.cos(a) + z * Math.sin(a),
      z: this.viewPoint.z + z * Math.cos(a) - x * Math.sin(a),
    }
    for (const key of ['x', 'z'] as const)
      this.viewPoint[key] = ((((this.viewPoint[key] + 128) % 256) + 256) % 256) - 128
  }
  skipIntroduction() {
    interruptFlyby(this.world.flyby, this.flybyCamera)
    if (!(this.world.flyby.flags & 1)) this.world.inputMask &= ~64
    this.onChange()
  }
  updateResultCamera(dt: number) {
    const w = this.world,
      s = this.resultCamera,
      motion = this.resultMotion
    if (this.resultRequest !== w.outcome.cameraRequest) {
      this.resultRequest = w.outcome.cameraRequest
      if (!s.active)
        this.resultView = {
          ...nativePosition(w, this.viewPoint),
          angle: Math.round((this.cameraBearing * 1024) / Math.PI) & 2047,
        }
      // ponytail: first-mission tribe origins and no replay file mode; the
      // shared native tribe/camera store replaces this presentation adapter.
      beginResultCamera(
        s,
        w.manaWorld.gameFlags,
        0,
        this.resultView,
        nativePosition(w, w.outcome.cameraTribe === 0 ? HOME : ENEMY)
      )
    }
    const active = !!(s.active || motion.active)
    // Use the existing 24 Hz presentation convention until draw_main's frame
    // throttling and its shared camera/flyby ordering are fully integrated.
    if (!w.paused) {
      this.resultTime += dt
      while (this.resultTime >= 1 / 24) {
        const context = { skyCounter: w.outcome.skyCounter, newTurn: this.resultTurn !== w.turn }
        this.resultTurn = w.turn
        stepResultCamera(s, motion, this.resultView, context, {
          lock: () => {
            w.inputMask |= 4
            this.keys.clear()
          },
          unlock: () => {
            w.inputMask &= ~4
          },
          clearInteraction: () => {
            if (w.flyby.flags & 1) {
              w.flyby.flags &= ~1
              this.flybyCamera.zoom = 0
              this.viewZoom = 0
              w.inputMask &= ~64
              this.wasFlying = false
            }
            w.mode = null
            this.tooltip.draw = 0
          },
          sound: () => sound(w, 0xa2, browserPosition(this.resultView)),
        })
        w.outcome.skyCounter = context.skyCounter
        stepCameraMotion(motion, this.resultView, this.overviewActive ? 2 : 0, {
          rotate: () => {},
          globe: () => {},
        })
        this.resultTime -= 1 / 24
      }
    }
    w.outcome.cameraPlaying = !!s.active
    if (active) {
      this.overviewActive = false
      this.controls.enabled = false
      this.viewPoint = browserPosition(this.resultView)
      this.cameraBearing = (this.resultView.angle * Math.PI) / 1024
      this.updateView()
    }
    return active
  }
  updateFlyby(dt: number) {
    const state = this.world.flyby,
      active = !!(state.flags & 1)
    this.controls.enabled = this.overviewActive && !this.world.inputMask
    if (active && !this.wasFlying) {
      this.flybyCamera = {
        x: Math.round((this.viewPoint.x + 8) * 256),
        y: Math.round((-this.viewPoint.z - 8) * 256),
        angle: 0,
        zoom: 0,
      }
      this.flybyTime = 0
      this.keys.clear()
    }
    // ponytail: a 24 Hz presentation clock drives the recovered native timeline;
    // original frame throttling remains unported.
    if (!this.world.paused) {
      this.flybyTime += dt
      while (this.flybyTime >= 1 / 24) {
        for (const event of stepFlyby(state, this.flybyCamera, 24)) {
          if (event.kind === 5)
            showObjectTooltip(
              this.tooltip,
              forcedTooltipObject(this.world, event.flags, event.value),
              event.duration
            )
        }
        // Native render_land_ui consumes the request before the next frame.
        this.tooltip.draw = 0
        stepTooltip(this.tooltip, !!worldTooltipObject(this.world, this.tooltip.target), 24)
        this.flybyTime -= 1 / 24
      }
    }
    if (!active && !this.wasFlying) return false
    const c = this.flybyCamera
    const p = { x: c.x / 256 - 8, z: -c.y / 256 - 8 }
    this.overviewActive = false
    this.cameraBearing = (c.angle * Math.PI) / 1024
    this.viewZoom = c.zoom
    this.viewPoint = p
    this.updateView()
    this.wasFlying = !!(state.flags & 1)
    if (!this.wasFlying) {
      this.world.inputMask &= ~64
      this.camera.up.set(0, 0, -1)
      this.controls.enabled = this.overviewActive && !this.world.inputMask
    }
    return true
  }
  renderTooltip() {
    let state = this.tooltip
    if (!state.draw && this.hoveredObject !== null) {
      // ponytail: hover uses native names but immediate browser hit testing;
      // connect the original hover delay/ownership when its controller is ported.
      state = createTooltip()
      showObjectTooltip(state, worldTooltipObject(this.world, this.hoveredObject), 1)
      state.draw = 1
    }
    const object = worldTooltipObject(this.world, state.target),
      element = this.tooltipElement
    element.hidden = !state.draw || !state.text || !object
    if (element.hidden || !object) return
    const p = this.screen(object, this.y(object) + (object.type === 1 ? 128 : 512) / 45)
    if (!this.visible(object)) {
      element.hidden = true
      return
    }
    element.textContent = state.text
    const { width, height } = this.container.getBoundingClientRect()
    element.style.left = `${Math.max(4, Math.min(width - element.offsetWidth - 4, ((p.x + 1) * width) / 2))}px`
    element.style.top = `${Math.max(4, Math.min(height - element.offsetHeight - 4, ((1 - p.y) * height) / 2))}px`
  }
  focus(p: Point = HOME) {
    this.overviewActive = false
    this.controls.enabled = false
    this.cameraBearing = 0
    this.viewZoom = 0
    this.viewPoint = { ...p }
    this.updateView()
  }
  overview() {
    this.overviewActive = true
    this.controls.enabled = !this.world.inputMask
    this.camera.position.set(30, 155, 0)
    this.controls.update()
    this.orientCamera()
  }
  zoom(amount: number) {
    if (this.overviewActive) {
      const offset = this.camera.position
        .clone()
        .sub(this.controls.target)
        .multiplyScalar(amount)
        .clampLength(PLANET_RADIUS + 14, PLANET_RADIUS + 190)
      this.camera.position.copy(this.controls.target).add(offset)
      this.controls.update()
    } else this.viewZoom = Math.max(-16384, Math.min(16384, this.viewZoom + (amount - 1) * 32768))
    this.updateView()
  }
  animatePerson(
    body: THREE.Sprite,
    g: THREE.Group,
    heading: number,
    directions: { frames: number[]; flip: boolean }[],
    age: number,
    once = false,
    frameNumber?: number
  ) {
    const direction = spriteDirection(
      Math.round((this.cameraBearing * 1024) / Math.PI),
      Math.round(((Math.PI - heading) * 1024) / Math.PI)
    )
    const cycle = directions[direction],
      step = frameNumber ?? Math.floor(age * nativeUnits.fps),
      index =
        cycle.frames[once ? Math.min(step, cycle.frames.length - 1) : step % cycle.frames.length],
      cell = nativeUnits.cell
    const frame = nativeUnits.frames[index],
      map = body.material.map!
    g.userData.frame = index
    map.repeat.set(
      (cycle.flip ? -frame.w : frame.w) / nativeUnits.width,
      frame.h / nativeUnits.height
    )
    map.offset.set(
      ((index % nativeUnits.columns) * cell + (cycle.flip ? frame.w : 0)) / nativeUnits.width,
      1 - (Math.floor(index / nativeUnits.columns) * cell + frame.h) / nativeUnits.height
    )
    body.center.set(cycle.flip ? 1 + frame.x / frame.w : -frame.x / frame.w, 1 + frame.y / frame.h)
    const shaman = g.userData.signature?.endsWith('shaman') || g.userData.shaman,
      flags = this.view.config.scaledSprites ? 0x100 : 0
    const size = (n: number) =>
      shaman || flags ? spriteCoordinate(n, shaman ? -1 : 1, flags, this.view.config) : n
    body.scale.set(Math.max(1, size(frame.w)), Math.max(1, size(frame.h)), 1)
    const arrow = g.userData.selection as THREE.Sprite | undefined
    if (arrow) {
      // Selection ownership currently comes from the browser command list.
      const r = selectionArrow(
        {
          owner: g.userData.owner,
          player: 0,
          type: 1,
          selectionFlags: this.world.selected.includes(g.userData.unit) ? 128 : 0,
          x: 0,
          y: 0,
          frameHeight: size(frame.nativeHeight),
          scaled: !!(shaman || flags),
          bucket: shaman ? -1 : 1,
          flags,
        },
        this.view.config
      )
      arrow.visible = !!r && r.width > 0 && r.height > 0
      if (r && arrow.visible) {
        arrow.scale.set(r.width, r.height, 1)
        arrow.center.set(-r.x / r.width, 1 + r.y / r.height)
      }
    }
    body.material.rotation = 0
  }
  makeFx(f: Effect) {
    const g = new THREE.Group()
    this.locate(g, f, f.height)
    if (f.unit) {
      const map = texture('units').clone(),
        sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({ map, alphaTest: 0.5, toneMapped: false })
        )
      sprite.center.set(0.5, 0.25)
      sprite.scale.setScalar(nativeUnits.cell)
      g.add(sprite)
      g.userData.sprite = sprite
      g.userData.shaman = f.unit.kind === 'shaman'
      return g
    }
    const sequence =
      f.sprite?.sequence ??
      (f.kind === 'blast'
        ? 'impact'
        : f.kind === 'death'
          ? 'smoke'
          : f.kind === 'bridge'
            ? 'sparkle'
            : f.kind)
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: texture('effects').clone(),
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      })
    )
    sprite.center.set(0.5, 0)
    g.add(sprite)
    g.userData.sprite = sprite
    g.userData.sequence = sequence
    if (f.kind === 'lightning') {
      const bolt = new THREE.Mesh(
        new THREE.BufferGeometry(),
        new THREE.ShaderMaterial({
          uniforms: { map: { value: texture('lightning-bolt') } },
          transparent: true,
          depthTest: false,
          depthWrite: false,
          side: THREE.DoubleSide,
          vertexShader:
            'attribute float opacity; varying float a; varying vec2 tex; void main(){a=opacity;tex=uv;gl_Position=vec4(position,1.);}',
          fragmentShader:
            'uniform sampler2D map; varying float a; varying vec2 tex; void main(){gl_FragColor=texture2D(map,tex)*vec4(1.,1.,1.,a);}',
        })
      )
      bolt.userData.nativeIgnore = true
      bolt.frustumCulled = false
      bolt.renderOrder = 900
      g.add(bolt)
      g.userData.bolt = bolt
    }
    return g
  }
  animateFx(g: THREE.Group, f: Effect) {
    const sprite = g.userData.sprite as THREE.Sprite
    if (f.lightning) this.animateLightning(g.userData.bolt, f.lightning)
    sprite.visible = f.animation?.object !== 0x650 && !(f.animation && f.animation.renderFlags & 16)
    if (!sprite.visible) return
    if (f.unit) {
      const animations = (
        nativeUnits.animations as Record<
          string,
          Record<string, { frames: number[]; flip: boolean }[]>
        >
      )[`${f.unit.team}-${f.unit.kind}`]
      this.animatePerson(sprite, g, f.unit.heading, animations.die, f.age, true)
      sprite.material.opacity = Math.min(1, (f.duration - f.age) * 3)
      return
    }
    const sequence = (
      nativeEffects.animations as Record<
        string,
        { index: number; w: number; h: number; source: number }[]
      >
    )[g.userData.sequence]
    const index = f.animation
      ? f.animation.object - sequence[0].source + ((f.animation.f1 & 65535) >>> 2)
      : f.sprite?.sequence === 'blastShot'
        ? f.sprite.frame
        : Math.floor(f.age * 12)
    const frame = sequence[Math.min(sequence.length - 1, index)]
    effectFrame(sprite, frame)
    sprite.material.opacity = f.animation ? 1 : Math.min(1, (f.duration - f.age) * 5)
    if (f.animation) sprite.center.set(Math.floor(frame.w / 2) / frame.w, 0)
  }
  animateLightning(mesh: THREE.Mesh, b: Lightning) {
    mesh.visible = !!b.segments.length
    if (!mesh.visible) return
    const positions: number[] = [],
      uv: number[] = [],
      opacity: number[] = [],
      width = this.container.clientWidth,
      height = this.container.clientHeight
    const screen = (p: { x: number; y: number; h: number }) => {
      const point = browserPosition(p),
        q = this.view.project(point, p.h / 45)
      let x = q.screenX,
        y = q.screenY
      if (this.overviewActive) {
        const clip = this.view.screen(new THREE.Vector3(point.x, p.h / 128, point.z), this.camera)
        x = ((clip.x + 1) * width) / 2
        y = ((1 - clip.y) * height) / 2
      }
      return { x: (Math.trunc(x) << 16) >> 16, y: (Math.trunc(y) << 16) >> 16, flags: q.flags }
    }
    for (const segment of b.segments) {
      const from = screen(segment.from),
        to = screen(segment.to)
      if (!this.overviewActive && from.flags >>> 0 > 0x80000000) continue
      for (const line of lightningLines(from.x, from.y, to.x, to.y, this.world.cosmeticRandom)) {
        const q = lightningQuad(line)
        for (const i of [0, 1, 2, 0, 2, 3]) {
          positions.push((q[i * 2] * 2) / width - 1, 1 - (q[i * 2 + 1] * 2) / height, 0)
          uv.push(i < 2 ? 0.2 : 0.8, 0.5)
          opacity.push(line.alpha / 255)
        }
      }
    }
    mesh.geometry.dispose()
    mesh.geometry = new THREE.BufferGeometry()
    mesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    mesh.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    mesh.geometry.setAttribute('opacity', new THREE.Float32BufferAttribute(opacity, 1))
  }
  updateSpellHalo(frame: number) {
    const model = SPELLS.find(s => s.id === this.world.mode)?.model ?? this.hoveredSpell
    this.range.userData.model = model
    const shaman = this.world.units.find(u => u.team === 'blue' && u.kind === 'shaman')
    this.range.visible =
      !!shaman &&
      !!model &&
      !(rules.spellCharging[model].flags & 0x8000) &&
      !this.world.inputMask &&
      this.world.status === 'playing'
    if (!shaman || !this.range.visible) return
    const points = spellHalo(
      this.world.land,
      nativePosition(this.world, shaman),
      spellRange(this.world, shaman, model) * 256,
      this.halo,
      frame
    )
    for (const [i, p] of points.entries()) {
      let g = this.range.children[i] as THREE.Group
      if (!g) {
        g = new THREE.Group()
        const body = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: texture('effects').clone(),
            transparent: true,
            depthWrite: false,
            toneMapped: false,
          })
        )
        // Use the palette's encoded RGB values, as with the imported textures.
        body.material.color.setStyle(`rgb(${nativeEffects.haloColor.join(',')})`)
        body.center.set(0.5, 0)
        const shadow = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: texture('effects').clone(),
            alphaTest: 0.5,
            depthWrite: false,
            toneMapped: false,
          })
        )
        g.add(shadow, body)
        this.range.add(g)
      }
      const point = browserPosition(p),
        projected = this.view.project(point, p.h / 45)
      this.locate(g, point, p.h / 45)
      g.visible = this.overviewActive ? this.visible(point, p.h / 45) : !(projected.flags & 0x1e)
      g.userData.halo = p
      const [shadow, body] = g.children as THREE.Sprite[]
      effectFrame(body, nativeEffects.animations.halo[p.frame - 1466])
      effectFrame(shadow, nativeEffects.animations.haloShadow[0])
      const flags = this.view.config.scaledSprites ? 0x100 : 0,
        bucket = haloBucket(projected.z)
      if (flags)
        shadow.scale.set(
          spriteCoordinate(9, bucket, flags, this.view.config),
          spriteCoordinate(2, bucket, flags, this.view.config),
          1
        )
      shadow.visible = shadow.scale.x > 0 && shadow.scale.y > 0
      if (shadow.visible)
        shadow.center.set(Math.trunc(shadow.scale.x / 2) / shadow.scale.x, 2 / shadow.scale.y)
    }
  }
  drawMinimap() {
    const ctx = this.mini.getContext('2d')
    if (!ctx) return
    const s = this.mini.width
    ctx.clearRect(0, 0, s, s)
    ctx.drawImage(this.minimapBackground, 0, 0, s, s)
    const at = (p: Point) => [((p.x + 48) / 96) * s, ((p.z + 48) / 96) * s]
    for (const b of this.world.buildings) {
      ctx.fillStyle = b.team === 'blue' ? '#54bffe' : '#ef8069'
      const [x, z] = at(b)
      ctx.fillRect(x - 2, z - 2, 4, 4)
    }
    for (const u of this.world.units) {
      ctx.fillStyle = u.team === 'blue' ? '#82d5ff' : u.team === 'red' ? '#f78b74' : '#d8d5b3'
      const [x, z] = at(u)
      ctx.beginPath()
      ctx.arc(x, z, u.kind === 'shaman' ? 3 : 1.5, 0, Math.PI * 2)
      ctx.fill()
    }
    for (const shrine of this.world.shrines) {
      const [x, z] = at(shrine)
      ctx.fillStyle = shrine.active ? '#f5cf86' : '#777e6c'
      ctx.beginPath()
      ctx.arc(x, z, 3, 0, Math.PI * 2)
      ctx.fill()
    }
    const [x, z] = at(this.viewPoint)
    ctx.strokeStyle = '#f1e0b599'
    ctx.lineWidth = 1
    const size = this.camera.position.distanceTo(this.controls.target) * 0.5
    ctx.strokeRect(x - size / 2, z - size / 3, size, size * 0.67)
  }
  orderSound() {
    const units = this.world.units.filter(u => this.world.selected.includes(u.id))
    if (units.length) this.onSound(units.some(u => u.kind === 'shaman') ? 0x19 : 0x37)
  }
  playWorldSounds() {
    for (const event of this.world.sounds)
      if (event.serial > this.soundSerial) {
        this.soundSerial = event.serial
        if (event.cue === 0xe3 || event.cue === 0xa2) {
          this.onSound(event.cue, 1, 0)
          continue
        } // Native notification and defeat-sky cues are not positional.
        const dx = Math.round((event.x - this.viewPoint.x) * 256),
          dz = Math.round((event.z - this.viewPoint.z) * 256)
        const screen = this.screen(event)
        // Native distance curve and projected pan; the full native mixer is still unported.
        this.onSound(event.cue, soundAttenuation(dx * dx + dz * dz), screen.x)
      }
  }
  animate = (now: number) => {
    const skyTicks = Math.min(
      0x1000000,
      Math.imul(Math.floor(now) - Math.floor(this.previous || now), 64) >>> 0
    )
    const dt = Math.min(0.1, (now - (this.previous || now)) / 1000)
    this.previous = now
    tick(this.world, dt * this.world.speed)
    this.playWorldSounds()
    if (this.terrainVersion !== this.world.landVersion) {
      this.rebuildTerrain()
      this.releaseGroup(this.decorations)
      this.decorations.clear()
      this.makeDecorations()
    }
    this.updateTerrainTexture()
    const trees = this.world.trees.map(t => (t.logs >= 1 ? '1' : '0')).join('')
    if (trees !== this.treeSignature) {
      this.treeSignature = trees
      this.releaseGroup(this.decorations)
      this.decorations.clear()
      this.makeDecorations()
    }
    const movingX =
      Number(this.keys.has('d') || this.keys.has('arrowright')) -
      Number(this.keys.has('a') || this.keys.has('arrowleft'))
    const movingZ =
      Number(this.keys.has('s') || this.keys.has('arrowdown')) -
      Number(this.keys.has('w') || this.keys.has('arrowup'))
    if (!this.world.inputMask && !this.overviewActive) {
      this.pan(movingX * dt * 20, movingZ * dt * 20)
      this.cameraBearing += (Number(this.keys.has('e')) - Number(this.keys.has('q'))) * dt
    }
    if (!this.updateResultCamera(dt) && !this.updateFlyby(dt)) {
      if (this.overviewActive) this.controls.update()
      this.orientCamera()
    }
    this.renderTooltip()
    for (const [id, g] of this.unitMeshes)
      if (!this.world.units.some(u => u.id === id)) {
        this.objects.remove(g)
        this.releaseGroup(g)
        this.unitMeshes.delete(id)
      }
    for (const u of this.world.units) {
      let g = this.unitMeshes.get(u.id)
      if (g && g.userData.signature !== `${u.team}-${u.kind}`) {
        this.objects.remove(g)
        this.releaseGroup(g)
        this.unitMeshes.delete(u.id)
        g = undefined
      }
      if (!g) {
        g = makeUnit(u)
        this.unitMeshes.set(u.id, g)
        this.objects.add(g)
      }
      this.locate(g, u)
      g.position.y += ((0.04 + Math.sin(u.lift * Math.PI) * 2) * 45) / 128
      g.visible = u.inside === null
      const body = g.userData.sprite as THREE.Sprite
      const animations = (
        nativeUnits.animations as Record<
          string,
          Record<string, { frames: number[]; flip: boolean }[]>
        >
      )[g.userData.signature]
      const state = unitAnimation(this.world, u)
      if (g.userData.state !== state) {
        g.userData.state = state
        g.userData.since = this.world.time
      }
      if (u.native) {
        const source = u.native.object + (u.team === 'red' && u.kind === 'shaman' ? 8 : 0)
        const directions = Object.values(animations).find(
          d => 'source' in d[0] && d[0].source === source
        )
        if (!directions)
          throw new Error(`Unimported follower animation ${g.userData.signature}/${source}`)
        this.animatePerson(body, g, u.heading, directions, 0, false, u.native.f2)
      } else
        this.animatePerson(
          body,
          g,
          u.heading,
          animations[state] ?? animations.idle,
          this.world.time - (u.fight ? u.fight.started / 12 : g.userData.since),
          !!u.fight && ['attack', 'strike', 'special', 'recoil'].includes(u.fight.action)
        )
      g.userData.health.visible = u.hp < maxHp(u.kind) || this.world.selected.includes(u.id)
      g.userData.health.quaternion.copy(
        g.quaternion.clone().invert().multiply(this.camera.quaternion)
      )
      g.userData.healthFill.scale.x = Math.max(0.001, u.hp / maxHp(u.kind))
    }
    for (const [id, g] of this.buildingMeshes)
      if (!this.world.buildings.some(b => b.id === id)) {
        this.objects.remove(g)
        this.releaseGroup(g)
        this.buildingMeshes.delete(id)
      }
    for (const b of this.world.buildings) {
      const stage = buildingStage(b)
      let g = this.buildingMeshes.get(b.id)
      if (g && g.userData.signature !== `${b.level}-${stage}`) {
        this.objects.remove(g)
        this.releaseGroup(g)
        this.buildingMeshes.delete(b.id)
        g = undefined
      }
      if (!g) {
        g = makeBuilding(b, stage)
        this.buildingMeshes.set(b.id, g)
        this.objects.add(g)
        if (b.progress < 1) {
          this.releaseGroup(this.decorations)
          this.decorations.clear()
          this.makeDecorations()
        }
      }
      this.locate(g, b, b.foundation)
      this.orientModel(g, b.angle)
      g.userData.health.visible = b.hp < buildingHp(b.kind) || b.progress < 1
      g.userData.health.quaternion.copy(
        g.quaternion.clone().invert().multiply(this.camera.quaternion)
      )
      g.userData.healthFill.scale.x =
        b.progress < 1 ? Math.max(0.01, b.progress) : Math.max(0.001, b.hp / buildingHp(b.kind))
    }
    for (const [id, g] of this.fxMeshes)
      if (!this.world.effects.some(f => f.id === id)) {
        this.scene.remove(g)
        this.releaseGroup(g)
        this.fxMeshes.delete(id)
      }
    for (const f of this.world.effects) {
      let g = this.fxMeshes.get(f.id)
      if (!g) {
        g = this.makeFx(f)
        this.fxMeshes.set(f.id, g)
        this.scene.add(g)
      }
      this.locate(g, f, f.height)
      this.animateFx(g, f)
    }
    for (const [id, entry] of this.shrineMeshes)
      if (!this.world.shrines.some(s => s.id === id)) {
        this.objects.remove(entry.g)
        this.releaseGroup(entry.g)
        this.shrineMeshes.delete(id)
      }
    for (const shrine of this.world.shrines) {
      const entry = this.shrineMeshes.get(shrine.id)!
      this.locate(entry.g, shrine)
      this.orientModel(entry.g, shrine.angle)
      let mesh = entry.g.children[0] as THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>
      if (mesh.userData.nativeModel !== shrine.model) {
        entry.g.remove(mesh)
        if (mesh.userData.morph) mesh.geometry.dispose()
        mesh.material.dispose()
        mesh = nativeModel(shrine.model)
        entry.g.add(mesh)
      }
      if (shrine.morph) {
        const morph = shrine.morph,
          frame = Math.min(morph.duration, Math.max(0, this.world.turn - morph.started + 1))
        if (!mesh.userData.morph) {
          mesh.geometry = mesh.geometry.clone()
          mesh.userData.morph = true
        }
        if (mesh.userData.morphFrame !== frame || mesh.userData.morphStart !== morph.started) {
          const from = nativeModels[morph.from],
            to = nativeModels[morph.to]
          const position = mesh.geometry.getAttribute('position') as THREE.BufferAttribute,
            scale = from.scale * 3
          for (let i = 0; i < position.array.length; i++)
            position.array[i] =
              morphCoordinate(
                Math.round(from.p[i] * scale),
                Math.round(to.p[i] * scale),
                frame,
                morph.duration
              ) / scale
          position.needsUpdate = true
          mesh.geometry.computeBoundingSphere()
          mesh.userData.morphFrame = frame
          mesh.userData.morphStart = morph.started
        }
      }
      entry.g.visible = shrine.active || shrine.kind === 'vault'
    }
    const spec = SPELLS.find(s => s.id === this.world.mode)
    // Original geometry advances per draw; its animation clock is still a
    // browser 12 Hz presentation clock until native timer ownership is ported.
    this.updateSpellHalo(Math.floor((now * 12) / 1000))
    // Picking projects the entire terrain; repeat when the pointer/view changes.
    const pointerState = [
      this.world.mode,
      this.pointerScreen?.clientX,
      this.pointerScreen?.clientY,
      this.world.landVersion,
      this.viewPoint.x,
      this.viewPoint.z,
      this.cameraBearing,
      this.viewZoom,
      this.overviewActive,
      ...this.camera.position.toArray(),
      this.container.clientWidth,
      this.container.clientHeight,
    ].join(',')
    if (pointerState !== this.pointerState) {
      this.pointer = this.pointerScreen && this.world.mode ? this.pick(this.pointerScreen) : null
      this.pointerState = pointerState
    }
    this.updatePlacement()
    this.spellPointer.hidden =
      !spec || !this.pointerScreen || !!this.world.inputMask || this.world.status !== 'playing'
    if (spec && this.pointerScreen && !this.spellPointer.hidden) {
      const rect = this.container.getBoundingClientRect()
      this.spellPointer.style.left = `${this.pointerScreen.clientX - rect.left}px`
      this.spellPointer.style.top = `${this.pointerScreen.clientY - rect.top}px`
      // Native outer-turn ownership and full player records remain adapters.
      const draws = spellCursor(
        spec.model,
        this.world.turn,
        this.pointer ? (spellTargetError(this.world, spec.id, this.pointer)?.code ?? 1) : -1,
        this.world.shots[spec.id] > 0 ? 3 : 0,
        !!this.pointer,
        this.world.manaWorld.gameFlags
      )
      Array.from(this.spellPointer.children).forEach((child, i) => {
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
    this.terrain.count = this.overviewActive ? 1 : 9
    this.updateWater()
    if (this.skyDome) this.skyDome.visible = this.overviewActive
    this.updateSky(skyTicks)
    // ponytail: initial mission palette; connect live system-palette changes
    // when the original palette scheduler is integrated.
    const sky = defeatSky(
      this.world.outcome.skyCounter,
      this.world.outcome.lastDefeated,
      skyPalette.colors,
      {
        x: 0,
        y: 0,
        width: this.container.clientWidth,
        screenWidth: this.container.clientWidth,
        surfaceOffset: this.container.clientWidth * this.container.clientHeight,
      }
    )
    this.skyFlash.visible = !!sky
    if (sky)
      this.skyFlash.material.uniforms.rgba.value.set(
        ((sky.color >>> 16) & 255) / 255,
        ((sky.color >>> 8) & 255) / 255,
        (sky.color & 255) / 255,
        (sky.color >>> 24) / 255
      )
    this.view.prepare(this.scene)
    this.renderer.render(this.scene, this.camera)
    if (!this.world.paused) {
      this.personAnimationTime += dt
      while (this.personAnimationTime >= 1 / 24) {
        animateLiveObjects(this.world)
        this.personAnimationTime -= 1 / 24
      }
    }
    this.uiTimer += dt
    if (this.uiTimer > 0.2) {
      this.onChange()
      this.drawMinimap()
      this.uiTimer = 0
    }
    this.frame = requestAnimationFrame(this.animate)
  }
  releaseGroup(g: THREE.Object3D) {
    const materials = new Set<THREE.Material>()
    g.traverse(o => {
      if (o instanceof THREE.Sprite) {
        o.material.map?.dispose()
        materials.add(o.material)
      }
      if (o instanceof THREE.Mesh || o instanceof THREE.Line) {
        if (![...meshes.values()].includes(o.geometry)) o.geometry.dispose()
        ;(Array.isArray(o.material) ? o.material : [o.material]).forEach(m => materials.add(m))
      }
    })
    materials.forEach(m => m.dispose())
  }
  dispose() {
    cancelAnimationFrame(this.frame)
    this.terrainLoad.abort()
    this.resize.disconnect()
    this.disposeListeners.forEach(f => f())
    this.controls.dispose()
    this.releaseGroup(this.scene)
    this.waterMap.dispose()
    this.terrainMap.dispose()
    this.view.dispose()
    this.renderer.dispose()
    this.renderer.domElement.remove()
    this.dragBox.remove()
    this.tooltipElement.remove()
    this.spellPointer.remove()
  }
}
