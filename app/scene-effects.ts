import type { GameScene } from './scene.ts'
import * as THREE from 'three'
import { texture, effectFrame, nativeModel } from './scene-assets.ts'
import { debrisVertices } from './building-debris.ts'
import { fireUV, fireHeading } from './scenery-fire.ts'
import { interpolateUnitPosition } from './unit-motion.ts'
import {
  TURNS_PER_SECOND,
  browserPosition,
  nativePosition,
  spellRange,
  SPELLS,
  isShaman,
  type Effect,
  type Gift,
} from './model'
import { scaledEffectSize, spriteCoordinate } from './projection.ts'
import { lightningLines, lineQuad, type Lightning } from './lightning.ts'
import { spellHalo, haloBucket } from './spell-halo.ts'
import nativeUnits from './original-units.json'
import nativeEffects from './original-effects.json'
import rules from './original-rules.json'
import { animationTeam, tribeForTeam } from './world-types.ts'
import { nativeUnitDraw } from './unit-kinds.ts'
import { shamanAppearance, shamanNativeDirections, shamanReincarnationPose } from './shaman-appearance.ts'
import { short } from './native-math.ts'
import { SWARM_INSECT_COUNT, hasSwarmRuntime, swarmState } from './swarm.ts'

export function makeVaultKnowledgeMarker(frame: number) {
  const g = new THREE.Group()
  g.name = 'vault-knowledge-reward'
  g.userData.layers = []
  g.userData.owner = 0
  g.userData.draw = 0
  g.userData.drawFlags = 6
  g.userData.directions = Array.from({ length: 8 }, () => ({ frames: [frame], flip: false }))
  return g
}

export function animateVaultKnowledgeMarker(scene: GameScene, g: THREE.Group, visible: boolean) {
  g.visible = visible
  if (visible) scene.animatePerson(g, 0, g.userData.directions, 0)
}

