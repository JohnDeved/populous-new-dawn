import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import ts from 'typescript'
import assets from '../app/original-frontend.json' with {type:'json'}
import native from '../decomp/research/frontend-quit-menu/static-data.json' with {type:'json'}
import {frontendQuitRows, frontendTextWidth, frontendBackground, frontendScale} from '../app/frontend-composition.ts'

const source=new Uint8Array(readFileSync(new URL('../public/original/frontend/composition.bin',import.meta.url)))
test('frontend Quit uses original menu1 labels, descriptors and callbacks, distinct from in-game Quit Game',()=>{
 assert.equal(native.exeSha256,'3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f')
 assert.equal(native.langSha256,'e826c478746d666a3ea9ea36cb7804d1d226d5f83084230987b1de293066cf7d')
 const menu=native.menus[1]
 assert.equal(menu.address,'005d9cb8');assert.equal(menu.list,'005d9ae0');assert.equal(menu.sentinel,'005d9b00')
 assert.equal(menu.record[3],'004c3800')
 assert.deepEqual(menu.entries.map(({type,descriptor,labelId,label,action})=>({type,descriptor,labelId,label,action})),[
  {type:2,descriptor:'005d7648',labelId:1212,label:'Quit?',action:undefined},
  {type:5,descriptor:'005d81c4',labelId:235,label:'Yes',action:'004c3610'},
  {type:4,descriptor:'005d7c18',labelId:236,label:'No',action:'00000000'},
  {type:5,descriptor:'005d7d78',labelId:328,label:'Back',action:'004c3970'},
 ])
 assert.equal(native.menus[19].entries[0].label,'Quit Game?')
 assert.deepEqual(frontendQuitRows.map(row=>row.text),menu.entries.map(row=>row.label))
})
test('production Quit row positions derive from the original fixed point descriptors',()=>{
 const expected=native.menus[1].entries.map(row=>({text:row.label,x:320,y:(parseInt(row.u32[row.type===2?2:5],16)*480)>>16}))
 assert.deepEqual(frontendQuitRows,expected)
 assert.deepEqual(frontendQuitRows.map(row=>row.y),[159,189,219,454])
 // State0/style2 question: paragraph flags1|8 select the Felo33we bank.
 assert.deepEqual(native.menus[1].entries[0].u32.slice(3,7),['00000001','00000001','00000002','00000000'])
 assert.equal(native.menus[1].entries[0].u32[10],'00000000','No post-render callback rewrites the question')
})
test('existing normal/highlight/low/shadow glyph advances preserve exact centering',()=>{
 const widths=[78,42,35,64]
 for(const [index,{text}] of frontendQuitRows.entries()) {
  assert.equal(frontendTextWidth(text),widths[index])
  for(const bank of ['feft33we','fehi33we','felo33we']) {
   assert.equal([...text].reduce((width,c)=>width+assets.banks[bank].rects[c.charCodeAt(0)-32].w,0),widths[index])
  }
  assert.equal([...text].reduce((width,c)=>width+assets.masks.fesd33we[c.charCodeAt(0)-32].w,0),widths[index])
 }
 assert.deepEqual(widths.map(width=>320-(width>>1)),[281,299,303,288])
})
test('Quit supplies all four native shadow rows without root-menu labels or browser guidance',()=>{
 const before=source.slice(),pointer={x:320,y:240}
 const rendered=frontendBackground(source,pointer,false,null,frontendQuitRows)
 assert.deepEqual(rendered,frontendBackground(source,pointer,false,null,[
  {text:'Quit?',x:320,y:159},{text:'Yes',x:320,y:189},{text:'No',x:320,y:219},{text:'Back',x:320,y:454},
 ]))
 assert.notDeepEqual(rendered,frontendBackground(source,pointer,true))
 assert.notDeepEqual(rendered,frontendBackground(source,pointer,false))
 for(let i=0;i<frontendQuitRows.length;i++) assert.notDeepEqual(rendered,frontendBackground(source,pointer,false,null,frontendQuitRows.filter((_,j)=>i!==j)))
 assert.notDeepEqual(rendered,frontendBackground(source,{x:100,y:100},false,null,frontendQuitRows))
 assert.deepEqual(source,before)
})
test('native coordinates fit the shared uniform composition including the bottom Back row',()=>{
 for(const [width,height] of [[640,480],[1280,960],[1920,1080],[3440,1440],[900,360]]) {
  const scale=frontendScale(width,height)
  for(const row of frontendQuitRows) assert.ok((row.y+26)*scale<=height)
  assert.ok(640*scale<=width)
 }
})

