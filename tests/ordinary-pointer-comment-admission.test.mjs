import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {ordinaryPointerCommentSelection as select, verifyOrdinaryPointerComment as verify} from '../scripts/browser-performance/ordinary-pointer-comment-admission.mjs'
import {ordinaryPointerCalibrationSelection as selection} from '../scripts/browser-performance/ordinary-pointer-calibration-policy.mjs'
const repo='JohnDeved/populous-new-dawn',api=`https://api.github.com/repos/${repo}`,sha='a'.repeat(40)
const owner={id:24187269,login:'JohnDeved',type:'User'}
const env={GITHUB_EVENT_NAME:'issue_comment',GITHUB_RUN_ATTEMPT:'1',GITHUB_REF:'refs/heads/main',GITHUB_SHA:sha,
 GITHUB_REPOSITORY:repo,GITHUB_REPOSITORY_ID:'1365430845',GITHUB_ACTOR:'JohnDeved',GITHUB_ACTOR_ID:'24187269',
 GITHUB_TRIGGERING_ACTOR:'JohnDeved',GITHUB_WORKFLOW_REF:`${repo}/.github/workflows/ordinary-pointer-calibration.yml@refs/heads/main`,GH_TOKEN:'supplied-read-only',GITHUB_RUN_ID:'123'}
const event={action:'created',repository:{id:1365430845,full_name:repo,default_branch:'main'},sender:owner,
 issue:{number:895,url:`${api}/issues/895`,pull_request:{url:`${api}/pulls/895`}},
 comment:{id:123,url:`${api}/issues/comments/123`,issue_url:`${api}/issues/895`,user:owner,author_association:'OWNER',body:`/ordinary-pointer-calibration ${sha}`}}
const pr={id:5112954796,number:895,url:`${api}/pulls/895`,merged:true,state:'closed',base:{ref:'main',repo:{id:1365430845,full_name:repo}}}
const main={ref:'refs/heads/main',url:`${api}/git/refs/heads/main`,object:{type:'commit',sha}}
const clone=x=>structuredClone(x)
const responses=()=>[clone(pr),clone(event.comment),clone(main)]
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8')

