import {spiralCell,cellsNear} from './native-math.ts';
import type {SelectionUnit} from './computer-selection.ts';
import rules from './original-rules.json' with {type:'json'};
import {filterSpellEntries,computerSpellAllowed,computerSpellInRange,type TargetCaster} from './spell-casting.ts';

export type SpellTargetUnit = Pick<SelectionUnit,'class'|'model'|'state'|'tribe'|'x'|'y'|'flags2'|'flags4'|'assignment'> & {disguise:number};
export type SpellTargetWorld = {tribe:number;alliances:number;cells:Map<number,SpellTargetUnit[]>;
  terrainFlags:(cell:number)=>number};
const cellOf=(p:SpellTargetUnit)=>((p.x>>>8)&254)|(p.y&0xfe00);
const objectsAt=(w:SpellTargetWorld,cell:number)=>w.cells.get(cell&0xfefe)??[];
const allied=(w:SpellTargetWorld,tribe:number)=>w.tribe===-1||tribe===-1||tribe===w.tribe||!!(w.alliances&(1<<tribe));
const summaryGroup=[undefined,undefined,'braves','warriors','preachers','braves','firewarriors','warriors'] as const;

// 0x4de7b0. The upper two bits identify a completed disguise's apparent tribe.
export function spyDisguisedFrom(p:SpellTargetUnit,tribe:number) {
  return p.model===5&&((p.disguise&63)?p.tribe===tribe:(p.disguise>>>6)===tribe);
}

// 0x4f4030: square area traversal, enemy counts/weight and force requirements.
// Optional preacher assessment is used by callers outside spell dispatch.
export function summarizeSpellEnemies(w:SpellTargetWorld,center:number,radius:number,
  training:{preachers:number;firewarriors:number;braves:number;autoTrain:boolean;
    queuedPreachers:()=>number;request:(count:number,model:number)=>void}|null=null) {
  const s={braves:0,warriors:0,firewarriors:0,preachers:0,total:0,weight:0,
    requiredBraves:0,requiredWarriors:0,requiredFirewarriors:0,requiredPreachers:0};
  for(let y=-radius;y<=radius;y++) for(let x=-radius;x<=radius;x++) {
    const cell=(((center&255)+x*2)&255)|((((center>>>8)+y*2)&255)<<8);
    for(const p of objectsAt(w,cell)) if(p.class===1&&!allied(w,p.tribe)&&!(p.flags4&0x1000)) {
      const group=summaryGroup[p.model];
      if(group)s[group]=(s[group]+1)&65535;
      s.total=(s.total+1)&65535;s.weight=(s.weight+rules.personThreat[p.model])|0;
    }
  }
  if(training&&s.preachers) {
    const preachers=(training.preachers<<16)>>16,firewarriors=(training.firewarriors<<16)>>16;
    if(!preachers) {
      if(!firewarriors)s.total=0;
      else s.firewarriors=(s.firewarriors+s.preachers)&65535;
    }
    if(training.autoTrain&&preachers<s.preachers) {
      const needed=Math.max(0,(s.preachers-preachers-training.queuedPreachers())|0);
      const count=Math.min(Math.max(0,((training.braves<<16)>>16)-10),Math.imul(needed,2));
      if(count)training.request(count,4);
    }
  }
  s.requiredWarriors=Math.trunc(((s.braves>>>2)+s.warriors)*133/100)&65535;
  s.requiredFirewarriors=Math.trunc(s.firewarriors*133/100)&65535;
  s.requiredPreachers=(((s.firewarriors+s.warriors)>>>2)+Math.trunc(s.preachers*133/100))&65535;
  return s;
}

// Person score repeated inside 0x4f4680. Every non-wild person contributes:
// a valid enemy adds one; an ally or protected/invalid target subtracts one.
function scoreCell(w:SpellTargetWorld,cell:number) {
  let score=0;
  for (const p of objectsAt(w,cell)) if (p.class===1&&p.tribe!==-1) {
    score+=!(p.flags2&0x10000)&&p.model!==1&&p.model!==8&&p.state!==23&&
      !(p.flags4&0x1000)&&!spyDisguisedFrom(p,w.tribe)&&!allied(w,p.tribe)?1:-1;
  }
  return score;
}

