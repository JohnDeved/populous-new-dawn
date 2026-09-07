import {stepTribeCastCooldown,type TribeCasting} from './spell-casting.ts';

export type TribeTurnState = {active:boolean;defeatTimer:number;flags2:number;playerType:number};

// Complete 0x461510, including 0x419480's signed defeat-timer comparison.
// All four cooldowns precede the configured tribes' work, even if AI is disabled.
// The outer loop calls this before 0x4ec6f0 increments the simulation turn.
export function processTribes(world:{landFlags:number;loadFlags:number;gameFlags:number;levelFlags2:number;tribeCount:number},
  tribes:TribeTurnState[],casting:TribeCasting[],effects:{computer:(id:number)=>void;territory:(id:number)=>void}) {
  if((world.landFlags&2)||(world.loadFlags&0x200))return;
  for(let id=0;id<4;id++)stepTribeCastCooldown(casting[id],tribes[id].active,world.landFlags,world.loadFlags);
  if((world.gameFlags&32)||(world.levelFlags2&0x100000))return;
  for(let id=0;id<world.tribeCount;id++) {
    const t=tribes[id];
    if(!t.active||(t.defeatTimer|0)>=97||(t.flags2&64))continue;
    if(t.playerType===1)effects.computer(id);
    else effects.territory(id);
  }
}
