import {makeModule} from './stack-seam.mjs';
self.onmessage=({data})=>{
 try{
  if(!(data.buffer instanceof SharedArrayBuffer)||data.buffer.byteLength!==8)throw Error('invalid shared buffer');
  const state=new Int32Array(data.buffer);
  let waitResult;
  const instance=new WebAssembly.Instance(makeModule(),{env:{wait:x=>{
   self.postMessage({kind:'waiting',input:x});
   const result=Atomics.wait(state,0,0,1000);waitResult=result;
   if(result==='timed-out')throw Error('bounded wait timed out');
   if(result!=='ok')throw Error(`wait did not block: ${result}`);
   return Atomics.load(state,1);
  }}});
  self.postMessage({kind:'result',value:instance.exports.run(5),waitResult});
 }catch(error){self.postMessage({kind:'error',message:String(error)});}
};
