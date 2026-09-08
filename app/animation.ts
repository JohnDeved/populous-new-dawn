import rules from './original-rules.json' with {type:'json'};
import {random} from './native-math.ts';

export type Animation={object:number;draw:number;morph:number;palette:number;renderFlags:number;f1:number;f2:number};
export type AnimatedUnit=Animation & {stamp:number;flags3:number;morphTimer:number;morphFrames:number};
export type AnimationData={frameCounts:ArrayLike<number>;modelFrames:readonly (readonly number[])[];morphDurations:ArrayLike<number>};
export type PersonAnimation=Animation & {model:number;state:number;flags2:number;flags3:number;flags4:number;assignment:number;tribe:number;vehicle:number};
const short=(n:number)=>(n<<16)>>16;

// Complete 0x4d6b10. Uses the separate 0x89bc72 RNG, never simulation RNG.
export function stepPersonPose(p:Animation & {animationMode:number;assignment:number;commandPhase:number},poseRandom:{randomState:number}){
  if(p.animationMode===1){
    if(p.assignment&16){p.renderFlags&=~2;p.assignment&=~16;p.f1=0;p.f2=0;}
    else if(!p.f2&&!p.f1){p.animationMode=2;p.assignment|=16;}
  }
  if(p.animationMode===2){
    if(p.assignment&16){p.renderFlags|=2;p.assignment&=~16;p.f1=0;p.f2=0;p.commandPhase=(random(poseRandom)&7)+4;}
    p.commandPhase=(p.commandPhase-1)&255;
    if(!p.commandPhase){p.animationMode=1;p.assignment|=16;}
  }
}

// 0x4ee700. Changing objects deliberately retains f2 and may retain f1.
export function setAnimationObject(s:Animation,draw:number,object:number){
  draw&=255;const d=rules.animationDescriptors[draw];
  if(!d)throw new RangeError(`Unimported animation descriptor ${draw}`);
  s.object=object&65535;s.draw=draw;s.morph=0;s.renderFlags=d.flags|256;s.palette=d.palette;
  if(d.hold*4<=(s.f1&65535)||d.reset)s.f1=0;
}

// 0x4ee7b0, including model-sequence and morph clocks. Rendering stamps and
// the loaded frame/morph tables are supplied by their native world consumers.
export function stepObjectAnimation(p:AnimatedUnit,w:{counter:number;levelFlags:number;levelFlags2:number},data:AnimationData,footprints:()=>void){
  if(p.object===0x650||(p.renderFlags&2))return;
  const d=rules.animationDescriptors[p.draw],visible=p.stamp===w.counter||!(p.flags3&0x40000);
  switch(d.mode){
    case 1:
      if(visible){
        p.f1=short(p.f1+d.step);
        if(d.hold*4<=(p.f1&65535)){
          p.f1=short(p.f1-d.hold*4);
          if([1099,1108,1180,1194,1240,1264,1304].includes(p.object))p.object=0x650;
        }
      }
      break;
    case 2:
      if(visible){
        if(!p.f1){p.f1=d.step;p.f2=(p.f2+1)&255;if(data.frameCounts[short(p.object)]<=p.f2)p.f2=0;}
        else p.f1=short(p.f1-1);
        if([0,40,72,216].includes(p.object)&&!(w.levelFlags2&0x10000)&&!(w.levelFlags&8))footprints();
      }
      break;
    case 3:{
      const frames=data.modelFrames[p.morph];p.f1=short(p.f1+d.step);
      if(((frames[8]<<24)>>24)*4<=(p.f1&65535))p.f1=0;
      p.object=frames[(p.f1&65535)>>>2];
      break;
    }
    case 4:
      if(p.renderFlags&0x1000){
        p.morphTimer=short(p.morphTimer+d.step);
        if(p.morphFrames*4<=p.morphTimer)p.renderFlags=(p.renderFlags&~0x800)|0x400;
      }else if(!((p.renderFlags&0x400)&&!(p.renderFlags&0x800))&&visible){
        p.f1=short(p.f1+d.step);
        if(data.morphDurations[p.morph]*4+4<=(p.f1&65535))p.f1=0;
      }
      break;
  }
}

// 0x4ee770 visits the two allocation lists in order and honors native pause.
export function stepAnimations(lists:readonly (readonly AnimatedUnit[])[],landFlags:number,w:{counter:number;levelFlags:number;levelFlags2:number},data:AnimationData,footprints:(p:AnimatedUnit)=>void){
  if(landFlags&2)return;
  for(const list of lists)for(const p of list)stepObjectAnimation(p,w,data,()=>footprints(p));
}

// 0x4d4040: the upper-body setter also handles vehicle poses and visibility.
export function setPersonAnimation(p:PersonAnimation,object:number,w:{playerTribe:number;gameFlags:number;sessionSubstate:number|null;
  tribes:{flags:number;playerType:number}[];objects:Map<number,{flags2:number;class:number;passenger:number;speed:number}>},data:Pick<AnimationData,'frameCounts'>){
  const previous=p.renderFlags,assignment=p.assignment;p.assignment&=~128;
  const set=(id:number)=>{const [start,draw]=rules.animationObjects[id];setAnimationObject(p,draw,start);};
  if((p.flags4&0x800000)&&p.vehicle&&![11,14,41].includes(p.state)&&!(assignment&0x200)){
    set(rules.personAnimationObjects[24*9+p.model]);p.f1=0;p.renderFlags|=2;p.f2=0;
    const passengerId=w.objects.get(p.vehicle)!.passenger;
    const passenger=passengerId?w.objects.get(passengerId):undefined;
    if(passenger&&!(passenger.flags2&1)&&passenger.class&&passenger.speed)p.renderFlags&=~2;
  }else set(object);
  if(p.state===33&&w.tribes[p.tribe].playerType!==1&&!(p.flags2&0x80000)){
    set(rules.personAnimationObjects[7*9+p.model]);p.renderFlags|=2;p.f1=0;p.f2=1;
  }
  if(rules.personModels[p.model].flags&1)p.renderFlags|=128;
  if(data.frameCounts[short(p.object)]<=p.f2)p.f2=0;
  if((p.flags4&0x800)&&p.tribe===w.playerTribe)p.renderFlags|=0x4000;
  if(p.flags4&0x1000){
    if(w.tribes[w.playerTribe].flags&8)p.renderFlags|=0x4000;
    else p.renderFlags|=p.tribe===w.playerTribe?0x4000:16;
    if(p.model===7&&(w.tribes[p.tribe].flags&0x80000))p.renderFlags|=16;
  }
  if((w.gameFlags&2)&&(previous&16)&&w.sessionSubstate!==null&&w.sessionSubstate<2)p.renderFlags|=16;
}
