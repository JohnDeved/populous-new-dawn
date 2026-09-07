import rules from './original-rules.json' with {type: 'json'};
import {clearPersonOrders, type OrderedPerson, type OrderPool, type OrderEffects} from './person-orders.ts';
import type {TrainingBuilding} from './training.ts';

export type BuildingOccupant = OrderedPerson & {
  class: number; tribe: number; renderFlags: number; clip: number; height: number;
  velocityX: number; velocityY: number; velocityZ: number;
};
export type OccupiedBuilding = Pick<TrainingBuilding, 'id' | 'class' | 'model' | 'flags2' | 'flags3' | 'activity' | 'inside'> & {
  tribe: number; occupants: number[]; trainingTimer: number; trainingCost: number;
};
export type OccupancyWorld = {
  people: Map<number, BuildingOccupant>; orders: OrderPool; towerTribes: number;
  tribes: {personCounts: number[]; playerType: number}[];
};
// Required world consumers: vehicle removal, land-cell membership, tower
// placement, full-building ejection and occupancy indicator allocation.
export type OccupancyEffects = {
  orders: OrderEffects;
  leaveVehicle: (person: BuildingOccupant) => void;
  adjacentBuilding: (person: BuildingOccupant, model: number) => number;
  towerPosition: (id: number) => {x: number; y: number; clip: number};
  terrainHeight: (x: number, y: number) => number;
  moveToCell: (person: BuildingOccupant, x: number, y: number, height: number) => void;
  insertCell: (person: BuildingOccupant) => void;
  removeCell: (person: BuildingOccupant) => void;
  ejectFirst: (building: OccupiedBuilding) => void;
  updateIndicator: (building: OccupiedBuilding) => void;
};
const short = (n: number) => (n << 16) >> 16;
const byte = (n: number) => (n << 24) >> 24;
function live(w: OccupancyWorld, id: number) {
  const p = id ? w.people.get(id) : undefined;
  return p?.class && !(p.flags2 & 1) ? p : undefined;
}

// 0x41b0c0 arithmetic. Both multiplications wrap before signed division by 256.
export function nativeTrainingCost(count: number, model: number, playerType: number, amount = 1) {
  const training = rules.personTraining[model];
  if (!training) throw new RangeError(`Unsupported native person model ${model}`);
  count = short(count);
  const band = count < 4 ? 0 : count < 8 ? 1 : count < 12 ? 2 : count < 16 ? 3 : count < 21 ? 4 : 5;
  const mana = playerType === 2 ? training.humanMana : training.computerMana;
  return Math.trunc(Math.imul(Math.imul(rules.trainingBands[band], mana), amount) / 256) | 0;
}

// 0x408d20. Count conversion weight of live occupants that are not already the
// destination model, irrespective of tribe; only a full conversion counts.
export function trainingOccupantWeight(w: OccupancyWorld, b: OccupiedBuilding) {
  if (!b.inside) return 0;
  const model = rules.buildingTrainedModel[b.model], capacity = rules.buildingCapacity[b.model];
  let weight = 0;
  for (let i = 0; i < capacity; i++) {
    const p = live(w, b.occupants[i]);
    if (p && p.model !== model) weight += short(rules.personTraining[p.model].weight);
  }
  return weight >= short(rules.personTraining[model].weight) ? weight : 0;
}

// 0x4d80e0. Modes 0/4 hide ordinary occupants; 3 retains training/workshop
// commands and presentation. Mode 1 restores land membership and vertical state.
export function setPersonOccupancy(w: OccupancyWorld, p: BuildingOccupant, mode: number, effects: OccupancyEffects) {
  mode &= 255;
  if (mode === 0 || mode === 4) {
    effects.leaveVehicle(p);
    if (mode !== 4) clearPersonOrders(w.orders, p, effects.orders);
    p.flags4 = (p.flags4 & ~256) >>> 0; p.flags2 = (p.flags2 | 0x804000) >>> 0;
    const tower = effects.adjacentBuilding(p, 4);
    if (tower) {
      const point = effects.towerPosition(tower); p.clip = point.clip & 65535;
      const height = effects.terrainHeight(point.x, point.y);
      effects.moveToCell(p, point.x, point.y, height); return;
    }
    if (p.model !== 7 || !effects.adjacentBuilding(p, 19)) {
      p.renderFlags |= 16;
      if (p.flags2 & 0x20000) effects.removeCell(p);
    }
  } else if (mode === 1) {
    p.renderFlags &= ~16; p.assignment &= ~4;
    p.flags4 = (p.flags4 | 256) >>> 0; p.flags2 = (p.flags2 & ~0x804000) >>> 0;
    if (!(p.flags2 & 0x20000)) effects.insertCell(p);
    p.height = effects.terrainHeight(p.x, p.y) & 65535;
    p.velocityX = 0; p.velocityY = 0; p.velocityZ = 0;
  } else if (mode === 3) {
    effects.leaveVehicle(p); p.flags2 = (p.flags2 | 0x800000) >>> 0;
  }
}

// 0x407150. Admission consumes the first empty physical slot, not `inside` as
// an array index. The shaman can request an ejection at nominal capacity; entry
// still requires an empty slot afterwards. Failed admission leaves orders alone.
export function enterBuilding(w: OccupancyWorld, p: BuildingOccupant, b: OccupiedBuilding, effects: OccupancyEffects) {
  const flags = rules.buildingFlags[b.model], capacity = rules.buildingCapacity[b.model];
  if (p.tribe !== b.tribe && !(flags & 0x100000) || !(b.activity & 8)) return 0;
  if (byte(b.inside) >= capacity) {
    if (p.model !== 7) return 0;
    effects.ejectFirst(b);
  }
  const slot = b.occupants.slice(0, 6).indexOf(0);
  if (slot < 0) return 0;
  b.inside = (b.inside + 1) & 255; b.occupants[slot] = p.id;
  setPersonOccupancy(w, p, flags & 65 ? 3 : 0, effects);
  if (b.model === 4) w.towerTribes = (w.towerTribes | (1 << (b.tribe & 31))) & 255;
  if (rules.buildingFlags[b.model] & 1) {
    b.flags3 = (b.flags3 & ~0x1000) >>> 0; b.trainingTimer = 0;
    const weight = trainingOccupantWeight(w, b);
    b.activity = weight ? b.activity | 128 : b.activity & ~128;
    if (weight) {
      const model = rules.buildingTrainedModel[b.model], tribe = w.tribes[b.tribe];
      const amount = Math.trunc(weight / short(rules.personTraining[model].weight));
      b.trainingCost = Math.min(65535, nativeTrainingCost(tribe.personCounts[model], model, tribe.playerType, amount)) & 65535;
    }
    for (let i = 0; i < rules.buildingCapacity[b.model]; i++) {
      const occupant = live(w, b.occupants[i]);
      if (occupant?.tribe === b.tribe) occupant.assignment = weight ? occupant.assignment | 4 : occupant.assignment & ~4;
    }
  }
  effects.updateIndicator(b); b.activity &= ~1024; p.orderLocation = 0;
  return 1;
}
