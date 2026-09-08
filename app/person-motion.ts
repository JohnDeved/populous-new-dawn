import rules from './original-rules.json' with {type:'json'};
import {nativeAngle} from './native-math.ts';

export type PersonFacing={x:number;y:number;physics:number;counter:number;flags2:number;
  turnAngle:number;turnY:number;heading:number;angle:number;slowTurn:number};
const short=(n:number)=>(n<<16)>>16;

// Ground-facing block in 0x4e6d00, before the first terrain-height query.
// Call before the person controller; airborne/impulse motion has other paths.
export function turnPerson(p:PersonFacing){
  if(p.flags2&0x84000)return false;
  let turning=false;
  if(!(p.counter&3))p.flags2=(p.flags2|0x1000)>>>0;
  if((p.flags2&0x1000)&&!(p.flags2&0x800)){
    let target=p.flags2&128?p.turnAngle:p.turnAngle===p.x&&p.turnY===p.y?p.heading:
      nativeAngle(short(p.turnAngle-p.x),-short(p.turnY-p.y));
    if(p.slowTurn||!(p.flags2&0x200800)){
      let delta=short(target)-short(p.heading),distance=Math.abs(delta);
      if(distance>1024){distance=2048-distance;delta+=delta<0?2048:-2048;}
      let amount=distance;
      if(p.slowTurn)amount=Math.trunc(short(distance)/p.slowTurn);
      else if(distance>short(rules.personTurning[p.physics])){amount=short(rules.personTurning[p.physics]);turning=true;}
      target=amount*Math.sign(delta)+p.heading;
      if(!p.slowTurn)target&=2047;
    }
    p.heading=target&65535;
    if(!turning)p.flags2=(p.flags2&~0x1000)>>>0;
  }
  if(!(p.flags2&32))p.angle=p.flags2&0x8000?(p.heading+1024)&2047:p.heading;
  return turning;
}

// 0x4e93f0 adds horizontal velocity, including its asymmetric slope speed.
export function groundVelocity(v:{x:number;y:number;z:number},p:{x:number;y:number},speed:number,angle:number,height:(x:number,y:number)=>number){
  if(!speed)return;
  angle&=2047;
  const aheadX=short(p.x+((rules.sine[angle]<<5)>>16)),aheadY=short(p.y+((rules.sine[(angle+512)&2047]<<5)>>16));
  const slope=height(p.x,p.y)-height(aheadX,aheadY);
  const extra=Math.imul(Math.max(1,Math.min(16,Math.abs(slope)))*16,speed)>>8;
  speed=Math.max(3,(speed+(slope<0?-extra:extra))|0);
  v.x=short(v.x+(Math.imul(rules.sine[angle],speed)>>16));
  v.z=short(v.z+(Math.imul(rules.sine[(angle+512)&2047],speed)>>16));
}

// 0x4e7a10: the original square test uses 65535 when folding the seam.
export function positionsOverlap(a:{x:number;y:number},ar:number,b:{x:number;y:number},br:number){
  const delta=(a:number,b:number)=>{const d=Math.abs(short(a)-short(b));return d>32767?65535-d:d;};
  return delta(a.x,b.x)<ar+br&&delta(a.y,b.y)<ar+br;
}

export type RecoveryPerson=PersonFacing & {h:number;speed:number;flags4:number;
  motionTimer:number;motionMode:number;recoveryCounter:number;supportHeight:number};
const signedByte=(n:number)=>(n<<24)>>24;

// 0x4e9950: timed steering recovery, including the two-stage building exit.
// Building occupancy/access and entrance geometry are supplied by the world.
export function stepMotionRecovery(p:RecoveryPerson,onBuilding:boolean,blocks:()=>boolean,route:(outside:boolean)=>{x:number;y:number}){
  if(!(p.flags2&0x800)){
    if(signedByte(p.recoveryCounter)<=99)p.recoveryCounter=(p.recoveryCounter+1)&255;
    return;
  }
  let finished=false;
  if(!(p.flags2&0x20000000)){p.motionTimer=short(p.motionTimer-1);finished=p.motionTimer<=0;}
  else if(!onBuilding||((p.flags4&0x10007)&&!blocks())){p.motionTimer=0;finished=true;}
  else if(p.motionTimer<2){
    // A negative timer in this branch reads an uninitialized native point.
    if(p.motionTimer<0)throw new RangeError('Invalid building recovery timer');
    let point={x:0,y:0};
    if(p.motionTimer===0){
      point=route(false);
      if(Math.abs(short(point.x)-short(p.x))<=111&&Math.abs(short(point.y)-short(p.y))<=111){p.supportHeight=0;p.motionTimer++;}
    }
    if(p.motionTimer===1)point=route(true);
    p.heading=nativeAngle(short(point.x-p.x),-short(point.y-p.y));
  }
  if(finished){p.recoveryCounter=0;p.motionTimer=0;p.flags2=((p.flags2&0xdffff7ff)|0x1000)>>>0;}
  else if(!(p.flags2&128)&&!(p.counter&31))p.flags2=(p.flags2|0x80000000)>>>0;
}

// 0x4e9720: probe eleven alternating headings at speed, then twice speed.
// Candidate height, collision and the starting building cell are world queries.
export function recoverGroundObstacle(p:RecoveryPerson,to:{x:number;y:number;h:number},onBuilding:boolean,
  height:(x:number,y:number)=>number,blocked:(to:{x:number;y:number;h:number})=>number){
  p.flags2=(p.flags2|0x800)>>>0;
  if(signedByte(p.recoveryCounter)<65){if(signedByte(p.motionMode)<48)p.motionMode=(p.motionMode+1)&255;}
  else{p.motionMode=0;p.flags2=(p.flags2|0x80000000)>>>0;}
  Object.assign(to,{x:p.x,y:p.y,h:p.h});
  if(onBuilding){p.flags2=(p.flags2|0x20000000)>>>0;p.motionTimer=0;return true;}
  for(let pass=1;pass<=2;pass++){
    let direction=p.motionMode&1?1:-1;
    for(let attempt=0;attempt<11;attempt++,direction=-direction){
      const angle=(p.heading+170*((attempt>>1)+1)*direction)&2047,velocity={x:0,y:0,z:0};
      groundVelocity(velocity,p,p.speed*pass,angle,height);
      const point={x:(p.x+velocity.x)&65535,y:(p.y+velocity.z)&65535,h:0};point.h=height(point.x,point.y);
      if(!blocked(point)){
        if(p.motionTimer<1)p.motionTimer=short((signedByte(p.motionMode)+1)*((attempt>>1)+1))>>1;
        p.heading=angle;Object.assign(to,point);return true;
      }
    }
  }
  return false;
}
