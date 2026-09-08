import {nativeAngle,nativeStep,random} from './native-math.ts';
import {stopPersonMovement,type StatefulPerson,type PersonStateEffects} from './person-state.ts';
import {setAnimationObject,type Animation} from './animation.ts';
import rules from './original-rules.json' with {type:'json'};

type Point={x:number;y:number;h:number};
type BattleWorld={randomState:number;center:Point;directions:number[];populations:number[]};
type BattlePerson=StatefulPerson & Point & {link:number;displacement:Point};
type BattleEffect=Animation & {flags2:number;state:number;duration:number};
const short=(n:number)=>(n<<16)>>16;

// 0x4783a0: tribe-relative formation, including signed link/rank and ring widths.
export function specialBattlePosition(w:BattleWorld,rank:number,tribe:number){
  let angle=[0,1024,512,1536][w.directions[tribe]],distance:number;
  if(angle===undefined)throw new RangeError('Invalid native special-battle direction');
  let point={x:w.center.x,y:w.center.y};
  const step=(heading:number,length:number)=>{
    const q=nativeStep({x:point.x/256,z:-point.y/256},heading,short(length));
    point={x:Math.round(q.x*256)&65535,y:Math.round(-q.z*256)&65535};
  };
  if(rank<=0){
    if(rank<0){angle=angle-random(w)%284-142;distance=3776;}
    else{angle=(angle-142)&2047;distance=3392;}
  }else{
    const width=Math.max(6,Math.trunc(w.populations[tribe]/8)),row=Math.trunc((rank-1)/width);
    step(((rank-1)%width)*Math.trunc(170/width)+angle-85,2560);distance=short(row*160);
  }
  step(angle,distance);return point;
}

// Complete 0x4dfac0. Vehicle exit and allocation/class initialization are world
// consumers. Cell insertion and animation setters can use their native ports.
export function initializeSpecialBattle(w:BattleWorld,p:BattlePerson,effects:{
  leaveVehicle:()=>void;insert:(point:Point)=>void;height:(point:Point)=>number;
  allocate:(unitClass:number,model:number,tribe:number,point:Point)=>BattleEffect|null;
  initializeEffect:(effect:BattleEffect)=>void;releaseMotion:()=>void;setAnimation:PersonStateEffects['setAnimation'];
}){
  effects.leaveVehicle();
  if(p.model===7){p.substate=3;p.flags2=(p.flags2|0x40000000)>>>0;}
  else{
    effects.insert({...specialBattlePosition(w,short(p.link),p.tribe),h:0});p.h=effects.height(p);
    p.flags4=(p.flags4&~0x400)>>>0;p.displacement.x=p.displacement.y=p.displacement.h=0;
    const effect=effects.allocate(7,32,p.tribe,{x:p.x,y:p.y,h:p.h});
    if(effect){
      // 0x4ed6f0 is empty; state assignment precedes class initialization.
      if(!(effect.flags2&0x100000)){effect.state=36;effects.initializeEffect(effect);}
      effect.duration=15;setAnimationObject(effect,44,1401);
      effect.palette=p.tribe===-1?0:(rules.tribeEffectPalettes[p.tribe]-2)&255;
    }
    p.substate=1;p.renderFlags&=~16;p.flags2=(p.flags2|0x40000000)>>>0;
  }
  const angle=nativeAngle(short(w.center.x-p.x),-short(w.center.y-p.y));
  p.flags2=(p.flags2&~0x4000)>>>0;effects.releaseMotion();p.turnAngle=angle;p.flags2=(p.flags2|0x1080)>>>0;
  stopPersonMovement(p,effects.setAnimation);
}

// 0x478820: the active battle boundary uses a signed squared toroidal distance.
export function enforceSpecialBattleBoundary(center:Point & {substate:number;delay:number},p:Point & {life:number}){
  if(center.substate>1&&!center.delay){const dx=short(center.x-p.x),dy=short(center.y-p.y);if(((dx*dx+dy*dy)|0)>0x1440000)p.life=0;}
}
