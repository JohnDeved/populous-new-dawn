import type { GameScene } from './scene.ts'
import * as THREE from 'three'
import {
  texture,
  geometry,
  effectFrame,
  nativeModel,
  nativeModels,
  material,
  part,
  box,
  updateModelLighting,
} from './scene-assets.ts'
import {
  buildingObject,
  buildingModel,
  buildingPose,
  buildingStage,
  nativePosition,
  maxHp,
  buildingHp,
  unitAnimation,
  unitAnimationSource,
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
import { spriteLayers } from './sprite-layers.ts'
import nativeUnits from './original-units.json'
import { nativeUnitDraw } from './unit-kinds.ts'
import { originalVehicleMesh, originalVehicleUV } from './vehicle-appearance.ts'
import { initializeStoneHead, stoneHeadFrame, stoneHeadPositions } from './stone-head-animation.ts'
import { stoneHeadAngle } from './stone-head-orientation.ts'
import { stoneHead149Model } from './stone-head-149.ts'
import { originalTrainingHutObject } from './training-hut-appearance.ts'
import { shamanAppearance, shamanNativeDirections } from './shaman-appearance.ts'
import nativeEffects from './original-effects.json'
import rules from './original-rules.json'
import { animationTeam, teamForTribe, tribeForTeam } from './world-types.ts'
import {
  vaultKnowledgeFrame,
  vaultKnowledgePlacement,
  vaultKnowledgeVisible,
} from './vault-appearance.ts'
import { animateVaultKnowledgeMarker, makeVaultKnowledgeMarker } from './scene-effects.ts'

const teamColor = {
  blue: 0x303fc1,
  red: 0xb92720,
  yellow: 0xd1aa22,
  green: 0x29864a,
  wild: 0x9f9170,
}

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

function makeBuilding(b: Building, stage: number) {
  const g = new THREE.Group(),
    id = buildingObject(b),
    base = rules.buildingObjects[buildingModel(b)],
    // Training huts require their actual tribe mesh. Preserve unrelated and
    // neutral fallback behavior; Balloon Hut resource87 remains unimported.
    renderId =
      originalTrainingHutObject(b) ??
      (nativeModels[id] ? id : nativeModels[base] ? base : rules.buildingObjects[13])
  const model = nativeModel(renderId, b.kind === 'temple' ? 1.65 : 2, stage)
  g.add(model)
  const health = new THREE.Group(),
    top = b.kind === 'tower' ? 6 : 4.8
  part(health, box(2.5, 0.09, 0.05), material(0x201d16), 0, top)
  const healthFill = part(health, box(2.5, 0.09, 0.06), material(teamColor[b.team]), 0, top, 0.01)
  g.add(health)
  g.userData = {
    building: b.id,
    signature: `${id}-${stage}`,
    health,
    healthFill,
  }
  return g
}

function makeVehicle(v: Vehicle) {
  const g = new THREE.Group(),
    resource = originalVehicleMesh(v.model),
    mesh = nativeModel(resource)
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
  g.add(nativeModel(stoneHead149Model(shrine, scene.world.outcome.level)))
  scene.locate(g, shrine)
  scene.orientModel(g, stoneHeadAngle(shrine, scene.world.outcome.level))
  scene.objects.add(g)
  g.userData.shrine = shrine.id
  if (shrine.kind === 'vault') {
    const frame = vaultKnowledgeFrame(shrine.reward, shrine.rewardModel)
    if (frame !== null) {
      const marker = makeVaultKnowledgeMarker(frame),
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
  frameNumber?: number
) {
  const direction = spriteDirection(
    Math.round((scene.cameraBearing * 1024) / Math.PI),
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
        selectionFlags: scene.world.selected.includes(g.userData.unit) ? 128 : 0,
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
  for (const [id, g] of scene.unitMeshes)
    if (!scene.world.units.some(u => u.id === id)) {
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
    if (u.native?.vehicle) {
      g.visible = false
      continue
    }
    g.visible =
      (u.inside === null || (!!u.entry && !(u.entry.person.renderFlags & 16))) &&
      !unitInvisibleToPlayer(scene.world, u)
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
    const animationSource = unitAnimationSource(u),
      person = animationSource ?? u.native ?? u.entry?.person ?? u.builder?.person,
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
    const animations = (
      nativeUnits.animations as Record<
        string,
        Record<string, { frames: number[]; flip: boolean }[]>
      >
    )[
      u.kind === 'shaman'
        ? shamanAppearance(u.team).signature
        : `${animationTeam(renderTeam)}-${u.kind}`
    ]
    const state = unitAnimation(scene.world, u)
    if (g.userData.state !== state) {
      g.userData.state = state
      g.userData.since = scene.world.time
    }
    const source = animationSource?.object,
      nativeDirections =
        source === undefined
          ? undefined
          : u.kind === 'shaman'
            ? shamanNativeDirections(u.team, source)
            : Object.values(animations).find(d => 'source' in d[0] && d[0].source === source),
      directions = nativeDirections || animations[state] || animations.idle
    scene.animatePerson(
      g,
      u.heading,
      directions,
      nativeDirections ? 0 : scene.world.time - (u.fight ? u.fight.started / 12 : g.userData.since),
      !nativeDirections && !!u.fight && ['attack', 'strike', 'special', 'recoil'].includes(state),
      nativeDirections ? animationSource!.f2 : undefined
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
  for (const [id, g] of scene.vehicleMeshes)
    if (!scene.world.vehicles.some(v => v.id === id && (v.active || v.destructionState))) {
      scene.objects.remove(g)
      scene.releaseGroup(g)
      scene.vehicleMeshes.delete(id)
    }
  for (const v of scene.world.vehicles.filter(v => v.active || v.destructionState)) {
    let g = scene.vehicleMeshes.get(v.id)
    if (!g) {
      g = makeVehicle(v)
      scene.vehicleMeshes.set(v.id, g)
      scene.objects.add(g)
    }
    if (g.userData.vehicleTeam !== v.team) {
      const mesh = g.children[0] as THREE.Mesh<THREE.BufferGeometry>
      const uv = mesh.geometry.getAttribute('uv') as THREE.BufferAttribute
      uv.copyArray(originalVehicleUV(v.model, v.team))
      uv.needsUpdate = true
      g.userData.vehicleTeam = v.team
    }
    scene.locate(g, browserPosition(v), v.h / 45)
    scene.orientModel(g, v.heading)
  }
}

export function updateBuildingsFrame(scene: GameScene) {
  for (const [id, mesh] of scene.plans)
    if (!scene.world.buildings.some(b => b.id === id && b.preparation)) {
      mesh.removeFromParent()
      mesh.geometry.dispose()
      scene.plans.delete(id)
    }
  for (const b of scene.world.buildings.filter(b => b.preparation)) {
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
  for (const [id, g] of scene.buildingMeshes)
    if (!scene.world.buildings.some(b => b.id === id && !b.preparation)) {
      scene.objects.remove(g)
      scene.releaseGroup(g)
      scene.buildingMeshes.delete(id)
    }
  for (const b of scene.world.buildings) {
    if (b.preparation) continue
    const stage = buildingStage(b)
    let g = scene.buildingMeshes.get(b.id)
    if (g && g.userData.signature !== `${buildingObject(b)}-${stage}`) {
      scene.objects.remove(g)
      scene.releaseGroup(g)
      scene.buildingMeshes.delete(b.id)
      g = undefined
    }
    if (!g) {
      g = makeBuilding(b, stage)
      scene.buildingMeshes.set(b.id, g)
      scene.objects.add(g)
      if (b.progress < 1) {
        scene.releaseGroup(scene.decorations)
        scene.decorations.clear()
        scene.makeDecorations()
      }
    }
    scene.locate(g, b, b.foundation)
    scene.orientModel(g, b.angle)
    updateWaveShake(
      g,
      b,
      nativePosition(scene.world, b),
      scene.gameClock.animationFrame,
      scene.waveFrames
    )
    g.userData.nativeTilt = b.damageState?.tilt ?? 0
    g.userData.nativeRoll = b.damageState?.roll ?? 0
    g.userData.health.visible = b.hp < buildingHp(b.kind) || b.progress < 1
    g.userData.health.quaternion.copy(
      g.quaternion.clone().invert().multiply(scene.camera.quaternion)
    )
    g.userData.healthFill.scale.x =
      b.progress < 1 ? Math.max(0.01, b.progress) : Math.max(0.001, b.hp / buildingHp(b.kind))
  }
}

export function updateShrinesFrame(scene: GameScene) {
  for (const [id, entry] of scene.shrineMeshes)
    if (!scene.world.shrines.some(s => s.id === id && s.model)) {
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
    scene.orientModel(entry.g, stoneHeadAngle(shrine, scene.world.outcome.level))
    const marker = entry.g.userData.vaultKnowledgeMarker as THREE.Group | undefined
    if (marker) {
      const placement = vaultKnowledgePlacement(shrine)
      scene.locate(marker, placement, scene.y(placement) + placement.heightOffset / 45)
      marker.userData.cellPosition = placement
      animateVaultKnowledgeMarker(scene, marker, vaultKnowledgeVisible(shrine))
    }
    const model = stoneHead149Model(shrine, scene.world.outcome.level)
    let mesh = entry.g.children[0] as THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>
    if (mesh.userData.nativeModel !== model) {
      entry.g.remove(mesh)
      mesh.geometry.dispose()
      mesh.material.dispose()
      mesh = nativeModel(model)
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
    const id = object.parent?.userData.building ?? object.parent?.userData.shrine
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
  scene.renderer.render(scene.scene, scene.camera)
}
