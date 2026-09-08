import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import nativeModels from '../app/original-models.json' with {type:'json'};
import level from '../app/level-one.ts';
import originalScript from '../app/original-script.json' with {type:'json'};
import {createTooltip,forcedTooltipObject,showObjectTooltip,stepTooltip} from '../app/tooltips.ts';
import {modelMatrix,modelPoint} from '../app/projection.ts';
import {runScript,scriptState} from '../app/popscript.ts';
import {campaignCommand,recordSpellCast} from '../app/model.ts';
import { createWorld, tick, cast, command, select, placeBuilding, findPath, walkable, footprintPoints, worldPoint, HOME, ENEMY, manaRate, housing, populationLimit, breedingWork, trainingCost, meleeDamage, addUnit, unitAnimation, maxHp, entrance, nativeAngle, nativeStep, nativeStep3D, nativeTerrainCross, nativeTerrainHeight, terrainCross, makeTerrain, height, markerHeight, nativeCellPoint, removeHead, GRID, random, fightPosition } from '../app/model.ts';
const advance=(w,seconds)=>{for(let i=0;i<seconds*30;i++)tick(w,1/30);};
test('terrain rebuilds preserve queue precedence and initialize the original mission before sampling', async () => {
 const {createNativeTerrain,queueTerrain,processTerrain}=await import('../app/native-terrain.ts');
 const land=createNativeTerrain(new Int16Array(16384).fill(100)),events=[];
 const textures={surface:c=>events.push(['surface',c]),globe:c=>events.push(['globe',c])};
 queueTerrain(land,0,0,0,textures);queueTerrain(land,0,0,1,textures);
 queueTerrain(land,2,0,1,textures);queueTerrain(land,4,0,1,textures);
 assert.deepEqual(land.queued,[0,2,4]);assert.equal(land.duplicates,1);
 processTerrain(land,textures);
 assert.deepEqual(events,[['surface',2],['surface',4],['globe',2],['globe',4]]);
 assert.equal(land.queued.length,0);assert.ok(land.dirty.every(v=>v===0));
 const raw=new Int16Array(16384);for(const [x,y,h] of level.heights)raw[y*128+x]=h;
 const mission=createNativeTerrain(raw);queueTerrain(mission,0,64,0,textures);
 assert.equal(mission.attempts,33282);assert.equal(mission.duplicates,226);
 const changed=[];for(let i=0;i<raw.length;i++)if(raw[i]!==mission.heights[i])changed.push([i%128,i>>>7,mission.heights[i]]);
 assert.deepEqual(changed,[[4,121,1],[6,121,1]],'native repair of enclosed zero-height points');
 const sampled=makeTerrain();assert.equal(height(sampled,0,6),1/45);assert.equal(height(sampled,4,6),1/45);
});
test('territory preserves native footprint asymmetry, overlap clearing and staggered recovery', async () => {
 const {markBuildingTerritory,refreshBuildingTerritory}=await import('../app/territory.ts');
 const land={categories:new Uint8Array(16384).fill(0xf0),regions:new Uint8Array(16384).fill(5),searchMarks:new Uint8Array(16384).fill(99),searchTag:254};
 const b={x:0,y:0,tribe:1},other={...b,x:512},index=(x,y)=>((y&127)*128)+(x&127);
 const marked=(x,y)=>!!(land.regions[index(x,y)]&32);
 markBuildingTerritory(land,b,5);
 assert.ok(marked(2,-4));assert.equal(marked(3,-4),false);
 assert.ok(marked(3,4),'native lower edge uses the second table entry');
 assert.equal(marked(4,4),false);assert.ok(marked(-4,0),'wraps through the map seam');
 const water=index(0,1);land.categories[water]=0xf1;
 markBuildingTerritory(land,other,5);
 markBuildingTerritory(land,{...b,tribe:2},5);
 markBuildingTerritory(land,b,5,true);
 assert.equal(marked(0,0),false,'removal clears a surviving building’s overlapping claim');
 assert.equal(land.regions[0],69,'other tribes and low coverage bits survive');
 assert.equal(land.regions[water],37,'non-ground cells are left unchanged');
 const tribe={id:1,playerType:1,defenceRadius:5,buildings:[other]};
 refreshBuildingTerritory(land,102,tribe);
 assert.equal(marked(0,0),false);assert.equal(land.searchTag,254);
 refreshBuildingTerritory(land,103,tribe);
 assert.ok(marked(0,0));assert.equal(land.searchTag,1);assert.ok(land.searchMarks.every(v=>v===0));
 const before=land.regions.slice();land.regions.fill(5);
 markBuildingTerritory(land,b,6);const fallback=land.regions.slice();land.regions.fill(5);
 markBuildingTerritory(land,b,11);assert.deepEqual(land.regions,fallback);
 assert.notDeepEqual(land.regions,before);
});
test('opening tooltips resolve mission cells and have an independent lifetime', () => {
 const w=createWorld(),state=createTooltip();
 for(const [mode,packed,text] of [[2,6668,'Dakini Warrior Training Hut.'],[2,64002,'Vault of Knowledge:'],[1,62994,'Stone Head:']]){
  const object=forcedTooltipObject(w,mode,packed);
  assert.ok(object,'original flyby cell resolves to a world object');
  showObjectTooltip(state,object,3);
  assert.ok(state.text.startsWith(text));
 }
 // The last tooltip has its own presentation lifetime, independent of tour flags.
 assert.equal(w.flyby.flags&1,0);
 for(let i=0;i<3;i++)stepTooltip(state,true,24);
 assert.equal(state.target,0);assert.equal(state.text,'');
 showObjectTooltip(state,forcedTooltipObject(w,2,64002),100);
 stepTooltip(state,false,24);
 assert.equal(state.target,0,'removing the target cancels its callout immediately');
 showObjectTooltip(state,forcedTooltipObject(w,1,0),100);
 assert.equal(state.target,0,'an empty original cell cannot retain the previous target');
});
function until(w,ready,seconds){for(let i=0;i<seconds*12&&!ready()&&w.status==='playing';i++)tick(w,1/12);assert.ok(ready(),'gameplay condition reached within its turn budget');}
function impact(w,spell){const shot=w.projectiles.find(p=>p.team==='blue'&&p.spell===spell);assert.ok(shot);for(let i=0;i<120&&w.projectiles.includes(shot);i++)tick(w,1/12);assert.ok(!w.projectiles.includes(shot),'spell resolves within ten seconds');}
function foundations(w){for(const b of w.buildings){for(const p of footprintPoints(b.kind,b)){assert.ok(walkable(w.terrain,p),'foundation vertices stay on dry land');assert.ok(Math.abs(worldPoint(w.terrain,p).y-b.foundation*45/128)<1e-9,'supporting vertices share the native foundation height');}for(const dx of [-2.8,0,2.8])for(const dz of [-2.8,0,2.8]){assert.ok(Math.abs(worldPoint(w.terrain,{x:b.x+dx,z:b.z+dz}).y-b.foundation*45/128)<1e-9,'interpolated ground supports the whole building');}}}
test('original level layout, native foundations, and the complete mission',()=>{
 const w=createWorld();assert.deepEqual(HOME,{x:9,z:33});assert.deepEqual(ENEMY,{x:1,z:-37});assert.equal(w.units.filter(u=>u.team==='blue'&&u.kind==='brave').length,6);assert.equal(w.buildings.length,4);assert.equal(w.shrines.length,3);assert.equal(w.units.filter(u=>u.team==='red').length,5);
 assert.ok(w.units.every(u=>walkable(w.terrain,u)));assert.equal(findPath(w.terrain,HOME,ENEMY).length,0);foundations(w);

 const snapshot=JSON.stringify({terrain:w.terrain,wood:w.wood,buildings:w.buildings});assert.equal(placeBuilding(w,'hut',{x:30,z:30}),false);assert.equal(placeBuilding(w,'hut',w.buildings[2]),false);assert.equal(placeBuilding(w,'camp',{x:4,z:32}),false);assert.equal(JSON.stringify({terrain:w.terrain,wood:w.wood,buildings:w.buildings}),snapshot,'invalid plans never terraform or consume timber');
 const brave=w.units.find(u=>u.team==='blue'&&u.kind==='brave'),bridge=w.shrines.find(s=>s.kind==='bridge');w.selected=[brave.id];command(w,bridge);until(w,()=>w.shots.bridge>=3,60);assert.equal(bridge.duration,28/3);
 select(w,'shaman');command(w,{x:0,z:20});advance(w,10);const charges=w.shots.bridge;assert.equal(cast(w,'bridge',{x:25,z:20}),false);assert.equal(w.shots.bridge,charges);assert.equal(cast(w,'bridge',{x:0,z:4}),true);advance(w,6);foundations(w);assert.ok(findPath(w.terrain,HOME,w.shrines[0]).length);
 command(w,{x:0,z:0});advance(w,9);const guard=w.units.find(u=>u.team==='red'&&u.z>-10);assert.ok(cast(w,'blast',{x:guard.x+1,z:guard.z}));advance(w,2);assert.ok(!w.units.includes(guard),'Blast knocks the guard off the western coast');command(w,w.shrines.find(s=>s.kind==='vault'));until(w,()=>w.unlockedCamp,45);
 assert.ok(placeBuilding(w,'camp',{x:4,z:32}));const camp=w.buildings.find(b=>b.team==='blue'&&b.kind==='camp');foundations(w);advance(w,70);assert.equal(camp.progress,1);assert.equal(camp.logs,8,'workers fetch exactly the needed logs');assert.equal(w.stats.trained,0,'training requires an explicit order');
 select(w,'brave');command(w,camp);advance(w,60);assert.ok(w.stats.trained>=3);assert.ok(w.units.some(u=>u.team==='blue'&&u.kind==='warrior'));
 select(w,'shaman');command(w,w.shrines.find(s=>s.kind==='lightning'));until(w,()=>w.shots.lightning===4,75);assert.equal(w.shots.lightning,4);assert.equal(w.shrines.find(s=>s.kind==='lightning').active,false);command(w,{x:0,z:-6});advance(w,10);assert.ok(cast(w,'bridge',{x:0,z:-22}));impact(w,'bridge');advance(w,6);assert.ok(findPath(w.terrain,HOME,ENEMY).length);assert.equal(bridge.active,false);foundations(w);
 command(w,{x:0,z:-22});advance(w,6);const enemyShaman=w.units.find(u=>u.team==='red'&&u.kind==='shaman');assert.ok(cast(w,'lightning',enemyShaman));impact(w,'lightning');assert.equal(w.redRespawn,0,'the native first-mission script disables Dakini reincarnation');assert.ok(!w.units.includes(enemyShaman));
 // Fight through the remaining defenders using the units that were actually trained above.
 select(w,'warrior');for(let attempt=0;attempt<30&&w.status==='playing';attempt++){const enemy=w.buildings.find(b=>b.team==='red')??w.units.find(u=>u.team==='red'&&u.inside===null);if(!enemy)break;command(w,enemy);advance(w,8);}
 // Use another earned Lightning gift if a defender survives the assault.
 if(w.status==='playing'){select(w,'shaman');command(w,{x:0,z:-22});advance(w,40);const last=w.units.find(u=>u.team==='red');assert.ok(last);assert.ok(cast(w,'lightning',last));impact(w,'lightning');}
 assert.equal(w.status,'won','the first mission can be won through the full discovery/build/train/combat loop');
});
test('housing, mana allocation, pause, drowning, and reincarnation',()=>{
 const w=createWorld(),brave=w.units.find(u=>u.team==='blue'&&u.kind==='brave');const idle=manaRate(w);w.selected=[brave.id];command(w,w.buildings.find(b=>b.team==='blue'));advance(w,8);assert.ok(brave.inside);assert.ok(manaRate(w)>idle);
 w.shots.blast=0;w.charging=false;advance(w,3);assert.equal(w.shots.blast,0);w.charging=true;advance(w,60);assert.ok(w.shots.blast>0);const time=w.time;w.paused=true;tick(w,2);assert.equal(w.time,time);w.paused=false;
 const shaman=w.units.find(u=>u.team==='blue'&&u.kind==='shaman');shaman.x=35;shaman.z=0;tick(w,1/12);assert.ok(w.respawn>0);advance(w,13);assert.ok(w.units.some(u=>u.team==='blue'&&u.kind==='shaman'));
 w.units=w.units.filter(u=>u.team!=='blue');until(w,()=>w.status==='lost',2);
});

test('native transformed compound bases stay on their ground pads',()=>{
 const w=createWorld();
 for(const [index,id] of [[0,136],[1,104],[2,131],[3,131]]){
  const b=w.buildings[index],data=nativeModels[id],basis=modelMatrix(Math.round(b.angle*1024/Math.PI));
  for(let i=0;i<data.p.length;i+=3){
   const raw=[Math.round(data.p[i]*data.scale*3),Math.round(data.p[i+1]*data.scale*3),Math.round(-data.p[i+2]*data.scale*3)];
   if(Math.abs(raw[1])>5)continue;
   const p=modelPoint(raw,data.scale,basis,{x:0,y:Math.round(b.foundation*45),z:0});
   const ground=worldPoint(w.terrain,{x:b.x+p.x/128,z:b.z-p.z/128});
   const gap=p.y/128-ground.y;
   assert.ok(gap>=-1/128&&gap<=3/128,`native model ${id} base gap ${gap}`);
  }
 }
});

