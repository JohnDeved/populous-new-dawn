import assert from 'node:assert/strict'

// Trusted acceptance validates both independent candidate exports. A previous
// combined run, a skipped variant, or a single successful case cannot satisfy it.
export function assertPauseGroup(records) {
  for (const mode of ['native', 'fallback']) {
    const id = `pause-checkpoint-${mode}`
    const matches = records.filter(record => record.id === id)
    assert.equal(matches.length, 1, `Exactly one ${id} result required`)
    const record = matches[0], result = record.result
    assert.equal(record.status, 'passed')
    assert.equal(record.timedOut, false)
    assert.equal(record.cleanupVerified, true)
    assertPauseResult(mode, result)
  }
}

export function assertPauseResult(mode, result) {
  assert.ok(['native', 'fallback'].includes(mode))
  assert.deepEqual(result?.executionContract, { version: 'pause-style-split-v1', mode, primary: false })
  const body = [], focus = []
  for (const size of ['320x240', '640x480', '800x450', '1920x1080']) {
    focus.push(`root-${size}`)
    for (const category of ['Game', 'Sound', 'Graphics']) focus.push(`options-${category}-${size}`)
    for (const panel of ['save', 'load']) {
      body.push(`${panel}-${size}`)
      if (size !== '320x240') focus.push(`${panel}-${size}`)
    }
  }
  for (const entry of [...result.records, ...result.fullscreen])
    assert.equal(entry.fallback, mode === 'fallback', 'Variant identity must match its independent episode')
  assert.deepEqual(result.records.map(entry => `${entry.panel}-${entry.viewport.width}x${entry.viewport.height}`).sort(), body.sort(),
    'Each font variant requires eight distinct checkpoint body cases')
  assert.deepEqual(result.fullscreen.map(entry => entry.label).sort(), focus.sort(),
    'Each font variant requires twenty-two distinct fullscreen focus cases')
}
