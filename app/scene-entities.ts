import { cursorRosterSelected } from './neutral-cursor.ts'
import { templeWorldMaterial } from './temple-art.ts'
import { unitRenderAnimationSource } from './unit-animation-source.ts'
import { hutSmokeState } from './hut-smoke-runtime.ts'
import type { SecondaryEffect } from './secondary-effects.ts'
import type { GameScene } from './scene.ts'
import * as THREE from 'three'
import {
  texture,
  geometry,
  effectFrame,
  nativeModel,
  nativeModels,
  updateModelLighting,
} from './scene-assets.ts'
import {
  buildingObject,
  buildingModel,
  buildingPose,
  buildingStage,
  nativePosition,
  maxHp,
  unitAnimation,
  unitInvisibleToPlayer,
  unitInvisibilityRenderFlag,
  canPickUnit,
  browserPosition,
  type Unit,
  type Building,
  type Vehicle,
  type Shrine,
} from './model'
import { terrainPointHeight } from './native-terrain.ts'
import { buildingSocketPoint } from './building-shapes.ts'
import {
  observeHutOccupancy,
  hutOccupancySmokeLayer,
  hutOccupancySmokeSocket,
  type HutOccupancySmokeState,
} from './hut-occupancy-smoke.ts'
import { unitHealthGauge } from './unit-health.ts'
import {
  spriteDirection,
  spriteCoordinate,
  spriteBucket,
  spriteShadow,
  selectionArrow,
} from './projection.ts'
import { morphCoordinate } from './morph.ts'
import { modelHighlight } from './model-lighting.ts'
import { spriteAtlasOrigin, spriteLayers } from './sprite-layers.ts'
import nativeUnits from './original-units.json'
import { nativeUnitDraw } from './unit-kinds.ts'
import { originalVehicleMesh, originalVehicleUV } from './vehicle-appearance.ts'
import { initializeStoneHead, stoneHeadFrame, stoneHeadPositions } from './stone-head-animation.ts'
import { stoneHeadAngle } from './stone-head-orientation.ts'
import { stoneHead149Model } from './stone-head-149.ts'
import { originalTrainingHutObject } from './training-hut-appearance.ts'
import { shamanAppearance, shamanNativeDirections } from './shaman-appearance.ts'
import { followerNativeDirections, nativeSpriteHidden } from './follower-appearance.ts'
import nativeEffects from './original-effects.json'
import rules from './original-rules.json'
import { animationTeam, teamForTribe, tribeForTeam, vehicleApparentTribe } from './world-types.ts'
import {
  vaultKnowledgeAppearance,
  vaultKnowledgeFrame,
  vaultKnowledgePlacement,
  vaultKnowledgeVisible,
} from './vault-appearance.ts'
import { makeVaultWorldPresentation, drawVaultWorldPresentation } from './scene-vault-knowledge.ts'
import { animateVaultKnowledgeMarker, makeVaultKnowledgeMarker } from './scene-effects.ts'

const unitAtlasOrigins = nativeUnits.pieces.map((piece, index) =>
  spriteAtlasOrigin(piece, index, nativeUnits)
)

type UnitDirections = { frames: number[]; flip: boolean; source?: number }[]
type UnitAnimationTable = Record<string, UnitDirections>

// Preserve a matching legacy source only when the native catalog has no entry.
// Imported animation tables have no runtime writers; retain their first source match.
const unitDirectionsBySource = new WeakMap<
  UnitAnimationTable,
  Map<number | undefined, UnitDirections>
>()

function legacyFollowerDirections(animations: UnitAnimationTable, source: number) {
  if (Number.isNaN(source)) return undefined
  let sources = unitDirectionsBySource.get(animations)
  if (!sources) {
    sources = new Map()
    for (const directions of Object.values(animations))
      if ('source' in directions[0] && !sources.has(directions[0].source))
        sources.set(directions[0].source, directions)
    unitDirectionsBySource.set(animations, sources)
  }
  return sources.get(source)
}