test('native animation identity, casting interruption, gradual terrain and blast survival',async()=>{
 const {readFileSync}=await import('node:fs'),sprites=JSON.parse(readFileSync(new URL('../app/original-units.json',import.meta.url))),w=createWorld();
 assert.equal(sprites.animations['blue-shaman'].walk[0].source,616);assert.equal(sprites.animations['red-shaman'].walk[0].source,624);assert.equal(sprites.animations['blue-brave'].carry[0].source,72);assert.equal(sprites.animations['blue-warrior'].attack[0].source,120);
 assert.ok(sprites.frames.every(f=>f.w>0&&f.h>0&&f.w<=sprites.cell&&f.h<=sprites.cell));
 const shaman=w.units.find(u=>u.team==='blue'&&u.kind==='shaman'),brave=w.units.find(u=>u.team==='blue'&&u.kind==='brave');
 assert.equal(maxHp('brave'),50);assert.equal(maxHp('warrior'),90);
 w.selected=[brave.id];brave.target=32;assert.equal(unitAnimation(w,brave),'selected','an assigned distant enemy is not an active fight');brave.fighting=true;assert.equal(unitAnimation(w,brave),'attack','automatic melee displays its attack sprite');brave.fighting=false;brave.target=null;brave.cargo=1;brave.path=[{x:brave.x+1,z:brave.z}];assert.equal(unitAnimation(w,brave),'carry');brave.lift=.5;assert.equal(unitAnimation(w,brave),'airborne');brave.lift=0;brave.cargo=0;brave.path=[];
 w.manaTribes[0].available=0; // Isolate spending from the starting-mana grant.
 w.selected=[shaman.id];const shots=w.shots.blast;assert.ok(cast(w,'blast',shaman));assert.equal(unitAnimation(w,shaman),'cast');command(w,{x:10,z:32});advance(w,.6);assert.equal(w.shots.blast,shots-1,'native spell allocation spends the charge before animation finishes');assert.equal(shaman.casting,null);assert.ok(w.projectiles.length,'movement does not delete the independent spell');impact(w,'blast');
 while(w.castingTribes[0].cooldown)tick(w,1/12);
 shaman.x=0;shaman.z=20;shaman.path=[];w.shots.bridge=1;const before=[...w.terrain];assert.ok(cast(w,'bridge',{x:0,z:4}));impact(w,'bridge');tick(w,1/12);const rise=w.effects.find(e=>e.kind==='bridge');assert.ok(rise.land.length>0);const sample=rise.land.find(p=>p.to-p.from>1);assert.ok(w.terrain[sample.index]>before[sample.index]&&w.terrain[sample.index]<sample.to);advance(w,6);assert.equal(w.terrain[sample.index],sample.to);foundations(w);
 shaman.x=0;shaman.z=0;brave.x=2;brave.z=0;brave.team='red';brave.work=null;brave.inside=null;const hp=brave.hp;assert.ok(cast(w,'blast',brave));impact(w,'blast');assert.ok(brave.hp>0&&brave.hp<hp,'blast injures and launches a healthy follower instead of instantly killing');assert.ok(brave.lift>0);assert.equal(unitAnimation(w,brave),'airborne');
 const hut=w.buildings.find(b=>b.team==='blue');for(const [angle,x,z] of [[0,-3,44.5],[Math.PI/2,-6.5,41],[Math.PI,-3,37.25],[3*Math.PI/2,.75,41]]){hut.angle=angle;assert.deepEqual(entrance(w,hut),{x,z},'door routes use native rotated shape offsets and coarse anchors');}
});


test('native economy uses fixed turns, population bands and real hut upgrades',()=>{
 const a=createWorld(),b=createWorld();
 for(const w of [a,b]){w.shots.blast=0;select(w,'shaman');command(w,{x:0,z:20});}
 for(let i=0;i<900;i++)tick(a,1/30);
 for(let i=0;i<4320;i++)tick(b,1/144);
 assert.deepEqual(b,a,'render frame rate cannot change the simulation');
 const paused=JSON.stringify(a);a.paused=true;tick(a,10);a.paused=false;assert.equal(JSON.stringify(a),paused,'pause cannot accumulate a catch-up burst');
 assert.throws(()=>tick(a,NaN),RangeError);
 const w=createWorld();w.buildings=[];w.shots.blast=0;tick(w,1/4);assert.equal(w.mana,0);tick(w,1/12);assert.equal(w.mana,.067,'four turns: floor((6*4+30)*320/256) native mana');
 const village=createWorld(),hut=village.buildings.find(b=>b.team==='blue');
 assert.equal(populationLimit(village,'blue'),12);
 for(const [level,capacity] of [[1,3],[2,4],[3,5]]){hut.level=level;assert.equal(housing(hut),capacity);}hut.level=1;
 assert.equal(breedingWork(village,hut),1187,'integer 8.8 percentage conversion matches the executable');
 for(let i=0;i<3;i++)addUnit(village,'blue','brave',HOME);
 assert.equal(breedingWork(village,hut),1390,'population band increases at ten followers');
 assert.equal(trainingCost(village,'blue'),3500);
 for(let i=0;i<4;i++)addUnit(village,'blue','warrior',HOME);
 assert.equal(trainingCost(village,'blue'),4375);
 const warrior=village.units.find(u=>u.kind==='warrior'&&u.team==='blue');warrior.hp=45;assert.equal(meleeDamage(warrior),9);warrior.hp=.1;assert.equal(meleeDamage(warrior),1.6,'minimum native melee damage is 32');
 const grow=createWorld(),h=grow.buildings.find(b=>b.team==='blue'),residents=grow.units.filter(u=>u.team==='blue'&&u.kind==='brave').slice(0,3);
 for(const u of residents){u.inside=h.id;u.work=h.id;u.path=[];}
 const count=grow.units.length;h.timer=breedingWork(grow,h)-8;grow.turn=3;grow.time=.25;tick(grow,1/12);assert.equal(grow.units.length,count+1);assert.equal(h.timer,0);
 grow.turn=15;grow.time=15/12;h.upgrade=2392;tick(grow,1/12);assert.equal(h.level,2);assert.equal(h.progress,0);assert.equal(h.logs,0,'mature huts require upgrade timber');assert.equal(h.upgrading,true);
 advance(grow,70);assert.equal(h.progress,1);assert.equal(h.logs,3);assert.equal(h.upgrading,false);foundations(grow);
 const capped=createWorld();while(capped.units.filter(u=>u.team==='blue').length<populationLimit(capped,'blue'))addUnit(capped,'blue','brave',HOME);
 const ch=capped.buildings.find(b=>b.team==='blue');ch.timer=99999;tick(capped,1/3);assert.equal(ch.timer,0);assert.equal(capped.units.filter(u=>u.team==='blue').length,12,'breeding stops at the settlement population limit');
});


test('lightning hits a native map cell and Blast leaves allied health intact',()=>{
 const w=createWorld();w.buildings=[];const shaman=w.units.find(u=>u.team==='blue'&&u.kind==='shaman');
 shaman.x=0;shaman.z=0;w.units=w.units.filter(u=>u.kind==='shaman');
 const hit=addUnit(w,'blue','brave',{x:2.2,z:.2}),outside=addUnit(w,'blue','brave',{x:1.9,z:.2});
 w.shots.lightning=1;assert.ok(cast(w,'lightning',{x:2.3,z:.3}));impact(w,'lightning');
 assert.ok(!w.units.includes(hit));assert.equal(outside.hp,maxHp('brave'));assert.equal(outside.lift,0,'adjacent cells receive no invented radial lightning damage');
 while(w.castingTribes[0].cooldown)tick(w,1/12);
 const ally=addUnit(w,'blue','brave',{x:2,z:0});const hp=ally.hp;
 assert.ok(cast(w,'blast',ally));impact(w,'blast');assert.equal(ally.hp,hp);assert.ok(ally.lift>0,'allies can be launched without taking Blast damage');
});

test('native integer movement and combat exchanges preserve timing, retaliation and replay',async()=>{
 for(const [x,z,angle] of [[0,-256,0],[256,-256,256],[256,0,512],[256,256,768],[0,256,1024],[-256,256,1280],[-256,0,1536],[-256,-256,1792]])assert.equal(nativeAngle(x,z),angle);
 assert.deepEqual(nativeStep({x:0,z:0},256,70),{x:49/256,z:-49/256});
 assert.deepEqual(nativeStep({x:0,z:0},1280,70),{x:-50/256,z:50/256},'signed native products round down, not toward zero');
 const moving=createWorld();moving.terrain.fill(3);moving.buildings=[];moving.units=[];
 const walker=addUnit(moving,'blue','brave',{x:0,z:0});addUnit(moving,'red','brave',{x:40,z:40});walker.path=[{x:10,z:0}];tick(moving,1/12);
 assert.equal(walker.x,70/256);assert.equal(walker.z,0);assert.equal(walker.heading,Math.PI/2);
 const rng=createWorld();assert.deepEqual(Array.from({length:6},()=>random(rng)),[1275068418,1896767491,2517695575,2629181784,3921238491,2630906275]);
 const duel=(seed=1)=>{const w=createWorld();w.terrain.fill(3);w.units=[];w.buildings=[];w.randomState=seed;const a=addUnit(w,'blue','warrior',{x:0,z:0}),b=addUnit(w,'red','brave',{x:180/256,z:0}),group={id:w.nextId++,x:0,z:0,angle:512,members:[a.id,b.id]};w.fights=[group];for(const [u,other] of [[a,b],[b,a]])u.fight={group:group.id,opponent:other.id,action:'ready',started:0,until:0};return w;};
 const a=duel(),b=structuredClone(a);b.units.reverse();tick(a,1/12);tick(b,1/12);b.units.sort((a,b)=>a.id-b.id);assert.deepEqual(b,a,'one coordinated exchange is independent of unit array order');
 assert.equal(a.units[0].hp,87);assert.equal(a.units[1].hp,32,'the brave retaliates with its pre-hit health');
 assert.equal(a.units[0].fight.action,'attack');assert.equal(a.units[1].fight.action,'recoil');
 assert.equal(a.units[0].heading,Math.PI/2);assert.equal(a.units[1].heading,Math.PI*1.5);
 tick(a,3/12);assert.equal(a.units[1].hp,32,'no second exchange during animation recovery');const before=a.units[1].x,speed=random(structuredClone(a))%70+35,impulse=speed+(speed>>4);tick(a,1/12);assert.equal(a.units[1].fight.action,'push');assert.equal(a.units[1].x,before+(impulse+Math.max(0,impulse-28))/256,'the first recoil turn applies the native impulse, then ground damping and movement');tick(a,2/12);assert.notEqual(a.units[1].fight.action,'push');tick(a,2);assert.ok(a.units[1].hp<32);
 const special=duel(75);tick(special,1/12);assert.equal(special.units[0].fight.action,'special');assert.equal(special.units[0].hp,90,'state 4 suppresses retaliation');assert.equal(special.units[0].fight.until-special.turn,7);
 const strike=duel(12);tick(strike,1/12);assert.equal(strike.units[0].fight.action,'strike');assert.equal(strike.units[0].hp,87);
 const lethal=duel();for(const u of lethal.units)u.hp=1;tick(lethal,1/12);assert.equal(lethal.units.length,0,'a lethal ordinary exchange still applies both precomputed hits');assert.equal(lethal.fights.length,0,'terminal turns retain no dead fight groups');
 const replay=duel(),other=structuredClone(replay);for(let i=0;i<150;i++)tick(replay,1/30);for(let i=0;i<720;i++)tick(other,1/144);assert.deepEqual(other,replay);
 const {readFileSync}=await import('node:fs'),sprites=JSON.parse(readFileSync(new URL('../app/original-units.json',import.meta.url)));
 for(const [kind,state,start,frames] of [['warrior','attack',120,6],['warrior','strike',104,7],['warrior','special',200,7],['brave','recoil',112,7],['shaman','special',552,5],['shaman','recoil',424,5]]){const cycle=sprites.animations[`blue-${kind}`][state][0];assert.equal(cycle.source,start);assert.equal(cycle.frames.length,frames);}
});

test('native fight slots form four-person groups and release on interruption',()=>{
 const w=createWorld();w.terrain.fill(3);w.units=[];w.buildings=[];
 const center=addUnit(w,'blue','warrior',{x:0,z:0});
 for(let i=0;i<4;i++)addUnit(w,'red','brave',{x:.4+i*.1,z:0});
 tick(w,1/12);assert.equal(w.fights.length,1);assert.equal(w.fights[0].members.length,4,'one center and at most three attackers');
 assert.equal(w.units.filter(u=>u.fight).length,4);assert.equal(center.hp,90,'contact first creates and stages a fight');
 const b=w.fights[0];assert.equal(b.members[0],center.id);
 for(let i=1;i<4;i++){const p=fightPosition(b,i);assert.ok(Math.abs(Math.hypot(p.x-b.x,p.z-b.z)-180/256)<.006);}
 const replay=structuredClone(w);for(let i=0;i<30;i++)tick(w,1/30);for(let i=0;i<144;i++)tick(replay,1/144);assert.deepEqual(replay,w,'group movement and RNG do not depend on render rate');
 const slots=w.fights[0].members.map((_,i)=>fightPosition(w.fights[0],i));assert.equal(new Set(slots.map(p=>`${p.x}:${p.z}`)).size,4);
 const shaman=addUnit(w,'blue','shaman',{x:3,z:0});assert.ok(cast(w,'blast',center));impact(w,'blast');
 assert.equal(center.fight,null);assert.ok(center.lift>0);assert.equal(w.fights.length,0,'launched participants leave no stale fight group');assert.equal(shaman.lift,0);
 const swap=createWorld();swap.terrain.fill(3);swap.units=[];swap.buildings=[];
 const a=addUnit(swap,'blue','brave',{x:0,z:0}),enemy=addUnit(swap,'red','warrior',{x:.6,z:0});addUnit(swap,'blue','brave',{x:1,z:0});tick(swap,1/12);
 assert.equal(swap.fights[0].members[0],enemy.id,'adding another member moves the outnumbered tribe into the center');
 swap.selected=[a.id];command(swap,{x:10,z:0});assert.equal(a.fight,null,'a new order releases the old fight assignment');
});

test('native sound cues preserve sample identity, cast phases and simulation randomness',async()=>{
 const {cueVariant,audioRandom,soundAttenuation}=await import('../app/audio.ts');
 const {default:audio}=await import('../app/original-sound.json',{with:{type:'json'}});
 assert.equal(audioRandom(1),1275068418);
 const blast=cueVariant(0xa1,1);assert.equal(blast.key,'sound-105');assert.equal(blast.pitch,.96);assert.equal(blast.state,1896767491);
 assert.equal(audio.samples.sound['105'].name,'blast4');
 assert.equal(cueVariant(0x18,1).key,'sound-42');assert.equal(audio.samples.sound['42'].name,'Sv_sel02');
 assert.equal(cueVariant(0xd,1).key,'fight-3');assert.equal(audio.samples.fight['3'].name,'Punch11');
 assert.equal(cueVariant(0,1),null);assert.equal(soundAttenuation(0),1);assert.equal(soundAttenuation(0x4800000),.5);assert.equal(soundAttenuation(0x9000000),0);
 const make=()=>{const w=createWorld();w.terrain.fill(3);w.buildings=[];w.units=w.units.filter(u=>u.kind==='shaman');w.units[0].x=0;w.units[0].z=0;const enemy=w.units.find(u=>u.team==='red');enemy.x=30;enemy.z=30;return w;};
 const w=make(),ids=w.nextId,rng=w.randomState;assert.ok(cast(w,'blast',{x:4,z:0}));
 assert.deepEqual(w.sounds.map(e=>e.cue),[0x76]);assert.equal(w.nextId,ids+1);assert.equal(w.randomState,rng);
 for(let i=0;i<5;i++)tick(w,1/12);assert.equal(w.sounds.length,1);
 tick(w,1/12);assert.deepEqual(w.sounds.map(e=>e.cue),[0x76,0xa1]);assert.equal(w.effects.some(e=>e.kind==='blast'),false);impact(w,'blast');assert.deepEqual(w.sounds.map(e=>e.cue),[0x76,0xa1,0xb2]);assert.deepEqual(w.sounds.map(e=>e.turn),[0,6,9]);
 const canceled=make();assert.ok(cast(canceled,'blast',{x:4,z:0}));canceled.selected=[canceled.units[0].id];command(canceled,{x:1,z:0});impact(canceled,'blast');assert.deepEqual(canceled.sounds.map(e=>e.cue),[0x76,0xa1,0xb2]);
 const a=make(),b=make();cast(a,'blast',{x:4,z:0});cast(b,'blast',{x:4,z:0});for(let i=0;i<30;i++)tick(a,1/30);for(let i=0;i<144;i++)tick(b,1/144);assert.deepEqual(a.sounds,b.sounds);
});


