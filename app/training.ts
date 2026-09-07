import rules from './original-rules.json' with {type: 'json'};
import {nativeAngle} from './native-math.ts';
import {currentPersonOrder, type OrderPool} from './person-orders.ts';
import {recoverPersonMovement, stopPersonMovement, type PersonStateEffects} from './person-state.ts';
import type {StartingPerson} from './person-order-start.ts';

export type TrainingPerson = StartingPerson & {
  class: number; tickPhase: number; goalX: number; goalY: number; facingAngle: number;
};
export type TrainingQueue = {id: number; queueHead: number; queueFrom: number; activity: number};
export type TrainingBuilding = TrainingQueue & {
  class: number; model: number; flags2: number; flags3: number;
  inside: number; entering: number; entryDelay: number; entryTimer: number;
};
type QueuePerson = Pick<TrainingPerson, 'id' | 'class' | 'flags2' | 'flags3' | 'state' | 'substate' |
  'commands' | 'commandCursor' | 'immediateCommand' | 'reservationNext'>;
type QueueWorld = {people: Map<number, QueuePerson>; orders: OrderPool};
export type TrainingWorld = QueueWorld & {
  randomState: number; people: Map<number, TrainingPerson>; buildings: Map<number, TrainingBuilding>;
};
// Geometry, path requests, cargo objects and occupant/work updates still require
// native world consumers. A straight-line queue or teleport is not a substitute.
export type TrainingEffects = {
  setAnimation: PersonStateEffects['setAnimation'];
  releaseMotion: (p: TrainingPerson) => void;
  adjacentBuilding: (p: TrainingPerson) => number;
  outsidePoint: (b: TrainingBuilding) => {x: number; y: number};
  insidePoint: (b: TrainingBuilding) => {x: number; y: number};
  queuePoint: (b: TrainingBuilding, index: number) => {x: number; y: number};
  setDestination: (p: TrainingPerson, x: number, y: number) => void;
  directDestination: (p: TrainingPerson, x: number, y: number) => void;
  dropCargo: (p: TrainingPerson) => void;
  enterBuilding: (p: TrainingPerson, b: TrainingBuilding) => void;
  workInside: (p: TrainingPerson) => number;
};
const short = (n: number) => (n << 16) >> 16;
const byte = (n: number) => (n << 24) >> 24;
function live<T extends {class: number; flags2: number}>(units: Map<number, T>, id: number) {
  const p = id ? units.get(id & 65535) : undefined;
  return p?.class && !(p.flags2 & 1) ? p : undefined;
}

// 0x409c50. A negative index asks for the tail; an invalid tail link returns
// nothing, rather than returning the last valid entry or repairing the list.
export function trainingQueuePerson(w: QueueWorld, b: TrainingQueue, index: number) {
  let p = live(w.people, b.queueHead);
  while (p) {
    if (index === 0 || (index < 0 && !p.reservationNext)) return p;
    p = live(w.people, p.reservationNext);
    if (index > 0) index--;
  }
}

// 0x409bd0. If the requested person is absent, returns the last visited entry.
export function trainingQueuePredecessor(w: QueueWorld, b: TrainingQueue, person: QueuePerson) {
  let p = live(w.people, b.queueHead), previous: QueuePerson | undefined;
  while (p && p !== person) { previous = p; p = live(w.people, p.reservationNext); }
  return previous;
}

// 0x409b10. Even a broken list marks the incoming person as queued.
export function appendTrainingQueue(w: QueueWorld, b: TrainingQueue, person: QueuePerson) {
  let index = 0;
  if (!b.queueHead) b.queueHead = person.id;
  else {
    index = 1;
    let p = live(w.people, b.queueHead);
    while (p) {
      if (!p.reservationNext) { p.reservationNext = person.id; break; }
      p = live(w.people, p.reservationNext); index++;
    }
  }
  person.flags3 = (person.flags3 | 32) >>> 0; person.reservationNext = 0;
  return index;
}

