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
  assert.equal(report.evidenceVersion, 3, 'Version 3 delivery envelope required; historical v2 retains its original meaning')
  const delivery = report.delivery
  assert.equal(delivery.cachePolicy, 'playwright-routing-disables-http-cache')
  assert.equal(delivery.version, 1); assert.equal(delivery.method, 'test-routed-native-esm')
  assert.equal(delivery.path, 'scripts/controlled-scene-frames.mjs')
  assert.equal(delivery.sha256, report.inputs[delivery.path])
  assert.equal(delivery.sha256, '7ec23575119be18bb18ddba834c393527ed8a93f321a1b5a0acf4e82410270ee')
  assert.equal(delivery.bytes, 4308); assert.deepEqual(delivery.imports, [])
  const deliveredURL = new URL(delivery.url)
  assert.ok(['http:', 'https:'].includes(deliveredURL.protocol))
  assert.equal(deliveredURL.username, ''); assert.equal(deliveredURL.password, '')
  assert.equal(deliveredURL.origin, delivery.origin)
  assert.equal(deliveredURL.pathname, '/scripts/controlled-scene-frames.mjs')
  assert.equal(delivery.pathname, deliveredURL.pathname)
  assert.equal(deliveredURL.search, ''); assert.equal(deliveredURL.hash, '')
  assert.equal(delivery.requests, 1); assert.equal(delivery.fulfilled, 1)
  assert.equal(delivery.installed, true); assert.equal(delivery.removed, true)
  assert.equal(delivery.routeRemoved, true); assert.equal(delivery.listenerRemoved, true)
  assert.equal(delivery.cacheReused, true); assert.equal(delivery.error, null)
  assert.deepEqual(delivery.preflight, { sha256: delivery.sha256, bytes: delivery.bytes, status: 200,
    exports: { keys: ['CONTROLLED_FRAME_MS', 'runSceneFrames'], frameMs: 1000 / 24, runType: 'function' },
    beforeCapture: true })
  const capture = report.capture
  assert.equal(capture.version, 2); assert.equal(capture.method, 'controlled-full-scene')
  assert.equal(capture.frameMs, 1000 / 24)
  assert.equal(capture.maxFrames, 384); assert.equal(capture.maxTurns, 192)
  assert.ok(Number.isSafeInteger(capture.frames) && capture.frames > 0 && capture.frames <= 384)
  assert.ok(Number.isSafeInteger(capture.turns) && capture.turns > 0 && capture.turns <= 192)
  assert.ok(Number.isSafeInteger(capture.startTurn) && capture.startTurn >= 0)
  assert.ok(capture.turns <= capture.frames, 'At most one logical turn per complete frame')
  assert.ok(Number.isSafeInteger(observation.nonAdvancingCallbacks) && observation.nonAdvancingCallbacks >= 0)
  assert.equal(report.holdBefore.turn, capture.handback.turn)
  assert.equal(capture.suppliedElapsedMilliseconds, capture.frames * capture.frameMs)
  assert.equal(capture.deadlineAt, report.budget.deadlineAt)
  for (const key of ['installed', 'released', 'rafRestored', 'cancelRestored', 'resumedRAF'])
    assert.equal(capture[key], true, key)
  assert.equal(capture.foreign, false); assert.equal(capture.error, null)
  assert.equal(report.captureCleanupFailure, undefined)
  assert.equal(capture.handback.spyAndAnimationUnchanged, true)
  assert.equal(capture.handback.evidence, false)
  assert.ok(Number.isFinite(capture.handback.previous) && Number.isFinite(capture.handback.timestamp))
  assert.deepEqual(observation.hook, { installed: true, restored: true, foreign: false })
  assert.ok(['samples', 'turnSamples', 'turns'].every(key => Array.isArray(observation[key])),
    'Spy observation ledgers must be arrays')
  assert.ok(observation.samples.length + observation.turnSamples.length + observation.turns.length <= 600,
    'Spy aggregate observation bound')
  let lastTurn = capture.startTurn
  for (const sample of observation.turnSamples) {
    assert.equal(sample.turn, lastTurn + 1)
    assert.equal(sample.spyId, report.spyId); assert.equal(sample.targetId, report.targetId)
    assert.equal(sample.speed, 1); assert.equal(sample.paused, false)
    lastTurn = sample.turn
  }
  assert.equal(lastTurn - capture.startTurn, capture.turns)
  const logicalArmed = observation.turnSamples.find(s => s.substate === 2 && s.entryArmed)
  const logicalEntry = observation.turnSamples.find(s => s.object === 136)
  assert.ok(logicalArmed && logicalEntry, 'Consecutive real logical entry witnesses required')
  assert.notEqual(logicalArmed.object, 136); assert.equal(logicalArmed.timer, 0)
  assert.equal(logicalEntry.turn, logicalArmed.turn + 1, 'Logical entry must be the exact next visit')
  assert.equal(logicalEntry.timer, 23); assert.equal(logicalEntry.f2, 0)
  assert.equal(logicalEntry.substate, 2); assert.equal(logicalEntry.entryArmed, false)
  assert.equal(logicalEntry.target, report.targetId)
  assert.equal(observation.error, null)
  assert.equal(observation.done, true)
  assert.equal(report.order.target, report.targetId)
  assert.deepEqual(report.order.selected, [report.spyId])
  assert.ok(Number.isInteger(report.order.lastOrderTurn))
  assert.ok(observation.samples.some(sample => sample.substate === 1 && sample.target === report.targetId),
    'Public command must actually reach phase1')
  // Logical visits can share a render. Never infer an unrendered boundary from
  // adjacent RAF samples or pretend the logical record was itself rendered.
  const turns = observation.turns
  assert.ok(Array.isArray(turns) && turns.length > 0 && turns.length <= 600)
  for (const [index, turn] of turns.entries()) {
    assert.equal(turn.spyId, report.spyId); assert.equal(turn.targetId, report.targetId)
    assert.ok(Number.isSafeInteger(turn.turn) && turn.turn >= 0)
    if (index) assert.equal(turn.turn, turns[index - 1].turn + 1, 'Every real logical visit is retained')
    assert.equal(turn.sceneStoreMatch, true); assert.equal(turn.speed, 1)
    assert.equal(turn.paused, false)
  }
  const boundary = turns.findIndex(turn => turn.substate === 2 && turn.entryArmed)
  const armed = turns[boundary]
  assert.ok(armed, 'Observe the real phase1-to-phase2 pending-entry boundary')
  assert.notEqual(armed.object, 136, 'Arming the next visit must not select source136 early')
  assert.equal(armed.timer, 0)
  assert.equal(armed.target, report.targetId)
  const approach = turns[boundary - 1], entered = turns[boundary + 1]
  assert.ok(approach && entered, 'Retain both visits adjacent to pending entry')
  assert.equal(approach.substate, 1); assert.equal(approach.timer, 1)
  assert.equal(approach.target, report.targetId)
  assert.equal(entered.substate, 2); assert.equal(entered.entryArmed, false)
  assert.equal(entered.object, 136); assert.equal(entered.timer, 23); assert.equal(entered.f2, 0)
  assert.equal(entered.target, report.targetId)
  const native = observation.samples.filter(sample => sample.object === 136)
  assert.ok(native.length >= 2)
  assert.equal(native[0].turn, armed.turn + 1, 'Entry belongs to the next logical visit')
  assert.equal(native[0].turn, logicalEntry.turn, 'Actual rendered frame0 must bind exact logical entry')
  assert.equal(armed.turn, logicalArmed.turn)
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
  assert.deepEqual(observation.crops.map(c => c.f2), [0, 1], 'Genuine original frame0/1 crops required')
  assert.equal(capture.handback.turn, lastTurn)
  assert.ok(capture.handback.stamp > native.at(-1).stamp, 'Handback is a later non-evidence render')
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
    limits: 'Controlled elapsed complete Scene frames with transparent logical-turn entry and actual rendered frame0/1 crops, not natural wall-clock timing; not complete-cycle cadence, natural Mission 12 acquisition or exact native raster equivalence.' }
}
