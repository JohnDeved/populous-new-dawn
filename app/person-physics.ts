import rules from './original-rules.json' with {type:'json'};
import {terrainSlopeRange,hasNonLand,type NativeTerrain} from './native-terrain.ts';

type Position={x:number;y:number};
type Velocity={x:number;y:number;z:number};
type Ground=Pick<NativeTerrain,'heights'|'flags'|'categories'|'walkMasks'>;
const short=(n:number)=>(n<<16)>>16;

// 0x4e78f0 / 0x4e7980: ordinary and impulse velocity caps, respectively.
export function limitPersonVelocity(physics:number,v:Velocity,impulse=false){
  const [xy,vertical]=impulse?rules.personImpulseLimits[physics]:[short(rules.personVelocityLimits[physics]),short(rules.personVerticalLimits[physics])];
  v.x=Math.min(xy,Math.max(-xy,v.x));v.z=Math.min(xy,Math.max(-xy,v.z));v.y=Math.min(vertical,Math.max(-vertical,v.y));
}

// 0x4e7880: model flag 8 chooses triangle slope instead of the active walk map.
export function unsupportedGround(land:Ground,p:Position,physics:number,mask=0){
  if(rules.personPhysicsFlags[physics]&8)return terrainSlopeRange(land,p)>short(rules.personSlopeLimits[physics]);
  const bit=((p.y>>>8)&255)*256+((p.x>>>8)&255);
  return !(land.walkMasks[mask][bit>>3]&(1<<(bit&7)));
}

// 0x4e9050: terrain-change/impulse flags trigger airborne eligibility.
export function markPersonAirborne(land:Ground,p:Position & {physics:number;flags2:number},mask=0){
  if((p.flags2&0x2004)&&unsupportedGround(land,p,p.physics,mask)){p.flags2=(p.flags2|0x80000)>>>0;return true;}
  return false;
}

export type SettlingPerson=Position & {class:number;model:number;physics:number;state:number;previousState:number;
  flags2:number;flags3:number;flags4:number;motionTimer:number;motionMode:number;target:number;velocity:Velocity};
export type SettleEffects={animation:()=>void;release:()=>void;initialize:()=>void;class3:()=>void;
  canFight:(target:number)=>boolean;readyToFight:()=>boolean};

// 0x4e9160: leave airborne motion, restore the correct state or resume a fight.
// State release/initialization, fight consumers and the class-3 consumer are
// explicit boundaries; this routine does not stand in for the whole physics loop.
export function settlePerson(land:Ground,p:SettlingPerson,to:Position,gameFlags:number,
  objects:ReadonlyMap<number,{class:number;flags2:number}>,effects:SettleEffects,mask=0){
  let settle=false;
  if(!(p.flags4&0x400)&&!unsupportedGround(land,to,p.physics,mask)){
    const speed=short(rules.personSpeeds[p.physics]),v=p.velocity;
    settle=((Math.imul(v.x,v.x)+Math.imul(v.z,v.z))|0)<=((Math.imul(speed,speed)+Math.trunc(speed/4))|0);
  }
  if(!settle&&(p.flags3&0x8000000))settle=hasNonLand(land,((to.x>>>8)&254)|(to.y&0xfe00),1);
  if(!settle)return;
  const flags2=p.flags2,flags3=p.flags3;
  p.flags2=(flags2&~0x80000)>>>0;p.flags3=(flags3&~0x8000000)>>>0;
  if(p.flags4&0x2000){if(p.class===1)effects.animation();p.flags4=(p.flags4&~0x2000)>>>0;return;}
  if(flags3&0x10000){
    p.flags3=(flags3&0xf7feffff)>>>0;
    const target=p.target?objects.get(p.target):undefined;
    if(!target||!target.class||(target.flags2&1)||!effects.canFight(p.target)||!effects.readyToFight()||(p.flags2&0x100000))return;
    p.previousState=p.state;effects.release();p.state=36;effects.initialize();return;
  }
  if(p.class!==1){if(p.class===3)effects.class3();return;}
  p.motionTimer=0;p.motionMode=0;p.flags2=((flags2&0xdff7f7ff)|0x1000)>>>0;
  if(flags2&0x100000)return;
  p.previousState=p.state;
  const next=(gameFlags&2)&&p.model===7?39:rules.personModels[p.model].nextState;
  effects.release();p.state=next;effects.initialize();
}
