import assert from 'node:assert/strict'

// Consume geometry from the shipped pause dialog, including the actual bitmap
// spans or fallback line fragments. Scrolled lines may be vertically clipped by
// the body, but neither the body nor its text may extend into the live HUD.
export function assertCheckpointBodyClearance(layout) {
  const valid = box => box && ['x', 'y', 'right', 'bottom'].every(key => Number.isFinite(box[key])) &&
    box.right > box.x && box.bottom > box.y
  const { body, hud, viewport } = layout
  assert.ok(viewport && [viewport.width, viewport.height].every(value => Number.isFinite(value) && value > 0),
    'Checkpoint viewport dimensions must be finite and positive')
  assert.ok(valid(body.box) && valid(hud), 'Checkpoint body and live HUD geometry are required')
  assert.ok(body.box.x >= 0 && body.box.y >= 0 && body.box.right <= viewport.width && body.box.bottom <= viewport.height,
    'Checkpoint body remains within the viewport')
  assert.ok(body.box.x >= hud.right, 'Checkpoint body must clear the live native HUD')
  assert.ok(body.paragraphs.length > 0, 'Checkpoint explanations remain present')
  for (const paragraph of body.paragraphs) {
    assert.ok(paragraph.lines.length > 0, 'Each checkpoint explanation has rendered lines')
    for (const line of paragraph.lines) {
      assert.ok(valid(line), 'Checkpoint text line geometry must be finite and positive-area')
      assert.ok(line.x >= body.box.x - .1 && line.right <= body.box.right + .1,
        `Checkpoint text stays inside its HUD-safe body: ${paragraph.copy}`)
    }
  }
}
