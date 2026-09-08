import rules from './original-rules.json' with {type:'json'};
import {nativeTerrainCross} from './native-math.ts';

export type NativeTerrain = {
  heights:Int16Array;flags:Uint32Array;cliffs:Uint8Array;categories:Uint8Array;shadows:Uint8Array;
  walkMasks:Uint8Array[];
  buildingIds:Uint16Array;owners:Uint8Array;
  queued:number[];textureUpdates:number[];dirty:Uint8Array;landFlags:number;
  attempts:number;duplicates:number;recursing:boolean;
};
type TerrainTextures = {surface:(cell:number)=>void;globe:(cell:number)=>void};
const indexOf=(cell:number)=>((cell>>>9)*128)+((cell&254)>>>1);
const neighbor=(index:number,x:number,y:number)=>((((index>>>7)+y)&127)*128)+(((index&127)+x)&127);
const neighbors=[[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]];
const heightsAround=[[0,0],[0,1],[1,0],[0,-1],[-1,0],[1,1],[1,-1],[-1,-1],[-1,1]];
const waterBorder=[[1,-1],[0,-1],[-1,-1],[-1,0],[-1,1],[-1,2],[0,2],[1,2],[2,2],[2,1],[2,0],[2,-1]];
type Ground=Pick<NativeTerrain,'heights'|'flags'>;
type Position={x:number;y:number};
function heightCorners(land:Ground,i:number){const h=land.heights;return [h[i],h[neighbor(i,0,1)],h[neighbor(i,1,1)],h[neighbor(i,1,0)]];}

export function createNativeTerrain(heights:ArrayLike<number>):NativeTerrain {
  return {heights:Int16Array.from(heights),flags:new Uint32Array(16384),cliffs:new Uint8Array(16384),
    categories:new Uint8Array(16384),shadows:new Uint8Array(16384),buildingIds:new Uint16Array(16384),owners:new Uint8Array(16384),walkMasks:[new Uint8Array(8192),new Uint8Array(8192)],queued:[],textureUpdates:[],
    dirty:new Uint8Array(16384),landFlags:0,attempts:0,duplicates:0,recursing:false};
}

// 0x422bd0: choose three corners for a quarter-cell off the diagonal, all
// four when it straddles the diagonal. Native min/max start at 1024 and zero.
export function terrainQuarterPassable(land:Pick<NativeTerrain,'heights'|'flags'>,cell:number,limit:number){
  const i=indexOf(cell),[a,b,c,d]=heightCorners(land,i);
  const quarter=cell&1?(cell&256?2:3):(cell>>8)&1;
  const corners=land.flags[i]&1?quarter===0?[a,b,d]:quarter===2?[b,c,d]:[a,b,c,d]:
    quarter===1?[a,b,c]:quarter===3?[a,c,d]:[a,b,c,d];
  return Math.max(0,...corners)-Math.min(1024,...corners)<=limit;
}

// 0x44f750: height range of the triangle beneath a native position.
export function terrainSlopeRange(land:Ground,p:Position){
  const i=((p.y&65535)>>9)*128+((p.x&65535)>>9),[a,b,c,d]=heightCorners(land,i),x=(p.x&510)>>1,y=(p.y&510)>>1;
  const h=land.flags[i]&1?x+y<256?[a,b,d]:[b,c,d]:y<x?[a,c,d]:[a,b,c];
  return Math.max(0,...h)-Math.min(1024,...h);
}

// 0x4ebd10: signed-short height differences precede the 3/8 arithmetic shift.
export function terrainSlopeVelocity(land:Ground,p:Position){
  const i=((p.y&65535)>>9)*128+((p.x&65535)>>9),[a,b,c,d]=heightCorners(land,i),x=(p.x&510)>>1,y=(p.y&510)>>1;
  const v=land.flags[i]&1?x+y<256?[a-d,a-b]:[b-c,d-c]:x<=y?[b-c,a-b]:[a-d,d-c];
  return {x:(((v[0]<<16)>>16)*3)>>3,y:0,z:(((v[1]<<16)>>16)*3)>>3};
}

// 0x4ebc20: suppress drift into a local trough, using four 76-unit probes.
export function terrainDrift(land:Ground,p:Position){
  const north=terrainSlopeVelocity(land,{x:p.x,y:(p.y+76)&65535}),east=terrainSlopeVelocity(land,{x:(p.x+76)&65535,y:p.y});
  const south=terrainSlopeVelocity(land,{x:p.x,y:(p.y-76)&65535}),west=terrainSlopeVelocity(land,{x:(p.x-76)&65535,y:p.y}),v=terrainSlopeVelocity(land,p);
  if(east.x<0&&west.x>0)v.x=0;
  if(north.z<0&&south.z>0)v.z=0;
  return v;
}

// 0x44ebe0: any category without the land bit in an even-cell square.
export function hasNonLand(land:Pick<NativeTerrain,'categories'>,center:number,radius:number){
  for(let y=-radius;y<=radius;y++)for(let x=-radius;x<=radius;x++){
    const cell=(((center&255)+x*2)&255)|((((center>>>8)+y*2)&255)<<8);
    if(!(rules.terrainCategoryFlags[land.categories[indexOf(cell)]&15]&1))return true;
  }
  return false;
}

