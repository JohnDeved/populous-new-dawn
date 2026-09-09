// Translucent billboards must blend in native command order, independent of
// Three's camera and scene insertion order. Coverage is held fixed deliberately.
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'
const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  const results = await page.evaluate(async () => {
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
    const { createWorld } = await import('/app/model.ts')
    const { createLivePerson, syncLivePersonCells } = await import('/app/live-people.ts')
    const { polygonBucket } = await import('/app/painter-order.ts')
    const { spriteBucket } = await import('/app/projection.ts')
    if (s.view.painter.cells !== s.world.objectCells)
      throw Error('Live painter is disconnected from world cells')
    const ties = []
    for (const reverse of [false, true]) {
      const w = createWorld(),
        scene = new s.scene.constructor(),
        sprites = []
      w.units = w.units.filter(u => u.team === 'blue' && u.kind === 'brave').slice(0, 3)
      for (const u of w.units) {
        Object.assign(u, { x: -8, z: -8 })
        u.native = createLivePerson(w, u)
      }
      syncLivePersonCells(w)
      s.view.painter.cells = w.objectCells
      for (const i of reverse ? [2, 1, 0] : [0, 1, 2]) {
        const material = new prototype.material.constructor({
          color: [0xff0000, 0x00ff00, 0x0000ff][i],
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
        const sprite = new prototype.constructor(material),
          group = new s.ground.constructor()
        sprite.scale.set(80, 80, 1)
        group.position.set(-8, 0, -8)
        group.userData.unit = w.units[i].id
        group.add(sprite)
        scene.add(group)
        sprites[i] = sprite
      }
      const geometry = s.skyBackdrop.geometry.clone(),
        Attribute = geometry.getAttribute('position').constructor
      geometry.setIndex(null)
      geometry.setAttribute('position', new Attribute(new Float32Array(9), 3))
      geometry.setAttribute(
        'coverage',
        new Attribute(new Float32Array([-0.95, -0.95, 0.95, -0.95, 0, 0.95]), 2)
      )
      const material = new s.terrain.material.constructor({
        transparent: true,
        depthWrite: false,
        vertexShader:
          'attribute vec2 coverage;void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position.xy=coverage;}',
        fragmentShader: 'void main(){gl_FragColor=vec4(1.,1.,1.,.5);}',
      })
      const mesh = new s.skyBackdrop.constructor(geometry, material),
        group = new s.ground.constructor()
      // Force a genuine bucket tie. A later building ID must not outrank the sprite pass.
      mesh.userData.painterBias = spriteBucket(0, -300) - 1 - polygonBucket([0, 0, 0])
      group.userData.building = 65000
      group.position.set(-8, 0, -8)
      group.add(mesh)
      scene.add(group)
      s.view.prepare(scene)
      for (const movement of ['initial', 'same-cell', 'leave', 'return']) {
        if (movement !== 'initial') {
          w.units[0].x = movement === 'leave' ? -4 : -7.99
          syncLivePersonCells(w)
        }
        sprites[0].parent.position.x = w.units[0].x
        sprites[0].parent.visible = movement !== 'leave'
        r.render(scene, s.camera)
        const pixel = new Uint8Array(4)
        gl.readPixels(64, 64, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel)
        ties.push({
          reverse,
          movement,
          pixel: Array.from(pixel),
          depths: [...sprites, mesh].map(object => s.view.painter.depth(object, 0, 0)),
        })
      }
      geometry.dispose()
      mesh.material.dispose()
      sprites.forEach(sprite => sprite.material.dispose())
    }
    return { results, mixed, ties }
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
  for (const result of results.ties) {
    const expected =
      result.movement === 'return'
        ? [144, 48, 80]
        : result.movement === 'leave'
          ? [32, 96, 160]
          : [48, 80, 144]
    assert.ok(
      expected.every((v, i) => Math.abs(result.pixel[i] - v) <= 1),
      JSON.stringify(result)
    )
  }
  console.log(
    'PASS: eight translucent sprite overlaps, four interleaved mesh/sprite overlaps and eight native cell/pass ties; shared geometry/material ownership restored'
  )
} finally {
  await browser.close()
}
