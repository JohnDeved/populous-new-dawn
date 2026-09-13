import type { Building, Point, Unit, World } from './world-types.ts'
import { nativePosition, syncLandscapeObjects, syncNativeTerrain } from './world-terrain-runtime.ts'
import { browserPosition, height } from './world-coordinates.ts'
import { combatPerson, nativePersonModel } from './live-combat.ts'
import {
  buildingFootprintCells,
  buildingOutsidePoint,
  buildingPose,
} from './building-shapes.ts'
import {
  chooseContextCommand,
  moveCommandAllowed,
  CommandContext as Context,
} from './command-context.ts'
import { acceptLivePath, planLivePath } from './live-pathfinding.ts'
import { cancelLiveResting } from './live-resting.ts'
import {
  acceptsPersonOrder,
  currentPersonOrder,
  emptyPersonOrder,
  playerOrderInput,
  writePersonOrder,
} from './person-orders.ts'
import {
  appendLiveOrders,
  cancelLiveOrder,
  movementOrder,
  startLiveOrder,
} from './live-movement.ts'
import { canOrder, cancelInteraction, selectionPeople } from './selection-runtime.ts'
import { release } from './world-tasks.ts'
import { releasePersonRoute } from './person-routes.ts'
import { constructionWorkers } from './construction-runtime.ts'
import { assignBuilder, BuilderTask } from './building-workers.ts'
import { worshipHeadPose, worshipOrder } from './live-worship.ts'
import { worshipApproach } from './worship.ts'
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

export function walkable(terrain: number[], p: Point) {
  return Math.abs(p.x) < 47 && Math.abs(p.z) < 47 && height(terrain, p.x, p.z) > 0.45
}

function planRoute(w: World, u: Unit, end: Point) {
  syncNativeTerrain(w)
  syncLandscapeObjects(w)
  return planLivePath(w, u, end)
}

export function route(w: World, u: Unit, end: Point, preserveOrders = false) {
  cancelLiveResting(w, u)
  const person = u.native ?? u.fight?.motion
  if (!preserveOrders && (!person || currentPersonOrder(w.buildingOrders, person)?.model !== 28))
    cancelLiveOrder(w, u)
  return acceptLivePath(w, u, planRoute(w, u, end))
}

export function tell(w: World, message: string) {
  w.message = message
  w.messageUntil = w.time + 9
}

export function buildingDoor(b: Building) {
  const point = buildingOutsidePoint(buildingPose(b))
  return browserPosition(point)
}

export function entrance(w: World, b: Point, radius = 4) {
  if ('level' in b && 'team' in b && 'kind' in b && 'angle' in b) {
    return buildingDoor(b as Building)
  }
  const angle = 'angle' in b ? Number(b.angle) : 0
  // Native model doors face -Z. Reflect both the model and the native map coordinates.
  if ('angle' in b) return { x: b.x - Math.sin(angle) * radius, z: b.z + Math.cos(angle) * radius }
  return (
    Array.from({ length: 16 }, (_, i) => ({
      x: b.x + Math.sin((i * Math.PI) / 8) * radius,
      z: b.z + Math.cos((i * Math.PI) / 8) * radius,
    })).find(p => walkable(w.terrain, p)) ?? b
  )
}

