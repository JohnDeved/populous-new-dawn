import assert from 'node:assert/strict'
import test from 'node:test'
import { validateMeleePauseFrames } from '../scripts/tutorial-browser/melee-attack-pause-evidence.mjs'
import { validateMeleeAttackFrames } from '../scripts/tutorial-browser/melee-attack-evidence.mjs'
import rules from '../app/original-rules.json' with { type: 'json' }
import units from '../app/original-units.json' with { type: 'json' }

// Supplied observations, not a browser run. Expectations come from retained
// original tables independently of production selectors and browser observers.
const mapping = Object.fromEntries([['attack', 10], ['strike', 8], ['special', 16]].map(([action, row]) => {
  const [object, draw] = rules.animationObjects[rules.personAnimationObjects[row * 9 + 7]]
  return [`shaman:${action}`, { object, draw, step: rules.animationDescriptors[draw].step,
    directions: units.shamanSources[object] }]
}))
const without = (source, ...keys) => Object.fromEntries(Object.entries(source).filter(([key]) => !keys.includes(key)))

function sample(overrides = {}) {
  const result = { id: 54, kind: 'shaman', action: 'strike', started: 40, opponent: 13,
    turn: 40, animationFrame: 80, stamp: 100, f1: 0, f2: 0, direction: 0,
    phase: 'running-before-pause', paused: false, visible: true, submittedLayers: 2,
    canvasConnected: true, sceneStoreMatch: true, nativeAttackAnimation: true,
    bodyCanvasOwned: true, bodyInCanvas: true, cropOverlayClear: true, ...overrides }
  const original = mapping[`shaman:${result.action}`] ?? mapping['shaman:strike']
  const direction = original.directions[result.direction] ?? original.directions[0]
  return { object: original.object, draw: original.draw,
    frame: direction.frames[result.f2 % direction.frames.length], flip: direction.flip, ...result }
}

const evidence = () => [
  sample({ cropFile: 'running-before.png' }),
  sample({ phase: 'public-paused-hold', paused: true, stamp: 101, turn: 41,
    animationFrame: 82, f2: 1, cropFile: 'paused-first.png' }),
  sample({ phase: 'public-paused-hold', paused: true, stamp: 102, turn: 41,
    animationFrame: 82, f2: 1, cropFile: 'paused-second.png' }),
  sample({ phase: 'running-after-resume', stamp: 103, turn: 42,
    animationFrame: 84, f2: 2, cropFile: 'running-resumed.png' }),
]

test('supplied layered observations independently validate mapped artwork, paused hold and both running advances', () => {
  const samples = evidence(), before = structuredClone({ samples, mapping })
  const result = validateMeleePauseFrames(samples, mapping)
  assert.equal(result.protocol, 'layered-public-melee-pause-resume')
  assert.equal(result.sampleCount, 4); assert.equal(result.sequenceCount, 1)
  assert.deepEqual(result.cropFiles, samples.map(sample => sample.cropFile))
  assert.deepEqual(result.shamanSequence, { id: 54, kind: 'shaman', action: 'strike', started: 40,
    sampleCount: 4, firstTurn: 40, lastTurn: 42, opponent: 13 })
  const obligations = result.obligations
  assert.deepEqual(obligations.originalMappedArtwork, { status: 'passed', sampleCount: 4 })
  assert.equal(obligations.publicPausedHold.status, 'passed')
  assert.equal(obligations.publicPausedHold.sampleCount, 2)
  assert.deepEqual(obligations.publicPausedHold.stamps, [101, 102])
  assert.equal(obligations.publicPausedHold.anchor.frame, 999)
  assert.deepEqual([obligations.resumedAdvancement.before.turn, obligations.resumedAdvancement.after.turn], [41, 42])
  assert.deepEqual([obligations.unpausedAdvancement.before.turn, obligations.unpausedAdvancement.after.turn], [40, 42])
  assert.equal(obligations.runningSameTurnHold.status, 'not-claimed')
  assert.match(obligations.runningSameTurnHold.reason, /CPU cadence and real-caller checks remain separate/)
  assert.deepEqual({ samples, mapping }, before)
})

test('each original attack row and mirrored direction validates without a bounded directional f2 assumption', () => {
  for (const action of ['attack', 'strike', 'special']) {
    const samples = evidence().map(fields => sample({ ...without(fields, 'object', 'draw', 'frame', 'flip'), action, direction: 7,
      f2: fields.f2 + 251 }))
    const result = validateMeleePauseFrames(samples, mapping)
    assert.equal(result.shamanSequence.action, action)
    assert.equal(result.obligations.publicPausedHold.anchor.flip, true)
  }
})

