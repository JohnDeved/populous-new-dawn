import level from '../../app/level-one.ts'
import { buildingPose } from '../../app/building-shapes.ts'
import { residentPerson } from '../../app/building-resident.ts'
import { currentPersonOrder } from '../../app/person-orders.ts'

// Authored indexes are evidence identities, never runtime object IDs. Allocation
// and the displayed building centre differ from the DAT index and anchor.
export function mission1Huts(world) {
  if (world.outcome.level !== 1) throw Error('Mission 1 required')
  return level.objects
    .filter(object => object.type === 2 && object.owner === 0 && object.model === 1)
    .map(object => {
      const anchorX = Math.round((object.x + 8) * 256) & 0xfe00,
        anchorY = Math.round((-object.z - 8) * 256) & 0xfe00,
        matches = world.buildings.filter(building => {
          const pose = buildingPose(building)
          return (
            building.kind === 'hut' &&
            building.level === 1 &&
            building.team === 'blue' &&
            pose.anchorX === anchorX &&
            pose.anchorY === anchorY &&
            pose.angle === (object.angle & 2047)
          )
        })
      if (matches.length !== 1) throw Error(`Authored Hut ${object.index} is missing or ambiguous`)
      return { sourceIndex: object.index, id: matches[0].id, anchorX, anchorY }
    })
}

const units = value => Math.round(value * 100)

// A small synchronous, read-only projection for turn and public checkpoint
// boundaries. No helper here creates admission/person/damage owners. Whole Worlds,
// maps, meshes, paths, terrain arrays and mutable object references never escape.
export function hutDismantleSnapshot(world, { targetId, workerId, scene = null }) {
  const target = world.buildings.find(building => building.id === targetId),
    worker = world.units.find(unit => unit.id === workerId),
    person = worker?.entry?.person ?? worker?.native ?? worker?.resident?.person,
    order = person && currentPersonOrder(world.buildingOrders, person),
    orderId = person ? person.immediateCommand || person.commands[person.commandCursor] : 0,
    admission = target?.admission,
    panel = scene?.buildingPanels.get(targetId)
  return {
    targetId,
    workerId,
    turn: world.turn,
    level: world.outcome.level,
    paused: world.paused,
    speed: world.speed,
    status: world.status,
    inputMask: world.inputMask,
    selected: [...world.selected],
    displayedWood: world.wood,
    target: target
      ? {
          id: target.id,
          kind: target.kind,
          team: target.team,
          level: target.level,
          hp: target.hp,
          progress: target.progress,
          remaining: target.damageState?.plan.remaining ?? units(target.logs),
          logs: units(target.logs),
          damage: target.damageState?.damage ?? 0,
          repairDelay: target.damageState?.plan.repairDelay ?? 0,
          burning: !!target.burn,
          preparing: !!target.preparation,
          upgrading: target.upgrading,
          activity: admission?.activity ?? 0,
          inside: admission?.inside ?? 0,
          occupants: [...(admission?.occupants ?? [])],
          queueHead: admission?.queueHead ?? 0,
          queueFrom: admission?.queueFrom ?? 0,
          entering: admission?.entering ?? 0,
          builders: [...(target.builders ?? [])].filter(Boolean),
        }
      : null,
    worker: worker
      ? {
          id: worker.id,
          kind: worker.kind,
          team: worker.team,
          hp: worker.hp,
          inside: worker.inside,
          work: worker.work,
          cargo: units(worker.cargo),
          nativeCargo: person?.cargo ?? null,
          resident: !!residentPerson(world, worker),
          entry: !!worker.entry,
          registered: !!person && world.objectCells.objects.get(worker.id) === person,
          entryOrdersMatch: !!worker.entry && worker.entry.orders === world.buildingOrders,
          phase: person?.substate ?? null,
          workTarget: person?.workTarget ?? null,
          orderId,
          order: order
            ? { model: order.model, a: order.a, flags: order.flags, references: order.references }
            : null,
          tree: worker.tree,
          harvesting: !!worker.harvest,
          delivery: worker.delivery?.target ?? null,
          fighting: worker.fighting,
          builder: !!worker.builder,
        }
      : null,
    staff: world.units
      .filter(unit => unit.hp > 0 && (unit.inside === targetId || unit.work === targetId))
      .map(unit => unit.id),
    targetOrders: world.buildingOrders.records.flatMap((record, id) =>
      record.references && [8, 10].includes(record.model) && record.a === targetId
        ? [{ id, model: record.model, flags: record.flags, references: record.references }]
        : []
    ),
    otherTimberActors: world.units
      .filter(
        unit =>
          unit.id !== workerId &&
          (unit.cargo || unit.tree !== null || unit.harvest || unit.delivery)
      )
      .map(unit => unit.id),
    timber: world.trees.map(tree => ({
      id: tree.id,
      model: tree.model,
      amount: units(tree.logs),
      burning: !!tree.burn,
      reservations: tree.reservations ?? 0,
    })),
    presentation: scene
      ? {
          currentWorld: scene.world === world,
          record: scene.objectPanels.buildingRecords.has(targetId),
          latch: scene.objectPanels.automaticTrainingLatches.has(targetId),
          panel: !!panel,
          panelHidden: panel?.hidden ?? null,
          hovered: scene.hoveredObject === targetId,
          menuOpen: !!(scene.container.ownerDocument ?? globalThis.document)?.querySelector(
            'dialog[open]'
          ),
        }
      : null,
    reservations: world.secondaryEffects.reservations.filter(
      key => key === `building-panel:${targetId}`
    ).length,
    footprint: world.buildingFootprints.has(targetId),
  }
}

// Synchronous click capture can compare object ownership without returning an
// object or trusting an order allocated before the actual shipped handler runs.
export function hutResidentIdentity(world, workerId) {
  const worker = world.units.find(unit => unit.id === workerId),
    resident = worker && residentPerson(world, worker)
  if (!resident) throw Error('A valid physical Hut resident is required')
  return () => {
    const current = world.units.find(unit => unit.id === workerId)
    return (
      !!current?.entry &&
      current.entry.person === resident &&
      world.objectCells.objects.get(workerId) === resident &&
      current.entry.orders === world.buildingOrders
    )
  }
}
