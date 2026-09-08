import rules from './original-rules.json' with {type:'json'};
import {nativeAngle,random,spiralCell} from './native-math.ts';
import {randomPersonSpeed} from './person-state.ts';

export type Celebrant={id:number;class:number;model:number;state:number;substate:number;tribe:number;counter:number;
  x:number;y:number;h:number;flags2:number;flags3:number;flags4:number;physics:number;speed:number;
  timer:number;target:number;link:number;assignment:number;cargo:number;vehicle:number;stateObject:number;
  animationMode:number;commandAux:number;commandPhase:number;angle:number;turnAngle:number;heading:number;
  anchorX:number;anchorY:number;renderFlags:number;f1:number;f2:number};
export type CelebrationWorld={randomState:number;people:Map<number,Celebrant>;shamans:number[];
  cellPeople:(cell:number)=>Celebrant[]};
export type CelebrationEffects={
  animation:(p:Celebrant,object:number,upper:boolean)=>void;
  animationTiming:(p:Celebrant)=>{hold:number;duration:number};
  releaseMotion:(p:Celebrant)=>void;destination:(p:Celebrant,to:{x:number;y:number})=>void;
  dropLog:(p:Celebrant)=>boolean;sound:(p:Celebrant,cue:number)=>void;leaveBuilding:(p:Celebrant)=>void;
  projectile:(p:Celebrant,to:{x:number;y:number;h:number})=>void;
};
const short=(n:number)=>(n<<16)>>16,byte=(n:number)=>(n<<24)>>24;
const cell=(p:{x:number;y:number})=>((p.x>>>8)&254)|(p.y&0xfe00);
const bearing=(a:{x:number;y:number},b:{x:number;y:number})=>nativeAngle(short(b.x-a.x),-short(b.y-a.y));
const transition=(p:Celebrant,phase:number)=>{p.substate=phase;p.flags2=(p.flags2|0x40000000)>>>0;};
const enter=(p:Celebrant)=>{const yes=!!(p.flags2&0x40000000);p.flags2=(p.flags2&~0x40000000)>>>0;return yes;};
const step=(p:{x:number;y:number;h:number},angle:number,length:number)=>({...p,
  x:(p.x+(Math.imul(rules.sine[angle&2047],length)>>16))&65535,
  y:(p.y+(Math.imul(rules.sine[(angle+512)&2047],length)>>16))&65535});
function row(p:Celebrant,r:number){
  if(p.flags2&0x80000){r=p.flags4&0x400?12:2;if(r===2)p.flags2=(p.flags2&~0x8000)>>>0;}
  return rules.personAnimationObjects[r*9+p.model];
}
function face(p:Celebrant,angle:number,e:CelebrationEffects,immediate=false){
  e.releaseMotion(p);p.turnAngle=angle&2047;p.flags2=(p.flags2|0x1080)>>>0;
  if(immediate){p.heading=p.turnAngle;p.angle=(p.turnAngle+(p.flags2&0x8000?1024:0))&2047;}
}
function dance(p:Celebrant,e:CelebrationEffects){
  // These three callers truncate and zero-extend the table entry to a byte.
  e.animation(p,rules.personAnimationObjects[(p.cargo?4:7)*9+p.model]&255,true);
  if(!p.cargo){p.f2=0;p.f1=e.animationTiming(p).hold;}
  p.assignment|=128;
}

// 0x4e2610, used by both chain leaders and their followers.
export function setChainAction(p:Celebrant,action:number,e:CelebrationEffects){
  if(action===0||action===1){
    p.speed=action===0?(p.substate===5?40:80):0;
    e.animation(p,row(p,action===0?(p.cargo?5:1):(p.cargo?4:0)),true);p.f2=0;p.f1=1;
  }else if(action===2||action===3){
    p.speed=0;e.animation(p,rules.personAnimationObjects[7*9+p.model],false);
    p.f2=action===2?0:1;p.renderFlags|=2;p.f1=0;
  }
}

