"""Compare original camera planning and complete movement steps with the browser.
Usage: python scripts/check-native-camera-motion.py /path/to/d3dpoptb.exe
Movement supplies only the final globe-update consumer; native distance,
angle and sine routines execute unchanged. The composed result batch also
supplies input, interaction-cleanup and sound consumers at call boundaries.
"""
import json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP
from decomp import native_cpu
root=Path(__file__).resolve().parents[1];cpu,_=native_cpu(Path(sys.argv[1]));cpu.mem_map(0x2000000,0x20000)
point,stack,stop=0x2000000,0x201d000,0x201e000
rng=random.Random(0x417d80);events=[]
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def call(a,*args):
    write(stack,'I'*(len(args)+1),stop,*[v&0xffffffff for v in args]);cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(a,stop,timeout=1000000,count=1000000);assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
def camera():return dict(x=read(0x89d1ec,'H'),y=read(0x89d1ee,'H'),angle=read(0x89d1fa,'h'))
def globe(cpu,a,s,u):
    events.append(camera());sp=cpu.reg_read(UC_X86_REG_ESP);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
cpu.hook_add(UC_HOOK_CODE,globe,begin=0x41ef80,end=0x41ef80)
fields={name:(0x89bc0b+i*2,'h') for i,name in enumerate(['moveUp','moveDown','turnUp','turnDown','moveSpeed','turnSpeed'])}
fields.update({name:(0x89bc17+i,'B') for i,name in enumerate(['active','moveIndex','turnIndex','moveCount','turnCount','phase','frame'])})
def snapshot():
    s={name:read(a,f) for name,(a,f) in fields.items()}
    s.update(target=dict(x=read(0x89bbff,'H'),y=read(0x89bc01,'H'),angle=read(0x89bc07,'h')),source=dict(x=read(0x89bc03,'H'),y=read(0x89bc05,'H'),angle=read(0x89bc09,'h')),
      moves=[list(struct.unpack('<hh',cpu.mem_read(0x5fe250+i*4,4))) for i in range(11)],turns=[list(struct.unpack('<hh',cpu.mem_read(0x5fe280+i*4,4))) for i in range(11)])
    return dict(state=s,camera=camera(),renderFlags=read(0x87ca1c,'I'),waterDirty=read(0x5d45d8,'B'),events=events.copy())
cases=[];expected=[];frames=0
for i in range(256):
    cpu.mem_write(0x89bbff,bytes(31));cpu.mem_write(0x5fe250,bytes(96));write(0x89c6f0,'b',0)
    c=dict(x=rng.randrange(65536),y=rng.randrange(65536),angle=rng.randrange(2048));t=dict(x=rng.randrange(65536),y=rng.randrange(65536),angle=rng.choice([-1,0,512,1024,1536,2047]))
    if i<16:c=dict(x=0,y=0,angle=0);t=dict(x=[0,1,3,4,2048,2049,6144,6145,14336,14337,32767,32768,65532,65533,65534,65535][i],y=0,angle=-1)
    write(0x89d1ec,'HH',c['x'],c['y']);write(0x89d1fa,'h',c['angle']);write(0x87ca1c,'I',0x100);write(0x5d45d8,'B',0);events=[]
    commands=[dict(target=t)];states=[]
    write(point,'HH',t['x'],t['y']);call(0x417d80,point,t['angle']);states.append(snapshot())
    for frame in range(256):
        if not read(0x89bc17,'B'):break
        if frame==7 and i%7==0:
            t=dict(x=rng.randrange(65536),y=rng.randrange(65536),angle=rng.randrange(2048));commands.append(dict(target=t));write(point,'HH',t['x'],t['y']);call(0x417d80,point,t['angle']);states.append(snapshot())
        mode=2 if i%13==0 and frame==9 else 0;commands.append(dict(drawMode=mode));write(0x89c6c1,'h',mode);call(0x418270);states.append(snapshot());frames+=1
    assert not read(0x89bc17,'B'),('unfinished',i,snapshot())
    # Inactive calls must retain every field and produce no additional effects.
    commands.append(dict(drawMode=0));call(0x418270);states.append(snapshot());frames+=1
    cases.append(dict(camera=c,commands=commands));expected.append(states)
