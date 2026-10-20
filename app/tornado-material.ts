import * as THREE from 'three'

export function tornadoMaterial(map: THREE.Texture) {
  const material = new THREE.SpriteMaterial({
    map,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  })
  material.userData.tornadoTint = { value: new THREE.Vector3(1, 1, 1) }
  material.onBeforeCompile = shader => {
    shader.uniforms.tornadoTint = material.userData.tornadoTint
    shader.fragmentShader =
      'uniform vec3 tornadoTint;\n' +
      shader.fragmentShader.replace(
        '#include <colorspace_fragment>',
        `#include <colorspace_fragment>
// Original palette modulation operates on encoded RGB, before alpha blending.
gl_FragColor.rgb *= tornadoTint;`
      )
  }
  material.customProgramCacheKey = () => 'tornado-encoded-palette-v1'
  return material
}
