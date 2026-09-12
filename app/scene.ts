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
} from './model'

import nativeModelData from './original-models.json'
import { modelDepthBias, modelStage, modelTextureModes, type NativeModel } from './model-faces.ts'
const nativeModels: Record<number, NativeModel> = nativeModelData
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
const teamColor = { blue: 0x303fc1, red: 0xb92720, wild: 0x9f9170 }
const material = (color: number, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 1, ...extra })
const textures = new Map<string, { texture: THREE.Texture; ready: Promise<boolean> }>()
function texture(kind: string) {
  return loadTexture(kind).texture
}
function loadTexture(kind: string) {
  const cached = textures.get(kind)
  if (cached) return cached
  let loaded!: (success: boolean) => void
  const ready = new Promise<boolean>(resolve => {
    loaded = resolve
  })
  const t =
    kind === 'lightning-bolt'
      ? new THREE.DataTexture(lightningTexture(), 32, 32)
      : new THREE.TextureLoader().load(
          `/original/${kind}.png`,
          () => loaded(true),
          undefined,
          error => {
            console.error(`Texture load failed: ${kind}`, error)
            loaded(false)
          }
        )
  if (kind === 'lightning-bolt') {
    loaded(true)
    t.needsUpdate = true
    t.minFilter = THREE.LinearFilter
    t.magFilter = THREE.LinearFilter
    t.generateMipmaps = false
  }
  t.colorSpace =
    kind.endsWith('detail') || kind === 'lightning-bolt' ? THREE.NoColorSpace : THREE.SRGBColorSpace
  t.wrapT = THREE.RepeatWrapping
  t.wrapS = THREE.RepeatWrapping
  t.anisotropy = 8
  if (kind === 'atlas' || kind === 'sky' || kind === 'clouds' || kind === 'clouds-high') {
    // 0x47cc60 / 0x47d6f0: ordinary smoothed textures use bilinear
    // filtering of encoded palette colors, without mipmaps or anisotropy.
    t.colorSpace = THREE.NoColorSpace
    t.userData.encodedColors = true
    t.minFilter = THREE.LinearFilter
    t.magFilter = THREE.LinearFilter
    t.generateMipmaps = false
    t.anisotropy = 1
  }
  if (
    kind === nativeUnits.atlas ||
    kind === 'effects' ||
    kind === 'selection' ||
    kind === 'unit-health'
  ) {
    t.minFilter = THREE.NearestFilter
    t.magFilter = THREE.NearestFilter
    t.generateMipmaps = false
  }
  const result = { texture: t, ready }
  textures.set(kind, result)
  return result
}
function effectFrame(sprite: THREE.Sprite, frame: { index: number; w: number; h: number }) {
  const uv = (sprite.userData.atlasTransform ??= new THREE.Vector4())
  uv.set(
    frame.w / nativeEffects.width,
    frame.h / nativeEffects.height,
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
    g.setAttribute('painterBias', new THREE.Float32BufferAttribute(modelDepthBias(data, stage), 1))
    g.setAttribute(
      'textureMode',
      new THREE.Float32BufferAttribute(modelTextureModes(data, stage), 1)
    )
    g.setAttribute(
      'nativeWaveOffset',
      new THREE.Float32BufferAttribute(new Float32Array((p.length / 3) * 2), 2)
    )
    g.computeVertexNormals()
    return g
  })
  const mesh = new THREE.Mesh(
    geo.clone(),
    // Native screen-space winding is clockwise after the WebGL Y inversion.
    // 0x4708d0 culls rear faces; 0x471c40 keeps both construction-stage sides.
    new THREE.MeshBasicMaterial({
      map: texture('atlas'),
      side: stage === 4 ? THREE.BackSide : THREE.DoubleSide,
      alphaTest: 0.5,
    })
  )
  mesh.scale.setScalar(scale)
  mesh.material.defines = { USE_MODEL_WAVE: '' }
  mesh.userData.nativeModel = id
  mesh.userData.stage = stage
  mesh.userData.nativeScale = data.scale
  mesh.userData.highlight = { value: 0 }
  mesh.material.onBeforeCompile = shader => {
    shader.uniforms.modelHighlight = mesh.userData.highlight
    shader.vertexShader =
      `attribute float faceShade;
attribute vec3 faceAnchor;
attribute float textureMode;
varying float modelLight;
varying float modelTextureMode;
` + shader.vertexShader
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      modelTextureMode=textureMode;
      ivec3 anchor=ivec3(faceAnchor);
      anchor=ivec3(nativeMul(anchor.x,int(nativeObjectScale)),nativeMul(anchor.y,int(nativeObjectScale)),nativeMul(anchor.z,int(nativeObjectScale)))>>8;
      anchor=(ivec3(nativeDot(anchor,nativeObjectBasis[0]),nativeDot(anchor,nativeObjectBasis[1]),nativeDot(anchor,nativeObjectBasis[2]))>>14)+nativeOrigin(modelMatrix[3].xyz);
      int depth=nativeDot(anchor,nativeBasis[2])>>14;
      modelLight=float(depth>-3328?max(1,int(faceShade)+nativeMul(-3328-depth,32)/8192):int(faceShade));
    `
    )
    shader.fragmentShader =
      'uniform float modelHighlight;\nvarying float modelLight;\nvarying float modelTextureMode;\n' +
      shader.fragmentShader
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <colorspace_fragment>',
      `
      #include <colorspace_fragment>
      int shade=int(modelLight+.5), strength=clamp(shade*5-160,0,256);
      vec3 highlight=vec3((ivec3(253,185,53)*strength)>>8)/255.;
      float diffuse=modelHighlight>0.?modelHighlight:float(shade<32?shade*8:255);
      // 0x4673b0 overrides diffuse after lighting, retaining numeric specular.
      if(modelTextureMode==3.||modelTextureMode==4.||modelTextureMode==32.)diffuse=255.;
      gl_FragColor.rgb=gl_FragColor.rgb*diffuse/255.+(modelHighlight>0.?vec3(0.):highlight);
    `
    )
  }
  mesh.material.customProgramCacheKey = () => 'native-model-light'
  return mesh
}

function updateModelLighting(object: THREE.Object3D) {
  if (!(object instanceof THREE.Mesh) || object.userData.nativeModel === undefined) return
  const { nativeModel: id, nativeSize, stage } = object.userData,
    heading = object.parent?.userData.nativeHeading ?? 0,
    tilt = object.parent?.userData.nativeTilt ?? 0,
    roll = object.parent?.userData.nativeRoll ?? 0,
    position = object.geometry.getAttribute('position') as THREE.BufferAttribute,
    key = `${heading}-${tilt}-${roll}-${nativeSize}-${position.version}`
  const wave = object.parent?.userData.nativeWave as
      | { phase: number; origin: number; x: number; y: number }
      | undefined,
    waveKey = wave
      ? `${wave.phase}-${wave.origin}-${wave.x}-${wave.y}-${heading}-${tilt}-${roll}-${nativeSize}-${position.version}`
      : '0'
  if (object.userData.waveKey !== waveKey) {
    const attribute = object.geometry.getAttribute('nativeWaveOffset') as THREE.BufferAttribute
    attribute.array.fill(0)
    if (wave)
      attribute.array.set(
        modelWaveOffsets(
          nativeModels[id],
          position.array,
          nativeSize ?? nativeModels[id].scale,
          heading,
          wave,
          wave.origin,
          wave.phase,
          tilt,
          roll
        )
      )
    attribute.needsUpdate = true
    object.userData.waveKey = waveKey
  }
  if (object.userData.lightKey === key) return
  const { shades, anchors } = modelLighting(
    nativeModels[id],
    position.array,
    stage,
    heading,
    nativeSize,
    tilt,
    roll
  )
  for (const [name, values, size] of [
    ['faceShade', shades, 1],
    ['faceAnchor', anchors, 3],
  ] as const) {
    const attribute = object.geometry.getAttribute(name) as THREE.BufferAttribute | undefined
    if (attribute) {
      attribute.array.set(values)
      attribute.needsUpdate = true
    } else object.geometry.setAttribute(name, new THREE.Float32BufferAttribute(values, size))
  }
  object.userData.lightKey = key
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
function makeUnit(u: Unit) {
  const g = new THREE.Group()
  const shadow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture('effects'),
      alphaTest: 0.5,
      depthWrite: false,
      toneMapped: false,
    })
  )
  effectFrame(shadow, nativeEffects.animations.unitShadow[0])
  shadow.visible = false
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
  // Six native rectangles share one atlas quad; transparent ordering stays with
  // this person in the existing painter, including terrain and spell occlusion.
  const health = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture('unit-health'), depthWrite: false, toneMapped: false })
  )
  health.visible = false
  health.userData.atlasTransform = new THREE.Vector4()
  g.add(health)
  g.userData = {
    unit: u.id,
    owner: u.team === 'blue' ? 0 : u.team === 'red' ? 1 : -1,
    signature: `${u.team}-${u.kind}`,
    layers: [],
    shadow,
    selection,
    health,
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
  g.userData = { building: b.id, signature: `${id}-${stage}`, health, healthFill }
  return g
}

function updateWaveShake(
  group: THREE.Group,
  source: { shake?: number; shakeOrigin?: number },
  point: { x: number; y: number },
  frame: number,
  started: WeakMap<object, number>
) {
  if (!source.shake || source.shakeOrigin === undefined) {
    delete group.userData.nativeWave
    started.delete(source)
    return
  }
  if (!started.has(source)) started.set(source, frame)
  const phase = frame - started.get(source)! + 1
  if (phase > 3) {
    source.shake = 0
    started.delete(source)
    delete group.userData.nativeWave
  } else group.userData.nativeWave = { phase, origin: source.shakeOrigin, ...point }
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
    // Native sky commands precede land and receive a farther depth (0x47c7e0).
    // Draw before other transparent objects, with opaque land still occluding it.
    this.skyFlash.renderOrder = -10000
    this.skyFlash.frustumCulled = false
    this.skyFlash.userData.nativeIgnore = true
    this.skyFlash.visible = false
    this.scene.add(this.skyFlash)
    this.skyBackdrop.renderOrder = -10003
    this.skyBackdrop.frustumCulled = false
    this.skyBackdrop.userData.nativeIgnore = true
    this.scene.add(this.skyBackdrop)
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
  }

  commitSky(camera: { x: number; y: number; angle: number }, remainder: number) {
    if (!this.skyLoaded) {
      updateSkyArray(this.skyOwned, camera, 0, this.skyGrid)
      this.skyLoaded = true
    }
    remainder = Math.max(0, remainder)
    advanceSkyMotion(this.skyOwned, camera, Math.max(0, this.skyRemainder - remainder))
    this.skyRemainder = remainder
  }
  updateSky() {
    const camera = {
      x: (this.viewPoint.x + 8) * 256,
      y: (-this.viewPoint.z - 8) * 256,
      angle: (this.cameraBearing * 1024) / Math.PI,
    }
    if (!this.skyLoaded || (this.world.paused && (this.wasFlying || this.resultCamera.active)))
      this.commitSky(camera, 0)
    Object.assign(this.skyMotion, this.skyOwned)
    advanceSkyMotion(this.skyMotion, camera, this.skyRemainder)
    fillSkyArray(
      this.skyGrid,
      Math.round(this.skyMotion.angle) & 2047,
      Math.trunc(this.skyMotion.x * 512),
      Math.trunc(this.skyMotion.y * 512)
    )
    const width = this.container.clientWidth,
      height = this.container.clientHeight
    if (!width || !height) return
    // Keep the native horizon/UV scale. Wide views can expose space below it;
    // extend the backdrop edge color there without stretching clouds or terrain.
    const horizon = this.view.config.horizon
    this.skyBackdrop.visible = !this.overviewActive
    this.skyBackdrop.material.uniforms.height.value = horizon / height
    for (const [i, mesh] of this.skyClouds.entries()) {
      mesh.visible = this.skyBackdrop.visible && horizon > 0
      if (!mesh.visible) continue
      // ponytail: the browser battlefield is the render surface. Its HUD is
      // outside that surface, so include the original optional left strip.
      // Restore native offsets when the original UI layout is integrated.
      const layer = skyCloudLayer(
        this.skyGrid,
        width,
        height,
        horizon,
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
      fade.needsUpdate = true
      uv.needsUpdate = true
      position.needsUpdate = true
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
    this.world.lightView = nativePosition(this.world, this.viewPoint)
    this.view.globeBlend = this.overviewActive ? this.globeMorph.value : 0
    this.view.globeFlatScale = this.overviewStage === 'exit' ? 18 : 21
    this.view.update(
      this.container.clientWidth,
      this.container.clientHeight,
      this.viewPoint,
      this.cameraBearing,
      this.viewZoom,
      this.overviewActive,
      document.documentElement.clientWidth,
      this.viewTransition?.config ?? (this.viewPreset ? this.currentPreset() : undefined)
    )
  }
  currentPreset() {
    return cameraPreset(
      cameraConfigIndex(document.documentElement.clientWidth, this.container.clientHeight),
      this.viewPreset
    )
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
    const w = this.world
    let geo = this.terrain.geometry
    if (geo.getAttribute('position')?.count !== 128 * 128 * 6) {
      geo.dispose()
      geo = new THREE.BufferGeometry()
      for (const [name, size] of [
        ['position', 3],
        ['uv', 2],
        ['landUv', 2],
        ['surface', 1],
        ['light', 3],
        ['highlight', 3],
      ] as const)
        geo.setAttribute(
          name,
          new THREE.Float32BufferAttribute(new Float32Array(128 * 128 * 6 * size), size)
        )
      this.terrain.geometry = geo
    }
    const positions = geo.getAttribute('position'),
      uv = geo.getAttribute('uv'),
      landUV = geo.getAttribute('landUv'),
      surfaces = geo.getAttribute('surface')
    let vertex = 0
    const [low, high] = terrainTextureBounds(32)
    for (let z = -128; z < 128; z += 2)
      for (let x = -128; x < 128; x += 2) {
        const i = this.landIndex(x, z + 2),
          sea = Number(waterCell(w.land, i))
        const corners =
          w.land.flags[i] & 1
            ? [
                [0, 0],
                [1, 1],
                [1, 0],
                [0, 0],
                [0, 1],
                [1, 1],
              ]
            : [
                [0, 0],
                [0, 1],
                [1, 0],
                [1, 0],
                [0, 1],
                [1, 1],
              ]
        for (const [dx, dz] of corners) {
          const px = x + dx * 2,
            pz = z + dz * 2
          positions.setXYZ(vertex, px, w.land.heights[this.landIndex(px, pz)] / 128, pz)
          uv.setXY(vertex, px, pz)
          // Each original terrain texture has its own inset endpoints. Keep
          // these separate from world coordinates used by the scrolling sea.
          landUV.setXY(
            vertex,
            ((x + 128) / 2 + low + dx * (high - low)) / 128,
            ((z + 128) / 2 + low + dz * (high - low)) / 128
          )
          surfaces.setX(vertex, sea)
          vertex++
        }
      }
    for (const attribute of [positions, uv, landUV, surfaces]) attribute.needsUpdate = true
    geo.boundingBox = null
    geo.boundingSphere = null
    // Two unsigned wave samples divided by eight produce heights from 0 to 63.
    this.view.terrainHeights = [Math.min(0, ...w.land.heights), Math.max(63, ...w.land.heights)]
    this.updateView()
    this.terrainVersion = w.landVersion
    this.waterState = ''
    for (const d of this.decorations.children) {
      const p = d.userData.point as Point | undefined
      if (p) {
        this.locate(d, p)
        d.visible = walkable(w.terrain, p)
      }
      const stone = d.userData.groundPoint as Point | undefined
      if (stone) d.position.y = terrainPointHeight(w.land, nativePosition(w, stone)) / 128
    }
  }
  updateTerrainTexture() {
    if (!this.terrainTextures) return
    const w = this.world,
      marks = w.footprints
    const terrainChanged =
      this.terrainMapVersion !== w.landVersion ||
      !w.land.shadows.every((v, i) => v === this.terrainShadows[i])
    let fullUpload = false
    if (terrainChanged) {
      this.terrainAtlasState = terrainAtlas(
        w.land,
        this.terrainTextures,
        this.terrainAtlasState,
        32,
        marks.pixels
      )
      fullUpload = this.terrainAtlasState.updated > 0
      this.terrainMapVersion = w.landVersion
      this.terrainShadows.set(w.land.shadows)
    }
    if (!this.terrainAtlasState || (!fullUpload && !marks.dirty.size)) return
    this.terrainMap.image = { data: this.terrainAtlasState.pixels, width: 4096, height: 4096 }
    // An unbound DataTexture supplies CPU pixels directly: one subimage upload
    // per tile, with no staging copies, extra draw calls or 64 MiB atlas upload.
    this.terrainUpload.image = this.terrainMap.image
    const region = new THREE.Box2()
    updateFootprintTiles(this.terrainAtlasState, w.land, this.terrainTextures, marks, (x, y) => {
      if (fullUpload) return
      region.min.set(x, y)
      region.max.set(x + 32, y + 32)
      this.renderer.copyTextureToTexture(this.terrainUpload, this.terrainMap, region, region.min)
    })
    marks.dirty.clear()
    if (fullUpload) this.terrainMap.needsUpdate = true
  }
  landIndex(x: number, z: number) {
    return ((Math.round((-z - 8) / 2) & 127) << 7) | (Math.round((x + 8) / 2) & 127)
  }
  updateWater() {
    if (!this.waves) return
    const w = this.world,
      key = `${w.turn}:${w.landVersion}:${w.lightRevision}:${this.terrain.geometry.id}`
    if (key === this.waterState) return
    this.waterState = key
    // ponytail: simulation turns feed both clocks until the native outer
    // command loop is live; the original texture uses its separate outer turn.
    this.waterScroll.value = (w.turn & 255) / 256
    const pos = this.terrain.geometry.getAttribute('position'),
      surface = this.terrain.geometry.getAttribute('surface'),
      light = this.terrain.geometry.getAttribute('light'),
      highlight = this.terrain.geometry.getAttribute('highlight')
    for (let j = 0; j < pos.count; j++) {
      const i = this.landIndex(pos.getX(j), pos.getZ(j)),
        p = waterPoint(w.land, i, w.turn, this.waves)
      // 0x4673b0 uses the same diffuse conversion on coast and land; only
      // open-water triangles suppress the additive warm light channel.
      const colors = vertexLighting(p.color, surface.getX(j) ? 0 : 0xfdb935)
      pos.setY(j, p.height / 128)
      light.setXYZ(
        j,
        ((colors.diffuse >>> 16) & 255) / 255,
        ((colors.diffuse >>> 8) & 255) / 255,
        (colors.diffuse & 255) / 255
      )
      highlight.setXYZ(
        j,
        ((colors.specular >>> 16) & 255) / 255,
        ((colors.specular >>> 8) & 255) / 255,
        (colors.specular & 255) / 255
      )
    }
    highlight.needsUpdate = true
    light.needsUpdate = true
    pos.needsUpdate = true
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
        this.locate(g, tree)
        g.userData.point = tree
        this.decorations.add(g)
        continue
      }
      const g = new THREE.Group()
      g.add(nativeModel(rules.sceneryObjects[tree.model]))
      this.locate(g, tree)
      g.userData.point = tree
      this.decorations.add(g)
    }
    for (const center of [HOME, ENEMY]) {
      const stones = reincarnationStones(this.world.land, nativePosition(this.world, center))
      for (const stone of stones) {
        const group = new THREE.Group()
        group.name = 'reincarnation-stone'
        group.userData.groundPoint = browserPosition(stone)
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
    // A changed input, mouse drag or focus request starts at the displayed view.
    if (this.cameraPreviewButtons !== null) {
      this.cameraTime = 0
      Object.assign(this.skyOwned, this.skyMotion)
      this.skyRemainder = 0
    }
    this.cameraPreviewButtons = null
    this.cameraPosition = {
      x: Math.round((this.viewPoint.x + 8) * 256) & 65535,
      y: Math.round((-this.viewPoint.z - 8) * 256) & 65535,
      angle: Math.round((this.cameraBearing * 1024) / Math.PI) & 2047,
    }
  }
  skipIntroduction() {
    interruptFlyby(this.world.flyby, this.flybyCamera)
    if (!(this.world.flyby.flags & 1)) this.world.inputMask &= ~64
    this.onChange()
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
    const w = this.world,
      s = this.resultCamera,
      motion = this.cameraMotion
    let buttons = this.navigationButtons()
    if (this.cameraPreviewButtons !== null) {
      if (buttons !== this.cameraPreviewButtons || this.resultRequest !== w.outcome.cameraRequest)
        this.captureCamera()
      else {
        // Do not feed a rendered fraction back into the next native step.
        this.viewPoint = browserPosition(this.cameraPosition)
        this.cameraBearing = (this.cameraPosition.angle * Math.PI) / 1024
        this.cameraPreviewButtons = null
      }
    }
    if (this.resultRequest !== w.outcome.cameraRequest) {
      this.resultRequest = w.outcome.cameraRequest
      if (!s.active) {
        this.cancelOverview()
        this.captureCamera()
      }
      // ponytail: first-mission tribe origins and no replay file mode; the
      // shared native tribe/camera store replaces this presentation adapter.
      beginResultCamera(
        s,
        w.manaWorld.gameFlags,
        0,
        this.cameraPosition,
        nativePosition(w, w.outcome.cameraTribe === 0 ? HOME : ENEMY)
      )
    }
    let active = !!(s.active || motion.active)
    if (!active) this.captureCamera()
    if (buttons & 15) {
      motion.active = 0
      w.mode = null
      this.tooltip.draw = 0
    }
    this.skyRemainder += dt
    // Use the existing 24 Hz presentation convention until draw_main's frame
    // throttling and its shared camera/flyby ordering are fully integrated.
    if (!w.paused || !s.active) {
      this.cameraTime += dt
      while (this.cameraTime + 1e-9 >= 1 / 24) {
        this.stepViewChange()
        buttons = this.navigationButtons()
        if (!w.inputMask && !this.overviewStage && !document.querySelector('dialog[open]')) {
          if (buttons || Object.values(this.cameraVelocity).some(Boolean)) {
            if (buttons & 15) {
              motion.active = 0
              w.mode = null
              this.tooltip.draw = 0
            }
            // Native momentum-off mode. The original settings menu and
            // frame-rate/input scaling lifecycle are still presentation adapters.
            const angle = this.cameraPosition.angle
            if (this.overviewActive) this.cameraPosition.angle = 0
            stepCameraInput(this.cameraPosition, this.cameraVelocity, buttons, 24)
            if (this.overviewActive) {
              this.cameraPosition.angle = angle
              if (buttons & 15) {
                const drag = this.globeMotion
                drag.position.x += ((this.cameraPosition.x - drag.position.x) << 16) >> 16
                drag.position.y += ((this.cameraPosition.y - drag.position.y) << 16) >> 16
                drag.velocity = { x: 0, y: 0 }
                this.globe.moveStars(this.cameraPosition)
              }
            }
            active = true
          }
          if (this.overviewActive && !s.active) {
            const drag = this.globeMotion
            if (drag.dragging || drag.velocity.x || drag.velocity.y) {
              const delta = stepGlobeMotion(drag, this.globePointer, this.container.clientHeight)
              this.cameraPosition.x = drag.position.x & 65535
              this.cameraPosition.y = drag.position.y & 65535
              this.globe.moveStars(this.cameraPosition, delta)
              active = true
            }
          }
        }
        const context = { skyCounter: w.outcome.skyCounter, newTurn: this.resultTurn !== w.turn }
        this.resultTurn = w.turn
        stepResultCamera(s, motion, this.cameraPosition, context, {
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
          sound: () => sound(w, 0xa2, browserPosition(this.cameraPosition)),
        })
        w.outcome.skyCounter = context.skyCounter
        stepCameraMotion(motion, this.cameraPosition, this.overviewActive ? 2 : 0, {
          rotate: () => {},
          globe: () => {},
        })
        this.cameraTime = Math.max(0, this.cameraTime - 1 / 24)
        if (!(w.flyby.flags & 1)) this.commitSky(this.cameraPosition, this.cameraTime)
      }
    }
    w.outcome.cameraPlaying = !!s.active
    if (active) {
      if (s.active) {
        this.overviewActive = false
      }
      this.viewPoint = browserPosition(this.cameraPosition)
      this.cameraBearing = (this.cameraPosition.angle * Math.PI) / 1024
    }
    if (this.previewCamera(buttons)) active = true
    if (active) this.updateView()
    return active
  }
  previewCamera(buttons: number) {
    if (
      (!buttons && !this.cameraMotion.active) ||
      buttons !== this.navigationButtons() ||
      this.cameraTime <= 1e-9 ||
      this.resultCamera.active ||
      this.overviewActive ||
      this.overviewStage ||
      this.viewTransition ||
      this.world.flyby.flags & 1
    )
      return false
    // Preview one native step without advancing its state or side effects.
    // The focus controller replaces schedules but does not mutate their rows,
    // so a shallow copy is sufficient; no per-frame deep clone is needed.
    const next = { ...this.cameraPosition }
    stepCameraInput(next, { ...this.cameraVelocity }, buttons, 24)
    stepCameraMotion({ ...this.cameraMotion }, next, 0, { rotate: () => {}, globe: () => {} })
    const preview = interpolateCamera(this.cameraPosition, next, this.cameraTime * 24)
    // Keep browserPosition's canonical map copy without truncating the fraction.
    const wrap = (n: number) => THREE.MathUtils.euclideanModulo(n + 128, 256) - 128
    this.viewPoint = { x: wrap(preview.x / 256 - 8), z: -wrap(preview.y / 256 + 8) }
    this.cameraBearing = (preview.angle * Math.PI) / 1024
    this.cameraPreviewButtons = buttons
    return true
  }
  updateFlyby(dt: number) {
    const state = this.world.flyby,
      active = !!(state.flags & 1)
    if (active && !this.wasFlying) {
      this.cancelOverview()
      this.viewPreset = 0
      this.viewTransition = null
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
      while (this.flybyTime + 1e-9 >= 1 / 24) {
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
        this.flybyTime = Math.max(0, this.flybyTime - 1 / 24)
        if (active) this.commitSky(this.flybyCamera, this.flybyTime)
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
    if (!this.overviewActive && !this.overviewStage) return
    this.cameraBearing = this.overviewReturn.bearing
    this.viewPreset = this.overviewReturn.preset
    this.viewTransition = null
    this.overviewStage = null
    this.overviewActive = false
    this.globeMorph.active = false
  }
  chooseFollowers(
    model: number,
    modifiers: { shiftKey: boolean; ctrlKey: boolean },
    focus = false
  ) {
    const w = this.world
    if (w.inputMask || this.overviewStage) return
    if (!focus && (this.overviewActive || w.manaWorld.gameFlags & 32)) return
    if (model === 7 && w.units.some(u => u.team === 'blue' && u.kind === 'shaman' && u.hp > 0))
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
    if (animate && this.world.inputMask) return
    this.cancelOverview()
    this.captureCamera()
    requestCameraFocus(
      this.cameraMotion,
      this.cameraPosition,
      {
        ...nativePosition(this.world, p),
        angle: -1,
      },
      !animate
    )
    this.world.mode = null
    this.tooltip.draw = 0
    if (!animate) {
      this.viewPoint = browserPosition(this.cameraPosition)
      this.updateView()
    }
  }
  stepViewChange() {
    if (this.world.inputMask) return
    if (this.viewTransition && !this.overviewActive) {
      this.viewTransition.remaining = stepViewTransition(
        this.viewTransition.config,
        this.currentPreset(),
        this.viewTransition.remaining,
        viewTransitionFrames(24)
      )
      const angle = this.viewTransition.angle
      if (angle) {
        this.cameraPosition.angle = this.viewTransition.remaining
          ? (this.cameraPosition.angle + angle.increment) & 2047
          : angle.target
        this.cameraBearing = (this.cameraPosition.angle * Math.PI) / 1024
      }
      if (!this.viewTransition.remaining) {
        this.viewTransition = null
        if (this.overviewStage === 'enter') {
          this.overviewActive = true
          beginGlobeMorph(this.globeMorph, true)
        } else this.overviewStage = null
      }
      this.updateView()
    }
    if (this.overviewActive && this.globeMorph.active) {
      stepGlobeMorph(this.globeMorph)
      if (!this.globeMorph.active) {
        if (this.overviewStage === 'exit') {
          this.overviewActive = false
          this.startGroundView(this.overviewReturn.preset, this.overviewReturn.bearing)
        } else this.overviewStage = null
      }
      this.updateView()
    }
  }
  startGroundView(preset: number, bearing?: number) {
    if (this.cameraPreviewButtons !== null) this.captureCamera()
    const frames = viewTransitionFrames(24)
    this.viewPreset = preset
    this.viewZoom = 0
    this.viewTransition = {
      config: { ...this.view.config, bounds: [...this.view.config.bounds] },
      remaining: frames,
    }
    if (bearing !== undefined) {
      const target = Math.round((bearing * 1024) / Math.PI) & 2047
      let distance = target - this.cameraPosition.angle
      if (Math.abs(distance) > 1024) distance += distance < 0 ? 2048 : -2048
      this.viewTransition.angle = { target, increment: Math.trunc(distance / frames) }
    }
    this.updateView()
  }
  overview() {
    if (this.world.inputMask || this.overviewStage) return
    if (this.overviewActive) {
      this.leaveOverview(this.overviewReturn.preset)
      return
    }
    this.captureCamera()
    this.overviewReturn = { preset: this.viewPreset, bearing: this.cameraBearing }
    this.overviewStage = 'enter'
    this.globeMotion.dragging = false
    this.globeMotion.velocity = { x: 0, y: 0 }
    this.globeMotion.position = { ...this.view.center }
    this.world.mode = null
    this.cameraMotion.active = 0
    this.startGroundView(4, 0)
  }
  leaveOverview(preset: number) {
    this.overviewReturn.preset = preset
    this.overviewStage = 'exit'
    this.globeMotion.dragging = false
    this.globeMotion.velocity = { x: 0, y: 0 }
    beginGlobeMorph(this.globeMorph, false)
    this.world.mode = null
  }
  zoom(inward: boolean) {
    if (this.world.inputMask || this.overviewStage) return
    const preset = zoomPreset(this.overviewActive ? 4 : this.viewPreset, inward)
    if (preset === 4) {
      if (!this.overviewActive) this.overview()
      return
    }
    if (this.overviewActive) {
      this.leaveOverview(preset)
      return
    }
    if (preset !== this.viewPreset) this.startGroundView(preset)
  }
  animatePerson(
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
    const frame = nativeUnits.frames[index]
    g.userData.frame = index
    g.userData.frameFlip = cycle.flip
    const shaman = g.userData.signature?.endsWith('shaman') || g.userData.shaman,
      flags = this.view.config.scaledSprites ? 0x100 : 0,
      depth = this.view.project(g.position, (g.position.y * 128) / 45).z,
      bucket = spriteBucket(depth, g.userData.depthBias ?? -300) * (shaman ? -1 : 1)
    g.userData.spriteBucket = bucket
    const size = (n: number) =>
      shaman || flags ? spriteCoordinate(n, bucket, flags, this.view.config) : n
    g.userData.nativeFrameHeight = frame.nativeHeight
    g.userData.frameHeight = size(frame.nativeHeight)
    const descriptor = rules.animationDescriptors[g.userData.draw ?? 14]
    const draws = spriteLayers(
      frame.layers,
      nativeUnits.pieces,
      {
        owner: shaman ? -1 : g.userData.owner,
        person: descriptor.person,
        variant: descriptor.variant,
        flags: (g.userData.drawFlags ?? 0) | (cycle.flip ? 1 : 0),
        bucket,
        scale: !!(shaman || flags),
        levelFlags: flags,
      },
      this.view.config
    )
    const layers = g.userData.layers as THREE.Sprite[]
    const bounds = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity }
    for (let i = 0; i < draws.length; i++) {
      const draw = draws[i]
      let layer = layers[i]
      if (!layer) {
        layer = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: texture(nativeUnits.atlas),
            alphaTest: 0.5,
            depthWrite: true,
            toneMapped: false,
          })
        )
        layer.userData.atlasTransform = new THREE.Vector4()
        layers.push(layer)
        g.add(layer)
      }
      layer.visible = draw.w > 0 && draw.h > 0
      layer.userData.piece = draw.piece
      if (!layer.visible) continue
      const piece = nativeUnits.pieces[draw.piece],
        uv = (layer.userData.atlasTransform ??= new THREE.Vector4()),
        flip = !!(draw.flags & 1)
      uv.set(
        (flip ? -piece.w : piece.w) / nativeUnits.width,
        piece.h / nativeUnits.height,
        ((draw.piece % nativeUnits.columns) * cell + (flip ? piece.w : 0)) / nativeUnits.width,
        1 - (Math.floor(draw.piece / nativeUnits.columns) * cell + piece.h) / nativeUnits.height
      )
      layer.center.set(-draw.x / draw.w, 1 + draw.y / draw.h)
      layer.scale.set(draw.w, draw.h, 1)
      bounds.left = Math.min(bounds.left, draw.x)
      bounds.top = Math.min(bounds.top, draw.y)
      bounds.right = Math.max(bounds.right, draw.x + draw.w)
      bounds.bottom = Math.max(bounds.bottom, draw.y + draw.h)
    }
    for (let i = draws.length; i < layers.length; i++) layers[i].visible = false
    g.userData.bounds = bounds
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
          bucket,
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
  }
  makeFx(f: Effect) {
    const g = new THREE.Group()
    if (f.swamp) {
      const pool = new THREE.Mesh(
        new THREE.CircleGeometry(2.8, 32),
        new THREE.MeshBasicMaterial({ color: 0x26351f, transparent: true, opacity: 0.78 })
      )
      pool.name = 'swamp-trap'
      pool.rotation.x = -Math.PI / 2
      pool.position.y = 0.02
      g.add(pool)
      return g
    }
    if (f.tornado) {
      g.name = 'tornado'
      for (const _ of f.tornado.particles) {
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: texture('effects'),
            transparent: true,
            depthWrite: false,
            toneMapped: false,
          })
        )
        sprite.userData.atlasTransform = new THREE.Vector4(1, 1, 0, 0)
        sprite.center.set(0.5, 0)
        g.add(sprite)
      }
      return g
    }
    if (f.wave || f.bridge || f.flatten || f.erosion || f.firestorm || f.earthquake) return g
    if (f.sinking) {
      const mesh = nativeModel(f.sinking.object, 2, f.sinking.stage)
      mesh.name = 'sinking-building'
      g.add(mesh)
      return g
    }
    if (f.fire) {
      const mesh = nativeModel(5)
      mesh.material.transparent = true
      mesh.material.alphaTest = 0
      mesh.material.depthWrite = false
      mesh.name = 'scenery-fire'
      g.add(mesh)
      return g
    }
    if (f.debris) {
      if (!f.debris.visible) return g
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(debrisVertices(f.debris), 3)
      )
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(f.debris.uv, 2))
      g.add(
        new THREE.Mesh(
          geometry,
          new THREE.MeshBasicMaterial({
            map: texture('atlas'),
            side: THREE.DoubleSide,
            alphaTest: 0.5,
          })
        )
      )
      return g
    }
    this.locate(g, f, f.height)
    if (f.kind === 'gift') {
      const gift = f as Gift,
        directions = Array.from({ length: 8 }, () => ({ frames: [gift.frame], flip: false })),
        glow = new THREE.Group()
      g.name = 'worship-reward'
      g.userData.layers = []
      g.userData.owner = 0
      g.userData.draw = 0
      g.userData.drawFlags = 6
      g.userData.directions = directions
      glow.name = 'worship-reward-glow'
      glow.position.y = -80 / 128
      glow.userData.layers = []
      glow.userData.owner = -1
      glow.userData.draw = 43
      glow.userData.drawFlags = 4
      glow.userData.directions = Array.from({ length: 8 }, () => ({ frames: [1417], flip: false }))
      g.userData.glow = glow
      g.add(glow)
      return g
    }
    if (f.reincarnation) {
      g.name = 'reincarnation-effect'
      g.userData.layers = []
      g.userData.owner = f.reincarnation.team === 'blue' ? 0 : 1
      g.userData.draw = 14
      g.userData.directions = Array.from({ length: 8 }, () => ({ frames: [680], flip: false }))
      return g
    }
    if (f.unit) {
      g.userData.layers = []
      g.userData.owner = f.unit.team === 'blue' ? 0 : f.unit.team === 'red' ? 1 : -1
      g.userData.draw = f.unit.kind === 'preacher' ? 16 : f.unit.kind === 'warrior' ? 15 : 14
      g.userData.drawFlags = f.corpse ? 0 : 2
      g.userData.shaman = f.unit.kind === 'shaman'
      if (f.corpse)
        g.userData.directions = Array.from({ length: 8 }, () => ({ frames: [304], flip: false }))
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
        map: texture('effects'),
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      })
    )
    sprite.userData.atlasTransform = new THREE.Vector4(1, 1, 0, 0)
    sprite.center.set(0.5, 0)
    if (f.smoke)
      sprite.material.color.setStyle(`rgb(${nativeEffects.buildingSmokeColor.join(',')})`)
    g.add(sprite)
    g.userData.sprite = sprite
    g.userData.sequence = sequence
    if (f.smoke) g.userData.depthBias = -128
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
    const displacement =
      f.animation && 'displacement' in f.animation ? f.animation.displacement : undefined
    if (displacement) {
      const to = { x: f.x, y: (f.height! * 45) / 128, z: f.z }
      const from = {
        x: f.x - displacement.x / 256,
        y: to.y - displacement.h / 128,
        z: f.z + displacement.y / 256,
      }
      g.position.copy(
        interpolateUnitPosition(from, to, Math.min(1, this.world.pendingTime * TURNS_PER_SECOND))
      )
      g.userData.cellPosition = f
    }
    if (f.tornado) {
      const frames = nativeEffects.animations.smoke,
        short = (n: number) => (n << 16) >> 16
      for (let i = 0; i < g.children.length; i++) {
        const sprite = g.children[i] as THREE.Sprite,
          particle = f.tornado.particles[i]
        sprite.visible = !!particle
        if (!particle) continue
        sprite.position.set(
          short(particle.x - f.tornado.x) / 256,
          (particle.h - f.tornado.h) / 128,
          -short(particle.y - f.tornado.y) / 256
        )
        effectFrame(sprite, frames[(this.world.turn + i) % frames.length])
        sprite.material.opacity = f.tornado.phase ? Math.min(1, f.tornado.remaining / 12) : 0.9
      }
      return
    }
    if (f.wave || f.bridge || f.flatten || f.erosion || f.swamp || f.firestorm || f.earthquake)
      return
    if (f.sinking) {
      g.userData.nativeHeading = f.sinking.angle
      g.userData.nativeTilt = f.sinking.tilt
      g.userData.nativeRoll = f.sinking.roll
      return
    }
    if (f.fire) {
      const mesh = g.children[0] as THREE.Mesh
      mesh.userData.nativeSize = f.fire.scale
      const uv = mesh.geometry.getAttribute('uv') as THREE.BufferAttribute
      uv.array.set(fireUV(f.fire.frame))
      uv.needsUpdate = true
      // Camera fields still come from the browser view; native object counters
      // will own the stagger once class-5 scheduling is integrated.
      if (g.userData.facingTurn !== this.world.turn >> 3) {
        g.userData.facingTurn = this.world.turn >> 3
        f.fire.heading = fireHeading(f.fire, {
          ...this.view.center,
          angle: Math.round((this.cameraBearing * 1024) / Math.PI) & 2047,
        })
      }
      g.userData.nativeHeading = f.fire.heading
      return
    }
    if (f.debris) {
      if (!f.debris.visible) return
      const mesh = g.children[0] as THREE.Mesh
      const positions = mesh.geometry.getAttribute('position') as THREE.BufferAttribute
      positions.array.set(debrisVertices(f.debris))
      positions.needsUpdate = true
      return
    }
    if (f.kind === 'gift') {
      g.visible = (f as Gift).phase > 0
      if (g.visible) {
        this.animatePerson(g, 0, g.userData.directions, 0)
        const glow = g.userData.glow as THREE.Group
        this.animatePerson(glow, 0, glow.userData.directions, 0)
      }
      return
    }
    if (f.reincarnation) {
      const frame = f.reincarnation.phase === 0 ? 680 : f.reincarnation.phase === 1 ? 352 : 360,
        directions = g.userData.directions as { frames: number[]; flip: boolean }[]
      if (g.userData.frame !== frame)
        for (const direction of directions) direction.frames[0] = frame
      g.userData.drawFlags = f.reincarnation.phase >= 3 ? 6 : 0
      this.animatePerson(g, 0, directions, 0)
      return
    }
    if (f.unit) {
      if (f.corpse) {
        const frame = f.corpse.phase === 0 ? 304 : f.corpse.phase === 1 ? 312 : 320,
          directions = g.userData.directions as { frames: number[]; flip: boolean }[]
        g.visible = f.corpse.phase < 4
        if (!g.visible) return
        if (g.userData.frame !== frame)
          for (const direction of directions) direction.frames[0] = frame
        g.userData.drawFlags = f.corpse.phase >= 3 ? 6 : 0
        this.animatePerson(g, f.unit.heading, directions, 0)
        return
      }
      const animations = (
        nativeUnits.animations as Record<
          string,
          Record<string, { frames: number[]; flip: boolean }[]>
        >
      )[`${f.unit.team}-${f.unit.kind}`]
      this.animatePerson(g, f.unit.heading, animations.die, f.age, true)
      for (const layer of g.userData.layers as THREE.Sprite[])
        layer.material.opacity = Math.min(1, (f.duration - f.age) * 3)
      return
    }
    const sprite = g.userData.sprite as THREE.Sprite
    if (f.lightning) this.animateLightning(g.userData.bolt, f.lightning)
    sprite.visible = f.animation?.object !== 0x650 && !(f.animation && f.animation.renderFlags & 16)
    if (!sprite.visible) return
    const sequence = (
      nativeEffects.animations as Record<
        string,
        { index: number; w: number; h: number; source: number }[]
      >
    )[g.userData.sequence]
    const index = f.animation
      ? f.animation.object - sequence[0].source + ((f.animation.f1 & 65535) >>> 2)
      : f.sprite?.fixed || f.sprite?.sequence === 'blastShot'
        ? f.sprite.frame
        : (f.sprite?.frame ?? 0) + Math.floor(f.age * 12)
    const frame = sequence[Math.min(sequence.length - 1, index)]
    effectFrame(sprite, frame)
    if (f.smoke) {
      const depth = this.view.project(f, f.height ?? this.y(f)).z
      const size = scaledEffectSize(
        frame,
        f.smoke,
        depth,
        this.view.config.scaledSprites ? 0x100 : 0,
        this.view.config
      )
      sprite.scale.set(size.width, size.height, 1)
    }
    sprite.material.opacity = f.animation ? 1 : Math.min(1, (f.duration - f.age) * 5)
    if (f.animation) {
      const width = f.smoke ? sprite.scale.x : frame.w
      sprite.center.set(width ? Math.trunc(width / 2) / width : 0.5, 0)
    }
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
        const q = lineQuad(line)
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
    this.globe.spellRange = null
    if (!shaman || !this.range.visible) return
    if (this.overviewActive) {
      this.globe.spellRange = {
        ...nativePosition(this.world, shaman),
        radius: spellRange(this.world, shaman, model!) * 256,
        tribe: this.world.manaWorld.playerTribe,
      }
      this.range.visible = false
      return
    }
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
            map: texture('effects'),
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
            map: texture('effects'),
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
          spriteCoordinate(9, bucket + 1, flags, this.view.config),
          spriteCoordinate(2, bucket + 1, flags, this.view.config),
          1
        )
      shadow.visible = shadow.scale.x > 0 && shadow.scale.y > 0
      if (shadow.visible)
        shadow.center.set(Math.trunc(shadow.scale.x / 2) / shadow.scale.x, 2 / shadow.scale.y)
    }
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
    if (this.terrainVersion !== this.world.landVersion) {
      this.rebuildTerrain()
    }
    this.updateTerrainTexture()
    const trees = this.world.trees.map(t => (t.logs >= 1 ? '1' : '0')).join('')
    if (trees !== this.treeSignature) {
      this.treeSignature = trees
      this.releaseGroup(this.decorations)
      this.decorations.clear()
      this.makeDecorations()
    }
    for (const group of this.decorations.children) {
      const tree = group.userData.point as Tree | undefined
      if (tree && tree.model !== 11) {
        updateWaveShake(
          group as THREE.Group,
          tree,
          nativePosition(this.world, tree),
          this.gameClock.animationFrame,
          this.waveFrames
        )
        const mesh = group.children[0] as THREE.Mesh
        mesh.userData.nativeSize =
          tree.burn?.scale ??
          timberScale(
            Math.round(tree.logs * 100),
            rules.sceneryWood[tree.model],
            nativeModels[rules.sceneryObjects[tree.model]].scale
          )
        group.visible = tree.logs > 0
      }
    }
    if (!this.updateCameraMotion(dt) && !this.updateFlyby(dt)) {
      this.updateView()
    }
    for (const [id, g] of this.unitMeshes)
      if (!this.world.units.some(u => u.id === id)) {
        this.objects.remove(g)
        this.releaseGroup(g)
        this.unitMeshes.delete(id)
      }
    const showHealth =
      this.keys.has('quote') &&
      !this.world.inputMask &&
      !this.overviewStage &&
      !document.querySelector('dialog[open]')
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
      this.unitMotion.position(this.world, u, g.position)
      g.quaternion.identity()
      g.userData.nativeHeading = 0
      g.userData.cellPosition = u
      g.visible = u.inside === null || (!!u.entry && !(u.entry.person.renderFlags & 16))
      const animationSource = unitAnimationSource(u)
      g.userData.depthBias =
        animationSource && animationSource.flags3 & 0x400
          ? ((animationSource.morph << 24) >> 24) * 16
          : -300
      const shadow = g.userData.shadow as THREE.Sprite
      // 0x4d32b0's tail enables person shadows only for airborne physics (0x400).
      shadow.visible = !!((animationSource?.flags4 ?? 0) & 0x400) || u.lift > 0
      if (shadow.visible) {
        const ground = terrainPointHeight(this.world.land, nativePosition(this.world, g.position))
        shadow.position.y = ground / 128 - g.position.y
        const depth = this.view.project(g.position, ground / 45).z
        const r = spriteShadow(
          nativeEffects.animations.unitShadow[0],
          depth,
          this.view.config.scaledSprites ? 0x100 : 0,
          this.view.config
        )
        shadow.visible = r.width > 0 && r.height > 0
        if (shadow.visible) {
          shadow.scale.set(r.width, r.height, 1)
          shadow.center.set(-r.x / r.width, 1 + r.y / r.height)
        }
      }
      g.userData.draw =
        animationSource?.draw ?? (u.kind === 'preacher' ? 16 : u.kind === 'warrior' ? 15 : 14)
      const renderFlags = animationSource?.renderFlags ?? 0
      g.userData.pickable = canPickUnit(this.world, u)
      g.userData.drawFlags =
        (renderFlags & 0xa000 || u.lift > 0 ? 2 : 0) | (renderFlags & 0x4000 ? 4 : 0)
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
      if (animationSource) {
        const source = animationSource.object + (u.team === 'red' && u.kind === 'shaman' ? 8 : 0)
        const directions = Object.values(animations).find(
          d => 'source' in d[0] && d[0].source === source
        )
        if (!directions)
          throw new Error(`Unimported follower animation ${g.userData.signature}/${source}`)
        this.animatePerson(g, u.heading, directions, 0, false, animationSource.f2)
      } else
        this.animatePerson(
          g,
          u.heading,
          animations[state] ?? animations.idle,
          this.world.time - (u.fight ? u.fight.started / 12 : g.userData.since),
          !!u.fight && ['attack', 'strike', 'special', 'recoil'].includes(state)
        )
      const gauge = unitHealthGauge({
        enabled: !!showHealth,
        owner: g.userData.owner,
        player: 0,
        type: 1,
        flags3: animationSource?.flags3 ?? 0,
        flags4: animationSource?.flags4 ?? 0,
        health: u.hp,
        maximum: maxHp(u.kind),
        frameHeight: g.userData.frameHeight,
      })
      const health = g.userData.health as THREE.Sprite
      health.visible = !!gauge
      if (gauge) {
        health.scale.set(gauge.width, gauge.height, 1)
        health.center.set(-gauge.x / gauge.width, 1 + gauge.y / gauge.height)
        health.userData.atlasTransform.set(1 / 25, 1, Math.max(0, Math.min(24, gauge.fill)) / 25, 0)
      }
    }
    this.renderTooltip()
    for (const [id, mesh] of this.plans)
      if (!this.world.buildings.some(b => b.id === id && b.preparation)) {
        mesh.removeFromParent()
        mesh.geometry.dispose()
        this.plans.delete(id)
      }
    for (const b of this.world.buildings.filter(b => b.preparation)) {
      let mesh = this.plans.get(b.id)
      if (!mesh) {
        mesh = new THREE.Mesh(new THREE.BufferGeometry(), this.cursor.material)
        this.plans.set(b.id, mesh)
        this.ground.add(mesh)
      }
      const pose = buildingPose(b),
        key = [pose.object, pose.angle, pose.anchorX, pose.anchorY, this.world.terrainVersion].join(
          ','
        )
      if (mesh.userData.signature !== key) {
        mesh.geometry.dispose()
        mesh.geometry = this.planGeometry(pose, false, true).geometry
        mesh.userData.signature = key
      }
    }
    for (const [id, g] of this.buildingMeshes)
      if (!this.world.buildings.some(b => b.id === id && !b.preparation)) {
        this.objects.remove(g)
        this.releaseGroup(g)
        this.buildingMeshes.delete(id)
      }
    for (const b of this.world.buildings) {
      if (b.preparation) continue
      const stage = buildingStage(b)
      let g = this.buildingMeshes.get(b.id)
      if (g && g.userData.signature !== `${buildingObject(b)}-${stage}`) {
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
      updateWaveShake(
        g,
        b,
        nativePosition(this.world, b),
        this.gameClock.animationFrame,
        this.waveFrames
      )
      g.userData.nativeTilt = b.damageState?.tilt ?? 0
      g.userData.nativeRoll = b.damageState?.roll ?? 0
      g.userData.health.visible = b.hp < buildingHp(b.kind) || b.progress < 1
      g.userData.health.quaternion.copy(
        g.quaternion.clone().invert().multiply(this.camera.quaternion)
      )
      g.userData.healthFill.scale.x =
        b.progress < 1 ? Math.max(0.01, b.progress) : Math.max(0.001, b.hp / buildingHp(b.kind))
    }
    for (const [id, g] of this.fxMeshes)
      if (!this.world.effects.some(f => f.id === id)) {
        g.removeFromParent()
        this.releaseGroup(g)
        this.fxMeshes.delete(id)
      }
    for (const f of this.world.effects) {
      let g = this.fxMeshes.get(f.id)
      if (!g) {
        g = this.makeFx(f)
        this.fxMeshes.set(f.id, g)
        this.ground.add(g)
      }
      this.locate(g, f, f.height)
      this.projectileMotion.position(this.world, f, g.position)
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
        mesh.geometry.dispose()
        mesh.material.dispose()
        mesh = nativeModel(shrine.model)
        entry.g.add(mesh)
      }
      if (shrine.morph) {
        const morph = shrine.morph,
          frame = Math.min(morph.duration, Math.max(0, this.world.turn - morph.started + 1))
        mesh.userData.morph = true
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
    const hovered =
      this.hoveredObject === null ? null : worldTooltipObject(this.world, this.hoveredObject)
    const hoveredBuilding = this.world.buildings.find(b => b.id === this.hoveredObject)

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
    this.drawPointer(now)
    this.renderBuildingPanels()
    this.objectPanels.update(texture('hud').image as HTMLImageElement)
    this.container.parentElement!.style.setProperty(
      '--population-full-color',
      nativeHud.colors[populationMeter(1, 1, this.gameClock.animationFrame).color]
    )
    const shaman = this.world.units.find(u => u.team === 'blue' && u.kind === 'shaman')
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
    this.frame = requestAnimationFrame(this.animate)
  }
  releaseGroup(g: THREE.Object3D) {
    const materials = new Set<THREE.Material>(),
      sharedTextures = new Set([...textures.values()].map(asset => asset.texture))
    g.traverse(o => {
      if (o instanceof THREE.Sprite) {
        // Atlas images belong to the shared texture cache, not individual particles.
        if (o.material.map && !sharedTextures.has(o.material.map)) o.material.map.dispose()
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
