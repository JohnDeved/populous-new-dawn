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

export type OutcomePerson = {model:number;state:number;previousState:number;flags2:number;flags3:number;hp:number};
export type OutcomeWorld = {turn:number;landFlags:number;playerTribe:number;campaignTribes:number;level:number;
  progressFlags:number;lastDefeated:number;defeatedCounts:number[];alliances:number[]};

// 0x418e30. Caller 0x4ec6f0 supplies the load/special-mode gates. Population
// counts and person-list order come from the previous native counter rebuild.
export function processOutcome<P extends OutcomePerson>(w:OutcomeWorld,
  tribes:(TribeTurnState & {flags:number;population:number;people:P[]})[],effects:{
    camera:(tribe:number)=>void;defeat:(tribe:number)=>void;reveal:()=>void;cancelInput:()=>void;
    completeLevel:(index:number)=>void;networkResult:(allied:boolean,survivors:number)=>void;
    releasePerson:(p:P)=>void;initPerson:(p:P)=>void;damage:(p:P,amount:number)=>void;
  }) {
  if((w.turn&15)||(w.turn>>>0)<=16)return;
  for(const t of tribes)if(t.defeatTimer&&t.active&&(t.defeatTimer|0)<96)t.defeatTimer=(t.defeatTimer+16)|0;
  const setResult=(bit:number)=>{w.landFlags=((w.landFlags&~0x6000000)|bit)>>>0;};
  const defeat=(id:number)=>{
    w.lastDefeated=id; // 0x41b8b0 prefix, consumed by the campaign's camera request.
    effects.defeat(id);
  };
  const celebrate=(id:number)=>{
    for(const p of tribes[id].people)if(p.model!==8&&!(p.flags2&0x100000)) {
      p.previousState=p.state;effects.releasePerson(p);p.state=41;effects.initPerson(p);
    }
  };
  if(w.landFlags&8) {
    let survivors=0,last=-1;
    for(let id=0;id<4;id++) {
      const t=tribes[id];
      if(t.defeatTimer||!t.active)continue;
      if(t.population===0) {
        t.defeatTimer=1;
        if(w.playerTribe===id) {
          effects.camera(id);setResult(0x4000000);
          if(w.landFlags&8)effects.reveal();
          effects.cancelInput();
        }
        defeat(id);
      }else{survivors++;last=id;}
    }
    const winner=(id:number)=>{
      const t=tribes[id];
      if(!(t.flags2&1)){t.flags2=(t.flags2|1)>>>0;celebrate(id);}
      if(w.playerTribe===id&&!(w.landFlags&0x6000000)){setResult(0x2000000);effects.cancelInput();}
    };
    let allied=false;
    if(survivors<2){if(last!==-1)winner(last);}
    else {
      allied=true;
      for(let a=0;a<4&&allied;a++)if(!tribes[a].defeatTimer&&tribes[a].active)
        for(let b=a+1;b<4&&allied;b++)if(!tribes[b].defeatTimer&&tribes[b].active)
          allied=!!(w.alliances[a]&(1<<b))&&!!(w.alliances[b]&(1<<a));
      if(allied)for(let id=0;id<4;id++)if(!tribes[id].defeatTimer&&tribes[id].active)winner(id);
    }
    effects.networkResult(allied,survivors);return;
  }
  const player=tribes[w.playerTribe];
  if(player.defeatTimer)return;
  if(player.population!==0&&!(player.flags&0x20000)) {
    let allDefeated=true,newDefeat=false;
    // Campaign opponents start at tribe one; unlike multiplayer, no active gate.
    for(let id=1;id<w.campaignTribes;id++) {
      const t=tribes[id];
      if(t.defeatTimer)continue;
      if(t.population===0) {
        newDefeat=true;t.defeatTimer=1;defeat(id);
        if(w.playerTribe!==-1)w.defeatedCounts[w.playerTribe]=(w.defeatedCounts[w.playerTribe]+1)|0;
      }else allDefeated=false;
    }
    if(!allDefeated&&!(player.flags&0x40000))return;
    if(!(w.landFlags&0x2000000))celebrate(w.playerTribe);
    setResult(0x2000000);effects.cancelInput();
    if(newDefeat)effects.camera(w.lastDefeated);
    w.progressFlags|=1;effects.completeLevel(((w.level<<16)>>16)-1);return;
  }
  if(player.flags&0x20000)for(const p of player.people) {
    p.flags3=(p.flags3&0xfff77fff)>>>0;effects.damage(p,(p.hp<<16)>>16);
  }
  player.defeatTimer=(player.defeatTimer+1)|0;
  setResult(0x4000000);
  if(w.landFlags&8)effects.reveal();
  effects.cancelInput();effects.camera(w.playerTribe);defeat(w.playerTribe);
}
