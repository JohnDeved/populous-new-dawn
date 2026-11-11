// Newly authored bounded ABI model, not an original runtime execution adapter.
const savedRegisters=['ecx','edx','ebx','ebp','esi','edi','df'];
const uint32=x=>{if(!Number.isInteger(x)||x<0||x>0xffffffff)throw RangeError('uint32 required');return x;};
export const MAGIC_RETURN=0xfdfffff0;
export function hostArgument(memory,cpu,index){
 if(!Number.isInteger(index)||index<0||index>=16)throw RangeError('argument index');
 return memory.read32((uint32(cpu.esp)+4+4*index)>>>0);
}
export function completeShim(cpu,argc,value){
 if(!Number.isInteger(argc)||argc< -1||argc>16)throw RangeError('shim argument count');
 cpu.eax=uint32(value);cpu.esp=(uint32(cpu.esp)+4+4*Math.max(argc,0))>>>0;
}
export function callGuest(memory,cpu,target,args,dispatch){
 uint32(target);uint32(cpu.esp);
 if(!Array.isArray(args)||args.length>16)throw RangeError('argument budget');
 args.forEach(uint32);
 const saved=Object.fromEntries(['esp',...savedRegisters].map(k=>[k,uint32(cpu[k])]));
 // One bounded prevalidated host write, unlike sequential original PUSH faults.
 const frame=new Uint8Array(4*(args.length+1));const view=new DataView(frame.buffer);
 view.setUint32(0,MAGIC_RETURN,true);args.forEach((x,i)=>view.setUint32(4+4*i,x,true));
 const frameAddress=(cpu.esp-frame.byteLength)>>>0;
 memory.writeSpan(frameAddress,frame);cpu.esp=frameAddress;
 const outcome=dispatch(cpu,target);
 if(outcome&&typeof outcome.then==='function')throw TypeError('dispatch must preserve a synchronous guest stack');
 const result=uint32(cpu.eax);
 Object.assign(cpu,saved);return result;
 // On dispatch fault: preserve diagnostic frame, do not fabricate recovery.
}
