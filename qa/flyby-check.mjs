import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];
page.on('pageerror',e=>errors.push(String(e)));
try {
 await page.goto('http://localhost:3000/',{waitUntil:'networkidle'});
 const skip=page.getByRole('button',{name:/Skip introduction/});await skip.waitFor({timeout:15000});
 const opening=page.locator('.campaign-messages details').filter({hasText:'I have created'});
 assert.ok(await opening.locator('p').isVisible(),'original opening narration opens automatically');
 const tooltip=page.getByRole('tooltip');
 await page.getByRole('tooltip').filter({hasText:'Dakini Warrior Training Hut.'}).waitFor({timeout:12000});
 await page.screenshot({path:'qa/opening-flyby.png'});
 await page.getByRole('button',{name:'Pause game',exact:true}).click();
 const snapshot=()=>page.evaluate(()=>{
  const main=document.querySelector('main');let fiber=main[Object.keys(main).find(k=>k.startsWith('__reactFiber'))];
  for(;fiber;fiber=fiber.return)for(let hook=fiber.memoizedState;hook;hook=hook.next)
   if(hook.memoizedState?.current?.unitMeshes){
    const scene=hook.memoizedState.current,w=scene.world;
    return {camera:{...scene.flybyCamera},inputMask:w.inputMask,selected:[...w.selected],braves:w.units.filter(u=>u.team==='blue'&&u.kind==='brave').map(u=>u.id)};
   }
  throw Error('Missing game scene');
 });
 const tooltipBefore=await tooltip.boundingBox();const before=await snapshot();await page.waitForTimeout(400);assert.deepEqual(await snapshot(),before,'pause holds the flyby camera');assert.deepEqual(await tooltip.boundingBox(),tooltipBefore,'pause holds the tooltip');
 await page.getByRole('button',{name:'Resume game',exact:true}).click();
 await tooltip.filter({hasText:'Vault of Knowledge:'}).waitFor({timeout:12000});await page.screenshot({path:'qa/opening-vault-tooltip.png'});
 await tooltip.filter({hasText:'Stone Head:'}).waitFor({timeout:12000});await page.screenshot({path:'qa/opening-head-tooltip.png'});
 await skip.waitFor({state:'hidden',timeout:15000});assert.ok(await tooltip.isHidden(),'last tooltip expires before natural completion');
 await page.getByRole('button',{name:'Select all braves',exact:true}).click();
 const completed=await snapshot();assert.equal(completed.inputMask,0);assert.deepEqual(completed.selected,completed.braves,'natural completion releases gameplay controls');
 await page.screenshot({path:'qa/opening-complete.png'});
 await page.getByRole('button',{name:'Menu',exact:true}).click();await page.getByRole('button',{name:'Restart world',exact:true}).click();
 await skip.waitFor({timeout:15000});await page.waitForTimeout(1000);
 await page.keyboard.press('Escape');await skip.waitFor({state:'hidden',timeout:5000});
 await page.getByRole('button',{name:'Select all braves',exact:true}).click();
 const interrupted=await snapshot();assert.equal(interrupted.inputMask,0);assert.deepEqual(interrupted.selected,interrupted.braves,'interruption releases gameplay controls');
 assert.deepEqual(errors,[]);console.log('PASS: opening narration, three original tooltips, pause, natural completion, restart and keyboard interruption');
} finally {await browser.close();}
