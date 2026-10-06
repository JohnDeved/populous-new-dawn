import assert from 'node:assert/strict'

export function requireUnitTexture(sample, warnings, origin) {
  assert.equal(sample.contextLost, false); assert.equal(sample.isTexture, true)
  assert.equal(sample.maxTextureSize, sample.rendererMaxTextureSize)
  assert.ok(Number.isInteger(sample.maxTextureSize) && sample.maxTextureSize >= 8128)
  assert.ok(sample.materialCount > 0 && sample.sharedMaterialCount >= sample.materialCount)
  assert.equal(sample.htmlImage, true); assert.equal(sample.imageComplete, true)
  assert.deepEqual([sample.naturalWidth, sample.naturalHeight, sample.imageWidth, sample.imageHeight], [2048, 8128, 2048, 8128])
  assert.equal(sample.url, origin + '/original/unit-layers.png')
  assert.ok(sample.mapUuid && sample.sourceUuid && sample.textureVersion > 0 && sample.sourceVersion > 0)
  assert.equal(sample.rendererTextureVersion, sample.textureVersion)
  assert.equal(sample.rendererSourceVersion, sample.sourceVersion)
  const observed = sample.observation
  assert.equal(observed.failure, null)
  assert.ok(observed.context && observed.texture && observed.image)
  assert.ok(observed.records.length > 0)
  assert.ok(observed.records.every(row => row.returnedNormally && row.supported), 'Unsupported actual unit-map upload path')
  // The pinned Three regular-image path uses one immutable allocation and one
  // original-image upload. Reject extras/redefinitions, resized canvases and mips.
  assert.deepEqual(observed.records.map(row => row.method), ['texStorage2D', 'texSubImage2D'])
  const [allocation, upload] = observed.records
  assert.equal(allocation.bindingUnchanged,true)
  assert.deepEqual([allocation.immutableBefore, allocation.immutable, allocation.immutableLevels], [false, true, 1])
  assert.deepEqual([upload.immutable, upload.immutableLevels], [true, 1])
  assert.deepEqual([allocation.target, allocation.internalFormat, upload.target, upload.format, upload.type], [3553, 35907, 3553, 6408, 5121])
  assert.deepEqual([allocation.levels, allocation.width, allocation.height], [1, 2048, 8128])
  assert.deepEqual([upload.level, upload.x, upload.y, upload.width, upload.height], [0, 0, 0, 2048, 8128])
  assert.equal(upload.image.id, observed.image); assert.equal(upload.image.htmlImage, true)
  assert.equal(upload.image.complete, true); assert.equal(upload.image.url, sample.url)
  assert.deepEqual([upload.image.naturalWidth, upload.image.naturalHeight], [2048, 8128])
  // Three's resize warning is not guaranteed to name the atlas URL. Reject any
  // resize/oversize warning; retain all unrelated warnings in the raw receipt.
  assert.ok(warnings.every(message => !/texture.*(?:resiz|too big|too large|exceed)|(?:resiz|too big|too large).*texture/i.test(message)), 'Texture resize/oversize warning')
  return sample
}

export function requireSameUnitTexture(before, after) {
  for (const key of ['mapUuid', 'sourceUuid', 'textureVersion', 'sourceVersion', 'rendererTextureVersion', 'rendererSourceVersion', 'url', 'maxTextureSize', 'rendererMaxTextureSize'])
    assert.equal(after[key], before[key], key)
  for (const key of ['context', 'texture', 'image']) assert.equal(after.observation[key], before.observation[key], key)
  assert.deepEqual(after.observation.records, before.observation.records)
}
