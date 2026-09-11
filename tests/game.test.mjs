import {syncLivePersonCells} from '../app/live-people.ts';
import {worshipPositions} from '../app/worship.ts';
import {nativePosition} from '../app/model.ts';
import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import nativeModels from '../app/original-models.json' with {type:'json'};
import level from '../app/level-one.ts';
import {reincarnationTurns,stepReincarnation} from '../app/reincarnation.ts';
import {buildingGradeVertices,buildingPosition} from '../app/building-shapes.ts';
import {browserPosition} from '../app/model.ts';
import originalScript from '../app/original-script.json' with {type:'json'};
import {createTooltip,forcedTooltipObject,showObjectTooltip,stepTooltip} from '../app/tooltips.ts';
import {modelMatrix,modelPoint} from '../app/projection.ts';
import {runScript,scriptState} from '../app/popscript.ts';
import {campaignCommand,recordSpellCast,rotateBuildingPlan,addBuilding,buildingObject,buildingPose,buildingPlanPose,placementError} from '../app/model.ts';
import { createWorld, tick, cast, command, select, placeBuilding, findPath, walkable, worldPoint, HOME, ENEMY, manaRate, housing, populationLimit, breedingWork, trainingCost, meleeDamage, addUnit, unitAnimation, unitAnimationSource, maxHp, entrance, nativeAngle, nativeStep, nativeStep3D, nativeTerrainCross, nativeTerrainHeight, terrainCross, makeTerrain, height, markerHeight, nativeCellPoint, removeHead, GRID, random, fightPosition } from '../app/model.ts';
const advance=(w,seconds)=>{for(let i=0;i<seconds*30;i++)tick(w,1/30);};
test('scenery shade follows cell occupants through overlap, depletion and regrowth', async () => {
  const {syncLandscapeObjects}=await import('../app/model.ts');
  const w=createWorld();
  const tree=w.trees.find(t=>w.sceneryShadows.has(t.id));
  const p=w.sceneryShadows.get(tree.id);
  const i=(p.anchorY>>9)*128+(p.anchorX>>9);
  assert.equal(w.land.shadows[i]&15,6);
  const slope=w.land.shadows[i]&240;
  const copy={...tree,id:w.nextId++};
  w.trees.push(copy);syncLandscapeObjects(w);
  assert.equal(w.land.shadows[i]&15,12);
  tree.logs=1;syncLandscapeObjects(w);
  assert.equal(w.land.shadows[i]&15,12,'a shrinking tree still occupies its cell');
  tree.logs=0;syncLandscapeObjects(w);
  assert.equal(w.land.shadows[i]&15,6,'removing one tree preserves the other occupant');
  copy.logs=0;syncLandscapeObjects(w);
  assert.equal(w.land.shadows[i]&15,0);
  assert.equal(w.land.shadows[i]&240,slope,'scenery must preserve the slope nibble');
  tree.logs=4;syncLandscapeObjects(w);
  assert.equal(w.land.shadows[i]&15,6);
});
test('rotated building plans keep their anchor, entrance routes and orientation through construction', () => {
  for (let direction = 0; direction < 4; direction++) {
    const w = createWorld();
    w.manaWorld.gameFlags = 32;
    w.inputMask = 0;
    w.mode = 'hut';
    for (let i = 0; i < direction; i++) assert.ok(rotateBuildingPlan(w));
    w.mode = 'camp';
    assert.ok(rotateBuildingPlan(w));
    w.mode = 'hut';
    const point = { x: -1.7, z: 32.3 };
    const plan = buildingPlanPose(w, 'hut', point);
    assert.equal(plan.angle, direction * 512, 'each building type remembers its own direction');
    assert.equal(placementError(w, 'hut', point), null);
    select(w, 'brave');
    assert.ok(placeBuilding(w, 'hut', point));
    const b = w.buildings.at(-1);
    assert.deepEqual(b.anchor, { x: plan.anchorX, y: plan.anchorY });
    assert.deepEqual({ x: b.x, z: b.z }, browserPosition(buildingPosition(buildingPose(b))));
    assert.equal(buildingPose(b).anchorX, plan.anchorX);
    assert.equal(buildingPose(b).anchorY, plan.anchorY);
    const workers = w.units.filter(u => u.work === b.id);
    assert.ok(workers.length);
    for (const u of workers) assert.deepEqual(u.path.at(-1), entrance(w, b));
    until(w, () => b.progress === 1, 120);
    assert.equal(buildingPose(b).angle, plan.angle);
    assert.equal(w.mode, null);
    assert.equal(rotateBuildingPlan(w), false);
  }
});
test('Lightning ignites only its building footprint, then evacuates, damages and permits repair', () => {
  const w = createWorld();
  w.manaWorld.gameFlags = 32;
  const building = w.buildings.find(b => b.team === 'blue' && b.kind === 'hut');
  const neighbor = w.buildings.find(b => b.team === 'blue' && b.id !== building.id);
  const hp = building.hp;
  const occupant = w.units.find(u => u.team === 'blue' && u.kind === 'brave');
  occupant.inside = occupant.work = building.id;
  w.shots.lightning = 1;
  select(w, 'shaman');
  assert.ok(cast(w, 'lightning', building));
  until(w, () => !!building.burn, 5);
  assert.equal(building.hp, hp, 'ignition does not apply the old immediate HP subtraction');
  assert.equal(neighbor.damageState, null);
  const fires = w.effects.filter(f => f.fire?.suppressEmbers);
  assert.ok(fires.length > 1, 'original shape supplies multiple fire sockets');
  assert.equal(w.lights.filter(l => l && fires.some(f => f.id === l.owner)).length, 1, 'only the first native building flame socket requests light');
  until(w, () => building.burn.remaining === 119, 2);
  assert.equal(occupant.inside, null);
  assert.equal(building.damageState.plan.remaining, 300);
  until(w, () => building.burn.remaining === 79, 4);
  assert.equal(occupant.inside,null,'automatic housing cannot reenter a burning hut');
  assert.equal(building.damageState.plan.remaining, 200);
  assert.equal(building.damageState.stage, 2);
  assert.ok(w.sounds.some(s => s.cue === 0x53 && s.stop && s.owner === building.id));
  until(w, () => !building.burn && fires.every(f => !w.effects.includes(f)), 8);
  assert.ok(w.lights.every(l => !l || !fires.some(f => f.id === l.owner)), 'extinguished building releases its light');
  assert.equal(building.progress, 2 / 3);
  assert.equal(building.logs, 2);
  assert.ok(building.damageState.plan.repairDelay > 1000, 'native damage starts the repair holdoff');
  until(w, () => building.damageState.plan.repairDelay === 1, 105);
  advance(w, 2);
  assert.equal(building.damageState.plan.repairDelay, 1, 'an unstaffed repair waits at one');
  select(w, 'brave');
  command(w, building);
  until(w, () => building.damageState.plan.repairDelay === 0, 20);
  assert.equal(building.progress, 2 / 3, 'repair waits for the original delay before fetching');
  until(w, () => building.progress === 1, 45);
  assert.equal(building.damageState.state, 2);
  assert.equal(building.damageState.plan.remaining, 300);
  assert.equal(building.hp, hp);
  until(w, () => !w.units.some(u=>u.work===building.id&&u.builder), 30);
  assert.ok(building.builders.every(id=>id===0),'repaired buildings retain the same departure gate');
});
test('Lightning burns original scenery through smoke and cleanup without leaking fire state', () => {
  const w = createWorld();
  w.manaWorld.gameFlags = 32;
  const tree = w.trees.find(t => t.id === 21);
  const neighbor = w.trees.find(t => t.id === 22);
  w.shots.lightning = 1;
  select(w, 'shaman');
  assert.ok(cast(w, 'lightning', tree));
  until(w, () => w.effects.some(f => f.fire?.smokeOnExpiry), 15);
  const fx = w.effects.find(f => f.fire?.smokeOnExpiry);
  assert.ok(tree.burn);
  assert.equal(neighbor.burn, undefined, 'ignition stays in the target native cell');
  until(w, () => w.effects.some(f => f.smoke), 10);
  const cloud = w.effects.find(f => f.smoke);
  assert.equal('remaining' in cloud.animation, false, 'smoke must not be dispatched as a spell trail');
  assert.ok(tree.burn.wood < 400);
  until(w, () => !w.effects.includes(fx) && tree.logs === 0, 2);
  assert.ok(w.effects.includes(cloud), 'smoke outlives the fire');
  assert.ok(w.sounds.some(s => s.cue === 6 && s.owner === fx.id));
});
test('native impacts expire on exact turns and debris preserves the sprite allocation counter', async () => {
  const {effect, nativePosition} = await import('../app/model.ts');
  const {terrainPointHeight} = await import('../app/native-terrain.ts');
  const w = createWorld();
  const counter = w.effectCounter;
  effect(w, 'debris', HOME);
  assert.equal(w.effectCounter, counter, 'class 10 does not change class 7 animation staggering');
  for (const [kind, turns] of [['splash', 16], ['blast', 9]]) {
    const f = effect(w, kind, HOME);
    assert.equal(f.height * 45, terrainPointHeight(w.land, nativePosition(w, HOME)));
    if (kind === 'splash') {
      assert.equal(f.animation.object, 1304);
      assert.equal(w.sounds.at(-1).cue, 0x2c);
    }
    for (let turn = 1; turn < turns; turn++) tick(w, 1 / 12);
    assert.ok(w.effects.includes(f));
    tick(w, 1 / 12);
    assert.equal(w.effects.includes(f), false, `${kind} must not gain a turn from floating-point age`);
  }
});
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
function standAtHead(w,u,head) {
 const point=worshipPositions({...nativePosition(w,head),angle:Math.round(head.angle*1024/Math.PI)&2047})[0]
 Object.assign(u,browserPosition(point));syncLivePersonCells(w);w.selected=[u.id];command(w,head)
 until(w,()=>u.native?.substate===2,2)
}

function impact(w,spell){const shot=w.projectiles.find(p=>p.team==='blue'&&p.spell===spell);assert.ok(shot);for(let i=0;i<120&&w.projectiles.includes(shot);i++)tick(w,1/12);assert.ok(!w.projectiles.includes(shot),'spell resolves within ten seconds');}
function foundations(w) {
 for (const b of w.buildings.filter(b=>!b.preparation)) for (const {index} of buildingGradeVertices(buildingPose(b))) {
  const p=browserPosition({x:(index&127)*512,y:(index>>7)*512});
  assert.ok(walkable(w.terrain,p),'native foundation vertices stay on dry land');
  assert.ok(Math.abs(worldPoint(w.terrain,p).y-b.foundation*45/128)<1e-9,'native mask vertices support the building');
 }
}
test('original level layout, native foundations, and the complete mission',()=>{
 const w=createWorld();assert.deepEqual(HOME,{x:9,z:33});assert.deepEqual(ENEMY,{x:1,z:-37});assert.equal(w.units.filter(u=>u.team==='blue'&&u.kind==='brave').length,6);assert.equal(w.buildings.length,4);assert.equal(w.shrines.length,3);assert.equal(w.units.filter(u=>u.team==='red').length,5);
 assert.ok(w.units.every(u=>walkable(w.terrain,u)));assert.equal(findPath(w,{...w.units.find(u=>u.team==='blue'&&u.kind==='brave'),...HOME},ENEMY).length,0);foundations(w);

 const snapshot=JSON.stringify({terrain:w.terrain,wood:w.wood,buildings:w.buildings});assert.equal(placeBuilding(w,'hut',{x:30,z:30}),false);assert.equal(placeBuilding(w,'hut',w.buildings[2]),false);assert.equal(placeBuilding(w,'camp',{x:-2,z:32}),false);assert.equal(JSON.stringify({terrain:w.terrain,wood:w.wood,buildings:w.buildings}),snapshot,'invalid plans never terraform or consume timber');
 const brave=w.units.find(u=>u.team==='blue'&&u.kind==='brave'),bridge=w.shrines.find(s=>s.kind==='bridge');w.selected=[brave.id];command(w,bridge);until(w,()=>w.shots.bridge>=3,60);assert.equal(bridge.duration,28/3);
 select(w,'shaman');command(w,{x:0,z:20});advance(w,10);const charges=w.shots.bridge;assert.equal(cast(w,'bridge',{x:25,z:20}),false);assert.equal(w.shots.bridge,charges);assert.equal(cast(w,'bridge',{x:0,z:4}),true);advance(w,6);foundations(w);assert.ok(findPath(w,{...w.units.find(u=>u.team==='blue'&&u.kind==='brave'),...HOME},w.shrines[0]).length);
 command(w,{x:0,z:0});advance(w,9);const guard=w.units.find(u=>u.team==='red'&&u.z>-10);assert.ok(cast(w,'blast',{x:guard.x+1,z:guard.z}));advance(w,2);assert.ok(!w.units.includes(guard),'Blast knocks the guard off the western coast');command(w,w.shrines.find(s=>s.kind==='vault'));until(w,()=>w.unlockedCamp,45);
 assert.ok(placeBuilding(w,'camp',{x:-2,z:32}));const camp=w.buildings.find(b=>b.team==='blue'&&b.kind==='camp');foundations(w);advance(w,70);assert.equal(camp.progress,1);assert.equal(camp.logs,8,'workers fetch exactly the needed logs');assert.equal(w.stats.trained,0,'training requires an explicit order');
 select(w,'brave');command(w,camp);advance(w,60);assert.ok(w.stats.trained>=3);assert.ok(w.units.some(u=>u.team==='blue'&&u.kind==='warrior'));
 select(w,'shaman');command(w,w.shrines.find(s=>s.kind==='lightning'));until(w,()=>w.shots.lightning===4,75);assert.equal(w.shots.lightning,4);assert.equal(w.shrines.find(s=>s.kind==='lightning').active,false);command(w,{x:0,z:-6});advance(w,10);assert.ok(cast(w,'bridge',{x:0,z:-22}));impact(w,'bridge');advance(w,6);assert.ok(findPath(w,{...w.units.find(u=>u.team==='blue'&&u.kind==='warrior'),...HOME},ENEMY).length);assert.equal(bridge.active,false);foundations(w);
 command(w,{x:0,z:-22});advance(w,6);const enemyShaman=w.units.find(u=>u.team==='red'&&u.kind==='shaman');assert.ok(cast(w,'lightning',enemyShaman));impact(w,'lightning');tick(w,1/12);assert.equal(enemyShaman.hp,0);assert.equal(enemyShaman.native.state,44);until(w,()=>!w.units.includes(enemyShaman),8);assert.equal(w.redRespawn,0,'the native first-mission script disables Dakini reincarnation');
 // Fight through the remaining defenders using the units that were actually trained above.
 select(w,'warrior');for(let attempt=0;attempt<30&&w.status==='playing';attempt++){const enemy=w.buildings.find(b=>b.team==='red')??w.units.find(u=>u.team==='red'&&u.inside===null);if(!enemy)break;command(w,enemy);advance(w,8);}
 // Use another earned Lightning gift if a defender survives the assault.
 if(w.status==='playing'){select(w,'shaman');command(w,{x:0,z:-22});advance(w,40);if(w.status==='playing'){const last=w.units.find(u=>u.team==='red');assert.ok(last);assert.ok(cast(w,'lightning',last));impact(w,'lightning');}}
 assert.equal(w.status,'won','the first mission can be won through the full discovery/build/train/combat loop');
});
test('housing, mana allocation, pause, drowning, and reincarnation',()=>{
 let remaining=reincarnationTurns(false),events=[],boundaries=[];
 for(let call=1;call<=468;call++){
  const step=stepReincarnation(remaining,true,true);
  if([1,4,5,132,133,135,136,147,148,167,168,467,468].includes(call))boundaries.push([call,step.phase,step.height]);
  if(step.event)events.push([call,step.event]);
  remaining=step.remaining;
 }
 assert.deepEqual(boundaries,[[1,0,0],[4,0,0],[5,1,0],[132,1,0],[133,2,0],[135,2,0],[136,3,40],[147,3,480],[148,3,520],[167,3,1280],[168,4,1280],[467,4,1280],[468,5,1280]]);
 assert.deepEqual(events,[[133,'splash'],[134,'splash'],[135,'splash'],[463,'rise'],[468,'spawn']]);assert.equal(remaining,0);
 assert.deepEqual(stepReincarnation(336,true,false),{remaining:335,phase:2,height:0,event:null},'effect 65 requires unsupported terrain');
 assert.deepEqual(stepReincarnation(reincarnationTurns(true),true,false),{remaining:332,phase:3,height:40,event:null});
 assert.deepEqual(stepReincarnation(6,false,false),{remaining:5,phase:4,height:1280,event:null},'an existing shaman suppresses the site effect');
 assert.deepEqual(stepReincarnation(1,false,false),{remaining:1,phase:5,height:1280,event:null},'an existing shaman leaves the replacement request retryable');
 const w=createWorld(),brave=w.units.find(u=>u.team==='blue'&&u.kind==='brave');const idle=manaRate(w);w.selected=[brave.id];command(w,w.buildings.find(b=>b.team==='blue'));advance(w,8);assert.ok(brave.inside);assert.ok(manaRate(w)>idle);
 w.shots.blast=0;w.charging=false;advance(w,3);assert.equal(w.shots.blast,0);w.charging=true;advance(w,60);assert.ok(w.shots.blast>0);const time=w.time;w.paused=true;tick(w,2);assert.equal(w.time,time);w.paused=false;
 const shaman=w.units.find(u=>u.team==='blue'&&u.kind==='shaman');shaman.x=35;shaman.z=0;tick(w,1/12);assert.ok(w.respawn>0);advance(w,27);assert.ok(!w.units.some(u=>u.team==='blue'&&u.kind==='shaman'));advance(w,1);assert.ok(w.units.some(u=>u.team==='blue'&&u.kind==='shaman'));
 w.units=w.units.filter(u=>u.team!=='blue');until(w,()=>w.status==='lost',2);
});