// Derived only for the current frame; weak ownership follows the Scene lifetime.
const unitFrameIds = new WeakMap<GameScene, Set<number>>()
const unitFrameSelectedIds = new WeakMap<GameScene, Set<number>>()
const unitFrameBuildingsById = new WeakMap<GameScene, Map<Unit['work'], Building>>()
const unitFrameShrinesById = new WeakMap<GameScene, Map<Unit['work'], Shrine[]>>()
const vehicleFrameIds = new WeakMap<GameScene, Set<number>>()
const vehicleFrameViews = new WeakMap<GameScene, Vehicle[]>()
const planFrameIds = new WeakMap<GameScene, Set<number>>()
const planFrameViews = new WeakMap<GameScene, Building[]>()
const buildingFrameIds = new WeakMap<GameScene, Set<number>>()
const shrineFrameIds = new WeakMap<GameScene, Set<number>>()
const hutPuffFrames = new WeakMap<
  GameScene,
  { puffs: Extract<SecondaryEffect, { kind: 'hutPuff' }>[]; serials: Set<number> }
>()

function makeUnit(u: Unit) {
  const g = new THREE.Group()
  const shield = new THREE.Mesh(
    geometry('magic-shield', () => new THREE.SphereGeometry(1, 12, 8)),
    new THREE.MeshBasicMaterial({
      color: 0x8fd7ff,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      wireframe: true,
    })
  )
  shield.name = 'magic-shield'
  shield.position.y = 0.9
  shield.visible = false
  g.add(shield)
  const bloodlust = new THREE.Mesh(
    geometry('bloodlust-aura', () => new THREE.TorusGeometry(0.48, 0.08, 6, 12)),
    new THREE.MeshBasicMaterial({
      color: 0xff3d18,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    })
  )
  bloodlust.name = 'bloodlust-aura'
  bloodlust.rotation.x = Math.PI / 2
  bloodlust.position.y = 0.12
  bloodlust.visible = false
  g.add(bloodlust)
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
    new THREE.SpriteMaterial({
      map: texture('unit-health'),
      depthWrite: false,
      toneMapped: false,
    })
  )
  health.visible = false
  health.userData.atlasTransform = new THREE.Vector4()
  g.add(health)
  g.userData = {
    unit: u.id,
    owner: tribeForTeam(u.team),
    signature: `${u.team}-${u.kind}`,
    layers: [],
    shadow,
    selection,
    health,
    shield,
    bloodlust,
    heading: 0,
    frame: -1,
  }
  return g
}

function makeBuilding(scene: GameScene, b: Building, stage: number, temple = false) {
  const g = new THREE.Group(),
    id = buildingObject(b),
    base = rules.buildingObjects[buildingModel(b)],
    // Training huts require their actual tribe mesh. Preserve unrelated and
    // neutral fallback behavior; all four Balloon Hut meshes are imported.
    renderId =
      originalTrainingHutObject(b) ??
      (nativeModels[id] ? id : nativeModels[base] ? base : rules.buildingObjects[13])
  const model = nativeModel(
    renderId,
    b.kind === 'temple' ? 1.65 : 2,
    stage,
    temple,
    scene.environment
  )
  g.add(model)
  g.userData = {
    building: b.id,
    signature: `${id}-${stage}`,
  }
  if (temple) g.userData.signature += '-animated'
  return g
}

interface HutSmokeRenderState {
  state: HutOccupancySmokeState
  group: THREE.Group
  sprite: THREE.Sprite
}

function releaseHutSmoke(scene: GameScene, buildingGroup: THREE.Group) {
  const smoke = buildingGroup.userData.hutOccupancySmoke as HutSmokeRenderState | undefined
  if (!smoke) return
  scene.objects.remove(smoke.group)
  scene.releaseGroup(smoke.group)
  delete buildingGroup.userData.hutOccupancySmoke
}

function hutSmokeSprite() {
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture('effects'),
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    })
  )
  sprite.center.set(0.5, 0)
  return sprite
}

