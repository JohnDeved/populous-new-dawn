// Contract shared by the rendered spell HUD checker and its source-only tests.
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'

export const sha256=bytes=>createHash('sha256').update(bytes).digest('hex')
const ids=[408,409,410,411,412,413,1056]
const hash=value=>assert.match(value,/^[a-f0-9]{64}$/,'Expected SHA-256')
const dimensions=value=>{
  assert.ok(Array.isArray(value)&&value.length===2&&value.every(n=>Number.isSafeInteger(n)&&n>0),'Invalid atlas dimensions')
}

export function reviewedSpellHudFrames(report,native){
  assert.equal(report.status,'PASS_REVIEWED_SPELL_HUD_APPEND_PRESERVATION','Expected reviewed append producer status')
  assert.ok(typeof report.base==='string'&&report.base.length>0,'Missing append base')
  for(const value of [report.checkerSHA,report.importerSHA,report.oldPixelsSHA,report.preservedPixelsSHA])hash(value)
  assert.equal(report.oldPixelsSHA,report.preservedPixelsSHA,'Historical atlas prefix changed')
  assert.equal(report.oldMetadataUnchangedExceptHeight,true)
  assert.equal(report.originalInputWrites,false)
  assert.equal(report.sourceOutputWritesByChecker,false)
  assert.ok(Number.isSafeInteger(report.oldRectanglesChecked)&&report.oldRectanglesChecked>0)
  // These are historical output fingerprints, never current whole-atlas identity.
  for(const path of ['app/original-hud.json','public/original/hud.png'])hash(report.outputs?.[path])
  const inputs=['data/hfx0-0.dat','data/pal0-c.dat']
  assert.deepEqual(Object.keys(report.inputSHA).sort(),inputs)
  for(const input of inputs){hash(report.inputSHA[input]);assert.equal(report.inputSHA[input],native.sha256[input],'Original input identity: '+input)}
  dimensions(report.oldDimensions);dimensions(report.newDimensions);dimensions([native.width,native.height])
  const [oldWidth,oldHeight]=report.oldDimensions,[width,height]=report.newDimensions
  assert.equal(oldWidth,width,'Append changed atlas width')
  assert.ok(oldHeight<height,'Append must grow atlas height')
  assert.equal(width,native.width,'Current atlas width differs')
  assert.ok(height<=native.height,'Current atlas is smaller than historical append')
  assert.ok(Array.isArray(report.newFrames)&&Array.isArray(report.preservedReviewedFrames),'Missing reviewed-frame partition')
  const preserved=report.preservedReviewedFrames.map(f=>f.id).sort((a,b)=>a-b)
  assert.deepEqual(preserved,preserved.length?ids.slice(0,6):[],'Unsupported preserved-frame partition')
  assert.deepEqual(report.newFrames.map(f=>f.id).sort((a,b)=>a-b),preserved.length?[1056]:ids,'Unsupported new-frame partition')
  const frames=[...report.preservedReviewedFrames,...report.newFrames].sort((a,b)=>a.id-b.id)
  for(const frame of frames){
    const {id,rect,rgbaSHA}=frame
    hash(rgbaSHA)
    assert.ok(rect&&['x','y','w','h'].every(k=>Number.isSafeInteger(rect[k])),'Invalid frame rectangle')
    assert.ok(rect.x>=0&&rect.y>=0&&rect.w>0&&rect.h>0&&rect.x+rect.w<=width&&rect.y+rect.h<=height,'Frame outside historical atlas')
    assert.deepEqual(rect,native.rects[id],'Current original rectangle differs: '+id)
    if(preserved.includes(id))assert.ok(rect.y+rect.h<=oldHeight,'Preserved frame outside old atlas')
    else assert.ok(rect.y>oldHeight,'New frame overlaps old atlas')
  }
  return frames
}

export function checkServedSpellHud(actual,current,frames){
  assert.equal(actual.pngSHA,current.pngSHA,'Served current PNG SHA-256')
  assert.deepEqual([actual.width,actual.height],[current.width,current.height],'Served current atlas dimensions')
  assert.deepEqual(actual.frames.map(f=>f.id).sort((a,b)=>a-b),frames.map(f=>f.id),'Served frame inventory')
  for(const frame of frames)
    assert.equal(actual.frames.find(f=>f.id===frame.id).rgbaSHA,frame.rgbaSHA,'Served original RGBA '+frame.id)
}

// Self-contained for Playwright serialization. CSS may serialize -0px as 0px;
// compare exact numeric pixels without allowing percentages, junk or rounding.
export function readSpellHudSprite(button,{id,rect}){
  const pixels=value=>/^-?(?:\d+(?:\.\d+)?|\.\d+)px$/.test(value)?Number(value.slice(0,-2)):NaN
  const sprites=[...button.querySelectorAll('i.hud-sprite')]
  const sprite=sprites.find(n=>pixels(n.style.backgroundPositionX)===-rect.x&&pixels(n.style.backgroundPositionY)===-rect.y)
  if(!sprite)throw Error('Expected original icon geometry absent: '+JSON.stringify({id,rect,positions:sprites.map(n=>n.style.backgroundPosition)}))
  const css=getComputedStyle(sprite),r=sprite.getBoundingClientRect(),b=button.getBoundingClientRect()
  return{id,position:sprite.style.backgroundPosition,image:css.backgroundImage,text:sprite.textContent,
    logicalWidth:pixels(sprite.style.width),logicalHeight:pixels(sprite.style.height),box:{x:r.x,y:r.y,width:r.width,height:r.height},
    buttonBox:{x:b.x,y:b.y,width:b.width,height:b.height},border:button.style.borderImageSource,
    selected:button.getAttribute('aria-pressed'),buttonDisabled:button.disabled,label:button.getAttribute('aria-label')}
}
