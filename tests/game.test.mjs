import assert from 'node:assert/strict';
import test from 'node:test';
import { createWorld, tick, cast, command, select, placeBuilding, findPath, walkable, footprintPoints, normal, planetPoint, worldPoint, mapPoint, PLANET_RADIUS, HOME, ENEMY, manaRate, housing, populationLimit, breedingWork, trainingCost, meleeDamage, addUnit, unitAnimation, maxHp, entrance, nativeAngle, nativeStep, random } from '../app/model.ts';
const advance=(w,seconds)=>{for(let i=0;i<seconds*30;i++)tick(w,1/30);};
function foundations(w){for(const b of w.buildings){const n=normal(b);for(const p of footprintPoints(b.kind,b)){assert.ok(walkable(w.terrain,p),'foundation vertices stay on dry land');const q=worldPoint(w.terrain,p);const error=q.x*n.x+(q.y+PLANET_RADIUS)*n.y+q.z*n.z-(PLANET_RADIUS+b.foundation);assert.ok(Math.abs(error)<1e-9,`building ${b.id} support error ${error}`);}for(const dx of [-2.8,0,2.8])for(const dz of [-2.8,0,2.8]){const q=worldPoint(w.terrain,{x:b.x+dx,z:b.z+dz});assert.ok(Math.abs(q.x*n.x+(q.y+PLANET_RADIUS)*n.y+q.z*n.z-PLANET_RADIUS-b.foundation)<1e-9,'the rendered triangles form one supporting plane');}}}
test('original level layout, spherical coordinates, foundations, and the complete mission',()=>{
 const w=createWorld();assert.deepEqual(HOME,{x:9,z:33});assert.deepEqual(ENEMY,{x:1,z:-37});assert.equal(w.units.filter(u=>u.team==='blue'&&u.kind==='brave').length,6);assert.equal(w.buildings.length,4);assert.equal(w.shrines.length,3);assert.equal(w.units.filter(u=>u.team==='red').length,5);
 assert.ok(w.units.every(u=>walkable(w.terrain,u)));assert.equal(findPath(w.terrain,HOME,ENEMY).length,0);foundations(w);
 for(const p of [HOME,ENEMY,{x:150,z:-70},{x:-160,z:75}]){const q=planetPoint(p,2),back=mapPoint(q),n=normal(p);assert.ok(Math.abs(back.x-p.x)<1e-9&&Math.abs(back.z-p.z)<1e-9);assert.ok(Math.abs(Math.hypot(n.x,n.y,n.z)-1)<1e-9);}
 const snapshot=JSON.stringify({terrain:w.terrain,wood:w.wood,buildings:w.buildings});assert.equal(placeBuilding(w,'hut',{x:30,z:30}),false);assert.equal(placeBuilding(w,'hut',w.buildings[2]),false);assert.equal(placeBuilding(w,'camp',{x:4,z:32}),false);assert.equal(JSON.stringify({terrain:w.terrain,wood:w.wood,buildings:w.buildings}),snapshot,'invalid plans never terraform or consume timber');
 const brave=w.units.find(u=>u.team==='blue'&&u.kind==='brave'),bridge=w.shrines.find(s=>s.kind==='bridge');w.selected=[brave.id];command(w,bridge);advance(w,32);assert.ok(w.shots.bridge>=3);assert.equal(bridge.duration,7);
 select(w,'shaman');command(w,{x:0,z:20});advance(w,10);const charges=w.shots.bridge;assert.equal(cast(w,'bridge',{x:25,z:20}),false);assert.equal(w.shots.bridge,charges);assert.equal(cast(w,'bridge',{x:0,z:4}),true);advance(w,6);foundations(w);assert.ok(findPath(w.terrain,HOME,w.shrines[0]).length);
 command(w,{x:0,z:0});advance(w,9);const guard=w.units.find(u=>u.team==='red'&&u.z>-10);assert.ok(cast(w,'blast',{x:guard.x+1,z:guard.z}));advance(w,2);assert.ok(!w.units.includes(guard),'Blast knocks the guard off the western coast');command(w,w.shrines.find(s=>s.kind==='vault'));advance(w,15);assert.ok(w.unlockedCamp);
 assert.ok(placeBuilding(w,'camp',{x:4,z:32}));const camp=w.buildings.find(b=>b.team==='blue'&&b.kind==='camp');foundations(w);advance(w,70);assert.equal(camp.progress,1);assert.equal(camp.logs,8,'workers fetch exactly the needed logs');assert.equal(w.stats.trained,0,'training requires an explicit order');
 select(w,'brave');command(w,camp);advance(w,60);assert.ok(w.stats.trained>=3);assert.ok(w.units.some(u=>u.team==='blue'&&u.kind==='warrior'));
 select(w,'shaman');command(w,w.shrines.find(s=>s.kind==='lightning'));advance(w,42);assert.equal(w.shots.lightning,4);assert.equal(w.shrines.find(s=>s.kind==='lightning').active,false);command(w,{x:0,z:-6});advance(w,10);assert.ok(cast(w,'bridge',{x:0,z:-24}));advance(w,6);assert.ok(findPath(w.terrain,HOME,ENEMY).length);assert.equal(bridge.active,false);foundations(w);
 command(w,{x:0,z:-22});advance(w,6);const enemyShaman=w.units.find(u=>u.team==='red'&&u.kind==='shaman');assert.ok(cast(w,'lightning',enemyShaman));advance(w,.6);assert.ok(w.redRespawn>0,'both shamans reincarnate with a delay');assert.ok(!w.units.includes(enemyShaman));
 // Fight through the remaining defenders using the units that were actually trained above.
 select(w,'warrior');for(let attempt=0;attempt<30&&w.status==='playing';attempt++){const enemy=w.units.find(u=>u.team==='red'&&u.inside===null)??w.buildings.find(b=>b.team==='red'&&w.units.some(u=>u.inside===b.id));if(!enemy)break;command(w,enemy);advance(w,8);}
 // Reincarnation can outlast the assault: use another earned Lightning gift on the last defender.
 if(w.status==='playing'){select(w,'shaman');command(w,{x:0,z:-22});advance(w,40);const last=w.units.find(u=>u.team==='red');assert.ok(last);assert.ok(cast(w,'lightning',last));advance(w,1);}
 assert.equal(w.status,'won','the first mission can be won through the full discovery/build/train/combat loop');assert.ok(w.buildings.some(b=>b.team==='red'),'victory requires followers, not every empty building');
});
test('housing, mana allocation, pause, drowning, and reincarnation',()=>{
 const w=createWorld(),brave=w.units.find(u=>u.team==='blue'&&u.kind==='brave');const idle=manaRate(w);w.selected=[brave.id];command(w,w.buildings.find(b=>b.team==='blue'));advance(w,8);assert.ok(brave.inside);assert.ok(manaRate(w)>idle);
 w.shots.blast=0;w.charging=false;advance(w,3);assert.equal(w.shots.blast,0);w.charging=true;advance(w,60);assert.ok(w.shots.blast>0);const time=w.time;w.paused=true;tick(w,2);assert.equal(w.time,time);w.paused=false;
 const shaman=w.units.find(u=>u.team==='blue'&&u.kind==='shaman');shaman.x=35;shaman.z=0;tick(w,1/12);assert.ok(w.respawn>0);advance(w,13);assert.ok(w.units.some(u=>u.team==='blue'&&u.kind==='shaman'));
 w.units=w.units.filter(u=>u.team!=='blue');tick(w,1/12);assert.equal(w.status,'lost');
});

