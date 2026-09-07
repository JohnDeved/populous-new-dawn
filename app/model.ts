import {createFlyby,flybyCommand,type Flyby} from './flyby.ts';
import level from './level-one.ts';
import originalScript from './original-script.json' with {type:'json'};
import {runScript,scriptState,scriptValue,type ScriptState,type PopScript} from './popscript.ts';
import {createWorship,stepWorship,worshipProgress,type WorshipState} from './worship.ts';
import type {ModelMorph} from './morph.ts';
import {createMessages,addMessage,messageStringId,type MessageState} from './messages.ts';
import {stepVaultWork,stepVaultTask,type VaultTask} from './vault.ts';
import constants from './original-constants.json' with { type: 'json' };
import rules from './original-rules.json' with { type: 'json' };
export type Team = 'blue' | 'red' | 'wild';
export type UnitKind = 'shaman' | 'brave' | 'warrior';
export type BuildingKind = 'hut' | 'camp' | 'tower' | 'temple';
export type Spell = 'blast' | 'lightning' | 'bridge';
export type Point = { x: number; z: number };
type Fight = { group: number; opponent: number; action: 'approach'|'ready'|'attack'|'strike'|'special'|'recoil'|'push'; started: number; until: number; knockback?: boolean; velocity?: Point };
type NativePoint = { x:number; y:number; h:number };
export type Projectile = { id:number; spell:Spell; team:Team; caster:number; target:Point; source:Point; position:NativePoint; destination:NativePoint; origin:NativePoint; phase:'windup'|'flying'|'arrived'; remaining:number; turns:number; visuals:Effect[] };
type Battle = Point & { id: number; members: number[]; angle: number };
export type Unit = Point & { vault: VaultTask | null; id: number; team: Team; kind: UnitKind; hp: number; path: Point[]; target: number | null; cooldown: number; work: number | null; inside: number | null; cargo: number; tree: number | null; timer: number; guard: boolean; lift: number; vx: number; vz: number; idleTurns: number; heading: number; fighting: boolean; fight: Fight|null; casting: {spell: Spell; point: Point; remaining: number} | null };
export type Building = Point & { id: number; team: Team; kind: BuildingKind; hp: number; progress: number; timer: number; foundation: number; level: number; logs: number; upgrade: number; upgrading: boolean; angle: number };
export type Shrine = Point & WorshipState & { id: number; kind: 'bridge' | 'lightning' | 'vault'; name: string; progress: number; duration: number; uses: number; forced: boolean; model: number; morph: ModelMorph | null; angle: number };
export type Tree = Point & { id: number; logs: number; model: number };
export type SoundEvent = Point & { serial:number; cue:number; turn:number };
export type Effect = Point & { id: number; kind: Spell | 'birth' | 'hit' | 'death' | 'splash' | 'trail'; height?:number; sprite?:{sequence:string;frame:number}; age: number; duration: number; unit?: Pick<Unit,'team'|'kind'|'heading'>; land?: {index:number;from:number;to:number}[] };
export const TURNS_PER_SECOND=12;
export const SPELLS: { id: Spell; model:number; name: string; cost: number; range: number; key: string; symbol: string; color: string; description: string }[] = [
  { id: 'blast', model:2, name: 'Blast', cost: 10, range: 12, key: '1', symbol: '✹', color: '#e8b076', description: 'Rechargeable · throws followers back. Water is deadly.' },
  { id: 'bridge', model:12, name: 'Land Bridge', cost: 70, range: 20, key: '2', symbol: '≋', color: '#bbca8a', description: 'Worship the southern stone head. Cast from one shore onto the other.' },
  { id: 'lightning', model:3, name: 'Lightning', cost: 80, range: 24, key: '3', symbol: 'ϟ', color: '#c6b8f2', description: 'Four gifts from the central stone head. A direct hit kills a follower.' },
];
export const BUILDINGS: { id: BuildingKind; name: string; cost: number; symbol: string; description: string }[] = [
  { id: 'hut', name: 'Hut', cost: 3, symbol: '⌂', description: 'Three logs. Send braves inside to breed faster and generate more mana.' },
  { id: 'camp', name: 'Warrior Training Hut', cost: 8, symbol: '⚔', description: 'Eight logs. Unlock at the vault, then send braves inside to train with mana.' },
];
const position = (owner: number) => { const o = level.objects.find(o => o.type === 1 && o.model === 7 && o.owner === owner)!; return { x: o.x, z: o.z }; };
export const HOME = position(0), ENEMY = position(1);
export const SIZE = 96, GRID = 97;
export const PLANET_RADIUS = 70;
export function worldPoint(terrain:number[],p:Point){return {x:p.x,y:height(terrain,p.x,p.z)*45/128,z:p.z};}
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
const short=(v:number)=>(v<<16)>>16;
// 0x4e6ac0: native XYZ, including signed-short wrap and half-scale vertical steps.
export function nativeStep3D(p:NativePoint,yaw:number,pitch:number,length:number):NativePoint{
  const horizontal=Math.imul(rules.sine[pitch&2047],length)>>16;
  return {x:short(p.x+(Math.imul(rules.sine[yaw&2047],horizontal)>>16)),y:short(p.y+(Math.imul(rules.sine[(yaw+512)&2047],horizontal)>>16)),h:short(p.h+(Math.imul(rules.sine[(pitch+512)&2047],length>>1)>>16))};
}
const nativePosition=(w:World,p:Point):NativePoint=>({x:short(Math.round((p.x+8)*256)),y:short(Math.round((-p.z-8)*256)),h:Math.round(height(w.terrain,p.x,p.z)*45)});
const browserPosition=(p:NativePoint):Point=>({x:short(p.x-2048)/256,z:-short(p.y+2048)/256});
const nativeDistance=(a:NativePoint,b:NativePoint)=>Math.floor(Math.hypot(short(a.x-b.x),short(a.y-b.y),a.h-b.h));
function shotAngles(p:NativePoint,d:NativePoint){const dx=short(d.x-p.x),dy=short(d.y-p.y);return [nativeAngle(dx,-dy),nativeAngle(Math.max(Math.abs(dx),Math.abs(dy)),-2*(d.h-p.h))];}
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
      }else if(f.action!=='approach'&&f.action!=='ready'){
        if(w.turn<f.until)continue;
        // 0x518fb0 emits the fight sound when the action timer expires.
        if(f.action==='attack'||f.action==='special')sound(w,0xd,u);
        if(f.action==='strike'){const target=w.units.find(a=>a.id===f.opponent);if(u.kind==='warrior'){sound(w,target?.kind==='warrior'?0x27:0x2b,u);if(target&&target.kind!=='warrior')sound(w,0x32,target);}else sound(w,0xe,u);}
        f.action='approach';
      }
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
  if(w.shrines.some(s=>s.id===u.work&&s.active&&distance(s,u)<3&&(s.kind!=='vault'||u.vault?.phase===2)))return 'pray';
  if(w.buildings.some(b=>b.id===u.work&&b.progress<1&&b.logs>=(BUILDINGS.find(s=>s.id===b.kind)?.cost??Infinity)&&distance(b,u)<=4.2))return 'work';
  return w.selected.includes(u.id)?'selected':'idle';
}
// 0x44df40: bit 0 chooses B-C when A or D is furthest from the rounded mean.
export function nativeTerrainCross(a:number,b:number,c:number,d:number){
  const mean=(a+b+c+d)>>2;
  return Math.max(Math.abs(a-mean),Math.abs(d-mean))>=Math.max(Math.abs(b-mean),Math.abs(c-mean));
}
// 0x44e940: toroidal 128-cell map, 512 coordinates/cell, separate signed shifts.
export function nativeTerrainHeight(terrain:readonly number[],x:number,y:number){
  const ix=(x&65535)>>9,iy=(y&65535)>>9,fx=(x&510)>>1,fy=(y&510)>>1;
  const a=terrain[iy*128+ix],b=terrain[iy*128+((ix+1)&127)],c=terrain[((iy+1)&127)*128+ix],d=terrain[((iy+1)&127)*128+((ix+1)&127)];
  return short(nativeTerrainCross(a,b,c,d)?(fx+fy<256?a+(((b-a)*fx)>>8)+(((c-a)*fy)>>8):d+(((b-d)*(256-fy))>>8)+(((c-d)*(256-fx))>>8)):
    (fy<fx?a+(((d-b)*fy)>>8)+(((b-a)*fx)>>8):a+(((d-c)*fx)>>8)+(((c-a)*fy)>>8)));
}
// Browser Z reflects native Y, exchanging the two diagonals. Quantize like the water shader.
export function terrainCross(a:number,b:number,c:number,d:number){return !nativeTerrainCross(Math.floor(c*45+.5),Math.floor(d*45+.5),Math.floor(a*45+.5),Math.floor(b*45+.5));}
const originalTerrain=Array<number>(128*128).fill(0);
for(const [x,y,h] of level.heights)originalTerrain[y*128+x]=h;
export function makeTerrain() {
  return Array.from({length: GRID*GRID}, (_,i) => {
    const x=i%GRID-48,z=Math.floor(i/GRID)-48,h=nativeTerrainHeight(originalTerrain,(x+8)*256,(-z-8)*256)/45;
    // ponytail: cropped/resampled terrain and artificial seabed remain until the native world grid is ported.
    return h === 0 ? -.35 : h;
  });
}
export function height(terrain: number[], x: number, z: number) {
  const gx = Math.max(0, Math.min(96, x + 48)), gz = Math.max(0, Math.min(96, z + 48));
  const ix = Math.min(95,Math.floor(gx)), iz = Math.min(95,Math.floor(gz)), fx = gx - ix, fz = gz - iz;
  const a = terrain[iz * GRID + ix], b = terrain[iz * GRID + ix + 1], c = terrain[(iz + 1) * GRID + ix], d = terrain[(iz + 1) * GRID + ix + 1];
  // Match the rendered triangles, including their diagonal, rather than bilinear interpolation.
  return terrainCross(a,b,c,d)?(fx+fz<=1?a+fx*(b-a)+fz*(c-a):d+(1-fx)*(c-d)+(1-fz)*(b-d)):(fz<fx?a+fx*(b-a)+fz*(d-b):a+fx*(d-c)+fz*(c-a));
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
  // A shared native height keeps the building and its supporting terrain together.
  const points = footprintPoints(b.kind, b);
  b.foundation = Math.round(points.reduce((sum, p) => sum + surface(w.terrain, p), 0) / points.length*45)/45;
  for (const p of points) w.terrain[(p.z + 48) * GRID + p.x + 48] = b.foundation;
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
  ai:ScriptState & {states:number;flags:number;defencePosition:number;defenceRadius:number;spellEntries:{model:number;mana:number;range:number;people:number;mode:number}[];reincarnation:boolean;includeIncompleteBuildings:boolean;pendingCommands:{opcode:number;args:number[]}[]};
  messages: MessageState;
  flyby: Flyby;
  inputMask: number;
  lastMessage: number;
  spellCasts:number[][];
  gifts: (Point & {kind: Shrine['kind']; remaining: number})[];
  giftCounts: Record<Spell, number>;
  terrain: number[]; terrainVersion: number; units: Unit[]; buildings: Building[]; effects: Effect[]; projectiles:Projectile[]; shrines: Shrine[]; trees: Tree[]; fights: Battle[]; sounds: SoundEvent[]; soundSerial:number;
  mana: number; wood: number; shots: Record<Spell, number>; charging: boolean; unlockedCamp: boolean;
  time: number; turn: number; pendingTime: number; randomState: number; nextId: number; selected: number[]; mode: Spell | BuildingKind | null;
  paused: boolean; speed: number; message: string; messageUntil: number; status: 'playing' | 'won' | 'lost';
  respawn: number; redRespawn: number; stats: { built: number; cast: number; bridges: number; trained: number };
};
function route(w:World,start:Point,end:Point){return findPath(w.terrain,start,end,w.buildings);}
export function addUnit(w: World, team: Team, kind: UnitKind, p: Point) {
  const u: Unit = { vault:null, x:p.x, z:p.z, id: w.nextId++, team, kind, hp: maxHp(kind), path: [], target: null, cooldown: 0, work: null, inside:null, cargo:0, tree:null, timer:0, guard:false, lift:0, vx:0, vz:0,idleTurns:0,heading:Math.PI,fighting:false,fight:null,casting:null };
  w.units.push(u); return u;
}
export function addBuilding(w: World, team: Team, kind: BuildingKind, p: Point, complete = true) {
  const b: Building = { x:p.x, z:p.z, id: w.nextId++, team, kind, hp: buildingHp(kind), progress: complete ? 1 : 0, timer: 0, foundation: 0, level: 1, logs: complete ? BUILDINGS.find(b=>b.id===kind)?.cost ?? 0 : 0, upgrade:0, upgrading:false, angle:0 };
  groundBuilding(w, b); w.buildings.push(b); return b;
}
function missionAI(){
  const ai={...scriptState(originalScript),states:0,flags:0,defencePosition:0,defenceRadius:0,spellEntries:Array.from({length:8},()=>({model:0,mana:0,range:0,people:0,mode:0})),reincarnation:true,includeIncompleteBuildings:false,pendingCommands:[] as {opcode:number;args:number[]}[]};
  // ponytail: turn-zero setup only; bind the remaining commands and live reads before recurring execution.
  runScript(originalScript,ai,{turn:0,tribe:1,readInternal:id=>{if(id===0)return 0;throw new Error(`Unbound initial script read ${id}`);},command:(opcode,args)=>{
    // 0x48cc60: native state bits, and SET_REINCARNATION's disable flag at tribe+0x93d.
    if(opcode>=1028&&opcode<=1051&&opcode!==1038&&opcode!==1049){
      const bit=1<<(opcode-1028);if(args[0]===1022)ai.states|=bit;else if(args[0]===1023)ai.states&=~bit;
    }else if(opcode===1164){if(args[0]===1022)ai.reincarnation=true;else if(args[0]===1023)ai.reincarnation=false;}
    else ai.pendingCommands.push({opcode,args});
  }});
  return ai;
}
export function createWorld(): World {
  const w: World = { flyby:createFlyby(),inputMask:128,lastMessage:-1,ai:missionAI(), messages:createMessages(), spellCasts:Array.from({length:4},()=>Array(22).fill(0)), gifts:[], giftCounts:{blast:0,bridge:0,lightning:0}, terrain: makeTerrain(), terrainVersion: 0, units: [], buildings: [], effects: [], projectiles:[], shrines:[], trees:[], fights:[], sounds:[], soundSerial:0, mana:0, wood:0, shots:{blast:4,bridge:0,lightning:0}, charging:true, unlockedCamp:false, time: 0, turn:0, pendingTime:0, randomState:1, nextId: 1, selected: [], mode: null, paused: false, speed: 1, message: 'Select a brave and send them to the southern stone head to worship for Land Bridge.', messageUntil: 18, status: 'playing', respawn: 0, redRespawn:0, stats: { built: 0, cast: 0, bridges:0, trained:0 } };
  for (const o of level.objects) {
    if (o.type===2 && o.owner!==255) { const b=addBuilding(w,o.owner===0?'blue':'red',o.model===7?'camp':'hut',o); b.level=o.model===3?3:1; b.angle=o.angle/2048*Math.PI*2; }
    if (o.type===1) addUnit(w,o.owner===0?'blue':'red',o.model===7?'shaman':o.model===3?'warrior':'brave',o);
    if (o.type===5 && o.model<=6) w.trees.push({id:w.nextId++,x:o.x,z:o.z,logs:4,model:o.model});
    if (o.type===6 && o.model===6) {
      const settings=o.settings!, reward=level.objects.find(r=>r.index+1===(settings[6]|settings[7]<<8))?.settings;
      const kind=settings[0]===4?'vault':reward?.[0]===11&&reward[1]===3?'lightning':reward?.[0]===11&&reward[1]===12?'bridge':null;
      if(!kind)throw new Error(`Unbound shrine reward ${o.index}`);
      const worship=createWorship(settings);
      const vault=kind==='vault'?level.objects.find(r=>r.type===2&&r.model===18&&distance(r,o)<3):undefined;
      w.shrines.push({...worship,forced:false,morph:null,model:kind==='vault'?154:45,angle:(vault?.angle??0)/2048*Math.PI*2,id:w.nextId++,x:o.x,z:o.z,kind,name:kind==='vault'?'Vault of Knowledge':kind==='bridge'?'Land Bridge stone head':'Lightning stone head',progress:0,duration:worship.target*4/TURNS_PER_SECOND,uses:0});
    }
  }
  w.ai.pendingCommands=w.ai.pendingCommands.filter(c=>{
    if(![1038,1108,1196].includes(c.opcode))return true;
    campaignCommand(w,c.opcode,c.args);return false;
  });
  w.selected=[w.units.find(u=>u.team==='blue'&&u.kind==='shaman')!.id];
  w.wood=w.trees.reduce((s,t)=>s+Math.floor(t.logs),0);
  return w;
}
// 0x492920: marker queries read the coarse vertex; odd coordinate bits are ignored.
export function nativeCellPoint(packed:number):Point{return browserPosition({x:(packed&254)<<8,y:packed&0xfe00,h:0});}
export function markerHeight(terrain:number[],index:number){
  if(!Number.isInteger(index)||index<0||index>=level.markers.length)throw new RangeError('Invalid campaign marker');
  const packed=level.markers[index],p=nativeCellPoint(packed);
  if(Math.abs(p.x)>48||Math.abs(p.z)>48)return originalTerrain[((packed&0xfe00)>>9)*128+((packed&254)>>1)];
  const h=height(terrain,p.x,p.z);
  return h===-.35?0:short(Math.round(h*45)); // Convert the browser's artificial seabed back to native zero.
}
// 0x4f2160 / 0x4f2900 share the same coarse cell lookup.
function headAt(w:World,x:number,y:number){
  const p=nativeCellPoint(((y&255)<<8)|(x&255));
  return w.shrines.find(s=>{const n=nativePosition(w,s),cell=nativeCellPoint((n.y&0xff00)|((n.x>>>8)&255));return cell.x===p.x&&cell.z===p.z;});
}
export function removeHead(w:World,x:number,y:number){
  const head=headAt(w,x,y);if(!head)return;
  w.shrines.splice(w.shrines.indexOf(head),1);head.active=false;
  for(const u of w.units)if(u.work===head.id){release(u);u.path=[];}
}
// 0x4c14c0 increments these bytes during allocation, even if the spell later cancels.
export function recordSpellCast(w: World, tribe: number, model: number) {
  if (!Number.isInteger(tribe) || tribe < 0 || tribe > 3 ||
      !Number.isInteger(model) || model < 0 || model > 255) {
    throw new RangeError('Invalid native spell identity');
  }
  if (model < 22) w.spellCasts[tribe][model] = (w.spellCasts[tribe][model] + 1) & 255;
}

