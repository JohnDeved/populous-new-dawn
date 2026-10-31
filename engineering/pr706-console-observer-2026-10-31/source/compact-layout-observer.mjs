import assert from 'node:assert/strict'

// evaluateAll resolves the same six public Playwright locators (including .first()).
// After the same two RAF waits, all DOM reads below are synchronous in one page task.
// Scope is the frozen candidate's five native buttons and unroled summary.
export function observeCompactLayout(elements, compactMessageWitness) {
  const definitions = [
    ['portrait', 'Select shaman', 'BUTTON'], ['brave', 'Select brave', 'BUTTON'],
    ['resume', 'Resume game', 'BUTTON'], ['settings', 'Game settings', 'BUTTON'],
    ['campaign', 'Read campaign message', 'SUMMARY'], ['dismiss', 'Dismiss campaign message', 'BUTTON'],
  ]
  // Chromium visibility semantics used by the pinned Playwright runtime, including
  // opacity:0 (still visible), content visibility and display:contents descendants.
  const visible = el => {
    const style = getComputedStyle(el)
    if (style.display === 'contents') {
      for (const child of el.childNodes) {
        if (child.nodeType === 1 && visible(child)) return true
        if (child.nodeType === 3) {
          const range = el.ownerDocument.createRange(); range.selectNode(child)
          const r = range.getBoundingClientRect(); if (r.width > 0 && r.height > 0) return true
        }
      }
      return false
    }
    if (!el.checkVisibility() || style.visibility !== 'visible') return false
    const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0
  }
  const enabled = el => {
    // SUMMARY has no implicit ARIA role in the pinned Playwright role engine.
    if (el.tagName === 'SUMMARY') return true
    if (el.hasAttribute('disabled')) return false
    const fieldset = el.closest('FIELDSET[DISABLED]'), legend = fieldset?.querySelector(':scope > LEGEND')
    if (fieldset && (!legend || !legend.contains(el))) return false
    // All other accepted elements are native BUTTONs with implicit role button.
    for (let node = el; node; node = node.parentElement ?? node.getRootNode().host) {
      const value = (node.getAttribute('aria-disabled') || '').toLowerCase()
      if (value === 'true') return false
      if (value === 'false') return true
    }
    return true
  }
  const controls = {}
  const known = new Set(definitions.map(([, label]) => label))
  const unexpectedLabels = elements.map(el => el.getAttribute('aria-label')).filter(label => !known.has(label))
  const witness = compactMessageWitness()
  for (const [key, label, tag] of definitions) {
    const matches = elements.filter(el => el.getAttribute('aria-label') === label)
    controls[key] = { count: matches.length }
    if (matches.length !== 1) continue
    const el = matches[0], r = el.getBoundingClientRect()
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)
    controls[key] = { count: 1, supported: el.tagName === tag && !el.hasAttribute('role'),
      visible: visible(el), enabled: enabled(el),
      left: r.left, top: r.top, right: r.right, bottom: r.bottom,
      reachable: Boolean(hit && (hit === el || el.contains(hit))) }
  }
  return { witness, controls, unexpectedLabels }
}

export function compactLayoutEvaluationSource(compactMessageWitness) {
  return `elements => {
    return (${observeCompactLayout.toString()})(elements, (${compactMessageWitness.toString()}))
  }`
}

export function assertCompactLayout(observation, width, height) {
  const { witness, controls, unexpectedLabels } = observation
  const overlap = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
  assert.deepEqual(unexpectedLabels, [])
  assert.deepEqual(witness.viewport, [width, height]); assert.equal(witness.overflow, false)
  assert.equal(witness.worldMessages.length, 1); assert.equal(witness.campaignText.length, 1)
  assert.ok(witness.pause, 'Public pause badge must remain visible')
  assert.deepEqual(Object.keys(controls), ['portrait', 'brave', 'resume', 'settings', 'campaign', 'dismiss'])
  for (const box of Object.values(controls)) {
    assert.equal(box.count, 1); assert.equal(box.supported, true, 'Frozen button/summary role contract changed')
    assert.equal(box.visible, true); assert.equal(box.enabled, true)
    assert.ok(box.right > box.left && box.bottom > box.top)
    assert.ok(box.left >= 0 && box.top >= 0 && box.right <= width && box.bottom <= height)
    assert.equal(box.reachable, true, 'Control center must receive pointer input')
  }
  const text = [...witness.worldMessages, ...witness.campaignText]
  for (const node of text) {
    assert.equal(node.fontSize, 12); assert.equal(node.contentFits, true); assert.ok(node.fragments.length)
    for (const fragment of node.fragments) {
      assert.ok(fragment.left >= 0 && fragment.top >= 0 && fragment.right <= width && fragment.bottom <= height)
      for (const clip of node.clips) {
        assert.equal(clip.clipPath, 'none'); assert.equal(clip.clip, 'auto')
        if (clip.clipX) assert.ok(fragment.left >= clip.left - 0.5 && fragment.right <= clip.right + 0.5)
        if (clip.clipY) assert.ok(fragment.top >= clip.top - 0.5 && fragment.bottom <= clip.bottom + 0.5)
      }
    }
    for (const control of [controls.portrait, controls.brave, controls.resume, controls.settings])
      assert.equal(overlap(node, control), false, 'Campaign/status text must not cover controls')
  }
  assert.equal(overlap(text[0], text[1]), false, 'Campaign and status remain separate')
  for (const node of text) assert.equal(overlap(node, witness.pause), false)
  return observation
}