// Input acceptance is separate from later route/allocation success.
export function command(
  w: World,
  p: Point & { id?: number },
  modifiers: { ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean } = {}
) {
  if (w.paused || w.status !== 'playing') return false
  syncNativeTerrain(w)
  syncLandscapeObjects(w)
  const context = liveCommandContext(w, p)
  if (!context?.enabled) return false
  const { model } = context
  w.lastOrderTurn = w.turn
  const queuedBuilding =
    [6, 8, 10].includes(model) &&
    context.building &&
    ['hut', 'camp', 'tower', 'temple'].includes(context.building.kind)
  const queuedTree =
    model === 7 && context.tree && context.tree.model >= 1 && context.tree.model <= 6
  if (
    model === 19 ||
    model === 33 ||
    ((model === 3 || model === 27 || model === 28 || queuedBuilding || queuedTree) &&
      (modifiers.ctrlKey || w.orderCursor))
  ) {
    const slot = w.orderCursor
    const input = playerOrderInput(
      model,
      slot,
      modifiers.ctrlKey,
      modifiers.shiftKey,
      modifiers.altKey
    )
    const units = w.units.filter(
      u =>
        canOrder(u) &&
        w.selected.includes(u.id) &&
        acceptsPersonOrder(combatPerson(u), model)
    )
    if (!units.length) {
      tell(w, 'No selected followers can take this order.')
      return true
    }
    // Only release the old controller when beginning a new sequence or replacing
    // an order whose ownership has not yet migrated to the shared queue.
    for (const u of units) {
      const person = u.native ?? u.entry?.person ?? u.builder?.person,
        active = person ? (currentPersonOrder(w.buildingOrders, person)?.model ?? 0) : 0
      if (
        ![17, 31, 32].includes(active) &&
        (!slot || !person || ![3, 6, 7, 8, 10, 19, 27, 28].includes(active))
      ) {
        release(w, u, model === 33)
        if (model === 33 && person) u.native = person
      }
    }
    const order = emptyPersonOrder(),
      to = nativePosition(w, p)
    writePersonOrder(
      order,
      model,
      model === 19
        ? 0
        : model === 7
          ? 1
          : (context.person?.id ?? context.building?.id ?? context.shrine?.id ?? 0),
      ((to.x >>> 8) & 255) | (to.y & 0xff00),
      input.flags
    )
    const result = appendLiveOrders(w, units, order, slot === 0)
    if (model === 28 && result.accepted)
      for (const u of units) {
        const person = u.native ?? u.entry?.person ?? u.builder?.person
        if (!person || currentPersonOrder(w.buildingOrders, person)?.model !== 28) continue
        u.target = context.person!.id
        route(w, u, context.person!, true)
      }
    for (const p of selectionPeople(w))
      p.selectionFlags = (p.selectionFlags & ~1) | (p.selectionFlags >>> 7)
    w.orderCursor = input.nextCursor
    if (input.deselect) cancelInteraction(w)
    tell(
      w,
      result.accepted
        ? result.count
          ? 'Your followers are on the move.'
          : 'No followers can take this order.'
        : 'No command slots available.'
    )
    return true
  }
  // Non-ground commands retain their existing controller until mixed queues are live.
  w.orderCursor = 0
  const shrine = model === 27 || model === 33 ? context.shrine : undefined
  const friendly = [6, 8, 10].includes(model) ? context.building : undefined
  const enemy = model === 28 ? context.person : undefined
  const tree = model === 7 ? context.tree : undefined
  const dismantling = model === 10
  const headOrder = shrine && shrine.kind !== 'vault' ? worshipOrder(w, shrine) : 0
  const moveOrder =
    !shrine && !friendly && !enemy ? movementOrder(w, nativePosition(w, tree ?? p)) : 0
  if (
    (shrine && shrine.kind !== 'vault' && !headOrder) ||
    (!shrine && !friendly && !enemy && !moveOrder)
  ) {
    tell(w, 'No command slots available.')
    return true
  }
  let count = 0,
    constructionFull = false
  if (friendly && friendly.progress < 1 && !dismantling) constructionWorkers(w, friendly)
  for (const u of w.units.filter(u => canOrder(u) && w.selected.includes(u.id))) {
    if (!acceptsPersonOrder(combatPerson(u), model)) continue
    if (
      friendly &&
      (friendly.progress < 1 || !['hut', 'camp', 'tower', 'temple'].includes(friendly.kind)) &&
      u.kind !== 'brave'
    )
      continue
    if (
      friendly &&
      friendly.progress < 1 &&
      !dismantling &&
      !friendly.builders!.includes(u.id) &&
      !friendly.builders!.includes(0)
    ) {
      constructionFull = true
      continue
    }
    const goal = shrine
      ? headOrder
        ? browserPosition(worshipApproach(worshipHeadPose(w, shrine)))
        : entrance(w, shrine, 2)
      : friendly
        ? entrance(w, friendly)
        : enemy && 'progress' in enemy
          ? entrance(w, enemy)
          : (enemy ?? tree ?? p)
    const path = planLivePath(w, u, goal)
    if (!path) continue
    if (friendly && friendly.progress < 1 && !dismantling) assignBuilder(friendly.builders!, u.id)
    release(w, u)
    if (moveOrder || headOrder) {
      releasePersonRoute(w.motionRoutes, path)
      startLiveOrder(w, u, moveOrder || headOrder)
    } else acceptLivePath(w, u, path)
    u.work = shrine?.id ?? friendly?.id ?? null
    if (friendly && friendly.progress < 1 && !dismantling)
      u.builder = { task: BuilderTask.Approach, busy: 0, phase: 0, restart: true }
    u.target = enemy?.id ?? null
    u.tree = tree?.id ?? null
    if (shrine?.kind === 'vault')
      u.vault = { head: shrine.id, phase: 1, entering: true, remaining: 0 }
    count++
  }
  let message = 'No land route. Bring your shaman to the shore and make a Land Bridge.'
  if (count) {
    message = 'Your followers are on the move.'
    if (dismantling) message = 'Braves assigned to dismantle the building and recover timber.'
    else if (shrine)
      message = `Worshipping ${shrine.name}. ${shrine.kind === 'vault' ? 'Only your shaman can learn its secrets.' : 'One follower is enough.'}`
    else if (friendly) {
      if (friendly.progress < 1) message = 'Braves assigned to construction.'
      else if (friendly.kind === 'camp') message = 'Braves sent to train as warriors.'
      else if (friendly.kind === 'temple') message = 'Braves sent to train as preachers.'
      else if (friendly.kind === 'tower') message = 'Followers sent to occupy the guard tower.'
      else message = 'Braves sent to live in the hut.'
    } else if (enemy) message = 'Your followers march to battle.'
  } else if (constructionFull) message = 'This building already has its full construction crew.'
  else if (shrine?.kind === 'vault')
    message = 'Select your shaman to worship the Vault of Knowledge.'
  tell(w, message)
  return true
}
