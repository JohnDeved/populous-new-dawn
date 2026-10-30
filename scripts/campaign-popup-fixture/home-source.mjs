import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import ts from 'typescript'

// Execute the shipped Home ownership effects, notification JSX and scene key
// listeners without constructing Home's unrelated WebGL/startup dependencies.
// This is a source-bound integration fixture, not a full Home/gameplay run.
export function homePopupSources(root) {
  const parse=file=>ts.createSourceFile(file,readFileSync(resolve(root,file),'utf8'),ts.ScriptTarget.Latest,true,file.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS)
  const home=parse('app/page.tsx'), scene=parse('app/scene-input-runtime.ts')
  const pick=(source,predicate)=>{const found=[];function walk(n){if(predicate(n))found.push(n);ts.forEachChild(n,walk)}walk(source);assert.equal(found.length,1);return found[0].getText(source)}
  const declaration=name=>pick(home,n=>(ts.isVariableStatement(n)&&n.declarationList.declarations.some(d=>d.name.getText(home)===name))||(ts.isFunctionDeclaration(n)&&n.name?.text===name))
  const effect=needle=>pick(home,n=>ts.isCallExpression(n)&&n.expression.getText(home)==='useEffect'&&n.arguments[0]?.getText(home).includes(needle))
  return {
    menuSession:declaration('menuSession'), openMenu:declaration('openMenu'), closeMenu:declaration('closeMenu'),
    menuButton:pick(home,n=>ts.isJsxElement(n)&&n.openingElement.tagName.getText(home)==='button'&&n.openingElement.attributes.properties.some(p=>p.name?.getText(home)==='aria-label'&&p.initializer?.text==='Menu')),
    auto:effect('const opened: number[]'), priority:effect('return captureCampaignPopupKeys'),
    gameplay:effect("globalThis.addEventListener('keydown', key)"), cheat:effect("spellTestShortcut(event, cheatsOpen)"),
    viewport:pick(home,n=>ts.isJsxSelfClosingElement(n)&&n.attributes.properties.some(p=>p.name?.getText(home)==='ref'&&p.initializer?.expression?.getText(home)==='viewport')),
    aside:pick(home,n=>ts.isJsxElement(n)&&n.openingElement.attributes.properties.some(p=>p.name?.getText(home)==='className'&&p.initializer?.text==='campaign-messages')),
    screen:pick(home,n=>ts.isVariableStatement(n)&&n.declarationList.declarations.some(d=>d.name.getText(home)==='messageScreenX')),
    sceneKey:pick(scene,n=>ts.isFunctionDeclaration(n)&&n.name?.text==='keyDown').replace(/^export /,''),
    cameraKeys:pick(scene,n=>ts.isVariableStatement(n)&&n.declarationList.declarations.some(d=>d.name.getText(scene)==='cameraKeys')),
    sceneUp:pick(scene,n=>ts.isCallExpression(n)&&n.expression.getText(scene)==='scene.listen'&&n.arguments[1]?.text==='keyup'),
  }
}
export function homePopupFixture(root) {
  const s=homePopupSources(root),app=resolve(root,'app')
  return `import React,{useCallback,useEffect,useRef,useState} from 'react';
import {OriginalCampaignPopup} from '${app}/original-campaign-popup';
import {OriginalMessageTab} from '${app}/original-message-tab';
import {FullscreenControl} from '${app}/fullscreen-control';
import {OriginalPauseMenu} from '${app}/original-pause-menu';
import {QueryControlArt} from '${app}/query-control';
import {captureCampaignPopupKeys,showCampaignPopup} from '${app}/campaign-popup-session';
import {createMessages,addMessage,acknowledgeMessage,messageHasDelete,messageIcon,messageText,messageViewPoint} from '${app}/messages';
import {spellTestShortcut} from '${app}/spell-test-cheats';
${s.screen}
${s.cameraKeys}
${s.sceneKey}
export default function HomePopupFixture(){
 const [world]=useState(()=>{const messages=createMessages();addMessage(messages,641,()=>0);const m=messages.slots[0];m.flags&=~2;m.position=0x9000;m.height=0x1000;m.view={cell:0x60cc,payload:308};return{messages,paused:!new URLSearchParams(location.search).has('running'),status:'playing',inputMask:0,flyby:{flags:0},mode:null,units:[],selected:[],outcome:{level:2}}});
 const [,render]=useState(0),update=()=>render(n=>n+1),[cheatsOpen,setCheatsOpen]=useState(false),[menu,setMenu]=useState(false);
 const acknowledgments=useRef(0);
 useEffect(()=>{const clicked=e=>{if(e.target.closest?.('[data-popup-acknowledge]'))acknowledgments.current++};document.addEventListener('click',clicked,true);return()=>document.removeEventListener('click',clicked,true)},[]);
 const calls=useRef({overview:0,skip:0,focus:0,cancel:0,guard:0,select:0,tab:0,f8:0,bookmark:0,zoom:0,menu:0});
 const ready=true,selectorOpen=false,statisticsVisible=false,startup='playing',messageViewportHeight=innerHeight;
 const messageDetails=useRef(new Map()),viewport=useRef(null),audio=useRef(null);
 const store={getWorld:()=>world,change:fn=>{fn(world);update()}};
 const engine=useRef({keys:new Set(),world,modalSuspended:false,setModalSuspended(value){this.modalSuspended=value;this.keys.clear()},listen:(target,type,fn)=>{target.addEventListener(type,fn);return()=>target.removeEventListener(type,fn)},overview:()=>calls.current.overview++,skipIntroduction:()=>calls.current.skip++,focus:()=>calls.current.focus++,togglePerformance:()=>calls.current.f8++,zoom:()=>calls.current.zoom++});
 const cancelNearbyInput=()=>{},SPELLS=[{id:'blast',key:'1'}],spellHudVisibility=()=> 'visible',setTab=()=>calls.current.tab++,cancelInteraction=()=>calls.current.cancel++,guardShaman=()=>calls.current.guard++,select=()=>calls.current.select++,rotateBuildingPlan=()=>false,HOME={x:0,z:0},tutorialLevel=79;
 ${s.menuSession};${s.openMenu};${s.closeMenu};
 const unsupportedMenuAction=()=>{throw new Error('This bounded popup fixture only exercises Menu, Fullscreen and Continue Game')};
 ${s.auto};${s.priority};${s.cheat};${s.gameplay};
 useEffect(()=>{const scene=engine.current,down=e=>keyDown(scene,e);window.addEventListener('keydown',down);const up=${s.sceneUp};return()=>{window.removeEventListener('keydown',down);up()}},[]);
 useEffect(()=>{Object.assign(window,{homePopupFixture:{read:()=>({world:structuredClone(world),acknowledgments:acknowledgments.current,calls:{...calls.current},keys:[...engine.current.keys],cheatsOpen,menu,modalSuspended:engine.current.modalSuspended,sameWorld:engine.current.world===world,focus:document.activeElement?.getAttribute('aria-label')??document.activeElement?.className}),autoOpen:()=>{world.messages.slots[0].flags|=2;update()},setFlyby:()=>{world.inputMask=1;world.flyby.flags=1;update()},hold:()=>{engine.current.keys.add('arrowup');engine.current.keys.add('shift')},setOneShot:()=>{world.messages.slots[0].flags|=0x200;update()}}})});
 return <main className="game-shell" style={{'--hud-scale':1,'--message-width':'32px'}}>${s.viewport}<div className="shaman-controls">${s.menuButton}</div>${s.aside}<FullscreenControl/>{menu&&<OriginalPauseMenu tutorial={false} hasCheckpoint={false} checkpointReadStatus="read" onRetryCheckpoint={unsupportedMenuAction} renderOptions={unsupportedMenuAction} onContinue={closeMenu} onSave={unsupportedMenuAction} onLoad={unsupportedMenuAction} onRestart={unsupportedMenuAction} onQuitLevel={unsupportedMenuAction} onQuitGame={unsupportedMenuAction}/>}{cheatsOpen&&<div data-cheat-test-open/>}</main>
}
function cameraBookmark(scene){scene.keys.add('unexpected-bookmark')}
`
}