test('native spell allocation, discrete flight, RNG trails and delayed impact',()=>{
 const make=()=>{const w=createWorld();w.terrain.fill(3);w.buildings=[];w.units=w.units.filter(u=>u.kind==='shaman');Object.assign(w.units[0],{x:0,z:0});Object.assign(w.units[1],{x:30,z:30});return w;};
 assert.deepEqual(nativeStep3D({x:32760,y:-32760,h:32760},2047,511,-321),{x:32760,y:32455,h:32759},'negative odd length and short wrapping verified against x86');
 const w=make();cast(w,'blast',{x:10,z:0});assert.equal(w.shots.blast,3);assert.deepEqual(w.projectiles[0].target,{x:11,z:-1});tick(w,6/12);
 assert.equal(w.projectiles[0].phase,'flying');assert.equal(w.effects.some(e=>e.kind==='blast'),false);assert.equal(w.projectiles[0].visuals.length,5);
 tick(w,1/12);assert.deepEqual(w.projectiles[0].position,{x:3041,y:-1960,h:198});assert.equal(w.randomState,1,'no jitter on the first Blast movement turn');
 tick(w,1/12);assert.deepEqual(w.projectiles[0].position,{x:4034,y:-1872,h:165});assert.equal(w.randomState,1335621054,'four trailing particles consume eight simulation draws');
 tick(w,1/12);assert.equal(w.projectiles[0].phase,'arrived');assert.equal(w.effects.some(e=>e.kind==='blast'),false);tick(w,1/12);assert.equal(w.projectiles.length,0);assert.equal(w.effects.find(e=>e.kind==='blast').age,0);assert.deepEqual(w.sounds.map(e=>e.turn),[0,6,10]);
 const lightning=make();lightning.shots.lightning=1;cast(lightning,'lightning',{x:10,z:0});tick(lightning,6/12);assert.deepEqual(lightning.projectiles[0].destination,{x:3334,y:-1929,h:1159});tick(lightning,1/12);assert.equal(lightning.randomState,2308592903);assert.deepEqual(lightning.projectiles[0].position,{x:2814,y:-1985,h:791});assert.equal(lightning.effects.filter(e=>e.sprite?.sequence==='spellTrail').length,20);
 const a=make(),b=make();a.shots.bridge=b.shots.bridge=1;cast(a,'bridge',{x:10,z:0});cast(b,'bridge',{x:10,z:0});for(let i=0;i<30;i++)tick(a,1/30);for(let i=0;i<144;i++)tick(b,1/144);assert.deepEqual(a,b,'flight, effects and simulation RNG are independent of rendering FPS');
 const dead=make();dead.manaTribes[0].available=0;cast(dead,'blast',{x:10,z:0});dead.units[0].hp=0;tick(dead,1/12);assert.equal(dead.projectiles.length,0);assert.equal(dead.shots.blast,3,'caster death removes a pending spell without refunding the spent shot');
 const won=createWorld();won.terrain.fill(3);won.units=won.units.filter(u=>u.kind==='shaman');Object.assign(won.units[0],{x:0,z:0});Object.assign(won.units[1],{x:9,z:-1});won.shots.lightning=1;cast(won,'lightning',won.units[1]);impact(won,'lightning');assert.equal(won.status,'playing','the last casualty does not end the level between outcome phases');until(won,()=>won.status==='won',3);assert.equal(won.turn,32);assert.ok(won.buildings.some(b=>b.team==='red'),'victory requires followers, not every empty building');
});


test('native terrain ridges, reflected diagonals, surface planes and boundary vertices',()=>{
  assert.equal(nativeTerrainCross(0,0,0,1),true,'rounded-mean ties retain native bit 0');
  assert.equal(nativeTerrainCross(0,148,0,0),false);
  const original=Array(16384).fill(0);original[1]=148;
  assert.equal(nativeTerrainHeight(original,256,256),0,'ridge center is not bilinear average 37');
  assert.equal(makeTerrain()[(-41+48)*GRID-7+48],-.35,'original zero-height ridge stays below the sea');
  for(const corners of [[0,0,0,8],[0,8,0,0]]){
    const t=Array(GRID*GRID).fill(0),i=48*GRID+48;
    [i,i+1,i+GRID,i+GRID+1].forEach((k,j)=>t[k]=corners[j]);
    const cross=terrainCross(...corners);
    const vertices=[[0,0],[1,0],[0,1],[1,1]].map(([x,z],j)=>({x,y:corners[j]*45/128,z}));
    const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z,sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
    for(const x of [.1,.4,.9])for(const z of [.1,.6,.9]){
      const ids=cross?(x+z<=1?[0,1,2]:[3,2,1]):(z<x?[0,1,3]:[0,2,3]);
      const a=vertices[ids[0]],u=sub(vertices[ids[1]],a),v=sub(vertices[ids[2]],a);
      const n={x:u.y*v.z-u.z*v.y,y:u.z*v.x-u.x*v.z,z:u.x*v.y-u.y*v.x};
      assert.ok(Math.abs(dot(n,sub(worldPoint(t,{x,z}),a)))<1e-10,'unit position lies on its rendered triangle plane');
    }
    assert.equal(height(t,.5,.5),cross?(corners[1]+corners[2])/2:(corners[0]+corners[3])/2);
  }
  const t=Array(GRID*GRID).fill(0);t[t.length-1]=123;
  assert.equal(height(t,48,48),123,'outermost vertex is exact');
});


test('original campaign setup disables only enemy reincarnation and retains deferred commands',()=>{
 const host={turn:0,tribe:1,readInternal:()=>0,command:()=>{}};
 assert.throws(()=>runScript({...originalScript,codes:[12,1003]},scriptState(originalScript),host),/Truncated/);
 assert.throws(()=>runScript({...originalScript,codes:[12,1003,1006,65535,1004,1019]},scriptState(originalScript),host),/Unknown game command/);
 const w=createWorld();assert.equal(w.ai.reincarnation,false);assert.equal(w.ai.attributes[32],128);assert.equal(w.ai.attributes[33],1);assert.equal(w.ai.attributes[18],45);
 assert.ok(w.ai.states&1,'native construction state enabled');assert.equal(w.ai.states&(1<<2),0,'native wild conversion state disabled');
 assert.ok(w.ai.pendingCommands.some(c=>c.opcode===1112),'unimplemented game commands remain explicit');
 const shaman=w.units.find(u=>u.team==='red'&&u.kind==='shaman');shaman.hp=0;tick(w,1/12);advance(w,15);
 assert.ok(w.units.some(u=>u.team==='red'));assert.ok(!w.units.some(u=>u.team==='red'&&u.kind==='shaman'));assert.equal(w.redRespawn,0);
 const fresh=createWorld();fresh.ai.attributes[0]=99;assert.equal(createWorld().ai.attributes[0],12,'new games own independent script state');
});


test('campaign markers remove the bridge head on the native phase, independently of routing',()=>{
 const w=createWorld(),head=w.shrines.find(s=>s.kind==='bridge');
 const set=(index,h)=>{const p=nativeCellPoint(level.markers[index]);w.terrain[(p.z+48)*GRID+p.x+48]=h===0?-.35:h/45;};
 assert.deepEqual(nativeCellPoint(level.markers[35]),{x:-6,z:14});
 assert.deepEqual(nativeCellPoint(level.markers[35]|0x101),{x:-6,z:14},'odd native coordinate bits ignored');
 assert.equal(markerHeight(w.terrain,35),0);assert.throws(()=>markerHeight(w.terrain,256),/Invalid campaign marker/);
 set(40,45);for(let i=0;i<30;i++)tick(w,1/12);assert.equal(w.turn,30);assert.ok(w.shrines.includes(head),'both crossings are required');assert.equal(w.ai.variables[52],45);assert.equal(w.ai.variables[50],0);
 set(29,45);for(let i=0;i<31;i++)tick(w,1/12);assert.ok(w.shrines.includes(head),'next EVERY 31 2 phase is turn 61');
 const brave=w.units.find(u=>u.team==='blue'&&u.kind==='brave');brave.work=head.id;
 tick(w,1/12);assert.equal(w.turn,62);assert.ok(!w.shrines.includes(head));assert.equal(head.active,false);assert.equal(brave.work,null);
 assert.equal(findPath(w.terrain,HOME,ENEMY).length,0,'native rule does not require a walkable route');assert.equal(w.shrines.length,2);
 const fresh=createWorld();const count=fresh.shrines.length;removeHead(fresh,0,0);assert.equal(fresh.shrines.length,count,'wrong cell leaves heads intact');
 removeHead(fresh,3,223);assert.equal(fresh.shrines.length,count-1,'odd coordinates select the same native cell');assert.ok(fresh.shrines.every(s=>s.kind!=='bridge'));
});

test('campaign counters track allocation and remaining head gifts through gameplay',()=>{
 const w=createWorld(),shaman=w.units.find(u=>u.team==='blue'&&u.kind==='shaman');
 const fields=[[0,0],[2,1185],[1,7]],program={fields};
 w.spellCasts[0][2]=254;
 assert.equal(cast(w,'blast',{x:100,z:100}),false);assert.equal(w.spellCasts[0][2],254,'rejected orders do not allocate');
 assert.ok(cast(w,'blast',shaman));campaignCommand(w,1076,[1118,1,2],program);assert.equal(w.ai.variables[7],255,'counts before impact');
 shaman.hp=0;tick(w,1/12);assert.equal(w.projectiles.length,0);assert.equal(w.spellCasts[0][2],255,'canceled spells retain their cast count');
 recordSpellCast(w,0,2);assert.equal(w.spellCasts[0][2],0,'the original byte wraps');assert.equal(w.stats.cast,1,'UI total remains a separate statistic');
 const fresh=createWorld();assert.equal(fresh.spellCasts[0][2],0);recordSpellCast(fresh,1,2);assert.equal(fresh.spellCasts[0][2],0,'tribes have independent counters');
 assert.throws(()=>recordSpellCast(w,4,2),/Invalid native spell identity/);
 const head=fresh.shrines.find(s=>s.kind==='lightning'),brave=fresh.units.find(u=>u.team==='blue'&&u.kind==='brave');
 const headQuery={fields:[[0,19],[0,247],[1,0]]};
 campaignCommand(fresh,1131,[0,1,2],headQuery);assert.equal(fresh.ai.variables[0],4,'query reports gifts remaining, not gifts already awarded');
 Object.assign(brave,{x:head.x,z:head.z,work:head.id,path:[]});
 const finish=(head)=>{Object.assign(head,{work:head.target*head.required**2-1,enabled:true,reset:false,cooldown:0});tick(fresh,1/3);};
 for(let remaining=3;remaining>=0;remaining--){finish(head);campaignCommand(fresh,1131,[0,1,2],headQuery);assert.equal(fresh.ai.variables[0],remaining);}
 assert.equal(head.active,false);assert.equal(fresh.shots.lightning,0,'head depletion precedes reward delivery');until(fresh,()=>fresh.shots.lightning===4,8);
 campaignCommand(fresh,1077,[0,1,2],{fields:[[0,0],[2,1186],[1,0]]});assert.equal(fresh.ai.variables[0],4);
 removeHead(fresh,18,246);campaignCommand(fresh,1131,[0,1,2],headQuery);assert.equal(fresh.ai.variables[0],0,'absent heads return zero');
 const bridge=fresh.shrines.find(s=>s.kind==='bridge');Object.assign(brave,{x:bridge.x,z:bridge.z,work:bridge.id,path:[]});
 finish(bridge);assert.equal(bridge.remaining,0);assert.equal(bridge.active,true,'zero initial trigger count means unlimited');
 bridge.remaining=-1;finish(bridge);assert.equal(bridge.remaining,-1);assert.equal(bridge.active,false,'negative trigger counts fire once and retain their value');
 assert.throws(()=>campaignCommand(fresh,1077,[1119,1,2],program),/Unbound one-off spell stock/,'unported AI stock is not silently reported as zero');
 assert.throws(()=>campaignCommand(fresh,1076,[1118,1,2],{fields:[[0,0],[0,2],[1,64]]}),/Invalid campaign query destination/);
 assert.throws(()=>campaignCommand(fresh,1059,[]),/Unbound campaign command/);
});

test('worship decays without followers and continues at full spell stock', () => {
 const w = createWorld(), head = w.shrines.find(s => s.kind === 'bridge');
 const brave = w.units.find(u => u.team === 'blue' && u.kind === 'brave');
 Object.assign(brave, {x: head.x, z: head.z, work: head.id, path: []});
 w.shots.bridge = 4;
 advance(w, 4);
 assert.equal(head.work, 12, 'full stock does not pause worship');
 brave.work = null;
 advance(w, 2);
 assert.equal(head.work, 6, 'leaving the head loses accumulated work');
 brave.work = head.id;
 until(w, () => head.uses === 1, 10);
 assert.equal(w.gifts.length, 1);
 assert.equal(w.giftCounts.bridge, 0);
 removeHead(w, 2, 222);
 for (let i = 0; i < 81; i++) tick(w, 1 / 12);
 assert.equal(w.giftCounts.bridge, 0, 'the reward waits 82 turns after firing');
 tick(w, 1 / 12);
 assert.equal(w.gifts.length, 0, 'a spawned gift survives removal of its head');
 assert.equal(w.shots.bridge, 4, 'an award at the cap does not create a fifth shot');
 assert.equal(w.giftCounts.bridge, 1, 'the separate gift counter still advances');
 const shaman = w.units.find(u => u.kind === 'shaman' && u.team === 'blue');
 assert.ok(cast(w, 'bridge', shaman));
 assert.equal(w.shots.bridge, 3);
 assert.equal(w.giftCounts.bridge, 0, 'human casting spends a gift count too');
});

