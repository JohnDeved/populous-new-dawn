import {nativeStep} from './native-math.ts';
import {terrainPointHeight,type NativeTerrain} from './native-terrain.ts';

// 0x475a70's geometry/animation loop. Camera clipping and the painter pool
// belong to the renderer. The phase advances only when the halo is drawn.
export function spellHalo(land:Pick<NativeTerrain,'heights'|'flags'>,origin:{x:number;y:number},range:number,state:{angle:number},frame:number){
  state.angle=(state.angle+8)&65535;
  return Array.from({length:85},(_,i)=>{
    const angle=(state.angle+i*24)&2047;
    const q=nativeStep({x:origin.x/256,z:-origin.y/256},angle,(range<<16)>>16);
    const p={x:Math.round(q.x*256)&65535,y:-Math.round(q.z*256)&65535};
    return {...p,h:terrainPointHeight(land,p),frame:1466+(((frame+i)|0)%12)};
  });
}

// Queue depth in 0x475cc4; the shadow uses this bucket for sprite scaling.
export function haloBucket(depth:number){
  const d=(depth+0x6ed4)|0;
  return d<64?0:Math.min(3584,Math.trunc(d/16));
}
