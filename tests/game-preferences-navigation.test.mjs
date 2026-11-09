import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {resolve,dirname} from 'node:path'
import {fileURLToPath,pathToFileURL} from 'node:url'
import {createRequire} from 'node:module'
// The installed test resolves the repository from tests/. The environment override
// permits this same file to run from an external review/fixture directory.
const root=resolve(process.env.POPULOUS_GAME_ROOT??resolve(dirname(fileURLToPath(import.meta.url)),'..'))
const require=createRequire(resolve(root,'package.json'))
const ts=require('typescript')
const camera=await import(pathToFileURL(resolve(root,'app/camera-input.ts')).href)
const source=ts.createSourceFile('scene-input-runtime.ts',readFileSync(resolve(root,'app/scene-input-runtime.ts'),'utf8'),ts.ScriptTarget.Latest,true)
const keyStatement=source.statements.find(node=>ts.isVariableStatement(node)&&node.declarationList.declarations.some(d=>d.name.getText(source)==='cameraKeys'))
const nav=source.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='navigationButtons')
assert.ok(keyStatement&&nav,'Expected actual camera key map and navigation caller')
function caller(document){
 const javascript=ts.transpileModule(keyStatement.getText(source)+'\n'+nav.getText(source).replace(/^export /,'')+'\nreturn navigationButtons;', {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText
 return new Function('cameraCommand','cameraEdgeButtons','mergeCameraInput','document',javascript)(camera.cameraCommand,camera.cameraEdgeButtons,camera.mergeCameraInput,document)
}
function fixture(rotation='cursor',flipRotation=false){
 const document={modal:false,querySelector(selector){assert.equal(selector,'dialog[open]');return this.modal?{}:null},documentElement:{clientWidth:640,clientHeight:480}}
 const scene={gamePreferences:{rotation,flipRotation},world:{inputMask:0},overviewStage:0,overviewActive:false,keys:new Set(),navigationPointer:null}
 return {scene,document,navigation:caller(document)}
}
// Independent truth table from retained 004ae200 command outputs. Do not calculate
// the expected result by calling the helper under test.
const rows=[
 ['arrowleft',16,4],['arrowright',32,8],['delete',4,16],['pagedown',8,32],
 ['arrowup',1,1],['arrowdown',2,2],['w',1,1],['s',2,2],
 ['a',4,4],['d',8,8],['q',16,16],['e',32,32],
 ['numpad8',1,1],['numpad2',2,2],['numpad4',4,4],['numpad6',8,8],['numpad7',16,16],['numpad9',32,32],
]
const reversed=value=>value===16?32:value===32?16:value
for(const rotation of ['cursor','control-cursor'])for(const flip of [false,true])for(const ctrl of [false,true])
 test(`actual navigation caller: ${rotation}, flip ${flip}, Ctrl ${ctrl}`,()=>{
  const {scene,navigation}=fixture(rotation,flip)
  for(const [key,normal,swapped]of rows){
   scene.keys=new Set([key,...(ctrl?['control']:[])])
   const switched=(rotation==='control-cursor')!==ctrl
   const expected=flip?reversed(switched?swapped:normal):(switched?swapped:normal)
   assert.equal(navigation(scene),expected,key)
   scene.keys.add('shift')
   assert.equal(navigation(scene),expected|(expected&15?64:0),`${key}+Shift`)
   scene.keys.clear();assert.equal(navigation(scene),0,`${key} release`)
  }
 })

test('actual navigation caller reads current choices, without constructing a replacement scene',()=>{
 const {scene,navigation}=fixture(),identity=scene,world=scene.world
 scene.keys.add('arrowleft');assert.equal(navigation(scene),16)
 scene.gamePreferences={rotation:'control-cursor',flipRotation:false};assert.equal(navigation(scene),4)
 scene.keys.add('control');assert.equal(navigation(scene),16)
 scene.gamePreferences={rotation:'control-cursor',flipRotation:true};assert.equal(navigation(scene),32)
 scene.gamePreferences={rotation:'cursor',flipRotation:true};assert.equal(navigation(scene),4)
 scene.keys.delete('control');assert.equal(navigation(scene),32)
 assert.equal(scene,identity);assert.equal(scene.world,world)
})

test('actual live caller plus real movement helper reverses heading or selects sideways motion',()=>{
 const outputs=[
  ['cursor',false,false,{x:2560,y:55808,angle:2022}],
  ['cursor',true,false,{x:2560,y:55808,angle:26}],
  ['control-cursor',false,false,{x:2240,y:55808,angle:0}],
  ['control-cursor',true,false,{x:2240,y:55808,angle:0}],
  ['control-cursor',false,true,{x:2560,y:55808,angle:2022}],
  ['control-cursor',true,true,{x:2560,y:55808,angle:26}],
 ]
 for(const[rotation,flip,ctrl,expected]of outputs){
  const {scene,navigation}=fixture(rotation,flip),position={x:2560,y:55808,angle:0},velocity={turn:0,forward:0,side:0}
  scene.keys=new Set(['arrowleft',...(ctrl?['control']:[])])
  camera.stepCameraInput(position,velocity,navigation(scene),24)
  assert.deepEqual(position,expected,JSON.stringify([rotation,flip,ctrl]))
  scene.keys.clear();camera.stepCameraInput(position,velocity,navigation(scene),24)
  assert.deepEqual(position,expected,'release remains still in the momentum-off adapter')
 }
})

test('overview conversion precedes flip and fixed aliases still bypass only the Rotation swap',()=>{
 for(const rotation of ['cursor','control-cursor'])for(const flip of [false,true])for(const ctrl of [false,true]){
  const {scene,navigation}=fixture(rotation,flip);scene.overviewActive=true
  for(const [key,normal,swapped]of rows){
   scene.keys=new Set([key,...(ctrl?['control']:[])])
   const value=((rotation==='control-cursor')!==ctrl)?swapped:normal
   assert.equal(navigation(scene),value===16?4:value===32?8:value,JSON.stringify([rotation,flip,ctrl,key]))
  }
 }
})

test('all preference combinations preserve screen edges, duplicate acceleration, drag and modal/input gates',()=>{
 for(const rotation of ['cursor','control-cursor'])for(const flip of [false,true]){
  const {scene,document,navigation}=fixture(rotation,flip)
  for(const [x,y,expected]of [[0,200,4],[639,200,8],[300,0,1],[300,479,2],[0,0,5],[1,200,0],[638,200,0]]){
   scene.navigationPointer={x,y,buttons:0};assert.equal(navigation(scene),expected)
  }
  scene.navigationPointer={x:0,y:200,buttons:0};scene.keys.add('a');assert.equal(navigation(scene),68,'matching fixed left+edge accelerates')
  scene.keys.clear()
  for(const buttons of [2,4,6]){scene.navigationPointer.buttons=buttons;assert.equal(navigation(scene),0,'drag suppresses edges')}
  scene.navigationPointer.buttons=0;scene.keys.add('arrowright')
  document.modal=true;assert.equal(navigation(scene),0,'modal gate');document.modal=false
  scene.world.inputMask=4;assert.equal(navigation(scene),0,'input lock');scene.world.inputMask=0
  scene.overviewStage='enter';assert.equal(navigation(scene),0,'overview transition gate');scene.overviewStage=0
  scene.navigationPointer=null;scene.keys.clear();assert.equal(navigation(scene),0)
 }
})

test('pointer drag adapter contains no new Rotation/Flip interpretation',()=>{
 const move=source.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='pointerMove')
 assert.ok(move)
 assert.doesNotMatch(move.getText(source),/gamePreferences|flipRotation|control-cursor/,'keyboard setting must not silently reverse/swap pointer drags')
})