test('vault discovery follows worship, door, entry and exit tasks', () => {
 const w = createWorld(), vault = w.shrines.find(s => s.kind === 'vault');
 // Independent named knowledge.3ds reference, rounded to 1/10,000 model units.
 const points = nativeModels[vault.model].p, unique = new Map();
 for (let i=0;i<points.length;i+=3) {
  const p=[points[i],points[i+1],-points[i+2]].map(v=>Math.round(v*10000));
  unique.set(JSON.stringify(p),p);
 }
 const vertices=[...unique.values()].sort((a,b)=>a[0]-b[0]||a[1]-b[1]||a[2]-b[2]);
 assert.equal(createHash('sha256').update(JSON.stringify(vertices)).digest('hex'),
  '977d4efcc02c8ac2269fb8e44d56c442b2a3b0a27da8c9eabbf1760ab105481e',
  'the rendered vault matches the named stone pyramid, not the prison or a hut');
 const shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman');
 // Isolate the interaction from the nearby mission defender.
 w.units = w.units.filter(u => u.team === 'blue' || u.z < -20);
 const door = entrance(w, vault, 2);
 Object.assign(shaman, door);
 w.selected = [shaman.id];
 command(w, vault);
 until(w, () => vault.work >= 10, 5);
 command(w, {x: -3, z: 1});
 assert.equal(shaman.vault, null, 'a new order cancels the task');
 const work = vault.work;
 advance(w, 1);
 assert.ok(vault.work < work, 'vault work decays after interruption');
 command(w, vault);
 until(w, () => shaman.vault?.phase === 3, 20);
 const opening = w.turn;
 assert.equal(w.unlockedCamp, false, 'full worship alone does not grant knowledge');
 until(w, () => shaman.vault?.phase === 4, 4);
 assert.equal(w.turn - opening, 40);
 assert.equal(vault.model, 153);
 assert.equal(vault.morph, null, 'the open endpoint becomes a static object');
 until(w, () => shaman.vault?.phase === 5, 5);
 const inside = w.turn;
 until(w, () => shaman.vault?.phase === 6, 3);
 assert.equal(w.turn - inside, 24);
 assert.equal(w.gifts.length, 0, 'the task signals the trigger for its next turn');
 tick(w, 1 / 12);
 assert.equal(w.gifts.length, 1);
 assert.equal(vault.active, false);
 assert.ok(shaman.vault, 'trigger deletion does not cancel the exit task');
 until(w, () => shaman.vault === null, 20);
 until(w, () => w.unlockedCamp, 8);
 assert.equal(vault.model, 152);
 assert.equal(vault.morph.to, 155, 'closing uses the native base mesh with final target points');
 assert.equal(w.sounds.filter(s => s.cue === 0x9f).length, 2);
 assert.equal(vault.uses, 1);
});

test('original discovery messages follow script phases, persist and reset',async()=>{
 const {messageText,removeMessage}=await import('../app/messages.ts');
 const w=createWorld();w.shots.bridge=1;w.turn=14;
 tick(w,1/12);assert.equal(w.messages.slots.filter(Boolean).length,0);
 tick(w,1/12);const bridge=w.messages.slots.find(Boolean);
 assert.equal(bridge.stringId,615);assert.match(messageText(bridge.stringId),/Single Shot Landbridge/);
 w.shrines.find(s=>s.kind==='lightning').remaining=3;w.turn=61;tick(w,1/12);
 assert.deepEqual(w.messages.slots.filter(Boolean).map(m=>m.stringId),[615,616]);
 for(let i=0;i<128;i++)tick(w,1/12);
 assert.deepEqual(w.messages.slots.filter(Boolean).map(m=>m.stringId),[615,616,611],'discovery flags prevent duplicates; the opening message fires once');
 w.paused=true;const before=structuredClone(w.messages);tick(w,2);assert.deepEqual(w.messages,before);
 removeMessage(w.messages,0);assert.equal(w.messages.slots[0],null);assert.equal(w.messages.slots[1].stringId,616);
 assert.equal(createWorld().messages.slots.filter(Boolean).length,0);
});

test('partial building queries consume their mode once and marker triggers bypass worship',async()=>{
 const {campaignCommand,campaignInternal,forceHead,addBuilding}=await import('../app/model.ts');
 const {default:level}=await import('../app/level-one.ts');
 const w=createWorld();const hut=w.buildings.find(b=>b.team==='blue');
 const count=campaignInternal(w,1082);addBuilding(w,'blue','hut',HOME,false);
 campaignCommand(w,1136,[]);assert.equal(campaignInternal(w,1185),2);
 assert.equal(w.ai.includeIncompleteBuildings,true,'unrelated reads preserve the one-shot mode');
 assert.equal(campaignInternal(w,1082),count+1);assert.equal(campaignInternal(w,1082),count);
 hut.level=2;assert.equal(campaignInternal(w,1083),1,'upgrades move between native model counters');
 const head=w.shrines.find(s=>s.kind==='lightning'),old=level.markers[255];
 try{
  level.markers[255]=0xf713;head.reset=false;head.enabled=true;w.turn=1;
  forceHead(w,255);assert.equal(head.forced,true);tick(w,1/12);
  assert.equal(head.uses,1,'force works outside the fourth-turn worship sample');
  assert.equal(w.gifts.filter(g=>g.kind==='lightning').length,1);
  tick(w,2/12);assert.equal(head.forced,false,'reset clears the retained force bit');assert.equal(head.uses,1);
 }finally{level.markers[255]=old;}
 assert.throws(()=>forceHead(w,256),RangeError);
});


test('original opening runs before object turn 72 and its independent flyby clock can be interrupted', async () => {
 const {stepFlyby,interruptFlyby}=await import('../app/flyby.ts');
 const w=createWorld();
 for(let i=0;i<71;i++)tick(w,1/12);
 assert.equal(w.flyby.flags&1,0);assert.equal(w.inputMask,128);
 tick(w,1/12);
 assert.equal(w.flyby.events.length,18);assert.equal(w.flyby.warmup,6);
 assert.equal(w.flyby.flags&1,1);assert.equal(w.inputMask,64);
 assert.equal(w.messages.slots[w.lastMessage].stringId,611);
 assert.equal(w.messages.slots[w.lastMessage].flags&0x20200,0x20200);
 const camera={x:17*256,y:-41*256,angle:0,zoom:0};
 const before=structuredClone(w.flyby);stepFlyby(w.flyby,camera,24,true);assert.deepEqual(w.flyby,before);
 for(let i=0;i<80;i++)stepFlyby(w.flyby,camera,24);
 assert.notEqual(camera.x,17*256);assert.notEqual(camera.y,-41*256);
 const turn=w.turn;interruptFlyby(w.flyby,camera);
 for(let i=0;i<60;i++)stepFlyby(w.flyby,camera,24);
 assert.equal(w.flyby.flags&1,0);assert.equal(camera.zoom,0);assert.equal(w.turn,turn);
 for(let i=0;i<128;i++)tick(w,1/12);
 assert.equal(w.flyby.flags&1,0,'campaign flag prevents replay');
 assert.equal(w.messages.slots.filter(m=>m?.stringId===611).length,1);
});


test('native outcome phases honor campaign opponents, forced results and defeat recovery', () => {
 const won=createWorld();won.units=won.units.filter(u=>u.team==='blue');
 tick(won,31/12);assert.equal(won.status,'playing');assert.equal(won.manaTribes[1].defeatTimer,0);
 tick(won,1/12);assert.equal(won.status,'won');assert.equal(won.turn,32);
 assert.equal(won.manaTribes[1].defeatTimer,1);assert.equal(won.outcome.defeatedCounts[0],1);
 assert.equal(won.outcome.cameraTribe,1);assert.equal(won.outcome.cameraRequest,1);assert.equal(won.outcome.completedLevel,0);assert.equal(won.outcome.progressFlags&1,1);
 assert.deepEqual(won.selected,[]);assert.ok(won.buildings.some(b=>b.team==='red'),'empty buildings do not postpone campaign victory');
 const lost=createWorld();lost.units=[];lost.turn=31;tick(lost,1/12);
 assert.equal(lost.status,'lost','simultaneous campaign extinction is a player loss');assert.equal(lost.manaTribes[1].defeatTimer,0);
 for(const flags of [0x40000,0x20000,0x60000]) {
  const w=createWorld();w.turn=31;w.castingTribes[0].flags|=flags;tick(w,1/12);
  assert.equal(w.status,flags===0x40000?'won':'lost');
  assert.ok(w.units.some(u=>u.team==='red'),'scripted results do not require eliminating the opponent');
  if(flags&0x20000)assert.ok(w.units.every(u=>u.team!=='blue'),'forced defeat damages living player followers');
 }
 const partial=createWorld();partial.outcome.campaignTribes=3;partial.manaTribes[1].active=false;partial.manaTribes[2].active=true;partial.turn=31;
 tick(partial,1/12);assert.equal(partial.status,'playing','a living campaign opponent matters even when inactive');
 assert.equal(partial.manaTribes[2].defeatTimer,1,'campaign count is distinct from the AI processing count');
 tick(partial,96/12);assert.equal(partial.manaTribes[2].defeatTimer,97);assert.equal(partial.outcome.defeatedCounts[0],1,'defeat is counted once');
 for(const gate of ['loadFlags','gameFlags']) {
  const w=createWorld();w.units=w.units.filter(u=>u.team==='blue');w.turn=31;w.manaWorld[gate]=gate==='loadFlags'?0x200:32;
  tick(w,1/12);assert.equal(w.status,'playing',gate);
  w.manaWorld[gate]=0;w.turn=47;tick(w,1/12);assert.equal(w.status,'won',gate);
 }
});

test('tribe gates suppress scripts and AI while object turns and eligible cooldowns keep their native phases', () => {
 for(const gate of ['none','land','outer','load','mode','level','inactive','defeated','disabled']) {
  const w=createWorld();w.turn=71;w.castingTribes[0].cooldown=5;w.castingTribes[1].cooldown=5;w.castingTribes[1].aiCooldown=5;
  if(gate==='land')w.land.landFlags|=2;
  if(gate==='outer')w.land.landFlags|=0x800000;
  if(gate==='load')w.manaWorld.loadFlags|=0x200;
  if(gate==='mode')w.manaWorld.gameFlags|=32;
  if(gate==='level')w.levelFlags2|=0x100000;
  if(gate==='inactive')w.manaTribes[1].active=false;
  if(gate==='defeated')w.manaTribes[1].defeatTimer=97;
  if(gate==='disabled')w.manaTribes[1].flags2|=64;
  tick(w,1/12);
  assert.equal(w.turn,gate==='land'?71:72,gate);
  assert.equal(w.flyby.flags&1,Number(gate==='none'),gate);
  const timersRun=!['land','outer','load'].includes(gate);
  assert.equal(w.castingTribes[0].cooldown,timersRun?4:5,gate);
  assert.equal(w.castingTribes[1].cooldown,timersRun&&gate!=='inactive'?4:5,gate);
  assert.equal(w.castingTribes[1].aiCooldown,gate==='none'?4:5,gate);
 }
 const w=createWorld();w.turn=15;
 w.gifts.push({kind:'bridge',x:0,z:0,remaining:1});
 tick(w,1/12);assert.equal(w.shots.bridge,1);
 assert.equal(w.messages.slots.filter(Boolean).length,0,'AI runs before this object turn delivers the gift');
 w.turn=31;tick(w,1/12);
 assert.equal(w.messages.slots.find(Boolean).stringId,615,'the next script phase sees the delivered gift');
});

test('emergency casting preserves queued work and preacher responses keep their own payment rules', async () => {
 const {processComputerSpells}=await import('../app/computer-spells.ts');
 const {createTribeCasting}=await import('../app/spell-casting.ts');
 const preacher={class:1,model:4,state:0,tribe:0,x:512,y:0,flags2:0,flags4:0,assignment:64,disguise:0};
 const world={tribe:1,alliances:0,cells:new Map([[2,[preacher]]]),terrainFlags:()=>0};
 const caster={x:0,y:0,height:256,state:0,flags2:0,flags4:0,landIndex:0,building:null,playerType:1,casting:createTribeCasting(true)};
 const scan={cursor:0,limit:123,paused:0,targets:[0,0,0,0]},stock={available:0,disabled:0,stocks:Array(22).fill(0)};
 stock.stocks[3]=1;
 const context={turn:1,mana:79999,reserve:0,gameFlags:0,aiFlags:0,blastFrequency:0,stock};
 const entries=Array.from({length:8},(_,i)=>({model:i?0:2,mana:0,people:0,mode:0})),casts=[];
 const effects={enemyShaman:null,enemyBuildings:[],regionFlags:()=>0,categoryFlags:()=>1,cast:(...args)=>{casts.push(args);caster.casting.aiCooldown=12;}};
 processComputerSpells(world,scan,caster,context,entries,effects);
 assert.deepEqual(casts,[],'a Lightning stock does not bypass a preacher response’s mana gate');
 context.mana=80000;scan.cursor=0;processComputerSpells(world,scan,caster,context,entries,effects);
 assert.deepEqual(casts,[[3,2]],'Lightning is the final preacher-response fallback');
 stock.stocks[5]=1;caster.casting.aiCooldown=0;scan.cursor=0;
 processComputerSpells(world,scan,caster,context,entries,effects);assert.deepEqual(casts.at(-1),[5,2],'model five precedes Lightning');
 const w=createWorld(),red=w.units.find(u=>u.team==='red'&&u.kind==='shaman'),blue=w.units.find(u=>u.team==='blue'&&u.kind==='shaman');
 w.units=[red,blue];w.terrain.fill(3);w.terrainVersion++;w.ai.variables[57]=1;w.inputMask=0;
 Object.assign(red,{x:0,z:0,path:[]});Object.assign(blue,{x:6,z:0,path:[]});
 w.ai.flags|=0x4000;w.ai.attributes[32]=1;w.turn=3;
 w.manaTribes[1].mana=0;w.manaTribes[1].available=0;w.manaWorld.spells[1].stocks[3]=1;
 Object.assign(w.spellScan,{cursor:79,limit:123,paused:1,targets:[1,2,3,4]});const before=structuredClone(w.spellScan);
 const control=structuredClone(w);control.ai.flags&=~0x4000;
 tick(w,1/12);tick(control,1/12);
 assert.equal(w.spellCasts[1][3],1,'the independent shaman response can spend a stored Lightning with no mana');
 assert.equal(w.manaWorld.spells[1].stocks[3],0);assert.equal(w.manaTribes[1].mana,control.manaTribes[1].mana,'the stock cast leaves subsequent turn-four mana generation intact');
 assert.equal(w.sounds.find(s=>s.cue===0x8d).turn,3,'allocation precedes the object turn increment');
 assert.equal(w.turn,4);assert.equal(w.projectiles.find(p=>p.team==='red').remaining,5,'the new spell receives its first object tick in the same outer pass');
 assert.deepEqual(w.spellScan,before,'an early emergency cast preserves pending scan work');
 assert.deepEqual(w.projectiles.find(p=>p.team==='red').target,{x:7,z:-1});
});

