import assert from 'node:assert/strict'

const attacks = new Set(['attack', 'strike', 'special'])
const integer = value => Number.isSafeInteger(value) && value >= 0
const sequenceKey = sample => JSON.stringify([sample.id, sample.action, sample.started, sample.fightGroup, sample.opponent])
const advances = (before, after) => after.turn > before.turn &&
  after.f2 !== before.f2 && after.frame !== before.frame && after.direction === before.direction
const observation = ({ phase, stamp, turn, animationFrame, action, started, opponent,
  fightGroup, remaining, animation, personId, personState, personSpeed, motionIsNative,
  logicalStamp, flight, object, draw, renderedDraw, f1, f2, direction, frame, flip, cropFile }) => ({
  phase, stamp, turn, animationFrame, action, started, opponent, fightGroup, remaining,
  animation, personId, personState, personSpeed, motionIsNative, logicalStamp, flight,
  object, draw, renderedDraw, f1, f2, direction, frame, flip, cropFile,
})

function validateMapping(mapping, key, attack = false) {
  assert.ok(mapping && integer(mapping.object) && integer(mapping.draw), `${key}: original object/draw mapping required`)
  assert.ok(integer(mapping.step), `${key}: original descriptor step required`)
  assert.ok(integer(mapping.frameCount) && mapping.frameCount > 0 && mapping.frameCount <= 256,
    `${key}: original native frameCount required`)
  assert.ok(Array.isArray(mapping.directions) && mapping.directions.length === 8,
    `${key}: eight original sprite directions required`)
  for (const direction of mapping.directions) {
    assert.ok(Array.isArray(direction?.frames) && direction.frames.length > 0 && direction.frames.every(integer),
      `${key}: original directional frame list required`)
    assert.equal(typeof direction.flip, 'boolean', `${key}: original direction flip required`)
  }
  if (attack) {
    assert.equal(mapping.step, 0, `${key}: source-qualified Shaman attack requires descriptor step0`)
    assert.ok(integer(mapping.duration) && mapping.duration > 1, `${key}: original attack duration required`)
    assert.equal(mapping.duration, (mapping.step + 1) * mapping.frameCount,
      `${key}: attack duration must equal original descriptor cadence times native frameCount`)
  }
}

function validateArtwork(sample, mapping, label) {
  assert.equal(sample.object, mapping.object, `${label}: expected original object ${mapping.object}`)
  assert.equal(sample.draw, mapping.draw, `${label}: expected original draw ${mapping.draw}`)
  assert.equal(sample.renderedDraw, sample.draw, `${label}: submitted renderer draw must match the physical original draw`)
  assert.ok(sample.direction < mapping.directions.length, `${label}: direction outside original table`)
  assert.ok(sample.f2 <= 255, `${label}: native f2 must fit its byte`)
  assert.ok(sample.f1 <= Math.max(1, mapping.step), `${label}: f1 outside original descriptor countdown`)
  const direction = mapping.directions[sample.direction]
  assert.equal(sample.frame, direction.frames[sample.f2 % direction.frames.length],
    `${label}: displayed frame must match original direction and native f2`)
  assert.equal(sample.flip, direction.flip, `${label}: displayed flip must match original direction`)
}

function validateAttackPhase(sample, mapping, label) {
  // The entry reset is f1=1/f2=0. Its ordinary logical animation visit consumes
  // f1, so the post-render entry observation is f1=0/f2=0, not a renderer tick.
  const elapsed = sample.turn - sample.started
  assert.deepEqual([sample.f1, sample.f2], [0, elapsed % mapping.frameCount],
    `${label}: native attack phase must match elapsed logical turns from entry`)
}

function validateAttack(sample, mapping, label) {
  validateArtwork(sample, mapping, label)
  const remaining = mapping.duration - 1 - (sample.turn - sample.started)
  assert.ok(remaining > 0, `${label}: attack cannot survive its native expiry turn`)
  assert.equal(sample.remaining, remaining, `${label}: remaining must equal exact original attack countdown`)
  assert.equal(sample.animation, sample.action, `${label}: attack animation must retain its action`)
  assert.equal(sample.personSpeed, 0, `${label}: attack physical person must be stopped`)
  assert.equal(sample.nativeAttackAnimation, true, `${label}: native attack ownership marker required`)
  validateAttackPhase(sample, mapping, label)
}

