// Query-gated test host only; never imported by production Home.
import { browserPosition } from '../../app/model.ts'
import { worshipHeadPose, liveWorshippers } from '../../app/live-worship.ts'
import { worshipPositions } from '../../app/worship.ts'
import { moveObjectInCells } from '../../app/object-cells.ts'

export function prepare(scene) {
  const world = scene.world, head = world.shrines.find(h => h.kind === 'bridge')
  if (!scene.isCurrent() || !world.paused || world.inputMask || !head) throw Error('Expected current paused playable bridge shrine')
  const units = world.units.filter(u => u.team === 'blue' && u.hp > 0 && u.kind === 'brave' && u.native).slice(0, 2)
  if (units.length !== 2) throw Error('Need two existing native friendly people')
  const positions = worshipPositions(worshipHeadPose(world, head)).slice(0, 2)
  units.forEach((unit, i) => {
    const person = unit.native
    person.speed = 0
    person.selectionFlags &= ~128
    moveObjectInCells(world.objectCells, person, { ...positions[i], h: person.h })
    Object.assign(unit, browserPosition(person))
  })
  head.followers = 2
  if (liveWorshippers(world, head, 2).map(p => p.id).join() !== units.map(u => u.id).join()) throw Error('Supplied slots do not resolve actual live people')
  world.selected = []
  scene.focus(head)
  scene.startGroundView(3)
  for (let i = 0; i < 18; i++) scene.updateCameraMotion(1 / 24)
  scene.objectPanels.open(head.id, true)
  scene.onChange()
  return { scene, world, head, units }
}
