// Synthetic bounded adapter; not connected to original game code or native PTR.
export class GuestMemory {
  #pages=new Map();
  #maxPages;
  constructor(maxPages=16) {if(!Number.isSafeInteger(maxPages)||maxPages<1||maxPages>16)throw new RangeError('Page budget');this.#maxPages=maxPages;}
  get maxPages(){return this.#maxPages;}
  get allocatedBytes(){return this.#pages.size*65536;}
  #range(address,length) {if(!Number.isSafeInteger(address)||!Number.isSafeInteger(length)||length<1||length>65536||address<65536||address+length>0x100000000)throw new RangeError('Guest span');}
  map(address,length) {
    if(!Number.isSafeInteger(address)||!Number.isSafeInteger(length)||address<65536||address+length>0x100000000||length<65536||address%65536||length%65536)throw new RangeError('Page alignment');
    const missing=[];for(let a=address;a<address+length;a+=65536)if(!this.#pages.has(a/65536))missing.push(a/65536);
    if(this.#pages.size+missing.length>this.#maxPages)throw new RangeError('Guest page budget exceeded');
    const fresh=missing.map(page=>[page,{bytes:new Uint8Array(65536),writable:true}]);
    for(const [page,data] of fresh)this.#pages.set(page,data);
  }
  protect(address,length,writable) {
    if(typeof writable!=='boolean'||!Number.isSafeInteger(address)||!Number.isSafeInteger(length)||address<65536||address+length>0x100000000||length<65536||address%65536||length%65536)throw new RangeError('Protection alignment');
    const pages=[];for(let a=address;a<address+length;a+=65536){this.#range(a,1);const p=this.#pages.get(a/65536);if(!p)throw new RangeError('Unmapped page');pages.push(p);}
    for(const p of pages)p.writable=writable;
  }
  #locations(address,length,write=false) {
    this.#range(address,length);const out=[];
    for(let i=0;i<length;i++){const a=address+i,page=this.#pages.get(Math.floor(a/65536));if(!page||write&&!page.writable)throw new RangeError('Unmapped or protected guest address');out.push([page.bytes,a%65536]);}return out;
  }
  readSpan(address,length){return Uint8Array.from(this.#locations(address,length),([p,i])=>p[i]);}
  writeSpan(address,bytes){if(!(bytes instanceof Uint8Array))throw new TypeError('Byte buffer required');const a=this.#locations(address,bytes.length,true);for(let i=0;i<a.length;i++)a[i][0][a[i][1]]=bytes[i];}
  read8(address){return this.readSpan(address,1)[0];}
  write8(address,value){if(!Number.isInteger(value)||value<0||value>255)throw new RangeError('Unsigned8');this.writeSpan(address,Uint8Array.of(value));}
  read16(address){return new DataView(this.readSpan(address,2).buffer).getUint16(0,true);}
  write16(address,value){if(!Number.isInteger(value)||value<0||value>65535)throw new RangeError('Unsigned16');const b=new Uint8Array(2);new DataView(b.buffer).setUint16(0,value,true);this.writeSpan(address,b);}
  read32(address){return new DataView(this.readSpan(address,4).buffer).getUint32(0,true);}
  write32(address,value){if(!Number.isInteger(value)||value<0||value>0xffffffff)throw new RangeError('Unsigned value');const b=new Uint8Array(4);new DataView(b.buffer).setUint32(0,value,true);this.writeSpan(address,b);}
  read64(address){return new DataView(this.readSpan(address,8).buffer).getBigUint64(0,true);}
  write64(address,value){if(typeof value!=='bigint'||value<0n||value>0xffffffffffffffffn)throw new RangeError('Unsigned64');const b=new Uint8Array(8);new DataView(b.buffer).setBigUint64(0,value,true);this.writeSpan(address,b);}
  readFloat32(address){return new DataView(this.readSpan(address,4).buffer).getFloat32(0,true);}
  readFloat64(address){return new DataView(this.readSpan(address,8).buffer).getFloat64(0,true);}
  writeFloat32(address,value){if(typeof value!=='number')throw new TypeError('Float number');const b=new Uint8Array(4);new DataView(b.buffer).setFloat32(0,value,true);this.writeSpan(address,b);}
  writeFloat64(address,value){if(typeof value!=='number')throw new TypeError('Float number');const b=new Uint8Array(8);new DataView(b.buffer).setFloat64(0,value,true);this.writeSpan(address,b);}
  readCString(address,maxBytes){this.#range(address,maxBytes);const result=[];for(let i=0;i<maxBytes;i++){const c=this.readSpan(address+i,1)[0];if(!c)return Uint8Array.from(result);result.push(c);}throw new RangeError('Unterminated bounded string');}
  // MOVSB-like order model: addresses refer to first element in chosen direction.
  // Per-byte effects may precede a fault; this deliberately is not memmove/atomic.
  moveBytes(destination,source,count,direction=1){if(!Number.isSafeInteger(count)||count<0||count>65536||![1,-1].includes(direction))throw new RangeError('Move bound');for(let i=0;i<count;i++)this.writeSpan(destination+i*direction,this.readSpan(source+i*direction,1));}
}