// 0x4e0af0. Cell/object lists and animation, movement and allocation consumers
// are explicit inputs; this controller does not replace the person physics loop.
export function stepCelebration(w:CelebrationWorld,p:Celebrant,e:CelebrationEffects){
  const same=(q:Celebrant)=>q.class===1&&q.tribe===p.tribe&&q.state===41;
  const here=()=>w.cellPeople(cell(p));
  const faceShaman=()=>{const s=w.people.get(w.shamans[p.tribe]);if(!(p.counter&3)&&s)face(p,bearing(p,s),e);};
  switch(p.substate){
    case 0:
      if(enter(p)){
        p.stateObject=p.link=p.target=0;
        let cargo=short(p.cargo);
        while(cargo>0){if(!e.dropLog(p))break;cargo-=100;e.sound(p,11);}
        p.cargo=short(Math.max(0,cargo));p.speed=0;e.animation(p,row(p,p.cargo?4:0),true);
        if(p.flags2&0x800000){e.leaveBuilding(p);p.flags2=(p.flags2&~16)>>>0;}
        transition(p,p.model===7?8:p.vehicle?7:1);p.animationMode=0;p.assignment|=16;
      }
      break;
    case 1:{
      let moving=false,newMove=false,finished=false;
      if(enter(p)){p.assignment|=16;p.timer=0;p.animationMode=0;p.commandAux=0;}
      if(p.animationMode===0){
        if(p.assignment&16){
          p.assignment&=~16;p.commandPhase=(random(w)&7)+8;p.timer=p.commandPhase;
          e.animation(p,rules.personAnimationObjects[25*9+p.model],true);p.speed=randomPersonSpeed(w,p);newMove=true;
        }
        moving=true;p.commandPhase=byte(p.commandPhase-1);finished=p.commandPhase<1;
      }else if(p.animationMode===1){
        if(p.assignment&16){
          p.assignment&=~16;p.commandPhase=(random(w)&15)+16;dance(p,e);
          p.speed=short(Math.trunc(randomPersonSpeed(w,p)/3));
        }
        moving=true;p.commandPhase=byte(p.commandPhase-1);finished=p.commandPhase<1;
      }else if(p.animationMode===2){
        if(p.assignment&16){p.speed=0;p.assignment&=~16;p.commandPhase=(random(w)&15)+16;e.animation(p,rules.personAnimationObjects[3*9+p.model],true);}
        faceShaman();p.commandPhase=byte(p.commandPhase-1);finished=p.commandPhase<1;
      }
      if(moving||newMove){
        p.timer=short(p.timer-1);
        if(p.timer<1||newMove){
          p.timer=(random(w)&15)+6;
          const a=bearing(p,{x:p.anchorX,y:p.anchorY});face(p,a+random(w)%1422-711,e);
        }
      }
      if(!finished&&p.animationMode===1){
        let movingCount=0,followers=0,leader:Celebrant|undefined;
        for(const q of here())if(q!==p&&same(q)){
          if(q.substate===1&&(q.animationMode===0||q.animationMode===1))movingCount++;
          else if(q.substate===3)leader=q;
          else if(q.substate===4)followers++;
        }
        if(followers<7&&(leader||movingCount>2)){p.speed=0;transition(p,leader?4:3);}
      }
      if(!finished)break;
      const previous=p.commandAux;p.commandAux=(previous+1)&255;
      let noNeighbors=previous>=4,mode=0;
      if(!noNeighbors){
        const weights=rules.celebrationWeights.map(r=>[...r]);let count=0;
        for(const c of [...Array.from({length:8},(_,i)=>spiralCell(cell(p),i,0)),cell(p)])
          for(const q of w.cellPeople(c))if(q!==p&&same(q)&&q.substate===1){
            const dx=short(p.x-q.x),dy=short(p.y-q.y);
            if(((dx*dx+dy*dy)>>>0)<160001){count++;const r=weights[q.animationMode];r[0]=short(r[0]+r[2]);}
          }
        noNeighbors=count===0;
        if(!noNeighbors){weights.sort((a,b)=>a[0]-b[0]);mode=weights[0][1];}
      }
      if(noNeighbors){p.commandAux=0;if(p.animationMode===0)mode=(random(w)&7)<4?1:2;}
      p.assignment|=16;p.animationMode=mode;
      if(p.model===6&&!(random(w)&3))transition(p,2);
      break;
    }
    case 2:
      if(enter(p)){p.animationMode=1;p.assignment|=16;}
      if(p.animationMode===1){
        if(p.assignment&16){
          p.speed=0;p.assignment&=~16;e.animation(p,row(p,15),true);p.f2=0;p.f1=1;
          p.timer=short(e.animationTiming(p).duration);
          const target=step(p,p.heading,1280);target.h=short(target.h+3072);e.projectile(p,target);
        }
        p.timer=short(p.timer-1);if(!p.timer){p.animationMode=2;p.assignment|=16;}
      }else if(p.animationMode===2){
        if(p.assignment&16){p.assignment&=~16;e.animation(p,row(p,15),true);p.f1=1;p.f2=0;p.renderFlags|=2;p.timer=16;}
        p.timer=short(p.timer-1);if(!p.timer)transition(p,1);
      }
      break;
    case 3:{
      if(enter(p)){p.commandPhase=(random(w)&31)+40;p.timer=random(w)&2047;dance(p,e);p.speed=randomPersonSpeed(w,p);}
      let count=0;
      for(const q of here())if(same(q)&&(q.substate===3||q.substate===4)){q.flags3=(q.flags3|16)>>>0;count++;}
      if(!count)p.commandPhase=0;
      else{
        const center={x:(p.x&0xfe00)+256,y:(p.y&0xfe00)+256,h:p.h},spacing=Math.trunc(2048/count);let a=p.timer;
        for(const q of here())if(q.flags3&16){
          q.flags3=(q.flags3&~16)>>>0;q.flags2=(q.flags2|0x200200)>>>0;
          const target=step(center,a,128);
          if(Math.abs(short(target.x)-short(q.x))<12&&Math.abs(short(target.y)-short(q.y))<12){q.speed=0;face(q,bearing(q,center),e,true);}
          else{e.destination(q,target);if(!q.speed)q.speed=randomPersonSpeed(w,q);}
          a=(a+spacing)&2047;
        }
        if(count>5)transition(p,5);
      }
      if(!(p.counter&7))p.timer=(p.timer+91)&2047;
      p.commandPhase=byte(p.commandPhase-1);if(p.commandPhase<1)transition(p,1);
      break;
    }
    case 4:{
      let count=0,leader:Celebrant|undefined;
      for(const q of here())if(same(q)){if(q.substate===3)leader=q;else if(q.substate===4)count++;}
      if(!leader||count>6)transition(p,1);
      else if(enter(p)){dance(p,e);p.speed=randomPersonSpeed(w,p);p.f2=leader.f2;p.f1=leader.f1;}
      break;
    }
    case 5:{
      const started=enter(p);
      if(started){p.animationMode=0;p.assignment|=16;p.timer=(random(w)&255)+256;p.link=0;}
      let recruit=started;
      const action=p.animationMode,record=rules.celebrationChain[action],changed=!!(p.assignment&16);
      if(changed){p.assignment&=~16;p.commandPhase=record[0];}
      p.commandPhase=byte(p.commandPhase-1);
      if(p.commandPhase<1){p.assignment|=16;p.animationMode=record[2];}
      if(changed)setChainAction(p,p.animationMode,e);
      if(changed&&record[4])face(p,p.heading+random(w)%1137-568,e);
      let valid=true,previous=p;
      for(let q=w.people.get(p.link);q;q=w.people.get(q.link)){
        if(q.state!==41||q.substate!==6){valid=false;break;}
        if(changed)setChainAction(q,action,e);
        if(!record[3])face(q,bearing(q,previous),e,true);
        else{q.flags2=(q.flags2|0x200200)>>>0;e.destination(q,step(previous,bearing(previous,q),96));}
        previous=q;
      }
      if(!valid)p.timer=0;
      else{
        if(!(p.counter&7))recruit=true;
        if(recruit){
          let lastCell=-1;
          for(let q:Celebrant|undefined=p;q;q=w.people.get(q.link)){
            const c=cell(q);if(c===lastCell)continue;lastCell=c;
            for(const other of w.cellPeople(c))if(same(other)&&[1,2,3,4].includes(other.substate)){
              transition(other,6);other.target=p.id;other.link=0;
            }
          }
        }
      }
      p.timer=short(p.timer-1);if(p.timer<1){p.link=0;transition(p,1);}
      break;
    }
    case 6:{
      let leader=w.people.get(p.target);
      if(leader&&((leader.flags2&1)||!leader.class||leader.substate!==5))leader=undefined;
      if(enter(p)){
        p.link=0;
        if(leader){
          if(!leader.link)leader.link=p.id;
          else for(let q=w.people.get(leader.link);q&&q!==p;q=w.people.get(q.link)){if(!q.link){q.link=p.id;break;}}
        }
      }
      if(!leader){p.link=0;transition(p,1);p.target=0;}
      break;
    }
    case 7:
      if(enter(p))e.animation(p,rules.personAnimationObjects[3*9+p.model],true);
      faceShaman();if(!p.vehicle){transition(p,1);p.animationMode=0;p.assignment|=16;}
      break;
    case 8:
      if(enter(p)){p.speed=0;e.animation(p,row(p,p.cargo?4:0),true);p.timer=0;}
      p.timer=short(p.timer-1);
      if(p.timer<1){p.timer=(random(w)&31)+32;face(p,random(w)&2047,e);}
      break;
  }
}
