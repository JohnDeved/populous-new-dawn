// Authored bounded conversion of copied surface bytes; no guest pointers or execution.
export function normalizeSurface({bytes,width,height,pitch,format,palette}) {
 for(const [name,n] of Object.entries({width,height})) if(!Number.isInteger(n)||n<1||n>1024) throw Error('invalid '+name);
 const bpp=format==='rgb565le'?2:format==='indexed8'?1:0;
 if(!bpp)throw Error('unsupported format');
 if(!Number.isInteger(pitch)||pitch<width*bpp||pitch>65536)throw Error('invalid pitch');
 const required=(height-1)*pitch+width*bpp;
 if(!(bytes instanceof Uint8Array)||bytes.length!==required)throw Error('invalid surface length');
 if(format==='indexed8'&&(!(palette instanceof Uint32Array)||palette.length!==256))throw Error('need 256 XRGB palette entries');
 const rgba=new Uint8Array(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const src=y*pitch+x*bpp,dst=(y*width+x)*4;
  if(bpp===1){const c=palette[bytes[src]];rgba[dst]=(c>>>16)&255;rgba[dst+1]=(c>>>8)&255;rgba[dst+2]=c&255;}
  else {const c=bytes[src]+bytes[src+1]*256,r=c>>>11,g=(c>>>5)&63,b=c&31;rgba[dst]=(r<<3)|(r>>>2);rgba[dst+1]=(g<<2)|(g>>>4);rgba[dst+2]=(b<<3)|(b>>>2);}
  rgba[dst+3]=255;
 }
 return {rgba,normalization:{format,pitch,alpha:'opaque',expansion:format==='rgb565le'?'bit replication 5/6/5 to 8':'XRGB numeric palette',colorManagement:'none; source color-space interpretation remains caller responsibility'}};
}
