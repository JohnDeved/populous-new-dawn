import assert from 'node:assert/strict'
import test from 'node:test'
import { stepPreachingOrder } from '../app/preacher-conversion.ts'
import { setPersonAnimation, stepObjectAnimation } from '../app/animation.ts'
import { stopPersonMovement } from '../app/person-state.ts'
import rules from '../app/original-rules.json' with { type: 'json' }
import units from '../app/original-units.json' with { type: 'json' }
import proof from './fixtures/preacher-terminal-restart.json' with { type: 'json' }

// The frozen original component owns these expectations. This supplied fixture
// neither launches original code nor proves a rendered/ordinary-world outcome.
function setup(person = proof.input.person, model = 17) {
  const p = { ...structuredClone(person), commands: [...proof.input.commands], building: null }
  p.commandStatus = model
  const order = { ...proof.input.order, model }
  const records = Array.from({ length: 28 }, () => ({ model: 0, flags: 0, references: 0, object: 0, a: 0, b: 0 }))
  records[26] = order
  const world = { randomState: proof.input.simulationRandom,
    poseRandom: { randomState: proof.input.cosmeticRandom }, playerTribe: 0,
    loadFlags: 0, orders: { records, cursor: 26, active: 1 }, tribeFlags: [0, 0, 0, 0] }
  const setterWorld = { playerTribe: 0, gameFlags: 0, sessionSubstate: null,
    tribes: Array.from({ length: 4 }, () => ({ flags: 0, playerType: 1 })), objects: new Map() }
  const calls = []
  const animate = object => {
    calls.push(['animate', object])
    setPersonAnimation(p, object, setterWorld, units)
  }
  const effects = {
    animate,
    animationDuration: () => (rules.animationDescriptors[p.draw].step + 1) * units.frameCounts[p.object],
    frameCount: () => units.frameCounts[p.object],
    sound: () => { throw new Error('Unexpected sermon audio') },
    stop: () => { calls.push(['broad-stop']); stopPersonMovement(p, (_, object) => animate(object)) },
    acquire: radius => { calls.push(['acquire', radius]); p.statusFlags |= 2; return 0 },
    release: radius => calls.push(['release', radius]),
  }
  return { p, order, world, calls, effects }
}

function raw(p) {
  const bytes = Buffer.alloc(256)
  for (const [name, [offset, type]] of Object.entries(proof.fields)) {
    if (type === 'I') bytes.writeUInt32LE(p[name] >>> 0, offset)
    else if (type === 'H') bytes.writeUInt16LE(p[name], offset)
    else if (type === 'h') bytes.writeInt16LE(p[name], offset)
    else bytes.writeUInt8(p[name], offset)
  }
  p.commands.forEach((id, index) => bytes.writeUInt16LE(id, 0x8b + index * 2))
  return bytes.toString('hex')
}

function matchesNative(state, expected, message) {
  assert.deepEqual(Object.fromEntries(Object.keys(proof.fields).map(key => [key, state.p[key]])), expected.fields, message)
  assert.equal(raw(state.p), expected.raw, `${message}: all 256 supplied record bytes`)
  assert.deepEqual(state.p.commands, expected.commands)
  assert.deepEqual(state.order, expected.order)
  assert.equal(state.world.randomState, expected.simulationRandom)
  assert.equal(state.world.poseRandom.randomState, expected.cosmeticRandom)
}

const controller = state => stepPreachingOrder(state.world, state.p, state.order, state.effects)

test('terminal command17 entry flag and all three composed phases match the frozen native record', () => {
  const state = setup()
  matchesNative(state, proof.native.initial, 'initial supplied projection')
  for (const row of proof.native.rows) {
    state.p.counter++
    const serial = proof.input.worldAnimationCounter + row.visit
    matchesNative(state, row.beforeController, `visit${row.visit} before controller`)
    assert.equal(controller(state), row.result)
    matchesNative(state, row.afterController, `visit${row.visit} after controller`)
    state.p.stamp = serial
    matchesNative(state, row.beforeUpdater, `visit${row.visit} before updater`)
    stepObjectAnimation(state.p, { counter: serial, levelFlags: 0, levelFlags2: 0 }, units,
      () => { throw new Error('Unexpected footprint') })
    matchesNative(state, row.afterUpdater, `visit${row.visit} after updater`)
  }
  assert.deepEqual(state.calls, [['acquire', 3], ['animate', 17],
    ['broad-stop'], ['animate', 17], ['animate', 95], ['acquire', 3]])
})

