import assert from 'node:assert/strict';import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import {createSharedPages,SharedPages} from './shared-page-memory.mjs';
if(!isMainThread){const m=new SharedPages(workerData.descriptor);m.mapPage(0xfe000000);for(let i=0;i<1000;i++)m.add32(0xfe000000,1);parentPort.postMessage({done:true});}
else{
 const descriptor=createSharedPages(3),m=new SharedPages(descriptor),workers=[];
 const outcomes=[];try{for(let i=0;i<2;i++){const w=new Worker(new URL(import.meta.url),{workerData:{descriptor},resourceLimits:{maxOldGenerationSizeMb:16}});workers.push(w);outcomes.push(new Promise((ok,fail)=>{w.once('message',ok);w.once('error',fail);w.once('exit',c=>{if(c)fail(Error('Worker exit '+c))})}));}
 await Promise.race([Promise.all(outcomes),new Promise((_,fail)=>{const t=setTimeout(()=>fail(Error('Worker deadline')),5000);t.unref();})]);
 assert.equal(m.mappedPages,1);assert.equal(m.read32(0xfe000000),2000);
 m.mapPage(0x10000);m.mapPage(0x20000);m.write32(0x1fffe,0xdeadbeef);assert.equal(m.read32(0x1fffe),0xdeadbeef);
 m.protectPage(0x20000,false);assert.throws(()=>m.write32(0x1fffe,0),RangeError);assert.equal(m.read32(0x1fffe),0xdeadbeef);
 assert.throws(()=>m.mapPage(0x400000),RangeError);assert.equal(m.mappedPages,3);assert.throws(()=>m.read32(0),RangeError);
 Atomics.store(new Int32Array(descriptor.control),0,1);const started=Date.now();assert.throws(()=>m.read32(0x10000),/deadline/);assert.ok(Date.now()-started>=450);Atomics.store(new Int32Array(descriptor.control),0,0);
 console.log(JSON.stringify({passed:true,scope:'synthetic globally locked shared-memory model, not original pthread/game',workers:2,increments:2000,uniqueSharedMap:true,mappedPages:m.mappedPages,backingBytes:descriptor.data.byteLength,metadataBytes:descriptor.table.byteLength+descriptor.control.byteLength,rssBytes:process.memoryUsage().rss}));
 }finally{await Promise.all(workers.map(w=>w.terminate()));}
}
