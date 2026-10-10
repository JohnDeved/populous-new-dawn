import assert from 'node:assert/strict'
import { selectHudPeople, focusHudPerson } from '../../app/hud-selection.ts'
import { selectTaskFollowers, focusTaskFollower } from '../../app/hud-tasks.ts'
import { browserPosition } from '../../app/world-coordinates.ts'

function assertInput(input, label, { focus = false, ctrl = false, shift = false, toggle = false } = {}) {
  assert.ok(input?.trusted && input.phase > 0, 'Actual trusted event must own the Scene call')
  assert.equal(input.label, label, 'Actual public control must own the input')
  assert.equal(input.repeat, false)
  if (toggle) {
    assert.ok(input.type === 'pointerup' && input.button === 0 ||
      input.type === 'keyup' && ['Enter', ' '].includes(input.key) ||
      input.type === 'click' && input.detail === 0, 'Expected completed mode activation')
  } else {
    assert.equal(input.ctrl, ctrl)
    assert.equal(input.shift, shift)
    assert.equal(input.type, focus ? 'contextmenu' : ctrl ? 'pointerup' : 'click')
    assert.equal(input.button, focus ? 2 : 0)
  }
}

export function assertNearbySurface(state, surface) {
  assert.equal(surface.toggle.pressed, String(state.nearby))
  assert.equal(surface.toggle.disabled, false)
  assert.deepEqual(surface.toggle.sprite, surface.toggle.expectedSprite)
  assert.equal(surface.meter, surface.expectedMeter)
  assert.equal(surface.classes.length, 6)
  assert.equal(surface.tasks.length, 24)
  for (const row of [...surface.classes, ...surface.tasks]) {
    assert.equal(row.disabled, row.expectedDisabled, row.label)
    assert.deepEqual(row.number, row.expected, row.label)
  }
  const { viewport, toggle, sprite, controls } = surface.layout
  for (const r of [toggle, ...controls]) {
    assert.ok(r.width > 0 && r.height > 0, 'Every retained control has a real hit rectangle')
    assert.ok(r.x >= -0.5 && r.y >= -0.5 && r.x + r.width <= viewport[0] + 0.5 &&
      r.y + r.height <= viewport[1] + 0.5, 'Control must fit the actual viewport')
  }
  assert.ok(sprite.x >= toggle.x - 0.5 && sprite.y >= toggle.y - 0.5 &&
    sprite.x + sprite.width <= toggle.x + toggle.width + 0.5 &&
    sprite.y + sprite.height <= toggle.y + toggle.height + 0.5, 'Original icon must fit its control')
}

export function assertNearbySelection(row) {
  assert.equal(row.kind, 'selection')
  assert.equal(row.threw, false)
  assert.equal(row.after.turn, row.before.turn, 'Input observation must be synchronous')
  const { model, category, shift, ctrl, focus } = row.command,
    people = structuredClone(category ? row.before.people : row.before.classPeople),
    point = row.before.center, nearby = row.before.nearby
  const kinds = { 0: 'Followers', 2: 'Braves', 3: 'Warriors', 6: 'Firewarriors', 4: 'Preachers', 5: 'Spies' },
    classes = { 0: 'follower', 2: 'brave', 3: 'warrior', 6: 'firewarrior', 4: 'preacher', 5: 'spy' },
    label = category ? `${['', 'Currently selected', 'Idle', 'Housed', 'Busy'][category]} ${kinds[model]}`
      : `Select ${classes[model]}`
  assertInput(row.input, label, { focus, ctrl, shift })
  if (focus) {
    const index = category ? model * 6 + category : model,
      previous = (category ? row.before.taskFocus : row.before.focus)[index],
      expected = category
        ? focusTaskFollower(people, model, category, point, previous, shift, nearby)
        : focusHudPerson(people, model, point, previous, shift, nearby)
    assert.equal((category ? row.after.taskFocus : row.after.focus)[index], expected)
    assert.deepEqual(row.after.selected, row.before.selected)
    if (expected) {
      assert.ok(row.after.panels.includes(expected))
      assert.deepEqual(row.focusCalls, [{ point: browserPosition(people.find(p => p.id === expected)),
        options: { animate: true }, receiverMatches: true }])
    } else assert.deepEqual(row.focusCalls, [])
  } else {
    assert.deepEqual(row.focusCalls, [])
    const mode = shift ? 'all' : ctrl && model !== 7 ? 'five' : 'single'
    if (category) selectTaskFollowers(people, model, category, point, mode, nearby)
    else selectHudPeople(people, model, point, mode, nearby)
    assert.deepEqual(row.after.selected, people.filter(p => p.selectionFlags & 128).map(p => p.id))
  }
}

export function assertNearbyEvidence(evidence, expected = {}) {
  assert.equal(evidence.closed, true)
  assert.equal(evidence.exported, true)
  assert.equal(evidence.overflow, false)
  assert.equal(evidence.errorCount, 0)
  assert.deepEqual(evidence.errors, [])
  assert.ok(evidence.requests > 0 && evidence.commits > 0, 'An ordinary mode episode cannot be empty')
  let pending = null, lastCommit = null
  const phases = []
  for (const row of evidence.records) {
    assert.equal(row.threw, false)
    if (row.kind === 'request') {
      assertInput(row.input, 'Nearby followers', { toggle: true })
      assert.equal(row.before.flags, row.after.flags, 'Request cannot anticipate commitment')
      assert.equal(row.before.turn, row.after.turn)
      assert.equal(typeof row.admitted, 'boolean')
      assert.deepEqual(row.cues, [{ cue: row.before.nearby ? 0x6f : 0x6e, attenuation: 1, pan: 0 }])
      if (row.admitted) {
        assert.equal(pending, null, 'First admitted request owns the pending transition')
        pending = row
      } else assert.ok(pending, 'Rejected request requires an already admitted mode request')
    } else if (row.kind === 'commit') {
      assert.ok(pending, 'Commit must follow its actual admitted request')
      assert.equal(row.phase, pending.phase, 'Request and commit must belong to the same marked action')
      assert.equal(row.beforeFlags, pending.before.flags)
      assert.equal(row.after.nearby, !pending.before.nearby)
      assert.equal((row.beforeFlags ^ row.after.flags) >>> 0, 128, 'Only the committed mode bit changes')
      assert.ok(Number.isFinite(row.now))
      phases.push(row.phase)
      pending = null
      lastCommit = row
    } else assertNearbySelection(row)
  }
  assert.equal(pending, null, 'No uncommitted action may remain at the episode endpoint')
  assert.ok(evidence.terminal, 'Terminal state must be captured before observer detachment')
  assert.equal(evidence.terminal.nearby, lastCommit.after.nearby)
  if (expected.phases) assert.deepEqual(phases, expected.phases)
  if (expected.nearby !== undefined) assert.equal(evidence.terminal.nearby, expected.nearby)
}
