// Authored offline RGBA comparator. Does not launch games or authenticate receipts.
import {createHash} from 'node:crypto';
const digest=b=>createHash('sha256').update(b).digest('hex');
const shared=['scenario','inputSha256','cameraSha256','seed','tick','width','height','pixelFormat'];
const sha=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
function validate(receipt,rgba){
 if(receipt?.pixelFormat!=='rgba8-unpremultiplied-srgb')throw Error('unsupported pixel format');
 if(!receipt||receipt.schema!==1||!['original','port','fixture'].includes(receipt.kind))throw Error('invalid capture kind/schema');
 for(const name of ['scenario','seed','renderer'])if(typeof receipt[name]!=='string'||!receipt[name].length||receipt[name].length>256)throw Error('invalid '+name);
 for(const name of ['inputSha256','cameraSha256','sourceSha256','captureRunnerSha256','rgbaSha256'])if(!sha(receipt[name]))throw Error('invalid '+name);
 if(!Number.isSafeInteger(receipt.tick)||receipt.tick<0)throw Error('invalid tick');
 for(const name of ['width','height'])if(!Number.isInteger(receipt[name])||receipt[name]<1||receipt[name]>1024)throw Error('invalid '+name);
 if(!(rgba instanceof Uint8Array)||rgba.length!==receipt.width*receipt.height*4)throw Error('invalid RGBA length');
 if(digest(rgba)!==receipt.rgbaSha256)throw Error('RGBA digest mismatch');
}
export function compare(reference,candidate,{allowFixture=false}={}){
 validate(reference.receipt,reference.rgba);validate(candidate.receipt,candidate.rgba);
 const fixture=reference.receipt.kind==='fixture'||candidate.receipt.kind==='fixture';
 if(fixture){if(!allowFixture||reference.receipt.kind!=='fixture'||candidate.receipt.kind!=='fixture')throw Error('fixture-only comparison requires explicit opt-in and two fixtures');}
 else if(reference.receipt.kind!=='original'||candidate.receipt.kind!=='port')throw Error('need original reference and port candidate');
 for(const key of shared)if(reference.receipt[key]!==candidate.receipt[key])throw Error('capture context mismatch: '+key);
 let differingPixels=0,absoluteSum=0,maxChannelError=0,firstDifference=null;
 for(let i=0;i<reference.rgba.length;i+=4){let changed=false;
  for(let c=0;c<4;c++){const delta=Math.abs(reference.rgba[i+c]-candidate.rgba[i+c]);absoluteSum+=delta;maxChannelError=Math.max(maxChannelError,delta);changed ||= delta!==0;}
  if(changed){differingPixels++;firstDifference??={x:(i/4)%reference.receipt.width,y:Math.floor(i/4/reference.receipt.width)};}
 }
 const pixels=reference.receipt.width*reference.receipt.height;
 return {schema:1,scope:fixture?'synthetic fixture comparison only':'receipt-labelled original versus port pixels',provenance:'receipt labels are supplied, not independently authenticated by this tool',context:Object.fromEntries(shared.map(k=>[k,reference.receipt[k]])),reference:{...reference.receipt},candidate:{...candidate.receipt},equal:differingPixels===0,pixels,differingPixels,differingFraction:differingPixels/pixels,maxChannelError,meanAbsoluteChannelError:absoluteSum/(pixels*4),firstDifference};
}
