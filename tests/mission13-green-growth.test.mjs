import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld } from '../app/world-initialization.ts'
import { stepComputerTasks } from '../app/computer-runtime.ts'
import { withCampaignTribe } from '../app/campaign-runtime.ts'
import { addBuilding } from '../app/construction-runtime.ts'
import { createLivePerson } from '../app/live-people.ts'

const tasks = w => w.campaignAIs[3].tasks.filter(t => t.flags & 1 && t.type === 0)
function produce(w) {
  w.turn = 60 // Controlled producer boundary, not a natural history.
  withCampaignTribe(w, 3, () => stepComputerTasks(w, 3))
}
function established() {
  const w = createWorld(13)
  addBuilding(w, 'green', 'tower', { x: -73, z: 63 }, true)
  w.campaignAIs[3].constructionBase = 0xb8be
  return w
}
test('M13 first Green Tower uses immutable loaded origin', () => {
  const w = createWorld(13)
  const shaman = w.units.find(u => u.team === 'green' && u.kind === 'shaman')
  shaman.x += 30
  shaman.z += 30
  produce(w)
  assert.equal(tasks(w).length, 1)
  assert.equal(tasks(w)[0].requested, 4)
  assert.equal(tasks(w)[0].origin, 0xb8be)
})
for (const origin of [0, 0x52de])
  test(`M13 housing retains stored origin ${origin}`, () => {
    const w = established()
    w.campaignAIs[3].constructionBase = origin
    produce(w)
    assert.equal(tasks(w).length, 1)
    assert.equal(tasks(w)[0].requested, 1)
    assert.equal(tasks(w)[0].origin, origin)
  })
for (const mode of ['completed', 'underConstruction', 'plan', 'otherTribe'])
  test(`M13 counts ${mode} capacity`, () => {
    const w = established()
    w.campaignAIs[3].attributes[10] = 3
    const b = addBuilding(
      w,
      mode === 'otherTribe' ? 'blue' : 'green',
      'hut',
      { x: -83, z: 63 },
      mode !== 'plan',
      mode === 'plan' ? { plan: true } : undefined
    )
    if (mode === 'underConstruction') b.progress = 0.5
    produce(w)
    assert.equal(tasks(w).length, Number(['underConstruction', 'otherTribe'].includes(mode)))
  })
for (const available of [0, 1, 2])
  test(`M13 requires two idle workers: ${available}`, () => {
    const w = established()
    for (const [i, u] of w.units
      .filter(u => u.team === 'green' && u.kind !== 'shaman')
      .entries()) {
      u.native = createLivePerson(w, u)
      u.native.state = 17
      if (i >= available) u.native.computerAssignment = 1
    }
    produce(w)
    assert.equal(tasks(w).length, Number(available >= 2))
  })
for (const gate of ['disabled', 'limit', 'zeroTarget'])
  test(`M13 respects ${gate}`, () => {
    const w = established(),
      ai = w.campaignAIs[3]
    if (gate === 'disabled') ai.states &= ~1
    if (gate === 'limit') ai.attributes[9] = 0
    if (gate === 'zeroTarget') ai.attributes[10] = 0
    produce(w)
    assert.equal(tasks(w).length, 0)
  })