test('live spell scans use population thresholds and building territory with delayed overlap recovery', async () => {
 const {addBuilding}=await import('../app/model.ts');
 const w=createWorld(),red=w.units.find(u=>u.team==='red'&&u.kind==='shaman'),blue=w.units.filter(u=>u.team==='blue'&&u.kind==='brave'),shaman=w.units.find(u=>u.team==='blue'&&u.kind==='shaman');
 w.terrain.fill(3);w.terrainVersion++;w.inputMask=0;w.ai.variables[57]=1;
 const reset=()=>{
  Object.assign(red,{x:0,z:0,path:[],target:null,work:null,inside:null,fight:null,lift:0,casting:null});
  Object.assign(shaman,{x:30,z:30,path:[],work:null,inside:null});
  for(const p of blue)Object.assign(p,{x:6,z:0,path:[],target:null,work:null,inside:null,fight:null,lift:0,hp:10000});
  w.manaTribes[1].mana=20000;w.manaTribes[1].available=0;w.castingTribes[1].aiCooldown=0;
 };
 w.units=[red,shaman,...blue.slice(0,5)];reset();w.turn=15;
 tick(w,1/12);assert.equal(w.spellScan.cursor,80);assert.equal(w.spellCasts[1][2],0);
 tick(w,1/12);assert.equal(w.spellCasts[1][2],0,'five braves fall below the original offense threshold');
 w.units.push(blue[5]);reset();w.turn=32;tick(w,1/12);
 assert.equal(w.spellCasts[1][2],1,'six braves are eligible on the dispatch phase');
 const b=addBuilding(w,'red','hut',{x:0,z:0});addBuilding(w,'red','hut',{x:0,z:0});
 const cell=(248>>1)*128+(14>>1);reset();w.turn=103;tick(w,1/12);
 assert.ok(w.land.regions[cell]&32,'the native tribe-one refresh marks ground around both buildings');
 reset();w.turn=112;tick(w,1/12);assert.equal(w.spellCasts[1][2],1,'defense counts specialists, excluding the six braves');
 for(const p of blue)p.kind='warrior';reset();w.turn=128;tick(w,1/12);
 assert.equal(w.spellCasts[1][2],2,'six specialists meet the defense threshold');
 b.hp=0;tick(w,1/12);assert.equal(w.land.regions[cell]&32,0,'removal clears the overlapping claim');
 reset();w.turn=231;tick(w,1/12);assert.ok(w.land.regions[cell]&32,'the next scheduled refresh restores the surviving building’s claim');
});

test('original campaign stops Dakini Blast casting after its second allocation', () => {
 const w=createWorld(),red=w.units.find(u=>u.team==='red'&&u.kind==='shaman'),target=w.units.find(u=>u.team==='blue'&&u.kind==='brave');
 assert.equal(w.ai.defencePosition,8|(28<<8));assert.equal(w.ai.defenceRadius,7);
 assert.deepEqual(w.ai.spellEntries.slice(0,2),[0,1].map(mode=>({model:2,mana:10000,range:512,people:6,mode})));
 assert.equal(w.ai.pendingCommands.filter(c=>[1038,1108,1196].includes(c.opcode)).length,0);
 w.units=w.units.filter(u=>u===red||u===target||u.team==='blue'&&u.kind==='shaman');
 Object.assign(red,{x:4,z:29});w.ai.variables[57]=1;w.inputMask=0;
 const opponents=[target,...Array.from({length:5},()=>addUnit(w,'blue','brave',{x:10,z:29}))];
 const castTurns=[];
 for(let turn=0;turn<220;turn++){
  // Keep the script's six-person threshold in range while isolating cast timing.
  Object.assign(red,{x:4,z:29,path:[],target:null,lift:0,fight:null});
  for(const p of opponents)Object.assign(p,{x:10,z:29,hp:10000,lift:0,inside:null,work:null,path:[],target:null,fight:null});
  const count=w.spellCasts[1][2];tick(w,1/12);if(w.spellCasts[1][2]!==count)castTurns.push(w.turn);
 }
 assert.equal(castTurns[1]-castTurns[0],16,'dispatch waits for its next 16-turn phase after the 12-turn lockout');
 assert.equal(w.spellCasts[1][2],2,'the live enemy allocates two Blasts and then stops');
 assert.equal(w.ai.variables[19],2);assert.equal(w.ai.states&0x400,0);assert.equal(w.ai.flags&0x100,0);
 assert.deepEqual(w.ai.spellEntries.slice(0,2).map(s=>s.model),[0,0]);
 const limited=createWorld();limited.spellCasts[1][2]=2;limited.turn=2;
 tick(limited,1/12);assert.equal(limited.ai.spellEntries[0].model,2,'EVERY 1 skips even turns for tribe one');
 tick(limited,1/12);assert.equal(limited.ai.spellEntries[0].model,0,'the original block disables entries on the next odd turn');
 assert.equal(limited.ai.defencePosition,8|(28<<8),'OFF preserves the previous defense target');
 const fresh=createWorld();assert.equal(fresh.ai.spellEntries[0].model,2,'restart resets the spell entries');
 assert.throws(()=>campaignCommand(fresh,1108,[0,1,2,3,4,5],{fields:[[0,8],[0,2],[0,0],[0,512],[0,6],[0,0]]}),/Invalid computer spell entry/);
});

test('campaign attack commitment follows living warrior counts on its original turn', async () => {
 const {campaignInternal}=await import('../app/model.ts');
 for(const [count,stage,turn,expected] of [[0,0,113,19],[1,0,113,34],[3,2,113,34],[4,0,113,67],[12,0,113,67],[13,0,113,100],[13,3,113,19],[13,0,112,19]]){
  const w=createWorld();w.units=[];w.turn=turn;w.ai.variables[57]=1;w.ai.variables[2]=stage;w.ai.attributes[11]=19;
  addUnit(w,'red','shaman',ENEMY);addUnit(w,'blue','shaman',HOME);
  for(let i=0;i<count;i++)addUnit(w,'blue','warrior',HOME);
  addUnit(w,'blue','warrior',HOME).hp=0;
  addUnit(w,'wild','brave',HOME);
  assert.equal(campaignInternal(w,1153),count);
  assert.equal(campaignInternal(w,2),count+1);
  assert.equal(campaignInternal(w,1),1);
  tick(w,1/12);
  assert.equal(w.ai.attributes[11],expected);
 }
});

test('queued training keeps its selection lock until issuing the order and frees its slot after arrival', async () => {
 const {createComputerQueue,requestTraining,dispatchComputerTask,computerPhase,stepTrainingTask}=await import('../app/computer.ts');
 const ai=createComputerQueue(),building={id:42,owner:1,state:2,model:7,capacity:4,inside:0,occupants:[null,null,null,null]};
 const actions=[],input={tribe:1,preference:0,population:10,trained:0,committed:0,maximum:5,select:()=>[11,12,13]};
 requestTraining(ai,3,3,3,model=>model===7?42:0);
 for(let turn=0;turn<8;turn++)if(computerPhase(turn,1)==='dispatch')dispatchComputerTask(ai,i=>actions.push(...stepTrainingTask(ai,i,building,input)));
 assert.deepEqual(actions,[{kind:'select',id:11},{kind:'select',id:12},{kind:'select',id:13},{kind:'train',id:42}]);
 assert.equal(ai.selectionOwner,10);assert.equal(ai.tasks[0].phase,7);assert.equal(ai.tasks[0].flags&1,1);
 building.inside=4;
 dispatchComputerTask(ai,i=>stepTrainingTask(ai,i,building,input));
 assert.equal(ai.tasks[0].phase,8);
 dispatchComputerTask(ai,i=>actions.push(...stepTrainingTask(ai,i,building,input)));
 assert.equal(ai.tasks[0].flags&1,0);assert.equal(actions.at(-1).kind,'restore');
 requestTraining(ai,1,3,1,()=>42);
 assert.equal(ai.tasks[0].phase,0);assert.equal(ai.tasks[0].requested,1,'released slot can be reused');
});

test('external game store publishes edits and restarts without sharing worlds between sessions', async () => {
 const {createGameStore}=await import('../app/game-store.ts');
 const store=createGameStore(),other=createGameStore(),old=store.getWorld(),events=[];
 const unsubscribe=store.subscribe(()=>events.push([store.getSnapshot(),store.getWorld()]));
 store.change(w=>{w.paused=true;w.mode='blast';});
 assert.equal(events.length,1);assert.equal(events[0][0],1);assert.equal(events[0][1],old);
 assert.equal(other.getWorld().paused,false);assert.equal(other.getSnapshot(),0);
 store.restart();assert.notEqual(store.getWorld(),old);assert.equal(store.getWorld().mode,null);
 assert.equal(events.length,2);assert.equal(events[1][0],2);
 unsubscribe();store.update();assert.equal(events.length,2);
});

test('computer recruitment preserves wrapped-distance ties and native command eligibility', async () => {
 const {availableTrainingPeople,selectComputerPeople}=await import('../app/computer-selection.ts');
 const person=(id,x,fields={})=>({id,class:1,model:2,state:17,tribe:0,x,y:0,
  flags2:0,flags3:3,flags4:0,assignment:0,busy:0,vehicle:0,driver:0,inside:0,
  immediateCommand:0,commands:Array(8).fill(0),commandCursor:0,...fields});
 const people=[person(1,0xfe00),person(2,0x0200),person(3,0,{model:7}),
  person(4,0,{state:10,commands:[1,0,0,0,0,0,0,0]}),
  person(5,0,{state:10,immediateCommand:2,commands:[1,0,0,0,0,0,0,0],flags3:0}),
  person(6,0,{flags2:0x800000}),person(7,0,{flags4:0x800})];
 const hut=person(40,0,{class:2,model:13,inside:4});
 const world={people,units:new Map([...people,hut].map(p=>[p.id,p])),
  orders:new Map([[1,{model:6,flags:0}],[2,{model:6,flags:1}]]),
  tribes:[{hasBase:true,base:0,shaman:0,radius:3}],buildingAt:()=>40};
 assert.equal(availableTrainingPeople(world),5,'availability is broader than recruitment eligibility');
 assert.deepEqual(selectComputerPeople(world,2,2,-1,1,0,6,3),[4,1,2],
  'housing order is eligible; seam ties keep list order; cancelled immediate cannot fall back to queued housing');
 assert.deepEqual(people.map(p=>p.flags3),[2,2,3,2,0,3,3],'only selected followers consume their force-selection bit');
 assert.deepEqual(selectComputerPeople(world,2,2,-1,0,0,2,3),[1,2],
  'without the housing flag the order remains excluded; flagged full buildings and ghosts remain excluded');
 hut.model=7;hut.inside=5;
 assert.deepEqual(selectComputerPeople(world,2,2,-1,0,0,2,3),[1,2,6],
  'capacity alone does not exclude an occupant: completed training huts lack native building flag 64');
});

test('group orders share references and release their object only after the final follower leaves', async () => {
 const {emptyPersonOrder,queuePersonOrder,commitPersonOrders,attachPersonOrder,removePersonOrder}=await import('../app/person-orders.ts');
 const pool={records:Array.from({length:800},emptyPersonOrder),cursor:1,active:0};
 const group={records:Array.from({length:8},emptyPersonOrder),count:0,cursor:0};
 const people=[1,2].map(id=>({id,model:2,state:17,substate:0,x:0,y:0,flags2:0,flags3:0,flags4:0,
  assignment:0,selectionFlags:128,commands:Array(8).fill(0),commandCursor:0,immediateCommand:0,
  orderLocation:0,commandStatus:0,workTarget:0}));
 const deleted=[],unexpected=()=>assert.fail('unexpected world effect');
 const effects={prepare:(o,model,a,b)=>{assert.equal(model,8);Object.assign(o,{model,a,b});},
  stopWork:unexpected,releaseSpell:unexpected,releaseFight:unexpected,deleteObject:id=>deleted.push(id)};
 queuePersonOrder(group,8,77,0);
 assert.ok(commitPersonOrders(pool,group,people,[-1,-1,-1],effects));
 assert.deepEqual(people.map(p=>p.commands[0]),[1,1]);
 assert.equal(pool.records[1].references,2);assert.equal(pool.records[1].a,77);assert.equal(pool.active,1);
 pool.records[1].object=99;people[1].selectionFlags=0;
 queuePersonOrder(group,8,88,0);commitPersonOrders(pool,group,people,[-1,-1,-1],effects);
 assert.equal(pool.records[1].references,1);assert.equal(pool.records[2].references,1);assert.equal(pool.active,2);
 assert.deepEqual(deleted,[]);
 removePersonOrder(pool,people[1],0,effects);
 assert.deepEqual(deleted,[99]);assert.equal(pool.active,1);
 attachPersonOrder(pool,people[0],2,-1,effects);attachPersonOrder(pool,people[0],2,-1,effects);
 assert.equal(pool.records[2].references,2,'replacing an immediate order with itself acquires before releasing');
 removePersonOrder(pool,people[0],0,effects);removePersonOrder(pool,people[0],-1,effects);
 assert.equal(pool.active,0);assert.equal(pool.records[2].references,0);
 for(const order of pool.records)order.references=1;
 people[0].commands[0]=1;
 queuePersonOrder(group,8,55,0);
 assert.equal(commitPersonOrders(pool,group,people,[-1,-1,-1],effects),false);
 assert.equal(people[0].commands[0],1,'pool exhaustion preserves existing orders');
 assert.equal(group.count,0);assert.ok(group.records.every(o=>o.model===0));
 for(let i=0;i<8;i++)queuePersonOrder(group,8,55,0);
 assert.throws(()=>queuePersonOrder(group,8,55,0),RangeError,'unsupported native queue overflow fails explicitly');
});

