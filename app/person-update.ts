import rules from './original-rules.json' with {type:'json'};
import {resetPersonMotion,type StatefulPerson} from './person-state.ts';
import {terrainPointHeight,type NativeTerrain} from './native-terrain.ts';
import {terrainSupportsPerson} from './person-collision.ts';

type PreparationPerson=StatefulPerson & {counter:number;slowTurn:number;goalX:number;goalY:number};
type PreparationEffects={initialize:()=>void;animation:()=>void;destination:(point:{x:number;y:number})=>void};
type HealthPerson=StatefulPerson & {h:number;life:number;maxLife:number;healthMarker:number};
type Ground=Pick<NativeTerrain,'heights'|'flags'|'categories'>;
const short=(n:number)=>(n<<16)>>16;

// Complete 0x4eefd0: terrain/impulse interruption cancels steering recovery.
export function resetInterruptedPersonMotion(p:StatefulPerson){if(p.flags2&0x482004)resetPersonMotion(p);}

// Tail at 0x4d4356, shared with the complete preparation routine below.
export function finishPersonPreparation(p:PreparationPerson,effects:Pick<PreparationEffects,'animation'|'destination'>){
  if(p.slowTurn){p.slowTurn=(p.slowTurn-1)&255;if(!p.slowTurn)effects.animation();}
  const flags=p.flags2;
  if(flags&0x80000000){p.flags2=(flags&0x7fffffff)>>>0;if(!(flags&128))effects.destination({x:p.goalX,y:p.goalY});}
}

// Complete 0x4d42a0, before reaction timers, eligibility and physics.
export function preparePersonTurn(p:PreparationPerson,gameFlags:number,effects:PreparationEffects){
  if((rules.personModels[p.model].flags&64)&&p.statusFlags){
    if(p.statusFlags===1){if(!(p.counter&3))p.statusFlags=0;}
    else p.statusFlags=(p.statusFlags-1)&255;
  }
  p.flags4=(p.flags4&~0x400000)>>>0;resetInterruptedPersonMotion(p);
  if(p.flags2&16){
    resetPersonMotion(p);
    if(!(p.flags2&0x100000)){
      p.previousState=p.state;p.state=(gameFlags&2)&&p.model===7?39:rules.personModels[p.model].nextState;
      effects.initialize();p.flags2=(p.flags2&~16)>>>0;
    }
  }
  finishPersonPreparation(p,effects);
}

// Complete 0x51fed0. The first counter advances on alternate object turns;
// the duration counter advances every turn. Preserve byte wrapping and order.
export function stepPersonReaction(p:{class:number;counter:number;flags4:number;reactionTimer:number;reactionDuration:number}){
  if(!(p.flags4&0x100000)||p.class===10)return;
  if(!(p.counter&1)){
    if(!p.reactionTimer)p.flags4=(p.flags4&~0x300000)>>>0;
    else p.reactionTimer=(p.reactionTimer-1)&255;
  }
  if(p.reactionDuration){
    p.reactionDuration=(p.reactionDuration-1)&255;
    if(!p.reactionDuration){p.reactionTimer=0;p.flags4=(p.flags4&~0x300000)>>>0;}
  }
}

// Complete 0x4eeff0, including transport/coastal exceptions and flag clearing.
export function personIsDrowning(land:Ground,p:HealthPerson){
  if((p.flags2&0x80002)||(rules.personPhysicsFlags[p.physics]&2)||p.h>terrainPointHeight(land,p))return false;
  const category=land.categories[((p.y&65535)>>9)*128+((p.x&65535)>>9)];
  if(terrainSupportsPerson(category,p)){p.flags4=(p.flags4&~0x1000000)>>>0;return false;}
  if(!(p.flags4&0x800000))return true;
  return !p.vehicle&&(!(rules.terrainCategoryFlags[category&15]&60)||!(p.flags4&0x1000000));
}

// Complete 0x4d43a0, after the state controller when its state allows health.
// State-2/3/31 initialization remains an explicit class/state consumer.
export function updatePersonHealth(land:Ground,p:HealthPerson,gameFlags:number,turn:number,initialize:()=>void){
  const transition=(state:number)=>{p.previousState=p.state;p.state=state;initialize();};
  if(personIsDrowning(land,p)){p.flags2=(p.flags2&~0x100000)>>>0;transition(2);}
  const flags=p.flags2;
  if(flags&0x80000)return;
  if(gameFlags&128){p.life=p.maxLife;return;}
  if(p.life<1){p.flags2=(flags&~0x100000)>>>0;transition(3);return;}
  if((rules.personModels[p.model].flags&8)&&!(turn&7)){
    if(p.life<p.maxLife)p.life=short(p.life+rules.personHealing[p.model]);
    else p.healthMarker=255;
    p.flags3=((p.maxLife>>2)<p.life?p.flags3&~0x1000:p.flags3|0x1000)>>>0;
  }
  if(flags&8){p.flags2=(flags&~8)>>>0;if(p.state!==31&&!(flags&0x100000))transition(31);}
}