// 0x409580. Preserve raw successor links while pruning live entries, including
// a dangling final link. Native lists are acyclic; this does not repair cycles.
export function rebuildTrainingQueue(w: QueueWorld, b: TrainingQueue) {
  let p = live(w.people, b.queueHead), previous: QueuePerson | undefined;
  let count = 0, index = 0, firstRemoved = -1;
  if (!p) b.queueHead = 0;
  while (p) {
    const next = live(w.people, p.reservationNext);
    const order = p.class === 1 && (p.state === 10 || p.state === 14) ? currentPersonOrder(w.orders, p) : undefined;
    if (order && !(order.flags & 1) && order.model === 8 && order.a === b.id && p.substate === 3) {
      count++; previous = p;
    } else {
      if (previous) previous.reservationNext = p.reservationNext;
      else b.queueHead = p.reservationNext;
      if (firstRemoved < 0) firstRemoved = index;
      p.reservationNext = 0; p.flags3 = (p.flags3 & ~32) >>> 0;
    }
    index++; p = next;
  }
  b.activity |= 0x2000; b.queueFrom = Math.min(Math.max(firstRemoved, 0), 255);
  return count;
}

// 0x434610, person command 8. State transitions below intentionally retain the
// native same-call fallthroughs and byte/short counters. Completion is consumed
// by the separate state-10 order updater; this function does not advance orders.
export function stepTrainingPerson(w: TrainingWorld, p: TrainingPerson, effects: TrainingEffects) {
  p.assignment &= ~8;
  let target = p.substate === 0 ? p.target : p.workTarget;
  let b = live(w.buildings, target);
  if (p.substate === 0) {
    if ((p.flags4 & 0x800) && b && !(rules.buildingFlags[b.model] & 1)) target = 0;
    if ((p.flags2 & 0x800000) && effects.adjacentBuilding(p) === p.target && p.target) target = 0;
    b = live(w.buildings, target);
    if (b && (rules.buildingFlags[b.model] & 64) && !(rules.personCommands[6].people & (1 << (p.model & 31)))) target = 0;
    b = live(w.buildings, target);
  }
  if (!b || !(b.activity & 8)) return 1;
  const flags = rules.buildingFlags[b.model], capacity = rules.buildingCapacity[b.model];
  if (flags === undefined) throw new RangeError(`Unsupported native building model ${b.model}`);
  const queued = !!(flags & 0x800);
  let changed = false;
  if (b.activity & 0x2000) {
    changed = true; b.activity &= ~0x2000;
    const follower = trainingQueuePerson(w, b, b.queueFrom) as TrainingPerson | undefined;
    if (follower) follower.commandAux = 2;
  }
  const near = (distance: number) => Math.abs(short(p.goalX) - short(p.x)) < distance && Math.abs(short(p.goalY) - short(p.y)) < distance;
  const move = (person: TrainingPerson, point: {x: number; y: number}) => effects.setDestination(person, short(point.x), short(point.y));
  const recover = (person = p) => recoverPersonMovement(w, person, effects.setAnimation);
  const position = (index: number) => effects.queuePoint(b, index);
  const phase = (person: QueuePerson) => (person as TrainingPerson).commandPhase;
  const face = (point: {x: number; y: number}) => {
    const angle = nativeAngle(short(point.x - p.x), -short(point.y - p.y));
    if (p.flags2 & 128) p.turnAngle = angle;
    p.facingAngle = angle; p.angle = p.flags2 & 0x8000 ? (angle + 1024) & 2047 : angle;
    return angle;
  };
  if (p.substate === 0) {
    p.workTarget = p.target & 65535; p.timer = 256; p.substate = 1;
    if (flags & 1) p.assignment |= 0x800;
    if (!(p.flags3 & 32)) {
      if (queued) changed = true;
      if (effects.adjacentBuilding(p) === b.id && (!queued || (!b.queueHead && byte(b.inside) < capacity && byte(b.entering) < capacity))) p.substate = 4;
      else { move(p, effects.outsidePoint(b)); recover(); }
    } else {
      p.substate = 3; p.commandPhase = 0;
      let follower = live(w.people, b.queueHead), index = 0;
      while (follower && follower !== p) { follower = live(w.people, follower.reservationNext); index = (index + 1) & 255; }
      if (follower) { p.commandPhase = index; if (near(12)) stopPersonMovement(p, effects.setAnimation); }
      else p.commandAux = 1;
      move(p, position(byte(p.commandPhase)));
    }
  }
  switch (p.substate) {
    case 1: {
      p.assignment |= 8;
      const tail = changed ? trainingQueuePerson(w, b, -1) : undefined;
      if (tail) move(p, position(byte(phase(tail))));
      if (!(p.tickPhase & 1)) {
        if (queued && near(0x538) && (b.queueHead || byte(b.inside) >= capacity || byte(b.entering) >= capacity)) p.substate = 2;
        else if (near(112)) { p.substate = 4; effects.dropCargo(p); }
      }
      break;
    }
    case 2: {
      p.substate = 3; p.commandAux = 0; p.commandPhase = 0;
      const tail = trainingQueuePerson(w, b, -1);
      if (tail) p.commandPhase = (phase(tail) + 1) & 255;
      appendTrainingQueue(w, b, p); move(p, position(byte(p.commandPhase))); recover();
    }
    // falls through
    case 3: {
      p.flags2 = (p.flags2 | 0x200000) >>> 0;
      if (byte(b.inside) < capacity && !b.entryDelay && p.id === short(b.queueHead) && !p.speed) {
        p.substate = 6; b.entryDelay = 16;
      } else {
        if (p.commandAux && --p.commandAux === 0) {
          const next = live(w.people, p.reservationNext); if (next) next.commandAux = 2;
          const previous = trainingQueuePredecessor(w, b, p);
          p.commandPhase = previous ? (phase(previous) + 1) & 255 : 0;
          move(p, position(byte(p.commandPhase))); recover();
        }
        if (near(12)) {
          if (p.speed) {
            stopPersonMovement(p, effects.setAnimation);
            const angle = face(p.commandPhase ? position(byte(p.commandPhase) - 1) : effects.insidePoint(b));
            effects.releaseMotion(p); p.turnAngle = angle; p.flags2 = (p.flags2 | 0x1080) >>> 0;
          }
          const trained = rules.buildingTrainedModel[b.model];
          const next = live(w.people, p.reservationNext);
          if (!(p.tickPhase & 15) && !p.commandAux && p.model === trained && next && next.model !== trained) {
            const previous = trainingQueuePredecessor(w, b, p);
            if (previous) previous.reservationNext = p.reservationNext;
            else b.queueHead = p.reservationNext;
            p.reservationNext = next.reservationNext; next.reservationNext = p.id;
            move(p, position(byte(next.commandPhase))); recover();
            move(next, position(byte(p.commandPhase))); recover(next);
            p.commandAux = 1; next.commandAux = 1;
          }
        } else if (!p.speed) { recover(); p.timer = 256; }
        else { p.timer = short(p.timer - 1); if (p.timer < 1) p.substate = 0; }
        if (p.flags2 & 0x2004) p.substate = 2;
      }
      if (p.substate !== 3) rebuildTrainingQueue(w, b);
      break;
    }
    case 4:
    case 5: {
      let blocked = byte(b.inside) >= capacity;
      if (!blocked) {
        if (p.substate === 4) {
          p.substate = 5; recover();
          const point = effects.insidePoint(b); face(point);
          p.flags4 = ((p.flags4 & 0xfffefff8) | 2) >>> 0;
          effects.directDestination(p, short(point.x), short(point.y));
          if (byte(b.entering) < capacity) {
            if (!(b.flags3 & 64)) {
              b.entryTimer = 16;
              if (byte(b.entering) < 120) b.entering = (b.entering + 1) & 255;
              if (byte(b.entering) > rules.buildingCapacity[b.model]) b.flags3 = (b.flags3 | 64) >>> 0;
            }
          } else blocked = true;
        }
        if (!blocked) {
          if (!(p.tickPhase & 1) && near(112)) {
            effects.enterBuilding(p, b);
            if (!(flags & 65)) { p.selectionFlags &= ~1; return 1; }
            p.substate = flags & 64 ? 10 : 12;
          }
          return 0;
        }
      }
      if (!queued) return 1;
      p.substate = 8; break;
    }
    case 6:
      p.substate = 7; recover(); move(p, effects.outsidePoint(b));
      // falls through
    case 7:
      if (!(p.tickPhase & 1) && near(112)) { p.substate = 4; effects.dropCargo(p); }
      break;
    case 8:
      p.flags4 = (p.flags4 & 0xfffefff8) >>> 0; p.substate = 9; recover(); move(p, effects.outsidePoint(b));
      // falls through
    case 9:
      if (!(p.tickPhase & 1) && near(112)) p.substate = 0;
      break;
    case 10:
      p.commandAux = 0; p.assignment |= 0x100; p.substate = 11;
      // falls through
    case 11: return effects.workInside(p);
    case 12: p.substate = 13; stopPersonMovement(p, effects.setAnimation);
  }
  return 0;
}
