import assert from 'node:assert/strict'
import test from 'node:test'
import { milestoneConditions, missionRoutes, validateMissionMilestones } from './routes.mjs'

const marksFor = level => missionRoutes[level].required.map(name => ({ level, name }))

test('complete campaign accepts independently scoped mission proof sequences', () => {
  const campaign = [1, 2, 3].flatMap(marksFor)
  for (const level of [1, 2, 3]) assert.equal(validateMissionMilestones(level, campaign), true)
})

test('earlier mission camp, training, checkpoint and victory cannot satisfy the next mission', () => {
  const earlier = marksFor(1)
  const partial = ['bridge-activated', 'tornado-stock'].map(name => ({ level: 2, name }))
  assert.throws(() => validateMissionMilestones(2, [...earlier, ...partial]), /Missing Mission 2 milestone camp/)
  assert.throws(() => validateMissionMilestones(2, earlier), /Missing Mission 2 milestone bridge-activated/)
})

test('unscoped and wrong-level records cannot be silently relabelled', () => {
  assert.throws(() => validateMissionMilestones(1, [{ name: 'bridge-stock' }, ...marksFor(1)]), /Unsupported mission/)
  assert.throws(() => validateMissionMilestones(2, [{ level: 2, name: 'vault' }, ...marksFor(2)]), /Unknown Mission 2 milestone vault/)
  assert.throws(() => validateMissionMilestones(3, [{ level: '3', name: 'vault' }]), /Unsupported mission/)
})

test('duplicate and out-of-order required proof remains failed', () => {
  assert.throws(() => validateMissionMilestones(1, [...marksFor(1), { level: 1, name: 'camp' }]), /Duplicate Mission 1 milestone camp/)
  const marks = marksFor(2)
  ;[marks[1], marks[2]] = [marks[2], marks[1]]
  assert.throws(() => validateMissionMilestones(2, marks), /Out-of-order Mission 2 milestone warriors/)
})

test('checkpoint, victory and protected Mission 3 names require their real wrappers', () => {
  for (const level of [1, 2]) {
    for (const name of ['checkpoint-reloaded', 'victory'])
      assert.throws(() => milestoneConditions(level, name), /requires its proof wrapper/)
  }
  for (const name of missionRoutes[3].required)
    assert.throws(() => milestoneConditions(3, name), /requires its proof wrapper/)
  assert.throws(() => milestoneConditions(3, 'erosion-start'), /Unknown Mission 3 milestone/)
})

test('bridge gates require accepted ordinary casts or the actual linked shrine use', () => {
  const first = milestoneConditions(1, 'central-bridge')
  const second = milestoneConditions(1, 'northern-bridge')
  assert.deepEqual(first.map(c => c.type), ['accepted-bridge-casts', 'stat-at-least', 'effect-finished'])
  assert.equal(first[0].count, 1)
  assert.equal(second[0].count, 2)
  assert.deepEqual(milestoneConditions(2, 'bridge-activated')[0], { type: 'shrine-kind-used', kind: 'bridgeEffect', uses: 1 })
})

test('arbitrary names and mutation cannot change the finite marking surface', () => {
  assert.throws(() => milestoneConditions(1, '__proto__'), /Unknown Mission 1 milestone/)
  assert.throws(() => milestoneConditions(2, 'bridge-stock'), /Unknown Mission 2 milestone/)
  const conditions = milestoneConditions(1, 'bridge-stock')
  conditions[0].count = 0
  assert.equal(milestoneConditions(1, 'bridge-stock')[0].count, 4)
  assert.equal(Object.isFrozen(missionRoutes[1].conditions['bridge-stock'][0]), true)
})

test('prospectively observed Erosion onset is optional metadata before retirement proof', () => {
  const marks = marksFor(3)
  marks.splice(marks.findIndex(mark => mark.name === 'erosion'), 0, { level: 3, name: 'erosion-start' })
  assert.equal(validateMissionMilestones(3, marks), true)
  assert.throws(() => validateMissionMilestones(3, marks.filter(mark => mark.name !== 'sermon-reloaded')), /Missing Mission 3 milestone sermon-reloaded/)
})
