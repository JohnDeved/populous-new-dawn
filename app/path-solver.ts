import rules from './original-rules.json' with {type:'json'};
import {compactPathPoints,pathBoatInCell} from './path-search.ts';
import type {PathSearchWorld,SearchPath} from './path-search.ts';
import {readPathPoint,initializePathLine,stepPathLine,probePathStep,clearPathSegment,smoothSearchPath} from './path-geometry.ts';
import type {PathGeometry,PathPoint,PathProbeWorld,ProbeEffects} from './path-geometry.ts';

type Obstacle={path:SearchPath;cacheCell:number;cacheResult:number;currentBoat:number;origin:PathPoint;point:PathPoint;rotation:number;direction:number;eligible:number};
export type PathSolver={obstacles:Obstacle[];attempts:number;detours:number;steps:number;limited:number;tribeRequests:number[];stepLimit:number};
export function createPathSolver():PathSolver{
  return {obstacles:Array.from({length:2},()=>({path:{data:new Uint8Array(2580),count:0},cacheCell:-1,cacheResult:0,currentBoat:0,
    origin:{x:0,y:0,flags:0},point:{x:0,y:0,flags:0},rotation:0,direction:0,eligible:0})),attempts:0,detours:0,steps:0,limited:0,tribeRequests:[0,0,0,0],stepLimit:rules.pathSearchStepLimit};
}
const view=(path:SearchPath)=>new DataView(path.data.buffer,path.data.byteOffset,path.data.byteLength);
function writePoint(path:SearchPath,at:number,p:PathPoint){const v=view(path);v.setInt32(at,p.x,true);v.setInt32(at+4,p.y,true);v.setUint16(at+8,p.flags,true);}
function append(path:SearchPath,p:PathPoint){writePoint(path,20+path.count*10,p);path.count++;}
const move=(p:PathPoint,direction:number)=>{const d=rules.pathSteps[direction];p.x=(p.x+d.x)|0;p.y=(p.y+d.y)|0;};
const equal=(a:PathPoint,b:PathPoint)=>a.x===b.x&&a.y===b.y;
const near=(a:PathPoint,b:PathPoint)=>(Math.abs((a.x-b.x)|0)|0)<2&&(Math.abs((a.y-b.y)|0)|0)<2;
const limited=(limit:number,count:number)=>((limit<<16>>16)>>>0)<=(count>>>0);
const past=(p:PathPoint,end:PathPoint,d:number)=>d===0?p.y>end.y:d===1?p.x>end.x:d===2?p.y<end.y:p.x<end.x;
const inCorridor=(a:number,b:number,p:number)=>a<b?(a-1|0)<=p&&p<=(b+1|0):a===b||p<=(a+1|0)&&(b-1|0)<=p;
function neighboringShore(g:PathGeometry,p:PathPoint,end:PathPoint,boat:number,e:ProbeEffects){
  if(!(p.flags&255)||(end.flags&255)||!e.disembark(boat,{x:(p.x&254)<<8,y:(p.y&254)<<8}))return false;
  const v=new DataView(g.candidates.buffer,g.candidates.byteOffset,g.candidates.byteLength);
  for(let i=4;i<12;i++)if(v.getInt32(i*10,true)===(p.x&~1)&&v.getInt32(i*10+4,true)===(p.y&~1))return true;
  return false;
}

// Complete 0x4222d0. Left/right states are the existing geometry globals;
// each side owns its separate native cache, route, current point and turn sign.
export function stepPathObstacle(w:PathProbeWorld,g:PathGeometry,s:PathSolver,path:SearchPath,p:{flags4:number},side:number,e:ProbeEffects){
  const o=s.obstacles[side],key=side?'rightState':'leftState';let turned=false,added=false,finished=false;
  const add=(point:PathPoint)=>{append(o.path,point);added=true;};
  const allow=()=>{g.allowTransition=Number(!!w.state.vehicles&&(!w.state.mode||!(o.point.flags&255)));};
  const probe=(point:PathPoint,direction:number)=>probePathStep(w,g,p,point,direction,e,o,o);
  if(g[key]===3){
    allow();let found=false;
    for(let i=0;i<4;i++){
      if(probe(o.point,o.direction)===0){found=true;break;}
      turned=true;o.direction=(o.direction-o.rotation)&3;
    }
    if(!found)g[key]=2;
    else if(g.transition){
      add(o.point);move(o.point,o.direction);o.point.flags=(o.point.flags&0xff00)|Number(!(o.point.flags&255));add(o.point);finished=true;
    }else{
      const direction=o.direction;move(o.point,direction);
      const current={...o.point},end=readPathPoint(view(o.path),10),origin={...o.origin},next=(o.rotation+o.direction)&3;
      allow();
      if(probe(current,next)===0){
        turned=true;o.direction=next;
        if(g.transition){
          if(neighboringShore(g,current,end,o.currentBoat,e)){add(current);o.point={...end};finished=true;}
          else if(!(current.flags&255))o.currentBoat=0;
        }
      }
      if(!finished){
        if(turned){add(o.point);o.eligible=Number(!past(current,end,direction));}
        if(equal(current,end)||((current.flags&255)&&near(current,end)))finished=true;
        else if(o.eligible&&!past(current,end,o.direction)&&!past(current,end,(o.rotation+o.direction+2)&3)&&
          inCorridor(origin.x,end.x,current.x)&&inCorridor(origin.y,end.y,current.y)&&!equal(origin,current)){
          const check={...current};allow();
          if(probe(check,direction)===0){
            // The native probe uses the old heading but advances with the new one.
            move(check,o.direction);
            if(check.x===end.x||check.y===end.y||probe(check,direction)===0)finished=true;
          }
        }
        if(!finished&&g.diverged&&equal(s.obstacles[0].point,s.obstacles[1].point)){
          if(((s.obstacles[1].direction+2)&3)===s.obstacles[0].direction){g.secondary=1;g.leftState=g.rightState=2;}
          else g.diverged=0;
        }
      }
    }
    if(finished){g[key]=1;if(!turned)add(o.point);}
  }
  if(added&&limited(w.state.limit,o.path.count+path.count))g[key]=2;
}

