import * as THREE from 'three'
import type { GameScene } from './scene.ts'
import type { Tornado } from './tornado.ts'
import art from './original-tornado.json'
import { texture } from './scene-assets.ts'
import { scaledEffectSize } from './projection.ts'
import { short } from './native-math.ts'
import { browserPosition } from './world-coordinates.ts'
import { tornadoColor } from './tornado-appearance.ts'

export function makeTornado(tornado: Tornado) {
  const group = new THREE.Group()
  group.name = 'tornado'
  group.userData.depthBias = -128
  for (const particle of tornado.particles) {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: texture('tornado'),
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      })
    )
    sprite.name = 'tornado-column'
    const anchor = new THREE.Group()
    anchor.userData.ordinal = particle.ordinal
    anchor.userData.depthBias = -128
    sprite.userData.atlasTransform = new THREE.Vector4()
    anchor.add(sprite)
    group.add(anchor)
  }
  return group
}

export function drawTornado(scene: GameScene, group: THREE.Group, tornado: Tornado) {
  for (const child of group.children) {
    const sprite = child.children[0] as THREE.Sprite,
      particle = tornado.particles.find(p => p.ordinal === child.userData.ordinal)
    child.visible = !!particle
    if (!particle) continue
    const frame = art.frames[particle.frame],
      point = browserPosition(particle),
      depth = scene.view.project(point, particle.h / 45).z,
      size = scaledEffectSize(
        frame,
        { scaleX: particle.scaleX, scaleY: 256 },
        depth,
        scene.view.config.scaledSprites ? 0x100 : 0,
        scene.view.config
      ),
      color = tornadoColor(particle.palette)
    child.userData.cellPosition = point
    child.position.set(
      short(particle.x - tornado.x) / 256,
      (particle.h - tornado.h) / 128,
      -short(particle.y - tornado.y) / 256
    )
    sprite.userData.atlasTransform.set(
      frame.w / art.width,
      frame.h / art.height,
      frame.x / art.width,
      1 - (frame.y + frame.h) / art.height
    )
    sprite.userData.hfxFrame = frame.source
    sprite.userData.palette = particle.palette
    sprite.scale.set(size.width, size.height, 1)
    sprite.center.set(size.width ? Math.trunc(size.width / 2) / size.width : 0.5, 0)
    sprite.material.color.setStyle(`rgb(${color.join(',')})`)
  }
}
