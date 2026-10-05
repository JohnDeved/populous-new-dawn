import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {buildingFootprintCells} from '../../../../app/building-shapes.ts'
import {chooseContextCommand,CommandContext} from '../../../../app/command-context.ts'
const original='../native-shaman-guard-before/work/orchestration/native-guard-browser-baseline-02/run/witness.json'
const state=JSON.parse(readFileSync(original,'utf8')).latest
const candidates=[{x:25,z:-9},{x:29,z:-11},{x:31,z:-11},{x:29,z:-13},{x:33,z:-9}]
const rows=candidates.map(target=>{
 const native={x:Math.round((target.x+8)*256)&65535,y:Math.round((-target.z-8)*256)&65535}
 const cell=(native.y>>9)*128+(native.x>>9)
 const buildings=state.buildings.filter(b=>buildingFootprintCells(b.pose).includes(cell)).map(b=>({id:b.id,team:b.team,kind:b.kind,model:b.model,pose:b.pose}))
 return {target,native,cell,buildings}
})
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const result={scope:'Pure retained-building-footprint and command-priority calculation; no world/actor construction, ticking, browser, terrain synchronization or live mutation. Clear footprint alone does not establish terrain or screen input validity.',inputs:Object.fromEntries([original,'app/building-shapes.ts','app/command-context.ts'].map(p=>[p,hash(p)])),retainedTurn:state.turn,rows,model6FriendlyCompletedBuildingCommand:chooseContextCommand(CommandContext.Ground|CommandContext.Building|CommandContext.Completed|CommandContext.Friendly,1<<6)}
writeFileSync('work/orchestration/native-guard-browser-diagnosis/attempt-02/ground-footprints.json',JSON.stringify(result,null,2)+'\n')
console.log(JSON.stringify(result,null,2))
