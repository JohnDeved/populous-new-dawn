import assert from 'node:assert/strict'

export const recoilRunningProtocol = 'running-native-recoil-entry-v1'
const integer = value => Number.isSafeInteger(value) && value >= 0
const key = sample => JSON.stringify([sample.id, sample.action, sample.started, sample.fightGroup, sample.opponent])

// Supplied-observation validation only. The caller retains the real public order,
// original mapping, same-frame PNGs, runtime errors and closed browser context.
export function validateRecoilObservation(result, mapping) {
  assert.equal(result?.protocol, recoilRunningProtocol)
  assert.equal(result.done, true); assert.equal(result.error, null)
  assert.ok(Array.isArray(result.samples) && result.samples.length > 0 && result.samples.length <= 1200)
  const first = result.samples[0], last = result.samples.at(-1), original = mapping?.['shaman:recoil']
  assert.ok(original && integer(original.object) && integer(original.draw))
  assert.equal(original.step, 0); assert.equal(original.frameCount, 5)
  assert.equal(original.duration, 7); assert.equal(original.knockbackDuration, 4)
  assert.ok(Array.isArray(original.directions) && original.directions.length === 8)
  for (const direction of original.directions) {
    assert.ok(Array.isArray(direction.frames) && direction.frames.length === 5 && direction.frames.every(integer))
    assert.equal(typeof direction.flip, 'boolean')
  }
  assert.equal(typeof first.knockback, 'boolean')
  const duration = first.knockback ? original.knockbackDuration : original.duration
  const entry = { id: 54, kind: 'shaman', action: 'recoil', started: first.started,
    fightGroup: first.fightGroup, opponent: first.opponent, duration, knockback: first.knockback,
    endExclusive: first.started + duration - 1 }
  assert.deepEqual(result.entry, entry)
  assert.equal(result.firstAttackTurn, first.turn)
  assert.equal(first.turn, first.started, 'First recoil entry must be observed, not a later favorable phase')
  const poses = new Set(), cropFiles = new Set(), turns = new Set(), cropped = []
  let previous
  for (const sample of result.samples) {
    assert.equal(key(sample), key(first), 'Every sample retains the first recoil episode')
    assert.equal(sample.id, 54); assert.equal(sample.kind, 'shaman'); assert.equal(sample.action, 'recoil')
    assert.equal(sample.animation, 'recoil'); assert.equal(sample.phase, 'running')
    for (const field of ['stamp', 'turn', 'animationFrame', 'started', 'opponent', 'fightGroup', 'direction',
      'f1', 'f2', 'frame', 'personSpeed', 'personFlags2', 'personFlags4', 'logicalStamp']) assert.ok(integer(sample[field]), field)
    assert.ok(sample.opponent !== 54 && sample.fightGroup > 0)
    assert.equal(sample.knockback, first.knockback)
    assert.equal(sample.nativeRecoilAnimation, true)
    for (const field of ['personIdentityMatch', 'fightMotionSourceAdmitted', 'visible', 'canvasConnected', 'sceneStoreMatch'])
      assert.equal(sample[field], true, field)
    assert.equal(sample.paused, false); assert.equal(sample.flight, false)
    assert.equal(typeof sample.motionIsNative, 'boolean')
    assert.equal(sample.personId, 54); assert.equal(sample.personState, 25)
    assert.equal(sample.personModel, 7); assert.equal(sample.personClass, 1)
    assert.equal(sample.workFlags, sample.fightGroup); assert.equal(sample.personSpeed, 0)
    assert.equal(sample.personFlags2 & 0x80000, 0); assert.equal(sample.personFlags4 & 0x400, 0)
    assert.equal(sample.logicalStamp, sample.turn)
    assert.ok(Array.isArray(sample.participants) && sample.participants.every(integer) &&
      new Set(sample.participants).size === sample.participants.length &&
      sample.participants.includes(54) && sample.participants.includes(sample.opponent))
    assert.ok(integer(sample.submittedLayers) && sample.submittedLayers > 0)
    const elapsed = sample.turn - first.started
    assert.ok(elapsed >= 0 && sample.turn < entry.endExclusive)
    assert.equal(sample.remaining, duration - 1 - elapsed)
    assert.deepEqual([sample.f1, sample.f2], [0, elapsed % original.frameCount])
    assert.equal(sample.object, original.object); assert.equal(sample.draw, original.draw)
    assert.equal(sample.renderedDraw, original.draw); assert.ok(sample.direction < 8)
    const direction = original.directions[sample.direction]
    assert.equal(sample.frame, direction.frames[sample.f2]); assert.equal(sample.flip, direction.flip)
    if (previous) {
      assert.ok(sample.stamp > previous.stamp)
      assert.ok(sample.turn >= previous.turn && sample.animationFrame >= previous.animationFrame)
    }
    const pose = JSON.stringify([sample.id, sample.action, sample.started, sample.fightGroup,
      sample.opponent, sample.object, sample.draw, sample.f1, sample.f2, sample.direction])
    const planned = !poses.has(pose) && poses.size < 4
    assert.equal(sample.cropPlanned, planned)
    assert.equal(sample.cropFile !== undefined, planned)
    if (planned) {
      poses.add(pose)
      assert.match(sample.cropFile, /^melee-recoil-frame-[0-3]\.png$/)
      assert.ok(!cropFiles.has(sample.cropFile)); cropFiles.add(sample.cropFile)
      for (const field of ['bodyCanvasOwned', 'bodyInCanvas', 'cropOverlayClear']) assert.equal(sample[field], true)
      cropped.push(sample)
    }
    turns.add(sample.turn); previous = sample
  }
  assert.deepEqual([...turns], Array.from({ length: duration - 1 }, (_, i) => first.started + i),
    'Every logical recoil phase before expiry must have actual rendered observation')
  assert.ok(cropped.some(a => cropped.some(b => b.turn > a.turn && b.direction === a.direction &&
    b.f2 !== a.f2 && b.frame !== a.frame)), 'Same-direction canvas crops must show native phase advancement')
  const { terminal, endpoint } = result
  assert.equal(terminal?.reason, 'entry-complete'); assert.equal(terminal.turn, entry.endExclusive)
  assert.ok(integer(terminal.stamp) && terminal.stamp > last.stamp)
  assert.deepEqual([endpoint.turn, endpoint.stamp], [terminal.turn, terminal.stamp])
  for (const field of ['id', 'kind', 'started', 'fightGroup', 'opponent', 'knockback', 'personId',
    'personState', 'personModel', 'personClass', 'workFlags', 'object', 'draw']) assert.equal(endpoint[field], first[field], field)
  assert.equal(endpoint.action, first.knockback ? 'push' : 'approach')
  assert.equal(endpoint.remaining, null); assert.equal(endpoint.animation, 'recoil')
  assert.equal(endpoint.nativeRecoilAnimation, true); assert.equal(endpoint.team, 'blue')
  assert.equal(endpoint.alive, true); assert.ok(Number.isFinite(endpoint.hp) && endpoint.hp > 0)
  assert.equal(endpoint.personIdentityMatch, true); assert.equal(endpoint.logicalStamp, endpoint.turn)
  assert.deepEqual([endpoint.f1, endpoint.f2], [0, (duration - 1) % original.frameCount])
  assert.ok(integer(endpoint.animationFrame) && endpoint.animationFrame >= last.animationFrame)
  assert.equal(endpoint.flight, false); assert.equal(endpoint.paused, false)
  for (const [field, mask] of [['personFlags2', 0x80000], ['personFlags4', 0x400]]) {
    assert.ok(integer(endpoint[field])); assert.equal(endpoint[field] & mask, 0)
  }
  for (const field of ['canvasConnected', 'sceneStoreMatch', 'documentVisible']) assert.equal(endpoint[field], true)
  return { protocol: recoilRunningProtocol, status: 'passed', sampleCount: result.samples.length,
    logicalTurns: [...turns], cropFiles: [...cropFiles], duration, knockback: first.knockback,
    nativeFiveFrameLoopObserved: !first.knockback,
    claim: 'Ordinary Shaman recoil entry, original mapped artwork and exact expiry; no native executable, hardware FPS or post-expiry push acceptance' }
}
