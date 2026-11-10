import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
const worker=new Worker(new URL('./surface-owner-worker.mjs',import.meta.url),{resourceLimits:{maxOldGenerationSizeMb:64}});
const receipts=[],patterns=[[1,2,3,4],[4,3,2,1],[2,4,1,3],[3,1,4,2]],expected=[];
try{
 const result=new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(Error('worker deadline')),3000);
  worker.on('error',e=>{clearTimeout(timer);reject(e);});
  worker.on('message',m=>{receipts.push(m);if(receipts.length===14){clearTimeout(timer);resolve();}});
 });
 for(let i=0;i<4;i++){
  const palette=new Uint32Array(256);
  for(let k=1;k<=4;k++)palette[k]=((i*40+k)<<16)|((k*30+i)<<8)|(i+k*20);
  expected.push(patterns[i].flatMap(k=>[(palette[k]>>>16)&255,(palette[k]>>>8)&255,palette[k]&255,255]));
  worker.postMessage({sequence:i*2+1,op:'setFrame',indices:Uint8Array.from(patterns[i]),palette});
  palette.fill(0);
  worker.postMessage({sequence:i*2+2,op:'capture'});
 }
 worker.postMessage({sequence:9,op:'setFrame',indices:Uint8Array.of(1),palette:new Uint32Array(256)});
 worker.postMessage({sequence:10,op:'capture'});
 worker.postMessage({sequence:11,op:'setFrame',indices:new Uint8Array(new SharedArrayBuffer(4)),palette:new Uint32Array(256)});
 worker.postMessage({sequence:12,op:'capture'});
 worker.postMessage({sequence:13,op:'setFrame',indices:Uint8Array.of(1,2,3,4),palette:new Uint32Array(new SharedArrayBuffer(1024))});
 worker.postMessage({sequence:14,op:'capture'});
 await result;
 for(let i=0;i<4;i++){
  const capture=receipts[i*2+1];assert.equal(capture.sequence,i*2+2);assert.equal(capture.generation,i+1);assert.deepEqual([...capture.rgba],expected[i]);
 }
 assert.equal(receipts[8].error,'invalid frame');
 for(const index of [10,12])assert.equal(receipts[index].error,'shared input forbidden');
 for(const index of [9,11,13]){assert.equal(receipts[index].generation,4);assert.deepEqual([...receipts[index].rgba],expected[3]);}
 assert.deepEqual([...receipts[1].rgba],expected[0]);
 console.log(JSON.stringify({scope:'authored Node single-owner surface queue',frames:4,variedRowsAndPalettesConsistent:true,sharedInputsRejected:2,rejectedWritesLeaveFrameUnchanged:true}));
}finally{await worker.terminate();}
