import {resolve} from 'node:path'
export default async function({page,output}) {
 await page.getByRole('dialog',{name:'Main menu',exact:true}).waitFor()
 await page.emulateMedia({reducedMotion:'reduce'})
 for(const [width,height] of [[640,480],[1280,960],[1920,1080],[3440,1440]]) {
  await page.setViewportSize({width,height});await page.mouse.move(-5,-5)
  await page.getByRole('button',{name:'New Game',exact:true}).focus();await page.keyboard.press('Home')
  await page.waitForTimeout(180)
  await page.screenshot({path:resolve(output,`main-${width}x${height}.png`)})
 }
 return {checks:['2D menu captures'],limits:['Headless Chrome; no WebGL or hardware performance claim']}
}
