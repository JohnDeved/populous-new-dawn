import assert from 'node:assert/strict'
import { preview } from 'vite'
import { chromium } from '@playwright/test'
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { storageFixture, startMission, save, observe, read } from './browser-scenario.mjs'
const out = resolve('outputs/checkpoint-storage-copy-probe'); mkdirSync(out)
const report = { status: 'running', errors: [], warnings: [], comparisons: [] }
const persist = () => writeFileSync(resolve(out, 'probe.json'), JSON.stringify(report, null, 2) + '\n')
let server, browser
async function pageFor(context, label) {
  const page = await context.newPage()
  page.on('pageerror', error => report.errors.push({ label, message: String(error) }))
  page.on('console', message => { if(message.type()==='warning')report.warnings.push({ label,message:message.text() }); if(message.type()==='error')report.errors.push({ label,message:message.text() }) })
  await page.addInitScript(storageFixture, null)
  await page.goto('http://127.0.0.1:5198')
  await page.getByRole('dialog', { name: 'Main menu', exact: true }).waitFor()
  return page
}
async function inspect(page, label) {
  const observed = await observe(page)
  const result = { label, owner: await read(page, observed), storage: await page.evaluate(() => window.checkpointFixture.snapshot()) }
  result.types = await page.evaluate(async () => {
    const database = await new Promise((resolve, reject) => { const r=indexedDB.open('populous-new-dawn');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error) })
    const saved = await new Promise((resolve, reject) => { const r=database.transaction('checkpoints').objectStore('checkpoints').get('latest');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error) });database.close()
    const types={}, examples=[]
    function visit(value,path) {
      if(!value || typeof value!=='object')return
      const type=value.constructor?.name ?? 'unknown'; types[type]=(types[type]??0)+1
      if(type!=='Object'&&type!=='Array'){if(examples.length<30)examples.push({path,type,size:value.size??value.length});return}
      for(const [key,child]of Object.entries(value))visit(child,path+'.'+key)
    }
    visit(saved,'latest');return{types,examples}
  })
  await observed.evaluate(value=>value.disconnect()); report.comparisons.push(result);persist()
}
try {
  server=await preview({configFile:false,root:resolve('scripts/tutorial-browser/fixture'),build:{outDir:resolve('outputs/checkpoint-recovery-attempt3/dist')},preview:{host:'127.0.0.1',port:5198,strictPort:true}})
  browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,chromiumSandbox:true,ignoreDefaultArgs:['--enable-unsafe-swiftshader'],timeout:30000})
  report.browser=browser.version()
  const original=await browser.newContext({viewport:{width:960,height:720}}), seed=await pageFor(original,'seed')
  await startMission(seed)
  await seed.waitForFunction(()=>window.testStore.getWorld().turn>=12)
  await seed.getByRole('button',{name:'Pause game',exact:true}).click();await save(seed)
  await inspect(seed,'original-public-save')
  const state=await original.storageState({indexedDB:true})
  report.stateShape=state.origins.map(origin=>({origin:origin.origin,databases:origin.indexedDB?.map(db=>({name:db.name,stores:db.stores.map(store=>({name:store.name,records:store.records.length}))}))}))
  await seed.close()
  const fresh=await pageFor(original,'same-context-new-page');await inspect(fresh,'same-context-new-page');await fresh.close()
  const copied=await browser.newContext({viewport:{width:960,height:720},storageState:state})
  const copy=await pageFor(copied,'storage-state-copy');await inspect(copy,'storage-state-copy')
  await copied.close();await original.close()
  report.status='completed-diagnostic'
} catch(error){report.status='failed';report.failure=String(error);report.stack=error.stack;process.exitCode=1}
finally {await browser?.close();server?.httpServer.closeAllConnections();await server?.close();report.cleanupVerified=!browser?.isConnected();persist()}
assert.deepEqual(report.errors,[])
console.log(JSON.stringify({status:report.status,comparisons:report.comparisons.map(x=>({label:x.label,status:x.owner.status,hasCheckpoint:x.owner.hasCheckpoint,types:x.types.types})),stateShape:report.stateShape,cleanupVerified:report.cleanupVerified}))