// 0x4f4680, all spell cases. Preserve traversal order and the original center
// returned for a large person group found in a neighboring cell.
export function chooseSpellTarget(w:SpellTargetWorld,model:number,center:number,direct:SpellTargetUnit|null) {
  center&=65535;
  if ([1,5,6,10,12,14,15,16,19].includes(model)) return {accepted:true,cell:center};
  if (model===2||model===7) {
    let cell=center,best=Math.max(0,scoreCell(w,center));
    for (let i=0;i<48;i++) {
      const candidate=spiralCell(center,i,0),score=scoreCell(w,candidate);
      if (score>best) {best=score;cell=candidate;}
    }
    return {accepted:best>0,cell};
  }
  if ([3,4,8].includes(model)) {
    if (direct?.class===1&&direct.model===7) return {accepted:true,cell:center};
    for (let i=-1;i<224;i++) {
      const cell=i<0?center:spiralCell(center,i,0);
      for (const p of objectsAt(w,cell)) if (!allied(w,p.tribe)) {
        if (p.class===1&&scoreCell(w,cell)>5) return {accepted:true,cell:center};
        if (p.class===2&&p.state===2) return {accepted:true,cell:cellOf(p)};
      }
    }
  } else if ([9,11,13].includes(model)) {
    if (!(w.terrainFlags(center&0xfefe)&0x200)) return {accepted:true,cell:center};
    for (let i=0;i<24;i++) {
      const cell=spiralCell(center,i,0);
      if (!(w.terrainFlags(cell&0xfefe)&0x200)) return {accepted:true,cell};
    }
  }
  return {accepted:false,cell:center};
}

export type SpellTargetScan = {cursor:number;limit:number;paused:number;targets:number[]};
// 0x4d1420. The scan limit is intentionally retained.
export function resetSpellTargets(scan:SpellTargetScan) {
  scan.cursor=0;scan.paused=0;scan.targets.fill(0);
}

// General target-scan portion of 0x4d0860. The caller refreshes readiness first.
// Native emergency preacher response remains a world effect at its exact place
// in traversal; it does not stop the 80-cell scan after casting.
export function scanSpellTargets(w:SpellTargetWorld,scan:SpellTargetScan,caster:{x:number;y:number}|null,ranges:number[],preacher:(p:SpellTargetUnit)=>void) {
  const range=Math.max(...ranges);
  if(!caster||!range){resetSpellTargets(scan);return;}
  scan.limit=((range+1)*range*4-1)&65535;
  if(scan.cursor>scan.limit)scan.cursor=0;
  if(scan.paused)return;
  const origin=((caster.x>>>8)&254)|(caster.y&0xfe00);
  for(let i=0;i<80;i++) {
    const cell=spiralCell(origin,scan.cursor,0);scan.cursor=(scan.cursor+1)&65535;
    for(const p of objectsAt(w,cell)) if(p.class===1&&p.model!==1&&!allied(w,p.tribe)&&!(p.flags4&0x1000)&&!spyDisguisedFrom(p,w.tribe)) {
      const candidate=cell||1;
      if(!scan.targets.some(t=>t&&cellsNear(t,candidate,3))) {
        for(let j=0;j<4;j++)if(!scan.targets[j])scan.targets[j]=candidate;
      }
      if(p.model===4&&(p.assignment&64))preacher(p);
      break;
    }
  }
}

// 0x4d11b0. Consume empty-area slots until the first weighted enemy area, then
// stop even if no entry can cast there. Later slots survive for future calls.
export function dispatchSpellTargets(w:SpellTargetWorld,scan:SpellTargetScan,entries:{model:number;people:number;mode:number}[],ranges:number[],
  caster:TargetCaster,gameFlags:number,aiFlags:number,
  effects:{regionFlags:(cell:number)=>number;categoryFlags:(cell:number)=>number;cast:(model:number,cell:number)=>void}) {
  for(let i=0;i<4;i++) {
    const cell=scan.targets[i];if(!cell)continue;
    const area=summarizeSpellEnemies(w,cell,4);
    if(area.weight) {
      const defending=!!(effects.regionFlags(cell&0xfefe)&(1<<(w.tribe+4)));
      filterSpellEntries(ranges,entries,defending,[area.warriors,area.firewarriors,area.preachers],area.total);
      for(let j=0;j<8;j++) {
        const model=entries[j].model;
        if(!model||!ranges[j]||!computerSpellAllowed(caster.casting,aiFlags,gameFlags,model)||
          !computerSpellInRange(gameFlags,caster.casting.flags,caster,cell,model))continue;
        if(model===11&&!(effects.categoryFlags(cell&0xfefe)&1))continue;
        const target=chooseSpellTarget(w,model,cell,null);
        if(target.accepted){effects.cast(model,target.cell);break;}
      }
    }
    scan.targets[i]=0;
    if(area.weight)return;
  }
}
