import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
const shared=new SharedArrayBuffer(8),state=new Int32Array(shared);
const worker=new Worker(new URL('./stack-worker.mjs',import.meta.url),{workerData:shared,resourceLimits:{maxOldGenerationSizeMb:16,stackSizeMb:2}});
let tick=false;
const timer=setTimeout(()=>worker.terminate(),3000);
try{
 const value=await new Promise((resolve,reject)=>{
 worker.on('error',reject);
 worker.on('exit',code=>{if(code!==0)reject(Error('worker exited '+code));});
 worker.on('message',m=>{
  if(m.kind==='waiting'){
   assert.equal(m.input,5);
   setTimeout(()=>{tick=true;Atomics.store(state,1,6);Atomics.store(state,0,1);Atomics.notify(state,0,1);},5);
  }else if(m.kind==='result')resolve(m.value);
  else reject(Error(m.message));
 });
 });
 assert.equal(value,25);assert.equal(tick,true);
 console.log(JSON.stringify({scope:'Node worker synthetic nested WASM, not browser pthread proof',passed:['blocked nested WASM stack resumes on notification','coordinator event loop remains responsive'],sharedBytes:shared.byteLength,memory:process.memoryUsage()},null,2));
}finally{clearTimeout(timer);await worker.terminate();}
