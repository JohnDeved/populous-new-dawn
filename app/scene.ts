import { NeutralCanvasCursor, neutralCanvasState } from './neutral-cursor.ts'
import { createRuntimeTerrainPicking } from './runtime-terrain-picking.ts'
import type { SceneUpdateMetrics } from './scene-update-metrics.ts'
import type { WaterUpdateMetrics } from './water-update-reasons.ts'
import { worldEnvironment, type WorldEnvironment } from './world-environment.ts'
import { DEFAULT_GAME_PREFERENCES, type GamePreferences } from './game-preferences.ts'
import type { PresentationBinding, SharedAniblSnapshot } from './shared-anibl.ts'
import { templeArt } from './temple-art.ts'
import type { TransportKind } from './hud-transports.ts'
import type { FollowerTask } from './hud-tasks.ts'
import { syncSecondaryReservations } from './scene-secondary-effects.ts'
import * as THREE from 'three'
import type { SoundEnvironment } from './ambient-sound.ts'
import { orderSound, playWorldSounds, soundEnvironment } from './audio'
import { renderBuildingPanels } from './building-panels.ts'
import { createCameraMotion, createResultCamera } from './camera-motion.ts'
import { type FlybyCamera } from './flyby.ts'
import {
  createPointerFrameMetrics,
  resetPointerFrameMetrics,
  type PointerFrameMetrics,
} from './pointer-frame-metrics.ts'
import { FpsGraph } from './fps-graph.ts'
import { levelStartCamera } from './level-start.ts'
import { advanceGame, observeGameTurns } from './game-clock.ts'
import { createResultClock, advanceResultClock } from './result-session.ts'
import { FollowerNearbyMode } from './follower-nearby.ts'
import { bindTrainingPanelRequests } from './training-panel-requests.ts'
import {
  WorshipAcquisitionPresentation,
  type WorshipHudBridge,
} from './scene-worship-acquisition.ts'
import { MinimapRenderer } from './minimap-renderer.ts'
import {
  HOME,
  SPELLS,
  nativePosition,
  browserPosition,
  type Building,
  type Effect,
  type Point,
  type World,
} from './model'
import { ObjectPanels } from './object-panels.ts'
import pointerPalette from './original-pointer.json' with { type: 'json' }
import nativeUnits from './original-units.json'
import { vaultKnowledgeAtlas } from './vault-appearance.ts'
import { ProjectileMotion } from './projectile-motion.ts'
import { loadTexture, releaseGroup, retryFailedTexture, texture } from './scene-assets.ts'
import { ScenePicking } from './scene-picking.ts'
import { createSkyMotion } from './sky.ts'
import { terrainAtlas, type TerrainTextures } from './terrain-texture.ts'
import {
  createTooltip,
  tooltipPalette,
  worldTooltipObject,
  type TooltipObject,
} from './tooltips.ts'
import {
  createTooltipController,
  createTooltipSession,
  type TooltipSession,
} from './tooltip-controller.ts'
import {
  acquireForcedTooltip,
  cancelTooltipInspection,
  updateTooltipController,
  type TooltipInputSample,
  type TooltipInspectionInput,
} from './scene-tooltip-runtime.ts'
import { UnitMotion } from './unit-motion.ts'

import { type BuildingShapePose } from './building-shapes.ts'
import { type GlobeMorph } from './camera-view.ts'
import { SelectionOverlay } from './drag-overlay.ts'
import { GlobeRenderer } from './globe-renderer.ts'
import { type GlobeMotion } from './globe.ts'
import { type Lightning } from './lightning.ts'
import { type CameraConfig } from './projection.ts'
import { RenderView } from './render-view.ts'
import {
  cancelOverview,
  captureCamera,
  commitSky,
  currentPreset,
  focus,
  leaveOverview,
  makeSky,
  overview,
  previewCamera,
  skipIntroduction,
  startGroundView,
  stepViewChange,
  updateCameraMotion,
  updateEnvironmentFrame,
  updateFlyby,
  updateSky,
  updateView,
  zoom,
} from './scene-camera-runtime.ts'
import {
  animateFx,
  animateLightning,
  makeFx,
  updateEffectsFrame,
  updateSpellHalo,
} from './scene-effects.ts'
import {
  animatePerson,
  makeShrines,
  renderSceneFrame,
  updateBuildingsFrame,
  updateShrinesFrame,
  updateUnitsFrame,
  updateVehiclesFrame,
} from './scene-entities.ts'
import { updateHudFrame } from './scene-hud-runtime.ts'
import {
  acknowledgePointer,
  cancelPointerGesture,
  chooseFollowers,
  chooseTransport,
  drawPointer,
  installInputListeners,
  keyDown,
  navigationButtons,
  pick,
  pickUnit,
  pickWorldObject,
  planGeometry,
  pointerDown,
  pointerMove,
  pointerUp,
  renderTooltip,
  updateDrag,
  updatePlacement,
  updatePointerFrame,
  updateSpellPointerFrame,
} from './scene-input-runtime.ts'
import {
  initializeTerrain,
  landIndex,
  makeDecorations,
  rebuildTerrain,
  updateDecorationsFrame,
  updateTerrainFrame,
  updateTerrainTexture,
  updateWater,
} from './scene-terrain-runtime.ts'

