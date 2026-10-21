import assert from 'node:assert/strict'
import { campaignPopupState } from '../../scripts/browser-world-input.mjs'

// Existing keyboard-boundary fixtures have no rendered campaign notifications.
// Popup/focus ownership itself is exercised by browser-world-input.test.mjs.
export function withoutCampaignPopup(page) {
  return {
    ...page,
    evaluate: (read, arg) => read === campaignPopupState ? Promise.resolve([]) : page.evaluate(read, arg),
    locator(selector) {
      assert.equal(selector, '.world-viewport')
      return { focus: async ({ timeout }) => assert.ok(timeout > 0) }
    },
  }
}
