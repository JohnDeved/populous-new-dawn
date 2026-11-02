// NEW AD-HOC regression: supplied synchronous retirement during elapsed-input drain.
// Executes actual entry-function bodies only. No World/Scene/browser construction.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
const path='../app/scene-camera-runtime.ts'
const source=ts.createSourceFile(path,readFileSync(new URL(path,import.meta.url),'utf8'),ts.ScriptTarget.Latest,true)
for(const name of ['focus','cameraBookmark','overview','zoom','skipIntroduction']){
  const matches=source.statements.filter(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name)
  assert.equal(matches.length,1)
  const js=ts.transpileModule(matches[0].getText(source).replace(/^export /,''),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText
  const entry=new Function('sampleCamera',`${js};return ${name}`)(()=>assert.fail('must read owner before sampling'))
  test(`${name} returns after input drain retires its owner`,()=>{
    let drains=0,reads=0
    const scene={disposed:false,advanceInputTime(){drains++;this.disposed=true},
      get world(){reads++;throw Error('retired World access')},
      get captureCamera(){reads++;throw Error('retired capture access')}}
    const args=name==='focus'?[{}, {animate:true}]:name==='cameraBookmark'?[0,true]:name==='zoom'?[true]:[]
    assert.doesNotThrow(()=>entry(scene,...args))
    assert.equal(drains,1)
    assert.equal(reads,0)
  })
  test(`${name} still reaches its normal owner path when drain keeps the Scene live`,()=>{
    const marker=new Error('live owner reached')
    let drains=0
    const scene={disposed:false,advanceInputTime(){drains++},
      get world(){throw marker},get captureCamera(){throw marker}}
    const args=name==='focus'?[{}, {animate:true}]:name==='cameraBookmark'?[0,true]:name==='zoom'?[true]:[]
    assert.throws(()=>entry(scene,...args),error=>error===marker)
    assert.equal(drains,1)
  })
}