test('imported compound bases stay on their spherical ground pads',async()=>{
 const THREE=await import('three'),{readFileSync}=await import('node:fs');
 const models=JSON.parse(readFileSync(new URL('../app/original-models.json',import.meta.url)));
 const w=createWorld();
 for(const [index,id] of [[0,174],[1,142],[2,169],[3,169]]){
  const b=w.buildings[index],n=normal(b),up=new THREE.Vector3(n.x,n.y,n.z),base=planetPoint(b,b.foundation);
  const rotation=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(Math.cos(b.x/PLANET_RADIUS),-Math.sin(b.x/PLANET_RADIUS),0),up,new THREE.Vector3(Math.cos(b.x/PLANET_RADIUS),-Math.sin(b.x/PLANET_RADIUS),0).cross(up))).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),-b.angle));
  const points=models[id].p;
  for(let i=0;i<points.length;i+=3){
   if(Math.abs(points[i+1])>.012)continue;
   const vertex=new THREE.Vector3(points[i],points[i+1],points[i+2]).multiplyScalar(2).applyQuaternion(rotation).add(new THREE.Vector3(base.x,base.y,base.z));
   const ground=worldPoint(w.terrain,mapPoint(vertex));
   const gap=vertex.sub(new THREE.Vector3(ground.x,ground.y,ground.z)).dot(up);
   assert.ok(gap>-.006&&gap<.03,`native model ${id} base gap ${gap}`);
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
 w.selected=[shaman.id];const shots=w.shots.blast;assert.ok(cast(w,'blast',shaman));assert.equal(unitAnimation(w,shaman),'cast');command(w,{x:10,z:32});advance(w,.6);assert.equal(w.shots.blast,shots,'movement interrupts the pending cast');
 shaman.x=0;shaman.z=20;shaman.path=[];w.shots.bridge=1;const before=[...w.terrain];assert.ok(cast(w,'bridge',{x:0,z:4}));advance(w,.6);const rise=w.effects.find(e=>e.kind==='bridge');assert.ok(rise.land.length>0);const sample=rise.land.find(p=>p.to-p.from>1);assert.ok(w.terrain[sample.index]>before[sample.index]&&w.terrain[sample.index]<sample.to);advance(w,6);assert.equal(w.terrain[sample.index],sample.to);foundations(w);
 shaman.x=0;shaman.z=0;brave.x=2;brave.z=0;brave.team='red';brave.work=null;brave.inside=null;const hp=brave.hp;assert.ok(cast(w,'blast',brave));advance(w,.6);assert.ok(brave.hp>0&&brave.hp<hp,'blast injures and launches a healthy follower instead of instantly killing');assert.ok(brave.lift>0);assert.equal(unitAnimation(w,brave),'airborne');
 const hut=w.buildings.find(b=>b.team==='blue');for(const angle of [0,Math.PI/2,Math.PI,3*Math.PI/2]){hut.angle=angle;const door=entrance(w,hut);assert.ok(Math.abs(door.x-hut.x+Math.sin(angle)*4)<1e-9&&Math.abs(door.z-hut.z-Math.cos(angle)*4)<1e-9,'door routes use the model coordinate conversion');}
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
 w.shots.lightning=1;assert.ok(cast(w,'lightning',{x:2.3,z:.3}));tick(w,.5);
 assert.ok(!w.units.includes(hit));assert.equal(outside.hp,maxHp('brave'));assert.equal(outside.lift,0,'adjacent cells receive no invented radial lightning damage');
 const ally=addUnit(w,'blue','brave',{x:2,z:0});const hp=ally.hp;
 assert.ok(cast(w,'blast',ally));tick(w,.5);assert.equal(ally.hp,hp);assert.ok(ally.lift>0,'allies can be launched without taking Blast damage');
});

