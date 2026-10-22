import test from 'node:test'
import assert from 'node:assert/strict'
import ts from 'typescript'
import { homePopupSources, homePopupFixture } from '../scripts/campaign-popup-fixture/home-source.mjs'
import { createMessages, addMessage, acknowledgeMessage, messageHasDelete, messageIcon, messageText, messageViewPoint } from '../app/messages.ts'
import { captureCampaignPopupKeys, showCampaignPopup } from '../app/campaign-popup-session.ts'
import { spellTestShortcut } from '../app/spell-test-cheats.ts'
import { pageEffect, pageNode, pageSource, evaluatePage } from './support/follower-nearby-page.mjs'

// Real Home effects + JSX callbacks, with a supplied document and scene boundary.
// Browser propagation/default activation is checked separately in the rendered fixture.
function fixture() {
  const listeners=new Map(), calls={overview:0,skip:0,focus:0,cancel:0}, world={messages:createMessages(),paused:true,inputMask:0,flyby:{flags:0},outcome:{level:2},units:[],selected:[]}
  addMessage(world.messages,641,()=>0);world.messages.slots[0].flags|=2
  class Element { closest(){return null} }
  const outside=new Element(), document={activeElement:outside,addEventListener(type,fn,capture){assert.equal(capture,true);listeners.set(type,fn)},removeEventListener(type){listeners.delete(type)}}
  const summary={focus(){document.activeElement=summary}}, view={focus(){document.activeElement=view}}, details={open:false,querySelector(selector){return selector==='summary'?summary: {click:()=>popup.props.onAcknowledge()}}}
  const engine={current:{keys:new Set(['arrowup','shift']),focus(){calls.focus++},overview(){calls.overview++},skipIntroduction(){calls.skip++}}},messageDetails={current:new Map([[0,details]])}
  const bindings={document,world,engine,messageDetails,store:{change:fn=>fn(world),getWorld:()=>world},ready:true,menu:false,cheatsOpen:false,selectorOpen:false,statisticsVisible:false,update(){},showCampaignPopup,captureCampaignPopupKeys,acknowledgeMessage,messageHasDelete,messageIcon,messageText,messageViewPoint,viewport:{current:view},OriginalCampaignPopup:'OriginalCampaignPopup',OriginalMessageTab:'OriginalMessageTab',messageViewportHeight:480,messageScreenY:()=>300}
  const aside=pageNode(n=>ts.isJsxElement(n)&&n.openingElement.attributes.properties.some(p=>p.name?.getText(pageSource)==='className'&&p.initializer?.text==='campaign-messages'))
  const rendered=evaluatePage(aside.getText(pageSource),bindings),element=rendered.children[0][0],popup=element.children[1]
  let game
  pageEffect("globalThis.addEventListener('keydown', key)",{...bindings,globalThis:{addEventListener(_,fn){game=fn}},openMenu(){calls.cancel++},SPELLS:[],tutorialLevel:79,cancelInteraction(){calls.cancel++},guardShaman(){calls.cancel++},select(){calls.cancel++},setTab(){calls.cancel++},rotateBuildingPlan(){return false},audio:{current:null}})()
  const close=pageEffect('return captureCampaignPopupKeys',bindings)()
  const auto=()=>pageEffect('const opened: number[]',bindings)()
  let sceneUp;evaluatePage(homePopupSources(new URL('..',import.meta.url).pathname).sceneUp,{window:{},scene:{keys:engine.current.keys,listen(_target,_type,fn){sceneUp=fn}}})
  const key=(key,type='keydown',repeat=false,modifiers={})=>{let stopped=false,prevented=false;const event={key,code:key===' '?'Space':key,type,repeat,target:outside,...modifiers,preventDefault(){prevented=true},stopImmediatePropagation(){stopped=true}};listeners.get(type)?.(event);if(!stopped&&type==='keydown')game(event);if(!stopped&&type==='keyup')sceneUp(event);return {stopped,prevented}}
  return {auto,key,close,world,calls,document,outside,details,engine,popup,summary,view,Element,element}
}

test('actual Home auto-open captures Enter/Space/Escape and scene keys from outside focus before gameplay',()=>{
  const f=fixture(),old=globalThis.Element;globalThis.Element=f.Element
  try {
    f.auto();assert.equal(f.details.open,true);assert.equal(f.document.activeElement,f.outside);assert.deepEqual([...f.engine.current.keys],[])
    const before=structuredClone(f.world)
    for(const key of [' ','Escape','ArrowUp','Shift','z','h','g','f','b','1']){
      assert.deepEqual(f.key(key),{stopped:true,prevented:true});assert.deepEqual(f.key(key,'keyup'),{stopped:true,prevented:true})
      assert.deepEqual(f.world,before);assert.deepEqual(f.calls,{overview:0,skip:0,focus:0,cancel:0})
    }
    assert.deepEqual(f.key('Enter'),{stopped:true,prevented:true});assert.equal(f.details.open,false)
    f.key('Enter','keydown',true);f.key('Enter','keyup')
    assert.deepEqual(f.world,before,'Ordinary ACK retains the notification and prior pause')
    assert.equal(f.document.activeElement,f.summary);assert.equal(f.calls.overview,0)
    f.close();assert.equal(f.key('Enter').stopped,false);assert.equal(f.calls.overview,1,'Closed popup restores ordinary gameplay ownership')
  } finally {globalThis.Element=old}
})

