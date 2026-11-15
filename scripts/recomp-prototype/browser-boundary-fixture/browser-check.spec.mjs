// Run only in the coordinator's approved serialized browser/CI lane.
import {test,expect} from '@playwright/test';
test('synthetic Canvas2D framebuffer and input, not original game',async({page},testInfo)=>{
  if(!process.env.FIXTURE_URL) throw Error('Set verified fixture URL explicitly');
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.setViewportSize({width:800,height:700});await page.goto(process.env.FIXTURE_URL);
  await expect(page.locator('h1')).toHaveText('Synthetic fixture, not Populous');
  await expect.poll(()=>page.locator('canvas').evaluate(c=>[...c.getContext('2d').getImageData(10,10,1,1).data])).toEqual([18,32,51,255]);
  const samples=await page.locator('canvas').evaluate(c=>[[10,10],[330,10],[10,250],[330,250]].map(([x,y])=>[...c.getContext('2d').getImageData(x,y,1,1).data]));
  expect(samples).toEqual([[18,32,51,255],[54,183,164,255],[225,171,63,255],[255,255,255,255]]);
  await page.locator('canvas').click({position:{x:200,y:150},modifiers:['Control','Alt']});
  await expect(page.locator('#log')).toHaveText(JSON.stringify({type:'pointerDown',point:{x:200,y:150},ctrl:true,alt:true}));
  await page.screenshot({path:testInfo.outputPath('synthetic-framebuffer.png'),fullPage:true});expect(errors).toEqual([]);
});
