import {setAnimationObject,type AnimatedUnit} from './animation.ts';
import {terrainPointHeight,type NativeTerrain} from './native-terrain.ts';
import {limitPersonVelocity} from './person-physics.ts';
import {random} from './native-math.ts';
import rules from './original-rules.json' with {type:'json'};

type Ground=Pick<NativeTerrain,'heights'|'flags'>;
export type SpellTrail=AnimatedUnit & {
  x:number;y:number;h:number;state:number;remaining:number;flags2:number;flags4:number;
  speed:number;yaw:number;pitch:number;velocity:{x:number;y:number;z:number};
};
const short=(n:number)=>(n<<16)>>16;

// Effect 3 / 4 initializers, 0x50bf60 / 0x50c380, after common allocation.
// counter is the class-7 allocation byte; the RNG is 0x89bc72, not game RNG.
export function createSpellTrail(land:Ground,position:{x:number;y:number;h:number},model:3|4,counter:number,cosmetic:{randomState:number}):SpellTrail{
  const p:SpellTrail={...position,x:position.x&65535,y:position.y&65535,
    object:0,draw:0,morph:0,palette:0,renderFlags:0,f1:model===4?(counter&3)*4:0,f2:0,
    stamp:0,flags3:0,morphTimer:0,morphFrames:0,state:model===3?3:5,remaining:4,
    flags2:model===3?0x40180:0x40080,flags4:model===3?0x100:0,
    speed:model===3?20:0,yaw:0,pitch:0,velocity:{x:0,y:0,z:0}};
  p.h=Math.max(short(p.h),terrainPointHeight(land,p));
  setAnimationObject(p,1,model===3?314:322);
  if(model===3)random(cosmetic);
  return p;
}

// 0x4e7a80's directed, gravity-free path used by these freshly allocated
// trails. Impulses/ballistic debris require the other physics branches.
function moveTrail(land:Ground,p:SpellTrail){
  if(p.flags2&0x4000)return;
  if((p.flags2&0x82000)||!(p.flags2&0x80)||!(p.flags2&0x40000))throw new Error('Unported trail motion flags');
  const v=p.velocity;v.x=v.y=v.z=0;
  if(p.speed>=0){
    const horizontal=Math.imul(rules.sine[p.pitch&2047],p.speed)>>16;
    v.x=short(Math.imul(rules.sine[p.yaw&2047],horizontal)>>16);
    v.z=short(Math.imul(rules.sine[(p.yaw+512)&2047],horizontal)>>16);
    v.y=short(Math.imul(rules.sine[(p.pitch+512)&2047],p.speed>>1)>>16);
    const decay=(v:number)=>short(Math.abs(v)<2?0:v<=0?v+2:v-2);
    v.x=decay(v.x);v.z=decay(v.z);limitPersonVelocity(10,v);
    p.x=(p.x+v.x)&65535;p.y=(p.y+v.z)&65535;p.h=short(p.h+v.y);
  }
  const ground=terrainPointHeight(land,p);
  p.flags4=(p.flags4|0x400)>>>0;
  if(p.h<=ground){p.flags4&=~0x400;v.y=0;}
  if(!(p.flags2&2))p.h=Math.max(p.h,ground);
}

// 0x50bd70 -> 0x50beb0, then 0x50a750 state 4. Physics runs before expiry.
export function stepSpellTrail(land:Ground,p:SpellTrail){
  moveTrail(land,p);
  if(p.state===4){p.remaining=short(p.remaining-1);return p.remaining>0;}
  if(p.remaining>=0){
    p.remaining=short(p.remaining-1);
    if(p.remaining<1){
      if(p.flags4&0x200)return false;
      if(!(p.flags2&0x100000))p.state=4;
      const flags=p.renderFlags;
      setAnimationObject(p,((p.palette<<24)>>24)>-16?29:1,short(p.object)+4);
      p.renderFlags=(p.renderFlags&~0xc050)|(flags&0x4050);
      p.f1=0;p.flags2=(p.flags2&~0x10000000)>>>0;p.remaining=3;
    }
  }
  return true;
}
