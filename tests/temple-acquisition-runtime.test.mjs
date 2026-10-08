import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'
import { createGift } from '../app/world-effects.ts'
import { missionData } from '../app/mission-data.ts'
import { startPendingWorshipAcquisitions, visitWorshipAcquisition } from '../app/worship-acquisition-runtime.ts'

const geometry = {
  viewport: { x: 100, y: 0, width: 540, height: 480 },
  origin: { x: 420, y: 180 }, target: { x: 25, y: 230 },
  targetRect: { x: 2, y: 204, width: 46, height: 52 },
  targetHud: { x: 25, y: 230 }, hudScale: 1,
}
const vault = world => world.shrines.find(head => head.kind === 'vault')

test('authored M3 completion caller hands Temple to the screen after six object visits, preserving grant82', () => {
  const world = createWorld(3), head = vault(world)
  // Caller fixture, not an ordinary-browser witness: enter the real completion
  // branch through stepVaultWork, rather than injecting a screen request.
  head.reset = false
  head.forced = true
  tick(world, 1 / 12)
  const gift = world.gifts.find(gift => gift.reward === 'temple')
  assert.ok(gift, 'existing completion caller creates Temple knowledge')
  for (let visit = 1; visit <= 6; visit++) {
    tick(world, 1 / 12)
    assert.deepEqual([gift.phase, gift.remaining], [6 - visit, 82 - visit])
    assert.deepEqual(world.worshipAcquisition.requests, visit === 6 ? [gift.id] : [])
  }
  assert.deepEqual(gift.buildingAcquisition, {
    mission: 3, head: 91, reward: 92, slot: 0, rewardClass: 2, model: 5,
    completedTurn: 1, serial: gift.id,
  })
  assert.equal(gift.ordinaryWorship, undefined)
  const events = []
  startPendingWorshipAcquisitions(world, {
    cue: cue => events.push(['cue', cue]),
    geometry: candidate => { events.push(['target', candidate.buildingAcquisition.model]); return geometry },
    failed: () => assert.fail('measured Temple target'),
  })
  assert.deepEqual(events, [['cue', 0xcc], ['cue', 0xcb], ['target', 5]])
  assert.equal(world.worshipAcquisition.controllers.building.model, 95)
  assert.equal(world.worshipAcquisition.controllers.building.faces.length, 147)
  const panels = []
  for (let ui = 0; ui < 160; ui++) visitWorshipAcquisition(world, model => panels.push(model))
  assert.deepEqual(panels, [5])
  assert.equal(gift.remaining, 76, 'screen retirement cannot accelerate building knowledge')
  for (let visit = 7; visit < 82; visit++) tick(world, 1 / 12)
  assert.equal(world.unlockedTemple, false)
  tick(world, 1 / 12)
  assert.equal(world.unlockedTemple, true)
  assert.equal(world.gifts.includes(gift), false)
})

test('M3 provenance rejects clones, nonlocal recipients and wrong or duplicate authored links', { concurrency: false }, () => {
  const world = createWorld(3), head = vault(world),
    settings = missionData(3).level.objects.find(object => object.index === 91).settings,
    saved = settings.slice(6, 10)
  for (const point of [{ ...head }, { x: head.x, z: head.z }])
    assert.equal(createGift(world, 'temple', point).buildingAcquisition, undefined)
  head.rewardRecipient = 2
  assert.equal(createGift(world, 'temple', head).buildingAcquisition, undefined)
  head.rewardRecipient = 0
  try {
    for (const links of [[0, 0, 0, 0], [94, 0, 0, 0], [93, 0, 93, 0]]) {
      settings.splice(6, 4, ...links)
      assert.equal(createGift(world, 'temple', head).buildingAcquisition, undefined)
    }
  } finally { settings.splice(6, 4, ...saved) }
  assert.equal(createGift(world, 'temple', head).buildingAcquisition.model, 5)
})
