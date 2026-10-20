import * as THREE from 'three'
import { texture } from './scene-assets.ts'
import artwork from './original-shield.json'
import { shieldRectangles, type ShieldAppearance } from './shield-appearance.ts'
import type { CameraConfig } from './projection.ts'

function makeShieldSprites() {
  return [0, 1, 2].map(piece => {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: texture(artwork.atlas),
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      })
    )
    sprite.name = `magic-shield-${piece}`
    sprite.visible = false
    sprite.userData.atlasTransform = new THREE.Vector4()
    return sprite
  })
}

export function updateShieldSprites(
  group: THREE.Group,
  state: ShieldAppearance,
  view: CameraConfig
) {
  const sprites = group.userData.shield as THREE.Sprite[],
    rectangles = shieldRectangles(state, view)
  if (!sprites.length && rectangles.length) sprites.push(...makeShieldSprites())
  if (!sprites.length) return
  // Body layers may be added lazily as the pose changes. The painter retains
  // child order within this person's sprite bucket: body, then pieces 0, 1, 2.
  if (group.children.at(-1) !== sprites[2]) group.add(...sprites)
  for (let piece = 0; piece < sprites.length; piece++) {
    const sprite = sprites[piece],
      rectangle = rectangles[piece]
    sprite.visible = !!rectangle
    if (!rectangle) continue
    const { frame, rgb, x, y, width, height } = rectangle
    sprite.userData.source = frame.source
    sprite.userData.atlasTransform.set(
      frame.w / artwork.width,
      frame.h / artwork.height,
      frame.x / artwork.width,
      1 - (frame.y + frame.h) / artwork.height
    )
    sprite.material.color.setRGB(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, THREE.SRGBColorSpace)
    sprite.center.set(-x / width, 1 + y / height)
    sprite.scale.set(width, height, 1)
  }
}
