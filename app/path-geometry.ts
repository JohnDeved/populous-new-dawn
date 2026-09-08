import rules from './original-rules.json' with {type:'json'};
import type {PathSearchWorld,SearchPath} from './path-search.ts';

type Point={x:number;y:number};
export type PathPoint=Point & {flags:number};
export type PathLine={xDirection:number;yDirection:number;dx:number;dy:number;error:number;horizontalMajor:number};
export type PathGeometry={candidates:Uint8Array;cacheCell:number;cacheResult:number;leftState:number;rightState:number;diverged:number;secondary:number;
  allowTransition:number;kind:number;transition:number;line:PathLine};
export const createPathGeometry=():PathGeometry=>({candidates:new Uint8Array(120),cacheCell:-1,cacheResult:0,leftState:0,rightState:0,diverged:0,secondary:0,
  allowTransition:0,kind:0,transition:0,line:{xDirection:0,yDirection:0,dx:0,dy:0,error:0,horizontalMajor:0}});
const dataView=(data:Uint8Array)=>new DataView(data.buffer,data.byteOffset,data.byteLength);
export const readPathPoint=(v:DataView,a:number):PathPoint=>({x:v.getInt32(a,true),y:v.getInt32(a+4,true),flags:v.getUint16(a+8,true)});
type GeometryWorld=Pick<PathSearchWorld,'state'|'path'|'result'>;

function endpoints(w:GeometryWorld){
  const v=dataView(w.path.data),p=w.result;
  v.setInt32(0,p[0]+5120,true);v.setInt32(4,p[1]+5120,true);w.path.data[8]=p[2];
  v.setInt32(10,p[4]+5120,true);v.setInt32(14,p[5]+5120,true);w.path.data[18]=p[6];return v;
}

// Complete defined writes of 0x420dd0. Candidate and neighboring-target rows
// share one 10-byte-stride buffer: retry index four aliases neighbor zero.
export function preparePathCandidates(w:GeometryWorld,g:PathGeometry){
  endpoints(w);g.cacheCell=-1;g.leftState=g.rightState=g.diverged=g.secondary=0;
  const p=w.result,v=dataView(g.candidates);
  const offsets=(a:number,b:number)=>a+128<b?[-256,0]:b+128<a?[256,0]:a<b?[0,-256]:a>b?[0,256]:[0,0];
  const [x,ax]=offsets(p[0],p[4]),[y,ay]=offsets(p[1],p[5]);
  v.setInt32(0,x,true);v.setInt32(4,y,true);v.setInt32(10,ax,true);
  if(ax!==x&&ay!==y){
    v.setInt32(14,y,true);v.setInt32(20,x,true);v.setInt32(24,ay,true);v.setInt32(30,ax,true);v.setInt32(34,ay,true);w.state.candidateCount=4;
  }else{
    w.state.candidateCount=2;
    if(ax!==x)v.setInt32(14,y,true);
    else{v.setInt32(10,x,true);v.setInt32(14,ay,true);}
  }
}

// 0x420f80: all defined coordinate writes. Its eight neighbor flag words come
// from an uninitialized stack local; retain those uninterpreted bytes here.
export function choosePathCandidate(w:GeometryWorld,g:PathGeometry,index:number){
  const path=endpoints(w),v=dataView(g.candidates),a=(index&255)*10;
  const x=(w.result[4]+5120+v.getInt32(a,true))|0,y=(w.result[5]+5120+v.getInt32(a+4,true))|0;
  path.setInt32(10,x,true);path.setInt32(14,y,true);
  const cx=x&~1,cy=y&~1;
  for(const [i,dx,dy] of [[0,-2,-2],[1,-2,0],[2,-2,2],[3,0,-2],[4,0,2],[5,2,-2],[6,2,0],[7,2,2]]){
    v.setInt32(40+i*10,cx+dx,true);v.setInt32(44+i*10,cy+dy,true);
  }
}

// Complete 0x421f30 and its shared four-direction line-step block.
export function initializePathLine(line:PathLine,from:Point,to:Point){
  const x=(to.x-from.x)|0,y=(to.y-from.y)|0;
  line.dx=Math.abs(x)|0;line.dy=Math.abs(y)|0;line.horizontalMajor=Number(line.dy<line.dx);
  line.xDirection=x>0?1:3;line.yDirection=y>0?0:2;
  if(from.x===to.x)line.xDirection=line.yDirection;
  if(from.y===to.y)line.yDirection=line.xDirection;
  line.error=(Math.trunc(line.dx/2)+Math.trunc(line.dy/2))|0;
}
export function stepPathLine(line:PathLine){
  const vertical=line.dx<=line.error;line.error=(line.error+(vertical?-line.dx:line.dy))|0;
  return vertical?line.yDirection:line.xDirection;
}

export type PathProbeWorld=Pick<PathSearchWorld,'state'|'categories'> & {flags:ArrayLike<number>;walkMasks:readonly ArrayLike<number>[]};
export type ProbeEffects={buildingAccess:(cell:number)=>number;boardingBoat:(cell:number)=>number;
  disembark:(boat:number,point:Point)=>boolean;boatCell:(cell:number,boat:number)=>boolean};

