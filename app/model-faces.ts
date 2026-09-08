export type NativeModel = {p:number[];uv:number[];scale:number;faces:number[]};

// 0x471c40: low bits select faces in stages 0–3; matching high bits replace
// their texture with tile 250. 0x40cde0 maps that cap to a 32-pixel tile minus
// two fixed-point units. Stage 4 uses the normal complete-object renderer.
export function modelStage(data:NativeModel,stage:number) {
  if(stage===4)return data;
  const p:number[]=[],uv:number[]=[],edge=(0x200000-2)/0x200000;
  const cap=[0,0,edge,0,edge,edge,0,edge];
  for(let f=0,vertex=0;f<data.faces.length;f+=2) {
    const n=data.faces[f],flags=data.faces[f+1],corners=n===3?[0,1,2]:[0,1,2,0,2,3];
    if(flags&(1<<stage))for(let k=0;k<corners.length;k++) {
      p.push(...data.p.slice((vertex+k)*3,(vertex+k+1)*3));
      if(flags&(16<<stage))uv.push((2+cap[corners[k]*2])/8,1-(31+cap[corners[k]*2+1])/32);
      else uv.push(...data.uv.slice((vertex+k)*2,(vertex+k+1)*2));
    }
    vertex+=corners.length;
  }
  return {p,uv};
}