test('AI reservation enters native selection state and releases through the normal person initializer', async () => {
 const {reserveTrainingPerson,releaseSelectedPeople}=await import('../app/person-state.ts');
 const {emptyPersonOrder}=await import('../app/person-orders.ts');
 const p={id:1,model:2,state:17,substate:0,x:0xfe00,y:0,flags2:0,flags3:1,flags4:0,assignment:0,
  selectionFlags:0,commands:Array(8).fill(0),commandCursor:0,immediateCommand:0,orderLocation:0,
  commandStatus:0,workTarget:0,tribe:0,previousState:10,physics:2,renderFlags:0,statusFlags:0,
  workFlags:0,stateObject:0,speed:64,timer:0,target:0,reservationNext:0,formationCell:0,cargo:0,
  animationMode:0,vehicle:0,angle:0,turnAngle:0,motionTimer:123,motionMode:3};
 const w={randomState:1,instantFacing:false,levelFlags:0,orders:{records:Array.from({length:800},emptyPersonOrder),cursor:1,active:0},
  tribes:[{x:0,y:0,angle:0,selectedCount:0,flags:64}]};
 const events=[],unexpected=()=>assert.fail('unexpected world consumer');
 const effects={deselectPassengers:unexpected,rebuildTrainingQueue:unexpected,rebuildFormation:unexpected,
  releaseMotion:()=>events.push('motion'),startOrders:()=>events.push('orders'),setAnimation:p=>events.push(p.state)};
 reserveTrainingPerson(w,p,effects);
 assert.equal(p.state,14);assert.equal(p.previousState,17);assert.equal(p.speed,0);
 assert.equal(p.assignment&0x800,0x800);assert.equal(p.selectionFlags&128,128);
 assert.equal(p.flags3&1,0);assert.equal(w.tribes[0].selectedCount,1);assert.notEqual(w.randomState,1);
 const seed=w.randomState;
 releaseSelectedPeople(w,[p],14,effects);
 assert.equal(p.state,10);assert.equal(p.previousState,14);assert.equal(p.selectionFlags&128,0);
 assert.equal(p.assignment&0x800,0);assert.equal(w.tribes[0].selectedCount,0);
 assert.equal(p.motionTimer,0);assert.equal(p.motionMode,0);
 assert.equal(w.randomState,seed,'the shared state-10 prefix does not draw another speed');
 assert.deepEqual(events,['motion',14,'orders',10]);
 const snapshot=structuredClone(p);releaseSelectedPeople(w,[p],14,effects);assert.deepEqual(p,snapshot);
 p.flags2|=0x100000;reserveTrainingPerson(w,p,effects);
 assert.equal(p.state,10,'a protected person keeps its state');assert.equal(p.assignment&0x800,0x800);
 assert.equal(w.tribes[0].selectedCount,0);
});

test('training order startup uses configured speed and preserves only a compatible building occupant', async () => {
 const {startPersonOrders}=await import('../app/person-order-start.ts');
 const {emptyPersonOrder}=await import('../app/person-orders.ts');
 const p={id:1,model:2,state:10,substate:0,x:0,y:0,flags2:0x800010,flags3:0,flags4:0,assignment:32,
  selectionFlags:0,commands:[1,0,0,0,0,0,0,0],commandCursor:0,immediateCommand:0,orderLocation:0,
  commandStatus:0,workTarget:0,tribe:0,previousState:14,physics:2,renderFlags:0,statusFlags:0,
  workFlags:0,stateObject:0,speed:0,timer:0,target:0,reservationNext:0,formationCell:0,cargo:0,
  animationMode:0,vehicle:0,angle:0,turnAngle:0,motionTimer:123,motionMode:3,destinationX:0,
  destinationY:0,savedVehicle:0,commandPhase:4,commandAux:3,orderDelay:0};
 const w={randomState:1,instantFacing:false,levelFlags:0,orders:{records:Array.from({length:800},emptyPersonOrder),cursor:3,active:2},
  tribes:[{x:0,y:0,angle:0,selectedCount:0,flags:0,vehicleMode:0}]};
 Object.assign(w.orders.records[1],{model:8,references:1,a:100});
 Object.assign(w.orders.records[2],{model:8,references:1,a:101,flags:1});
 const events=[],unexpected=()=>assert.fail('unexpected world consumer');
 const effects={setAnimation:()=>events.push('animation'),setDestination:unexpected,commandPosition:unexpected,
  allowVehicleOrder:unexpected,initializeCommand:unexpected,adjacentBuilding:()=>100,canStayForTarget:unexpected,
  leaveBuilding:()=>events.push('leave'),resetVehicleMovement:unexpected,leaveSelectedVehicle:unexpected,initializeState:unexpected};
 startPersonOrders(w,p,effects);
 assert.equal(p.target,100);assert.equal(p.commandStatus,8);assert.equal(p.orderDelay,8);
 assert.ok(p.speed>=70&&p.speed<=86,'shipped BRAVE_SPEED is 70, overriding the executable default of 64');
 assert.equal(p.assignment&32,0);assert.equal(p.commandPhase,0);assert.equal(p.commandAux,0);
 assert.deepEqual(events,['animation'],'a compatible training occupant stays inside');
 p.immediateCommand=2;
 startPersonOrders(w,p,effects);
 assert.equal(p.target,100,'cancelled immediate order does not configure a new target or fall back');
 assert.deepEqual(events,['animation','leave'],'building reconciliation still sees the immediate target');
 assert.equal(p.flags2&16,0);
 p.immediateCommand=0;p.commands[0]=0;
 const before=JSON.stringify({w,p,events});startPersonOrders(w,p,effects);
 assert.equal(JSON.stringify({w,p,events}),before,'empty order startup consumes no RNG and changes no fields');
});

test('native training queue yields to an untrained follower and releases its new head', async () => {
 const {stepTrainingPerson,rebuildTrainingQueue,trainingQueuePerson}=await import('../app/training.ts');
 const {emptyPersonOrder}=await import('../app/person-orders.ts');
 const records=Array.from({length:800},emptyPersonOrder);
 Object.assign(records[1],{model:8,references:2,a:100});
 Object.assign(records[2],{model:8,flags:1,references:1,a:100});
 const person=(id,model,phase,next)=>({id,class:1,model,state:10,substate:3,tickPhase:0,physics:2,
  flags2:0,flags3:32,flags4:0,assignment:8,commands:[1,0,0,0,0,0,0,0],commandCursor:0,
  immediateCommand:0,workTarget:100,target:100,reservationNext:next,commandPhase:phase,commandAux:0,
  x:256,y:64384,goalX:256,goalY:64384,speed:0,cargo:0,timer:256,angle:0,turnAngle:0,facingAngle:0});
 const specialist=person(1,4,0,2),brave=person(2,2,1,0);
 const b={id:100,class:2,model:5,object:95,angle:0,anchorX:0,anchorY:0,flags2:0,flags3:0,activity:8,queueHead:1,queueFrom:0,
  inside:5,entering:0,entryDelay:0,entryTimer:0};
 const w={randomState:1,orders:{records,cursor:3,active:2},people:new Map([[1,specialist],[2,brave]]),buildings:new Map([[100,b]])};
 const events=[],unexpected=()=>assert.fail('unexpected world consumer');
 const effects={setAnimation:(p,id)=>events.push(['animation',p.id,id]),releaseMotion:p=>events.push(['motion',p.id]),
  adjacentBuilding:unexpected,setDestination:(p,x,y)=>{p.goalX=x&65535;p.goalY=y&65535;},
  directDestination:unexpected,dropCargo:unexpected,enterBuilding:unexpected,workInside:unexpected};
 assert.equal(stepTrainingPerson(w,specialist,effects),0);
 assert.equal(b.queueHead,2);assert.equal(brave.reservationNext,1);assert.equal(specialist.reservationNext,0);
 assert.equal(brave.commandAux,1);assert.equal(specialist.commandAux,1);
 assert.equal(specialist.goalX,64);assert.equal(specialist.goalY,64448);assert.equal(brave.goalY,64384);
 assert.ok(specialist.speed>=70&&brave.speed>=70);
 stepTrainingPerson(w,brave,effects);
 assert.equal(brave.commandPhase,0);assert.equal(brave.speed,0);assert.equal(specialist.commandAux,2);
 b.inside=0;
 stepTrainingPerson(w,brave,effects);
 assert.equal(brave.substate,6);assert.equal(b.entryDelay,16);
 assert.equal(b.queueHead,1);assert.equal(brave.flags3&32,0);assert.equal(brave.reservationNext,0);
 assert.equal(b.activity&0x2000,0x2000);assert.equal(b.queueFrom,0);
 assert.equal(trainingQueuePerson(w,b,-1),specialist);
 assert.equal(events.filter(e=>e[0]==='motion').length,1);
 // A cancelled immediate command suppresses the otherwise valid queued order.
 specialist.immediateCommand=2;
 assert.equal(rebuildTrainingQueue(w,b),0);assert.equal(b.queueHead,0);assert.equal(specialist.flags3&32,0);
});

test('live followers reach rotated native doors before entering buildings', () => {
 for (const angle of [0,Math.PI/2,Math.PI,3*Math.PI/2]) {
  const w=createWorld(),hut=w.buildings.find(b=>b.team==='blue'),brave=w.units.find(u=>u.team==='blue'&&u.kind==='brave');
  hut.angle=angle;w.selected=[brave.id];
  assert.deepEqual(findPath(w.terrain,brave,hut,w.buildings),[],'the door exception does not permit routes to building centers');
  command(w,hut);
  assert.ok(brave.path.length,'the coarse path must reach the exact original entrance');
  assert.deepEqual(brave.path.at(-1),entrance(w,hut));
  advance(w,24);
  assert.equal(brave.inside,hut.id,'all four native entrance orientations remain reachable');
 }
 const w=createWorld(),hut=w.buildings.find(b=>b.team==='blue'),brave=w.units.find(u=>u.team==='blue'&&u.kind==='brave');
 Object.assign(brave,{x:hut.x,z:hut.z,work:hut.id,path:[]});
 tick(w,1/12);
 assert.equal(brave.inside,null,'standing near the building center is not arrival at its door');
});

test('building admission preserves native slot order, training activity and shared commands', async () => {
 const {enterBuilding,leaveBuilding,setPersonOccupancy,trainingOccupantWeight,repriceTraining}=await import('../app/building-occupants.ts');
 const {emptyPersonOrder}=await import('../app/person-orders.ts');
 const person=(id,model,tribe=0)=>({id,class:1,model,tribe,state:10,substate:5,x:1000,y:2000,
  flags2:0,flags3:0,flags4:0,assignment:0,renderFlags:0,commands:[1,0,0,0,0,0,0,0],
  commandCursor:0,immediateCommand:0,commandStatus:8,workTarget:100,orderLocation:123,
  height:100,velocityX:1,velocityY:2,velocityZ:3,clip:0,
  homeX:0,homeY:0,formationSlot:3,angle:0,turnAngle:0,facingAngle:0});
 const brave=person(1,2),warrior=person(2,3),guest=person(3,2,1);
 const records=Array.from({length:800},emptyPersonOrder);Object.assign(records[1],{model:8,references:3,a:100});
 const w={people:new Map([[1,brave],[2,warrior],[3,guest]]),orders:{records,cursor:2,active:1},towerTribes:0,
  buildings:new Map(),turn:42,buildingAt:()=>0,
  tribes:[{personCounts:[0,0,0,4,0,0,0,0,0],playerType:2,buildingIds:[100]}]};
 const b={id:100,class:2,model:7,tribe:0,flags2:0,flags3:0x1000,activity:8|1024,inside:1,
  occupants:[0,2,0,0,0,0],trainingTimer:123,trainingCost:0,
  object:103,angle:512,anchorX:0,anchorY:0,entryDelay:0,lastActivity:0};
 w.buildings.set(100,b);
 const events=[],unexpected=()=>assert.fail('unexpected world consumer');
 const effects={orders:{prepare:unexpected,stopWork:unexpected,releaseSpell:unexpected,deleteObject:unexpected,releaseFight:unexpected},
  leaveVehicle:p=>events.push(['vehicle',p.id]),adjacentBuilding:()=>0,towerPosition:unexpected,terrainHeight:()=>321,
  moveToCell:unexpected,insertCell:p=>events.push(['insert',p.id]),removeCell:p=>events.push(['remove',p.id]),
  planExitPoint:unexpected,
  updateIndicator:b=>events.push(['indicator',b.id])};
 assert.equal(enterBuilding(w,brave,b,effects),1);
 assert.deepEqual(b.occupants,[1,2,0,0,0,0]);assert.equal(b.inside,2);
 assert.equal(b.trainingTimer,0);assert.equal(b.trainingCost,4375);assert.equal(b.activity,8|128);
 assert.equal(brave.assignment&4,4);assert.equal(warrior.assignment&4,4);
 assert.equal(brave.flags2&0x800000,0x800000);assert.equal(brave.commands[0],1,'training retains the command');
 assert.equal(brave.orderLocation,0);assert.equal(trainingOccupantWeight(w,b),1);
 const before=structuredClone(b);assert.equal(enterBuilding(w,guest,b,effects),0);assert.deepEqual(b,before);
 brave.model=3;guest.model=3;guest.tribe=0;
 assert.equal(enterBuilding(w,guest,b,effects),1);assert.equal(b.activity&128,0);
 assert.equal(b.trainingCost,4375,'a building without a conversion retains its old cost word');
 assert.equal(brave.assignment&4,0);assert.equal(warrior.assignment&4,0);
 b.inside=5;const full=structuredClone(b);assert.equal(enterBuilding(w,guest,b,effects),0);assert.deepEqual(b,full);
 guest.model=7;assert.equal(enterBuilding(w,guest,b,effects),1);
 assert.equal(brave.flags2&0x804000,0,'shaman admission executes the real occupant exit');
 assert.equal(brave.formationSlot,0);assert.equal(b.entryDelay,12);
 assert.deepEqual([brave.x,brave.y],[1000,2000],'exit restores the person without teleporting');
 assert.equal(brave.homeX&511,256);assert.equal(brave.homeY&511,256);
 // A nonzero terrain index suppresses list fallback, even when no building exists.
 w.buildingAt=()=>101;const occupied=structuredClone(b);
 leaveBuilding(w,warrior,effects);assert.deepEqual(b,occupied);
 w.buildingAt=()=>0;leaveBuilding(w,warrior,effects);
 assert.equal(b.occupants[1],0);assert.equal(warrior.flags2&16,16);
 const emptySlot=structuredClone(b);leaveBuilding(w,warrior,effects);assert.deepEqual(b,emptySlot);
 // Ordinary housing clears this occupant's reference while the shared order survives.
 b.model=1;b.inside=0;b.occupants.fill(0);brave.model=2;
 assert.throws(()=>repriceTraining(w,b),RangeError,'non-training models cannot silently divide by zero');
 assert.equal(enterBuilding(w,brave,b,effects),1);assert.equal(brave.commands[0],0);assert.equal(records[1].references,2);
 assert.equal(brave.renderFlags&16,16);assert.equal(brave.flags2&0x804000,0x804000);
 setPersonOccupancy(w,brave,1,effects);
 assert.equal(brave.renderFlags&16,0);assert.equal(brave.flags2&0x804000,0);assert.equal(brave.height,321);
 assert.deepEqual([brave.velocityX,brave.velocityY,brave.velocityZ],[0,0,0]);
 assert.ok(events.some(e=>e[0]==='insert'));
});

