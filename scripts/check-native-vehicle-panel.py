"""Bounded native vehicle-panel probe. Writes only adjacent ignored JSON/assembly.
Run from repository root: source ../prerequisites/env.sh; python work/orchestration/transport-panel-research/probe.py "$POPULOUS_EXE"
The original renderer executes; palette, line, rectangle and sprite leaves are intercepted.
The unload predicate is supplied for geometry and hover tracing; its actual bytes are disassembled separately.
"""
import sys
from pathlib import Path
root=Path.cwd();sys.path.insert(0,str(root/'scripts'))
# Reuse the accepted source-atlas/render harness, stopping before its test loops.
source=(root/'scripts/check-native-person-panel.py').read_text().split('\n\nimport random')[0]
exec(compile(source,str(root/'scripts/check-native-person-panel.py'),'exec'))
from capstone import Cs,CS_ARCH_X86,CS_MODE_32
from tempfile import TemporaryDirectory
temporary = TemporaryDirectory(prefix='pnd-vehicle-panel-')
out = Path(temporary.name)
md=Cs(CS_ARCH_X86,CS_MODE_32)
assembly='\n'.join(f'{i.address:08x}: {i.mnemonic} {i.op_str}' for i in md.disasm(bytes(cpu.mem_read(0x466f30,0x250)),0x466f30))
(out/'00466f30.asm').write_text(assembly+'\n')
ready=False
predicate_calls=[]
def predicate(cpu,a,size,user):
 sp=cpu.reg_read(UC_X86_REG_ESP);predicate_calls.append([read(sp+4,'I'),read(sp+8,'I'),read(sp+12,'I')]);cpu.reg_write(UC_X86_REG_EAX,int(ready));cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
handle=cpu.hook_add(UC_HOOK_CODE,predicate,begin=0x466f30,end=0x466f30)
write(effect+0x70,'B',9);write(building+0x2a,'BB',4,1);write(building+0x2f,'B',0)
# draw_mode 2 makes explicit pointer coordinates the native hit coordinates.
# Find global addresses from disassembly only for optional input phase later.
cases=[]
for model,capacity in [(1,5),(2,5),(3,2),(4,2)]:
 for occupied in [0,1,capacity]:
  for available in [False,True]:
   ready=available;write(building+0x2b,'B',model);write(building+0x9e,'B',occupied)
   write(building+0x7a,'12H',*([0]*12))
   for i in range(occupied):
    p=building+256+i*256;pid=3+i
    write(p+0x24,'H',pid);write(p+0x2a,'BB',1,2+i);write(p+0x2f,'B',0);write(p+0x7a,'B',128 if i%2 else 0)
    write(0x890390+pid*4,'I',p);write(building+0x7a+i*2,'H',pid)
   events=[];predicate_calls=[];call(0x504bc0,panel,building,0,0,panel+0x12,panel+0x14,0,0)
   cases.append(dict(model=model,capacity=capacity,occupied=occupied,unloadAvailable=available,width=read(panel+0x12,'H'),height=read(panel+0x14,'H'),events=events,predicateCalls=predicate_calls))
result=dict(identity=identity,unicorn=__import__('unicorn').__version__,cases=cases,spriteSizes={str(i):list(struct.unpack('<HH',cpu.mem_read(entries+i*8+4,4))) for i in [52,53,60,61,75]})
(out/'draw-traces.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'identity':identity,'cases':len(cases),'spriteSizes':result['spriteSizes'],'geometries':sorted(set((c['model'],c['width'],c['height']) for c in cases))},indent=2))
# Inclusive native hover regions and emitted command-buffer tuples.
write(0x89c6c1,'I',2);write(0x89c6f0,'B',0);write(0x890398,'I',building)
write(building+0x2b,'B',1);write(building+0x9e,'B',2);write(building+0x7a,'12H',3,0,4,*([0]*9))
for i in range(2):
 p=building+256+i*256;write(p+0x24,'H',3+i);write(p+0x2a,'BB',1,2+i);write(p+0x2f,'B',0);write(p+0x3d,'HH',1000+i*300,2000+i*400)
hover=[]
for ready in [False,True]:
 for x,y in [(-1,-1),(3,1),(19,24),(20,1),(36,24),(91,0),(118,28),(119,28)]:
  write(0x984580,'ii',x,y);write(0x895fb0,'B',0);write(0x895fb5,'h',-99);write(0x895faf,'B',0)
  events=[];call(0x504bc0,panel,building,0,0,panel+0x12,panel+0x14,0,1)
  hover.append(dict(ready=ready,x=x,y=y,hit=read(0x895fb0,'B'),slot=read(0x895fb5,'h'),events=events))
result['hover']=hover
input_events=[]
def terminal(cpu,a,size,user):
 sp=cpu.reg_read(UC_X86_REG_ESP)
 if a==0x48a050:input_events.append(['sound',read(sp+8,'I')])
 elif a==0x417ca0:input_events.append(['camera',read(read(sp+4,'I'),'H'),read(read(sp+4,'I')+2,'H')])
 elif a==0x504590:input_events.append(['panel',read(read(sp+4,'I')+0x24,'H'),read(sp+8,'I')])
 cpu.reg_write(UC_X86_REG_EAX,0);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x48a050,0x417ca0,0x504590,0x4afff0]:cpu.hook_add(UC_HOOK_CODE,terminal,begin=a,end=a)
