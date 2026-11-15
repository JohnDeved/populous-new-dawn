import {normalizeSurface} from './normalize-surface.mjs';
// Caller owns rendering pause/join. Sequential copied reads are not an atomic snapshot.
export function captureSurface({readSpan,base,width,height,pitch,format,palette}) {
 if(typeof readSpan!=='function')throw Error('need copied span reader');
 if(!Number.isInteger(base)||base<1||base>0xffffffff)throw Error('invalid guest base');
 const bpp=format==='rgb565le'?2:format==='indexed8'?1:0;
 if(!bpp)throw Error('unsupported format');
 for(const n of [width,height])if(!Number.isInteger(n)||n<1||n>1024)throw Error('invalid dimensions');
 if(!Number.isInteger(pitch)||pitch<width*bpp||pitch>65536)throw Error('invalid pitch');
 const rowBytes=width*bpp,end=base+(height-1)*pitch+rowBytes;
 if(!Number.isSafeInteger(end)||end>0x100000000)throw Error('guest span overflow');
 // Compact rows cap allocation at 2MiB; padding is not fetched.
 const bytes=new Uint8Array(rowBytes*height);
 for(let y=0;y<height;y++){
  const row=readSpan(base+y*pitch,rowBytes);
  if(!(row instanceof Uint8Array)||row.length!==rowBytes)throw Error('invalid copied row');
  bytes.set(row,y*rowBytes);
 }
 const result=normalizeSurface({bytes,width,height,pitch:rowBytes,format,palette});
 return {...result,capture:{base,pitch,rows:height,readBytes:bytes.length,consistency:'caller must hold exclusive rendering ownership'}};
}
