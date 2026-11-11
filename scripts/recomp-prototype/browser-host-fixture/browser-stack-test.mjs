export async function runStackTest({notify=true}={}){
 const support={crossOriginIsolated:self.crossOriginIsolated,sharedArrayBuffer:typeof SharedArrayBuffer==='function',jspi:typeof WebAssembly.Suspending==='function'&&typeof WebAssembly.promising==='function'};
 if(!support.crossOriginIsolated||!support.sharedArrayBuffer)return {status:'unsupported',support};
 const shared=new SharedArrayBuffer(8),state=new Int32Array(shared);
 let worker,timer,wakeTimer,mainTick=false,waiting=false,terminationRequested=false,waitResult;
 try{
  worker=new Worker(new URL('./browser-stack-worker.mjs',import.meta.url),{type:'module'});
  const value=await new Promise((resolve,reject)=>{
   timer=setTimeout(()=>reject(Error('supervisor timeout')),3000);
   worker.onerror=e=>reject(Error(e.message));
   worker.onmessage=({data:m})=>{
    if(m.kind==='waiting'){
     if(waiting||m.input!==5){reject(Error('bad waiting receipt'));return;}
     waiting=true;
     wakeTimer=setTimeout(()=>{mainTick=true;if(notify){Atomics.store(state,1,6);Atomics.store(state,0,1);Atomics.notify(state,0,1);}},10);
    }else if(m.kind==='result'){
     waitResult=m.waitResult;
     if(!waiting||!mainTick||m.value!==25||waitResult!=='ok')reject(Error('unexpected stack result'));else resolve(m.value);
    }else reject(Error(m.message??'unknown worker message'));
   };
   worker.postMessage({buffer:shared});
  });
  return {status:'passed',support,value,mainTick,waiting,waitResult,sharedBytes:8};
 }finally{
  clearTimeout(timer);clearTimeout(wakeTimer);worker?.terminate();terminationRequested=true;
  self.__lastStackCleanup={terminationRequested,hasPendingTimers:false};
 }
}
