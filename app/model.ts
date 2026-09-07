export type Team = 'blue' | 'red' | 'wild';
export type UnitKind = 'shaman' | 'brave' | 'warrior';
export type BuildingKind = 'hut' | 'tower' | 'camp' | 'temple';
export type Spell = 'convert' | 'blast' | 'lightning' | 'bridge' | 'earthquake' | 'volcano';
export type Point = { x: number; z: number };
export type Unit = Point & { id: number; team: Team; kind: UnitKind; hp: number; path: Point[]; target: number | null; cooldown: number; work: number | null };
export type Building = Point & { id: number; team: Team; kind: BuildingKind; hp: number; progress: number; timer: number };
export type Effect = Point & { id: number; kind: Spell | 'birth' | 'hit'; age: number; duration: number };
export const SPELLS: { id: Spell; name: string; cost: number; key: string; symbol: string; color: string; description: string }[] = [
  { id: 'convert', name: 'Convert', cost: 20, key: '1', symbol: '✺', color: '#9fcee9', description: 'Welcome nearby wildmen into your tribe.' },
  { id: 'blast', name: 'Blast', cost: 25, key: '2', symbol: '✹', color: '#e8b076', description: 'A burst of fire. Scatters and wounds enemies.' },
  { id: 'lightning', name: 'Lightning', cost: 55, key: '3', symbol: 'ϟ', color: '#c6b8f2', description: 'Call down a lethal bolt on a small area.' },
  { id: 'bridge', name: 'Land bridge', cost: 65, key: '4', symbol: '≋', color: '#bbca8a', description: 'Raise a walkable causeway toward your target.' },
  { id: 'earthquake', name: 'Earthquake', cost: 100, key: '5', symbol: '⋈', color: '#d5a875', description: 'Rupture the land and devastate buildings.' },
  { id: 'volcano', name: 'Volcano', cost: 180, key: '6', symbol: '♨', color: '#ef8970', description: 'Raise a burning mountain. Your greatest power.' },
];
export const BUILDINGS: { id: BuildingKind; name: string; cost: number; symbol: string; description: string }[] = [
  { id: 'hut', name: 'Hut', cost: 35, symbol: '⌂', description: 'Shelters 6 followers. A new brave every 38 seconds.' },
  { id: 'camp', name: 'Warrior camp', cost: 65, symbol: '⚔', description: 'Trains a nearby brave into a warrior every 15 seconds.' },
  { id: 'tower', name: 'Guard tower', cost: 50, symbol: '♜', description: 'Automatically attacks enemies within 11 paces.' },
  { id: 'temple', name: 'Temple', cost: 70, symbol: '♜', description: 'Adds 1.2 mana per second to your tribe’s faith.' },
];
export const HOME = { x: -16, z: 14 };
export const ENEMY = { x: 19, z: -13 };
export const SIZE = 96;
export const GRID = 97;
export const curve = (x: number, z: number) => -(x * x + z * z) / 230;
export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.z - b.z);
export const maxHp = (kind: UnitKind) => kind === 'shaman' ? 100 : kind === 'warrior' ? 85 : 48;
export const buildingHp = (kind: BuildingKind) => kind === 'hut' ? 170 : kind === 'tower' ? 230 : 260;
export function makeTerrain() {
  return Array.from({ length: GRID * GRID }, (_, i) => {
    const x = i % GRID - 48, z = Math.floor(i / GRID) - 48;
    const main = 8.8 * Math.exp(-(((x + 10) / 27) ** 2) - ((z - 8) / 24) ** 2);
    const other = 8.2 * Math.exp(-(((x - 19) / 19) ** 2) - ((z + 14) / 20) ** 2);
    const mountain = 18 * Math.exp(-((Math.hypot(x + 14, z + 17) / 8) ** 1.45)) + 4 * Math.exp(-(((x + 24) / 6) ** 2) - ((z + 13) / 7) ** 2);
    const detail = .48 * Math.sin(x * .31) * Math.cos(z * .27) + .28 * Math.sin(x * .62 + z * .3);
    return -3.8 + main + other + mountain + detail + Math.max(0, mountain - 4) * .045 * Math.sin(x * 1.7 + z * 1.3);
  });
}
export function height(terrain: number[], x: number, z: number) {
  const gx = Math.max(0, Math.min(95.999, x + 48)), gz = Math.max(0, Math.min(95.999, z + 48));
  const ix = Math.floor(gx), iz = Math.floor(gz), fx = gx - ix, fz = gz - iz;
  const a = terrain[iz * GRID + ix] * (1 - fx) + terrain[iz * GRID + ix + 1] * fx;
  const b = terrain[(iz + 1) * GRID + ix] * (1 - fx) + terrain[(iz + 1) * GRID + ix + 1] * fx;
  return a * (1 - fz) + b * fz;
}
export function walkable(terrain: number[], p: Point) { return Math.abs(p.x) < 46 && Math.abs(p.z) < 46 && height(terrain, p.x, p.z) > .45; }
// ponytail: a 49×49 A* grid is enough for this island; use a heap and cached flow fields for hundreds of followers.
export function findPath(terrain: number[], start: Point, end: Point): Point[] {
  if (!walkable(terrain, end)) return [];
  const cell = (p: Point) => Math.max(0, Math.min(48, Math.round((p.z + 48) / 2))) * 49 + Math.max(0, Math.min(48, Math.round((p.x + 48) / 2)));
  const point = (i: number) => ({ x: (i % 49) * 2 - 48, z: Math.floor(i / 49) * 2 - 48 });
  const source = cell(start), goal = cell(end), open = [source], costs = new Map([[source, 0]]), came = new Map<number, number>(), closed = new Set<number>();
  while (open.length) {
    open.sort((a, b) => costs.get(a)! + distance(point(a), end) - costs.get(b)! - distance(point(b), end));
    const current = open.shift()!;
    if (current === goal) {
      const route: Point[] = [end];
      for (let at = current; at !== source; at = came.get(at)!) route.unshift(point(at));
      return route;
    }
    closed.add(current);
    const p = point(current);
    for (const [dx, dz] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) {
      const next = { x: p.x + dx, z: p.z + dz };
      if (!walkable(terrain, next) || Math.abs(height(terrain, next.x, next.z) - height(terrain, p.x, p.z)) > 2.8) continue;
      const id = cell(next), cost = costs.get(current)! + 2;
      if (closed.has(id) || cost >= (costs.get(id) ?? Infinity)) continue;
      came.set(id, current); costs.set(id, cost);
      if (!open.includes(id)) open.push(id);
    }
  }
  return [];
}
export type World = {
  terrain: number[]; terrainVersion: number; units: Unit[]; buildings: Building[]; effects: Effect[];
  mana: number; wood: number; time: number; nextId: number; selected: number[]; mode: Spell | BuildingKind | null;
  paused: boolean; speed: number; message: string; messageUntil: number; status: 'playing' | 'won' | 'lost';
  nextRaid: number; respawn: number; stats: { converted: number; built: number; cast: number }; seed: number;
};
export function random(w: World) { w.seed = (Math.imul(w.seed, 1664525) + 1013904223) >>> 0; return w.seed / 4294967296; }
export function addUnit(w: World, team: Team, kind: UnitKind, p: Point) {
  const u: Unit = { ...p, id: w.nextId++, team, kind, hp: maxHp(kind), path: [], target: null, cooldown: 0, work: null };
  w.units.push(u); return u;
}
export function addBuilding(w: World, team: Team, kind: BuildingKind, p: Point, complete = true) {
  const b: Building = { ...p, id: w.nextId++, team, kind, hp: buildingHp(kind), progress: complete ? 1 : 0, timer: 0 };
  w.buildings.push(b); return b;
}
export function createWorld(): World {
  const w: World = { terrain: makeTerrain(), terrainVersion: 0, units: [], buildings: [], effects: [], mana: 125, wood: 110, time: 0, nextId: 1, selected: [], mode: null, paused: false, speed: 1, message: 'Your people await, Shaman. A new world is yours to shape.', messageUntil: 12, status: 'playing', nextRaid: 95, respawn: 0, stats: { converted: 0, built: 0, cast: 0 }, seed: 741 };
  const s = addUnit(w, 'blue', 'shaman', HOME); w.selected = [s.id];
  addUnit(w, 'red', 'shaman', ENEMY);
  for (let i = 0; i < 12; i++) addUnit(w, 'blue', i < 3 ? 'warrior' : 'brave', { x: -17 + (i % 4) * 1.5, z: 17 + Math.floor(i / 4) * 1.5 });
  for (let i = 0; i < 10; i++) addUnit(w, 'red', i < 4 ? 'warrior' : 'brave', { x: 17 + (i % 4) * 1.5, z: -10 + Math.floor(i / 4) * 1.5 });
  for (const [x, z] of [[-7, 0], [-5, 2], [-4, -1], [0, 6], [2, 7], [3, 5], [14, 10], [15, 11]]) addUnit(w, 'wild', 'brave', { x, z });
  for (const [x, z] of [[-23, 12], [-20, 20], [-10, 20], [-18, 5]]) addBuilding(w, 'blue', 'hut', { x, z });
  for (const [x, z] of [[15, -17], [23, -17], [26, -10]]) addBuilding(w, 'red', 'hut', { x, z });
  addBuilding(w, 'blue', 'temple', { x: -25, z: 3 });
  addBuilding(w, 'blue', 'tower', { x: -6, z: 21 });
  addBuilding(w, 'red', 'tower', { x: 13, z: -8 });
  return w;
}
export function tell(w: World, message: string) { w.message = message; w.messageUntil = w.time + 7; }
export function effect(w: World, kind: Effect['kind'], p: Point) { w.effects.push({ ...p, kind, id: w.nextId++, age: 0, duration: kind === 'volcano' ? 8 : kind === 'earthquake' ? 4 : 1.7 }); }
export function select(w: World, kind: UnitKind | 'all') {
  w.selected = w.units.filter(u => u.team === 'blue' && (kind === 'all' || u.kind === kind)).map(u => u.id); w.mode = null;
}
export function command(w: World, p: Point) {
  if (w.paused || w.status !== 'playing') return;
  const enemy = [...w.units, ...w.buildings].find(u => u.team === 'red' && distance(u, p) < 2.6);
  let moved = 0;
  for (const u of w.units.filter(u => w.selected.includes(u.id))) {
    const path = findPath(w.terrain, u, enemy ?? p);
    if (path.length) { u.path = path; u.target = enemy?.id ?? null; u.work = null; moved++; }
  }
  tell(w, moved ? (enemy ? 'Your followers march to battle.' : 'Your followers are on the move.') : 'No land route. Try a land bridge, or choose a closer destination.');
}
export function placeBuilding(w: World, kind: BuildingKind, p: Point) {
  if (w.paused || w.status !== 'playing') return false;
  const spec = BUILDINGS.find(b => b.id === kind)!;
  const braves = w.units.filter(u => u.team === 'blue' && u.kind === 'brave' && u.work === null).sort((a, b) => distance(a, p) - distance(b, p));
  if (w.wood < spec.cost) { tell(w, 'More wood is needed. Idle braves gather it automatically.'); return false; }
  if (!walkable(w.terrain, p) || height(w.terrain, p.x, p.z) > 8 || [0, 1, 2, 3].some(i => !walkable(w.terrain, { x: p.x + Math.cos(i * Math.PI / 2) * 2, z: p.z + Math.sin(i * Math.PI / 2) * 2 })) || w.buildings.some(b => distance(b, p) < 4.8)) { tell(w, 'Choose open, dry land with space around it.'); return false; }
  const workers = braves.slice(0, 3).map(u => ({ u, path: findPath(w.terrain, u, p) })).filter(a => a.path.length);
  if (!workers.length) { tell(w, 'You need a free brave who can reach this site.'); return false; }
  w.wood -= spec.cost; const b = addBuilding(w, 'blue', kind, p, false);
  for (const { u, path } of workers) { u.work = b.id; u.path = path; u.target = null; }
  w.mode = null; tell(w, `${spec.name} planned. Your braves are building.`); return true;
}
function deform(w: World, p: Point, radius: number, amount: number) {
  for (let i = 0; i < w.terrain.length; i++) {
    const d = Math.hypot(i % GRID - 48 - p.x, Math.floor(i / GRID) - 48 - p.z);
    if (d < radius) w.terrain[i] += amount * (1 - d / radius);
  }
  w.terrainVersion++;
}
export function cast(w: World, spell: Spell, p: Point) {
  if (w.paused || w.status !== 'playing') return false;
  const spec = SPELLS.find(s => s.id === spell)!;
  const shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman');
  if (!shaman) { tell(w, 'Your shaman is reincarnating.'); return false; }
  if (w.mana < spec.cost) { tell(w, 'Your followers must generate more mana.'); return false; }
  if (distance(shaman, p) > 34) { tell(w, 'Beyond your reach. Move your shaman closer.'); return false; }
  if (Math.abs(p.x) > 45 || Math.abs(p.z) > 45) { tell(w, 'Choose a target within the world.'); return false; }
  if (spell === 'convert' && !w.units.some(u => u.team === 'wild' && distance(u, p) < 6)) { tell(w, 'Cast Convert on the pale wildmen wandering the island.'); return false; }
  w.mana -= spec.cost; w.stats.cast++; w.mode = null; effect(w, spell, p);
  if (spell === 'convert') {
    let count = 0;
    for (const u of w.units) if (u.team === 'wild' && distance(u, p) < 6) { u.team = 'blue'; count++; }
    w.stats.converted += count; tell(w, `${count} wildmen have joined your tribe.`);
  } else if (spell === 'bridge') {
    const length = distance(shaman, p);
    for (let t = 0; t <= length; t += 1) {
      const q = { x: shaman.x + (p.x - shaman.x) * t / Math.max(1, length), z: shaman.z + (p.z - shaman.z) * t / Math.max(1, length) };
      for (let i = 0; i < w.terrain.length; i++) {
        const d = Math.hypot(i % GRID - 48 - q.x, Math.floor(i / GRID) - 48 - q.z);
        if (d < 3) w.terrain[i] = Math.max(w.terrain[i], 1.4 - d * .17);
      }
    }
    w.terrainVersion++; tell(w, 'The earth rises. A new path opens.');
  } else {
    const radius = spell === 'blast' ? 4.5 : spell === 'lightning' ? 3.6 : spell === 'earthquake' ? 9 : 10;
    const damage = spell === 'blast' ? 38 : spell === 'lightning' ? 110 : spell === 'earthquake' ? 130 : 260;
    for (const u of w.units) if (distance(u, p) < radius && u.id !== shaman.id) u.hp -= damage;
    for (const b of w.buildings) if (distance(b, p) < radius + 1.5) b.hp -= damage * (spell === 'earthquake' ? 2 : 1);
    if (spell === 'earthquake') deform(w, p, radius, -3.2);
    if (spell === 'volcano') deform(w, p, radius, 12);
    tell(w, `${spec.name}! The world bends to your will.`);
  }
  return true;
}
export function tick(w: World, dt: number) {
  if (w.paused || w.status !== 'playing') return;
  w.time += dt;
  const blue = w.units.filter(u => u.team === 'blue'), braves = blue.filter(u => u.kind === 'brave');
  w.mana = Math.min(300, w.mana + dt * (.6 + blue.length * .055 + w.buildings.filter(b => b.team === 'blue' && b.kind === 'temple' && b.progress === 1).length * 1.2));
  w.wood = Math.min(999, w.wood + dt * braves.filter(u => u.work === null && !u.path.length && u.target === null).length * .17);
  for (const fx of w.effects) fx.age += dt;
  w.effects = w.effects.filter(f => f.age < f.duration);
  for (const b of w.buildings) {
    if (b.hp <= 0) continue;
    if (height(w.terrain, b.x, b.z) < .35) b.hp -= 50 * dt;
    if (b.progress < 1) {
      b.timer += dt;
      if (b.timer > 2 && !w.units.some(u => u.work === b.id)) {
        b.timer = 0;
        const candidates = w.units.filter(u => u.team === b.team && u.kind === 'brave' && u.work === null && !u.path.length).sort((a, c) => distance(a, b) - distance(c, b));
        for (const u of candidates.slice(0, 3)) { const path = findPath(w.terrain, u, b); if (path.length) { u.work = b.id; u.path = path; u.target = null; } }
      }
      const builders = w.units.filter(u => u.work === b.id && distance(u, b) < 3);
      b.progress = Math.min(1, b.progress + builders.length * dt / 16);
      if (b.progress === 1) { w.stats.built++; for (const u of w.units) if (u.work === b.id) u.work = null; tell(w, `${BUILDINGS.find(s => s.id === b.kind)!.name} completed.`); }
      continue;
    }
    b.timer += dt;
    const tribe = w.units.filter(u => u.team === b.team);
    if (b.kind === 'hut' && b.timer > (b.team === 'blue' ? 38 : 65)) {
      b.timer = 0;
      const capacity = w.buildings.filter(a => a.team === b.team && a.kind === 'hut' && a.progress === 1).length * 6 + 1;
      if (tribe.length < Math.min(capacity, 60)) {
        const p = { x: b.x + 2.5, z: b.z + 1 }; if (walkable(w.terrain, p)) { addUnit(w, b.team, 'brave', p); effect(w, 'birth', p); }
      }
    }
    if (b.kind === 'camp' && b.timer > 15) {
      const brave = tribe.find(u => u.kind === 'brave' && u.work === null && distance(u, b) < 18);
      if (brave) { brave.kind = 'warrior'; brave.hp = maxHp('warrior'); b.timer = 0; effect(w, 'birth', brave); }
    }
    if (b.kind === 'tower' && b.timer > 1.2) {
      const victim = w.units.find(u => u.team !== b.team && u.team !== 'wild' && u.hp > 0 && distance(u, b) < 11);
      if (victim) { victim.hp -= 13; effect(w, 'hit', victim); b.timer = 0; }
    }
  }
  for (const u of w.units) {
    if (u.hp <= 0 || u.team === 'wild') continue;
    u.cooldown = Math.max(0, u.cooldown - dt);
    if (!walkable(w.terrain, u)) { u.hp -= dt * 35; continue; }
    if (u.work !== null && !w.buildings.some(b => b.id === u.work && b.hp > 0)) u.work = null;
    let target: Unit | Building | undefined = u.target === null ? undefined : [...w.units, ...w.buildings].find(t => t.id === u.target && t.hp > 0);
    if (!target) { u.target = null; target = w.units.find(t => t.team !== u.team && t.team !== 'wild' && t.hp > 0 && distance(u, t) < (u.kind === 'shaman' ? 6 : 3)); }
    if (target && distance(u, target) < (u.kind === 'shaman' ? 6.5 : 'progress' in target ? 3.4 : 2)) {
      if (u.cooldown === 0) { target.hp -= u.kind === 'warrior' ? 17 : u.kind === 'shaman' ? 18 : 6; u.cooldown = u.kind === 'shaman' ? 1.7 : .9; effect(w, 'hit', target); }
    } else if (u.path.length) {
      const next = u.path[0], d = distance(u, next), speed = (u.kind === 'shaman' ? 3.8 : 3.2) * dt;
      if (!walkable(w.terrain, next)) { u.path = []; continue; }
      if (d <= speed) { u.x = next.x; u.z = next.z; u.path.shift(); }
      else { u.x += (next.x - u.x) / d * speed; u.z += (next.z - u.z) / d * speed; }
    } else if (target && u.target !== null) { u.path = findPath(w.terrain, u, target); }
  }
  if (w.time > w.nextRaid) {
    w.nextRaid += 85;
    const victims = w.buildings.filter(b => b.team === 'blue' && b.hp > 0);
    const target = victims[0] ?? blue[0];
    if (target) {
      const raid = w.units.filter(u => u.team === 'red' && u.kind !== 'shaman').slice(0, 6);
      for (const u of raid) { u.kind = 'warrior'; u.hp = Math.max(u.hp, 65); u.target = target.id; u.path = findPath(w.terrain, u, target); }
      if (raid.length) tell(w, 'The Dakini are approaching. Defend your settlement!');
    }
  }
  for (const u of w.units.filter(u => u.hp <= 0 && u.kind === 'shaman')) {
    if (u.team === 'blue' && w.units.some(a => a.team === 'blue' && a.hp > 0)) { w.respawn = 12; tell(w, 'Your shaman has fallen. She will return in 12 seconds.'); }
    if (u.team === 'red' && w.units.some(a => a.team === 'red' && a.hp > 0)) { u.hp = 100; u.x = ENEMY.x; u.z = ENEMY.z; u.path = []; }
  }
  w.units = w.units.filter(u => u.hp > 0); w.buildings = w.buildings.filter(b => b.hp > 0);
  w.selected = w.selected.filter(id => w.units.some(u => u.id === id));
  if (w.respawn > 0) {
    w.respawn = Math.max(0, w.respawn - dt);
    if (w.respawn === 0 && w.units.some(u => u.team === 'blue')) {
      const spawn = walkable(w.terrain, HOME) ? HOME : w.units.find(u => u.team === 'blue')!;
      const shaman = addUnit(w, 'blue', 'shaman', { x: spawn.x, z: spawn.z }); w.selected = [shaman.id]; effect(w, 'birth', shaman);
    }
  }
  if (!w.units.some(u => u.team === 'red') && !w.buildings.some(b => b.team === 'red')) w.status = 'won';
  if (!w.units.some(u => u.team === 'blue') && w.respawn === 0) w.status = 'lost';
}
