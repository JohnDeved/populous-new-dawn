import * as THREE from 'three'
import type { GameScene } from './scene.ts'
import type { Effect } from './world-types.ts'
import { texture } from './scene-assets.ts'
import { short } from './native-math.ts'
import { spriteBucket, spriteCoordinate } from './projection.ts'
import { swampPresentation } from './swamp-presentation.ts'
import art from './original-swamp.json'

export function makeSwampPresentation() {
  const group = new THREE.Group(),
    map = texture('swamp')
  map.minFilter = THREE.NearestFilter
  map.magFilter = THREE.NearestFilter
  map.generateMipmaps = false
  group.name = 'swamp'
  for (let i = 0; i < 14; i++) {
    const material = new THREE.SpriteMaterial({
      map,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      alphaTest: 0.001,
    })
    if (i < 9)
      material.color.setRGB(
        ...(art.bubbleColor.map(n => n / 255) as [number, number, number]),
        THREE.SRGBColorSpace
      )
    const sprite = new THREE.Sprite(material)
    sprite.name = i < 9 ? 'swamp-trap' : 'swamp-plant'
    sprite.userData.swampOrdinal = i
    sprite.userData.atlasTransform = new THREE.Vector4()
    group.add(sprite)
  }
  // 0046f290 prepends each sample; 004673b0 walks each bucket head first.
  // Painter preserves physical sprite-child order for equal depth, so reverse
  // only this group's children while retaining the native sample ordinal.
  group.children.reverse()
  return group
}

export function drawSwampPresentation(scene: GameScene, group: THREE.Group, effect: Effect) {
  group.userData.cellPosition = effect
  const swamp = effect.swamp!,
    samples = swampPresentation(
      scene.world.land,
      swamp,
      effect.id,
      scene.world.secondaryEffects.animationFrame
    ),
    scaled = scene.view.config.scaledSprites ? 0x100 : 0
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i],
      sprite = group.children[samples.length - 1 - i] as THREE.Sprite
    sprite.visible = sample.visible
    if (!sample.visible) continue
    const frame = art.frames[sample.frame],
      point = { x: sample.x / 256 - 8, z: -sample.y / 256 - 8 },
      depth = scene.view.project(point, sample.h / 45).z,
      bucket = spriteBucket(depth, -300),
      width = scaled ? spriteCoordinate(frame.w, bucket, scaled, scene.view.config) : frame.w,
      height = scaled ? spriteCoordinate(frame.h, bucket, scaled, scene.view.config) : frame.h
    sprite.position.set(
      short(sample.x - swamp.center.x) / 256,
      (sample.h - swamp.center.h) / 128,
      -short(sample.y - swamp.center.y) / 256
    )
    sprite.scale.set(width, height, 1)
    sprite.center.set(width ? Math.trunc(width / 2) / width : 0.5, 0)
    sprite.userData.source = frame.source
    sprite.userData.atlasTransform.set(
      frame.w / art.width,
      frame.h / art.height,
      frame.x / art.width,
      1 - (frame.y + frame.h) / art.height
    )
  }
}
