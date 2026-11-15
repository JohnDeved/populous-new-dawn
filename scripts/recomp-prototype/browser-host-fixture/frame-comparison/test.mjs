import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {compare} from './compare.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
const rgba=Uint8Array.of(255,0,0,255,0,255,0,255);
const receipt={schema:1,pixelFormat:'rgba8-unpremultiplied-srgb',kind:'fixture',scenario:'four-quadrant-transport',inputSha256:hash('empty inputs'),cameraSha256:hash('orthographic4x4'),seed:'fixed',tick:0,width:2,height:1,renderer:'Canvas2D',sourceSha256:hash('synthetic source'),captureRunnerSha256:hash('synthetic runner'),rgbaSha256:hash(rgba)};
const frame={receipt,rgba};const options={allowFixture:true};let passed=0;
assert.deepEqual(compare(frame,frame,options).firstDifference,null);assert.equal(compare(frame,frame,options).equal,true);passed++;
const changed=rgba.slice();changed[4]=1;const other={receipt:{...receipt,rgbaSha256:hash(changed)},rgba:changed};const result=compare(frame,other,options);assert.equal(result.equal,false);assert.equal(result.differingPixels,1);assert.equal(result.maxChannelError,1);assert.equal(result.meanAbsoluteChannelError,1/8);assert.deepEqual(result.firstDifference,{x:1,y:0});passed++;
assert.throws(()=>compare(frame,frame),/fixture-only/);passed++;
assert.throws(()=>compare(frame,{receipt,rgba:changed},options),/digest mismatch/);passed++;
for(const [key,value] of [['scenario','different'],['tick',1],['seed','other'],['cameraSha256',hash('other')],['inputSha256',hash('other')]]){assert.throws(()=>compare(frame,{receipt:{...receipt,[key]:value},rgba},options),/context mismatch/);passed++;}
assert.throws(()=>compare(frame,{receipt:{...receipt,width:1025},rgba},options),/invalid width/);passed++;
assert.throws(()=>compare(frame,{receipt:{...receipt,tick:NaN},rgba},options),/invalid tick/);passed++;
assert.throws(()=>compare(frame,{receipt:{...receipt,kind:'port'},rgba},options),/two fixtures/);passed++;
assert.equal(JSON.stringify(compare(frame,other,options)),JSON.stringify(compare(frame,other,options)));passed++;
console.log(JSON.stringify({scope:'authored comparator synthetic tests only',passed,rss:process.memoryUsage().rss}));
