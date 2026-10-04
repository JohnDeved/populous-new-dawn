import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { bindGame } from '../../../scripts/browser-game.mjs'
export default async function ({ page, output, signal }) {
 const failures=[]; const inputs=['explore.mjs','prepare-journey.mjs'].map(name=>{const bytes=readFileSync(new URL(name,import.meta.url));writeFileSync(resolve(output,name),bytes);return {name,sha256:createHash('sha256').update(bytes).digest('hex')}});writeFileSync(resolve(output,'scenario-inputs.json'),JSON.stringify(inputs,null,2));
 const state = () => page.evaluate(() => {
  const s=window.testSceneRef?.current;if(!s)return {sceneUnavailable:true,body:document.body.innerText};const w=s.world,r=s.container.getBoundingClientRect();
  const project=p=>{const q=s.screen(p);return {x:r.left+(q.x+1)*r.width/2,y:r.top+(1-q.y)*r.height/2}};
  return {turn:w.turn,time:w.time,paused:w.paused,status:w.status,inputMask:w.inputMask,mode:w.mode,selected:w.selected,stats:w.stats,shots:w.shots,mana:w.mana,unlockedCamp:w.unlockedCamp,
   camera:{point:s.viewPoint,target:s.cameraMotion.target,bearing:s.cameraBearing,overview:s.overviewStage},
   units:w.units.map(u=>({id:u.id,team:u.team,kind:u.kind,x:u.x,z:u.z,hp:u.hp,inside:u.inside,work:u.work,target:u.target,task:u.task,point:project(u)})),
   buildings:w.buildings.map(b=>({id:b.id,team:b.team,kind:b.kind,x:b.x,z:b.z,hp:b.hp,progress:b.progress,point:project(b),training:b.training})),
   shrines:w.shrines.map(b=>({...b,point:project(b)})),
   dom:[...document.querySelectorAll('button')].filter(e=>e.getBoundingClientRect().width&&e.getBoundingClientRect().height).map(e=>({text:e.textContent,aria:e.getAttribute('aria-label'),title:e.title,disabled:e.disabled,pressed:e.getAttribute('aria-pressed')})),
   body:document.body.innerText};
 });
 const snap=async n=>{writeFileSync(resolve(output,`${n}.json`),JSON.stringify({at:new Date().toISOString(),...await state()},null,2));await page.screenshot({path:resolve(output,`${n}.png`)});console.log('snapshot',n)};
 await (await import('./prepare-journey.mjs')).default({page,output,signal}); await snap('000-prepared');
 for(let i=1;i<500;i++){
  const file=resolve(output,`command-${i}.json`);while(!existsSync(file)){signal.throwIfAborted();await new Promise(r=>setTimeout(r,500))}
  const commands=JSON.parse(readFileSync(file,'utf8'));let extra=[];
  try{for(const c of commands){
   appendFileSync(resolve(output,'actions.jsonl'),JSON.stringify({i,at:new Date().toISOString(),command:c})+'\n');
   if(c.action==='button')await page.getByRole('button',{name:c.name,exact:c.exact??true}).click(c.options??{});
   else if(c.action==='title')await page.getByTitle(c.name,{exact:true}).click(c.options??{});
   else if(c.action==='key')await page.keyboard.press(c.key);
   else if(c.action==='hold'){await page.keyboard.down(c.key);await page.waitForTimeout(c.ms);await page.keyboard.up(c.key)}
   else if(c.action==='click')await page.mouse.click(c.x,c.y,c.options??{});
   else if(c.action==='move')await page.mouse.move(c.x,c.y);
   else if(c.action==='wait')await page.waitForTimeout(c.ms);
   else if(c.action==='read')extra.push(await page.evaluate(c.expression));
   else if(c.action==='until')await page.waitForFunction(expression=>{const value=(0,eval)(expression);if(typeof value!=='boolean')throw Error('until must evaluate to a boolean, not a function or Promise');return value},c.expression,{timeout:c.timeout??120000,polling:500});
   else if(c.action==='reload'){await page.reload({waitUntil:'domcontentloaded'})}
   else if(c.action==='bind')await bindGame(page);
   else if(c.action==='finish'){if(failures.length)throw Error('Exploration had failed commands: '+JSON.stringify(failures));return {completed:true,inputs,final:await state()};}
   else throw Error('Unknown action '+c.action)
  }writeFileSync(resolve(output,`extra-${i}.json`),JSON.stringify(extra,null,2));await snap(String(i).padStart(3,'0'))}
  catch(e){failures.push({command:i,error:e.stack});writeFileSync(resolve(output,'command-failures.json'),JSON.stringify(failures,null,2));writeFileSync(resolve(output,`error-${i}.txt`),e.stack);await snap(String(i).padStart(3,'0')+'-failed');console.error('command failed',i,e.message);if(commands.some(c=>c.action==='finish'))throw e}
 }
}
