import {decodeSurfaceDescriptor} from '../../browser-boundary-fixture/surface-descriptor/decode.mjs';
import {captureSurface} from './capture-surface.mjs';
// Caller declarations are preconditions, not independently authenticated ownership.
export function capturePresentation({descriptor,fullSurface,rendererPath,exclusiveOwner,readSpan,palette}){
 if(exclusiveOwner!==true)throw Error('exclusive rendering owner required');
 if(rendererPath!=='software-surface')throw Error('hybrid/direct3d capture unsupported');
 const surface=decodeSurfaceDescriptor(descriptor,{fullSurface});
 let copiedPalette;
 if(surface.paletteRequired){
  if(!(palette instanceof Uint32Array)||palette.length!==256||!(palette.buffer instanceof ArrayBuffer))throw Error('copied resolved palette required');
  copiedPalette=palette.slice();
 }
 return {...captureSurface({...surface,readSpan,palette:copiedPalette}),boundary:{rendererPath,fullSurface:true,exclusiveOwner:'caller asserted',paletteResolved:surface.paletteRequired}};
}
