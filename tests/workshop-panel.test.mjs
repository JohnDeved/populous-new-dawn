import test from 'node:test'
import assert from 'node:assert/strict'
import { buildingModel } from '../app/model.ts'
import { buildingOccupantPanelProfile } from '../app/building-panels.ts'
import rules from '../app/original-rules.json' with { type: 'json' }
import {
  BOAT_HOUSE_CAPACITY,
  BOAT_HOUSE_WORK_BLOCKS,
  BOAT_HOUSE_WORK_THRESHOLD,
  boatHousePanel,
  boatHousePanelControls,
  boatHouseWorkBlocks,
} from '../app/workshop-panel.ts'

const state = (overrides = {}) => ({
  occupants: [],
  progress: 0,
  dismantling: false,
  turn: 0,
  ...overrides,
})

test('native model 13 routes only completed Boat Houses into the kind-6 workshop profile', () => {
  const model = buildingModel({ kind: 'boatHouse', level: 1 })
  assert.equal(model, 13)
  assert.equal(rules.buildingCapacity[model], BOAT_HOUSE_CAPACITY)
  assert.ok(rules.buildingFlags[model] & 0x40)
  assert.equal(rules.buildingFlags[model] & 1, 0)
  assert.deepEqual(buildingOccupantPanelProfile({ kind: 'boatHouse', level: 1, progress: 1 }), {
    kind: 'workshop',
    capacity: 4,
  })
  assert.equal(buildingOccupantPanelProfile({ kind: 'boatHouse', level: 1, progress: 0.99 }), null)
  assert.equal(
    buildingOccupantPanelProfile({ kind: 'balloonHut', level: 1, progress: 1 }),
    null,
    'Balloon Hut remains a follow-up rather than entering the Boat House slice'
  )
})

test('Boat House kind-6 panel uses native 136x82 rows and hit targets', () => {
  const panel = boatHousePanel(state()),
    controls = boatHousePanelControls()
  assert.deepEqual([panel.width, panel.height], [136, 82])
  assert.deepEqual(controls.people, [
    { x: 19, y: 1 },
    { x: 36, y: 1 },
    { x: 53, y: 1 },
    { x: 70, y: 1 },
  ])
  assert.deepEqual(controls.control, { x: 107, y: 0 })

  const work = panel.events.filter(draw => draw[0] === 'sprite' && draw[1] === 40)
  assert.deepEqual(
    work.map(draw => [draw[2], draw[3]]),
    [
      [3, 30],
      [20, 30],
      [37, 30],
      [54, 30],
      [71, 30],
      [88, 30],
    ]
  )
  assert.ok(work.every(draw => draw[4] === 172 && draw[5] === true))
  assert.ok(
    panel.events.some(
      draw => draw[0] === 'sprite' && draw[1] === 49 && draw[2] === 110 && draw[3] === 3
    )
  )
  assert.ok(
    panel.events.some(
      draw => draw[0] === 'sprite' && draw[1] === 52 && draw[2] === 59 && draw[3] === 48
    )
  )
})

test('Boat House work cells fill only at each complete native 100-work boundary', () => {
  assert.equal(BOAT_HOUSE_WORK_THRESHOLD, 600)
  assert.equal(BOAT_HOUSE_WORK_BLOCKS, 6)
  for (const [progress, filled] of [
    [-1, 0],
    [0, 0],
    [99, 0],
    [100, 1],
    [599, 5],
    [600, 6],
    [601, 6],
  ]) {
    assert.equal(boatHouseWorkBlocks(progress), filled, `progress ${progress}`)
    const events = boatHousePanel(state({ progress })).events
    assert.equal(
      events.filter(draw => draw[0] === 'sprite' && draw[1] === 40 && draw[4] === -1).length,
      filled,
      `filled work sprites at ${progress}`
    )
  }
})

test('Boat House reuses original dismantle and cancel control phases', () => {
  const sprite = s =>
    boatHousePanel(s).events.find(
      draw =>
        draw[0] === 'sprite' &&
        [46, 47, 49, 50].includes(draw[1]) &&
        draw[2] === 110 &&
        draw[3] === 3
    )?.[1]
  assert.equal(sprite(state()), 49)
  assert.equal(sprite(state({ dismantling: true, turn: 0 })), 46)
  assert.equal(sprite(state({ dismantling: true, turn: 2 })), 47)
})
