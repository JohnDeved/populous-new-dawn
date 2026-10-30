import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { createFlyby, flybyCommand, interruptFlyby } from '../app/flyby.ts'
import { prepareWorldInput, pressWorldSpace, setCampaignPopupOpen, setWorldPaused } from '../scripts/browser-world-input.mjs'
import { skipIntroductionWithSpace } from '../scripts/browser-introduction.mjs'
import { skipPauseIntroduction } from '../scripts/local-render/original-pause-checkpoint-recovery.mjs'
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
  const captures=new Set(), listeners=new Map(), calls={overview:0,skip:0,focus:0,cancel:0}, world={messages:createMessages(),paused:true,inputMask:0,flyby:{flags:0},outcome:{level:2},units:[],selected:[]}
  addMessage(world.messages,641,()=>0);world.messages.slots[0].flags|=2
  class Element { constructor(kind='outside'){this.kind=kind} closest(selector){return this.kind==='summary'&&selector.includes('.campaign-messages summary')?this:null} }
  const outside=new Element(), document={activeElement:outside,addEventListener(type,fn,capture){assert.equal(capture,true);listeners.set(type,fn)},removeEventListener(type){listeners.delete(type)}}
  const summary=Object.assign(new Element('summary'),{focus(){document.activeElement=summary}}), view=Object.assign(new Element('world'),{focus(){document.activeElement=view}}), details={open:false,getAttribute(name){assert.equal(name,'data-message-serial');return '0'},querySelector(selector){return selector==='summary'?summary: {click:()=>popup.props.onAcknowledge()}}}
  const engine={current:{keys:new Set(['arrowup','shift']),focus(){calls.focus++},overview(){calls.overview++},skipIntroduction(){calls.skip++}}},messageDetails={current:new Map([[0,details]])}
  const bindings={document,world,engine,messageDetails,store:{change:fn=>fn(world),getWorld:()=>world},ready:true,menu:false,cheatsOpen:false,selectorOpen:false,statisticsVisible:false,update(){},showCampaignPopup,captureCampaignPopupKeys,acknowledgeMessage,messageHasDelete,messageIcon,messageText,messageViewPoint,viewport:{current:view},OriginalCampaignPopup:'OriginalCampaignPopup',OriginalMessageTab:'OriginalMessageTab',messageViewportHeight:480,messageScreenY:()=>300}
  const aside=pageNode(n=>ts.isJsxElement(n)&&n.openingElement.attributes.properties.some(p=>p.name?.getText(pageSource)==='className'&&p.initializer?.text==='campaign-messages'))
  const rendered=evaluatePage(aside.getText(pageSource),bindings),element=rendered.children[0][0],popup=element.children[1]
  let game
  pageEffect("globalThis.addEventListener('keydown', key)",{...bindings,globalThis:{addEventListener(_,fn){game=fn}},openMenu(){calls.cancel++},SPELLS:[],tutorialLevel:79,cancelInteraction(){calls.cancel++},guardShaman(){calls.cancel++},select(){calls.cancel++},setTab(){calls.cancel++},rotateBuildingPlan(){return false},audio:{current:null}})()
  const close=pageEffect('return captureCampaignPopupKeys',bindings)()
  const auto=()=>pageEffect('const opened: number[]',bindings)()
  let sceneUp;evaluatePage(homePopupSources(new URL('..',import.meta.url).pathname).sceneUp,{window:{},scene:{keys:engine.current.keys,listen(_target,_type,fn){sceneUp=fn}}})
  const key=(key,type='keydown',repeat=false,modifiers={})=>{let stopped=false,prevented=false;const event={key,code:key===' '?'Space':key,type,repeat,isTrusted:true,target:outside,...modifiers,get defaultPrevented(){return prevented},preventDefault(){prevented=true},stopImmediatePropagation(){stopped=true},stopPropagation(){stopped=true}};if(type==='keydown')for(const capture of captures)capture(event);listeners.get(type)?.(event);if(!stopped&&event.target===summary)rendered.props[type==='keydown'?'onKeyDown':'onKeyUp'](event);if(!stopped&&type==='keydown')game(event);if(!stopped&&type==='keyup')sceneUp(event);return {stopped,prevented}}
  return {auto,key,close,world,calls,document,outside,details,engine,popup,summary,view,Element,element,captures}
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

