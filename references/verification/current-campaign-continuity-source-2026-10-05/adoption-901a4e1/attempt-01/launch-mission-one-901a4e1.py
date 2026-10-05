from pathlib import Path
import os, json, hashlib, socket, subprocess, datetime, errno
root=Path(__file__).resolve().parents[3]
base=root/'work/orchestration/campaign-continuity'
plan_path=base/'901a4e1-launch-plan.json'
sha=lambda data:hashlib.sha256(data).hexdigest()
assert sha(plan_path.read_bytes())=='e365282e5c97c6988433098910d88d3bbcf8577ad90c2950cbf543191930cd58'
plan=json.loads(plan_path.read_text())
assert plan['sourceHead']=='901a4e15e676a2e08c986066aedde9f8a243ba0a'
assert sha((root/'qa/campaign-continuity/mission-one-first-batch.json').read_bytes())=='ed33faf9afeb4c2a19fa3e1cbc60747a4b5e2d0d409aef77d192fa2eacb3944b'
assert not Path(plan['profilePath']).exists() and not Path(plan['output']).exists()
assert (root/'node_modules').stat().st_ino==925605
assert sha((root/'node_modules/.package-lock.json').read_bytes())=='65e45d0a87d1ecd4fbf56508b9821eb3bfb3867c8477db4aaa1452eb2bed13d8'
assert sha((root/'package-lock.json').read_bytes())=='c1599d8d7e3f028e290a13561c653cf926e739e98eb9ec1b476dbe1c2a4558ba'
os.sched_setaffinity(0,{0,1,2,3})
check=r'''
import assert from 'node:assert/strict'
import {sourceReceipt} from './scripts/local-render/harness.mjs'
import {profileInputReceipt,sha256} from './scripts/local-render/owned-profile.mjs'
import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {resolve,dirname} from 'node:path'
const root=process.cwd(), expected=JSON.parse(readFileSync('work/orchestration/campaign-continuity/901a4e1-profile-inputs.json')), require=createRequire(resolve(root,'package.json')), browserPath=expected.runtime.browserPath
const runtime={node:process.version,platform:process.platform,arch:process.arch,browserPath,browserSha256:sha256(readFileSync(browserPath)),playwright:require('@playwright/test/package.json').version,playwrightCoreSha256:sha256(readFileSync(resolve(dirname(require.resolve('playwright-core/package.json')),'lib/coreBundle.js'))),installedLockSha256:sha256(readFileSync(resolve(root,'node_modules/.package-lock.json'))),harness:Object.fromEntries(['harness.mjs','owned-profile.mjs','checkpoint-observer.mjs','vite.config.mjs'].map(name=>[name,sha256(readFileSync(resolve(root,'scripts/local-render',name)))]))}
assert.deepEqual(sourceReceipt(root),expected.source)
assert.deepEqual(profileInputReceipt(root,expected.scenario.path),expected.inputs)
assert.deepEqual(runtime,expected.runtime)
assert.equal(sha256(readFileSync(expected.scenario.path)),expected.scenario.sha256)
console.log(JSON.stringify({source:expected.source,inputs:expected.inputs,runtime,verified:true}))
'''
verified=json.loads(subprocess.check_output(['node','--input-type=module','-'],input=check,text=True,cwd=root))
def port_probe():
    result=[]
    for family,host in [(socket.AF_INET,'127.0.0.1'),(socket.AF_INET6,'::1')]:
        with socket.socket(family,socket.SOCK_STREAM) as sock:
            sock.settimeout(1)
            code=sock.connect_ex((host,4375))
        result.append({'host':host,'port':4375,'code':code,'closed':code==errno.ECONNREFUSED})
    return result
pre=port_probe()
assert all(row['closed'] for row in pre), 'Origin4375 already responds or absence is unverified; do not attach or kill it'
tmp=base/'private-tmp-m1-901a4e1';tmp.mkdir(mode=0o700,exist_ok=False)
env=os.environ.copy();env.update({'TMPDIR':str(tmp),'NODE_OPTIONS':'--max-old-space-size=4096'})
command=['node','scripts/orchestration/command-receipt.mjs','--output',plan['outerCommandReceipt'],'--input','qa/campaign-continuity/mission-one-first-batch.json','--input','qa/campaign-continuity/run-policy.json','--input','node_modules/.package-lock.json','--',*plan['command']]
receipt=base/'mission-one-segment-01.launcher.json'
record={'startedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'prepared','launcherPid':os.getpid(),'pidNamespace':os.readlink('/proc/self/ns/pid'),'networkNamespace':os.readlink('/proc/self/ns/net'),'cpus':sorted(os.sched_getaffinity(0)),'profile':plan['profilePath'],'output':plan['output'],'privateTmp':str(tmp),'sourceRuntimeVerification':verified,'preTcp':pre,'command':command,'launcherSha256':sha(Path(__file__).read_bytes()),'launchPlanSha256':sha(plan_path.read_bytes()),'dependencyInode':925605}
def persist():
    temporary=receipt.with_suffix('.tmp');temporary.write_text(json.dumps(record,indent=2)+'\n');os.replace(temporary,receipt)
assert not receipt.exists();persist()
process=subprocess.Popen(command,cwd=root,env=env)
record.update({'status':'running','childPid':process.pid});persist()
print(json.dumps({'status':'running','childPid':process.pid,'origin':'http://127.0.0.1:4375','profile':plan['profilePath'],'launcherReceipt':str(receipt)}),flush=True)
exit_code=process.wait()
record.update({'status':'terminal','finishedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'commandExitCode':exit_code,'postTcp':port_probe()})
inner=Path(plan['output'])/'receipt.json'
if inner.exists():
    raw=inner.read_bytes();v=json.loads(raw);record.update({'innerReceiptSha256':sha(raw),'innerStatus':v.get('status'),'profileId':v.get('profile',{}).get('id'),'runId':v.get('profile',{}).get('runId'),'cleanupVerified':v.get('profile',{}).get('cleanupVerified'),'continuationVerified':v.get('profile',{}).get('continuationVerified')})
record['originClosed']=all(row['closed'] for row in record['postTcp']);persist()
print(json.dumps({'status':'terminal','exitCode':exit_code,'launcherReceipt':str(receipt),'originClosed':record['originClosed']}),flush=True)
raise SystemExit(exit_code)
