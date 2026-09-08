import type {World,Unit} from './model.ts';
import {nativePosition,browserPosition,nativeTerrainHeight,walkable,height,buildingBlocksStep,entrance,sound} from './model.ts';
import {initializePersonState,type StatefulPerson} from './person-state.ts';
import {stepCelebration,type Celebrant,type CelebrationEffects} from './celebration.ts';
import {setAnimationObject,setPersonAnimation,stepObjectAnimation,type Animation} from './animation.ts';
import {turnPerson,groundVelocity,type PersonFacing} from './person-motion.ts';
import {positionDistance,random} from './native-math.ts';
import rules from './original-rules.json' with {type:'json'};
import sprites from './original-units.json' with {type:'json'};

export type LivePerson=StatefulPerson & Celebrant & Animation & PersonFacing & {
  stamp:number;morphTimer:number;morphFrames:number;building:number|null;goalX:number;goalY:number;destinationX:number;destinationY:number;
  motionGroup:number;motionIndex:number;
};
const short=(n:number)=>(n<<16)>>16;
const cell=(p:Celebrant)=>((p.x>>>8)&254)|(p.y&0xfe00);

// Bootstrap the existing browser follower at the handoff to native state 41.
// Legacy orders/physics are not native records; their full migration is pending.
export function createLivePerson(w:World,u:Unit):LivePerson{
  const pos=nativePosition(w,u),model=u.kind==='shaman'?7:u.kind==='warrior'?3:2;
  const selected=w.selected.includes(u.id),angle=Math.round((Math.PI-u.heading)*1024/Math.PI)&2047;
  return {id:u.id,class:1,model,state:selected?14:10,previousState:0,substate:0,tribe:u.team==='blue'?0:1,
    x:pos.x&65535,y:pos.y&65535,h:pos.h,anchorX:pos.x&65535,anchorY:pos.y&65535,counter:(w.turn-1)&255,
    flags2:u.inside===null?0:0x800000,flags3:selected?128:0,flags4:0x20000000,physics:rules.personModels[model].physics,
    speed:0,angle,heading:angle,turnAngle:angle,turnY:0,slowTurn:0,goalX:0,goalY:0,destinationX:0,destinationY:0,
    building:u.inside,cargo:u.cargo*100,vehicle:0,assignment:0,timer:0,target:0,link:0,stateObject:0,
    animationMode:0,commandAux:0,commandPhase:0,object:0,draw:0,morph:0,palette:0,renderFlags:0,f1:0,f2:0,stamp:0,morphTimer:0,morphFrames:0,
    statusFlags:0,workFlags:0,reservationNext:0,formationCell:0,motionTimer:0,motionMode:0,motionGroup:0,motionIndex:0,
    selectionFlags:selected?128:0,commands:Array(8).fill(0),commandCursor:0,immediateCommand:0,
    orderLocation:0,commandStatus:0,workTarget:0};
}

function context(w:World){
  const people=new Map(w.units.filter(u=>u.native&&u.hp>0).map(u=>[u.id,u.native!]));
  const state={randomState:w.randomState,people,shamans:w.manaTribes.map((_,i)=>w.units.find(u=>u.hp>0&&u.kind==='shaman'&&u.team===(i===0?'blue':i===1?'red':null))?.id??0),
    cellPeople:(c:number)=>[...people.values()].filter(p=>cell(p)===c)};
  const animationWorld={playerTribe:w.manaWorld.playerTribe,gameFlags:w.manaWorld.gameFlags,sessionSubstate:null,
    tribes:w.manaTribes.map((t,i)=>({flags:w.castingTribes[i].flags,playerType:t.playerType})),objects:new Map()};
  const releaseMotion=(p:LivePerson)=>{
    if(p.motionGroup)throw new Error('Native motion-group ownership is not integrated');
    p.motionIndex=0;
  };
  const effects:CelebrationEffects={
    animation:(person,object,upper)=>{
      const p=person as LivePerson;
      if(upper)setPersonAnimation(p,object,animationWorld,sprites);
      else{const [start,draw]=rules.animationObjects[object];setAnimationObject(p,draw,start);}
    },
    animationTiming:person=>{const p=person as LivePerson,d=rules.animationDescriptors[p.draw];return {hold:d.hold,duration:(d.step+1)*sprites.frameCounts[p.object]};},
    releaseMotion:person=>releaseMotion(person as LivePerson),
    destination:(person,to)=>{
      const p=person as LivePerson;releaseMotion(p);
      p.goalX=p.destinationX=p.turnAngle=to.x&65535;p.goalY=p.destinationY=p.turnY=to.y&65535;
      p.flags2=((p.flags2&~128)|0x1000)>>>0;
    },
    dropLog:person=>{
      // 0x4a6cc0's cell centering and two jitter draws. Native free-cell search,
      // allocation ordering and loose-log lifecycle still use browser adapters.
      const pos={x:((person.x&0xfe00)+256+32-(random(state)&63))&65535,y:((person.y&0xfe00)+256+32-(random(state)&63))&65535};
      w.trees.push({id:w.nextId++,...browserPosition(pos),logs:1,model:11});return true;
    },
    sound:(p,cue)=>sound(w,cue,browserPosition(p)),
    leaveBuilding:person=>{
      const p=person as LivePerson,u=w.units.find(u=>u.id===p.id)!,b=w.buildings.find(b=>b.id===p.building);
      // Reuse the native entrance adapter; occupant linked-list migration remains.
      if(b){Object.assign(u,entrance(w,b,4));const pos=nativePosition(w,u);p.x=pos.x&65535;p.y=pos.y&65535;p.h=pos.h;}
      p.building=null;u.inside=null;p.flags2=(p.flags2&~0x800000)>>>0;
    },
    projectile:()=>{throw new Error('Live firewarriors are not yet implemented');},
  };
  return {state,effects};
}

