import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { compactPngChunks } from './compact-png.mjs'
import original from '../../app/original-angel.json' with { type: 'json' }
import { expectedAngelResourceUV, validateAngelResourceObservation } from '../integration-queue/spell-visuals-render-evidence.mjs'
export { angelAttributeChecksum } from '../integration-queue/spell-visuals-render-evidence.mjs'
export const expectedAngelUV = (base, owner) => expectedAngelResourceUV(original, base, owner)
export const validateAngelObservation = (observation, fixture, segment) => validateAngelResourceObservation(observation, fixture, segment, original)
function retainedAngelImage(crop, width, height) {
  assert.match(crop.png, /^data:image\/png;base64,/)
  const bytes = Buffer.from(crop.png.split(',')[1], 'base64')
  assert.ok(bytes.length > 64 && bytes.length <= width * height * 5)
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  assert.equal(bytes.readUInt32BE(16), crop.clip.width); assert.equal(bytes.readUInt32BE(20), crop.clip.height)
  return { bytes, sha256: createHash('sha256').update(bytes).digest('hex') }
}

export const retainedAngelCrop = crop => retainedAngelImage(crop, 256, 256)
export const retainedAngelContext = frame => {
  const raw = retainedAngelImage(frame, 1440, 1000), retained = compactPngChunks(raw.bytes)
  return { ...retained, sha256: retained.encoding.retainedSha256 }
}