export function campaignInternal(w: World, id: number) {
  if (id === 0) return w.turn;
  if (id === 1050) return constants.SPELL_BLAST; // 0x48f350 reads the loaded spell-cost table.
  // 0x48f350: self then four explicit tribes, 16 building models each.
  if (id >= 1066 && id <= 1145) {
    const tribe = id < 1082 ? 1 : Math.floor((id - 1082) / 16);
    const model = id < 1082 ? id - 1065 : (id - 1082) % 16 + 1;
    const value = campaignBuildingCount(w, tribe, model, w.ai.includeIncompleteBuildings);
    w.ai.includeIncompleteBuildings = false;
    return value;
  }
  // Native spell constants, including Blast, Lightning and Land Bridge.
  if (id >= 1184 && id <= 1199) return id - 1183;
  throw new Error(`Unbound campaign internal ${id}`);
}

// 0x4ecac0 counts completed buildings (state 2) separately from all live buildings.
// Browser progress is the current approximation of native building state.
export function campaignBuildingCount(w: World, tribe: number, model: number, includeIncomplete: boolean) {
  const team = tribe === 0 ? 'blue' : tribe === 1 ? 'red' : null;
  const count = w.buildings.filter(b => b.team === team && b.hp > 0 &&
    (includeIncomplete || b.progress >= 1) &&
    (b.kind === 'hut' ? b.level : b.kind === 'tower' ? 4 : b.kind === 'temple' ? 5 : 7) === model).length;
  return short(count);
}