test('native transformed compound bases stay on their ground pads',()=>{
 const w=createWorld();
 for(const b of w.buildings){
  const id=buildingObject(b),data=nativeModels[id],basis=modelMatrix(Math.round(b.angle*1024/Math.PI));
  for(let i=0;i<data.p.length;i+=3){
   const raw=[Math.round(data.p[i]*data.scale*3),Math.round(data.p[i+1]*data.scale*3),Math.round(-data.p[i+2]*data.scale*3)];
   if(Math.abs(raw[1])>5)continue;
   const p=modelPoint(raw,data.scale,basis,{x:0,y:Math.round(b.foundation*45),z:0});
   const ground=worldPoint(w.terrain,{x:b.x+p.x/128,z:b.z-p.z/128});
   const gap=p.y/128-ground.y;
   assert.ok(gap>=-1/128-1e-9&&gap<=3/128+1e-9,`native model ${id} base gap ${gap}`);
  }
 }
});

test('native animation identity, casting interruption, gradual terrain and blast survival',async()=>{
 const {readFileSync}=await import('node:fs'),sprites=JSON.parse(readFileSync(new URL('../app/original-units.json',import.meta.url))),w=createWorld();
 assert.equal(sprites.animations['blue-shaman'].walk[0].source,616);assert.equal(sprites.animations['red-shaman'].walk[0].source,624);assert.equal(sprites.animations['blue-brave'].carry[0].source,72);assert.equal(sprites.animations['blue-warrior'].attack[0].source,120);
 assert.ok(sprites.pieces.every(f=>f.w>0&&f.h>0&&f.w<=sprites.cell&&f.h<=sprites.cell));
 const shaman=w.units.find(u=>u.team==='blue'&&u.kind==='shaman'),brave=w.units.find(u=>u.team==='blue'&&u.kind==='brave');
 assert.equal(maxHp('brave'),50);assert.equal(maxHp('warrior'),90);
 w.selected=[brave.id];brave.target=32;assert.equal(unitAnimation(w,brave),'selected','an assigned distant enemy is not an active fight');brave.fighting=true;assert.equal(unitAnimation(w,brave),'attack','automatic melee displays its attack sprite');brave.fighting=false;brave.target=null;brave.cargo=1;brave.path=[{x:brave.x+1,z:brave.z}];assert.equal(unitAnimation(w,brave),'carry');brave.lift=.5;assert.equal(unitAnimation(w,brave),'airborne');brave.lift=0;brave.cargo=0;brave.path=[];
 w.manaTribes[0].available=0; // Isolate spending from the starting-mana grant.
 w.selected=[shaman.id];const shots=w.shots.blast;assert.ok(cast(w,'blast',shaman));assert.equal(unitAnimation(w,shaman),'cast');command(w,{x:10,z:32});advance(w,.6);assert.equal(w.shots.blast,shots-1,'native spell allocation spends the charge before animation finishes');assert.equal(shaman.casting,null);assert.ok(w.projectiles.length,'movement does not delete the independent spell');impact(w,'blast');
 while(w.castingTribes[0].cooldown)tick(w,1/12);
 shaman.x=0;shaman.z=20;shaman.path=[];w.shots.bridge=1;const before=[...w.terrain];assert.ok(cast(w,'bridge',{x:0,z:4}));impact(w,'bridge');tick(w,1/12);const rise=w.effects.find(e=>e.kind==='bridge');assert.equal(rise.bridge.turn,1,'first visit initializes the native crossing');tick(w,1/12);assert.ok(w.terrain.some((h,i)=>h>before[i]),'the next visit starts raising the crossing');assert.ok(w.effects.some(f=>f.sprite?.sequence==='blastTrail'&&f.animation.remaining===2),'new ground trails retain their first turn');advance(w,6);assert.ok(!w.effects.includes(rise));foundations(w);
 shaman.x=0;shaman.z=0;brave.x=2;brave.z=0;brave.team='red';brave.work=null;brave.inside=null;brave.native.tribe=1;w.levelFlags2|=0x2000000;syncLivePersonCells(w);const hp=brave.hp;assert.ok(cast(w,'blast',brave));impact(w,'blast');tick(w,1/12);assert.ok(brave.hp>0&&brave.hp<hp,'blast injures and launches a healthy follower instead of instantly killing');assert.ok(brave.lift>0);assert.equal(unitAnimation(w,brave),'airborne');
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
 const count=grow.units.length;h.timer=breedingWork(grow,h)-8;grow.turn=3;h.counter=3;grow.time=.25;tick(grow,1/12);assert.equal(grow.units.length,count+1);assert.equal(h.timer,0);
 grow.trees.push({...entrance(grow,h),id:grow.nextId++,model:11,logs:3});
 grow.turn=15;h.counter=15;grow.time=15/12;h.upgrade=2392;tick(grow,1/12);assert.equal(h.level,2);assert.equal(h.progress,1/3);assert.equal(h.logs,1,'native replacement begins with 100 work and available entrance timber');assert.equal(h.upgrading,true);
 advance(grow,70);assert.equal(h.progress,1);assert.equal(h.logs,3);assert.equal(h.upgrading,false);foundations(grow);
 const capped=createWorld();while(capped.units.filter(u=>u.team==='blue').length<populationLimit(capped,'blue'))addUnit(capped,'blue','brave',HOME);
 const ch=capped.buildings.find(b=>b.team==='blue');ch.timer=99999;tick(capped,1/3);assert.equal(ch.timer,0);assert.equal(capped.units.filter(u=>u.team==='blue').length,12,'breeding stops at the settlement population limit');
});


test('lightning hits a native map cell and Blast leaves allied health intact',()=>{
 const w=createWorld();w.buildings=[];const shaman=w.units.find(u=>u.team==='blue'&&u.kind==='shaman');
 shaman.x=0;shaman.z=0;w.units=w.units.filter(u=>u.kind==='shaman');
 const hit=addUnit(w,'blue','brave',{x:2.2,z:.2}),outside=addUnit(w,'blue','brave',{x:1.9,z:.2});
 w.shots.lightning=1;assert.ok(cast(w,'lightning',{x:2.3,z:.3}));impact(w,'lightning');
 assert.ok(w.units.includes(hit),'projectile arrival precedes strike dispatch');tick(w,1/12);assert.equal(hit.hp,0);assert.equal(hit.native.state,44);assert.equal(outside.hp,maxHp('brave'));assert.equal(outside.lift,0,'the later shockwave is separate from the cell strike');
 while(w.castingTribes[0].cooldown)tick(w,1/12);
 const ally=addUnit(w,'blue','brave',{x:2,z:0});const hp=ally.hp;
 assert.ok(cast(w,'blast',ally));impact(w,'blast');for(let i=0;i<3;i++)tick(w,1/12);assert.equal(ally.hp,hp);assert.ok(ally.lift>0,'allies can be launched without taking Blast damage');
});

test('native integer movement and combat exchanges preserve timing, retaliation and replay',async()=>{
 for(const [x,z,angle] of [[0,-256,0],[256,-256,256],[256,0,512],[256,256,768],[0,256,1024],[-256,256,1280],[-256,0,1536],[-256,-256,1792]])assert.equal(nativeAngle(x,z),angle);
 assert.deepEqual(nativeStep({x:0,z:0},256,70),{x:49/256,z:-49/256});
 assert.deepEqual(nativeStep({x:0,z:0},1280,70),{x:-50/256,z:50/256},'signed native products round down, not toward zero');
 const moving=createWorld();moving.terrain.fill(3);moving.buildings=[];moving.units=[];
 const walker=addUnit(moving,'blue','brave',{x:0,z:0});addUnit(moving,'red','brave',{x:40,z:40});walker.path=[{x:10,z:0}];tick(moving,1/12);
 assert.equal(walker.x,70/256);assert.equal(walker.z,0);assert.equal(walker.heading,Math.PI/2);
 const rng={randomState:1};assert.deepEqual(Array.from({length:6},()=>random(rng)),[1275068418,1896767491,2517695575,2629181784,3921238491,2630906275]);
 const duel=(seed=1)=>{const w=createWorld();w.terrain.fill(3);w.terrainVersion++;w.units=[];w.buildings=[];w.manaWorld.gameFlags=0;w.randomState=seed;const a=addUnit(w,'blue','warrior',{x:0,z:0}),b=addUnit(w,'red','brave',{x:180/256,z:0}),group={id:w.nextId++,x:0,z:0,angle:512,members:[a.id,b.id]};w.fights=[group];for(const [u,other] of [[a,b],[b,a]])u.fight={group:group.id,opponent:other.id,action:'ready',started:0,remaining:0};return w;};
 const a=duel(),b=structuredClone(a);b.units.reverse();tick(a,1/12);tick(b,1/12);b.units.sort((a,b)=>a.id-b.id);assert.deepEqual(b,a,'one coordinated exchange is independent of unit array order');
 assert.equal(a.units[0].hp,87);assert.equal(a.units[1].hp,32,'the brave retaliates with its pre-hit health');
 assert.equal(a.units[0].fight.action,'attack');assert.equal(a.units[1].fight.action,'recoil');
 assert.equal(a.units[0].heading,Math.PI/2);assert.equal(a.units[1].heading,Math.PI*1.5);
 tick(a,3/12);assert.equal(a.units[1].hp,32,'no second exchange during animation recovery');const before=a.units[1].x,speed=random(structuredClone(a))%70+35,impulse=speed+(speed>>4);tick(a,1/12);assert.equal(a.units[1].fight.action,'push');assert.equal(a.units[1].x,before+(impulse+Math.max(0,impulse-28))/256,'the first recoil turn applies the native impulse, then ground damping and movement');tick(a,2/12);assert.notEqual(a.units[1].fight.action,'push');tick(a,2);assert.ok((a.units[1]?.hp??0)<32);
 const special=duel(75);tick(special,1/12);assert.equal(special.units[0].fight.action,'special');assert.equal(special.units[0].hp,90,'state 4 suppresses retaliation');assert.equal(special.units[0].fight.remaining,6);
 const strike=duel(12);tick(strike,1/12);assert.equal(strike.units[0].fight.action,'strike');assert.equal(strike.units[0].hp,87);
 const lethal=duel();for(const u of lethal.units)u.hp=1;tick(lethal,1/12);assert.equal(lethal.units.length,0,'a lethal ordinary exchange still applies both precomputed hits');assert.equal(lethal.fights.length,0,'terminal turns retain no dead fight groups');
 const replay=duel(),other=structuredClone(replay);for(let i=0;i<150;i++)tick(replay,1/30);for(let i=0;i<720;i++)tick(other,1/144);assert.deepEqual(other,replay);
 const {readFileSync}=await import('node:fs'),sprites=JSON.parse(readFileSync(new URL('../app/original-units.json',import.meta.url)));
 for(const [kind,state,start,frames] of [['warrior','attack',120,6],['warrior','strike',104,7],['warrior','special',200,7],['brave','recoil',112,7],['shaman','special',552,5],['shaman','recoil',424,5]]){const cycle=sprites.animations[`blue-${kind}`][state][0];assert.equal(cycle.source,start);assert.equal(cycle.frames.length,frames);}
});

