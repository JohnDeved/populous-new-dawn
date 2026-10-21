import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { inflateSync } from 'node:zlib'
import { campaignPopupLayout, fitCampaignPopup, popupGlyph, popupPanelTile, popupButtonTiles, popupTextWidth, wrapPopupText } from '../app/campaign-popup-layout.ts'
import { acknowledgeMessage, addMessage, createMessages, messageHasDelete, messageText, stepMessages } from '../app/messages.ts'
import { showCampaignPopup } from '../app/campaign-popup-session.ts'
import art from '../app/original-campaign-popup.json' with { type: 'json' }
import result from '../app/original-result-ui.json' with { type: 'json' }

const source = file => readFileSync(new URL(`../${file}`,import.meta.url),'utf8')
const sha = data => createHash('sha256').update(data).digest('hex')

test('native F00T3 advances, source wrap, quantized panel and both buttons have fixed golden geometry',()=>{
  const layout=campaignPopupLayout(messageText(641),544,480,3,['OK','Delete'])
  assert.equal(popupTextWidth('OK',3),24)
  assert.equal(popupGlyph('A',3).h,19)
  assert.equal(popupGlyph('A',4).h,10)
  assert.deepEqual(layout,{font:3,lines:[
    'Now we must face the Matak Tribe. I', 'sense many Warriors ready to stand',
    'against us. In my vision we are aided', 'by magic from a Stone Head. There', 'must be a way to reach it...'],
    wrapWidth:340,panelWidth:400,panelHeight:208,x:72,y:15,textX:30,textY:26,lineHeight:19,
    buttons:[{label:'OK',x:30,y:168,width:64,height:26,labelX:20,labelY:3},
      {label:'Delete',x:277,y:168,width:93,height:26,labelX:20,labelY:3}]})
  assert.equal(campaignPopupLayout(messageText(641),544,480,3).buttons[0].x,30,'Single OK is left-aligned, not centered')
})

test('Western wrapper preserves end spaces, punctuation and consumed overflowing glyph',()=>{
  assert.deepEqual(wrapPopupText('AB CD ',1000,3),['AB CD '])
  assert.deepEqual(wrapPopupText('AB CD',popupTextWidth('AB ',3),3),['AB','CD'])
  assert.deepEqual(wrapPopupText('AB-CD',popupTextWidth('AB-',3),3),['AB-','CD'])
  assert.deepEqual(wrapPopupText('ABCDEF',popupTextWidth('AB',3)+1,3),['ABC','DEF'])
  assert.equal(wrapPopupText('a'.repeat(600),100000,3)[0].length,511)
  assert.deepEqual(wrapPopupText('',340,3),[])
})

test('screen area font switch and browser fit retain all text and reachable native actions',()=>{
  assert.equal(fitCampaignPopup('Test',540,480,640).font,3)
  assert.equal(fitCampaignPopup('Test',828,360,900).font,3,'Font selection uses TOTAL screen area')
  assert.equal(fitCampaignPopup('Test',800,300,900).font,4)
  assert.equal(fitCampaignPopup('Test',1720,1080,1920,2).scale,2,'Existing HUD enlargement is preserved')
  assert.equal(fitCampaignPopup('Test',828,360,900,.72).scale,1,'No arbitrary font reduction in a fitting compact viewport')
  for(const [w,h,sw,scale]of [[544,480,640,1],[828,360,900,.72],[1720,1080,1920,2],[312,844,390,.6],[400,260,480,1]]){
    const layout=fitCampaignPopup(messageText(641),w,h,sw,scale,['OK','Delete'])
    assert.ok(layout.x>=0 && layout.y>=0)
    assert.ok(layout.x+layout.panelWidth*layout.scale<=w)
    assert.ok(layout.y+layout.panelHeight*layout.scale<=h)
    assert.ok(layout.lines.join(' ').includes('Matak Tribe.'))
    assert.equal(layout.buttons.length,2)
  }
})

test('tile atlas pixels match all thirteen independently retained result-panel source frame hashes',()=>{
  const png=readFileSync(new URL('../public/original/campaign-popup-tiles.png',import.meta.url))
  assert.equal(sha(png),art.provenance.panelPngSha256)
  let offset=8,width,height;const parts=[]
  while(offset<png.length){const length=png.readUInt32BE(offset),name=png.toString('ascii',offset+4,offset+8),data=png.subarray(offset+8,offset+8+length);if(name==='IHDR'){width=data.readUInt32BE(0);height=data.readUInt32BE(4)}if(name==='IDAT')parts.push(data);offset+=length+12}
  assert.deepEqual([width,height],[208,16])
  const raw=inflateSync(Buffer.concat(parts)),pixels=Buffer.alloc(width*height*4)
  for(let y=0;y<height;y++){assert.equal(raw[y*(width*4+1)],0);raw.copy(pixels,y*width*4,y*(width*4+1)+1,(y+1)*(width*4+1))}
  assert.equal(sha(pixels),art.provenance.panelRgbaSha256)
  for(let tile=1450;tile<=1462;tile++){
    const frame=Buffer.alloc(16*16*4)
    for(let y=0;y<16;y++)pixels.copy(frame,y*64,(y*208+(tile-1450)*16)*4,(y*208+(tile-1450)*16+16)*4)
    assert.equal(sha(frame),result.provenance.panelFrames[tile].rgbaSha256)
    assert.equal(sha(frame),art.rects[tile].rgbaSha256)
  }
  for(const columns of [24,25]){
    assert.equal(popupPanelTile(0,0,columns,10),1450)
    assert.equal(popupPanelTile(columns-1,9,columns,10),1453)
    assert.equal(popupPanelTile(1,0,columns,10),1454)
    assert.equal(popupPanelTile(2,0,columns,10),1455)
    assert.equal(popupPanelTile(0,1,columns,10),columns===24?1458:1459)
    assert.equal(popupPanelTile(columns-1,1,columns,10),columns===24?1460:1461)
  }
})