test('training replaces a whole batch, inherits the first occupant order tail and rolls back partial allocation', async () => {
 const {stepTrainingConversion}=await import('../app/training-conversion.ts');
 const {emptyPersonOrder,hasFollowingPersonOrder}=await import('../app/person-orders.ts');
 for (const failAfter of [1,16]) {
  const person=(id,model)=>({id,class:1,model,tribe:0,state:10,substate:13,x:0,y:0,
   flags2:0x800000,flags3:0,flags4:0,assignment:4,selectionFlags:0,renderFlags:0,
   commands:[1,0,0,0,0,0,0,0],commandCursor:0,immediateCommand:0,commandStatus:8,
   workTarget:100,orderLocation:0,height:0,velocityX:0,velocityY:0,velocityZ:0,clip:0,
   homeX:0,homeY:0,formationSlot:0,angle:0,turnAngle:0,facingAngle:0,reservationNext:0});
  const warrior=person(1,3),braves=[person(2,2),person(3,2)];warrior.commands=[1,2,0,3,0,0,0,0];
  const records=Array.from({length:800},emptyPersonOrder);
  Object.assign(records[1],{model:8,references:3,a:100});
  Object.assign(records[2],{model:3,references:1,a:1000,b:2000});
  Object.assign(records[3],{model:3,references:1,flags:1,a:3000,b:4000});
  const b={id:100,class:2,model:7,tribe:0,flags2:0,flags3:0,activity:8|128,inside:3,
   occupants:[1,2,3,0,0,0],trainingTimer:0,trainingCost:0,storedMana:65535,tickPhase:0,queueHead:0,
   object:103,angle:512,anchorX:0,anchorY:0,entryDelay:0,lastActivity:0};
  const w={people:new Map([warrior,...braves].map(p=>[p.id,p])),orders:{records,cursor:4,active:3},
   buildings:new Map([[100,b]]),turn:1234,buildingAt:()=>100,towerTribes:0,playerTribe:0,
   tribes:[{personCounts:[0,0,2,1,0,0,0,0,0],playerType:1,buildingIds:[100]}]};
  const events=[],created=[],unexpected=()=>assert.fail('unexpected world consumer');
  const effects={orders:{prepare:(o,model,x,y,flags)=>Object.assign(o,{model,a:x,b:y,flags}),
   stopWork:unexpected,releaseSpell:unexpected,releaseFight:unexpected,
   deleteObject:id=>{events.push(['delete',id]);const p=w.people.get(id);p.class=0;w.tribes[0].personCounts[p.model]--; }},
   leaveVehicle:unexpected,adjacentBuilding:unexpected,towerPosition:unexpected,terrainHeight:()=>0,
   moveToCell:unexpected,insertCell:()=>{},removeCell:unexpected,planExitPoint:unexpected,updateIndicator:()=>{},
   updateTrainingPanel:()=>{},addMana:(tribe,amount)=>events.push(['mana',tribe,amount]),
   allocateTrainee:(model,tribe,x,y,angle)=>{
    if(created.length===failAfter)return;
    const p=person(200+created.length,model);Object.assign(p,{tribe,x,y,angle,commands:Array(8).fill(0),flags2:0});
    created.push(p);w.people.set(p.id,p);w.tribes[tribe].personCounts[model]++;return p;
   }};
  assert.ok(hasFollowingPersonOrder(w.orders,warrior));
  warrior.commandCursor=7;assert.equal(hasFollowingPersonOrder(w.orders,warrior),false,'eligibility does not wrap');
  warrior.commandCursor=2;assert.equal(hasFollowingPersonOrder(w.orders,warrior),false,'cancelled tail alone is ineligible');
  warrior.commandCursor=0;stepTrainingConversion(w,b,effects);
  if(failAfter===1){
   assert.deepEqual(b.occupants,[1,2,3,0,0,0]);assert.ok(braves.every(p=>p.class===1&&p.commands[0]===1));
   assert.deepEqual(events,[['delete',200]]);assert.equal(created[0].class,0);assert.equal(b.lastActivity,0);
   assert.equal(w.tribes[0].personCounts[3],1,'rollback restores the supplied population counter');
  }else{
   assert.equal(created.length,2);assert.ok(created.every(p=>p.model===3));
   assert.ok(created.every(p=>p.commands[0]===2&&p.commands[1]===0&&p.commands[2]===3),
    'both replacements inherit the first occupant tail, preserving gaps and cancelled records');
   assert.equal(records[2].references,3);assert.equal(records[3].references,3);assert.equal(records[4].references,0);
   assert.deepEqual(b.occupants,[1,0,0,0,0,0]);assert.equal(b.inside,1);assert.equal(warrior.class,1);
   assert.ok(braves.every(p=>p.class===0&&p.commands.every(id=>id===0)));
   assert.equal(b.trainingCost,0);assert.equal(b.storedMana,0);assert.equal(b.lastActivity,1234);
   assert.equal(events[0][0],'mana');assert.ok(events[0][2]>0);
   assert.deepEqual(events.slice(1),[['delete',2],['delete',3]]);
  }
 }
});

test('live mana refunds wait for a pulse and computer training receives only the original first pass', async () => {
 const {addBuilding}=await import('../app/model.ts');
 const w=createWorld(),empty=addBuilding(w,'blue','camp',HOME),red=addBuilding(w,'red','camp',ENEMY);
 empty.timer=99;w.shots.blast=0;
 for(const t of w.manaTribes)t.available=0; // Isolate follower pulses from starting mana.
 const trainee=w.units.find(u=>u.team==='red'&&u.kind==='brave');
 trainee.inside=red.id;trainee.work=red.id;trainee.path=[];
 tick(w,1/12);
 assert.equal(empty.timer,99,'an empty incoming-mana update cannot refund a hut');
 assert.equal(red.timer,0);assert.equal(w.manaTribes[1].mana,0);
 tick(w,3/12);
 assert.equal(empty.timer,0,'the next generation pulse permits the refund');
 assert.ok(w.mana>.099,'the refund joins normal Blast charging');
 assert.equal(red.timer,Math.min(trainingCost(w,'red')>>5,Math.trunc((red.timer+w.manaTribes[1].mana)/2)),
  'computer huts receive a capped share of half the incoming mana');
 assert.ok(w.manaTribes[1].mana>0,'the remainder is retained in the computer mana pool');
 const stored=red.timer,pool=w.manaTribes[1].mana;
 tick(w,1/12);assert.equal(red.timer,stored);assert.equal(w.manaTribes[1].mana,pool);
});

test('follower mana uses native preacher orders, registration and ghost flags before tribe scaling', async () => {
 const {personMana,generateFollowerMana}=await import('../app/mana.ts');
 const {emptyPersonOrder}=await import('../app/person-orders.ts');
 const pool={records:Array.from({length:3},emptyPersonOrder),cursor:1,active:0};
 Object.assign(pool.records[1],{model:17});Object.assign(pool.records[2],{model:17,flags:1});
 const p={class:1,model:4,state:10,tribe:0,flags2:0,flags4:0x20000000,assignment:0,
  commandStatus:17,commands:[1,0,0,0,0,0,0,0],commandCursor:0,immediateCommand:0};
 assert.equal(personMana(pool,p),4,'preaching orders use the idle specialist contribution');
 p.assignment=64;assert.equal(personMana(pool,p),5);p.assignment=0;
 p.immediateCommand=2;assert.equal(personMana(pool,p),5,'a cancelled immediate order suppresses the preaching order');
 p.immediateCommand=0;p.flags2=0x800000;assert.equal(personMana(pool,p),5,'inside takes precedence over preaching order');
 const brave={...p,model:2,flags2:0x800001},shaman={...p,model:7,flags2:0};
 const people=[brave,shaman,{...brave,flags4:0x20000800},{...brave,flags4:0},
  {...brave,model:1},{...brave,model:8},{...brave,class:2}];
 const w=createWorld();w.manaWorld.turn=4;w.manaTribes[0].available=2147483647;w.manaTribes[0].estimatedRate=123;
 generateFollowerMana(w.manaWorld,w.manaTribes,people,pool);
 assert.equal(w.manaTribes[0].previousRate,56,'(15 + 30) scaled once by 320/256');
 assert.equal(w.manaTribes[0].available,(2147483647+56)|0);assert.equal(w.manaTribes[0].estimatedRate,0);
 const before=structuredClone(w.manaTribes);w.manaWorld.gameFlags=32;
 generateFollowerMana(w.manaWorld,w.manaTribes,people,pool);assert.deepEqual(w.manaTribes,before);
 w.manaWorld.gameFlags=0;w.manaWorld.turn=5;
 generateFollowerMana(w.manaWorld,w.manaTribes,people,pool);assert.deepEqual(w.manaTribes,before);
 const live=createWorld(),idle=manaRate(live);live.units.find(u=>u.kind==='brave'&&u.team==='blue').fighting=true;
 assert.equal(manaRate(live),idle,'fighting animation alone is not an order or an inside flag');
});

test('live spell reach follows terrain height and enemy casts require and spend native mana', async () => {
 const {spellRange}=await import('../app/model.ts');
 const w=createWorld(),shaman=w.units.find(u=>u.team==='blue'&&u.kind==='shaman');
 Object.assign(shaman,{x:0,z:0});w.inputMask=0;w.terrain.fill(1);
 assert.ok(spellRange(w,shaman,2)<11);
 assert.equal(cast(w,'blast',{x:11,z:0}),false,'low ground cannot reach the old fixed-radius edge');
 assert.equal(w.shots.blast,4);w.terrain.fill(8);
 assert.ok(spellRange(w,shaman,2)>11);assert.ok(cast(w,'blast',{x:11,z:0}));assert.equal(w.shots.blast,3);
 const enemy=createWorld(),red=enemy.units.find(u=>u.team==='red'&&u.kind==='shaman'),target=enemy.units.find(u=>u.team==='blue'&&u.kind==='brave');
 enemy.units=enemy.units.filter(u=>u===red||u===target||u.team==='blue'&&u.kind==='shaman');
 Object.assign(red,{x:4,z:29});Object.assign(target,{x:8,z:29});enemy.inputMask=0;enemy.ai.variables[57]=1;
 assert.deepEqual(enemy.manaTribes.map(t=>[t.mana,t.available]),Array.from({length:4},()=>[0,30000]));
 for(const t of enemy.manaTribes)t.available=0;
 const pool=enemy.manaTribes[1];pool.mana=19999;
 tick(enemy,1/12);assert.equal(enemy.spellCasts[1][2],0,'cost plus entry reserve requires 20,000 mana');
 pool.mana=20000;enemy.turn=16;for(const e of enemy.ai.spellEntries)e.people=1;
 const control=structuredClone(enemy);for(const e of control.ai.spellEntries)e.model=0;
 tick(enemy,1/12);tick(control,1/12);
 assert.equal(enemy.spellCasts[1][2],1);assert.equal(pool.mana,control.manaTribes[1].mana-10000,'AI payment precedes this turn’s mana distribution');
 assert.equal(pool.available,0,'distribution settles the queued debit');
});

test('native casting lockout survives animation and computer usage recovers one charge at a time', async () => {
 const {canShamanCast,computerSpellAllowed,stepComputerCastCooldown,registerSpellCooldown,createTribeCasting}=await import('../app/spell-casting.ts');
 const w=createWorld(),shaman=w.units.find(u=>u.team==='blue'&&u.kind==='shaman');
 w.units=w.units.filter(u=>u.kind==='shaman');w.terrain.fill(3);Object.assign(shaman,{x:0,z:0});
 assert.ok(cast(w,'blast',{x:4,z:0}));assert.equal(w.castingTribes[0].cooldown,12);
 tick(w,6/12);assert.equal(shaman.casting,null);assert.equal(cast(w,'blast',{x:4,z:0}),false,'animation ending does not end the tribe lockout');
 tick(w,5/12);assert.equal(cast(w,'blast',{x:4,z:0}),false);tick(w,1/12);assert.ok(cast(w,'blast',{x:4,z:0}));
 assert.equal(w.ai.attributes[43],12);
 const ai=createTribeCasting(true),p={state:0,flags2:0,flags4:0};ai.aiCooldown=2;
 assert.equal(canShamanCast(ai,1,p),false);assert.equal(canShamanCast(ai,2,p),true,'AI delay does not block human player types');
 Object.assign(ai.spells[2],{used:4,remaining:1});assert.equal(computerSpellAllowed(ai,0x40000,0,2),false);
 stepComputerCastCooldown(ai,0x40000);assert.deepEqual(ai.spells[2],{used:3,interval:1,remaining:64});assert.equal(ai.aiCooldown,1);
 registerSpellCooldown(ai,1,0x40000,0,0,2);assert.equal(ai.spells[2].used,4);assert.equal(ai.spells[2].remaining,64,'casting does not restart an existing recovery timer');
 stepComputerCastCooldown(ai,0);assert.equal(ai.spells[2].remaining,64,'usage recovery pauses when its AI flag is disabled');assert.equal(ai.aiCooldown,0);
 assert.ok(canShamanCast(ai,1,p));ai.flags|=0x80000;ai.cooldown=12;
 assert.ok(canShamanCast(ai,1,{state:22,flags2:3,flags4:0x400}),'native override bypasses every eligibility gate');
});

