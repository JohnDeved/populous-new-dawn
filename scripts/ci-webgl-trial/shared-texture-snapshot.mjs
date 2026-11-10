import * as THREE from 'three';
// Point-in-time immutable asset store. Host must identify stable asset sources;
// mutable painter/bounds uniforms are deliberately not admitted to this cache.
export function createTextureSnapshotStore({maxBytes=192*1024*1024,maxClones=256,readImagePixels}={}){
 for(const n of [maxBytes,maxClones])if(!Number.isSafeInteger(n)||n<0)throw new Error('Invalid texture budget');
 const sources=new Map(),clones=new Set();let bytes=0,closed=false,admitting=false;
 const requireOpen=()=>{if(closed)throw new Error('Texture store closed')};
 const metadata=t=>({source:t.source,image:t.image,sourceVersion:t.source.version,textureVersion:t.version,width:t.image?.width,height:t.image?.height,data:t.image?.data,currentSrc:t.image?.currentSrc??null});
 const unchanged=(t,m)=>{const now=metadata(t);for(const key of Object.keys(m))if(now[key]!==m[key])throw new Error('Immutable asset metadata changed')};
 const shared=data=>typeof SharedArrayBuffer!=='undefined'&&data.buffer instanceof SharedArrayBuffer;
 const supported=t=>{
  if(!t?.isTexture||t.isVideoTexture||t.isCubeTexture||t.isCompressedTexture||t.isDepthTexture||t.mipmaps.length||(Object.keys(t.userData).length&&!(Object.keys(t.userData).length===1&&t.userData.encodedColors===true)))throw new Error('Unsupported asset texture');
  if(!Number.isSafeInteger(t.image?.width)||!Number.isSafeInteger(t.image?.height)||t.image.width<=0||t.image.height<=0)throw new Error('Invalid image dimensions');
  if(t.type!==THREE.UnsignedByteType||t.format!==THREE.RGBAFormat)throw new Error('Only byte RGBA asset snapshots supported');
 };
 async function admitImmutable(texture,{stableDuringCapture=false}={}){
  requireOpen();if(admitting)throw new Error('Texture admission already in flight');if(stableDuringCapture!==true)throw new Error('Explicit stable-asset contract required');supported(texture);
  if(sources.has(texture.source))return;
  const state=metadata(texture),size=state.width*state.height*4;
  if(!Number.isSafeInteger(size)||size+bytes>maxBytes)throw new Error('Texture snapshot byte budget exceeded');
  // Reserve before invoking a decoder, which must itself respect expected size.
  bytes+=size;admitting=true;let pixels;
  try{
   if(texture.isDataTexture){if(!(state.data instanceof Uint8Array)||state.data.length!==size||shared(state.data))throw new Error('Invalid RGBA byte data');pixels=new Uint8Array(state.data)}
   else{if(typeof readImagePixels!=='function')throw new Error('Image decoder required');const decoded=await readImagePixels(state.image,{width:state.width,height:state.height,maxBytes:size});if(!(decoded instanceof Uint8Array)||decoded.length!==size||shared(decoded))throw new Error('Invalid decoded asset pixels');pixels=new Uint8Array(decoded)}
   unchanged(texture,state);requireOpen();
   sources.set(state.source,{state,texture,pixels,copy:new THREE.Source({width:state.width,height:state.height,data:pixels}),size});
  }catch(error){if(!closed)bytes-=size;throw error}finally{admitting=false}
 }
 function clone(texture){
  requireOpen();supported(texture);const entry=sources.get(texture.source);if(!entry)throw new Error('Unregistered immutable source');unchanged(entry.texture,entry.state);
  if(clones.size>=maxClones)throw new Error('Texture clone budget exceeded');
  const surrogate=Object.create(texture);surrogate.source=new THREE.Source(texture.image);
  const result=new THREE.DataTexture();clones.add(result);result.copy(surrogate);result.source=entry.copy;return result;
 }
 function verifySources(){
  requireOpen();for(const e of sources.values()){unchanged(e.texture,e.state);if(e.state.data){for(let i=0;i<e.pixels.length;i++)if(e.state.data[i]!==e.pixels[i])throw new Error('Immutable asset pixel data changed')}}
 }
 function dispose(){if(closed)return;closed=true;const errors=[];for(const t of clones){try{t.dispose()}catch(e){errors.push(e)}}clones.clear();sources.clear();bytes=0;if(errors.length)throw new AggregateError(errors,'Texture snapshot disposal failed')}
 return{admitImmutable,clone,verifySources,dispose,stats:()=>({copiedBytes:bytes,sourceCount:sources.size,cloneCount:clones.size}),scope:'Stable point-in-time assets. maxBytes bounds retained pixel copies only, not temporary decoder/canvas buffers or process RSS; mutable uniforms use a separate path'};
}