test('OK retains an ordinary notification; Delete and authored one-shot OK remove only their slot',()=>{
  const state=createMessages()
  addMessage(state,641,()=>0);addMessage(state,644,()=>0)
  const initial=structuredClone(state)
  assert.equal(messageHasDelete(state.slots[0]),true)
  acknowledgeMessage(state,0)
  assert.deepEqual(state,initial)
  acknowledgeMessage(state,0,true)
  assert.equal(state.slots[0],null)
  assert.deepEqual(state.slots[1],initial.slots[1])
  assert.equal(state.nextSerial,initial.nextSerial)
  state.slots[1].flags|=0x200
  assert.equal(messageHasDelete(state.slots[1]),false)
  acknowledgeMessage(state,1)
  assert.equal(state.slots[1],null)
  acknowledgeMessage(state,1)
  assert.equal(state.nextSerial,2)
})

test('type1 keeps its sole OK action and the pending notification queue remains one-at-a-time',()=>{
  const state=createMessages()
  addMessage(state,641,()=>0,480,1)
  assert.equal(messageHasDelete(state.slots[0]),false)
  acknowledgeMessage(state,0,true)
  assert.ok(state.slots[0])
  addMessage(state,644,()=>0)
  for(const message of state.slots.filter(Boolean)){message.flags|=0x20000;message.position=0x10000;message.speed=1}
  const before=structuredClone(state),snapshot=structuredClone(state)
  stepMessages(snapshot)
  assert.equal(snapshot.slots.filter(message=>message&&!(message.flags&0x20000)).length,1)
  assert.deepEqual(state,before,'Advancing a restored clone preserves the saved message state')
})

test('live page replaces only popup body, retains authored content/focus and owns native acknowledgment',()=>{
  const page=source('app/page.tsx'),css=source('app/globals.css'),component=source('app/original-campaign-popup.tsx')
  assert.match(page,/<OriginalCampaignPopup/)
  assert.match(page,/text=\{messageText\(message!\.stringId\)\}/)
  assert.match(page,/acknowledgeMessage\(world\.messages, slot\)/)
  assert.match(page,/acknowledgeMessage\(world\.messages, slot, true\)/)
  assert.match(page,/showCampaignPopup\(details, messageDetails\.current\.values\(\)\)/)
  assert.match(page,/if \(target\) engine\.current\?\.focus/)
  assert.doesNotMatch(css,/\.campaign-messages details>div\{/)
  assert.doesNotMatch(component,/tooltip-border|×|text-shadow|Story|Hint/)
  assert.equal(art.buttonUrls.hover,'/original/hud-button-selected.png')
  assert.equal(art.buttonUrls.pressed,'/original/hud-button-hover.png')
})


test('small native buttons retain full eight-pixel corners and bottom-over-top painter order',()=>{
  const tiles=popupButtonTiles(38,13)
  assert.deepEqual(tiles.slice(-4),[
    {x:0,y:0,w:8,h:8,sx:0,sy:0}, {x:30,y:0,w:8,h:8,sx:16,sy:0},
    {x:0,y:5,w:8,h:8,sx:0,sy:16}, {x:30,y:5,w:8,h:8,sx:16,sy:16},
  ])
  assert.equal(tiles.some(tile=>tile.sy===8),false,'No vertical strips or negative-height center are painted')
  assert.ok(tiles.slice(0,3).every(tile=>tile.y===0))
  assert.ok(tiles.slice(3,6).every(tile=>tile.y===5))
  assert.ok(popupButtonTiles(64,26).some(tile=>tile.sx===8 && tile.sy===8))
})


test('single native controller replaces bodies without acknowledgment, queue or pause mutation',()=>{
  const state=createMessages();addMessage(state,641,()=>0);addMessage(state,644,()=>0)
  const first={open:false},second={open:false},peers=[first,second]
  const paused={paused:true},before=structuredClone(state)
  showCampaignPopup(first,peers);assert.deepEqual(peers,[{open:true},{open:false}])
  showCampaignPopup(second,peers);assert.deepEqual(peers,[{open:false},{open:true}])
  showCampaignPopup(first,peers);assert.deepEqual(peers,[{open:true},{open:false}])
  assert.deepEqual(state,before)
  state.slots[1].flags|=0x200
  const oneShot=structuredClone(state)
  showCampaignPopup(second,peers);showCampaignPopup(first,peers)
  assert.deepEqual(state,oneShot,'Replacing a one-shot is not acknowledging it')
  assert.equal(paused.paused,true)
  acknowledgeMessage(state,1);assert.equal(state.slots[1],null)
  assert.deepEqual(state.slots[0],oneShot.slots[0])
})
