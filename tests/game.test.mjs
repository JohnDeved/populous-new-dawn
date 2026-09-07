import assert from 'node:assert/strict';
import test from 'node:test';
import { createWorld, tick, cast, command, select, placeBuilding, findPath, walkable, footprintPoints, normal, planetPoint, worldPoint, mapPoint, PLANET_RADIUS, HOME, ENEMY, manaRate } from '../app/model.ts';
const advance=(w,seconds)=>{for(let i=0;i<seconds*30;i++)tick(w,1/30);};
function foundations(w){for(const b of w.buildings){const n=normal(b);for(const p of footprintPoints(b.kind,b)){assert.ok(walkable(w.terrain,p),'foundation vertices stay on dry land');const q=worldPoint(w.terrain,p);const error=q.x*n.x+(q.y+PLANET_RADIUS)*n.y+q.z*n.z-(PLANET_RADIUS+b.foundation);assert.ok(Math.abs(error)<1e-9,`building ${b.id} support error ${error}`);}for(const dx of [-2.8,0,2.8])for(const dz of [-2.8,0,2.8]){const q=worldPoint(w.terrain,{x:b.x+dx,z:b.z+dz});assert.ok(Math.abs(q.x*n.x+(q.y+PLANET_RADIUS)*n.y+q.z*n.z-PLANET_RADIUS-b.foundation)<1e-9,'the rendered triangles form one supporting plane');}}}
test('original level layout, spherical coordinates, foundations, and the complete mission',()=>{
 const w=createWorld();assert.deepEqual(HOME,{x:9,z:33});assert.deepEqual(ENEMY,{x:1,z:-37});assert.equal(w.units.filter(u=>u.team==='blue'&&u.kind==='brave').length,6);assert.equal(w.buildings.length,4);assert.equal(w.shrines.length,3);assert.equal(w.units.filter(u=>u.team==='red').length,5);
 assert.ok(w.units.every(u=>walkable(w.terrain,u)));assert.equal(findPath(w.terrain,HOME,ENEMY).length,0);foundations(w);
 for(const p of [HOME,ENEMY,{x:150,z:-70},{x:-160,z:75}]){const q=planetPoint(p,2),back=mapPoint(q),n=normal(p);assert.ok(Math.abs(back.x-p.x)<1e-9&&Math.abs(back.z-p.z)<1e-9);assert.ok(Math.abs(Math.hypot(n.x,n.y,n.z)-1)<1e-9);}
 const snapshot=JSON.stringify({terrain:w.terrain,wood:w.wood,buildings:w.buildings});assert.equal(placeBuilding(w,'hut',{x:30,z:30}),false);assert.equal(placeBuilding(w,'hut',w.buildings[2]),false);assert.equal(placeBuilding(w,'camp',{x:4,z:32}),false);assert.equal(JSON.stringify({terrain:w.terrain,wood:w.wood,buildings:w.buildings}),snapshot,'invalid plans never terraform or consume timber');
 const brave=w.units.find(u=>u.team==='blue'&&u.kind==='brave'),bridge=w.shrines.find(s=>s.kind==='bridge');w.selected=[brave.id];command(w,bridge);advance(w,32);assert.ok(w.shots.bridge>=3);assert.equal(bridge.duration,7);
 select(w,'shaman');command(w,{x:0,z:20});advance(w,10);const charges=w.shots.bridge;assert.equal(cast(w,'bridge',{x:25,z:20}),false);assert.equal(w.shots.bridge,charges);assert.equal(cast(w,'bridge',{x:0,z:4}),true);foundations(w);assert.ok(findPath(w.terrain,HOME,w.shrines[0]).length);
 command(w,{x:0,z:0});advance(w,9);const guard=w.units.find(u=>u.team==='red'&&u.z>-10);assert.ok(cast(w,'blast',guard));advance(w,2);assert.ok(!w.units.includes(guard));command(w,w.shrines.find(s=>s.kind==='vault'));advance(w,15);assert.ok(w.unlockedCamp);
 assert.ok(placeBuilding(w,'camp',{x:4,z:32}));const camp=w.buildings.find(b=>b.team==='blue'&&b.kind==='camp');foundations(w);advance(w,70);assert.equal(camp.progress,1);assert.equal(camp.logs,8,'workers fetch exactly the needed logs');assert.equal(w.stats.trained,0,'training requires an explicit order');
 select(w,'brave');command(w,camp);advance(w,60);assert.ok(w.stats.trained>=3);assert.ok(w.units.some(u=>u.team==='blue'&&u.kind==='warrior'));
 select(w,'shaman');command(w,w.shrines.find(s=>s.kind==='lightning'));advance(w,42);assert.equal(w.shots.lightning,4);assert.equal(w.shrines.find(s=>s.kind==='lightning').active,false);command(w,{x:0,z:-6});advance(w,10);assert.ok(cast(w,'bridge',{x:0,z:-24}));assert.ok(findPath(w.terrain,HOME,ENEMY).length);assert.equal(bridge.active,false);foundations(w);
 command(w,{x:0,z:-22});advance(w,6);const enemyShaman=w.units.find(u=>u.team==='red'&&u.kind==='shaman');assert.ok(cast(w,'lightning',enemyShaman));advance(w,.1);assert.ok(w.redRespawn>0,'both shamans reincarnate with a delay');assert.ok(!w.units.includes(enemyShaman));
 // Fight through the remaining defenders using the units that were actually trained above.
 select(w,'warrior');for(let attempt=0;attempt<30&&w.status==='playing';attempt++){const enemy=w.units.find(u=>u.team==='red');if(!enemy)break;command(w,enemy);advance(w,8);}
 assert.equal(w.status,'won','the first mission can be won through the full discovery/build/train/combat loop');assert.ok(w.buildings.some(b=>b.team==='red'),'victory requires followers, not every empty building');
});
test('housing, mana allocation, pause, drowning, and reincarnation',()=>{
 const w=createWorld(),brave=w.units.find(u=>u.team==='blue'&&u.kind==='brave');const idle=manaRate(w);w.selected=[brave.id];command(w,w.buildings.find(b=>b.team==='blue'));advance(w,8);assert.ok(brave.inside);assert.ok(manaRate(w)>idle);
 w.shots.blast=0;w.charging=false;advance(w,3);assert.equal(w.shots.blast,0);w.charging=true;advance(w,10);assert.ok(w.shots.blast>0);const time=w.time;w.paused=true;tick(w,2);assert.equal(w.time,time);w.paused=false;
 const shaman=w.units.find(u=>u.team==='blue'&&u.kind==='shaman');shaman.x=35;shaman.z=0;tick(w,1/30);assert.ok(w.respawn>0);advance(w,13);assert.ok(w.units.some(u=>u.team==='blue'&&u.kind==='shaman'));
 w.units=w.units.filter(u=>u.team!=='blue');tick(w,1/30);assert.equal(w.status,'lost');
});

test('imported compound bases stay on their spherical ground pads',async()=>{
 const THREE=await import('three'),{readFileSync}=await import('node:fs');
 const models=JSON.parse(readFileSync(new URL('../app/original-models.json',import.meta.url)));
 const w=createWorld();
 for(const [index,id] of [[0,174],[1,142],[2,169],[3,169]]){
  const b=w.buildings[index],n=normal(b),up=new THREE.Vector3(n.x,n.y,n.z),base=planetPoint(b,b.foundation);
  const rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),up).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),b.angle));
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
