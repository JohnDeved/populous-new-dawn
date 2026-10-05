import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import {
  animateStoneHeads, createStoneHeadAnimation, stoneHeadFrame, syncStoneHeadPresentation,
} from '../../../app/stone-head-animation.ts'
const input = '../sprite-fallback-hold-audit/work/orchestration/stone-head-gate-214/native/result.json',
  bytes = readFileSync(input), native = JSON.parse(bytes), results = []
assert.equal(createHash('sha256').update(bytes).digest('hex'), 'bfb4daac97d120f3b735c63b02391bdd1ebf6be6ff66523e277f6d8d2e0824a4')
function fixture() {
  const state = createStoneHeadAnimation(true, { triggerIndex: 30, sceneryIndex: 32 }),
    head = { kind: 'bridge', model: 45, enabled: true, stoneHead: state },
    world = { paused: false, turn: 0, land: { landFlags: 0 }, outcome: { level: 1 }, shrines: [head] }
  return { world, head, state }
}
for (const timeline of native.cases.filter(row => row.gate === 'native')) {
  const { world, head, state } = fixture()
  for (const [index, row] of timeline.rows.entries()) {
    world.land.landFlags = row.phase === 'land-pause' ? 2 : 0
    head.enabled = row.enabled
    if (row.action === 'sync') syncStoneHeadPresentation(head)
    else {
      if (row.logicalVisit) { world.turn++; animateStoneHeads(world, 'logical') }
      animateStoneHeads(world)
    }
    assert.deepEqual([state.f1, stoneHeadFrame(state), state.renderFlags & 0xc00],
      [row.after.f1, row.after.frame, row.after.renderFlags & 0xc00], `${timeline.list}/${index}/${row.phase}`)
    assert.equal(state.stamp, world.turn)
    assert.equal(state.flags3 & 0x40000, 0x40000)
  }
  results.push({ list: timeline.list, rows: timeline.rows.length })
}
const transition = fixture(), control = native.syntheticTransitionControl
Object.assign(transition.state, {
  renderFlags: control.before.renderFlags, f1: control.before.f1, morphTimer: control.before.morphTimer,
  morphFrames: control.before.morphFrames, stamp: control.before.stamp,
})
transition.world.turn++
animateStoneHeads(transition.world, 'logical')
animateStoneHeads(transition.world)
assert.equal(transition.state.morphTimer, control.after.morphTimer)
assert.equal(transition.state.f1, control.after.f1)
assert.equal(transition.state.stamp, control.before.stamp, 'ungated presentation retains the last logical stamp')
const result = {
  status: 'passed', source: '779755e9ef1343e1e7be959da61ddfa9b12b21c1',
  retainedNativeSha256: createHash('sha256').update(bytes).digest('hex'),
  timelines: results, matchedRows: results.reduce((total, row) => total + row.rows, 0), transitionControl: true,
  limits: 'Actual current createStoneHeadAnimation/animateStoneHeads phase adapter against accepted retained native rows. Supplied logical/draw/enable/pause inputs; current World.turn stamp identity differs deliberately from native outer serial. No new original execution, full world/campaign, renderer, allocation or wall-time claim.',
}
writeFileSync('work/orchestration/stone-head-logical-fix/native-adapter-result-779755e.json', JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result, null, 2))
