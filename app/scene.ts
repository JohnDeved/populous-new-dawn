import {
  nativeModels,
  material,
  texture,
  loadTexture,
  effectFrame,
  nativeModel,
  updateModelLighting,
  geometry,
  box,
  part,
  releaseGroup,
} from './scene-assets.ts'
import { pointerBrackets } from './world-picking.ts'
import pointerPalette from './original-pointer.json' with { type: 'json' }
import { commandMarkerPoint } from './command-context.ts'
import { ScenePicking } from './scene-picking.ts'
import { focusHudPerson } from './hud-selection.ts'
import { ObjectPanels } from './object-panels.ts'
import { unitHealthGauge } from './unit-health.ts'
import { terrainTiles } from './terrain-visibility.ts'
import { populationMeter } from './hud-population.ts'
import { renderBuildingPanels } from './building-panels.ts'
import { MinimapRenderer } from './minimap-renderer.ts'
import { minimapPick } from './minimap.ts'
import { drawTooltip } from './tooltip-layout.ts'
import { drawPortrait, portraitBackground } from './hud-portrait.ts'
import { advanceGame } from './game-clock.ts'
import { FpsGraph } from './fps-graph.ts'
import { UnitMotion, interpolateUnitPosition } from './unit-motion.ts'
import { ProjectileMotion } from './projectile-motion.ts'
import { reincarnationStones } from './reincarnation.ts'
import { debrisVertices } from './building-debris.ts'
import { fireUV, fireHeading } from './scenery-fire.ts'
import { timberScale } from './timber.ts'
import { soundAttenuation } from './audio'
import type { SoundEnvironment } from './ambient-sound.ts'
import { stepFlyby, interruptFlyby, type FlybyCamera } from './flyby.ts'
import {
  cameraCommand,
  cameraEdgeButtons,
  mergeCameraInput,
  dragCamera,
  stepCameraInput,
} from './camera-input.ts'
import {
  createCameraMotion,
  requestCameraFocus,
  createResultCamera,
  beginResultCamera,
  stepResultCamera,
  stepCameraMotion,
  interpolateCamera,
} from './camera-motion.ts'
import { defeatSky, createSkyMotion, updateSkyArray, fillSkyArray, skyCloudLayer } from './sky.ts'
import { advanceSkyMotion } from './sky-motion.ts'
import {
  readTerrainTextures,
  terrainAtlas,
  updateFootprintTiles,
  terrainTextureBounds,
  type TerrainTextures,
} from './terrain-texture.ts'
import { waterTexture, waterPoint, waterCell } from './water.ts'
import { terrainPointHeight } from './native-terrain.ts'
import { modelLighting, modelHighlight, modelWaveOffsets } from './model-lighting.ts'
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
import {
  buildingObject,
  buildingPlanPose,
  buildingPose,
  buildingStage,
  nativePosition,
  browserPosition,
  sound,
  HOME,
  ENEMY,
  placementError,
  walkable,
  distance,
  maxHp,
  buildingHp,
  cast,
  command,
  effect,
  cancelInteraction,
  selectUnit,
  selectArea,
  selectFollowers,
  hudPeople,
  placeBuilding,
  spellRange,
  spellTargetError,
  SPELLS,
  TURNS_PER_SECOND,
  type World,
  type Point,
  type Tree,
  type Unit,
  type Building,
  type Effect,
  type Gift,
  unitAnimation,
  unitAnimationSource,
  canOrder,
  canPickUnit,
  unitInvisibleToPlayer,
  unitInvisibilityRenderFlag,
  isShaman,
} from './model'

import nativeModelData from './original-models.json'
import { modelDepthBias, modelStage, modelTextureModes, type NativeModel } from './model-faces.ts'
import { morphCoordinate } from './morph.ts'
import {
  vertexLighting,
  spriteDirection,
  spriteCoordinate,
  spriteBucket,
  spriteShadow,
  selectionArrow,
  scaledEffectSize,
  cameraPreset,
  cameraConfigIndex,
  type CameraConfig,
} from './projection.ts'
import {
  zoomPreset,
  viewTransitionFrames,
  stepViewTransition,
  beginGlobeMorph,
  stepGlobeMorph,
  type GlobeMorph,
} from './camera-view.ts'
import { RenderView } from './render-view.ts'
import {
  dragEndpoint,
  dragCommand,
  dragCorners,
  unwrapDragCorners,
  dragMoved,
} from './drag-selection.ts'
import { SelectionOverlay } from './drag-overlay.ts'
import { nativeAngle, positionDistance } from './native-math.ts'
import { GlobeRenderer } from './globe-renderer.ts'
import { beginGlobeDrag, stepGlobeMotion, type GlobeMotion } from './globe.ts'
import nativeUnits from './original-units.json'
import { spriteLayers } from './sprite-layers.ts'
import nativeEffects from './original-effects.json'
import nativeHud from './original-hud.json'
import { spellCursor } from './spell-casting.ts'
import { spellHalo, haloBucket } from './spell-halo.ts'
import { buildingPlanCells, type BuildingShapePose } from './building-shapes.ts'
import { groundOverlay, groundOverlayTriangles } from './ground-overlay.ts'
import { lightningLines, lineQuad, lightningTexture, type Lightning } from './lightning.ts'
import rules from './original-rules.json'
import { makeFx, animateFx, animateLightning, updateSpellHalo, updateEffectsFrame } from './scene-effects.ts'
import {
  makeShrines,
  animatePerson,
  updateUnitsFrame,
  updateBuildingsFrame,
  updateShrinesFrame,
  updateWaveShake,
} from './scene-entities.ts'
import { rebuildTerrain, updateTerrainTexture, landIndex, updateWater, makeDecorations, updateTerrainFrame, updateDecorationsFrame } from './scene-terrain-runtime.ts'
import { makeSky, commitSky, updateSky, updateView, currentPreset, captureCamera, skipIntroduction, updateCameraMotion, previewCamera, updateFlyby, cancelOverview, focus, stepViewChange, startGroundView, overview, leaveOverview, zoom } from './scene-camera-runtime.ts'

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