export class GameScene {
  world: World
  gamePreferences: GamePreferences = { ...DEFAULT_GAME_PREFERENCES }
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
    time: number
    previewStartTime: number
    previewFraction: number
    preview?: CameraConfig
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
  terrainMap = new THREE.DataTexture(new Uint8Array(4096 * 4096 * 4), 4096, 4096)
  readonly environment: WorldEnvironment
  terrainTextures: TerrainTextures | null = null
  terrainUpload = new THREE.DataTexture()
  terrainAtlasState: ReturnType<typeof terrainAtlas> | undefined
  terrainLoad = new AbortController()
  ready: Promise<void> = Promise.resolve()
  terrainMapVersion: number | null = null
  terrainShadows = new Uint8Array(16384)
  unitMeshes = new Map<number, THREE.Group>()
  vehicleMeshes = new Map<number, THREE.Group>()
  buildingMeshes = new Map<number, THREE.Group>()
  hutSmokePuffs = new Map<number, THREE.Group>()
  hoveredObject: number | null = null
  pointerAck = { target: 0, until: 0 }
  pointerSignature = ''
  pointerOutline = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  pointerPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  fxMeshes = new Map<number, THREE.Group>()
  objects = new THREE.Group()
  decorations = new THREE.Group()
  shrineMeshes = new Map<number, { g: THREE.Group }>()
  cursor: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>
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
  levelStartCameraSeeded = false
  flybyTime = 0
  wasFlying = false
  resultCamera = createResultCamera()
  cameraMotion = createCameraMotion()
  cameraVelocity = { turn: 0, forward: 0, side: 0 }
  cameraPosition = { x: 0, y: 0, angle: 0 }
  cameraBookmarks: ({ x: number; y: number; angle: number } | null)[] = Array(4).fill(null)
  resultRequest = 0
  cameraTime = 0
  cameraPreviewButtons: number | null = null
  resultTurn = 0
  tooltip = createTooltip()
  tooltipSession = createTooltipSession()
  tooltipController = createTooltipController(this.tooltip, this.tooltipSession)
  tooltipInput: TooltipInputSample | null = null
  tooltipInspectionInputs: TooltipInspectionInput[] = []
  tooltipHudOwners = new WeakMap<Element, string>()
  tooltipHudSerial = 0
  tooltipElement = document.createElement('div')
  tooltipCanvas = document.createElement('canvas')
  objectPanels = new ObjectPanels(this)
  picking = new ScenePicking(this)
  hudFocus = Array<number>(8).fill(0)
  hudTaskFocus = Array<number>(48).fill(0)
  hudTransportFocus = Array<number>(16).fill(0)
  buildingPanels = new Map<number, HTMLDivElement>()
  down = { x: 0, y: 0, button: 0, unit: undefined as number | undefined, extend: false }
  pointerGesture: { pointerId: number; button: number } | null = null
  drag: { start: { x: number; y: number }; end: { x: number; y: number }; active: boolean } | null =
    null
  selectionOverlay: SelectionOverlay
  dragActive = { value: false }
  keys = new Set<string>()
  resize: ResizeObserver
  frame = 0
  started = false
  disposed = false
  fpsGraph: FpsGraph | null = null
  private sceneUpdateMetrics?: SceneUpdateMetrics
  private waterFrameMetrics?: WaterUpdateMetrics
  private simulationFrameMetrics?: { steps: number }
  private readonly pointerFrameMetrics = createPointerFrameMetrics(true)
  togglePerformance() {
    if (this.fpsGraph) {
      this.fpsGraph.dispose()
      this.fpsGraph = null
    } else {
      this.fpsGraph = new FpsGraph(this.renderer.getContext(), this.world.outcome.level)
      this.fpsGraph.element.addEventListener('pointerenter', () => {
        this.navigationPointer = null
      })
      this.fpsGraph.element.addEventListener('focusin', () => {
        this.keys.clear()
        this.navigationPointer = null
      })
      this.container.appendChild(this.fpsGraph.element)
    }
  }
  previous: number | null = null
  private neutralCursor: NeutralCanvasCursor | null = null
  neutralCursorRosterSelected = true
  cursorFrameBlocked = true
  resultClock = createResultClock()
  focusPauseOwned = false
  modalSuspended = false
  setModalSuspended(suspended: boolean) {
    this.modalSuspended = suspended
    if (suspended) this.tooltipElement.hidden = true
    this.neutralCursor?.reset()
    this.previous = null
    this.keys.clear()
    const pointerId = this.pointerGesture?.pointerId
    if (pointerId !== undefined && this.renderer.domElement.hasPointerCapture(pointerId))
      this.renderer.domElement.releasePointerCapture(pointerId)
    cancelPointerGesture(this)
    this.cancelNearbyFollowers()
    this.cancelTooltipInspection()
  }
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
      this.worshipPresentation.handoffs()
    },
    worshipVisit: () => {
      if (this.presentationBinding && !this.presentationBinding.isCurrent()) return
      this.presentationBinding?.advance()
      this.worshipPresentation.visit()
    },
    presentationHidden: () => document.hidden,
  }
  observeGameTurns(visit: () => void, failed: (error: unknown) => void) {
    return observeGameTurns(this.gameClock, visit, failed)
  }
  templeResourceSnapshot: SharedAniblSnapshot | null = null
  private presentationBinding?: PresentationBinding
  private nearbyFollowers?: FollowerNearbyMode
  nearbyFollowersHudActive = false
  onNearbyFollowersCancel?: () => void
  worshipPresentation: WorshipAcquisitionPresentation
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
    ) => (() => void) | void,
    worshipHud?: WorshipHudBridge,
    presentationBinding?: PresentationBinding,
    tooltipSession?: TooltipSession
  ) {
    this.presentationBinding = presentationBinding
    this.templeResourceSnapshot = presentationBinding?.snapshot() ?? null
    if (!this.templeResourceSnapshot)
      throw new Error('Scene requires its presentation resource binding')
    if (tooltipSession) {
      this.tooltipSession = tooltipSession
      this.tooltipController = createTooltipController(this.tooltip, tooltipSession)
    }
    this.container = container
    this.mini = minimap
    this.portrait = portrait
    this.world = world
    this.environment = worldEnvironment(world)
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
    // Resolve failed required textures before constructing anything that captures them.
    // Passive texture()/loadTexture() lookups still reuse failures; only this new-scene
    // preload boundary may replace a completed required failure.
    const atlasAsset = retryFailedTexture(this.environment.landscape.modelAtlas),
      selectionAtlasAsset =
        this.environment.landscape.modelAtlas === 'atlas'
          ? atlasAsset
          : retryFailedTexture('atlas'),
      unitAtlasAsset =
        nativeUnits.atlas === 'atlas' ? selectionAtlasAsset : retryFailedTexture(nativeUnits.atlas),
      knowledgeAtlas = vaultKnowledgeAtlas(world.outcome.level),
      knowledgeAtlasAsset = knowledgeAtlas ? retryFailedTexture(knowledgeAtlas) : null,
      templeAssets =
        world.outcome.level === 3
          ? [templeArt.modelAtlas, templeArt.sparkleAtlas].map(
              name => [name, retryFailedTexture(name), true] as const
            )
          : [],
      preload = (
        [
          ['effects', loadTexture('effects'), false],
          ['hud', loadTexture('hud'), false],
          ['unit-health', loadTexture('unit-health'), false],
          [this.environment.landscape.modelAtlas, atlasAsset, true],
          ...(this.environment.landscape.modelAtlas === 'atlas'
            ? []
            : [['atlas', selectionAtlasAsset, true] as const]),
          [nativeUnits.atlas, unitAtlasAsset, true],
          ...(knowledgeAtlasAsset ? [[knowledgeAtlas!, knowledgeAtlasAsset, true] as const] : []),
          ...templeAssets,
        ] as const
      ).map(([name, asset, required]) =>
        asset.ready.then(loaded => {
          if (!loaded) {
            if (required) throw new Error(`Required scene texture failed to load: ${name}`)
            return
          }
          if (!this.terrainLoad.signal.aborted) this.renderer.initTexture(asset.texture)
        })
      )
    this.cursor = new THREE.Mesh(
      new THREE.BufferGeometry(),
      new THREE.MeshBasicMaterial({
        map: atlasAsset.texture,
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
    this.neutralCursor = new NeutralCanvasCursor(this.renderer.domElement, () =>
      neutralCanvasState(this)
    )
    if (new URLSearchParams(location.search).has('fps')) this.togglePerformance()
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
    const terrain = initializeTerrain(this)
    this.terrain = terrain.terrain
    this.ready = Promise.all([terrain.ready, ...preload, this.neutralCursor?.ready]).then(
      () => undefined
    )
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
    createRuntimeTerrainPicking(this)
    this.makeDecorations()
    this.makeShrines()
    const shaman = this.world.units.find(u => u.team === 'blue' && u.kind === 'shaman')
    if (shaman && this.world.turn === 0 && this.world.levelStart?.some(site => site.tribe === 0)) {
      const camera = levelStartCamera(
        nativePosition(this.world, shaman),
        this.world.manaWorld.gameFlags
      )
      this.cameraBearing = (camera.angle * Math.PI) / 1024
      this.levelStartCameraSeeded = true
      this.focus(browserPosition(camera))
    } else this.focus(shaman ?? HOME)
    this.drawMinimap()
    this.resize = new ResizeObserver(() => this.setSize())
    this.resize.observe(container)
    this.setSize()
    this.worshipPresentation = new WorshipAcquisitionPresentation(this, worshipHud)
  }
  isCurrent() {
    return !this.disposed && (!this.presentationBinding || this.presentationBinding.isCurrent())
  }
  canRequestNearbyFollowers() {
    return !!(
      this.started &&
      this.isCurrent() &&
      this.nearbyFollowersHudActive &&
      !document.hidden &&
      !document.querySelector('dialog[open]') &&
      !this.world.inputMask &&
      !this.overviewStage &&
      !this.overviewActive &&
      !(this.world.manaWorld.gameFlags & 32)
    )
  }
  requestNearbyFollowers() {
    if (!this.canRequestNearbyFollowers()) {
      this.cancelNearbyFollowers()
      return false
    }
    this.nearbyFollowers ??= new FollowerNearbyMode()
    return this.nearbyFollowers.request(this.world, performance.now(), cue =>
      this.onSound(cue, 1, 0)
    )
  }
  dispatchNearbyFollowers(now: number) {
    if (!this.canRequestNearbyFollowers()) {
      this.cancelNearbyFollowers()
      return
    }
    this.nearbyFollowers ??= new FollowerNearbyMode()
    if (this.nearbyFollowers.advance(this.world, now)) this.onChange()
  }
  cancelNearbyFollowers() {
    this.nearbyFollowers?.cancel()
    this.onNearbyFollowersCancel?.()
  }
  start() {
    if (this.disposed || this.terrainLoad.signal.aborted) return false
    if (this.presentationBinding && !this.presentationBinding.isCurrent()) return false
    if (this.started) return true
    this.started = true
    this.releaseTrainingPanelRequests = bindTrainingPanelRequests(this.world, this.objectPanels)
    this.previous = null
    this.drawMinimap()
    installInputListeners(this, this.mini)
    this.frame = requestAnimationFrame(this.animate)
    return true
  }
  private releaseTrainingPanelRequests: (() => void) | null = null
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
    if (this.disposed) return
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
  pickUnit(event: { clientX: number; clientY: number }, metrics?: PointerFrameMetrics) {
    return pickUnit(this, event, metrics)
  }
  visible(p: Point, h = this.y(p)) {
    const q = this.screen(p, h)
    if (q.z < -1 || q.z > 1) return false
    return this.view.visible(p)
  }

  updatePlacement() {
    updatePlacement(this)
  }

  planGeometry(pose: BuildingShapePose, invalid = false, placed = false) {
    return planGeometry(this, pose, invalid, placed)
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
  updateWater(metrics?: WaterUpdateMetrics) {
    updateWater(this, metrics)
  }
  makeDecorations() {
    makeDecorations(this)
  }
  makeShrines() {
    makeShrines(this)
  }
  pick(event: { clientX: number; clientY: number }, metrics?: PointerFrameMetrics): Point | null {
    return pick(this, event, metrics)
  }
  pickWorldObject(event: { clientX: number; clientY: number }) {
    return pickWorldObject(this, event)
  }
  pointerDown = ((event: PointerEvent) => {
    pointerDown(this, event)
  }) as EventListener
  pointerMove = ((event: PointerEvent) => {
    pointerMove(this, event)
  }) as EventListener
  updateDrag(event: { clientX: number; clientY: number }, metrics?: PointerFrameMetrics) {
    return updateDrag(this, event, metrics)
  }
  pointerUp = ((event: PointerEvent) => {
    pointerUp(this, event)
  }) as EventListener
  keyDown = ((event: KeyboardEvent) => {
    keyDown(this, event)
  }) as EventListener
  captureCamera() {
    captureCamera(this)
  }
  skipIntroduction() {
    skipIntroduction(this)
  }
  navigationButtons() {
    return navigationButtons(this)
  }
  updateCameraMotion(dt: number) {
    return updateCameraMotion(this, dt)
  }
  previewCamera(buttons: number) {
    return previewCamera(this, buttons)
  }
  acquireForcedTooltip(object: TooltipObject | null, duration: number) {
    acquireForcedTooltip(this, object, duration)
  }
  updateTooltipController(now: number) {
    updateTooltipController(this, now)
  }
  cancelTooltipInspection() {
    cancelTooltipInspection(this)
  }
  updateFlyby(dt: number) {
    return updateFlyby(this, dt)
  }
  renderTooltip(metrics?: PointerFrameMetrics) {
    renderTooltip(this, metrics)
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
    focus = false,
    category?: FollowerTask
  ) {
    chooseFollowers(this, model, modifiers, focus, category)
  }
  chooseTransport(
    kind: TransportKind,
    model: number,
    modifiers: { shiftKey: boolean; ctrlKey: boolean },
    focusNext = false
  ) {
    chooseTransport(this, kind, model, modifiers, focusNext)
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
    frameNumber?: number,
    selectedIds?: ReadonlySet<number>
  ) {
    animatePerson(this, g, heading, directions, age, once, frameNumber, selectedIds)
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
    if (this.disposed) return
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
    return soundEnvironment(this)
  }
  acknowledgePointer(target: number) {
    acknowledgePointer(this, target)
  }
  drawPointer(now: number) {
    drawPointer(this, now)
  }
  orderSound(selected = this.world.selected) {
    orderSound(this, selected)
  }
  playWorldSounds() {
    playWorldSounds(this)
  }
  animate = (now: number) => {
    if (!this.isCurrent()) {
      this.neutralCursor?.reset()
      this.cancelNearbyFollowers()
      this.nearbyFollowers?.reset()
      return
    }
    const diagnostic = document.hidden ? null : this.fpsGraph
    const callbackStart = diagnostic ? performance.now() : 0
    const pointerMetrics = diagnostic ? this.pointerFrameMetrics : undefined
    if (pointerMetrics) resetPointerFrameMetrics(pointerMetrics)
    const waterMetrics = diagnostic ? (this.waterFrameMetrics ??= { reasons: 0 }) : undefined
    if (waterMetrics) waterMetrics.reasons = 0
    const sceneUpdates = diagnostic
      ? (this.sceneUpdateMetrics ??= { terrainCpuMs: 0, waterCpuMs: 0, hudCpuMs: 0 })
      : undefined
    if (sceneUpdates) {
      sceneUpdates.terrainCpuMs = 0
      sceneUpdates.waterCpuMs = 0
      sceneUpdates.hudCpuMs = 0
    }
    const simulationMetrics = diagnostic
      ? (this.simulationFrameMetrics ??= { steps: 0 })
      : undefined
    if (simulationMetrics) simulationMetrics.steps = 0
    if (this.renderer.getPixelRatio() !== Math.min(devicePixelRatio, 1.8)) this.setSize()
    const previous = this.previous ?? now,
      skyTicks = Math.imul(Math.max(0, Math.floor(now) - Math.floor(previous)), 64) >>> 0,
      dt = Math.max(0, now - previous) / 1000
    if (document.hidden) this.fpsGraph?.reset('Hidden tab · sampling stopped')
    this.previous = now
    if (!document.hidden) {
      const previousPhase =
        ((Math.floor(this.resultClock.inputCycles / 4) & 1) << 1) |
        (Math.floor(this.resultClock.inputCycles / 6) & 1)
      advanceResultClock(this.resultClock, dt)
      const nextPhase =
        ((Math.floor(this.resultClock.inputCycles / 4) & 1) << 1) |
        (Math.floor(this.resultClock.inputCycles / 6) & 1)
      if (this.world.status !== 'playing' && previousPhase !== nextPhase) {
        this.onChange()
        if (this.disposed) return
      }
    }
    // Pause menus freeze the entire presentation, not ordinary Space pause.
    // Keep sampling timestamps so resuming never catches up suspended wall time.
    if (this.modalSuspended) {
      this.neutralCursor?.reset()
      const renderStart = diagnostic ? performance.now() : 0
      if (diagnostic)
        diagnostic.renderGpu(() => this.view.painter.render(this.renderer, this.scene, this.camera))
      else this.view.painter.render(this.renderer, this.scene, this.camera)
      const renderMs = diagnostic ? performance.now() - renderStart : 0
      this.frame = requestAnimationFrame(this.animate)
      diagnostic?.update(
        now,
        0,
        renderMs,
        this.renderer.info.render.calls,
        'Menu · rendering',
        performance.now() - callbackStart,
        0,
        pointerMetrics,
        waterMetrics?.reasons,
        simulationMetrics?.steps,
        sceneUpdates
      )
      return
    }
    syncSecondaryReservations(this)
    this.dispatchNearbyFollowers(now)
    // Synchronous UI/audio callbacks may retire this scene before the frame ends.
    if (this.disposed) return
    const simulationStart = diagnostic ? performance.now() : 0
    advanceGame(this.world, this.gameClock, dt, simulationMetrics)
    if (this.disposed) return
    const simulationMs = diagnostic ? performance.now() - simulationStart : 0
    this.templeResourceSnapshot = this.presentationBinding?.snapshot() ?? null
    this.playWorldSounds()
    if (this.disposed) return
    const terrainStart = sceneUpdates ? performance.now() : 0
    this.updateTerrainFrame()
    if (sceneUpdates) sceneUpdates.terrainCpuMs = performance.now() - terrainStart
    this.updateDecorationsFrame()
    const cameraOwnsFrame = this.updateCameraMotion(dt)
    this.cursorFrameBlocked = !!(
      cameraOwnsFrame ||
      this.world.paused ||
      this.world.inputMask ||
      this.world.mode ||
      this.world.selected.length ||
      this.overviewActive ||
      this.overviewStage ||
      document.hidden ||
      document.querySelector('dialog[open]')
    )
    if (this.cursorFrameBlocked) this.cancelTooltipInspection()
    if (!cameraOwnsFrame) {
      const flying = this.updateFlyby(dt)
      if (this.disposed) return
      if (!flying) this.updateView()
    }
    this.updateUnitsFrame()
    updateVehiclesFrame(this)
    this.renderTooltip(pointerMetrics)
    this.updateBuildingsFrame()
    this.updateEffectsFrame()
    this.updateShrinesFrame()
    const spec = SPELLS.find(s => s.id === this.world.mode)
    const pointerStart = diagnostic ? performance.now() : 0
    this.updatePointerFrame(now, pointerMetrics)
    this.neutralCursor?.update()
    const pointerMs = diagnostic ? performance.now() - pointerStart : 0
    let hovered: Parameters<typeof renderSceneFrame>[1] =
      this.hoveredObject === null ? null : worldTooltipObject(this.world, this.hoveredObject)
    if (!hovered && this.hoveredObject !== null) {
      const tree = this.world.trees.find(
        t => t.id === this.hoveredObject && t.logs >= 1 && t.model >= 1 && t.model <= 6
      )
      if (tree) hovered = { id: tree.id, type: 5, model: tree.model, owner: -1 }
    }
    const hoveredBuilding = this.world.buildings.find(b => b.id === this.hoveredObject)

    this.updatePlacement()
    this.updateSpellPointerFrame(spec)
    this.updateEnvironmentFrame(skyTicks, waterMetrics, sceneUpdates)
    const renderStart = diagnostic ? performance.now() : 0
    if (diagnostic) diagnostic.renderGpu(() => this.renderSceneFrame(hovered, hoveredBuilding))
    else this.renderSceneFrame(hovered, hoveredBuilding)
    const renderMs = diagnostic ? performance.now() - renderStart : 0
    const hudStart = sceneUpdates ? performance.now() : 0
    this.updateHudFrame(now, dt)
    if (this.disposed) return
    if (sceneUpdates) sceneUpdates.hudCpuMs = performance.now() - hudStart
    this.frame = requestAnimationFrame(this.animate)
    // Synchronous game callback work, including HUD and scheduling; excludes
    // this diagnostic's own update and deferred browser/GPU work.
    diagnostic?.update(
      now,
      simulationMs,
      renderMs,
      this.renderer.info.render.calls,
      this.world.paused ? 'Paused · rendering' : 'Live',
      performance.now() - callbackStart,
      pointerMs,
      pointerMetrics,
      waterMetrics?.reasons,
      simulationMetrics?.steps,
      sceneUpdates
    )
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

  private updatePointerFrame(now: number, metrics?: PointerFrameMetrics) {
    updatePointerFrame(this, now, metrics)
  }

  private updateSpellPointerFrame(spec: (typeof SPELLS)[number] | undefined) {
    updateSpellPointerFrame(this, spec)
  }

  private updateEnvironmentFrame(
    skyTicks: number,
    metrics?: WaterUpdateMetrics,
    sceneUpdates?: SceneUpdateMetrics
  ) {
    updateEnvironmentFrame(this, skyTicks, metrics, sceneUpdates)
  }

  private renderSceneFrame(
    hovered: Parameters<typeof renderSceneFrame>[1],
    hoveredBuilding: Building | undefined
  ) {
    renderSceneFrame(this, hovered, hoveredBuilding)
  }

  private updateHudFrame(now: number, dt: number) {
    updateHudFrame(this, now, dt)
  }
  releaseGroup(g: THREE.Object3D) {
    releaseGroup(g)
  }
  dispose() {
    if (this.disposed) return
    this.disposed = true
    this.neutralCursor?.dispose()
    this.neutralCursor = null
    this.cancelNearbyFollowers()
    this.nearbyFollowers?.reset()
    this.onNearbyFollowersCancel = undefined
    this.releaseTrainingPanelRequests?.()
    this.releaseTrainingPanelRequests = null
    this.presentationBinding?.release()
    if (this.frame) cancelAnimationFrame(this.frame)
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
    this.fpsGraph?.dispose()
    this.renderer.dispose()
    this.renderer.domElement.remove()
    this.fpsGraph = null
    this.cancelTooltipInspection()
    this.tooltipInput = null
    this.tooltipElement.remove()
    this.pointerOutline.remove()
    for (const canvas of this.buildingPanels.values()) canvas.remove()
    this.buildingPanels.clear()
    this.objectPanels.dispose()
    this.spellPointer.remove()
    this.worshipPresentation.dispose()
    // Disposal of Three textures releases GPU resources, not their CPU images.
    // Drop every owned terrain alias, including the minimap's revision token.
    // Replace references rather than changing buffers a caller may still hold.
    const releasedImage = { data: new Uint8Array(0), width: 0, height: 0 }
    this.terrainMap.image = releasedImage
    this.terrainUpload.image = releasedImage
    this.waterMap.image = releasedImage
    this.terrainAtlasState = undefined
    this.minimap.revision = undefined
    this.terrainTextures = null
    this.waves = null
    // Each Scene owns its renderer/context. Retire it only after normal cleanup;
    // shared cached textures and their images belong to future Scenes too.
    this.renderer.forceContextLoss()
  }
}
