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
import ts from 'typescript'
import { pageSource, pageNode, evaluatePage } from './support/follower-nearby-page.mjs'

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

test('consumed native punctuation retains its exact lines and coordinates in an accurately sized DOM text box',()=>{
  // Hosted dbb9 M2 at1440x1000: battlefield1240px, preference2,
  // native logical viewport620x500. A consumed period exceeds wrap388.
  const native=campaignPopupLayout(messageText(641),620,500,3,['OK','Delete'])
  assert.deepEqual(native,{font:3,lines:[
    'Now we must face the Matak Tribe. I sense',
    'many Warriors ready to stand against us.',
    'In my vision we are aided by magic from',
    'a Stone Head. There must be a way to',
    'reach it...'],
    wrapWidth:388,panelWidth:448,panelHeight:208,x:86,y:15,textX:30,textY:26,lineHeight:19,
    buttons:[{label:'OK',x:30,y:168,width:64,height:26,labelX:20,labelY:3},
      {label:'Delete',x:325,y:168,width:93,height:26,labelX:20,labelY:3}]})
  assert.deepEqual(native.lines.map(line=>popupTextWidth(line,3)),[385,391,371,347,84])
  const layout=fitCampaignPopup(messageText(641),1240,1000,1440,2,['OK','Delete'])
  assert.deepEqual(layout,{...native,textWidth:391,scale:2,x:172,y:31})
  const panelLeft=200+layout.x,textLeft=panelLeft+layout.textX*layout.scale
  assert.equal(textLeft,432)
  assert.equal(textLeft+layout.wrapWidth*layout.scale,1208,'Original wrap budget remains unchanged')
  assert.equal(textLeft+layout.textWidth*layout.scale,1214,'DOM extent includes the already drawn final period')
  assert.equal(panelLeft+layout.panelWidth*layout.scale,1268,'No panel enlargement or pixel movement')
  assert.equal(popupTextWidth(native.lines[1].slice(0,-1),3),387,'The period starts at the original advance')
  assert.ok(layout.textX+layout.textWidth<layout.panelWidth,'Complete native glyph boxes remain inside panel')
  const component=source('app/original-campaign-popup.tsx'),css=source('app/original-campaign-popup.module.css')
  assert.match(component,/width: failed \? layout\.wrapWidth : layout\.textWidth/,'Plain text failure recovery keeps its existing wrap width')
  assert.match(css,/\.text, \.fallback \{ position: absolute; padding: 0; margin: 0; \}/)
  assert.match(css,/\.textLine \{ display: block; white-space: nowrap; \}/)
  assert.match(css,/\.line \{ display: inline-flex; vertical-align: top; align-items: flex-start; \}/)
  assert.match(css,/\.glyph \{ display: block; flex: none;/)
  assert.match(css,/\.panel \.ok \{ position: absolute;/,'Controls cannot reflow with the text box')
  assert.match(component,/left: button\.x, top: button\.y, width: button\.width, height: button\.height/)
})

test('native wrapper and exact period atlas ink explain overflow without clipping or a font-bearing exemption',()=>{
  assert.equal(sha(source('decomp/generated/0045ec10.c')),'b8e52f8ae04168e0a0ea8e965ed5bf1ca94672125c4fdf13b391c8ba08c7085c')
  assert.equal(sha(source('decomp/research/campaign-popup-presentation/body-renderer.asm')),'7dde157edf500754b1dcf5efe5d7decf05accf7e38baddf870c5c9415082ac5e')
  assert.equal(sha(source('decomp/research/campaign-popup-presentation/font-direct-cpu.asm')),'50686387d9d3e8bf375268711b1d1a2419a10411b6f24f40d2cfd47be46cf3b7')
  const png=readFileSync(new URL('../public/original/result-font.png',import.meta.url))
  assert.equal(sha(png),'46d35c177850244ed211c0556af98694bb428835e7708a79f3acee16828e0676')
  let offset=8,width,height;const parts=[]
  while(offset<png.length){
    const length=png.readUInt32BE(offset),name=png.toString('ascii',offset+4,offset+8),data=png.subarray(offset+8,offset+8+length)
    if(name==='IHDR'){width=data.readUInt32BE(0);height=data.readUInt32BE(4);assert.deepEqual([...data.subarray(8)],[8,6,0,0,0])}
    if(name==='IDAT')parts.push(data)
    offset+=length+12
  }
  assert.deepEqual([width,height],[304,294])
  const raw=inflateSync(Buffer.concat(parts)),glyph=popupGlyph('.',3),pixels=Buffer.alloc(glyph.w*glyph.h*4)
  assert.deepEqual([glyph.x,glyph.y,glyph.w,glyph.h,glyph.advance],[266,0,4,19,4])
  for(let y=0;y<glyph.h;y++){
    const row=(glyph.y+y)*(width*4+1)
    assert.equal(raw[row],0,'Retained importer PNG uses unfiltered RGBA rows')
    raw.copy(pixels,y*glyph.w*4,row+1+glyph.x*4,row+1+(glyph.x+glyph.w)*4)
  }
  assert.equal(sha(pixels),'dcabd5010f052b3a31be5fb4b7fb79f607eb43eb0a5238b1351134d87eec0dd7')
  const ink=[]
  for(let y=0;y<glyph.h;y++)for(let x=0;x<glyph.w;x++)if(pixels[(y*glyph.w+x)*4+3])ink.push([x,y])
  assert.deepEqual(ink,[[1,13],[2,13],[1,14],[2,14],[3,14],[2,15],[3,15]])
  assert.deepEqual([Math.min(...ink.map(([x])=>x)),Math.max(...ink.map(([x])=>x))+1],[1,4])
  // Last glyph starts at387; source ink reaches391, not transparent padding.
  assert.equal(387+4,391)
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
    assert.ok(layout.textWidth>=layout.wrapWidth)
    assert.ok(layout.lines.every(line=>popupTextWidth(line,layout.font)<=layout.textWidth))
    assert.ok(layout.textX+layout.textWidth<=layout.panelWidth,'Content extent does not authorize panel escape')
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
  const page=source('app/page.tsx'),css=source('app/globals.css'),component=source('app/original-campaign-popup.tsx'),popupCss=source('app/original-campaign-popup.module.css')
  assert.match(popupCss,/\.text, \.fallback \{ position: absolute;/)
  assert.doesNotMatch(popupCss,/\.text, \.panel/)
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

// Compose the actual Home style initializer with the complete shipped HUD frame
// owner. Rendering boundaries are inert doubles; CSS cancellation is asserted as
// arithmetic, not presented as a browser layout or native-pixel measurement.
function popupMotionFixture(height) {
  const screen = pageNode(node => ts.isVariableDeclaration(node) && node.name.getText(pageSource) === 'messageScreenY'),
    screenY = evaluatePage(screen.initializer.getText(pageSource), {}),
    details = pageNode(node => ts.isJsxElement(node) && node.openingElement.tagName.getText(pageSource) === 'details' &&
      node.openingElement.attributes.properties.some(attribute => attribute.name?.getText(pageSource) === 'data-message-serial')),
    styleExpression = details.openingElement.attributes.properties.find(attribute => attribute.name?.getText(pageSource) === 'style').initializer.expression,
    messages = createMessages()
  addMessage(messages, 641, () => 0)
  addMessage(messages, 644, () => 0)
  messages.slots[0].position = 0x2000
  messages.slots[1].position = 0x9000
  const makeStyle = initial => ({ ...initial,
    setProperty(name, value) { this[name] = value },
    getPropertyValue(name) { return this[name] ?? '' },
  })
  const elements = messages.slots.filter(Boolean).map((message, index) => ({
    dataset: { messageSerial: String(message.serial) }, open: index === 0,
    style: makeStyle(evaluatePage(styleExpression.getText(pageSource), {
      top: screenY(message.position, height), height: screenY(message.height, height),
    })),
    attributes: new Set(),
    setAttribute(name) { this.attributes.add(name) },
    removeAttribute(name) { this.attributes.delete(name) },
  }))
  const stale = { ...elements[1], dataset: { messageSerial: '999' },
    style: makeStyle({ top: '19px', '--message-top': '19px' }), attributes: new Set() }
  const shell = {
    style: makeStyle({}),
    querySelectorAll(selector) {
      assert.equal(selector, '.campaign-messages details[data-message-serial]')
      return [...elements, stale]
    },
  }
  const hud = ts.createSourceFile('scene-hud-runtime.ts', source('app/scene-hud-runtime.ts'), ts.ScriptTarget.Latest, true),
    names = ['messageScreenY', 'syncCampaignMessagePresentation', 'updateHudFrame'],
    bodies = names.map(name => {
      const declarations = hud.statements.filter(node => ts.isFunctionDeclaration(node) && node.name?.text === name)
      assert.equal(declarations.length, 1, `one actual ${name} owner`)
      return declarations[0].getText(hud).replace(/^export\s+/, '')
    }).join('\n'),
    noop = () => {},
    calls = { publications: 0, minimap: 0, worship: 0 },
    updateHud = evaluatePage(`function(){${bodies}; return updateHudFrame}`, {
      window: { innerHeight: height }, publishTooltipStatus: noop,
      texture: () => ({ image: {} }), populationMeter: () => ({ color: 0 }),
      nativeHud: { colors: ['black'] }, nativeUnits: { atlas: 'unused' },
      drawPortrait: noop, portraitBackground: noop, isShaman: () => false, maxHp: () => 1,
      requestAnimationFrame: () => assert.fail('message synchronization must not create another RAF'),
    })(),
    scene = {
      world: { messages, units: [] }, container: { parentElement: shell },
      unitMeshes: new Map(), portrait: { parentElement: null },
      gameClock: { animationFrame: 0 }, view: { config: {} },
      objectPanels: { update: noop }, worshipPresentation: { draw: () => calls.worship++ },
      drawPointer: noop, renderBuildingPanels: noop, drawMinimap: () => calls.minimap++,
      onChange: () => calls.publications++, uiTimer: 0, disposed: false,
    }
  return { messages, elements, stale, calls, scene, screenY,
    frame: (dt = 1 / 60) => updateHud(scene, 0, dt) }
}

test('actual HUD frame keeps moving open and closed notification offsets paired before React publication', () => {
  const css = source('app/original-campaign-popup.module.css')
  assert.match(css, /\.viewport\s*\{[^}]*position:\s*absolute;[^}]*top:\s*calc\(-1 \* var\(--message-top, 0px\)\)/)
  for (const height of [360, 480, 1000]) {
    const f = popupMotionFixture(height),
      layouts = f.messages.slots.filter(Boolean).map(message =>
        fitCampaignPopup(messageText(message.stringId), 540, height, 640, 1, ['OK', 'Delete']))
    for (const [first, second] of [[0x3000, 0x8000], [0xe000, 0x1000], [-0x0800, 0xa000], [0x4000, 0x7000]]) {
      f.messages.slots[0].position = first
      f.messages.slots[1].position = second
      const before = structuredClone(f.messages)
      f.frame()
      for (const [index, element] of f.elements.entries()) {
        const expectedTop = f.screenY(f.messages.slots[index].position, height),
          layout = layouts[index],
          compensation = Number.parseFloat(element.style.getPropertyValue('--message-top'))
        assert.equal(element.style.top, `${expectedTop}px`)
        assert.equal(compensation, expectedTop, 'popup compensation follows the same frame sample, without React')
        assert.equal(Number.parseFloat(element.style.top) - compensation + layout.y, layout.y,
          'viewport-relative panel origin stays fixed under the shipped CSS cancellation')
        for (const button of layout.buttons)
          assert.equal(Number.parseFloat(element.style.top) - compensation + layout.y + button.y * layout.scale,
            layout.y + button.y * layout.scale, 'action offsets do not inherit strip motion')
        assert.equal(element.attributes.has('data-lower'), expectedTop > Math.trunc(height / 2),
          'legacy lower-half marker retains its existing threshold')
      }
      assert.deepEqual(f.messages, before, 'HUD synchronization cannot mutate queue, motion, flags or lifetime')
      assert.deepEqual(f.elements.map(element => element.open), [true, false], 'never change popup ownership')
      assert.equal(f.stale.style.top, '19px', 'an unmatched mounted serial is not assigned another message')
      assert.equal(f.stale.style.getPropertyValue('--message-top'), '19px')
      assert.equal(f.calls.publications, 0, 'do not fix compensation by publishing React every frame')
    }
    assert.deepEqual([f.calls.minimap, f.calls.worship], [4, 4], 'retain the remaining frame work')
    f.frame(0.2)
    assert.equal(f.calls.publications, 1, 'existing slower publisher still fires at its threshold')
    assert.equal(f.scene.uiTimer, 0)
    f.frame()
    assert.equal(f.calls.publications, 1, 'no additional notification-driven publication')
  }
})

test('actual message rebound keeps the open popup compensated without changing its pending-open signal', () => {
  const f = popupMotionFixture(480), message = f.messages.slots[0]
  // Supplied rebound boundary, not a natural campaign/browser acquisition claim.
  message.position = 0xf000
  message.speed = 0x3000
  message.flags |= 0x20000
  const positions = [message.position]
  for (let frame = 0; frame < 3; frame++) {
    stepMessages(f.messages)
    positions.push(message.position)
    const before = structuredClone(f.messages)
    f.frame()
    const top = f.elements[0].style.top
    assert.equal(f.elements[0].style.getPropertyValue('--message-top'), top)
    assert.deepEqual(f.messages, before, 'presentation writer preserves the actual motion owner result')
    assert.equal(f.elements[0].open, true)
    assert.equal(f.calls.publications, 0)
  }
  assert.ok(positions[1] > positions[0], 'first presentation reaches its lower collision')
  assert.ok(positions[2] < positions[1], 'the following presentation rebounds upward')
  assert.equal(message.flags & 0x20000, 0, 'native pending-open consumption remains owned by stepMessages')
  assert.equal(message.flags & 2, 2, 'HUD binding must not acknowledge or clear the draw signal')
})
