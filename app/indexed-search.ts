import data from './original-search.json' with {type:'json'};

// Original 16 x 12-byte records. Index zero is reserved; explicit bytes keep
// the type-1 radius/side fields aliased with the type-2 angle word.
export const createIndexedSearch=()=>new Uint8Array(16*12);
const view=(pool:Uint8Array)=>new DataView(pool.buffer,pool.byteOffset,pool.byteLength);

// Complete 0x49a2f0 for defined search types 1 and 2.
export function startIndexedSearch(pool:Uint8Array,type:1|2,angle:number,first:number,last:number){
  if(type!==1&&type!==2)throw new RangeError('Undefined native indexed search type');
  const v=view(pool);let id=1;while(id<16&&pool[id*12])id++;if(id===16)return 0;
  const a=id*12;pool[a]=1;pool[a+1]=type;first=Math.min(first&255,31);last=Math.min(Math.max(last&255,first),31);
  pool[a+2]=first;pool[a+3]=last;v.setInt16(a+6,0,true);
  if(type===1){pool[a+4]=first;pool[a+5]=3;}
  else{
    angle&=2047;v.setUint16(a+4,angle,true);const [offset,count]=data.rings[first];
    v.setInt16(a+8,offset+count*2,true);v.setInt16(a+10,offset+Math.trunc(count*angle/2048)*2,true);
  }
  return id;
}

// Complete 0x49a3f0. A terminal call mutates its record but emits no point.
// In type 2, count+1 calls advance a ring: preserve the repeated starting point.
export function nextIndexedSearch(pool:Uint8Array,id:number):{x:number;y:number}|null{
  const v=view(pool),a=(id&255)*12;let x=0,y=0,valid=true;
  if(pool[a+1]===1){
    const radius=pool[a+4],step=v.getInt16(a+6,true);
    switch(pool[a+5]){case 0:x=step-radius;y=radius;break;case 1:x=radius;y=radius-step;break;case 2:x=radius-step;y=-radius;break;case 3:x=-radius;y=step-radius;break;default:throw new RangeError('Invalid native search side');}
    v.setInt16(a+6,step+1,true);
    if(v.getInt16(a+6,true)>=radius*2){
      v.setInt16(a+6,0,true);pool[a+5]++;
      if(pool[a+5]>3){pool[a+5]=0;pool[a+4]++;if(pool[a+4]>pool[a+3])valid=false;}
    }
  }else if(pool[a+1]===2){
    const offset=v.getInt16(a+10,true);x=data.points[offset];y=data.points[offset+1];
    v.setInt16(a+6,v.getInt16(a+6,true)+1,true);
    const [start,count]=data.rings[pool[a+2]];
    if(v.getInt16(a+6,true)>count){
      pool[a+2]++;
      if(pool[a+2]>pool[a+3])valid=false;
      else{
        const [start,count]=data.rings[pool[a+2]],angle=v.getInt16(a+4,true);
        v.setInt16(a+6,0,true);v.setInt16(a+8,start+count*2,true);v.setInt16(a+10,start+Math.trunc(count*angle/2048)*2,true);
      }
    }else{
      v.setInt16(a+10,offset+2,true);
      if(v.getInt16(a+10,true)>=v.getInt16(a+8,true))v.setInt16(a+10,start,true);
    }
  }else throw new RangeError('Undefined native indexed search type');
  return valid?{x,y}:null;
}

// Complete 0x49a5d0: retain every other byte for subsequent slot reuse.
export function endIndexedSearch(pool:Uint8Array,id:number){pool[(id&255)*12]=0;}
