import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
const hash = text => createHash('sha256').update(text).digest('hex')
export const currentHudSceneHash = "f9d0e31cc7baf0de2061bcbb513834cff6173827f558b389825c42791449c24a"
export const previousHudSceneHash = "2593a57bc040d85f65fde882e29ff2e2e582cf1ccfdd0dfe191d2344bb28ba85"
export const hudFocusBoundaries = [
  [
    "    if (!focus) return chooseFollowers(this, model, modifiers, focus, category)\n    // Direct HUD focus resolves its target only after elapsed work; nested focus\n    // must share this input boundary rather than advancing a second time.\n    this.advanceInputTime()\n    if (this.disposed) return\n    this.inputDepth++\n    try {\n      chooseFollowers(this, model, modifiers, focus, category)\n    } finally {\n      this.inputDepth--\n      this.publishCameraInput()\n    }",
    "    chooseFollowers(this, model, modifiers, focus, category)"
  ],
  [
    "    if (!focusNext) return chooseTransport(this, kind, model, modifiers, focusNext)\n    this.advanceInputTime()\n    if (this.disposed) return\n    this.inputDepth++\n    try {\n      chooseTransport(this, kind, model, modifiers, focusNext)\n    } finally {\n      this.inputDepth--\n      this.publishCameraInput()\n    }",
    "    chooseTransport(this, kind, model, modifiers, focusNext)"
  ]
]
// Historical source readers only. Production admission always sees actual bytes.
// Reconstruct the exact reviewed HUD route from the current modal/sprite route;
// both intermediate and final whole-source identities are mandatory.
export function hudFocusScene(source) {
  if (hash(source) === currentHudSceneHash) return source
  assert.equal(hash(source), '38003b8e7e944366bcf8f788159f7a1f0cb81cc4a6a2606612f60efadb56f5da')
  const sprite = `      if (this.disposed) return
      // The input drain can advance native person animation before the next RAF.
      // Freeze sprites at that drained state, not the previous rendered frame.
      this.updateUnitsFrame()
      if (this.disposed) return
`
  assert.equal(source.split(sprite).length, 2)
  let prior = source.replace(sprite, '')
  assert.equal(hash(prior), 'd0d9cf70775701b04d336ef7e419859cf16659c2590f73aaa9c0c53ff314039b')
  const modal = 'if (this.disposed || this.modalSuspended) return'
  assert.equal(prior.split(modal).length, 4)
  prior = prior.split(modal).join('if (this.disposed) return')
  assert.equal(hash(prior), currentHudSceneHash)
  return prior
}
export function previousHudFocusScene(source) {
  source = hudFocusScene(source)
  assert.equal(hash(source), currentHudSceneHash)
  let prior = source
  for (const [current, previous] of hudFocusBoundaries) {
    assert.equal(prior.split(current).length, 2)
    prior = prior.replace(current, previous)
  }
  assert.equal(hash(prior), previousHudSceneHash)
  return prior
}
