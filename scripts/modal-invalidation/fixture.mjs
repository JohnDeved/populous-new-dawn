/* global __PND_BUILD_REVISION__ */
import { loadTexture, sceneTextureRevision } from '../../app/scene-assets.ts'
// Test-host only. The real Scene constructor always requests sky before this
// read. Reject a different visible binding instead of introducing a test texture.
export const revision = sceneTextureRevision
export function skyAsset(scene) {
  const asset = loadTexture('sky')
  if (scene.skyBackdrop.material.uniforms.map.value !== asset.texture)
    throw Error('Mission sky is not the already-requested sky asset')
  return asset
}

// Replaced only by the existing source-bound Home builder.
export const buildRevision = __PND_BUILD_REVISION__
