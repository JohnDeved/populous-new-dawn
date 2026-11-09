import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { queryResourceSnapshot, readResourceFile } from '../scripts/tutorial-browser/query-art-resource-snapshot.mjs'
const input = () => ({phase:'before-preparation',cwd:'/work',env:{HOME:'/home/a',RUNNER_TEMP:'/scratch',GITHUB_RUN_ID:'42'},
 read:path=>path==='/proc/self/cgroup'?'0::/owned\n':path==='/proc/meminfo'?'MemAvailable: 100 kB\nShmem: 20 kB\nSwapTotal: 30 kB\nSwapFree: 10 kB\n':path==='/proc/self/status'?'Name: snapshot\nPid: 3\nPPid: 2\nVmRSS: 50 kB\nThreads: 1\n':'value',
 statfs:()=>({type:0x1021994n,bavail:2n,bsize:4096n,ffree:3n,files:4n}),command:()=> 'exact',now:()=> '2026-11-02T00:00:00Z'})
test('snapshot binds source, timestamp and separate filesystem/memory/cgroup observations without capacity claim',()=>{
 const r=queryResourceSnapshot(input());assert.equal(r.at,'2026-11-02T00:00:00Z');assert.equal(r.source.tree.value,'exact')
 assert.equal(r.filesystems.evidence.userAvailableBytes,'8192');assert.equal(r.filesystems.evidence.filesystemTypeHex,'0x1021994')
 assert.match(r.memory.value,/Shmem: 20/);assert.equal(r.cgroup['memory.events'].value,'value');assert.equal(r.estimates.installBytes,'unknown');assert.match(r.admission,/Telemetry only/)
})
test('missing telemetry stays unknown and nearest existing filesystem ancestor is explicit',()=>{
 const i=input();i.read=()=>{throw null};i.command=()=>{throw undefined};i.statfs=p=>{if(p!=='/')throw false;return{type:1n,bavail:0n,bsize:4096n,ffree:0n,files:1n}}
 const r=queryResourceSnapshot(i);assert.equal(r.memory.status,'unknown');assert.equal(r.source.commit.status,'unknown');assert.equal(r.cgroup['memory.max'].status,'unknown');assert.equal(r.filesystems.evidence.measuredAncestor,'/');assert.equal(r.filesystems.evidence.userAvailableBytes,'0')
})
test('unsupported phases reject and cgroup traversal is not followed',()=>{
 assert.throws(()=>queryResourceSnapshot({...input(),phase:'other'}));const i=input();i.read=()=> '0::/../secret';const r=queryResourceSnapshot(i);assert.equal(r.cgroup['memory.max'].status,'unknown')
})
test('workflow snapshots bracket preparation and launch, bounded and without output directory mutation',()=>{
 const w=readFileSync(new URL('../.github/workflows/query-art-browser.yml',import.meta.url),'utf8');
 const prep=w.indexOf('query-art-resource-snapshot.mjs before-preparation'),install=w.indexOf('- name: Install locked'),launch=w.indexOf('query-art-resource-snapshot.mjs before-launch'),run=w.indexOf('run: node scripts/tutorial-browser/run.mjs')
 assert.ok(prep>0&&prep<install&&install<launch&&launch<run);assert.equal((w.match(/timeout --signal=TERM --kill-after=2s 10s node scripts\/tutorial-browser\/query-art-resource-snapshot.mjs/g)||[]).length,2)
 const s=readFileSync(new URL('../scripts/tutorial-browser/query-art-resource-snapshot.mjs',import.meta.url),'utf8');assert.match(s,/Buffer.alloc\(4096\)/);assert.match(s,/timeout: 1000, maxBuffer: 8192/);assert.match(s,/> 32768/);assert.ok(!/writeFile|mkdir|unlink/.test(s))
})

test('bounded reader rejects full buffers as possibly truncated and always closes ownership',()=>{
 for (const size of [0,4095,4096]) {
  let closed=0;const io={openSync:()=>7,readSync:(_fd,b)=>{b.fill(65);return size},closeSync:fd=>{assert.equal(fd,7);closed++}}
  if(size===4096)assert.throws(()=>readResourceFile('/supplied',io),/truncated/)
  else assert.equal(readResourceFile('/supplied',io).length,size)
  assert.equal(closed,1)
 }
 let closed=0;assert.throws(()=>readResourceFile('/supplied',{openSync:()=>7,readSync:()=>{throw Error('read failed')},closeSync:()=>closed++}),/read failed/);assert.equal(closed,1)
})
test('incomplete process telemetry is unknown rather than a partial observed sample',()=>{
 const i=input(),read=i.read;i.read=p=>p==='/proc/self/status'?'Pid: 3\n':read(p)
 const r=queryResourceSnapshot(i);assert.equal(r.process.status,'unknown');assert.match(r.limits,/leaf files only/);assert.match(r.cachePathQualification,/Presumed defaults/)
})
