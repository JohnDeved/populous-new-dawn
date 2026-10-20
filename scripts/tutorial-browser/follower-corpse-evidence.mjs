import assert from 'node:assert/strict'
import native from '../../tests/fixtures/follower-corpse-native.json' with { type: 'json' }
import units from '../../app/original-units.json' with { type: 'json' }

const draws = { brave: 14, warrior: 15, preacher: 16, spy: 17, firewarrior: 18 }
const directionFor = ({ cameraBearing, heading }) => {
  const camera = Math.round(cameraBearing * 1024 / Math.PI)
  const person = Math.round((Math.PI - heading) * 1024 / Math.PI)
  return ((((camera << 16) >> 16) - ((person << 16) >> 16) - 0x380) & 0x700) >> 8
}

// Expected chains are the retained independent canonical VSTART/VFRA witness,
// not followerCorpsePose/followerCorpseFrame or current followerSources. Packed
// frame metadata is the observed atlas index's identity, not the expected chain.
export function validateFollowerCorpseSample(sample) {
  assert.ok(Number.isInteger(sample.phase) && sample.phase >= 0 && sample.phase <= 3)
  assert.equal(sample.object, [304, 312, 320, 320][sample.phase])
  assert.ok(Object.hasOwn(draws, sample.kind), 'A real follower clothing model is required')
  assert.equal(sample.draw, draws[sample.kind], 'Original follower clothing draw required')
  assert.equal(sample.renderedDraw, sample.draw)
  assert.equal(sample.direction, directionFor(sample), 'Original signed heading bucket required')
  const expected = native.sources[sample.object][sample.direction]
  assert.equal(sample.directionSource, expected.vstart, 'Renderer must select the original directional source')
  assert.equal(sample.flip, expected.mirror)
  assert.ok(Number.isInteger(sample.displayedFrame) && sample.displayedFrame >= 0 && sample.displayedFrame < expected.vfra.length)
  assert.equal(units.frames[sample.frame]?.source, expected.vfra[sample.displayedFrame],
    'Rendered packed frame must identify the independent original VFRA record')
  assert.equal(sample.drawFlags, sample.phase === 3 ? 6 : 0)
  if (sample.phase === 3) assert.equal(sample.displayedFrame, 4, 'Original rise freezes on final frame')
  assert.equal(sample.visible, true)
  assert.ok(sample.submittedLayers > 0, 'Actual painter submission required')
  assert.equal(sample.canvasConnected, true)
  assert.equal(sample.sceneStoreMatch, true)
  assert.equal(sample.speed, 1)
  assert.equal(sample.documentVisible, true)
  return { source: sample.object, vstart: expected.vstart, vfra: expected.vfra[sample.displayedFrame] }
}

export function validateFollowerCorpseObservation(report) {
  assert.equal(report.error, null)
  assert.ok(report.death, 'An observed ordinary combat death is required')
  const { death, segments } = report
  assert.equal(death.before.id, report.actorId)
  assert.equal(death.before.team, 'blue')
  assert.equal(death.before.kind, 'brave')
  assert.ok(death.before.hp > 0 && death.before.fight, 'The living follower must actually enter ordinary combat')
  assert.equal(death.absent, true)
  assert.equal(death.newEffect, true)
  assert.equal(death.phase, 0)
  assert.equal(death.effectId, report.effectId)
  assert.ok(Number.isInteger(report.order?.lastOrderTurn), 'Public attack order turn required')
  assert.equal(report.order.actorId, report.actorId)
  assert.equal(report.order.target, 20)
  assert.ok(death.before.turn >= report.order.lastOrderTurn, 'Combat death must follow the public attack order')
  assert.ok(segments.length === 2, 'Pre-save and actual loaded-world render observations required')
  for (const segment of segments) {
    assert.equal(segment.error, null)
    assert.ok(segment.samples.length > 0)
    let prior
    for (const sample of segment.samples) {
      assert.equal(sample.effectId, report.effectId)
      assert.equal(sample.kind, death.before.kind)
      assert.equal(sample.team, death.before.team)
      validateFollowerCorpseSample(sample)
      if (prior) {
        assert.ok(sample.turn >= prior.turn && sample.stamp >= prior.stamp)
        assert.ok(sample.phase >= prior.phase)
      }
      prior = sample
    }
  }
  const samples = segments.flatMap(segment => segment.samples)
  for (const phase of [0, 1, 2, 3]) {
    const sample = samples.find(sample => sample.phase === phase && sample.cropFile)
    assert.ok(sample, `Same-frame visible canvas crop required for corpse phase ${phase}`)
    assert.equal(sample.bodyInCanvas, true)
    assert.equal(sample.bodyCanvasOwned, true)
    assert.equal(sample.cropOverlayClear, true)
    const crop = segments.flatMap(segment => segment.crops).find(crop => crop.filename === sample.cropFile)
    assert.ok(crop && !crop.error && crop.opaqueColors > 1 && crop.sha256)
    for (const field of ['turn', 'stamp', 'frame', 'effectId', 'phase'])
      assert.equal(crop[field], sample[field], `Corpse crop ${field} must belong to its exact rendered sample`)
  }
  assert.ok(segments[1].samples.some(sample => !sample.paused && sample.phase >= 2),
    'Current loaded checkpoint must resume through the natural transition/rise controller')
  const checkpoint = report.checkpoint
  assert.ok(checkpoint?.committed?.checkpointSha256, 'Actual committed current checkpoint required')
  assert.equal(checkpoint.loaded.worldReplaced, true, 'Public Load checkpoint must replace the store world')
  assert.equal(checkpoint.loaded.turn, checkpoint.saved.turn)
  assert.deepEqual(checkpoint.loaded.effect, checkpoint.saved.effect)
  assert.deepEqual(checkpoint.holdBefore, checkpoint.holdAfter, 'Public pause must freeze effect, logical turn and animation clock')
  assert.equal(checkpoint.loaded.paused, true)
  assert.equal(segments[1].done, true)
  return { effectId: report.effectId, victimId: report.actorId,
    originalSources: [304, 312, 320], phases: [0, 1, 2, 3],
    sampleCount: samples.length, currentCheckpoint: checkpoint.committed.checkpointSha256 }
}
