from pathlib import Path
import argparse,hashlib,json,os,subprocess
parser=argparse.ArgumentParser(description="Prepare a source-bound result presentation fixture outside application source.")
parser.add_argument("--game-root",default=os.environ.get("POPULOUS_GAME_ROOT",os.getcwd()))
parser.add_argument("--fixture-root",default=os.environ.get("POPULOUS_FIXTURE_ROOT"))
args=parser.parse_args()
root=Path(args.game_root).resolve()
out=Path(args.fixture_root).resolve() if args.fixture_root else root/"work"/"result-ui-fixture"
out.mkdir(parents=True,exist_ok=True)
modules=out/"node_modules"
if not modules.exists(): modules.symlink_to(root/"node_modules",target_is_directory=True)
elif modules.resolve() != (root/"node_modules").resolve(): raise SystemExit("Fixture node_modules must resolve to the selected checkout dependencies")
p=(root/'app/page.tsx').read_text()
gate=p[p.index("      {world.status !== 'playing' && !world.outcome.cameraPlaying && ("):p.index('      {menu && (',p.index("      {world.status !== 'playing' && !world.outcome.cameraPlaying && ("))]
click=p[p.index('      onClickCapture={e => {'):p.index('\n    >',p.index('      onClickCapture={e => {'))]
key_start=p.index('  useEffect(() => {\n    const key = (e: KeyboardEvent) => {')
key=p[key_start:p.index('\n  useEffect(() => {',key_start+1)]
source={f:hashlib.sha256((root/f).read_bytes()).hexdigest() for f in ['app/page.tsx','app/globals.css','app/hud-layout.ts','app/original-result-screen.tsx','app/original-result-screen.module.css','app/original-result-layout.ts','app/original-result-ui.json','public/original/result-panel.png','public/original/result-font.png']}
meta={'sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'files':source,'fragments':{k:hashlib.sha256(v.encode()).hexdigest() for k,v in {'resultGate':gate,'rootClickCapture':click,'rootKeyEffect':key}.items()},'limits':['Source-bound React presentation fixture with actual production component, current globals.css and hudScale.','Exact Home result JSX gate, click capture, and keyboard effect byte-extracted; world/store/engine/remaining dependencies are explicit fixture stubs.','Neutral source-styled battlefield, no scene, model, lifecycle, campaign, profile, save or native runtime mounted.','Callback spies prove dispatch only, never real world replacement or progression.','Headless browser; no hardware performance or natural outcome equivalence claim.']}
(out/'source.json').write_text(json.dumps(meta,indent=2)+'\n')
(out/'package.json').write_text('{"private":true,"type":"module"}\n')
(out/'index.html').write_text('<!doctype html><html><head><meta charset="utf-8"><title>Result presentation fixture</title></head><body><div id="root"></div><script type="module" src="/main.tsx"></script></body></html>\n')
code='''import {createRoot} from 'react-dom/client'
import {useEffect,useRef,useState} from 'react'
import {hudScale} from '__GAME_ROOT__/app/hud-layout.ts'
import {OriginalResultScreen} from '__GAME_ROOT__/app/original-result-screen.tsx'
import '__GAME_ROOT__/app/globals.css'
const counts={primary:0,restart:0,continue:0,selector:0,outside:0,overview:0,skip:0,update:0,menu:0}
function Fixture(){
 const shell=useRef<HTMLElement>(null)
 const [state,setState]=useState({status:'won',level:1,playerTribe:0,time:125,cameraPlaying:false,inputMask:65535,nextMission:2,hudPreference:'auto',paused:false})
 const world={status:state.status,outcome:{level:state.level,cameraPlaying:state.cameraPlaying},manaWorld:{playerTribe:state.playerTribe},time:state.time,inputMask:state.inputMask,flyby:{flags:0},paused:state.paused,units:[],selected:[],mode:null}
 const nextMission=state.nextMission
 const restart=()=>{counts.primary++;counts.restart++}
 const continueCampaign=()=>{counts.primary++;counts.continue++}
 const openSelector=()=>{counts.selector++}
 const blockLoadingInteraction=()=>false
 const ready=true,menu=false,tutorialLevel=79,SPELLS=[],HOME={}
 const update=()=>{counts.update++},openMenu=()=>{counts.menu++},setTab=()=>{},spellHudVisibility=()=>'',cancelInteraction=()=>{},guardShaman=()=>{},select=()=>{},rotateBuildingPlan=()=>false
 const store={getWorld:()=>world,change:(fn:any)=>fn(world)}
 const engine=useRef({skipIntroduction:()=>{counts.skip++},overview:()=>{counts.overview++},focus:()=>{}}),audio=useRef({cue:()=>{}})
 useEffect(()=>{
  const resize=()=>shell.current?.style.setProperty('--hud-scale',String(hudScale(innerWidth,innerHeight,state.hudPreference)))
  resize();window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize)
 },[state.hudPreference])
 useEffect(()=>{window.fixture={configure:(patch:any)=>setState(current=>({...current,...patch})),read:()=>({state,world,counts:{...counts}})}},[state])
'''+key+'''
 return <main className="game-shell" ref={shell}
'''+click+'''
 ><div className="world-viewport" onClick={()=>counts.outside++} />
'''+gate+'''
 </main>
}
createRoot(document.getElementById('root')!).render(<Fixture />)
'''
code=code.replace('__GAME_ROOT__',str(root))
(out/'main.tsx').write_text(code)
print(json.dumps(meta,indent=2))
