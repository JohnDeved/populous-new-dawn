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
 await page.waitForTimeout(4500);await page.screenshot({path:'qa/opening-flyby.png'});
 await page.getByRole('button',{name:'Pause game',exact:true}).click();
 const label=page.getByRole('button',{name:'Worship Vault of Knowledge',exact:true,includeHidden:true});
 const before=await label.boundingBox();await page.waitForTimeout(400);assert.deepEqual(await label.boundingBox(),before,'pause holds the flyby camera');
 await page.getByRole('button',{name:'Resume game',exact:true}).click();
 await skip.waitFor({state:'hidden',timeout:35000});
 await page.getByRole('button',{name:'Select all braves',exact:true}).click();
 assert.match(await page.getByRole('button',{name:'Select all braves',exact:true}).getAttribute('class'),/selected/,'natural completion releases gameplay controls');
 await page.screenshot({path:'qa/opening-complete.png'});
 await page.getByRole('button',{name:'Menu',exact:true}).click();await page.getByRole('button',{name:'Restart world',exact:true}).click();
 await skip.waitFor({timeout:15000});await page.waitForTimeout(1000);
 await page.keyboard.press('Escape');await skip.waitFor({state:'hidden',timeout:5000});
 await page.getByRole('button',{name:'Select all braves',exact:true}).click();
 assert.match(await page.getByRole('button',{name:'Select all braves',exact:true}).getAttribute('class'),/selected/,'interruption releases gameplay controls');
 assert.deepEqual(errors,[]);console.log('PASS: opening narration, flyby, pause, natural completion, restart and keyboard interruption');
} finally {await browser.close();}