export function makeFx(scene: GameScene, f: Effect) {
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
  if (f.swarm) {
    g.name = 'swarm-insects'
    for (let i = 0; i < SWARM_INSECT_COUNT; i++) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: texture('insect'),
          transparent: true,
          depthWrite: false,
          toneMapped: false,
        })
      )
      sprite.name = 'swarm-insect'
      sprite.center.set(0.5, 0.5)
      // Native primitive case 0x11 calls draw_insect(..., 7.0f); the sprite spans twice that radius.
      sprite.scale.set(14, 14, 1)
      sprite.userData.nativePrimitive = 0x11
      sprite.userData.nativeSize = 7
      g.add(sprite)
    }
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
  if (
    f.wave ||
    f.bridge ||
    f.flatten ||
    f.erosion ||
    f.firestorm ||
    f.earthquake ||
    f.volcano ||
    f.convertWild ||
    f.ghostArmy ||
    f.armageddon
  )
    return g
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
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(debrisVertices(f.debris), 3))
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
  scene.locate(g, f, f.height)
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
    g.userData.owner = tribeForTeam(f.reincarnation.team)
    g.userData.draw = 14
    const pose = shamanReincarnationPose(f.reincarnation.team, f.reincarnation.phase)
    g.userData.shaman = true
    g.userData.layerOwner = pose.layerOwner
    g.userData.directions = pose.directions
    return g
  }
  if (f.angel) {
    g.name = 'angel-of-death'
    g.userData.layers = []
    g.userData.owner = tribeForTeam(f.team!)
    g.userData.draw = 15
    g.userData.drawFlags = 2
    g.userData.directions = nativeUnits.animations['blue-warrior'].stagger
    return g
  }
  if (f.unit) {
    g.userData.layers = []
    g.userData.owner = tribeForTeam(f.unit.team)
    g.userData.draw = nativeUnitDraw(f.unit.kind)
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
  if (f.smoke) sprite.material.color.setStyle(`rgb(${nativeEffects.buildingSmokeColor.join(',')})`)
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

export function animateFx(scene: GameScene, g: THREE.Group, f: Effect) {
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
      interpolateUnitPosition(from, to, Math.min(1, scene.world.pendingTime * TURNS_PER_SECOND))
    )
    g.userData.cellPosition = f
  }
  if (f.swarm) {
    if (!hasSwarmRuntime(f.swarm)) {
      for (const child of g.children) child.visible = false
      return
    }
    const swarm = swarmState(f.swarm)
    for (let i = 0; i < g.children.length; i++) {
      const sprite = g.children[i] as THREE.Sprite,
        insect = swarm.insects[i]
      sprite.visible = !!insect
      if (!insect) continue
      sprite.position.set(
        short(insect.x - swarm.x) / 256,
        (insect.h - swarm.h) / 128,
        -short(insect.y - swarm.y) / 256
      )
    }
    return
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
      effectFrame(sprite, frames[(scene.world.turn + i) % frames.length])
      sprite.material.opacity = f.tornado.phase ? Math.min(1, f.tornado.remaining / 12) : 0.9
    }
    return
  }
  if (
    f.wave ||
    f.bridge ||
    f.flatten ||
    f.erosion ||
    f.swamp ||
    f.firestorm ||
    f.earthquake ||
    f.volcano ||
    f.convertWild ||
    f.ghostArmy ||
    f.armageddon
  )
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
    if (g.userData.facingTurn !== scene.world.turn >> 3) {
      g.userData.facingTurn = scene.world.turn >> 3
      f.fire.heading = fireHeading(f.fire, {
        ...scene.view.center,
        angle: Math.round((scene.cameraBearing * 1024) / Math.PI) & 2047,
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
      scene.animatePerson(g, 0, g.userData.directions, 0)
      const glow = g.userData.glow as THREE.Group
      scene.animatePerson(glow, 0, glow.userData.directions, 0)
    }
    return
  }
  if (f.reincarnation) {
    const pose = shamanReincarnationPose(f.reincarnation.team, f.reincarnation.phase)
    g.userData.layerOwner = pose.layerOwner
    g.userData.directions = pose.directions
    g.userData.drawFlags = f.reincarnation.phase >= 3 ? 6 : 0
    scene.animatePerson(g, f.unit?.heading ?? 0, pose.directions, 0)
    return
  }
  if (f.angel) {
    scene.animatePerson(g, f.angel.heading, g.userData.directions, f.age)
    const scale = f.angel.phase === 'dying' ? Math.max(0, f.angel.timer / 16) : 1
    g.scale.setScalar(scale)
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
      scene.animatePerson(g, f.unit.heading, directions, 0)
      return
    }
    // The model-12 effect already draws this Shaman's body/spirit. Keep the
    // legacy short death event for gameplay bookkeeping without a second sprite.
    if (f.unit.kind === 'shaman' && scene.world.effects.some(other => other.reincarnation?.team === f.unit!.team)) {
      g.visible = false
      return
    }
    const animations = (
      nativeUnits.animations as Record<
        string,
        Record<string, { frames: number[]; flip: boolean }[]>
      >
    )[f.unit.kind === 'shaman' ? shamanAppearance(f.unit.team).signature : `${animationTeam(f.unit.team)}-${f.unit.kind}`]
    const directions = f.unit.kind === 'shaman'
      ? shamanNativeDirections(f.unit.team, 680)!
      : animations.die
    g.userData.directions = directions
    scene.animatePerson(g, f.unit.heading, directions, f.age, true)
    for (const layer of g.userData.layers as THREE.Sprite[])
      layer.material.opacity = Math.min(1, (f.duration - f.age) * 3)
    return
  }
  const sprite = g.userData.sprite as THREE.Sprite
  if (f.lightning) scene.animateLightning(g.userData.bolt, f.lightning)
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
    const depth = scene.view.project(f, f.height ?? scene.y(f)).z
    const size = scaledEffectSize(
      frame,
      f.smoke,
      depth,
      scene.view.config.scaledSprites ? 0x100 : 0,
      scene.view.config
    )
    sprite.scale.set(size.width, size.height, 1)
  }
  sprite.material.opacity = f.animation ? 1 : Math.min(1, (f.duration - f.age) * 5)
  if (f.animation) {
    const width = f.smoke ? sprite.scale.x : frame.w
    sprite.center.set(width ? Math.trunc(width / 2) / width : 0.5, 0)
  }
}