test('native fight slots form four-person groups and release on interruption',()=>{
 const w=createWorld();w.terrain.fill(3);w.terrainVersion++;w.units=[];w.buildings=[];
 w.manaWorld.gameFlags|=64; // Original skip-intro mode isolates group slots from the tested encounter sequence.
 w.turn=3; // First contact is tested on an original four-turn detection visit.
 const center=addUnit(w,'blue','warrior',{x:0,z:0});
 for(let i=0;i<4;i++)addUnit(w,'red','brave',{x:.4+i*.1,z:0});
 tick(w,1/12);assert.equal(w.fights.length,1);assert.equal(w.fights[0].members.length,4,'one center and at most three attackers');
 assert.equal(w.units.filter(u=>u.fight).length,4);assert.equal(center.hp,90,'contact first creates and stages a fight');
 tick(w,1/12); // Native group visitation selects the center after admission.
 const b=w.fights[0];assert.equal(b.members[0],center.id);
 for(let i=1;i<4;i++){const p=fightPosition(b,i);assert.ok(Math.abs(Math.hypot(p.x-b.x,p.z-b.z)-180/256)<.006);}
 const replay=structuredClone(w);for(let i=0;i<30;i++)tick(w,1/30);for(let i=0;i<144;i++)tick(replay,1/144);assert.deepEqual(replay,w,'group movement and RNG do not depend on render rate');
 const slots=w.fights[0].members.map((_,i)=>fightPosition(w.fights[0],i));assert.equal(new Set(slots.map(p=>`${p.x}:${p.z}`)).size,4);
 const shaman=addUnit(w,'blue','shaman',{x:3,z:0});assert.ok(cast(w,'blast',center));impact(w,'blast');for(let i=0;i<3;i++)tick(w,1/12);
 assert.equal(center.fight,null);assert.ok(center.lift>0);assert.equal(w.fights.length,0,'launched participants leave no stale fight group');assert.equal(shaman.lift,0);
 const swap=createWorld();swap.terrain.fill(3);swap.units=[];swap.buildings=[];
 swap.manaWorld.gameFlags|=64;
 swap.turn=3;
 const a=addUnit(swap,'blue','brave',{x:0,z:0}),enemy=addUnit(swap,'red','warrior',{x:.6,z:0});addUnit(swap,'blue','brave',{x:1,z:0});tick(swap,1/12);tick(swap,1/12);
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
 const make=()=>{const w=createWorld();w.terrain.fill(3);w.terrainVersion++;w.buildings=[];w.units=w.units.filter(u=>u.kind==='shaman');w.units[0].x=0;w.units[0].z=0;const enemy=w.units.find(u=>u.team==='red');enemy.x=30;enemy.z=30;return w;};
 const w=make(),ids=w.nextId,rng=w.randomState;assert.ok(cast(w,'blast',{x:4,z:0}));
 assert.deepEqual(w.sounds.map(e=>e.cue),[0x76]);assert.equal(w.nextId,ids+1);assert.equal(w.randomState,rng);
 for(let i=0;i<5;i++)tick(w,1/12);assert.equal(w.sounds.length,1);
 tick(w,1/12);assert.deepEqual(w.sounds.map(e=>e.cue),[0x76,0xa1]);assert.equal(w.effects.some(e=>e.kind==='blast'),false);impact(w,'blast');assert.deepEqual(w.sounds.map(e=>e.cue),[0x76,0xa1,0xa1,0xb2]);assert.deepEqual(w.sounds.map(e=>e.turn),[0,6,9,9]);
 const canceled=make();assert.ok(cast(canceled,'blast',{x:4,z:0}));canceled.selected=[canceled.units[0].id];command(canceled,{x:1,z:0});impact(canceled,'blast');assert.deepEqual(canceled.sounds.map(e=>e.cue),[0x76,0xa1,0xa1,0xb2]);
 const a=make(),b=make();cast(a,'blast',{x:4,z:0});cast(b,'blast',{x:4,z:0});for(let i=0;i<30;i++)tick(a,1/30);for(let i=0;i<144;i++)tick(b,1/144);assert.deepEqual(a.sounds,b.sounds);
});


test('native Lightning delays the upper flash and regenerates eight segments for three turns',()=>{
 const w=createWorld();w.terrain.fill(3);w.terrainVersion++;w.buildings=[];w.units=w.units.filter(u=>u.kind==='shaman');
 Object.assign(w.units[0],{x:0,z:0});Object.assign(w.units[1],{x:30,z:30});w.shots.lightning=1;
 assert.ok(cast(w,'lightning',{x:10,z:0}));impact(w,'lightning');
 const f=w.effects.find(e=>e.kind==='lightning'),turn=w.turn;
 assert.equal(f.animation.object,0x650);assert.equal(f.lightning.turn,-1);assert.equal(f.lightning.segments.length,0);
 assert.notEqual(f.lightning.start.x,f.lightning.target.x);assert.equal(f.height*45,f.lightning.start.h);
 tick(w,1/12);assert.equal(f.animation.object,1361);assert.equal(f.animation.draw,41);assert.equal(f.lightning.turn,0);
 assert.equal(w.sounds.findLast(e=>e.cue===0xa2).turn,turn+1);
 const shapes=[];
 for(let i=1;i<=3;i++){tick(w,1/12);assert.equal(f.lightning.turn,i);assert.equal(f.lightning.segments.length,8);shapes.push(JSON.stringify(f.lightning.segments));}
 assert.equal(new Set(shapes).size,3);tick(w,1/12);assert.equal(f.lightning.segments.length,0);assert.ok(w.effects.includes(f));
 tick(w,4/12);assert.ok(!w.effects.includes(f),'one pending turn plus eight flash turns');
});

test('native spell allocation, discrete flight, RNG trails and delayed impact',()=>{
 const rngAfter=n=>{const state={randomState:1};for(let i=0;i<n;i++)random(state);return state.randomState;};
 const make=()=>{const w=createWorld();w.terrain.fill(3);w.terrainVersion++;w.buildings=[];w.randomState=1;w.units=w.units.filter(u=>u.kind==='shaman');Object.assign(w.units[0],{x:0,z:0});Object.assign(w.units[1],{x:30,z:30});return w;};
 assert.deepEqual(nativeStep3D({x:32760,y:-32760,h:32760},2047,511,-321),{x:32760,y:32455,h:32759},'negative odd length and short wrapping verified against x86');
 const w=make();cast(w,'blast',{x:10,z:0});assert.equal(w.shots.blast,3);assert.deepEqual(w.projectiles[0].target,{x:11,z:-1});tick(w,6/12);
 assert.equal(w.projectiles[0].phase,'flying');assert.equal(w.effects.some(e=>e.kind==='blast'),false);assert.equal(w.projectiles[0].visuals.length,5);
 tick(w,1/12);assert.deepEqual(w.projectiles[0].position,{x:3041,y:-1960,h:198});assert.equal(w.randomState,rngAfter(4),'two shamans initialize approach and rest (four speed draws); no first-turn Blast jitter');
 tick(w,1/12);assert.deepEqual(w.projectiles[0].position,{x:4034,y:-1872,h:165});assert.equal(w.randomState,rngAfter(4+8),'four trailing particles consume eight draws after the four idle initialization draws');
 const spark=w.effects.find(e=>e.sprite?.sequence==='blastTrail'),sparkHeight=spark.animation.h;
 assert.equal(spark.animation.remaining,0);assert.notEqual(w.cosmeticRandom.randomState,1);
 tick(w,1/12);assert.equal(w.projectiles[0].phase,'arrived');assert.equal(w.effects.some(e=>e.kind==='blast'),false);tick(w,1/12);assert.equal(w.projectiles.length,0);assert.equal(w.effects.find(e=>e.kind==='blast').age,0);assert.deepEqual(w.sounds.map(e=>e.turn),[0,6,10,10]);
 const flash=w.effects.find(e=>e.kind==='blast');assert.equal(flash.animation.object,1099);assert.equal(flash.duration,9/12);
 assert.equal(spark.animation.state,4);assert.equal(spark.animation.object,318);assert.equal(spark.animation.h,sparkHeight+20,'jitter sparks rise on both processing turns');
 tick(w,8/12);assert.ok(w.effects.includes(flash));w.paused=true;tick(w,1);assert.ok(w.effects.includes(flash));
 w.paused=false;tick(w,1/12);assert.ok(!w.effects.includes(flash),'native flash removed on its ninth active turn');
 const lightning=make();lightning.shots.lightning=1;cast(lightning,'lightning',{x:10,z:0});tick(lightning,6/12);assert.deepEqual(lightning.projectiles[0].destination,{x:3334,y:-1929,h:1159});tick(lightning,1/12);assert.equal(lightning.randomState,rngAfter(4+40));assert.deepEqual(lightning.projectiles[0].position,{x:2814,y:-1985,h:791});assert.equal(lightning.effects.filter(e=>e.sprite?.sequence==='spellTrail').length,20);
 const trails=lightning.effects.filter(e=>e.sprite?.sequence==='spellTrail');assert.equal(new Set(trails.map(e=>e.animation.f1)).size,4,'native class counter staggers initial poses');
 tick(lightning,4/12);assert.equal(trails[0].animation.state,4);assert.equal(trails[0].animation.object,326);assert.ok(lightning.effects.includes(trails[0]));
 tick(lightning,3/12);assert.ok(trails.every(e=>!lightning.effects.includes(e)),'four initial turns plus three second-phase turns');
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
 assert.deepEqual(w.ai.pendingCommands,[]);assert.ok(w.ai.flags&0x400);assert.ok(w.manaWorld.gameFlags&0x40);
 assert.ok(!w.ai.pendingCommands.some(c=>c.opcode===1112));assert.equal(w.inputMask,128);assert.ok(w.manaWorld.levelFlags&0x20000000);
 const gated=createWorld();gated.inputMask=132;gated.manaWorld.levelFlags=0x21000000;campaignCommand(gated,1112,[]);campaignCommand(gated,1113,[]);assert.equal(gated.inputMask,132);assert.equal(gated.manaWorld.levelFlags,0x21000000);
 const modes=createWorld();modes.ai.flags=0xa5;modes.manaWorld.gameFlags=0x1c1;campaignCommand(modes,1109,[]);campaignCommand(modes,1204,[1022]);assert.equal(modes.ai.flags,0x4a5);assert.equal(modes.manaWorld.gameFlags,0x181);campaignCommand(modes,1204,[1023]);assert.equal(modes.manaWorld.gameFlags,0x1c1);
 const shaman=w.units.find(u=>u.team==='red'&&u.kind==='shaman');shaman.hp=0;tick(w,1/12);advance(w,15);
 assert.ok(w.units.some(u=>u.team==='red'));assert.ok(!w.units.some(u=>u.team==='red'&&u.kind==='shaman'));assert.equal(w.redRespawn,0);
 const fresh=createWorld();fresh.ai.attributes[0]=99;assert.equal(createWorld().ai.attributes[0],12,'new games own independent script state');
});

test('mission-one AI applies its native population difficulty table on the original phase',async()=>{
 const {campaignInternal}=await import('../app/model.ts'),direct=createWorld(),raw={...originalScript,fields:[[0,47],[0,511],[0,48]]};
 direct.ai.flags=0xa5;campaignCommand(direct,1172,[1022]);assert.equal(direct.ai.flags,0x400a5);
 campaignCommand(direct,1172,[0]);assert.equal(direct.ai.flags,0x400a5,'other raw modes are native no-ops');
 campaignCommand(direct,1172,[1023]);assert.equal(direct.ai.flags,0xa5);
 campaignCommand(direct,1173,[0,1],raw);assert.equal(direct.ai.attributes[47],255);
 assert.throws(()=>campaignCommand(direct,1173,[2,1],raw),/Invalid computer attribute/);
 assert.deepEqual([campaignInternal(direct,1243),campaignInternal(direct,1244)],[19,17]);
 const run=count=>{const w=createWorld();w.units=[];addUnit(w,'blue','shaman',HOME);for(let i=0;i<count;i++)addUnit(w,'red','brave',ENEMY);w.ai.attributes.fill(0);w.ai.flags=0;w.turn=122;tick(w,1/12);assert.equal(w.ai.flags&0x40000,0);tick(w,1/12);return w;};
 const low=run(79),high=run(80),pick=w=>[7,11,12,13,14,15,16,17,19].map(i=>w.ai.attributes[i]);
 assert.deepEqual(pick(low),[70,80,66,152,140,100,128,8,48]);
 assert.deepEqual(pick(high),[35,40,33,204,70,50,64,4,24]);
 assert.equal(low.ai.flags&0x40000,0x40000);assert.equal(high.ai.flags&0x40000,0x40000);
});

test('campaign marker setup snapshots native entry state before live execution',()=>{
 const w=createWorld();
 assert.equal(w.ai.markerValue,0);assert.deepEqual(w.ai.markerEntries.slice(0,3),[
  {marker:0,secondary:-1,quotas:[0,1,0,0]},
  {marker:7,secondary:-1,quotas:[0,1,0,0]},
  {marker:1,secondary:-1,quotas:[1,0,0,0]},
 ]);assert.deepEqual(w.ai.pendingCommands,[]);
 const raw={...originalScript,fields:[[1,3],[0,0],[0,257],[0,511],[0,-3],[0,101],[0,44],[0,100]]};w.ai.variables[3]=77;
 campaignCommand(w,1081,[0],raw);campaignCommand(w,1091,[1,2,3,4,5,6,7],raw);
 assert.equal(w.ai.markerValue,3,'1081 stores the raw field payload');assert.deepEqual(w.ai.markerEntries[0],{marker:1,secondary:-1,quotas:[0,100,44,100]});
 const task=w.ai.tasks[0];assert.equal(w.ai.flags&0x800,0);assert.deepEqual({flags:task.flags,type:task.type,phase:task.phase,target:task.target,mode:task.mode,extra:task.extra,route:task.route},{flags:1,type:24,phase:0,target:-1,mode:0,extra:1,route:[{marker:1,secondary:-1,quotas:[1,0,0,0]},{marker:-1,secondary:0,quotas:[0,0,0,0]},{marker:-1,secondary:0,quotas:[0,0,0,0]},{marker:-1,secondary:0,quotas:[0,0,0,0]}]});
 const full=createWorld();full.ai.tasks.forEach(t=>t.flags=1);campaignCommand(full,1117,[]);campaignCommand(full,1092,[24,49,49,49]);assert.equal(full.ai.flags&0x800,0,'1092 consumes the one-shot flag when allocation fails');
});

test('mission marker task sends one reserved brave to marker one',async()=>{
 const {currentPersonOrder,writePersonOrder}=await import('../app/person-orders.ts'),{createLivePerson}=await import('../app/live-people.ts'),{computerMarkerOrderCount}=await import('../app/model.ts');
 const counted=createWorld(),routeUnit=counted.units.find(u=>u.team==='red'&&u.kind==='warrior'),route=createLivePerson(counted,routeUnit),routeOrder=counted.buildingOrders.records[799];
 routeUnit.native=route;route.commands[0]=799;route.commandStatus=11;routeOrder.references=1;writePersonOrder(routeOrder,11,0,level.markers[1],0);assert.equal(computerMarkerOrderCount(counted,1,1,-1),1);
 const w=createWorld(),task=w.ai.tasks[0];
 until(w,()=>w.units.some(u=>u.team==='red'&&u.native?.computerAssignment===99&&currentPersonOrder(w.buildingOrders,u.native)?.model===3),2);
 const assigned=w.units.filter(u=>u.team==='red'&&u.native?.computerAssignment===99),order=currentPersonOrder(w.buildingOrders,assigned[0].native);
 assert.equal(assigned.length,1);assert.equal(assigned[0].kind,'brave');assert.deepEqual({model:order.model,a:order.a,b:order.b},{model:3,a:0xfe80,b:0xfa80});assert.equal(w.ai.commandDelay,20);
 until(w,()=>!(task.flags&1),1);assert.equal(w.ai.selectionOwner,10);assert.equal(w.ai.flags&2,0);
});

