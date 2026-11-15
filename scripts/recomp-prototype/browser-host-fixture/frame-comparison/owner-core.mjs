// Authored fixed synthetic surface owner, transport-neutral. No original runtime.
import {GuestMemory} from '../../browser-boundary-fixture/guest-memory.mjs';
import {captureSurface} from './capture-surface.mjs';
export function createOwner(){
 const memory=new GuestMemory(2);memory.map(0xfe000000,0x20000);
 const base=0xfe00fffe,width=2,height=2,pitch=4;
 let palette=new Uint32Array(256),sequence=0,generation=0,commands=0,closed=false;
 return message=>{
  if(closed||++commands>32){closed=true;return {closed:true};}
  try{
   if(!message||message.sequence!==sequence+1)throw Error('out of order');
   sequence=message.sequence;
   if(message.op==='setFrame'){
    if(!(message.indices instanceof Uint8Array)||message.indices.length!==4||!(message.palette instanceof Uint32Array)||message.palette.length!==256)throw Error('invalid frame');
    // Positive check also works where SharedArrayBuffer is unavailable.
    if(!(message.indices.buffer instanceof ArrayBuffer)||!(message.palette.buffer instanceof ArrayBuffer))throw Error('shared input forbidden');
    memory.writeSpan(base,message.indices.slice(0,2));memory.writeSpan(base+pitch,message.indices.slice(2));palette=message.palette.slice();generation++;
    return {sequence,generation,ok:true};
   }
   if(message.op==='capture'){
    const result=captureSurface({base,width,height,pitch,format:'indexed8',palette,readSpan:(a,n)=>memory.readSpan(a,n)});
    return {sequence,generation,rgba:result.rgba,ownership:'single worker synchronous queue'};
   }
   throw Error('unknown command');
  }catch(error){return {sequence,error:String(error.message)};}
 };
}
