// Selected-palette renderer fixture, not natural terrain/gameplay evidence.
import * as THREE from 'three'
import { tornadoMaterial } from '../../app/tornado-material.ts'
import { loadTexture } from '../../app/scene-assets.ts'

export async function renderTornadoMaterialPalettes(palettes) {
  const asset = loadTexture('tornado')
  if (!(await asset.ready)) throw Error('Original Tornado atlas failed to load')
  const atlas = asset.texture,
    response = await fetch(atlas.image.src)
  if (!response.ok) throw Error('Loaded Tornado atlas readback failed')
  const sourcePNG = [...new Uint8Array(await response.arrayBuffer())]
  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true }),
    map = atlas.clone(),
    material = tornadoMaterial(map),
    scene = new THREE.Scene(),
    camera = new THREE.OrthographicCamera(-40, 40, 25, -25, 0.1, 10),
    sprite = new THREE.Sprite(material),
    before = THREE.ColorManagement.enabled,
    results = []
  camera.position.z = 1
  renderer.setPixelRatio(1)
  renderer.setSize(80, 50)
  map.repeat.set(80 / 2048, 50 / 128)
  map.offset.set(0, 1 - 50 / 128)
  map.needsUpdate = true
  sprite.scale.set(80, 50, 1)
  scene.add(sprite)
  const gl = renderer.getContext(),
    extension = gl.getExtension('WEBGL_debug_renderer_info'),
    graphics = {
      renderer: extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      outputColorSpace: renderer.outputColorSpace,
      textureColorSpace: map.colorSpace,
      colorManagement: before,
      viewport: { width: 80, height: 50, dpr: 1 },
    }
  try {
    for (const [palette, tint] of Object.entries(palettes)) {
      material.userData.tornadoTint.value.set(...tint.map(channel => channel / 255))
      const sample = { palette: +palette, black: [], white: [] }
      for (const [name, color] of [['black', 0], ['white', 0xffffff]]) {
        renderer.setClearColor(color, 1)
        renderer.render(scene, camera)
        const pixels = new Uint8Array(80 * 50 * 4)
        gl.readPixels(0, 0, 80, 50, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
        // Original retained PSFB rows run top-to-bottom; readPixels runs bottom-up.
        for (let y = 49; y >= 0; y--)
          sample[name].push(...pixels.subarray(y * 80 * 4, (y + 1) * 80 * 4))
      }
      results.push(sample)
    }
    if (THREE.ColorManagement.enabled !== before) throw Error('Global color management changed')
    return { results, graphics, sourceURL: atlas.image.src, sourcePNG, limit: 'Selected palettes -2/-1/3/4/5 on HFX1136, production material and atlas; separate renderer fixture, not natural terrain coverage.' }
  } finally {
    material.dispose()
    map.dispose()
    renderer.dispose()
    renderer.forceContextLoss()
  }
}
