import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { readFileSync } from 'node:fs'
import { tornadoMaterial } from '../app/tornado-material.ts'
import { originalTornadoPixels } from '../scripts/lib/tornado-pixel-oracle.mjs'

const fixture = JSON.parse(readFileSync(new URL('./fixtures/tornado-original.json', import.meta.url)))

test('Tornado encoded tint composes after output transfer without shared particle uniforms or global changes', () => {
  const enabled = THREE.ColorManagement.enabled,
    texture = new THREE.Texture(),
    first = tornadoMaterial(texture),
    second = tornadoMaterial(texture),
    shader = { uniforms: {}, fragmentShader: THREE.ShaderLib.sprite.fragmentShader }
  first.onBeforeCompile(shader, {})
  assert.equal(THREE.ColorManagement.enabled, enabled)
  assert.deepEqual(first.color.toArray(), [1, 1, 1])
  assert.equal(first.map, texture)
  assert.equal(first.toneMapped, false)
  assert.equal(first.transparent, true)
  assert.notEqual(first.userData.tornadoTint, second.userData.tornadoTint)
  first.userData.tornadoTint.value.set(223 / 255, 155 / 255, 31 / 255)
  assert.deepEqual(second.userData.tornadoTint.value.toArray(), [1, 1, 1])
  assert.equal(shader.uniforms.tornadoTint, first.userData.tornadoTint)
  assert.match(shader.fragmentShader, /#include <colorspace_fragment>[\s\S]*gl_FragColor\.rgb \*= tornadoTint;/)
  assert.ok(!shader.fragmentShader.includes('gl_FragColor.a *='))
  assert.notEqual(first.customProgramCacheKey(), new THREE.SpriteMaterial().customProgramCacheKey())
})

test('retained HFX1136 negative palettes distinguish original encoded modulation from linear-light tint', () => {
  const pixels = originalTornadoPixels(fixture, 0),
    source = [229, 220, 214],
    present = Array.from({ length: pixels.length / 4 }, (_, i) => [...pixels.subarray(i * 4, i * 4 + 4)])
  assert.ok(present.some(pixel => pixel.join(',') === [...source, 255].join(',')))
  for (const palette of [-2, -1, 3, 4, 5]) {
    const tint = fixture.paletteTints[palette],
      encoded = source.map((channel, i) => Math.round(channel * tint[i] / 255)),
      linear = new THREE.Color().setRGB(...source.map(channel => channel / 255), THREE.SRGBColorSpace)
        .multiply(new THREE.Color().setRGB(...tint.map(channel => channel / 255), THREE.SRGBColorSpace))
        .convertLinearToSRGB().toArray().map(channel => Math.round(channel * 255))
    if (palette < 0) assert.ok(encoded.some((channel, i) => Math.abs(channel - linear[i]) > 1))
    if (palette === -1) assert.deepEqual(encoded, [200, 134, 26])
  }
})
