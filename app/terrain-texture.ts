import type {NativeTerrain} from './native-terrain.ts';

export function readTerrainTextures(buffer:ArrayBuffer){
  if(buffer.byteLength!==386048)throw new Error('Invalid original terrain texture bank');
  return {palette:new Uint8Array(buffer,0,1024),colors:new Uint8Array(buffer,1024,294912),
    cliffs:new Uint8Array(buffer,295936,8192),detail:new Int8Array(buffer,304128,65536),fade:new Uint8Array(buffer,369664,16384)};
}
export type TerrainTextures=ReturnType<typeof readTerrainTextures>;
type Terrain=Pick<NativeTerrain,'heights'|'cliffs'|'shadows'|'flags'>;
const neighbor=(i:number,x:number,y:number)=>((((i>>7)+y)&127)<<7)|(((i&127)+x)&127);

// Lighting block of 0x4bdd40. The initial light vector is [147,147,147]
// (0x401040); callers can supply the live vector when its scheduler is ported.
export function terrainBrightness(land:Pick<Terrain,'heights'|'shadows'>,i:number,sun:readonly number[]){
  const h=land.heights[i],slope=((land.heights[neighbor(i,0,1)]-h)*sun[1]-sun[0]*(h-land.heights[neighbor(i,1,0)])+sun[2])|0;
  return Math.max(0,Math.min(255,Math.trunc(slope/350)+((land.shadows[i]&15)+8)*16));
}

// 0x4bf860: original 32×32 indexed surface, including cliff remapping,
// optional fog fade and the supplied stain-count overlay. Stain ownership and
// the 16-pixel texture cache/LOD dispatcher remain outside this function.
export function terrainTile(land:Terrain,brightness:Uint8Array,i:number,t:TerrainTextures,fog=false,stains?:Uint8Array){
  const corners=[i,neighbor(i,1,0),neighbor(i,1,1),neighbor(i,0,1)];
  const levels=corners.map(j=>land.cliffs[j]?Math.min(1022,land.heights[j]+150):land.heights[j]+75);
  const fields=[corners.map(j=>brightness[j]),levels,corners.map(j=>land.cliffs[j]),corners.map(j=>land.flags[j]&8?32:0)];
  const starts=fields.map(v=>v[0]<<16),dx=fields.map(v=>(v[1]-v[0])<<11),dy=fields.map(v=>(v[3]-v[0])<<11),cross=fields.map(v=>(v[2]-v[3]-v[1]+v[0])<<6);
  const out=new Uint8Array(1024),ox=(i&7)*32,oy=((i>>7)&7)*32;
  for(let y=0;y<32;y++){
    const row=starts.map((v,k)=>(v+Math.imul(dy[k],y))|0),step=dx.map((v,k)=>(v+Math.imul(cross[k],y))|0);
    for(let x=0;x<32;x++){
      const d=t.detail[((oy+y)&255)*256+((ox+x)&255)],next=t.detail[((oy+y+1)&255)*256+((ox+x+1)&255)];
      const shade=Math.max(0,Math.min(255,(row[0]>>16)+((next-d)>>2))),level=row[1]>>16;
      // 0x4bd700 initializes this displacement-amplitude table.
      const amplitude=level<128?320:level<=362?level*3-64:1024;
      const at=((row[1]&0xffff00ff)>>8)+((Math.imul(amplitude,d)&0xfffffc03)>>2)+shade;
      let color=t.cliffs[(row[2]>>18)*128+t.colors[at]];
      if(fog)color=t.fade[((row[3]&0xffff00ff)>>8)+color];
      if(stains)color=t.fade[(32+stains[y*32+x])*256+color];
      out[y*32+x]=color;
      for(let k=0;k<4;k++)row[k]=(row[k]+step[k])|0;
    }
  }
  return out;
}

// Full native map, reflected into browser X/Z. Rendering includes the coast
// beyond the simulation crop; only changed cells rebuild their indexed tiles.
type TerrainAtlas={pixels:Uint8Array;cells:Uint32Array;updated:number};
export function terrainAtlas(land:Terrain,t:TerrainTextures,previous?:TerrainAtlas):TerrainAtlas{
  const brightness=new Uint8Array(16384),cells=new Uint32Array(16384),out=previous?.pixels??new Uint8Array(4096*4096*4);
  for(let i=0;i<brightness.length;i++){
    brightness[i]=terrainBrightness(land,i,[147,147,147]);
    cells[i]=(land.heights[i]&65535)|(land.cliffs[i]<<16)|(brightness[i]<<24);
  }
  let updated=0;
  for(let z=0;z<128;z++)for(let x=0;x<128;x++){
    const cell=((68+x)&127)|(((59-z)&127)<<7);
    if(previous&&[cell,neighbor(cell,1,0),neighbor(cell,0,1),neighbor(cell,1,1)].every(i=>cells[i]===previous.cells[i]))continue;
    const tile=terrainTile(land,brightness,cell,t);updated++;
    for(let y=0;y<32;y++)for(let px=0;px<32;px++){
      const at=((z*32+31-y)*4096+x*32+px)*4,color=tile[y*32+px]*4;
      out[at]=t.palette[color];out[at+1]=t.palette[color+1];out[at+2]=t.palette[color+2];out[at+3]=255;
    }
  }
  return {pixels:out,cells,updated};
}
