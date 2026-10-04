import assert from 'node:assert/strict'
import {resolve} from 'node:path'
import {vehiclePoint} from './check-browser-vehicle-panel.mjs'
export default async function baseline({page,openMission,output}){
 await openMission(22)
 const ids=await page.evaluate(()=>{const s=window.testSceneRef.current;s.world.speed=0;cancelAnimationFrame(s.frame);return s.world.vehicles.map(v=>({id:v.id,model:v.model}))})
 await page.keyboard.press('Escape')
 for(const model of [1,3]){const id=ids.find(v=>v.model===model).id,p=await vehiclePoint(page,id);await page.mouse.click(p.x,p.y,{button:'right'});assert.equal(await page.locator('.vehicle-panel').count(),0);await page.screenshot({path:resolve(output,`vehicle-${model}-before.png`)})}
 return {scope:'Unmodified source baseline: authored empty Mission22 Boat/Balloon right-click produces no vehicle panel.',ids}
}