export class GameScene {
  world: World
  waveFrames = new WeakMap<object, number>()
  view = new RenderView()
  skyBackdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms: { map: { value: texture('sky') }, height: { value: 1 } },
      vertexShader: `uniform float height; varying vec2 skyUV;
        void main(){skyUV=vec2(uv.x,1.-(1.-uv.y)/max(height,0.000001));gl_Position=vec4(position.xy,1.,1.);}`,
      fragmentShader: `uniform sampler2D map; varying vec2 skyUV;
        void main(){
          float edge=0.5/float(textureSize(map,0).y);
          gl_FragColor=texture2D(map,vec2(skyUV.x,clamp(skyUV.y,edge,1.-edge)));
        }`,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    })
  )
  ground = new THREE.Group()
  globe = new GlobeRenderer()
  space = new THREE.Color(0)
  skyMotion = createSkyMotion()
  skyOwned = createSkyMotion()
  skyRemainder = 0
  skyGrid = new Int32Array(26 * 96 * 2)
  skyLoaded = false
  skyClouds: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>[] = []
  skyFlash = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms: { rgba: { value: new THREE.Vector4() }, height: { value: 1 } },
      vertexShader:
        'uniform float height; void main(){gl_Position=vec4(position.x,1.-(1.-position.y)*height,1.,1.);}',
      fragmentShader: 'uniform vec4 rgba; void main(){gl_FragColor=rgba;}',
      transparent: true,
      depthWrite: false,
      depthTest: true,
      toneMapped: false,
    })
  )
  overviewActive = false
  viewZoom = 0
  viewPreset = 0
  viewTransition: {
    config: CameraConfig
    remaining: number
    angle?: { target: number; increment: number }
  } | null = null
  overviewStage: 'enter' | 'exit' | null = null
  overviewReturn = { preset: 0, bearing: 0 }
  globeMorph: GlobeMorph = {
    value: 0,
    source: 0,
    target: 0,
    increment: 0,
    frame: 0,
    duration: 6,
    active: false,
  }
  dragLast = { x: 0, y: 0 }
  globePointer = { x: 0, y: 0 }
  globeMotion: GlobeMotion = {
    position: { x: 0, y: 0 },
    origin: { x: 0, y: 0 },
    press: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    dragging: false,
  }
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(38, 1, 0.2, 1000)
  renderer: THREE.WebGLRenderer
  terrain: THREE.InstancedMesh
  waves: Uint8Array | null = null
  waterMap = new THREE.DataTexture(new Uint8Array(256 * 256 * 4), 256, 256)
  waterState = ''
  waterScroll = { value: 0 }
  terrainMap = new THREE.DataTexture(new Uint8Array(4096 * 4096 * 4), 4096, 4096)
  terrainTextures: TerrainTextures | null = null
  terrainUpload = new THREE.DataTexture()
  terrainAtlasState: ReturnType<typeof terrainAtlas> | undefined
  terrainLoad = new AbortController()
  terrainMapVersion: number | null = null
  terrainShadows = new Uint8Array(16384)
  unitMeshes = new Map<number, THREE.Group>()
  buildingMeshes = new Map<number, THREE.Group>()
  hoveredObject: number | null = null
  pointerAck = { target: 0, until: 0 }
  pointerSignature = ''
  pointerOutline = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  pointerPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
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
  plans = new Map<number, THREE.Mesh>()
  placementState = ''
  range = new THREE.Group()
  halo = { angle: 0 }
  hoveredSpell = 0
  mouse = new THREE.Vector2()
  pointer: Point | null = null
  pointerScreen: { clientX: number; clientY: number } | null = null
  pointerState = ''
  pointerButtons = 0
  navigationPointer: { x: number; y: number; buttons: number } | null = null
  spellPointer = document.createElement('div')
  viewPoint: Point = HOME
  flybyCamera: FlybyCamera = { x: 17 * 256, y: -41 * 256, angle: 0, zoom: 0 }
  cameraBearing = 0
  flybyTime = 0
  wasFlying = false
  resultCamera = createResultCamera()
  cameraMotion = createCameraMotion()
  cameraVelocity = { turn: 0, forward: 0, side: 0 }
  cameraPosition = { x: 0, y: 0, angle: 0 }
  resultRequest = 0
  cameraTime = 0
  cameraPreviewButtons: number | null = null
  resultTurn = 0
  tooltip = createTooltip()
  tooltipElement = document.createElement('div')
  tooltipCanvas = document.createElement('canvas')
  objectPanels = new ObjectPanels(this)
  picking = new ScenePicking(this)
  hudFocus = Array<number>(8).fill(0)
  buildingPanels = new Map<number, HTMLDivElement>()
  down = { x: 0, y: 0, button: 0, unit: undefined as number | undefined, extend: false }
  drag: { start: { x: number; y: number }; end: { x: number; y: number }; active: boolean } | null =
    null
  selectionOverlay: SelectionOverlay
  dragActive = { value: false }
  keys = new Set<string>()
  resize: ResizeObserver
  frame = 0
  fpsGraph = new URLSearchParams(location.search).has('fps') ? new FpsGraph() : null
  previous: number | null = null
  uiTimer = 0
  unitMotion = new UnitMotion()
  projectileMotion = new ProjectileMotion()
  gameClock = {
    animationTime: 0,
    animationFrame: 0,
    beforeTurn: () => {
      this.unitMotion.beforeTurn(this.world)
      this.projectileMotion.beforeTurn(this.world)
    },
    afterTurn: () => {
      this.unitMotion.afterTurn(this.world)
      this.projectileMotion.afterTurn(this.world)
    },
  }
  terrainVersion = -1
  treeSignature = ''
  onChange: () => void
  onSound: (
    cue: number,
    attenuation?: number,
    pan?: number,
    finished?: () => void
  ) => (() => void) | void
  soundSerial = 0
  ownedSounds = new Map<number, () => void>()
  disposeListeners: (() => void)[] = []
  container: HTMLElement
  mini: HTMLCanvasElement
  portrait: HTMLCanvasElement
  minimap = new MinimapRenderer()

  constructor(
    container: HTMLElement,
    minimap: HTMLCanvasElement,
    portrait: HTMLCanvasElement,
    world: World,
    onChange: () => void,
    onSound: (
      cue: number,
      attenuation?: number,
      pan?: number,
      finished?: () => void
    ) => (() => void) | void
  ) {
    this.container = container
    this.mini = minimap
    this.portrait = portrait
    this.world = world
    this.soundSerial = world.soundSerial
    for (const effect of world.effects) if (effect.fire) effect.fire.soundPlaying = false
    for (const building of world.buildings) if (building.burn) building.burn.soundPlaying = false
    for (const unit of world.units) {
      if (unit.native) unit.native.flags4 &= ~16
      if (unit.flight) unit.flight.flags4 &= ~16
    }
    this.onChange = onChange
    this.onSound = onSound
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    // Upload the shared effects atlas during loading, before the first hit or spell.
    for (const name of ['effects', 'unit-health']) {
      const asset = loadTexture(name)
      void asset.ready.then(loaded => {
        if (loaded && !this.terrainLoad.signal.aborted) this.renderer.initTexture(asset.texture)
      })
    }
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
    this.renderer.domElement.className = 'battlefield'
    container.appendChild(this.renderer.domElement)
    if (this.fpsGraph) container.appendChild(this.fpsGraph.element)
    Object.assign(this.pointerOutline.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      display: 'none',
    })
    this.pointerOutline.setAttribute('aria-hidden', 'true')
    this.pointerOutline.classList.add('native-pointer-brackets')
    this.pointerPath.setAttribute('fill', 'none')
    this.pointerPath.setAttribute('stroke-width', '1')
    this.pointerPath.setAttribute('stroke', `rgb(${pointerPalette.color.join(',')})`)
    this.pointerPath.setAttribute('shape-rendering', 'crispEdges')
    this.pointerOutline.appendChild(this.pointerPath)
    container.appendChild(this.pointerOutline)
    this.tooltipElement.className = 'native-tooltip'
    this.tooltipElement.setAttribute('role', 'tooltip')
    this.tooltipElement.style.backgroundColor = `rgb(${tooltipPalette.background.join(',')})`
    this.tooltipCanvas.setAttribute('aria-hidden', 'true')
    this.tooltipElement.appendChild(this.tooltipCanvas)
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
    this.scene.add(new THREE.HemisphereLight(0xc6d6e3, 0x777258, 2))
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
    this.terrainMap.colorSpace = THREE.NoColorSpace
    this.terrainMap.minFilter = THREE.LinearFilter
    this.terrainMap.magFilter = THREE.LinearFilter
    this.waterMap.colorSpace = THREE.NoColorSpace
    this.waterMap.wrapT = THREE.RepeatWrapping
    this.waterMap.wrapS = THREE.RepeatWrapping
    this.waterMap.minFilter = THREE.LinearFilter
    this.waterMap.magFilter = THREE.LinearFilter
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
        vertexShader: `
          attribute vec2 landUv;
          attribute float surface;
          attribute vec3 light;
          attribute vec3 highlight;
          varying vec2 land, waterUV;
          varying float sea;
          varying vec3 diffuse, specular;
          void main() {
            land = landUv;
            waterUV = vec2(uv.x + 8., -uv.y - 8.) / 16.;
            sea = surface;
            diffuse = light;
            specular = highlight;
            gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
          }`,
        fragmentShader: `
          uniform sampler2D map, waterMap;
          uniform float scroll;
          varying vec2 land, waterUV;
          varying float sea;
          varying vec3 diffuse, specular;
          void main() {
            gl_FragColor = sea > .5 ? texture2D(waterMap, waterUV + scroll) : texture2D(map, land);
            gl_FragColor.rgb = clamp(gl_FragColor.rgb * diffuse + specular, 0., 1.);
          }`,
      }),
      9
    )
    terrainTiles.forEach(([x, z], i) =>
      this.terrain.setMatrixAt(i, new THREE.Matrix4().makeTranslation(x * 256, 0, z * 256))
    )
    this.terrain.userData.nativeRelative = true
    this.terrain.userData.painterGround = true
    this.terrain.userData.terrainGrid = true
    this.selectionOverlay = new SelectionOverlay(texture('atlas'), this.view)
    this.selectionOverlay.material.uniforms.dragActive = this.dragActive
    this.scene.add(this.selectionOverlay)
    this.terrain.receiveShadow = true
    this.terrain.castShadow = true
    this.ground.add(this.terrain, this.objects, this.decorations, this.cursor, this.range)
    this.scene.add(this.ground, this.globe)
    this.cursor.visible = false
    this.range.visible = false
    this.rebuildTerrain()
    this.makeDecorations()
    this.makeShrines()
    this.focus({ x: 2, z: 30 })
    this.drawMinimap()
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
    this.listen(this.renderer.domElement, 'pointercancel', () => {
      this.pointerButtons = 0
      this.drag = null
      this.dragActive.value = false
      this.globeMotion.dragging = false
      this.globeMotion.velocity = { x: 0, y: 0 }
    })
    this.listen(this.renderer.domElement, 'contextmenu', e => e.preventDefault())
    this.listen(this.renderer.domElement, 'wheel', e => {
      if (!this.world.inputMask) {
        e.preventDefault()
        if ((e as WheelEvent).deltaY) this.zoom((e as WheelEvent).deltaY < 0)
      }
    })
    this.listen(window, 'keydown', this.keyDown)
    this.listen(window, 'keyup', e => {
      const event = e as KeyboardEvent
      this.keys.delete(event.key.toLowerCase())
      this.keys.delete(event.code.toLowerCase())
      if (event.ctrlKey) this.keys.add('control')
      else this.keys.delete('control')
      if (event.shiftKey) this.keys.add('shift')
      else this.keys.delete('shift')
    })
    const trackNavigation = (event: Event) => {
      const p = event as PointerEvent
      this.navigationPointer =
        p.pointerType === 'mouse' ? { x: p.clientX, y: p.clientY, buttons: p.buttons } : null
    }
    for (const event of ['pointermove', 'pointerdown', 'pointerup'])
      this.listen(window, event, trackNavigation)
    this.listen(window, 'pointerout', e => {
      if (!(e as PointerEvent).relatedTarget) this.navigationPointer = null
    })
    this.listen(window, 'pointercancel', () => {
      this.navigationPointer = null
    })
    const pause = () => {
      this.previous = null
      this.globeMotion.dragging = false
      this.globeMotion.velocity = { x: 0, y: 0 }
      this.keys.clear()
      this.navigationPointer = null
      this.world.paused = true
      this.onChange()
    }
    this.listen(window, 'blur', pause)
    this.listen(document, 'visibilitychange', () => {
      this.previous = null
      if (document.hidden) pause()
    })
    this.listen(minimap, 'pointerdown', e => {
      if ((e as PointerEvent).button !== 0 || this.world.inputMask) return
      const p = e as PointerEvent,
        rect = minimap.getBoundingClientRect()
      this.focus(
        browserPosition(
          minimapPick(
            this.mini.width,
            this.mini.height,
            nativePosition(this.world, this.viewPoint),
            Math.round((this.cameraBearing * 1024) / Math.PI),
            {
              x: ((p.clientX - rect.left) / rect.width) * this.mini.width,
              y: ((p.clientY - rect.top) / rect.height) * this.mini.height,
            }
          )
        ),
        { animate: true }
      )
    })
    this.listen(minimap, 'contextmenu', e => e.preventDefault())
    this.frame = requestAnimationFrame(this.animate)
  }
  makeSky() {
    makeSky(this)
  }

  commitSky(camera: { x: number; y: number; angle: number }, remainder: number) {
    commitSky(this, camera, remainder)
  }
  updateSky() {
    updateSky(this)
  }
  listen(target: EventTarget, name: string, handler: EventListener) {
    target.addEventListener(name, handler)
    this.disposeListeners.push(() => target.removeEventListener(name, handler))
  }
  setSize() {
    const { width, height } = this.container.getBoundingClientRect()
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8))
    this.globe.stars.material.uniforms.pixelRatio.value = this.renderer.getPixelRatio()
    this.renderer.setSize(width, height)
    this.camera.aspect = width / Math.max(1, height)
    this.camera.updateProjectionMatrix()
    this.updateView()
  }
  y(p: Point) {
    return nativePosition(this.world, p).h / 45
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
    updateView(this)
  }
  currentPreset() {
    return currentPreset(this)
  }
  screen(p: Point, h = this.y(p)) {
    return this.view.screen(new THREE.Vector3(p.x, (h * 45) / 128, p.z), this.camera)
  }
  unitScreen(id: number, height = 0) {
    const group = this.unitMeshes.get(id)
    if (!group?.visible || !this.view.visible(group.userData.cellPosition ?? group.position))
      return null
    const position = group.position.clone()
    position.y += height
    const p = this.view.screen(position, this.camera)
    return p.z < -1 || p.z > 1 ? null : p
  }
  pickUnit(event: { clientX: number; clientY: number }) {
    if (this.overviewActive) return
    const id = this.picking.pick(event)
    return this.world.units.find(u => u.id === id && u.team === 'blue' && canOrder(u))
  }
  visible(p: Point, h = this.y(p)) {
    const q = this.screen(p, h)
    if (q.z < -1 || q.z > 1) return false
    return this.view.visible(p)
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
    const invalid = !!placementError(w, kind, p)
    const pose = buildingPlanPose(w, kind, p)
    const key = [kind, pose.anchorX, pose.anchorY, pose.angle, invalid, w.landVersion].join(',')
    if (key === this.placementState) return
    this.placementState = key
    this.cursor.geometry.dispose()
    const { geometry, cells, entrance } = this.planGeometry(pose, invalid)
    this.cursor.geometry = geometry
    this.cursor.userData.cells = cells
    this.cursor.userData.entrance = entrance
    this.cursor.userData.invalid = invalid
  }

  planGeometry(pose: BuildingShapePose, invalid = false, placed = false) {
    const { cells, entrance } = buildingPlanCells(pose)
    const w = this.world,
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

  rebuildTerrain() {
    rebuildTerrain(this)
  }
  updateTerrainTexture() {
    updateTerrainTexture(this)
  }
  landIndex(x: number, z: number) {
    return landIndex(this, x, z)
  }
  updateWater() {
    updateWater(this)
  }
  makeDecorations() {
    makeDecorations(this)
  }
  makeShrines() {
    makeShrines(this)
  }
  pick(event: { clientX: number; clientY: number }): Point | null {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      1 - ((event.clientY - rect.top) / rect.height) * 2
    )
    return this.view.pick(this.mouse, [this.terrain], this.camera)?.point ?? null
  }
  pickWorldObject(event: { clientX: number; clientY: number }) {
    const rect = this.renderer.domElement.getBoundingClientRect()
    if (this.overviewActive) {
      return (
        [...this.world.buildings, ...this.world.shrines].find(object => {
          const p = this.screen(object)
          return (
            this.visible(object) &&
            Math.hypot(
              ((p.x + 1) * rect.width) / 2 + rect.left - event.clientX,
              ((1 - p.y) * rect.height) / 2 + rect.top - event.clientY
            ) < 10
          )
        }) ?? null
      )
    }
    const id = this.picking.pick(event)
    return (
      this.world.buildings.find(b => b.id === id) ??
      this.world.shrines.find(s => s.id === id) ??
      null
    )
  }
  pointerDown = ((event: PointerEvent) => {
    this.pointerButtons = event.buttons
    if (
      event.button === 2 &&
      !(event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) &&
      !this.world.selected.length &&
      !this.world.mode &&
      !this.world.inputMask &&
      !this.overviewActive
    ) {
      const object = this.pickUnit(event) ?? this.pickWorldObject(event)
      if (object) this.objectPanels.open(object.id)
    }
    const unit =
      event.button === 0 &&
      !this.world.mode &&
      !this.world.inputMask &&
      !this.overviewActive &&
      !(this.world.selected.length && (event.shiftKey || (event.altKey && event.ctrlKey)))
        ? this.pickUnit(event)?.id
        : undefined
    this.down = {
      x: event.clientX,
      y: event.clientY,
      button: event.button,
      unit,
      extend: event.ctrlKey,
    }
    this.drag = null
    this.dragActive.value = false
    if (event.button === 0 && !this.world.mode && !this.world.inputMask && !this.overviewActive) {
      const origin = this.world.units.find(u => u.id === unit) ?? this.pick(event)
      if (origin) {
        const start = nativePosition(this.world, origin)
        this.drag = { start, end: start, active: unit === undefined && !this.world.selected.length }
      }
    }
    if (unit !== undefined) {
      this.acknowledgePointer(unit)
      this.onSound(0x6a)
    }
    this.dragLast = { x: event.clientX, y: event.clientY }
    if (
      this.overviewActive &&
      !this.world.inputMask &&
      (event.buttons === 2 || event.buttons === 4)
    ) {
      const rect = this.renderer.domElement.getBoundingClientRect()
      this.globePointer = {
        x: Math.trunc(event.clientX - rect.left),
        y: Math.trunc(event.clientY - rect.top),
      }
      beginGlobeDrag(this.globeMotion, this.view.globe, this.globePointer)
    }
    this.renderer.domElement.setPointerCapture(event.pointerId)
  }) as EventListener
  pointerMove = ((event: PointerEvent) => {
    this.pointerButtons = event.buttons
    this.pointerScreen = { clientX: event.clientX, clientY: event.clientY }
    if (!this.world.inputMask && (event.buttons === 2 || event.buttons === 4)) {
      const dx = event.clientX - this.dragLast.x,
        dy = event.clientY - this.dragLast.y
      this.cameraMotion.active = 0
      this.captureCamera()
      if (event.buttons === 4) {
        this.world.mode = null
        this.tooltip.draw = 0
      }
      if (this.overviewActive) {
        const rect = this.renderer.domElement.getBoundingClientRect()
        this.globePointer = {
          x: Math.trunc(event.clientX - rect.left),
          y: Math.trunc(event.clientY - rect.top),
        }
      } else dragCamera(this.cameraPosition, this.cameraVelocity, event.buttons === 2, dx, dy)
      this.viewPoint = browserPosition(this.cameraPosition)
      this.cameraBearing = (this.cameraPosition.angle * Math.PI) / 1024
      this.dragLast = { x: event.clientX, y: event.clientY }
      this.updateView()
    }
  }) as EventListener
  updateDrag(event: { clientX: number; clientY: number }) {
    const drag = this.drag
    if (!drag || this.world.mode || this.world.inputMask || this.overviewActive) {
      this.dragActive.value = false
      return
    }
    const picked = this.pick(event),
      end = picked && nativePosition(this.world, picked)
    if (!drag.active) {
      if (this.down.unit !== undefined) drag.active = this.pickUnit(event)?.id !== this.down.unit
      else if (end) drag.active = dragMoved(drag.start, end)
    }
    if (end) drag.end = dragEndpoint(drag.start, end, this.view.angle)
    this.dragActive.value = drag.active && positionDistance(drag.start, drag.end) > 0
    this.selectionOverlay.visible = this.dragActive.value
    if (!this.dragActive.value) return
    const angle = nativeAngle(
      ((drag.end.x - drag.start.x) << 16) >> 16,
      -(((drag.end.y - drag.start.y) << 16) >> 16)
    )
    const corners = unwrapDragCorners(
      dragCorners(drag.start, this.view.angle, angle, positionDistance(drag.start, drag.end))
    )
    this.selectionOverlay.update(
      corners,
      this.view.angle,
      ((angle - this.view.angle) & 2047) >> 9,
      this.world.land,
      this.view
    )
  }
  pointerUp = ((event: PointerEvent) => {
    this.pointerButtons = event.buttons
    if (!(event.buttons & 6)) this.globeMotion.dragging = false
    if (this.world.inputMask || this.overviewStage) return
    if (event.button === 0) this.updateDrag(event)
    const drag = this.drag
    this.drag = null
    this.dragActive.value = false
    if (event.button === 0 && drag?.active && !this.world.mode) {
      selectArea(
        this.world,
        drag.start,
        dragCommand(drag.start, drag.end, this.view.angle),
        this.down.extend
      )
      this.onChange()
      return
    }
    const moved = Math.hypot(event.clientX - this.down.x, event.clientY - this.down.y)
    if (moved > 7 && event.button !== 0) return
    if (event.button === 2) {
      cancelInteraction(this.world)
      this.onChange()
      return
    }
    if (event.button !== 0) return
    const clickedUnit = !this.world.mode
      ? this.world.units.find(u => u.id === this.down.unit)
      : undefined
    const pickedId = !this.world.mode && this.picking.pick(event)
    const picked =
      this.world.units.find(u => u.id === pickedId) ??
      this.world.buildings.find(b => b.id === pickedId) ??
      this.world.shrines.find(h => h.id === pickedId) ??
      this.world.trees.find(t => t.id === pickedId)
    const p = picked ?? this.pick(event) ?? clickedUnit
    if (!p) return
    if (this.world.mode) {
      const mode = this.world.mode
      const ok = SPELLS.some(s => s.id === mode)
        ? cast(this.world, mode as Parameters<typeof cast>[1], p)
        : placeBuilding(this.world, mode as Parameters<typeof placeBuilding>[1], p)
      if (!ok) this.onSound(0x25)
      else if (!SPELLS.some(s => s.id === mode)) this.onSound(0x24)
    } else {
      if (clickedUnit) {
        selectUnit(this.world, clickedUnit.id, this.down.extend)
      } else if (this.world.selected.length) {
        const selected = this.world.selected.slice()
        if (command(this.world, p, event)) {
          const marker = commandMarkerPoint(nativePosition(this.world, p), picked?.id ?? 0)
          if (marker) effect(this.world, 'orderMarker', browserPosition(marker))
          this.acknowledgePointer(picked?.id ?? 0)
          this.onSound(0x6a)
          this.orderSound(selected)
        }
      }
    }
    this.onChange()
  }) as EventListener
  keyDown = ((event: KeyboardEvent) => {
    const key = (
      event.code === 'Quote' || event.code.startsWith('Numpad') ? event.code : event.key
    ).toLowerCase()
    const zoomIn = key === '=' || key === '+',
      zoomOut = key === '-',
      modifier = key === 'control' || key === 'shift'
    if (
      this.world.inputMask ||
      (!cameraKeys[key] && !zoomIn && !zoomOut && !modifier && key !== 'quote') ||
      (event.target as HTMLElement).closest('input,textarea,select,dialog,a,[contenteditable]') ||
      (event.ctrlKey && key.length === 1) ||
      event.metaKey ||
      event.altKey ||
      (key === 'quote' && (event.ctrlKey || event.shiftKey))
    )
      return
    if (event.ctrlKey) this.keys.add('control')
    if (event.shiftKey) this.keys.add('shift')
    if (zoomIn || zoomOut) {
      if (!event.shiftKey) {
        this.zoom(zoomIn)
        event.preventDefault()
      }
      return
    }
    this.keys.add(key)
    if (!modifier) event.preventDefault()
  }) as EventListener
  captureCamera() {
    captureCamera(this)
  }
  skipIntroduction() {
    skipIntroduction(this)
  }
  navigationButtons() {
    if (this.world.inputMask || this.overviewStage || document.querySelector('dialog[open]'))
      return 0
    let buttons = 0
    for (const key of this.keys)
      buttons = mergeCameraInput(
        buttons,
        cameraCommand(cameraKeys[key] ?? 0, {
          control: this.keys.has('control'),
          fast: this.keys.has('shift'),
          overview: this.overviewActive,
        })
      )
    const pointer = this.navigationPointer
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
  updateCameraMotion(dt: number) {
    return updateCameraMotion(this, dt)
  }
  previewCamera(buttons: number) {
    return previewCamera(this, buttons)
  }
  updateFlyby(dt: number) {
    return updateFlyby(this, dt)
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
    const p =
      object.type === 1
        ? this.unitScreen(object.id, 1)
        : this.screen(object, this.y(object) + 512 / 45)
    if (!p || (object.type !== 1 && !this.visible(object))) {
      element.hidden = true
      return
    }
    element.setAttribute(
      'aria-label',
      state.text.replaceAll('{}', 'Left-click ').replaceAll('|}', 'Right-click ')
    )
    const { width, height } = this.container.getBoundingClientRect()
    drawTooltip(
      this.tooltipCanvas,
      texture('hud').image as HTMLImageElement,
      state.text,
      window.innerWidth,
      Math.trunc(height)
    )
    element.style.left = `${Math.max(4, Math.min(width - element.offsetWidth - 4, ((p.x + 1) * width) / 2))}px`
    element.style.top = `${Math.max(4, Math.min(height - element.offsetHeight - 4, ((1 - p.y) * height) / 2))}px`
  }
  renderBuildingPanels() {
    renderBuildingPanels(this, texture('hud').image as HTMLImageElement)
  }
  cancelOverview() {
    cancelOverview(this)
  }
  chooseFollowers(
    model: number,
    modifiers: { shiftKey: boolean; ctrlKey: boolean },
    focus = false
  ) {
    const w = this.world
    if (w.inputMask || this.overviewStage) return
    if (!focus && (this.overviewActive || w.manaWorld.gameFlags & 32)) return
    if (model === 7 && w.units.some(u => u.team === 'blue' && isShaman(u) && u.hp > 0))
      w.castingTribes[0].flags |= focus ? 0x1000 : 0x800
    if (focus) {
      const people = hudPeople(w)
      const id = focusHudPerson(
        people,
        model,
        this.cameraPosition,
        this.hudFocus[model],
        modifiers.shiftKey,
        !!(w.castingTribes[0].flags & 128)
      )
      this.hudFocus[model] = id
      const person = people.find(p => p.id === id)
      if (person) {
        this.focus(browserPosition(person), { animate: true })
        this.objectPanels.open(id)
      }
    } else {
      let mode: 'all' | 'five' | 'single' = 'single'
      if (modifiers.shiftKey) mode = 'all'
      else if (modifiers.ctrlKey && model !== 7) mode = 'five'
      selectFollowers(w, model, this.cameraPosition, mode)
    }
    this.onChange()
  }
  focus(p: Point = HOME, { animate = false } = {}) {
    focus(this, p, { animate })
  }
  stepViewChange() {
    stepViewChange(this)
  }
  startGroundView(preset: number, bearing?: number) {
    startGroundView(this, preset, bearing)
  }
  overview() {
    overview(this)
  }
  leaveOverview(preset: number) {
    leaveOverview(this, preset)
  }
  zoom(inward: boolean) {
    zoom(this, inward)
  }
  animatePerson(
    g: THREE.Group,
    heading: number,
    directions: { frames: number[]; flip: boolean }[],
    age: number,
    once = false,
    frameNumber?: number
  ) {
    animatePerson(this, g, heading, directions, age, once, frameNumber)
  }
  makeFx(f: Effect) {
    return makeFx(this, f)
  }
  animateFx(g: THREE.Group, f: Effect) {
    animateFx(this, g, f)
  }
  animateLightning(mesh: THREE.Mesh, b: Lightning) {
    animateLightning(this, mesh, b)
  }
  updateSpellHalo(frame: number) {
    updateSpellHalo(this, frame)
  }
  drawMinimap() {
    if (this.terrainTextures)
      this.minimap.draw(
        this.mini,
        this.world,
        this.terrainTextures,
        nativePosition(this.world, this.viewPoint),
        Math.round((this.cameraBearing * 1024) / Math.PI),
        this.terrainAtlasState
      )
  }
  soundEnvironment(): SoundEnvironment {
    // Sample the next rendered view at the existing 4 Hz audio-input cadence.
    const painter = this.view.painter
    const result: SoundEnvironment = {
      ...painter.terrainAmbience.result(),
      trees: false,
      overview: this.overviewActive,
      activity: this.world.musicActivity,
    }
    // Audio owns this snapshot; the next rendered frame fills its terrain counts.
    painter.pendingSoundEnvironment = result
    return result
  }
  acknowledgePointer(target: number) {
    // 0x4b0080 expires after five frontend visits. Use elapsed presentation
    // time at the existing 24 Hz reference cadence, never rendered-frame count.
    this.pointerAck = { target, until: performance.now() + 5000 / 24 }
  }
  drawPointer(now: number) {
    const bounds =
      !this.overviewActive &&
      !this.world.inputMask &&
      !this.world.mode &&
      this.hoveredObject !== null
        ? this.picking.personBounds(this.hoveredObject)
        : null
    this.pointerOutline.style.display = bounds ? '' : 'none'
    if (!bounds) return
    const acknowledged =
      now < this.pointerAck.until && this.pointerAck.target === this.hoveredObject
    const signature = [
      bounds.x,
      bounds.y,
      bounds.width,
      bounds.height,
      this.gameClock.animationFrame % 12,
      acknowledged,
    ].join(',')
    if (signature === this.pointerSignature) return
    this.pointerSignature = signature
    const { opacity, lines } = pointerBrackets(bounds, this.gameClock.animationFrame, acknowledged)
    this.pointerPath.setAttribute('stroke-opacity', String(opacity))
    this.pointerPath.setAttribute(
      'd',
      lines.map(([x, y, u, v]) => `M${x + 0.5},${y + 0.5}L${u + 0.5},${v + 0.5}`).join('')
    )
  }
  orderSound(selected = this.world.selected) {
    const units = this.world.units.filter(u => selected.includes(u.id))
    if (units.length) this.onSound(units.some(u => u.kind === 'shaman') ? 0x19 : 0x37)
  }
  playWorldSounds() {
    for (const event of this.world.sounds)
      if (event.serial > this.soundSerial) {
        this.soundSerial = event.serial
        if (event.stop && event.owner !== undefined) {
          this.ownedSounds.get(event.owner)?.()
          this.ownedSounds.delete(event.owner)
          continue
        }
        if (
          event.cue === 0x6b ||
          event.cue === 0xe3 ||
          event.cue === 0xe4 ||
          event.cue === 0xa2 ||
          event.cue === 225 ||
          event.cue === 226
        ) {
          this.onSound(event.cue, 1, 0)
          continue
        } // Native notification and defeat-sky cues are not positional.
        const dx = Math.round((event.x - this.viewPoint.x) * 256),
          dz = Math.round((event.z - this.viewPoint.z) * 256)
        const screen = this.screen(event)
        // Native distance curve and projected pan; the full native mixer is still unported.
        const stop = this.onSound(
          event.cue,
          soundAttenuation(dx * dx + dz * dz),
          screen.x,
          event.owner === undefined
            ? undefined
            : () => {
                const fire = this.world.effects.find(f => f.id === event.owner)?.fire
                if (fire) fire.soundPlaying = false
                const burn = this.world.buildings.find(b => b.id === event.owner)?.burn
                if (burn) burn.soundPlaying = false
                const person = this.world.units.find(u => u.id === event.owner)
                if (person?.native) person.native.flags4 &= ~16
                if (person?.flight) person.flight.flags4 &= ~16
                this.ownedSounds.delete(event.owner!)
              }
        )
        if (event.owner !== undefined && stop) this.ownedSounds.set(event.owner, stop)
      }
  }
  animate = (now: number) => {
    if (this.renderer.getPixelRatio() !== Math.min(devicePixelRatio, 1.8)) this.setSize()
    const previous = this.previous ?? now,
      skyTicks = Math.imul(Math.max(0, Math.floor(now) - Math.floor(previous)), 64) >>> 0,
      dt = Math.max(0, now - previous) / 1000
    if (this.fpsGraph) this.fpsGraph.update(document.hidden ? 0 : dt * 1000)
    this.previous = now
    advanceGame(this.world, this.gameClock, dt)
    this.playWorldSounds()
    this.updateTerrainFrame()
    this.updateDecorationsFrame()
    if (!this.updateCameraMotion(dt) && !this.updateFlyby(dt)) {
      this.updateView()
    }
    this.updateUnitsFrame()
    this.renderTooltip()
    this.updateBuildingsFrame()
    this.updateEffectsFrame()
    this.updateShrinesFrame()
    const spec = SPELLS.find(s => s.id === this.world.mode)
    this.updatePointerFrame(now)
    const hovered =
      this.hoveredObject === null ? null : worldTooltipObject(this.world, this.hoveredObject)
    const hoveredBuilding = this.world.buildings.find(b => b.id === this.hoveredObject)

    this.updatePlacement()
    this.updateSpellPointerFrame(spec)
    this.updateEnvironmentFrame(skyTicks)
    this.renderSceneFrame(hovered, hoveredBuilding)
    this.updateHudFrame(now, dt)
    this.frame = requestAnimationFrame(this.animate)
  }
  private updateTerrainFrame() {
    updateTerrainFrame(this)
  }

  private updateDecorationsFrame() {
    updateDecorationsFrame(this)
  }

  private updateUnitsFrame() {
    updateUnitsFrame(this)
  }

  private updateBuildingsFrame() {
    updateBuildingsFrame(this)
  }

  private updateEffectsFrame() {
    updateEffectsFrame(this)
  }

  private updateShrinesFrame() {
    updateShrinesFrame(this)
  }

  private updatePointerFrame(now: number) {
    // Original geometry advances per draw; its animation clock is still a
    // browser 12 Hz presentation clock until native timer ownership is ported.
    this.updateSpellHalo(Math.floor((now * 12) / 1000))
    // Picking projects the entire terrain; repeat when the pointer/view changes.
    const pointerState = [
      this.world.mode,
      this.world.inputMask,
      this.world.turn,
      this.pointerButtons,
      this.pointerScreen?.clientX,
      this.pointerScreen?.clientY,
      this.world.landVersion,
      this.viewPoint.x,
      this.viewPoint.z,
      this.cameraBearing,
      this.viewZoom,
      this.viewPreset,
      this.viewTransition?.remaining,
      this.overviewActive,
      ...this.camera.position.toArray(),
      this.container.clientWidth,
      this.container.clientHeight,
    ].join(',')
    if (pointerState !== this.pointerState) {
      if (this.pointerButtons === 1 && this.pointerScreen) this.updateDrag(this.pointerScreen)
      this.pointer = this.pointerScreen && this.world.mode ? this.pick(this.pointerScreen) : null
      this.hoveredObject =
        this.pointerScreen && !this.pointerButtons && !this.world.mode && !this.world.inputMask
          ? this.overviewActive
            ? (this.pickWorldObject(this.pointerScreen)?.id ?? null)
            : this.picking.pick(this.pointerScreen)
          : null
      this.pointerState = pointerState
    }
    this.selectionOverlay.visible = this.dragActive.value
  }

  private updateSpellPointerFrame(spec: (typeof SPELLS)[number] | undefined) {
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
      ;[...this.spellPointer.children].forEach((child, i) => {
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

  private updateEnvironmentFrame(skyTicks: number) {
    this.updateWater()
    this.ground.visible = !this.overviewActive
    this.globe.visible = this.overviewActive
    this.scene.background = this.space
    if (this.overviewActive && this.terrainTextures) {
      this.globe.phase = (this.globe.phase + (skyTicks >>> 4)) | 0
      this.globe.update(this.view.globe, this.world, this.terrainTextures)
    }
    this.updateSky()
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
        // 0x429f90 clamps the ground-view flash surface to the viewport.
        surfaceOffset:
          this.container.clientWidth *
          Math.max(0, Math.min(this.container.clientHeight, this.view.config.horizon)),
      }
    )
    this.skyFlash.visible = !!sky && !this.overviewActive
    if (sky) {
      this.skyFlash.material.uniforms.height.value =
        (sky.rect[3] - sky.rect[1]) / this.container.clientHeight
      this.skyFlash.material.uniforms.rgba.value.set(
        ((sky.color >>> 16) & 255) / 255,
        ((sky.color >>> 8) & 255) / 255,
        (sky.color & 255) / 255,
        (sky.color >>> 24) / 255
      )
    }
  }

  private renderSceneFrame(hovered: ReturnType<typeof worldTooltipObject>, hoveredBuilding: Building | undefined) {
    this.scene.traverse(object => {
      updateModelLighting(object)
      if (!object.userData.highlight) return
      const id = object.parent?.userData.building ?? object.parent?.userData.shrine
      object.userData.highlight.value =
        hovered && id === hovered.id
          ? modelHighlight(
              { ...hovered, buildingFlags: hoveredBuilding?.damageState?.buildingFlags },
              this.world.turn,
              { construction: object.userData.stage !== 4 }
            )
          : 0
    })
    this.view.painter.landFlags = this.world.land.flags
    this.view.painter.land = this.world.land
    this.view.painter.cells = this.world.objectCells
    this.view.prepare(this.scene)
    this.renderer.render(this.scene, this.camera)
  }

  private updateHudFrame(now: number, dt: number) {
    this.drawPointer(now)
    this.renderBuildingPanels()
    this.objectPanels.update(texture('hud').image as HTMLImageElement)
    this.container.parentElement!.style.setProperty(
      '--population-full-color',
      nativeHud.colors[populationMeter(1, 1, this.gameClock.animationFrame).color]
    )
    const shaman = this.world.units.find(u => u.team === 'blue' && isShaman(u))
    const portraitMesh = shaman && this.unitMeshes.get(shaman.id)
    drawPortrait(
      this.portrait,
      texture(nativeUnits.atlas).image as HTMLImageElement,
      portraitMesh?.userData.frame,
      portraitMesh?.userData.frameFlip ?? false,
      portraitBackground(
        shaman
          ? {
              health: Math.round(shaman.hp * 20),
              maximum: Math.round(maxHp('shaman') * 20),
              state: shaman.native?.state ?? 0,
            }
          : null,
        this.gameClock.animationFrame,
        this.portrait.parentElement?.matches(':hover,:active') ?? false
      ),
      this.view.config
    )
    this.uiTimer += dt
    if (this.uiTimer > 0.2) {
      this.onChange()
      this.uiTimer = 0
    }
    this.drawMinimap()
  }
  releaseGroup(g: THREE.Object3D) {
    releaseGroup(g)
  }
  dispose() {
    cancelAnimationFrame(this.frame)
    for (const stop of this.ownedSounds.values()) stop()
    this.ownedSounds.clear()
    this.terrainLoad.abort()
    this.resize.disconnect()
    this.disposeListeners.forEach(f => f())
    this.scene.remove(this.globe)
    this.globe.dispose()
    this.releaseGroup(this.scene)
    this.waterMap.dispose()
    this.terrainMap.dispose()
    this.view.dispose()
    this.renderer.dispose()
    this.renderer.domElement.remove()
    this.fpsGraph?.element.remove()
    this.tooltipElement.remove()
    this.pointerOutline.remove()
    for (const canvas of this.buildingPanels.values()) canvas.remove()
    this.buildingPanels.clear()
    this.objectPanels.dispose()
    this.spellPointer.remove()
  }
}
