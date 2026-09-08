"""Execute 0x524cf0's standard spell interface against browser sprite decisions.
Only target/readiness queries and final sprite submission are supplied.
Usage: python scripts/check-native-spell-cursor.py EXE
"""
import json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,ROOT
cpu,_=native_cpu(Path(sys.argv[1]));cpu.mem_map(0x2000000,0x100000)
stack,stop,points,hfx=0x200e000,0x2000100,0x2020000,0x2030000
write=lambda a,f,*v:cpu.mem_write(a,struct.pack('<'+f,*v))
read=lambda a,f:struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
write(0x59df10,'II',points,hfx)
def hook(c,a,size,user):
    sp=c.reg_read(UC_X86_REG_ESP)
    if a==0x5162e0:
        x,y,entry=[read(sp+i,'i') for i in [4,8,12]]
        bank=hfx if entry>=hfx else points
        assert (entry-bank)%8==0
        sprite=(entry-bank)//8
        draws.append(dict(id=sprite if bank==hfx else f'point{sprite}',x=x-mouse[0],y=y-mouse[1]))
    else:c.reg_write(UC_X86_REG_EAX,({0x4c24f0:p[2],0x4c28a0:p[3],0x44b060:0}[a])&0xffffffff)
    c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x5162e0,0x4c24f0,0x4c28a0,0x44b060]:cpu.hook_add(UC_HOOK_CODE,hook,begin=a,end=a)
rng=random.Random(0x524cf0);cases=[];expected=[]
for n in range(2048):
    p=[n%22,rng.randrange(2**32),rng.choice([-3,-2,-1,0,1]),rng.randrange(4),bool(rng.randrange(2)),rng.choice([0,32])]
    mouse=[rng.randrange(-1000,2000),rng.randrange(-1000,2000)]
    cpu.mem_write(stack-256,bytes(512));write(stack,'I',stop)
    write(0x984580,'ii',*mouse);write(0x89c6e7,'B',13);write(0x89ce81,'b',p[0])
    write(0x89d184,'I',p[1]);write(0x87cabc,'B',int(p[4]));write(0x89d17c,'I',p[5]);write(0x89c669,'I',0)
    write(0x98e909,'B',0);write(0x87cac0,'B',0);write(0x89c6f0,'b',0)
    cpu.reg_write(UC_X86_REG_ESP,stack);draws=[];cpu.emu_start(0x524cf0,stop,count=3000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop
    cases.append(p);expected.append(draws)
js="""import {spellCursor} from './app/spell-casting.ts';let s='';for await(const b of process.stdin)s+=b;console.log(JSON.stringify(JSON.parse(s).map(c=>spellCursor(...c))));"""
actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(cases).encode(),cwd=ROOT))
assert actual==expected,next((i,a,e,cases[i]) for i,(a,e) in enumerate(zip(actual,expected)) if a!=e)
print('PASS: 2048 native spell-cursor draws across all 22 records, readiness/target results, globe gate, alternate rules, four range-animation frames and signed screen positions')
