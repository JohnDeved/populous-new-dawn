import {parentPort,workerData} from 'node:worker_threads';
import {makeModule} from './stack-seam.mjs';
const state=new Int32Array(workerData);
const instance=new WebAssembly.Instance(makeModule(),{env:{wait:x=>{
 parentPort.postMessage({kind:'waiting',input:x});
 const status=Atomics.wait(state,0,0,1000);
 if(status==='timed-out')throw Error('bounded wait timed out');
 return Atomics.load(state,1);
}}});
try{parentPort.postMessage({kind:'result',value:instance.exports.run(5)});}catch(e){parentPort.postMessage({kind:'error',message:e.message});}