// Playwright boundary adapter only: real Home summary/aside callbacks, popup
// capture and gameplay handlers perform the mutations. Browser focus/default
// activation is modeled here; only rendered QA can verify real DOM propagation.
function inputPage(f, { beforePress, afterPress } = {}) {
  f.document.querySelector = selector => { assert.equal(selector, '.loading-world'); return null }
  f.document.querySelectorAll = selector => {
    assert.ok(['.campaign-messages details', '.campaign-messages details[open]'].includes(selector))
    return selector.endsWith('[open]') && !f.details.open ? [] : [f.details]
  }
  const click = () => f.element.children[0].props.onClick({ preventDefault() {}, currentTarget: { parentElement: f.details } })
  const window = { testStore: { getWorld: () => f.world },
    addEventListener(type, fn, capture) { assert.equal(type, 'keydown'); assert.equal(capture, true); f.captures.add(fn) },
    removeEventListener(type, fn, capture) { assert.equal(type, 'keydown'); assert.equal(capture, true); f.captures.delete(fn) } }
  const evaluate = (fn, arg) => runInNewContext(`(${fn.toString()})(arg)`, {
    window, document: f.document, arg, queueMicrotask, setTimeout, clearTimeout,
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
      beforePress?.()
      const target = f.document.activeElement
      const down = f.key(' ', 'keydown', false, { target }), up = f.key(' ', 'keyup', false, { target })
      if (target === f.summary && !down.prevented && !up.prevented) click()
      afterPress?.()
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

test('pointer-only helper closes the actual Home summary without changing focus or retained world state', async () => {
  const f = fixture()
  try {
    f.auto()
    const before = structuredClone(f.world), trace = {}
    assert.deepEqual(await prepareWorldInput(inputPage(f), { keyboardFocus: false, trace }), [{ serial: '0' }])
    assert.equal(f.details.open, false)
    assert.equal(f.document.activeElement, f.summary)
    assert.deepEqual(f.world, before)
    assert.equal(trace.completed.length, 4)
    assert.equal(trace.observedOpen, false)
    assert.equal(trace.pending, false)
  } finally { f.close() }
})

for(const [name,skip,late] of [['shared',skipIntroductionWithSpace,false],['recovery',skipPauseIntroduction,false],
  ['shared late owner',skipIntroductionWithSpace,true],['recovery late owner',skipPauseIntroduction,true]])
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
      let deliveries=0
      const press=page.keyboard.press
      page.keyboard.press=async key=>{
        if(late && ++deliveries===1){f.world.messages.slots[0].flags|=2;f.auto()}
        return press(key)
      }
      await skip(page)
      if(late)assert.equal(deliveries,2,'Only the witnessed popup-rejected first key may be retried')
      assert.equal(f.captures.size,0)
      assert.equal(f.calls.skip,1)
      assert.equal(f.world.inputMask,0)
      assert.equal(f.world.flyby.flags&1,0)
      assert.equal(f.world.paused,false)
      assert.deepEqual(f.world.messages,before)
    } finally {f.close();globalThis.Element=old}
  })

for (const paused of [true, false]) test(`late popup ownership retries only the rejected public pause=${paused} dispatch`, async () => {
  const f=fixture(), old=globalThis.Element;globalThis.Element=f.Element
  try {
    f.world.paused=!paused; f.world.turn=7
    let presses=0
    const page=inputPage(f,{beforePress(){if(++presses===1)f.auto()}}), before=structuredClone(f.world.messages)
    await setWorldPaused(page,paused)
    assert.equal(presses,2,'First actual document popup capture rejects; second Home handler changes pause')
    assert.equal(f.world.paused,paused)
    assert.equal(f.world.turn,7)
    // Auto-open clears its presentation flag, never acknowledges/deletes a record.
    before.slots[0].flags &= ~2
    assert.deepEqual(f.world.messages,before)
    assert.equal(f.captures.size,0,'Passive dispatch witness must be removed')
  } finally {f.close();globalThis.Element=old}
})

test('accepted Home pause is never repeated when a new popup opens after its key dispatch', async () => {
  const f=fixture(),old=globalThis.Element;globalThis.Element=f.Element
  try {
    f.world.paused=false;let presses=0
    const page=inputPage(f,{afterPress(){presses++;f.auto()}})
    await setWorldPaused(page,true)
    assert.equal(presses,1);assert.equal(f.world.paused,true)
    assert.equal(f.details.open,true,'Accepted input does not consume a later authored notification')
    assert.equal(f.captures.size,0)
  } finally {f.close();globalThis.Element=old}
})

test('rejected keyboard delivery removes the passive witness and never retries', async () => {
  const f=fixture(),old=globalThis.Element;globalThis.Element=f.Element
  try {
    f.world.paused=false;let presses=0;const failure=Error('supplied keyboard rejection')
    const page=inputPage(f,{beforePress(){presses++;throw failure}})
    await assert.rejects(setWorldPaused(page,true),error=>error===failure)
    assert.equal(presses,1);assert.equal(f.world.paused,false);assert.equal(f.captures.size,0)
  } finally {f.close();globalThis.Element=old}
})


test('stalled keyboard delivery expires actual passive ownership without retry or a new deadline', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  let now=0, presses=0, entered
  t.mock.method(performance,'now',()=>now)
  const f=fixture(),old=globalThis.Element;globalThis.Element=f.Element
  try {
    f.world.paused=false
    const page=inputPage(f),starting=new Promise(resolve=>{entered=resolve})
    page.keyboard.press=async()=>{presses++;entered();return new Promise(()=>{})}
    const pending=assert.rejects(setWorldPaused(page,true,{timeout:500}),/timed out/)
    await starting
    assert.equal(f.captures.size,1)
    now=500;t.mock.timers.tick(500)
    await pending
    assert.equal(presses,1);assert.equal(f.world.paused,false);assert.equal(f.captures.size,0)
  } finally {f.close();globalThis.Element=old}
})
