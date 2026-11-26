import assert from 'node:assert/strict'
import test from 'node:test'
import { command, createWorld, scatterSelected, tick } from '../app/model.ts'
import { setSelection } from '../app/selection-runtime.ts'
import { automaticWorshipPanelActive } from '../app/worship-panel-activity.ts'

const advance = (w, turn) => {
  while (w.turn < turn) {
    const old = w.turn
    assert.equal(w.status, 'playing')
    tick(w, 1 / 12)
    assert.equal(w.turn, old + 1)
  }
}

test('authored followers selected together respect the native scatter protection flag', () => {
  const w = createWorld(10, 'scalable')
  advance(w, 130)
  assert.equal(w.inputMask, 0)
  const [first, protectedWarrior, unselected] = [111, 112, 113].map(id => w.units.find(u => u.id === id))
  for (const u of [first, protectedWarrior, unselected]) {
    assert.deepEqual([u.team, u.kind, u.native.state], ['blue', 'warrior', 19])
    assert.equal(w.objectCells.objects.get(u.id), u.native)
  }
  setSelection(w, [first.id, protectedWarrior.id])
  assert.deepEqual(w.selected, [first.id, protectedWarrior.id])
  // Deliberate boundary fixture: this protection bit is supplied, not earned here.
  protectedWarrior.native.flags2 |= 0x100000
  assert.equal(scatterSelected(w), 1)
  assert.deepEqual([first.native.state, protectedWarrior.native.state, unselected.native.state], [43, 19, 19])
  assert.deepEqual(w.selected, [first.id, protectedWarrior.id])
})

test('the worship visibility predicate reads only the low byte of the cached local count', () => {
  const w = createWorld(1, 'scalable')
  advance(w, 130)
  const head = w.shrines.find(s => s.id === 29)
  const brave = w.units.find(u => u.team === 'blue' && u.kind === 'brave' && u.x === 7 && u.z === 33)
  assert.deepEqual([head.kind, head.active, automaticWorshipPanelActive(head)], ['bridge', true, false])
  setSelection(w, [brave.id])
  assert.equal(command(w, head), true)
  advance(w, 180)
  assert.deepEqual(head.panelActivity, { turn: 180, count: 1 })
  assert.equal(automaticWorshipPanelActive(head), true)
  // A synthetic copy reaches the width boundary impossible for this one worshipper.
  const withCount = count => ({ ...head, panelActivity: { ...head.panelActivity, count } })
  assert.equal(automaticWorshipPanelActive(withCount(256)), false)
  assert.equal(automaticWorshipPanelActive(withCount(257)), true)
  assert.equal(automaticWorshipPanelActive({ ...head, active: false }), false)
})