// Pure supplied-observation validation, not a browser receipt. The caller owns
// actual public command receipts, fixed-window observation and PNG file checks.
// Source ownership is a reviewed-source inference, never a private getter result.
export function validateMeleeRunningFrames(samples, originalMapping) {
  assert.ok(Array.isArray(samples) && samples.length > 0, 'Observed running melee samples required')
  assert.ok(originalMapping && typeof originalMapping === 'object' && !Array.isArray(originalMapping),
    'Original melee mapping required')
  const cropFiles = new Set(), sequences = new Map(), poseKeys = new Set(), planned = []
  let previous
  for (const sample of samples) {
    assert.ok(sample && typeof sample === 'object', 'Running melee sample must be an object')
    const label = `${sample.kind}${sample.id}/${sample.action}`
    assert.ok(sample.id === 54 && sample.kind === 'shaman', `${label}: authored M2 Shaman54 required`)
    assert.equal(sample.phase, 'running', `${label}: explicit running phase required`)
    assert.equal(sample.paused, false, `${label}: unpaused running observation required`)
    for (const key of ['turn', 'animationFrame', 'started', 'stamp', 'f1', 'f2', 'frame', 'direction',
      'opponent', 'fightGroup', 'personSpeed', 'personFlags2', 'personFlags4', 'logicalStamp'])
      assert.ok(integer(sample[key]), `${label}: nonnegative integer ${key} required`)
    assert.equal(sample.logicalStamp, sample.turn, `${label}: physical animation stamp must match the observed logical turn`)
    assert.ok(sample.started <= sample.turn, `${label}: action cannot start after observed turn`)
    assert.ok(sample.fightGroup > 0, `${label}: nonzero fight group required`)
    assert.equal(sample.personId, 54, `${label}: original physical person54 required`)
    assert.equal(sample.personState, 25, `${label}: physical person must remain in fight state25`)
    assert.equal(sample.personModel, 7, `${label}: original Shaman model7 required`)
    assert.equal(sample.personClass, 1, `${label}: original person class1 required`)
    assert.equal(sample.workFlags, sample.fightGroup, `${label}: physical person must belong to the fight group`)
    assert.equal(sample.flight, false, `${label}: flight override is not admitted`)
    assert.equal(sample.personFlags2 & 0x80000, 0, `${label}: airborne physical person is not admitted`)
    assert.equal(sample.personFlags4 & 0x400, 0, `${label}: airborne physics override is not admitted`)
    assert.equal(sample.personIdentityMatch, true, `${label}: retained original physical-person identity required`)
    assert.equal(typeof sample.motionIsNative, 'boolean', `${label}: physical/native source identity observation required`)
    const sourceAdmitted = (sample.nativeAttackAnimation === true && (attacks.has(sample.action) || sample.action === 'approach')) ||
      ['walk', 'idle'].includes(sample.animation) || sample.motionIsNative
    assert.ok(sourceAdmitted && sample.fightMotionSourceAdmitted === true,
      `${label}: fight-motion source-contract inference required`)
    assert.ok(Array.isArray(sample.participants) && sample.participants.every(integer) &&
      new Set(sample.participants).size === sample.participants.length &&
      sample.participants.includes(54) && sample.participants.includes(sample.opponent) && sample.opponent !== 54,
    `${label}: actor and retained opponent must be present in the fight roster`)
    for (const [key, error] of [['canvasConnected', 'connected game canvas'],
      ['sceneStoreMatch', 'live scene/store identity'], ['visible', 'visible body']])
      assert.equal(sample[key], true, `${label}: ${error} required`)
    assert.ok(integer(sample.submittedLayers) && sample.submittedLayers > 0,
      `${label}: visible body layers submitted on this renderer stamp required`)
    if (previous) {
      assert.ok(sample.stamp > previous.stamp, `${label}: distinct chronological renderer stamps required`)
      for (const key of ['turn', 'animationFrame'])
        assert.ok(sample[key] >= previous[key], `${label}: ${key} observations must be chronological`)
      for (const key of ['fightGroup', 'opponent'])
        assert.equal(sample[key], previous[key], `${label}: observations must retain the same ${key}`)
    }
    assert.ok(attacks.has(sample.action), `${label}: attack, strike or special required`)
    const mappingKey = `${sample.kind}:${sample.action}`
    assert.ok(Object.hasOwn(originalMapping, mappingKey), `${mappingKey}: original mapping missing`)
    validateMapping(originalMapping[mappingKey], mappingKey, true)
    validateAttack(sample, originalMapping[mappingKey], label)
    const key = sequenceKey(sample), sequence = sequences.get(key) ?? []
    const sameTurn = sequence.find(earlier => earlier.turn === sample.turn)
    if (sameTurn) assert.deepEqual([sample.f1, sample.f2], [sameTurn.f1, sameTurn.f2],
      `${label}: same logical turn must retain native f1/f2`)
    sequence.push(sample); sequences.set(key, sequence)
    const poseKey = JSON.stringify([sample.id, sample.action, sample.started, sample.fightGroup,
      sample.opponent, sample.object, sample.draw, sample.f1, sample.f2, sample.direction])
    const cropPlanned = !poseKeys.has(poseKey) && poseKeys.size < 4
    assert.equal(sample.cropPlanned, cropPlanned, `${label}: first four distinct poses must reserve crop slots`)
    if (cropPlanned) { poseKeys.add(poseKey); planned.push(sample) }
    assert.equal(sample.cropFile !== undefined, cropPlanned, `${label}: every planned crop required; no replacement crops`)
    if (sample.cropFile !== undefined) {
      assert.ok(typeof sample.cropFile === 'string' && sample.cropFile.trim() && !/[\0\r\n]/.test(sample.cropFile),
        `${label}: native-frame crop filename required`)
      assert.ok(!cropFiles.has(sample.cropFile), `${label}: each native-frame crop must have its own file`)
      for (const [key, error] of [['bodyCanvasOwned', 'canvas-owned'], ['bodyInCanvas', 'completely inside the canvas'],
        ['cropOverlayClear', 'overlay-clear']])
        assert.equal(sample[key], true, `${label}: native-frame crop body must be ${error}`)
      cropFiles.add(sample.cropFile)
    }
    assert.ok(sample.turn < samples[0].turn + 10, 'Samples must stay in the fixed first-attack ten-turn window')
    previous = sample
  }
  let pair
  for (const after of planned) {
    const before = planned.find(before => sequenceKey(before) === sequenceKey(after) && advances(before, after))
    if (before) { pair = [before, after]; break }
  }
  assert.ok(pair, 'Cropped same-direction same-sequence logical phase and artwork advancement required')
  return {
    protocol: 'running-original-artwork', sampleCount: samples.length, sequenceCount: sequences.size,
    cropFiles: [...cropFiles],
    obligations: {
      originalMappedArtwork: { status: 'passed', sampleCount: samples.length },
      sourceOwnership: { status: 'passed', claim: 'source-contract-inference',
        reason: 'Reviewed source predicates and independent mapped artwork, not direct renderer-source identity observation.' },
      runningAdvancement: { status: 'passed', before: observation(pair[0]), after: observation(pair[1]) },
      browserPauseHoldResume: { status: 'not-claimed', reason: 'No in-attack public pause round trip; deterministic CPU contracts and separate public controls remain separate.' },
      runningSameTurnHold: { status: 'not-claimed', reason: 'Actual Scene CPU hold/advance tests remain separate from browser sampling.' },
      nativeRecoilParity: { status: 'not-claimed', reason: 'Only original attack artwork is accepted.' },
    },
  }
}