// 0x48cc60 / 0x4fbf40: marker coordinates select a coarse cell, not a radius.
export function forceHead(w: World, marker: number) {
  if (!Number.isInteger(marker) || marker < 0 || marker >= level.markers.length) throw new RangeError('Invalid trigger marker');
  const packed = level.markers[marker], head = headAt(w, packed & 255, packed >>> 8);
  if (head) head.forced = true;
}

// Reviewed DO query handlers. Unknown commands/unsupported world state fail explicitly.
export function campaignCommand(w: World, opcode: number, args: number[], script: PopScript = originalScript) {
  const arity = ({1038: 3, 1108: 6, 1196: 1, 1076: 3, 1077: 3, 1085: 2, 1131: 3, 1136: 0, 1151: 1, 1171: 2, 1176: 1, 1113: 0, 1180: 0, 1187: 0, 1205: 0, 1206: 0, 1207: 0, 1208: 1, 1209: 4, 1210: 3, 1211: 3, 1212: 4, 1213: 5, 1214: 4, 1215: 2} as Record<number, number>)[opcode];
  if (arity === undefined) throw new Error(`Unbound campaign command ${opcode}`);
  if (args.length !== arity) throw new Error(`Invalid campaign command arguments ${opcode}`);
  const read = (index: number) => scriptValue(script, w.ai, index, id => campaignInternal(w, id));

  if (opcode === 1038) {
    // 0x492c30 reads both coordinates even for OFF; disabled orders retain the old target.
    const x=read(args[0])&255,y=read(args[1])&255;
    if(args[2]===1022)w.ai.states=(w.ai.states|0x400)>>>0;else if(args[2]===1023)w.ai.states=(w.ai.states&~0x400)>>>0;
    if(w.ai.states&0x400){w.ai.flags=(w.ai.flags|0x100)>>>0;w.ai.defencePosition=x|(y<<8);}
    else w.ai.flags=(w.ai.flags&~0x100)>>>0;
    return;
  }
  if (opcode === 1196) { w.ai.defenceRadius=read(args[0])&255;return; }
  if (opcode === 1108) {
    // 0x4902e0: preserve the native dword/word/byte widths of the five written fields.
    const [index,model,mana,range,people,mode]=args.map(read);
    if(!Number.isInteger(index)||index<0||index>=w.ai.spellEntries.length)throw new RangeError('Invalid computer spell entry');
    w.ai.spellEntries[index]={model:model&255,mana:mana|0,range:range&65535,people:people&255,mode:mode&255};
    return;
  }

  if (opcode === 1113) { w.inputMask &= ~128; return; }
  if (opcode === 1180 || opcode === 1187) {
    const message = w.messages.slots[w.lastMessage];
    if (message) message.flags |= opcode === 1180 ? 0x200 : 0x20000;
    return;
  }
  if (opcode >= 1205 && opcode <= 1215) {
    flybyCommand(w.flyby, opcode, opcode === 1208 ? [args[0] === 1022 ? 1 : 0] : args.map(read));
    if (opcode === 1206) w.inputMask |= 64;
    if (opcode === 1207) w.inputMask &= ~64;
    return;
  }

  if (opcode === 1136) { w.ai.includeIncompleteBuildings = true; return; }
  if (opcode === 1151) { forceHead(w, read(args[0])); return; }

  if (opcode === 1176) {
    w.lastMessage = addMessage(w.messages, messageStringId(read(args[0])), () => random(w));
    sound(w, 0xe3, HOME);
    return;
  }

  if (opcode === 1171) {
    removeHead(w, read(args[0]), read(args[1]));
    return;
  }
  let value: number;
  if (opcode === 1085) {
    value = markerHeight(w.terrain, read(args[0]));
  } else if (opcode === 1131) {
    value = ((headAt(w, read(args[0]), read(args[1]))?.remaining ?? 0) << 24) >> 24;
  } else {
    const tribe = args[0] >= 1118 && args[0] <= 1121 ? args[0] - 1118 : read(args[0]);
    const model = read(args[1]);
    if (!Number.isInteger(tribe) || tribe < 0 || tribe > 3 ||
        !Number.isInteger(model) || model < 0 || model >= 22) {
      throw new RangeError('Invalid campaign spell query');
    }
    if (opcode === 1076) {
      value = w.spellCasts[tribe][model] & 255;
    } else {
      const spell = SPELLS.find(s => s.model === model)?.id;
      if (tribe !== 0 || !spell) throw new Error(`Unbound one-off spell stock ${tribe}:${model}`);
      value = w.shots[spell] & 15; // 0x4c2b40 excludes the separate upper-nibble gift counter.
    }
  }
  // Native destinations use the field's value as a user-variable index, regardless of type.
  const index = script.fields[args.at(-1)!]?.[1];
  if (!Number.isInteger(index) || index < 0 || index >= 64) {
    throw new RangeError('Invalid campaign query destination');
  }
  w.ai.variables[index] = value | 0;
}