test('actual Home popup ownership precedes flyby mask and one-shot ACK returns focus safely',()=>{
  const f=fixture(),old=globalThis.Element;globalThis.Element=f.Element
  try {
    f.world.inputMask=1;f.world.flyby.flags=1;f.world.messages.slots[0].flags|=0x200;f.auto()
    f.key(' ');f.key(' ','keyup');f.key('Escape');f.key('Escape','keyup');assert.equal(f.calls.skip,0)
    f.key('Enter');f.key('Enter','keyup');assert.equal(f.world.messages.slots[0],null);assert.equal(f.document.activeElement,f.view);assert.equal(f.world.paused,true)
  } finally {f.close();globalThis.Element=old}
})

test('actual Home manual reopen clears held keys, focuses a positioned record once, and preserves close semantics',()=>{
  const f=fixture();f.world.messages.slots[0].view={cell:0x60cc,payload:308}
  // Render again so the real summary callback reads the updated record.
  const summary=f.element.children[0],event={preventDefault(){},currentTarget:{parentElement:f.details}}
  summary.props.onClick(event);assert.equal(f.details.open,true);assert.equal(f.calls.focus,1);assert.deepEqual([...f.engine.current.keys],[])
  summary.props.onClick(event);assert.equal(f.details.open,false);assert.equal(f.calls.focus,1)
  f.close()
})


test('actual scene keyup cannot retain modifiers from exempt Tab/F8/F9 releases',()=>{
  const f=fixture(),old=globalThis.Element;globalThis.Element=f.Element
  try {
    f.auto()
    for(const [modifier,flag] of [['Shift','shiftKey'],['Control','ctrlKey']])for(const exempt of ['Tab','F8','F9']){
      f.key(modifier,'keydown',false,{[flag]:true})
      assert.equal(f.key(exempt,'keydown',false,{[flag]:true}).prevented,false,'Browser Tab and exempt diagnostic keydown default is preserved')
      assert.deepEqual(f.key(exempt,'keyup',false,{[flag]:true}),{stopped:true,prevented:false},'Release cannot reach the actual scene modifier sampler')
      f.key(modifier,'keyup')
      assert.deepEqual([...f.engine.current.keys],[])
    }
    f.key('Enter');f.key('Enter','keyup');assert.equal(f.details.open,false);assert.deepEqual([...f.engine.current.keys],[])
  } finally {f.close();globalThis.Element=old}
})


test('popup source extraction binds the F9 spell-test effect, never the F8 debug-picker effect', () => {
  const root = new URL('..', import.meta.url).pathname, sources = homePopupSources(root)
  assert.match(sources.gameplay, /globalThis\.addEventListener\('keydown', key\)/)
  assert.match(sources.cheat, /spellTestShortcut\(event, cheatsOpen\)/)
  assert.doesNotMatch(sources.cheat, /setDebugPicker|startupLogoDone/)
  assert.match(homePopupFixture(root), /statisticsVisible=false/)
  let handler, open = false, cancellations = 0, prevented = 0, stopped = 0
  const dispose = evaluatePage(sources.cheat, {
    useEffect: callback => callback(), ready: true, startup: 'playing', menu: false,
    selectorOpen: false, world: { status: 'playing' }, cheatsOpen: false, spellTestShortcut,
    cancelNearbyInput() { cancellations++ }, setCheatsOpen(change) { open = change(open) },
    globalThis: {
      addEventListener(type, listener, capture) {
        assert.equal(type, 'keydown'); assert.equal(capture, true); handler = listener
      },
      removeEventListener(type, listener, capture) {
        assert.equal(type, 'keydown'); assert.equal(capture, true); assert.equal(listener, handler)
      },
    },
  })
  const key = key => handler({ key, repeat: false, target: { closest: () => null },
    preventDefault() { prevented++ }, stopImmediatePropagation() { stopped++ } })
  try {
    key('F8')
    assert.deepEqual([open, cancellations, prevented, stopped], [false, 0, 0, 0])
    key('F9')
    assert.deepEqual([open, cancellations, prevented, stopped], [true, 1, 1, 1])
  } finally { dispose() }
})