test('mission-one ordinary marker guard patrols and answers nearby enemies',async()=>{
 const {currentPersonOrder}=await import('../app/person-orders.ts');
 const w=createWorld();until(w,()=>!w.ai.tasks.some(t=>t.flags&1&&t.type===24),2);
 for(const u of w.units)if(u.kind!=='shaman')u.hp=0;
 tick(w,1/12);const chosen=addUnit(w,'red','warrior',{x:10,z:-37});
 w.turn=39;tick(w,1/12);
 const task=w.ai.tasks.find(t=>t.flags&1&&t.type===24);
 assert.deepEqual(task&&{extra:task.extra,route:task.route[0]},{extra:0,route:{marker:0,secondary:-1,quotas:[0,1,0,0]}});
 until(w,()=>task.phase===6,1);
 const p=chosen.native,orders=()=>p.commands.filter(Boolean).map(id=>w.buildingOrders.records[id]);
 assert.deepEqual(orders().map(o=>[o.model,o.a,o.b]),[[3,2176,4736],[11,level.markers[0],0x606]]);
 until(w,()=>currentPersonOrder(w.buildingOrders,p)?.model===11&&p.commandAux===1,10);
 const marker=nativeCellPoint(level.markers[0]),building=addBuilding(w,'blue','hut',{x:marker.x+4,z:marker.z+4},true);
 const outside=addUnit(w,'blue','warrior',{x:marker.x+8,z:marker.z});p.counter=1;tick(w,1/12);
 assert.deepEqual([p.commandAux,p.substate,p.workTarget],[1,0,0],'buildings and the outer cell do not wake the guard');
 const target=addUnit(w,'blue','warrior',{x:marker.x+6,z:marker.z});
 p.counter=0;tick(w,1/12);assert.equal(p.commandAux,1,'the sensor skips its alternate visit');
 p.counter=1;tick(w,1/12);
 assert.deepEqual([p.commandAux,p.workTarget],[0,target.id]);
 building.hp=outside.hp=target.hp=0;const victim=addUnit(w,'blue','warrior',{x:marker.x+2,z:marker.z});
 until(w,()=>p.state===25,10);assert.equal(currentPersonOrder(w.buildingOrders,p)?.model,11,'combat retains the persistent guard order');
 victim.hp=0;until(w,()=>chosen.native===p&&p.commandAux===1,10);
 const guardId=p.commands.find(id=>id&&w.buildingOrders.records[id].model===11);chosen.hp=0;tick(w,1/12);
 assert.equal(w.buildingOrders.records[guardId].references,0,'death releases the guard command');
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
 assert.equal(findPath(w,{...w.units.find(u=>u.team==='blue'&&u.kind==='brave'),...HOME},ENEMY).length,0,'native rule does not require a walkable route');assert.equal(w.shrines.length,2);
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
 standAtHead(fresh,brave,head);
 const finish=(head)=>{Object.assign(head,{work:head.target*head.required**2-1,enabled:true,reset:false,cooldown:0});tick(fresh,1/3);};
 for(let remaining=3;remaining>=0;remaining--){finish(head);campaignCommand(fresh,1131,[0,1,2],headQuery);assert.equal(fresh.ai.variables[0],remaining);}
 assert.equal(head.active,false);assert.equal(fresh.shots.lightning,0,'head depletion precedes reward delivery');until(fresh,()=>fresh.shots.lightning===4,8);
 campaignCommand(fresh,1077,[0,1,2],{fields:[[0,0],[2,1186],[1,0]]});assert.equal(fresh.ai.variables[0],4);
 removeHead(fresh,18,246);campaignCommand(fresh,1131,[0,1,2],headQuery);assert.equal(fresh.ai.variables[0],0,'absent heads return zero');
 const bridge=fresh.shrines.find(s=>s.kind==='bridge');standAtHead(fresh,brave,bridge);
 finish(bridge);assert.equal(bridge.remaining,0);assert.equal(bridge.active,true,'zero initial trigger count means unlimited');
 bridge.remaining=-1;finish(bridge);assert.equal(bridge.remaining,-1);assert.equal(bridge.active,false,'negative trigger counts fire once and retain their value');
 assert.throws(()=>campaignCommand(fresh,1077,[1119,1,2],program),/Unbound one-off spell stock/,'unported AI stock is not silently reported as zero');
 assert.throws(()=>campaignCommand(fresh,1076,[1118,1,2],{fields:[[0,0],[0,2],[1,64]]}),/Invalid campaign query destination/);
 assert.throws(()=>campaignCommand(fresh,1059,[]),/Invalid campaign command arguments 1059/);
});

