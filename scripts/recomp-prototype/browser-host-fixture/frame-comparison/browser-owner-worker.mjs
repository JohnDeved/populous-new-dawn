import {createOwner} from './owner-core.mjs';
const handle=createOwner();
self.onmessage=({data})=>{
 const result=handle(data);
 self.postMessage(result,result.rgba?[result.rgba.buffer]:[]);
 if(result.closed)self.close();
};
