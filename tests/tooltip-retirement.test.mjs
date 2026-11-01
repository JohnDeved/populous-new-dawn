import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
const source = fs.readFileSync(new URL('../app/scene-tooltip-runtime.ts', import.meta.url), 'utf8')
const tree = ts.createSourceFile('runtime.ts', source, ts.ScriptTarget.Latest, true)
function extract(names, bindings = {}) {
  const nodes = tree.statements.filter(n => ts.isFunctionDeclaration(n) && names.includes(n.name?.text))
  assert.equal(nodes.length, names.length)
  const text = nodes.map(n => n.getText(tree).replace(/^export /, '')).join('\n')
  const js = ts.transpileModule(text, {compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText
  return new Function(...Object.keys(bindings), js + '\nreturn {' + names.join(',') + '}')(...Object.values(bindings))
}
const {updateTooltipFrame} = extract(['updateTooltipFrame'])
function frameScene() {
  return {disposed:false, world:{paused:false}, tooltipCameraActive:false,
    tooltipFrame:{elapsed:3/24,lastElapsed:0,remainder:0,cueGroups:[]},
    acquireForcedTooltip(){}, updateTooltipController(){}}
}
test('frontend visits stop when a visit synchronously retires the scene', () => {
  const scene = frameScene(); let visits = 0
  scene.updateTooltipController = () => {visits++; scene.disposed = true}
  updateTooltipFrame(scene, 125)
  assert.equal(visits, 1)
})
test('live frontend preserves every elapsed visit', () => {
  const scene = frameScene(); let visits = 0
  scene.updateTooltipController = () => {visits++}
  updateTooltipFrame(scene, 125)
  assert.equal(visits, 3)
})
function controllerScene(retire) {
  const owner = {unsupportedHistory:[], owners:{}, session:{visits:0}, category:'object'}
  const calls=[]
  const scene={disposed:false,world:{status:'playing',paused:false,inputMask:0,mode:null,selected:[],buildings:[{id:7}]},
    overviewActive:false,overviewStage:0,tooltip:{remaining:0,target:0},
    tooltipInput:{picked:7,cell:4,route:'world',hud:null,message:0,pointer:null},
    tooltipInspectionInputs:[{kind:'down',pointerId:1,target:7,cell:4}],
    objectPanels:{inspectBuilding(){calls.push('inspect');return 'explicit:created'},renewBuildingInspection(){calls.push('renew')},stepBuildingInspections(){calls.push('step')}},
    onSound(){calls.push('sound');if(retire)scene.disposed=true}}
  const noop=()=>{}
  const {updateTooltipController} = extract(['explicitAdmission','updateTooltipController'], {
    getTooltipController:()=>owner,tooltipObject:()=>({id:7}),inspectionTarget:()=>7,
    document:{hidden:false,querySelector:()=>null},sampleTooltipFrontend:noop,visitHudTooltip:noop,
    stepTooltip:()=>false,worldTooltipObject:()=>null,resetTooltipController:noop,
    visitObjectTooltip:()=>false,blankCell:()=>false,visitBlankCellTooltip:noop,finishOrdinaryTooltip:noop,
    cancelTooltipInspection:noop,effect:noop,browserPosition:x=>x,buildingInsidePoint:x=>x,buildingPose:x=>x
  })
  return {scene,owner,calls,run:()=>updateTooltipController(scene,125)}
}
test('explicit inspection sound retirement stops panel and output publication', () => {
  const {calls,owner,run}=controllerScene(true); run()
  assert.deepEqual(calls,['inspect','sound'])
  assert.equal(owner.output,undefined)
  assert.equal(owner.lastVisit,undefined)
})
test('live explicit inspection preserves panel renewal and output', () => {
  const {calls,owner,run}=controllerScene(false); run()
  assert.deepEqual(calls,['inspect','sound','renew','step'])
  assert.ok(owner.output)
  assert.equal(owner.lastVisit.route,'object')
})
