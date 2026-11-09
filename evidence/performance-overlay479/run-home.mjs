import {createServer} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/postcss'
import {chromium} from '@playwright/test'
import {mkdirSync,writeFileSync,readFileSync,existsSync,readdirSync,statSync} from 'node:fs'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
const [fixture,output,scenarioPath,portText]=process.argv.slice(2)
if(!fixture||!output||!scenarioPath||!portText)throw Error('Require fixture, fresh output, scenario and port')
const root=resolve(fixture),out=resolve(output),port=Number(portText)
const browserPath='/workspace/scratch/69fd8163d94e/browser-recovery-20261014/chrome-headless-shell-linux64/chrome-headless-shell'
const dependencies='/tmp/populous-raid447-fallback-0229/node_modules'
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const source=JSON.parse(readFileSync(resolve(root,'source.json'),'utf8'))
function treeMetadata(path,prefix=''){const result={};for(const d of readdirSync(path,{withFileTypes:true})){const file=resolve(path,d.name),key=prefix+d.name;if(d.isDirectory())Object.assign(result,treeMetadata(file,key+'/'));else if(d.isFile()){const s=statSync(file);result[key]=[s.size,s.mtimeMs]}}return result}
function sourceMatches(){for(const [name,expected]of Object.entries(source.files))assert.equal(hash(resolve(source.snapshotRoot,name)),expected,'Source input drift: '+name)}
sourceMatches()
if(existsSync(resolve(out,'receipt.json')))throw Error('Fresh output required')
mkdirSync(out,{recursive:true})
const receipt={status:'running',startedAt:new Date().toISOString(),source,command:process.argv,runnerSha256:hash(import.meta.filename),scenarioSha256:hash(scenarioPath),fixtureSha256:hash(resolve(root,'main.tsx')),browserPath,browserSha256:hash(browserPath),node:process.version,errors:[],warnings:[],limits:source.limits}
const save=()=>writeFileSync(resolve(out,'receipt.json'),JSON.stringify(receipt,null,2)+'\n')
const dependencyBefore=treeMetadata(dependencies);receipt.dependenciesBeforeSha256=createHash('sha256').update(JSON.stringify(dependencyBefore)).digest('hex')
let server,browser,context,timer,page
try{
 save()
 server=await createServer({configFile:false,root,publicDir:resolve(source.snapshotRoot,'public'),cacheDir:resolve(root,'work/node_modules/.vite'),plugins:[react()],optimizeDeps:{exclude:['three']},css:{postcss:{plugins:[tailwindcss({base:root})]}},server:{host:'127.0.0.1',port,strictPort:true,fs:{allow:[root,source.snapshotRoot]}},logLevel:'warn'})
 await server.listen()
 browser=await chromium.launch({executablePath:browserPath,headless:true,chromiumSandbox:true,ignoreDefaultArgs:true,args:['--remote-debugging-pipe'],timeout:30000})
 receipt.browserVersion=browser.version();save()
 timer=setTimeout(()=>{receipt.timedOut=true;void browser.close()},240000)
 context=await browser.newContext({viewport:{width:640,height:480}})
 page=await context.newPage();page.setDefaultTimeout(25000)
 page.on('pageerror',error=>receipt.errors.push(String(error)))
 page.on('console',message=>{if(message.type()==='error')receipt.errors.push(message.text());if(message.type()==='warning')receipt.warnings.push(message.text())})
 page.on('crash',()=>{receipt.errors.push('Page crashed');save()})
 const url=`http://127.0.0.1:${port}`
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000})
 const scenario=(await import(pathToFileURL(resolve(scenarioPath)).href)).default
 receipt.result=await scenario({page,context,browser,url,output:out,root:source.snapshotRoot,receipt})
 assert.equal(receipt.timedOut,undefined)
 receipt.status='passed'
}catch(error){receipt.status='failed';receipt.failure=String(error);receipt.stack=error.stack;process.exitCode=1
 try{receipt.failureState=await page.evaluate(()=>({active:document.activeElement?.outerHTML?.slice(0,500),body:document.body.innerText.slice(0,2500),scene:window.testSceneRef?.current&&{turn:window.testSceneRef.current.world.turn,paused:window.testSceneRef.current.world.paused,inputMask:window.testSceneRef.current.world.inputMask,modal:window.testSceneRef.current.modalSuspended}}));await page.screenshot({path:resolve(out,'failure.png'),timeout:10000})}catch(diagnosticError){receipt.diagnosticError=String(diagnosticError)}
}
finally{
 clearTimeout(timer)
 try{await context?.close();await browser?.close();await server?.close();receipt.cleanupVerified=true}catch(error){receipt.cleanupError=String(error);receipt.status='failed';process.exitCode=1}
 try{sourceMatches();receipt.sourceAfter='identical'}catch(error){receipt.sourceAfter=String(error);receipt.status='failed';process.exitCode=1}
 const dependencyAfter=treeMetadata(dependencies);receipt.dependencyChanges=Object.keys({...dependencyBefore,...dependencyAfter}).filter(key=>JSON.stringify(dependencyBefore[key])!==JSON.stringify(dependencyAfter[key]));receipt.dependenciesAfterSha256=createHash('sha256').update(JSON.stringify(dependencyAfter)).digest('hex')
 if(receipt.dependencyChanges.length){receipt.status='failed';process.exitCode=1}
 receipt.endedAt=new Date().toISOString();save();console.log(JSON.stringify({status:receipt.status,failure:receipt.failure,cleanupVerified:receipt.cleanupVerified,sourceAfter:receipt.sourceAfter,dependencyChanges:receipt.dependencyChanges,output:out}))
}