const boundCampaignScript = {
  ...originalScript,
  codes: [12, 1003, ...originalScript.codes.slice(564, 601), ...originalScript.codes.slice(936, 1505), 1004, 1019],
};
function campaignRules(w: World) {
  // ponytail: execute these verified original blocks until the remaining mission commands are bound.
  runScript(boundCampaignScript, w.ai, {
    turn: w.turn,
    tribe: 1,
    readInternal: id => campaignInternal(w, id),
    command: (opcode, args) => campaignCommand(w, opcode, args),
  });
}
export function tell(w: World, message: string) { w.message = message; w.messageUntil = w.time + 9; }
// Presentation events have their own serial; they never consume simulation IDs or random values.
// ponytail: retain 128 recent cues; a streaming consumer is needed if a catch-up frame exceeds that history.
export function sound(w:World,cue:number,p:Point){w.sounds.push({serial:++w.soundSerial,cue,x:p.x,z:p.z,turn:w.turn});if(w.sounds.length>128)w.sounds.shift();}
function castVoice(w:World,u:Unit,spell:Spell){sound(w,(u.team==='blue'?{blast:0x76,lightning:0x77,bridge:0x80}:{blast:0x8c,lightning:0x8d,bridge:0x96})[spell],u);}
export function effect(w: World, kind: Effect['kind'], p: Point) { const f:Effect={ x:p.x,z:p.z,kind,id:w.nextId++,age:0,duration:kind==='bridge'?constants.LAND_BRIDGE_DURATION/TURNS_PER_SECOND:kind==='hit'?.5:kind==='blast'?1.2:1.7 };w.effects.push(f);return f; }
export function select(w: World, kind: UnitKind | 'all') { w.selected=w.units.filter(u=>u.team==='blue'&&(kind==='all'||u.kind===kind)).map(u=>u.id); w.mode=null; }
function release(u: Unit) { u.vault=null; u.work=null; u.inside=null; u.tree=null; u.target=null; u.guard=false; u.timer=0; u.casting=null;u.fighting=false;u.fight=null;u.idleTurns=0; }
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
    release(u); u.path=path; u.work=shrine?.id??friendly?.id??null; u.target=enemy?.id??null;
    if(shrine?.kind==='vault')u.vault={head:shrine.id,phase:1,entering:true,remaining:0};
    count++;
  }
  tell(w,count ? shrine?`Worshipping ${shrine.name}. ${shrine.kind==='vault'?'Only your shaman can learn its secrets.':'One follower is enough.'}`:friendly?friendly.progress<1?'Braves assigned to construction.':friendly.kind==='camp'?'Braves sent to train as warriors.':'Braves sent to live in the hut.':enemy?'Your followers march to battle.':'Your followers are on the move.':shrine?.kind==='vault'?'Select your shaman to worship the Vault of Knowledge.':'No land route. Bring your shaman to the shore and make a Land Bridge.');
}

