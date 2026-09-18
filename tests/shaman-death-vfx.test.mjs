import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import units from '../app/original-units.json' with { type: 'json' }
import { shamanDeathVfx } from '../app/shaman-death-vfx.ts'
import { shamanReincarnationPose } from '../app/shaman-appearance.ts'
import { reincarnationTurns, stepReincarnation } from '../app/reincarnation.ts'

const teams = ['blue', 'red', 'yellow', 'green']

test('model-12 rise freezes the last original spirit frame for all tribes and bearings', () => {
  for (const [tribe, team] of teams.entries()) {
    const pose = shamanReincarnationPose(team, 3)
    assert.equal(pose.source, 360)
    assert.equal(pose.layerOwner, tribe)
    assert.equal(pose.directions.length, 8)
    for (const direction of pose.directions) {
      assert.equal(direction.frames.length, 10)
      assert.equal(direction.frames.length, units.frameCounts[direction.source])
      const visual = shamanDeathVfx(3)
      assert.deepEqual(visual, { visible: true, frame: 9 })
      assert.equal(direction.frames[visual.frame], direction.frames.at(-1))
      assert.notEqual(direction.frames[visual.frame], direction.frames[0])
    }
  }
})

test('death-site visibility follows the existing land and drowning lifecycles without changing them', () => {
  for (const drowning of [false, true]) {
    let remaining = reincarnationTurns(drowning)
    const counts = [0, 0, 0, 0, 0, 0]
    while (remaining) {
      const step = stepReincarnation(remaining, true, drowning)
      const snapshot = structuredClone(step)
      const visual = shamanDeathVfx(step.phase)
      counts[step.phase]++
      assert.equal(visual.visible, step.phase < 4)
      assert.equal(visual.frame, step.phase >= 3 ? 9 : 0)
      for (let render = 0; render < 144; render++)
        assert.deepEqual(shamanDeathVfx(step.phase), visual, 'repeated or paused rendering cannot replay the effect')
      assert.deepEqual(step, snapshot, 'presentation cannot mutate the lifecycle')
      remaining = step.remaining
    }
    assert.deepEqual(counts, drowning ? [0, 0, 0, 32, 300, 1] : [4, 128, 3, 32, 300, 1])
  }
})

test('earlier body/transition poses retain their existing renderer behavior', () => {
  for (const [tribe, team] of teams.entries()) {
    for (const phase of [0, 1, 2]) {
      assert.deepEqual(shamanDeathVfx(phase), { visible: true, frame: 0 })
      assert.equal(shamanReincarnationPose(team, phase).source, [680 + tribe * 8, 352, 360][phase])
    }
  }
  for (const phase of [4, 5, 6]) assert.equal(shamanDeathVfx(phase).visible, false)
})

test('the live caller applies the bounded presentation only to model-12 reincarnation effects', () => {
  const source = readFileSync(new URL('../app/scene-effects.ts', import.meta.url), 'utf8')
  const start = source.indexOf('const vfx = shamanDeathVfx(f.reincarnation.phase)')
  assert.ok(start > source.indexOf('export function animateFx'))
  const branch = source.slice(start, source.indexOf('if (f.angel)', start))
  assert.match(branch, /g.visible = vfx.visible/)
  assert.match(branch, /if \(!g.visible\) return/)
  assert.match(branch, /shamanReincarnationPose\(f.reincarnation.team, f.reincarnation.phase\)/)
  assert.match(branch, /scene.animatePerson\(g, f.unit\?\.heading \?\? 0, pose.directions, 0, false, vfx.frame\)/)
  assert.equal(source.match(/shamanDeathVfx\(/g).length, 1, 'no generic death, corpse, birth or worship caller')
})