inputs=[]
for ready in [False,True]:
 for slot in [0,2,-2]:
  for button in [0xf0,0xf1]:
   for modifier in [0,1]:
    for selected in [0,128]:
     write(building+256+0x7a,'B',selected);write(building+512+0x7a,'B',selected)
     write(0x895fb0,'B',1);write(0x895fb3,'H',2);write(0x895fb5,'h',slot);write(0x89c661,'I',0)
     cpu.mem_write(0x897997,bytes(15));input_events=[];predicate_calls=[];call(0x47b460,button,modifier,0)
     inputs.append(dict(ready=ready,slot=slot,button=button,modifier=modifier,selected=selected,events=input_events,command=read(0x897997+12,'B'),arg1=read(0x897997+4,'I'),arg2=read(0x897997+8,'I'),predicateCalls=predicate_calls))
result['inputs']=inputs
# Execute 00466f30 itself with readiness/exit-result leaves independently supplied.
cpu.hook_del(handle)
leaf_calls=[]
ready=False;exit_valid=False
def predicate_leaf(cpu,a,size,user):
 sp=cpu.reg_read(UC_X86_REG_ESP);leaf_calls.append(hex(a));cpu.reg_write(UC_X86_REG_EAX,int(ready if a==0x465650 else exit_valid));cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x465650,0x466190]:cpu.hook_add(UC_HOOK_CODE,predicate_leaf,begin=a,end=a)
predicate_results=[]
import itertools
for force,state,ready,exit_valid,stationary,speed,cached in itertools.product([0,1],[0,1,7],[False,True],[False,True],[0,1],[-1,11,12,13],[False,True]):
 write(building+0x2e,'B',state);write(building+0x5f,'h',speed);write(building+0x92,'I',0x80001|(0x100000 if cached else 0));leaf_calls=[]
 call(0x466f30,building,force,stationary)
 value=cpu.reg_read(UC_X86_REG_EAX)&255;flags=read(building+0x92,'I')
 expected=cached if not force and state&7 else (ready and exit_valid and (not stationary or speed<12))
 assert value==int(expected) and bool(flags&0x100000)==expected
 predicate_results.append(dict(force=force,state=state,ready=ready,exitValid=exit_valid,stationary=stationary,speed=speed,cached=cached,result=value,flags=flags,calls=leaf_calls))
result['predicate']=predicate_results
# Existing imported mesh heights are independently checked through 00509000.
raw_models=(exe.parent/'objects/objs0-2.dat').read_bytes();cpu.mem_write(0x2020000,raw_models);write(0x895ec1,'I',0x2020000)
heights=[]
for model in [143,144]:
 write(building+0x2a,'B',4);write(building+0x33,'h',model);write(building+0x3a,'B',0);write(0x5a6af8,'b',3)
 call(0x509000,panel,building);heights.append(dict(model=model,height=read(panel+8,'h')))
result['heights']=heights
(out/'draw-traces.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'hoverCases':len(hover),'inputCases':len(inputs),'predicateCases':len(predicate_results),'heights':heights},indent=2))

# Compare actual native submission geometry against the maintained layout.
script = """import {vehiclePanel} from './app/vehicle-panel.ts';let input='';for await(const c of process.stdin)input+=c;console.log(JSON.stringify(JSON.parse(input).map(c=>vehiclePanel(c.model,Array.from({length:c.occupied},(_,i)=>({model:2+i,selected:!!(i%2),own:true})),!!c.occupied&&c.unloadAvailable))));"""
result_ts=subprocess.run(['node','--input-type=module','-e',script],cwd=root,input=json.dumps(cases),text=True,capture_output=True)
assert result_ts.returncode==0,result_ts.stderr
for original,actual in zip(cases,json.loads(result_ts.stdout),strict=True):
 assert actual=={k:original[k] for k in ['width','height','events']},(original,actual)
print('PASS: 24 native/TypeScript vehicle-panel layouts')
