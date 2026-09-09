// Translucent billboards must blend in native command order, independent of
// Three's camera and scene insertion order. Coverage is held fixed deliberately.
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'
const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  const results = await page.evaluate(() => {
    const s = window.testScene,
      r = s.renderer,
      gl = r.getContext()
    cancelAnimationFrame(s.frame)
    s.world.speed = 0
    r.setPixelRatio(1)
    r.setSize(128, 128, false)
    r.setClearColor(0, 1)
    s.view.update(128, 128, { x: -8, z: -8 }, 0, 0, false)
    s.view.uniforms.nativeBasis.value.set([16384, 0, 0, 0, 16384, 0, 0, 0, 16384])
    s.view.boundsTexture.image.data.set(Array.from({ length: 222 }, () => [1, 221]).flat())
    s.view.boundsTexture.needsUpdate = true
    const prototype = [...s.unitMeshes.values()].find(g => g.userData.layers?.length).userData
      .layers[0]
    const results = []
    for (const reverse of [false, true])
      for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
        const scene = new s.scene.constructor(),
          sprites = []
        for (const i of reverse ? [1, 0] : [0, 1]) {
          const material = new prototype.material.constructor({
            color: i ? 0x00ff00 : 0xff0000,
            opacity: 0.5,
            transparent: true,
            depthWrite: false,
            toneMapped: false,
          })
          material.onBeforeCompile = shader => {
            shader.vertexShader = shader.vertexShader.replace(
              'gl_Position = projectionMatrix * mvPosition;',
              'gl_Position = projectionMatrix * mvPosition; gl_Position.xy=rotatedPosition*vec2(2./128.,2./128.);'
            )
          }
          const sprite = new prototype.constructor(material)
          sprite.scale.set(80, 80, 1)
          const group = new s.ground.constructor()
          // Green is farther in the original camera; both cover the same pixels.
          group.position.set(-8, 0, -8 - (i * 1000) / 128)
          group.add(sprite)
          scene.add(group)
          sprites[i] = sprite
        }
        s.view.prepare(scene)
        // Rotating Three's fallback camera must not change native blending.
        s.camera.position.set(Math.sin(angle) * 100, 10, Math.cos(angle) * 100)
        s.camera.lookAt(-8, 0, -8)
        const read = () => {
          r.render(scene, s.camera)
          const pixel = new Uint8Array(4)
          gl.readPixels(64, 64, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel)
          return Array.from(pixel)
        }
        const live = read()
        // The renderer's own constant-depth stream proves the expected order.
        const depths = sprites.map(sprite => s.view.painter.depth(sprite, 0, 0))
        const update = scene.onBeforeRender
        scene.onBeforeRender = (...args) => {
          update(...args)
          sprites.forEach((sprite, i) => {
            sprite.renderOrder = -depths[i]
          })
        }
        const reference = read()
        results.push({ reverse, angle, depths, live, reference })
        sprites.forEach(sprite => sprite.material.dispose())
      }
    const mixed = []
    for (const reverse of [false, true])
      for (const angle of [0, Math.PI]) {
        const scene = new s.scene.constructor()
        const sprite = new prototype.constructor(
          new prototype.material.constructor({
            color: 0xff0000,
            opacity: 0.5,
            transparent: true,
            depthWrite: false,
            toneMapped: false,
          })
        )
        sprite.material.onBeforeCompile = shader => {
          shader.vertexShader = shader.vertexShader.replace(
            'gl_Position = projectionMatrix * mvPosition;',
            'gl_Position = projectionMatrix * mvPosition; gl_Position.xy=rotatedPosition*vec2(2./128.,2./128.);'
          )
        }
        sprite.scale.set(80, 80, 1)
        const group = new s.ground.constructor()
        group.position.set(-8, 0, -8)
        group.add(sprite)
        const geometry = s.skyBackdrop.geometry.clone(),
          Attribute = geometry.getAttribute('position').constructor
        geometry.setIndex(null)
        geometry.setAttribute(
          'position',
          new Attribute(
            new Float32Array(
              [-1000, 1000].flatMap(z =>
                Array(3)
                  .fill([0, 0, -z / 128])
                  .flat()
              )
            ),
            3
          )
        )
        geometry.setAttribute(
          'coverage',
          new Attribute(
            new Float32Array(Array(2).fill([-0.95, -0.95, 0.95, -0.95, 0, 0.95]).flat()),
            2
          )
        )
        geometry.setAttribute(
          'pigment',
          new Attribute(
            new Float32Array(
              [
                [0, 1, 0],
                [0, 0, 1],
              ].flatMap(color => Array(3).fill(color).flat())
            ),
            3
          )
        )
        const material = new s.terrain.material.constructor({
          transparent: true,
          depthWrite: false,
          uniforms: { opacity: { value: 0.5 } },
          vertexShader:
            'attribute vec2 coverage;attribute vec3 pigment;varying vec3 tint;void main(){tint=pigment;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position.xy=coverage;}',
          fragmentShader:
            'varying vec3 tint;uniform float opacity;void main(){gl_FragColor=vec4(tint,opacity);}',
        })
        const mesh = new s.skyBackdrop.constructor(geometry, material)
        mesh.position.set(-8, 0, -8)
        // A second material sharing this geometry must retain its own draw state.
        const duplicate = new s.skyBackdrop.constructor(geometry, material.clone())
        duplicate.position.copy(mesh.position)
        duplicate.material.uniforms.opacity.value = 0
        scene.add(...(reverse ? [mesh, group, duplicate] : [group, duplicate, mesh]))
        s.view.prepare(scene)
        const groups = geometry.groups,
          original = mesh.material,
          other = duplicate.material
        s.camera.position.set(Math.sin(angle) * 100, 10, Math.cos(angle) * 100)
        s.camera.lookAt(-8, 0, -8)
        r.render(scene, s.camera)
        const pixel = new Uint8Array(4)
        gl.readPixels(64, 64, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel)
        const update = scene.onBeforeRender
        scene.onBeforeRender = (...args) => {
          update(...args)
          s.view.painter.afterRender()
          r.setTransparentSort(null)
        }
        r.render(scene, s.camera)
        const baseline = new Uint8Array(4)
        gl.readPixels(64, 64, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, baseline)
        mixed.push({
          reverse,
          angle,
          pixel: Array.from(pixel),
          baseline: Array.from(baseline),
          restored:
            geometry.groups === groups &&
            mesh.material === original &&
            duplicate.material === other,
          depths: [
            s.view.painter.depth(mesh, 1, 0),
            s.view.painter.depth(sprite, 0, 0),
            s.view.painter.depth(mesh, 0, 0),
          ],
        })
        geometry.dispose()
        material.dispose()
        other.dispose()
        sprite.material.dispose()
      }
    return { results, mixed }
  })
  assert.deepEqual(errors, [])
  for (const result of results.results) {
    assert.ok(result.depths[0] < result.depths[1], JSON.stringify(result))
    assert.ok(
      result.reference[0] > result.reference[1] && result.reference[1] > 0,
      JSON.stringify(result)
    )
  }
  console.log(JSON.stringify(results, null, 2))
  assert.ok(
    results.results.every(r => r.live.every((value, i) => value === r.reference[i])),
    'Translucent sprites blend in the wrong order'
  )
  for (const result of results.mixed) {
    assert.ok(result.restored, 'Shared geometry and material ownership must survive drawing')
    assert.ok(
      result.depths[0] > result.depths[1] && result.depths[1] > result.depths[2],
      JSON.stringify(result)
    )
    assert.ok(
      [64, 128, 32].every((v, i) => Math.abs(result.pixel[i] - v) <= 1),
      JSON.stringify(result)
    )
  }
  assert.ok(
    results.mixed.some(r => r.pixel.some((v, i) => v !== r.baseline[i])),
    'Mixed overlap must expose the old whole-object sort'
  )
  console.log(
    'PASS: eight translucent sprite overlaps and four interleaved mesh/sprite overlaps retain native order; shared geometry/material ownership restored'
  )
} finally {
  await browser.close()
}