function updateHutOccupancySmoke(scene: GameScene, b: Building, buildingGroup: THREE.Group) {
  if (b.kind !== 'hut' || b.team !== 'blue' || b.progress < 1 || b.hp <= 0) {
    releaseHutSmoke(scene, buildingGroup)
    return
  }
  const model = buildingModel(b)
  if (!rules.buildingCapacity[model]) {
    releaseHutSmoke(scene, buildingGroup)
    return
  }
  let smoke = buildingGroup.userData.hutOccupancySmoke as HutSmokeRenderState | undefined
  if (!smoke) {
    const group = new THREE.Group(),
      sprite = hutSmokeSprite()
    group.name = 'hut-occupancy-smoke'
    group.add(sprite)
    smoke = { state: hutSmokeState(scene.world, b), group, sprite }
    buildingGroup.userData.hutOccupancySmoke = smoke
    scene.objects.add(group)
    sprite.material.addEventListener(
      'dispose',
      observeHutOccupancy(b, () => updateHutOccupancySmoke(scene, b, buildingGroup))
    )
  }
  const socket = buildingSocketPoint(buildingPose(b), hutOccupancySmokeSocket(model)),
    point = browserPosition(socket),
    height = terrainPointHeight(scene.world.land, socket) + socket.heightOffset
  scene.locate(smoke.group, point, height / 45)
  const layer = hutOccupancySmokeLayer(smoke.state, scene.world.secondaryEffects.animationFrame)
  smoke.group.visible = !!layer
  if (layer) effectFrame(smoke.sprite, nativeEffects.animations[layer.sequence][layer.frame])
}

function updateHutSmokePuffs(scene: GameScene) {
  const owner = scene.world.secondaryEffects
  let snapshot = hutPuffFrames.get(scene)
  if (!snapshot) {
    snapshot = { puffs: [], serials: new Set() }
    hutPuffFrames.set(scene, snapshot)
  }
  const { puffs, serials } = snapshot
  serials.clear()
  let count = 0
  // Preserve the eager ordered record snapshot before cleanup and drawing.
  owner.order.forEach(slot => {
    const entry = owner.slots[slot]
    if (entry?.kind === 'hutPuff') {
      puffs[count++] = entry
      serials.add(entry.serial)
    }
  })
  puffs.length = count
  // Kept outside building groups: removing or replacing a root does not remove
  // its already-allocated children, whose own sixteen visits still apply.
  scene.hutSmokePuffs ??= new Map()
  for (const [id, group] of scene.hutSmokePuffs)
    if (Number.isNaN(id) || !serials.has(id)) {
      group.removeFromParent()
      scene.releaseGroup(group)
      scene.hutSmokePuffs.delete(id)
    }
  for (const puff of puffs) {
    let group = scene.hutSmokePuffs.get(puff.serial)
    if (!group) {
      group = new THREE.Group()
      group.name = 'hut-smoke-puff'
      group.add(hutSmokeSprite())
      scene.hutSmokePuffs.set(puff.serial, group)
      scene.objects.add(group)
    }
    const frame = (((owner.animationFrame - puff.frameStart) % 16) + 16) % 16
    effectFrame(group.children[0] as THREE.Sprite, nativeEffects.animations.hutSmokePartial[frame])
    scene.locate(group, browserPosition(puff.position), puff.position.h / 45)
  }
}

function makeVehicle(scene: GameScene, v: Vehicle) {
  const g = new THREE.Group(),
    resource = originalVehicleMesh(v.model),
    mesh = nativeModel(resource, 2, 4, false, scene.environment)
  if (!mesh) throw new Error(`Missing original vehicle mesh ${resource}`)
  // Reuse the original model UV/material, integer transform, lighting and
  // painter/picking consumers. The vehicle's gameplay position stays unchanged.
  g.add(mesh)
  g.userData = { point: { id: v.id }, vehicle: v.id, vehicleMesh: resource }
  return g
}

