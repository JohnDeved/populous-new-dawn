"""Bounded original shared-RNG composition: supplied bolt draws before one root visit."""
import json, struct, subprocess, sys
from pathlib import Path
sys.path.insert(0, str(Path.cwd() / 'scripts'))
from decomp import native_cpu
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP
cpu,identity=native_cpu(Path(sys.argv[1]));cpu.mem_map(0x2000000,0x10000)
ROOT,CHILD,STACK,STOP=0x2000000,0x2000100,0x200d000,0x200e000
write=lambda a,f,*v:cpu.mem_write(a,struct.pack('<'+f,*v))
read=lambda a,f:struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
spawned=False;lines=0

def hook(c,a,size,user):
 global spawned,lines
 sp=c.reg_read(UC_X86_REG_ESP)
 if a==0x516500:lines+=1
 if a==0x4edbd0:
  assert [read(sp+4,'B'),read(sp+8,'B')]==[7,75]
  spawned=True;c.reg_write(UC_X86_REG_EAX,CHILD)
 c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in (0x516500,0x4edbd0):cpu.hook_add(UC_HOOK_CODE,hook,begin=a,end=a)
def call(a,*args):
 write(STACK,'I'*(len(args)+1),STOP,*args);cpu.reg_write(UC_X86_REG_ESP,STACK)
 cpu.emu_start(a,STOP,count=1000000);assert cpu.reg_read(UC_X86_REG_EIP)==STOP
rows=[]
for draws in range(145):
 cpu.mem_write(ROOT,bytes(512));write(ROOT+0x2b,'B',74);write(ROOT+0x6c,'h',-1)
 write(0x89c655,'I',1);write(0x89bc72,'I',1);write(0x89d178,'I',0xaabbccdd)
 lines=0;spawned=False
 for i in range(draws):call(0x475350,100,100,128,100)
 before=read(0x89bc72,'I');call(0x50c260,ROOT)
 assert read(0x89d178,'I')==0xaabbccdd
 rows.append(dict(draws=draws,lines=lines,beforeRoot=before,afterRoot=read(0x89bc72,'I'),spawned=spawned))
js="""import {lightningLines} from './app/lightning.ts';import {random} from './app/native-math.ts';console.log(JSON.stringify(Array.from({length:145},(_,draws)=>{const r={randomState:1};let lines=0;for(let i=0;i<draws;i++)lines+=lightningLines(100,100,0,0,r).length-1;const beforeRoot=r.randomState;const spawned=(random(r)&31)<2;return {draws,lines,beforeRoot,afterRoot:r.randomState,spawned}})));"""
actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=Path.cwd()))
assert rows==actual,(rows,actual)
assert len({r['spawned'] for r in rows})==2
print(json.dumps(dict(status='passed',executableSha256=identity['sha256'],rows=rows,limits='Supplied draw counts and one eligible root visit; final raster and child allocator intercepted. This establishes shared native RNG, not original render/simulation scheduling or a complete browser scene.'),indent=2))
