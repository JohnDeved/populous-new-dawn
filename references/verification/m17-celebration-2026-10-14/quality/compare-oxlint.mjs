import fs from 'node:fs'
import cp from 'node:child_process'
import path from 'node:path'
import assert from 'node:assert/strict'
const root=process.cwd(), baseline=path.resolve(root,'../celebration-lint-base-f2'), exe=path.join(root,'node_modules/.bin/oxlint')
const scan=(cwd,name)=>{const r=cp.spawnSync(exe,['--config',path.join(cwd,'.oxlintrc.json'),'--disable-nested-config','-f','json','app'],{cwd,encoding:'utf8'}); fs.writeFileSync(`work/m17-celebration/oxlint-final-${name}.json`,r.stdout);fs.writeFileSync(`work/m17-celebration/oxlint-final-${name}.stderr`,r.stderr);assert.ok([0,1].includes(r.status));return JSON.parse(r.stdout)}
const a=scan(baseline,'base'),b=scan(root,'candidate')
const normalize=(d,dir)=>{const {labels,...rest}=d,s=fs.readFileSync(path.join(dir,d.filename));return JSON.stringify({...rest,labels:labels.map(({span,...label})=>({...label,source:s.subarray(span.offset,span.offset+span.length).toString()}))})}
const counts=(v,dir)=>{const m=new Map();for(const d of v.diagnostics){const k=normalize(d,dir);m.set(k,(m.get(k)||0)+1)}return m}
const old=counts(a,baseline),now=counts(b,root),added=[],removed=[]
for(const[k,n]of now)if(n>(old.get(k)||0))added.push({diagnostic:JSON.parse(k),count:n-(old.get(k)||0)})
for(const[k,n]of old)if(n>(now.get(k)||0))removed.push({diagnostic:JSON.parse(k),count:n-(now.get(k)||0)})
const report={base:'f2e97561be4e186db1d24a1c161a8f4958ea9180',candidate:cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),baseline:a.diagnostics.length,current:b.diagnostics.length,added,removed}
fs.writeFileSync('work/m17-celebration/oxlint-final-comparison.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));assert.equal(added.length,0)
