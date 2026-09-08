"""Execute the original direct-gather harvesting phase, transfer and scenery resize.
0x4340a0 runs with an already-reached source and a valid following order. Native
0x4d50d0, 0x4a7860 and 0x4a79f0 execute; animation output, sounds, replant allocation
and removal are observed consumers. Search, routing and other command phases are
not covered. Usage: python scripts/check-native-timber.py EXE [--record]
"""
import json, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from decomp import ROOT, native_cpu, configure_native_constants
exe=Path(sys.argv[1]);cpu,identity=native_cpu(exe);configure_native_constants(cpu,exe)
cpu.mem_map(0x2000000,0x40000)
p,tree,order,objects,record,stack,stop=0x2000000,0x2001000,0x2002000,0x2010000,0x2020000,0x203d000,0x203e000
rules=json.loads((ROOT/'app/original-rules.json').read_text());models=json.loads((ROOT/'app/original-models.json').read_text())
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
cpu.mem_write(objects,(exe.parent/'objects/objs0-2.dat').read_bytes());write(0x895ec1,'I',objects)
write(0x890390+4,'I',tree);write(0x938831+10,'B',0)
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*[x&0xffffffff for x in args]);cpu.reg_write(UC_X86_REG_ESP,stack)
 cpu.emu_start(a,stop,count=100000);assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
def hook(c,a,size,user):
 global alive,animation
 sp=c.reg_read(UC_X86_REG_ESP)
 if a==0x48a050:events.append(read(sp+8,'I'))
 elif a==0x4d4040:animation=read(sp+8,'H')
 elif a==0x4ef180:alive=False
 c.reg_write(UC_X86_REG_EAX,0);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x48a050,0x4d4040,0x4ef180,0x4ed8a0]:cpu.hook_add(UC_HOOK_CODE,hook,begin=a,end=a)
cases=[];expected=[]
for person in [2,3,5,7]:
 for model in [1,2,3,4,5,6,11]:
  for wood in [100,150,200,300,400] if model!=11 else [100]:
   for entering,remaining in [(True,0),(False,2),(False,1),(False,0),(False,-32768)]:
    for cargo in [0,50,100]:
     case=dict(person=person,model=model,wood=wood,cargo=cargo,entering=entering,remaining=remaining)
     cpu.mem_write(p,bytes(256));cpu.mem_write(tree,bytes(256));cpu.mem_write(order,bytes(32));cpu.mem_write(record,bytes(256))
     write(0x892443,'I',record);write(p+0x2a,'BB',1,person);write(p+0x2d,'B',3);write(p+0x2f,'b',-1)
     write(p+0xc,'I',0x40000000 if entering else 0);write(p+0x70,'h',remaining);write(p+0x72,'H',1);write(p+0x78,'h',cargo);write(p+0x8d,'H',1)
     write(tree+0x2a,'BB',5,model);write(tree+0x84,'h',wood);write(tree+0x33,'h',rules['sceneryObjects'][model]);write(tree+0x68,'i',12345)
     events=[];animation=None;alive=True;call(0x4340a0,p,order)
     cases.append(case);expected.append(dict(remaining=read(p+0x70,'h'),cargo=read(p+0x78,'h'),wood=read(tree+0x84,'h'),scale=read(tree+0x68,'i'),alive=alive,done=bool(cpu.reg_read(UC_X86_REG_EAX)&255),events=events,animation=animation))
js="""import {startTimberHarvest,stepTimberHarvest,timberTransfer,timberScale} from './app/timber.ts';
import rules from './app/original-rules.json' with {type:'json'};import models from './app/original-models.json' with {type:'json'};
let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map(c=>{
 const work=c.entering?startTimberHarvest(c.person,c.model):{remaining:c.remaining},done=stepTimberHarvest(work);
 const amount=done?timberTransfer(c.wood,c.cargo,rules.personWood[c.person],rules.personWood[c.person]):0;
 const wood=c.wood-amount,alive=!amount||wood>=100;
 return {remaining:work.remaining,cargo:c.cargo+amount,wood,scale:amount&&alive?timberScale(wood,rules.sceneryWood[c.model],models[rules.sceneryObjects[c.model]].scale):12345,alive,done,events:[...(c.entering?[1]:[]),...(!done&&c.model===11?[10]:[])],animation:c.entering?rules.personAnimationObjects[6*9+c.person]:null};
})));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=ROOT);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout)
for i,(a,e) in enumerate(zip(actual,expected)):assert a==e,(i,cases[i],a,e)
assert len(actual)==len(expected)
print(f'PASS: {len(cases)} complete native harvesting-phase calls with original timer, work-animation request, pickup cues, capacity-limited transfer, tree resizing and depletion')
if '--record' in sys.argv:
 selected=[i for i,c in enumerate(cases) if c['person']==2 and c['model'] in [1,6,11] and c['cargo'] in [0,100]]
 (ROOT/'tests/fixtures/timber.json').write_text(json.dumps(dict(executableSha256=identity['sha256'],cases=[cases[i] for i in selected],expected=[expected[i] for i in selected]),separators=(',',':'))+'\n')