// 0x422a60: refresh both 256×256 bit maps in a wrapped (4r+1) square.
export function updateWalkMasks(land:Pick<NativeTerrain,'heights'|'flags'|'walkMasks'>,center:number,radius:number){
  radius=(radius<<16)>>16;
  if(radius<0)throw new RangeError('Negative native walk-mask radius');
  const limits=[rules.landHeightConstant,rules.alternateLandHeightConstant];
  for(let pass=0;pass<2;pass++)for(let y=0;y<radius*4+1;y++)for(let x=0;x<radius*4+1;x++){
    const cell=(((center&255)-radius*2+x)&255)|((((center>>>8)-radius*2+y)&255)<<8);
    const allowed=!(land.flags[indexOf(cell)]&0x80004)&&terrainQuarterPassable(land,cell,limits[pass]);
    const mask=land.walkMasks[pass],byte=cell>>3,bit=1<<(cell&7);mask[byte]=allowed?mask[byte]|bit:mask[byte]&~bit;
  }
}

// 0x44df40. Complete simulation passes; texture consumers retain their original
// order after category and height repair. They own palette/texture side effects.
export function processTerrain(land:NativeTerrain,textures:TerrainTextures) {
  const {heights,flags,cliffs,categories,shadows}=land;
  for(const cell of land.queued) {
    const i=indexOf(cell),h=heightsAround.map(([x,y])=>heights[neighbor(i,x,y)]);
    flags[i]=(flags[i]&~1)|16|Number(nativeTerrainCross(h[0],h[2],h[1],h[5]));
    let maximum=0,minimum=1025,lowest=0;
    for(let j=0;j<9;j++) {
      maximum=Math.max(maximum,h[j]);
      if(h[j]<minimum){minimum=h[j];lowest=j;}
    }
    shadows[i]=(shadows[i]&15)|(lowest<<4);
    if(!(flags[i]&0x4000000))cliffs[i]=maximum?Math.max(1,Math.min(127,(maximum-minimum)>>3)):0;
    if(maximum)flags[i]=minimum<1||maximum>511?flags[i]&~32:flags[i]|32;
    const water=h[0]===0&&h[1]===0&&h[2]===0&&h[5]===0&&
      !neighbors.some(([x,y])=>flags[neighbor(i,x,y)]&0x200)&&
      !waterBorder.some(([x,y])=>heights[neighbor(i,x,y)]>Math.trunc(Math.imul(rules.landHeightConstant,7)/8));
    flags[i]=water?flags[i]|0x1000000:flags[i]&~0x1000000;
  }
  for(const cell of land.queued) {
    const i=indexOf(cell),corners=[i,neighbor(i,0,1),neighbor(i,1,1),neighbor(i,1,0)];
    flags[i]=corners.some(j=>cliffs[j]>=171)?flags[i]|0x40000:flags[i]&~0x40000;
    const mask=corners.reduce((bits,j,k)=>bits|(Number(cliffs[j]!==0)<<k),0);
    categories[i]=(categories[i]&240)|rules.terrainCategories[mask];
    if(!(rules.terrainCategoryFlags[categories[i]&15]&60))flags[i]&=~0x1000000;
  }
  for(let j=0;j<land.queued.length;j++) {
    const cell=land.queued[j],i=indexOf(cell);
    if(!(land.landFlags&128)&&heights[i]===0&&[i,neighbor(i,0,-1),neighbor(i,-1,-1),neighbor(i,-1,0)]
      .every(k=>rules.terrainCategoryFlags[categories[k]&15]&1))heights[i]=1;
    if(land.textureUpdates[j])textures.surface(cell);
  }
  for(let j=0;j<land.queued.length;j++)if(land.textureUpdates[j])textures.globe(land.queued[j]);
  land.queued.length=0;land.textureUpdates.length=0;land.landFlags&=~128;land.dirty.fill(0);
}

// 0x44ddf0. First enqueue wins its texture flag; flush exactly at 1,024 cells.
// A radius-64 update repeats the entire traversal once after flushing.
export function queueTerrain(land:NativeTerrain,center:number,radius:number,texture:number,textures:TerrainTextures) {
  radius=(radius<<16)>>16;
  for(let y=-radius;y<=radius;y++)for(let x=-radius;x<=radius;x++) {
    const cell=(((center&255)+x*2)&255)|((((center>>>8)+y*2)&255)<<8),i=indexOf(cell);
    land.attempts=(land.attempts+1)|0;
    if(!land.dirty[i]) {
      land.queued.push(cell);land.textureUpdates.push(texture&255);land.dirty[i]=1;
    }else land.duplicates=(land.duplicates+1)|0;
    if(land.queued.length===1024)processTerrain(land,textures);
  }
  if(radius===64) {
    processTerrain(land,textures);
    if(!land.recursing){land.recursing=true;queueTerrain(land,center,radius,texture,textures);land.recursing=false;}
  }
}