export function animateLightning(scene: GameScene, mesh: THREE.Mesh, b: Lightning) {
  mesh.visible = !!b.segments.length
  if (!mesh.visible) return
  const positions: number[] = [],
    uv: number[] = [],
    opacity: number[] = [],
    width = scene.container.clientWidth,
    height = scene.container.clientHeight
  const screen = (p: { x: number; y: number; h: number }) => {
    const point = browserPosition(p),
      q = scene.view.project(point, p.h / 45)
    let x = q.screenX,
      y = q.screenY
    if (scene.overviewActive) {
      const clip = scene.view.screen(new THREE.Vector3(point.x, p.h / 128, point.z), scene.camera)
      x = ((clip.x + 1) * width) / 2
      y = ((1 - clip.y) * height) / 2
    }
    return { x: (Math.trunc(x) << 16) >> 16, y: (Math.trunc(y) << 16) >> 16, flags: q.flags }
  }
  for (const segment of b.segments) {
    const from = screen(segment.from),
      to = screen(segment.to)
    if (!scene.overviewActive && from.flags >>> 0 > 0x80000000) continue
    for (const line of lightningLines(from.x, from.y, to.x, to.y, scene.world.cosmeticRandom)) {
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

export function updateSpellHalo(scene: GameScene, frame: number) {
  const model = SPELLS.find(s => s.id === scene.world.mode)?.model ?? scene.hoveredSpell
  scene.range.userData.model = model
  const shaman = scene.world.units.find(u => u.team === 'blue' && isShaman(u))
  scene.range.visible =
    !!shaman &&
    !!model &&
    !(rules.spellCharging[model].flags & 0x8000) &&
    !scene.world.inputMask &&
    scene.world.status === 'playing'
  scene.globe.spellRange = null
  if (!shaman || !scene.range.visible) return
  if (scene.overviewActive) {
    scene.globe.spellRange = {
      ...nativePosition(scene.world, shaman),
      radius: spellRange(scene.world, shaman, model!) * 256,
      tribe: scene.world.manaWorld.playerTribe,
    }
    scene.range.visible = false
    return
  }
  const points = spellHalo(
    scene.world.land,
    nativePosition(scene.world, shaman),
    spellRange(scene.world, shaman, model) * 256,
    scene.halo,
    frame
  )
  for (const [i, p] of points.entries()) {
    let g = scene.range.children[i] as THREE.Group
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
      scene.range.add(g)
    }
    const point = browserPosition(p),
      projected = scene.view.project(point, p.h / 45)
    scene.locate(g, point, p.h / 45)
    g.visible = scene.overviewActive ? scene.visible(point, p.h / 45) : !(projected.flags & 0x1e)
    g.userData.halo = p
    const [shadow, body] = g.children as THREE.Sprite[]
    effectFrame(body, nativeEffects.animations.halo[p.frame - 1466])
    effectFrame(shadow, nativeEffects.animations.haloShadow[0])
    const flags = scene.view.config.scaledSprites ? 0x100 : 0,
      bucket = haloBucket(projected.z)
    if (flags)
      shadow.scale.set(
        spriteCoordinate(9, bucket + 1, flags, scene.view.config),
        spriteCoordinate(2, bucket + 1, flags, scene.view.config),
        1
      )
    shadow.visible = shadow.scale.x > 0 && shadow.scale.y > 0
    if (shadow.visible)
      shadow.center.set(Math.trunc(shadow.scale.x / 2) / shadow.scale.x, 2 / shadow.scale.y)
  }
}

export function updateEffectsFrame(scene: GameScene) {
  for (const [id, g] of scene.fxMeshes)
    if (!scene.world.effects.some(f => f.id === id)) {
      g.removeFromParent()
      scene.releaseGroup(g)
      scene.fxMeshes.delete(id)
    }
  for (const f of scene.world.effects) {
    let g = scene.fxMeshes.get(f.id)
    if (!g) {
      g = scene.makeFx(f)
      scene.fxMeshes.set(f.id, g)
      scene.ground.add(g)
    }
    scene.locate(g, f, f.height)
    scene.projectileMotion.position(scene.world, f, g.position)
    scene.animateFx(g, f)
  }
}
