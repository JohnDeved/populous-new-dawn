import test from 'node:test'
import assert from 'node:assert/strict'
import { buildingModel } from '../app/model.ts'
import rules from '../app/original-rules.json' with { type: 'json' }
import { occupantPanel, occupantPanelControls } from '../app/training-panel.ts'

const building = (kind, level = 1) => ({ kind, level })

test('native descriptor data routes completed huts through kind 7 with resident capacities', () => {
  for (const [level, capacity] of [[1, 3], [2, 4], [3, 5]]) {
    const model = buildingModel(building('hut', level))
    assert.equal(model, level)
    assert.equal(rules.buildingCapacity[model], capacity)
    assert.equal(rules.buildingFlags[model] & (1 | 0x40), 0)
  }
  const tower = buildingModel(building('tower'))
  assert.equal(rules.buildingCapacity[tower], 1)
  assert.equal(rules.buildingFlags[tower] & (1 | 0x40), 0)
  for (const kind of ['camp', 'temple', 'spyHut', 'firewarriorHut']) {
    const model = buildingModel(building(kind))
    assert.ok(rules.buildingFlags[model] & 1, `${kind} uses the native training-panel branch`)
  }
  for (const kind of ['boatHouse', 'balloonHut']) {
    const model = buildingModel(building(kind))
    assert.ok(rules.buildingFlags[model] & 0x40, `${kind} uses the native workshop branch`)
  }
  assert.equal(buildingModel(building('prison')), 19)
})

test('kind-7 hut rows place occupant and dismantle hit targets from native capacity', () => {
  const expected = new Map([
    [1, { width: 48, people: [1], control: 21 }],
    [3, { width: 88, people: [4, 21, 38], control: 58 }],
    [4, { width: 104, people: [3, 20, 37, 54], control: 74 }],
    [5, { width: 120, people: [3, 20, 37, 54, 71], control: 91 }],
  ])
  for (const [capacity, want] of expected) {
    const state = {
      capacity,
      occupants: [],
      active: false,
      cost: 0,
      progress: 0,
      dismantling: false,
      warning: false,
      turn: 0,
    }
    const panel = occupantPanel(state)
    const controls = occupantPanelControls(capacity, false)
    assert.equal(panel.width, want.width, `capacity ${capacity}`)
    assert.deepEqual(
      controls.occupants.map(person => person.x),
      want.people,
      `capacity ${capacity} people`
    )
    assert.deepEqual(
      controls.occupants.map(person => person.y),
      Array(capacity).fill(1),
      `capacity ${capacity} row`
    )
    assert.deepEqual(controls.control, { x: want.control, y: 0 }, `capacity ${capacity} control`)
  }
})

test('training charge row keeps existing controls aligned after shared geometry extraction', () => {
  const controls = occupantPanelControls(5, true)
  assert.deepEqual(controls.occupants[0], { x: 3, y: 7 })
  assert.deepEqual(controls.control, { x: 91, y: 6 })
})
