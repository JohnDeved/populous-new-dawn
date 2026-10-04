import test from 'node:test'
import assert from 'node:assert/strict'
import contract from '../decomp/research/follower-task-panel/native-panel-contract.json' with { type: 'json' }
import { classifyFollowerTask, followerTaskCounts, selectTaskFollowers, focusTaskFollower } from '../app/hud-tasks.ts'

const person = (id, category = 2, extra = {}) => ({ id, model: 2, category, x: 256 + id * 20, y: 256, assignment: 0, flags3: 0x123456f8, flags4: 0x20000000, selectionFlags: 0, ...extra })
const origin = { x: 0, y: 0 }

test('task classifier preserves every recovered native state and command category', () => {
  for (const [state, expected] of contract.stateCategories.entries()) {
    const p = { state, model: 2, commandStatus: 0, flags2: 0, assignment: 0, vehicle: 0 }
    assert.equal(classifyFollowerTask(p), state === 10 ? 0 : expected)
    assert.equal(classifyFollowerTask({ ...p, vehicle: 9 }), expected === 1 ? 1 : 5)
  }
  for (const [commandStatus, expected] of contract.commandCategories.entries())
    assert.equal(classifyFollowerTask({ state: 10, model: 2, commandStatus, flags2: 0, assignment: 0, vehicle: 0 }), expected)
  assert.equal(classifyFollowerTask(undefined), 0, 'a missing owner is not an invented Idle/Busy state')
})

test('inside classification follows building category and the Preacher command exception', () => {
  const p = { state: 21, model: 2, commandStatus: 0, flags2: 0x800000, assignment: 0, vehicle: 0 }
  for (const model of [1, 2, 3, 10, 11, 12]) assert.equal(classifyFollowerTask(p, model), 3)
  for (const model of [4, 5, 6, 7, 8, 9, 13, 14, 15, 16, 18, 19]) assert.equal(classifyFollowerTask(p, model), 4)
  assert.equal(classifyFollowerTask(p, 17), 0)
  const preacher = { ...p, model: 4, state: 10, flags2: 0, commandStatus: 31 }
  for (const state of [10, 33]) for (const model of [17, 31, 32]) {
    assert.equal(classifyFollowerTask({ ...preacher, state }, undefined, { model, flags: 0 }), 2)
    assert.equal(classifyFollowerTask({ ...preacher, state, assignment: 64 }, undefined, { model, flags: 0 }), state === 10 ? 4 : 2)
  }
  assert.equal(classifyFollowerTask(preacher, undefined, { model: 31, flags: 1 }), 4)
})

test('global existence and nearby task counts are independent; selected overlays preserve native addition', () => {
  const rows = [person(1, 2, { selectionFlags: 128 }), person(2, 1, { selectionFlags: 128 }), person(3, 3, { x: 7000 }), person(4, 4, { model: 7 }), person(5, 2, { flags4: 0x20000800 }), person(6, 4, { flags4: 0 })]
  const global = followerTaskCounts(rows, origin)
  assert.equal(global.totals[2], 3)
  assert.deepEqual(global.tasks[2], [0, 3, 1, 1, 0, 0])
  assert.deepEqual(global.tasks[0], global.tasks[2], 'Total excludes the Shaman')
  const nearby = followerTaskCounts(rows, origin, true)
  assert.equal(nearby.totals[2], 3)
  assert.deepEqual(nearby.tasks[2], [0, 3, 1, 0, 0, 0])
})

test('task selection ignores persistent-strip assignment priority and uses category nearest', () => {
  const rows = [person(1, 4), person(2, 2, { assignment: 0x7000 }), person(3, 2, { assignment: 0 })]
  const result = selectTaskFollowers(rows, 2, 2, origin, 'single')
  assert.deepEqual(rows.filter(p => p.selectionFlags & 128).map(p => p.id), [2])
  assert.equal(result.speaker, 2)
  assert.equal(rows[1].flags3, 0x23456f8)
})

test('Selected row click/Shift deselect, Ctrl reselects nearest without changing its work or the group', () => {
  for (const mode of ['single', 'five', 'all']) {
    const rows = [person(1, 4, { selectionFlags: 129 }), person(2, 2, { selectionFlags: 128 })]
    const before = structuredClone(rows)
    const result = selectTaskFollowers(rows, 2, 1, origin, mode)
    assert.deepEqual(rows.map(p => p.selectionFlags), mode === 'single' ? [1, 128] : mode === 'all' ? [1, 0] : [129, 128])
    assert.equal(rows[0].flags3, mode === 'five' ? (before[0].flags3 & ~0x10000000) : (before[0].flags3 & ~128))
    assert.deepEqual(result.cues, [])
    for (let i = 0; i < rows.length; i++) assert.deepEqual({ ...rows[i], flags3: 0, selectionFlags: 0 }, { ...before[i], flags3: 0, selectionFlags: 0 })
  }
})

test('Total single/five can select the Shaman while Shift excludes it', () => {
  for (const mode of ['single', 'five', 'all']) {
    const rows = [person(1, 2, { model: 7 }), person(2)]
    selectTaskFollowers(rows, 0, 2, origin, mode)
    assert.deepEqual(rows.filter(p => p.selectionFlags & 128).map(p => p.id), mode === 'single' ? [1] : mode === 'five' ? [1, 2] : [2])
  }
})

test('task focus filters category and cycles with the Shaman nearby exemption without mutation', () => {
  const rows = [person(1, 2, { model: 7, x: 7000 }), person(2), person(3, 4)]
  const before = structuredClone(rows)
  let previous = 0
  for (const expected of [2, 1, 2]) {
    previous = focusTaskFollower(rows, 0, 2, origin, previous, false, true)
    assert.equal(previous, expected)
  }
  assert.equal(focusTaskFollower(rows, 0, 4, origin, 0), 3)
  assert.deepEqual(rows, before)
})
