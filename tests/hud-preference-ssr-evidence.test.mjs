import '../scripts/hud-preference-ssr-evidence/policy.test.mjs'
import '../scripts/hud-preference-ssr-evidence/bounded-hash.test.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, symlinkSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, dirname } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { hostedAdmission } from '../scripts/hud-preference-ssr-evidence/admission.mjs'
import { candidateBrowserBinding, loadCandidateBrowser } from '../scripts/hud-preference-ssr-evidence/candidate-browser.mjs'
import { candidateDependency } from '../scripts/native-ui-evidence/identity.mjs'
import { APP } from '../scripts/hud-preference-ssr-evidence/policy.mjs'
const env = () => ({ GITHUB_EVENT_NAME: 'workflow_dispatch', GITHUB_REPOSITORY: 'JohnDeved/populous-new-dawn',
  GITHUB_REF: 'refs/heads/main', GITHUB_WORKFLOW_REF: 'JohnDeved/populous-new-dawn/.github/workflows/native-ui-evidence.yml@refs/heads/main',
  GITHUB_SHA: 'a'.repeat(40), GITHUB_WORKFLOW_SHA: 'a'.repeat(40), PND_HUD_INFRASTRUCTURE_SHA: 'a'.repeat(40),
  PND_UI_CANDIDATE_SHA: APP, PND_EVIDENCE_KIND: 'hud-preference-ssr', GITHUB_RUN_ID: '123', GITHUB_RUN_ATTEMPT: '1' })
test('HUD dispatch binds approved main before launch, candidate and first run attempt', () => {
  assert.equal(hostedAdmission(env()).candidateSha, APP)
  for (const [key,value] of [['PND_HUD_INFRASTRUCTURE_SHA','b'.repeat(40)],['PND_UI_CANDIDATE_SHA','b'.repeat(40)],
    ['GITHUB_RUN_ATTEMPT','2'],['GITHUB_RUN_ID',''],['PND_EVIDENCE_KIND','options-controls'],
    ['GITHUB_REF','refs/heads/feature'],['GITHUB_EVENT_NAME','pull_request'],['GITHUB_REPOSITORY','other/repo']]) {
    assert.throws(() => hostedAdmission({ ...env(), [key]: value }), undefined, key)
  }
})
test('workflow keeps manual native-ui default and one explicit remote HUD mode', () => {
  const source = readFileSync(new URL('../.github/workflows/native-ui-evidence.yml', import.meta.url),'utf8')
  assert.match(source,/default: native-ui/)
  assert.match(source,/contents: read/)
  assert.match(source,/cancel-in-progress: false/)
  assert.match(source,/runs-on: ubuntu-24\.04/)
  assert.match(source,/path: outputs\/hud-preference-ssr\/payload/)
  assert.match(source,/infrastructure_sha:/)
  for (const mode of ['native-ui','material-lifecycle','options-controls','tower-collection','melee-capture-diagnostic','hud-preference-ssr']) {
    assert.equal(source.split(`          - ${mode}\n`).length-1,1)
  }
  const prepare=source.indexOf('name: Bind exact hosted HUD source')
  assert.ok(source.indexOf('name: Admit exact hosted HUD infrastructure')<prepare)
  assert.ok(prepare<source.indexOf('name: Run one bounded sandboxed fixed-preview HUD'))
})

test('Python ownership and final-consumer synthetic fixtures remain finite', () => {
  const result = spawnSync('/usr/bin/python3', ['-I', '-S', '-B', fileURLToPath(new URL('../scripts/hud-preference-ssr-evidence/dry_tests.py', import.meta.url))], {
    timeout: 25000, maxBuffer: 2 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  })
  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)
  assert.equal(result.error, undefined)
  assert.equal(result.signal, null)
  assert.equal(result.status, 0, 'Retained Python fixture stream must report success')
})

function isolatedBrowserFixture(t) {
  const root=mkdtempSync(resolve(tmpdir(),'hud-isolated-browser-'))
  t.after(() => rmSync(root,{recursive:true,force:true}))
  const put=(name,bytes) => {const path=resolve(root,name);mkdirSync(dirname(path),{recursive:true});writeFileSync(path,bytes);return path}
  put('package.json',JSON.stringify({name:'fixture',dependencies:{'@playwright/test':'1.63.0'}}))
  const packageRoot='node_modules/.pnpm/@playwright+test@1.63.0/node_modules/@playwright/test'
  put(packageRoot+'/package.json',JSON.stringify({name:'@playwright/test',version:'1.63.0',main:'index.cjs'}))
  put(packageRoot+'/index.cjs',"module.exports={chromium:{launch(){throw Error('Synthetic browser must not launch')}}}\n")
  mkdirSync(resolve(root,'node_modules/@playwright'),{recursive:true})
  symlinkSync('../.pnpm/@playwright+test@1.63.0/node_modules/@playwright/test',resolve(root,'node_modules/@playwright/test'))
  put('node_modules/playwright-core/package.json',JSON.stringify({name:'playwright-core',version:'1.63.0',main:'index.cjs'}))
  put('node_modules/playwright-core/index.cjs','module.exports={}\n')
  return {root,put}
}
test('declared isolated candidate export works without root playwright exposure',async t => {
  const {root}=isolatedBrowserFixture(t)
  assert.throws(() => candidateDependency(root,'playwright'))
  const binding=candidateBrowserBinding(root)
  assert.equal(binding.tooling['@playwright/test'],'1.63.0')
  const chromium=await loadCandidateBrowser(root,binding.playwrightEntry)
  assert.equal(typeof chromium.launch,'function')
  await assert.rejects(loadCandidateBrowser(root,binding.playwrightEntry+'.wrong'),/entry changed/)
})
test('browser package resolution rejects outside-node_modules and unbound exports',async t => {
  const {root,put}=isolatedBrowserFixture(t)
  put('outside/package.json',JSON.stringify({name:'outside',main:'index.cjs'}))
  put('outside/index.cjs','module.exports={chromium:{}}\n')
  symlinkSync('../outside',resolve(root,'node_modules/outside'))
  assert.throws(() => candidateDependency(root,'outside'),/escaped candidate/)
  put('node_modules/.pnpm/@playwright+test@1.63.0/node_modules/@playwright/test/index.cjs','module.exports={}\n')
  const binding=candidateBrowserBinding(root)
  await assert.rejects(loadCandidateBrowser(root,binding.playwrightEntry),/Missing candidate dependency export/)
})
test('safe failed upload is independent of failed bounds outcome',() => {
  const source=readFileSync(new URL('../.github/workflows/native-ui-evidence.yml',import.meta.url),'utf8')
  const upload=source.slice(source.indexOf('      - name: Retain bounded HUD HTML'))
  assert.match(upload,/if: \$\{\{ always\(\) && env\.PND_EVIDENCE_KIND == 'hud-preference-ssr' && steps\.hud-bounds\.outputs\.upload_safe == 'true' \}\}/)
  assert.doesNotMatch(upload,/hud-bounds\.outcome/)
  assert.doesNotMatch(source,/continue-on-error/)
})
