import rules from './original-rules.json' with {type:'json'};

type SearchPerson={id:number;tribe:number;vehicle:number;flags4:number};
type CellObject={id:number;class:number;model:number};
export type SearchPath={data:Uint8Array;count:number}; // Two endpoints, then 256 ten-byte nodes.
export type PathSearchState={searches:number;landLimit:number;checkingPerson:number;limit:number;vehicles:number;mode:number;
  currentBoat:number;candidateCount:number;candidateIndex:number;truncated:number;walkMask:number};
export type PathSearchWorld={state:PathSearchState;path:SearchPath;result:Uint8Array;categories:ArrayLike<number>;
  boatsEnabled:number;landLimit:number;humanLimit:number;computerLimit:number;tribes:{playerType:number}[];
  cellObjects:(cell:number)=>Iterable<CellObject>};
type SearchEffects={prepare:()=>void;choose:(index:number)=>void;solve:()=>number;smooth:()=>void;measure:()=>void;collect:()=>void};
const packed=(p:Uint8Array)=>(p[0]&254)|((p[1]&254)<<8);
const category=(w:PathSearchWorld,p:Uint8Array)=>rules.terrainCategoryFlags[w.categories[((p[1]&254)>>1)*128+((p[0]&254)>>1)]&15];

// Complete 0x4665c0. Cell order chooses the first non-airborne vehicle class;
// the original lookup does not reject dead flags or inspect its passengers.
export function pathBoatInCell(w:Pick<PathSearchWorld,'boatsEnabled'|'cellObjects'>,cell:number){
  if(w.boatsEnabled)for(const p of w.cellObjects(cell))if(p.class===4&&!(rules.vehicleRestFlags[p.model]&1))return p.id;
  return 0;
}

// The two identical compaction blocks in 0x420840 retain the last node of
// each consecutive equal-XY run, including its two flag bytes and stale tail.
export function compactPathPoints(path:SearchPath){
  if(path.count<2)return;
  const d=path.data,v=new DataView(d.buffer,d.byteOffset,d.byteLength);let output=0;
  for(let i=0;i<path.count;i++){
    const a=20+i*10,b=a+10;
    if(i+1<path.count&&v.getInt32(a,true)===v.getInt32(b,true)&&v.getInt32(a+4,true)===v.getInt32(b+4,true))continue;
    d.copyWithin(20+output*10,a,a+10);output++;
  }
  path.count=output;
}

// Complete 0x421960. The command is the current queued slot, including slot
// zero/cancelled records; the native routine does not consult immediate orders.
export function collectSearchPath(path:SearchPath,result:Uint8Array,queuedCommandModel:number){
  const d=path.data,v=new DataView(d.buffer,d.byteOffset,d.byteLength),abs=(n:number)=>Math.abs(n|0)|0;
  const emit=(at:number,x:number,y:number,kind:number)=>{
    if(at+2>=1032)throw new RangeError('Native path result exceeds its point buffer');
    result[at]=x;result[at+1]=y;result[at+2]=kind;
  };
  emit(0,v.getInt32(0,true),v.getInt32(4,true),d[8]);emit(4,v.getInt32(10,true),v.getInt32(14,true),d[18]);result[1032]=path.count;
  let previous=0,output=8;
  for(let i=0;i<path.count;i++){
    const at=20+i*10,x=v.getInt32(at,true),y=v.getInt32(at+4,true),px=v.getInt32(previous,true),py=v.getInt32(previous+4,true);
    if(abs(x-px)>=128||abs(y-py)>=128){emit(output,(x+px)>>1,(y+py)>>1,d[at+8]);output+=4;result[1032]++;}
    emit(output,x,y,d[at+8]);output+=4;previous=at;
  }
  const count=result[1032],last=4+count*4,previousPoint=count*4;
  if(count>1&&(rules.personCommands[queuedCommandModel].flags&0x4000)&&result[4]===result[last]&&result[5]===result[last+1]){
    const near=(at:number)=>Math.abs(result[last]-result[at])<3&&Math.abs(result[last+1]-result[at+1])<3;
    if(!result[last+2]&&result[previousPoint+2]===1){if(near(previousPoint)){result[1032]--;return true;}}
    else if(count>2&&!result[last+2]&&!result[previousPoint+2]&&result[previousPoint-2]===1&&near(previousPoint-4)){
      result[1032]-=2;return true;
    }
  }
  return false;
}

// Complete 0x420840. Its first native argument is unused. Endpoints are four
// bytes: X/Y, vehicle kind, and a preserved byte. Geometry preparation, the
// solver and path postprocessing remain mandatory consumers.
export function searchPersonPath(w:PathSearchWorld,p:SearchPerson,from:Uint8Array,to:Uint8Array,option:number,vehicles:boolean,e:SearchEffects){
  const s=w.state,finish=(result:number)=>{s.walkMask=0;return result;};
  p.flags4=(p.flags4&~0x4000000)>>>0;
  const boat=!(category(w,from)&1)?pathBoatInCell(w,packed(from)):0;
  from[2]=boat?1:0;if(boat)s.currentBoat=boat;
  to[2]=category(w,to)&1?0:1;w.result[1032]=0;w.result.set(from.subarray(0,4),0);w.result.set(to.subarray(0,4),4);
  if(from[0]===to[0]&&from[1]===to[1])return finish(0);
  const aboard=!!p.vehicle&&!(p.flags4&0x2000000),allow=aboard||vehicles;
  if(!aboard&&to[2]&&(category(w,to)&2))return finish(1);
  let first=!w.boatsEnabled||!allow||(category(w,to)&1)?1:0,last=2;
  if(option&&w.boatsEnabled&&allow){first=4;last=5;}
  s.searches=(s.searches+1)>>>0;s.landLimit=w.landLimit&65535;s.checkingPerson=p.id;
  s.limit=(w.tribes[p.tribe].playerType===1?w.humanLimit:w.computerLimit)&255;s.vehicles=Number(allow);
  e.prepare();s.candidateIndex=0;
  let found=false,secondary=false;
  while(s.candidateIndex<s.candidateCount){
    e.choose(s.candidateIndex);
    for(let mode=first;mode<last;mode++){
      s.mode=mode===0?255:mode===1?0:option&255;
      for(const mask of [1,0]){
        s.walkMask=mask;const result=e.solve();if(result===0)found=true;else if(result===2)secondary=true;
        if(found)break;
      }
      if(found||secondary)break;
    }
    if(found)break;
    s.candidateIndex=(s.candidateIndex+1)<<24>>24;
  }
  if(found){
    compactPathPoints(w.path);e.smooth();e.measure();e.collect();
    if(s.truncated)p.flags4=(p.flags4|0x4000000)>>>0;
    return finish(0);
  }
  if(secondary&&s.vehicles&&!(p.vehicle&&!(p.flags4&0x2000000))&&s.currentBoat){
    s.vehicles=0;e.choose(s.candidateIndex);
    if(e.solve()===0){
      compactPathPoints(w.path);e.smooth();e.measure();e.collect();
      // The native retry ignores the collector's truncation flag here.
      return finish(0);
    }
  }
  return finish(1);
}
