import assert from 'node:assert/strict'
import {resolve}from'node:path'
import {writeFileSync}from'node:fs'
export default async function({page,output}){
 const main=page.getByRole('dialog',{name:'Main menu',exact:true}),button=n=>main.getByRole('button',{name:n,exact:true}),quit=page.locator('[data-original-quit-menu]'),events=[]
 const save=async label=>{events.push({label,...await page.evaluate(()=>({active:document.activeElement?.outerHTML,quit:!!document.querySelector('[data-original-quit-menu]'),text:document.querySelector('[data-original-main-menu]')?.innerText,dialogOpen:document.querySelector('[data-original-main-menu]')?.open,events:globalThis.__cancelEvents}))});writeFileSync(resolve(output,'events.json'),JSON.stringify(events,null,2)+'\n')}
 await main.waitFor();await page.evaluate(()=>{globalThis.__cancelEvents=[];for(const type of ['keydown','keyup','cancel','click'])document.addEventListener(type,e=>{if(type==='cancel'||type==='click'||e.key==='Escape'||e.key==='Enter')globalThis.__cancelEvents.push({type,key:e.key,at:performance.now(),active:document.activeElement?.getAttribute('aria-label'),target:e.target.tagName,prevented:e.defaultPrevented})},true)});await page.setViewportSize({width:640,height:480})
 for(const method of Array(12).fill('Escape')){
  await button('Quit').focus();await page.keyboard.press('Enter');await quit.waitFor();await page.waitForFunction(()=>document.activeElement?.matches('[data-original-quit-menu] [data-panel-back]'));await save('open before '+method)
  if(method==='pointer No')await button('No').click()
  else if(method==='keyboard No'){await button('No').focus();await page.keyboard.press('Enter')}
  else if(method==='keyboard Back')await page.keyboard.press('Enter')
  else await page.keyboard.press('Escape')
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await save('after '+method)
  if(await quit.count()){await page.screenshot({path:resolve(output,'failed-'+method.replaceAll(' ','-')+'.png')});throw Error('Quit still open after '+method)}
  await button('Quit').waitFor();assert.equal(await main.evaluate(el=>el.open),true);assert.equal(await button('Quit').evaluate(el=>el===document.activeElement),true)
 }
 await button('Options').click();await main.getByRole('region',{name:'Options',exact:true}).waitFor()
 for(let i=0;i<3;i++){
  await button('Browser compatibility and help').click();await main.getByRole('region',{name:'Browser compatibility and help',exact:true}).waitFor()
  await page.keyboard.press('Escape');await button('Browser compatibility and help').waitFor();assert.equal(await main.getByRole('region',{name:'Options',exact:true}).isVisible(),true);assert.equal(await button('Browser compatibility and help').evaluate(el=>el===document.activeElement),true);assert.equal(await main.evaluate(el=>el.open),true);await save('browser nested Escape '+i)
 }
 await page.keyboard.press('Escape');await button('Options').waitFor();assert.equal(await button('Options').evaluate(el=>el===document.activeElement),true);assert.equal(await main.evaluate(el=>el.open),true);await save('Options Escape to main')
 return events
}