export function updateWaveShake(
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

function makeShrine(scene: GameScene, shrine: Shrine) {
  const g = new THREE.Group()
  g.add(
    nativeModel(
      stoneHead149Model(shrine, scene.world.outcome.level),
      2,
      4,
      false,
      scene.environment
    )
  )
  scene.locate(g, shrine)
  scene.orientModel(g, stoneHeadAngle(shrine, scene.world.outcome.level))
  scene.objects.add(g)
  g.userData.shrine = shrine.id
  if (shrine.kind === 'vault') {
    const frame = vaultKnowledgeFrame(shrine.reward, shrine.rewardModel, scene.world.outcome.level)
    if (frame !== null) {
      const knowledge = vaultKnowledgeAppearance(shrine, scene.world.outcome.level),
        marker =
          shrine.knowledgeGlow && knowledge
            ? makeVaultWorldPresentation(knowledge, true)
            : makeVaultKnowledgeMarker(frame),
        placement = vaultKnowledgePlacement(shrine)
      scene.locate(marker, placement, scene.y(placement) + placement.heightOffset / 45)
      marker.userData.cellPosition = placement
      scene.objects.add(marker)
      g.userData.vaultKnowledgeMarker = marker
    }
  }
  scene.shrineMeshes.set(shrine.id, { g })
}

export function makeShrines(scene: GameScene) {
  for (const shrine of scene.world.shrines) if (shrine.model) makeShrine(scene, shrine)
}

export function animatePerson(
  scene: GameScene,
  g: THREE.Group,
  heading: number,
  directions: { frames: number[]; flip: boolean }[],
  age: number,
  once = false,
  frameNumber?: number,
  selectedIds?: ReadonlySet<number>
) {
  const direction = spriteDirection(
    Math.round((scene.cameraBearing * 1024) / Math.PI),
    Math.round(((Math.PI - heading) * 1024) / Math.PI)
  )
  const cycle = directions[direction],
    step = frameNumber ?? Math.floor(age * nativeUnits.fps),
    index =
      cycle.frames[once ? Math.min(step, cycle.frames.length - 1) : step % cycle.frames.length]
  const frame = nativeUnits.frames[index]
  g.userData.frame = index
  g.userData.frameFlip = cycle.flip
  const shaman = g.userData.signature?.endsWith('shaman') || g.userData.shaman,
    flags = scene.view.config.scaledSprites ? 0x100 : 0,
    depth = scene.view.project(g.position, (g.position.y * 128) / 45).z,
    bucket = spriteBucket(depth, g.userData.depthBias ?? -300) * (shaman ? -1 : 1)
  g.userData.spriteBucket = bucket
  const size = (n: number) =>
    shaman || flags ? spriteCoordinate(n, bucket, flags, scene.view.config) : n
  g.userData.nativeFrameHeight = frame.nativeHeight
  g.userData.frameHeight = size(frame.nativeHeight)
  const descriptor = rules.animationDescriptors[g.userData.draw ?? 14]
  const draws = spriteLayers(
    frame.layers,
    nativeUnits.pieces,
    {
      owner: g.userData.layerOwner ?? (shaman ? -1 : g.userData.owner),
      person: descriptor.person,
      variant: descriptor.variant,
      flags: (g.userData.drawFlags ?? 0) | (cycle.flip ? 1 : 0),
      bucket,
      scale: !!(shaman || flags),
      levelFlags: flags,
    },
    scene.view.config
  )
  const layers = g.userData.layers as THREE.Sprite[]
  const bounds = {
    left: Infinity,
    top: Infinity,
    right: -Infinity,
    bottom: -Infinity,
  }
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
    const material = layer.material as THREE.SpriteMaterial,
      blended = !!(g.userData.drawFlags & 4)
    material.opacity = blended ? 0.45 : 1
    material.transparent = blended
    material.depthWrite = !blended
    material.alphaTest = blended ? 0.01 : 0.5
    layer.visible = draw.w > 0 && draw.h > 0
    layer.userData.piece = draw.piece
    if (!layer.visible) continue
    const piece = nativeUnits.pieces[draw.piece],
      origin = unitAtlasOrigins[draw.piece],
      uv = (layer.userData.atlasTransform ??= new THREE.Vector4()),
      flip = !!(draw.flags & 1)
    uv.set(
      (flip ? -piece.w : piece.w) / nativeUnits.width,
      piece.h / nativeUnits.height,
      (origin.x + (flip ? piece.w : 0)) / nativeUnits.width,
      1 - (origin.y + piece.h) / nativeUnits.height
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
        selectionFlags:
          (selectedIds?.has(g.userData.unit) ?? scene.world.selected.includes(g.userData.unit))
            ? 128
            : 0,
        x: 0,
        y: 0,
        frameHeight: size(frame.nativeHeight),
        scaled: !!(shaman || flags),
        bucket,
        flags,
      },
      scene.view.config
    )
    arrow.visible = !!r && r.width > 0 && r.height > 0
    if (r && arrow.visible) {
      arrow.scale.set(r.width, r.height, 1)
      arrow.center.set(-r.x / r.width, 1 + r.y / r.height)
    }
  }
}

