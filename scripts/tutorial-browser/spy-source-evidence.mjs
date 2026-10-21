import assert from 'node:assert/strict'
import witness from '../../tests/fixtures/follower-source-witness.json' with { type: 'json' }
import units from '../../app/original-units.json' with { type: 'json' }

export function validateSpySourceSample(sample) {
  assert.equal(sample.object, 136)
  assert.equal(sample.substate, 2)
  assert.equal(sample.entryArmed, false)
  assert.equal(sample.target, sample.targetId)
  assert.equal(sample.draw, 22)
  assert.equal(sample.renderedDraw, 22)
  assert.equal(sample.disguise, 0x40)
  assert.equal(sample.owner, 1)
  const camera = Math.round(sample.cameraBearing * 1024 / Math.PI)
  const person = Math.round((Math.PI - sample.heading) * 1024 / Math.PI)
  const direction = ((((camera << 16) >> 16) - ((person << 16) >> 16) - 0x380) & 0x700) >> 8
  assert.equal(sample.direction, direction)
  const original = witness.sources[136][direction]
  assert.ok(Number.isInteger(sample.f2) && sample.f2 >= 0 && sample.f2 < original.frames.length)
  assert.equal(units.frames[sample.frame]?.source, original.frames[sample.f2],
    'Actual packed frame must identify the independent original VFRA record')
  assert.equal(sample.flip, original.flip)
  // Original descriptor22 is person2/variant3; compare actual submitted pieces,
  // not the consumer's named animation alias or its spriteLayers() implementation.
  const expectedPieces = units.frames[sample.frame].layers.filter(layer => {
    const type = layer.flags >> 4 & 31, choice = layer.flags >> 9
    return !type || (type === 1 ? choice === 1 : type === 2 && choice === 3)
  }).map(layer => layer.piece)
  assert.deepEqual(sample.pieces, expectedPieces)
  assert.ok(sample.submittedLayers > 0 && sample.submittedLayers === sample.pieces.length)
  for (const key of ['visible', 'canvasConnected', 'documentVisible', 'sceneStoreMatch'])
    assert.equal(sample[key], true, key)
  assert.equal(sample.missingNativeSource, null)
  assert.equal(sample.speed, 1)
  return original.frames[sample.f2]
}

export function validateSpySourceObservation(report) {
  const observation = report.observation
  assert.equal(observation.error, null)
  assert.equal(observation.done, true)
  assert.equal(report.order.target, report.targetId)
  assert.deepEqual(report.order.selected, [report.spyId])
  assert.ok(Number.isInteger(report.order.lastOrderTurn))
  assert.ok(observation.samples.some(sample => sample.substate === 1 && sample.target === report.targetId),
    'Public command must actually reach phase1')
  const armed = observation.samples.find(sample => sample.substate === 2 && sample.entryArmed)
  assert.ok(armed, 'Observe the real phase1-to-phase2 pending-entry boundary')
  assert.notEqual(armed.object, 136, 'Arming the next visit must not select source136 early')
  assert.equal(armed.timer, 0)
  const native = observation.samples.filter(sample => sample.object === 136)
  assert.ok(native.length >= 2)
  assert.equal(native[0].turn, armed.turn + 1, 'Entry belongs to the next logical visit')
  assert.equal(native[0].timer, 23)
  assert.equal(native[0].f2, 0, 'Actual rendered entry starts at the first original frame')
  let previous
  for (const sample of native) {
    assert.equal(sample.spyId, report.spyId)
    assert.equal(sample.targetId, report.targetId)
    assert.ok(sample.turn >= report.order.lastOrderTurn)
    if (previous) assert.ok(sample.turn >= previous.turn && sample.stamp >= previous.stamp)
    validateSpySourceSample(sample)
    previous = sample
  }
  assert.equal(observation.crops.length, 2)
  assert.equal(new Set(observation.crops.map(crop => crop.f2)).size, 2)
  for (const crop of observation.crops) {
    const sample = native.find(row => row.cropFile === crop.filename)
    assert.ok(sample)
    for (const field of ['spyId', 'turn', 'stamp', 'frame', 'f2']) assert.equal(crop[field], sample[field])
    for (const key of ['bodyInCanvas', 'bodyCanvasOwned', 'cropOverlayClear']) assert.equal(sample[key], true, key)
    assert.ok(crop.opaqueColors > 1)
    assert.match(crop.sha256, /^[a-f0-9]{64}$/)
  }
  assert.equal(report.holdBefore.paused, true)
  assert.deepEqual(report.holdAfter, report.holdBefore, 'Public pause freezes the whole Spy and animation clock')
  assert.ok(report.resumed.turn > report.holdAfter.turn, 'Public Resume must advance ordinary gameplay')
  assert.equal(report.resumed.paused, false)
  return { source: 136, draw: 22, owner: 1, firstFrame: 0, croppedFrames: observation.crops.map(crop => crop.f2),
    rawFrames: observation.crops.map(crop => units.frames[crop.frame].source),
    limits: 'Two visible sampled original frames and entry boundary, not complete-cycle cadence, natural Mission 12 acquisition or exact native raster equivalence.' }
}
