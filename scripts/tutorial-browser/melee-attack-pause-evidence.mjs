import assert from 'node:assert/strict'

const attacks = new Set(['attack', 'strike', 'special'])
const phases = ['running-before-pause', 'public-paused-hold', 'running-after-resume']
const integer = value => Number.isSafeInteger(value) && value >= 0
const advances = (before, after) => after.turn > before.turn &&
  after.f2 !== before.f2 && after.frame !== before.frame
const sequenceKey = sample => JSON.stringify([sample.action, sample.started])
const observation = ({ phase, stamp, turn, animationFrame, action, started, opponent,
  object, draw, f1, f2, direction, frame, flip, cropFile }) => ({
  phase, stamp, turn, animationFrame, action, started, opponent,
  object, draw, f1, f2, direction, frame, flip, cropFile,
})

function validateMapping(mapping, key) {
  assert.ok(mapping && integer(mapping.object) && integer(mapping.draw), `${key}: original object/draw mapping required`)
  assert.ok(integer(mapping.step), `${key}: original descriptor step required`)
  assert.ok(Array.isArray(mapping.directions) && mapping.directions.length === 8,
    `${key}: eight original sprite directions required`)
  for (const direction of mapping.directions) {
    assert.ok(Array.isArray(direction?.frames) && direction.frames.length > 0 && direction.frames.every(integer),
      `${key}: original directional frame list required`)
    assert.equal(typeof direction.flip, 'boolean', `${key}: original direction flip required`)
  }
}

