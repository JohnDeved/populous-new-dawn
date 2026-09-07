import level from './level-one.ts';
export type Team = 'blue' | 'red' | 'wild';
export type UnitKind = 'shaman' | 'brave' | 'warrior';
export type BuildingKind = 'hut' | 'camp' | 'tower' | 'temple';
export type Spell = 'blast' | 'lightning' | 'bridge';
export type Point = { x: number; z: number };
export type Unit = Point & { id: number; team: Team; kind: UnitKind; hp: number; path: Point[]; target: number | null; cooldown: number; work: number | null; inside: number | null; cargo: number; tree: number | null; timer: number; guard: boolean; lift: number; vx: number; vz: number };
export type Building = Point & { id: number; team: Team; kind: BuildingKind; hp: number; progress: number; timer: number; foundation: number; level: number; logs: number; upgrade: number; angle: number };
export type Shrine = Point & { id: number; kind: 'bridge' | 'lightning' | 'vault'; name: string; progress: number; duration: number; uses: number; active: boolean };
export type Tree = Point & { id: number; logs: number; model: number };
export type Effect = Point & { id: number; kind: Spell | 'birth' | 'hit'; age: number; duration: number };
export const SPELLS: { id: Spell; name: string; cost: number; range: number; key: string; symbol: string; color: string; description: string }[] = [
  { id: 'blast', name: 'Blast', cost: 10, range: 12, key: '1', symbol: '✹', color: '#e8b076', description: 'Rechargeable · throws followers back. Water is deadly.' },
  { id: 'bridge', name: 'Land Bridge', cost: 70, range: 20, key: '2', symbol: '≋', color: '#bbca8a', description: 'Worship the southern stone head. Cast from one shore onto the other.' },
  { id: 'lightning', name: 'Lightning', cost: 80, range: 24, key: '3', symbol: 'ϟ', color: '#c6b8f2', description: 'Four gifts from the central stone head. A direct hit kills a follower.' },
];
export const BUILDINGS: { id: BuildingKind; name: string; cost: number; symbol: string; description: string }[] = [
  { id: 'hut', name: 'Hut', cost: 3, symbol: '⌂', description: 'Three logs. Send braves inside to breed faster and generate more mana.' },
  { id: 'camp', name: 'Warrior Training Hut', cost: 8, symbol: '⚔', description: 'Eight logs. Unlock at the vault, then send braves inside to train with mana.' },
];
const position = (owner: number) => { const o = level.objects.find(o => o.type === 1 && o.model === 7 && o.owner === owner)!; return { x: o.x, z: o.z }; };
export const HOME = position(0), ENEMY = position(1);
export const SIZE = 96, GRID = 97;
export const PLANET_RADIUS = 70;
export function normal(p: Point) { const a=p.x/PLANET_RADIUS,b=p.z/PLANET_RADIUS; return {x:Math.sin(a)*Math.cos(b),y:Math.cos(a)*Math.cos(b),z:Math.sin(b)}; }
export function planetPoint(p:Point,h=0) {const n=normal(p),r=PLANET_RADIUS+h;return {x:n.x*r,y:n.y*r-PLANET_RADIUS,z:n.z*r};}
export function mapPoint(p:{x:number;y:number;z:number}):Point {return {x:Math.atan2(p.x,p.y+PLANET_RADIUS)*PLANET_RADIUS,z:Math.asin(Math.max(-1,Math.min(1,p.z/Math.hypot(p.x,p.y+PLANET_RADIUS,p.z))))*PLANET_RADIUS};}
export function worldPoint(terrain:number[],p:Point) {
  const x=Math.floor(p.x),z=Math.floor(p.z),fx=p.x-x,fz=p.z-z;
  const nodes=fx+fz<=1?[[x,z,1-fx-fz],[x+1,z,fx],[x,z+1,fz]]:[[x+1,z+1,fx+fz-1],[x,z+1,1-fx],[x+1,z,1-fz]];
  return nodes.reduce((v,[x,z,t])=>{const q=planetPoint({x,z},height(terrain,x,z));return {x:v.x+q.x*t,y:v.y+q.y*t,z:v.z+q.z*t};},{x:0,y:0,z:0});
}
export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.z - b.z);
export const maxHp = (kind: UnitKind) => kind === 'shaman' ? 100 : kind === 'warrior' ? 85 : 48;
export const buildingHp = (kind: BuildingKind) => kind === 'hut' ? 170 : 260;
export const housing = (b: Building) => b.level + 2;
export function makeTerrain() {
  const original = new Map(level.heights.map(([x,z,h]) => [z*128+x, h]));
  const sample = (x: number, z: number) => (original.get(((z+128)%128)*128+(x+128)%128) ?? 0) / 45;
  return Array.from({length: GRID*GRID}, (_,i) => {
    const x=(i%GRID-48)/2+4,z=-(Math.floor(i/GRID)-48)/2-4,ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz;
    const h=sample(ix,iz)*(1-fx)*(1-fz)+sample(ix+1,iz)*fx*(1-fz)+sample(ix,iz+1)*(1-fx)*fz+sample(ix+1,iz+1)*fx*fz;
    return h === 0 ? -3 : h;
  });
}
export function height(terrain: number[], x: number, z: number) {
  const gx = Math.max(0, Math.min(95.999, x + 48)), gz = Math.max(0, Math.min(95.999, z + 48));
  const ix = Math.floor(gx), iz = Math.floor(gz), fx = gx - ix, fz = gz - iz;
  const a = terrain[iz * GRID + ix], b = terrain[iz * GRID + ix + 1], c = terrain[(iz + 1) * GRID + ix], d = terrain[(iz + 1) * GRID + ix + 1];
  // Match the rendered triangles, including their diagonal, rather than bilinear interpolation.
  return fx + fz <= 1 ? a + fx * (b - a) + fz * (c - a) : d + (1 - fx) * (c - d) + (1 - fz) * (b - d);
}
export function surface(terrain: number[], p: Point) { return height(terrain,p.x,p.z); }
export const footprint = (kind: BuildingKind) => kind === 'temple' ? 3.9 : 3;
export function footprintPoints(kind: BuildingKind, p: Point) {
  const r = footprint(kind), points: Point[] = [];
  for (let z = Math.floor(p.z - r); z <= Math.ceil(p.z + r); z++) for (let x = Math.floor(p.x - r); x <= Math.ceil(p.x + r); x++) points.push({ x, z });
  return points;
}
export function placementError(w: World, kind: BuildingKind, p: Point) {
  const points = footprintPoints(kind, p), heights = points.map(q => surface(w.terrain, q));
  if (points.some(q => !walkable(w.terrain, q))) return 'The whole building needs dry land, including its fence and doorway.';
  if (Math.max(...heights) - Math.min(...heights) > 2.4) return 'This slope is too steep. Choose a level building site.';
  if(!w.buildings.some(b=>b.team==='blue'&&distance(b,p)<16)&&distance(HOME,p)>16)return 'Build next to your settlement or reincarnation site.';
  if (w.buildings.some(b => Math.abs(b.x - p.x) < footprint(kind) + footprint(b.kind) + 2 && Math.abs(b.z - p.z) < footprint(kind) + footprint(b.kind) + 2)) return 'Leave room around the other buildings and their entrances.';
  if(w.shrines.some(s=>distance(s,p)<footprint(kind)+3))return 'Leave the worship site clear.';
  return null;
}
export function groundBuilding(w: World, b: Building) {
  // Flatten every supporting vertex in rendered space, so curvature cannot leave floating fence posts.
  const points = footprintPoints(b.kind, b);
  b.foundation = points.reduce((sum, p) => sum + surface(w.terrain, p), 0) / points.length;
  for (const p of points) w.terrain[(p.z + 48) * GRID + p.x + 48] = (PLANET_RADIUS+b.foundation)/(normal(b).x*normal(p).x+normal(b).y*normal(p).y+normal(b).z*normal(p).z)-PLANET_RADIUS;
  w.terrainVersion++;
}
export function walkable(terrain: number[], p: Point) { return Math.abs(p.x) < 47 && Math.abs(p.z) < 47 && height(terrain, p.x, p.z) > .45; }
// ponytail: a 49×49 A* grid is enough for this island; use a heap and cached flow fields for hundreds of followers.
export function findPath(terrain: number[], start: Point, end: Point, buildings: Building[] = []): Point[] {
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
      if (buildings.some(b=>b.progress===1&&distance(b,next)<2.35&&distance(b,start)>=2.35) || !walkable(terrain, next) || Math.abs(height(terrain, next.x, next.z) - height(terrain, p.x, p.z)) > 2.8) continue;
      const id = cell(next), cost = costs.get(current)! + 2;
      if (closed.has(id) || cost >= (costs.get(id) ?? Infinity)) continue;
      came.set(id, current); costs.set(id, cost);
      if (!open.includes(id)) open.push(id);
    }
  }
  return [];
}
export type World = {
  terrain: number[]; terrainVersion: number; units: Unit[]; buildings: Building[]; effects: Effect[]; shrines: Shrine[]; trees: Tree[];
  mana: number; wood: number; shots: Record<Spell, number>; charging: boolean; unlockedCamp: boolean;
  time: number; nextId: number; selected: number[]; mode: Spell | BuildingKind | null;
  paused: boolean; speed: number; message: string; messageUntil: number; status: 'playing' | 'won' | 'lost';
  respawn: number; redRespawn: number; stats: { built: number; cast: number; bridges: number; trained: number };
};
function route(w:World,start:Point,end:Point){return findPath(w.terrain,start,end,w.buildings);}
export function addUnit(w: World, team: Team, kind: UnitKind, p: Point) {
  const u: Unit = { x:p.x, z:p.z, id: w.nextId++, team, kind, hp: maxHp(kind), path: [], target: null, cooldown: 0, work: null, inside:null, cargo:0, tree:null, timer:0, guard:false, lift:0, vx:0, vz:0 };
  w.units.push(u); return u;
}
export function addBuilding(w: World, team: Team, kind: BuildingKind, p: Point, complete = true) {
  const b: Building = { x:p.x, z:p.z, id: w.nextId++, team, kind, hp: buildingHp(kind), progress: complete ? 1 : 0, timer: 0, foundation: 0, level: 1, logs: complete ? BUILDINGS.find(b=>b.id===kind)?.cost ?? 0 : 0, upgrade:0, angle:0 };
  groundBuilding(w, b); w.buildings.push(b); return b;
}
export function createWorld(): World {
  const w: World = { terrain: makeTerrain(), terrainVersion: 0, units: [], buildings: [], effects: [], shrines:[], trees:[], mana:0, wood:0, shots:{blast:4,bridge:0,lightning:0}, charging:true, unlockedCamp:false, time: 0, nextId: 1, selected: [], mode: null, paused: false, speed: 1, message: 'Select a brave and send them to the southern stone head to worship for Land Bridge.', messageUntil: 18, status: 'playing', respawn: 0, redRespawn:0, stats: { built: 0, cast: 0, bridges:0, trained:0 } };
  for (const o of level.objects) {
    if (o.type===2 && o.owner!==255) { const b=addBuilding(w,o.owner===0?'blue':'red',o.model===7?'camp':'hut',o); b.level=o.model===3?3:1; b.angle=o.angle/2048*Math.PI*2; if(b.team==='blue')b.timer=35; }
    if (o.type===1) addUnit(w,o.owner===0?'blue':'red',o.model===7?'shaman':o.model===3?'warrior':'brave',o);
    if (o.type===5 && o.model<=6) w.trees.push({id:w.nextId++,x:o.x,z:o.z,logs:4,model:o.model});
    if (o.type===6 && o.model===6) {
      const settings=o.settings!, kind=settings[0]===4?'vault':settings[3]===4?'lightning':'bridge';
      w.shrines.push({id:w.nextId++,x:o.x,z:o.z,kind,name:kind==='vault'?'Vault of Knowledge':kind==='bridge'?'Land Bridge stone head':'Lightning stone head',progress:0,duration:(settings[26]+settings[27]*256)/4,uses:0,active:true});
    }
  }
  w.selected=[w.units.find(u=>u.team==='blue'&&u.kind==='shaman')!.id];
  w.wood=w.trees.reduce((s,t)=>s+Math.floor(t.logs),0);
  return w;
}
export function tell(w: World, message: string) { w.message = message; w.messageUntil = w.time + 9; }
export function effect(w: World, kind: Effect['kind'], p: Point) { w.effects.push({ x:p.x,z:p.z,kind,id:w.nextId++,age:0,duration:kind==='bridge'?5:1.7 }); }
export function select(w: World, kind: UnitKind | 'all') { w.selected=w.units.filter(u=>u.team==='blue'&&(kind==='all'||u.kind===kind)).map(u=>u.id); w.mode=null; }
function release(u: Unit) { u.work=null; u.inside=null; u.tree=null; u.target=null; u.guard=false; u.timer=0; }
function entrance(w: World, b: Point, radius=4) {
  return Array.from({length:16},(_,i)=>({x:b.x+Math.sin(i*Math.PI/8+('angle' in b?Number(b.angle):0))*radius,z:b.z+Math.cos(i*Math.PI/8+('angle' in b?Number(b.angle):0))*radius})).find(p=>walkable(w.terrain,p)) ?? b;
}
export function command(w: World, p: Point) {
  if(w.paused||w.status!=='playing')return;
  const shrine=w.shrines.find(s=>s.active&&distance(s,p)<3), building=w.buildings.find(b=>distance(b,p)<3.1);
  const enemy=w.units.find(u=>u.team==='red'&&distance(u,p)<1.5) ?? (building?.team==='red'?building:undefined);
  const friendly=building?.team==='blue'?building:undefined;
  let count=0;
  for(const u of w.units.filter(u=>w.selected.includes(u.id))) {
    if(shrine && shrine.kind==='vault' && u.kind!=='shaman')continue;
    if(friendly && u.kind!=='brave')continue;
    const goal=shrine?entrance(w,shrine,2):friendly?entrance(w,friendly):enemy&&'progress' in enemy?entrance(w,enemy):enemy??p;
    const path=route(w,u,goal); if(!path.length)continue;
    release(u); u.path=path; u.work=shrine?.id??friendly?.id??null; u.target=enemy?.id??null; count++;
  }
  tell(w,count ? shrine?`Worshipping ${shrine.name}. ${shrine.kind==='vault'?'Only your shaman can learn its secrets.':'One follower is enough.'}`:friendly?friendly.progress<1?'Braves assigned to construction.':friendly.kind==='camp'?'Braves sent to train as warriors.':'Braves sent to live in the hut.':enemy?'Your followers march to battle.':'Your followers are on the move.':shrine?.kind==='vault'?'Select your shaman to worship the Vault of Knowledge.':'No land route. Bring your shaman to the shore and make a Land Bridge.');
}
export function guardShaman(w:World) { const shaman=w.units.find(u=>u.team==='blue'&&u.kind==='shaman');if(!shaman)return; for(const u of w.units.filter(u=>w.selected.includes(u.id)&&u.kind!=='shaman')){const guard=!u.guard;release(u);u.guard=guard;}tell(w,'Selected followers will guard your shaman.'); }
export function placeBuilding(w: World, kind: BuildingKind, p: Point) {
  if(w.paused||w.status!=='playing')return false;
  const spec=BUILDINGS.find(b=>b.id===kind);
  if(!spec || kind==='camp'&&!w.unlockedCamp){tell(w,'Your shaman must discover the Warrior Training Hut at the vault.');return false;}
  const error=placementError(w,kind,p);if(error){tell(w,error);return false;}
  const workers=w.units.filter(u=>u.team==='blue'&&u.kind==='brave'&&u.work===null).sort((a,b)=>distance(a,p)-distance(b,p)).map(u=>({u,path:route(w,u,p)})).filter(a=>a.path.length).slice(0,3);
  if(!workers.length){tell(w,'A free brave must be able to reach the building site.');return false;}
  const b=addBuilding(w,'blue',kind,p,false);
  for(const {u} of workers){release(u);u.work=b.id;u.path=route(w,u,entrance(w,b));}
  w.mode=null;tell(w,`${spec.name} planned. Braves will fetch ${spec.cost} logs from nearby trees.`);return true;
}
export function cast(w: World, spell: Spell, p: Point) {
  if(w.paused||w.status!=='playing')return false;
  const spec=SPELLS.find(s=>s.id===spell),shaman=w.units.find(u=>u.team==='blue'&&u.kind==='shaman');
  if(!spec)return false;
  if(!shaman){tell(w,'Your shaman is reincarnating.');return false;}
  if(w.shots[spell]<=0){tell(w,spell==='blast'?'Blast is charging. Braves working or inside huts generate more mana.':'Worship the stone head to receive this spell.');return false;}
  if(distance(shaman,p)>spec.range){tell(w,'Beyond your reach. Move your shaman closer.');return false;}
  if(Math.abs(p.x)>45||Math.abs(p.z)>45){tell(w,'Choose a target within the world.');return false;}
  if(spell==='bridge'&&(!walkable(w.terrain,p)||!walkable(w.terrain,shaman))){tell(w,'Land Bridge must join two dry shores. Aim at land on the opposite island.');return false;}
  w.shots[spell]--;w.stats.cast++;w.mode=null;effect(w,spell,p);
  if(spell==='bridge') {
    const length=distance(shaman,p),start=height(w.terrain,shaman.x,shaman.z),end=height(w.terrain,p.x,p.z);
    for(let i=0;i<w.terrain.length;i++) {
      const q={x:i%GRID-48,z:Math.floor(i/GRID)-48};
      const t=Math.max(0,Math.min(1,((q.x-shaman.x)*(p.x-shaman.x)+(q.z-shaman.z)*(p.z-shaman.z))/Math.max(.01,length*length)));
      const d=distance(q,{x:shaman.x+(p.x-shaman.x)*t,z:shaman.z+(p.z-shaman.z)*t});
      if(d<3 && !w.buildings.some(b=>Math.abs(b.x-q.x)<=footprint(b.kind)+1&&Math.abs(b.z-q.z)<=footprint(b.kind)+1))w.terrain[i]=Math.max(w.terrain[i],Math.max(1.4,start*(1-t)+end*t)*(1-Math.max(0,d-2)*.55));
    }
    w.stats.bridges++;w.terrainVersion++;
    if(route(w,HOME,ENEMY).length)w.shrines.find(s=>s.kind==='bridge')!.active=false;
    tell(w,'The earth rises. Lead your followers across the new Land Bridge.');
  } else { damageSpell(w,spell,p,shaman);tell(w,`${spec.name}! The world bends to your will.`); }
  return true;
}
function damageSpell(w:World,spell:'blast'|'lightning',p:Point,caster:Unit) {
  const radius=spell==='blast'?3:3.6;
  for(const u of w.units)if(!u.inside&&u.id!==caster.id&&distance(u,p)<radius) {
    const direct=distance(u,p)<1.3,damage=spell==='lightning'?(direct?120:65):52;
    u.hp-=damage*(u.team===caster.team?.5:1);
    const dx=distance(u,p)<.2?p.x-caster.x:u.x-p.x,dz=distance(u,p)<.2?p.z-caster.z:u.z-p.z,d=Math.hypot(dx,dz)||1;
    u.vx=dx/d*4;u.vz=dz/d*4;u.lift=1;u.path=[];u.inside=null;
  }
  for(const b of w.buildings)if(distance(b,p)<radius+1.5)b.hp-=spell==='lightning'?57:20;
}
export function manaRate(w:World) {return w.units.filter(u=>u.team==='blue').reduce((n,u)=>n+(u.kind==='shaman'?66.6:u.kind==='brave'&&(u.work!==null||u.inside!==null)?34.6:u.kind==='warrior'&&u.path.length?11.3:9.1)/60,0);}
export function tick(w: World, dt: number) {
  if(w.paused||w.status!=='playing')return;w.time+=dt;
  for(const fx of w.effects)fx.age+=dt;w.effects=w.effects.filter(f=>f.age<f.duration);
  for(const t of w.trees)if(t.logs>0&&t.logs<4)t.logs=Math.min(4,t.logs+dt*.025);
  w.wood=w.trees.reduce((s,t)=>s+Math.floor(t.logs),0);
  for(const shrine of w.shrines) {
    if(!shrine.active)continue;
    const worshippers=w.units.filter(u=>u.hp>0&&u.work===shrine.id&&distance(u,shrine)<3&&(!u.path.length)&&u.lift===0);
    if(!worshippers.length || shrine.kind==='bridge'&&w.shots.bridge>=4)continue;
    shrine.progress+=dt/shrine.duration;
    if(shrine.progress>=1){shrine.progress=0;shrine.uses++;effect(w,'birth',shrine);
      if(shrine.kind==='vault'){w.unlockedCamp=true;shrine.active=false;tell(w,'Knowledge discovered: build a Warrior Training Hut, then send braves inside.');}
      else{w.shots[shrine.kind]++;if(shrine.kind==='lightning'&&shrine.uses===4)shrine.active=false;tell(w,`${shrine.kind==='bridge'?'Land Bridge':'Lightning'} received. ${w.shots[shrine.kind]} shots ready.`);}
    }
  }
  const training=w.buildings.filter(b=>b.team==='blue'&&b.kind==='camp'&&b.progress===1&&w.units.some(u=>u.inside===b.id&&u.kind==='brave'));
  const charging=w.charging&&w.shots.blast<4,mana=manaRate(w)*dt;
  if(charging){w.mana+=mana*(training.length?.5:1);if(w.mana>=10){w.mana-=10;w.shots.blast++;}if(w.shots.blast===4)w.mana=0;}
  for(const b of w.buildings) {
    if(b.hp<=0)continue;
    const inhabitants=w.units.filter(u=>u.inside===b.id&&u.hp>0);
    if(b.progress<1){
      const cost=BUILDINGS.find(s=>s.id===b.kind)!.cost;
      const workers=w.units.filter(u=>u.work===b.id&&u.hp>0);
      for(const u of workers) {
        if(u.cargo&&distance(u,b)<=4.2&&!u.path.length){b.logs+=u.cargo;u.cargo=0;u.tree=null;}
        if(b.logs+workers.reduce((n,a)=>n+(a.cargo||a.tree!==null?1:0),0)<cost&&!u.cargo&&u.tree===null){
          const tree=w.trees.filter(t=>t.logs>=1).sort((a,c)=>distance(a,u)-distance(c,u)).find(t=>route(w,u,t).length);
          if(tree){u.tree=tree.id;u.path=route(w,u,tree);u.timer=0;}
        }
        if(u.tree!==null&&!u.cargo){const tree=w.trees.find(t=>t.id===u.tree)!;if(distance(u,tree)<1&&!u.path.length){u.timer+=dt;if(u.timer>=2){if(tree.logs>=1){tree.logs--;u.cargo=1;}else u.tree=null;u.timer=0;u.path=route(w,u,entrance(w,b));}}}
      }
      if(b.logs>=cost)b.progress=Math.min(1,b.progress+workers.filter(u=>distance(u,b)<=4.2&&!u.path.length).length*dt/12);
      if(b.progress===1){w.stats.built++;for(const u of workers){release(u);u.path=[];const p=entrance(w,b,4);u.x=p.x;u.z=p.z;}tell(w,`${BUILDINGS.find(s=>s.id===b.kind)!.name} completed.`);}
      continue;
    }
    if(b.kind==='camp') {
      const trainee=inhabitants.find(u=>u.kind==='brave');
      if(trainee){b.timer+=b.team==='blue'?mana*(charging?.5:1)/Math.max(1,training.length):dt; if(b.timer>=20){trainee.kind='warrior';trainee.hp=maxHp('warrior');release(trainee);const p=entrance(w,b,4);trainee.x=p.x;trainee.z=p.z;b.timer=0;if(b.team==='blue')w.stats.trained++;effect(w,'birth',trainee);}}
    } else if(b.kind==='hut') {
      b.timer+=dt*(.5+inhabitants.length*.5);
      // ponytail: birth/upgrade timing is scaled for this small browser mission; use the original turn scheduler for frame-identical simulation.
      if(b.timer>=38&&w.units.filter(u=>u.team===b.team).length<200){b.timer=0;const u=addUnit(w,b.team,'brave',entrance(w,b,4));effect(w,'birth',u);if(inhabitants.length<housing(b)){u.work=b.id;u.inside=b.id;} }
      if(inhabitants.length&&b.level<3){b.upgrade+=dt*inhabitants.length;if(b.upgrade>=180){b.upgrade=0;b.level++;}}
    }
  }
  for(const u of w.units) {
    if(u.hp<=0)continue;u.cooldown=Math.max(0,u.cooldown-dt);
    if(u.lift>0){u.x+=u.vx*dt;u.z+=u.vz*dt;u.lift=Math.max(0,u.lift-dt);if(!u.lift&&!walkable(w.terrain,u))u.hp=0;continue;}
    if(!walkable(w.terrain,u)){u.hp=0;continue;}
    const work=w.buildings.find(b=>b.id===u.work&&b.hp>0)??w.shrines.find(s=>s.id===u.work&&s.active);
    if(u.work!==null&&!work)release(u);
    if(u.inside!==null){const b=w.buildings.find(b=>b.id===u.inside&&b.hp>0);if(b)continue;release(u);u.hp-=10;}
    if(work&&'kind' in work&&'hp' in work&&work.progress===1&&!u.path.length&&distance(u,work)<=4.2){const capacity=work.kind==='hut'?housing(work):8;if(w.units.filter(a=>a.inside===work.id).length<capacity){u.inside=work.id;continue;}}
    let target:Unit|Building|undefined=u.target===null?undefined:[...w.units,...w.buildings].find(t=>t.id===u.target&&t.hp>0);
    if(!target){u.target=null;target=w.units.find(t=>t.team!==u.team&&t.team!=='wild'&&t.hp>0&&!t.inside&&distance(u,t)<(u.team==='red'?8:3));}
    if(target&&u.team==='red'&&u.kind==='shaman'&&distance(u,target)<12){if(!u.cooldown){damageSpell(w,'blast',target,u);effect(w,'blast',target);u.cooldown=6;}continue;}
    if(target&&distance(u,target)<('progress' in target?4.3:1.7)){
      if(!u.cooldown){target.hp-=u.kind==='warrior'?17:6;u.cooldown=.9;effect(w,'hit',target);}continue;
    }
    if(target&&u.target===null&&u.team==='red'&&!u.work){u.target=target.id;u.path=route(w,u,target);}
    if(u.guard&&!u.path.length){const shaman=w.units.find(a=>a.team===u.team&&a.kind==='shaman');if(shaman&&distance(u,shaman)>3)u.path=route(w,u,entrance(w,shaman,2));}
    if(u.path.length){const next=u.path[0],d=distance(u,next),step=(u.kind==='shaman'?3.8:3.2)*dt;if(!walkable(w.terrain,next)){u.path=[];continue;}if(d<=step){u.x=next.x;u.z=next.z;u.path.shift();}else{u.x+=(next.x-u.x)/d*step;u.z+=(next.z-u.z)/d*step;}}
    else if(target&&u.target!==null)u.path=route(w,u,'progress' in target?entrance(w,target):target);
  }
  for(const u of w.units.filter(u=>u.hp<=0&&u.kind==='shaman'))if(w.units.some(a=>a.team===u.team&&a.hp>0)){if(u.team==='blue'){w.respawn=12;tell(w,'Your shaman will reincarnate in 12 seconds.');}else w.redRespawn=12;}
  w.units=w.units.filter(u=>u.hp>0);w.buildings=w.buildings.filter(b=>b.hp>0);w.selected=w.selected.filter(id=>w.units.some(u=>u.id===id));
  for(const team of ['blue','red'] as const){const key=team==='blue'?'respawn':'redRespawn';if(w[key]>0){w[key]=Math.max(0,w[key]-dt);if(w[key]===0&&w.units.some(u=>u.team===team)){const u=addUnit(w,team,'shaman',team==='blue'?HOME:ENEMY);if(team==='blue'&&!w.selected.length)w.selected=[u.id];effect(w,'birth',u);}}}
  if(!w.units.some(u=>u.team==='red')){w.redRespawn=0;w.status='won';}
  if(!w.units.some(u=>u.team==='blue')){w.respawn=0;w.status='lost';}
}
