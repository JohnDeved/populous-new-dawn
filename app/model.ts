import level from './level-one.ts';
import constants from './original-constants.json' with { type: 'json' };
import rules from './original-rules.json' with { type: 'json' };
export type Team = 'blue' | 'red' | 'wild';
export type UnitKind = 'shaman' | 'brave' | 'warrior';
export type BuildingKind = 'hut' | 'camp' | 'tower' | 'temple';
export type Spell = 'blast' | 'lightning' | 'bridge';
export type Point = { x: number; z: number };
type Fight = { group: number; opponent: number; action: 'approach'|'ready'|'attack'|'strike'|'special'|'recoil'|'push'; started: number; until: number; knockback?: boolean; velocity?: Point };
type Battle = Point & { id: number; members: number[]; angle: number };
export type Unit = Point & { id: number; team: Team; kind: UnitKind; hp: number; path: Point[]; target: number | null; cooldown: number; work: number | null; inside: number | null; cargo: number; tree: number | null; timer: number; guard: boolean; lift: number; vx: number; vz: number; idleTurns: number; heading: number; fighting: boolean; fight: Fight|null; casting: {spell: Spell; point: Point; remaining: number} | null };
export type Building = Point & { id: number; team: Team; kind: BuildingKind; hp: number; progress: number; timer: number; foundation: number; level: number; logs: number; upgrade: number; upgrading: boolean; angle: number };
export type Shrine = Point & { id: number; kind: 'bridge' | 'lightning' | 'vault'; name: string; progress: number; duration: number; uses: number; active: boolean };
export type Tree = Point & { id: number; logs: number; model: number };
export type Effect = Point & { id: number; kind: Spell | 'birth' | 'hit' | 'death' | 'splash'; age: number; duration: number; unit?: Pick<Unit,'team'|'kind'|'heading'>; land?: {index:number;from:number;to:number}[] };
export const TURNS_PER_SECOND=12;
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
export const maxHp = (kind: UnitKind) => (kind === 'shaman' ? constants.LIFE_SHAMEN : kind === 'warrior' ? constants.LIFE_WARR : constants.LIFE_BRAVE)/20;
export const buildingHp = (kind: BuildingKind) => kind === 'hut' ? 170 : 260;
export const housing = (b: Building) => b.kind==='hut'?rules.hutCapacity[b.level-1]:1;
export function population(w:World,team:Team){return 1+w.units.filter(u=>u.team===team&&u.kind!=='shaman'&&u.hp>0).length;}
export function populationLimit(w:World,team:Team){return Math.min(200,6+w.buildings.filter(b=>b.team===team&&b.kind==='hut'&&b.progress===1&&b.hp>0).reduce((sum,b)=>sum+[constants.MAX_POP_VALUE__HUT_1,constants.MAX_POP_VALUE__HUT_2,constants.MAX_POP_VALUE__HUT_3][b.level-1],0));}
export function breedingWork(w:World,b:Building){return Math.floor(rules.hutBreedingWork[b.level-1]*rules.breedingBands[Math.min(19,Math.floor(population(w,b.team)/10))]/256);}
export function trainingCost(w:World,team:Team){const count=w.units.filter(u=>u.team===team&&u.kind==='warrior'&&u.hp>0).length,band=count<16?Math.floor(count/4):count<21?4:5;return Math.floor((team==='blue'?constants.HUMAN_TRAIN_MANA_WARR:constants.CP_TRAIN_MANA_WARR)*rules.trainingBands[band]/256);}
export function meleeDamage(u:Unit){const base=u.kind==='warrior'?constants.FIGHT_DAMAGE_WARR:u.kind==='shaman'?constants.FIGHT_DAMAGE_SHAMAN:constants.FIGHT_DAMAGE_BRAVE;return Math.max(32,Math.floor(base*u.hp/maxHp(u.kind)))/20;}
// 0x586074: integer octant lookup. Input Z is already reflected from the native map.
export function nativeAngle(dx:number,dz:number){
  const x=Math.abs(dx),z=Math.abs(dz);if(!x&&!z)return 0;
  const a=rules.atan[Math.floor(Math.min(x,z)*256/Math.max(x,z))];
  return (dx>=0?dz<0?(x<z?a:512-a):(x<z?1024-a:512+a):dz<0?(x<z?2048-a:1536+a):(x<z?1024+a:1536-a))&2047;
}
// 0x4e6a70: signed high word of a 16.16 sine product, then reflect native Y.
export function nativeStep(p:Point,angle:number,length:number):Point{
  return {x:(Math.round(p.x*256)+Math.floor(rules.sine[angle&2047]*length/65536))/256,z:(Math.round(p.z*256)-Math.floor(rules.sine[(angle+512)&2047]*length/65536))/256};
}
export function random(w:World){const n=(Math.imul(w.randomState,0x24a1)+0x24df)>>>0;return w.randomState=((n>>>13)|(n<<19))>>>0;}
function meleeExchange(w:World,u:Unit,target:Unit,choice:number){
  // 0x518fb0 states 2/3/4; 0x4a39c0 calculates both damages before applying either.
  const action=u.kind==='shaman'?(choice<=6?'attack':'special'):choice<=4?'attack':choice<14?'special':'strike';
  const damage=meleeDamage(u),counter=meleeDamage(target),turns=u.kind==='shaman'?(action==='special'?5:4):action==='attack'?6:7;
  u.heading=Math.PI-nativeAngle(Math.round((target.x-u.x)*256),Math.round((target.z-u.z)*256))*Math.PI/1024;target.heading=u.heading+Math.PI;
  u.fight={group:u.fight!.group,opponent:target.id,action,started:w.turn,until:w.turn+turns};
  const knockback=action==='attack'&&target.kind!=='shaman';
  target.fight={group:target.fight!.group,opponent:u.id,action:'recoil',started:w.turn,until:w.turn+(knockback?4:7),knockback};
  target.hp=Math.max(0,(Math.round(target.hp*20)-Math.round(damage*20))/20);
  if(action!=='special')u.hp=Math.max(0,(Math.round(u.hp*20)-Math.round(counter*20))/20);
  effect(w,'hit',target);if(action!=='special')effect(w,'hit',u);
}
const unitSpeed=(u:Unit)=>u.kind==='shaman'?constants.MEDICINE_MAN_SPEED:u.kind==='warrior'?constants.WARRIOR_SPEED:constants.BRAVE_SPEED;
export function fightPosition(b:Battle,index:number){return index===0?{x:b.x,z:b.z}:nativeStep(b,b.angle+(b.members.length===3?[0,0,512][index]:[0,0,682,1365][index]),180);}
function joinBattle(w:World,u:Unit,target:Unit){
  let b=w.fights.find(b=>b.id===target.fight?.group);
  if(b){
    if(b.members.length>=4)return;
    const center=w.units.find(a=>a.id===b!.members[0])!;
    if(u.team===center.team){if(b.members.length!==2)return;b.members.reverse();b.x=target.x;b.z=target.z;b.angle=(b.angle+1024)&2047;}
    b.members.push(u.id);
  }else{
    b={id:w.nextId++,members:[u.id,target.id],x:u.x,z:u.z,angle:nativeAngle(Math.round((target.x-u.x)*256),Math.round((target.z-u.z)*256))};w.fights.push(b);
    release(target);target.path=[];target.fight={group:b.id,opponent:u.id,action:'approach',started:w.turn,until:0};
  }
  release(u);u.path=[];u.fight={group:b.id,opponent:target.id,action:'approach',started:w.turn,until:0};
}
function cleanBattles(w:World){
  for(const b of w.fights){
    b.members=b.members.filter(id=>w.units.some(u=>u.id===id&&u.hp>0&&u.lift===0&&u.inside===null&&u.fight?.group===b.id));
    const members=b.members.map(id=>w.units.find(u=>u.id===id)!);
    if(members.length<2||members.every(u=>u.team===members[0].team)){for(const u of members)u.fight=null;b.members=[];}
  }
  w.fights=w.fights.filter(b=>b.members.length>1);
}
function processBattles(w:World){
  cleanBattles(w);
  for(const b of w.fights){
    const members=b.members.map(id=>w.units.find(u=>u.id===id)!);
    // 0x5199f0: the outnumbered tribe supplies the center of a three/four-person fight.
    if(members.length>2){const center=members.findIndex(u=>members.filter(a=>a.team===u.team).length===1);if(center>0){[members[0],members[center]]=[members[center],members[0]];b.members=members.map(u=>u.id);b.x=members[0].x;b.z=members[0].z;b.angle=(b.angle+1024)&2047;}}
    if((w.turn&31)===0&&(random(w)&1)===0){const r=random(w)%341+113;b.angle=(b.angle+(r&1?-r:r))&2047;}
    // ponytail: dry, clear slots approximate 0x519d10's native cell search; terrain-mask relocation remains unported.
    const clear=(p:Point)=>walkable(w.terrain,p)&&!w.buildings.some(h=>h.hp>0&&h.progress===1&&distance(h,p)<2.35);
    if(!b.members.every((_,i)=>clear(fightPosition(b,i)))){
      const candidates=[{x:b.x,z:b.z},...Array.from({length:24},(_,i)=>({x:b.x+Math.sin(i*Math.PI/4)*(1+Math.floor(i/8))*2,z:b.z+Math.cos(i*Math.PI/4)*(1+Math.floor(i/8))*2}))];
      const p=candidates.find(p=>b.members.every((_,i)=>clear(fightPosition({...b,...p},i))));
      if(!p){for(const u of members)u.fight=null;b.members=[];continue;}b.x=p.x;b.z=p.z;
    }
    for(let i=0;i<members.length;i++){
      const u=members[i],f=u.fight!;if(u.hp<=0)continue;
      if(f.action==='recoil'&&w.turn>=f.until&&f.knockback){
        const angle=(Math.round((Math.PI-u.heading)*1024/Math.PI)+1024)&2047,speed=random(w)%70+35;
        // 0x4e93f0: on level ground the impulse includes floor(speed/16).
        const p=nativeStep({x:0,z:0},angle,speed+(speed>>4));f.velocity={x:p.x*256,z:p.z*256};f.action='push';f.started=w.turn;f.until=w.turn+2;
        u.x+=p.x;u.z+=p.z;
      }
      if(f.action==='push'){
        const v=f.velocity!;v.x=Math.sign(v.x)*Math.max(0,Math.abs(v.x)-rules.groundFriction);v.z=Math.sign(v.z)*Math.max(0,Math.abs(v.z)-rules.groundFriction);
        // ponytail: ground recoil uses native damping; airborne falls and slope forces need the full physics port.
        const p={x:u.x+v.x/256,z:u.z+v.z/256};if(clear(p)){u.x=p.x;u.z=p.z;}else{v.x=0;v.z=0;}
        if(w.turn<f.until)continue;f.action='approach';
      }else if(f.action!=='approach'&&f.action!=='ready'){if(w.turn<f.until)continue;f.action='approach';}
      const p=fightPosition(b,i),dx=Math.round((p.x-u.x)*256),dz=Math.round((p.z-u.z)*256);
      if(Math.abs(dx)>11||Math.abs(dz)>11){
        f.action='approach';const angle=nativeAngle(dx,dz),next=nativeStep(u,angle,Math.min(unitSpeed(u),Math.floor(Math.hypot(dx,dz))));
        if(clear(next)){u.x=next.x;u.z=next.z;}u.heading=Math.PI-angle*Math.PI/1024;continue;
      }
      u.x=p.x;u.z=p.z;f.action='ready';
      const choice=random(w)&15,target=i===0?members[1+random(w)%(members.length-1)]:members[0];
      if(target.hp<=0||target.fight?.action!=='ready')continue;
      meleeExchange(w,u,target,choice);
    }
  }
  w.fights=w.fights.filter(b=>b.members.length>1);
}
export function unitAnimation(w:World,u:Unit){
  if(u.lift>0)return 'airborne';
  if(u.casting)return 'cast';
  if(u.fight)return u.fight.action==='approach'?'walk':u.fight.action==='ready'?'idle':u.fight.action==='push'?'walk':u.fight.action;
  if(u.fighting)return 'attack';
  if(u.path.length)return u.cargo?'carry':'walk';
  if(u.cargo)return 'carryIdle';
  if(u.tree!==null&&u.timer>0)return 'chop';
  if(w.shrines.some(s=>s.id===u.work&&s.active&&distance(s,u)<3))return 'pray';
  if(w.buildings.some(b=>b.id===u.work&&b.progress<1&&b.logs>=(BUILDINGS.find(s=>s.id===b.kind)?.cost??Infinity)&&distance(b,u)<=4.2))return 'work';
  return w.selected.includes(u.id)?'selected':'idle';
}
export function makeTerrain() {
  const original = new Map(level.heights.map(([x,z,h]) => [z*128+x, h]));
  const sample = (x: number, z: number) => (original.get(((z+128)%128)*128+(x+128)%128) ?? 0) / 45;
  return Array.from({length: GRID*GRID}, (_,i) => {
    const x=(i%GRID-48)/2+4,z=-(Math.floor(i/GRID)-48)/2-4,ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz;
    const h=sample(ix,iz)*(1-fx)*(1-fz)+sample(ix+1,iz)*fx*(1-fz)+sample(ix,iz+1)*(1-fx)*fz+sample(ix+1,iz+1)*fx*fz;
    // Keep the sea bed just below zero so original coast ramps meet the water without artificial cliffs.
    return h === 0 ? -.35 : h;
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
  terrain: number[]; terrainVersion: number; units: Unit[]; buildings: Building[]; effects: Effect[]; shrines: Shrine[]; trees: Tree[]; fights: Battle[];
  mana: number; wood: number; shots: Record<Spell, number>; charging: boolean; unlockedCamp: boolean;
  time: number; turn: number; pendingTime: number; randomState: number; nextId: number; selected: number[]; mode: Spell | BuildingKind | null;
  paused: boolean; speed: number; message: string; messageUntil: number; status: 'playing' | 'won' | 'lost';
  respawn: number; redRespawn: number; stats: { built: number; cast: number; bridges: number; trained: number };
};
function route(w:World,start:Point,end:Point){return findPath(w.terrain,start,end,w.buildings);}
export function addUnit(w: World, team: Team, kind: UnitKind, p: Point) {
  const u: Unit = { x:p.x, z:p.z, id: w.nextId++, team, kind, hp: maxHp(kind), path: [], target: null, cooldown: 0, work: null, inside:null, cargo:0, tree:null, timer:0, guard:false, lift:0, vx:0, vz:0,idleTurns:0,heading:Math.PI,fighting:false,fight:null,casting:null };
  w.units.push(u); return u;
}
export function addBuilding(w: World, team: Team, kind: BuildingKind, p: Point, complete = true) {
  const b: Building = { x:p.x, z:p.z, id: w.nextId++, team, kind, hp: buildingHp(kind), progress: complete ? 1 : 0, timer: 0, foundation: 0, level: 1, logs: complete ? BUILDINGS.find(b=>b.id===kind)?.cost ?? 0 : 0, upgrade:0, upgrading:false, angle:0 };
  groundBuilding(w, b); w.buildings.push(b); return b;
}
export function createWorld(): World {
  const w: World = { terrain: makeTerrain(), terrainVersion: 0, units: [], buildings: [], effects: [], shrines:[], trees:[], fights:[], mana:0, wood:0, shots:{blast:4,bridge:0,lightning:0}, charging:true, unlockedCamp:false, time: 0, turn:0, pendingTime:0, randomState:1, nextId: 1, selected: [], mode: null, paused: false, speed: 1, message: 'Select a brave and send them to the southern stone head to worship for Land Bridge.', messageUntil: 18, status: 'playing', respawn: 0, redRespawn:0, stats: { built: 0, cast: 0, bridges:0, trained:0 } };
  for (const o of level.objects) {
    if (o.type===2 && o.owner!==255) { const b=addBuilding(w,o.owner===0?'blue':'red',o.model===7?'camp':'hut',o); b.level=o.model===3?3:1; b.angle=o.angle/2048*Math.PI*2; }
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
export function effect(w: World, kind: Effect['kind'], p: Point) { const f:Effect={ x:p.x,z:p.z,kind,id:w.nextId++,age:0,duration:kind==='bridge'?constants.LAND_BRIDGE_DURATION/TURNS_PER_SECOND:kind==='hit'?.5:kind==='blast'?1.2:1.7 };w.effects.push(f);return f; }
export function select(w: World, kind: UnitKind | 'all') { w.selected=w.units.filter(u=>u.team==='blue'&&(kind==='all'||u.kind===kind)).map(u=>u.id); w.mode=null; }
function release(u: Unit) { u.work=null; u.inside=null; u.tree=null; u.target=null; u.guard=false; u.timer=0; u.casting=null;u.fighting=false;u.fight=null;u.idleTurns=0; }
export function entrance(w: World, b: Point, radius=4) {
  const angle='angle' in b?Number(b.angle):0;
  // Native model doors face -Z. Reflect both the model and the native map coordinates.
  if('angle' in b)return {x:b.x-Math.sin(angle)*radius,z:b.z+Math.cos(angle)*radius};
  return Array.from({length:16},(_,i)=>({x:b.x+Math.sin(i*Math.PI/8)*radius,z:b.z+Math.cos(i*Math.PI/8)*radius})).find(p=>walkable(w.terrain,p)) ?? b;
}
export function command(w: World, p: Point) {
  if(w.paused||w.status!=='playing')return;
  const shrine=w.shrines.find(s=>s.active&&distance(s,p)<3), building=w.buildings.find(b=>distance(b,p)<3.1);
  const enemy=w.units.find(u=>u.team==='red'&&u.inside===null&&u.lift===0&&distance(u,p)<1.5) ?? (building?.team==='red'?building:undefined);
  const friendly=building?.team==='blue'?building:undefined;
  let count=0;
  for(const u of w.units.filter(u=>w.selected.includes(u.id))) {
    if(shrine && shrine.kind==='vault' && u.kind!=='shaman')continue;
    if(friendly && (friendly.kind!=='hut'||friendly.progress<1) && u.kind!=='brave')continue;
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
  const selected=w.units.filter(u=>u.team==='blue'&&u.kind==='brave'&&w.selected.includes(u.id));
  const workers=(selected.length?selected:w.units.filter(u=>u.team==='blue'&&u.kind==='brave'&&(u.work===null||u.inside!==null))).sort((a,b)=>distance(a,p)-distance(b,p)).map(u=>({u,path:route(w,u,p)})).filter(a=>a.path.length).slice(0,3);
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
  if(shaman.lift>0||shaman.casting){tell(w,'Your shaman must finish her current action.');return false;}
  if(w.shots[spell]<=0){tell(w,spell==='blast'?'Blast is charging. Braves working or inside huts generate more mana.':'Worship the stone head to receive this spell.');return false;}
  if(distance(shaman,p)>spec.range){tell(w,'Beyond your reach. Move your shaman closer.');return false;}
  if(Math.abs(p.x)>45||Math.abs(p.z)>45){tell(w,'Choose a target within the world.');return false;}
  if(spell==='bridge'&&(!walkable(w.terrain,p)||!walkable(w.terrain,shaman))){tell(w,'Land Bridge must join two dry shores. Aim at land on the opposite island.');return false;}
  release(shaman);shaman.path=[];shaman.heading=Math.atan2(p.x-shaman.x,p.z-shaman.z);
  shaman.casting={spell,point:{...p},remaining:6/TURNS_PER_SECOND};w.mode=null;
  return true;
}
function finishCast(w:World,shaman:Unit,spell:Spell,p:Point){
  if(shaman.team==='blue'){w.shots[spell]--;w.stats.cast++;}const fx=effect(w,spell,p);
  if(spell==='bridge') {
    fx.land=[];
    const length=distance(shaman,p),start=height(w.terrain,shaman.x,shaman.z),end=height(w.terrain,p.x,p.z);
    for(let i=0;i<w.terrain.length;i++) {
      const q={x:i%GRID-48,z:Math.floor(i/GRID)-48};
      const t=Math.max(0,Math.min(1,((q.x-shaman.x)*(p.x-shaman.x)+(q.z-shaman.z)*(p.z-shaman.z))/Math.max(.01,length*length)));
      const d=distance(q,{x:shaman.x+(p.x-shaman.x)*t,z:shaman.z+(p.z-shaman.z)*t});
      if(d<3 && !w.buildings.some(b=>Math.abs(b.x-q.x)<=footprint(b.kind)+1&&Math.abs(b.z-q.z)<=footprint(b.kind)+1)){const to=Math.max(w.terrain[i],Math.max(1.4,start*(1-t)+end*t)*(1-Math.max(0,d-2)*.55));if(to>w.terrain[i])fx.land.push({index:i,from:w.terrain[i],to});}
    }
    w.stats.bridges++;w.terrainVersion++;
    tell(w,'The earth rises. Lead your followers across the new Land Bridge.');
  } else { damageSpell(w,spell,p,shaman);if(shaman.team==='blue')tell(w,`${SPELLS.find(s=>s.id===spell)!.name}! The world bends to your will.`); }
}
function damageSpell(w:World,spell:'blast'|'lightning',p:Point,caster:Unit) {
  const radius=spell==='blast'?3:3.6;
  // Lightning electrocutes the native 2×2 map cell; it does not apply Blast's radial launch.
  if(spell==='lightning'){
    let killed=0;
    for(const u of w.units)if(u.hp>0&&u.inside===null&&!(u.kind==='shaman'&&u.team===caster.team)&&Math.floor(u.x/2)===Math.floor(p.x/2)&&Math.floor(-u.z/2)===Math.floor(-p.z/2)&&killed<=constants.LIGHTNING_NUM_KILLS){u.hp=0;killed++;}
    for(const b of w.buildings)if(distance(b,p)<radius+1.5)b.hp-=57;
    return;
  }
  for(const u of w.units)if(!u.inside&&u.id!==caster.id&&distance(u,p)<radius) {
    if(u.team!==caster.team)u.hp-=50/20;
    const dx=distance(u,p)<.2?p.x-caster.x:u.x-p.x,dz=distance(u,p)<.2?p.z-caster.z:u.z-p.z,d=Math.hypot(dx,dz)||1;
    const strength=Math.max(.15,1-distance(u,p)/5)*140/256*TURNS_PER_SECOND;
    u.vx=dx/d*strength;u.vz=dz/d*strength;u.lift=1;u.path=[];u.inside=null;u.casting=null;u.fight=null;
  }
  for(const b of w.buildings)if(distance(b,p)<radius+1.5)b.hp-=20;
}
function manaPulse(w:World,team:Team){
  const amount=w.units.filter(u=>u.team===team&&u.hp>0).reduce((n,u)=>{const busy=u.inside!==null||u.work!==null||u.path.length>0||u.fighting||u.fight!==null||u.casting!==null;return n+(u.kind==='shaman'?constants.MANA_F_SHAMEN:u.kind==='brave'?busy?rules.manaBusyBrave:rules.manaIdleBrave:busy?rules.manaBusyWarrior:rules.manaIdleWarrior);},0);
  return Math.floor(amount*(team==='blue'?rules.humanManaFactor:rules.computerManaFactor)/256);
}
export function manaRate(w:World){return manaPulse(w,'blue')*TURNS_PER_SECOND/(rules.manaUpdateMask+1)/1000;}
export function tick(w:World,dt:number){
  if(w.paused||w.status!=='playing')return;
  if(!Number.isFinite(dt)||dt<0)throw new RangeError('Simulation delta must be finite and nonnegative');
  w.pendingTime+=dt;
  while(w.pendingTime+1e-9>=1/TURNS_PER_SECOND&&w.status==='playing'){
    w.pendingTime=Math.max(0,w.pendingTime-1/TURNS_PER_SECOND);if(w.pendingTime<1e-9)w.pendingTime=0;stepTurn(w);
  }
  if(w.status!=='playing')w.pendingTime=0;
}
function stepTurn(w:World){
  const dt=1/TURNS_PER_SECOND;w.turn++;w.time=w.turn/TURNS_PER_SECOND;
  for(const fx of w.effects){fx.age+=dt;if(fx.land){const t=Math.min(1,fx.age/fx.duration);for(const p of fx.land)w.terrain[p.index]=Math.max(w.terrain[p.index],p.from+(p.to-p.from)*t);w.terrainVersion++;if(t===1&&route(w,HOME,ENEMY).length)w.shrines.find(s=>s.kind==='bridge')!.active=false;}}
  w.effects=w.effects.filter(f=>f.age<f.duration);
  if((w.turn&15)===0)for(const t of w.trees)if(t.logs>0&&t.logs<4)t.logs=Math.min(4,t.logs+constants.TREE1_WOOD_GROW/100);
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
  // 0x41a590: split mana among active training huts, with a cost/32 intake cap per turn.
  for(const team of ['blue','red'] as const){
    const training=w.buildings.filter(b=>b.team===team&&b.kind==='camp'&&b.progress===1&&b.hp>0&&w.units.some(u=>u.inside===b.id&&u.kind==='brave'&&u.hp>0));
    const charging=team==='blue'&&w.charging&&w.shots.blast<4;
    let mana=(w.turn&rules.manaUpdateMask)===0?manaPulse(w,team):0;
    for(const b of w.buildings.filter(b=>b.team===team&&b.kind==='camp'&&b.progress===1&&!training.includes(b))){const refund=Math.min(100,b.timer);b.timer-=refund;mana+=refund;}
    if(training.length){const cost=trainingCost(w,team);for(let pass=0;pass<(charging?1:2);pass++){const share=Math.floor(mana*(pass===0?.5:1)/training.length);for(const b of training){const used=Math.max(0,Math.min(share,cost-b.timer,cost>>5));b.timer+=used;mana-=used;}}}
    if(charging){let charge=Math.round(w.mana*1000)+mana;while(charge>=constants.SPELL_BLAST&&w.shots.blast<4){charge-=constants.SPELL_BLAST;w.shots.blast++;}w.mana=w.shots.blast===4?0:charge/1000;}
  }
  for(const b of w.buildings) {
    if(b.hp<=0)continue;
    const inhabitants=w.units.filter(u=>u.inside===b.id&&u.hp>0);
    if(b.progress<1){
      const cost=BUILDINGS.find(s=>s.id===b.kind)!.cost;
      const workers=w.units.filter(u=>u.work===b.id&&u.hp>0&&u.kind==='brave');
      for(const u of workers) {
        if(u.cargo&&distance(u,b)<=4.2&&!u.path.length){b.logs+=u.cargo;u.cargo=0;u.tree=null;}
        if(b.logs+workers.reduce((n,a)=>n+(a.cargo||a.tree!==null?1:0),0)<cost&&!u.cargo&&u.tree===null){
          const tree=w.trees.filter(t=>t.logs>=1).sort((a,c)=>distance(a,u)-distance(c,u)).find(t=>route(w,u,t).length);
          if(tree){u.tree=tree.id;u.path=route(w,u,tree);u.timer=0;}
        }
        if(u.tree!==null&&!u.cargo){const tree=w.trees.find(t=>t.id===u.tree)!;if(distance(u,tree)<1&&!u.path.length){u.timer+=dt;if(u.timer>=2){if(tree.logs>=1){tree.logs--;u.cargo=1;}else u.tree=null;u.timer=0;u.path=route(w,u,entrance(w,b));}}}
      }
      if(b.logs>=cost)b.progress=Math.min(1,b.progress+workers.filter(u=>distance(u,b)<=4.2&&!u.path.length).length*dt/12);
      if(b.progress===1){if(!b.upgrading)w.stats.built++;b.upgrading=false;for(const u of workers){release(u);u.path=[];const p=entrance(w,b,4);u.x=p.x;u.z=p.z;}tell(w,`${BUILDINGS.find(s=>s.id===b.kind)!.name} completed.`);}
      continue;
    }
    if(b.kind==='camp') {
      const trainee=inhabitants.find(u=>u.kind==='brave');
      if(trainee&&b.timer>=trainingCost(w,b.team)){trainee.kind='warrior';trainee.hp=maxHp('warrior');release(trainee);const p=entrance(w,b,4);trainee.x=p.x;trainee.z=p.z;b.timer=0;if(b.team==='blue')w.stats.trained++;effect(w,'birth',trainee);}
    } else if(b.kind==='hut') {
      if((w.turn&3)===0){
        if(population(w,b.team)>=populationLimit(w,b.team))b.timer=0;
        else{b.timer+=2*(inhabitants.length+1);if(b.timer>=breedingWork(w,b)){b.timer=0;const u=addUnit(w,b.team,'brave',entrance(w,b,4));effect(w,'birth',u);if(inhabitants.length<housing(b)){u.work=b.id;u.inside=b.id;}}}
      }
      if((w.turn&15)===0&&inhabitants.length&&b.level<3){
        b.upgrade+=8*inhabitants.length;
        if(b.upgrade>=rules.hutUpgradeWork[b.level-1]){
          // ponytail: gather upgrade timber after maturation; native huts prefetch it at 75%.
          b.upgrade=0;b.level++;b.progress=0;b.logs=0;b.timer=0;b.upgrading=true;
          for(const u of inhabitants){release(u);const p=entrance(w,b);u.x=p.x;u.z=p.z;u.work=u.kind==='brave'?b.id:null;u.path=[];}
        }
      }
    }
  }

  processBattles(w);
  const contacts:[Unit,Unit][]=[];
  for(const u of w.units) {
    u.fighting=false;if(u.hp<=0)continue;u.cooldown=Math.max(0,u.cooldown-dt);
    if(u.lift>0){u.x+=u.vx*dt;u.z+=u.vz*dt;u.lift=Math.max(0,u.lift-dt);if(!u.lift&&!walkable(w.terrain,u))u.hp=0;continue;}
    if(!walkable(w.terrain,u)){u.hp=0;continue;}
    if(u.fight)continue;
    if(u.casting){u.casting.remaining-=dt;if(u.casting.remaining<=1e-8){const pending=u.casting;u.casting=null;finishCast(w,u,pending.spell,pending.point);}continue;}
    const work=w.buildings.find(b=>b.id===u.work&&b.hp>0)??w.shrines.find(s=>s.id===u.work&&s.active);
    if(u.work!==null&&!work)release(u);
    if(u.inside!==null){const b=w.buildings.find(b=>b.id===u.inside&&b.hp>0);if(b)continue;release(u);u.hp-=10;}
    if(work&&'kind' in work&&'hp' in work&&work.progress===1&&!u.path.length&&distance(u,work)<=4.2){const capacity=housing(work);if(w.units.filter(a=>a.inside===work.id).length<capacity){u.inside=work.id;continue;}}
    let target:Unit|Building|undefined=u.target===null?undefined:[...w.units,...w.buildings].find(t=>t.id===u.target&&t.hp>0);
    if(target&&!('progress' in target)&&(target.lift>0||target.inside!==null))target=undefined;
    if(!target){u.target=null;target=w.units.find(t=>t.team!==u.team&&t.team!=='wild'&&t.hp>0&&t.inside===null&&t.lift===0&&distance(u,t)<(u.team==='red'?8:3));}
    if(target){u.heading=Math.atan2(target.x-u.x,target.z-u.z);}
    if(target&&u.team==='red'&&u.kind==='shaman'&&distance(u,target)<12){if(!u.cooldown){u.path=[];u.casting={spell:'blast',point:{x:target.x,z:target.z},remaining:6/TURNS_PER_SECOND};u.cooldown=6;}continue;}
    if(target&&distance(u,target)<('progress' in target?4.3:1.7)){
      if('progress' in target){u.fighting=true;if(!u.cooldown){target.hp-=meleeDamage(u);u.cooldown=(u.kind==='shaman'?4:6)/TURNS_PER_SECOND;effect(w,'hit',target);}}
      else contacts.push([u,target]);continue;
    }
    if(target&&u.target===null&&u.team==='red'&&!u.work){u.target=target.id;u.path=route(w,u,target);}
    if(u.guard&&!u.path.length){const shaman=w.units.find(a=>a.team===u.team&&a.kind==='shaman');if(shaman&&distance(u,shaman)>3)u.path=route(w,u,entrance(w,shaman,2));}
    if(u.path.length){
      const next=u.path[0],length=unitSpeed(u);
      if(!walkable(w.terrain,next)){u.path=[];continue;}
      const dx=Math.round(next.x*256)-Math.round(u.x*256),dz=Math.round(next.z*256)-Math.round(u.z*256),angle=nativeAngle(dx,dz);
      if(dx||dz)u.heading=Math.PI-angle*Math.PI/1024;
      const p=Math.hypot(dx,dz)<=length?{x:Math.round(next.x*256)/256,z:Math.round(next.z*256)/256}:nativeStep(u,angle,length);
      if(!walkable(w.terrain,p)){u.path=[];continue;}u.x=p.x;u.z=p.z;
      if(Math.hypot(dx,dz)<=length)u.path.shift();
    }
    else if(target&&u.target!==null)u.path=route(w,u,'progress' in target?entrance(w,target):target);
    else if(work)u.heading=Math.atan2(work.x-u.x,work.z-u.z);
    if(u.kind==='brave'&&!u.path.length&&u.work===null&&u.target===null&&!u.guard){
      u.idleTurns++;
      if(u.idleTurns>16&&(w.turn&15)===0){
        const hut=w.buildings.filter(b=>b.team===u.team&&b.kind==='hut'&&b.hp>0&&b.progress===1&&distance(u,b)<8&&w.units.filter(a=>a.work===b.id||a.inside===b.id).length<housing(b)).sort((a,b)=>distance(a,u)-distance(b,u))[0];
        if(hut){const path=route(w,u,entrance(w,hut));if(path.length){u.work=hut.id;u.path=path;}}
      }
    }else u.idleTurns=0;
  }
  for(const [u,target] of contacts.sort((a,b)=>a[0].id-b[0].id))if(u.hp>0&&target.hp>0&&u.inside===null&&target.inside===null&&u.lift===0&&target.lift===0&&distance(u,target)<1.7&&!u.fight&&!u.casting&&!target.casting)joinBattle(w,u,target);
  for(const u of w.units.filter(u=>u.hp<=0&&u.kind==='shaman'))if(w.units.some(a=>a.team===u.team&&a.hp>0)){if(u.team==='blue'){w.respawn=12;tell(w,'Your shaman will reincarnate in 12 seconds.');}else w.redRespawn=12;}
  for(const u of w.units.filter(u=>u.hp<=0)){const f=effect(w,walkable(w.terrain,u)?'death':'splash',u);if(f.kind==='death')f.unit={team:u.team,kind:u.kind,heading:u.heading};}
  for(const b of w.buildings.filter(b=>b.hp<=0))effect(w,'death',b);
  w.units=w.units.filter(u=>u.hp>0);w.buildings=w.buildings.filter(b=>b.hp>0);w.selected=w.selected.filter(id=>w.units.some(u=>u.id===id));
  cleanBattles(w);
  for(const team of ['blue','red'] as const){const key=team==='blue'?'respawn':'redRespawn';if(w[key]>0){w[key]=Math.max(0,w[key]-dt);if(w[key]===0&&w.units.some(u=>u.team===team)){const u=addUnit(w,team,'shaman',team==='blue'?HOME:ENEMY);if(team==='blue'&&!w.selected.length)w.selected=[u.id];effect(w,'birth',u);}}}
  if(!w.units.some(u=>u.team==='red')){w.redRespawn=0;w.status='won';}
  if(!w.units.some(u=>u.team==='blue')){w.respawn=0;w.status='lost';}
}
