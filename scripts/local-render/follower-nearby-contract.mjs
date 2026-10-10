import assert from 'node:assert/strict'
import { selectHudPeople, focusHudPerson } from '../../app/hud-selection.ts'
import { selectTaskFollowers, focusTaskFollower } from '../../app/hud-tasks.ts'

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
}

export function assertNearbySelection(row) {
  assert.equal(row.kind, 'selection')
  assert.equal(row.threw, false)
  assert.ok(row.input?.trusted && row.input.phase > 0, 'Actual trusted event must own the Scene call')
  assert.equal(row.after.turn, row.before.turn, 'Input observation must be synchronous')
  const { model, category, shift, ctrl, focus } = row.command,
    people = structuredClone(category ? row.before.people : row.before.classPeople),
    point = row.before.center, nearby = row.before.nearby
  if (focus) {
    const index = category ? model * 6 + category : model,
      previous = (category ? row.before.taskFocus : row.before.focus)[index],
      expected = category
        ? focusTaskFollower(people, model, category, point, previous, shift, nearby)
        : focusHudPerson(people, model, point, previous, shift, nearby)
    assert.equal((category ? row.after.taskFocus : row.after.focus)[index], expected)
    assert.deepEqual(row.after.selected, row.before.selected)
    if (expected) assert.ok(row.after.panels.includes(expected))
  } else {
    const mode = shift ? 'all' : ctrl && model !== 7 ? 'five' : 'single'
    if (category) selectTaskFollowers(people, model, category, point, mode, nearby)
    else selectHudPeople(people, model, point, mode, nearby)
    assert.deepEqual(row.after.selected, people.filter(p => p.selectionFlags & 128).map(p => p.id))
  }
}

export function assertNearbyEvidence(evidence) {
  assert.equal(evidence.closed, true)
  assert.equal(evidence.exported, true)
  assert.equal(evidence.overflow, false)
  assert.equal(evidence.errorCount, 0)
  assert.deepEqual(evidence.errors, [])
  for (const row of evidence.records) {
    assert.equal(row.threw, false)
    if (row.kind === 'request') {
      assert.ok(row.input?.trusted && row.input.phase > 0)
      assert.equal(row.before.flags, row.after.flags, 'Request cannot anticipate commitment')
      assert.equal(row.before.turn, row.after.turn)
      assert.equal(typeof row.admitted, 'boolean')
      assert.deepEqual(row.cues, [{ cue: row.before.nearby ? 0x6f : 0x6e, attenuation: 1, pan: 0 }])
    } else if (row.kind === 'commit') {
      assert.equal((row.beforeFlags ^ row.after.flags) >>> 0, 128, 'Only the committed mode bit changes')
      assert.ok(Number.isFinite(row.now))
    } else assertNearbySelection(row)
  }
}
