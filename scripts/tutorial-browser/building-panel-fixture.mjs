// Test-host fixture only. The production Home entry never imports this module.
// Supply the rare allocation boundary, then retain the actual gameplay consumers.
import { addBuilding, addUnit, command, tick } from '../../app/model.ts'
import { damageTornadoBuilding } from '../../app/building-runtime.ts'

const requireState = (condition, message) => {
  if (!condition) throw Error(message)
}

function turns(world, ready, limit, before = () => {}) {
  requireState(world.paused, 'Fixture requires public pause between bounded turn batches')
  world.paused = false
  let count = 0
  try {
    before()
    while (!ready() && count < limit) {
      tick(world, 1 / 12)
      count++
    }
    requireState(ready(), `Real consumer did not reach its boundary within ${limit} turns`)
    return count
  } finally {
    world.paused = true
  }
}

const timber = world =>
  world.units.reduce((total, unit) => total + unit.cargo, 0) +
  world.trees.filter(tree => tree.model === 11).reduce((total, tree) => total + tree.logs, 0)

export function createBoundary(scene) {
  const world = scene.world
  requireState(
    scene.isCurrent() && !world.inputMask && world.paused,
    'Need current paused playable Scene'
  )
  requireState(
    world.levelStart.every(site => site.phase === 4 && !site.wave && !site.carriers.length),
    'Public startup must finish before supplying the allocation boundary'
  )
  world.nextId = Math.max(world.nextId, 1024)
  const old = addBuilding(world, 'blue', 'tower', { x: -2, z: 32 }, true, { angle: Math.PI })
  scene.focus(old)
  scene.startGroundView(3)
  for (let visit = 0; visit < 18; visit++) scene.updateCameraMotion(1 / 24)
  scene.onChange()
  return { scene, world, old }
}

export function replaceBetweenPaints(witness) {
  const { scene, world, old } = witness
  const panel = scene.buildingPanels.get(old.id)
  requireState(
    panel && !panel.hidden && panel.isConnected,
    'Original panel must actually be visible'
  )
  const frame = scene.renderer.info.render.frame,
    previous = scene.previous,
    personBefore = panel.children[1].dataset.person
  // No await, timer, renderer or presentation callback occurs in this batch.
  // Mutation and admission finish in one JS task before the next browser paint.
  let hits = 0
  while (old.hp > 0 && hits++ < 32) damageTornadoBuilding(world, old, 1)
  requireState(old.hp === 0, 'Actual Tornado damage must retire the original')
  turns(world, () => !world.buildings.includes(old), 2)
  const building = addBuilding(world, 'blue', 'tower', { x: -2, z: 32 }, true, { angle: Math.PI }),
    unit = addUnit(world, 'blue', 'brave', { x: 7, z: 33 })
  requireState(
    building.id === old.id && building !== old,
    'Actual allocator must recycle the released handle'
  )
  world.selected = [unit.id]
  const entryTurns = turns(
    world,
    () => unit.inside === building.id,
    300,
    () => {
      requireState(command(world, building), 'Actual entry command must be accepted')
    }
  )
  world.selected = []
  requireState(
    scene.buildingPanels.get(building.id) === panel,
    'Old DOM must survive the between-paint replacement'
  )
  requireState(
    scene.renderer.info.render.frame === frame && scene.previous === previous,
    'No rendered frame may intervene during replacement'
  )
  requireState(panel.children[1].dataset.person === personBefore, 'No panel repaint may intervene')
  Object.assign(witness, {
    panel,
    building,
    unit,
    timberBefore: timber(world),
    logsBefore: building.logs,
  })
  return {
    id: building.id,
    person: unit.id,
    entryTurns,
    frameBefore: frame,
    frameAfter: scene.renderer.info.render.frame,
    personBefore,
    personAfter: panel.children[1].dataset.person,
    oldHp: old.hp,
    samePanel: true,
  }
}

export function advanceDismantle(witness, complete) {
  const { world, building, unit } = witness
  requireState(
    building.admission.activity & 0x8000,
    'Visible button must start the real dismantle order'
  )
  requireState(unit.inside === null && unit.hp > 0, 'Dismantle must release the living occupant')
  const count = turns(world, () => (complete ? building.hp === 0 : building.progress < 1), 500)
  if (complete) turns(world, () => !world.buildings.includes(building) && !unit.entry, 4)
  return {
    turns: count,
    hp: building.hp,
    progress: building.progress,
    removed: !world.buildings.includes(building),
    dismantled: !!building.dismantled,
    personAlive: unit.hp > 0,
    inside: unit.inside,
    work: unit.work,
    recoveredTimber: timber(world) - witness.timberBefore,
    expectedTimber: witness.logsBefore,
  }
}
