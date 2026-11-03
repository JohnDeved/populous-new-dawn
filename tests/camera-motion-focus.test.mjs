import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

const source=readFileSync(new URL('../scripts/tutorial-browser/camera-motion-evidence.mjs',import.meta.url),'utf8')
const calls=[...source.matchAll(/await step\(\(\)=>page\.locator\(('.*?')\)\.focus\(\)\)/g)]
assert.equal(calls.length,1,'exactly one battlefield focus action')
const action='page.locator('+calls[0][1]+').focus()'
function focus(nodes) {
  const focused=[]
  const page={locator(selector){
    assert.ok(selector==='.world-viewport canvas'||selector==='.world-viewport canvas.battlefield')
    const matches=nodes.filter(node=>selector.endsWith('.battlefield')?node.className==='battlefield':true)
    return {focus(){if(matches.length!==1)throw Error('strict locator requires one element');focused.push(matches[0])}}
  }}
  runInNewContext(action,{page})
  return focused
}
test('actual camera focus targets the battlefield beside the aria-hidden auxiliary canvas',()=>{
  const battlefield={className:'battlefield',tabIndex:0},auxiliary={className:'',ariaHidden:true}
  assert.deepEqual(focus([battlefield,auxiliary]),[battlefield])
  assert.deepEqual(focus([auxiliary,battlefield]),[battlefield])
})
test('missing or duplicate battlefield remains a strict failure, never first-element fallback',()=>{
  assert.throws(()=>focus([{className:'',ariaHidden:true}]),/strict locator/)
  assert.throws(()=>focus([{className:'battlefield'},{className:'battlefield'}]),/strict locator/)
})
test('the selected class is assigned to the actual focusable renderer owner',()=>{
  const scene=readFileSync(new URL('../app/scene.ts',import.meta.url),'utf8')
  assert.match(scene,/this\.renderer\.domElement\.tabIndex = 0/)
  assert.match(scene,/this\.renderer\.domElement\.className = 'battlefield'/)
  assert.match(source,/page\.locator\('\.world-viewport canvas\.battlefield'\)\.focus\(\)/)
})
