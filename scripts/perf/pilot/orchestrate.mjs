import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, openSync, closeSync, statfsSync, statSync } from 'node:fs'
import { spawnSync, execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import os from 'node:os'
import { summarize, qualify, compare } from './analyze.mjs'
const config=JSON.parse(readFileSync(new URL('./config.json',import.meta.url),'utf8'))
const out=resolve('outputs/centers-pilot'),runner=new URL('./benchmark.mjs',import.meta.url)
const hash=b=>createHash('sha256').update(b).digest('hex')
const safeRead=path=>{try{return readFileSync(path,'utf8')}catch{return null}}
const command=(cmd,args)=>{try{return execFileSync(cmd,args,{encoding:'utf8',timeout:5000,maxBuffer:1024**2}).trim()}catch{return null}}
const metadata={utc:new Date().toISOString(),versions:process.versions,flags:process.execArgv,os:{platform:os.platform(),release:os.release(),arch:os.arch()},
 cpu:os.cpus().map(c=>({model:c.model,speed:c.speed})),totalMemory:os.totalmem(),freeMemory:os.freemem(),
 topology:command('lscpu',[]),affinity:command('taskset',['-pc',String(process.pid)]),osRelease:safeRead('/etc/os-release'),
 procStatus:safeRead('/proc/self/status'),cgroupMembership:safeRead('/proc/self/cgroup'),
 cgroup:Object.fromEntries(['/sys/fs/cgroup/cpu.max','/sys/fs/cgroup/cpu.stat','/sys/fs/cgroup/memory.max','/sys/fs/cgroup/memory.current'].map(p=>[p,safeRead(p)])),
 runnerImage:{os:process.env.ImageOS??null,version:process.env.ImageVersion??null,runnerOS:process.env.RUNNER_OS??null,arch:process.env.RUNNER_ARCH??null},
 disk:statfsSync(out),npmVersion:command('npm',['--version']),runnerHash:hash(readFileSync(runner)),configHash:hash(readFileSync(new URL('./config.json',import.meta.url))),
 note:'Only an explicit safe metadata allowlist is recorded. Null means unavailable; no affinity/governor/security settings changed.'}
writeFileSync(`${out}/host.json`,JSON.stringify(metadata,null,2)+'\n')
const variants=['baseline','baseline','baseline','baseline','baseline','candidate','candidate','baseline']
const preparation=JSON.parse(readFileSync(`${out}/preparation.json`,'utf8'))
const deadlineMs=Date.parse(preparation.startedAt)+10*60*1000
const report={deadlineUtc:new Date(deadlineMs).toISOString(),status:'running',startedAt:new Date().toISOString(),runs:variants.map((variant,i)=>({index:i+1,variant,phase:i<4?'qualification':'comparison',status:'not started'})),qualification:null,comparison:null}
const save=()=>writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2)+'\n')
save()
let oracle,dependencyHashes,versions,finalOutput
function run(index){
 assert.ok(Date.now()+120000<deadlineMs,'Insufficient remaining pilot budget for another bounded process')
 const record=report.runs[index],stem=`run-${index+1}-${record.variant}`
 const fs=statfsSync(out);assert.ok(fs.bavail*fs.bsize>64*1024**2,'Insufficient output headroom')
 record.status='running';record.startedAt=new Date().toISOString();record.freeBytesBefore=fs.bavail*fs.bsize;save()
 const stdout=openSync(`${out}/${stem}.jsonl`,'wx'),stderr=openSync(`${out}/${stem}.stderr`,'wx')
 let result
 try{result=spawnSync(process.execPath,[runner.pathname,'--run'],{env:{...process.env,PILOT_VARIANT:record.variant},stdio:['ignore',stdout,stderr],timeout:120000,killSignal:'SIGKILL'})}
 finally{closeSync(stdout);closeSync(stderr)}
 record.finishedAt=new Date().toISOString();record.exitCode=result.status;record.signal=result.signal;record.error=result.error?String(result.error):null;record.status=result.status===0?'executed':'failed';save()
 assert.equal(result.error,undefined,'Child failed or exceeded 120 second cap');assert.equal(result.status,0,'Child exited unsuccessfully')
 assert.equal(statSync(`${out}/${stem}.stderr`).size,0,'Child emitted stderr; retain and investigate')
 const rows=readFileSync(`${out}/${stem}.jsonl`,'utf8').trim().split('\n').map(line=>JSON.parse(line))
 const manifest=rows.find(r=>r.type==='manifest'),correct=rows.find(r=>r.type==='correctness'),observed=rows.find(r=>r.type==='phase-oracle')
 assert.ok(manifest&&correct&&observed);assert.equal(correct.status,'pass');assert.equal(correct.dependenciesStable,true)
 assert.equal(manifest.targetCommit,config[`${record.variant}Commit`]);assert.equal(manifest.variant,record.variant)
 assert.deepEqual(correct.sourceHashes,config.files[record.variant])
 assert.equal(manifest.runnerHash,metadata.runnerHash);assert.equal(manifest.configHash,metadata.configHash)
 if(!oracle){oracle=observed;dependencyHashes=correct.dependencyHashes;versions=manifest.versions;finalOutput=correct.finalOutput}
 else{assert.deepEqual(observed,oracle,'Output oracle drift');assert.deepEqual(correct.dependencyHashes,dependencyHashes,'Dependency closure drift');assert.deepEqual(manifest.versions,versions);assert.deepEqual(correct.finalOutput,finalOutput)}
 assert.equal(correct.allocationIdentityCheck,record.variant==='candidate'?'same-size storage reused':'same-size storage replaced')
 record.summary=summarize(rows,config);record.rawSha256=hash(readFileSync(`${out}/${stem}.jsonl`));record.status='verified';save()
 return record.summary
}
try{
 assert.equal(process.version,config.nodeVersion)
 const qualification=[]
 for(let i=0;i<4;i++)qualification.push(run(i))
 report.qualification=qualify(qualification,config);save()
 if(!report.qualification.pass){
  report.status='inconclusive: baseline qualification failed'
  for(const r of report.runs.slice(4)){r.status='skipped';r.reason='Predeclared A/A qualification failed'}
 }else{
  const abba=[];for(let i=4;i<8;i++)abba.push(run(i))
  report.comparison=compare(qualification,abba,config);report.status=report.comparison.status
 }
}catch(error){
 report.status='failed: stop without further processes';report.error=String(error)
 for(const r of report.runs)if(['running','executed'].includes(r.status)){r.status='failed';r.validationError=String(error)}
 for(const r of report.runs)if(r.status==='not started'){r.status='skipped';r.reason='Earlier process, source, correctness or resource failure'}
 process.exitCode=1
}finally{
 report.finishedAt=new Date().toISOString();save()
 console.log(JSON.stringify({status:report.status,runs:report.runs.map(r=>({index:r.index,variant:r.variant,status:r.status})),qualification:report.qualification,comparison:report.comparison},null,2))
}