test('worship decays without followers and continues at full spell stock', () => {
 const w = createWorld(), head = w.shrines.find(s => s.kind === 'bridge');
 const brave = w.units.find(u => u.team === 'blue' && u.kind === 'brave');
 standAtHead(w,brave,head);head.work=0;head.reset=true;
 w.shots.bridge = 4;
 advance(w, 4);
 assert.equal(head.work, 12, 'full stock does not pause worship');
 command(w,{x:head.x+6,z:head.z+3});
 advance(w, 2);
 assert.equal(head.work, 6, 'leaving the head loses accumulated work');
 command(w,head);
 until(w, () => head.uses === 1, 15);
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
 assert.equal(w.manaWorld.levelFlags&0x20000000,0);
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

test('mission-one Dakini launches its native mixed attack route when Blue enters marker three',async()=>{
 const {joinBattle}=await import('../app/model.ts');
 const {currentPersonOrder}=await import('../app/person-orders.ts');
 const {requestAttack}=await import('../app/computer.ts');
 const w=createWorld();until(w,()=>!w.ai.tasks.some(t=>t.flags&1&&t.type===24),2);
 const marker=nativeCellPoint(level.markers[3]),staging=(level.markers[3]&0xff00)|((level.markers[3]+12)&255);
 addUnit(w,'blue','warrior',{x:marker.x,z:marker.z+12});
 const redStart=nativeCellPoint(staging);addUnit(w,'red','warrior',redStart);
 for(const unit of w.units.filter(u=>u.team==='red'&&u.kind!=='shaman'))Object.assign(unit,redStart);
 w.ai.defencePosition=staging;w.ai.variables[50]=1;w.ai.variables[2]=0;w.turn=201;tick(w,1/12);
 const task=w.ai.tasks.find(t=>t.flags&1&&t.type===20);
 assert.deepEqual(task&&{phase:task.phase,target:task.target,requested:task.requested,damage:task.extra,marker:task.mode,quotas:task.quotas},{phase:3,target:level.markers[3],requested:3,damage:999,marker:3,quotas:w.ai.attributes.slice(11,17)});
 assert.equal(w.ai.variables[8],1);assert.equal(w.ai.variables[2],1);
 until(w,()=>task.members.length===3,2);
 assert.deepEqual(task.members.map(id=>w.units.find(u=>u.id===id).kind).sort(),['brave','warrior','warrior']);
 const phases=[];let radiusDistance=0;until(w,()=>{if(phases.at(-1)!==task.phase)phases.push(task.phase);if(task.phase!==11)return false;radiusDistance=Math.min(...task.members.map(id=>{const u=w.units.find(unit=>unit.id===id);return Math.hypot(u.x-marker.x,u.z-marker.z);}));return true;},20);
 const attacker=w.units.find(u=>u.id===task.members[0]),owner=attacker.native,target=addUnit(w,'blue','warrior',attacker);target.hp=10;joinBattle(w,attacker,target);
 assert.equal(attacker.native,null);assert.equal(attacker.fight.motion,owner);
 until(w,()=>{if(attacker.fight){assert.equal(task.phase,11);assert.equal(attacker.fight.motion,owner);return false;}return target.hp===0;},20);
 assert.equal(attacker.native,owner,'combat restores the one retained person/order owner');
 until(w,()=>{if(phases.at(-1)!==task.phase)phases.push(task.phase);return task.phase===14;},20);
 assert.ok(radiusDistance>1.5,'native radius advances before exact marker arrival');assert.deepEqual(phases.slice(-5),[10,11,12,6,14]);
 assert.equal(w.ai.selectionOwner,10);assert.equal(w.ai.flags&2,0);
 const members=[...task.members],victim=addUnit(w,'blue','warrior',marker),hp=victim.hp;
 until(w,()=>members.every(id=>currentPersonOrder(w.buildingOrders,w.units.find(u=>u.id===id).native)?.model===19),20);
 const attackIds=members.map(id=>w.units.find(u=>u.id===id).native.commands.find(Boolean));
 assert.equal(new Set(attackIds).size,1,'the attack area order is shared by the whole group');
 assert.equal(w.buildingOrders.records[attackIds[0]].references,3);
 until(w,()=>victim.hp<hp,30);assert.equal(task.damage,0,'ordinary wounds do not credit the native task threshold');
 until(w,()=>victim.hp===0,30);assert.equal(task.damage,2,'a warrior death credits its native model score once');
 task.damage=task.extra;
 until(w,()=>!(task.flags&1),60);
 assert.ok(members.every(id=>currentPersonOrder(w.buildingOrders,w.units.find(u=>u.id===id).native)?.model!==19));
 requestAttack(w.ai,task.origin,3,1,999,w.ai.attributes.slice(11,17),true,1);
 assert.equal(task.flags&1,1,'phase 23 releases the same queue slot for the next wave');
});

test('mission-one Dakini launches its later building attack when Blue overwhelms it',async()=>{
 const {currentPersonOrder}=await import('../app/person-orders.ts');
 const script={fields:[[2,1],[2,1223],[0,999],[2,1224],[0,0],[0,-1]]},args=[1118,0,1071,1,2,3,3,3,1078,4,5,5,4];
 const packed=p=>((p.x>>>8)&254)|(p.y&0xfe00);
 const direct=createWorld(),blueBuildings=direct.buildings.filter(b=>b.team==='blue');direct.randomState=2;
 campaignCommand(direct,1059,args,script);
 let task=direct.ai.tasks.find(t=>t.flags&1&&t.type===20);
 assert.equal(task.target,packed(buildingPosition(buildingPose(blueBuildings[1]))));
 assert.equal(direct.randomState,1896349699,'building selection consumes one native draw');
 const fallback=createWorld();fallback.buildings=[];fallback.randomState=2;
 const bluePeople=fallback.units.filter(u=>u.team==='blue'&&u.hp>0),person=bluePeople[1896349699%bluePeople.length];
 campaignCommand(fallback,1059,args,script);task=fallback.ai.tasks.find(t=>t.flags&1&&t.type===20);
 assert.equal(task.target,packed(nativePosition(fallback,person)),'an empty building list falls back to allocation-ordered people');
 assert.equal(fallback.randomState,1896349699,'person-only fallback consumes one native draw');

 const w=createWorld();until(w,()=>!w.ai.tasks.some(t=>t.flags&1&&t.type===24),2);w.units=[];
 const target=w.buildings.filter(b=>b.team==='blue')[1],near={x:target.x+4,z:target.z};
 addUnit(w,'red','shaman',near);for(let i=0;i<3;i++)addUnit(w,'red','brave',near);
 addUnit(w,'blue','shaman',ENEMY);for(let i=0;i<8;i++)addUnit(w,'blue','brave',ENEMY);
 w.randomState=2;w.ai.variables[50]=1;w.turn=81;tick(w,1/12);
 task=w.ai.tasks.find(t=>t.flags&1&&t.type===20);
 assert.deepEqual([11,12,13,16,17,19].map(i=>w.ai.attributes[i]),[100,100,0,0,0,1]);
 assert.deepEqual(task&&{phase:task.phase,target:task.target,requested:task.requested,marker:task.mode,quotas:task.quotas},{phase:3,target:packed(buildingPosition(buildingPose(target))),requested:4,marker:0,quotas:w.ai.attributes.slice(11,17)});
 assert.equal(w.ai.variables[3],1,'the original one-shot attack latch closes');
 until(w,()=>task.members.length===3,2);
 until(w,()=>task.members.every(id=>currentPersonOrder(w.buildingOrders,w.units.find(u=>u.id===id).native)?.model===19),30);
 task.flags=0;task.members=[];w.turn=337;tick(w,1/12);
 assert.ok(!w.ai.tasks.some(t=>t.flags&1&&t.type===20),'the latched script does not launch another attack');
});

test('computer attack exhausts 33 empty native scans before regrouping and retiring',async()=>{
 const {createComputerQueue,requestAttack,stepAttackTask}=await import('../app/computer.ts');
 const ai=createComputerQueue();requestAttack(ai,0xfa06,3,1,999,[100,0,0,0,0,0],true,1);
 const task=ai.tasks[0];task.phase=16;task.members=[7];let draws=0,alive=1;
 const input={staging:0xf204,select:()=>[],settled:()=>true,memberWithin:()=>null,ready:()=>true,
  activeMembers:()=>alive,targetsRemain:()=>false,random:()=>++draws};
 for(let retry=1;retry<=32;retry++){
  assert.deepEqual(stepAttackTask(ai,0,input),[]);assert.equal(task.phase,16);assert.equal(task.retries,retry);
 }
 assert.deepEqual(stepAttackTask(ai,0,input),[{kind:'move',target:0xf204,replace:true}]);
 assert.equal(task.phase,6);assert.equal(task.fallback,23);assert.equal(draws,66);
 task.phase=16;alive=0;stepAttackTask(ai,0,input);assert.equal(task.phase,23);
 stepAttackTask(ai,0,input);assert.equal(task.flags&1,0);
});

test('computer attack pool exhaustion skips hostile dispatch and retires through native empty scans',async()=>{
 const {requestAttack}=await import('../app/computer.ts');
 const {currentPersonOrder}=await import('../app/person-orders.ts');
 const w=createWorld(),members=w.units.filter(u=>u.team==='red'&&u.kind!=='shaman').slice(0,3);
 requestAttack(w.ai,level.markers[3],3,3,999,[100,0,0,0,0,0],true,1);
 const task=w.ai.tasks.find(t=>t.type===20);task.phase=15;task.members=members.map(u=>u.id);w.ai.cursor=w.ai.tasks.indexOf(task);
 for(let id=1;id<w.buildingOrders.records.length;id++)w.buildingOrders.records[id].references=1;
 w.buildingOrders.active=799;tick(w,1/12);
 assert.equal(task.phase,16);assert.ok(members.every(u=>currentPersonOrder(w.buildingOrders,u.native)?.model!==19));
 until(w,()=>!(task.flags&1),10);assert.equal(task.retries,33);
 requestAttack(w.ai,task.origin,3,1,999,w.ai.attributes.slice(11,17),true,1);
 assert.ok(w.ai.tasks.some(t=>t.flags&1&&t.type===20),'the exhausted command pool does not leak a task slot');
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

test('mission-one red AI queues exact task 6 below one warrior and executes live training', () => {
 const w=createWorld();until(w,()=>!w.ai.tasks.some(t=>t.flags&1&&t.type===24),2);
 const selected=[...w.selected];
 const camp=w.buildings.find(b=>b.team==='red'&&b.kind==='camp'&&b.progress===1);
 const warriors=w.units.filter(u=>u.team==='red'&&u.kind==='warrior'&&u.hp>0);
 assert.ok(camp);assert.equal(warriors.length,2);
 warriors[0].hp=0;w.turn=127;tick(w,1/12);
 assert.equal(w.ai.tasks.some(t=>t.flags&1&&t.type===6),false,'one warrior satisfies the original threshold');
 warriors[1].hp=0;w.turn=255;tick(w,1/12);
 const task=w.ai.tasks.find(t=>t.flags&1&&t.type===6);
 assert.deepEqual(task&&{flags:task.flags,type:task.type,phase:task.phase,target:task.target,requested:task.requested,
  extra:task.extra,selected:task.selected,remaining:task.remaining},
 {flags:1,type:6,phase:3,target:camp.id,requested:1,extra:0,selected:0,remaining:1});
 assert.deepEqual(w.selected,selected);
 const taskIndex=w.ai.tasks.indexOf(task);tick(w,1/12);tick(w,1/12);
 const brave=w.units.find(u=>u.id===w.ai.trainingSelections[taskIndex][0]);
 assert.equal(task.phase,5);assert.equal(w.ai.selectionOwner,taskIndex);assert.equal(brave.native.state,14);
 assert.equal(brave.native.selectionFlags&128,128);tick(w,1/12);
 assert.equal(task.phase,6);assert.equal(brave.native.state,14,'generic resting cannot consume an AI reservation');
 tick(w,1/12);
 const p=unitAnimationSource(brave),id=p&&(p.immediateCommand||p.commands[p.commandCursor]);
 const order=id?w.buildingOrders.records[id]:undefined;
 assert.equal(order?.model,8);assert.equal(brave.native,null);assert.equal(p.selectionFlags&128,0);
 assert.equal(order.a,camp.id);assert.equal(order.references,1);assert.deepEqual(w.selected,selected);
 until(w,()=>brave.inside===camp.id,60);
 const trained=w.stats.trained;camp.timer=65535;
 until(w,()=>w.units.filter(u=>u.team==='red'&&u.kind==='warrior'&&u.hp>0).length===1,10);
 const warrior=w.units.find(u=>u.team==='red'&&u.kind==='warrior'&&u.hp>0);
 assert.notEqual(warrior.id,brave.id);assert.equal(w.units.some(u=>u.id===brave.id),false);
 assert.equal(w.stats.trained,trained,'enemy training does not change player stats');assert.deepEqual(w.selected,selected);

 const blocked=createWorld();until(blocked,()=>!blocked.ai.tasks.some(t=>t.flags&1&&t.type===24),2);
 const blockedCamp=blocked.buildings.find(b=>b.team==='red'&&b.kind==='camp');
 const guard=blocked.units.find(u=>u.native?.computerAssignment===99);guard.hp=0;tick(blocked,1/12);
 blocked.units.filter(u=>u.team==='red'&&u.kind==='warrior').forEach(u=>{u.hp=0;});
 blocked.buildingOrders.records.forEach(order=>{order.references=1;});blocked.turn=255;tick(blocked,1/12);
 const blockedTask=blocked.ai.tasks.find(t=>t.flags&1&&t.type===6),blockedIndex=blocked.ai.tasks.indexOf(blockedTask);
 until(blocked,()=>blocked.ai.trainingSelections[blockedIndex].length>0,1);const blockedBrave=blocked.units.find(u=>u.id===blocked.ai.trainingSelections[blockedIndex][0]);
 until(blocked,()=>!(blockedTask.flags&1),1);
 assert.equal(blockedTask.flags&1,0);assert.notEqual(blockedBrave.native.state,14);
 assert.equal(blockedBrave.native.selectionFlags&128,0);assert.equal(blockedBrave.work,null);
 assert.equal(blocked.units.some(u=>u.work===blockedCamp.id),false,'pool exhaustion cannot pretend training was issued');
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

test('game store checkpoints restore an isolated exact world snapshot', async () => {
 const {createGameStore}=await import('../app/game-store.ts');
 const store=createGameStore(),saved=store.getWorld(),turn=saved.turn,height=saved.land.heights[0],hp=saved.units[0].hp;
 assert.equal(store.hasCheckpoint(),false);assert.equal(await store.restoreCheckpoint(),false);
 assert.equal(await store.saveCheckpoint(),false);assert.equal(store.hasCheckpoint(),true);
 store.change(w=>{w.turn=99;w.land.heights[0]=height+1;w.units[0].hp=1;});
 assert.equal(store.loadCheckpoint(),true);const restored=store.getWorld();
 assert.notEqual(restored,saved);assert.equal(restored.turn,turn);assert.equal(restored.land.heights[0],height);
 assert.equal(restored.units[0].hp,hp);assert.notEqual(restored.units[0],saved.units[0]);
 restored.units[0].hp=2;store.loadCheckpoint();assert.equal(store.getWorld().units[0].hp,hp);
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
 const person=(id,model,phase,next)=>({id,class:1,model,state:10,substate:3,counter:0,physics:2,
  flags2:0,flags3:32,flags4:0,assignment:8,commands:[1,0,0,0,0,0,0,0],commandCursor:0,
  immediateCommand:0,workTarget:100,target:100,reservationNext:next,commandPhase:phase,commandAux:0,
  x:256,y:64384,goalX:256,goalY:64384,speed:0,cargo:0,timer:256,angle:0,turnAngle:0,heading:0});
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
  assert.deepEqual(findPath(w,brave,hut).at(-1),entrance(w,hut),'native planning redirects the building center to its outside point');
  command(w,hut);
  assert.ok(brave.path.length,'the original route must reach the exact original entrance');
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
  h:100,displacement:{x:1,y:2,h:3},clip:0,
  anchorX:0,anchorY:0,anchorFlags:3,angle:0,turnAngle:0,heading:0});
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
 assert.equal(brave.anchorFlags,0);assert.equal(b.entryDelay,12);
 assert.deepEqual([brave.x,brave.y],[1000,2000],'exit restores the person without teleporting');
 assert.equal(brave.anchorX&511,256);assert.equal(brave.anchorY&511,256);
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
 assert.equal(brave.renderFlags&16,0);assert.equal(brave.flags2&0x804000,0);assert.equal(brave.h,321);
 assert.deepEqual(brave.displacement,{x:0,y:0,h:0});
 assert.ok(events.some(e=>e[0]==='insert'));
});

test('training replaces a whole batch, inherits the first occupant order tail and rolls back partial allocation', async () => {
 const {stepTrainingConversion}=await import('../app/training-conversion.ts');
 const {emptyPersonOrder,hasFollowingPersonOrder}=await import('../app/person-orders.ts');
 for (const failAfter of [1,16]) {
  const person=(id,model)=>({id,class:1,model,tribe:0,state:10,substate:13,x:0,y:0,
   flags2:0x800000,flags3:0,flags4:0,assignment:4,selectionFlags:0,renderFlags:0,
   commands:[1,0,0,0,0,0,0,0],commandCursor:0,immediateCommand:0,commandStatus:8,
   workTarget:100,orderLocation:0,h:0,displacement:{x:0,y:0,h:0},clip:0,
   anchorX:0,anchorY:0,anchorFlags:0,angle:0,turnAngle:0,heading:0,reservationNext:0});
  const warrior=person(1,3),braves=[person(2,2),person(3,2)];warrior.commands=[1,2,0,3,0,0,0,0];
  const records=Array.from({length:800},emptyPersonOrder);
  Object.assign(records[1],{model:8,references:3,a:100});
  Object.assign(records[2],{model:3,references:1,a:1000,b:2000});
  Object.assign(records[3],{model:3,references:1,flags:1,a:3000,b:4000});
  const b={id:100,class:2,model:7,tribe:0,flags2:0,flags3:0,activity:8|128,inside:3,
   occupants:[1,2,3,0,0,0],trainingTimer:0,trainingCost:0,storedMana:65535,counter:0,queueHead:0,
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
 Object.assign(shaman,{x:0,z:0});w.inputMask=0;w.terrain.fill(1);w.terrainVersion++;
 assert.ok(spellRange(w,shaman,2)<11);
 assert.equal(cast(w,'blast',{x:11,z:0}),false,'low ground cannot reach the old fixed-radius edge');
 assert.equal(w.shots.blast,4);w.terrain.fill(8);w.terrainVersion++;
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
 w.units=w.units.filter(u=>u.kind==='shaman');w.terrain.fill(3);w.terrainVersion++;Object.assign(shaman,{x:0,z:0});
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
 w.terrain.fill(3);w.terrainVersion++;w.inputMask=0;w.ai.variables[57]=1;
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
 w.terrain.fill(3);w.terrainVersion++;w.inputMask=0;w.ai.variables[57]=1;w.units=[shaman,...blue,red,...allies];
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
 assert.ok(defeated.buildings.filter(b=>b.team==='blue').every(b=>b.damageState===null));
 const ruins=defeated.buildings.filter(b=>b.team==='red');assert.ok(ruins.length);
 assert.ok(ruins.every(b=>b.damageState.buildingFlags&64));
 // Isolate the live object adapter from outcome processing; the separate result
 // regression exercises continuous destruction after a real victory or defeat.
 const w=createWorld(),b=w.buildings.find(b=>b.team==='red'&&b.kind==='hut');
 w.manaWorld.gameFlags=32;w.terrain.fill(3);w.terrainVersion++;w.buildings=[b];w.units=[];
 const occupant=addUnit(w,'red','brave',b);occupant.inside=b.id;occupant.work=b.id;
 const model=buildingModel(b),threshold=rules.buildingDamageThreshold[model];
 b.damageState={model,state:2,flags2:0,flags3:0,buildingFlags:64,counter:0,damage:threshold,
  stage:4,attacker:255,occupants:1,plan:{remaining:rules.buildingLife[model],repairDelay:0,attacker:255}};
 tick(w,1/12);
 assert.equal(b.damageState.plan.remaining,rules.buildingLife[model]-100);assert.equal(b.damageState.stage,2);
 assert.equal(occupant.inside,null);assert.equal(occupant.work,null);assert.equal(occupant.hp,maxHp('brave'));
 assert.equal(b.damageState.plan.repairDelay,rules.buildingRepairDelay);
 assert.ok(w.effects.some(f=>f.kind==='buildingSmoke'&&f.smoke.lifetime>=rules.buildingSmokeDuration));
 assert.ok(w.sounds.some(s=>s.cue===0x34));
 for(let i=0;i<200&&w.buildings.includes(b);i++)tick(w,1/12);
 assert.equal(b.damageState.stage,0);assert.equal(b.hp,0);assert.ok(!w.buildings.includes(b));
});

test('building display stages follow remaining work and retain separate complete meshes', async () => {
 const {buildingStage,buildingObject}=await import('../app/model.ts');
 const {modelStage,modelFaceVisible}=await import('../app/model-faces.ts');
 const hidden=nativeModels[109];
 assert.equal(hidden.modes[73],0);assert.equal(hidden.faces[147],63);
 assert.equal(modelFaceVisible(hidden,73,0),true,'construction cap draws a normally hidden face');
 assert.equal(modelFaceVisible(hidden,73,2),false,'uncapped picking face stays hidden');
 assert.equal(modelFaceVisible(hidden,73,4),false);
 const w=createWorld(),b=w.buildings.find(b=>b.kind==='hut'),source=nativeModels[buildingObject(b)],before=structuredClone(source);
 const stages=[0,.25,.5,.75,1].map(progress=>{b.progress=progress;return buildingStage(b);});
 assert.deepEqual(stages,[0,1,2,3,4]);
 for(let stage=0;stage<4;stage++){
  const mesh=modelStage(source,stage);assert.ok(mesh.p.length);assert.equal(mesh.p.length/3,mesh.uv.length/2);
  assert.notDeepEqual(mesh.uv,source.uv,'unfinished surfaces retain their native cap material');
 }
 assert.equal(modelStage(source,4).p.length, source.faces.reduce((n,count,i)=>i%2 || !source.modes[i/2]?n:n+(count===3?9:18),0));assert.deepEqual(source,before,'one damaged copy cannot mutate completed buildings');
 b.progress=1;b.damageState={stage:2};assert.equal(buildingStage(b),2,'damage takes priority over completed construction');
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
 const {animateLiveObjects}=await import('../app/live-people.ts');
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
 assert.deepEqual([worker.x,worker.z],[hut.x,hut.z],'occupant is revealed in place before celebration motion');
 assert.equal(worker.native.flags2&0x804010,0,'celebration clears occupancy and the default-state request');
 const shaman=w.units.find(u=>u.kind==='shaman');assert.equal(shaman.native.substate,8);
 const records=w.units.map(u=>u.native),braves=w.units.filter(u=>u.kind!=='shaman');
 for(const [i,u] of braves.entries()){
  Object.assign(u,{x:7,z:33});Object.assign(u.native,{anchorX:3840,anchorY:55040,substate:i?4:3,flags2:0x40020000,link:0,target:0,speed:0});
 }
 const phases=new Set();
 for(let i=0;i<96;i++){tick(w,1/12);animateLiveObjects(w);animateLiveObjects(w);for(const u of w.units)phases.add(u.native.substate);}
 assert.ok(phases.has(5)&&phases.has(6),'circle members enter native chain states');
 assert.ok(w.units.every((u,i)=>u.native===records[i]),'controllers retain the same person records');
 assert.ok(w.units.every(u=>u.work===null&&u.inside===null),'legacy auto-housing cannot take over celebrations');
 assert.ok(w.trees.filter(t=>t.model===11).every(t=>t.logs===1),'loose logs do not regrow');
 const p=worker.native;setAnimationObject(p,14,40);p.f1=p.f2=0;
 animateLiveObjects(w);assert.equal(p.f2,1,'animation mutates the owned record');
 w.paused=true;animateLiveObjects(w);assert.equal(p.f2,1);
 w.paused=false;p.renderFlags|=2;animateLiveObjects(w);assert.equal(p.f2,1,'native frozen pose survives presentation updates');
});

test('live blocked followers retain native detour steering and recovery timers', async () => {
 const {createLivePerson,stepLivePerson}=await import('../app/live-people.ts');
 const {syncLandscapeObjects,browserPosition}=await import('../app/model.ts');
 const w=createWorld(),u=w.units.find(u=>u.kind==='brave'&&u.team==='blue'),b=w.buildings.find(b=>b.team==='blue');
 w.units=[u];w.buildings=[b];w.terrain.fill(100/45);w.land.heights.fill(100);
 Object.assign(b,{x:9.4,z:33,progress:1});syncLandscapeObjects(w);
 const edge=w.land.buildingIds.findIndex((id,i)=>(id&1023)===b.id&&(i&127)>0&&!(w.land.flags[i-1]&0x200));assert.ok(edge>=0);
 const start=browserPosition({x:((edge&127)*512-12)&65535,y:((edge>>7)*512+256)&65535});
 Object.assign(u,{...start,inside:null,work:null});
 u.native=createLivePerson(w,u);const p=u.native;
 Object.assign(p,{state:41,substate:1,flags2:128,counter:0,heading:512,angle:512,turnAngle:512,speed:20,assignment:0,animationMode:0,commandPhase:100,timer:100});
 const before={x:u.x,z:u.z};stepLivePerson(w,u);
 assert.ok(p.flags2&0x800,'collision starts native steering recovery');
 assert.equal(p.motionMode,1);assert.equal(p.recoveryCounter,1);
 assert.notEqual(p.heading,512);assert.ok(p.motionTimer>0);
 assert.notDeepEqual({x:u.x,z:u.z},before,'a free probe advances the live follower');
 assert.equal(w.land.flags[(p.y>>9)*128+(p.x>>9)]&0x200,0,'the chosen probe stays outside the original footprint');
 const timer=p.motionTimer,heading=p.heading;w.buildings=[];syncLandscapeObjects(w);stepLivePerson(w,u);
 assert.equal(p.motionTimer,timer-1,'the next grounded step consumes the recovery timer');
 assert.equal(p.heading,heading,'normal facing cannot overwrite active recovery steering');
});

test('live celebrants obey native walk masks and survive the legacy ground-height cutoff', async () => {
 const {createLivePerson}=await import('../app/live-people.ts');
 const {default:rules}=await import('../app/original-rules.json',{with:{type:'json'}});
 const w=createWorld(),u=w.units.find(u=>u.team==='blue'&&u.kind==='brave');
 w.units=[u];w.buildings=[];w.turn=33;w.landVersion=w.terrainVersion;
 w.terrain.fill(.1);w.land.heights.fill(100);w.land.flags.fill(0);
 w.land.categories.fill(rules.terrainCategoryFlags.findIndex(f=>f&1));
 Object.assign(u,{x:7,z:33,inside:null,work:null});u.native=createLivePerson(w,u);
 Object.assign(u.native,{state:41,substate:1,flags2:128,counter:0,heading:512,angle:512,turnAngle:512,speed:20,assignment:0,animationMode:0,commandPhase:100,timer:100});
 w.land.walkMasks[0].fill(0);tick(w,1/12);
 assert.ok(w.units.includes(u)&&u.hp>0,'native support replaces the legacy height death guard');
 assert.deepEqual({x:u.x,z:u.z},{x:7,z:33},'blocked native mask rejects every detour');
 w.land.walkMasks[0].fill(255);tick(w,1/12);
 assert.notDeepEqual({x:u.x,z:u.z},{x:7,z:33},'native mask update allows the next grounded step');
});


test('live completed-building footprints relocate and clear on removal', async () => {
 const {syncLandscapeObjects}=await import('../app/model.ts');
 const w=createWorld(),b=w.buildings.find(b=>b.team==='blue');w.buildings=[b];syncLandscapeObjects(w);
 const occupied=()=>Array.from(w.land.buildingIds).flatMap((id,i)=>(id&1023)===b.id?[i]:[]);
 const old=occupied();assert.ok(old.length>0);assert.ok(old.every(i=>w.land.flags[i]&0x200));
 b.x+=16;b.anchor.x=(b.anchor.x+4096)&65535;b.angle=Math.PI/2;syncLandscapeObjects(w);
 const moved=occupied();assert.ok(moved.length>0);assert.ok(moved.every(i=>!old.includes(i)));
 assert.ok(old.every(i=>!(w.land.flags[i]&0x200)),'old footprint cannot remain as invisible collision');
 b.hp=0;syncLandscapeObjects(w);assert.deepEqual(occupied(),[]);
 assert.ok(moved.every(i=>!(w.land.flags[i]&0x200)),'removed buildings release their cells');
});

test('live native cell order follows arrivals and removes dead records', async () => {
 const {createLivePerson,syncLivePersonCells}=await import('../app/live-people.ts');
 const {objectsInCell}=await import('../app/object-cells.ts');
 const w=createWorld();w.units=w.units.filter(u=>u.team==='blue'&&u.kind==='brave').slice(0,3);
 for(const u of w.units){Object.assign(u,{x:7,z:33});u.native=createLivePerson(w,u);}
 syncLivePersonCells(w);
 const [first,second,third]=w.units,cell=((first.native.x>>>8)&254)|(first.native.y&0xfe00);
 const occupants=()=>[...objectsInCell(w.objectCells,cell)].map(p=>p.id);
 assert.deepEqual(occupants(),[third.id,second.id,first.id]);
 first.x+=4;syncLivePersonCells(w);assert.deepEqual(occupants(),[third.id,second.id]);
 first.x-=4;syncLivePersonCells(w);assert.deepEqual(occupants(),[first.id,third.id,second.id]);
 first.x+=.01;syncLivePersonCells(w);assert.deepEqual(occupants(),[first.id,third.id,second.id],'same-cell motion retains neighbor order');
 first.hp=0;syncLivePersonCells(w);assert.deepEqual(occupants(),[third.id,second.id]);
 assert.equal(third.native.cellPrevious,0);assert.equal(w.objectCells.objects.has(first.id),false);
 w.units=[];syncLivePersonCells(w);assert.equal(w.objectCells.objects.size,0);assert.ok(w.objectCells.heads.every(id=>!id));
 assert.ok(createWorld().objectCells.heads.every(id=>!id),'restart has no stale cell heads');
});

test('live native preparation consumes reroutes and completes slow turns and reactions', async () => {
 const {createLivePerson,stepLivePerson}=await import('../app/live-people.ts');
 const w=createWorld(),u=w.units.find(u=>u.team==='blue'&&u.kind==='shaman');w.units=[u];u.native=createLivePerson(w,u);
 const p=u.native;Object.assign(p,{state:41,substate:8,timer:100,speed:0,counter:0,flags2:0x80000804,slowTurn:2,motionTimer:9,motionMode:7,reactionTimer:5,reactionDuration:1});
 p.flags4|=0x300000;p.goalX=(p.x+100)&65535;p.goalY=(p.y+100)&65535;
 stepLivePerson(w,u);
 assert.equal(p.slowTurn,1);assert.equal(p.flags2&0x80000000,0);assert.equal(p.motionTimer,0);assert.equal(p.motionMode,0);
 assert.equal(p.destinationX,p.goalX);assert.equal(p.destinationY,p.goalY);
 assert.equal(p.reactionTimer,0);assert.equal(p.reactionDuration,0);assert.equal(p.flags4&0x300000,0);
 stepLivePerson(w,u);assert.equal(p.slowTurn,0);assert.ok(p.object>0,'ending a slow turn refreshes the native person animation');
});

test('interrupted victory followers resume through native orders and rejoin celebration', async () => {
 const {createLivePerson,initializeLiveCelebration,stepLivePerson}=await import('../app/live-people.ts');
 const w=createWorld(),u=w.units.find(u=>u.team==='blue'&&u.kind==='shaman');w.units=[u];
 w.land.landFlags|=0x2000000;u.native=createLivePerson(w,u);initializeLiveCelebration(w,u);
 const p=u.native;p.flags2|=16;p.flags4|=0x400000;p.anchorFlags=255;
 stepLivePerson(w,u);
 assert.equal(p.state,41);assert.equal(p.previousState,10,'resumes through the native empty-order handoff');
 assert.equal(p.flags2&16,0);assert.equal(p.flags4&0x400000,0);assert.equal(p.anchorFlags,0);
 assert.equal(p.anchorX&511,256);assert.equal(p.anchorY&511,256);
 assert.ok(p.object>0);assert.equal(p.substate,8);
 stepLivePerson(w,u);assert.equal(p.state,41,'resumption remains owned by the native controller');
});

test('native idle approach composes with shared state and original resting animation', async () => {
 const {createLivePerson}=await import('../app/live-people.ts');
 const {initializePersonState}=await import('../app/person-state.ts');
 const {initializeIdleApproach,initializeRestingPerson,stepRestingPerson}=await import('../app/person-idle.ts');
 const {setPersonAnimation}=await import('../app/animation.ts');
 const sprites=(await import('../app/original-units.json',{with:{type:'json'}})).default;
 const world=createWorld(),unit=world.units.find(u=>u.kind==='shaman'&&u.team==='blue'),p=createLivePerson(world,unit);
 Object.assign(p,{state:17,previousState:10,flags3:0,assignment:0,stateObject:321,goalX:p.x,goalY:p.y});
 const w={randomState:123,poseRandom:{randomState:456},turn:2,slotOffsets:[],shamans:new Map(),instantFacing:false,levelFlags:0,
  tribes:Array.from({length:4},()=>({x:0,y:0,angle:0,selectedCount:0,flags:0})),orders:{records:[],cursor:0,active:0}};
 const unowned=()=>{throw Error('Unexpected idle world consumer');};
 const setAnimation=(_,object)=>setPersonAnimation(p,object,{playerTribe:0,gameFlags:0,sessionSubstate:null,tribes:Array.from({length:4},()=>({flags:0,playerType:1})),objects:new Map()},sprites);
 const resting={setAnimation,releaseMotion:()=>{},occupied:()=>false,validSlot:unowned,findSlot:unowned,directDestination:unowned,
  insert:unowned,height:unowned,allocateLog:unowned,sound:unowned,refreshCell:unowned,frameCount:o=>sprites.frameCounts[o]};
 const effects={setAnimation,releaseMotion:()=>{},deselectPassengers:unowned,rebuildTrainingQueue:unowned,rebuildFormation:unowned,startOrders:unowned,
  resting:()=>initializeRestingPerson(w,p,resting),idleApproach:()=>initializeIdleApproach(0,p,{...resting,collision:()=>0,
   searchStart:unowned,searchNext:unowned,searchEnd:unowned,destination:unowned,allocateOrder:unowned,adjacentBuilding:unowned,buildingPoint:unowned,
   prepareOrder:unowned,clearOrders:unowned,attachOrder:unowned,initialize:()=>initializePersonState(w,p,effects)})};
 initializePersonState(w,p,effects);
 assert.equal(p.state,19);assert.equal(p.previousState,17);assert.equal(p.substate,8);assert.equal(p.speed,0);assert.equal(p.stateObject,0);
 assert.equal(p.object,424,'original shaman resting sprite sequence');
 const seed=w.randomState;stepRestingPerson(w,p,resting);
 assert.equal(p.state,19);assert.equal(p.stateObject,1);assert.equal(p.flags2&0x40000000,0);assert.equal(w.randomState,seed);
 assert.equal(w.poseRandom.randomState,456,'resting does not consume the separate pose-pause RNG');
});

test('native resting ownership allocates distinct slots and compacts after a follower leaves', async () => {
 const {createLivePerson}=await import('../app/live-people.ts');
 const {insertObjectIntoCell,removeObjectFromCell,objectsInCell}=await import('../app/object-cells.ts');
 const {createIndexedSearch}=await import('../app/indexed-search.ts');
 const {createRestingSlots,findRestingSlot,restingSlotAvailable,rebuildRestingSlots}=await import('../app/resting-slots.ts');
 const {idleSlotPosition,stepRestingPerson}=await import('../app/person-idle.ts');
 const rules=(await import('../app/original-rules.json',{with:{type:'json'}})).default;
 const world=createWorld(),ps=world.units.filter(u=>u.kind==='brave'&&u.team==='blue').slice(0,2).map(u=>createLivePerson(world,u));
 world.land.heights.fill(100);world.land.flags.fill(0);world.land.categories.fill(rules.terrainCategoryFlags.findIndex(f=>f&1));
 const cell=0x2020,center={x:0x2100,y:0x2100};
 for(const p of ps){
  Object.assign(p,center,{state:19,substate:5,flags2:0,assignment:1,anchorX:center.x,anchorY:center.y,formationCell:0,anchorFlags:0,counter:4});
  world.objectCells.objects.set(p.id,p);insertObjectIntoCell(world.objectCells,p,p);
 }
 const unexpected=()=>{throw Error('Unexpected resting world consumer');};
 const w={land:world.land,orders:{records:[],cursor:0,active:0},cellObjects:c=>objectsInCell(world.objectCells,c),outside:unexpected,
  search:createIndexedSearch(),slotOffsets:createRestingSlots(),randomState:123,poseRandom:{randomState:456},turn:2,shamans:new Map()};
 const [first,second]=ps;
 assert.ok(findRestingSlot(w,first));assert.equal(first.anchorFlags,0x11);
 assert.deepEqual(idleSlotPosition(w.slotOffsets,cell,first.anchorFlags),center);
 assert.ok(findRestingSlot(w,second));assert.equal(second.anchorFlags,2);
 assert.equal(first.formationCell,cell);assert.equal(second.formationCell,cell);
 rebuildRestingSlots(w,cell);
 assert.deepEqual(ps.map(p=>p.anchorFlags),[0x21,0x22]);assert.ok(ps.every(p=>restingSlotAvailable(w,p)));
 assert.equal(restingSlotAvailable(w,second,cell,0x11),false,'another shape cannot claim an occupied slot');
 const effects={occupied:()=>false,setAnimation:unexpected,releaseMotion:unexpected,validSlot:unexpected,findSlot:unexpected,
  directDestination:unexpected,insert:unexpected,height:unexpected,allocateLog:unexpected,sound:unexpected,refreshCell:unexpected,frameCount:unexpected};
 stepRestingPerson(w,second,effects);assert.equal(second.substate,1);assert.equal(second.assignment&2,0);
 removeObjectFromCell(world.objectCells,first);rebuildRestingSlots(w,cell);
 assert.equal(second.anchorFlags,0x11);assert.ok(second.assignment&2,'survivor is asked to return to the center');
 assert.deepEqual(idleSlotPosition(w.slotOffsets,cell,second.anchorFlags),center);
 assert.ok(restingSlotAvailable(w,second));assert.ok(w.search.every((v,i)=>i%12!==0||v===0),'every search releases its handle');
});

test('native route reuse shares ownership and live celebration releases each follower', async () => {
 const {createLivePerson,initializeLiveCelebration,stepLivePerson}=await import('../app/live-people.ts');
 const {planPersonDestination}=await import('../app/person-routes.ts');
 const w=createWorld();w.units=w.units.filter(u=>u.kind==='brave'&&u.team==='blue').slice(0,2);
 for(const u of w.units){Object.assign(u,{x:7,z:33,inside:null,work:null});u.native=createLivePerson(w,u);initializeLiveCelebration(w,u);}
 w.land.flags.fill(0);w.land.buildingIds.fill(0);w.land.categories.fill(0);
 const [first,second]=w.units.map(u=>u.native),routes=w.motionRoutes,v=new DataView(routes.records.buffer),a=109;
 const to={x:(first.x+1024)&65535,y:first.y};
 v.setInt16(a,1,true);routes.records[a+2]=1;routes.records[a+4]=first.x>>8;routes.records[a+5]=first.y>>8;
 routes.records[a+8]=to.x>>8;routes.records[a+9]=to.y>>8;routes.active=1;routes.last=1;first.motionGroup=1;
 second.flags2|=0x2000000;
 const unexpected=()=>{throw Error('An existing route should be reused');};
 let advanced=0;
 const route=planPersonDestination({routes,skip:0,checkingPerson:0,levelFlags2:0,computerLimit:0,humanLimit:0,
  tribes:Array.from({length:4},()=>({playerType:1,requests:0})),land:w.land,vehicles:new Map()},second,to,
  {outside:unexpected,buildingBlocks:unexpected,coastDirection:unexpected,build:unexpected,vehicleReady:unexpected,advance:()=>advanced++});
 assert.equal(route,1);assert.equal(advanced,1);assert.equal(second.motionGroup,1);assert.equal(v.getInt16(a,true),2);assert.equal(routes.active,1);
 stepLivePerson(w,w.units[0]);
 assert.equal(first.motionGroup,0);assert.equal(v.getInt16(a,true),1);assert.equal(routes.records[a+2],1);
 stepLivePerson(w,w.units[1]);
 assert.equal(second.motionGroup,0);assert.equal(v.getInt16(a,true),0);assert.equal(routes.records[a+2],0);assert.equal(routes.active,0);
 assert.ok(createWorld().motionRoutes.records.every(n=>n===0),'restart discards previous route ownership');
});

test('native route construction retries expired failures and stores the original bounded path', async () => {
 const {createLivePerson}=await import('../app/live-people.ts');
 const {buildPersonRoute,ageFailedRoutes,attachPersonRoute,releasePersonRoute}=await import('../app/person-routes.ts');
 const world=createWorld(),unit=world.units.find(u=>u.kind==='brave'&&u.team==='blue'),p=createLivePerson(world,unit),w=world.motionRoutes;
 const v=new DataView(w.records.buffer),from={x:10,y:20},to={x:60,y:80},tribe={flags:0};
 for(let i=1;i<400;i++)v.setInt16(i*109,1,true);
 const unexpected=()=>{throw Error('Unexpected route search');};
 assert.equal(buildPersonRoute(w,p,from,to,0,tribe,{findVehicle:unexpected,search:unexpected}),0,'slot 400 is outside the allocation scan');
 w.records.fill(0);w.cursor=399;let calls=0,success=false;
 const e={findVehicle:unexpected,search:()=>{
  calls++;if(!success)return 1;
  w.pathResult.set([from.x,from.y,0,0,to.x,to.y,0,0]);w.pathResult[1032]=24;
  for(let i=0;i<24;i++)w.pathResult.set([10+i,20+i,i===23?1:0,0],8+i*4);
  return 0;
 }};
 assert.equal(buildPersonRoute(w,p,from,to,0,tribe,e),0);assert.equal(calls,1);assert.equal(w.cursor,1);
 assert.ok(p.flags4&0x10000000);
 for(let i=0;i<15;i++){ageFailedRoutes(w);assert.equal(buildPersonRoute(w,p,from,to,0,tribe,e),0);}
 assert.equal(calls,1,'cached failure prevents repeated path searches');
 ageFailedRoutes(w);success=true;
 const id=buildPersonRoute(w,p,from,to,0,tribe,e);assert.equal(id,2);assert.equal(calls,2);assert.equal(p.flags4&0x10000000,0);
 assert.equal(w.records[id*109+108],23);assert.equal(w.records[id*109+2]&1,0,'a truncated point cannot contribute vehicle flags');
 assert.deepEqual([...w.records.slice(id*109+4,id*109+12)],[10,20,0,0,60,80,0,0]);
 assert.equal(w.active,0,'construction does not yet own a route');
 attachPersonRoute(w,p,id,true);assert.equal(w.active,1);releasePersonRoute(w,p);
 assert.equal(w.active,0);assert.equal(v.getInt16(id*109,true),0);assert.ok(w.records[id*109+2]&4,'reserved route survives its last owner');
});

test('native path search packs a trimmed route and preserves distinct vehicle retry flags', async () => {
 const {createLivePerson}=await import('../app/live-people.ts');
 const {buildPersonRoute}=await import('../app/person-routes.ts');
 const {searchPersonPath,collectSearchPath}=await import('../app/path-search.ts');
 const rules=(await import('../app/original-rules.json',{with:{type:'json'}})).default;
 const command=rules.personCommands.findIndex(c=>c.flags&0x4000);
 for(const retry of [false,true]){
  const world=createWorld(),p=createLivePerson(world,world.units.find(u=>u.kind==='brave'&&u.team==='blue')),routes=world.motionRoutes;
  const path={data:new Uint8Array(2580),count:2},v=new DataView(path.data.buffer);
  for(const [i,x,kind] of [[0,5130,0],[1,5132,0],[2,5131,1],[3,5132,0]]){v.setInt32(i*10,x,true);v.setInt32(i*10+4,5140,true);v.setUint16(i*10+8,kind,true);}
  const state={searches:0,landLimit:0,checkingPerson:0,limit:0,vehicles:0,mode:0,currentBoat:0,candidateCount:0,candidateIndex:0,truncated:0,walkMask:0};
  const categories=new Uint8Array(16384);categories.fill(rules.terrainCategoryFlags.findIndex(f=>f&1));
  const w={state,path,result:routes.pathResult,categories,boatsEnabled:1,landLimit:32,computerLimit:32,humanLimit:32,tribes:Array.from({length:4},()=>({playerType:1})),cellObjects:()=>[]};
  const outcomes=retry?[2,1,1,1,0]:[0],attempts=[],choices=[];let pass=0;
  const consumers={prepare:()=>{state.candidateCount=2;},choose:i=>choices.push(i),solve:()=>{attempts.push([state.walkMask,state.vehicles]);state.currentBoat=2;return outcomes[pass++];},
   smooth:()=>{},measure:()=>{},collect:()=>{state.truncated=Number(collectSearchPath(path,routes.pathResult,command));}};
  const id=buildPersonRoute(routes,p,{x:10,y:20},{x:12,y:20},0,{flags:32},{findVehicle:()=>{throw Error('No airship search expected');},search:(_,p,a,b,option,vehicles)=>{
   return searchPersonPath(w,p,Uint8Array.of(a.x,a.y,0,0),Uint8Array.of(b.x,b.y,0,0),option,vehicles,consumers);
  }});
  assert.equal(id,1);assert.equal(state.truncated,1);assert.equal(state.walkMask,0);assert.equal(!!(p.flags4&0x4000000),!retry);
  assert.equal(routes.records[109+108],1);assert.deepEqual([...routes.records.slice(109+12,109+15)],[11,20,1]);assert.ok(routes.records[111]&1);
  assert.deepEqual(choices,retry?[0,1,2]:[0],'retry uses the index after the candidate loop');
  assert.deepEqual(attempts,retry?[[1,1],[0,1],[1,1],[0,1],[0,0]]:[[1,1]]);
 }
});

test('native wrapped route smoothing respects blocked steps and measures retained segments', async () => {
 const {createLivePerson}=await import('../app/live-people.ts');
 const {buildPersonRoute}=await import('../app/person-routes.ts');
 const {searchPersonPath,collectSearchPath}=await import('../app/path-search.ts');
 const {createPathGeometry,preparePathCandidates,choosePathCandidate,clearPathSegment,smoothSearchPath,measureSearchPath}=await import('../app/path-geometry.ts');
 const rules=(await import('../app/original-rules.json',{with:{type:'json'}})).default;
 for(const blocked of [false,true]){
  const world=createWorld(),p=createLivePerson(world,world.units.find(u=>u.kind==='brave'&&u.team==='blue')),routes=world.motionRoutes;
  const path={data:new Uint8Array(2580),count:0},g=createPathGeometry(),v=new DataView(path.data.buffer);
  const state={searches:0,landLimit:0,checkingPerson:0,limit:0,vehicles:0,mode:0,currentBoat:0,candidateCount:0,candidateIndex:0,truncated:0,walkMask:0};
  const categories=new Uint8Array(16384).fill(rules.terrainCategoryFlags.findIndex(f=>f&1)),walkMasks=[new Uint8Array(8192).fill(255),new Uint8Array(8192).fill(255)];
  if(blocked)for(const mask of walkMasks){const bit=20*256+251;mask[bit>>3]&=~(1<<(bit&7));}
  const w={state,path,result:routes.pathResult,categories,flags:new Uint32Array(16384),walkMasks,boatsEnabled:0,landLimit:32,computerLimit:32,humanLimit:32,tribes:Array.from({length:4},()=>({playerType:1})),cellObjects:()=>[]};
  const unexpected=()=>{throw Error('Unexpected boat or building consumer');},probe={buildingAccess:unexpected,boardingBoat:unexpected,disembark:unexpected,boatCell:unexpected};
  const measure={dirty:1,distance:0,tribes:0},regions=new Uint8Array(16384).fill(0x30),tribes=[{active:true,defeatTimer:0},{active:false,defeatTimer:0}];
  const consumers={prepare:()=>preparePathCandidates(w,g),choose:i=>choosePathCandidate(w,g,i),solve:()=>{
   assert.equal(v.getInt32(0,true),5370);assert.equal(v.getInt32(10,true),5382,'target wraps across the world seam');
   // Obstacle solver remains supplied; exercise its actual postprocessing chain.
   path.count=3;for(const [i,x,y] of [[0,250,28],[1,262,28],[2,262,24]]){v.setInt32(20+i*10,5120+x,true);v.setInt32(24+i*10,5120+y,true);}
   return 0;
  },smooth:()=>smoothSearchPath(path,0,(a,b,k)=>clearPathSegment(w,g,p,a,b,k,probe)),
   measure:()=>measureSearchPath(path,g.line,measure,regions,tribes),collect:()=>{state.truncated=Number(collectSearchPath(path,w.result,0));}};
  const id=buildPersonRoute(routes,p,{x:250,y:20},{x:6,y:24},0,{flags:0},{findVehicle:unexpected,search:(_,p,a,b,option,vehicles)=>searchPersonPath(w,p,Uint8Array.of(a.x,a.y,0,0),Uint8Array.of(b.x,b.y,0,0),option,vehicles,consumers)});
  assert.equal(id,1);assert.equal(state.walkMask,0);assert.equal(measure.dirty,0);assert.equal(measure.tribes,1);
  assert.equal(measure.distance,blocked?24:16);assert.equal(path.count,blocked?2:1);assert.equal(routes.records[109+108],path.count);
  const points=Array.from({length:path.count},(_,i)=>[...routes.records.slice(109+12+i*4,109+15+i*4)]);
  assert.deepEqual(points,blocked?[[250,28,0],[6,24,0]]:[[6,24,0]]);
 }
});

test('native obstacle solving builds a world-seam detour and rejects a blocked destination', async () => {
 const {createLivePerson}=await import('../app/live-people.ts');
 const {buildPersonRoute}=await import('../app/person-routes.ts');
 const {searchPersonPath,collectSearchPath}=await import('../app/path-search.ts');
 const {createPathSolver,solvePersonPath}=await import('../app/path-solver.ts');
 const {createPathGeometry,preparePathCandidates,choosePathCandidate,clearPathSegment,smoothSearchPath,measureSearchPath}=await import('../app/path-geometry.ts');
 const rules=(await import('../app/original-rules.json',{with:{type:'json'}})).default;
 for(const closed of [false,true]){
  const world=createWorld(),p=createLivePerson(world,world.units.find(u=>u.kind==='brave'&&u.team==='blue')),routes=world.motionRoutes;
  const path={data:new Uint8Array(2580),count:0},g=createPathGeometry(),solver=createPathSolver();
  const state={searches:0,landLimit:0,checkingPerson:0,limit:0,vehicles:0,mode:0,currentBoat:0,candidateCount:0,candidateIndex:0,truncated:0,walkMask:0};
  const walkMasks=[new Uint8Array(8192).fill(255),new Uint8Array(8192).fill(255)];
  for(const mask of walkMasks){
   for(let x=252;x<=257;x++)for(let y=18;y<=22;y++){const bit=y*256+(x&255);mask[bit>>3]&=~(1<<(bit&7));}
   if(closed){const bit=20*256+6;mask[bit>>3]&=~(1<<(bit&7));}
  }
  const w={state,path,result:routes.pathResult,categories:new Uint8Array(16384).fill(rules.terrainCategoryFlags.findIndex(f=>f&1)),flags:new Uint32Array(16384),walkMasks,boatsEnabled:0,landLimit:32,computerLimit:64,humanLimit:64,tribes:Array.from({length:4},()=>({playerType:1})),cellObjects:()=>[]};
  const unexpected=()=>{throw Error('Unexpected boat or building consumer');},e={buildingAccess:unexpected,boardingBoat:unexpected,disembark:unexpected,boatCell:unexpected};
  const measure={dirty:1,distance:0,tribes:0},consumers={prepare:()=>preparePathCandidates(w,g),choose:i=>choosePathCandidate(w,g,i),solve:()=>solvePersonPath(w,g,solver,p,e),
   smooth:()=>smoothSearchPath(path,0,(a,b,k)=>clearPathSegment(w,g,p,a,b,k,e)),measure:()=>measureSearchPath(path,g.line,measure,new Uint8Array(16384),[]),collect:()=>{state.truncated=Number(collectSearchPath(path,w.result,0));}};
  const id=buildPersonRoute(routes,p,{x:250,y:20},{x:6,y:20},0,{flags:0},{findVehicle:unexpected,search:(_,p,a,b,option,vehicles)=>searchPersonPath(w,p,Uint8Array.of(a.x,a.y,0,0),Uint8Array.of(b.x,b.y,0,0),option,vehicles,consumers)});
  assert.equal(state.walkMask,0);assert.equal(routes.active,0);assert.equal(id,closed?0:1);
  assert.equal(solver.attempts,closed?4:1);assert.equal(solver.detours,closed?6:1);assert.equal(solver.steps,closed?572:28);
  if(closed){assert.ok(p.flags4&0x10000000);assert.equal(new DataView(routes.failedSearches.buffer).getInt16(0,true),16);}
  else{
   assert.equal(measure.distance,18);assert.equal(routes.records[109+108],3);
   assert.deepEqual(Array.from({length:3},(_,i)=>[...routes.records.slice(109+12+i*4,109+15+i*4)]),[[251,23,0],[2,23,0],[6,20,0]]);
  }
 }
});

test('native planned routes use the recovered solver and advance shared followers to their goal', async () => {
 const {createLivePerson}=await import('../app/live-people.ts');
 const {buildPersonRoute,planPersonDestination,routeVehicleAvailable}=await import('../app/person-routes.ts');
 const {advancePersonRoute}=await import('../app/route-advance.ts');
 const {searchPersonPath,collectSearchPath}=await import('../app/path-search.ts');
 const {createPathSolver,solvePersonPath}=await import('../app/path-solver.ts');
 const {createPathGeometry,preparePathCandidates,choosePathCandidate,clearPathSegment,smoothSearchPath,measureSearchPath}=await import('../app/path-geometry.ts');
 const {boardingVehicle,vehicleCellFree,vehicleCanDisembark,vehicleReady}=await import('../app/vehicle-routing.ts');
 const rules=(await import('../app/original-rules.json',{with:{type:'json'}})).default;
 const world=createWorld(),ps=world.units.filter(u=>u.kind==='brave'&&u.team==='blue').slice(0,2).map(u=>createLivePerson(world,u)),routes=world.motionRoutes;
 for(const p of ps)Object.assign(p,{x:250*256,y:20*256,flags2:0x2000000,flags4:0,vehicle:0,counter:0});
 const categories=new Uint8Array(16384).fill(rules.terrainCategoryFlags.findIndex(f=>f&1)),flags=new Uint32Array(16384),walkMasks=[new Uint8Array(8192).fill(255),new Uint8Array(8192).fill(255)];
 for(const mask of walkMasks)for(let x=252;x<=257;x++)for(let y=18;y<=22;y++){const bit=y*256+(x&255);mask[bit>>3]&=~(1<<(bit&7));}
 const tribes=Array.from({length:4},()=>({playerType:1,requests:0,flags:0,active:true,defeatTimer:0})),vehicles=new Map(),people=new Map(ps.map(p=>[p.id,p]));
 const land={flags,categories,buildingIds:new Uint16Array(16384)},boatWorld={flags,categories,cellObjects:()=>[],boatsEnabled:0,vehicles,people,tribes};
 const path={data:new Uint8Array(2580),count:0},g=createPathGeometry(),solver=createPathSolver(),state={searches:0,landLimit:0,checkingPerson:0,limit:0,vehicles:0,mode:0,currentBoat:0,candidateCount:0,candidateIndex:0,truncated:0,walkMask:0};
 const w={...boatWorld,state,path,result:routes.pathResult,walkMasks,landLimit:32,computerLimit:64,humanLimit:64},measure={dirty:1,distance:0,tribes:0};
 const unexpected=()=>{throw Error('Unexpected world consumer for a land route');};
 const advance=p=>advancePersonRoute({routes,vehicles,people},p,{boarding:unexpected,board:unexpected,routeAvailable:p=>routeVehicleAvailable(routes,p,cell=>boardingVehicle(boatWorld,p,cell)),approach:unexpected,alternativeLanding:unexpected,landingBlocked:unexpected,prepareLanding:unexpected,leaveVehicle:unexpected,clearOrders:unexpected});
 const planner={routes,skip:0,checkingPerson:0,levelFlags2:0,computerLimit:0,humanLimit:0,land,vehicles,tribes};
 const build=(p,a,b)=>buildPersonRoute(routes,p,a,b,0,tribes[p.tribe],{findVehicle:unexpected,search:(_,p,a,b,option,allow)=>{
  const e={buildingAccess:unexpected,boardingBoat:cell=>boardingVehicle(boatWorld,p,cell),disembark:(id,to)=>vehicleCanDisembark(boatWorld,vehicles.get(id),to),boatCell:(cell,id)=>vehicleCellFree(boatWorld,cell,id)};
  return searchPersonPath(w,p,Uint8Array.of(a.x,a.y,0,0),Uint8Array.of(b.x,b.y,0,0),option,allow,{prepare:()=>preparePathCandidates(w,g),choose:i=>choosePathCandidate(w,g,i),solve:()=>solvePersonPath(w,g,solver,p,e),smooth:()=>smoothSearchPath(path,0,(a,b,k)=>clearPathSegment(w,g,p,a,b,k,e)),measure:()=>measureSearchPath(path,g.line,measure,new Uint8Array(16384),tribes),collect:()=>{state.truncated=Number(collectSearchPath(path,w.result,0));}});
 }});
 for(const p of ps)assert.equal(planPersonDestination(planner,p,{x:6*256,y:20*256},{outside:unexpected,buildingBlocks:unexpected,coastDirection:unexpected,build,vehicleReady:id=>vehicleReady(boatWorld,vehicles.get(id)),advance}),1);
 const view=new DataView(routes.records.buffer);assert.equal(solver.attempts,1);assert.equal(view.getInt16(109,true),2);
 for(const [i,p] of ps.entries()){
  const visited=[];
  for(let step=0;p.motionGroup&&step<4;step++){
   visited.push([p.destinationX>>8,p.destinationY>>8]);p.x=p.destinationX;p.y=p.destinationY;advance(p);
  }
  assert.deepEqual(visited,[[251,23],[3,23],[7,21]]);assert.equal(p.motionGroup,0);assert.equal(p.motionIndex,0);
  assert.deepEqual([p.destinationX,p.destinationY,p.turnAngle,p.turnY],[6*256,20*256,6*256,20*256]);assert.ok(p.flags2&0x1000);
  assert.equal(view.getInt16(109,true),1-i);assert.equal(routes.active,1-i);
 }
});

test('native boarding checks the first boat and landing requests reserve distinct original search cells', async () => {
 const {boardingVehicle,vehicleReady,vehicleCanDisembark,adjustVehicleDestination}=await import('../app/vehicle-routing.ts');
 const {createIndexedSearch}=await import('../app/indexed-search.ts');
 const rules=(await import('../app/original-rules.json',{with:{type:'json'}})).default;
 const model=rules.vehicleCapacity.findIndex((c,i)=>c>0&&!(rules.vehicleRestFlags[i]&1)),airModel=rules.vehicleRestFlags.findIndex(f=>f&1);
 const boat={id:2,class:4,model,x:0x2100,y:0x2100,physics:0,speed:-1,navigationFlags:0,passengerCount:0,passengers:[1],reservation:0};
 const second={...boat,id:3},air={...boat,id:4,model:airModel},flags=new Uint32Array(16384).fill(0x1000000);
 const category=rules.terrainCategoryFlags.findIndex(f=>(f&60)&&!(f&16)),categories=new Uint8Array(16384).fill(category),tribes=[{playerType:1}];
 let occupants=[boat,second];const w={flags,categories,boatsEnabled:1,vehicles:new Map([[2,boat],[3,second],[4,air]]),people:new Map([[1,{tribe:0}]]),tribes,cellObjects:cell=>cell===0x2020?occupants:[]};
 assert.ok(vehicleReady(w,boat));boat.passengerCount=rules.vehicleCapacity[model];assert.equal(boardingVehicle(w,{tribe:0},0x2020),0,'a full first boat does not select the second');
 boat.passengerCount=0;boat.reservation=1;assert.equal(boardingVehicle(w,{tribe:0},0x2020),0);
 tribes[0].playerType=2;assert.equal(boardingVehicle(w,{tribe:0},0x2020),2);tribes[0].playerType=1;boat.reservation=0;
 assert.equal(vehicleCanDisembark(w,boat,boat),false);occupants=[boat];assert.ok(vehicleCanDisembark(w,boat,boat));
 const slots={search:createIndexedSearch(),records:new Uint8Array(48),count:0},a={x:0x2100,y:0x2100},b={...a};
 adjustVehicleDestination(w,slots,air,a);adjustVehicleDestination(w,slots,air,b);
 assert.notDeepEqual(a,b);assert.notDeepEqual(a,{x:0x2100,y:0x2100});assert.equal(slots.count,2);
 assert.equal(slots.records[2],1);assert.equal(slots.records[5],1);assert.ok(slots.search.every((v,i)=>i%12!==0||v===0));
});

test('live native routes release query ownership, expire failures and walk low shoreline', async () => {
 const {supportsFollower}=await import('../app/model.ts');
 const w=createWorld(),u=w.units.find(u=>u.team==='blue'&&u.kind==='shaman'),shore={x:9,z:25};
 assert.equal(walkable(w.terrain,shore),false);assert.equal(supportsFollower(w,shore),true);
 assert.deepEqual(findPath(w,u,ENEMY),[]);const searches=w.pathfinding.state.searches;
 assert.ok(searches>0);assert.deepEqual(findPath(w,u,ENEMY),[]);assert.equal(w.pathfinding.state.searches,searches,'failed route is cached');
 const cached=w.motionRoutes.failedSearches.findIndex((n,i)=>i%10===0&&n===16);assert.ok(cached>=0);
 w.paused=true;advance(w,1);assert.equal(w.motionRoutes.failedSearches[cached],16);
 w.paused=false;tick(w,1/12);assert.equal(w.motionRoutes.failedSearches[cached],15);
 for(let i=0;i<15;i++)tick(w,1/12);assert.equal(w.motionRoutes.failedSearches[cached],0);
 assert.deepEqual(findPath(w,u,ENEMY),[]);assert.ok(w.pathfinding.state.searches>0,'expired failure searches again');
 select(w,'shaman');command(w,shore);assert.ok(u.path.length);assert.deepEqual(u.path.at(-1),shore);
 assert.ok(w.pathfinding.people.get(u.id)?.motionGroup);assert.equal(u.native.state,10);assert.equal(u.native.commandStatus,3);assert.equal(unitAnimationSource(u),u.native,'native movement owns its original animation');
 until(w,()=>u.native.commandStatus===0,15);advance(w,1);assert.ok(w.units.includes(u));assert.equal(u.hp,maxHp('shaman'));
 for(let id=1;id<=400;id++)assert.equal(new DataView(w.motionRoutes.records.buffer).getInt16(id*109,true),0);
 w.pathfinding.solver.tribeRequests.fill(123);tick(w,1/12);assert.ok(w.pathfinding.solver.tribeRequests.every(n=>n<123),'request limits observe this turn only');
});


test('live followers share routes, advance before exact arrival and release every owner', async () => {
 const {guardShaman}=await import('../app/model.ts');
 const w=createWorld(),a=addUnit(w,'blue','brave',HOME),b=addUnit(w,'blue','brave',HOME),goal={x:9,z:25};
 w.selected=[a.id,b.id];command(w,goal);
 const pa=w.pathfinding.people.get(a.id),pb=w.pathfinding.people.get(b.id),group=pa.motionGroup;
 const refs=()=>new DataView(w.motionRoutes.records.buffer).getInt16(group*109,true);
 assert.ok(group);assert.equal(pb.motionGroup,group);assert.equal(refs(),2);
 assert.deepEqual(findPath(w,a,ENEMY),[]);assert.equal(w.pathfinding.people.get(a.id),pa);assert.equal(w.pathfinding.people.get(b.id),pb);assert.equal(refs(),2,'an unreachable preview preserves existing orders');
 const searches=w.pathfinding.state.searches;assert.ok(findPath(w,a,goal).length);
 assert.equal(refs(),2,'a preview borrows and releases the shared route');assert.equal(w.pathfinding.state.searches,searches,'preview reuses the live route');
 w.selected=[a.id];guardShaman(w);assert.equal(refs(),1);assert.equal(w.pathfinding.people.has(a.id),false);
 until(w,()=>pb.motionGroup===0,15);
 assert.ok(Math.hypot(b.x-goal.x,b.z-goal.z)>0,'native route arrival precedes exact task arrival');
 assert.ok(Math.max(Math.abs(b.x-goal.x),Math.abs(b.z-goal.z))<=224/256);
 assert.equal(refs(),0);assert.equal(w.motionRoutes.records[group*109+2],0);
 until(w,()=>b.x===goal.x&&b.z===goal.z,3);assert.equal(w.pathfinding.people.has(b.id),false);
 // A new destination replaces the old reference; interruption and deletion
 // cover the same ownership boundary used by live task consumers.
 w.selected=[b.id];command(w,HOME);const old=w.pathfinding.people.get(b.id).motionGroup;
 command(w,{x:5,z:29});assert.equal(new DataView(w.motionRoutes.records.buffer).getInt16(old*109,true),0);
 const last=w.pathfinding.people.get(b.id).motionGroup;b.hp=0;tick(w,1/12);
 assert.equal(w.pathfinding.people.has(b.id),false);if(last)assert.equal(new DataView(w.motionRoutes.records.buffer).getInt16(last*109,true),0);
 const shaman=w.units.find(u=>u.team==='blue'&&u.kind==='shaman');w.selected=[shaman.id];command(w,goal);
 assert.ok(w.pathfinding.people.has(shaman.id));assert.ok(cast(w,'blast',HOME));assert.equal(w.pathfinding.people.has(shaman.id),false);
 const result=createWorld(),followers=result.units.filter(u=>u.team==='blue'&&u.kind==='brave');result.selected=followers.map(u=>u.id);command(result,goal);
 assert.ok(result.pathfinding.people.size>0);result.units=result.units.filter(u=>u.team==='blue');result.turn=31;result.ai.variables[57]=1;tick(result,1/12);
 assert.equal(result.status,'won');assert.equal(result.pathfinding.people.size,0);assert.equal(result.motionRoutes.active,0,'victory releases ordinary routes before native celebration takes over');
});

test('hut families are selected once, shared with shapes and retained through upgrades',async()=>{
 const {default:rules}=await import('../app/original-rules.json',{with:{type:'json'}});
 const w=createWorld(),b=w.buildings.find(b=>b.team==='blue'&&b.kind==='hut');
 assert.deepEqual(w.buildings.map(buildingObject),[112,104,119,119]);
 const seed=w.randomState,id=buildingObject(b);
 assert.equal(buildingPose(b).object,id);assert.equal(buildingObject(structuredClone(b)),id);
 assert.equal(w.randomState,seed,'drawing and shape queries must not reroll the hut');
 const families=new Set();
 for(let seed=1;seed<=32;seed++){
  w.randomState=seed;const hut=addBuilding(w,'blue','hut',{x:0,z:0});families.add(hut.object);
  assert.ok(nativeModels[hut.object]);w.buildings.pop();
 }
 assert.deepEqual([...families].sort((a,b)=>a-b),[107,119,131]);
 const u=w.units.find(u=>u.team==='blue'&&u.kind==='brave');u.inside=b.id;u.work=b.id;
 b.upgrade=rules.hutUpgradeWork[0];b.counter=15;w.turn=15;w.trees.push({...entrance(w,b),id:w.nextId++,model:11,logs:3});tick(w,1/12);
 assert.equal(b.level,2);assert.equal(b.object,id+1);assert.equal(b.progress,1/3);
 const legacy={...b};delete legacy.object;assert.equal(buildingObject(legacy),132);
});