// Pure validation of supplied post-render observations, not browser acceptance.
// The caller establishes original-table provenance, actual public Pause/Resume,
// canvas ownership/overlay checks, and synchronous PNG capture/file verification.
// Paused renderer visits establish only a paused hold. They must never substitute
// for the old strict validator's running same-turn hold or the CPU cadence proof.
export function validateMeleePauseFrames(samples, originalMapping) {
  assert.ok(Array.isArray(samples) && samples.length > 0, 'Observed layered melee samples required')
  assert.ok(originalMapping && typeof originalMapping === 'object' && !Array.isArray(originalMapping),
    'Original melee mapping required')
  const groups = phases.map(() => []), sequences = new Map(), mappings = new Set(), cropFiles = new Set()
  let previous, previousPhase = 0
  for (const sample of samples) {
    assert.ok(sample && typeof sample === 'object', 'Layered melee sample must be an object')
    const label = `${sample.kind}${sample.id}/${sample.action}`
    assert.ok(sample.id === 54 && sample.kind === 'shaman', `${label}: authored M2 Shaman54 required`)
    assert.ok(attacks.has(sample.action), `${label}: attack, strike or special required; recoil is not attack evidence`)
    const phase = phases.indexOf(sample.phase)
    assert.ok(phase >= 0, `${label}: explicit layered observation phase required`)
    assert.ok(phase >= previousPhase, `${label}: phases must be ordered running-before, paused-hold, running-after`)
    assert.equal(sample.paused, phase === 1, `${label}: paused boolean must match observation phase`)
    for (const key of ['turn', 'animationFrame', 'started', 'stamp', 'f1', 'f2', 'frame', 'direction'])
      assert.ok(integer(sample[key]), `${label}: nonnegative integer ${key} required`)
    assert.ok(sample.started <= sample.turn, `${label}: attack cannot start after observed turn`)
    if (Object.hasOwn(sample, 'opponent'))
      assert.ok(integer(sample.opponent), `${label}: supplied opponent must be a nonnegative integer`)
    const key = `${sample.kind}:${sample.action}`
    assert.ok(Object.hasOwn(originalMapping, key), `${key}: original mapping missing`)
    const mapping = originalMapping[key]
    if (!mappings.has(key)) { validateMapping(mapping, key); mappings.add(key) }
    // Original expectations are independent of the ownership marker.
    assert.equal(sample.object, mapping.object, `${label}: expected original attack object ${mapping.object}`)
    assert.equal(sample.draw, mapping.draw, `${label}: expected original attack draw ${mapping.draw}`)
    assert.ok(sample.direction < mapping.directions.length, `${label}: direction outside original table`)
    assert.ok(sample.f2 <= 255, `${label}: native f2 must fit its byte`)
    assert.ok(sample.f1 <= Math.max(1, mapping.step), `${label}: f1 outside original descriptor countdown`)
    const direction = mapping.directions[sample.direction]
    assert.equal(sample.frame, direction.frames[sample.f2 % direction.frames.length],
      `${label}: displayed frame must match original direction and native f2`)
    assert.equal(sample.flip, direction.flip, `${label}: displayed flip must match original direction`)
    assert.equal(sample.nativeAttackAnimation, true, `${label}: native attack ownership marker required`)
    assert.equal(sample.canvasConnected, true, `${label}: connected game canvas required`)
    assert.equal(sample.sceneStoreMatch, true, `${label}: live scene/store identity required`)
    assert.equal(sample.visible, true, `${label}: visible attack body required`)
    assert.ok(integer(sample.submittedLayers) && sample.submittedLayers > 0,
      `${label}: visible body layers submitted on this renderer stamp required`)
    if (previous) {
      assert.ok(sample.stamp > previous.stamp, `${label}: distinct chronological renderer stamps required`)
      for (const key of ['turn', 'animationFrame'])
        assert.ok(sample[key] >= previous[key], `${label}: ${key} observations must be chronological`)
    }
    let sequence = sequences.get(sequenceKey(sample))
    if (!sequence) {
      sequence = { samples: [], turns: new Map(), opponent: sample.opponent }
      sequences.set(sequenceKey(sample), sequence)
    }
    assert.equal(sample.opponent, sequence.opponent, `${label}: one action/start sequence must retain its supplied opponent`)
    const sameTurn = sequence.turns.get(sample.turn)
    if (sameTurn)
      assert.deepEqual([sample.f1, sample.f2], [sameTurn.f1, sameTurn.f2],
        `${label}: same logical turn must retain native f1/f2`)
    sequence.turns.set(sample.turn, sample)
    sequence.samples.push(sample)
    if (sample.cropFile !== undefined) {
      assert.ok(typeof sample.cropFile === 'string' && sample.cropFile.trim() && !/[\0\r\n]/.test(sample.cropFile),
        `${label}: native-frame crop filename required`)
      assert.ok(!cropFiles.has(sample.cropFile), `${label}: each native-frame crop must have its own file`)
      assert.equal(sample.bodyCanvasOwned, true, `${label}: cropped body must be canvas-owned`)
      assert.equal(sample.bodyInCanvas, true, `${label}: complete cropped body must be inside the canvas`)
      assert.equal(sample.cropOverlayClear, true, `${label}: native-frame crop must be overlay-clear`)
      cropFiles.add(sample.cropFile)
    }
    groups[phase].push(sample)
    previous = sample; previousPhase = phase
  }

  const [before, paused, after] = groups
  assert.ok(before.length > 0, 'At least one unpaused running-before-pause sample required')
  assert.ok(paused.length >= 2, 'At least two distinct public-paused-hold renderer visits required')
  assert.ok(after.length > 0, 'At least one unpaused running-after-resume sample required')
  const anchor = paused[0]
  for (const sample of paused.slice(1)) {
    for (const key of ['turn', 'animationFrame', 'action', 'started', 'object', 'draw',
      'f1', 'f2', 'direction', 'frame', 'flip', 'opponent'])
      assert.equal(sample[key], anchor[key], `Paused hold must retain ${key} across distinct renderer stamps`)
  }
  const anchorBefore = before.filter(sample => sequenceKey(sample) === sequenceKey(anchor))
  const anchorAfter = after.filter(sample => sequenceKey(sample) === sequenceKey(anchor))
  assert.ok(anchorBefore.length > 0, 'Paused anchor sequence needs running-before evidence with the same action/start')
  assert.ok(anchorAfter.length > 0, 'Paused anchor sequence needs running-after evidence with the same action/start')
  const resumed = anchorAfter.find(sample => advances(anchor, sample))
  assert.ok(resumed, 'Resumed anchor sequence must advance logical turn, native f2 and artwork from its paused pose')
  const unpausedAfter = anchorAfter.find(later => anchorBefore.some(earlier => advances(earlier, later)))
  assert.ok(unpausedAfter, 'Same anchor sequence must advance logical turn, native f2 and artwork between unpaused samples')
  const unpausedBefore = anchorBefore.find(sample => advances(sample, unpausedAfter))

  const plannedCrops = [before[0], paused[0], paused[1], resumed]
  assert.equal(cropFiles.size, 4, 'Exactly four unique native-frame crop files required')
  for (const sample of plannedCrops)
    assert.ok(sample.cropFile !== undefined,
      'Planned crops must cover first running, first two paused visits and first advancing resumed frame')
  assert.ok(samples.every(sample => sample.cropFile === undefined || plannedCrops.includes(sample)),
    'Only the four planned observation roles may have crops')
  const sequence = sequences.get(sequenceKey(anchor))
  return {
    protocol: 'layered-public-melee-pause-resume', sampleCount: samples.length,
    sequenceCount: sequences.size, cropFiles: [...cropFiles],
    shamanSequence: { id: 54, kind: 'shaman', action: anchor.action, started: anchor.started,
      sampleCount: sequence.samples.length, firstTurn: sequence.samples[0].turn,
      lastTurn: sequence.samples.at(-1).turn, opponent: anchor.opponent },
    obligations: {
      originalMappedArtwork: { status: 'passed', sampleCount: samples.length },
      publicPausedHold: { status: 'passed', sampleCount: paused.length,
        anchor: observation(anchor), stamps: paused.map(sample => sample.stamp) },
      resumedAdvancement: { status: 'passed', before: observation(anchor), after: observation(resumed) },
      unpausedAdvancement: { status: 'passed', before: observation(unpausedBefore), after: observation(unpausedAfter) },
      runningSameTurnHold: { status: 'not-claimed',
        reason: 'Paused renderer visits are not running same-turn evidence; CPU cadence and real-caller checks remain separate.' },
    },
  }
}
