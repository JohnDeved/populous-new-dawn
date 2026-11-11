// Authored copied DirectDraw descriptor validation. Does not read guest pointers.
export function decodeSurfaceDescriptor(bytes,{fullSurface=false}={}) {
 if(!fullSurface)throw Error('full-surface provenance required; rectangle locks unsupported');
 if(!(bytes instanceof Uint8Array)||!(bytes.buffer instanceof ArrayBuffer)||![108,124].includes(bytes.byteLength))throw Error('invalid copied descriptor');
 const d=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),u=o=>d.getUint32(o,true);
 if(u(0)!==bytes.length||u(72)!==32)throw Error('descriptor size mismatch');
 const required=0x100e|0x800;
 if((u(4)&required)!==required)throw Error('missing surface fields');
 const height=u(8),width=u(12),pitch=d.getInt32(16,true),base=u(36),flags=u(76),bpp=u(84);
 let format;
 if(bpp===8&&flags===0x60)format='indexed8';
 else if(bpp===16&&flags===0x40&&u(88)===0xf800&&u(92)===0x7e0&&u(96)===0x1f&&u(100)===0)format='rgb565le';
 else throw Error('unsupported surface pixel format');
 if(width<1||height<1||width>1024||height>1024||pitch<width*(bpp/8)||pitch>65536||base<65536)throw Error('invalid surface bounds');
 if(base+(height-1)*pitch+width*(bpp/8)>0x100000000)throw Error('guest span overflow');
 return Object.freeze({base,width,height,pitch,format,paletteRequired:format==='indexed8'});
}