test('natural defender interception is retained, not silently recast as the requested Shaman20', () => {
  assert.equal(validateMeleePauseFrames(evidence(), mapping).shamanSequence.opponent, 13)
  const omitted = evidence().map(fields => without(fields, 'opponent'))
  assert.equal(validateMeleePauseFrames(omitted, mapping).shamanSequence.opponent, undefined)
  for (const index of [0, 1, 2, 3]) {
    for (const value of [20, undefined]) {
      const samples = evidence()
      if (value === undefined) delete samples[index].opponent
      else samples[index].opponent = value
      assert.throws(() => validateMeleePauseFrames(samples, mapping), /retain its supplied opponent/)
    }
  }
})

test('extra running observations and more paused visits are allowed without adding crops or a running-hold claim', () => {
  const samples = evidence()
  samples.splice(1, 0, sample({ stamp: 101, animationFrame: 81 }))
  samples[2].stamp = 102; samples[3].stamp = 103
  samples.splice(4, 0, { ...samples[3], stamp: 104, cropFile: undefined })
  samples.splice(5, 0, sample({ phase: 'running-after-resume', stamp: 105,
    turn: 41, animationFrame: 83, f2: 1 }))
  samples.at(-1).stamp = 106
  samples.push(sample({ phase: 'running-after-resume', stamp: 107, turn: 44, animationFrame: 88, f2: 3 }))
  const result = validateMeleePauseFrames(samples, mapping)
  assert.equal(result.sampleCount, 8)
  assert.deepEqual(result.obligations.publicPausedHold.stamps, [102, 103, 104])
  assert.equal(result.obligations.resumedAdvancement.after.stamp, 106)
  assert.equal(result.obligations.runningSameTurnHold.status, 'not-claimed')
})

test('before and after phases may contain other sequences, but the paused sequence itself crosses both boundaries', () => {
  const samples = evidence()
  samples.unshift(sample({ action: 'attack', started: 39, turn: 39, animationFrame: 78, stamp: 99,
    cropFile: samples[0].cropFile }))
  delete samples[1].cropFile
  samples.push(sample({ phase: 'running-after-resume', action: 'special', started: 43,
    turn: 43, animationFrame: 86, stamp: 104 }))
  const result = validateMeleePauseFrames(samples, mapping)
  assert.equal(result.sequenceCount, 3)
  assert.equal(result.shamanSequence.action, 'strike')
})

test('f2 byte wrapping remains an advance when the independent original artwork changes', () => {
  const samples = evidence().map((fields, index) => sample({ ...without(fields, 'frame'),
    f2: index === 0 ? 254 : index === 3 ? 0 : 255 }))
  assert.equal(validateMeleePauseFrames(samples, mapping).obligations.resumedAdvancement.after.f2, 0)
})

test('missing samples and malformed independent original mappings cannot pass', () => {
  for (const samples of [undefined, null, [], {}])
    assert.throws(() => validateMeleePauseFrames(samples, mapping), /samples required/)
  for (const original of [undefined, null, [], {}, { 'shaman:strike': {} },
    { 'shaman:strike': { ...mapping['shaman:strike'], step: -1 } },
    { 'shaman:strike': { ...mapping['shaman:strike'], directions: [] } },
    { 'shaman:strike': { ...mapping['shaman:strike'], directions: Array(8).fill({ frames: [], flip: false }) } },
    { 'shaman:strike': { ...mapping['shaman:strike'], directions: Array(8).fill({ frames: [998], flip: 0 }) } }])
    assert.throws(() => validateMeleePauseFrames(evidence(), original), /mapping|descriptor|directions|frame list|flip/)
  const samples = evidence(); samples[1] = null
  assert.throws(() => validateMeleePauseFrames(samples, mapping), /must be an object/)
})

test('wrong actor, idle and recoil cannot be used as paused attack evidence', () => {
  for (const [change, error] of [
    [{ id: 13, kind: 'warrior' }, /authored M2 Shaman54/],
    [{ id: 55 }, /authored M2 Shaman54/],
    [{ kind: 'brave' }, /authored M2 Shaman54/],
    ...['idle', 'recoil', 'approach', undefined].map(action => [{ action }, /recoil is not attack evidence/]),
  ]) {
    const samples = evidence(); Object.assign(samples[1], change)
    assert.throws(() => validateMeleePauseFrames(samples, mapping), error)
  }
})

