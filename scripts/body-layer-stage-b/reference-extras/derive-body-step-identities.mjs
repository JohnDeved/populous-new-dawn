import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {checkpointCodec} from '/workspace/shared/populous-model-pick-work/scripts/tutorial-browser/checkpoint-codec.mjs';
const root='/tmp/body-r11-offline/run', identities={}, bindings={};
const hash=b=>createHash('sha256').update(b).digest('hex');
for(const cohort of ['camera','animation'])for(const side of ['baseline','candidate']){
 const key=`${cohort}-${side}`,dir=`${root}/${key}`,bytes=readFileSync(`${dir}/report.json`),r=JSON.parse(bytes);bindings[`${key}/report.json`]=hash(bytes);
 const state=row=>{const path=`${key}/${row.stateFile}`,b=readFileSync(`${root}/${path}`);bindings[path]=hash(b);const raw=gunzipSync(b);assert.equal(hash(raw),row.stateSha256);return checkpointCodec(JSON.parse(raw).state,true)};
 let before=state(r.bootstrap),preStep=r.bootstrap.step;identities[key]=[];
 for(const [i,row]of r.steps.entries()){const after=state(row),now=100000+(i+1)*1000/60;assert.equal(after.previous,now);assert.equal(row.step,i+1);identities[key].push({previous:before.previous,preTurn:before.world.turn,preStep,turn:after.world.turn,step:row.step,now});before=after;preStep=row.step;}
 console.log(JSON.stringify({key,steps:identities[key].length}));
}
writeFileSync(`${root}/step-identities.json`,JSON.stringify(identities,null,2)+'\n');writeFileSync(`${root}/step-identity-inputs.json`,JSON.stringify({generator:hash(readFileSync(import.meta.filename)),files:bindings},null,2)+'\n');
