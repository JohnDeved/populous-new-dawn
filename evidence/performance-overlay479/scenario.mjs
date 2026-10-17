import assert from 'node:assert/strict'
import { checkPerformancePage } from '/tmp/populous-selector-scene-457/scripts/check-browser-fps.mjs'
import { bindGame, showAllMissions } from '/tmp/populous-selector-scene-457/scripts/browser-game.mjs'
import { writeFileSync } from 'node:fs'
export default async function(args) {
 const {page, output, receipt} = args
 let first = true
 const stage = name => { receipt.stage = name; writeFileSync(`${output}/stage.json`, JSON.stringify({name,at:new Date().toISOString()})) }
 const openMission = async mission => {
  stage(`open Mission ${mission}`)
  await showAllMissions(page)
  await page.getByRole('button', { name: `Mission ${mission}`, exact: true }).focus()
  await page.keyboard.press('Enter')
  await bindGame(page)
  const guard = page.getByRole('button', { name: /^Continue anyway/ })
  if (await guard.isVisible()) await guard.click()
  await page.waitForFunction(() => window.testSceneRef.current.world.flyby.flags & 1 || !window.testSceneRef.current.world.inputMask)
  const skip = page.locator('.skip-introduction'); if (await skip.isVisible()) await skip.click()
  const resume = page.getByRole('button', {name:'Resume game', exact:true}); if (await resume.isVisible()) await resume.click()
  await page.waitForFunction(() => !window.testSceneRef.current.world.inputMask, null, { timeout: 60000 })
  await page.evaluate(() => { window.testScene = window.testSceneRef.current })
  if (first) { first = false; await page.evaluate(() => document.activeElement?.blur()); await page.keyboard.press('F8'); await page.screenshot({path:`${output}/performance-off-640x480.jpg`,type:'jpeg',quality:80}); await page.keyboard.press('F8') }
  stage('ordinary Mission ready; telemetry QA')
 }
 await page.goto(`${args.url}/?fps`, {waitUntil:'domcontentloaded'})
 await openMission(1)
 const result = await checkPerformancePage(page, {output})
 assert.deepEqual(receipt.errors, [])
 return result
}
