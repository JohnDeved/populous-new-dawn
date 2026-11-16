import assert from 'node:assert/strict'
import { createDeadline } from './deadline.mjs'

// Shares the original 60-second readiness budget: public dismissal is admission
// work, not extra time or a replacement for the fixture's unchanged readiness.
export async function settleSpyStartup({ observe, dismiss, skip, record, deadline = createDeadline(Date.now() + 60000) }) {
  try {
    for (let count = 0; count <= 8; count++) {
      const state = await deadline.run(observe)
      record(state)
      if (state.ready && !state.modal) return
      assert.equal(state.modal, true, 'Startup observation must reach readiness or an open message')
      assert.ok(count < 8, 'Opening message settlement exceeded eight dismissals')
      await deadline.run(dismiss)
      await deadline.run(skip)
    }
  } finally { deadline.dispose() }
}
