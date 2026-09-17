import assert from 'node:assert/strict'
import test from 'node:test'
import { command, createWorld, tick } from '../app/model.ts'
import { createGameStore } from '../app/game-store.ts'
import level from '../app/level-tutorial.ts'
import script from '../app/original-script-tutorial.json' with { type: 'json' }
import { messageText } from '../app/messages.ts'

const until = (world, predicate, turns = 256) => {
  for (let i = 0; i < turns && !predicate(); i++) tick(world, 1 / 12)
  assert.ok(predicate(), `Tutorial condition timed out at turn ${world.turn}`)
}

test('Tutorial advances through Shaman selection into the authored Obelisk flyby', () => {
  const world = createWorld(79)
  const initialSelection = [...world.selected]
  assert.deepEqual(
    initialSelection.map(id => world.units.find(unit => unit.id === id)?.kind),
    ['shaman']
  )
  assert.equal(level.sourceSha256, '22bd7ec9aa287245d8a41f42f40f468f06f09663304b87c8ccf75e15101068d8')
  assert.equal(level.headerSha256, '58a80720a75c6c7018e4e8e95c1e1e3d87de1038e524b8a712a1bc905a40f641')
  assert.equal(script.sha256, 'cdb5d7abd327933ac22e7824aebae70a60faa504049d05d8ff32dedc730d3603')
  assert.deepEqual(
    {
      level: world.outcome.level,
      stage: world.ai.variables[9],
      drawMode: world.drawMode,
      fallbackMessage: world.message,
      fallbackMessageUntil: world.messageUntil,
    },
    { level: 79, stage: 0, drawMode: 2, fallbackMessage: '', fallbackMessageUntil: 0 }
  )
  until(world, () => world.ai.variables[9] === 2)
  assert.deepEqual(
    world.messages.slots.filter(Boolean).map(message => messageText(message.stringId)),
    [
      'Welcome to Populous: The Beginning. You can leave this Tutorial and return to the Main Menu by pressing the Escape key and choosing Quit to Main Menu.',
      'This is the World View. Use the Cursor Keys to rotate and right-click anywhere or press Return to zoom in. You can press Return at any time to come back to the World View.',
    ]
  )
  for (let i = 0; i < 240; i++) tick(world, 1 / 30)
  assert.equal(world.ai.variables[9], 2, 'the authored lesson waits in World View')
  world.drawMode = 0
  until(world, () => world.ai.variables[9] === 3)
  assert.equal(
    messageText(world.messages.slots[world.lastMessage].stringId),
    'Move the mouse pointer to the edge of the screen to scroll and use the Cursor Keys to rotate.'
  )
  until(world, () => world.ai.variables[9] === 4)
  assert.deepEqual(
    {
      stage: world.ai.variables[9],
      inputLocked: !!(world.inputMask & 64),
      flybyActive: !!(world.flyby.flags & 1),
      events: world.flyby.events.map(({ kind, value, start, duration }) => ({
        kind,
        value,
        start,
        duration,
      })),
    },
    {
      stage: 4,
      inputLocked: true,
      flybyActive: true,
      events: [
        { kind: 1, value: 5334, start: 1, duration: 30 },
        { kind: 2, value: 256, start: 1, duration: 30 },
      ],
    }
  )
  until(world, () => world.ai.variables[9] === 5)
  assert.equal(
    messageText(world.messages.slots[world.lastMessage].stringId),
    'Left-click on the Shaman directly to select her, or left-click on the Shaman Box on the Control Panel. Right-click when you want to deselect her.'
  )
  assert.deepEqual(world.selected, initialSelection, 'the instruction does not replace live selection')
  assert.equal(
    world.shrines.some(shrine => shrine.name === 'Obelisk'),
    false,
    'the stage-5 Obelisk branch waits for the next script pass'
  )
  until(world, () => world.ai.variables[9] === 6)
  const trigger = world.shrines.find(shrine => shrine.name === 'Tutorial Obelisk trigger'),
    obelisk = world.shrines.find(shrine => shrine.name === 'Obelisk')
  assert.deepEqual(
    {
      stage: world.ai.variables[9],
      inputLocked: !!(world.inputMask & 64),
      flybyActive: !!(world.flyby.flags & 1),
      events: world.flyby.events,
      trigger: trigger && {
        position: [trigger.x, trigger.z],
        model: trigger.model,
        active: trigger.active,
      },
      obelisk: obelisk && {
        position: [obelisk.x, obelisk.z],
        model: obelisk.model,
        active: obelisk.active,
        enabled: obelisk.enabled,
        mode: obelisk.mode,
      },
    },
    {
      stage: 6,
      inputLocked: true,
      flybyActive: true,
      events: [
        { kind: 1, flags: 0, value: 10470, start: 1, duration: 30 },
        { kind: 2, flags: 0, value: 1406, start: 1, duration: 30 },
        { kind: 3, flags: 0, value: 102, start: 1, duration: 15 },
        { kind: 5, flags: 1, value: 10470, start: 2, duration: 29 },
        { kind: 3, flags: 0, value: 0, start: 17, duration: 14 },
      ],
      trigger: { position: [-35, -17], model: 0, active: false },
      obelisk: { position: [-33, -49], model: 45, active: true, enabled: true, mode: 3 },
    }
  )
  until(world, () => world.ai.variables[9] === 9)
  assert.equal(
    messageText(world.messages.slots[world.lastMessage].stringId),
    'Worshipping Obelisks benefit you in a variety of ways. To command the Shaman to worship an Obelisk, select the Shaman and left-click on the Obelisk.'
  )
  world.flyby.flags &= ~1
  world.inputMask &= ~64
  const brave = world.units.find(unit => unit.team === 'blue' && unit.kind === 'brave'),
    shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
  world.selected = [brave.id]
  assert.equal(command(world, obelisk), true)
  until(world, () => brave.work === null, 2_000)
  assert.equal(obelisk.work, 0, 'a rejected Brave cannot contribute mode-3 worship work')
  world.selected = [shaman.id]
  assert.equal(command(world, obelisk), true)
  until(world, () => obelisk.rewardDelay === 50, 2_000)
  assert.equal(obelisk.active, true)
  const countdownTurn = world.turn
  assert.equal(command(world, { x: shaman.x + 4, z: shaman.z }), true)
  until(world, () => !obelisk.active, 64)
  assert.equal(world.turn - countdownTurn, 50)
})

test('Tutorial restart recreates fresh script and view state', () => {
  const store = createGameStore()
  store.startMission(79)
  const first = store.getWorld()
  first.drawMode = 0
  until(first, () => first.ai.variables[9] === 4)
  assert.ok(first.flyby.flags & 1)
  store.restart()
  assert.notEqual(store.getWorld(), first)
  assert.deepEqual(
    {
      level: store.getWorld().outcome.level,
      stage: store.getWorld().ai.variables[9],
      drawMode: store.getWorld().drawMode,
      flybyActive: !!(store.getWorld().flyby.flags & 1),
      inputLocked: !!(store.getWorld().inputMask & 64),
    },
    { level: 79, stage: 0, drawMode: 2, flybyActive: false, inputLocked: false }
  )
})
