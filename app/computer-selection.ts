import rules from './original-rules.json' with {type: 'json'};
import {cellDelta as delta,cellDistanceSquared} from './native-math.ts';

// Native person/command fields consumed by 0x4f8490 and its eligibility leaves.
// The people array is in native tribe-list order; spatial queries use coarse cells.
export type SelectionUnit = {
  id: number; class: number; model: number; state: number; tribe: number;
  x: number; y: number; flags2: number; flags3: number; flags4: number;
  assignment: number; busy: number; vehicle: number; driver: number; inside: number;
  immediateCommand: number; commands: number[]; commandCursor: number;
};
export type SelectionWorld = {
  people: SelectionUnit[];
  units: Map<number, SelectionUnit>;
  orders: Map<number, {model: number; flags: number}>;
  tribes: {hasBase: boolean; base: number; shaman: number; radius: number}[];
  buildingAt: (cell: number) => number;
};

const cell = (p: SelectionUnit) => ((p.x >>> 8) & 254) | (p.y & 0xfe00);
function stateFlags(p: SelectionUnit) {
  const flags = rules.personStateFlags[p.state];
  if (flags === undefined) throw new RangeError(`Unsupported native person state ${p.state}`);
  return flags;
}
function liveUnit(w: SelectionWorld, id: number) {
  const p = id ? w.units.get(id) : undefined;
  return p && p.class && !(p.flags2 & 1) ? p : undefined;
}
function currentCommand(w: SelectionWorld, p: SelectionUnit) {
  if (p.state !== 10 && p.state !== 33) return;
  const id = p.immediateCommand || p.commands[p.commandCursor];
  const command = id ? w.orders.get(id) : undefined;
  return command && !(command.flags & 1) ? command : undefined;
}

// 0x4f25b0 and 0x4f67b0/0x4f6730. A housing order counts separately from
// idle-state availability; training recruitment specifically excludes shamans.
export function availableTrainingPeople(w: SelectionWorld) {
  let count = 0;
  for (const p of w.people) {
    if ((stateFlags(p) & 8) && !p.busy && p.model !== 7) count++;
    if (currentCommand(w, p)?.model === 6) count++;
  }
  return count;
}

// 0x4f7720. The vehicle landing predicate is pure and both branches make the
// same driver-state test, so its terrain reads do not affect this result.
function transportDuty(w: SelectionWorld, p: SelectionUnit) {
  const vehicle = liveUnit(w, p.vehicle);
  if (!vehicle) return false;
  if (vehicle.driver === p.id && p.model === 2) return true;
  const driver = liveUnit(w, vehicle.driver);
  return !!driver && !(stateFlags(driver) & 8);
}

// 0x4f55d0 / 0x49c720: squared wrapped distance after halving each axis,
// including the boundary; this is different from the candidate-ranking metric.
function defendingBase(w: SelectionWorld, p: SelectionUnit, command: number | undefined) {
  if (p.busy || ![17, 31, 32].includes(command ?? -1)) return false;
  const tribe = w.tribes[p.tribe], base = tribe.hasBase ? tribe.base : tribe.shaman;
  return cellDistanceSquared(cell(p),base) <= tribe.radius * tribe.radius;
}

// 0x4f8490 / 0x4f8390. Mode 0 keeps traversal order; mode 1 ranks by wrapped
// Manhattan distance. Stable sorting preserves the native strict-< insertion
// tie order across priority bands. Only the returned prefix is observable here;
// native scratch writes beyond that prefix are not represented as world memory.
export function selectComputerPeople(w: SelectionWorld, model: number, alternative: number,
  target: number, mode: number, destination: number, flags: number, requested: number) {
  const candidates: {person: SelectionUnit; distance: number}[] = [];
  const count = Math.max(0, Math.min(100, requested | 0));
  for (let priority = 0; priority < 7; priority++) {
    if (((flags & 32) && priority >= 2 && priority <= 5) || ((flags & 8) && priority === 5)) continue;
    for (const p of w.people) {
      if (((p.assignment & 0x7000) >>> 12) !== priority) continue;
      const buildingId = p.flags2 & 0x800000 ? w.buildingAt(cell(p)) & 1023 : 0;
      const building = w.units.get(buildingId);
      if ((flags & 64) && building?.class === 2 && building.model === 4) continue;
      if ((p.flags4 & 0x800) || transportDuty(w, p)) continue;
      if (!(flags & 1) && (p.assignment & 0x804)) continue;
      if (model !== -1 && model !== p.model && alternative !== p.model) continue;
      if (target !== -1 && (p.flags2 & 0x800000) && buildingId === target) continue;
      if (p.model === 7) continue;
      const hut = liveUnit(w, buildingId);
      if (hut?.class === 2 && (rules.buildingFlags[hut.model] & 64) &&
        ((hut.inside << 24) >> 24) >= rules.buildingCapacity[hut.model]) continue;
      const command = currentCommand(w, p)?.model;
      if (!(flags & 4) && command === 6) continue;
      const idle = !!(stateFlags(p) & 8) && !p.busy;
      const redirect = !!(flags & 2) && ([11, 25].includes(command ?? -1) ||
        (!(flags & 16) && defendingBase(w, p, command)));
      if (!(idle || redirect || ((flags & 4) && command === 6) ||
        ((flags & 1) && (p.assignment & 0x804)) || (p.flags3 & 1))) continue;
      if (mode !== 0 && mode !== 1) continue;
      const location = cell(p);
      candidates.push({person: p, distance: delta(location, destination) + delta(location >> 8, destination >> 8)});
    }
  }
  if (mode === 1) candidates.sort((a, b) => a.distance - b.distance);
  const selected = candidates.slice(0, count).map(c => c.person);
  for (const person of selected) person.flags3 = (person.flags3 & ~1) >>> 0;
  return selected.map(p => p.id);
}
