import assert from 'node:assert/strict'
import palette from '../../app/original-tooltips.json' with { type: 'json' }

export function assertTempleManualObservation(report) {
  assert.equal(report.closed, true)
  assert.deepEqual(report.errors, [])
  assert.equal(report.terminalKind, report.mode)
  const { creation, input } = report
  assert.equal(creation.receiverMatches, true)
  assert.equal(creation.before.record, null)
  assert.deepEqual(creation.after.record, {
    identity: creation.after.record.identity,
    phase: -1,
    remaining: 0,
    hold: 16,
    automatic: false,
  })
  assert.equal(creation.after.controller.dwell, creation.after.controller.threshold + 1)
  assert.equal(creation.after.reservations, 1)
  assert.equal(creation.after.latch, false)
  assert.equal(creation.after.target.admission.class, 2)
  assert.equal(creation.after.target.admission.model, 5)
  assert.equal(input.restored, true)
  assert.deepEqual(input.errors, [])
  assert.equal(input.events.length, 2)
  const picks = input.events[0].picks.filter(
    pick => pick.owner === 'scene' && ['pickUnit', 'pickWorldObject'].includes(pick.name)
  )
  assert.deepEqual(
    picks.map(pick => [pick.name, pick.id]),
    [
      ['pickUnit', null],
      ['pickWorldObject', report.targetId],
    ]
  )
  for (const pick of picks) {
    assert(pick.receiverMatches && !pick.threw)
    assert.deepEqual(pick.args, input.events[0].args)
  }
  const inspected = report.mode === 'expiry' ? report.reuse : creation
  assert.equal(inspected.args[2], inspected.after.inspection.held)
  assert.equal(report.release.args[0], inspected.args[2])
  for (const [i, event] of input.events.entries()) {
    assert.equal(event.type, ['pointerdown', 'pointerup'][i])
    for (const state of [event.state, event.after])
      assert(
        state.currentSceneMatches &&
          state.currentWorldMatches &&
          state.armedWorldMatches &&
          state.armedCanvasMatches
      )
    assert(event.trusted && event.canvasTarget && event.canvasOwned && event.button === 2)
    for (const key of ['ctrlKey', 'shiftKey', 'altKey', 'metaKey']) assert(!event.args[key])
  }
  for (const row of report.rows) {
    assert(row.receiverMatches)
    assert(row.after.current && row.after.level === 3 && row.after.speed === 1 && !row.after.paused)
    assert.equal(row.after.target.id, report.targetId)
    assert(row.after.target.hp > 0 && row.after.target.progress >= 1)
    assert(row.after.shamanAlive && row.after.status === 'playing')
  }
  if (report.mode === 'approach') {
    assert.equal(creation.result, 'explicit:created')
    assert.equal(report.request.result, 'automatic:reused')
    assert.equal(report.request.before.record.identity, creation.after.record.identity)
    assert.equal(report.request.before.record.automatic, false)
    assert.deepEqual(report.request.after.record, {
      ...report.request.before.record,
      automatic: true,
    })
    assert.equal(report.request.before.latch, false)
    assert.equal(report.request.after.latch, true)
    assert.equal(report.request.after.reservations, 1)
    return report
  }
  assert.equal(creation.result, 'hover:created')
  const display = report.firstDisplay
  assert.equal(display.after.controller.lastVisit.firstDisplay, report.targetId)
  assert.equal(display.before.controller.dwell, display.before.controller.threshold)
  assert.equal(display.after.controller.output.text, palette.strings[913])
  assert.equal(display.after.controller.output.draw, 1)
  assert.equal(display.after.record.identity, creation.after.record.identity)
  assert.deepEqual([display.after.record.phase, display.after.record.remaining], [0, 2])
  assert(report.firstFrame && !report.firstFrame.snapshot.name.hidden)
  assert.equal(report.firstFrame.snapshot.controller.output.text, palette.strings[913])
  assert.match(report.firstFrame.panel, /^data:image\/png;base64,/)
  assert.equal(report.reuse.result, 'explicit:reused')
  assert.deepEqual(report.reuse.after.record, report.reuse.before.record)
  assert.equal(report.reuse.after.record.identity, creation.after.record.identity)
  assert.equal(report.reuse.after.controller.dwell, report.reuse.before.controller.dwell)
  assert(report.heldVisits >= 4)
  assert.equal(report.release.before.inspection.held, report.release.args[0])
  assert.equal(report.release.after.inspection.held, null)
  let previous = { ...creation.after.record },
    retired = false,
    exits = 0
  for (const row of report.rows.filter(
    row => row.kind === 'visit' && row.ordinal > creation.ordinal
  )) {
    const { before, after } = row
    if (retired) assert.equal(after.record, null)
    else {
      assert(!after.dom.focused && !after.dom.hovered)
      let expected
      if (previous.phase === -1) expected = [0, 2]
      else if (previous.phase === 0)
        expected = previous.remaining ? [0, previous.remaining - 1] : [1, 15]
      else if (previous.phase === 1) {
        const remaining =
          before.inspection.selected === report.targetId ? previous.hold : previous.remaining
        expected = remaining ? [1, remaining - 1] : [2, 2]
      } else expected = previous.remaining ? [2, previous.remaining - 1] : null
      if (!expected) {
        assert.equal(after.record, null)
        assert.equal(exits, 3)
        retired = true
      } else {
        assert(after.record)
        assert.equal(after.record.identity, creation.after.record.identity)
        assert.equal(after.record.automatic, false)
        assert.deepEqual([after.record.phase, after.record.remaining], expected)
        if (expected[0] === 2) exits++
        previous = { ...after.record }
      }
    }
  }
  assert(retired)
  const terminal = report.terminal
  assert.equal(terminal.record, null)
  assert.equal(terminal.latch, false)
  assert.equal(terminal.reservations, 0)
  assert.equal(terminal.dom.present, false)
  assert.equal(terminal.trained, 0)
  assert.equal(terminal.target.admission.activity & 128, 0)
  return report
}
