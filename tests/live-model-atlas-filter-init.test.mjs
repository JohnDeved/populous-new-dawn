import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { loadTexture, nativeModel } from '../app/scene-assets.ts'

test('the ordinary model atlas initializes both filters as bilinear, unlike point-sampled assets', async t => {
  const calls = []
  t.mock.method(THREE.TextureLoader.prototype, 'load', (url, onLoad) => {
    const texture = new THREE.Texture()
    calls.push(url)
    queueMicrotask(() => onLoad(texture))
    return texture
  })
  const mesh = nativeModel(79)
  try {
    const atlas = loadTexture('atlas')
    const effects = loadTexture('effects')
    const selection = loadTexture('selection')
    assert.equal(mesh.material.map, atlas.texture)
    assert.deepEqual(await Promise.all([atlas.ready, effects.ready, selection.ready]), [true, true, true])
    assert.deepEqual(calls, ['/original/atlas.png', '/original/effects.png', '/original/selection.png'])
    const settings = ({ minFilter, magFilter, generateMipmaps }) => [minFilter, magFilter, generateMipmaps]
    assert.deepEqual(settings(atlas.texture), [THREE.LinearFilter, THREE.LinearFilter, false])
    assert.deepEqual(settings(effects.texture), [THREE.NearestFilter, THREE.NearestFilter, false])
    assert.deepEqual(settings(selection.texture), [THREE.NearestFilter, THREE.NearestFilter, false])
    assert.equal(atlas.texture.anisotropy, 1)
    assert.equal(atlas.texture.colorSpace, THREE.NoColorSpace)
    assert.equal(atlas.texture.userData.encodedColors, true)
  } finally {
    mesh.geometry.dispose()
    mesh.material.dispose()
  }
})