export function initializeLiveCelebration(w:World,u:Unit){
  const p=u.native!,{state,effects}=context(w);p.previousState=p.state;p.state=41;
  const tribes=w.manaTribes.map((t,i)=>({x:0,y:0,angle:0,selectedCount:w.units.filter(u=>u.native?.tribe===i&&w.selected.includes(u.id)).length,flags:t.flags2}));
  const initWorld=Object.assign(state,{tribes,instantFacing:false,levelFlags:w.manaWorld.gameFlags,orders:{records:[],cursor:0,active:0}});
  const unexpected=()=>{throw new Error('Legacy handoff contains an unowned native assignment');};
  initializePersonState(initWorld,p,{celebrate:()=>stepCelebration(state,p,effects),setAnimation:(p,o)=>effects.animation(p as LivePerson,o,true),
    releaseMotion:p=>effects.releaseMotion(p as LivePerson),deselectPassengers:unexpected,rebuildTrainingQueue:unexpected,rebuildFormation:unexpected,startOrders:unexpected});
  tribes.forEach((t,i)=>{w.manaTribes[i].flags2=t.flags;});w.randomState=state.randomState;u.cargo=p.cargo/100;
}

export function stepLiveCelebration(w:World,u:Unit){
  const p=u.native!;p.counter=(p.counter+1)&255;
  // External spell impulses still move the legacy unit; reconcile that handoff.
  const position=nativePosition(w,u);p.x=position.x&65535;p.y=position.y&65535;p.h=position.h;
  turnPerson(p); // Native class-1 motion precedes its state controller.
  if(p.speed&&!(p.flags2&0x84000)){
    const terrain=(x:number,y:number)=>nativeTerrainHeight(w.land.heights,x,y);
    let speed=p.speed;
    if((p.flags2&0x200)&&!(p.flags2&128))speed=Math.min(speed,positionDistance(p,{x:p.turnAngle,y:p.turnY}));
    const velocity={x:0,y:0,z:0};groundVelocity(velocity,p,speed,p.heading,terrain);
    const limit=rules.personVelocityLimits[p.physics];
    const next={x:(p.x+Math.max(-limit,Math.min(limit,velocity.x)))&65535,y:(p.y+Math.max(-limit,Math.min(limit,velocity.z)))&65535};
    const point=browserPosition(next);
    // ponytail: native obstacle recovery, falling and cell-list order are still
    // pending. Retain the existing dry-land/building collision boundary here.
    if(walkable(w.terrain,point)&&!w.buildings.some(b=>buildingBlocksStep(b,u,point))){
      p.x=next.x;p.y=next.y;p.h=terrain(p.x,p.y);Object.assign(u,point);
    }
  }
  const {state,effects}=context(w);stepCelebration(state,p,effects);w.randomState=state.randomState;
  u.heading=Math.PI-p.angle*Math.PI/1024;u.cargo=p.cargo/100;
  // Presentation remains grounded on the same resampled surface as other units.
  p.h=short(Math.round(height(w.terrain,u.x,u.z)*45));
}

// Presentation adapter: called after drawing at the selected 24 Hz native rate.
// Native rate configuration, visibility catch-up and footprint visuals are pending.
export function animateLivePeople(w:World){
  if(w.paused||(w.land.landFlags&2))return;
  for(const u of w.units)if(u.native)stepObjectAnimation(u.native,
    {counter:0,levelFlags:0,levelFlags2:w.levelFlags2},{frameCounts:sprites.frameCounts,modelFrames:[],morphDurations:[]},()=>{});
}
