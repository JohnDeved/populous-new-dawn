import {spawnSync,execFileSync} from 'node:child_process'
import {writeFileSync} from 'node:fs'
import {resolve} from 'node:path'
import assert from 'node:assert/strict'
const paths=['app/game-store.ts','app/world-initialization.ts','app/world-turn.ts','app/world-types.ts']
const run=(name,cwd)=>{const r=spawnSync(resolve('node_modules/.bin/oxlint'),['--format=json',...paths],{cwd,encoding:'utf8'});writeFileSync(`work/orchestration/authored-bridge-origin/oxlint-${name}.json`,r.stdout);const d=JSON.parse(r.stdout);const counts={};for(const x of d.diagnostics){const key=[x.filename,x.severity,x.code,x.message].join('|');counts[key]=(counts[key]??0)+1}return{head:execFileSync('git',['rev-parse','HEAD'],{cwd,encoding:'utf8'}).trim(),status:r.status,diagnostics:d.diagnostics.length,counts}}
const baseline=run('baseline',resolve('../mission-two-controls')),candidate=run('candidate',process.cwd())
const added=Object.entries(candidate.counts).filter(([key,count])=>count>(baseline.counts[key]??0))
const report={baseline,candidate,added,method:'Exact touched-file Oxlint count comparison by filename, severity, code and message; line/column offsets and expanded type help deliberately ignored.',limits:'Both lint invocations remain failed due existing findings. This only checks added diagnostics; it does not certify repository-wide lint success.'}
writeFileSync('work/orchestration/authored-bridge-origin/quality-delta.json',JSON.stringify(report,null,2)+'\n')
assert.deepEqual(added,[])
console.log(JSON.stringify({baseline:{head:baseline.head,exit:baseline.status,diagnostics:baseline.diagnostics},candidate:{head:candidate.head,exit:candidate.status,diagnostics:candidate.diagnostics},added}))
