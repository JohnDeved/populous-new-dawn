import { nativePosition, type World, type Point } from './model.ts'
import { nativePersonModel } from './live-combat.ts'
import { buildingFootprintCells } from './building-shapes.ts'
import {
  chooseContextCommand,
  moveCommandAllowed,
  CommandContext as Context,
} from './command-context.ts'
import rules from './original-rules.json' with { type: 'json' }

// 0x437010's ordinary people/building/head context. Registration is synchronized
// by the caller once per group order, before any member plans a route.
export function liveCommandContext(w: World, point: Point & { id?: number }) {
  const selected = w.units.filter(u => w.selected.includes(u.id))
  const team = selected[0]?.team ?? 'blue'
  const cell = (p: Point) => {
    const n = nativePosition(w, p)
    return ((n.y & 65535) >> 9) * 128 + ((n.x & 65535) >> 9)
  }
  const index = cell(point)
  const pointedPerson = w.units.find(u => u.id === point.id && u.hp > 0)
  const pointedBuilding = w.buildings.find(b => b.id === point.id && b.hp > 0)
  const pointedHead = w.shrines.find(h => h.id === point.id && h.active)
  const pointedTree = w.trees.find(t => t.id === point.id && t.logs > 0)
  if (point.id !== undefined && !pointedPerson && !pointedBuilding && !pointedHead && !pointedTree)
    return null
  const building =
    pointedBuilding ??
    (w.land.flags[index] & 0x600
      ? w.buildings.find(b => b.id === (w.land.buildingIds[index] & 1023) && b.hp > 0)
      : undefined)
  // ponytail: heads/scenery do not yet share the native mixed-class cell chains.
  // Query their original cell/shape here; replace this adapter when registration owns them.
  const shrine =
    pointedHead ??
    (!building
      ? w.shrines.find(h => {
          if (!h.active) return false
          if (h.kind !== 'vault') return cell(h) === index
          const n = nativePosition(w, h)
          return buildingFootprintCells({
            object: rules.buildingObjects[18],
            angle: Math.round((h.angle * 1024) / Math.PI) & 2047,
            anchorX: n.x & 0xfe00,
            anchorY: n.y & 0xfe00,
          }).includes(index)
        })
      : undefined)
  const enemy =
    pointedPerson && pointedPerson.team !== team && pointedPerson.team !== 'wild'
      ? pointedPerson
      : undefined
  const nearby =
    !building && !shrine
      ? w.units.find(
          u =>
            u.hp > 0 &&
            u.team !== team &&
            u.team !== 'wild' &&
            u.inside === null &&
            !u.lift &&
            cell(u) === index
        )
      : undefined
  let flags: number = Context.Ground
  if (building) {
    flags |=
      building.progress === 1
        ? Context.Building | Context.Completed
        : Context.Plan | Context.Unfinished
    if (building.team === team) flags |= Context.Friendly
    if ((building.admission?.activity ?? 0) & 0x8000) flags |= Context.Dismantling
  }
  if (shrine) flags |= shrine.kind === 'vault' ? Context.Building | Context.Vault : Context.Head
  if (pointedTree) flags |= Context.Tree
  if (enemy) flags |= Context.Enemy
  if (nearby) flags |= Context.NearbyEnemy
  if (pointedPerson?.kind === 'shaman' && !pointedPerson.ghost && pointedPerson.team === team)
    flags |= Context.OwnShaman
  const people = selected.reduce((mask, u) => mask | (1 << nativePersonModel(u)), 0)
  const model = chooseContextCommand(flags, people)
  // Tree/vehicle/forced/manual choices, ghost-only selection and contested-building
  // classification require their native lifecycle owners; no invented actions here.
  // Ordinary live people have no transport owner yet. Never infer it from being
  // inside a building: native +0x9f and flags4 & 0x800 are transport and ghost data.
  const tribeFlags = w.castingTribes[team === 'red' ? 1 : 0].flags & ~64
  const enabled =
    model !== 3 ||
    moveCommandAllowed(
      { flags: w.land.flags[index], category: w.land.categories[index] },
      w.land.walkMasks[0],
      nativePosition(w, point),
      tribeFlags
    )
  return { model, enabled, building, shrine, tree: pointedTree, person: enemy ?? nearby }
}
