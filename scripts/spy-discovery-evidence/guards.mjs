import assert from 'node:assert/strict'

// Supplied-Spy interruption evidence, not natural acquisition or native parity.
export function assertSpyRetained(before, after) {
  for (const key of ['current', 'sameUnit', 'samePerson', 'ownerRegistered']) assert.equal(after[key], true, key)
  for (const key of ['turn', 'paused', 'disguise', 'hp', 'tribe', 'invisibility', 'randomState', 'mode', 'inputMask'])
    assert.deepEqual(after[key], before[key], key)
  assert.equal(after.paused, true)
  assert.deepEqual(after.selected, before.selected)
  assert.deepEqual(after.position, before.position)
  assert.equal(before.pending, null)
  assert.equal(after.pending, null, 'Blocked press must not stage discovery')
}

export async function spyGuardCycle({ kind, enter, leave, read, click, capture, stage }) {
  assert.ok(kind === 'options' || kind === 'overview')
  const before = await read()
  assertSpyRetained(before, before)
  assert.equal(before.modal, false)
  assert.equal(before.overview, false)
  await enter()
  const entered = await read()
  assertSpyRetained(before, entered)
  assert.equal(entered[kind === 'options' ? 'modal' : 'overview'], true)
  await capture(`${kind}-blocked`)
  for (let i = 0; i < 2; i++) {
    const admission = await click()
    assert.equal(admission.trusted, true, 'Observe actual trusted pointerdown')
    // Options is a DOM-blocked witness, not a direct scene-handler invocation.
    assert.equal(admission.canvas, kind === 'overview')
    if (kind === 'options') {
      assert.equal(admission.inOpenDialog, true, 'Options press must target its open dialog subtree')
      assert.equal(admission.dialogPanel, 'options')
    }
    const blocked = await read()
    assertSpyRetained(before, blocked)
    assert.equal(blocked[kind === 'options' ? 'modal' : 'overview'], true)
    stage(`${kind}-rejected-${i}`, { admission, blocked })
  }
  await leave()
  const restored = await read()
  assertSpyRetained(before, restored)
  assert.equal(restored.modal, false)
  assert.equal(restored.overview, false)
  stage(`${kind}-restored`, restored)
}
