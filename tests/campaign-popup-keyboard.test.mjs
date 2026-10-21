import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { createFlyby, flybyCommand, interruptFlyby } from '../app/flyby.ts'
import { pressWorldSpace, setCampaignPopupOpen } from '../scripts/browser-world-input.mjs'
import { skipIntroductionWithSpace } from '../scripts/browser-introduction.mjs'
import { skipPauseIntroduction } from '../scripts/local-render/original-pause-checkpoint-recovery.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import ts from 'typescript'
import { homePopupSources } from '../scripts/campaign-popup-fixture/home-source.mjs'
import { createMessages, addMessage, acknowledgeMessage, messageHasDelete, messageIcon, messageText, messageViewPoint } from '../app/messages.ts'
import { captureCampaignPopupKeys, showCampaignPopup } from '../app/campaign-popup-session.ts'
import { pageEffect, pageNode, pageSource, evaluatePage } from './support/follower-nearby-page.mjs'

// Real Home effects + JSX callbacks, with a supplied document and scene boundary.
// Browser propagation/default activation is checked separately in the rendered fixture.
function fixture() {
  const listeners=new Map(), calls={overview:0,skip:0,focus:0,cancel:0}, world={messages:createMessages(),paused:true,inputMask:0,flyby:{flags:0},outcome:{level:2},units:[],selected:[]}
  addMessage(world.messages,641,()=>0);world.messages.slots[0].flags|=2
  class Element { constructor(kind='outside'){this.kind=kind} closest(selector){return this.kind==='summary'&&selector.includes('.campaign-messages summary')?this:null} }
  const outside=new Element(), document={activeElement:outside,addEventListener(type,fn,capture){assert.equal(capture,true);listeners.set(type,fn)},removeEventListener(type){listeners.delete(type)}}
  const summary=Object.assign(new Element('summary'),{focus(){document.activeElement=summary}}), view=Object.assign(new Element('world'),{focus(){document.activeElement=view}}), details={open:false,getAttribute(name){assert.equal(name,'data-message-serial');return '0'},querySelector(selector){return selector==='summary'?summary: {click:()=>popup.props.onAcknowledge()}}}
  const engine={current:{keys:new Set(['arrowup','shift']),focus(){calls.focus++},overview(){calls.overview++},skipIntroduction(){calls.skip++}}},messageDetails={current:new Map([[0,details]])}
  const bindings={document,world,engine,messageDetails,store:{change:fn=>fn(world),getWorld:()=>world},ready:true,menu:false,cheatsOpen:false,selectorOpen:false,update(){},showCampaignPopup,captureCampaignPopupKeys,acknowledgeMessage,messageHasDelete,messageIcon,messageText,messageViewPoint,viewport:{current:view},OriginalCampaignPopup:'OriginalCampaignPopup',messageViewportHeight:480,messageScreenY:()=>300}
  const aside=pageNode(n=>ts.isJsxElement(n)&&n.openingElement.attributes.properties.some(p=>p.name?.getText(pageSource)==='className'&&p.initializer?.text==='campaign-messages'))
  const rendered=evaluatePage(aside.getText(pageSource),bindings),element=rendered.children[0][0],popup=element.children[1]
  let game
  pageEffect("window.addEventListener('keydown', key)",{...bindings,window:{addEventListener(_,fn){game=fn}},openMenu(){calls.cancel++},SPELLS:[],tutorialLevel:79,cancelInteraction(){calls.cancel++},guardShaman(){calls.cancel++},select(){calls.cancel++},setTab(){calls.cancel++},rotateBuildingPlan(){return false},audio:{current:null}})()
  const close=pageEffect('return captureCampaignPopupKeys',bindings)()
  const auto=()=>pageEffect('const opened: number[]',bindings)()
  let sceneUp;evaluatePage(homePopupSources(new URL('..',import.meta.url).pathname).sceneUp,{window:{},scene:{keys:engine.current.keys,listen(_target,_type,fn){sceneUp=fn}}})
  const key=(key,type='keydown',repeat=false,modifiers={})=>{let stopped=false,prevented=false;const event={key,code:key===' '?'Space':key,type,repeat,target:outside,...modifiers,preventDefault(){prevented=true},stopImmediatePropagation(){stopped=true},stopPropagation(){stopped=true}};listeners.get(type)?.(event);if(!stopped&&event.target===summary)rendered.props[type==='keydown'?'onKeyDown':'onKeyUp'](event);if(!stopped&&type==='keydown')game(event);if(!stopped&&type==='keyup')sceneUp(event);return {stopped,prevented}}
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

// Playwright boundary adapter only: real Home summary/aside callbacks, popup
// capture and gameplay handlers perform the mutations. Browser focus/default
// activation is modeled here; only rendered QA can verify real DOM propagation.
function inputPage(f) {
  f.document.querySelector = selector => { assert.equal(selector, '.loading-world'); return null }
  f.document.querySelectorAll = selector => {
    assert.equal(selector, '.campaign-messages details[open]')
    return f.details.open ? [f.details] : []
  }
  const click = () => f.element.children[0].props.onClick({ preventDefault() {}, currentTarget: { parentElement: f.details } })
  const evaluate = (fn, arg) => runInNewContext(`(${fn.toString()})(arg)`, {
    window: { testStore: { getWorld: () => f.world } }, document: f.document, arg,
  })
  return {
    evaluate: async (fn, arg) => evaluate(fn, arg),
    waitForFunction: async (fn, arg) => ({ jsonValue: async () => evaluate(fn, arg), dispose: async () => {} }),
    locator(selector) {
      if (selector === '.world-viewport') return { focus: async () => f.view.focus() }
      assert.equal(selector, '.campaign-messages details[data-message-serial="0"]')
      return {
        count: async () => 1,
        getAttribute: async name => { assert.equal(name, 'open'); return f.details.open ? '' : null },
        locator(child) {
          if (child === 'summary') return { click: async () => { f.summary.focus(); click() } }
          assert.equal(child, '[data-native-campaign-panel]')
          return { waitFor: async ({ state }) => assert.equal(state, f.details.open ? 'visible' : 'hidden') }
        },
      }
    },
    keyboard: { press: async name => {
      assert.equal(name, 'Space')
      const target = f.document.activeElement
      const down = f.key(' ', 'keydown', false, { target }), up = f.key(' ', 'keyup', false, { target })
      if (target === f.summary && !down.prevented && !up.prevented) click()
    } },
  }
}

test('world Space helper crosses actual Home popup/summary/aside ownership, never acknowledges the queue', async () => {
  const f=fixture(),old=globalThis.Element;globalThis.Element=f.Element
  try {
    f.auto();f.world.paused=false
    const page=inputPage(f), before=structuredClone(f.world.messages)
    await page.keyboard.press('Space')
    assert.equal(f.world.paused,false,'Actual popup capture swallows world Space')
    await setCampaignPopupOpen(page,'0',false)
    assert.equal(f.document.activeElement,f.summary)
    await page.keyboard.press('Space')
    assert.equal(f.details.open,true,'Actual aside and summary callback reopen without toggling pause')
    assert.equal(f.world.paused,false)
    await pressWorldSpace(page)
    assert.equal(f.details.open,false)
    assert.equal(f.document.activeElement,f.view)
    assert.equal(f.world.paused,true,'Only the actual Home Space handler changes pause')
    assert.deepEqual(f.world.messages,before)
  } finally {f.close();globalThis.Element=old}
})

for(const [name,skip] of [['shared',skipIntroductionWithSpace],['recovery',skipPauseIntroduction]])
  test(`${name} popup-aware skip reaches actual Home and native flyby interruption without a pause toggle`,async()=>{
    const f=fixture(),old=globalThis.Element;globalThis.Element=f.Element
    try {
      const camera=readFileSync(new URL('../app/scene-camera-runtime.ts',import.meta.url),'utf8'),
        body=camera.slice(camera.indexOf('export function skipIntroduction('),camera.indexOf('export function updateCameraMotion('))
          .replace('export function skipIntroduction(scene: GameScene)','return function skipIntroduction(scene)'),
        nativeSkip=new Function('interruptFlyby',body)(interruptFlyby),
        scene={world:f.world,flybyCamera:{x:0,y:0,angle:0,zoom:0},onChange(){}}
      f.world.flyby=createFlyby();flybyCommand(f.world.flyby,1206,[])
      f.world.inputMask=64;f.world.paused=false;f.world.levelStart=[{phase:4}]
      f.engine.current.skipIntroduction=()=>{f.calls.skip++;return nativeSkip(scene)}
      f.auto()
      const before=structuredClone(f.world.messages),page=inputPage(f)
      await page.keyboard.press('Space')
      assert.equal(f.calls.skip,0,'Actual native popup retains key ownership before preparation')
      await skip(page)
      assert.equal(f.calls.skip,1)
      assert.equal(f.world.inputMask,0)
      assert.equal(f.world.flyby.flags&1,0)
      assert.equal(f.world.paused,false)
      assert.deepEqual(f.world.messages,before)
    } finally {f.close();globalThis.Element=old}
  })