test('native integer movement and combat exchanges preserve timing, retaliation and replay',async()=>{
 for(const [x,z,angle] of [[0,-256,0],[256,-256,256],[256,0,512],[256,256,768],[0,256,1024],[-256,256,1280],[-256,0,1536],[-256,-256,1792]])assert.equal(nativeAngle(x,z),angle);
 assert.deepEqual(nativeStep({x:0,z:0},256,70),{x:49/256,z:-49/256});
 assert.deepEqual(nativeStep({x:0,z:0},1280,70),{x:-50/256,z:50/256},'signed native products round down, not toward zero');
 const moving=createWorld();moving.terrain.fill(3);moving.buildings=[];moving.units=[];
 const walker=addUnit(moving,'blue','brave',{x:0,z:0});addUnit(moving,'red','brave',{x:40,z:40});walker.path=[{x:10,z:0}];tick(moving,1/12);
 assert.equal(walker.x,70/256);assert.equal(walker.z,0);assert.equal(walker.heading,Math.PI/2);
 const rng=createWorld();assert.deepEqual(Array.from({length:6},()=>random(rng)),[1275068418,1896767491,2517695575,2629181784,3921238491,2630906275]);
 const duel=(seed=1)=>{const w=createWorld();w.terrain.fill(3);w.units=[];w.buildings=[];w.randomState=seed;addUnit(w,'blue','warrior',{x:0,z:0});addUnit(w,'red','brave',{x:1,z:0});return w;};
 const a=duel(),b=structuredClone(a);b.units.reverse();tick(a,1/12);tick(b,1/12);b.units.sort((a,b)=>a.id-b.id);assert.deepEqual(b,a,'one coordinated exchange is independent of unit array order');
 assert.equal(a.units[0].hp,87);assert.equal(a.units[1].hp,32,'the brave retaliates with its pre-hit health');
 assert.equal(a.units[0].fight.action,'attack');assert.equal(a.units[1].fight.action,'recoil');
 assert.equal(a.units[0].heading,Math.PI/2);assert.equal(a.units[1].heading,Math.PI*1.5);
 tick(a,5/12);assert.equal(a.units[1].hp,32,'no second exchange during animation recovery');tick(a,1/12);assert.ok(a.units[1].hp<32);
 const special=duel(75);tick(special,1/12);assert.equal(special.units[0].fight.action,'special');assert.equal(special.units[0].hp,90,'state 4 suppresses retaliation');assert.equal(special.units[0].fight.until-special.turn,7);
 const strike=duel(12);tick(strike,1/12);assert.equal(strike.units[0].fight.action,'strike');assert.equal(strike.units[0].hp,87);
 const lethal=duel();for(const u of lethal.units)u.hp=1;tick(lethal,1/12);assert.equal(lethal.units.length,0,'a lethal ordinary exchange still applies both precomputed hits');
 const replay=duel(),other=structuredClone(replay);for(let i=0;i<150;i++)tick(replay,1/30);for(let i=0;i<720;i++)tick(other,1/144);assert.deepEqual(other,replay);
 const {readFileSync}=await import('node:fs'),sprites=JSON.parse(readFileSync(new URL('../app/original-units.json',import.meta.url)));
 for(const [kind,state,start,frames] of [['warrior','attack',120,6],['warrior','strike',104,7],['warrior','special',200,7],['brave','recoil',112,7],['shaman','special',552,5],['shaman','recoil',424,5]]){const cycle=sprites.animations[`blue-${kind}`][state][0];assert.equal(cycle.source,start);assert.equal(cycle.frames.length,frames);}
});
