// Authored synthetic single-owner seam. No original runtime or shared memory.
import {parentPort} from 'node:worker_threads';
import {GuestMemory} from '../../browser-boundary-fixture/guest-memory.mjs';
import {captureSurface} from './capture-surface.mjs';
const memory=new GuestMemory(2);memory.map(0xfe000000,0x20000);
const base=0xfe00fffe,width=2,height=2,pitch=4;
let palette=new Uint32Array(256),sequence=0,generation=0,commands=0;
parentPort.on('message',message=>{
 if(++commands>32){parentPort.close();return;}
 try{
  if(!message||message.sequence!==sequence+1)throw Error('out of order');
  sequence=message.sequence;
  if(message.op==='setFrame'){
   if(!(message.indices instanceof Uint8Array)||message.indices.length!==4||!(message.palette instanceof Uint32Array)||message.palette.length!==256)throw Error('invalid frame');
   if(message.indices.buffer instanceof SharedArrayBuffer||message.palette.buffer instanceof SharedArrayBuffer)throw Error('shared input forbidden');
   // Both rows prevalidated by fixed mapped layout; no await/callback during commit.
   memory.writeSpan(base,message.indices.slice(0,2));memory.writeSpan(base+pitch,message.indices.slice(2));palette=message.palette.slice();generation++;
   parentPort.postMessage({sequence,generation,ok:true});
  }else if(message.op==='capture'){
   const result=captureSurface({base,width,height,pitch,format:'indexed8',palette,readSpan:(a,n)=>memory.readSpan(a,n)});
   parentPort.postMessage({sequence,generation,rgba:result.rgba,ownership:'single worker synchronous queue'},[result.rgba.buffer]);
  }else throw Error('unknown command');
 }catch(error){parentPort.postMessage({sequence,error:String(error.message)});}
});
