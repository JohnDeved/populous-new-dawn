import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import native from '../app/original-hud.json' with {type:'json'}
import {sha256, reviewedSpellHudFrames, checkServedSpellHud, readSpellHudSprite} from '../scripts/spell-hud-checker-contract.mjs'

const ids=[408,409,410,411,412,413,1056]
const digest=sha256('synthetic contract fixture; not original-pixel evidence')
function receipt(){
  const frames=ids.map(id=>({id,rect:structuredClone(native.rects[id]),rgbaSHA:sha256(String(id))}))
  return{status:'PASS_REVIEWED_SPELL_HUD_APPEND_PRESERVATION',base:'reviewed-six-frame-base',
    checkerSHA:digest,importerSHA:digest,oldPixelsSHA:digest,preservedPixelsSHA:digest,
    outputs:{'app/original-hud.json':digest,'public/original/hud.png':digest},
    inputSHA:Object.fromEntries(['data/hfx0-0.dat','data/pal0-c.dat'].map(key=>[key,native.sha256[key]])),
    oldDimensions:[1024,436],newDimensions:[1024,460],oldRectanglesChecked:1743,
    oldMetadataUnchangedExceptHeight:true,originalInputWrites:false,sourceOutputWritesByChecker:false,
    preservedReviewedFrames:frames.slice(0,6),newFrames:frames.slice(6)}
}

test('the consumer accepts the actual append producer status and both reviewed partitions',()=>{
  const report=receipt(),producer=readFileSync(new URL('../scripts/check-spell-hud-icons.py',import.meta.url),'utf8')
  assert.ok(producer.includes(`status='${report.status}'`),'Keep this contract tied to the producer')
  assert.deepEqual(reviewedSpellHudFrames(report,native).map(f=>f.id),ids)
  report.oldDimensions=[1024,410]
  report.newFrames=[...report.preservedReviewedFrames,...report.newFrames]
  report.preservedReviewedFrames=[]
  assert.deepEqual(reviewedSpellHudFrames(report,native).map(f=>f.id),ids)
})

for(const [label,mutate]of [
  ['obsolete status',r=>{r.status='PASS_SIX_FRAME_ORIGINALS_AND_PRESERVATION'}],
  ['arbitrary pass status',r=>{r.status='PASS'}],
  ['installed-check status',r=>{r.status='PASS_REVIEWED_ORIGINAL_HUD_FRAMES'}],
  ['missing preserved frame',r=>r.preservedReviewedFrames.pop()],
  ['duplicate preserved frame',r=>r.preservedReviewedFrames.push(r.preservedReviewedFrames[0])],
  ['unknown frame',r=>{r.newFrames[0].id=1057}],
  ['missing question mark',r=>{r.newFrames=[]}],
  ['invalid partition',r=>r.newFrames.push(r.preservedReviewedFrames.pop())],
  ['string ID',r=>{r.newFrames[0].id='1056'}],
  ['changed original input',r=>{r.inputSHA['data/hfx0-0.dat']=digest}],
  ['missing input',r=>{delete r.inputSHA['data/pal0-c.dat']}],
  ['unknown input',r=>{r.inputSHA.extra=digest}],
  ['changed preserved prefix',r=>{r.preservedPixelsSHA=sha256('different')}],
  ['malformed output hash',r=>{r.outputs['public/original/hud.png']='bad'}],
  ['malformed crop hash',r=>{r.newFrames[0].rgbaSHA='bad'}],
  ['metadata preservation failed',r=>{r.oldMetadataUnchangedExceptHeight=false}],
  ['input mutation',r=>{r.originalInputWrites=true}],
  ['output mutation',r=>{r.sourceOutputWritesByChecker=true}],
  ['invalid rectangle count',r=>{r.oldRectanglesChecked=0}],
  ['changed atlas width',r=>{r.newDimensions[0]++}],
  ['fractional dimensions',r=>{r.newDimensions[1]+=0.5}],
  ['string dimension',r=>{r.oldDimensions[1]='436'}],
  ['missing dimension',r=>r.newDimensions.pop()],
  ['historical atlas larger than current',r=>{r.newDimensions[1]=native.height+1}],
  ['append did not grow',r=>{r.oldDimensions[1]=460}],
  ['new frame overlaps historical atlas',r=>{r.oldDimensions[1]=438}],
  ['preserved frame outside historical atlas',r=>{r.oldDimensions[1]=435}],
  ['frame outside historical result',r=>{r.newDimensions[1]=459}],
  ['rectangle drift',r=>{r.newFrames[0].rect.x++}],
  ['fractional rectangle',r=>{r.newFrames[0].rect.w+=0.5}],
])test('append contract rejects '+label,()=>{
  const report=receipt();mutate(report)
  assert.throws(()=>reviewedSpellHudFrames(report,native))
})

