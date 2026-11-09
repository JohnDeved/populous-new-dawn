import { spawnSync, execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import assert from 'node:assert/strict'
const base = '14a985b3f11c6efde862d9837596fe2e9ed0588b'
const files = ['app/frontend-assets.ts', 'app/page.tsx', 'app/original-main-menu.tsx', 'app/original-options.tsx', 'scripts/local-render/frontend-prepared-assets.mjs', 'evidence/frontend-prepared-assets-20261017/run-probe.mjs', 'tests/frontend-assets.test.mjs', 'tests/checkpoint-restore-ui.test.mjs', 'tests/frontend-logo-readiness.test.mjs', 'tests/frontend-text-readiness.test.mjs', 'tests/options-art-readiness.test.mjs', 'tests/original-options.test.mjs', 'tests/selector-profile-launch.test.mjs', 'tests/tutorial-recommendation.test.mjs']
const results = []
for (const file of files) {
  const current = spawnSync('./node_modules/.bin/eslint', ['--format', 'json', file], {encoding:'utf8'})
  assert.ok(current.status === 0 || current.status === 1, current.stderr)
  const messages = JSON.parse(current.stdout)[0].messages
  let baseline = []
  if (messages.length) {
    const input = execFileSync('git',['show',`${base}:${file}`],{encoding:'utf8'})
    const previous = spawnSync('./node_modules/.bin/eslint',['--format','json','--stdin','--stdin-filename',file],{encoding:'utf8',input})
    assert.ok(previous.status === 0 || previous.status === 1,previous.stderr)
    baseline = JSON.parse(previous.stdout)[0].messages
  }
  results.push({file,current:messages,baseline})
}
writeFileSync('work/orchestration/frontend-prepared/lint-details.json',JSON.stringify({base,results},null,2)+'\n')
const normalize = messages => messages.map(({ruleId,severity,messageId,nodeType})=>({ruleId,severity,messageId,nodeType}))
for (const result of results) assert.deepEqual(normalize(result.current),normalize(result.baseline),`New lint findings in ${result.file}`)
console.log(JSON.stringify({status:'passed-no-new-findings',base,files:results.map(r=>({file:r.file,current:r.current.map(m=>({ruleId:m.ruleId,line:m.line,severity:m.severity})),baseline:r.baseline.map(m=>({ruleId:m.ruleId,line:m.line,severity:m.severity}))}))},null,2))
