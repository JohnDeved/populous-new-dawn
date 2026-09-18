import test from 'node:test'
import assert from 'node:assert/strict'
import { buildingModel } from '../app/model.ts'
import { buildingOccupantPanelProfile } from '../app/building-panels.ts'
import rules from '../app/original-rules.json' with { type: 'json' }
import hud from '../app/original-hud.json' with { type: 'json' }
import {
  BALLOON_HUT_CAPACITY,
  BALLOON_HUT_WORK_BLOCKS,
  BALLOON_HUT_WORK_THRESHOLD,
  BALLOON_HUT_WORKSHOP_PROFILE,
  BOAT_HOUSE_CAPACITY,
  BOAT_HOUSE_WORK_BLOCKS,
  BOAT_HOUSE_WORK_THRESHOLD,
  boatHousePanel,
  boatHousePanelControls,
  boatHouseWorkBlocks,
  workshopPanel,
  workshopPanelControls,
  workshopWorkBlocks,
} from '../app/workshop-panel.ts'

const state = (overrides = {}) => ({
  occupants: [],
  progress: 0,
  dismantling: false,
  turn: 0,
  ...overrides,
})

test('native models 13 and 15 route only completed vehicle workshops into kind 6', () => {
  const boat = buildingModel({ kind: 'boatHouse', level: 1 }),
    balloon = buildingModel({ kind: 'balloonHut', level: 1 })
  assert.deepEqual([boat, balloon], [13, 15])
  assert.deepEqual(
    [rules.buildingCapacity[boat], rules.buildingCapacity[balloon]],
    [BOAT_HOUSE_CAPACITY, BALLOON_HUT_CAPACITY]
  )
  for (const model of [boat, balloon]) {
    assert.ok(rules.buildingFlags[model] & 0x40)
    assert.equal(rules.buildingFlags[model] & 1, 0)
  }
  assert.deepEqual(buildingOccupantPanelProfile({ kind: 'boatHouse', level: 1, progress: 1 }), {
    kind: 'workshop',
    capacity: 4,
  })
  assert.deepEqual(buildingOccupantPanelProfile({ kind: 'balloonHut', level: 1, progress: 1 }), {
    kind: 'workshop',
    capacity: 6,
  })
  for (const kind of ['boatHouse', 'balloonHut'])
    assert.equal(buildingOccupantPanelProfile({ kind, level: 1, progress: 0.99 }), null)
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

test('Balloon Hut kind-6 geometry derives 208x82 from native capacity and ten work cells', () => {
  const person = hud.rects['75'],
    work = hud.rects['40'],
    button = hud.rects['46'],
    tail = hud.rects['52'],
    occupantWidth = (person.w + 1) * BALLOON_HUT_CAPACITY + 4,
    workWidth = (work.w + 1) * BALLOON_HUT_WORK_BLOCKS + 4,
    rowWidth = Math.max(occupantWidth, workWidth),
    contentWidth = rowWidth + button.w + 4,
    expectedWidth = (contentWidth + 7) & ~7,
    expectedHeight = person.h + 5 + work.h + 5 + tail.h,
    panel = workshopPanel(state(), BALLOON_HUT_WORKSHOP_PROFILE),
    controls = workshopPanelControls(BALLOON_HUT_WORKSHOP_PROFILE)

  assert.deepEqual([occupantWidth, workWidth, rowWidth, contentWidth], [106, 174, 174, 201])
  assert.deepEqual([expectedWidth, expectedHeight], [208, 82])
  assert.deepEqual([panel.width, panel.height], [expectedWidth, expectedHeight])
  assert.deepEqual(controls.people, [
    { x: 38, y: 1 },
    { x: 55, y: 1 },
    { x: 72, y: 1 },
    { x: 89, y: 1 },
    { x: 106, y: 1 },
    { x: 123, y: 1 },
  ])
  assert.deepEqual(controls.control, { x: 177, y: 0 })

  const workSprites = panel.events.filter(draw => draw[0] === 'sprite' && draw[1] === 40)
  assert.deepEqual(
    workSprites.map(draw => [draw[2], draw[3]]),
    [5, 22, 39, 56, 73, 90, 107, 124, 141, 158].map(x => [x, 30])
  )
  assert.ok(
    panel.events.some(
      draw => draw[0] === 'sprite' && draw[1] === 49 && draw[2] === 180 && draw[3] === 3
    )
  )
  assert.ok(
    panel.events.some(
      draw => draw[0] === 'sprite' && draw[1] === 52 && draw[2] === 95 && draw[3] === 48
    )
  )
})

test('Balloon Hut work cells fill only at each complete native 100-work boundary', () => {
  assert.equal(BALLOON_HUT_WORK_THRESHOLD, 1000)
  assert.equal(BALLOON_HUT_WORK_BLOCKS, 10)
  for (const [progress, filled] of [
    [-1, 0],
    [0, 0],
    [99, 0],
    [100, 1],
    [999, 9],
    [1000, 10],
    [1001, 10],
  ]) {
    assert.equal(workshopWorkBlocks(progress, BALLOON_HUT_WORKSHOP_PROFILE), filled)
    const events = workshopPanel(state({ progress }), BALLOON_HUT_WORKSHOP_PROFILE).events
    assert.equal(
      events.filter(draw => draw[0] === 'sprite' && draw[1] === 40 && draw[4] === -1).length,
      filled,
      `filled Balloon work sprites at ${progress}`
    )
  }
})

test('Balloon Hut reuses the original dismantle and cancel control phases', () => {
  const sprite = s =>
    workshopPanel(s, BALLOON_HUT_WORKSHOP_PROFILE).events.find(
      draw =>
        draw[0] === 'sprite' &&
        [46, 47, 49, 50].includes(draw[1]) &&
        draw[2] === 180 &&
        draw[3] === 3
    )?.[1]
  assert.equal(sprite(state()), 49)
  assert.equal(sprite(state({ dismantling: true, turn: 0 })), 46)
  assert.equal(sprite(state({ dismantling: true, turn: 2 })), 47)
})