test('a historical append report is separate from current served PNG identity',()=>{
  const report=receipt(),frames=reviewedSpellHudFrames(report,native)
  const current={width:native.width,height:native.height,pngSHA:sha256('current PNG')}
  assert.notEqual(current.pngSHA,report.outputs['public/original/hud.png'])
  assert.ok(current.height>report.newDimensions[1])
  const actual={...current,frames:frames.map(({id,rgbaSHA})=>({id,rgbaSHA}))}
  assert.doesNotThrow(()=>checkServedSpellHud(actual,current,frames))
  for(const mutate of [
    a=>{a.pngSHA=digest},a=>{a.width++},a=>{a.height=460},
    a=>{a.frames[0].rgbaSHA=digest},a=>a.frames.pop(),
    a=>a.frames.push(a.frames[0]),a=>{a.frames[0].id=1057},
  ]){
    const changed=structuredClone(actual);mutate(changed)
    assert.throws(()=>checkServedSpellHud(changed,current,frames))
  }
})

function spriteRead({x='0px',y='-437px',width='20px',height='23px'}={}){
  const sprite={style:{backgroundPositionX:x,backgroundPositionY:y,backgroundPosition:`${x} ${y}`,width,height},
    textContent:'',getBoundingClientRect:()=>({x:10,y:20,width:20,height:23})}
  const button={querySelectorAll:()=>[sprite],getBoundingClientRect:()=>({x:5,y:10,width:31,height:43}),
    style:{borderImageSource:'border'},getAttribute:name=>name==='aria-label'?'Undiscovered spell':null,disabled:false}
  // Match Playwright's isolated function serialization; no shared module globals.
  return vm.runInNewContext(`(${readSpellHudSprite})(button,{id:1056,rect})`,{
    button,rect:native.rects[1056],getComputedStyle:()=>({backgroundImage:'url("/original/hud.png")'}),
  })
}

test('sprite geometry accepts equivalent numeric pixel serialization including negative zero',()=>{
  for(const x of ['0px','-0px','0.0px','-0.0px']){
    const data=spriteRead({x,y:'-437.0px',width:'20.0px',height:'23.0px'})
    assert.equal(data.id,1056);assert.equal(data.logicalWidth,20);assert.equal(data.logicalHeight,23)
    assert.equal(data.text,'');assert.equal(data.buttonDisabled,false)
    assert.ok(data.image.includes('/original/hud.png'))
  }
})

for(const x of ['1px','-1px','0%','0','0pxjunk','NaNpx','Infinitypx',''])
  test('sprite geometry rejects mismatched pixel position '+JSON.stringify(x),()=>assert.throws(()=>spriteRead({x}),/Expected original icon geometry absent/))

test('sprite geometry does not round wrong coordinates or forgive non-pixel dimensions',()=>{
  assert.throws(()=>spriteRead({y:'-437.01px'}),/Expected original icon geometry absent/)
  assert.ok(Number.isNaN(spriteRead({width:'20%'}).logicalWidth))
  assert.ok(Number.isNaN(spriteRead({height:'23pxjunk'}).logicalHeight))
  assert.notEqual(spriteRead({width:'21px'}).logicalWidth,native.rects[1056].w)
})

test('the rendered checker uses both contracts and preserves fresh Bloodlust discovery scope',()=>{
  const source=readFileSync(new URL('../scripts/check-browser-spell-hud-icons.mjs',import.meta.url),'utf8')
  assert.ok(source.includes('reviewedSpellHudFrames(assetReport,native)'))
  assert.ok(source.includes('checkServedSpellHud(report.servedAtlas,currentAtlas,frames)'))
  assert.ok(source.includes('card.evaluate(readSpellHudSprite,{id,rect})'))
  assert.ok(source.includes("capture(question,1056,'undiscovered','bloodlust')"))
  assert.equal(source.includes('PASS_SIX_FRAME_ORIGINALS_AND_PRESERVATION'),false)
})
