import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
const self = fileURLToPath(import.meta.url)
const hash = path => createHash('sha256').update(readFileSync(path)).digest('hex')
const party = [50, 51, 52, 53, 54, 55]
const expected = 'Worshipping Earthquake stone head. 6 followers are required.'
export default async function ({ page, openMission, root, output, receipt, signal }) {
  const helper = resolve(root, 'scripts/local-render/mission1-vault-input.mjs')
  const { createMission1VaultInput } = await import(pathToFileURL(helper).href)
  const report = { source: receipt.source, status: 'running', actions: [],
    checkerBefore: { scenarioSha256: hash(self), helperSha256: hash(helper) },
    scope: 'Actual M14 public-start/HUD command toast only; not reward acquisition or mission completion' }
  const save = () => writeFileSync(resolve(output, 'toast-prefix.json'), JSON.stringify(report, null, 2) + '\n')
  const input = createMission1VaultInput({ page, signal, report, save, originalShamanId: 258, deadlineAt: Date.parse(receipt.startedAt) + 300000 })
  const state = () => page.evaluate(() => {
    const s=window.testSceneRef.current,w=s.world,h=w.shrines.find(h=>h.id===47),gl=s.renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info')
    return { turn:w.turn,time:w.time,level:w.outcome.level,status:w.status,paused:w.paused,selected:[...w.selected],
      head:{id:h.id,x:h.x,z:h.z,required:h.required,uses:h.uses},message:w.message,
      toast:[...document.querySelectorAll('.world-message')].map(e=>({text:e.textContent,visible:!!e.getClientRects().length})),
      renderer:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),contextLost:gl.isContextLost() }
  })
  try {
    await openMission(14); await input.settle(); report.initial=await state(); save()
    assert.equal(report.initial.level,14); assert.equal(report.initial.head.required,6); assert.equal(report.initial.head.uses,0)
    await input.action('clear-selection',()=>page.keyboard.press('Escape'))
    await input.action('HUD select original six Braves',()=>page.getByRole('button',{name:'Select brave',exact:true}).click({modifiers:['Shift']}))
    await input.view(report.initial.head); await input.prepareDispatch()
    const hit=await input.entityPoint('shrines',47,27); assert.equal(hit.rejection,null)
    report.dispatch=await input.dispatch(hit,27,party)
    await input.action('move pointer away',()=>page.mouse.move(20,975))
    await page.getByText(expected,{exact:true}).waitFor({state:'visible'})
    report.before=await state(); save()
    assert.equal(report.before.message,expected); assert.ok(report.before.toast.some(t=>t.visible&&t.text.includes(expected)))
    await page.screenshot({path:resolve(output,'six-followers-toast.png')})
    report.after=await state(); assert.equal(report.after.message,expected)
    assert.equal(report.after.paused,false); assert.equal(report.after.contextLost,false); assert.deepEqual(receipt.errors,[])
    report.checkerAfter={scenarioSha256:hash(self),helperSha256:hash(helper)}
    assert.deepEqual(report.checkerAfter,report.checkerBefore)
    report.status='passed'; save(); return report
  } catch(error) {report.status='failed';report.error=String(error);save();throw error}
}
