// Read an already-loaded same-origin asset image through Canvas2D, without WebGL.
// Owns only its temporary canvas and returned pixel buffer, never the source image.
export async function readAssetImagePixels(image,{width,height,maxBytes}){
 if(typeof HTMLImageElement==='undefined'||!(image instanceof HTMLImageElement)||!image.complete||image.naturalWidth!==width||image.naturalHeight!==height)throw new Error('Complete unscaled HTML asset image required');
 if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<=0||height<=0||width*height*4!==maxBytes)throw new Error('Invalid asset readback bounds');
 const canvas=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(width,height):document.createElement('canvas');
 canvas.width=width;canvas.height=height;
 try{
  const context=canvas.getContext('2d',{willReadFrequently:true});if(!context)throw new Error('Canvas2D asset decoding unavailable');
  context.drawImage(image,0,0);
  const pixels=context.getImageData(0,0,width,height).data;
  // getImageData owns a fresh byte buffer; this view adds no second full image copy.
  return new Uint8Array(pixels.buffer,pixels.byteOffset,pixels.byteLength);
 }finally{canvas.width=0;canvas.height=0;}
}
