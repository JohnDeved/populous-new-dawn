"""Execute 0x496750 phase 5 through the real wait, transfer and plan-stage update.
Only animation, motion release and building lifecycle consumers are supplied.
Resource search, arrival and the construction decision dispatcher are separate.
Usage: python scripts/check-native-timber-delivery.py EXE [--record]
"""
import json, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from decomp import ROOT, native_cpu, configure_native_constants, load_native_shapes
exe=Path(sys.argv[1]); cpu,identity=native_cpu(exe); configure_native_constants(cpu,exe)
cpu.mem_map(0x2000000,0x40000)
p,plan,b,stack,stop=0x2000000,0x2001000,0x2002000,0x203d000,0x203e000
load_native_shapes(cpu,exe,0x2010000,0x2014000)
rules=json.loads((ROOT/'app/original-rules.json').read_text())
def write(a,f,*v): cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f): return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def call():
 write(stack,'II',stop,p);cpu.reg_write(UC_X86_REG_ESP,stack)
 try: cpu.emu_start(0x496750,stop,count=100000)
 except Exception:
  print("failure",hex(cpu.reg_read(UC_X86_REG_EIP)));raise
 assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
 return cpu.reg_read(UC_X86_REG_EAX)&255

def hook(c,a,size,user):
 sp=c.reg_read(UC_X86_REG_ESP)
 if a==0x4d4040: animations.append(read(sp+8,'H'))
 elif a==0x403a00: events.append('move')
 elif a==0x4ed6f0: events.append('release')
 elif a==0x4ed640: events.append('init')
 c.reg_write(UC_X86_REG_EAX,0);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x4d4040,0x403a00,0x4ed6f0,0x4ed640]:cpu.hook_add(UC_HOOK_CODE,hook,begin=a,end=a)
write(0x890394,'I',plan);write(0x890398,'I',b)
cases=[];expected=[]
for model in [1,2,3,4,5,7]:
 for work in [0,100,rules['buildingLife'][model]-50,rules['buildingLife'][model]]:
  for cargo in [0,50,100,150]:
   for entering,timer in [(True,0),(False,8),(False,2),(False,1),(False,0),(False,-32768)]:
    capacity=rules['buildingLife'][model]
    stage=4 if work>=capacity else max(0,min(3,(work*4-1)//(capacity-1)))
    cpu.mem_write(p,bytes(256));cpu.mem_write(plan,bytes(256));cpu.mem_write(b,bytes(256))
    write(p+0x2a,'BB',1,2);write(p+0x2e,'B',1);write(p+0xa8,'B',5)
    write(p+0x76,'H',16 if entering else 0);write(p+0x70,'h',timer);write(p+0x78,'h',cargo);write(p+0x89,'H',1)
    write(plan+0x2a,'B',9);write(plan+0x92,'H',2);write(plan+0x96,'h',work);write(plan+0x9e,'B',model)
    write(plan+0xa0,'B',3);write(b+0x2a,'BBB',2,model,1);write(b+0x78,'B',stage);write(b+0xaf,'B',3)
    events=[];animations=[];result=call()
    cases.append(dict(model=model,work=work,cargo=cargo,entering=entering,timer=timer,stage=stage))
    expected.append(dict(timer=read(p+0x70,'h'),cargo=read(p+0x78,'h'),work=read(plan+0x96,'h'),stage=read(b+0x78,'B'),state=read(b+0x2c,'B'),attacker=read(plan+0xa0,'B'),result=result,events=events,animations=animations))
js="""import {stepTimberDelivery,timberTransfer} from './app/timber.ts';import {changeBuildingWork} from './app/building-damage.ts';import rules from './app/original-rules.json' with {type:'json'};
let input='';for await(const c of process.stdin)input+=c;console.log(JSON.stringify(JSON.parse(input).map(c=>{
 const wait={remaining:c.entering?8:c.timer},done=stepTimberDelivery(wait),amount=done?timberTransfer(c.cargo,c.work,rules.buildingLife[c.model],c.cargo):0;
 const plan={remaining:c.work,attacker:3},b={model:c.model,stage:c.stage,state:1,flags2:0,attacker:3},events=[];
 changeBuildingWork(plan,amount,b,null,{move:()=>events.push('move'),release:()=>events.push('release'),init:()=>events.push('init')});
 return {timer:wait.remaining,cargo:c.cargo-amount,work:plan.remaining,stage:b.stage,state:b.state,attacker:plan.attacker,result:done?2:0,events,animations:c.entering?[rules.personAnimationObjects[(c.cargo?4:0)*9+2]]:[]};
})));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=ROOT);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout);assert len(actual)==len(expected)
for c,a,e in zip(cases,actual,expected):assert a==e,(c,a,e)
if '--record' in sys.argv:
 indexes=[i for i,c in enumerate(cases) if c['model'] in [1,7] and c['cargo'] in [50,100]]
 (ROOT/'tests/fixtures/timber-delivery.json').write_text(json.dumps(dict(executableSha256=identity['sha256'],cases=[cases[i] for i in indexes],expected=[expected[i] for i in indexes]),separators=(',',':'))+'\n')
print(f'PASS: {len(cases)} complete native delivery-phase calls, eight-turn wait, carry/rest animation, capacity-limited transfer and real plan-stage/completion callbacks')
