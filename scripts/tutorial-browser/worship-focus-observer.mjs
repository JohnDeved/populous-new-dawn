import assert from 'node:assert/strict'

// Passed directly to page.evaluate: keep this function closure-independent.
// The real target's synchronous production listener was registered first.
// This observer copies scalars only; it neither invokes nor replaces actions.
export function installWorshipFocusObserver() {
  const h = window.worshipLifecycle, button = h.button, personId = h.units[0].id
  if (!button || Number(button.dataset.person) !== personId)
    throw Error('Expected retained worship button for the first person')
  h.worshipFocusObservation = { count: 0, sample: null }
  const observe = event => {
    const panel = h.scene.objectPanels.panels.get(personId)
    h.worshipFocusObservation.count++
    h.worshipFocusObservation.sample = {
      phase: 'post-production-contextmenu-handler',
      type: event.type,
      isTrusted: event.isTrusted,
      currentTargetIsButton: event.currentTarget === button,
      targetWithinButton: event.target === button || button.contains(event.target),
      buttonIsRetained: h.button === button,
      personId: Number(button.dataset.person),
      inspected: h.scene.objectPanels.inspected,
      hasPersonPanel: !!panel,
      personPanelKind: panel?.kind ?? null,
    }
  }
  button.addEventListener('contextmenu', observe, { capture: false, once: true })
  h.stopWorshipFocusObservation = () => button.removeEventListener('contextmenu', observe, false)
}

export function assertWorshipFocusObservation(observation, personId) {
  assert.equal(observation?.count, 1, 'Exactly one synchronous observation is required')
  const sample = observation.sample
  assert.ok(sample, 'Missing synchronous contextmenu observation')
  assert.equal(sample.phase, 'post-production-contextmenu-handler')
  assert.equal(sample.type, 'contextmenu')
  assert.equal(sample.isTrusted, true, 'Focus must originate from trusted browser input')
  assert.equal(sample.currentTargetIsButton, true, 'Observe the exact retained button')
  assert.equal(sample.targetWithinButton, true, 'Input target must belong to the retained button')
  assert.equal(sample.buttonIsRetained, true, 'The retained button must not be replaced')
  assert.equal(sample.personId, personId, 'The button must still identify the expected person')
  assert.equal(sample.inspected, personId, 'Production must synchronously inspect the expected person')
  assert.equal(sample.hasPersonPanel, true, 'Production must synchronously retain the person panel')
  assert.equal(sample.personPanelKind, 'person', 'The panel must be a person panel')
}