export function updateUnitsFrame(scene: GameScene) {
  let ids = unitFrameIds.get(scene)
  if (!ids) {
    ids = new Set()
    unitFrameIds.set(scene, ids)
  }
  ids.clear()
  scene.neutralCursorRosterSelected = false
  for (const u of scene.world.units) {
    ids.add(u.id)
    if (!scene.neutralCursorRosterSelected && cursorRosterSelected(u))
      scene.neutralCursorRosterSelected = true
  }
  let selectedIds = unitFrameSelectedIds.get(scene)
  if (!selectedIds) {
    selectedIds = new Set()
    unitFrameSelectedIds.set(scene, selectedIds)
  }
  selectedIds.clear()
  for (const id of scene.world.selected) selectedIds.add(id)
  let buildingsById = unitFrameBuildingsById.get(scene)
  if (!buildingsById) {
    buildingsById = new Map()
    unitFrameBuildingsById.set(scene, buildingsById)
  }
  buildingsById.clear()
  for (const building of scene.world.buildings) {
    const { id } = building
    if (!buildingsById.has(id)) buildingsById.set(id, building)
  }
  let shrinesById = unitFrameShrinesById.get(scene)
  if (!shrinesById) {
    shrinesById = new Map()
    unitFrameShrinesById.set(scene, shrinesById)
  }
  const shrineBuckets = shrinesById
  shrineBuckets.clear()
  scene.world.shrines.forEach(shrine => {
    const { id } = shrine
    const bucket = shrineBuckets.get(id)
    if (bucket) bucket.push(shrine)
    else shrineBuckets.set(id, [shrine])
  })
  // Accepted checkpoint IDs may be NaN, which never matched the old strict comparison.
  for (const [id, g] of scene.unitMeshes)
    if (Number.isNaN(id) || !ids.has(id)) {
      scene.objects.remove(g)
      scene.releaseGroup(g)
      scene.unitMeshes.delete(id)
    }
  const showHealth =
    scene.keys.has('quote') &&
    !scene.world.inputMask &&
    !scene.overviewStage &&
    !document.querySelector('dialog[open]')
  for (const u of scene.world.units) {
    let g = scene.unitMeshes.get(u.id)
    if (g && g.userData.signature !== `${u.team}-${u.kind}`) {
      scene.objects.remove(g)
      scene.releaseGroup(g)
      scene.unitMeshes.delete(u.id)
      g = undefined
    }
    if (!g) {
      g = makeUnit(u)
      scene.unitMeshes.set(u.id, g)
      scene.objects.add(g)
    }
    scene.unitMotion.position(scene.world, u, g.position)
    g.quaternion.identity()
    g.userData.nativeHeading = 0
    g.userData.cellPosition = u
    const animationSource = unitRenderAnimationSource(u)
    g.userData.missingNativeSource = undefined
    g.userData.nativeSpriteHidden = nativeSpriteHidden(
      animationSource?.object,
      animationSource?.renderFlags ?? 0
    )
    if (u.native?.vehicle || g.userData.nativeSpriteHidden) {
      g.visible = false
      continue
    }
    g.visible =
      (u.inside === null || (!!u.entry && !(u.entry.person.renderFlags & 16))) &&
      !unitInvisibleToPlayer(scene.world, u)
    if (!g.visible) continue
    const shield = g.userData.shield as THREE.Mesh
    shield.visible = !!u.shield
    if (shield.visible) {
      shield.rotation.y = scene.world.time * 2
      ;(shield.material as THREE.MeshBasicMaterial).opacity =
        0.18 + Math.sin(scene.world.time * 6) * 0.04
    }
    const bloodlust = g.userData.bloodlust as THREE.Mesh
    bloodlust.visible = !!u.bloodlust && (u.bloodlust >= 16 * 8 || !(scene.world.turn & 2))
    if (bloodlust.visible) bloodlust.rotation.z = scene.world.time * 4
    const person = animationSource ?? u.native ?? u.entry?.person ?? u.builder?.person,
      owner = tribeForTeam(u.team),
      disguise = u.kind === 'spy' ? (person?.disguise ?? owner << 6) : owner << 6,
      target = disguise >>> 6,
      apparent =
        target !== owner && (!(disguise & 63) || !(scene.gameClock.animationFrame & 2))
          ? target
          : owner,
      renderTeam = teamForTribe(apparent)
    g.userData.owner = apparent
    g.userData.depthBias =
      animationSource && animationSource.flags3 & 0x400
        ? ((animationSource.morph << 24) >> 24) * 16
        : -300
    const shadow = g.userData.shadow as THREE.Sprite
    // 0x4d32b0's tail enables person shadows only for airborne physics (0x400).
    shadow.visible = !!((animationSource?.flags4 ?? 0) & 0x400) || u.lift > 0
    if (shadow.visible) {
      const ground = terrainPointHeight(scene.world.land, nativePosition(scene.world, g.position))
      shadow.position.y = ground / 128 - g.position.y
      const depth = scene.view.project(g.position, ground / 45).z
      const r = spriteShadow(
        nativeEffects.animations.unitShadow[0],
        depth,
        scene.view.config.scaledSprites ? 0x100 : 0,
        scene.view.config
      )
      shadow.visible = r.width > 0 && r.height > 0
      if (shadow.visible) {
        shadow.scale.set(r.width, r.height, 1)
        shadow.center.set(-r.x / r.width, 1 + r.y / r.height)
      }
    }
    g.userData.draw = animationSource?.draw ?? nativeUnitDraw(u.kind)
    const nativeRenderFlags = animationSource?.renderFlags ?? 0,
      invisibilityRenderFlag = unitInvisibilityRenderFlag(scene.world, u),
      renderFlags =
        u.invisibility && !invisibilityRenderFlag
          ? nativeRenderFlags & ~0x4000
          : nativeRenderFlags | invisibilityRenderFlag
    g.userData.pickable = canPickUnit(scene.world, u)
    g.userData.drawFlags =
      (renderFlags & 0xa000 || u.lift > 0 ? 2 : 0) | (renderFlags & 0x4000 ? 4 : 0)
    const animations = (nativeUnits.animations as Record<string, UnitAnimationTable>)[
      u.kind === 'shaman'
        ? shamanAppearance(u.team).signature
        : `${animationTeam(renderTeam)}-${u.kind}`
    ]
    const state = unitAnimation(scene.world, u, selectedIds, buildingsById, shrineBuckets)
    if (g.userData.state !== state) {
      g.userData.state = state
      g.userData.since = scene.world.time
    }
    const source = animationSource?.object,
      catalogDirections =
        source === undefined
          ? undefined
          : u.kind === 'shaman'
            ? shamanNativeDirections(u.team, source)
            : followerNativeDirections(source),
      nativeDirections =
        catalogDirections ??
        (source !== undefined && u.kind !== 'shaman'
          ? legacyFollowerDirections(animations, source)
          : undefined),
      directions = nativeDirections || animations[state] || animations.idle
    // Presentation-only diagnostic: unknown native sources remain observable
    // without logging/allocating per frame or hiding a still-live legacy unit.
    if (source !== undefined && !catalogDirections) g.userData.missingNativeSource = source
    scene.animatePerson(
      g,
      u.heading,
      directions,
      nativeDirections ? 0 : scene.world.time - (u.fight ? u.fight.started / 12 : g.userData.since),
      !nativeDirections && !!u.fight && ['attack', 'strike', 'special', 'recoil'].includes(state),
      nativeDirections ? animationSource!.f2 : undefined,
      selectedIds
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
}

export function updateVehiclesFrame(scene: GameScene) {
  let ids = vehicleFrameIds.get(scene)
  if (!ids) {
    ids = new Set()
    vehicleFrameIds.set(scene, ids)
  }
  ids.clear()
  for (const v of scene.world.vehicles) if (v.active || v.destructionState) ids.add(v.id)
  for (const [id, g] of scene.vehicleMeshes)
    if (Number.isNaN(id) || !ids.has(id)) {
      scene.objects.remove(g)
      scene.releaseGroup(g)
      scene.vehicleMeshes.delete(id)
    }
  let vehicles = vehicleFrameViews.get(scene)
  if (!vehicles) {
    vehicles = []
    vehicleFrameViews.set(scene, vehicles)
  }
  const view = vehicles
  let count = 0
  // Preserve the eager eligibility snapshot at its original post-cleanup boundary.
  scene.world.vehicles.forEach(v => {
    if (v.active || v.destructionState) view[count++] = v
  })
  view.length = count
  for (const v of view) {
    let g = scene.vehicleMeshes.get(v.id)
    if (!g) {
      g = makeVehicle(scene, v)
      scene.vehicleMeshes.set(v.id, g)
      scene.objects.add(g)
    }
    const appearanceTeam = teamForTribe(vehicleApparentTribe(v))
    if (g.userData.vehicleTeam !== appearanceTeam) {
      const mesh = g.children[0] as THREE.Mesh<THREE.BufferGeometry>
      const uv = mesh.geometry.getAttribute('uv') as THREE.BufferAttribute
      uv.copyArray(originalVehicleUV(v.model, appearanceTeam))
      uv.needsUpdate = true
      g.userData.vehicleTeam = appearanceTeam
    }
    scene.locate(g, browserPosition(v), v.h / 45)
    scene.orientModel(g, v.heading)
  }
}

export function updateBuildingsFrame(scene: GameScene) {
  let ids = planFrameIds.get(scene)
  if (!ids) {
    ids = new Set()
    planFrameIds.set(scene, ids)
  }
  ids.clear()
  for (const b of scene.world.buildings) if (b.preparation) ids.add(b.id)
  for (const [id, mesh] of scene.plans)
    if (Number.isNaN(id) || !ids.has(id)) {
      mesh.removeFromParent()
      mesh.geometry.dispose()
      // Unprepared plans still borrow the cursor material. RenderView.prepare
      // gives prepared plans their own clones, but the atlas remains shared.
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      for (const material of new Set(materials))
        if (material !== scene.cursor.material) material.dispose()
      scene.plans.delete(id)
    }
  let buildings = planFrameViews.get(scene)
  if (!buildings) {
    buildings = []
    planFrameViews.set(scene, buildings)
  }
  const view = buildings
  let count = 0
  // Preserve the eager preparation snapshot after cleanup and before drawing.
  scene.world.buildings.forEach(b => {
    if (b.preparation) view[count++] = b
  })
  view.length = count
  for (const b of view) {
    let mesh = scene.plans.get(b.id)
    if (!mesh) {
      mesh = new THREE.Mesh(new THREE.BufferGeometry(), scene.cursor.material)
      scene.plans.set(b.id, mesh)
      scene.ground.add(mesh)
    }
    const pose = buildingPose(b),
      key = [pose.object, pose.angle, pose.anchorX, pose.anchorY, scene.world.terrainVersion].join(
        ','
      )
    if (mesh.userData.signature !== key) {
      mesh.geometry.dispose()
      mesh.geometry = scene.planGeometry(pose, false, true).geometry
      mesh.userData.signature = key
    }
  }
  let buildingIds = buildingFrameIds.get(scene)
  if (!buildingIds) {
    buildingIds = new Set()
    buildingFrameIds.set(scene, buildingIds)
  }
  buildingIds.clear()
  for (const b of scene.world.buildings) if (!b.preparation) buildingIds.add(b.id)
  for (const [id, g] of scene.buildingMeshes)
    if (Number.isNaN(id) || !buildingIds.has(id)) {
      releaseHutSmoke(scene, g)
      scene.objects.remove(g)
      scene.releaseGroup(g)
      scene.buildingMeshes.delete(id)
    }
  for (const b of scene.world.buildings) {
    if (b.preparation) continue
    const stage = buildingStage(b),
      temple = templeWorldMaterial(
        scene.environment,
        b,
        buildingObject(b),
        stage,
        scene.templeResourceSnapshot
      ),
      signature = `${buildingObject(b)}-${stage}${temple ? '-animated' : ''}`
    let g = scene.buildingMeshes.get(b.id)
    if (g && g.userData.signature !== signature) {
      releaseHutSmoke(scene, g)
      scene.objects.remove(g)
      scene.releaseGroup(g)
      scene.buildingMeshes.delete(b.id)
      g = undefined
    }
    if (!g) {
      g = makeBuilding(scene, b, stage, !!temple)
      scene.buildingMeshes.set(b.id, g)
      scene.objects.add(g)
      if (b.progress < 1) {
        scene.releaseGroup(scene.decorations)
        scene.decorations.clear()
        scene.makeDecorations()
      }
    }
    if (temple) {
      const [model] = g.children
      model.userData.templeTileOffset.value.set(...temple.offset)
      model.userData.templeResourceEpoch = temple.epoch
    }
    scene.locate(g, b, b.foundation)
    scene.orientModel(g, b.angle)
    updateHutOccupancySmoke(scene, b, g)
    updateWaveShake(
      g,
      b,
      nativePosition(scene.world, b),
      scene.gameClock.animationFrame,
      scene.waveFrames
    )
    g.userData.nativeTilt = b.damageState?.tilt ?? 0
    g.userData.nativeRoll = b.damageState?.roll ?? 0
  }
  updateHutSmokePuffs(scene)
}

export function updateShrinesFrame(scene: GameScene) {
  let ids = shrineFrameIds.get(scene)
  if (!ids) {
    ids = new Set()
    shrineFrameIds.set(scene, ids)
  }
  ids.clear()
  for (const shrine of scene.world.shrines) if (shrine.model) ids.add(shrine.id)
  for (const [id, entry] of scene.shrineMeshes)
    if (Number.isNaN(id) || !ids.has(id)) {
      const marker = entry.g.userData.vaultKnowledgeMarker as THREE.Group | undefined
      if (marker) {
        scene.objects.remove(marker)
        scene.releaseGroup(marker)
      }
      scene.objects.remove(entry.g)
      scene.releaseGroup(entry.g)
      scene.shrineMeshes.delete(id)
    }
  for (const shrine of scene.world.shrines)
    if (shrine.model && !scene.shrineMeshes.has(shrine.id)) makeShrine(scene, shrine)
  for (const shrine of scene.world.shrines) {
    const entry = scene.shrineMeshes.get(shrine.id)
    if (!entry) continue
    scene.locate(entry.g, shrine)
    if (shrine.kind === 'vault')
      updateWaveShake(
        entry.g,
        shrine,
        nativePosition(scene.world, shrine),
        scene.gameClock.animationFrame,
        scene.waveFrames
      )
    scene.orientModel(entry.g, stoneHeadAngle(shrine, scene.world.outcome.level))
    const marker = entry.g.userData.vaultKnowledgeMarker as THREE.Group | undefined
    if (marker) {
      const placement = vaultKnowledgePlacement(shrine)
      scene.locate(marker, placement, scene.y(placement) + placement.heightOffset / 45)
      marker.userData.cellPosition = placement
      const knowledge = vaultKnowledgeAppearance(shrine, scene.world.outcome.level)
      if (shrine.knowledgeGlow && knowledge)
        drawVaultWorldPresentation(
          scene,
          marker,
          knowledge,
          shrine.knowledgeGlow.displayedFrame,
          vaultKnowledgeVisible(shrine)
        )
      else animateVaultKnowledgeMarker(scene, marker, vaultKnowledgeVisible(shrine))
    }
    const model = stoneHead149Model(shrine, scene.world.outcome.level)
    let mesh = entry.g.children[0] as THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>
    if (mesh.userData.nativeModel !== model) {
      entry.g.remove(mesh)
      mesh.geometry.dispose()
      mesh.material.dispose()
      mesh = nativeModel(model, 2, 4, false, scene.environment)
      entry.g.add(mesh)
    }
    const stone = initializeStoneHead(shrine, scene.world.outcome.level)
    if (stone) {
      const frame = stoneHeadFrame(stone)
      if (mesh.userData.stoneHeadFrame !== frame) {
        const position = mesh.geometry.getAttribute('position') as THREE.BufferAttribute
        position.copyArray(stoneHeadPositions(frame))
        position.needsUpdate = true
        mesh.geometry.computeBoundingSphere()
        mesh.geometry.computeBoundingBox()
        mesh.userData.stoneHeadFrame = frame
      }
    } else if (shrine.morph) {
      const morph = shrine.morph,
        frame = Math.min(morph.duration, Math.max(0, scene.world.turn - morph.started + 1))
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
    const activeHead = !!stone || shrine.active
    entry.g.visible =
      activeHead || shrine.kind === 'vault' || (shrine.kind === 'angel' && !!shrine.angelTarget)
  }
}

export function renderSceneFrame(
  scene: GameScene,
  hovered: (Parameters<typeof modelHighlight>[0] & { id: number }) | null,
  hoveredBuilding: Building | undefined
) {
  scene.scene.traverse(object => {
    updateModelLighting(object)
    if (!object.userData.highlight) return
    const id =
      object.parent?.userData.building ??
      object.parent?.userData.shrine ??
      object.parent?.userData.point?.id
    object.userData.highlight.value =
      hovered && id === hovered.id
        ? modelHighlight(
            {
              ...hovered,
              buildingFlags: hoveredBuilding?.damageState?.buildingFlags,
            },
            scene.world.turn,
            { construction: object.userData.stage !== 4 }
          )
        : 0
  })
  scene.view.painter.landFlags = scene.world.land.flags
  scene.view.painter.land = scene.world.land
  scene.view.painter.cells = scene.world.objectCells
  scene.view.prepare(scene.scene)
  scene.view.painter.render(scene.renderer, scene.scene, scene.camera)
  scene.worshipPresentation.rememberBodies()
}