js="""import {createCameraMotion,planCameraMotion,stepCameraMotion} from './app/camera-motion.ts';
let input='';for await(const c of process.stdin)input+=c;
console.log(JSON.stringify(JSON.parse(input).map(c=>{
 const s=createCameraMotion(),camera=c.camera,events=[];let renderFlags=256,waterDirty=0;
 return c.commands.map(cmd=>{
  if(cmd.target)planCameraMotion(s,camera,cmd.target);
  else stepCameraMotion(s,camera,cmd.drawMode,{rotate:()=>{renderFlags|=128;},globe:()=>{events.push({...camera});waterDirty=1;}});
  return structuredClone({state:s,camera,renderFlags,waterDirty,events});
 });
})));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=root);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout);assert len(actual)==len(expected)
for i,(a,b) in enumerate(zip(expected,actual)):
    if a!=b:
        for frame,(x,y) in enumerate(zip(a,b)):
            if x!=y:
                p=Path('/private/tmp/populous-camera-motion-failure.json');p.write_text(json.dumps(dict(case=cases[i],frame=frame,native=x,browser=y),indent=2));raise AssertionError((i,frame,str(p)))
        raise AssertionError(('length',i,len(a),len(b)))
print(f'PASS: 256 native camera journeys, {sum(bool(c.get("target")) for case in cases for c in case["commands"])} plans and {frames:,} complete movement calls')

# Result initiation/controller with the real planner and movement processor.
def result_state():
    return dict(target=dict(x=read(0x89bb69,'H'),y=read(0x89bb6b,'H'),angle=read(0x89bb71,'h')),
      saved=dict(x=read(0x89bb6d,'H'),y=read(0x89bb6f,'H'),angle=read(0x89bb73,'h')),
      counter=read(0x89bb75,'B'),phase=read(0x89bb76,'B'),active=read(0x89bb77,'B'))
def result_leaf(cpu,a,s,u):
    sp=cpu.reg_read(UC_X86_REG_ESP)
    if a in [0x4af0a0,0x4af1c0]:assert read(sp+4,'I')==4
    if a==0x48a050:assert [read(sp+i,'I') for i in [4,8,12]]==[0,0xa2,1]
    events.append({0x4af0a0:'lock',0x4af1c0:'unlock',0x448fa0:'clear',0x48a050:'sound'}[a])
    cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x4af0a0,0x4af1c0,0x448fa0,0x48a050]:cpu.hook_add(UC_HOOK_CODE,result_leaf,begin=a,end=a)
def result_snapshot():return dict(**snapshot(),result=result_state(),skyCounter=read(0x89d166,'B'))
cases=[];expected=[];result_frames=0
for i in range(128):
    cpu.mem_write(0x89bb69,bytes(15));cpu.mem_write(0x89bbff,bytes(31));cpu.mem_write(0x5fe250,bytes(96))
    c=dict(x=rng.randrange(65536),y=rng.randrange(65536),angle=rng.randrange(2048));t=dict(x=rng.randrange(65536),y=rng.randrange(65536))
    game=2 if i%17==0 else 0;opened=16 if i%19==0 else 0;sky=rng.randrange(256)
    write(0x89d1ec,'HH',c['x'],c['y']);write(0x89d1fa,'h',c['angle']);write(0x89d1c8+0xc65+0x911,'HH',t['x'],t['y'])
    write(0x89d17c,'I',game)
    # opened_files_flags is the native replay/file-mode gate.
    write(0x98f746,'I',opened);write(0x89d166,'B',sky);write(0x87ca1c,'I',256);write(0x5d45d8,'B',0);events=[]
    call(0x41b610,1);states=[result_snapshot()];commands=[dict(begin=True)]
    # A repeated request while active must not replace the captured view.
    call(0x41b610,1);states.append(result_snapshot());commands.append(dict(begin=True))
    override=None
    if i%5==0:override=dict(active=1,phase=1,counter=i%4+1)
    elif i%7==0:override=dict(active=1,phase=2,counter=1)
    elif i%11==0:override=dict(active=1,phase=3,counter=0)
    if override:
        write(0x89bb75,'BBB',override['counter'],override['phase'],override['active']);commands.append(dict(override=override));states.append(result_snapshot())
    for frame in range(96):
        new_turn=frame%2==0;write(0x89d163,'B',int(new_turn));write(0x89c6c1,'h',0)
        call(0x41b6d0);call(0x418270);result_frames+=1;commands.append(dict(newTurn=new_turn));states.append(result_snapshot())
    cases.append(dict(camera=c,target=t,gameFlags=game,openedFiles=opened,skyCounter=sky,commands=commands));expected.append(states)
js="""import * as m from './app/camera-motion.ts';let input='';for await(const c of process.stdin)input+=c;
console.log(JSON.stringify(JSON.parse(input).map(c=>{
 const state=m.createCameraMotion(),result=m.createResultCamera(),camera=c.camera,events=[],w={skyCounter:c.skyCounter,newTurn:false};let renderFlags=256,waterDirty=0;
 return c.commands.map(cmd=>{
  if(cmd.begin)m.beginResultCamera(result,c.gameFlags,c.openedFiles,camera,c.target);
  else if(cmd.override)Object.assign(result,cmd.override);
  else {w.newTurn=cmd.newTurn;m.stepResultCamera(result,state,camera,w,{lock:()=>events.push('lock'),unlock:()=>events.push('unlock'),clearInteraction:()=>events.push('clear'),sound:()=>events.push('sound')});m.stepCameraMotion(state,camera,0,{rotate:()=>{renderFlags|=128;},globe:()=>{events.push({...camera});waterDirty=1;}});}
  return structuredClone({state,result,camera,renderFlags,waterDirty,events,skyCounter:w.skyCounter});
 });
})));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=root);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout);assert len(actual)==len(expected)
for i,(a,b) in enumerate(zip(expected,actual)):
    if a!=b:
        for frame,(x,y) in enumerate(zip(a,b)):
            if x!=y:
                p=Path('/private/tmp/populous-result-camera-failure.json');p.write_text(json.dumps(dict(case=cases[i],frame=frame,native=x,browser=y),indent=2));raise AssertionError((i,frame,str(p)))
        raise AssertionError(('length',i,len(a),len(b)))
print(f'PASS: 256 native result-camera initiations and {result_frames:,} composed controller/movement frames, including return/lockout/sky sound paths')