test('phase4 restart selects the native standing family without using route-cleaning stop', () => {
  const state = setup(proof.native.rows[1].beforeController.fields)
  state.effects.stop = () => { throw new Error('Phase4 must not release routes or clear live paths') }
  assert.equal(controller(state), 0)
  matchesNative(state, proof.native.rows[1].afterController, 'phase4 exact native consumer')
  assert.deepEqual(state.calls, [['animate', 17]])
})

test('phase4 pure stop preserves route ownership and cached-path state', () => {
  const state = setup(proof.native.rows[1].beforeController.fields)
  Object.assign(state.p, { speed: 73, motionGroup: 9, motionIndex: 4 })
  const path = [{ x: 12, z: 34 }], registered = new Map([[state.p.id, state.p]])
  state.effects.stop = () => {
    state.p.motionGroup = state.p.motionIndex = 0
    registered.delete(state.p.id)
    path.length = 0
    throw new Error('The broader route/path callback was invoked')
  }
  assert.equal(controller(state), 0)
  assert.equal(state.p.speed, 0)
  assert.deepEqual([state.p.object, state.p.draw], [48, 16])
  assert.deepEqual([state.p.motionGroup, state.p.motionIndex], [9, 4])
  assert.equal(registered.get(state.p.id), state.p)
  assert.deepEqual(path, [{ x: 12, z: 34 }])
})

// Shared operations are supported by the original branch instructions. These
// supplied port regressions do not establish ordinary31/32 or Tower/vehicle parity.
test('shared phase4 stop retains queue/building fields and the known command32 expiry behavior', () => {
  for (const model of [17, 31, 32]) {
    const state = setup(proof.native.rows[1].beforeController.fields, model)
    if (model === 31) Object.assign(state.p, { building: 99, workTarget: 99,
      flags2: (state.p.flags2 | 0x800000) >>> 0, commandAux: 5 })
    const before = { building: state.p.building, workTarget: state.p.workTarget,
      flags4: state.p.flags4, cargo: state.p.cargo, vehicle: state.p.vehicle,
      commands: [...state.p.commands], order: { ...state.order } }
    assert.equal(controller(state), model === 32 ? 1 : 0,
      'command32 still has the existing post-switch expiry/release residual')
    assert.deepEqual([state.p.speed, state.p.object, state.p.draw, state.p.substate], [0, 48, 16, 2])
    assert.ok(state.p.flags2 & 0x40000000)
    assert.deepEqual({ building: state.p.building, workTarget: state.p.workTarget,
      flags4: state.p.flags4, cargo: state.p.cargo, vehicle: state.p.vehicle,
      commands: state.p.commands, order: state.order }, before)
    assert.deepEqual(state.calls, model === 32 ? [['animate', 17], ['release', 3]] : [['animate', 17]])
    assert.equal(state.world.randomState, proof.input.simulationRandom)
    assert.equal(state.world.poseRandom.randomState, proof.input.cosmeticRandom)
  }
})

test('a following command still releases and returns before the new restart stop', () => {
  for (const model of [17, 31, 32]) {
    const state = setup(proof.native.rows[1].beforeController.fields, model)
    state.p.commands[1] = 27
    state.world.orders.records[27] = { model: 3, flags: 0, references: 1, object: 0, a: 1, b: 2 }
    assert.equal(controller(state), 1)
    assert.deepEqual(state.calls, [['release', 3]])
    assert.deepEqual([state.p.substate, state.p.object, state.p.draw], [4, 168, 14])
    assert.deepEqual(state.p.commands, [26, 27, 0, 0, 0, 0, 0, 0])
  }
})

test('terminal mode0 turning now preserves the retained native RNG outcome', () => {
  const state = setup()
  Object.assign(state.p, { counter: 0, statusFlags: 0, assignment: 0, animationMode: 0 })
  state.world.randomState = 4
  assert.equal(controller(state), 0)
  assert.deepEqual([state.p.animationMode, state.p.assignment, state.world.randomState], [0, 0, 4])
  assert.equal(state.world.poseRandom.randomState, proof.input.cosmeticRandom)
  assert.deepEqual(state.calls, [['acquire', 3]])
})