// Exercise the production keyboard callback, without mounting an invented menu.
// Actual native dialog cancellation/focus remains covered by the browser scenario.
test('frontend Escape prevents native dismissal and always reuses the existing back route',()=>{
 const parsed=ts.createSourceFile('original-main-menu.tsx',readFileSync(new URL('../app/original-main-menu.tsx',import.meta.url),'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX)
 let keyboard
 function visit(node) {
  if(ts.isJsxAttribute(node)&&node.name.getText(parsed)==='onKeyDown')keyboard=node.initializer.expression
  ts.forEachChild(node,visit)
 }
 visit(parsed);assert.ok(keyboard)
 const body=ts.transpileModule(`const callback = ${keyboard.getText(parsed)}; return callback;`,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText
 const make=new Function('pointerMode','draw','back','panel','dialog',body)
 for(const panel of ['main','quit','options']) {
  const pointerMode={current:true};let drawn=0,returned=0,prevented=0
  const callback=make(pointerMode,()=>drawn++,()=>returned++,panel,{current:null})
  callback({key:'Escape',preventDefault(){prevented++}})
  assert.equal(pointerMode.current,false);assert.equal(drawn,1);assert.equal(returned,1);assert.equal(prevented,1)
 }
})

test('browser Quit warning uses the prepared native font and retains truthful accessible guidance',()=>{
 const main=readFileSync(new URL('../app/original-main-menu.tsx',import.meta.url),'utf8')
 const css=readFileSync(new URL('../app/original-main-menu.module.css',import.meta.url),'utf8')
 const warning=main.slice(main.indexOf('<p id="frontend-quit-guidance"'),main.indexOf('</p>',main.indexOf('<p id="frontend-quit-guidance"')))
 assert.match(warning,/styles.visuallyHidden/)
 assert.match(warning.replace(/\s+/g,' '),/Yes is unavailable in this browser\. Close this browser tab to quit\. Unsaved progress will be lost\. Only checkpoints successfully saved to browser storage will remain after closing it\./)
 assert.match(warning,/<MenuText text=\{line\} highlighted=\{false\} low ready=\{questionReady\}/)
 assert.match(warning,/styles.warningLine\} aria-hidden="true"/)
 assert.match(main,/aria-labelledby="frontend-quit-question"\s+aria-describedby="frontend-quit-guidance"/)
 assert.match(main,/disabled=\{row.text === 'Yes'\}/)
 assert.match(main,/onClick=\{row.text === 'Yes' \? undefined : back\}/)
 assert.doesNotMatch(css.match(/\.quitGuidance\s*\{[^}]+\}/)[0],/sans-serif|font:/)
 const lines=[...warning.matchAll(/'([^']+)'/g)].map(match=>match[1])
 assert.deepEqual(lines,['Close this browser tab to quit.','Unsaved progress will be lost.'])
 for(const line of lines){
  const glyphs=[...line].map(c=>assets.banks.felo33we.rects[c.charCodeAt(0)-32])
  assert.ok(glyphs.every(Boolean));assert.ok(glyphs.every(glyph=>glyph.h<=30))
  const width=glyphs.reduce((sum,glyph)=>sum+glyph.w,0)
  assert.equal(width,frontendTextWidth(line));assert.ok(width<=600)
 }
})


test('Quit browser geometry normalizes against the fixed frame, not the expanded widescreen canvas',()=>{
 const scenario=readFileSync(new URL('../scripts/local-render/original-quit-menu.mjs',import.meta.url),'utf8')
 assert.match(scenario,/bounds=frame.getBoundingClientRect\(\),scale=bounds.width\/640/)
 assert.doesNotMatch(scenario,/bounds=canvas.getBoundingClientRect/)
})
