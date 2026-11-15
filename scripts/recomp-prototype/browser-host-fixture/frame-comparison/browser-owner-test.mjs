// Browser-only authored test. Import then await testOwner(canvas).
export async function testOwner(canvas){
 const worker=new Worker(new URL('./browser-owner-worker.mjs',import.meta.url),{type:'module'});
 const patterns=[[1,2,3,4],[4,3,2,1],[2,4,1,3],[3,1,4,2]],receipts=[],expected=[];
 const shared=typeof SharedArrayBuffer==='function';
 const target=shared?14:10;
 let timer;
 const equal=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
 try{
  const done=new Promise((resolve,reject)=>{
   timer=setTimeout(()=>reject(Error('worker deadline')),3000);
   worker.onerror=e=>reject(Error(e.message||'worker error'));
   worker.onmessageerror=()=>reject(Error('worker message error'));
   worker.onmessage=({data})=>{receipts.push(data);if(receipts.length===target)resolve();};
  });
  for(let i=0;i<4;i++){
   const palette=new Uint32Array(256);
   for(let k=1;k<=4;k++)palette[k]=((i*40+k)<<16)|((k*30+i)<<8)|(i+k*20);
   expected.push(patterns[i].flatMap(k=>[(palette[k]>>>16)&255,(palette[k]>>>8)&255,palette[k]&255,255]));
   worker.postMessage({sequence:i*2+1,op:'setFrame',indices:Uint8Array.from(patterns[i]),palette});palette.fill(0);
   worker.postMessage({sequence:i*2+2,op:'capture'});
  }
  worker.postMessage({sequence:9,op:'setFrame',indices:Uint8Array.of(1),palette:new Uint32Array(256)});
  worker.postMessage({sequence:10,op:'capture'});
  if(shared){
   worker.postMessage({sequence:11,op:'setFrame',indices:new Uint8Array(new SharedArrayBuffer(4)),palette:new Uint32Array(256)});
   worker.postMessage({sequence:12,op:'capture'});
   worker.postMessage({sequence:13,op:'setFrame',indices:Uint8Array.of(1,2,3,4),palette:new Uint32Array(new SharedArrayBuffer(1024))});
   worker.postMessage({sequence:14,op:'capture'});
  }
  await done;
  canvas.width=2;canvas.height=2;
  const context=canvas.getContext('2d');if(!context)throw Error('Canvas2D unavailable');
  for(let i=0;i<4;i++){
   const result=receipts[i*2+1];
   if(result.sequence!==i*2+2||result.generation!==i+1||!equal([...result.rgba],expected[i]))throw Error('worker frame mismatch');
   context.putImageData(new ImageData(new Uint8ClampedArray(result.rgba),2,2),0,0);
   if(!equal([...context.getImageData(0,0,2,2).data],expected[i]))throw Error('canvas byte mismatch');
  }
  if(receipts[8].error!=='invalid frame')throw Error('malformed frame accepted');
  if(shared)for(const i of [10,12])if(receipts[i].error!=='shared input forbidden')throw Error('shared input accepted');
  for(const i of shared?[9,11,13]:[9])if(receipts[i].generation!==4||!equal([...receipts[i].rgba],expected[3]))throw Error('rejected input mutated frame');
  return {scope:'synthetic browser owner and Canvas2D only',frames:4,exactCanvasBytes:true,sharedInputControl:shared?'both rejected':'unavailable, not tested',crossOriginIsolated,terminationRequested:true};
 }finally{clearTimeout(timer);worker.terminate();}
}