// These supplied controller rows follow the original timer jump and mode bodies.
// Modes1/2 are source-backed boundary regressions, not additional native executions.
// Equal angle/heading and in-range phases leave their other ownership/width gaps alone.
const turningBaseFlags = 0x02220200
const turningFacingFlags = turningBaseFlags | 0x1080
const turningEntryFlags = turningBaseFlags | 0x40000000
const turningDraw = 3138912261
const turningRows = [
  ['mode0 before cutoff', [838, 16, 0, 320, 7], [839, 3, 1, 272, 7, 11008, turningBaseFlags, turningDraw]],
  ['mode0 at cutoff', [839, 16, 0, 320, 7], [840, 4, 0, 256, 7, 11008, turningEntryFlags, 4]],
  ['mode1 entry before cutoff', [838, 8, 1, 272, 7], [839, 3, 1, 256, 39, 718, turningFacingFlags, 4]],
  ['mode1 entry at cutoff', [839, 8, 1, 272, 7], [840, 4, 1, 272, 7, 11008, turningEntryFlags, 4]],
  ['mode1 expiry before cutoff', [838, 8, 1, 256, 1], [839, 3, 0, 272, 0, 11008, turningBaseFlags, 4]],
  ['mode1 expiry at cutoff', [839, 8, 1, 256, 1], [840, 4, 1, 256, 1, 11008, turningEntryFlags, 4]],
  ['mode2 before cutoff off the decision counter', [838, 9, 2, 256, 7], [839, 3, 0, 272, 7, 5, turningFacingFlags, turningDraw]],
  ['mode2 at cutoff off the decision counter', [839, 9, 2, 256, 7], [840, 4, 2, 256, 7, 11008, turningEntryFlags, 4]],
  ['mode2 above cutoff', [840, 9, 2, 256, 7], [841, 4, 2, 256, 7, 11008, turningEntryFlags, 4]],
  ['bit2 suppresses mode0 below cutoff', [838, 16, 0, 256, 7], [839, 3, 0, 256, 7, 11008, turningBaseFlags, 4], { statusFlags: 3 }],
  ['bit2 suppresses mode1 below cutoff', [838, 8, 1, 272, 7], [839, 3, 1, 272, 7, 11008, turningBaseFlags, 4], { statusFlags: 3 }],
  ['bit2 suppresses mode2 below cutoff', [838, 9, 2, 256, 7], [839, 3, 2, 256, 7, 11008, turningBaseFlags, 4], { statusFlags: 3 }],
  ['speed interruption remains outside the timer guard', [840, 8, 2, 256, 7], [840, 3, 1, 272, 7, 11008, turningBaseFlags, 4], { speed: 73 }],
  ['flag4 interruption remains outside the timer guard', [840, 8, 2, 256, 7], [840, 3, 1, 272, 7, 11008, turningBaseFlags | 4, 4], { flags2: turningBaseFlags | 4 }],
  ['flag2000 interruption remains outside the timer guard', [840, 8, 2, 256, 7], [840, 3, 1, 272, 7, 11008, turningBaseFlags | 0x2000, 4], { flags2: turningBaseFlags | 0x2000 }],
]

for (const [name, input, output, overrides = {}] of turningRows) {
  test(`shared sermon timer boundary: ${name}`, () => {
    const state = setup()
    const [timer, counter, animationMode, assignment, commandPhase] = input
    Object.assign(state.p, { substate: 3, speed: 0, statusFlags: 1, f1: 1,
      angle: 694, heading: 694, turnAngle: 11008, flags2: turningBaseFlags,
      timer, counter, animationMode, assignment, commandPhase, ...overrides })
    state.world.randomState = 4
    const expectedPerson = structuredClone(state.p), expectedWorld = structuredClone(state.world)
    const keys = ['timer', 'substate', 'animationMode', 'assignment', 'commandPhase', 'turnAngle', 'flags2']
    keys.forEach((key, index) => { expectedPerson[key] = output[index] })
    // The existing empty-acquisition adapter sets bit2 after the turning work.
    if (!(counter & 1)) expectedPerson.statusFlags |= 2
    expectedWorld.randomState = output[7]
    assert.equal(controller(state), 0)
    assert.deepEqual(state.p, expectedPerson, 'Every person/queue/source/frame field stays accounted for')
    assert.deepEqual(state.world, expectedWorld, 'Only the declared simulation draw may change world state')
    assert.deepEqual(state.calls, counter & 1 ? [] : [['acquire', 3]],
      'The even scan tail remains outside the timer guard; no animation/audio/stop/release call')
  })
}
