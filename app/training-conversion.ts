import rules from './original-rules.json' with {type: 'json'};
import {buildingInsidePoint} from './building-shapes.ts';
import {buildingExitPoint, removeBuildingOccupant, repriceTraining, trainingOccupantWeight,
  type BuildingOccupant, type OccupiedBuilding, type OccupancyWorld, type OccupancyEffects} from './building-occupants.ts';
import {allocatePersonOrder, attachPersonOrder, clearPersonOrders, hasFollowingPersonOrder} from './person-orders.ts';

type Trainee = BuildingOccupant & {reservationNext: number};
export type ConvertingBuilding = OccupiedBuilding & {tickPhase: number; storedMana: number; queueHead: number};
export type ConversionWorld = Omit<OccupancyWorld, 'people'> & {people: Map<number, Trainee>; playerTribe: number};
export type ConversionEffects = OccupancyEffects & {
  // 0x509290 activates/retains the local player's training UI panel.
  updateTrainingPanel: (building: ConvertingBuilding) => void;
  // Owns the native initialization stack/flag and object allocation/registration.
  allocateTrainee: (model: number, tribe: number, x: number, y: number, angle: number) => Trainee | undefined;
  addMana: (tribe: number, amount: number) => void;
};
function live(w: ConversionWorld, id: number) {
  const p = id ? w.people.get(id) : undefined;
  return p?.class && !(p.flags2 & 1) ? p : undefined;
}

// 0x405b80. Training creates replacement people; failed allocation deletes only
// the replacements. Existing occupants remain until every allocation succeeds.
export function stepTrainingConversion(w: ConversionWorld, b: ConvertingBuilding, effects: ConversionEffects) {
  const trained = rules.buildingTrainedModel[b.model], capacity = rules.buildingCapacity[b.model];
  if (!(b.activity & 128)) {
    if ((b.tickPhase & 15) || !b.inside) return;
    const first = live(w, b.occupants[0]);
    if (!first || (first.model !== trained && first.model !== 7) || !b.queueHead) return;
    const head = live(w, b.queueHead);
    if (head && head.model !== trained && head.model !== 7) removeBuildingOccupant(w, b, first, effects);
    let queued = live(w, b.queueHead), untrained = false;
    while (queued && !untrained) {
      untrained = queued.model !== trained;
      queued = live(w, queued.reservationNext);
    }
    if (untrained) {
      queued = live(w, b.queueHead);
      while (queued?.model === trained) {
        queued.substate = 0; queued.flags2 = (queued.flags2 | 0x40000000) >>> 0;
        queued = live(w, queued.reservationNext);
      }
      b.activity |= 0x2000;
      removeBuildingOccupant(w, b, first, effects);
    }
    return;
  }

  effects.updateTrainingPanel(b);
  const repriced = !b.trainingCost || !(b.tickPhase & 15);
  if (repriced) repriceTraining(w, b);
  if (b.trainingCost > b.storedMana) return;
  b.storedMana = b.trainingCost;
  const weight = trainingOccupantWeight(w, b);
  if (!weight) return;
  const inside = buildingInsidePoint(b), command = allocatePersonOrder(w.orders);
  if (command) {
    const outside = buildingExitPoint(b, effects);
    effects.orders.prepare(w.orders.records[command], 3, outside.x, outside.y, 32);
  }
  let ghosts = 0;
  if (b.inside) for (let slot = 0; slot < capacity; slot++) {
    if ((live(w, b.occupants[slot])?.flags4 ?? 0) & 0x800) ghosts++;
  }
  const divisor = (rules.personTraining[trained].weight << 16) >> 16;
  if (!divisor) throw new RangeError('Native training model has zero conversion weight');
  const conversions = Math.trunc(weight / divisor), remainder = weight - conversions * divisor;
  if (!repriced) repriceTraining(w, b);
  if (!ghosts && b.trainingCost > b.storedMana) return;
  const count = conversions + remainder;
  if (count > 16) throw new RangeError('Native training conversion exceeds its allocation buffer');
  const created: Trainee[] = [];
  for (let i = 0; i < count; i++) {
    const p = effects.allocateTrainee(i < conversions ? trained : 2, b.tribe, inside.x, inside.y, b.angle);
    if (!p) {
      for (const createdPerson of created) effects.orders.deleteObject(createdPerson.id);
      return;
    }
    created.push(p);
    if (ghosts) {
      p.flags4 = (p.flags4 | 0x800) >>> 0;
      if (p.tribe === w.playerTribe) p.renderFlags |= 0x4000;
    }
  }
  if (!ghosts) {
    if (w.tribes[b.tribe].playerType === 1) effects.addMana(b.tribe, b.storedMana);
    b.storedMana = 0;
  }
  // Native code advances over empty slots but never advances past its first
  // nonempty source. Every replacement therefore inherits that same order tail.
  let sourceSlot = 0;
  for (const p of created) {
    while (sourceSlot < capacity && !b.occupants[sourceSlot]) sourceSlot++;
    const source = sourceSlot < capacity ? live(w, b.occupants[sourceSlot]) : undefined;
    if (source && hasFollowingPersonOrder(w.orders, source)) {
      let cursor = source.commandCursor;
      for (let slot = 0; slot < 7; slot++) {
        cursor = (cursor + 1) & 7;
        const id = source.commands[cursor];
        if (id) attachPersonOrder(w.orders, p, id, slot, effects.orders);
      }
    } else if (command) attachPersonOrder(w.orders, p, command, 0, effects.orders);
    p.flags2 = (p.flags2 | 16) >>> 0;
  }
  for (let slot = 0; slot < capacity; slot++) {
    const p = live(w, b.occupants[slot]);
    if (p && p.model !== trained) {
      removeBuildingOccupant(w, b, p, effects);
      clearPersonOrders(w.orders, p, effects.orders);
      effects.orders.deleteObject(p.id);
    }
  }
  b.trainingCost = 0; b.activity |= 0x400; b.lastActivity = w.turn >>> 0;
}
