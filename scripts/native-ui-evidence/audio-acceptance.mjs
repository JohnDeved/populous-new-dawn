import assert from 'node:assert/strict'

// These are independent fresh-context flows, not two labels for one combined run.
export function assertAudioGroup(records) {
  for (const mode of ['native', 'fallback']) {
    const matches = records.filter(record => record.id === `options-audio-${mode}`)
    assert.equal(matches.length, 1, `Exactly one options-audio-${mode} result required`)
    const record = matches[0]
    assert.equal(record.status, 'passed')
    assert.equal(record.timedOut, false)
    assert.equal(record.cleanupVerified, true)
    assertAudioResult(mode, record.result)
  }
}

export function assertAudioResult(mode, result) {
  assert.ok(['native', 'fallback'].includes(mode))
  const fallback = mode === 'fallback'
  assert.equal(result?.status, 'passed')
  assert.deepEqual(result.executionContract, { version: 'audio-style-split-v1', mode, primary: false })
  assert.deepEqual(result.completedModes, [mode], 'The exact flow must finish including owned cleanup')
  assert.deepEqual(result.samples.map(sample => sample.name), ['off', 'hover', 'focus', 'pending', 'on-compact'],
    'Each audio variant requires all five distinct rendered states')
  for (const sample of result.samples) {
    assert.equal(sample.dpr, fallback ? 2 : 1)
    assert.equal(sample.file, `${fallback ? 'fallback-dpr2' : 'glyphs-dpr1'}-${sample.name}.png`)
  }
  for (const key of ['inputBudgets', 'popupPreparations']) {
    assert.equal(result[key].length, 1, `Exactly one ${key} trace required`)
    assert.equal(result[key][0].fallback, fallback)
    assert.equal(result[key][0].status, 'passed')
  }
  const popup = result.popupPreparations[0]
  assert.equal(popup.sameOwner, true)
  assert.ok(popup.retainedAfter.length > 0)
  assert.deepEqual(popup.afterMenu, popup.retainedAfter)
  assert.ok(Array.isArray(popup.retainedBeforeReentry))
  assert.deepEqual(popup.afterReentry, popup.retainedBeforeReentry, 'Reentry must actually verify retained popups')
  const checks = result.checks.filter(check => typeof check === 'object' && check !== null)
  for (const check of checks) assert.equal(check.fallback, fallback, 'Audio check variant must match its episode')
  assert.deepEqual(checks.filter(check => check.phase).map(check => check.phase), [
    'baseline', 'pending', 'pending-Enter', 'pending-Space', 'pending-pointer', 'rejected-held-release',
    'retry-keyboard-reachability', 'real-resume-recovered-under-menu-pause', 'real-playback-after-Continue',
    'mute-keyboard-reachability', 'native-Space-mute',
  ], 'Each audio variant requires its complete input, recovery, playback and mute flow')
  assert.equal(checks.filter(check => check.pendingPointerTarget).length, 1)
  assert.equal(checks.filter(check => check.recoveredAudioContext).length, 1)
  for (const check of checks.filter(check => check.phase?.endsWith('keyboard-reachability')))
    assert.equal(check.status, 'passed')
  assert.deepEqual(result.browserOwners.map(owner => owner.phase), [
    'gameplay-before-menu', 'options-modal', 'enabled-gameplay-no-footer', 'reentered-options-modal', 'gameplay-after-menu',
  ], 'Each audio variant requires both menu entries and final gameplay ownership')
  for (const owner of result.browserOwners) assert.equal(owner.fallback, fallback)
  for (const key of ['traceWriteErrors', 'optionsNavigationCleanup', 'cleanupErrors'])
    assert.deepEqual(result[key] ?? [], [], 'Audio evidence cannot pass with unverified cleanup or persistence')
}