test('wrong native object, draw, table-selected artwork and flip fail independently of ownership markers', () => {
  assert.equal(mapping['shaman:strike'].object, 456)
  for (const marker of [undefined, false, true]) {
    const samples = evidence(); Object.assign(samples[1], { object: 424, nativeAttackAnimation: marker })
    assert.throws(() => validateMeleePauseFrames(samples, mapping), /expected original attack object 456/)
  }
  for (const [change, error] of [
    [{ draw: 15 }, /expected original attack draw/],
    [{ frame: 998, nativeAttackAnimation: false }, /displayed frame must match/],
    [{ flip: true }, /displayed flip must match/],
    [{ nativeAttackAnimation: false }, /ownership marker required/],
    [{ nativeAttackAnimation: undefined, sourceOwned: true }, /ownership marker required/],
    [{ direction: 8 }, /direction outside original table/],
    [{ f1: 2 }, /descriptor countdown/],
    [{ f2: 256 }, /f2 must fit its byte/],
  ]) {
    const samples = evidence(); Object.assign(samples[1], change)
    assert.throws(() => validateMeleePauseFrames(samples, mapping), error)
  }
})

test('invalid numeric observations and impossible attack chronology fail closed', () => {
  for (const key of ['turn', 'animationFrame', 'started', 'stamp', 'f1', 'f2', 'frame', 'direction']) {
    for (const value of [-1, 0.5, NaN, undefined, Number.MAX_SAFE_INTEGER + 1]) {
      const samples = evidence(); samples[1][key] = value
      assert.throws(() => validateMeleePauseFrames(samples, mapping), /nonnegative integer/)
    }
  }
  const samples = evidence(); samples[0].started = 41
  assert.throws(() => validateMeleePauseFrames(samples, mapping), /cannot start after observed turn/)
  for (const opponent of [-1, null, undefined, '13']) {
    const samples = evidence(); samples[0].opponent = opponent
    assert.throws(() => validateMeleePauseFrames(samples, mapping), /supplied opponent/)
  }
})

test('phase names, ordering and exact pause booleans are mandatory', () => {
  for (const phase of [undefined, 'paused', 'running', 1]) {
    const samples = evidence(); samples[1].phase = phase
    assert.throws(() => validateMeleePauseFrames(samples, mapping), /explicit layered observation phase/)
  }
  for (const index of [0, 1, 2, 3]) {
    for (const value of [!evidence()[index].paused, undefined, 0]) {
      const samples = evidence(); samples[index].paused = value
      assert.throws(() => validateMeleePauseFrames(samples, mapping), /paused boolean must match/)
    }
  }
  const samples = evidence()
  Object.assign(samples[2], { phase: 'running-before-pause', paused: false })
  assert.throws(() => validateMeleePauseFrames(samples, mapping), /phases must be ordered/)
})

test('each of the three protocol phases and two distinct paused visits are required', () => {
  for (const [indexes, error] of [
    [[0], /running-before-pause sample required/], [[1, 2], /two distinct public-paused-hold/],
    [[1], /two distinct public-paused-hold/], [[3], /running-after-resume sample required/],
  ]) assert.throws(() => validateMeleePauseFrames(evidence().filter((_, index) => !indexes.includes(index)), mapping), error)
})

test('renderer stamps cannot duplicate or regress and logical and animation clocks cannot regress', () => {
  for (const [index, key, value, error] of [
    [2, 'stamp', 101, /distinct chronological renderer stamps/],
    [2, 'stamp', 99, /distinct chronological renderer stamps/],
    [3, 'turn', 40, /turn observations must be chronological/],
    [3, 'animationFrame', 81, /animationFrame observations must be chronological/],
  ]) {
    const samples = evidence(); samples[index][key] = value
    assert.throws(() => validateMeleePauseFrames(samples, mapping), error)
  }
})

test('paused renders retain the entire pose and both clocks, not merely the same sprite', () => {
  for (const change of [{ turn: 42 }, { animationFrame: 83 }, { action: 'attack' }, { started: 39 },
    { direction: 1 }, { f1: 1 }, { f2: 2 }]) {
    const samples = evidence(), fields = without(samples[2], 'object', 'draw', 'frame', 'flip')
    samples[2] = sample({ ...fields, ...change })
    assert.throws(() => validateMeleePauseFrames(samples, mapping), /Paused hold must retain|same logical turn must retain/)
  }
})

test('paused sequence cannot borrow running evidence from another action or start', () => {
  for (const index of [0, 3]) {
    for (const change of [{ action: 'attack' }, { started: 39 }]) {
      const samples = evidence(), fields = without(samples[index], 'object', 'draw', 'frame', 'flip')
      samples[index] = sample({ ...fields, ...change })
      assert.throws(() => validateMeleePauseFrames(samples, mapping), /Paused anchor sequence needs running-/)
    }
  }
})

