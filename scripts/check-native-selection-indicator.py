"""Run the native selection-arrow branch, including original sprite scaling.
Only final sprite submission is supplied. Usage: python check-native-selection.py EXE
"""
import json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_ECX
from decomp import native_cpu,ROOT
cpu,_=native_cpu(Path(sys.argv[1]));cpu.mem_map(0x2000000,0x100000)
stack,obj,bank,tribe=0x200e000,0x2010000,0x2020000,0x2030000
write=lambda a,f,*v:cpu.mem_write(a,struct.pack('<'+f,*v))
read=lambda a,f:struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
write(0x59df14,'I',bank);write(bank+53*8,'IHH',0,9,7)
# Same tribe pointer and sprite-scale inputs as the established projection oracle.
write(0x74a350,'I',tribe)
def submit(c,a,size,user):
 sp=c.reg_read(UC_X86_REG_ESP);x,y=read(sp+4,'i'),read(sp+8,'i')
 assert read(sp+12,'I')==bank+53*8
 w,h=(9,7) if a==0x5162e0 else (read(sp+16,'i'),read(sp+20,'i'))
 draws.append(dict(x=x,y=y,width=w,height=h));c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x5162e0,0x516430]:cpu.hook_add(UC_HOOK_CODE,submit,begin=a,end=a)
rng=random.Random(0x469415);views=json.loads((ROOT/'app/original-camera.json').read_text())['views'];cases=[];expected=[]
for n in range(1024):
 v=rng.choice(views);p=dict(owner=0 if n%4!=3 else 1,player=0,type=1 if n%7 else 2,selectionFlags=128 if n%3 else 0,x=rng.randint(-2000,2000),y=rng.randint(-2000,2000),frameHeight=rng.randrange(257),scaled=bool(n&1),bucket=rng.choice([-3584,-1792,-1,1,1792,3584]),flags=rng.choice([0,0x100,0x380]))
 write(stack+0x18,'iiii',p['x'],p['y'],obj,p['frameHeight']);write(stack+0x3c,'I',int(p['scaled']));write(obj+0x2a,'B',p['type']);write(obj+0x7a,'B',p['selectionFlags']);write(0x89c6f0,'b',p['player']);write(0x89bc86,'i',p['bucket']);write(tribe+0x2a,'i',v['scale']);write(0x87ca6c,'ii',v['spriteScale'],v['shamanScale']);write(0x89c669,'I',p['flags']);cpu.reg_write(UC_X86_REG_ECX,p['owner']);cpu.reg_write(UC_X86_REG_ESP,stack)
 draws=[];cpu.emu_start(0x469415,0x4694f2,count=4000);assert cpu.reg_read(UC_X86_REG_EIP)==0x4694f2
 cases.append([p,v]);expected.append(draws[0] if draws else None)
js="""import {selectionArrow} from './app/projection.ts';let s='';for await(const b of process.stdin)s+=b;console.log(JSON.stringify(JSON.parse(s).map(c=>selectionArrow(...c))));"""
actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(cases).encode(),cwd=ROOT))
assert actual==expected,next((i,a,e,cases[i]) for i,(a,e) in enumerate(zip(actual,expected)) if a!=e)
print('PASS: 1024 native selection-arrow decisions/rectangles, owner/class/flag gates, scaled and unscaled views; original scaling executes')
