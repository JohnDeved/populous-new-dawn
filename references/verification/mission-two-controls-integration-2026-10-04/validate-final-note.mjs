import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
const folder='references/verification/mission-two-controls-2026-10-04', archive=resolve('../mission-two-controls-recovered-evidence',folder), raw=resolve(archive,'journey-02-recovery')
const json=p=>JSON.parse(readFileSync(p,'utf8')),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'), ajson=p=>json(resolve(raw,p))
const manifest=json(resolve(archive,'manifest.json'))
for(const f of manifest.files){const p=resolve(archive,f.path);assert.equal(readFileSync(p).length,f.bytes);assert.equal(hash(p),f.sha256,f.path)}
const receipt=ajson('receipt.json'),outer=json(resolve(archive,'journey-02-recovery.outer.json'))
assert.equal(receipt.status,'failed');assert.equal(outer.status,'failed');assert.equal(outer.exitCode,1);assert.deepEqual(receipt.source,receipt.sourceAfter);assert.deepEqual(outer.source,outer.sourceAfter)
for(const key of ['stdout','stderr'])assert.equal(hash(resolve(archive,`journey-02-recovery.outer.json.artifacts/${key}.log`)),outer[`${key}Sha256`])
assert.deepEqual(ajson('command-failures.json').map(x=>x.command),[4,9,14,21,26,27,30]);assert.deepEqual(receipt.errors,['TypeError: window.missionTwoObserveReady is not a function'])
const events=readFileSync(resolve(raw,'actions.jsonl'),'utf8').trim().split('\n').map(JSON.parse)
for(let i=1;i<=30;i++){const commands=ajson(`command-${i}.json`),actual=events.filter(x=>x.commandIndex===i&&x.command).map(x=>x.command);assert.deepEqual(actual,commands.slice(0,actual.length));assert.ok(actual.length>0)}
const saved=ajson('checkpoint-saved.json'),loaded=ajson('checkpoint-restored.json'),blue=s=>s.units.filter(u=>u.team==='blue').map(u=>[u.id,u.kind]),buildings=s=>s.buildings.filter(b=>b.team==='blue').map(b=>[b.id,b.kind,b.progress,b.logs]);assert.equal(saved.turn,5729);assert.equal(loaded.turn,5747);assert.equal(blue(saved).length,21);assert.deepEqual(blue(saved),blue(loaded));assert.deepEqual(buildings(saved),buildings(loaded));assert.deepEqual(saved.stats,loaded.stats);assert.deepEqual(saved.shots,loaded.shots)
const won=ajson('023.json');assert.equal(won.status,'won');assert.equal(won.turn,8916);assert.equal(won.units.filter(u=>u.team==='green').length,0);assert.equal(won.buildings.filter(b=>b.team==='green').length,0)
const shown=ajson('024.json');assert.match(shown.body,/Level Won/);assert.match(shown.body,/Continue to Mission 3/);assert.equal(hash(resolve(folder,'victory.png')),hash(resolve(raw,'024.png')))
assert.deepEqual(ajson('extra-24.json'),[null]);assert.deepEqual(ajson('extra-25.json')[0].profile,{version:1,completed:[2]});assert.equal(ajson('extra-25.json')[0].greenFollowers,0)
const m3=ajson('extra-27.json')[1];assert.equal(m3.level,3);assert.equal(m3.sceneStoreMatch,true);assert.equal(m3.readiness.ready,true);assert.deepEqual(m3.readiness.selected,[46]);assert.match(ajson('extra-29.json')[0].text,/window\.missionTwoObserveReady is not a function/)
assert.equal(ajson('cleanup-observation.json').portClosed,true);assert.deepEqual(ajson('cleanup-observation.json').matchingOwnedRuntimeProcesses,[])
const text=readFileSync(resolve(folder,'README.md'),'utf8');let checked=0
for(const [,url] of text.matchAll(/\]\(([^)]+)\)/g)){if(url.startsWith('https://github.com/JohnDeved/populous-new-dawn/blob/')){const [,sha,path]=url.match(/\/blob\/([^/]+)\/(.*)$/);execFileSync('git',['cat-file','-e',`${sha}:${path}`]);checked++}else if(!url.startsWith('http')){assert.ok(existsSync(resolve(folder,url)));checked++}}
const changes=execFileSync('git',['diff','--name-only','ab6e857553fd2a534bbe34b4ba600df8a40872ff','HEAD'],{encoding:'utf8'}).trim().split('\n');assert.deepEqual(changes.sort(),[`${folder}/README.md`,`${folder}/victory.png`].sort())
console.log(JSON.stringify({status:'passed',manifestFiles:manifest.files.length,commandPrefixes:30,linksAndFigure:checked,checkpoint:{saved:5729,loaded:5747,blueIdentities:21,buildings:4},victoryTurn:8916,profile:[2],rawEnvelope:'failed',failureBatches:[4,9,14,21,26,27,30],mainDiff:changes},null,2))