test('resume requires turn, native phase and artwork advance, not camera-only movement or elapsed animation frames', () => {
  for (const change of [
    { turn: 41, f2: 1 }, { f2: 1 }, { f2: 1, direction: 1 }, { f2: 5 },
  ]) {
    const samples = evidence(), fields = without(samples[3], 'object', 'draw', 'frame', 'flip')
    samples[3] = sample({ ...fields, ...change })
    assert.throws(() => validateMeleePauseFrames(samples, mapping), /Resumed anchor sequence must advance/)
  }
  const samples = evidence(), fields = without(samples[0], 'frame')
  samples[0] = sample({ ...fields, f2: 2 })
  assert.throws(() => validateMeleePauseFrames(samples, mapping), /between unpaused samples/)
})

test('same-turn unpaused observations cannot advance native countdown or frame phase', () => {
  for (const change of [{ f1: 1 }, { f2: 1 }, { f2: 1, direction: 1 }]) {
    const samples = evidence()
    for (const sample of samples.slice(1)) sample.stamp++
    samples.splice(1, 0, sample({ stamp: 101, animationFrame: 81, ...change }))
    assert.throws(() => validateMeleePauseFrames(samples, mapping), /same logical turn must retain native f1\/f2/)
  }
})

test('every sample independently requires connected live visible submitted body evidence', () => {
  for (const index of [0, 1, 2, 3]) {
    for (const [key, value, error] of [
      ['canvasConnected', false, /connected game canvas/], ['sceneStoreMatch', false, /scene\/store identity/],
      ['visible', false, /visible attack body/], ['submittedLayers', 0, /submitted on this renderer stamp/],
      ['submittedLayers', [], /submitted on this renderer stamp/], ['submittedLayers', undefined, /submitted on this renderer stamp/],
    ]) {
      const samples = evidence(); samples[index][key] = value
      assert.throws(() => validateMeleePauseFrames(samples, mapping), error)
    }
  }
})

test('all four crops require canvas-owned complete in-canvas bodies and an overlay-clear capture', () => {
  for (const index of [0, 1, 2, 3]) {
    for (const [key, error] of [['bodyCanvasOwned', /cropped body must be canvas-owned/],
      ['bodyInCanvas', /complete cropped body must be inside the canvas/],
      ['cropOverlayClear', /crop must be overlay-clear/]]) {
      for (const value of [false, undefined, 1]) {
        const samples = evidence(); samples[index][key] = value
        assert.throws(() => validateMeleePauseFrames(samples, mapping), error)
      }
    }
  }
})

test('missing, duplicate, malformed and extra crop files cannot pass', () => {
  for (const index of [0, 1, 2, 3]) {
    const samples = evidence(); delete samples[index].cropFile
    assert.throws(() => validateMeleePauseFrames(samples, mapping), /Exactly four unique/)
  }
  for (const cropFile of ['', '  ', null, 1, 'bad\n.png', 'bad\r.png', 'bad\0.png']) {
    const samples = evidence(); samples[1].cropFile = cropFile
    assert.throws(() => validateMeleePauseFrames(samples, mapping), /crop filename required/)
  }
  const duplicates = evidence(); duplicates[2].cropFile = duplicates[1].cropFile
  assert.throws(() => validateMeleePauseFrames(duplicates, mapping), /each native-frame crop must have its own file/)
  const extra = evidence()
  extra.push(sample({ phase: 'running-after-resume', stamp: 104, turn: 43, animationFrame: 86,
    f2: 3, cropFile: 'extra.png' }))
  assert.throws(() => validateMeleePauseFrames(extra, mapping), /Exactly four unique/)
})

test('four crops cannot be substituted onto later or nonadvancing observations', () => {
  for (const role of ['first-running', 'second-paused', 'first-advancing-resumed']) {
    const samples = evidence()
    const index = role === 'first-running' ? 0 : role === 'second-paused' ? 2 : 3
    const captured = samples[index], replacement = { ...captured, stamp: captured.stamp + 1 }
    delete captured.cropFile
    for (const later of samples.slice(index + 1)) later.stamp++
    samples.splice(index + 1, 0, replacement)
    assert.throws(() => validateMeleePauseFrames(samples, mapping), /Planned crops must cover/)
  }
})

test('old strict validator still rejects paused samples and running evidence without a same-turn hold', () => {
  assert.throws(() => validateMeleeAttackFrames(evidence(), mapping), /unpaused gameplay required/)
  const running = evidence().filter(sample => !sample.paused)
  assert.throws(() => validateMeleeAttackFrames(running, mapping), /same-turn\/direction hold/)
  const strict = [running[0], { ...running[0], cropFile: undefined, stamp: 101, animationFrame: 81 }, running[1]]
  assert.equal(validateMeleeAttackFrames(strict, mapping).shamanSequence.heldPairs, 1)
})