// Complete 0x422020. Probe the next quarter-cell before consulting the cache;
// transition success clears its cell key and preserves its result byte.
export function probePathStep(w:PathProbeWorld,g:PathGeometry,p:{flags4:number},point:PathPoint,direction:number,e:ProbeEffects,cache:Pick<PathGeometry,'cacheCell'|'cacheResult'>=g,boat:{currentBoat:number}=w.state){
  g.transition=0;
  const step=rules.pathSteps[direction],x=(point.x+step.x)&255,y=(point.y+step.y)&255,bit=y*256+x;
  if(!(w.walkMasks[w.state.walkMask][bit>>3]&(1<<(bit&7))))return 3;
  const cell=(x&254)|((y&254)<<8),i=(y>>1)*128+(x>>1);
  if(cache.cacheCell===i)return cache.cacheResult;
  const kind=point.flags&255,category=rules.terrainCategoryFlags[w.categories[i]&15],building=!!(w.flags[i]&512);let result=0;
  if(kind===0){
    if(!(p.flags4&0x10007)&&building)result=1;
    else if(!(category&1)){
      if(!(category&60)||!g.allowTransition)result=4;
      else{const nextBoat=e.boardingBoat(cell);if(!nextBoat||nextBoat===boat.currentBoat)result=4;else{g.transition=1;boat.currentBoat=nextBoat;}}
    }else if(building&&(p.flags4&0x10007))result=e.buildingAccess(cell)&255;
  }else if(kind===1){
    if(category&1){
      if(g.allowTransition&&e.disembark(boat.currentBoat,{x:(point.x&254)<<8,y:(point.y&254)<<8}))g.transition=1;
      else result=5;
    }else if((category&60)&&(category&16))result=6;
    else if(!e.boatCell(x|(y<<8),boat.currentBoat))result=6;
  }
  if(g.transition)cache.cacheCell=-1;else{cache.cacheCell=i;cache.cacheResult=result;}
  return result;
}

// Complete 0x421cb0, composing the native line setup and step probe. Input
// positions are copied; cache/current-boat and line globals remain shared.
export function clearPathSegment(w:PathProbeWorld,g:PathGeometry,p:{flags4:number},from:PathPoint,to:PathPoint,kind:number,e:ProbeEffects){
  const point={...from};g.kind=kind&255;g.allowTransition=0;g.cacheCell=-1;initializePathLine(g.line,from,to);
  while(point.x!==to.x||point.y!==to.y){
    const direction=stepPathLine(g.line);if(probePathStep(w,g,p,point,direction,e))return false;
    const step=rules.pathSteps[direction];point.x=(point.x+step.x)|0;point.y=(point.y+step.y)|0;
  }
  return true;
}

// Complete 0x421b70. Look ahead four nodes first, repeat passes until no
// shortcuts remain, and preserve the unused node tail and full flag words.
export function smoothSearchPath(path:SearchPath,start:number,clear:(from:PathPoint,to:PathPoint,kind:number)=>boolean){
  const d=path.data,v=dataView(d);let any=false;
  for(;;){
    let current=readPathPoint(v,start?10+start*10:0),output=start,changed=false,source=start;
    while(source<path.count){
      let skip=0;
      for(let ahead=4;ahead>0;ahead--){
        const at=20+(source+ahead)*10;
        if(source+ahead<path.count&&d[at+8]===(current.flags&255)&&clear(current,readPathPoint(v,at),current.flags&255)){skip=ahead;break;}
      }
      if(skip){source+=skip;changed=any=true;continue;}
      d.copyWithin(20+output*10,20+source*10,30+source*10);current=readPathPoint(v,20+output*10);source++;output++;
    }
    path.count=output;if(!changed)return any;
  }
}

// Complete 0x422df0, composing 0x419480's active/recently-defeated predicate.
// Each segment includes its starting cell and excludes its endpoint.
export function measureSearchPath(path:SearchPath,line:PathLine,measure:{dirty:number;distance:number;tribes:number},regions:ArrayLike<number>,tribes:readonly {active:boolean;defeatTimer:number}[]){
  if(!measure.dirty)return;
  const v=dataView(path.data);let current=readPathPoint(v,0),distance=0,mask=0;
  for(let i=0;i<path.count;i++){
    const to=readPathPoint(v,20+i*10);initializePathLine(line,current,to);
    while(current.x!==to.x||current.y!==to.y){
      distance=(distance+1)|0;mask|=regions[((current.y&254)>>1)*128+((current.x&254)>>1)];
      const step=rules.pathSteps[stepPathLine(line)];current.x=(current.x+step.x)|0;current.y=(current.y+step.y)|0;
    }
    current=to;
  }
  mask=(mask&255)>>4;
  tribes.forEach((t,i)=>{if(!t.active||t.defeatTimer>=97)mask&=~(1<<(i&31));});
  measure.dirty=0;measure.distance=distance;measure.tribes=mask&255;
}