test('spell targeting preserves native cell allowances and wrapped coordinate seams', async () => {
 const {spellInRange}=await import('../app/model.ts');
 const {validateSpellTarget,createTribeCasting,filterSpellEntries}=await import('../app/spell-casting.ts');
 const w=createWorld(),red=w.units.find(u=>u.team==='red'&&u.kind==='shaman'),target=w.units.find(u=>u.team==='blue'&&u.kind==='brave');
 w.terrain.fill(3);w.inputMask=0;w.ai.variables[57]=1;
 w.units=w.units.filter(u=>u===red||u===target||u.team==='blue'&&u.kind==='shaman');
 Object.assign(red,{x:0,z:0,target:target.id});Object.assign(target,{x:10.8,z:0,path:[],target:null,inside:null,work:null});
 w.turn=16;w.spellScan.cursor=80;w.manaTribes[1].mana=20000;w.manaTribes[1].available=0;
 for(const e of w.ai.spellEntries)e.people=1;
 tick(w,1/12);assert.equal(w.spellCasts[1][2],1,'target cell is eligible beyond the old truncated-radius distance');
 Object.assign(red,{x:124,z:0});assert.ok(spellInRange(w,red,2,{x:-124,z:0}),'position range wraps at the 256-unit world seam');
 const state=createTribeCasting(false),caster={x:0,y:0,height:256,flags2:0,flags4:0x2000000,state:0,landIndex:1,building:null,casting:state,playerType:2},events=[];
 const effects={cursorBlocked:()=>false,bridgeStart:()=>({x:0,y:0}),notify:(...args)=>events.push(args)};
 assert.equal(validateSpellTarget(0,0,{x:0,y:0},caster,12,{x:0,y:0},2,false,true,effects),-3);
 assert.deepEqual(events,[[0x8000,0x255],[0x8000000,0x261]],'bridge reports terrain and occupied-caster restrictions independently');
 assert.equal(validateSpellTarget(0,0x80000,{x:0,y:0},null,2,{x:32768,y:32768},0,false,false,effects),1,'override permits targeting without a shaman');
 const ranges=[6,6,6],entries=[{mode:0,people:3},{mode:1,people:6},{mode:1,people:7}];
 filterSpellEntries(ranges,entries,true,[2,2,2],100);assert.deepEqual(ranges,[0,6,0],'defense uses the enemy-specialist subtotal and inclusive population threshold');
});

test('native spell scans retain slots and Blast scoring avoids friendly concentrations', async () => {
 const {scanSpellTargets,chooseSpellTarget,summarizeSpellEnemies,dispatchSpellTargets}=await import('../app/computer-spells.ts');
 const {createTribeCasting}=await import('../app/spell-casting.ts');
 const enemy={class:1,model:3,state:0,tribe:0,x:0,y:0,flags2:0,flags4:0,assignment:0,disguise:0};
 const cells=new Map([[0,[enemy]]]),world={tribe:1,alliances:0,cells,terrainFlags:()=>0};
 const scan={cursor:0,limit:99,paused:0,targets:[0,0,0,0]};
 scanSpellTargets(world,scan,{x:512,y:512},[1,0,0,0,0,0,0,0],()=>assert.fail('No preacher'));
 assert.deepEqual(scan,{cursor:80,limit:7,paused:0,targets:[1,1,1,1]},'zero cell uses sentinel one and fills every empty target slot; scanning continues beyond the ring limit');
 scan.paused=1;scanSpellTargets(world,scan,{x:512,y:512},[1],()=>{});assert.equal(scan.cursor,0,'cursor wraps at the next call before checking pause');
 scanSpellTargets(world,scan,null,[1],()=>{});assert.deepEqual(scan,{cursor:0,limit:7,paused:0,targets:[0,0,0,0]});
 cells.get(0).push({...enemy,tribe:1});
 assert.equal(chooseSpellTarget(world,2,0,null).accepted,false,'one friendly cancels one valid enemy');
 cells.set(2,[{...enemy,x:512}]);assert.deepEqual(chooseSpellTarget(world,2,0,null),{accepted:true,cell:2});
 const area=summarizeSpellEnemies(world,0,1);assert.equal(area.warriors,2);assert.equal(area.total,2,'allies are excluded from enemy area totals');
 scan.targets=[1,4,0,0];const ranges=Array(8).fill(6),entries=Array.from({length:8},()=>({model:0,people:0,mode:0}));
 const caster={x:0,y:0,height:256,state:0,flags2:0,flags4:0,landIndex:0,building:null,casting:createTribeCasting(true),playerType:1};
 dispatchSpellTargets(world,scan,entries,ranges,caster,0,0,{regionFlags:()=>0,categoryFlags:()=>1,cast:()=>assert.fail('No spell enabled')});
 assert.deepEqual(scan.targets,[0,4,0,0],'an unusable weighted first area leaves later slots for another dispatch');
 const w=createWorld(),red=w.units.find(u=>u.team==='red'&&u.kind==='shaman'),blue=w.units.filter(u=>u.team==='blue'&&u.kind==='brave').slice(0,2),allies=w.units.filter(u=>u.team==='red'&&u.kind==='brave').slice(0,2),shaman=w.units.find(u=>u.team==='blue'&&u.kind==='shaman');
 w.terrain.fill(3);w.inputMask=0;w.ai.variables[57]=1;w.units=[shaman,...blue,red,...allies];
 Object.assign(shaman,{x:30,z:30});Object.assign(red,{x:0,z:0,target:blue[0].id});
 for(const [i,u] of blue.entries())Object.assign(u,{x:i?6:4,z:0,path:[],work:null,inside:null});
 for(const u of allies)Object.assign(u,{x:4,z:0,path:[],work:null,inside:null});
 w.turn=16;w.manaTribes[1].mana=20000;w.manaTribes[1].available=0;for(const e of w.ai.spellEntries)e.people=1;
 tick(w,1/12);const shot=w.projectiles.find(p=>p.team==='red');assert.ok(shot);assert.deepEqual(shot.target,{x:7,z:-1},'live Blast retargets to the positive neighboring cell');
});


test('defeat seeds native building collapse and staged damage ejects occupants before removal', async () => {
 const {buildingModel}=await import('../app/model.ts');
 const {default:rules}=await import('../app/original-rules.json',{with:{type:'json'}});
 const defeated=createWorld();defeated.units=defeated.units.filter(u=>u.team==='blue');
 defeated.turn=47;tick(defeated,1/12);
 assert.equal(defeated.status,'won');assert.equal(defeated.outcome.skyCounter,20);
 assert.ok(defeated.buildings.filter(b=>b.team==='blue').every(b=>b.collapse===null));
 const ruins=defeated.buildings.filter(b=>b.team==='red');assert.ok(ruins.length);
 assert.ok(ruins.every(b=>b.collapse.buildingFlags&64));
 // Isolate the live object adapter from outcome processing; the separate result
 // regression exercises continuous destruction after a real victory or defeat.
 const w=createWorld(),b=w.buildings.find(b=>b.team==='red'&&b.kind==='hut');
 w.manaWorld.gameFlags=32;w.terrain.fill(3);w.buildings=[b];w.units=[];
 const occupant=addUnit(w,'red','brave',b);occupant.inside=b.id;occupant.work=b.id;
 const model=buildingModel(b),threshold=rules.buildingDamageThreshold[model];
 b.collapse={model,state:2,flags2:0,flags3:0,buildingFlags:64,counter:0,damage:threshold,
  stage:4,attacker:255,occupants:1,plan:{remaining:rules.buildingLife[model],repairDelay:0,attacker:255}};
 tick(w,1/12);
 assert.equal(b.collapse.plan.remaining,rules.buildingLife[model]-100);assert.equal(b.collapse.stage,2);
 assert.equal(occupant.inside,null);assert.equal(occupant.work,null);assert.equal(occupant.hp,maxHp('brave'));
 assert.equal(b.collapse.plan.repairDelay,rules.buildingRepairDelay);
 assert.ok(w.effects.some(f=>f.kind==='death'&&f.duration>=rules.buildingSmokeDuration/12));
 assert.ok(w.sounds.some(s=>s.cue===0x34));
 for(let i=0;i<200&&w.buildings.includes(b);i++)tick(w,1/12);
 assert.equal(b.collapse.stage,0);assert.equal(b.hp,0);assert.ok(!w.buildings.includes(b));
});

test('building display stages follow remaining work and retain separate complete meshes', async () => {
 const {buildingStage,buildingObject}=await import('../app/model.ts');
 const {modelStage}=await import('../app/model-faces.ts');
 const w=createWorld(),b=w.buildings.find(b=>b.kind==='hut'),source=nativeModels[buildingObject(b)],before=structuredClone(source);
 const stages=[0,.25,.5,.75,1].map(progress=>{b.progress=progress;return buildingStage(b);});
 assert.deepEqual(stages,[0,1,2,3,4]);
 for(let stage=0;stage<4;stage++){
  const mesh=modelStage(source,stage);assert.ok(mesh.p.length);assert.equal(mesh.p.length/3,mesh.uv.length/2);
  assert.notDeepEqual(mesh.uv,source.uv,'unfinished surfaces retain their native cap material');
 }
 assert.strictEqual(modelStage(source,4),source);assert.deepEqual(source,before,'one damaged copy cannot mutate completed buildings');
 b.progress=1;b.collapse={stage:2};assert.equal(buildingStage(b),2,'damage takes priority over completed construction');
});

test('results preserve pending turns, collapse defeated settlements and reject new orders', () => {
 for(const team of ['blue','red']) {
  const w=createWorld(),defeated=team==='blue'?'red':'blue';w.units=w.units.filter(u=>u.team===team);
  const doomed=w.buildings.filter(b=>b.team===defeated).map(b=>b.id);assert.ok(doomed.length);
  tick(w,31.5/12);assert.equal(w.status,'playing');assert.equal(w.turn,31);
  tick(w,4/12);assert.equal(w.status,team==='blue'?'won':'lost');assert.equal(w.turn,35);
  assert.ok(Math.abs(w.pendingTime-1/24)<1e-8,'a result must not discard the fractional turn');
  const before={shots:{...w.shots},buildings:w.buildings.length,paths:w.units.map(u=>structuredClone(u.path))};
  w.selected=w.units.map(u=>u.id);command(w,{x:0,z:0});
  assert.equal(cast(w,'blast',{x:0,z:0}),false);assert.equal(placeBuilding(w,'hut',{x:0,z:0}),false);
  assert.deepEqual(w.shots,before.shots);assert.equal(w.buildings.length,before.buildings);assert.deepEqual(w.units.map(u=>u.path),before.paths);
  w.paused=true;tick(w,1);assert.equal(w.turn,35);w.paused=false;
  tick(w,512/12);assert.equal(w.turn,547);
  assert.ok(doomed.every(id=>!w.buildings.some(b=>b.id===id)),'defeated buildings finish their staged destruction');
  assert.equal(w.manaTribes[defeated==='blue'?0:1].defeatTimer,97);
  assert.equal(w.outcome.defeatedCounts[0],team==='blue'?1:0,'continued results do not count defeat twice');
  assert.equal(w.status,team==='blue'?'won':'lost');
 }
});

test('result camera crosses the world seam, releases input and retains native sky timing', async () => {
 const {createCameraMotion,createResultCamera,beginResultCamera,stepResultCamera,stepCameraMotion}=await import('../app/camera-motion.ts');
 const motion=createCameraMotion(),result=createResultCamera(),view={x:65500,y:20,angle:2040};
 const events=[],context={skyCounter:20,newTurn:false};
 beginResultCamera(result,0,0,view,{x:300,y:65500});
 beginResultCamera(result,0,0,view,{x:999,y:999});
 assert.deepEqual(result.target,{x:300,y:65500,angle:-1},'an overlapping result must not replace the route');
 const effects={lock:()=>events.push('lock'),unlock:()=>events.push('unlock'),clearInteraction:()=>events.push('clear'),sound:()=>events.push('sound')};
 let crossed=false,frames=0;
 for(;result.active&&frames<256;frames++){
  stepResultCamera(result,motion,view,context,effects);
  stepCameraMotion(motion,view,0,{rotate:()=>events.push('rotate'),globe:()=>events.push('globe')});
  if(view.x<100)crossed=true;
 }
 assert.ok(crossed,'movement takes the wrapped route');assert.ok(frames>4&&frames<256);
 assert.deepEqual(view,{x:300,y:65500,angle:2040});assert.equal(motion.active,0);
 while(context.skyCounter)stepResultCamera(result,motion,view,context,effects);
 assert.deepEqual(events.filter(e=>e!=='sound'),['lock','clear','globe','unlock']);
 assert.equal(events.filter(e=>e==='sound').length,2,'sky ticks at 16 and 0 without requiring a simulation turn');
 assert.deepEqual(result.saved,{x:65500,y:20,angle:2040});
});


test('victory owns persistent native followers, drops cargo and renders a separate paused animation clock', async () => {
 const {animateLivePeople}=await import('../app/live-people.ts');
 const {setAnimationObject}=await import('../app/animation.ts');
 const w=createWorld();w.units=w.units.filter(u=>u.team==='blue');
 const worker=w.units.find(u=>u.kind==='brave'),hut=w.buildings.find(b=>b.team==='blue');
 Object.assign(worker,{x:hut.x,z:hut.z,inside:hut.id,work:hut.id,cargo:2,path:[HOME]});
 w.units.find(u=>u.kind==='brave'&&u!==worker).kind='warrior';
 w.turn=31;w.ai.variables[57]=1;tick(w,1/12);
 assert.equal(w.status,'won');assert.ok(w.units.every(u=>u.native?.state===41));
 assert.equal(worker.inside,null);assert.equal(worker.work,null);assert.deepEqual(worker.path,[]);assert.equal(worker.cargo,0);
 assert.equal(w.trees.filter(t=>t.model===11).length,2);
 assert.equal(w.sounds.filter(s=>s.cue===11).length,2);
 assert.ok(Math.hypot(worker.x-hut.x,worker.z-hut.z)>2,'occupant exits before celebration motion');
 const shaman=w.units.find(u=>u.kind==='shaman');assert.equal(shaman.native.substate,8);
 const records=w.units.map(u=>u.native),braves=w.units.filter(u=>u.kind!=='shaman');
 for(const [i,u] of braves.entries()){
  Object.assign(u,{x:7,z:33});Object.assign(u.native,{x:3840,y:55040,anchorX:3840,anchorY:55040,substate:i?4:3,flags2:0x40000000,link:0,target:0,speed:0});
 }
 const phases=new Set();
 for(let i=0;i<96;i++){tick(w,1/12);animateLivePeople(w);animateLivePeople(w);for(const u of w.units)phases.add(u.native.substate);}
 assert.ok(phases.has(5)&&phases.has(6),'circle members enter native chain states');
 assert.ok(w.units.every((u,i)=>u.native===records[i]),'controllers retain the same person records');
 assert.ok(w.units.every(u=>u.work===null&&u.inside===null),'legacy auto-housing cannot take over celebrations');
 assert.ok(w.trees.filter(t=>t.model===11).every(t=>t.logs===1),'loose logs do not regrow');
 const p=worker.native;setAnimationObject(p,14,40);p.f1=p.f2=0;
 animateLivePeople(w);assert.equal(p.f2,1,'animation mutates the owned record');
 w.paused=true;animateLivePeople(w);assert.equal(p.f2,1);
 w.paused=false;p.renderFlags|=2;animateLivePeople(w);assert.equal(p.f2,1,'native frozen pose survives presentation updates');
});
