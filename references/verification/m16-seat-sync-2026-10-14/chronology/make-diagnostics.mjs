import fs from 'node:fs';import path from 'node:path';import{pathToFileURL}from'node:url';
const root=process.cwd();for(const name of['balloon-person-attack','balloon-plain-person-attack','balloon-staged-movement']){
 const original=fs.readFileSync(`tests/${name}.test.mjs`,'utf8');let source=original.replaceAll("from 'node:assert/strict'","from './diagnostic-assert.mjs'").replace(/from '(\.[^']+)'/g,(m,p)=>p==='./diagnostic-assert.mjs'?m:`from '${pathToFileURL(path.resolve(root,'tests',p))}'`)
 source="import {snapshot} from './diagnostic-assert.mjs'\n"+source.replace(/tick\((world|idle), 1 \/ 12\)/g,(m,w)=>`${m};snapshot(${w},'${name}')`)
 fs.writeFileSync(`work/m16-seat-sync/observe-${name}.mjs`,source)
}