test('one exact owner comment selects main without changing dispatch admission',()=>{
 assert.equal(select(event,env),true)
 assert.equal(selection(event,'issue_comment',env.GITHUB_REF,sha,'ordinary-pointer-calibration',env),true)
 assert.equal(selection({inputs:{expected_sha:sha}},'workflow_dispatch','refs/heads/main',sha,'ordinary-pointer-calibration'),true)
 assert.equal(selection({inputs:{expected_sha:sha}},'workflow_dispatch','refs/heads/other',sha,'ordinary-pointer-calibration'),false)
 assert.equal(selection(event,'issue_comment',env.GITHUB_REF,sha,'tutorial',env),false)
 // No false claim of technical deduplication: a second owner comment is independently selectable.
 assert.equal(select({...event,comment:{...event.comment,id:124}},env),true)
})
test('event and actor boundaries reject every supplied mismatch',()=>{
 for(const key of Object.keys(env).filter(k=>!['GH_TOKEN','GITHUB_RUN_ID'].includes(k)))
  assert.equal(select(event,{...env,[key]:'wrong'}),false,key)
 const cases=[e=>e.action='edited',e=>e.action='deleted',e=>e.repository.id++,e=>e.repository.full_name='attacker/repo',
 e=>e.repository.default_branch='other',e=>e.sender={...owner,id:1},e=>e.sender={...owner,login:'other'},e=>e.sender={...owner,type:'Bot'},
 e=>e.issue.number++,e=>e.issue.url+='evil',e=>delete e.issue.pull_request,e=>e.issue.pull_request.url+='evil',
 e=>e.comment.id=0,e=>e.comment.id=1.5,e=>e.comment.issue_url+='evil',e=>e.comment.user={...owner,id:1},
 e=>e.comment.author_association='COLLABORATOR',e=>e.comment.body+='\n',e=>e.comment.body+=' extra',
 e=>e.comment.body='/ordinary-pointer-calibration '+'b'.repeat(40),e=>e.comment.body='$(touch hacked)',e=>e.comment.body=null]
 for(const change of cases){const e=clone(event);change(e);assert.equal(select(e,env),false)}
})
test('fresh API binding is fixed, read-only and checks main last',async()=>{
 const values=responses(),calls=[]
 const result=await verify(event,env,async(url,token)=>{calls.push(url);assert.equal(token,env.GH_TOKEN);return values.shift()})
 assert.deepEqual(calls,[`${api}/pulls/895`,`${api}/issues/comments/123`,`${api}/git/ref/heads/main`])
 assert.deepEqual(result,{event:'issue_comment',commentId:123,ownerId:24187269,sha,runId:'123',attempt:1,
  selection:'one-authorized-comment-no-automatic-retry',currentMainVerified:true,atomicMainLock:false})
})
test('unmerged, foreign, edited and advanced source evidence fails closed',async()=>{
 const cases=[[0,p=>p.id++],[0,p=>p.number++],[0,p=>p.url+='evil'],[0,p=>p.merged=false],[0,p=>p.state='open'],
 [0,p=>p.base.ref='other'],[0,p=>p.base.repo.id++],[0,p=>p.base.repo.full_name='attacker/repo'],
 [1,c=>c.id++],[1,c=>c.url+='evil'],[1,c=>c.issue_url+='evil'],[1,c=>c.user={...owner,id:1}],
 [1,c=>c.author_association='NONE'],[1,c=>c.body+='\n'],[2,m=>m.ref='refs/heads/other'],
 [2,m=>m.url+='evil'],[2,m=>m.object.type='tag'],[2,m=>m.object.sha='b'.repeat(40)]]
 for(const [i,change] of cases){const values=responses();change(values[i]);await assert.rejects(verify(event,env,async()=>values.shift()))}
})
test('selection rejection performs no API work and API failures are not retried',async()=>{
 let calls=0;await assert.rejects(verify(event,{...env,GITHUB_RUN_ATTEMPT:'2'},async()=>{calls++}));assert.equal(calls,0)
 await assert.rejects(verify(event,{...env,GH_TOKEN:''},async()=>{calls++}));assert.equal(calls,0)
 for(const error of [null,false,0,undefined,new Error('API unavailable')]){
  calls=0;let caught=false
  await verify(event,env,async()=>{calls++;throw error}).catch(e=>{caught=true;assert.equal(e,error)})
  assert.equal(caught,true);assert.equal(calls,1)
 }
})
test('actual runner rechecks comment admission before aggregate, preserves dispatch and refusal',async()=>{
 const source=read('scripts/tutorial-browser/run.mjs'),start=source.indexOf("  } else if (selectedScenario === 'ordinary-pointer-calibration') {")
 const end=source.indexOf('    receipt.ordinaryPointerCalibration = {}',start)
 assert.ok(start>=0&&end>start)
 const block=source.slice(start+source.slice(start).indexOf('\n')+1,end)
 const run=new (Object.getPrototypeOf(async function(){}).constructor)('process','receipt','verifyOrdinaryPointerCommentEnvironment','calibrationCommentEnvironment',block)
 const receipt={};let calls=0
 await run({env:{GITHUB_EVENT_NAME:'issue_comment'}},receipt,async value=>{calls++;assert.equal(value,env);return{sha}},env)
 assert.equal(calls,1);assert.deepEqual(receipt.calibrationCommentAdmission,{sha})
 await run({env:{GITHUB_EVENT_NAME:'workflow_dispatch'}},{},async()=>{throw Error('not selected')})
 for(const error of [null,false,undefined]){let caught=false;await run({env:{GITHUB_EVENT_NAME:'issue_comment'}},{},async()=>{throw error}).catch(e=>{caught=true;assert.equal(e,error)});assert.ok(caught)}
})
test('workflow keeps read-only exact-main checkout, pre-install admission and existing bounds',()=>{
 const workflow=read('.github/workflows/ordinary-pointer-calibration.yml')
 assert.match(workflow,/issue_comment:\n    types: \[created\]/)
 assert.match(workflow,/permissions:\n  contents: read\n  issues: read\n  pull-requests: read/)
 assert.equal(workflow.includes(': write'),false);assert.equal(workflow.includes('pull_request.head'),false)
 assert.match(workflow,/ref: \$\{\{ github.sha \}\}/);assert.match(workflow,/persist-credentials: false/)
 assert.ok(workflow.indexOf('Verify owner comment')<workflow.indexOf('Install locked dependencies'))
 assert.match(workflow,/timeout-minutes: 30/);assert.match(workflow,/timeout --signal=TERM --kill-after=5s 1500s/)
 assert.match(workflow,/296\*1024\*1024/);assert.equal(workflow.includes('${{ github.event.comment.body }}'),false)
})
test('actual owner token is removed before any descendant environment is constructed',()=>{
 const source=read('scripts/tutorial-browser/run.mjs')
 const start=source.indexOf('const calibrationCommentEnvironment ='),end=source.indexOf('const captureProtocolEnabled =',start)
 assert.ok(start>=0&&end>start&&end<source.indexOf('const descendantEnv ='))
 const run=new Function('process',source.slice(start,end)+'; return calibrationCommentEnvironment')
 for(const name of ['issue_comment','workflow_dispatch']){
  const supplied={env:{...env,POPULOUS_BROWSER_SCENARIO:'ordinary-pointer-calibration',GITHUB_EVENT_NAME:name}}
  const ownerEnv=run(supplied)
  assert.equal(supplied.env.GH_TOKEN,undefined)
  if(name==='issue_comment')assert.equal(ownerEnv.GH_TOKEN,'supplied-read-only');else assert.equal(ownerEnv,null)
 }
 const ordinary={env:{...env,POPULOUS_BROWSER_SCENARIO:'tutorial'}}
 assert.equal(run(ordinary),null);assert.equal(ordinary.env.GH_TOKEN,'supplied-read-only')
})
test('actual API reader refuses HTTP failures, oversized bodies and invalid JSON without retry',async()=>{
 const original=globalThis.fetch
 try {
  for(const response of [new Response('{}',{status:403}),new Response('not JSON'),new Response('x'.repeat(1024*1024+1))]){
   let calls=0
   globalThis.fetch=async(url,options)=>{calls++;assert.equal(url,`${api}/pulls/895`);assert.equal(options.redirect,'error');assert.ok(options.signal instanceof AbortSignal);assert.equal(options.headers.Authorization,'Bearer supplied-read-only');return response}
   await assert.rejects(verify(event,env));assert.equal(calls,1)
  }
  const values=responses();let calls=0
  globalThis.fetch=async()=>{calls++;return new Response(JSON.stringify(values.shift()))}
  assert.equal((await verify(event,env)).sha,sha);assert.equal(calls,3)
 } finally {globalThis.fetch=original}
})
