// Test-only scheduling boundary. Neither animate nor the browser RAF API is replaced.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
export const originalSceneHashes = {
  e1b468a9b8a355bd46fb149a1100b43442898b1e:
    'ebb5b53ad1e2fdcf32eaa639aeac29ab2bd2ea1ce3835bcfa734a2cb001899da',
  '0d9ae8b299b613fc729e3c7d05c5e9a06fd4c36f':
    'abe62552685ed0c8a90da4dd585635dbf448da966fdff25c66cf446a0065a86d',
}
const hash = s => createHash('sha256').update(s).digest('hex')
export function transformStart(source, revision) {
  assert.equal(hash(source), originalSceneHashes[revision], 'Unexpected original Scene source')
  const before =
    '    installInputListeners(this, this.mini)\n    this.frame = requestAnimationFrame(this.animate)\n    return true'
  assert.equal(source.split(before).length, 2, 'Exactly one start scheduling boundary required')
  const code = source.replace(
    before,
    '    installInputListeners(this, this.mini)\n    this.frame = globalThis.__bodyStartLatch(this)\n    return true'
  )
  return { code, originalSha256: hash(source), transformedSha256: hash(code) }
}
export function installStartLatch(codec) {
  if (window.__bodyStartLatch) throw Error('Duplicate startup latch')
  window.__bodyStartLatch = scene => {
    if (window.__bodyLatchedScene) throw Error('More than one GameScene start')
    if (scene.previous !== null || scene.frame !== 0 || scene.fpsGraph)
      throw Error('Unexpected initial callback state')
    window.__bodyLatchedScene = scene
    window.__bodyStartWorld = JSON.stringify(codec(scene.world))
    window.__bodyStartCalls = 1
    return 0
  }
  window.__bodyVerifyStart = () => {
    const s = window.__bodyLatchedScene
    if (!s || s.previous !== null || s.frame !== 0 || window.__bodyStartCalls !== 1)
      throw Error('Callback escaped startup latch')
    if (JSON.stringify(codec(s.world)) !== window.__bodyStartWorld)
      throw Error('World changed before public camera setup')
  }
}
