import * as THREE from 'three'
import type { GameScene } from './scene.ts'
import { texture } from './scene-assets.ts'
import { spriteBucket, spriteCoordinate } from './projection.ts'
import knowledge from './original-vault-knowledge.json'

interface Frame {
  source: number
  x: number
  y: number
  w: number
  h: number
}

function sprite(translucent: boolean) {
  const body = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture(knowledge.atlas),
      transparent: translucent,
      depthWrite: !translucent,
      alphaTest: translucent ? 0.001 : 0.5,
      toneMapped: false,
    })
  )
  body.userData.atlasTransform = new THREE.Vector4()
  return body
}

export function makeVaultWorldPresentation(marker: boolean) {
  const group = new THREE.Group(),
    body = sprite(false),
    glow = new THREE.Group(),
    halo = sprite(true)
  group.name = marker ? 'vault-knowledge-reward' : 'worship-reward'
  group.userData.resourceFamily = 'hfx'
  group.userData.frame = knowledge.body.source
  group.userData.layers = [body]
  body.name = 'temple-knowledge-hfx'
  glow.name = marker ? 'vault-marker-glow' : 'worship-reward-glow'
  glow.position.y = -80 / 128
  glow.userData.depthBias = 16 // Native flags3 bit0x400 and morph1.
  glow.userData.layers = [halo]
  glow.userData.resourceFamily = 'hfx'
  halo.name = 'knowledge-glow-hfx'
  glow.add(halo)
  group.add(body, glow)
  group.userData.glow = glow
  return group
}

function drawFrame(
  scene: GameScene,
  layer: THREE.Sprite,
  frame: Frame,
  point: THREE.Vector3,
  depthBias: number
) {
  const uv = layer.userData.atlasTransform as THREE.Vector4,
    depth = scene.view.project(point, (point.y * 128) / 45).z,
    bucket = spriteBucket(depth, depthBias),
    flags = scene.view.config.scaledSprites ? 0x100 : 0,
    width = flags ? spriteCoordinate(frame.w, bucket, flags, scene.view.config) : frame.w,
    height = flags ? spriteCoordinate(frame.h, bucket, flags, scene.view.config) : frame.h
  uv.set(
    frame.w / knowledge.width,
    frame.h / knowledge.height,
    frame.x / knowledge.width,
    1 - (frame.y + frame.h) / knowledge.height
  )
  layer.scale.set(width, height, 1)
  // Primitive1 subtracts integer half-width and full height from the anchor.
  layer.center.set(width ? Math.trunc(width / 2) / width : 0.5, 0)
  layer.userData.hfxFrame = frame.source
}

export function drawVaultWorldPresentation(
  scene: GameScene,
  group: THREE.Group,
  displayedFrame: number,
  visible: boolean
) {
  group.visible = visible
  if (!visible) return
  const glow = group.userData.glow as THREE.Group,
    frame = knowledge.glow.frames[displayedFrame],
    point = group.position.clone()
  drawFrame(scene, group.children[0] as THREE.Sprite, knowledge.body, point, -300)
  point.y += glow.position.y
  drawFrame(scene, glow.children[0] as THREE.Sprite, frame, point, 16)
  glow.userData.frame = frame.source
}
