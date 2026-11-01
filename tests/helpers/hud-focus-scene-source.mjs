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
export function previousHudFocusScene(source) {
  assert.equal(hash(source), currentHudSceneHash)
  let prior = source
  for (const [current, previous] of hudFocusBoundaries) {
    assert.equal(prior.split(current).length, 2)
    prior = prior.replace(current, previous)
  }
  assert.equal(hash(prior), previousHudSceneHash)
  return prior
}
