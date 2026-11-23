import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, symlink, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import witness from './startup-visual.mjs'

const expected = '7deb7805c48932bd7a8e226e158a944e94ad2972'
const expectedTree = 'dec598bdde625573cb6968bd4f64053ca1a0f031'
const [candidate, outputDirectory] = process.argv.slice(2)
assert.ok(candidate && outputDirectory && process.argv.length === 4)
assert.equal(process.env.GITHUB_ACTIONS, 'true')
assert.equal(process.env.GITHUB_EVENT_NAME, 'push')
assert.equal(process.env.GITHUB_REPOSITORY, 'JohnDeved/populous-new-dawn')
assert.equal(process.env.GITHUB_REF, 'refs/heads/evidence/mission18-opening-once')
const root = resolve(candidate), out = resolve(outputDirectory), dist = resolve(out, 'private-build')
const git = (...argv) => execFileSync('git', argv, { cwd:root, encoding:'utf8', timeout:10000 }).trim()
const getSource = () => ({commit:git('rev-parse','HEAD'), tree:git('rev-parse','HEAD^{tree}'),
  status:git('status','--porcelain=v1','--untracked-files=all'), untracked:[]})
const source = getSource()
assert.deepEqual(source, {commit:expected, tree:expectedTree, status:'', untracked:[]})
const runner = {imageVersion:process.env.ImageVersion ?? null, imageOS:process.env.ImageOS ?? null,
  runId:process.env.GITHUB_RUN_ID, attempt:process.env.GITHUB_RUN_ATTEMPT, workflowCommit:process.env.GITHUB_SHA}
assert.equal(runner.attempt, '1', 'This is a one-off, not a rerun route')
const checksum = async path => createHash('sha256').update(await readFile(path)).digest('hex')
const output = resolve(out, 'evidence')
await mkdir(out, {mode:0o700}); await mkdir(output, {mode:0o700})
const receipt = {source, runner, status:'failed', cleanupVerified:false, errors:[]}
const receiptPath = resolve(output,'receipt.json')
let browser, context, server
try {
  for (const key of ['GH_TOKEN','GITHUB_TOKEN','CLOUDFLARE_API_TOKEN','NODE_OPTIONS','NODE_PATH','NODE_COMPILE_CACHE','NODE_V8_COVERAGE']) {
    delete process.env[key]
  }
  const fromCandidate = createRequire(resolve(root,'package.json'))
  const viteRoot = dirname(fromCandidate.resolve('vite/package.json'))
  const {preview} = await import(pathToFileURL(resolve(viteRoot,'dist/node/index.js')).href)
  const {chromium} = fromCandidate('@playwright/test')
  const scripts = resolve(root,'scripts/tutorial-browser')
  const configPath = resolve(scripts,'browser-config.mjs')
  const {browserConfiguration} = await import(pathToFileURL(configPath).href)
  const config = browserConfiguration()
  assert.equal(config.launch.chromiumSandbox,true)
  assert.equal(config.launch.ignoreDefaultArgs,true)
  assert.equal(config.launch.headless,true)
  assert.equal(config.launch.channel,'chrome')
  assert.deepEqual(config.launch.args,['--headless','--remote-debugging-pipe'])
  const build = resolve(scripts,'build-home.mjs'), fixture = resolve(scripts,'fixture')
  receipt.inputSHA256 = {browserConfig: await checksum(configPath), build:await checksum(build), pnpmLock:await checksum(resolve(root,'pnpm-lock.yaml')),
    scenario:await checksum(fileURLToPath(new URL('./startup-visual.mjs', import.meta.url))),
    observer:await checksum(fileURLToPath(new URL('./observe.mjs', import.meta.url)))}
  receipt.chromeInstallation = {path:config.browserPath, sha256:await checksum(config.browserPath),
    version:execFileSync(config.browserPath,['--version'],{encoding:'utf8',timeout:10000}).trim(),
    note:'Installation path is measured separately from actual browser.version(); no PID/kernel attestation.'}
  receipt.launch = config.launch
  const childLog = execFileSync(process.execPath,[build,fixture,dist],{cwd:root,encoding:'utf8',timeout:120000,maxBuffer:2*1024*1024})
  await writeFile(resolve(output,'build.log'),childLog,{flag:'wx',mode:0o600})
  const publicPath = resolve(root,'public')
  for (const entry of await readdir(publicPath,{withFileTypes:true})) {
    assert.ok(entry.isDirectory() || entry.isFile(),'Only normal checked-out public assets')
    await symlink(resolve(publicPath,entry.name),resolve(dist,entry.name),entry.isDirectory()?'dir':'file')
  }
  assert.deepEqual(getSource(),source)
  server = await preview({configFile:false,root:fixture,build:{outDir:dist},preview:{host:'127.0.0.1',port:5198,strictPort:true}})
  browser = await chromium.launch(config.launch)
  receipt.browserVersion = browser.version()
  assert.equal(receipt.chromeInstallation.version,'Google Chrome '+receipt.browserVersion)
  context = await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1})
  const page = await context.newPage(); page.setDefaultTimeout(25000)
  page.on('pageerror',err=>receipt.errors.push(String(err)))
  page.on('console',message=>{if(message.type()==='error') receipt.errors.push(message.text())})
  page.on('crash',()=>receipt.errors.push('Page crashed'))
  await page.goto('http://127.0.0.1:5198/',{waitUntil:'domcontentloaded',timeout:30000})
  receipt.opening = await witness({ page, root, output, receipt, signal: AbortSignal.timeout(85000) })
  for (const frame of receipt.opening.screenshots)
    assert.match(frame.before.renderer,/SwiftShader/i,'Require the hosted software-rendered witness')
  assert.deepEqual(receipt.errors,[])
  assert.deepEqual(getSource(),source)
  receipt.status = 'passed'
} catch (error) {
  receipt.failure = String(error)
  process.exitCode = 1
} finally {
  const cleanup = []
  for (const [owner, handle, close] of [['context',context,()=>context.close()],['browser',browser,()=>browser.close()],['server',server,()=>server.httpServer.close()]]) {
    if (handle) try {
      if (owner === 'server') await new Promise((ok, fail)=>server.httpServer.close(err=>err?fail(err):ok()))
      else await close()
    } catch (error) { cleanup.push({owner,error:String(error)}) }
  }
  receipt.cleanupVerified = cleanup.length === 0
  if (cleanup.length) {receipt.cleanupErrors=cleanup;receipt.status='failed';process.exitCode=1}
  await writeFile(receiptPath,JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600})
  console.log(JSON.stringify({status:receipt.status,failure:receipt.failure,cleanupVerified:receipt.cleanupVerified}))
}
