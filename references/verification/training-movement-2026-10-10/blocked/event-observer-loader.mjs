import {registerHooks} from 'node:module'
import {createHash} from 'node:crypto'
export const observedSources=[]
const hash=s=>createHash('sha256').update(s).digest('hex')
const replace=(s,a,b)=>{if(s.split(a).length!==2)throw Error(`Nonunique observer anchor: ${a}`);return s.replace(a,b)}
registerHooks({load(url,context,next){const result=next(url,context);if(!/\/(campaign-command-runtime|computer-runtime|training-conversion)\.ts$/.test(url))return result;const original=String(result.source);let s=original
if(url.endsWith('/campaign-command-runtime.ts')){
s=replace(s,'export function campaignRules(w: World) {','export function campaignRules(w: World) {\n  globalThis.__mission2Event?.("script-visit",w)')
s=replace(s,'    const [count, model] = args.map(read)\n','    const [count, model] = args.map(read)\n    globalThis.__mission2Event?.("request-before",w,{count,model})\n')
s=replace(s,'      computerTrainingBuilding(w, targetModel, campaignTribe(w))\n    )\n    return','      computerTrainingBuilding(w, targetModel, campaignTribe(w))\n    )\n    globalThis.__mission2Event?.("request-after",w,{count,model})\n    return')
}else if(url.endsWith('/training-conversion.ts')){
s=replace(s,'  let sourceSlot = 0','  globalThis.__mission2Conversion?.("allocated",w,b,{sourceIds:b.occupants.slice(),created:created.map(p=>({id:p.id,model:p.model,tribe:p.tribe}))})\n  let sourceSlot = 0')
s=replace(s,'  b.trainingCost = 0','  globalThis.__mission2Conversion?.("committed",w,b,{created:created.map(p=>({id:p.id,model:p.model,tribe:p.tribe}))})\n  b.trainingCost = 0')
}else{
s=replace(s,'        if (!issued?.accepted || issued.count !== units.length) task.flags &= ~3','        globalThis.__mission2Event?.("training-command8",w,{index,task:structuredClone(task),units:units.map(u=>u.id),issued})\n        if (!issued?.accepted || issued.count !== units.length) task.flags &= ~3')
}
observedSources.push({url,originalSha256:hash(original),observedSha256:hash(s)});return {...result,source:s}}})
