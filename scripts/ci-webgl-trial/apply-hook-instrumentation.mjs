import {readFileSync,writeFileSync,existsSync,lstatSync,unlinkSync,realpathSync,renameSync,linkSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
const expectedPaths=['app/render-view.ts','app/scene-assets.ts','app/tornado-material.ts','app/globe-renderer.ts','app/drag-overlay.ts','app/cpu-hook-probe.ts','app/cpu-hook-provenance.mjs'];
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
export function applyHookInstrumentation({root,proposalRoot}){
 root=realpathSync(root);proposalRoot=realpathSync(proposalRoot);
 const manifest=JSON.parse(readFileSync(resolve(proposalRoot,'manifest.json'),'utf8'));
 if(manifest.pinnedCommit!=='3f73fdbcb630604049658f42a896db1fe1304aef'||manifest.files.length!==expectedPaths.length||manifest.files.some((f,i)=>f.path!==expectedPaths[i]))throw new Error('Unexpected instrumentation manifest');
 const staged=[];let bytes=0;
 for(const f of manifest.files){const target=resolve(root,f.path),source=resolve(proposalRoot,f.path);if(realpathSync(dirname(target))!==resolve(root,'app')||lstatSync(source).isSymbolicLink()||!lstatSync(source).isFile())throw new Error('Nonregular proposal path');const next=readFileSync(source);bytes+=next.length;if(bytes>2*1024*1024||digest(next)!==f.outputSha256)throw new Error('Proposal hash/size mismatch');let previous=null;
  if(f.newHelper){if(existsSync(target))throw new Error('Helper already exists');}else{if(!lstatSync(target).isFile()||lstatSync(target).isSymbolicLink())throw new Error('Nonregular source');previous=readFileSync(target);if(digest(previous)!==f.inputSha256)throw new Error('Pinned source hash mismatch');}
  staged.push({path:f.path,target,next,previous,expected:f.outputSha256,installed:false,restored:false});
 }
 const restore=()=>{const errors=[];for(const f of [...staged].reverse()){if(!f.installed||f.restored)continue;try{if(!existsSync(f.target)||!lstatSync(f.target).isFile()||lstatSync(f.target).isSymbolicLink()||digest(readFileSync(f.target))!==f.expected)throw new Error('Changed instrumented file preserved: '+f.path);if(f.previous===null)unlinkSync(f.target);else writeFileSync(f.target,f.previous);f.restored=true;}catch(e){errors.push(e)}}if(errors.length)throw new AggregateError(errors,'Instrumentation restoration failed');return{restored:staged.filter(x=>x.restored).map(x=>x.path)};};
 try{for(const f of staged){const temporary=f.target+'.cpu-probe-'+randomUUID();let created=false;try{writeFileSync(temporary,f.next,{flag:'wx'});created=true;if(f.previous===null)linkSync(temporary,f.target);else{if(digest(readFileSync(f.target))!==digest(f.previous))throw new Error('Source changed before install');renameSync(temporary,f.target);created=false;}f.installed=true;}finally{if(created)unlinkSync(temporary)}}}catch(error){try{restore()}catch(cleanup){throw new AggregateError([error,cleanup],'Apply and restoration failed')}throw error;}
 return{restore,manifest,installed:staged.map(x=>({path:x.path,sha256:x.expected})),scope:'Temporary instrumented checkout, not unchanged shipped source'};
}
