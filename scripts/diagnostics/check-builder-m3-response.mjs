// Paused issue456 diagnostic, not an acceptance gate. Preserves the original
// natural M3 response predicate and4000-turn window. Selector probes only mutate
// copied projection people; the ordinary world is advanced by shipped commands.
import { computerSelectionWorld } from '../../app/computer-runtime.ts'
import { selectComputerPeople } from '../../app/computer-selection.ts'
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { serialize } from 'node:v8'
import { gzipSync } from 'node:zlib'
import { createWorld, command, setSelection } from '../../app/model.ts'
import { currentPersonOrder } from '../../app/person-orders.ts'
import { unitAnimationSource } from '../../app/unit-animation-source.ts'
import { acquireNaturalPreacher } from '../mission3-natural-preacher-scenario.mjs'
const output = process.argv[2]
if (!output)
  throw Error('Usage: node scripts/diagnostics/check-builder-m3-response.mjs NEW_OUTPUT_DIRECTORY')
if (existsSync(output)) throw Error('Refusing to overwrite existing diagnostic directory')
mkdirSync(output, { recursive: true })
const journey = acquireNaturalPreacher(createWorld(3)),
  { world, preacher, victim, milestones } = journey
const state = u => {
  const p = unitAnimationSource(u)
  return {
    id: u.id,
    team: u.team,
    kind: u.kind,
    hp: u.hp,
    x: u.x,
    z: u.z,
    inside: u.inside,
    path: u.path,
    present: world.units.includes(u),
    registry: world.objectCells.objects.get(u.id) === p,
    owner: p,
    order: p ? currentPersonOrder(world.buildingOrders, p) : null,
  }
}
const projection = () => {
  const q = computerSelectionWorld(world, 2, true).world
  return {
    tribe: q.tribes[2],
    people: q.people.filter(p => p.model === 4),
    eligible: selectComputerPeople(
      { ...q, people: q.people.map(p => ({ ...p })) },
      4,
      4,
      -1,
      1,
      world.ai.defencePosition,
      0x47,
      100
    ),
  }
}
const snapshot = label => ({
  selectionOwner: world.ai.selectionOwner,
  selection: projection(),
  markerTasks: world.ai.tasks.flatMap((t, i) => (t.type === 11 ? [{ index: i, ...t }] : [])),
  label,
  turn: world.turn,
  rng: world.randomState,
  preacher: state(preacher),
  victim: state(victim),
  defenders: world.units.filter(u => u.team === 'yellow' && u.kind === 'preacher').map(state),
  responses: world.ai.tasks.flatMap((t, i) => (t.type === 8 ? [{ index: i, ...t }] : [])),
  milestones,
})
console.log(JSON.stringify(snapshot('trained')))
writeFileSync(join(output, 'trained.v8.gz'), gzipSync(serialize(world)))
setSelection(world, [preacher.id])
if (!command(world, { x: -33, z: -110 })) throw Error('Same staging command rejected')
const done = () =>
  world.ai.tasks.some(
    (task, index) =>
      task.flags & 1 &&
      task.type === 8 &&
      task.entity === preacher.id &&
      task.phase === 6 &&
      task.selected > 0 &&
      world.units.some(unit => {
        if (unit.team !== 'yellow' || unit.kind !== 'preacher' || unit.hp <= 0) return false
        const p = unitAnimationSource(unit)
        if (!p || p.computerAssignment !== index + 1) return false
        const o = currentPersonOrder(world.buildingOrders, p)
        return o?.model === 3 && !(o.flags & 1) && o.a === 59008 && o.b === 26240
      })
  )
let previous = ''
for (let n = 0; n < 4000 && !done() && world.status === 'playing'; n++) {
  journey.step()
  const key = JSON.stringify({
    projection: projection(),
    markerTasks: world.ai.tasks.flatMap((t, i) =>
      t.type === 11 && t.flags & 1
        ? [{ i, phase: t.phase, entity: t.entity, target: t.target }]
        : []
    ),
    present: world.units.includes(preacher),
    team: preacher.team,
    hp: preacher.hp,
    ps: unitAnimationSource(preacher)?.state,
    responses: world.ai.tasks.flatMap((t, i) =>
      t.type === 8 && t.flags & 1
        ? [{ i, phase: t.phase, entity: t.entity, selected: t.selected, flags: t.flags }]
        : []
    ),
  })
  if (key !== previous || !(n % 250)) {
    console.log(JSON.stringify(snapshot('step')))
    previous = key
  }
}
console.log(JSON.stringify({ ...snapshot('terminal'), predicate: done(), status: world.status }))
writeFileSync(join(output, 'terminal.v8.gz'), gzipSync(serialize(world)))
