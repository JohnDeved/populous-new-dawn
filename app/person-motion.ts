import rules from './original-rules.json' with {type:'json'};
import {nativeAngle} from './native-math.ts';

export type PersonFacing={x:number;y:number;physics:number;counter:number;flags2:number;
  turnAngle:number;turnY:number;heading:number;angle:number;slowTurn:number};
const short=(n:number)=>(n<<16)>>16;

// Ground-facing block in 0x4e6d00, before the first terrain-height query.
// Call before the person controller; airborne/impulse motion has other paths.
export function turnPerson(p:PersonFacing){
  if(p.flags2&0x84000)return;
  if(!(p.counter&3))p.flags2=(p.flags2|0x1000)>>>0;
  if((p.flags2&0x1000)&&!(p.flags2&0x800)){
    let target=p.flags2&128?p.turnAngle:p.turnAngle===p.x&&p.turnY===p.y?p.heading:
      nativeAngle(short(p.turnAngle-p.x),-short(p.turnY-p.y));
    let turning=false;
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