// Complete 0x4229a0. Check the signed limit before each input node, including
// duplicates, and always copy the chosen side's boat back to the main cache.
export function appendObstaclePath(w:Pick<PathSearchWorld,'state'|'path'>,s:PathSolver,side:number){
  const o=s.obstacles[side],v=view(o.path);let previous:PathPoint|null=null,complete=true;
  for(let i=0;i<o.path.count;i++){
    if((w.state.limit<<16>>16)<=w.path.count){complete=false;break;}
    const point=readPathPoint(v,20+i*10);if(!previous||!equal(previous,point))append(w.path,point);previous=point;
  }
  w.state.currentBoat=o.currentBoat;return complete;
}

type SolverWorld=PathSearchWorld & PathProbeWorld;
// Complete 0x421130. Both obstacle walkers, their smoothing, line probes and
// route merge execute here; building/boat world consumers remain explicit.
export function solvePersonPath(w:SolverWorld,g:PathGeometry,s:PathSolver,p:{tribe:number;flags4:number},e:ProbeEffects){
  const path=w.path,state=w.state,end=readPathPoint(view(path),10);let point=readPathPoint(view(path),0),travel=0,success=false,overLimit=false;
  g.kind=point.flags&255;g.allowTransition=0;path.count=0;s.attempts=(s.attempts+1)>>>0;s.tribeRequests[p.tribe]=(s.tribeRequests[p.tribe]+1)&65535;
  state.currentBoat=0;
  const cell=(point.x&254)|((point.y&254)<<8),index=((point.y&254)>>1)*128+((point.x&254)>>1);
  if(!(rules.terrainCategoryFlags[w.categories[index]&15]&1))state.currentBoat=pathBoatInCell(w,cell);
  outer:for(;;){
    g.cacheCell=-1;initializePathLine(g.line,point,end);
    for(;;){
      const direction=stepPathLine(g.line);g.allowTransition=Number(!!state.vehicles&&(!state.mode||!(point.flags&255)));
      if(probePathStep(w,g,p,point,direction,e)===0){
        travel++;
        if(g.transition){
          append(path,point);move(point,direction);point.flags=(point.flags&0xff00)|Number(!(point.flags&255));append(path,point);
          overLimit=limited(state.limit,path.count);if(overLimit)break outer;
        }else move(point,direction);
      }else{
        append(path,point);overLimit=limited(state.limit,path.count);if(overLimit)break outer;
        s.detours=(s.detours+1)>>>0;
        if(neighboringShore(g,point,end,state.currentBoat,e)){append(path,point);point={...end};success=true;break outer;}
        for(let i=0;i<2;i++){
          const o=s.obstacles[i];o.origin={...point};o.point={...point};writePoint(o.path,0,point);writePoint(o.path,10,readPathPoint(view(path),10));o.path.count=0;
          o.rotation=i?-1:1;o.direction=(direction+(i?1:-1))&3;o.eligible=1;o.cacheCell=-1;o.currentBoat=state.currentBoat;
        }
        g.leftState=g.rightState=3;g.diverged=g.secondary=0;
        for(;;){
          stepPathObstacle(w,g,s,path,p,0,e);stepPathObstacle(w,g,s,path,p,1,e);
          if(!g.diverged&&!equal(s.obstacles[0].point,s.obstacles[1].point))g.diverged=1;
          travel+=2;
          if(g.leftState===2&&g.rightState===2){
            g.leftState=g.rightState=0;overLimit=s.obstacles.some(o=>limited(state.limit,o.path.count+path.count));break outer;
          }
          if(g.leftState===1||g.rightState===1)break;
          if(s.stepLimit<travel)break outer;
        }
        const side=g.leftState===1?0:1,o=s.obstacles[side];compactPathPoints(o.path);
        smoothSearchPath(o.path,0,(a,b,k)=>clearPathSegment(w,g,p,a,b,k,e));g.leftState=g.rightState=0;
        if(appendObstaclePath(w,s,side)){
          point=readPathPoint(view(path),10+path.count*10);success=point.flags&255?near(point,end):equal(point,end);
          if(success)break outer;
          if(state.mode)state.mode=(state.mode-1)&255;
          continue outer;
        }
        overLimit=limited(state.limit,path.count);if(overLimit)break outer;
      }
      success=equal(point,end);if(success||s.stepLimit<travel)break outer;
    }
  }
  s.steps=(s.steps+travel)>>>0;
  if(!success){if(overLimit)s.limited=(s.limited+1)>>>0;return g.secondary?2:1;}
  append(path,point);return 0;
}