function processVaultTask(w: World, u: Unit) {
  const task = u.vault!;
  const head = w.shrines.find(s => s.id === task.head);
  if (!head) { release(u); return; }
  // ponytail: native approach/pathfinding and shape entry coordinates still use browser routes.
  const door = entrance(w, head, 2);
  if (task.phase === 1) {
    if (u.path.length) return;
    if (distance(u, door) > 0.1) { u.path = route(w,u,door); return; }
    task.phase = 2;
    task.entering = true;
  }
  const goal = task.phase === 4 ? head : task.phase === 9 ? entrance(w,head,6) : door;
  const arrived = Math.abs(Math.round(goal.x*256)-Math.round(u.x*256))<=11
    && Math.abs(Math.round(goal.z*256)-Math.round(u.z*256))<=11;
  const previous = task.phase;
  const {done, actions} = stepVaultTask(task, arrived, head.work>=head.target, head.active);
  for (const action of actions) {
    if (action==='enter' || action==='exit' || action==='leave') u.path=route(w,u,goal);
    if (action==='open' || action==='close') {
      sound(w,0x9f,head);
      head.model=152;
      head.morph={from:action==='open'?154:153,to:action==='open'?153:155,started:w.turn,duration:40};
    }
    if (action==='trigger') head.forced=true;
    if (action==='face') u.heading=Math.atan2(head.x-u.x,head.z-u.z);
  }
  if (previous===3 && task.phase===4) { head.model=153; head.morph=null; }
  if (done) release(u);
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
  beginCast(w,shaman,spell,p);w.mode=null;
  return true;
}
function beginCast(w:World,u:Unit,spell:Spell,p:Point){
  // 0x4f4de0 targets the center of a native 2x2 cell and spends the charge on allocation.
  const target={x:Math.floor(p.x/2)*2+1,z:-Math.floor(-p.z/2)*2-1},position=nativePosition(w,u);
  w.projectiles.push({id:w.nextId++,spell,team:u.team,caster:u.id,target,source:{x:u.x,z:u.z},position,destination:nativePosition(w,target),origin:{...position},phase:'windup',remaining:6,turns:0,visuals:[]});
  recordSpellCast(w,u.team==='blue'?0:1,SPELLS.find(s=>s.id===spell)!.model);
  if(u.team==='blue'){w.shots[spell]--;w.giftCounts[spell]=Math.max(0,w.giftCounts[spell]-1);w.stats.cast++;}
  u.casting={spell,point:target,remaining:6/TURNS_PER_SECOND};castVoice(w,u,spell);
}
function shotVisual(w:World,p:NativePoint,sequence:string,frame:number,duration:number){
  const fx=effect(w,'trail',browserPosition(p));fx.height=p.h/45;fx.sprite={sequence,frame};fx.duration=duration;return fx;
}
function moveVisual(f:Effect,p:NativePoint){Object.assign(f,browserPosition(p));f.height=p.h/45;}
function processProjectiles(w:World){
  // Newest native allocations precede older objects. Full mixed-class scheduling remains to be ported.
  for(const shot of [...w.projectiles].reverse()){
    const caster=w.units.find(u=>u.team===shot.team&&u.kind==='shaman'&&u.hp>0);
    const remove=()=>{w.projectiles.splice(w.projectiles.indexOf(shot),1);for(const f of shot.visuals)f.duration=f.age;};
    if(shot.phase==='windup'){
      if(!caster){remove();continue;}
      if(--shot.remaining>0)continue;
      shot.source={x:caster.x,z:caster.z};shot.origin=nativePosition(w,caster);shot.origin.h+=0x60;shot.position={...shot.origin};
      // 0x4c21e0: Lightning aims 0x400 above, displaced 0x600 toward the shaman.
      if(shot.spell==='lightning'){
        const d=shot.destination,yaw=nativeAngle(short(shot.origin.x-d.x),-short(shot.origin.y-d.y));
        shot.destination=nativeStep3D({...d,h:d.h+0x400},yaw,512,0x600);
      }
      shot.phase='flying';
      if(shot.spell==='blast'){
        sound(w,0xa1,shot.source);
        shot.visuals=Array.from({length:5},(_,i)=>shotVisual(w,shot.position,'blastShot',i+3,Infinity));
      }
      continue;
    }
    if(shot.phase==='arrived'){
      if(caster)finishCast(w,{id:shot.caster,team:shot.team,...shot.source},shot.spell,shot.target);
      remove();continue;
    }
    const p=shot.position,d=shot.destination;
    if(shot.spell==='blast'){
      // 0x4bb440: move 1000 units/turn, snap inside the arrival sphere, delete next turn.
      if(Math.abs(d.x-p.x)<0x408&&Math.abs(d.y-p.y)<0x408&&Math.abs(d.h-p.h)<0x408&&nativeDistance(p,d)<1000){
        shot.position={...d};shot.phase='arrived';for(const f of shot.visuals)f.duration=f.age;continue;
      }
      const [yaw,pitch]=shotAngles(p,d);shot.position=nativeStep3D(p,yaw,pitch,1000);
      shot.position.h=Math.max(shot.position.h,nativePosition(w,browserPosition(shot.position)).h);
      const travelled=nativeDistance(shot.position,shot.origin);
      moveVisual(shot.visuals[0],shot.position);
      for(let i=1;i<=4;i++)if(i*80<travelled)moveVisual(shot.visuals[i],nativeStep3D(shot.position,yaw,pitch,-i*80));
      // Four jitter trails, behind the last attached sprite; the jitter consumes simulation RNG.
      if(shot.turns>0)for(let i=1;i<=4;i++)if(320+i*160<travelled){
        const tail=nativeStep3D(nativeStep3D(shot.position,yaw,pitch,-320),yaw,pitch,-i*160);
        tail.x=short(tail.x+8-(random(w)&15));tail.y=short(tail.y+8-(random(w)&15));
        shotVisual(w,tail,'blastTrail',0,4/TURNS_PER_SECOND);
      }
    }else{
      // 0x4baf00: 20 substeps of 70, with a four-turn trail before every arrival check.
      for(let i=0;i<20;i++){
        const p=shot.position,tail={...p,x:short(p.x+8-(random(w)&15)),y:short(p.y+8-(random(w)&15))};
        tail.h=Math.max(tail.h,nativePosition(w,browserPosition(tail)).h);
        shotVisual(w,tail,'spellTrail',0,4/TURNS_PER_SECOND);
        if(Math.abs(d.x-p.x)<108&&Math.abs(d.y-p.y)<108&&Math.abs(d.h-p.h)<108){
          if(caster)finishCast(w,{id:shot.caster,team:shot.team,...shot.source},shot.spell,shot.target);
          remove();break;
        }
        const [yaw,pitch]=shotAngles(p,d);shot.position=nativeStep3D(p,yaw,pitch,70);
      }
    }
    shot.turns++;
  }
}
function finishCast(w:World,shaman:Pick<Unit,'id'|'team'|'x'|'z'>,spell:Spell,p:Point){
  const fx=effect(w,spell,p);
  if(spell==='blast'){sound(w,0xb2,p);}else if(spell==='lightning')sound(w,0xa2,p);else{sound(w,0xab,p);sound(w,0x29,p);}
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
function damageSpell(w:World,spell:'blast'|'lightning',p:Point,caster:Pick<Unit,'id'|'team'|'x'|'z'>) {
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
  // 0x4facf0: auto-collected reward objects grant knowledge/stock after 82 object turns.
  for (const gift of w.gifts) {
    if (--gift.remaining !== 0) continue;
    effect(w, 'birth', gift);
    if (gift.kind === 'vault') {
      w.unlockedCamp = true;
      tell(w, 'Knowledge discovered: build a Warrior Training Hut, then send braves inside.');
    } else {
      // 0x4c2cd0: stocks already at/above the cap are unchanged.
      if (w.shots[gift.kind] < 4) w.shots[gift.kind]++;
      // 0x4c2aa0: the separate gift counter increases even at full stock.
      w.giftCounts[gift.kind] = Math.min(15, w.giftCounts[gift.kind] + 1);
      tell(w, `${gift.kind === 'bridge' ? 'Land Bridge' : 'Lightning'} received. ${w.shots[gift.kind]} shots ready.`);
    }
  }
  w.gifts = w.gifts.filter(g => g.remaining > 0);
  for(const fx of w.effects){fx.age+=dt;if(fx.land){const t=Math.min(1,fx.age/fx.duration);for(const p of fx.land)w.terrain[p.index]=Math.max(w.terrain[p.index],p.from+(p.to-p.from)*t);w.terrainVersion++;}}
  w.effects=w.effects.filter(f=>f.age<f.duration);
  processProjectiles(w);
  for (const message of w.messages.slots) if (message) message.age = (message.age + 1) | 0;
  campaignRules(w);
  if((w.turn&15)===0)for(const t of w.trees)if(t.logs>0&&t.logs<4)t.logs=Math.min(4,t.logs+constants.TREE1_WOOD_GROW/100);
  w.wood=w.trees.reduce((s,t)=>s+Math.floor(t.logs),0);
  for(const shrine of w.shrines) {
    if(!shrine.active)continue;
    if(shrine.reset)shrine.forced=false;
    const worshippers=w.units.filter(u=>u.hp>0&&u.work===shrine.id&&distance(u,shrine)<3&&(!u.path.length)&&u.lift===0);
    let fired = false;
    if (shrine.kind === 'vault') {
      const shaman = w.units.find(u => u.team==='blue' && u.kind==='shaman' && u.hp>0);
      // ponytail: native coarse-cell/adjacent-building eligibility awaits the occupancy port.
      const eligible = !!shaman && shaman.vault?.head===shrine.id && shaman.lift===0 && !shaman.fight && !shaman.casting && distance(shaman,shrine)<3;
      fired = stepVaultWork(shrine, w.turn, eligible, shrine.forced);
      shrine.progress = shrine.target>0 ? shrine.work/shrine.target : 0;
    } else {
      // ponytail: eligibility and per-object phase still use the browser's order/world state.
      fired = stepWorship(shrine, w.turn, worshippers.length, shrine.forced);
      shrine.progress = worshipProgress(shrine);
    }
    if (fired) {
      shrine.progress = 0;
      shrine.uses++;
      w.gifts.push({kind: shrine.kind, x: shrine.x, z: shrine.z, remaining: 82});
      sound(w, 0x70, shrine);
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
    if(u.casting){u.casting.remaining-=dt;if(u.casting.remaining<=1e-8)u.casting=null;continue;}
    if (u.vault) processVaultTask(w,u);
    const work=w.buildings.find(b=>b.id===u.work&&b.hp>0)??w.shrines.find(s=>s.id===u.work&&(s.active||u.vault?.head===s.id));
    if(u.work!==null&&!work)release(u);
    if(u.inside!==null){const b=w.buildings.find(b=>b.id===u.inside&&b.hp>0);if(b)continue;release(u);u.hp-=10;}
    if(work&&'kind' in work&&'hp' in work&&work.progress===1&&!u.path.length&&distance(u,work)<=4.2){const capacity=housing(work);if(w.units.filter(a=>a.inside===work.id).length<capacity){u.inside=work.id;continue;}}
    let target:Unit|Building|undefined=u.target===null?undefined:[...w.units,...w.buildings].find(t=>t.id===u.target&&t.hp>0);
    if(target&&!('progress' in target)&&(target.lift>0||target.inside!==null))target=undefined;
    if(!target){u.target=null;target=w.units.find(t=>t.team!==u.team&&t.team!=='wild'&&t.hp>0&&t.inside===null&&t.lift===0&&distance(u,t)<(u.team==='red'?8:3));}
    if(target){u.heading=Math.atan2(target.x-u.x,target.z-u.z);}
    // ponytail: native entries enable spells; mana eligibility, target scoring and scheduling remain unported.
    if(target&&u.team==='red'&&u.kind==='shaman'&&w.ai.spellEntries.some(s=>s.model===2)&&distance(u,target)<12){if(!u.cooldown){u.path=[];beginCast(w,u,'blast',target);u.cooldown=6;}continue;}
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
  for(const u of w.units.filter(u=>u.hp<=0&&u.kind==='shaman'))if(w.units.some(a=>a.team===u.team&&a.hp>0)){if(u.team==='blue'){w.respawn=12;tell(w,'Your shaman will reincarnate in 12 seconds.');}else if(w.ai.reincarnation)w.redRespawn=12;}
  for(const u of w.units.filter(u=>u.hp<=0)){const f=effect(w,walkable(w.terrain,u)?'death':'splash',u);if(f.kind==='death')f.unit={team:u.team,kind:u.kind,heading:u.heading};}
  for(const b of w.buildings.filter(b=>b.hp<=0))effect(w,'death',b);
  w.units=w.units.filter(u=>u.hp>0);w.buildings=w.buildings.filter(b=>b.hp>0);w.selected=w.selected.filter(id=>w.units.some(u=>u.id===id));
  cleanBattles(w);
  for(const team of ['blue','red'] as const){const key=team==='blue'?'respawn':'redRespawn';if(w[key]>0){w[key]=Math.max(0,w[key]-dt);if(w[key]===0&&w.units.some(u=>u.team===team)){const u=addUnit(w,team,'shaman',team==='blue'?HOME:ENEMY);if(team==='blue'&&!w.selected.length)w.selected=[u.id];effect(w,'birth',u);}}}
  if(!w.units.some(u=>u.team==='red')){w.redRespawn=0;w.status='won';}
  if(!w.units.some(u=>u.team==='blue')){w.respawn=0;w.status='lost';}
}
