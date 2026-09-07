import rules from './original-rules.json' with {type: 'json'};
import {currentPersonOrder, type PersonOrder} from './person-orders.ts';
import {randomPersonSpeed, recoverPersonMovement, resetPersonMotion,
  type StatefulPerson, type PersonStateWorld, type PersonStateEffects} from './person-state.ts';

export type StartingPerson = StatefulPerson & {
  destinationX: number; destinationY: number; savedVehicle: number;
  commandPhase: number; commandAux: number; orderDelay: number;
};
export type OrderStartWorld = PersonStateWorld & {
  tribes: (PersonStateWorld['tribes'][number] & {vehicleMode: number})[];
};
export type OrderStartEffects = {
  setAnimation: PersonStateEffects['setAnimation'];
  setDestination: (person: StartingPerson, x: number, y: number) => void;
  commandPosition: (order: PersonOrder) => {x: number; y: number};
  allowVehicleOrder: (person: StartingPerson) => boolean;
  initializeCommand: (person: StartingPerson, order: PersonOrder) => void;
  adjacentBuilding: (person: StartingPerson, model: number) => number;
  canStayForTarget: (person: StartingPerson, target: number) => boolean;
  leaveBuilding: (person: StartingPerson) => void;
  resetVehicleMovement: (vehicle: number) => void;
  leaveSelectedVehicle: (person: StartingPerson, order: PersonOrder) => void;
  initializeState: (person: StartingPerson) => void;
};
const short = (n: number) => (n << 16) >> 16;
function descriptor(model: number) {
  const d = rules.personCommands[model];
  if (!d) throw new RangeError(`Unsupported native person command ${model}`);
  return d;
}

// 0x432df0. Common descriptor behavior is shared by all commands. Specialized
// world effects (construction, transport, spell objects, etc.) stay mandatory
// consumers; model 8 training needs only the common target/flag initialization.
export function configurePersonOrder(w: OrderStartWorld, p: StartingPerson, effects: OrderStartEffects) {
  p.flags2 = (p.flags2 | 512) >>> 0; p.assignment &= 0xfdbf; resetPersonMotion(p);
  const order = currentPersonOrder(w.orders, p);
  if (order && !(order.flags & 1)) {
    const flags = descriptor(order.model).flags;
    p.flags2 = (flags & 0x1000 ? p.flags2 & ~0x2000000 : p.flags2 | 0x2000000) >>> 0;
    const special = p.model === 6 ? flags & 0x100000 : flags & 0x4000;
    p.flags4 = (special ? p.flags4 | 0x8000000 : p.flags4 & ~0x8000000) >>> 0;
    if (!(p.flags4 & 0x8000000) && p.vehicle && (p.flags4 & 0x2000000)) {
      const pos = effects.commandPosition(order); p.destinationX = pos.x; p.destinationY = pos.y;
    }
    if (!(flags & 0x40000)) p.flags4 = (p.flags4 & ~8) >>> 0;
    else if (!(p.flags4 & 8) && (!p.vehicle || effects.allowVehicleOrder(p))) p.flags4 = (p.flags4 | 8) >>> 0;
    if (order.model === 18) p.flags4 = (p.flags4 | 128) >>> 0;
    else if ([6, 7, 10, 11, 19, 21, 25, 28, 30, 31].includes(order.model)) effects.initializeCommand(p, order);
    if (flags & 1) {
      if (!(flags & 0x200000)) effects.setDestination(p, short(order.a), short(order.b));
    } else if (flags & 4) p.target = short(order.a);
    else if (flags & 0x800) {
      if (!(flags & 0x200000)) effects.setDestination(p, short((order.a & 254) << 8), short(order.a & 0xfe00));
    } else if (flags & 0x242) p.target = short(order.a);
    p.commandStatus = order.model;
    if (p.assignment & 32) { p.assignment &= ~32; recoverPersonMovement(w, p, effects.setAnimation); }
    p.orderDelay = 8;
    p.assignment = descriptor(order.model).flags & 16 ? p.assignment | 8 : p.assignment & ~8;
  }
  if (!p.savedVehicle && p.vehicle && w.tribes[p.tribe].vehicleMode === 2) p.savedVehicle = p.vehicle;
  p.flags2 = (p.flags2 | 0x40000000) >>> 0; p.substate = 0;
  p.assignment = (p.assignment & 0x7fff) | 0x110;
  p.animationMode = 0; p.workTarget = 0; p.commandAux = 0;
  if (p.vehicle) effects.resetVehicleMovement(p.vehicle);
}

// 0x43d510: an inside follower remains only for particular compatible orders.
// Current training target comparison deliberately does not check cancellation.
export function reconcileOrderBuilding(w: OrderStartWorld, p: StartingPerson, effects: OrderStartEffects) {
  if (!(p.flags2 & 0x800000)) return;
  let stay = false;
  if (p.commandStatus === 8) {
    const order = currentPersonOrder(w.orders, p);
    if (order) { const building = effects.adjacentBuilding(p, 0); stay = !!building && order.a === building; }
  } else if (p.commandStatus === 21) stay = p.model === 6 && !!effects.adjacentBuilding(p, 4);
  else if (p.commandStatus === 28 && p.model === 6 && effects.adjacentBuilding(p, 4)) {
    const order = currentPersonOrder(w.orders, p);
    stay = !!order && effects.canStayForTarget(p, order.a);
  } else if (p.commandStatus === 31) stay = true;
  if (!stay) { effects.leaveBuilding(p); p.flags2 = (p.flags2 & ~16) >>> 0; }
}

// 0x432260. Empty orders do not touch RNG or person fields; a cancelled command
// still takes the startup speed draw before the configuration leaf rejects it.
export function startPersonOrders(w: OrderStartWorld, p: StartingPerson, effects: OrderStartEffects) {
  if (!p.commands[p.commandCursor] && !p.immediateCommand) return;
  p.commandPhase = 0; p.flags4 = (p.flags4 & ~0x10000000) >>> 0; p.speed = randomPersonSpeed(w, p);
  configurePersonOrder(w, p, effects); reconcileOrderBuilding(w, p, effects);
  if (p.flags3 & 128) {
    const order = currentPersonOrder(w.orders, p);
    if (p.vehicle && order) effects.leaveSelectedVehicle(p, order);
    else p.flags3 = (p.flags3 & ~128) >>> 0;
  }
  if ((p.flags4 & 0x10000000) && !(p.flags2 & 0x100000)) {
    p.previousState = p.state; p.state = 33; effects.initializeState(p);
  }
}
