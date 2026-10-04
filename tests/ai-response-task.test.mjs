import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'
import { missionData, missionScript, missionAllowsBuilding } from '../app/mission-data.ts'
import { campaignTribe } from '../app/campaign-runtime.ts'

// These complete authored-program invariants bound the live slice; startup
// masks alone would not exclude a later defense/patrol/Spy branch.
test('Missions1/2 never enable type8 or idle type11/15 response follow-ups', () => {
  for (const level of [1, 2]) {
    const script = missionScript(level), state8 = []
    for (let i = 0; i + 2 < script.codes.length; i++)
      if (script.codes[i] === 1006 && script.codes[i + 1] === 1036)
        state8.push(script.codes[i + 2])
    assert.deepEqual(state8, [1023])
    assert.ok(!script.fields.some(([kind, value]) => kind === 2 && value === 1031))
    assert.equal(script.commands[1066], undefined)
    assert.equal(script.commands[1067], undefined)
    assert.ok(missionData(level).level.objects.every(o => o.type !== 1 || o.model !== 5))
    assert.equal(missionAllowsBuilding(level, 6), false)
    const world = createWorld(level)
    assert.equal(world.ai.attributes[31], 0)
    assert.ok(world.buildings.every(b => b.kind !== 'spyHut'))
    assert.ok(world.shrines.every(s => s.reward !== 'spyHut'))
  }
  assert.ok(createWorld(3).ai.states & 256, 'Mission3 remains outside this complete slice')
})

test('ordinary Missions1/2 allocate a real pre-table scan at their first producer opportunity', () => {
  for (const level of [1, 2]) {
    const world = createWorld(level), tribe = campaignTribe(world)
    const producerTurn = (63 - tribe) & 63
    while (world.turn <= producerTurn) tick(world, 1 / 12)
    const response = world.ai.tasks.find(task => task.flags & 1 && task.type === 9)
    assert.ok(response, `Mission${level}: missing native type9 at turn${world.turn}`)
    assert.equal(response.phase, 0)
    assert.ok(world.ai.producers[0].attempts, 'pre-table allocation still permits table production')
  }
})

test('normal first scans finish and repeat without a placeholder reservation', () => {
  for (const level of [1, 2]) {
    const world = createWorld(level), starts = [], finishes = []
    let previous = false
    while (world.turn < 240) {
      tick(world, 1 / 12)
      const active = world.ai.tasks.some(task => task.flags & 1 && task.type === 9)
      if (active && !previous) starts.push(world.turn)
      if (!active && previous) finishes.push(world.turn)
      previous = active
    }
    assert.equal(starts.length, 3)
    assert.equal(finishes.length, 3)
    assert.deepEqual(starts.slice(1).map((turn, i) => turn - starts[i]), [64, 64])
    assert.ok(finishes.every((turn, i) => turn > starts[i] && turn < starts[i] + 64))
    assert.equal(world.ai.flags & 8, 0)
    assert.equal(world.status, 'playing')
  }
})

test('ordinary Mission2 movement reaches a real response and resumes the scan checkpoint', async () => {
  const { command, setSelection } = await import('../app/model.ts')
  const { migrateCheckpoint } = await import('../app/game-store.ts')
  const world = createWorld(2)
  while (world.turn < 70) tick(world, 1 / 12)
  const shaman = world.units.find(u => u.team === 'blue' && u.kind === 'shaman')
  const target = world.buildings.find(b => b.team === 'green' && b.hp > 0)
  assert.ok(shaman && target)
  setSelection(world, [shaman.id])
  assert.ok(command(world, { x: target.x, z: target.z }))
  const find = () => world.ai.tasks.find(task => task.flags & 1 && task.type === 9 && task.responseScan?.entity)
  while (world.turn < 1000 && !find()) tick(world, 1 / 12)
  const task = find()
  assert.ok(task, 'shipped movement must reach original enemy territory')
  assert.equal(task.responseScan.entity, shaman.id)
  assert.equal(task.phase, 3)
  const resumed = migrateCheckpoint(structuredClone(world))
  const index = world.ai.tasks.indexOf(task)
  let responded = false, cleaned = false
  for (let i = 0; i < 20; i++) {
    tick(world, 1 / 12)
    tick(resumed, 1 / 12)
    assert.deepEqual(resumed.ai, world.ai)
    assert.equal(resumed.randomState, world.randomState)
    if (task.phase === 5 && task.flags & 1) {
      responded = true
      assert.equal(world.ai.flags & 12, 12)
      assert.ok(!world.ai.tasks.some(task => task.flags & 1 && task.type === 8))
    }
    if (!(world.ai.tasks[index].flags & 1)) { cleaned = true; break }
  }
  assert.ok(responded && cleaned)
})

test('response allocation preserves native duplicate, disabled, cancellation and exhaustion gates', async () => {
  const { createComputerQueue, requestEarlyResponseTask, produceComputerTasks } = await import('../app/computer.ts')
  const ai = createComputerQueue()
  assert.equal(requestEarlyResponseTask(ai, 0), false)
  for (const task of ai.tasks) task.flags = 1
  assert.equal(requestEarlyResponseTask(ai, 512), false)
  ai.tasks[8].flags = 6
  const history = structuredClone(ai.producers)
  produceComputerTasks(ai, () => assert.fail('type9 owns the last slot'), () => requestEarlyResponseTask(ai, 512))
  assert.deepEqual(ai.producers, history)
  assert.equal(ai.tasks[8].flags, 5)
  assert.equal(ai.tasks[8].phase, 0)
  ai.tasks[9].flags = 0
  assert.equal(requestEarlyResponseTask(ai, 512), false)
  assert.equal(ai.tasks[9].flags, 0)
})
