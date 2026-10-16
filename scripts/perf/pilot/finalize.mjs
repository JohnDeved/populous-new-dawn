import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
const out='outputs/centers-pilot'
mkdirSync(out,{recursive:true})
const path=`${out}/report.json`
const report=existsSync(path)?JSON.parse(readFileSync(path,'utf8')):{status:'pilot did not start',runs:['baseline','baseline','baseline','baseline','baseline','candidate','candidate','baseline'].map((variant,i)=>({index:i+1,variant,status:'skipped',reason:'Preparation, dependency installation or earlier workflow step did not complete'}))}
report.finalizedAt=new Date().toISOString()
report.workflowStatusBeforeUpload=process.env.PILOT_JOB_STATUS??'unavailable'
if(report.status==='running'){
 report.status='interrupted before complete report'
 for(const r of report.runs)if(['running','executed','not started'].includes(r.status)){r.status='skipped or interrupted';r.reason='Workflow step stopped before terminal receipt'}
}
writeFileSync(path,JSON.stringify(report,null,2)+'\n')
