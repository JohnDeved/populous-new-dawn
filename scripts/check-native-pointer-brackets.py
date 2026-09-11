"""Compare complete 0x475860 bracket geometry/palette and 0x4b0080 expiry.
Only terminal line submission is supplied; native AL/palette conversion executes.
Usage: python scripts/check-native-pointer-brackets.py EXE [--record]
"""
import hashlib,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP
from decomp import native_cpu,ROOT
cpu,identity=native_cpu(Path(sys.argv[1]));cpu.mem_map(0x2000000,0x10000)
p,stack,stop=0x2000000,0x200d000,0x200e000
write=lambda a,f,*v:cpu.mem_write(a,struct.pack('<'+f,*v))
read=lambda a,f:struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
palette=(Path(sys.argv[1]).parent/'data/pal0-c.dat').read_bytes()
alpha=(Path(sys.argv[1]).parent/'data/al0-c.dat').read_bytes()
cpu.mem_write(0x87f000,alpha);cpu.mem_write(0xd05528,palette)
cpu.mem_write(0x2001000,palette);write(0x87eff8,'I',0x2001000)
lines=[];rgba=0

def terminal(c,a,size,user):
 global rgba
 sp=c.reg_read(UC_X86_REG_ESP)
 lines.append(list(struct.unpack('<4i',c.mem_read(sp+4,16))))
 rgba=read(sp+20,'I')
 c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
cpu.hook_add(UC_HOOK_CODE,terminal,begin=0x516500,end=0x516500)
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack)
 cpu.emu_start(a,stop,count=100000);assert cpu.reg_read(UC_X86_REG_EIP)==stop
rng=random.Random(0x475860);cases=[]
for i in range(1024):
 bounds=dict(x=rng.randrange(-100,3500),y=rng.randrange(-100,1500),width=rng.randrange(8,180),height=rng.randrange(8,240))
 frame=i if i<1000 else 0xffffffff-(i-1000)
 active=i%5!=0;acknowledged=bool(i&1)
 write(p+0x24,'H',42);write(0x87cac2,'H',42 if active else 0);write(0x89bc20,'h',42 if acknowledged else 0)
 write(0x87cac4,'4h',*bounds.values());write(0x897981,'I',frame)
 lines.clear();rgba=0;call(0x475860,p)
 if active:assert rgba&0xffffff==0xe5dcd6,hex(rgba)
 cases.append(dict(bounds=bounds,frame=frame,active=active,acknowledged=acknowledged,expected=dict(opacity=(rgba>>24)/255,lines=list(lines)) if active else None))
js="""import {pointerBrackets} from './app/world-picking.ts';let s='';for await(const c of process.stdin)s+=c;
console.log(JSON.stringify(JSON.parse(s).map(c=>c.active?pointerBrackets(c.bounds,c.frame,c.acknowledged):null)));"""
actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(cases).encode(),cwd=ROOT))
for a,c in zip(actual,cases):assert a==c['expected'],(a,c)
write(0x89bc1e,'h',5);write(0x89bc20,'H',42);expiry=[]
for i in range(7):call(0x4b0080);expiry.append([read(0x89bc1e,'h'),read(0x89bc20,'H')])
assert expiry==[[4,42],[3,42],[2,42],[1,42],[0,0],[0,0],[0,0]]
if '--record' in sys.argv:
 (ROOT/'app/original-pointer.json').write_text(json.dumps(dict(executableSha256=identity['sha256'],paletteSha256=hashlib.sha256(palette).hexdigest(),alphaSha256=hashlib.sha256(alpha).hexdigest(),color=[229,220,214]),indent=2)+'\n')
 (ROOT/'tests/fixtures/pointer-brackets.json').write_text(json.dumps(dict(cases=cases[:48]+cases[-8:],expiry=expiry),separators=(',',':'))+'\n')
print('PASS: 1024 complete native corner-bracket draws, normal/click thickness, complete AL tint/opacity conversion, signed bounds and unsigned animation wrap; five frontend visits expire acknowledgement')
